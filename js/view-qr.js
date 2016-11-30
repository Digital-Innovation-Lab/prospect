// This file contains:
//		PVizModel Classes for Qualified Relationship visualizations
//			VizQRMap
//			VizEgoGraph
//			VizTimeRing
//
//		PFilterQR Class for Filtering on Relationship-Roles


// ================================================
// VizQRMap: Class to visualize QRs on GIS maps
//				Based loosely on VizMap2
//
// Instance Variables:
//		qrTI = index of QR Template
//		lMap = Leaflet map object
//		baseMap = basemap layer object
//		mapLayers = group map overlay objects
//		markerLayer = Leaflet layer for Markers
//		lineLayer = Leaflet layer for drawing lines between markers
//		bOp = opacity of basemap
//		lOps = opacities of each overlay map group

var VizQRMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizQRMap

VizQRMap.prototype = Object.create(PVizModel.prototype);

VizQRMap.prototype.constructor = VizQRMap;

VizQRMap.prototype.flags = function()
{
	var flags = V_FLAG_SEL | V_FLAG_OPT | V_FLAG_LGND;

		// If no second coordinate, entities will be represented as Relationships
	if (prspdata.e.g.qr.c2 == null) {
		flags |= V_FLAG_SLGND;
	}

	return flags;
} // flags()

VizQRMap.prototype.getFeatureAtts = function(tIndex)
{
		// If there are not separate coordinates for each entity, single location shown
		//	using Relationship legend
	if (prspdata.e.g.qr.c2 == null) {
		return prspdata.e.g.qr.r;
	}

	return this.settings.lgnds[tIndex];
} // getFeatureAtts()

