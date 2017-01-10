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
		if (e.target && e.target.options) {
			var aid = e.target.options._aid;
			var added = self.toggleSel(aid);

			if (added) {
				this.setStyle({ dashArray: '' });
				this.bringToFront();
			} else {
				this.setStyle({ dashArray: '4,6' });
			}
		}
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
	var id1, id2, rec1, rec2, ll1, ll12, s1, s2, t1, t2, f1, f2, m1, m2;
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
		} else {
			sMins.push(minR);
			sDeltas.push(0);
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
		featSets = this.vFrame.getSelFeatAtts(0);
		this.tUsed[this.qrTI] = true;		// Always true so that QR Attributes selectable via Highlight
	}

		// PURPOSE: Add a single marker to marker layer
		// INPUT: 	ll = LatLon point
		//			r = radius
		//			c = fill color
		//			aI = absolute index of Record it represents
		// ASSUMES: Key variables are set: rec, fData, sAttID, aI
	function addMarker(ll, r, f, aI)
	{
		var rad;

		self.rMap[aI >> 4] |= (1 << (aI & 15));
		var newMarker = L.circleMarker(ll,
			{	_aid: aI, weight: 1, radius: r, fillColor: f, color: "#000",
				opacity: 1, fillOpacity: 1 });
		newMarker.on('click', markerClick);
		mLayer.addLayer(newMarker);
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
			// Ensure valid IDs for Entities & absolute indices
		if ((id1=qrRec.a[qrconfig.e1][0]) && ((id1=PData.nByID(id1))!==null) && (id2=qrRec.a[qrconfig.e2][0]) && ((id2=PData.nByID(id2))!==null)) {
			t1=PData.n2T(id1);
			t2=PData.n2T(id2);
				// Ensure id1 and id2 in stream!
			if ((PData.nInS(id1, stream, t1) === -1) || (PData.nInS(id2, stream, t2) === -1)) {
				continue;
			}
				// Dual connected markers?
			if (qrc2) {
					// And only if there are valid coordinates for both
				if ((ll1=qrRec.a[qrc1]) && (ll2=qrRec.a[qrc2])) {
						// TO DO: Ensure that ll1 and ll2 are arrays of two coordinates!
						// Get Template indices & recs
					rec1=PData.rByN(id1);
					rec2=PData.rByN(id2);
						// Ensure both entities have valid features
					f1 = rec1.a[fAttIDs[t1]];
					if ((typeof f1 !== 'undefined') && (f1=PData.lClr(f1, fAtts[t1], featSets[t1]))) {
						f2 = rec2.a[fAttIDs[t2]];
						if ((typeof f2 !== 'undefined') && (f2=PData.lClr(f2, fAtts[t2], featSets[t2]))) {
							m1 = addMarker(ll1, getRad(id1, rec1, t1), f1, id1);
							m2 = addMarker(ll2, getRad(id2, rec2, t2), f2, id2);
							self.rMap[qI >> 4] |= (1 << (qI & 15));
							rVal = PData.lClr(qrRec.a[rAttID], rAtt, rAttSet);
							bond = L.polyline([ll1, ll2], { _aid: qI, weight: 5, color: rVal, dashArray: '4,6' });
							bond.on('click', lineClick);
							lLayer.addLayer(bond);
						} // f2
					} // f1
				} // ll1 & ll2
			} else {	// qrRec provides Relationship Legend; no size parameter
				if (ll1=qrRec.a[qrc1]) {
						// TO DO: Ensure that ll1 is an array of two coordinates!
					rVal = PData.lClr(qrRec.a[rAttID], rAtt, featSets);
					if (rVal) {
							// Translate Relationship into color
						addMarker(ll1, minR, rVal, qI);
					}
				}
			} // only 1 coordinate
		} // if id1 & id2
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
		if (this.lineLayer) {
			this.lineLayer.eachLayer(function(line) {
				line.setStyle({ dashArray: "4,6" });
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
	if (this.lineLayer) {
		this.lineLayer.eachLayer(function(line) {
			if (self.isSel(line.options._aid)) {
				line.setStyle({ dashArray: "" });
				line.bringToFront();
			} else {
				line.setStyle({ dashArray: "4,6" });
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
	var hint='';
	var numT = PData.eTNum();

	var rAttID=prspdata.e.g.qr.r;
	var rAtt=PData.aByID(rAttID);

	rAtt.l.forEach(function(lgnd) {
		if (hint.length > 0) {
			hint += ", ";
		}
		hint += '<b><span style="color: '+lgnd.v+'">'+lgnd.l+'</span></b>';
	});

	if (hint.length > 0) {
		hint += '<br/>';
	}

	var label=true;
	for (var tI=0; tI<numT; tI++) {
		var sAttID = this.settings.sAtts[tI];
		if (sAttID) {
			if (label) {
				hint += dlText.markersize;
				label=false;
			} else {
				hint += ',';
			}
			var sAtt = PData.aByID(sAttID);
			var tID = PData.eTByN(tI);
			var tDef = PData.tByID(tID);
			hint += ' '+sAtt.def.l+' ('+tDef.l+')';
		}
	}

	return (hint.length > 0) ? hint : null;
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


// ===============================================================================
// VizQRNet: Class to visualize QR Records as network graph
//
// Instance Variables:
//		svg = SVG created for visualization
//		physics = D3 force simulation object
//		rels = [ [boolean], ], to match settings.pAtts, specifying if should display

var VizQRNet = function(viewFrame, vSettings)
{
	this.physics = null;
	this.stream = null;

	PVizModel.call(this, viewFrame, vSettings);
} // VizQRGraph

VizQRNet.prototype = Object.create(PVizModel.prototype);

VizQRNet.prototype.constructor = VizQRNet;

VizQRNet.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizQRNet.prototype.setup = function()
{
	var self=this;

		// Get index of QR Template
	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);

	this.svg = d3.select(this.frameID).append("svg");

		// Set sizes and centers
	var size = this.settings.s;
	if (typeof size === 'string') {
		size = parseInt(size);
		this.settings.s = size;
	}
	this.svg.attr("width", size)
		.attr("height", size);
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// INPUT:	steam = datastream
VizQRNet.prototype.render = function(stream)
{
	var self=this;
	var qrconfig=prspdata.e.g.qr;
	var rAttID=qrconfig.r;			// Relationship ID
	var rAtt=PData.aByID(rAttID);	// Relationship Attribute
	var rAttSet=PData.allFAtts(rAtt);
	var sAttID, sAtt, minR, maxR, dR;
	var tRec=stream.t[this.qrTI];
	var relI=tRec.i, maxI=tRec.i+tRec.n;
	var qI, qrRec;
	var id1, id2, rec1, rec2, s1, s2, t1, t2, f1, f2, m1, m2;
	var rVal;
	var featSets, fAtts, fAttIDs;
	var sDeltas=[], sMins=[];

		// remove any existing nodes and links
	this.svg.selectAll(".gnode").remove();
	this.svg.selectAll(".bond").remove();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Abort if no Records
	if (stream.l === 0) {
		return;
	}

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
		} else {
			sMins.push(minR);
			sDeltas.push(0);
		}
	});

		// Cache all Feature Attribute data
	featSets=[], fAtts=[], fAttIDs=[];
	for (qI=0; qI<PData.eTNum(); qI++) {
		if (qI === this.qrTI) {
			fAttIDs.push(rAttID);
			fAtts.push(rAtt);
			featSets.push(rAttSet);
		} else {
			id1 = this.vFrame.getSelLegend(qI);
			fAttIDs.push(id1);
			fAtts.push(id1 ? PData.aByID(id1) : null);
			featSets.push(id1 ? this.vFrame.getSelFeatAtts(qI) : null);
		}
		this.tUsed[qI] = true;		// Always true so that QR Attributes available
	}

		// Can use for both nodes and links
	function doClick(d)
	{
		var s = self.toggleSel(d.ai);
		d3.select(this).classed('obj-sel', s);
	} // doClick()

	var nodes=[], links = [];

		// PURPOSE: Either retrieve entry in nodes for Record, or create it
		// RETURNS: new node entry, or else null if Record not valid in this stream
		// NOTE:	As we don’t need actual Record IDs, can use absI as unique Record key
	function getNode(absI, tI, rec, f)
	{
		var i, n;
		var append = nodes.length === 0;

		if (append) {
			i=0;
		} else {
			i = _.sortedIndex(nodes, { ai: absI }, 'ai');
			if (!(append = (i === nodes.length))) {
				n = nodes[i];
			}
		}

		if (append || n.ai !== absI) {
			var sAttID = self.settings.sAtts[tI];
			var rad;

			if (sAttID) {
				var s = rec.a[sAttID];
				if (typeof s === 'number') {
					rad = Math.floor(((s-sMins[tI])*dR)/sDeltas[tI]) + minR;
				} else {
					rad = minR;
				}
			} else {
				rad = minR;
			}
			n = { index: 0, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null,
					ai: absI, t: tI, s: rad, c: f, r: rec };
			if (append) {
				nodes.push(n);
			} else {
				nodes.splice(i, 0, n);
			}
			self.rMap[absI >> 4] |= (1 << (absI & 15));
		}
		return n;
	} // getNode()

		// Process array of QR records
	while (relI < maxI) {
		qI = stream.s[relI++];
		qrRec = PData.rByN(qI);
			// Ensure valid IDs for Entities & absolute indices
		if ((id1=qrRec.a[qrconfig.e1][0]) && ((id1=PData.nByID(id1))!==null) && (id2=qrRec.a[qrconfig.e2][0]) && ((id2=PData.nByID(id2))!==null)) {
				// Get Template indices & recs
			t1=PData.n2T(id1);
			t2=PData.n2T(id2);
				// Ensure id1 and id2 in stream!
			if ((PData.nInS(id1, stream, t1) === -1) || (PData.nInS(id2, stream, t2) === -1)) {
				continue;
			}
			rec1=PData.rByN(id1);
			rec2=PData.rByN(id2);
				// Ensure both entities have valid features
			f1 = rec1.a[fAttIDs[t1]];
			if ((typeof f1 !== 'undefined') && (f1=PData.lClr(f1, fAtts[t1], featSets[t1]))) {
				f2 = rec2.a[fAttIDs[t2]];
				if ((typeof f2 !== 'undefined') && (f2=PData.lClr(f2, fAtts[t2], featSets[t2]))) {
					rVal = PData.lClr(qrRec.a[rAttID], rAtt, rAttSet);
					if (rVal) {
						m1 = getNode(id1, t1, rec1, f1);
						m2 = getNode(id2, t2, rec2, f2);
						self.rMap[qI >> 4] |= (1 << (qI & 15));
						links.push({ ai: qI, c: rVal, index: links.length, source: m1, target: m2 });
					}
				} // f2
			} // f1
		} // id1 & id2
	} // while

		// Set proper index value in nodes[]
	nodes.forEach(function(thisNode, nI) {
		thisNode.index = nI;
	});

	function dragstarted(d) {
		if (!d3.event.active) {
			self.physics.alphaTarget(0.3).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	} // dragstarted()

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	} // dragged()

	function dragended(d) {
		if (!d3.event.active) {
			self.physics.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
	} // dragended()

	var link = this.svg.selectAll("line")
		.data(links)
	    .enter()
		.append("line")
		.attr("class", "bond")
		.style("stroke", function(d) { return d.c; })
		.on("click", doClick);

	var node = this.svg.selectAll("circle")
    	.data(nodes)
    	.enter()
		.append("circle")
    	.attr("class", "gnode")
		.attr("r", function(d) { return d.s; })
		.style("fill", function(d) { return d.c; })
		.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
		.on("click", doClick);
	node.append("title")
		.text(function(d) { return d.r.l; });

		// Need new physics sim for each new render
	qI = this.settings.s;
	this.physics = d3.forceSimulation()
		.force("center", d3.forceCenter(qI/2, qI/2))
	    .force("link", d3.forceLink())
	    .force("charge", d3.forceManyBody().distanceMin((maxR+minR)/2).distanceMax(qI/8));

	this.physics.force("link").links(links);

		// Add a function that keeps nodes within bounds
	maxR = this.settings.s - minR;
	this.physics.force("bounds", function() {
		for (qI=0, maxI=nodes.length; qI<maxI; ++qI) {
    		m1 = nodes[qI];
    		m1.x = Math.max(minR, Math.min(m1.x, maxR));
			m1.y = Math.max(minR, Math.min(m1.y, maxR));
		}
	});

	this.physics.nodes(nodes)
		.on("tick", function() {
			link
		        .attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });
    		node
		        .attr("cx", function(d) { return d.x; })
		        .attr("cy", function(d) { return d.y; });
		});
} // render()

VizQRNet.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	this.svg.selectAll(".gnode")
			.attr("class", function(d) { return self.isSel(d.ai) ? 'obj-sel gnode' : 'gnode' });
	this.svg.selectAll(".bond")
			.attr("class", function(d) { return self.isSel(d.ai) ? 'obj-sel bond' : 'bond' });
} // setSel()

VizQRNet.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		this.svg.selectAll(".gnode")
				.attr("class", 'gnode');
		this.svg.selectAll(".bond")
				.attr("class", 'bond');
	}
} // clearSel()

VizQRNet.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizQRNet.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizQRNet.prototype.hint = function()
{
	var hint='';
	var numT = PData.eTNum();

	var rAttID=prspdata.e.g.qr.r;
	var rAtt=PData.aByID(rAttID);

	rAtt.l.forEach(function(lgnd) {
		if (hint.length > 0) {
			hint += ", ";
		}
		hint += '<b><span style="color: '+lgnd.v+'">'+lgnd.l+'</span></b>';
	});

	if (hint.length > 0) {
		hint += '<br/>';
	}

	var label=true;
	for (var tI=0; tI<numT; tI++) {
		var sAttID = this.settings.sAtts[tI];
		if (sAttID) {
			if (label) {
				hint += dlText.markersize;
				label=false;
			} else {
				hint += ',';
			}
			var sAtt = PData.aByID(sAttID);
			var tID = PData.eTByN(tI);
			var tDef = PData.tByID(tID);
			hint += ' '+sAtt.def.l+' ('+tDef.l+')';
		}
	}

	return (hint.length > 0) ? hint : null;
} // hint()


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
	j.find("div.egolist input.ego-n").off("change");
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

		// PURPOSE: Save Record data in node Object, marked as used
		// INPUT:	p = parent node
		//			nID = ID of this node
		//			rec = element in drs array for this node (if already found)
		//			lc = color of link from parent to this node
		//			li = index of QR record connecting parent to this node
	function newNode(p, nID, rec, lc, li)
	{
		var dr;

			// Is there already a pointer to this node in drs[]?
		if (rec) {
			dr = rec;
		} else {
			var drI = _.sortedIndex(self.drs, { id: nID }, 'id');
			dr = self.drs[drI];
		}

			// Mark this node as "used"
		dr.u = true;
		self.rMap[dr.ai >> 4] |= (1 << (dr.ai & 15));
		return { parent: p, children: [], lc: lc, li: li, nc: dr.f, ni: dr.ai, r: dr.r };
	} // newNode()

		// PURPOSE: Breadth-first recursive function to add node <nID> to tree
		// INPUT:	thisNode is pointer to Object in which to save this node
		//			depth is the level in tree
	function growTree(thisNode, depth)
	{
		var nID = thisNode.r.id;

			// Keep track of # rings (depth)
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
						// Find connected node in node list, ensure not already used
					if (!dr.u) {
							// Set QR node to "used"
						thisQR.u = true;
						self.rMap[thisQR.qi >> 4] |= (1 << (thisQR.qi & 15));
							// Get Relationship value
						var rVal = thisQR.qr.a[rAttID];
						if (typeof rVal !== 'undefined') {
							rVal = PData.lClr(rVal, rAtt, fSet);
							if (rVal) {
								thisNode.children.push(newNode(thisNode, connectedID, dr, rVal, thisQR.qi));
							}
						} // Legend value
					} // Unused target node
				} // Found unused matching QR
			});
				// Now iterate over all children
			thisNode.children.forEach(function(thisChild) {
				growTree(thisChild, depth+1);
			});
		}
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

	var ego = newNode(null, id, null, null, null);
	growTree(ego, 0);

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
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", s.r)
		.attr("fill", function(d) { return d.data.nc; })
		.on("click", clickNode);

	node.append("title")
		.text(function(d) { return d.data.r.l; });
} // setEgo()

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
	var relI=tRec.i, qI, qrRec;
	var index, i1, id1, id2;
	var featSets=[], fAtts=[], fAttIDs=[];

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
		// INPUT:	id is the Record ID (not an index)
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
			if (absI === null) {
				return -1;
			}
			tI = PData.n2T(absI);
				// Ensure that absI is in stream!
			if (PData.nInS(absI, stream, tI) === -1) {
				return -1;
			}
			rec = PData.rByN(absI);
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
	var oIndex=new Uint16Array(recData.length);
	for (i1=0; i1<recData.length; i1++) {
		oIndex[i1]=i1;
	}
	oIndex.sort(function(a,b) {
		return PData.strcmp(recData[b].r.l, recData[a].r.l);
	});

		// Populate selection list with Record labels
	var ip = jQuery(this.frameID).find('div.egograph div.egolist div.sellist-scroll');
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
		this.center.selectAll(".node circle").attr("class", '');
		this.center.selectAll(".bond").attr("class", 'bond');
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
	jQuery(this.frameID+" div.egograph div.egolist input.ego-n").val(state.n);
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
//		r = number of pixels between time rings
//		qrTI = index of QR Template
//		dAtt = definition of Dates Attribute used for QRs
//		ts = D3 time scale based on Dates Attribute value of ego
//		qrs = compiled data from QRTemplates
//		drs = compiled data from Records (entities)
//		egoID = ID of currently selected Record
//		egoAbsI = absI of currently selected Record
//		spokes = time spans from qrs based on current ego
//		spots = single dates from qrs based on current ego

