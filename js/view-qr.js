// This file contains:
//		PVizModel Classes for Qualified Relationship visualizations
//			VizEgoGraph
//
//		PFilterQR Class for Filtering on Relationship-Roles

// ================================================================================
// VizEgoGraph: Class to visualize relationships from a given "ego" node
//	Instance Variables:
//		svg = svg for entire visualization
//		qrTI = index of QR Template
//		center = g element at center
//		n = current number of concentric rings
//		r = current distance between concentric rings
//		rings = represent rings [{ i: 0..n-1, r[adius] }]

var VizEgoGraph = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizEgoGraph

VizEgoGraph.prototype = Object.create(PVizModel.prototype);

VizEgoGraph.prototype.constructor = VizEgoGraph;

VizEgoGraph.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizEgoGraph.prototype.setup = function()
{
	var s=this.settings;
	var self=this;
	var cr=Math.floor(s.s/2);

	this.r = s.r;
	this.n = s.n;

	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);

	jQuery(this.frameID).append(document.getElementById('dltext-ego-graph').innerHTML);

	this.svg = d3.select(this.frameID).select("svg");
	this.svg.attr("width", s.s).attr("height", s.s);

	this.center = this.svg.append("g");
	this.center.attr("transform", "translate(" + cr + "," + cr + ")");

	this.rings=[];
	for (var i=0; i<this.n; i++) {
		this.rings.push({ i: i, r: 40+(i*this.r) });
	}

	var ring = this.center.selectAll(".ring")
		.data(this.rings)
		.enter()
		.append("circle")
		.attr("class", "ring")
		.attr("r", function(d) { return d.r; });
} // setup()

	// NOTES:	The render stage actually only compiles data and populates the selection list;
	//				The graph is rendered in response to clicks on the selection list
VizEgoGraph.prototype.render = function(stream)
{
		// Compile list of QRs
		//		Both Recs pointed at need to have valid Feature data
		// Compile list of nodes
		//		(1) From the QRs
		//		(2) that have Attribute values in current Legend;
		//		(3) All nodes appear only once!
		// Color links by relationships (after ego is selected)
	var self=this;
	var qrrecs=[];			// [ { qr [original QR], i1 [index in recData], i2 }]
	var recData=[];			// [ { id, r[ec], qrs: [indices of QR recs], f[eature Val] }]
	var qrconfig=prspdata.e.g.qr;
	var tRec=stream.t[this.qrTI];
	var relI=tRec.i, absI, aI, qrRec, i1, i2;
	var featSets=[], fAtts=[], fAttIDs=[];

		// Preload fAtt data for used Templates
	for (var fI=0; fI<PData.eTNum(); fI++) {
		i1 = this.vFrame.getSelLegend(fI);
		fAttIDs.push(i1);
		fAtts.push(i1 ? PData.aByID(i1) : null);
		featSets.push(i1 ? this.vFrame.getSelFeatAtts(fI) : null);
	}

		// PURPOSE:	Create or update entry in recData array (kept in order)
		// RETURNS: -1 (if abort), or index in recData
	function addE(id)
	{
		var fresh = recData.length === 0;
		var i, rec, rd, tI, fAttID, fDatum;

		if (!fresh) {
			i = _.sortedIndex(recData, id, 'id');
			rd = recData[i];
		}

		if (fresh || rd.id !== id) {
				// Convert ID to absolute index and get Template Index
			absI = PData.nByID(id);
			rec = PData.rByN(absI);
			tI = PData.n2T(absI);
			fAttID = fAttIDs[tI];
			fDatum = rec.a[fAttID];
			if (typeof fDatum === 'undefined') {
				return -1;
			} else {
				fDatum = PData.lClr(fDatum, fAtts[tI], featSets[tI]);
				if (fDatum) {
					if (fresh) {
						recData.push({ id: id, r: rec, qrs: [ relI ], f: fDatum });
						return 0;
					} else {
						recData.splice(i, 0, { id: id, r: rec, qrs: [ relI ], f: fDatum });
						return i;
					}
				} else {
					return -1;
				}
			}
		} else {
				// Record entry already exists -- just add reference to QR
			rd.qrs.push(relI);
			return i;
		}
	} // addE()

		// Compile array of QR records
	while (relI < tRec.i+tRec.n) {
		absI = stream.s[relI++];
		qrRec = PData.rByN(absI);
		i1 = addE(qrRec.a[qrconfig.e1][0]);
		if (i1 === -1) {
			continue;
		}
		i2 = addE(qrRec.a[qrconfig.e2][0]);
		if (i2 === -1) {
			// TO DO: Delete any entry done for i1!!
			continue;
		}
		qrrecs.push({ qr: qrRec, i1: i1, i2: i2 });
	}

console.table(qrrecs);
console.table(recData);
} // render()

// ====================================================================================
// PFilterQR: Filter class that removes all QR Records based on Relationships and Roles
//	Instance Variables:
//		t = index of QR Template
//		qr = shortcut to QR settings
//		r = ID of Vocab Attribute for currently selected Relationship term
//		rT = currently selected Relationship term
//		rOn = if true, eval on basis of <r>
//		r1 = ID of Vocab Attribute for currently selected Relationship term
//		r1On = if true, eval on basis of <r1>
//		r2 = ID of Vocab Attribute for currently selected Relationship term
//		r2On = if true, eval on basis of <r2>