VizQRMap.prototype.setup = function()
{
	var self=this;

		// Get index of QR Template
	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);

	var centerLat = parseFloat(this.settings.clat);
	var centerLon = parseFloat(this.settings.clon);
	var zoom;
	if (typeof(this.settings.zoom) === 'string') {
		zoom = parseInt(this.settings.zoom);
	} else {
		zoom = this.settings.zoom;
	}

	function zoomMap()
	{
		self.lMap.zoomIn();
	} // zoomMap()
	function unzoomMap()
	{
		self.lMap.zoomOut();
	} // unzoomMap()
	function resetMap()
	{
		self.lMap.setView([centerLat, centerLon], zoom);
	} // resetMap()
	function curLoc()
	{
		function setHere(pos) {
			self.lMap.setView([pos.coords.latitude, pos.coords.longitude]);
		}
		navigator.geolocation.getCurrentPosition(setHere);
	} // curLoc()

	var vI = this.vFrame.getIndex();

		// Leaflet requires a DIV ID to startup: create and insert one
	jQuery(this.frameID).append('<div id="l-map-'+vI+'" class="max-size"></div>');

	this.lMap = L.map("l-map-"+vI, { zoomControl: false }).setView([centerLat, centerLon], zoom);

		// Create basemap
	this.baseMap = PMapHub.createMapLayer(this.settings.base, 1, this.lMap, null);
	this.bOp = 100;		// base map opacity
	this.lOps = [];		// overlay map group layers opacities
	this.mapLayers = [];

		// Compile map layer data into mapLayers array and create with Leaflet
	var opacity;
	this.settings.lyrs.forEach(function(layer, lIndex) {
		opacity = layer.o;
		self.lOps.push(opacity*100);

		var newLayer;
		newLayer = PMapHub.createMapGroup(layer.gid, opacity, self.lMap);
		self.mapLayers.push(newLayer);
	});

	var fh = _.template(document.getElementById('dltext-v-map').innerHTML);
	jQuery('#view-frame-'+vI+' div.view-controls').append(fh({ vi: vI }));

	jQuery('#map-zoom-'+vI).button({ text: false, icons: { primary: "ui-icon-plus" }})
		.click(zoomMap);
	jQuery('#map-unzoom-'+vI).button({ text: false, icons: { primary: "ui-icon-minus" }})
		.click(unzoomMap);
	jQuery('#map-reset-'+vI).button({ text: false, icons: { primary: "ui-icon-arrowrefresh-1-w" }})
		.click(resetMap);
	jQuery('#map-cloc-'+vI).button({ text: false, icons: { primary: "ui-icon-pin-s" }})
		.click(curLoc);

		// Create layer for Markers
	var markers = L.featureGroup();
	this.markerLayer = markers;

		// Create options properties if they don't already exist
	markers.options = markers.options || { };
	markers.options.layerName = dlText.markers;
	markers.addTo(this.lMap);

		// Create layer for connecting lines
	var lines = L.featureGroup();
	this.lineLayer = lines;
	lines.addTo(this.lMap);
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizQRMap.prototype.render = function(stream)
{
	var self=this;
	var mLayer=this.markerLayer;
	var lLayer=this.lineLayer;

		// PURPOSE: Handle click on feature
		// NOTES: 	_aid is absolute index of record, but there can be multiple instances of same record!
		//			This function being within render closure makes it inefficient,
		//				but need access to vFrame!
	function markerClick(e)
	{
		if (e.target && e.target.options) {
			var aid = e.target.options._aid;
			var added = self.toggleSel(aid);

			if (added) {
				this.setStyle({ color: "yellow", weight: 2 });
				this.bringToFront();
			} else {
				this.setStyle({ color: "#000", weight: 1 });
			}
		}
	} // markerClick()

	function lineClick(e)
	{
	} // lineClick()


	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Remove previous Markers & lines
	mLayer.clearLayers();
	lLayer.clearLayers();

	var qrconfig=prspdata.e.g.qr;
	var rAttID=qrconfig.r;			// Relationship ID
	var rAtt=PData.aByID(rAttID);	// Relationship Attribute
	var rAttSet=PData.allFAtts(rAtt);
	var sAttID, sAtt, minR, maxR, dR;
	var tRec=stream.t[this.qrTI];
	var relI=tRec.i, maxI=tRec.i+tRec.n;
	var qI, qrRec;
	var i1, i2, rec1, rec2, ll1, ll12, s1, s2, t1, t2, f1, f2, m1, m2;
	var rVal, bond;
	var qrc1=qrconfig.c1, qrc2=qrconfig.c2;
	var sDeltas=[], sMins=[];
	var featSets, fAtts, fAttIDs;

		// Set up radius calculation parameters
	minR = this.settings.min;
	if (typeof minR === 'string') {
		minR = parseInt(minR);
	}
	maxR = this.settings.max;
	if (typeof maxR === 'string') {
		maxR = parseInt(maxR);
	}
	dR = maxR - minR;
	this.settings.sAtts.forEach(function(sAttID) {
		if (sAttID) {
			var sAtt = PData.aByID(sAttID);
			sMins.push(sAtt.r.min);
			sDeltas.push(sAtt.r.max - sAtt.r.min);
		}
	});

		// Cache fAtt data for used Templates
	if (qrc2) {
		featSets=[], fAtts=[], fAttIDs=[];
		for (qI=0; qI<PData.eTNum(); qI++) {
			id1 = this.vFrame.getSelLegend(qI);
			fAttIDs.push(id1);
			fAtts.push(id1 ? PData.aByID(id1) : null);
			featSets.push(id1 ? this.vFrame.getSelFeatAtts(qI) : null);
			this.tUsed[qI] = true;		// Always true so that QR Attributes available
		}
	} else {
		featSets = this.vFrame.getSelFeatAtts(this.qrTI);
		this.tUsed[this.qrTI] = true;		// Always true so that QR Attributes available
	}

		// PURPOSE: Add a single marker to marker layer
		// INPUT: 	ll = LatLon point
		//			r = radius
		//			c = fill color
		//			aI = absolute index of Record it represents
		// ASSUMES: Key variables are set: rec, fData, sAttID, aI
	function addMarker(ll, r, f, aI)
	{
		self.rMap[aI >> 4] |= (1 << (aI & 15));
		var newMarker = L.circleMarker(ll,
			{	_aid: aI, weight: 1, radius: r, fillColor: f, color: "#000",
				opacity: 1, fillOpacity: 1 });
		newMarker.on('click', markerClick);
		return newMarker;
	} // addMarker()

	function getRad(absI, rec, eTI)
	{
		if (qrc2 == null) {
			return minR;
		}
		var sAttID = self.settings.sAtts[eTI];

		if (sAttID) {
			var s = rec.a[sAttID];
			if (typeof s === 'number') {
				return Math.floor(((s-sMins[eTI])*dR)/sDeltas[eTI]) + minR;
			} else {
				return minR;
			}
		} else {
			return minR;
		}
	} // getRad()

		// Process array of QR records
	while (relI < maxI) {
		qI = stream.s[relI++];
		qrRec = PData.rByN(qI);
			// Dual connected markers?
		if (qrc2) {
				// Ensure valid IDs for Entities & absolute indices
			if ((id1=qrRec.a[qrconfig.e1][0]) && (id1=PData.nByID(id1)) && (id2=qrRec.a[qrconfig.e2][0]) && (id2=PData.nByID(id2))) {
					// And only if there are valid coordinates for both
				if ((ll1=qrRec.a[qrc1]) && (ll2=qrRec.a[qrc2])) {
						// TO DO: Ensure that ll1 and ll2 are arrays of two coordinates!
						// Get Template indices & recs
					t1=PData.n2T(id1);
					t2=PData.n2T(id2);
					rec1=PData.rByN(id1);
					rec2=PData.rByN(id2);
						// Ensure both entities have valid features
					f1 = rec1.a[fAttIDs[t1]];
					if ((typeof f1 !== 'undefined') && (f1=PData.lClr(f1, fAtts[t1], featSets[t1]))) {
						f2 = rec2.a[fAttIDs[t2]];
						if ((typeof f2 !== 'undefined') && (f2=PData.lClr(f2, fAtts[t2], featSets[t2]))) {
							m1 = addMarker(ll1, getRad(id1, rec1, t1), f1, id1);
							m2 = addMarker(ll2, getRad(id2, rec2, t2), f2, id2);
							rVal = PData.lClr(qrRec.a[rAttID], rAtt, rAttSet);
							bond = L.polyline([ll1, ll2],
								{	_aid: qI, weight: 4, fillColor: rVal, color: "#000",
									opacity: 1, fillOpacity: 1 });
							bond.on('click', lineClick);
							lLayer.addLayer(bond);
						} // f2
					} // f1
				} // ll1 & ll2
			} // id1 & id2
		} else {	// qrRec provides Relationship Legend; no size parameter
			if (ll1=qrRec.a[qrc1]) {
					// TO DO: Ensure that ll1 is an array of two coordinates!
				rVal = PData.lClr(qrRec.a[rAttID], rAtt, featSets);
					// Translate Relationship into color
				mLayer.addLayer(addMarker(ll1, minR, rVal, qI));
			}
		} // only 1 coordinate
	} // while
} // render()