var VizTimeRing = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizTimeRing

VizTimeRing.prototype = Object.create(PVizModel.prototype);

VizTimeRing.prototype.constructor = VizTimeRing;

VizTimeRing.prototype.flags = function()
{
	return V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL | V_FLAG_LGND | V_FLAG_SLGND;
} // flags()

VizTimeRing.prototype.getFeatureAtts = function(tIndex)
{
	return prspdata.e.g.qr.r;
} // getFeatureAtts()

VizTimeRing.prototype.setup = function()
{
	var s=this.settings;
	var self=this;
	var j=jQuery(this.frameID);

	this.r = s.r;
	this.egoID = null;
	this.egoAbsI = null;

	this.qrTI = PData.tIByID(prspdata.e.g.qr.t);
	this.dAtt = PData.aByID(prspdata.e.g.qr.d);
	this.ts = d3.scaleTime();

	this.spokes = [];
	this.spots = [];

	j.append(document.getElementById('dltext-timerings').innerHTML);

	j.find("div.egograph div.egolist div.sellist-scroll").on("click", function(event) {
		if (event.target.nodeName === 'DIV') {
			var item = jQuery(event.target).closest('div.sellist-rec');
			if (item.size() == 1) {
				var id = item.data('id');
				self.setEgo(id);
			}
		}
	});

		// Set initial number of pixels between rings
	j.find("div.egograph div.egolist input.rr").val(s.r);
	j.find("div.egograph div.egolist input.rr").on("change", function() {
		var newR = jQuery(this).val();
		if (newR.match(/^[0-9]+$/)) {
			jQuery(this).removeClass('error');
			self.r = parseInt(newR, 10);
			if (self.egoID) {
				self.drawAll();
			}
		} else {
			jQuery(this).addClass('error');
		}
	});

	this.svg = d3.select(this.frameID).select("svg");
	this.center = this.svg.append("g");
} // setup()

