// This file contains:
//		PVizModel Classes for aggregate visualizations


// ================================================================================
// VizStackChart: Class to visualize 2 dimensions of record data as a stacked chart

var VizStackChart = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizStackChart

VizStackChart.prototype = Object.create(PVizModel.prototype);

VizStackChart.prototype.constructor = VizStackChart;

VizStackChart.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SLGND | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizStackChart.prototype.getFeatureAtts = function(tIndex)
{
	return this.settings.sAtt;
} // getFeatureAtts()

VizStackChart.prototype.setup = function()
{
	var innerH = this.settings.h;
	this.xScale = d3.scale.linear();
	this.yScale = d3.scale.linear().range([0, innerH-1]);

	this.rScale = d3.scale.ordinal();
	this.xAxis = d3.svg.axis().scale(this.rScale).orient("top");
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(10);

	this.svg = d3.select(this.frameID).append("svg");

	this.chart = this.svg.append("g");
	this.chart.attr("class", "chart")
			.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")");

	this.svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")");
	this.svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")");
} // setup()

VizStackChart.prototype.render = function(stream)
{
	var self = this;

	function clickEvent(d, bI)
	{
		var sz = self.bSel.length;
		var i = _.sortedIndex(self.bSel, bI);
		if (self.bSel[i] === bI) {
			d3.select(this).classed('obj-sel', false);
			self.bSel.splice(i, 1);
			if (sz > 0 && self.bSel.length == 0)
				self.vFrame.selBtns(false);
		} else {
			d3.select(this).classed('obj-sel', true);
			self.bSel.splice(i, 0, bI);
			if (sz == 0 && self.bSel.length > 0)
				self.vFrame.selBtns(true);
		}
	} // clickEvent()

	this.bSel=[];		// Reset selection

	var oAttID = this.settings.oAtt;
	var oAtt = PData.aByID(oAttID);
	var sAttID = this.settings.sAtt;

		// Pass 1 -- sort all Records into categories on X-Axis by oAtt
	if (oAtt.def.t !== 'g') {
		if (this.settings.gr)
			this.cats = PData.cRNew(oAtt, true, true);
		else
			this.cats = PData.cLNew(oAtt, null, true);
	} else {
		this.cats = [];
	}
	PData.cFill(this.cats, oAttID, sAttID, stream, null);

	var colW=0;
	this.cats.forEach(function(c) {
		colW=Math.max(colW, c.l.length);
	});
	colW=Math.max(D3FG_BAR_WIDTH, (colW*8)+4);
	this.colW = colW;

	var innerW = this.cats.length*colW;
	var innerH = this.settings.h;
	this.xScale.domain([0, this.cats.length]).rangeRound([0, innerW]);

	this.rScale.rangeRoundBands([0, innerW]);
	this.rScale.domain(this.cats.map(function(rc) { return rc.l; }));

	this.svg
		.attr("width", innerW+D3SC_MARGINS.left+D3SC_MARGINS.right)
		.attr("height", innerH+D3SC_MARGINS.top+D3SC_MARGINS.bottom);

	this.svg.selectAll(".block").remove();

	this.blocks=[];		// { x[rCat index], c[olor], y, h, a[Indices] }
	var sAtt = PData.aByID(sAttID);
	var maxY=0, rec;
	var fSet = self.vFrame.getSelFeatAtts(0);
	var yCats = PData.cLNew(sAtt, fSet, true);
		// Pass 2 -- create Blocks by processing Records within a single Range Category by sAtt
	for (var rI=0; rI<this.cats.length; rI++) {
		if (rI > 0) { // clear previous entries
			for (var yi=0; yi<yCats.length; yi++) {
				yCats[yi].i = [];
			}
		}
		PData.cSort(self.cats[rI].i, sAtt, yCats);

			// Create Blocks entries from yCats
		var y=0;
		yCats.forEach(function(yCat) {
			if (yCat.i.length > 0) {
				self.blocks.push({ x: rI, c: yCat.c, y: y, h: yCat.i.length, a: yCat.i });
				y += yCat.i.length;
			}
		});
		maxY = Math.max(maxY, y);
	}

		// Now that we have max Y value, reset yScale domain max
	self.yScale.domain([0,maxY]);
	self.svg.select(".x.axis").call(self.xAxis);
	self.svg.select(".y.axis").call(self.yAxis);

	var bw = self.colW-7;

	this.svg.selectAll(".block")
			.data(self.blocks)
			.enter().append("rect")
			.attr("class", "block")
			.attr("x", function(d) { return D3SC_MARGINS.left+5+self.xScale(d.x); })
			.attr("y", function(d) { return self.yScale(d.y) + D3SC_MARGINS.top; })
			.attr("fill", function(d) { return d.c; })
			.attr("height", function(d) { return Math.max(1,self.yScale(d.h)-1); })
			.attr("width", bw)
			.on("click", clickEvent);
} // render()