VizQRMap.prototype.teardown = function()
{
	var vi = this.vFrame.getIndex();
	jQuery('#view-frame-'+vi+' div.view-controls div.iconbar').remove();
} // teardown()

VizQRMap.prototype.resize = function()
{
	this.lMap.invalidateSize(false);
} // PVizModel.resize()

VizQRMap.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		if (this.markerLayer) {
			this.markerLayer.eachLayer(function(marker) {
				marker.setStyle({ color: "#000", weight: 1 });
			});
		}
	}
} // clearSel()

VizQRMap.prototype.setSel = function(absIArray)
{
	var self=this;

	this.recSel = absIArray;
	if (this.markerLayer) {
		this.markerLayer.eachLayer(function(marker) {
			if (self.isSel(marker.options._aid)) {
				marker.setStyle({ color: "yellow", weight: 2 });
				marker.bringToFront();
			} else {
				marker.setStyle({ color: "#000", weight: 1 });
			}
		});
	}
} // setSel()

VizQRMap.prototype.getState = function()
{
	return { c: this.lMap.getCenter(), z: this.lMap.getZoom(), l: this.vFrame.getLgndSels() };
} // getState()

VizQRMap.prototype.setState = function(state)
{
	this.lMap.setView(state.c, state.z);
	this.vFrame.setLgndSels(state.l);
} // setState()