VizTimeRing.prototype.teardown = function()
{
	var j = jQuery(this.frameID+" div.egograph");
	j.find("div.egolist div.sellist-scroll").off("click");
	j.find("div.egolist input.rr").off("change");
} // teardown()

	// PURPOSE:	Effect click on Record <id>
	// SIDE-FX: Sets TimeRing fields and compiles spokes[]
VizTimeRing.prototype.setEgo = function(id)
{
	var self=this;
	var dAtts=this.settings.dAtts;

		// Ensure no current selection
	this.recSel=[];
	this.vFrame.upSel([], false);

		// Mark no Records rendered -- this is also called in
	this.preRender(false, true);

	var j=jQuery(this.frameID+" div.egograph div.egolist div.sellist-scroll");
	var d=j.find('div.sellist-rec[data-id="'+id+'"]');
		// Ensure that just this item is selected
	j.find("div.sellist-rec").removeClass('active');

		// Abort if ego no longer available in active list
	if (d.length == 0) {
		this.egoID = null;

			// Remove everything
		this.center.selectAll(".bond").remove();
		this.center.selectAll(".node").remove();
		this.center.selectAll(".gnode").remove();
		this.center.selectAll(".ring").remove();

		return;
	}
	d.addClass('active');

	this.egoID = id;

	var drI = _.sortedIndex(this.drs, { id: id }, 'id');
	var dr = this.drs[drI];
	var tI = PData.n2T(dr.ai);
	this.egoAbsI = dr.ai;

		// Mark Ego as rendered
	this.rMap[dr.ai >> 4] |= (1 << (dr.ai & 15));
	this.tUsed[tI] = true;

		// Set time scale domain based on ego's Dates data
	var dAttID = dAtts[tI];
	var dData = dr.r.a[dAttID];
	var start = PData.dObj(dData.min, 1, false);
	var end;
	if (dData.max === 'open') {
		end = TODAY;
	} else {
		end = PData.dObj(dData.max, 12, true);
	}
	this.ts.domain([start, end]);

	var spokes=[];		// { c[olor], d[ate], i[ndex], qr, r[ec of connected] }
	var spots=[];		// "
	var spokeCntr=0;
	this.qrs.forEach(function(thisQR) {
		if (thisQR.e1 === id || thisQR.e2 === id) {
			var connectedID = (thisQR.e1 === id) ? thisQR.e2 : thisQR.e1;
				// Get Record for connected node
			drI = _.sortedIndex(self.drs, { id: connectedID }, 'id');
			dr = self.drs[drI];
			if (typeof thisQR.d.max !== 'undefined') {
				spokes.push({ d: thisQR.d, i: spokeCntr++, qr: thisQR, r: dr });
			} else {
				spots.push({ d: thisQR.d, i: spokeCntr++, qr: thisQR, r: dr });
			}
				// Mark both QR and connected node as rendered
			self.rMap[thisQR.qi >> 4] |= (1 << (thisQR.qi & 15));
		} // QR has ego match
	});
	this.spokes=spokes;
	this.spots=spots;

	this.drawAll();
} // setEgo()

	// PURPOSE: Insert SVG elements according to spokes and ring-radius parameters