var PFilterQR = function(id, tI)
{
		// Create pseudo-Attribute object w/ID
	PFilterModel.call(this, id, { id: '_qr' });
	this.t = tI;
	this.qr = prspdata.e.g.qr;
		// Set default Relationship ID
	this.r = prspdata.e.g.qr.x[0].id;
} // PFilterQR()

PFilterQR.prototype = Object.create(PFilterModel.prototype);

PFilterQR.prototype.constructor = PFilterQR;

PFilterQR.prototype.title = function()
{
	return dlText.qrrr;
} // title()

	// PURPOSE: Set the options for the Roles 1 and 2 dropdowns based on current Relationship selection
PFilterQR.prototype.setRoles = function()
{
	var inserted = this.insertPt();
	var cntrl1 = inserted.find('select.filter-qr-r1');
	var cntrl2 = inserted.find('select.filter-qr-r2');
	cntrl1.empty();
	cntrl2.empty();
	var rAtt = PData.aByID(this.r);
	var opt;
	if (rAtt) {
		rAtt.l.forEach(function(lgnd) {
			opt = '<option value="'+lgnd.l+'">'+lgnd.l+'</option>';
			cntrl1.append(opt);
			cntrl2.append(opt);
		});
	}
} // setRoles()

PFilterQR.prototype.setup = function()
{
	var self = this;

	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-qr').innerHTML;
	inserted.append(htmlText);

		// Create Relationship options
	var options=inserted.find('select.filter-qr-r');
	prspdata.e.g.qr.x.forEach(function(x) {
		options.append('<option value="'+x.id+'">'+x.t+'</option>');
	});

	this.setRoles();

		// Intercept changes to Relationship & Roles selections!
	options.change(function() {
		self.r = options.val();
		self.setRoles();
		self.isDirty(2);
	});
	inserted.find('select.filter-qr-r1').change(function() {
		self.isDirty(2);
	});
	inserted.find('select.filter-qr-r2').change(function() {
		self.isDirty(2);
	});
		// Any clicks on "use" settings just dirty filter
	inserted.find('input.filter-qr-use-r').click(function(event) {
		self.isDirty(2);
	});
	inserted.find('input.filter-qr-use-r1').click(function(event) {
		self.isDirty(2);
	});
	inserted.find('input.filter-qr-use-r2').click(function(event) {
		self.isDirty(2);
	});
} // setup()

PFilterText.prototype.teardown = function()
{
	var inserted = this.insertPt();
	inserted.find('select.filter-qr-r').off("change");
	inserted.find('select.filter-qr-r1').off("change");
	inserted.find('select.filter-qr-r2').off("change");
	inserted.find('input.filter-qr-use-r').off("click");
	inserted.find('input.filter-qr-use-r1').off("click");
	inserted.find('input.filter-qr-use-r2').off("click");
} // teardown()

PFilterQR.prototype.evalPrep = function()
{
	var inserted = this.insertPt();
	this.rOn  = inserted.find('input.filter-qr-use-r').prop('checked');
	this.r1On = inserted.find('input.filter-qr-use-r1').prop('checked');
	this.r2On = inserted.find('input.filter-qr-use-r2').prop('checked');
		// NOTE: this.r always kept updated
	this.rT = inserted.find('select.filter-qr-r :selected').text();
	this.r1 = inserted.find('select.filter-qr-r1').val();
	this.r2 = inserted.find('select.filter-qr-r2').val();
} // evalPrep()

	// PURPOSE: Evaluate QR Records specifically
	// ASSUMRS:	Not called for non-QR Template Records
	//			Attribute value for Relationship has only 1 value! (not multiple)
PFilterQR.prototype.eval = function(rec)
{
	var r1Avail=true, r2Avail=true;

		// Pass Records not belonging to QR Template
		// This shouldn't be needed, as recompute() doesn't call for non-QR templates
	// if (this.t !== tI)
	// 	return true;
		// Do we need to test the Relationship type?
	if (this.rOn && this.rT !== rec.a[this.qr.r][0]) {
		return false;
	}

		// Do we need to test one Role? Need to be flexible about R1/R2
	if (this.r1On) {
		if (this.r1 === rec.a[this.qr.r1]) {
			r1Avail=false;
		} else if (this.r1 === rec.a[this.qr.r2]) {
			r2Avail=false;
		} else {
			return false;
		}
	}

		// Fail if no matches in any leftover "slots"
	if (this.r2On) {
		if ((r1Avail && this.r2 !== rec.a[this.qr.r1]) || (r2Avail && this.r2 !== rec.a[this.qr.r2]))
		{
			return false;
		}
	}

	return true;
} // eval()

PFilterQR.prototype.getState = function()
{
	var ip = this.insertPt();
	return {
		rOn: ip.find('input.filter-qr-use-r').prop('checked'), r: this.r,
		r1On: ip.find('input.filter-qr-use-r1').prop('checked'), r1: ip.find('select.filter-qr-r1').val(),
		r2On: ip.find('input.filter-qr-use-r2').prop('checked'), r2: ip.find('select.filter-qr-r2').val()
	};
} // getState()

PFilterQR.prototype.setState = function(state)
{
	var ip = this.insertPt();
	ip.find('input.filter-qr-use-r').prop('checked', state.rOn);
	this.r = state.r; ip.find('input.filter-qr-r').val(this.r);
	ip.find('input.filter-qr-use-r1').prop('checked', state.r1On);
	ip.find('select.filter-qr-r1').val(state.r1);
	ip.find('input.filter-qr-use-r1').prop('checked', state.r2On);
	ip.find('select.filter-qr-r1').val(state.r2);
} // setState()