VizQRMap.prototype.hint = function()
{
	var h='';
	var numT = PData.eTNum();

	for (var tI=0; tI<numT; tI++) {
		var sAttID = this.settings.sAtts[tI];
		if (sAttID) {
			if (h.length === 0) {
				h = dlText.markersize;
			} else {
				h += ',';
			}
			var sAtt = PData.aByID(sAttID);
			var tID = PData.eTByN(tI);
			var tDef = PData.tByID(tID);
			h += ' '+sAtt.def.l+' ('+tDef.l+')';
		}
	}
	return (h.length > 0) ? h : null;
} // hint()

	// NOTE: Since the opacities dialog is shared, GUI must be recreated
	//			by each Viz object and cleaned up afterwards
VizQRMap.prototype.doOptions = function()
{
	var self=this;
	var tBOp=this.bOp, tLOps=[];
	var restore=true;

	var modalOpCtrls = jQuery('#dialog-opacities div.layer-list');

	var newBit = jQuery('<div class="op-layer" data-i="-1">Base Map <input type=range class="op-slider" min=0 max=100 value='+
						this.bOp+' step=5></div>');
	newBit.find(".op-slider").on("change", function() {
		tBOp = jQuery(this).val();
		self.baseMap.setOpacity(tBOp/100);
	});
	modalOpCtrls.append(newBit);

	this.settings.lyrs.forEach(function(layer, lIndex) {
		var initO = self.lOps[lIndex];
		newBit = jQuery('<div class="op-layer" data-i="'+lIndex+'">'+layer.gid+
					' <input type=range class="op-slider" min=0 max=100 value='+initO+' step=5></div>');
		newBit.find(".op-slider").on("change", function() {
			var newO = jQuery(this).val();
			tLOps[lIndex] = newO;
			newO /= 100;
			self.mapLayers[lIndex].eachLayer(function(l) {
				l.setOpacity(newO);
			});
		});
		tLOps.push(initO);
		modalOpCtrls.append(newBit);
	});

	function cleanUp()
	{
		if (restore) {
				// Reset opacities in case user changed anything
			self.baseMap.setOpacity(self.bOp/100);
			self.lOps.forEach(function(op, oI) {
				self.mapLayers[oI].eachLayer(function(l) {
					l.setOpacity(op/100);
				});
			});
		}
		modalOpCtrls.empty();
	} // restoreOps()

	var d = jQuery("#dialog-opacities").dialog({
		dialogClass: "no-close",
		height: 300,
		width: 500,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					restore=false;
					d.dialog("close");
					self.bOp = tBOp;
					tLOps.forEach(function(op, oI) {
						self.lOps[oI] = tLOps[oI];
					});
				}
			},
			{
				text: dlText.cancel,
				click: function() {
					d.dialog("close");
				}
			}
		]
	});
	d.on("dialogclose", function(event, ui) {
		cleanUp();
			// Unbind Inspector from this view -- one off only
		d.off("dialogclose");
	});
} // doOptions()


// ================================================================================
// VizEgoGraph: Class to visualize relationships from a given "ego" node
//	Instance Variables:
//		svg = svg for entire visualization
//		center = svg.g element at center
//		qrTI = index of QR Template
//		ego = ID of currently selected Record
//		n = current number of concentric rings
//		qrs = compiled data from QRTemplates
//		drs = compiled data from Records (entities)

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
	var j=jQuery(this.frameID);

	this.n = s.n;
	this.ego = null;

	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);

	j.append(document.getElementById('dltext-ego-graph').innerHTML);

	j.find("div.egograph div.egolist div.sellist-scroll").on("click", function(event) {
		if (event.target.nodeName === 'DIV') {
			var item = jQuery(event.target).closest('div.sellist-rec');
			if (item.size() == 1) {
				var id = item.data('id');
				self.setEgo(id);
			}
		}
	});

		// Set initial number of degrees of separation
	j.find("div.egograph input.ego-n").val(s.n);
	j.find("div.egograph input.ego-n").on("change", function() {
		var newN = jQuery(this).val();
		if (newN >= '1' && newN <= '6') {
			jQuery(this).removeClass('error');
			self.n = parseInt(newN, 10);
			if (self.ego) {
				self.setEgo(self.ego);
			}
		} else {
			jQuery(this).addClass('error');
		}
	});

	this.svg = d3.select(this.frameID).select("svg");
	this.svg.attr("width", s.s).attr("height", s.s);

	this.center = this.svg.append("g");
	this.center.attr("transform", "translate(" + cr + "," + cr + ")");
} // setup()