VizTimeRing.prototype.drawAll = function()
{
	var self=this;
	var dAttID=prspdata.e.g.qr.d;
	var dAtt=PData.aByID(dAttID);
	var bounds;		// TimeScale domain
	var denom;		// # milliseconds for the Dates Attribute’s grouping size
	var segAngle;	// # degrees between each "spoke"
	var numRings, radius;

		// Ensure no current selection
		// This needs to be here and setEgo as drawAll() can be called directly and setEgo can abort near top
	this.recSel=[];
	this.vFrame.upSel([], false);

		// Remove everything
	this.center.selectAll(".bond").remove();
	this.center.selectAll(".node").remove();
	this.center.selectAll(".gnode").remove();
	this.center.selectAll(".ring").remove();

		// PURPOSE: Utility function that converts spoke # and time to X,Y
	function project(spokeNum, dateField, end) {
		var angle = ((spokeNum * segAngle) - 90) / 180 * Math.PI;
		var date;
		if (end && dateField === 'open') {
			date = TODAY;
		} else {
			date = PData.dObj(dateField, end ? 12 : 1, false);
		}
		var radius = self.ts(date);
		return [radius * Math.cos(angle), radius * Math.sin(angle)];
	} // project()

		// Get size of difference between start and end of time frame of reference
	bounds = this.ts.domain();
	segAngle = 360 / (this.spokes.length+this.spots.length);

		// Set time scale range based on QR-time grouping setting and “lifespan” of ego
	switch (dAtt.r.g) {
	case 'd':
		denom = (60 * 60 * 24 * 1000);		// # milliSecs/day
		break;
	case 'm':
		denom = (60 * 60 * 24 * 1000 * 30.5);	// # milliSecs/month
		break;
	case 'y':
		denom = (60 * 60 * 24 * 1000 * 365);	// # milliSecs/year
		break;
	case 't':
		denom = (60 * 60 * 24 * 1000 * 365 * 10);	// # milliSecs/decade
		break;
	case 'c':
		denom = (60 * 60 * 24 * 1000 * 365 * 100);	// # milliSecs/century
		break;
	}
	numRings = Math.ceil((bounds[1] - bounds[0]) / denom);
	radius = numRings * this.r;
	this.ts.range([10, radius+10]);

	this.svg.attr("width", 24+radius*2).attr("height", 24+radius*2);
	this.center.attr("transform", "translate(" + (radius+12) + "," + (radius+12) + ")");

		// Create rings
	var rings=[];
	for (var i=0; i<numRings; ) {
		rings.push((i++ * this.r)+10);
	}
	var ring = this.center.selectAll(".ring")
		.data(rings)
		.enter()
		.append("circle")
		.attr("class", "ring")
		.attr("r", function(d) { return d; });

		// Ego node
	var pseudoEgo=[0];
	function clickEgo(d)
	{
		var s = self.toggleSel(self.egoAbsI);
		d3.select(this).classed('obj-sel', s);
	} // clickEgo()
	var node = this.center.selectAll(".gnode")
		.data(pseudoEgo)
		.enter()
		.append("circle")
		.attr("class", "gnode")
		.attr("r", "4")
		.attr("fill", "white")
		.on("click", clickEgo);

	function clickQR(d)
	{
		var s = self.toggleSel(d.qr.qi);
		d3.select(this).classed('obj-sel', s);
	} // clickQR()

		// "Spot" (single date) events
    node = this.center.selectAll(".node")
    	.data(this.spots)
    	.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + project(d.i, d.d.min, false) + ")"; });
    node.append("circle")
        .attr("r", "4")
		.attr("fill", function(d) { return d.qr.c; })
		.on("click", clickQR);
	node.append("title")
		.text(function(d) { return d.qr.qr.l; });

	var bond = this.center.selectAll(".bond")
		.data(this.spokes)
		.enter().append("path")
		.attr("class", "bond")
		.attr("stroke", function(d) { return d.qr.c; })
		.attr("d", function(d) {
			return "M" + project(d.i, d.d.min, false)
				+ "L" + project(d.i, d.d.max, true);
		})
		.on("click", clickQR);
	bond.append("title")
		.text(function(d) { return d.qr.qr.l; });
} // drawAll()


	// NOTES:	The render stage actually only compiles data and populates the selection list;
	//				The graph is rendered in response to clicks on the selection list