VizStackChart.prototype.setSel = function(absIArray)
{	// Does nothing
} // setSel()

VizStackChart.prototype.clearSel = function()
{
	if (this.bSel.length > 0) {
		this.bSel = [];
		this.svg.selectAll(".block")
			.classed('obj-sel', false);
	}
} // clearSel()

	// RETURNS: Array of absolute IDs of selected records
VizStackChart.prototype.getSel = function()
{
	var self=this;
	var u=[];

	this.bSel.forEach(function(bI) {
		u = PData.union(u, self.blocks[bI].a);
	});

	return u;
} // getSel()

VizStackChart.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizStackChart.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizStackChart.prototype.hint = function()
{
	var h=dlText.xaxis+': ';
	var att = PData.aByID(this.settings.oAtt);
	h += att.def.l+', '+dlText.yaxis+': ';
	att = PData.aByID(this.settings.sAtt);
	h += att.def.l;
	return h;
} // hint()


// ================================================================================
// VizFlow: Class to visualize multiple Facet values of record data as parallel sets

var VizFlow = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizFlow

VizFlow.prototype = Object.create(PVizModel.prototype);

VizFlow.prototype.constructor = VizFlow;

VizFlow.prototype.flags = function()
{
	return V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizFlow.prototype.setup = function()
{
	var self=this;

		// Compute the height of each inter-Attribute space
	self.bH = Math.max(120, Math.ceil(this.settings.w/3));

		// Height: Attribute Title + Attribute value titles + flow space
	var h = 40 + ((this.settings.fcts.length-1) * self.bH);
	this.svg = d3.select(this.frameID).append("svg")
				.attr("width", this.settings.w+10)
				.attr("height", h);
	this.barG = this.svg.append("g");
	this.flowG = this.svg.append("g");
	this.titleG = this.svg.append("g");
} // setup()

VizFlow.prototype.render = function(stream)
{
	var self=this;

	function clickBar(d, bI)
	{
		var sz = self.bSel.length;
		var i = _.sortedIndex(self.bSel, bI);
		if (self.bSel[i] === bI) {
			d3.select(this).classed('obj-sel', false);
			self.bSel.splice(i, 1);
			if (sz > 0 && self.bSel.length === 0 && self.fSel.length === 0)
				self.vFrame.selBtns(false);
		} else {
			d3.select(this).classed('obj-sel', true);
			self.bSel.splice(i, 0, bI);
			if (sz === 0 && self.fSel.length === 0 && self.bSel.length > 0)
				self.vFrame.selBtns(true);
		}
	} // clickBar()

	function clickFlow(d, fI)
	{
		var sz = self.fSel.length;
		var i = _.sortedIndex(self.fSel, fI);
		if (self.fSel[i] === fI) {
			d3.select(this).classed('obj-sel', false);
			self.fSel.splice(i, 1);
			if (sz > 0 && self.fSel.length === 0 && self.bSel.length === 0)
				self.vFrame.selBtns(false);
		} else {
			d3.select(this).classed('obj-sel', true);
			self.fSel.splice(i, 0, fI);
			if (sz === 0 && self.bSel.length === 0 && self.fSel.length > 0)
				self.vFrame.selBtns(true);
		}
	} // clickFlow()

	this.bSel=[];		// Reset selection
	this.fSel=[];

		// Remove everything on svg
	this.barG.selectAll(".bar").remove();
	this.flowG.selectAll(".flow").remove();
	this.titleG.selectAll(".att-title").remove();

		// Create category buckets for each Attribute
	var w=this.settings.w;
	self.bars=[];
	self.atts=[];
	self.settings.fcts.forEach(function(attID, aI) {
		var tCat;
		var att = PData.aByID(attID);
		if (att.def.t !== 'g') {
			if (self.settings.gr)
				tCat = PData.cRNew(att, true, true);
			else
				tCat = PData.cLNew(att, null, true);
			PData.cFill(tCat, attID, null, stream, null);
		} else {
			tCat=[];
			PData.cFill(tCat, attID, null, stream, null);
		}
			// Compile used categories
		var used=[];
		var total=0;
		tCat.forEach(function(c) {
			if (c.i.length > 0) {
				used.push(c);
				total += c.i.length;
			}
		});
			// Create bars for category values
		var x=0;
		var y = 31+aI*self.bH;
		used.forEach(function(c) {
			self.bars.push({ x: 5+((x*w)/total), w: (c.i.length*w)/total, y: y, c: c });
			x += c.i.length;
		});
		self.atts.push({ l: att.def.l, c: used, t: total, y: y });
	});

		// Show bars
	var bar = this.barG.selectAll(".bar")
		.data(self.bars)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return d.x; })
		.attr("y", function(d) { return d.y; })
		.attr("fill", function(d) { return d.c.c; })
		.attr("height", "8")
		.attr("width", function(d) { return d.w; })
		.on("click", clickBar)
		.append("title")
		.text(function(d) {
			return d.c.l + " ("+d.c.i.length+")";
		});

		// Compute intersections and create flows
	self.ints=[];		// { a1 [index of Attribute 1], i[ndices], c1 [index of Att1 category], c2 [index of Att2 category] }

		// NOTE: The following algorithm only works if every Attribute has only a single value
		//			Prospect enables multiple values, however, for Fixed Vocabulary
	// self.atts.forEach(function(att, aI) {
	// 	if (aI != self.atts.length-1) {
	// 		var att2 = self.atts[aI+1];
	// 		var f = new Array(att2.c.length);	// maintain # used in c2's categories
	// 		for (var j=0; j<att2.c.length; j++)
	// 			f[j]=0;
	// 		var l1=0, lB1;						// "Left" starting positions on each bar
	// 		att.c.forEach(function(c1, c1I) {
	// 			var l2=0;
	// 			lB1=0;
	// 			att2.c.forEach(function(c2, c2I) {
	// 				var i = PData.intersect(c1.i, c2.i);
	// 				if (i.length > 0) {
	// 					self.ints.push({ i: i, c: c1.c, l: c1.l+" > "+c2.l,
	// 						x1: 5+(((l1+lB1)*w)/att.t), x2: 5+(((l2+f[c2I])*w)/att2.t),
	// 						w1: (i.length*w)/att.t, w2: (i.length*w)/att2.t,
	// 						y1: att.y+10, y2: att2.y-1 });
	// 					lB1 += i.length;
	// 					f[c2I] += i.length;
	// 				}
	// 				l2 += c2.i.length;
	// 			});
	// 			l1 += c1.i.length;
	// 		});
	// 	}
	// });

		// NOTE: The following algorithm handles the case of multiple Attribute values
		//			It attempts to float flows on bars according to leftover space and order
	self.atts.forEach(function(att, aI) {
		if (aI !== self.atts.length-1) {
			var att2 = self.atts[aI+1];

				// Create 2-dim array (att1 x att2) to hold intersections
			var i2 = new Array(att.c.length);
			for (var x=0; x<att.c.length; x++) {
				i2[x] = new Array(att2.c.length);
			}
				// First pass: Collect all intersections between a1 and a2
			att.c.forEach(function(c1, c1I) {
				att2.c.forEach(function(c2, c2I) {
					i2[c1I][c2I] = PData.intersect(c1.i, c2.i);
				});
			});
				// Second pass: Total number of intersection sets on bottom row
			var bS = new Array(att2.c.length);
			for (var y=0; y<att2.c.length; y++) {
				var t=0;
				for (var x=0; x<att.c.length; x++)
					if (i2[x][y].length > 0)
						t++;
				bS[y]=t-1;
			}

				// Create counter for bottom row
			var bC = new Array(att2.c.length);
			for (var y=0; y<att2.c.length; y++)
				bC[y]=0;

				// Third pass: Allocate variable spaced positions
			var l1=0;
			att.c.forEach(function(c1, c1I) {
				var c1Ints = 0;				// how many non-empty sets for c1?
				for (var y=0; y<att2.c.length; y++)
					if (i2[c1I][y].length > 0)
						c1Ints++;
				c1Ints -= 1;
				var c1W = (c1.i.length*w)/att.t;	// # pixels in c1 bar

				var bI=0;
				var l2=0;
				att2.c.forEach(function(c2, c2I) {
					var i = i2[c1I][c2I];
					if (i.length > 0) {
						var w0=i.length*w;
						var w1=w0/att.t;
						var w2=w0/att2.t;
						var c2W = (c2.i.length*w)/att2.t;
						// var c2G = c2W/bS[c2I];	// c2 bar pixel gap size
						var s1 = c1Ints ? ((c1W-w1)*bI)/c1Ints : 0;
						var s2 = bS[c2I] ? ((c2W-w2)*bC[c2I])/bS[c2I] : 0;
						self.ints.push({ i: i, c: c1.c, l: c1.l+" > "+c2.l,
							x1: 5+((l1*w)/att.t) + s1,
							x2: 5+((l2*w)/att2.t)+ s2,
							w1: w1, w2: w2, y1: att.y+10, y2: att2.y-1
						});
						bI++;
						bC[c2I]++;
					}
					l2+= c2.i.length;
				});
				l1+= c1.i.length;
			});
		} // if aI not last
	});

	var flow = this.flowG.selectAll(".flow")
		.data(self.ints)
		.enter().append("path")
		.attr("class", "flow")
		.attr("d", function(d) { return "M "+d.x1+" "+d.y1+" "+" L "+(d.x1+d.w1)+" "+d.y1+" L "+(d.x2+d.w2)+
									" "+d.y2+" L "+d.x2+" "+d.y2+" L "+d.x1+" "+d.y1; })
		.attr("fill", function(d) { return d.c; })
		.on("click", clickFlow)
		.on("mouseover",function() {
			d3.select(this).classed("active", true);
				// Put at end of render list to ensure it is on top of others
			this.parentElement.appendChild(this);
		})
		.on("mouseout",function() {
			d3.select(this).classed("active", false);
		})
		.append("title")
		.text(function(d) {
			return d.l + " ("+d.i.length+")";
		});

		// Create titles for Attributes and values
	var title = this.titleG.selectAll(".att-title")
		.data(self.atts)
		.enter()
		.append("text")
		.attr("class", "att-title")
		.attr("x", "5")
		.attr("y", function(d) { return d.y-8; })
		.text(function (d) {
			return d.l;
		});
} // render()