VizEgoGraph.prototype.teardown = function()
{
	var j = jQuery(this.frameID+" div.egograph");
	j.find("div.egolist div.sellist-scroll").off("click");
	j.find("div.egograph input.ego-n").off("change");
} // teardown()

	// PURPOSE:	Effect selection on Record <id>
	// NOTES:	This may be called in an effort to "restore" a state that cannot be
	//				achieved because <id> is no longer available: check <id> in active list.
VizEgoGraph.prototype.setEgo = function(id)
{
	var self=this;
	var s=this.settings;
	var rAttID=prspdata.e.g.qr.r;
	var rAtt=PData.aByID(rAttID);
	var fSet=PData.allFAtts(rAtt);
	var numRings=0;

	var cr=Math.floor(s.s/2)-s.r;

		// Ensure no current selection
	this.recSel=[];
	this.vFrame.upSel([], false);

		// Mark no Records rendered
	this.preRender(false, true);

	this.center.selectAll(".bond").remove();
	this.center.selectAll(".node").remove();
	this.center.selectAll(".ring").remove();

	var j=jQuery(this.frameID+" > div.egograph > div.egolist > div.sellist-scroll");
	var d=j.find('div.sellist-rec[data-id="'+id+'"]');
		// Ensure that just this item is selected
	j.find("div.sellist-rec").removeClass('active');
		// Abort if ego no longer available in active list
	if (d.length == 0) {
		this.ego = null;
		return;
	}
	d.addClass('active');

	this.ego = id;

		// Mark all qr and rec data as unused
	this.qrs.forEach(function(q) { q.u = false; });
	this.drs.forEach(function(d) { d.u = false; });

		// PURPOSE: Utility function that converts radial position to X,Y
	function project(x, y) {
		var angle = (x - 90) / 180 * Math.PI, radius = y;
		return [radius * Math.cos(angle), radius * Math.sin(angle)];
	} // project()

		// PURPOSE: Recursive function to add node <nID> to tree
		// INPUT:	p is pointer to parent node (or null for ego)
		//			nID is the ID for this node
		//			depth is the level in tree
		//			lc is the color of the QR relationship
		//			li is the index of the QR record
		// TO DO:	Make breadth first, NOT depth first!
	function growTree(p, nID, depth, lc, li)
	{
			// Mark this node as "used"
		var drI = _.sortedIndex(self.drs, { id: nID }, 'id');
		var dr = self.drs[drI];
		dr.u = true;

		var newNode = { parent: p, children: [], lc: lc, li: li, nc: dr.f, ni: dr.ai, t: dr.r.l };
			// Keep track of # rings
		if (depth > numRings) {
			numRings=depth;
		}
			// If not already at "bottom" of tree depth, look to see if this node in relationships
			//	with others not already "used" (placed on chart)
		if (depth < self.n) {
			self.qrs.forEach(function(thisQR) {
				if (!thisQR.u && (thisQR.e1 === nID || thisQR.e2 === nID)) {
					var connectedID = (thisQR.e1 === nID) ? thisQR.e2 : thisQR.e1;
					drI = _.sortedIndex(self.drs, { id: connectedID }, 'id');
					dr = self.drs[drI];
						// Find this node in node list
					if (!dr.u) {
							// Set both QR and node to "used"
						thisQR.u = true;
						dr.u = true;
						self.rMap[dr.ai >> 4] |= (1 << (dr.ai & 15));
						self.rMap[thisQR.qi >> 4] |= (1 << (thisQR.qi & 15));
							// Get Relationship value
						var rVal = thisQR.qr.a[rAttID];
						if (typeof rVal !== 'undefined') {
							rVal = PData.lClr(rVal, rAtt, fSet);
							if (rVal) {
								newNode.children.push(growTree(newNode, connectedID, depth+1, rVal, thisQR.qi));
							}
						}
					}
				}
			});
		}
		return newNode;
	} // growTree()

	function clickNode(d)
	{
		var s = self.toggleSel(d.data.ni);
		d3.select(this).classed('obj-sel', s);
	} // clickNode()

	function clickLink(d)
	{
		var s = self.toggleSel(d.data.li);
		d3.select(this).classed('obj-sel', s);
	} // clickLink()

	var ego = growTree(null, id, 0, null, null);
	var graph = d3.hierarchy(ego);
	var treeFunc = d3.tree().size([360, cr]).separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
	var root = treeFunc(graph);

		// Create rings
	var rr=cr/numRings;
	var rings=[];
	for (var i=0; i<numRings; ) {
		rings.push(++i * rr);
	}

	var ring = this.center.selectAll(".ring")
		.data(rings)
		.enter()
		.append("circle")
		.attr("class", "ring")
		.attr("r", function(d) { return d; });

	var link = this.center.selectAll(".bond")
    	.data(root.descendants().slice(1))
    	.enter().append("path")
        .attr("class", "bond")
		.attr("stroke", function(d) { return d.data.lc; })
        .attr("d", function(d) {
        	return "M" + project(d.x, d.y)
            	+ "C" + project(d.x, (d.y + d.parent.y) / 2)
            	+ " " + project(d.parent.x, (d.y + d.parent.y) / 2)
            	+ " " + project(d.parent.x, d.parent.y);
        })
		.on("click", clickLink);

    var node = this.center.selectAll(".node")
    	.data(root.descendants())
    	.enter().append("g")
        .attr("class", function(d) { return "node"; })
        .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", s.r)
		.attr("fill", function(d) { return d.data.nc; })
		.on("click", clickNode);

	node.append("title")
		.text(function(d) { return d.data.t; });
} // SetEgo()

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
	var qrrecs=[];			// [ { qr [original QR], qi [absI], e1, e2, u }]
	var recData=[];			// [ { ai, id, r[ec], f[eature Val], u }]
	var qrconfig=prspdata.e.g.qr;
	var tRec=stream.t[this.qrTI];
	var relI=tRec.i, qI, aI, qrRec;
	var i1, i2, id1, id2;
	var featSets=[], fAtts=[], fAttIDs=[];
	var ip;

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Preload fAtt data for used Templates
	for (qI=0; qI<PData.eTNum(); qI++) {
		i1 = this.vFrame.getSelLegend(qI);
		fAttIDs.push(i1);
		fAtts.push(i1 ? PData.aByID(i1) : null);
		featSets.push(i1 ? this.vFrame.getSelFeatAtts(qI) : null);
		this.tUsed[qI] = true;		// Always true so that QR Attributes available
	}

		// PURPOSE:	Create or update entry in recData array (kept in order)
		// RETURNS: -1 (if abort), or index in recData
	function addE(id)
	{
		var append = recData.length === 0;
		var absI, i, rec, rd, tI, fAttID, fDatum;

		if (append) {
			i=0;
		} else {
			i = _.sortedIndex(recData, { id: id }, 'id');
			if (!(append = (i === recData.length))) {
				rd = recData[i];
			}
		}

		if (append || rd.id !== id) {
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
					if (append) {
						recData.push({ ai: absI, id: id, r: rec, f: fDatum, u: false });
					} else {
						recData.splice(i, 0, { ai: absI, id: id, r: rec, f: fDatum, u: false });
					}
					return i;
				} else {
					return -1;
				}
			}
		} else {
			return i;
		}
	} // addE()

		// Compile array of QR records
	while (relI < tRec.i+tRec.n) {
		qI = stream.s[relI++];
		qrRec = PData.rByN(qI);
		id1 = qrRec.a[qrconfig.e1][0];
		index = addE(id1);
		if (index === -1) {
			continue;
		}
		id2 = qrRec.a[qrconfig.e2][0];
		if (addE(id2) === -1) {
			continue;
		}
		qrrecs.push({ qr: qrRec, qi: qI, e1: id1, e2: id2, u: false });
	}
	this.qrs = qrrecs;
	this.drs = recData;

		// Create index for putting Records in alpha order
	var oIndex=[];
	for (i1=0; i1<recData.length; i1++) {
		oIndex[i1]=i1;
	}
	oIndex.sort(function(a,b) {
		return PData.strcmp(recData[b].r.l, recData[a].r.l);
	});

		// Populate selection list with Record labels
	ip = jQuery(this.frameID).find('div.egograph div.egolist div.sellist-scroll');
	ip.empty();
	oIndex.forEach(function(rI) {
		i1=recData[rI].r;
		ip.append('<div class="sellist-rec" data-id="'+i1.id+'">'+i1.l+'</div>');
	});
	if (this.ego) {
		this.setEgo(this.ego);
	}
} // render()