VizTimeRing.prototype.render = function(stream)
{
		// Compile list of QRs
		//		Both Recs pointed at need to have valid Feature data
		// Compile list of nodes
		//		(1) From the QRs
		//		(2) All nodes appear only once!
		//		(3) Note if they have a necessary Dates Attribute & value
		// Color links by relationships (after ego is selected)
	var self=this;
	var qrrecs=[];			// [ { c[olor], d[ates], e1, e2, qi [absI], qr }]
	var recData=[];			// [ { ai, id, r[ec], d[ates] }]
	var qrconfig=prspdata.e.g.qr;
	var tRec=stream.t[this.qrTI];
	var relI=tRec.i, qI, qrRec;
	var index, i1, id1, id2;
	var dAtts=this.settings.dAtts;
	var dData;
	var rAttID=prspdata.e.g.qr.r;
	var rAtt=PData.aByID(rAttID);
	var featSet = this.vFrame.getSelFeatAtts(0);

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

		// This is also called in drawAll() as may never get that far
	this.preRender(true, true);

		// Display essentially only shows QRs
	this.tUsed[this.qrTI] = true;

		// PURPOSE:	Create or update entry in recData array (kept in order)
		// RETURNS: -1 (if abort), or index in recData
		// INPUT:	id is the Record ID (not an index)
	function addE(id)
	{
		var append = recData.length === 0;
		var absI, i, rec, tI;

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
			if (absI === null) {
				return -1;
			}
			tI = PData.n2T(absI);
				// Ensure that absI is in stream!
			if (PData.nInS(absI, stream, tI) === -1) {
				return -1;
			}
			rec = PData.rByN(absI);
				// Ensure only valid Dates Attribute to provide full lifespan
			var datesVal=null, dTmp;
			var dAttID = dAtts[tI];
			if (dAttID !== null && typeof (dTmp=rec.a[dAttID]) !== 'undefined' && dTmp !== '?'
					&& typeof dTmp.min.y === 'number' && (dTmp.max === 'open' || typeof dTmp.max.y === 'number'))
			{
				datesVal=dTmp;
			}
			if (append) {
				recData.push({ ai: absI, id: id, r: rec, d: datesVal });
			} else {
				recData.splice(i, 0, { ai: absI, id: id, r: rec, d: datesVal });
			}
			return i;
		} // if add
	} // addE()

		// Compile array of QR records
	while (relI < tRec.i+tRec.n) {
		qI = stream.s[relI++];
		qrRec = PData.rByN(qI);
			// Ensure QR has Relationship term that has color value
		var rVal = qrRec.a[rAttID];
		if (typeof rVal !== 'undefined') {
			rVal = PData.lClr(rVal, rAtt, featSet);
			if (rVal) {
					// Ensure QR has valid Date
				if (typeof (dData = qrRec.a[qrconfig.d]) !== 'undefined') {
					id1 = qrRec.a[qrconfig.e1][0];
					index = addE(id1);
					if (index === -1) {
						continue;
					}
					id2 = qrRec.a[qrconfig.e2][0];
					if (addE(id2) === -1) {
						continue;
					}
					qrrecs.push({ c: rVal, d: dData, e1: id1, e2: id2, qi: qI, qr: qrRec });
				} // valid Dates
			} // if rVal
		} // if rVal
	} // while QRs
	this.qrs = qrrecs;
	this.drs = recData;

		// Create index for putting Records in alpha order
	var oIndex=[];
	recData.forEach(function(thisRec, rI) {
		if (thisRec.d !== null) {
			oIndex.push(rI);
		}
	});
	oIndex.sort(function(a,b) {
		return PData.strcmp(recData[b].r.l, recData[a].r.l);
	});

		// Populate selection list with Record labels
	var ip = jQuery(this.frameID).find('div.egograph div.egolist div.sellist-scroll');
	ip.empty();
	oIndex.forEach(function(rI) {
		i1=recData[rI].r;
		ip.append('<div class="sellist-rec" data-id="'+i1.id+'">'+i1.l+'</div>');
	});
	if (this.egoID) {
		this.setEgo(this.egoID);
	}
} // render()