VizFlow.prototype.setSel = function(absIArray)
{	// Does nothing
} // setSel()

VizFlow.prototype.clearSel = function()
{
	if (this.bSel.length > 0) {
		this.bSel = [];
		this.svg.selectAll(".bar").classed('obj-sel', false);
	}
	if (this.fSel.length > 0) {
		this.fSel = [];
		this.svg.selectAll(".flow").classed('obj-sel', false);
	}
} // clearSel()

	// RETURNS: Array of absolute IDs of selected records
VizFlow.prototype.getSel = function()
{
	var self=this;
	var u=[];

	this.bSel.forEach(function(bI) {
		u = PData.union(u, self.bars[bI].c.i);
	});
	this.fSel.forEach(function(fI) {
		u = PData.union(u, self.ints[fI].i);
	});
	return u;
} // getSel()


// ================================================================================
// VizBrowser: Class to visualize multiple Facet values of record data as parallel sets

var VizBrowser = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);

	this.stream=null;
} // VizBrowser

VizBrowser.prototype = Object.create(PVizModel.prototype);

VizBrowser.prototype.constructor = VizBrowser;

VizBrowser.prototype.flags = function()
{
	return V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizBrowser.prototype.setup = function()
{
		// 5 pix each side
	var w = this.settings.fcts.length*250;

		// Height: Attribute Title + Attribute value titles + flow space
	this.svg = d3.select(this.frameID).append("svg")
				.attr("width", w);

		// Var for holding Perspective data until render
	this.pState = null;
} // setup()

	// PURPOSE: Recompute intersection of selected Records
VizBrowser.prototype.update = function()
{
	var self=this;
	var vI = this.vFrame.getIndex();

	PState.set(PSTATE_UPDATE);
		// Start intersect array afresh
	var ia = null, fi, chosen=false;
	this.fcts.forEach(function(theF) {
		if (theF.s != -1) {
			chosen = true;
			fi = theF.c[theF.s].i;
			if (!ia) {
				ia = fi;
			} else {
				ia = PData.intersect(ia, fi);
			}
		}
	});
	if (chosen) {
			// Make sure result is not empty!
		this.vFrame.selBtns(ia.length > 0);
	} else {
		this.vFrame.selBtns(false);
		ia=this.stream.s;
	}
	this.recSel=ia;

		// Now update bars
	this.fcts.forEach(function(theF) {
		var fID = "#facet-"+vI+"-"+theF.i;
		var fSel = self.svg.select(fID).selectAll(".facet-val-bar");
		fSel.data(theF.c)
			.transition()
			.attr("width", function(d) {
				if (ia.length > 0) {
					var x=PData.intersect(ia, d.i);
					return (x.length*242)/ia.length;
				} else {
					return 0;
				}
			});
	});
	PState.set(PSTATE_READY);
} // update

VizBrowser.prototype.render = function(stream)
{
	var self=this;
	var vI = this.vFrame.getIndex();

	this.recSel=[];
	this.stream=stream;

		// Remove everything on svg -- facet-col entries are roots
	this.svg.selectAll(".facet-col").remove();

	var maxY=0;

		// Create data about facets
	this.fcts=[];
		// Create individual bars for each category item
	this.settings.fcts.forEach(function(attID, aI) {
		var cat;
		var att = PData.aByID(attID);
		if (att.def.t === 'g') {
			cat=[];
			PData.cFill(cat, attID, null, stream, null);
		} else {
			if (self.settings.gr)
				cat = PData.cRNew(att, true, true);
			else
				cat = PData.cLNew(att, null, true);
			PData.cFill(cat, attID, null, stream, null);
		}
			// Compile used categories
		var used=[];
		var n=0;
		cat.forEach(function(c) {
			if (c.i.length > 0) {
				c.n = n++;			// Need to add index field
				used.push(c);
			}
		});
		self.fcts.push({ c: used, x: aI*250, i: aI, l: att.def.l, n: att.id, s: -1 });

		maxY = Math.max(maxY, 27+((used.length+1)*22));
	});

	self.svg.attr("height", maxY);

		// Now create populate Facet Frames with data about facets
	var cols = self.svg.selectAll(".facet-col")
		.data(self.fcts)
		.enter()
			// Facet Label Grouping
		.append("g")
		.attr("transform", function(d) { return "translate(" + d.x +  ", 0)"; } )
		.attr("class", "facet-col" )
		.attr("id", function(d) { return "facet-"+vI+"-"+d.i; } );

			// Create background color label
	cols.append("rect")
		.attr("class", "facet-lbl" )
		.attr("height", 24)
		.attr("width", 242);

			// Create label text
	cols.append("text")
		.attr("class", "facet-lbl-txt")
		.attr("x", 3)
		.attr("y", 18)
		.attr("text-anchor", "start")
		.text(function(d) { return d.l; });

	var facetSel;

		// Now create labels for specific values, column by column
	self.fcts.forEach(function(theF) {
		var fID = "#facet-"+vI+"-"+theF.i;
		var pp=null, sI;

			// If there is a saved state to restore, see if there is entry for this facet
		if (self.pState != null) {
			self.pState.p.find(function(p) {
				if (theF.n === p.f) {
					if ((sI = theF.c.findIndex(function(c) { return p.v === c.l; })) !== -1) {
						theF.s = sI;
						pp = p;
					}
					return true;
				} else {
					return false;
				}
			});
		}

			// Need dummy data to bind to RESET buttons
		var resetDummy=[1];
			// Create each column's RESET button
		facetSel = self.svg.select(fID).selectAll(".facet-reset")
			.data(resetDummy)
			.enter()
			.append("g")
				// RESET button initially starts out inactive
			.attr("transform", "translate(0,26)")
			.attr("class", function(d) {
				if (pp) {
					return "facet-reset";
				} else {
					return "facet-reset inactive";
				}
			})
			.attr("height", 19)
			.on("click", function(d) {
				var rThis = this;
				if (theF.s !== -1) {
					theF.s = -1;
						// Make all buttons in this column active
					var btnSel = self.svg.select(fID).selectAll(".facet-val")
						.classed('inactive', false);
						// Make RESET button inactive
					d3.select(rThis).classed('inactive', true);
					self.update();
				}
			});
		facetSel
			.append("rect")
			.attr("class", "facet-reset-btn")
			.attr("height", 19)
			.attr("width", 242);
		facetSel
			.append("text")
			.attr("class", "facet-reset-txt")
			.attr("x", 3)
			.attr("y", 13)
			.text(dlText.reset);

				// Create button for each facet value
		facetSel = self.svg.select(fID).selectAll(".facet-val")
			.data(theF.c)
			.enter()
			.append("g")
				// Must move down one for RESET button
			.attr("transform", function(d, i) { return "translate(0," + (27+((i+1)*22)) +  ")"; } )
			.attr("class", function(d, i) {
				if (pp) {
					if (i === sI) {
						return "facet-val";
					} else {
						return "facet-val inactive";
					}
				} else {
					return "facet-val";
				}
			})
			.on("click", function(d, i) {
						// Make all buttons in this column inactive, but this one
				var resetSel = self.svg.select(fID).select(".facet-reset");
				if (theF.s !== i) {
					theF.s = i;
					var btnSel = self.svg.select(fID).selectAll(".facet-val")
							.classed('inactive', function(f) { return i !== f.n } );
					resetSel.classed('inactive', false);
				} else {
						// Reset facet selection if click on the currently selected facet
					self.svg.select(fID).selectAll(".facet-val").classed('inactive', false);
					theF.s = -1;
					resetSel.classed('inactive', true);
				}
					// Update all values
				self.update();
			});

		facetSel
			.append("rect")
			.attr("class", "facet-val-btn")
			.attr("height", 21)
			.attr("width", 242);

			// Create percentage bar (initial width)
		facetSel
			.append("rect")
			.attr("class", "facet-val-bar")
			.attr("height", 21)
			.attr("width", function(d) {
				if (stream.l > 0) {
					return (d.i.length*242)/stream.l;
				} else {
					return 0;
				}
			} );

			// Create label text
		facetSel
			.append("text")
			.attr("class", "facet-val-txt")
			.attr("x", 3)
			.attr("y", 16)
			.text(function(d) {
				return d.l;
			});

			// Create text with number of items
		facetSel
			.append("text")
			.attr("class", "facet-val-num")
			.attr("x", 239)
			.attr("y", 16)
			.text(function(d) { return d.i.length; });
	});

	if (this.pState != null) {
		this.update();
		this.pState = null;
	}
} // render()

VizBrowser.prototype.setSel = function(absIArray)
{	// Does nothing
} // setSel()

VizBrowser.prototype.clearSel = function()
{
	var self=this;
	var vI = this.vFrame.getIndex();
	this.fcts.forEach(function(theF) {
		theF.s = -1;
		var fID = "#facet-"+vI+"-"+theF.i;
		self.svg.select(fID).select(".facet-reset").classed('inactive', true);
		self.svg.select(fID).selectAll(".facet-val").classed('inactive', false);
	});
	this.update();
} // clearSel()

	// RETURNS: Array of absolute IDs of selected records
VizBrowser.prototype.getSel = function()
{
	return this.recSel;
} // getSel()

VizBrowser.prototype.getState = function()
{
	var pairs=[];

	this.fcts.forEach(function(theF) {
		if (theF.s !== -1) {
			var c = theF.c[theF.s];
				// Save pairs of Facet IDs and value labels
			pairs.push({ f: theF.n, v: c.l });
		}
	});

	return { p: pairs };
} // getState()

VizBrowser.prototype.setState = function(state)
{
		// Save data until render done, load then
	this.pState = state;
} // setState()


// ===============================================================================================
// VizMBMap: Class to create TreeMap for primary facet dimension of data; bar graphs for secondary

var VizMBMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizMBMap

VizMBMap.prototype = Object.create(PVizModel.prototype);

VizMBMap.prototype.constructor = VizMBMap;

VizMBMap.prototype.flags = function()
{
	return V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizMBMap.prototype.setup = function()
{
	var self=this;

	function clickReset()
	{
		if (self.bkSel)
			self.bkSel.s = false;
		self.clearSel();
	}
		// Height: Margins (10) + select space (30) + Attribute bars (title + graphic)
	var h = this.settings.h + 40 + (this.settings.fcts.length * 30);
	this.svg = d3.select(this.frameID).append("svg")
				.attr("width", this.settings.w+10)
				.attr("height", h);

		// Area for information about selected item
	this.infoG = this.svg.append("g");
	this.infoG.attr("transform", "translate(5," + (3+this.settings.h) + ")");

		// Area for attributes
	this.attsG = this.svg.append("g");
	this.attsG.attr("transform", "translate(5," + (40+this.settings.h) + ")");

		// RESET button
	this.infoG.append("rect")
		.attr("class", "mbm-reset")
		.attr("x", "0")
		.attr("y", "8")
		.attr("width", "60")
		.attr("height", "20")
		.attr("rx", "4")
		.attr("ry", "4")
		.on("click", clickReset);
	this.infoG.append("text")
		.attr("class", "mbm-reset-text")
		.attr("x", "30")
		.attr("y", "23")
		.text(dlText.reset)
		.on("click", clickReset);
} // setup()

	// PURPOSE: Return Attribute bars to default distribution
VizMBMap.prototype.resetAttBars = function()
{
	this.attsG.selectAll(".bar").transition()
		.attr("x", function(d) { return d.x0; })
		.attr("width", function(d) { return d.w0; });
} // resetAttBars()

	// PURPOSE: Return Attribute bars to default distribution
VizMBMap.prototype.refreshTitles = function()
{
	this.svg.selectAll(".mbm-title")
		.attr('class', function(d) { return d.s ? "mbm-title obj-sel" : "mbm-title"; });
} // resetAttBars()

	// PURPOSE: Create or update MultiMlockMap tree
VizMBMap.prototype.renderTree = function(aI)
{
	var self=this;

		// PURPOSE: Recalculate width of bars according to current selection
	function recalcBars()
	{
		var bI=0;
		var w=self.settings.w;

		var src = self.sbkSel !== null ? self.sbkSel.i : self.bkSel.i;

		PState.set(PSTATE_UPDATE);
		self.fcts.forEach(function(thisF, fI) {
			var newIs=[];
			var total=0;
				// First pass: calculate intersections
			thisF.c.forEach(function(thisC) {
				var newI = PData.intersect(src, thisC.i);
				newIs.push(newI);
				total += newI.length;
			});
				// Second pass: compute x, width
			var x=0;
			var theBar;
			newIs.forEach(function(newI) {
				theBar = self.bars[bI++];
				theBar.x = total ? (x*w)/total : 0;
				theBar.w = total ? (newI.length*w)/total : 0;
				x += newI.length;
			});
		});

		self.attsG.selectAll(".bar").transition()
			.attr("x", function(d) { return d.x; })
			.attr("width", function(d) { return d.w; });
		PState.set(PSTATE_READY);
	} // recalcBars()

	function clickTitle(d)
	{
		if (self.bkSel === d) {
				// Deselect this item (same as "RESET")
			self.clearSel();
		} else {
				// Deselect others
			self.svg.selectAll('.mbm-cell').classed('obj-sel', false);
			if (self.bkSel)
				self.bkSel.s = false;

			d.s = true;
			self.bkSel = d;
			self.sbkSel = null;
			self.refreshTitles();
			self.infoG.select(".mbm-select").remove();
			self.infoG.append("text")
				.attr("class", "mbm-select")
				.attr("x", "70")
				.attr("y", "23")
				.text(d.l+" ("+d.i.length+")");
			recalcBars();
			self.vFrame.selBtns(true);
		}
	} // clickTitle()

	function clickBlock(d)
	{
		if (d.depth === 2) {
				// Child sublock
			if (self.sbkSel === d) {
					// Deselect this item (same as "RESET")
				self.clearSel();
			} else {
					// Deselect others
				self.svg.selectAll('.mbm-cell').classed('obj-sel', false);
				if (self.bkSel)
					self.bkSel.s = false;

				self.sbkSel = d;
				d3.select(this).classed('obj-sel', true);
				self.infoG.select(".mbm-select").remove();
				self.infoG.append("text")
					.attr("class", "mbm-select")
					.attr("x", "70")
					.attr("y", "23")
					.text(d.l);

					// Select parent title
				d.p.s = true;
				self.bkSel = d.p;
				self.refreshTitles();
				recalcBars();
				self.vFrame.selBtns(true);
			}

		} else {
				// Parent block
			// Not needed, as either title or subblock selected
		}
	} // clickBlock()

	this.svg.selectAll(".mbm-g").remove();

		// New Treemap from selection
	var nodes = this.treemaps[aI];

	var cell = this.svg.selectAll(".mbm-g")
		.data(nodes, function(d) { return d.id; });

		// New blocks
	var add = cell.enter()
		.append("g")
		.attr("class", "mbm-g")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	add.append("rect")
		.attr("class", "mbm-cell")
		.attr("width", function(d) { return d.dx-1; })
		// .attr("width", "0")
		.attr("height", function(d) { return d.dy-1; })
		.attr("rx", "3")
		.attr("ry", "3")
		.style("fill", function(d) { return d.depth === 2 ? d.c : '#888888'; })
		.on("click", clickBlock)
		.append("title")
		.text(function(d) { return d.l; });

	add.filter(function(d) { return d.depth === 1; })
		.append("text")
		.attr("class", "mbm-title")
		.attr("x", "3")
		.attr("y", "11")
		.text(function (d) { return d.l; })
		.on("click", clickTitle);
} // renderTree()

VizMBMap.prototype.render = function(stream)
{
	var self=this;

	function clickAtt(d, bI)
	{
		if (self.attSel != bI) {
			PState.set(PSTATE_UPDATE);
			self.attsG.selectAll(".mbm-att-title").classed('obj-sel', false);

			self.clearSel();
			self.resetAttBars();
			self.renderTree(bI);

			d3.select(this).classed('obj-sel', true);
			self.attSel = bI;
			PState.set(PSTATE_READY);
		}
	} // clickAtt()

	this.bkSel=null;		// Empty Block selection -- obj pointer or null
	this.sbkSel=null;		// Empty Sub-Block selection -- obj pointer or null
	this.attSel=0;			// First Attribute is default selection

	var w=this.settings.w;

		// Remove everything on svg
	this.attsG.selectAll(".bar").remove();
	this.attsG.selectAll(".mbm-att-title").remove();
	this.infoG.select(".mbm-select").remove();

		// Initialize 2ndary Attribute Facet data and corresponding bars
	this.fcts=[];
	this.bars=[];
	this.settings.fcts.forEach(function(attID, aI) {
		var tCat;
		var att = PData.aByID(attID);
		var y=aI * 30;
		if (att.def.t !== 'g') {
			if (self.settings.gr)
				tCat = PData.cRNew(att, true, true);
			else
				tCat = PData.cLNew(att, null, true);
			PData.cFill(tCat, attID, null, stream, null);
		} else {
			tCat=[];
			PData.cFill(tCat, attID, null, stream, null);
		}

			// Compile used categories
		var used=[];
		var total=0;
		tCat.forEach(function(c) {
			if (c.i.length > 0) {
				used.push(c);
				total += c.i.length;
			}
		});
			// Create bars for category values
		var x=0;
		used.forEach(function(c) {
			self.bars.push({ x0: ((x*w)/total), w0: (c.i.length*w)/total, x:0, w:0, y: y+18, c: c });
			x += c.i.length;
		});

			// Save data about facets
		self.fcts.push({ i: aI, l: att.def.l, y: y+14, c: used });
	});

		// Show Attribute facet labels
	var facet = this.attsG.selectAll(".mbm-att-title")
		.data(self.fcts)
		.enter()
		.append("text")
		.attr("class", function(d,i) { return i === 0 ? "mbm-att-title obj-sel" : "mbm-att-title" })
		.attr("x", "0")
		.attr("y", function(d) { return d.y; })
		.text(function (d) { return d.l; })
		.on("click", clickAtt);

		// Show facet bars
	var bar = this.attsG.selectAll(".bar")
		.data(self.bars)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return d.x0; })
		.attr("y", function(d) { return d.y; })
		.attr("fill", function(d) { return d.c.c; })
		.attr("height", "8")
		.attr("width", function(d) { return d.w0; })
		.append("title")
		.text(function(d) { return d.c.l; });

		// Create Category array from primary dimension Facet
	var pAttID = this.settings.p;
	var pAtt = PData.aByID(pAttID);
	var pCat;
	if (pAtt.def.t !== 'g') {
		if (self.settings.gr)
			pCat = PData.cRNew(pAtt, true, true);
		else
			pCat = PData.cLNew(pAtt, null, true);
		PData.cFill(pCat, pAttID, null, stream, null);
	} else {
		pCat=[];
		PData.cFill(pCat, pAttID, null, stream, null);
	}

	var vI = this.vFrame.getIndex();

		// Create BlockMap Tree from primary and 2ndary Attributes
		// Each entry has elements i[absolute indices], z[children]
	self.trees = [];
	self.fcts.forEach(function(thisF, fI) {
		var thisTree = { z: [], id: vI+'.'+fI };
		pCat.forEach(function(p1Cat, pI) {
			if (p1Cat.i.length > 0) {
				var z2 = [];
				var pNode = { i: p1Cat.i, l: p1Cat.l, s: false, z: z2, id: vI+'.'+fI+'.'+pI };
				thisF.c.forEach(function(d2Cat, aI) {
					var i2=[];
					i2 = PData.intersect(p1Cat.i, d2Cat.i);
					if (i2.length > 0)
						z2.push({ i: i2, p: pNode, c: d2Cat.c, l: p1Cat.l+' + '+d2Cat.l+' ('+i2.length+')', id: vI+'.'+fI+'.'+pI+'.'+aI });
				});
				thisTree.z.push(pNode);
			}
		});
		self.trees.push(thisTree);
	});

	var tm = d3.layout.treemap()
			.padding([14, 3, 3, 3])
			.size([w, this.settings.h])
			.round(true)
			.children(function(d, depth) {
				return (depth === 2) ? null : d.z;
			})
			.value(function(d) {
				return d.i.length;
			});
	self.treemaps = [];
	self.trees.forEach(function(theTree) {
		self.treemaps.push(tm.nodes(theTree));
	});

	self.renderTree(0);
} // render()

VizMBMap.prototype.setSel = function(absIArray)
{	// Does nothing
} // setSel()

VizMBMap.prototype.clearSel = function()
{
		// Set selection flag to false for all trees
	if (this.bkSel)
		this.bkSel.s = false;
	this.infoG.select(".mbm-select").remove();
	this.bkSel=null;
	this.sbkSel=null;
	this.svg.selectAll(".mbm-cell").classed('obj-sel', false);
	this.svg.selectAll(".mbm-title").classed('obj-sel', false);
	this.resetAttBars();
	this.vFrame.selBtns(false);
} // clearSel()

	// RETURNS: Array of absolute IDs of selected records
VizMBMap.prototype.getSel = function()
{
	if (this.sbkSel !== null)
		return this.sbkSel.i;
	else if (this.bkSel !== null)
		return this.bkSel.i;
	else
		return [];
} // getSel()

VizMBMap.prototype.hint = function()
{
	var att = PData.aByID(this.settings.p);
	return dlText.grpblks+' '+att.def.l;
} // hint()