VizEgoGraph.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	this.center.selectAll(".node circle")
			.attr("class", function(d) { return self.isSel(d.data.ni) ? 'obj-sel' : '' });
	this.center.selectAll(".bond")
			.attr("class", function(d) { return self.isSel(d.data.li) ? 'bond obj-sel' : 'bond' });
} // setSel()

VizEgoGraph.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
			// Only zoom band events are selected
		this.center.selectAll(".node circle")
				.attr("class", '');
		this.center.selectAll(".bond")
				.attr("class", 'bond');
	}
} // clearSel()

VizEgoGraph.prototype.getState = function()
{
	return { ego: this.ego, l: this.vFrame.getLgndSels(), n: this.n };
} // getState()

VizEgoGraph.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
	this.ego = state.ego;
	this.n = state.n;
} // setState()

VizEgoGraph.prototype.hint = function()
{
	var hint='';
	var self=this;

	var rAttID=prspdata.e.g.qr.r;
	var rAtt=PData.aByID(rAttID);

	rAtt.l.forEach(function(lgnd) {
		if (hint.length > 0) {
			hint += ", ";
		}
		hint += '<b><span style="color: '+lgnd.v+'">'+lgnd.l+'</span></b>';
	});
	return hint;
} // hint()


// ================================================================================
// VizTimeRing: Class to visualize tempral relationships from a given "ego" node
//	Instance Variables:
//		svg = svg for entire visualization
//		center = svg.g element at center