VizTimeRing.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
		// Assumed only 1 pseudo-ego gnode, so <d> isn't used
	this.center.selectAll(".gnode")
			.attr("class", function(d) { return self.isSel(self.egoAbsI) ? 'gnode obj-sel' : 'gnode' });
	this.center.selectAll(".node circle")
			.attr("class", function(d) { return self.isSel(d.qr.qi) ? 'obj-sel' : '' });
	this.center.selectAll(".bond")
			.attr("class", function(d) { return self.isSel(d.qr.qi) ? 'bond obj-sel' : 'bond' });
} // setSel()

VizTimeRing.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		this.center.selectAll(".gnode").attr("class", 'gnode');
		this.center.selectAll(".node circle").attr("class", '');
		this.center.selectAll(".bond").attr("class", 'bond');
	}
} // clearSel()

	// NOTE: No need to save Legend, as always Relationships
VizTimeRing.prototype.getState = function()
{
	return { ego: this.egoID, r: this.r };
} // getState()

VizTimeRing.prototype.setState = function(state)
{
	this.egoID = state.ego;
	this.r = state.r;
	jQuery(this.frameID+" div.egograph div.egolist input.rr").val(state.r);
} // setState()


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
			// If changed Relationship selection, uncheck Roles
		inserted.find('input.filter-qr-use-r1').prop('checked', false);
		inserted.find('input.filter-qr-use-r2').prop('checked', false);
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