var VizTimeRing = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizTimeRing

VizTimeRing.prototype = Object.create(PVizModel.prototype);

VizTimeRing.prototype.constructor = VizTimeRing;

VizTimeRing.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizTimeRing.prototype.setup = function()
{
	var s=this.settings;
	var self=this;
	var cr=Math.floor(s.s/2);
	var j=jQuery(this.frameID);

	this.n = s.n;
	this.ego = null;

	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);

	j.append(document.getElementById('dltext-ego-graph').innerHTML);

	j.find("div.egograph div.egolist div.sellist-scroll").on("click", function(event) {
		if (event.target.nodeName === 'DIV') {
			var item = jQuery(event.target).closest('div.sellist-rec');
			if (item.size() == 1) {
				var id = item.data('id');
				self.setEgo(id);
			}
		}
	});

		// Set initial number of degrees of separation
	j.find("div.egograph input.rr").val(s.n);
	j.find("div.egograph input.rr").on("change", function() {
		var newN = jQuery(this).val();
		if (newN >= '2' && newN <= '6') {
			jQuery(this).removeClass('error');
			self.n = parseInt(newN, 10);
			if (self.ego) {
				self.setEgo(self.ego);
			}
		} else {
			jQuery(this).addClass('error');
		}
	});

	this.svg = d3.select(this.frameID).select("svg");
	this.svg.attr("width", s.s).attr("height", s.s);

	this.center = this.svg.append("g");
} // setup()

VizTimeRing.prototype.teardown = function()
{
	var j = jQuery(this.frameID+" div.egograph");
	j.find("div.egolist div.sellist-scroll").off("click");
	j.find("div.egograph input.ego-n").off("change");
} // teardown()

	// PURPOSE:	Effect click on Record <id>
VizTimeRing.prototype.setEgo = function(id)
{
} // SetEgo()

	// NOTES:	The render stage actually only compiles data and populates the selection list;
	//				The graph is rendered in response to clicks on the selection list
VizTimeRing.prototype.render = function(stream)
{
} // render()

VizTimeRing.prototype.setSel = function(absIArray)
{
} // setSel()

VizTimeRing.prototype.clearSel = function()
{
} // clearSel()

VizTimeRing.prototype.getState = function()
{
} // getState()

VizTimeRing.prototype.setState = function(state)
{
} // setState()

VizTimeRing.prototype.hint = function()
{
} // hint()


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

var PFilterQR = function(id)
{
		// Create pseudo-Attribute object w/ID
	PFilterModel.call(this, id, { id: '_qr' });
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
	// ASSUMES:	Only called for QR Template Records
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
