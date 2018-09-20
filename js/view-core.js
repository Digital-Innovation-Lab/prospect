// This file contains:
//		PVizModel abstract Class & implementations for views of individual Records
//		PFilterModal abstract Class & implementations
//		PData Module for handling data


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
	if (this == null) {
	  throw new TypeError('Array.prototype.find called on null or undefined');
	}
	if (typeof predicate !== 'function') {
	  throw new TypeError('predicate must be a function');
	}
	var list = Object(this);
	var length = list.length >>> 0;
	var thisArg = arguments[1];
	var value;

	for (var i = 0; i < length; i++) {
	  value = list[i];
	  if (predicate.call(thisArg, value, i, list)) {
		return i;
	  }
	}
	return -1;
  };
}

	// GLOBAL CONSTANTS
	//=================

	// Prospect sends global signals via jQuery; the following are valid signals (strings, not variables)
	// --------
	// "prsp-loaded" = The data has been fully loaded (via AJAX) and is ready to be processed
	// "prsp-auto" = User has changed state of "Auto-Update" checkbox
	//				(data.a = new state, true or false)
	// "prsp-fdirty" = A filter is "dirty" in the Filter Stack
	//				(data.id = ID of the Filter)
	// "prsp-hilite" = A ViewFrame requests that main app create a Highlight Filter
	//				(data.v = view frame index (0 or 1), data.t = array of booleans of Templates used)

	// Types of chronological events: bit-flags
var EVENT_INSTANT = 1;			// Single instantaneous event (not Date range)
var EVENT_F_START = 2;			// Event has fuzzy start
var EVENT_F_END = 4;			// Event has fuzzy end

var D3FG_BAR_WIDTH 	= 25;		// D3 Graphs created for filters
var D3FG_MARGINS	= { top: 4, right: 7, bottom: 22, left: 30 };

var D3SC_MARGINS	= { top: 30, right: 5, bottom: 5, left: 40 };	// Stacked Chart margins

	// Flags for properties of Visualizations
var V_FLAG_LGND  = 0x01;		// Uses Legend
var V_FLAG_SEL   = 0x02;		// Can select individual Records
var V_FLAG_LOC   = 0x04;		// Requires Location Attributes
var V_FLAG_SLGND = 0x08;		// Single Legend (not Template-specific) with single Attribute
var V_FLAG_OPT   = 0x10;		// Has an Options dialog
var V_FLAG_VSCRL = 0x20;		// Add vertical scroll bar
var V_FLAG_HSCRL = 0x40;		// Add horizontal scroll bar

	// GLOBAL VARS
var TODAY = new Date();
var localD3;					// For localizing D3
var months;						// Array of month names (for localization)
var dlText={};					// Dynamically-loaded text stored in Object
								// .sha = "Show/Hide All", .ok, .cancel, .seerec, .close, .add


// ==============================================================================
// PVizModel: An abstract class to be subclassed by specific visualizations
//		VizModels are responsible for rendering Records, handling selections,
//				indicating visual attributes & tracking used Templates & Records
//		As render() assumes no selection, any code that calls it should first call
//			upSel([], false) for ViewFrame
//		Views must call their ViewFrame when individual Records are de-/selected:
//			vizAddSel(absI)
//			vizDelSel(absI)
//		Views must also call ViewFrame when there is a selection change because of
//				user action or update request via vizAddSel() or vizDelSel():
//			upSel(selectedAbsIList)
//		Views do not have to call upSel() when handling setSel() and clearSel(), as
//			update to ViewFrame has already been done.
//		Instance Variables:
//			vFrame = points to viewFrame
//			frameID = selector string for DIV
//			settings = config params for this visualization
//			recSel = array containing absIndex of selected Records
//			tUsed = boolean array, 1/Template, indicating if any Records of this Template type rendered
//			rMap = bitmap indicating if each Record was rendered on the view
//			-- in case of visualizations that use symbols: --
//				symType = 'C' if default circle markers, 'S' if symbols, 'I' if images
//				symStr = 'circle', 'path' or 'image'
//				sFuncs[] = D3 symbol function (if using symbols), accessed by symbol letter

	// INPUT: 	viewFrame = instance variable returned from ViewModel pseudo-constructor
	//			vizSettings = c section of VF entry
function PVizModel(viewFrame, vizSettings)
{
	this.vFrame 	= viewFrame;
	this.frameID 	= viewFrame.getFrameID()+' div.viz-content div.viz-result';
	this.settings 	= vizSettings;
	this.recSel		= [];		// Array of selected Records kept in order by absIndex
	this.tUsed		= [false, false, false, false];		// true if Records belonging to corresponding Template rendered
	this.rMap 		= null;		// bit map by absIndex tracking whether Record was rendered

		// Utility functions
	// this.preRender()
	// this.tUsed()
	// this.prepSym()
		// Subclasses can override the following:
	// this.getLocAtts(tIndex)
	// this.getFeatureAtts(tIndex)
	// this.teardown()
	// this.isSel(absI)
	// this.getSel()
	// this.toggleSel(absI)
	// this.clearSel()
	// this.resize()
	// this.doOptions()
	// this.getState()
	// this.setState(pData)
	// this.hint()
		// All subclasses must implement the following:
	// this.flags()
	// this.setup()
	// this.render(stream)		// Clears any previous selection, but ViewFrame has already reset GUI
	// this.setSel(absIDs)
} // PVizModel

	// PURPOSE: Describe Visualizations's capabilities
PVizModel.prototype.flags = function()
{
	return 0;
} // flags()

	// PURPOSE: Clear variables used to track use of Templates and Records
	// INPUT:	if initT, then initialize the Template flags
	//			if initR, then initiative the Record flags
	// NOTES: 	Needed by visualizations that render individual Records (not aggregates)
PVizModel.prototype.preRender = function(initT, initR)
{
	var i, rCnt = PData.rSize(), mCnt = Math.floor((rCnt+15)/16);

	if (initT) {
		for (i=0; i<4; i++) {
			this.tUsed[i] = false;
		}
	}
	if (initR) {
		if (this.rMap == null) {
			this.rMap = new Uint16Array(mCnt);
		}
		for (i=0; i<mCnt; i++) {
			this.rMap[i] = 0;
		}
	}
} // preRender()

	// PURPOSE: Determine whether visualization uses symbols, create functions if so
	// INPUT:	s = default pixel size for symbols
PVizModel.prototype.prepSym = function(s)
{
	if (typeof this.settings.ms === 'undefined') {
		this.symType = 'C';
		this.symStr  = 'circle';
	} else {
		switch (this.settings.ms) {
		// case 'C':	// should not be necessary as left undefined in this case
		// 	break;
		case 'S':	// Symbols
			this.symType = 'S';
			this.symStr  = 'path';
			var x=(s*s)/2;
			this.sFuncs = new Array(6);
			this.sFuncs[0] = d3.symbol().type(d3.symbolCircle).size(x);
			this.sFuncs[1] = d3.symbol().type(d3.symbolCross).size(x);
			this.sFuncs[2] = d3.symbol().type(d3.symbolDiamond).size(x);
			this.sFuncs[3] = d3.symbol().type(d3.symbolSquare).size(x);
			this.sFuncs[4] = d3.symbol().type(d3.symbolStar).size(x);
			this.sFuncs[5] = d3.symbol().type(d3.symbolWye).size(x);
			break;
		case 'I':	// Images
			this.symType = 'I';
			this.symStr = 'image';
			break;
		} // switch
	}
} // prepSym()

	// RETURNS: True if record ID is in selected list
PVizModel.prototype.isSel = function(absI)
{
	var i = _.indexOf(this.recSel, absI, true);
	return (i != -1);
} // isSel()

	// RETURNS: Array of absolute IDs of selected records
PVizModel.prototype.getSel = function()
{
	return this.recSel;
} // getSel()

	// PURPOSE: Toggle presence of record (by absolute index) in selection list
	// NOTES: 	Called by VizModel based on user interaction
	// RETURNS: true if didn't exist (added), false if existed (removed)
PVizModel.prototype.toggleSel = function(absI)
{
	var sz = this.recSel.length;
	var i = _.sortedIndex(this.recSel, absI);
	if (this.recSel[i] === absI) {
		this.recSel.splice(i, 1);
		this.vFrame.vizDelSel(absI);			// Inform ViewFrame of single deletion
		this.vFrame.upSel(this.recSel, false);	// Inform ViewFrame of total number
		return false;
	} else {
		this.recSel.splice(i, 0, absI);
		this.vFrame.vizAddSel(absI);			// Inform ViewFrame of single addition
		this.vFrame.upSel(this.recSel, false);	// Inform ViewFrame of total number
		return true;
	}
} // toggleSel()

	// PURPOSE: Clear internal selection list
	// NOTES:	Called via/by ViewFrame, so don't need to inform upSel()
PVizModel.prototype.clearSel = function()
{
	this.recSel = [];
} // clearSel()

PVizModel.prototype.getLocAtts = function(tIndex)
{
	return [];
} // PVizModel.getLocAtts()

PVizModel.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null) {
		return this.settings.lgnds[tIndex];
	}
	return this.settings.lgnds;
} // PVizModel.getFeatureAtts()

PVizModel.prototype.teardown = function()
{
} // PVizModel.teardown()

	// NOTE: resize can get called after Viz created and setup() but before render()
PVizModel.prototype.resize = function()
{
} // PVizModel.resize()

	// PURPOSE: Invoke options modal
PVizModel.prototype.doOptions = function()
{
} // PVizModel.doOptions()

PVizModel.prototype.getState = function()
{
	return {};
} // PVizModel.getState()

	// NOTE: Can be called to load Perspective data after setup() but before render()
PVizModel.prototype.setState = function(state)
{
} // PVizModel.setState()

PVizModel.prototype.hint = function()
{
	return null;
} // PVizModel.hint()


// ===================================
// VizMap: Class to visualize GIS maps
//
// Instance Variables:
//		lMap = Leaflet map object
//		baseMap = basemap layer object
//		bOp = opacity of basemap
//		mapLayers = group map objects
//		lOps = opacities of each overlay map group
//		markerLayer = Leaflet layer for Markers
//		lineLayer = Leaflet layer for connecting lines
//		tLCnt = count of Markers for each Template type

var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // ViewMap

VizMap.prototype = Object.create(PVizModel.prototype);

VizMap.prototype.constructor = VizMap;

VizMap.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC | V_FLAG_OPT;
} // flags()

	// PURPOSE: Return IDs of locate Attributes as array
VizMap.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null) {
		var atts = this.settings.cAtts[tIndex];
		return atts == null ? null : atts;
	}
	return this.settings.cAtts;
} // getLocAtts()

VizMap.prototype.setup = function()
{
	var self=this;

	var centerLat = parseFloat(this.settings.clat);
	var centerLon = parseFloat(this.settings.clon);
	var zoom;
	if (typeof(this.settings.zoom) === 'string')
		zoom = parseInt(this.settings.zoom);
	else
		zoom = this.settings.zoom;

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
	this.lOps = [];		// overlay layers opacities
	this.mapLayers = [];

		// Compile map layer data into mapLayers array and create with Leaflet
	var opacity;
	_.each(this.settings.lyrs, function(layer, lIndex) {
		opacity = layer.o;
		self.lOps.push(opacity*100);

		var newLayer;
		newLayer = PMapHub.createMapLayer(layer.lid, opacity, self.lMap, null);
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

	var markers = L.featureGroup();
	this.markerLayer = markers;

		// Create options properties if they don't already exist
	markers.options = markers.options || { };
	markers.options.layerName = dlText.markers;

	markers.addTo(this.lMap);

	var lines = L.featureGroup();
	this.lineLayer = lines;
	lines.addTo(this.lMap);

		// Maintain number of Loc Atts per Template type
	var numT = PData.eTNum();
	this.tLCnt = new Uint16Array(numT);
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizMap.prototype.render = function(stream)
{
	var self = this;
	var mLayer = this.markerLayer;

		// PURPOSE: Handle click on feature
		// NOTES: 	_aid is absolute index of record, but there can be multiple instances of same record!
		//			This function being within render closure makes it inefficient,
		//				but need access to vFrame!
	function markerClick(e)
	{
		if (e.target && e.target.options) {
			var aid = e.target.options._aid;
			var added = self.toggleSel(aid);

				// Which Template type does absolute index belong to? Does it have multiple location Attributes?
			var tI = PData.n2T(aid);
				// If so, go through all markers looking for fellows of same _aid and setStyle accordingly
			if (self.tLCnt[tI] > 1) {
				mLayer.eachLayer(function(marker) {
					if (marker.options._aid === aid) {
						if (added) {
							marker.setStyle({ color: "yellow", weight: 2 });
							marker.bringToFront();
						} else {
							marker.setStyle({ color: "#000", weight: 1 });
						}
					}
				});
			} else {
				if (added) {
					this.setStyle({ color: "yellow", weight: 2 });
					this.bringToFront();
				} else {
					this.setStyle({ color: "#000", weight: 1 });
				}
			}
		}
	} // markerClick()

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Remove previous Markers
	mLayer.clearLayers();

	var lines = this.lineLayer;
	lines.clearLayers();

	var numTmplts = stream.t.length;
	var i=0, aI, tI=0, tRec, tLClr, rec;
	var fAttID, fAtt, locAtts, featSet, pAttID;
	var locData, fData, newMarker;

	var sAttID, sAtt, minR, maxR, dR, minS, dS;

	minR = this.settings.min;
	if (typeof minR === 'string') {
		minR = parseInt(minR);
	}
	maxR = this.settings.max;
	if (typeof maxR === 'string') {
		maxR = parseInt(maxR);
	}
	dR = maxR - minR;

		// Clear out marker counts
	for (i=0; i<numTmplts; i++) {
		this.tLCnt[i] = 0;
	}

		// If Pointers used, need to cach marker data need to construct links
		//		{ id, c(oordinates)[], p(ointers)[] }
	var mCache;
	for (i=0; i<numTmplts; i++) {
		if (this.settings.pAtts[i] !== 'disable') {
			mCache=[];
			break;
		}
	}

	i=0; tI=-1;
	doStream:
	while (i<stream.l) {
			// Starting with new Template?
		if (locAtts == null) {
			do {
				if (++tI == numTmplts)
					break doStream;
				tRec = stream.t[tI];
			} while (tRec.n === 0 || (tRec.i+tRec.n) === i);

			locAtts = this.vFrame.getSelLocAtts(tI);
				// Skip Template if no locate Atts
			if (locAtts.length === 0) {
				locAtts = null;
				continue;
			} // if no locAtts
			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length === 0) {
				locAtts = null;
				continue;
			} // if no featAtts

			self.tLCnt[tI] = locAtts.length;
			self.tUsed[tI] = true;

				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.aByID(fAttID);

			pAttID = self.settings.pAtts[tI];
			tLClr = self.settings.lClrs[tI];
			sAttID = self.settings.sAtts[tI];
			if (sAttID) {
				sAtt = PData.aByID(sAttID);
				if (typeof sAtt.r.min === 'number' && typeof sAtt.r.max === 'number') {
					minS = sAtt.r.min;
					dS = sAtt.r.max - minS;
				} else
					sAttID = null;
			}
		} // if new Template

			// Get Record data and create cache entry
		aI = stream.s[i];
		rec = PData.rByN(aI);
		var cEntry;
		if (mCache) {
			cEntry={ id: rec.id, c: [], p: rec.a[pAttID], l: tLClr };
		}
			// For each of the locate Attributes
		locAtts.forEach(function(theLAtt) {
			locData = rec.a[theLAtt];
			if (locData) {
				fData = rec.a[fAttID];
				if (typeof fData !== 'undefined') {
					fData = PData.lClr(fData, fAtt, featSet);
					if (fData) {
							// Set bit in rMap corresponding to absIndex
						self.rMap[aI >> 4] |= (1 << (aI & 15));
						if (typeof locData[0] === 'number') {
							if (sAttID) {
								sAtt = rec.a[sAttID];
								if (typeof sAtt === 'number') {
									sAtt = Math.floor(((sAtt-minS)*dR)/dS) + minR;
								} else
									sAtt = minR;
							} else
								sAtt = minR;

							newMarker = L.circleMarker(locData,
								{	_aid: aI, weight: 1, radius: sAtt,
									fillColor: fData, color: "#000",
									opacity: 1, fillOpacity: 1
								});
							if (cEntry)
								cEntry.c.push(locData);
						} else {
							if (locData.length === 2) {
								newMarker = L.polyline(locData,
									{	_aid: aI, weight: 1,
										fillColor: fData, color: "#000",
										opacity: 1, fillOpacity: 1
									});
							} else {
								newMarker = L.polygon(locData,
									{	_aid: aI, weight: 1,
										fillColor: fData, color: "#000",
										opacity: 1, fillOpacity: 1
									});
							}
							if (cEntry) {
								var c=[0, 0];
								locData.forEach(function(l) {
									c[0] += l[0];
									c[1] += l[1];
								});
								c[0] = c[0] / locData.length;
								c[1] = c[1] / locData.length;
								cEntry.c.push(c);
							}
						}
						newMarker.on('click', markerClick);
						mLayer.addLayer(newMarker);
					}
				}
			}
		}); // for locAtts

		if (cEntry && cEntry.c.length > 0) {
			mCache.push(cEntry);
		}
			// Increment stream index -- check if going into new Template
		if (++i == (tRec.i + tRec.n)) {
			locAtts = null;
		}
	} // while

		// Use cache to create connections
	if (mCache) {
		mCache.sort(function(a,b) { return PData.strcmp(b.id, a.id); });
		var links=[];
		mCache.forEach(function(node) {
			if (node.p) {
					// Iterate the node's Pointers
				node.p.forEach(function(aPtr) {
					i = _.sortedIndex(mCache, { id: aPtr }, 'id');
					if (i < mCache.length) {
						var cnct = mCache[i];
						if (cnct.id === aPtr) {
							node.c.forEach(function(from) {
								cnct.c.forEach(function(to) {
									if (from[0] !== to[0] || from[1] !== to[1])
										links.push({p: [from, to], c: node.l });
								})
							})
						}
					}
				});
			}
		});

		links.forEach(function(c) {
			lines.addLayer(L.polyline(c.p, {color: c.c, weight: 2 }));
		});
	} // mCache
} // render()

VizMap.prototype.teardown = function()
{
	var vi = this.vFrame.getIndex();
	jQuery('#view-frame-'+vi+' div.view-controls div.iconbar').remove();
} // teardown()


VizMap.prototype.resize = function()
{
	this.lMap.invalidateSize(false);
} // PVizModel.resize()

VizMap.prototype.clearSel = function()
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

VizMap.prototype.setSel = function(absIArray)
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

VizMap.prototype.getState = function()
{
	return { c: this.lMap.getCenter(), z: this.lMap.getZoom(), l: this.vFrame.getLgndSels() };
} // getState()


VizMap.prototype.setState = function(state)
{
	this.lMap.setView(state.c, state.z);
	this.vFrame.setLgndSels(state.l);
} // setState()

VizMap.prototype.hint = function()
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
VizMap.prototype.doOptions = function()
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
		var oldO=self.lOps[lIndex];
		newBit = jQuery('<div class="op-layer" data-i="'+lIndex+'">'+self.mapLayers[lIndex].options.layerName+
					' <input type=range class="op-slider" min=0 max=100 value='+oldO+' step=5></div>');
		newBit.find(".op-slider").on("change", function() {
			tLOps[lIndex] = jQuery(this).val();
			self.mapLayers[lIndex].setOpacity(tLOps[lIndex]/100);
		});
		tLOps.push(oldO);
		modalOpCtrls.append(newBit);
	});

	function cleanUp()
	{
		if (restore) {
				// Reset opacities in case user changed anything
			self.baseMap.setOpacity(self.bOp/100);
			self.lOps.forEach(function(op, oI) {
				self.mapLayers[oI].setOpacity(op/100);
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


// ================================================
// VizMap2: Class to visualize GIS maps (alternate)
//
// Instance Variables:
//		lMap = Leaflet map object
//		baseMap = basemap layer object
//		bOp = opacity of basemap
//		mapLayers = group map objects
//		lOps = opacities of each overlay map group
//		markerLayer = Leaflet layer for Markers
//		lblLayer = Leaflet layer for Marker labels
//		lineLayer = Leaflet layer for drawing lines between markers

var VizMap2 = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // ViewMap2

VizMap2.prototype = Object.create(PVizModel.prototype);

VizMap2.prototype.constructor = VizMap2;

VizMap2.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC | V_FLAG_OPT;
} // flags()

	// PURPOSE: Return IDs of locate Attributes as array
VizMap2.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null) {
		var atts = this.settings.cAtts[tIndex];
		return atts == null ? null : [atts];
	}
	return [this.settings.cAtts];
} // getLocAtts()

VizMap2.prototype.setup = function()
{
	var self=this;

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

		// Create layer for Marker labels
	var labels = L.featureGroup();
	this.lblLayer = labels;
	labels.addTo(this.lMap);

		// Create layer for connecting lines
	var lines = L.featureGroup();
	this.lineLayer = lines;
	lines.addTo(this.lMap);
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizMap2.prototype.render = function(stream)
{
	var self = this;
	var mLayer = this.markerLayer;

		// PURPOSE: Handle click on feature
		// NOTES: 	_aid is absolute index of record, but there can be multiple instances of same record!
		//			This function being within render closure makes it inefficient,
		//				but need access to vFrame!
	function markerClick(e)
	{
		if (e.target && e.target.options) {
			var aid = e.target.options._aid;
			var added = self.toggleSel(aid);
				// Check to see if this Record's coordinate has multiple points
			var tI = PData.n2T(aid);
			var locAtt = self.vFrame.getSelLocAtts(tI);
			locAtt = locAtt[0];
			var rec=PData.rByN(aid);
			var locData = rec.a[locAtt];

				// If so, go through all markers looking for fellows of same _aid and setStyle accordingly
			if (locData.length > 1) {
				mLayer.eachLayer(function(marker) {
					if (marker.options._aid === aid) {	// ignore labels
						if (added) {
							marker.setStyle({ color: "yellow", weight: 2 });
							marker.bringToFront();
						} else {
							marker.setStyle({ color: "#000", weight: 1 });
						}
					}
				});
			} else {
				if (added) {
					this.setStyle({ color: "yellow", weight: 2 });
					this.bringToFront();
				} else {
					this.setStyle({ color: "#000", weight: 1 });
				}
			}
		}
	} // markerClick()

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Remove previous Markers
	mLayer.clearLayers();

		// Remove previous labels
	this.lblLayer.clearLayers();

		// Remove previous lines
	var lines = this.lineLayer;
	lines.clearLayers();

	var numTmplts = stream.t.length;
	var i=0, aI, tI=0, tRec, tLClr, rec;
	var fAttID, fAtt, locAtt=null, featSet, lbl;
	var locData, fData, newMarker;
	var tClr;

	var sAttID, sAtt, minR, maxR, dR, minS, dS, p0;

	minR = this.settings.min;
	if (typeof minR === 'string') {
		minR = parseInt(minR);
	}
	maxR = this.settings.max;
	if (typeof maxR === 'string') {
		maxR = parseInt(maxR);
	}
	dR = maxR - minR;

	i=0; tI=-1;
	doStream:
	while (i<stream.l) {
			// Starting with new Template?
		if (locAtt === null) {
			do {
				if (++tI === numTmplts)
					break doStream;
				tRec = stream.t[tI];
			} while (tRec.n === 0 || (tRec.i+tRec.n) === i);

			locAtt = this.vFrame.getSelLocAtts(tI);
				// Skip Template if no locate Atts
			if (locAtt.length === 0) {
				locAtt = null;
				continue;
			} // if no locAtt
				// Can only be 1 Attribute
			locAtt = locAtt[0];

			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length === 0) {
				locAtt = null;
				continue;
			} // if no featAtts

			self.tUsed[tI] = true;

				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.aByID(fAttID);

				// Check to see if title colors define for this Template (added in 1.7)
			tClr='';
			if (typeof self.settings.tClrs !== 'undefined') {
				tClr = self.settings.tClrs[tI];
				if (tClr.length > 0) {
					tClr = ' style="color:'+tClr+'"';
				}
			}

			tLClr = self.settings.lClrs[tI];
			sAttID = self.settings.sAtts[tI];
			if (sAttID) {
				sAtt = PData.aByID(sAttID);
				if (typeof sAtt.r.min === 'number' && typeof sAtt.r.max === 'number') {
					minS = sAtt.r.min;
					dS = sAtt.r.max - minS;
				} else {
					sAttID = null;
				}
			}
			lbl = self.settings.lbls[tI];
		} // if new Template

			// PURPOSE: Add a single marker to marker layer
			// INPUT: 	ll = LatLon point
			// ASSUMES: Key variables are set: rec, fData, sAttID, aI
		function addMarker(ll, label)
		{
			if (sAttID) {
				sAtt = rec.a[sAttID];
				if (typeof sAtt === 'number') {
					sAtt = Math.floor(((sAtt-minS)*dR)/dS) + minR;
				} else {
					sAtt = minR;
				}
			} else {
				sAtt = minR;
			}
			newMarker = L.circleMarker(ll,
				{	_aid: aI, weight: 1, radius: sAtt,
					fillColor: fData, color: "#000",
					opacity: 1, fillOpacity: 1
				});
			newMarker.on('click', markerClick);
			mLayer.addLayer(newMarker);
				// Create label? Currently just one style, at the top
			if (label && lbl != 'n') {
				self.lblLayer.addLayer(L.marker(ll, {
					icon: L.divIcon({
						iconSize: null,
						className: 'maplbl',
						html: '<div'+tClr+'>' + rec.l + '</div>'
					})
				}));
			} // if
		} // addMarker()

			// Get Record data and create cache entry
		aI = stream.s[i];
		rec = PData.rByN(aI);
		locData = rec.a[locAtt];
		if (locData) {
			fData = rec.a[fAttID];
			if (typeof fData !== 'undefined') {
				fData = PData.lClr(fData, fAtt, featSet);
				if (fData) {
						// Set bit in rMap corresponding to absIndex
					self.rMap[aI >> 4] |= (1 << (aI & 15));
					if (typeof locData[0] === 'number') {
						addMarker(locData, true);
					} else {
						locData.forEach(function(pt, pI) {
							addMarker(pt, pI === 0);
							if (pI === 0) {
								p0 = pt;
							} else {
								lines.addLayer(L.polyline([p0, pt], {color: tLClr}));
							}
						});
					} // locData is array
				} // if fData
			} // if fData
		} // if locData

			// Increment stream index -- check if going into new Template
		if (++i == (tRec.i + tRec.n)) {
			locAtt = null;
		}
	} // while
} // render()

VizMap2.prototype.teardown = function()
{
	var vi = this.vFrame.getIndex();
	jQuery('#view-frame-'+vi+' div.view-controls div.iconbar').remove();
} // teardown()

VizMap2.prototype.resize = function()
{
	this.lMap.invalidateSize(false);
} // PVizModel.resize()

VizMap2.prototype.clearSel = function()
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

VizMap2.prototype.setSel = function(absIArray)
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

VizMap2.prototype.getState = function()
{
	return { c: this.lMap.getCenter(), z: this.lMap.getZoom(), l: this.vFrame.getLgndSels() };
} // getState()

VizMap2.prototype.setState = function(state)
{
	this.lMap.setView(state.c, state.z);
	this.vFrame.setLgndSels(state.l);
} // setState()

VizMap2.prototype.hint = function()
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
VizMap2.prototype.doOptions = function()
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


// =============================================
// VizCards: Class to visualize records as Cards

var VizCards = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizCards

VizCards.prototype = Object.create(PVizModel.prototype);

VizCards.prototype.constructor = VizCards;

VizCards.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_OPT;
} // flags()

VizCards.prototype.setup = function()
{
	var self = this;

	jQuery(this.frameID).on("click.vf", function(event) {
		if (event.target.nodeName === 'DIV' || event.target.nodeName === 'IMG') {
			var card = jQuery(event.target).closest('div.card');
			if (card.size() == 1) {
				var absI = card.data('ai');
				if (absI != null) {
					var s = self.toggleSel(absI);
					if (s)
						card.addClass("obj-sel");
					else
						card.removeClass("obj-sel");
				}
			}
		}
	});

		// Get default sort Atts -- first item choices
	self.sAtts=[];
	for (var tI=0; tI<PData.eTNum(); tI++) {
		var attID = jQuery('#dialog-sortby select[data-ti="'+tI+'"] :first').val();
		self.sAtts.push(attID);
	}
		// Set menus to these selections
	for (var tI=0; tI<PData.eTNum(); tI++)
		jQuery('#dialog-sortby select[data-ti="'+tI+'"]').val(this.sAtts[tI]);
} // setup()

	// PURPOSE: Draw the Records in the given stream
VizCards.prototype.render = function(stream)
{
	var self = this;

		// Save reference to stream for rerender after sort
	this.stream = stream;

	var numTmplts = stream.t.length;
	var tI, tID, tRec, tDef;
	var fAttID, fAtt, iAttID;
	var oAttID, oAtt, order;
	var featSet, rec, c;
	var hasC, cnt, datum, t, tDiv, tC;

	var thisFrame = jQuery(this.frameID);
	thisFrame.empty();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

	var insert;

	var div = 'w'+this.settings.w+' h'+this.settings.h;

	tRec = stream.t[0]; tI=0;
	while (tI<numTmplts) {
			// Advance until we get to current Template rec
		while (tRec.n === 0) {
				// Have we run out of Templates?
			if (++tI === numTmplts)
				return;
			tRec = stream.t[tI];
		}

		tID = PData.eTByN(tI);
		tDef = PData.tByID(tID);

		featSet = self.vFrame.getSelFeatAtts(tI);
			// Skip Templates if no feature Atts
		if (featSet.length === 0) {
			tRec = stream.t[++tI];
			continue;
		} // if no featAtts

			// Content for this Template type
		iAttID = self.settings.iAtts[tI];
		cnt = self.settings.cnt[tI];

			// Skip Templates if no Image or content
		if (iAttID == null && cnt.length === 0) {
			tRec = stream.t[++tI];
			continue;
		} // if no content

		thisFrame.append('<div class="template-label">'+tDef.l+'</div><div class="cards" data-ti="'+tI+'"></div>');
		insert = jQuery('div.cards[data-ti="'+tI+'"]');

		this.tUsed[tI] = true;		// Template is in play

			// Get Feature Attribute ID and def for this Template
		fAttID = self.vFrame.getSelLegend(tI);
		fAtt = PData.aByID(fAttID);

		oAttID = self.sAtts[tI];
		oAtt = PData.aByID(oAttID);
		order = PData.rTOrder(oAtt, stream, tI);

		order.forEach(function(oRec) {
			rec = PData.rByN(oRec.i);

				// Eval Legend
			datum = rec.a[fAttID];
			if (typeof datum !== 'undefined') {
				c = PData.lRecs(datum, fAtt, featSet, false);

				if (c) {
						// Set Record's bit in bitmap
					self.rMap[oRec.i >> 4] |= (1 << (oRec.i & 15));

					tDiv = self.settings.lOn ? '<div class="card-title">'+rec.l+'</div>' : '';
						// Get and add textual content
					hasC = false; t = '';
					if (cnt && cnt.length > 0) {
						tC = c.b ? ' style="color:black"' : '';
						cnt.forEach(function(theAttID) {
							if (datum = rec.a[theAttID])
								if (datum = PData.procAttTxt(theAttID, datum)) {
									hasC = true;
									t += datum+'<br/>';
								}
						});
					}
						// Any image?
					if (iAttID && (datum = rec.a[iAttID])) {
						if (hasC) {
							if (self.settings.v) {
								t = '<div class="card-body"><img class="full" src="'+datum+'"/>'+t+'</div>';
							} else {
								t = '<div class="card-body flex"><img src="'+datum+'"/><div class="card-cnt"'+tC+'>'+t+'</div></div>';
							}
						} else {
							t = '<div class="card-body flex"><img class="full" src="'+datum+'"/></div>';
						}
					} else {
						t = '<div class="card-body"><div class="card-cnt"'+tC+'>'+t+'</div>';
					}
					insert.append('<div class="card '+div+'" style="background-color:'+c.v+'" data-ai="'+oRec.i+'">'+tDiv+t+'</div>');
				} // if Value-Legend match
			} // if Legend datum
		}); // for order
		tRec = stream.t[++tI];
	} // while
} // render()

VizCards.prototype.teardown = function()
{
	jQuery(this.frameID).off("click.vf");
}

	// PURPOSE: Rerender Cards of Template <tI> after new Sort order given
	// NOTES: 	Must clear previous Template cards and show any selected cards
	//			Do not alter tUsed[] or rMap[] as this just updates Recs already rendered
	// ASSUMES: Can use sAtts[tI]
VizCards.prototype.rerender = function(tI)
{
	var self=this;

	var insert = jQuery(this.frameID + ' div.cards[data-ti="'+tI+'"]');
	insert.empty();

	var featSet, fAttID, fAtt, iAttID, cnt, oAttID, oAtt;
	var order, rec, datum, c;
	var sel, hasC, t, tDiv, tC;

	var div = 'w'+this.settings.w+' h'+this.settings.h;

	featSet = self.vFrame.getSelFeatAtts(tI);
		// Skip Templates if no feature Atts
	if (featSet.length == 0)
		return;

		// Which Attribute chosen for Legend?
	fAttID = self.vFrame.getSelLegend(tI);
	fAtt = PData.aByID(fAttID);
	iAttID = self.settings.iAtts[tI];
	cnt = self.settings.cnt[tI];

	oAttID = self.sAtts[tI];
	oAtt = PData.aByID(oAttID);
	order = PData.rTOrder(oAtt, self.stream, tI);

	order.forEach(function(oRec) {
		rec = PData.rByN(oRec.i);
			// Apply Legend
		datum = rec.a[fAttID];
		if (typeof datum !== 'undefined') {
			c = PData.lRecs(datum, fAtt, featSet, false);
			if (c) {
				tDiv = self.settings.lOn ? '<div class="card-title">'+rec.l+'</div>' : '';
					// Get and add textual content
				hasC = false; t = '';
				if (cnt && cnt.length > 0) {
					tC = c.b ? ' style="color:black"' : '';
					cnt.forEach(function(theAttID) {
						if (datum = rec.a[theAttID])
							if (datum = PData.procAttTxt(theAttID, datum)) {
								hasC = true;
								t += datum+'<br/>';
							}
					});
				}
					// Any image?
				if (iAttID && (datum = rec.a[iAttID])) {
					if (hasC)
						t = '<div class="card-body"><img src="'+datum+'"/><div class="card-cnt"'+tC+'>'+t+'</div></div>';
					else
						t = '<div class="card-body"><img class="full" src="'+datum+'"/></div>';
				} else {
					t = '<div class="card-body"><div class="card-cnt"'+tC+'>'+t+'</div>';
				}
				insert.append('<div class="card '+div+(self.isSel(oRec.i) ? ' obj-sel' : '')+'" style="background-color:'+c.v+'" data-ai="'+oRec.i+'">'+tDiv+t+'</div>');
			} // if Feature-Lgnd match
		} // if feature data
	}); // for order
} // rerender()

VizCards.prototype.doOptions = function()
{
	var self=this;

		// Set menu selections each time dialog shown as dual views share
	this.sAtts.forEach(function(att, tI) {
		jQuery('#dialog-sortby select[data-ti="'+tI+'"]').val(att);
	});

	var d = jQuery("#dialog-sortby").dialog({
		dialogClass: "no-close",
		height: 220,
		width: 400,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
					for (var tI=0; tI<PData.eTNum(); tI++) {
						var sAttID = jQuery('#dialog-sortby select[data-ti="'+tI+'"]').val();
						if (sAttID != self.sAtts[tI]) {
							self.sAtts[tI] = sAttID;
							self.rerender(tI);
						}
					}
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
} // doOptions()

VizCards.prototype.setSel = function(absIArray)
{
	var self=this;
	// var vIndex = this.vFrame.getIndex();
	var absI, t;

	this.recSel = absIArray;

	var rows = jQuery(this.frameID).find('div.card');

	rows.each(function() {
		t = jQuery(this);
		absI = t.data('ai');
		if (absI != null) {
			if (self.isSel(absI))
				t.addClass('obj-sel');
			else
				t.removeClass('obj-sel');
		}
	});
} // setSel()

VizCards.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		jQuery(this.frameID).find('div.card').removeClass('obj-sel');
	}
} // clearSel()

VizCards.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels(), s: this.sAtts };
} // getState()

VizCards.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
	this.sAtts = state.s;
} // setState()


// ====================================================
// VizPinboard: Class to visualize images with overlays

var VizPinboard = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizPinboard

VizPinboard.prototype = Object.create(PVizModel.prototype);

VizPinboard.prototype.constructor = VizPinboard;

VizPinboard.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC | V_FLAG_HSCRL | V_FLAG_VSCRL | V_FLAG_OPT;
} // flags()

	// PURPOSE: Return IDs of locate Attributes as array
VizPinboard.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null) {
		var atts = this.settings.cAtts[tIndex];
		return atts == null ? null : [atts];
	}
	return [this.settings.cAtts];
} // getLocAtts()

VizPinboard.prototype.setup = function()
{
	var s = this.settings;
	var self=this;
	var fI = this.vFrame.getIndex();

	this.bOp = 100;		// base layer opacity
	this.lOps = [];		// overlay layers opacities
	this.settings.lyrs.forEach(function(layer, lIndex) {
		self.lOps.push(layer.o*100);
	});

	this.prepSym(this.settings.min);

	this.xScale = d3.scaleLinear().domain([0, s.iw-1]).range([0, s.dw-1]);
	this.yScale = d3.scaleLinear().domain([0, s.ih-1]).range([0, s.dh-1]);

	this.xAxis = d3.axisTop(this.xScale);
	this.yAxis = d3.axisLeft(this.yScale);

	var svg = d3.select(this.frameID).append("svg")
		.attr("width", s.dw+30+3)
		.attr("height", s.dh+30+2);

	// var defs = svg.append('defs');

	// defs.append("marker")
	// 	.attr("id", "arrowhead")
	// 	.attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
	// 	.attr("refY", 2)
	// 	.attr("markerWidth", 6)
	// 	.attr("markerHeight", 4)
	// 	.attr("orient", "auto")
	// 	.append("path")
	// 		.attr("d", "M 0,0 V 4 L6,2 Z");

	this.chart = svg.append("g")
		.attr("transform", "translate(30,30)");

	this.chart.append("g")
		.attr("class", "x axis")
		.call(this.xAxis);

	this.chart.append("g")
		.attr("class", "y axis")
		.call(this.yAxis);

	this.chart.append("image")
		.attr('id', 'base-'+fI)
		.attr("xlink:href", s.img)
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", s.dh)
		.attr("width", s.dw);

		// Create slots for SVG layers
	this.settings.lyrs.forEach(function(layer, lIndex) {
		self.chart.append("svg")
			.attr('id', 'ol-'+fI+'-'+lIndex)
			.attr("opacity", layer.o);
	});

		// Now try to load SVG files into slots
	this.settings.lyrs.forEach(function(layer, lIndex) {
		d3.xml(layer.url, function(error, docFrag) {
			if (!error) {
				var svgNode = docFrag.getElementsByTagName("svg")[0];
				d3.select('#ol-'+fI+'-'+lIndex).node().appendChild(svgNode);
			}
		});
	});

		// Dragging background
	// this.chart.on("click", function()
	// {
	// 	// d3.event.preventDefault();
	// });

		// Create icon palette
	this.gRecs = this.chart.append('g')
		.attr('id', 'recs');
} // setup

VizPinboard.prototype.render = function(stream)
{
	var self = this;

	function clickPin(d, i)
	{
			// Toggle class
		var s = self.toggleSel(d.ai);
		d3.select(this).classed('obj-sel', s);
	} // clickPin()

		// Remove all previous icons and links
	this.gRecs.selectAll('.cnode').remove();
	this.gRecs.selectAll('.gnode').remove();
	this.gRecs.selectAll('.recline').remove();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

	var numTmplts = stream.t.length;
	var i, aI, tI=0, tRec, tLClr, rec;
	var fAttID, fAtt, locAtts, featSet, pAttID;
	var locData, fData;

	var sAttID, sAtt, minR, maxR, dR, minS, dS;

		// If Pointers used, need to cach marker data need to construct links
		//		{ id, c(oordinates)[], p(ointers)[] }
	var mCache;
	for (i=0; i<numTmplts; i++)
		if (this.settings.pAtts[i] !== 'disable') {
			mCache=[];
			break;
		}

	minR = this.settings.min;
	if (typeof minR === 'string')
		minR = parseInt(minR);
	maxR = this.settings.max;
	if (typeof maxR === 'string')
		maxR = parseInt(maxR);
	dR = maxR - minR;

	var nodes=[];

	i=0; tI=-1;
	doStream:
	while (i<stream.l) {
			// Starting with new Template?
		if (locAtts == null) {
			do {
				if (++tI === numTmplts)
					break doStream;
				tRec = stream.t[tI];
			} while (tRec.n === 0 || (tRec.i+tRec.n) === i);

			locAtts = this.vFrame.getSelLocAtts(tI);
				// Skip Template if no locate Atts
			if (locAtts.length === 0) {
				locAtts = null;
				continue;
			} // if no locAtts
				// Can only be a single Attribute on Pinboards
			locAtts = locAtts[0];
			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length === 0) {
				locAtts = null;
				continue;
			} // if no featAtts
			self.tUsed[tI] = true;
				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.aByID(fAttID);
			pAttID = self.settings.pAtts[tI];
			tLClr = self.settings.lClrs[tI];
			sAttID = self.settings.sAtts[tI];
			if (sAttID) {
				sAtt = PData.aByID(sAttID);
				if (typeof sAtt.r.min === 'number' && typeof sAtt.r.max === 'number') {
					minS = sAtt.r.min;
					dS = sAtt.r.max - minS;
				} else
					sAttID = null;
			}
		} // if new Template

			// Get Record data
		aI = stream.s[i];
		rec = PData.rByN(aI);
		var cEntry;
		if (mCache) {
			cEntry={ id: rec.id, c: null, p: rec.a[pAttID], l: tLClr };
		}

		locData = rec.a[locAtts];
		if (typeof locData !== 'undefined') {
			fData = rec.a[fAttID];
			if (typeof fData !== 'undefined') {
				fData = PData.lClr(fData, fAtt, featSet);
				if (fData) {
					self.rMap[aI >> 4] |= (1 << (aI & 15));
					if (sAttID) {
						sAtt = rec.a[sAttID];
						if (typeof sAtt === 'number') {
							sAtt = Math.floor(((sAtt-minS)*dR)/dS) + minR;
						} else
							sAtt = minR;
					} else
						sAtt = minR;

					nodes.push({ ai: aI, v: fData, x: locData[0], y: locData[1], r: sAtt, rec: rec, t: tI });
					if (cEntry)
						cEntry.c = locData;
				} // if fData
			} // if fData
		} // if locData
		if (cEntry && cEntry.c)
			mCache.push(cEntry);
			// Increment stream index -- check if going into new Template
		if (++i == (tRec.i + tRec.n)) {
			locAtts = null;
		}
	} // while

	var node;
	switch (this.symType) {
	case 'C':	// circles
		node = this.gRecs.selectAll('.cnode')
			.data(nodes)
			.enter()
			.append('circle').attr('class', 'cnode')
			.attr('cx', function(d) { return self.xScale(d.x); })
			.attr('cy', function(d) { return self.yScale(d.y); })
			.attr('r', function(d) { return self.yScale(d.r); })
			.style('fill', function(d) { return d.v; })
			.on('click', clickPin);
		break;
	case 'S':	// symbols
		node = this.gRecs.selectAll('.gnode')
			.data(nodes)
			.enter()
			.append("g")
			.attr("class", "gnode")
			.attr("transform", function(d) { return "translate("+self.xScale(d.x)+","+self.yScale(d.y)+")"; });
		node.append("path")
			.style("fill", function(d) { return d.v; })
			.attr("d", function(d) {
				var f = self.sFuncs[self.settings.syms[d.t]];
				var r = self.xScale(d.r);
					// First set size function
				f.size((r*r)/2);
				return f();
			})
			.on('click', clickPin);
		break;
	case 'I':	// images
		node = this.gRecs.selectAll('.gnode')
			.data(nodes)
			.enter()
			.append("g")
			.attr("class", "gnode")
			.attr("transform", function(d) { return "translate("+self.xScale(d.x)+","+self.yScale(d.y)+")"; });
		node.append("image")
			.attr("xlink:href", function(d) {
				var i = self.settings.iAtts[d.t];
				return i === 'disable' ? '' : d.rec.a[i];
			})
			.attr("x", function(d) { return "-"+(self.xScale(d.r)/2)+"px"; })
			.attr("y", function(d) { return "-"+(self.yScale(d.r)/2)+"px"; })
			.attr("width", function(d) { return self.xScale(d.r)+"px"; })
			.attr("height", function(d) { return self.yScale(d.r)+"px"; })
			.on('click', clickPin);
		break;
	}
	node.append("title")
		.text(function(d) { return d.rec.l; });

		// Use cache to create connections
	if (mCache) {
		mCache.sort(function(a,b) { return PData.strcmp(b.id, a.id); });
		var links=[];
		mCache.forEach(function(node) {
			if (node.p) {
					// Iterate the node's Pointers
				node.p.forEach(function(aPtr) {
					i = _.sortedIndex(mCache, { id: aPtr }, 'id');
					if (i < mCache.length) {
						var cnct = mCache[i];
						if (cnct.id === aPtr)
							links.push({ f: node.c, t: cnct.c, c: node.l });
					}
				});
			}
		});

		this.gRecs.selectAll('.recline')
			.data(links)
			.enter()
			.append('line').attr('class', 'recline')
			.attr('x1', function(d) { return self.xScale(d.f[0]); })
			.attr('y1', function(d) { return self.yScale(d.f[1]); })
			.attr('x2', function(d) { return self.xScale(d.t[0]); })
			.attr('y2', function(d) { return self.yScale(d.t[1]); })
			.attr('stroke', function(d) { return d.c; });
	} // mCache
} // render()

VizPinboard.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		switch (this.symType) {
		case 'C':
			this.gRecs.selectAll('.cnode').classed('obj-sel', false);
			break;
		case 'S':
		case 'I':
			this.gRecs.selectAll('.gnode '+this.symStr).classed('obj-sel', false);
		}
	}
} // clearSel()

VizPinboard.prototype.setSel = function(absIArray)
{
	var self = this;

	this.recSel = absIArray;
	switch (this.symType) {
	case 'C':
		this.gRecs.selectAll('.cnode').classed('obj-sel', function(d) {
			return self.isSel(d.ai);
		});
		break;
	case 'S':
	case 'I':
		this.gRecs.selectAll('.gnode '+this.symStr).classed('obj-sel', function(d) {
			return self.isSel(d.ai);
		});
		break;
	}
} // setSel()

	// NOTE: Since the opacities dialog is shared, GUI must be recreated
	//			by each Viz object and cleaned up afterwards
VizPinboard.prototype.doOptions = function()
{
	var self=this;
	var fI=this.vFrame.getIndex();
	var tBOp=this.bOp, tLOps=[];
	var restore=true;

		// Have to set up options dialog on each open
	var layerPt = jQuery('#dialog-opacities div.layer-list');

	var newBit = jQuery('<div class="op-layer" data-i="-1">Base Image <input type=range class="op-slider" min=0 max=100 value='+
						this.bOp+' step=5></div>');
	newBit.find(".op-slider").on("change", function() {
		tBOp = jQuery(this).val();
		d3.select('#base-'+fI).attr('opacity', tBOp/100);
	});
	layerPt.append(newBit);

	this.lOps.forEach(function(lOp, lIndex) {
		newBit = jQuery('<div class="op-layer" data-i="'+lIndex+'">Overlay '+(lIndex+1)+
						' <input type=range class="op-slider" min=0 max=100 value='+lOp+' step=5></div>');
		newBit.find(".op-slider").on("change", function() {
			tLOps[lIndex] = jQuery(this).val();
			d3.select('#ol-'+fI+'-'+lIndex).attr('opacity', tLOps[lIndex]/100);
		});
		tLOps.push(lOp);
		layerPt.append(newBit);
	});

	function cleanUp()
	{
		if (restore) {
				// Reset opacities in case user changed anything
			d3.select('#base-'+fI).attr('opacity', self.bOp/100);
			self.lOps.forEach(function(lOp, lIndex) {
				d3.select('#ol-'+fI+'-'+lIndex).attr('opacity', lOp/100);
			});
		}
		layerPt.empty();
	} // restoreOps()

	var d = jQuery("#dialog-opacities").dialog({
		dialogClass: "no-close",
		height: 300,
		width: 320,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					restore=false;
					d.dialog("close");
					self.bOp = tBOp;
					tLOps.forEach(function(lOp, lIndex) {
						self.lOps[lIndex] = lOp;
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

VizPinboard.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizPinboard.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizPinboard.prototype.hint = function()
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


// ===============================================
// VizTime: Class to visualize Records on Timeline
//
// Instance Variables:
//		threshold = point at which months begin to appear in labels
//		brush = D3 brush object
//		brushSVG = SVG element created for brush
//		minDate = minimum Date on macro band
//		maxDate = maximum Date on macro band
//		zMinDate = minimum Date on zoom band
//		zMaxDate = maximum Date on zoom band
//		instGap = width of "instantaneous" event on macro band in Date terms
//		chart = SVG containing entire Timeline
//		instRad = pixel radius of instantaneous circle
//		bands[2] = Array of Objects containing parameters for each band (macro and zoom)
//			see createBand() for details
//		cmpnts[] = Array of GUI components to draw
//			axisDraw, yLabeler, mLabeler
//		events[] = all Record event data
//		lgBds = Date Legend Backgrounds: { s[tart], e[nd], t[top track #], h[eight], d[ata in Legend rec] }

var VizTime = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizTime

VizTime.prototype = Object.create(PVizModel.prototype);

VizTime.prototype.constructor = VizTime;

VizTime.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC | V_FLAG_VSCRL;
} // flags()

	// PURPOSE: Return IDs of locate Attributes
VizTime.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null) {
		var atts = this.settings.dAtts[tIndex];
		return atts == null ? null : [atts];
	}
	return [this.settings.dAtts];
} // getLocAtts()

	// RETURNS: Pixel width available for the various containers:
	//              0 = total width (ViewFrame), 1 = svg container (tl-vf)
	// NOTES:   Must account for margins of outer container (inc. scrollbar) and margins of inner container
	// TO DO: 	Push rects instead of widths?
VizTime.prototype.getWidths = function()
{
			// svgMargin is space between viz-result and tl-vf
	var svgMargin = { top: 2, right: 2, bottom: 2, left: 2 };

	var widths = [];

	var curWidth = jQuery(this.frameID).width();

		// Total width of view frame
	widths.push(curWidth);
		// Width of svg-container
	var svgWidth = curWidth - (svgMargin.left + svgMargin.right);
	widths.push(svgWidth);

		// Automatically recompute
	this.threshold  = svgWidth / (this.settings.xLbl*6.25);

	return widths;
} // getWidths()

VizTime.prototype.setup = function()
{
	var self = this;

	if (typeof this.settings.xLbl !== 'number') {
		this.settings.xLbl = parseInt(this.settings.xLbl);
	}

	this.brush = null;
	this.brushSVG = null;

		// PURPOSE: Handle clicks for entire band, find appropriate object
	// function clickBand()
	// {
	// 	var t = d3.select(d3.event.target);
	// 	if (t.attr("class") == null || !t.attr("class").includes('event'))
	// 		t = d3.select(d3.event.target.parentNode);
	// 	var d;
	// 	if (d = t.datum())
	// 	{
	// 		var s = self.toggleSel(d.ai);
	// 		t.classed('obj-sel', s);
	// 		d3.event.preventDefault();
	// 	}
	// } // clickBand()

	var s = this.settings;

	if (typeof s.bHt === 'string') {
		s.bHt = parseInt(s.bHt, 10);
	}

		// Compute min-max Macro date range
	(function() {
		var minY, minM, minD, maxY, maxM, maxD;

			// By default, use min & max time bounds from Dates Attributes
		s.dAtts.forEach(function(dAttID) {
			if (dAttID != null && dAttID !== 'disable') {
				var dAtt = PData.aByID(dAttID);
				if (dAtt) {
						// Check mins
					if (minY == null || dAtt.r.min.y < minY) {
						minY = dAtt.r.min.y;
						if (typeof dAtt.r.min.m !== 'undefined') {
							minM = dAtt.r.min.m;
							if (typeof dAtt.r.min.d !== 'undefined')
								minD = dAtt.r.min.d;
							else
								minD = 1;
						} else {
							minM = 1; minD = 1;
						}
					} else if (dAtt.r.min.y === minY) {
						if (typeof dAtt.r.min.m !== 'undefined') {
							if (dAtt.r.min.m < minM) {
								minM = dAtt.r.min.m;
								if (typeof dAtt.r.min.d !== 'undefined')
									minD = dAtt.r.min.d;
								else
									minD = 1;
							} else if (dAtt.r.min.m === minM) {
								if (typeof dAtt.r.min.d !== 'undefined') {
									if (dAtt.r.min.d < minD)
										minD = dAtt.r.min.d;
								}
							}
						}
					}
						// Check maxs
					if (maxY == null) {
						if (typeof dAtt.r.max.y === 'undefined') {
							maxY = TODAY.getUTCFullYear();
							maxM = TODAY.getMonth() + 1;
							maxD = TODAY.getDate();
						} else {
							maxY = dAtt.r.max.y;
							if (typeof dAtt.r.max.m !== 'undefined') {
								maxM = dAtt.r.max.m;
								if (typeof dAtt.r.max.d !== 'undefined')
									maxD = dAtt.r.max.d;
								else
									maxD = PData.lenMnth(maxY, maxM);
							} else {
								maxM = 12; maxD = 31;
							}
						}
					} else if (dAtt.r.max.y > maxY) {
						maxY = dAtt.r.max.y;
						if (typeof dAtt.r.max.m !== 'undefined') {
							maxM = dAtt.r.max.m;
							if (typeof dAtt.r.max.d !== 'undefined')
								maxD = dAtt.r.max.d;
							else
								maxD = PData.lenMnth(maxY, maxM);
						} else {
							maxM = 12; maxD = 31;
						}
					} else if (dAtt.r.max.y === maxY) {
						if (typeof dAtt.r.max.m !== 'undefined') {
							if (dAtt.r.max.m > maxM) {
								maxM = dAtt.r.max.m;
								if (typeof dAtt.r.max.d !== 'undefined')
									maxD = dAtt.r.max.d;
								else
									maxD = PData.lenMnth(maxY, maxM);
							} else if (dAtt.r.max.m === maxM) {
								if (typeof dAtt.r.max.d !== 'undefined') {
									if (dAtt.r.max.d > maxD)
										maxD = dAtt.r.max.d;
								}
							}
						}
					}
				} // if dAtt
			} // dAttID valid
		});

			// Override default min & max bounds?
		if (s.from.length > 0) {
			self.minDate = PData.dStr(s.from, false);
		} else {
			self.minDate = PData.d3Nums(minY, minM, minD, false);
		}
		if (s.to.length > 0) {
			self.maxDate = PData.dStr(s.to, true);
		} else {
			self.maxDate = PData.d3Nums(maxY, maxM, maxD, true);
		}
			// Size of instananeous event: 1.5% of total time period space
		self.instGap = (self.maxDate - self.minDate) * .015;
	})();

		// Create outer SVG container
	var widths = self.getWidths();

	var svg = d3.select(this.frameID).append("svg")
		.attr("class", "tl-vf")
		.attr("width", widths[1]);

		// Create SVG definitions
	(function() {
			// Get all unique Legend Attribute IDs
		var lAttIDs=[];
		s.lgnds.forEach(function(tArray) {
			tArray.forEach(function(lAttID) {
				lAttIDs.push(lAttID);
			});
		});
		lAttIDs = _.uniq(lAttIDs);

			// Gather all color values for all possible Legends
		var cVals=[];
		lAttIDs.forEach(function(lAttID) {
			var att = PData.aByID(lAttID);
			if (att) {
				att.l.forEach(function(lVal) {
					cVals.push(lVal.v);
				});
			}
		});
		cVals = _.uniq(cVals);
		cVals.sort();

			// Create gradations for fuzzy dates
		var defs = svg.append('defs');
		var gradDef, name;

		cVals.forEach(function(cVal) {
				// First entry for Legend is "header", no color info
			name = cVal.substr(1);
				// Create three variants of each color
			gradDef = defs.append('linearGradient').attr('id', name+'-fs');
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', '#C0C0C0');
			gradDef.append('stop').attr('offset', '5%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', cVal);
			gradDef = defs.append('linearGradient').attr('id', name+'-fe');
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '95%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', '#C0C0C0');
			gradDef = defs.append('linearGradient').attr('id', name+'-fb');
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', '#C0C0C0');
			gradDef.append('stop').attr('offset', '5%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '95%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', '#C0C0C0');
		});

			// The XOR filter ensures that text contrasts with any background
			// TO DO: Not quite working properly...
		// var filter = defs.append('filter')
		// 	.attr('id', 'xortext');
		// filter.append('feComposite')
		// 	.attr('operator', "xor");
	})();

		// Create further SVG elements (will resize later)
	var vI = this.vFrame.getIndex();

		// Clip all graphics to inner area of chart
	svg.append("clipPath")
		.attr("id", "tl-clip-"+vI)
		.append("rect")
		.attr("width", widths[1]);

	self.chart = svg.append("g")
		.attr("class", "chart")
		.attr("clip-path", "url(#tl-clip-"+vI+")");

		// Calculate other Timeline Object variables
	self.instRad = (s.bHt / 2) - 1; // pixel radius of instantaneous circle

		// Prepare band info
	self.bands = Array(2);

	self.cmpnts=[];		// GUI components to draw & refresh

		// PURPOSE: Create macro & zoom bands
		// INPUT: 	bi = 0 for top macro band, b1 for lower zoom band
	function createBand(bi)
	{
			// Create band record (w/ placeholders); NOTE: Band frame includes axis
			//	l = left pixel position for left side of band frame
			//	t = top pixel position for band frame
			//	h = pixel height of band frame (not inc x axis and labels)
			//	w = pixel width of inner (drawable portion of) band
			//	svgID = unique ID for band's svg container
			//	tHt = total pixel height of each track
			//	iHt = pixel height of item drawn within track
			//	xScale = D3 scale for xAxis
			//	yScale = function to provide Y position of track
			//	parts = drawable components in band
			//	g = SVG created by D3 to contain band
			//	labels = year/month label definitions
			//	labelSVGs = SVGs created by D3 for labels
			//	redraw = function for drawing band (set up for closure in render)
		var band = {	id: bi, l: 0, t:0, h:0, w: widths[1],
						svgID: "#tl-b-"+vI+"-"+bi,
						tHt: 0, iHt: 0,
						xScale: d3.scaleTime(),
						yScale: function(t) { return t * band.tHt; },
						parts: [],
						g: null,
						labels: null, labelSVGs: null,
						redraw: function() { }
					};

			// Bottom zoom view?
		if (bi) {
			band.tHt = self.settings.bHt;
			band.iHt = band.tHt-2;

			// Top macro band?
		} else {
			band.tHt = 3;
			band.iHt = 2;
		}

		if (bi === 1)
		{
			var zMin=self.minDate, zMax=self.maxDate;
			if (self.settings.zFrom.length > 0)
				zMin = PData.dStr(self.settings.zFrom, false);
			if (self.settings.zTo.length > 0)
				zMax = PData.dStr(self.settings.zTo, true);
			band.xScale.domain([zMin, zMax]);
			self.zMinDate = zMin;
			self.zMaxDate = zMax;
		} else {
			band.xScale.domain([self.minDate, self.maxDate]);
		}
		band.xScale.rangeRound([0, band.w]);

			// Create a div for this band
		band.g = self.chart.append("g")
			.attr("id", band.svgID.substring(1))
			.attr("class", "tl-band")
			.attr("width", band.w);

		// if (bi == 1)
		// 	band.g.on("click", clickBand);

			// Save all band data
		self.bands[bi] = band;
		self.cmpnts.push(band);
	} // createBand()

	createBand(0);
	createBand(1);

	function createXAxis(bi)
	{
		var band = self.bands[bi];

			// Create the D3 object for axis
		var axis = d3.axisBottom(band.xScale);

				// For now, let D3 determine what label to show -- below is alternative DIY logic
				// This version (below) *does* look better for dates < 1000 CE
			// .tickFormat(function (d) {
			//     var dates = band.xScale.domain();
			//     var timeDiff = dates[1].getFullYear() - dates[0].getFullYear();
			//         // What to print on label depends on scale of time periods
			//         // Have tried to use reasonable heuristic
			//     if (timeDiff > self.threshold) {
			//         return d.getUTCFullYear();
			//     } else {
			//         timeDiff = (timeDiff*12)+(dates[1].getMonth() - dates[0].getMonth());
			//         if (timeDiff > self.threshold) {
			//             return months[d.getMonth()];
			//         } else {
			//             return d.getDate();
			//         }
			//     }
			// } )
			// ;

			// Do we need to localize the axis labels?
		if (localD3) {
			axis.tickFormat(localD3);
		}

			// Create SVG components
		var axisSVG = band.g.append("g")
			.attr("id", 'axis-'+vI+'-'+bi)
			.attr("class", "axis")
			.style("font-size", '10px');

		var axisDraw = {};

			// PURPOSE: Draw itself when called
		axisDraw.redraw = function () {
			axisSVG.call(axis);
		};

		band.parts.push(axisDraw); // for brush.redraw
		self.cmpnts.push(axisDraw); // for timeline.redraw
	} // createXAxis()

	createXAxis(0);
	createXAxis(1);

	function createLabels(bi)
	{
		var band = self.bands[bi];

		var labelH;
			// Zoom band has double height labels
		if (bi === 1) {
			labelH = 32;
		} else {
			labelH = 16;
		}

			// The data associated with Labels
		var sLbl = { 	name: 's-'+vI+'-'+bi,
						x: function() { return 0; },
						left: function() { return 0; },
						anchor: 'start',
						tDelta: 2,
						whichDate: function(min, max) { return min; }
					};
		var eLbl = {	name: 'e-'+vI+'-'+bi,
						x: function() { return band.l + band.w; },
						left: function() { return band.l + band.w - self.settings.xLbl; },
						anchor: 'end',
						tDelta: -3,
						whichDate: function(min, max) { return max; }
					};
		band.labels = [sLbl, eLbl];

			// Create graphic container for labels just below main chart space
			// These only specify vertical dimension -- occupy entire width
		var bLblSVGs = d3.select(band.svgID).selectAll(".bLblCntr")
				// Create "g" for each of the start & end labels
			.data(band.labels)
			.enter().append("g")
			.attr("class", "bLblCntr");

			// Create containing rects for labels
		bLblSVGs.append("rect")
			.attr("class", "bLbl")
			.attr("id", function(l) { return "rect-"+l.name; } )
			.attr("x", function(l) { return l.left(); })
			.attr("width", self.settings.xLbl)
			.attr("height", labelH);
			// .style("opacity", 1);

			// Add textual features for labels
		var yLabels = bLblSVGs.append("text")
			.attr("class", 'bMinMaxLbl')
			.attr("id", function(l) { return "txt-"+l.name; } )
			.attr("x", function(l) { return l.x()+l.tDelta; } )
			.attr("y", 12)
			.attr("text-anchor", function(l) { return l.anchor; });

		var yLabeler={};

			// Needs to know how to draw itself
		yLabeler.redraw = function()
		{
			var dVals = band.xScale.domain();
			var min = dVals[0],
				max = dVals[1];

				// This will be called for each label in turn
			yLabels.text(function(l) {
				return l.whichDate(min,max).getUTCFullYear();
			});
		}; // redraw()

			// Add initial labels to components needed to be drawn
		band.parts.push(yLabeler);
		self.cmpnts.push(yLabeler);

			// If creating zoom band, need to add text features for months
		if (bi === 1) {
			var mLabels = bLblSVGs.append("text")
				.attr("class", 'bMinMaxLbl')
				.attr("id", function(l) { return 'm-txt-'+l.name; } )
				.attr("x", function(l) { return l.x()+l.tDelta; } )
				.attr("y", labelH-4)
				.attr("text-anchor", function(l) { return l.anchor; });

			var mLabeler={};

				// Needs to know how to draw itself
			mLabeler.redraw = function()
			{
				mLabels.attr("x", function(l) { return l.x()+l.tDelta; } );

				var dVals = band.xScale.domain();
				var min = dVals[0],
					max = dVals[1];

				mLabels.text(function(l) {
					var diff = max.getUTCFullYear() - min.getUTCFullYear();
					if (diff > self.threshold) {
						return '';
					} else {
						return months[l.whichDate(min,max).getMonth()];
					}
				});
			}; // redraw()

				// Add additional labels to components needed to be drawn
			band.parts.push(mLabeler);
			self.cmpnts.push(mLabeler);
		} // if zoom

			// Need to store these labels in the band for redrawing on resize
		band.labelSVGs = bLblSVGs;
	} // createLabels()

	createLabels(0);
	createLabels(1);
} // setup()

	// PURPOSE: Draw the Records in the given datastream
VizTime.prototype.render = function(stream)
{
		// PURPOSE: Compare two dates for descending sort
	function compDesc(i1, i2) {
		var r = i1.s - i2.s;
			// later first
		if (r < 0) { return 1; }
		if (r > 0) { return -1; }
			// shorter time period first (if equal start)
		r = i2.e - i1.e;
		if (r < 0) { return 1; }
		if (r > 0) { return -1; }
		return 0;
	} // compDesc()

	var self = this;
	var vI = this.vFrame.getIndex();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

	this.events=[];		// All event data
	this.lgBds=[];		// Date Legend Backgrounds: { s[tart], e[nd], t[top track #], h[eight], d[ata in Legend rec] }

	var numTracks=0;

		// Process each Template's data
	(function () {
		var numTmplts = stream.t.length;
		var tI=0, tRec, aI;
		var featSet, dAttID, dAtt, fData, dData;
		var fAtt, fAttID;

			// Process the Date data by each Template type
		while (tI<numTmplts) {
			tRec = stream.t[tI];
				// Advance until we get to current Template rec
			while (tRec.n === 0) {
					// Have we run out of Templates?
				if (++tI == numTmplts)
					return;
				tRec = stream.t[tI];
			}

				// only 1 Location Attribute possible - skip if not selected
			featSet = self.vFrame.getSelLocAtts(tI);
			if (featSet.length === 0) {
				tI++;
				continue;
			}

			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length === 0) {
				tI++;
				continue;
			}
			self.tUsed[tI] = true;

				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.aByID(fAttID);
			dAttID = self.settings.dAtts[tI];

			var y, m, d;
			var s, e, f, l;
			var rec;

				// Event records { s[tart], e[nd], ai, f[lags], c[olor data], l[abel], t[rack] }
			var te=[];

			for (var i=tRec.i; i<(tRec.i+tRec.n); i++) {
				aI = stream.s[i];

				rec = PData.rByN(aI);
				fData = rec.a[fAttID];
					// Valid Legend data?
				if (typeof fData !== 'undefined') {
						// dData will either be object, '?' or undefined
					if ((dData = rec.a[dAttID]) && (dData !== '?')) {
						f = dData.min.f ? EVENT_F_START : 0;
						y = dData.min.y;
						if (typeof dData.min.m === 'undefined') {
							m = 1; d = 1;
						} else {
							m = dData.min.m;
							if (typeof dData.min.d === 'undefined') {
								d = 1;
							} else {
								d = dData.min.d;
							}
						}
						s = PData.d3Nums(y,m,d,false);
							// Instaneous event
						if (typeof dData.max === 'undefined') {
								// Only keep if within macro range
							if (s >= self.minDate && s <= self.maxDate) {
								f |= EVENT_INSTANT;
								e = s.getTime() + self.instGap;
									// Can we find a valid Legend color?
								if (fData = PData.lRecs(fData, fAtt, featSet, false)) {
									self.rMap[aI >> 4] |= (1 << (aI & 15));
									te.push({ s: s, e: e, ai: aI, f: f, c: fData, l: rec.l, t: 0 });
								}
							}

							// Date range
						} else {
							if (dData.max === 'open') {
								e = TODAY;
							} else {
								if (dData.max.f) {
									f |= EVENT_F_END;
								}
								y = dData.max.y;
								if (typeof dData.max.m === 'undefined') {
									m = 12; d = 31;
								} else {
									m = dData.max.m;
									if (typeof dData.max.d === 'undefined')
										d = PData.lenMnth(y, m);
									else
										d = dData.max.d;
								}
								e = PData.d3Nums(y,m,d,true);
							} // number
							if (e >= self.minDate && s <= self.maxDate) {
									// Can we find a valid Legend color?
								if (fData = PData.lRecs(fData, fAtt, featSet, false)) {
										// Ensure Left end of band (start) is visible so label not invisible
									s = Math.max(self.minDate, s);
									self.rMap[aI >> 4] |= (1 << (aI & 15));
									te.push({ s: s, e: e, ai: aI, f: f, c: fData, l: rec.l, t: 0 });
								}
							} // start and end in range
						} // date range
					} // has valid Date data
				} // has Legend value
			} // for
			te.sort(compDesc);

			var tracks = [];
			var n;

				// Lay events out on tracks: older items end deeper
			te.forEach(function(v) {
					// Find the first track where it fits
				for (n=0; n<tracks.length; n++) {
						// First check to see if track has any value
					if (v.e < tracks[n]) {
						break;
					}
				}
					// Record track that event "fits" into (skipping top label slot)
				v.t = n+numTracks+1;
					// Record relevant time period in track -- this will append to array if at end
				tracks[n] = v.s;
			});

				// Process Date Legend Background data
			dAtt = PData.aByID(dAttID);
			dAtt.l.forEach(function(lEntry) {
				l = lEntry.d;
				y = l.min.y;
				if (typeof l.min.m === 'undefined') {
					m = 1; d = 1;
				} else {
					m = l.min.m;
					if (typeof l.min.d === 'undefined')
						d = 1;
					else
						d = l.min.d;
				}
				s = PData.d3Nums(y,m,d,false);
				if (typeof l.max.y === 'undefined') {
					e = TODAY;
				} else {
					y = l.max.y;
					if (typeof l.max.m === 'undefined') {
						m = 12; d = 31;
					} else {
						m = l.max.m;
						if (typeof l.max.d === 'undefined')
							d = PData.lenMnth(y, m);
						else
							d = l.max.d;
					}
					e = PData.d3Nums(y,m,d,true);
				}
				self.lgBds.push({s: s, e: e, t: numTracks, h: tracks.length+1, d: lEntry });
			});

				// Add track position for Template legend labels
			numTracks += tracks.length+1;
				// Append event data
			self.events = self.events.concat(te);

			tI++;
		} // while
	}());

	var widths = self.getWidths();

		// PURPOSE: Update macro & zoom band info based on track data
		// INPUT: 	i = 0 for top macro band, 1 for lower zoom band
	function updateBand(bi)
	{
		function eventClass(d)
		{
			if (d.f & EVENT_INSTANT) {
				return "event instant";
			} else {
				return "event range";
			}
		} // eventClass()

			// NOTE: Only zoom band responds to click
		function clickEvent(d)
		{
			var s = self.toggleSel(d.ai);
			d3.select(this).classed('obj-sel', s);
		} // clickEvent()

			// Band specific parameters for instantaneous events
		var instCX, instCY, instR, instLX;

			// Create record about band
		var band = self.bands[bi];

			// Bottom zoom view?
		if (bi) {
			var macroBand = self.bands[0];

			band.t = macroBand.t + macroBand.h + 37;

			instCX = instCY = instR = self.instRad;
			instLX = (self.instRad*2)+3

			// Top macro band?
		} else {
			band.t = 0;

			instCX = instCY = instR = 1;
		}
		band.h = (numTracks * band.tHt) + 2;

			// Update band's vertical position and size
		band.g.attr("transform", "translate(0," + band.t +  ")")
			.attr("height", band.h);

			// Only bottom zoom band will have text labels -- compute relative size and position
		var fHt, fPos;
		if (bi) {
			fHt = (band.iHt*.75) +'px';
			fPos = band.iHt*.80;
		}

		var allLgBds;

			// Remove previous Legend Backgrounds
		allLgBds = d3.select(band.svgID).selectAll(".lgBd").remove();

			// Create svg's for all of Legend Backgrounds
		allLgBds = d3.select(band.svgID).selectAll(".lgBd")
			.data(self.lgBds)
			.enter().append("svg")
			.attr("class", "lgBd")
			.attr("y", function(d) { return band.yScale(d.t); })
			.attr("height", function(d) { return band.yScale(d.h); });
		allLgBds.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", function(d) { return d.d.v; });
		if (bi === 1) {
			allLgBds.append("text")
				.attr("class", "lgBdLbl")
				.attr("x", 2)
				.attr("y", fPos)
				.attr("fill", function(d) { return d.d.b ? "#000000" : "#FFFFFF"; })
				.style("font-size", fHt)
				.text(function (d) {
					return d.d.l;
				});
		}

		var allEs;

			// Remove all events in this band
		d3.select(band.svgID).selectAll(".event").remove();

			// Create svg's for all of the time events in the band with appropriate height and class
			//  -- will finish specifying data for each below
		allEs = d3.select(band.svgID).selectAll(".event")
			.data(self.events)
			.enter().append("svg")
			.attr("class", eventClass)
			.attr("y", function (d) { return band.yScale(d.t); })
			.attr("height", band.iHt);

		if (bi === 1) {
			allEs.on("click", clickEvent);
		}

			// Complete specifying data for date ranges
		var ranges = d3.select(band.svgID).selectAll(".range");
			// Solid rectangle to fill interval with color
		ranges.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", function(d) {
					// check to see if fuzzy start or end
				if (bi === 1 && (d.f & (EVENT_F_START|EVENT_F_END))) {
						// both?
					if ((d.f & (EVENT_F_START|EVENT_F_END)) === (EVENT_F_START|EVENT_F_END)) {
						return 'url('+d.c.v+'-fb)';
					} else if ((d.f & EVENT_F_START) === EVENT_F_START) {
						return 'url('+d.c.v+'-fs)';
					} else {
						return 'url('+d.c.v+'-fe)';
					}
				} else {
					return d.c.v;
				}
			});

			// Label for range -- zoom band only
		if (bi === 1) {
			ranges.append("text")
				.attr("class", "rangeLbl")
				.attr("x", 4)
				.attr("y", fPos)
				.attr("fill", function(d) {
					return d.c.b ? "#000000" : "#FFFFFF";
				})
				.style("font-size", fHt)
				.text(function (d) {
					return d.l;
				});
		}

			// Finish specifying data for instantaneous events
		var instants = d3.select(band.svgID).selectAll(".instant");
			// Create circle for these
		instants.append("circle")
			.attr("cx", instCX)
			.attr("cy", instCY)
			.attr("r", instR)
			.attr("fill", function(d) {
				return d.c.v;
			});

			// Labels on zoom band only
		if (bi === 1) {
				// Create label
			instants.append("text")
				.attr("class", "instantLbl")
				.attr("x", instLX)
				.attr("y", fPos)
				.style("font-size", fHt)
					// XOR filter not quite working...
				// .style('filter', "url(#xortext)")
				.text(function (d) {
					return d.l;
				});
		}

			// Item needs to know how to draw itself (will be called)
			// Recalibrate position on graph given new scale ratios
		band.redraw = function() {
			allLgBds.attr("x", function (d) { return band.xScale(d.s); })
				.attr("width", function (d) {
						return band.xScale(d.e) - band.xScale(d.s);
					});
			allEs.attr("x", function (d) { return band.xScale(d.s); })
				.attr("width", function (d) {
						return band.xScale(d.e) - band.xScale(d.s);
					});
			band.parts.forEach(function(p) { p.redraw(); })
		}; // redraw()
	} // updateBand()

	updateBand(0);
	updateBand(1);

		// Create brush in top macro band that controls lower zoom view
		// NOTES: 	Brush SVGs must be "on top" of everything else and hence must be created last
		//			Code must destroy any previous SVG which would now be below stack
	(function () {
		var macro = self.bands[0];	// Place brush in top macro band
		var cHs;
			// SVG area where brush is created -- delete old one
		if (self.brushSVG != null)
			self.brushSVG.remove();

			// Create logical controller
		self.brush = d3.brushX();
		self.brush.extent([[0,0], [macro.w, macro.h]]);

		self.brushSVG = macro.g.append("g");
		self.brushSVG.attr("class", "brush")
			.call(self.brush);

			// Create custom handle SVG elements
		cHs = self.brushSVG.selectAll(".handle--custom")
			.data([{type: "w"}, {type: "e"}])
			.enter().append("path")
			.attr("d", function (d, i) {
				// Create SVG path for brush resize handles
				var	x = i ? 1 : -1,
					y = macro.h / 4; // Relative positon of handles
				return "M"+(.5*x)+","+y+"A6,6 0 0 "+i+" "+(6.5*x)+","+(y+6)
					+"V"+(3*y-6)+"A6,6 0 0 "+i+" "+(.5*x)+","+(3*y)
					+"Z"+"M"+(2.5*x)+","+(y+8)+"V"+(3*y-8)
					+"M"+(4.5*x)+","+(y+8)
					+"V"+(3*y-8);
			});

				// Code to bind when brush moves
		self.brush.on('start brush end', function() {
			var sel = d3.event.selection;
			if (sel == null) { return; }

			var d0 = sel.map(macro.xScale.invert),
			    d1 = d0.map(d3.timeDay.round);
			  // If empty when rounded, use floor & ceil instead.
			if (d1[0] >= d1[1]) {
			    d1[0] = d3.timeDay.floor(d0[0]);
			    d1[1] = d3.timeDay.ceil(d0[1]);
			}

				// Save zoom dates
			self.zMinDate = d1[0];
			self.zMaxDate = d1[1];

				// Update custom handles
			cHs.attr("display", null)
				.attr("transform", function(d, i) {
					return "translate(" + sel[i] + ",0)";
				});

				// Rescale bottom/zoom timeline
			var zoom = self.bands[1];
			zoom.xScale.domain(d1);
			zoom.redraw();
		});

			// Initial brush pos in macro based on self.zMinDate, self.zMaxDate
		self.brush.move(self.brushSVG, [macro.xScale(self.zMinDate), macro.xScale(self.zMaxDate)]);
	}());

		// PURPOSE: Update the clipping rectangle
	(function () {
		var zoom = self.bands[1];
		var h = zoom.t + zoom.h + 45;

			// Set total height of chart container
		d3.select(self.frameID+" svg.tl-vf").attr("height", h);

			// update clipping rectangle
		d3.select('#tl-clip-'+vI+' rect').attr("height", h);
	}());

	function updateXAxis(bi)
	{
		var band = self.bands[bi];

		d3.select(band.svgID).selectAll('.axis')
			.attr("transform", "translate(0," + band.h  + ")");
	} // updateXAxis()

	updateXAxis(0);
	updateXAxis(1);

	function updateLabels(bi)
	{
		var band = self.bands[bi];

		d3.select(band.svgID).selectAll(".bLblCntr")
			.attr("transform", "translate(0," + (band.h + 1).toString() +  ")");
	} // updateLabels()

	updateLabels(0);
	updateLabels(1);

		// Invoke code that sets x & width attributes
	self.cmpnts.forEach(function(c) {
		c.redraw();
	});
} // render()

	// PURPOSE: Handle resize of drawing area
	// NOTE: 	Do not rely upon any variables created by render()
VizTime.prototype.resize = function()
{
		// Expand width of containers for visual space
	var widths = this.getWidths();

	var tlSVG = d3.select(this.frameID+" svg.tl-vf");
	tlSVG.attr("width", widths[1]);

		// Clip all graphics to inner area of chart
	tlSVG.select("#tl-clip-"+this.vFrame.getIndex()+" rect").attr("width", widths[1]);

		// Now update each band
	for (var bi=0; bi<2; bi++) {
		b = this.bands[bi];
		b.w = widths[1];
		tlSVG.select(b.svgID).attr("width", widths[1]);
		b.xScale.rangeRound([0, widths[1]]);

			// Need to update position of end labels (rect and text)
		var toLabel = b.labels[1];
		var txtLeft = toLabel.x()+toLabel.tDelta;
		b.labelSVGs.select('#rect-'+toLabel.name).attr("x", toLabel.left() );
		b.labelSVGs.select('#txt-'+toLabel.name).attr("x", txtLeft);
		if (bi === 0) {
			if (this.brush) {
					// Update brush extent (constraint) and position
				if (this.brushSVG) {
					this.brush.extent([[0,0], [b.w, b.h]]);
					this.brushSVG.call(this.brush);		// Needed to update extent
					this.brush.move(this.brushSVG, [b.xScale(this.zMinDate), b.xScale(this.zMaxDate)]);
				}
			}
			b.labelSVGs.select('#m-txt-'+toLabel.name).attr("x", txtLeft);
		}
	}

		// Now recompute everything!
	this.cmpnts.forEach(function(c) {
		c.redraw();
	});
} // resize()

VizTime.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	// function eventClass(d)
	// {
	// 	if (self.isSel(d.ai)) {
	// 		if (d.f & EVENT_INSTANT) {
	// 			return "event instant obj-sel";
	// 		} else {
	// 			return "event range obj-sel";
	// 		}
	// 	} else {
	// 		if (d.f & EVENT_INSTANT) {
	// 			return "event instant";
	// 		} else {
	// 			return "event range";
	// 		}
	// 	}
	// } // checkSel()

		// Only zoom band events are selected
	d3.select(this.bands[1].svgID).selectAll(".event")
			.classed("obj-sel", function(d) { return self.isSel(d.ai); });
} // setSel()

VizTime.prototype.clearSel = function()
{
	// function eventClass(d)
	// {
	// 	if (d.f & EVENT_INSTANT) {
	// 		return "event instant";
	// 	} else {
	// 		return "event range";
	// 	}
	// } // checkSel()

	if (this.recSel.length > 0) {
		this.recSel = [];
			// Only zoom band events are selected
		d3.select(this.bands[1].svgID).selectAll(".event")
				.classed("obj-sel", false);
	}
} // clearSel()

VizTime.prototype.getState = function()
{
		// Create more compact form for date to parse later
	var e0=this.zMinDate, e1=this.zMaxDate;
	var m = e0.getUTCMonth()+1;
	var d0 = e0.getUTCFullYear().toString()+'-'+m.toString()+'-'+e0.getDate().toString();
	m = e1.getUTCMonth()+1;
	var d1 = e1.getUTCFullYear().toString()+'-'+m.toString()+'-'+e1.getDate().toString();
	return { d0: d0, d1: d1, l: this.vFrame.getLgndSels() };
} // getState()

	// ASSUMES: This is called after setup but before render, so we only need to reset zMinDate
VizTime.prototype.setState = function(state)
{
	var e0 = PData.dStr(state.d0, false);
	var e1 = PData.dStr(state.d1, true);

		// Rescale bottom/zoom timeline
	var zoom = this.bands[1];
	zoom.xScale.domain([e0, e1]);

	this.zMinDate = e0;
	this.zMaxDate = e1;

	this.vFrame.setLgndSels(state.l);
} // setState()


// ==========================================================
// VizDirectory: Class to visualize lists of Template records

var VizDirectory = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizDirectory

VizDirectory.prototype = Object.create(PVizModel.prototype);

VizDirectory.prototype.constructor = VizDirectory;

VizDirectory.prototype.flags = function()
{
	return V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_OPT;
} // flags()

VizDirectory.prototype.setup = function()
{
	var self=this;

	jQuery(this.frameID).on("click.vf", function(event) {
			// Record data?
		if (event.target.nodeName === 'TD') {
			var row = jQuery(event.target).closest('tr');
			var absI = row.data('ai');
			if (absI != null) {
				var s = self.toggleSel(absI);
				if (s)
					row.addClass("obj-sel");
				else
					row.removeClass("obj-sel");
			}
			// Clicked on a column header? Sort by!
		} else if (event.target.nodeName === 'TH') {
			var th = jQuery(event.target);
			var attID = th.data('aid');
			var tI = th.closest('table').data('ti');
			var sAtt = PData.aByID(attID);
				// Is it a sortable Attribute?
			switch (sAtt.def.t) {
			case 'T':
			case 'V':
			case 'N':
			case 'D':
					// Deselect all columns
				th.closest('tr').find('th').removeClass('sel');
					// Then select this one
				th.addClass('sel');
				self.sAtts[tI] = attID;
				self.rerender(tI);
				break;
			}
		}
	});

		// Get default sort Atts -- first item choices
	self.sAtts=[];
	for (var tI=0; tI<PData.eTNum(); tI++) {
		var attID = jQuery('#dialog-sortby select[data-ti="'+tI+'"] :first').val();
		self.sAtts.push(attID);
	}
} // setup()

VizDirectory.prototype.render = function(stream)
{
	var self = this;

	var numTmplts = stream.t.length;
	var tI=0, tID, tRec, tDef;
	var insert, fAtts, datum, rec, t;
	var oAttID, oAtt, order;

	var thisFrame = jQuery(this.frameID);
	thisFrame.empty();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Save it in case of later rerender
	this.stream = stream;

	tRec = stream.t[0];
	while (tI<numTmplts) {
			// Advance until we get to current Template rec
		while (tRec.n === 0) {
				// Have we run out of Templates?
			if (++tI === numTmplts)
				return;
			tRec = stream.t[tI];
		}
		self.tUsed[tI] = true;
			// Starting with new Template: Create new table
		tID = PData.eTByN(tI);
		tDef = PData.tByID(tID);
		thisFrame.append('<div class="template-label">'+tDef.l+'</div>'+
			'<table cellspacing="0" class="viz-directory" data-ti='+tI+'></table>');
		insert = thisFrame.find('table[data-ti="'+tI+'"]');
		fAtts = self.settings.cnt[tI];
		oAttID = self.sAtts[tI];
		t = '<thead><tr>';
		fAtts.forEach(function(theAtt) {
			var att = PData.aByID(theAtt);
			t += '<th data-aid="'+theAtt;
			if (theAtt === oAttID) {
				t += '" class="sel';
			}
			t +='">'+att.def.l+'</th>';
		});
		insert.append(t+'</tr></thead><tbody></tbody>');
		insert = insert.find('tbody');

		oAtt = PData.aByID(oAttID);
		order = PData.rTOrder(oAtt, self.stream, tI);
		order.forEach(function(oRec) {
			rec = PData.rByN(oRec.i);
			self.rMap[oRec.i >> 4] |= (1 << (oRec.i & 15));
			t = '<tr data-id="'+rec.id+'" data-ai='+oRec.i+'>';
			fAtts.forEach(function(attID) {
				datum = rec.a[attID];
				if (typeof datum !== 'undefined') {
					datum = PData.procAttTxt(attID, datum);
					if (datum) {
						t += '<td>'+datum+'</td>';
					} else {
						t += '<td></td>';
					}
				} else {
					t += '<td></td>';
				}
			});
			insert.append(t+'</tr>');
		});

		tRec = stream.t[++tI];
	} // while
} // render()

	// NOTES: 	Assumed that we don't need to modify tUsed[] or rMap[] because visual parameters unchanged
VizDirectory.prototype.rerender = function(tI)
{
	var self = this;

	var fAtts, oAttID, oAtt, order;
	var datum, rec, t;

	var thisFrame = jQuery(this.frameID+ ' table.viz-directory[data-ti="'+tI+'"] tbody');
	thisFrame.empty();

	tRec = this.stream.t[tI];

	fAtts = self.settings.cnt[tI];

	oAttID = self.sAtts[tI];
	oAtt = PData.aByID(oAttID);
	order = PData.rTOrder(oAtt, self.stream, tI);

	order.forEach(function(oRec) {
		rec = PData.rByN(oRec.i);
		t = '<tr '+(self.isSel(oRec.i) ? 'class="obj-sel" ' : '')+'data-id="'+rec.id+'" data-ai='+oRec.i+'>';
		fAtts.forEach(function(attID) {
			datum = rec.a[attID];
			if (typeof datum !== 'undefined') {
				datum = PData.procAttTxt(attID, datum);
				if (datum) {
					t += '<td>'+datum+'</td>';
				} else {
					t += '<td></td>';
				}
			} else {
				t += '<td></td>';
			}
		});
		thisFrame.append(t+'</tr>');
	});
} // rerender()

VizDirectory.prototype.teardown = function()
{
	jQuery(this.frameID).off("click.vf");
}

VizDirectory.prototype.doOptions = function()
{
	var self=this;

		// Since there are two views that can both access the sort-by dialog, we need to reselect options each time
		// Set menu selections to these
	for (var tI=0; tI<PData.eTNum(); tI++) {
		jQuery('#dialog-sortby select[data-ti="'+tI+'"]').val(self.sAtts[tI]);
	}

	var d = jQuery("#dialog-sortby").dialog({
		dialogClass: "no-close",
		height: 220,
		width: 400,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
					for (var tI=0; tI<PData.eTNum(); tI++) {
						var sAttID = jQuery('#dialog-sortby select[data-ti="'+tI+'"]').val();
						if (sAttID !== self.sAtts[tI]) {
							self.sAtts[tI] = sAttID;
								// Update column name style
							var tr = jQuery(self.frameID+' table[data-ti="'+tI+'"] thead tr');
							tr.find('th').removeClass('sel');
							tr.find('th[data-aid="'+sAttID+'"]').addClass('sel');
							self.rerender(tI);
						}
					}
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
} // doOptions()

VizDirectory.prototype.setSel = function(absIArray)
{
	var self=this;
	var absI, t;

	this.recSel = absIArray;

	var rows = jQuery(this.frameID).find('tr');

	rows.each(function() {
		t = jQuery(this);
		absI = t.data('ai');
		if (absI != null) {
			if (self.isSel(absI))
				t.addClass('obj-sel');
			else
				t.removeClass('obj-sel');
		}
	});
} // setSel()

VizDirectory.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		jQuery(this.frameID).find('tr').removeClass('obj-sel');
	}
} // clearSel()

VizDirectory.prototype.getState = function()
{
	return { s: this.sAtts };
} // getState()

VizDirectory.prototype.setState = function(state)
{
	this.sAtts = state.s;
} // setState()


// ======================================================================
// VizTextStream: Class to visualize record data as ordered text elements

var VizTextStream = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizTextStream

VizTextStream.prototype = Object.create(PVizModel.prototype);

VizTextStream.prototype.constructor = VizTextStream;

VizTextStream.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC | V_FLAG_VSCRL;
} // flags()

	// PURPOSE: Return IDs of locate Attributes
VizTextStream.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null) {
		var atts = this.settings.order[tIndex];
		return atts == null ? null : [atts];
	}
	return _.map(this.settings.order, function(attID) { return [attID]; });
} // getLocAtts()

VizTextStream.prototype.setup = function()
{
	var self = this;

	jQuery(this.frameID).on("click.vf", function(event) {
		if (event.target.nodeName === 'DIV') {
			var word = jQuery(event.target);
			var aI = word.data('ai');
			if (typeof aI !== 'undefined' && aI >= 0) {
				var s = self.toggleSel(aI);
				if (s)
					word.addClass("obj-sel");
				else
					word.removeClass("obj-sel");
			}
		}
	});
} // setup()

VizTextStream.prototype.render = function(stream)
{
	var self = this;

	var numTmplts = stream.t.length;
	var tI=0, tID, tRec, tDef;
	var insert, rec, datum, t, s;

	var order, oAtt, cAttID, cAtt, featSet, fAttID, fAtt, fData;
	var szAtt, szAttID, da, dt, bC;

	var vizDiv = jQuery(this.frameID);
	vizDiv.empty();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

	dt = this.settings.max - this.settings.min;

	tRec = stream.t[0];
	while (tI<numTmplts) {
			// Advance until we get to current Template rec
		while (tRec.n === 0) {
				// Have we run out of Templates?
			if (++tI === numTmplts)
				return;
			tRec = stream.t[tI];
		}

			// only 1 Location Attribute possible - skip if not selected
		featSet = self.vFrame.getSelLocAtts(tI);
		if (featSet.length === 0) {
			tI++;
			continue;
		}

		featSet = self.vFrame.getSelFeatAtts(tI);
			// Skip Templates if no feature Atts
		if (featSet.length === 0) {
			tI++;
			continue;
		}
		self.tUsed[tI] = true;

			// Which Attribute chosen for Legend?
		fAttID = self.vFrame.getSelLegend(tI);
		fAtt = PData.aByID(fAttID);

			// Starting with new Template? Create new DIV & order Records
		vizDiv.append('<div class="viz-textstream" data-ti='+tI+'></div>');
		insert = vizDiv.find('div.viz-textstream[data-ti='+tI+']');

			// Begin with Template name
		tID = PData.eTByN(tI);
		tDef = PData.tByID(tID);
		insert.append('<div class="template-label">'+tDef.l+'</div>');

		cAttID = self.settings.cnt[tI];
		szAttID = self.settings.sAtts[tI];
		if (szAttID) {
			szAtt = PData.aByID(szAttID);
			if (typeof szAtt.r.min === 'number' && typeof szAtt.r.max === 'number')
				da = szAtt.r.max - szAtt.r.min;
			else
				szAttID = null;
		}
		if (cAttID) {
			oAtt = PData.aByID(self.settings.order[tI]);
			order = PData.rTOrder(oAtt, stream, tI);

			order.forEach(function(oRec) {
				rec = PData.rByN(oRec.i);
					// Apply Legend
				datum = rec.a[fAttID];
				if (typeof datum !== 'undefined') {
					fData = PData.lRecs(datum, fAtt, featSet, false);
					if (fData) {
						t = rec.a[cAttID];
						if (t)
							t = PData.procAttTxt(cAttID, t);
						if (t) {
							self.rMap[oRec.i >> 4] |= (1 << (oRec.i & 15));
							if (szAttID) {
								s = rec.a[szAttID];
								if (typeof s === 'number') {
									s = Math.floor(((s-szAtt.r.min)*dt)/da) + self.settings.min;
								} else {
									s = self.settings.min;
								}
							} else {
								s = self.settings.min;
							}
							bC = fData.b ? ';background-color:black' : '';
							insert.append('<div class="recitem" data-ai='+oRec.i+' style="color:'+fData.v+bC+';font-size:'+s+'px">'+t+'</div>');
						} // t
					} // if fData
				}
			});	// forEach order
		} // if cAtt
		tI++;
	} // while
} // render()

VizTextStream.prototype.teardown = function()
{
	jQuery(this.frameID).off("click.vf");
}

VizTextStream.prototype.setSel = function(absIArray)
{
	var self=this;
	var vIndex = this.vFrame.getIndex();
	var absI, t;

	this.recSel = absIArray;

	var rows = jQuery(this.frameID).find('div.recitem');

	rows.each(function() {
		t = jQuery(this);
		absI = t.data('ai');
		if (absI != null) {
			if (self.isSel(absI))
				t.addClass('obj-sel');
			else
				t.removeClass('obj-sel');
		}
	});
} // setSel()

VizTextStream.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];

		jQuery(this.frameID).find('div.recitem').removeClass('obj-sel');
	}
} // clearSel()

VizTextStream.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizTextStream.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizTextStream.prototype.hint = function()
{
	var h='';
	var attID, attDef, tID, tDef, sAtt;

	var numT = PData.eTNum();

	for (var tI=0; tI<numT; tI++) {
		attID = this.settings.order[tI];
		if (attID) {
			attDef = PData.aByID(attID);
			tID = PData.eTByN(tI);
			tDef = PData.tByID(tID);
			if (h.length > 0)
				h += '; ';
			h += tDef.l+': '+dlText.orderedby+' '+attDef.def.l;

			attID = this.settings.sAtts[tI];
			if (attID) {
				attDef = PData.aByID(attID);
				h += ', '+dlText.textsize+' '+attDef.def.l;
			}
		} // if attID
	} // for templates
	return h;
} // hint()


// ===============================================================================
// VizNetWheel: Class to visualize connections between Records as Network on Wheel
//
// Instance Variables:
//		recSel = array of selected record IDs
//		spin = degree (0-359) of spin user added to wheel
//		prune = true if unconnected nodes should be removed
//		svg = SVG graphic in which visualization created
//		center = graphic at center of SVG
//		stream = datastream visualized
//		inc = degree spacing between nodes on Wheel
//		cr = radius (pixel length) to center

var VizNetWheel = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizNetWheel

VizNetWheel.prototype = Object.create(PVizModel.prototype);

VizNetWheel.prototype.constructor = VizNetWheel;

VizNetWheel.prototype.flags = function()
{
	return V_FLAG_OPT | V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizNetWheel.prototype.setup = function()
{
	var self=this;

	this.spin = 0;
	this.prune = true;		// If true, don't show unconnected nodes

	function rotate()
	{
		var spin = self.spin;

		if (spin > 360)
			spin -= 360;
		else if (spin < 0)
			spin += 360;
		self.spin = spin;

		self.center
			.attr("transform", "translate(" + self.cr + "," + self.cr + ")rotate(" + spin + ")");

				// Change orientation if has changed "sides" since initial render
		self.center.selectAll("g.gnode text")
				.attr("x", function(d) {
					var x = d.x+spin;
					x = x > 360 ? x-360 : x;
					x = x < 0 ? x+360 : x;
					if (((x < 180) && (d.x < 180)) || ((x >= 180) && (d.x >= 180))) {
						return d.x < 180 ? "7" : "-7";
					} else {
						return d.x < 180 ? "-7" : "7";
					}
				})
				.attr("transform", function(d) {
					var x = d.x+spin;
					x = x > 360 ? x-360 : x;
					x = x < 0 ? x+360 : x;
					if (((x < 180) && (d.x < 180)) || ((x >= 180) && (d.x >= 180))) {
						return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")";
					} else {
						return "rotate(" + (d.x < 180 ? d.x + 90 : d.x - 90) + ")";
					}
				})
				.style("text-anchor", function(d) {
					var x = d.x+spin;
					x = x > 360 ? x-360 : x;
					x = x < 0 ? x+360 : x;
					if (((x < 180) && (d.x < 180)) || ((x >= 180) && (d.x >= 180))) {
						return d.x < 180 ? "start" : "end";
					} else {
						return d.x < 180 ? "end" : "start";
					}
				});
	} // rotate()

	var vi = this.vFrame.getIndex();
	var fh = _.template(document.getElementById('dltext-v-nwheel').innerHTML);
	jQuery('#view-frame-'+vi+' div.view-controls').append(fh({ vi: vi }));

	jQuery('#nw-prev-'+vi).button({ text: false, icons: { primary: " ui-icon-arrowreturnthick-1-s" }})
		.click(function() {
			if (jQuery('#nw-size-'+vi+' :radio:checked').attr('id') == 'nw-size-1-'+vi)
				self.spin += self.inc;
			else
				self.spin += 90;
			rotate();
		});
	jQuery('#nw-for-' +vi).button({ text: false, icons: { primary: " ui-icon-arrowreturnthick-1-n" }})
		.click(function() {
			if (jQuery('#nw-size-'+vi+' :radio:checked').attr('id') == 'nw-size-1-'+vi)
				self.spin -= self.inc;
			else
				self.spin -= 90;
			rotate();
		});
	jQuery('#nw-size-'+vi).buttonset();

	this.svg = d3.select(this.frameID).append("svg");
	this.center = this.svg.append("g");
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// TO DO: 	Could speed up linking Records with binary search
	// NOTES:	Tree nodes all have parent and children elements
VizNetWheel.prototype.render = function(stream)
{
	var self = this;
	var links=[], link;
	var nodes, node;

	if (stream) {
		this.stream = stream;
	} else {
		stream = this.stream;
	}

		// PURPOSE: Utility function that converts radial position to X,Y
	function project(x, y) {
		var angle = (x - 90) / 180 * Math.PI, radius = y;
		return [radius * Math.cos(angle), radius * Math.sin(angle)];
	} // project()

	function clickDot(d)
	{
		var s = self.toggleSel(d.data.ai);
		d3.select(this).classed('obj-sel', s);
	} // clickDot()

		// INPUT: 	nL = node entry (from leaves) bound to label
		// NOTES:	links s, t point to Objects in children arrays (not leaves entries!)
	function clickName(nL)
	{
		var nData=nL.data;

			// First clear out all variables
		node.each(function(n) { n.data.l = false; });

			// Go through links, setting colors and flags
		link.each(function(l) {
				// Is this the source of a link?
			if (l.s === nData) {
				l.t.l = true;
					// Search for corresponding entry in original array
				for (var lI=0; lI<links.length; lI++) {
					var lk = links[lI];
					if (lk.s === nData && lk.t === l.t) {
						d3.select(this).attr("stroke", lk.c).classed("thick", true);
							// Put at end of render list to ensure it is on top of others
						this.parentElement.appendChild(this);
						break;
					}
				}
				// target of a link?
			} else if (l.t === nData) {
				l.s.l = true;
					// Search for corresponding entry in original array
				for (var lI=0; lI<links.length; lI++) {
					var lk = links[lI];
					if (lk.t === nData && lk.s === l.s) {
						d3.select(this).attr("stroke", lk.c).classed("thick", true);
							// Put at end of render list to ensure it is on top of others
						this.parentElement.appendChild(this);
						break;
					}
				}
			} else {
				d3.select(this).attr("stroke", "black").classed("thick", false);
			}
		});

		node.select("text")
			.attr("fill", function(n) { return n.data.l ? "white" : "black"; });

		d3.select(this)
			.attr("fill", "yellow");
	} // clickName()

		// remove any existing nodes and links
	this.center.selectAll(".gnode").remove();
	this.center.selectAll(".plink").remove();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Abort if no Records
	if (stream.l === 0) {
			// Set sizes and centers to minimum
		this.svg.attr("width", "10")
			.attr("height", "10");
		return;
	}

		// Create nested array of nodes for each Template { parent, ti, children }
		// or Record { parent, r[ecord], ai, c[olor], children, l[ink], v[leaveIndex] }
	var head = { parent: null, children: [] };
	var tNode = { parent: head, ti: 0, children: [] };

	(function () {
		var tRec, tI=0;
		var i=0, rec, datum, aI;
		var featSet=null, fAtt, fAttID;

		tRec = stream.t[0];
		fAttID = self.vFrame.getSelLegend(0);
		fAtt = PData.aByID(fAttID);
		featSet = self.vFrame.getSelFeatAtts(0);
		if (featSet.length > 0 && tRec.n > 0) {
			self.tUsed[0] = true;
		}

		tLoop: while (i<stream.l) {
				// Advance until we get to current Template rec
			while (tRec.n === 0 || (tRec.i+tRec.n) === i || featSet.length === 0) {
					// Accumulated children to save?
				if (tNode.children.length > 0) {
					tNode.ti = tI;
					head.children.push(tNode);
				}
					// Have we run out of Templates?
				if (++tI === stream.t.length) {
					break tLoop;
				}

				tNode = { parent: head, ti: tI, children: [] };

				tRec = stream.t[tI];
					// Which Attribute chosen for Legend?
				fAttID = self.vFrame.getSelLegend(tI);
				fAtt = PData.aByID(fAttID);
				featSet = self.vFrame.getSelFeatAtts(tI);
				if (featSet.length > 0 && tRec.n > 0) {
					self.tUsed[tI] = true;
				}
			}

				// Get Record data
			aI = stream.s[i];
			rec = PData.rByN(aI);
			datum = rec.a[fAttID];
			if (typeof datum !== 'undefined') {
				fData = PData.lRecs(datum, fAtt, featSet, false);
				if (fData) {
					self.rMap[aI >> 4] |= (1 << (aI & 15));
					tNode.children.push({ parent: tNode, r: rec, ai: aI, c: fData.v, l: false, v: -1, children: [] });
				}
			}

			i++;
		} // while
			// Save final Template node if it had children
		if (tNode.children.length > 0) {
			head.children.push(tNode);
		}
		tNode = null;
	}());

		// Compile links between nodes
		//  { s[ource], t[arget], c[olor] }
	head.children.forEach(function(theT) {
		var pAtts = self.settings.pAtts[theT.ti];
		var q;
		theT.children.forEach(function(d) {
			pAtts.forEach(function(p) {
				q = d.r.a[p.pid];
				if (typeof q !== 'undefined') {
						// Array of Rec IDs -- must find each one in head.children.children!
					q.forEach(function(rID) {
						var found=false, r2;
						tLoop: for (var tI=0; tI<head.children.length; tI++) {
							var tRecs = head.children[tI];
								// TO DO: binary search
							for (var rI=0; rI<tRecs.children.length; rI++) {
								r2 = tRecs.children[rI];
								if (r2.r.id == rID) {
									found=true;
									break tLoop;
								}
							}
						}
						if (found) {
							d.l = true; r2.l = true;
							links.push({ s: d, t: r2, c: p.clr});
						}
					}); // for Pointer values
				}
			}); // for Pointer entries
		}); // for Records in Template
	}); // for Templates

		// Remove unconnected nodes?
	if (this.prune) {
		head.children.forEach(function(theT, tI) {
			for (var rI=theT.children.length-1; rI>=0; rI--) {
				var r=theT.children[rI];
				if (!r.l) {
						// Clear bit from bitmap
					self.rMap[r.ai >> 4] &= ((1 << (r.ai & 15)) ^ 0xFFFF);
					theT.children.splice(rI, 1);
				}
			}
				// If Template has now been emptied, clear Template's usage flag
			if (theT.children.length === 0) {
				self.tUsed[tI] = false;
			}
		});
	} // if prune

	var numNodes = 0;
	head.children.forEach(function(theT, tI) {
		numNodes += theT.children.length;
	});

		// Now that we know number of nodes, compute sizes
	this.inc = 360/(numNodes+head.children.length);

		// Abort if no Records
	if (numNodes === 0) {
			// Set sizes and centers to minimum
		this.svg.attr("width", "10")
			.attr("height", "10");
		return;
	}

		// Compute inner radius based on circumference needed to show all labels
	var rad = Math.max((numNodes*14 + 20)/(Math.PI*2), 30);
	var lw = this.settings.lw;
	if (typeof lw === 'string') {
		lw = parseInt(lw);
	}

	this.cr = lw+12+rad;	// Radius to center
	var diam = this.cr*2;	// Accommodate dot and spacing

		// Set sizes and centers
	this.svg.attr("width", diam)
		.attr("height", diam);

	this.center.attr("transform", "translate(" + this.cr + "," + this.cr + ")");

	var cluster = d3.cluster()
		.size([360, rad]);

	var totalGraph = d3.hierarchy(head);
	cluster(totalGraph);
	var leaves = totalGraph.descendants().filter(function(d) { return typeof d.data.ai === 'number'; });

		// Set v index in objects for Records in leaves
	leaves.forEach(function(l, lI) {
		l.data.v = lI;
	});

	node = this.center.selectAll(".gnode")
		.data(leaves)
		.enter()
		.append("g")
		.attr("class", "gnode")
		.attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

	node.append("circle")
			.attr("r", "5")
			.style("fill", function(d) { return d.data.c; })
			.on("click", clickDot);

	node.append("text")
			.attr("dy", ".31em")
			.attr("x", function(d) { return d.x < 180 ? 7 : -7; })
			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
			.attr("fill", "black")
			.text(function(d) { return d.data.r.l; })
			.on("click", clickName);

	link = this.center.selectAll(".plink")
		.data(links)
	    .enter().append("path")
	    .attr("class", "plink")
		.attr("stroke", "black")
	    .attr("d", function(d) {
			var s=leaves[d.s.v], t=leaves[d.t.v];
	        return "M" + project(s.x, s.y)
	            + " Q0,0 " + project(t.x, t.y);
	    });
} // render()

VizNetWheel.prototype.teardown = function()
{
	var vi = this.vFrame.getIndex();
	jQuery('#view-frame-'+vi+' div.view-controls div.iconbar').remove();
} // teardown()

VizNetWheel.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	this.svg.selectAll(".gnode circle")
		.classed('obj-sel', function(d) { return self.isSel(d.data.ai); } );
			// .attr("class", function(d) { return self.isSel(d.data.ai) ? 'obj-sel' : '' });
} // setSel()

VizNetWheel.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
			// Only zoom band events are selected
		this.svg.selectAll(".gnode circle")
			.classed('obj-sel', false);
				// .attr("class", '');
	}
} // clearSel()

VizNetWheel.prototype.doOptions = function()
{
	var self=this;

	jQuery('#prune-nodes').prop('checked', this.prune);

	var d = jQuery("#dialog-prune").dialog({
		dialogClass: "no-close",
		height: 150,
		width: 400,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
					var prune = jQuery('#prune-nodes').prop('checked');
					if (self.prune !== prune) {
						self.prune = prune;
							// As we are rendering afresh, must clear any existing selection
						self.vFrame.upSel([], false);
						self.render(null);
					}
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
} // doOptions()

VizNetWheel.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizNetWheel.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizNetWheel.prototype.hint = function()
{
	var hint='';
	var self=this;

	for (var ti=0; ti<PData.eTNum(); ti++) {
		var pAtts = self.settings.pAtts[ti];
		pAtts.forEach(function(p) {
			var att = PData.aByID(p.pid);
			if (hint.length > 0) {
				hint += ", ";
			}
			hint += '<b><span style="color: '+p.clr+'">'+att.def.l+'</span></b>';
		});
	}
	return hint;
} // hint()

// ===============================================================================
// VizNetGraph: Class to visualize connections between Records as network graph
//
// Instance Variables:
//		stream = last datastream used for render (needed in case redraw from options)
//		svg = SVG created for visualization
//		physics = D3 force simulation object
//		rels = [ [boolean], ], to match settings.pAtts, specifying if should display

var VizNetGraph = function(viewFrame, vSettings)
{
	this.physics = null;
	this.stream = null;

	PVizModel.call(this, viewFrame, vSettings);
} // VizNetGraph

VizNetGraph.prototype = Object.create(PVizModel.prototype);

VizNetGraph.prototype.constructor = VizNetGraph;

VizNetGraph.prototype.flags = function()
{
	return V_FLAG_OPT | V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizNetGraph.prototype.setup = function()
{
	var self=this;

	this.svg = d3.select(this.frameID).append("svg");

		// Set sizes and centers
	var size = this.settings.s;
	if (typeof size === 'string') {
		size = parseInt(size);
		this.settings.s = size;
	}
	this.svg.attr("width", size)
		.attr("height", size);

	this.prepSym(this.settings.min);

		// By default, all relationships are shown
	this.rels=[];
	this.settings.pAtts.forEach(function(pSet) {
		var relSet=[];
		for (var i=0; i<pSet.length; i++) {
			relSet.push(true);
		}
		self.rels.push(relSet);
	});
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// INPUT:	steam = datastream; null is passed in if called from options
VizNetGraph.prototype.render = function(stream)
{
	var self=this;

	if (stream) {
		this.stream = stream;
	} else {
		stream = this.stream;
	}

	function clickDot(d)
	{
		var s = self.toggleSel(d.ai);
		d3.select(this).classed('obj-sel', s);
	} // clickDot()

		// remove any existing nodes and links
	this.svg.selectAll(".gnode").remove();
	this.svg.selectAll(".cnode").remove();
	this.svg.selectAll(".llink").remove();

	if (this.recSel.length > 0) {
		this.recSel=[];
	}

	this.preRender(true, true);

		// Abort if no Records
	if (stream.l === 0) {
		return;
	}

	var sAttID, sAtt, minR, maxR, dR, minS, dS;

	minR = this.settings.min;
	if (typeof minR === 'string') {
		minR = parseInt(minR);
	}
	maxR = this.settings.max;
	if (typeof maxR === 'string') {
		maxR = parseInt(maxR);
	}
	dR = maxR - minR;

		// Create initial array of all nodes
	var nodes=[],			// Nodes + pseudo-nodes for bezier curve
		links = [];
	var link, node;
	var i=0, rec, datum;
	var tRec, tI=0;
	var featSet=null;
	var aI;
	var nCnt=0;

	(function () {
		var fAtt, fAttID;

		tRec = stream.t[0];
		fAttID = self.vFrame.getSelLegend(0);
		fAtt = PData.aByID(fAttID);
		featSet = self.vFrame.getSelFeatAtts(0);
		if (featSet.length > 0 && tRec.n > 0) {
			self.tUsed[0] = true;
		}

		tLoop: while (i<stream.l) {
				// Advance until we get to current Template rec
			while (tRec.n === 0 || (tRec.i+tRec.n) === i || featSet.length === 0) {
					// Have we run out of Templates?
				if (++tI === stream.t.length) {
					break tLoop;
				}

				tRec = stream.t[tI];
					// Which Attribute chosen for Legend?
				fAttID = self.vFrame.getSelLegend(tI);
				fAtt = PData.aByID(fAttID);
				featSet = self.vFrame.getSelFeatAtts(tI);
				if (featSet.length > 0 && tRec.n > 0) {
					self.tUsed[tI] = true;
				}
				sAttID = self.settings.sAtts[tI];
				if (sAttID) {
					sAtt = PData.aByID(sAttID);
					if (typeof sAtt.r.min === 'number' && typeof sAtt.r.max === 'number') {
						minS = sAtt.r.min;
						dS = sAtt.r.max - minS;
					} else {
						sAttID = null;
					}
				} // if sAttID
			} // if end of Template set

				// Get Record data
			aI = stream.s[i];
			rec = PData.rByN(aI);
			datum = rec.a[fAttID];
			if (typeof datum !== 'undefined') {
				fData = PData.lRecs(datum, fAtt, featSet, false);
				if (fData) {
					self.rMap[aI >> 4] |= (1 << (aI & 15));
					if (sAttID) {
						sAtt = rec.a[sAttID];
						if (typeof sAtt === 'number') {
							sAtt = Math.floor(((sAtt-minS)*dR)/dS) + minR;
						} else {
							sAtt = minR;
						}
					} else {
						sAtt = minR;
					}
					nodes.push({
						index: nCnt++, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null,
						ai: aI, t: tI, s: sAtt, c: fData.v, r: rec
					});
				} // legend that is enabled
			} // valid legend data

			i++;
		} // while
	}());

		// Abort if no Records
	if (nCnt === 0) {
		return;
	}

		// Now we need to iterate through nodes and create links
	var found, rec2, thisT, comp, relSet;
	tI = null; tRec = null;
	nodes.forEach(function(thisNode) {
			// Have we gone to next Template? Get Pointer array
		if (tI !== thisNode.t) {
			tI = thisNode.t;
			tRec = stream.t[tI];
			featSet = self.settings.pAtts[tI];
			relSet = self.rels[tI];
		}
			// Go through all Pointer Attributes of this Template type
		featSet.forEach(function(p, pIndex) {
				// Ignore if not currently selected
			if (relSet[pIndex]) {
				datum = thisNode.r.a[p.pid];
				if (typeof datum !== 'undefined') {
						// Array of Rec IDs -- must find each one
					datum.forEach(function(rID) {
						found=false;
							// TO DO: expedite node search
						for (var rI=0; rI<nodes.length; rI++) {
							rec2 = nodes[rI];
							comp = PData.strcmp(rec2.r.id, rID);
							if (comp === 0) {
								found=true;
								break;
							}
						} // for rI
						if (found) {
					    	links.push({ source: thisNode, target: rec2, index: links.length, c: p.clr });
						} // if found
					}); // for Pointer values
				} // Rec has Pointer values
			} // if rels on
		}); // for all of Template's Pointer entries
	}); // for all nodes

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

	link = this.svg.selectAll("line")
		.data(links)
	    .enter()
		.append("line")
		.attr("class", "llink")
		.style("stroke", function(d) { return d.c; });

	switch (this.symType) {
	case 'C':
		node = this.svg.selectAll(".cnode")
	    	.data(nodes)
	    	.enter()
			.append("circle")
	    	.attr("class", "cnode")
			.attr("r", function(d) { return d.s; })
			.style("fill", function(d) { return d.c; })
			.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
			.on("click", clickDot);
		break;
	case 'S':	// Symbol
		node = this.svg.selectAll(".gnode")
	    	.data(nodes)
			.enter().append("g")
	        .attr("class", "gnode")
	        .attr("transform", function(d) { return "translate(0,0)"; })
			.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
		node.append("path")
			.style("fill", function(d) { return d.c; })
			.attr("d", function(d) {
				var f = self.sFuncs[self.settings.syms[d.t]];
					// First set size function
				f.size((d.s*d.s)/2);
				return f();
			})
			.on("click", clickDot);
		break;
	case 'I':	// Image
		node = this.svg.selectAll(".gnode")
			.data(nodes)
			.enter().append("g")
			.attr("class", "gnode")
			.attr("transform", function(d) { return "translate(0,0)"; })
			.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
		node.append("image")
			.attr("xlink:href", function(d) {
				var i = self.settings.iAtts[d.t];
				return i === 'disable' ? '' : d.r.a[i];
			})
	    	.attr("x", function(d) { return "-"+(d.s/2)+"px"; })
	    	.attr("y", function(d) { return "-"+(d.s/2)+"px"; })
	    	.attr("width", function(d) { return d.s+"px"; })
	    	.attr("height", function(d) { return d.s+"px"; })
			.on("click", clickDot);
		break;
	} // switch symType
	node.append("title")
		.text(function(d) { return d.r.l; });

		// Need new physics sim for each new render
	i = this.settings.s;
	this.physics = d3.forceSimulation()
		.force("center", d3.forceCenter(i/2, i/2))
	    .force("link", d3.forceLink())
	    .force("charge", d3.forceManyBody().distanceMin(maxR*2).distanceMax(i/8));

	this.physics.force("link").links(links);

		// Add a function that keeps nodes within bounds
	maxR = this.settings.s - minR;
	this.physics.force("bounds", function() {
		for (var i=0, n=nodes.length, node; i<n; ++i) {
    		node = nodes[i];
    		node.x = Math.max(minR, Math.min(node.x, maxR));
			node.y = Math.max(minR, Math.min(node.y, maxR));
		}
	});

	this.physics.nodes(nodes)
		.on("tick", function() {
			link
		        .attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });
			switch (self.symType) {
			case 'C':
				node.attr("cx", function(d) { return d.x; }).attr("cy", function(d) { return d.y; });
				break;
			case 'S':
			case 'I':
				node.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });
				break;
			}
		});
} // render()

VizNetGraph.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	switch (this.symType) {
	case 'C':
		this.svg.selectAll(".cnode")
			.classed("obj-sel", function(d) { return self.isSel(d.ai); } );
				// .attr("class", function(d) { return self.isSel(d.ai) ? 'obj-sel cnode' : 'cnode' });
		break;
	case 'S':
	case 'I':
		this.svg.selectAll(".gnode "+this.symStr)
			.classed("obj-sel", function(d) { return self.isSel(d.ai); });
		break;
	}
} // setSel()

VizNetGraph.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];

		switch (this.symType) {
		case 'C':
			this.svg.selectAll(".cnode").classed("obj-sel", false);
			break;
		case 'S':
		case 'I':
			this.svg.selectAll(".gnode "+this.symStr).classed("obj-sel", false);
			break;
		}
	}
} // clearSel()

VizNetGraph.prototype.doOptions = function()
{
	var self=this;
	var h=120;

	var insertPt = jQuery('#dialog-netgraph > .scroll-container');
	insertPt.empty();

	this.settings.pAtts.forEach(function(t, tI) {
		if (t.length > 0) {
			h += 18;
			var tID = PData.eTByN(tI);
			var tDef = PData.tByID(tID);
			var tSet = self.rels[tI];
			insertPt.append('<b>'+tDef.l+'</b><br/>');
			t.forEach(function(p, pI) {
				h += 18;
				var i = '<input type="checkbox" data-t="'+tI+'" data-index="'+pI+'"';
				if (tSet[pI]) {
					i += ' checked="checked"';
				}
				var pAtt = PData.aByID(p.pid);
				insertPt.append(i+'/> '+pAtt.def.l+'<br/>');
			});
		}
	});

	var d = jQuery("#dialog-netgraph").dialog({
		dialogClass: "no-close",
		height: h,
		width: 300,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
					var changed = false;
					self.settings.pAtts.forEach(function(t, tI) {
						t.forEach(function(p, pI) {
							var selected = insertPt.find('input[data-t="'+tI+'"][data-index="'+pI+'"]').prop('checked');
							if (self.rels[tI][pI] !== selected) {
								changed = true;
								self.rels[tI][pI] = selected;
							}
						});
					});
					if (changed) {
							// As we are rendering afresh, must clear any existing selection
						self.vFrame.upSel([], false);
						self.render(null);
					}
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
} // doOptions()

VizNetGraph.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels(), r: JSON.parse(JSON.stringify(this.rels)) };
} // getState()

VizNetGraph.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
	this.rels = JSON.parse(JSON.stringify(state.r));
} // setState()

VizNetGraph.prototype.hint = function()
{
	var hint='';
	var self=this;

	for (var ti=0; ti<PData.eTNum(); ti++) {
		var pAtts = self.settings.pAtts[ti];
		pAtts.forEach(function(p) {
			var att = PData.aByID(p.pid);
			if (hint.length > 0) {
				hint += ", ";
			}
			hint += '<b><span style="color: '+p.clr+'">'+att.def.l+'</span></b>';
		});
	}
	return hint;
} // hint()


// ================================================================================
// VizBMatrix: Class to visualize Records in "bucket" matrix with connections
//
// Instance Variables:
//		stream = last datastream rendered on view
//		svg = entire SVG canvas
//		cnx = true if configured for connections, false if none
//		rels = [ [boolean], ], to match settings.pAtts, specifying if should display
//		nodes = [ ] about nodes (see render())
//		rSet = [ ] for each unique Record rendered as node (see render())
//		links = [ ] to store data about connetions/relationships (see render())

var VizBMatrix = function(viewFrame, vSettings)
{
	this.stream = null;
	this.cnx = false;

	PVizModel.call(this, viewFrame, vSettings);
} // VizBMatrix

VizBMatrix.prototype = Object.create(PVizModel.prototype);

VizBMatrix.prototype.constructor = VizBMatrix;

VizBMatrix.prototype.flags = function()
{
	return V_FLAG_OPT | V_FLAG_LGND | V_FLAG_VSCRL | V_FLAG_HSCRL | V_FLAG_SEL;
} // flags()

VizBMatrix.prototype.setup = function()
{
	var self=this;

		// By default, all relationships are shown
	this.rels=[];
	this.settings.pAtts.forEach(function(pSet) {
		var relSet=[];
		for (var i=0; i<pSet.length; i++) {
			relSet.push(true);
			self.cnx = true;
		}
		self.rels.push(relSet);
	});

	this.svg = d3.select(this.frameID).append("svg");
} // setup()

	// NOTES:	Each node will have radius of 4; plus 1 for outline, 1 for gap = 11 px width/node
	// INPUT:	stream = datastream to render, or null if called from options (re-render last)
VizBMatrix.prototype.render = function(stream)
{
	var self=this;

	var tLbls=[];	// For each Template: { l[abel], c[lass], x, y }
	var tY=0;		// Current Y pos for top of Template's graphics
	var tNum=0;		// Index of current (used) Template
	var nodes=[];	// one per occurance in bucket (each Record can have > 1 node)
					// { r[ec], rI[ndex w/in bucket], ai, b[ucketIndex], x, y, c[olor] }
	var rSet=[];	// one per Record (used to locate with Pointers): { id, r[ec], n[ode indices] }
	var links=[];	// every connection link: { n1, n2, c[olor] }
	var maxW=0; 	// pixel width of entire SVG
	var rB=this.settings.bw;	// #recs/bucket
	var nR=this.settings.nr;	// pix radius of each rec/node
	var nS=(nR*2)+3; // pix size of each "total" node space (diameter + spacing)
	var bPW=(rB*nS)+3;	// pix width of each bucket
	var featSet, fAttID, fAtt, fData, rec;

		// PURPOSE: Handle clicking on a node
		// NOTES:	This is complicated by the fact that a single Record can be represented by multiple nodes
	function clickDot(d)
	{
		self.toggleSel(d.ai);
		self.updateNodes();
		self.updateLinks();
	} // clickDot()

	if (stream) {
		this.stream = stream;
	} else {
		stream = this.stream;
	}

	if (this.recSel.length > 0) {
		this.recSel=[];
	}
	this.preRender(true, true);

		// remove any existing nodes and links
	this.svg.selectAll("path").remove();
	this.svg.selectAll("svg").remove();
	this.svg.selectAll("circle").remove();

		// Create category buckets for each Attribute
	this.settings.oAtts.forEach(function(oAttID, tI) {
		if (oAttID) {
			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts or no order Attribute
			if (featSet.length > 0) {
					// Get Feature Attribute ID and def for this Template
				fAttID = self.vFrame.getSelLegend(tI);
				fAtt = PData.aByID(fAttID);

				var tCat;
				var oAtt = PData.aByID(oAttID);
				if (oAtt.def.t !== 'g') {
					if (self.settings.gr) {
						tCat = PData.cRNew(oAtt, true, true);
					} else {
						tCat = PData.cLNew(oAtt, null, true);
					}
					PData.cFill(tCat, oAttID, null, stream, tI);
				} else {
					tCat=[];
					PData.cFill(tCat, oAttID, null, stream, tI);
				}
					// Compile used categories, color nodes
				var bI=0;
				var used=[];
				var tH=0;				// Max height of buckets for current Template in rows
					// For each category
				tCat.forEach(function(c) {
					var rI=0;
						// For each Record in category
					c.i.forEach(function(aI) {
						rec = PData.rByN(aI);
						fData = rec.a[fAttID];
						if (typeof fData !== 'undefined') {
							fData = PData.lClr(fData, fAtt, featSet);
							if (fData) {
									// Set bit in rMap corresponding to absIndex
								self.rMap[aI >> 4] |= (1 << (aI & 15));
								nodes.push({r: rec, ai: aI, b: bI, rI: rI, c: fData,
											x: (bI*bPW)+(nS*(rI%rB))+nR+1, y: tY+28+nR+(nS*Math.floor(rI/rB)) });
									// Add to Record array sorted by ID?
								if (self.cnx) {
									var i, rRec;
									i = _.sortedIndex(rSet, { id: rec.id }, 'id');
									if (i < rSet.length) {
										rRec = rSet[i];
											// Does it already exist? Just add reference to this node
										if (rRec.id === rec.id) {
											rRec.n.push(nodes.length-1);
										} else {	// Insert into rSet
											rSet.splice(i, 0, { id: rec.id, ai: aI, r: rec, n: [ nodes.length-1 ] });
										}
									} else {	// Must append Object to represent Record
										rSet.push({ id: rec.id, ai: aI, r: rec, n: [ nodes.length-1 ] })
									}
								} // if connections
								rI++;
							} // if fData
						} // if data is defined
					}); // for each Record
						// Save this category bucket?
					if (rI>0) {
						tLbls.push({ l: c.l, c: 'b-lbl-txt', x: bI*bPW, y: tY+13 });
						bI++;
						tH = Math.max(Math.floor(rI/rB) + 1, tH);
						used.push(c);
					} // if saved
				}); // for each category
					// Process data for this Template, if any nodes/categories created
				if (bI > 0) {
					self.tUsed[tI] = true;
						// Create Template label
					var tID = PData.eTByN(tI);
					var tDef = PData.tByID(tID);
					tLbls.push({ l: tDef.l, c: 't-lbl-txt', x: 0, y: tY });
					tNum++;
					tY += 33+(tH*nS);
					maxW = Math.max(maxW, bI*bPW);
				}
			} // if has selected features
		} // if oAttID not null
	}); // oAtts.forEach

	this.nodes=nodes;
	this.rSet=rSet;

		// Any resulting Templates?
	if (tNum > 0) {
		this.svg.attr("width", maxW)
			.attr("height", tY);

		var node = this.svg.selectAll(".cnode")
	    	.data(nodes)
	    	.enter().append("circle")
	    	.attr("class", "cnode")
			.attr("r", nR)
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
			.style("fill", function(d) { return d.c; })
			.on("click", clickDot);
		node.append("title")
			.text(function(d) { return d.r.l; });

		var title = this.svg.selectAll(".s-lbl")
			.data(tLbls)
			.enter().append("svg")
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
			.attr("height", function(d) { return d.c === 't-lbl-text' ? 14 : 12; })
			.attr("width", bPW-2);
		title.append("text")
			.attr("class", function(d) { return 's-lbl-text ' + d.c; })
			.attr("x", function(d) { return 0; })
			.attr("y", function(d) { return d.c === 't-lbl-text' ? 12 : 10; })
			.text(function(d) { return d.l; });

			// Create all relationship links
		if (this.cnx) {
			rSet.forEach(function(r) {
					// Get Pointer set for this Template
				var tI = PData.n2T(r.ai);
				featSet = self.settings.pAtts[tI];
				featSet.forEach(function(p, pI) {
						// Ignore if not currently selected
					if (self.rels[tI][pI]) {
						fData = r.r.a[p.pid];
						if (typeof fData !== 'undefined') {
								// Array of Rec IDs -- must find each one
							fData.forEach(function(rID) {
								var i = _.sortedIndex(rSet, { id: rID }, 'id');
								var d;
								if (i < rSet.length) {
									d = rSet[i];
									if (d.id === rID) {
											// All permutations of source and dest
										r.n.forEach(function(snI) {
											d.n.forEach(function(dnI) {
												links.push({ n1: snI, n2: dnI, c: p.clr });
											}); // forEach d.n
										}); // forEach r.n
									}
								}
							});
						} // if not undefined
					} // if relSet
				}); // for pSet
			}); // forEach rSet

		var link = this.svg.selectAll(".bmlink")
	    	.data(links)
			.enter().append("path")
		    .attr("class", "bmlink")
			.attr("stroke", function(d) { return d.c; })
		    .attr("d", function(d) {
				var x1=nodes[d.n1].x, y1=nodes[d.n1].y, x2=nodes[d.n2].x, y2=nodes[d.n2].y;
				var xm=(x1+x2)/2 + Math.floor(Math.random()*20) - 10;
				var ym=(y1+y2)/2 + Math.floor(Math.random()*20) - 10;
		        return "M"+x1+" "+y1+" Q "+xm+" "+ym+" "+x2+" "+y2;
		    });

		} // if connections
	} else {
			// Set sizes and centers to minimum
		this.svg.attr("width", "10")
			.attr("height", "10");
	}
	this.links=links;
} // render()

	// PURPOSE: Refresh state of links based on current selection
VizBMatrix.prototype.updateLinks = function()
{
	var self=this;
	this.svg.selectAll(".bmlink")
			.attr("class", function(d) {
				return self.isSel(self.nodes[d.n1].ai) || self.isSel(self.nodes[d.n2].ai) ? 'on bmlink' : 'bmlink'
			});
} // updateLinks

	// PURPOSE: Recompute the on field of links based on current selection
VizBMatrix.prototype.updateNodes = function()
{
	var self=this;
	this.svg.selectAll(".cnode")
		.classed('obj-sel', function(d) { return self.isSel(d.ai); });
		// .attr("class", function(d) { return self.isSel(d.ai) ? 'gnode obj-sel' : 'gnode' });
} // updateNodes

VizBMatrix.prototype.setSel = function(absIArray)
{
	var self=this;

	this.recSel = absIArray;
	this.updateNodes();
	this.updateLinks();
} // setSel()

VizBMatrix.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		this.svg.selectAll(".cnode")
				.attr("class", 'cnode');
		this.svg.selectAll(".bmlink")
				.attr("class", 'bmlink');
	}
} // clearSel()

VizBMatrix.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizBMatrix.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()

VizBMatrix.prototype.doOptions = function()
{
	var self=this;
	var h=120;

	var insertPt = jQuery('#dialog-netgraph > .scroll-container');
	insertPt.empty();

	this.settings.pAtts.forEach(function(t, tI) {
		if (t.length > 0) {
			h += 18;
			var tID = PData.eTByN(tI);
			var tDef = PData.tByID(tID);
			var tSet = self.rels[tI];
			insertPt.append('<b>'+tDef.l+'</b><br/>');
			t.forEach(function(p, pI) {
				h += 18;
				var i = '<input type="checkbox" data-t="'+tI+'" data-index="'+pI+'"';
				if (tSet[pI]) {
					i += ' checked="checked"';
				}
				var pAtt = PData.aByID(p.pid);
				insertPt.append(i+'/> '+pAtt.def.l+'<br/>');
			});
		}
	});

	var d = jQuery("#dialog-netgraph").dialog({
		dialogClass: "no-close",
		height: h,
		width: 300,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
					self.cnx= false;
					var changed = false;
					self.settings.pAtts.forEach(function(t, tI) {
						t.forEach(function(p, pI) {
							var selected = insertPt.find('input[data-t="'+tI+'"][data-index="'+pI+'"]').prop('checked');
							if (self.rels[tI][pI] !== selected) {
								changed = true;
								self.rels[tI][pI] = selected;
							}
							if (selected) {
								self.cnx=true;
							}
						});
					});
					if (changed) {
							// As we are rendering afresh, must clear any existing selection
						self.vFrame.upSel([], false);
						self.render(null);
					}
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
} // doOptions()

VizBMatrix.prototype.hint = function()
{
	var ti, attID, att;
	var hint='';

	for (ti=0; ti<PData.eTNum(); ti++) {
		attID = this.settings.oAtts[ti];
		if (attID !== null) {
			var tID = PData.eTByN(ti);
			var tDef = PData.tByID(tID);
			att = PData.aByID(attID);
			if (hint.length > 0) {
				hint += '; ';
			}
			hint += '<b>'+ tDef.l + '</b>: '+ att.def.l;
		}
	}
	hint += '<br/>';

	pCnt=0;
	for (ti=0; ti<PData.eTNum(); ti++) {
		var pAtts = this.settings.pAtts[ti];
		pAtts.forEach(function(p, pI) {
			att = PData.aByID(p.pid);
			if (pCnt++ > 0) {
				hint += ", ";
			}
			hint += '<b><span style="color: '+p.clr+'">'+att.def.l+'</span></b>';
		});
	}
	return hint;
} // hint()


// ====================================================================
// PFilterModel: An abstract class to be subclassed by specific filters

	// INPUT: 	id = unique ID for this filter
	//			attRec = pointer to complete Attribute settings
	// NOTES:   IDs 0 and 1 are specially allocated to Highlight those respective views
function PFilterModel(id, attRec)
{
	this.id 		= id;
	this.att 		= attRec;

	this.dirty 		= 1;		// 0=clean (no recompute needed), 1=new filter (data not run through it yet), 2=settings changed (needs recompute)
		// Sublcasses can override the following:
	// this.title()
	// this.teardown()
	// this.resize()
		// All subclasses must implement the following:
	// this.setUp()
	// this.evalPrep()
	// this.eval(rec, tI)
	// this.evalDone(total)
	// this.getState()
	// this.setState(data)
} // PFilterModel

	// PURPOSE: Either set or get the dirty state of Filter
	// RETURNS: 0 ("clean"), 1 (new filter) or 2 (settings dirty, needs recompute)
	// INPUT:  set is null if only retrieving state, else 0,1,2
PFilterModel.prototype.isDirty = function(set)
{
	var old=this.dirty;
	if (set !== null) {
		this.dirty = set;
			// Signal dirty if previously clean or new filter that is now dirty for non-Highlight Filter
		if (old < 2 && set > 1 && this.id > 1) {
			jQuery("body").trigger("prsp-fdirty", { id: this.id });
		}
	}
	return this.dirty;
} // isDirty

	// PURPOSE: Return title for filter component
	// NOTES: 	Handles default case of Attribute label
PFilterModel.prototype.title = function()
{
	return this.att.def.l;
} // title()

PFilterModel.prototype.evalPrep = function()
{
} // evalPrep()

PFilterModel.prototype.evalDone = function()
{
} // evalDone()

	// PURPOSE: Return jQuery result for contents of this filter
PFilterModel.prototype.insertPt = function()
{
	return jQuery('div.filter-instance[data-id="'+this.id+'"] div.filter-body');
} // insertPt()

	// PURPOSE: Update Filter if window resized
PFilterModel.prototype.resize = function()
{
} // resize()

PFilterModel.prototype.teardown = function()
{
} // teardown()

PFilterModel.prototype.getState = function()
{
	return { };
} // getState()

PFilterModel.prototype.setState = function(state)
{
} // setState()


// ==============================================================================
// PFilterRemove: Filter class that removes all Records of selected Template type

var PFilterRemove = function(id)
{
		// Create pseudo-Attribute entry with ID in it
	PFilterModel.call(this, id, { id: '_remove' });
} // PFilterRemove()

PFilterRemove.prototype = Object.create(PFilterModel.prototype);

PFilterRemove.prototype.constructor = PFilterRemove;

PFilterRemove.prototype.title = function()
{
	return dlText.rha;
} // title()

PFilterRemove.prototype.eval = function(rec)
{
	return false;
} // eval()

PFilterRemove.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-remove').innerHTML;

	inserted.append(htmlText);
} // setup()

// ============================================
// PFilterText: Class to filter Text Attributes
// 	Instance Variables:
//		cs = true if "Case Sensitive" is checked
//		s = text in search box
//		o = search option: c[ontains], x[act] or r[egexp]
//		x = regular expression (if any)

var PFilterText = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterText()

PFilterText.prototype = Object.create(PFilterModel.prototype);

PFilterText.prototype.constructor = PFilterText;

PFilterText.prototype.evalPrep = function()
{
	var ip = this.insertPt();
	this.cs = ip.find('input.filter-text-cs').prop('checked');
	this.s = ip.find('input.filter-text').val();
	this.o = ip.find('select.filter-text-ops').val();
	switch (this.o) {
	case 'c':	// Contains
	case 'x':	// Exact
		if (!this.cs) {
			this.s = this.s.toLocaleLowerCase();
		}
		break;
	case 'r':	// Regular Expression
		this.s = new RegExp(this.s);
		break;
	}
} // evalPrep()

PFilterText.prototype.eval = function(rec)
{
	var s = this.s;

	if (s == null || s === '')
		return true;

	var t = rec.a[this.att.id];
	if (typeof t === 'undefined')
		return false;

	switch (this.o) {
	case 'c':	// Contains
		if (!this.cs) {
			t = t.toLocaleLowerCase();
		}
		return t.indexOf(s) !== -1;
	case 'x':	// Exact
		if (!this.cs) {
			t = t.toLocaleLowerCase();
		}
		return t === s;
	case 'r':	// Regular Expression
		return s.test(t);
	}
	return false;
} // eval()

PFilterText.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-text').innerHTML;

	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('input.filter-text').change(function() {
		self.isDirty(2);
	});
	inserted.find('select.filter-text-ops').change(function() {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
	inserted.find('input.filter-text-cs').click(function(event) {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
} // setup()

PFilterText.prototype.teardown = function()
{
	var inserted = this.insertPt();
	inserted.find('input.filter-text').off("change");
	inserted.find('input.filter-text-ops').off("change");
	inserted.find('input.filter-text-cs').off("change");
} // teardown()

PFilterText.prototype.getState = function()
{
	var ip = this.insertPt();
	return { cs: ip.find('input.filter-text-cs').prop('checked'),
			 t: ip.find('input.filter-text').val(),
			 o: ip.find('select.filter-text-ops').val()
		 	};
} // getState()

	// NOTE: Perspective data ≤ 1.6 doesn't have o[ptions] setting
PFilterText.prototype.setState = function(state)
{
	var ip = this.insertPt();
	ip.find('input.filter-text-cs').prop('checked', state.cs);
	ip.find('input.filter-text').val(state.t);
	if (typeof state.o === 'undefined') {	// Handle older Perspective data
		ip.find('select.filter-text-ops').val('c');
	} else {
		ip.find('select.filter-text-ops').val(state.o);
	}
} // setState()


// ==============================================
// PFilterTags: Class to filter Tags Attributes
//				Only slightly different from Text
// 	Instance Variables:
//		cs = true if "Case Sensitive" is checked
//		s = text in search box
//		o = search option: c[ontains], x[act] or r[egexp]
//		x = regular expression (if any)

var PFilterTags = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterText()

PFilterTags.prototype = Object.create(PFilterModel.prototype);

PFilterTags.prototype.constructor = PFilterTags;

PFilterTags.prototype.evalPrep = function()
{
	var ip = this.insertPt();
	this.cs = ip.find('input.filter-text-cs').prop('checked');
	this.s = ip.find('input.filter-text').val();
	this.o = ip.find('select.filter-text-ops').val();
	switch (this.o) {
	case 'c':	// Contains
	case 'x':	// Exact
		if (!this.cs) {
			this.s = this.s.toLocaleLowerCase();
		}
		break;
	case 'r':	// Regular Expression
		this.s = new RegExp(this.s);
		break;
	}
} // evalPrep()

PFilterTags.prototype.eval = function(rec)
{
	var s = this.s;

	if (s == null || s === '')
		return true;

	var t = rec.a[this.att.id];
	if (typeof t === 'undefined')
		return false;

	var cs=this.cs, o=this.o;
		// Test each of this Record’s tag values
		// Return true on first match
	for (var i=0; i<t.length; i++) {
		var d=t[i];

		switch (o) {
		case 'c':	// Contains
			if (!cs) {
				d = d.toLocaleLowerCase();
			}
			if (d.indexOf(s) !== -1) {
				return true;
			}
			break;
		case 'x':	// Exact
			if (!cs) {
				d = d.toLocaleLowerCase();
			}
			if (d === s) {
				return true;
			}
			break;
		case 'r':	// Regular Expression
			if (s.test(d)) {
				return true;
			}
		}
	} // for each tag
	return false;
} // eval()

PFilterTags.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-tags').innerHTML;

	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('input.filter-text').change(function() {
		self.isDirty(2);
	});
	inserted.find('select.filter-text-ops').change(function(event) {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
	inserted.find('input.filter-text-cs').click(function(event) {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
} // setup()

PFilterTags.prototype.teardown = function()
{
	var inserted = this.insertPt();
	inserted.find('input.filter-text').off("change");
	inserted.find('input.filter-text-ops').off("change");
	inserted.find('input.filter-text-cs').off("click");
} // teardown()

PFilterTags.prototype.getState = function()
{
	var ip = this.insertPt();
	return { cs: ip.find('input.filter-text-cs').prop('checked'),
			 t: ip.find('input.filter-text').val(),
			 o: ip.find('select.filter-text-ops').val()
		 	};
} // getState()

	// NOTE: Perspective data ≤ 1.6 has p[artial] flag but not o[ption]
PFilterTags.prototype.setState = function(state)
{
	var ip = this.insertPt();
	ip.find('input.filter-text-cs').prop('checked', state.cs);
	ip.find('input.filter-text').val(state.t);
	if (typeof state.p != 'undefined') {	// Handle older Perspective data
		if (state.p) {
			ip.find('select.filter-text-ops').val('c');
		} else {
			ip.find('select.filter-text-ops').val('x');
		}
	} else {
		ip.find('select.filter-text-ops').val(state.o);
	}
} // setState()

// ===================================================
// PFilterVocab: Class to filter Vocabulary Attributes

var PFilterVocab = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterVocab()

PFilterVocab.prototype = Object.create(PFilterModel.prototype);

PFilterVocab.prototype.constructor = PFilterVocab;

PFilterVocab.prototype.evalPrep = function()
{
		// Create sorted array of all valid Vocabulary terms
	var self = this;
	this.sel = [];
	var v = this.insertPt().find('div.filter-vocab-row input:checked');
	v.each(function() {
		var attID = jQuery(this).parent().data('id');
		if (attID)
			self.sel.push(attID);
	});
	this.sel.sort();

		// Create counters
	this.ctrs = new Uint16Array(this.sel.length);
	for (var i=0; i<this.sel.length; i++)
		this.ctrs[i] = 0;
} // evalPrep()

PFilterVocab.prototype.eval = function(rec)
{
	if (this.sel.length === 0)
		return false;
	var v = rec.a[this.att.id];
	if (typeof v === 'undefined')
		return false;

		// Try all possible Attribute values (will be array)
	var s, vi;
	for (var i=0; i<v.length; i++) {
		vi = v[i];
		s = _.sortedIndex(this.sel, vi);
		if (this.sel[s] === vi) {
			this.ctrs[s]++;
			return true;
		}
	}
	return false;
} // eval()

PFilterVocab.prototype.evalDone = function(total)
{
	var self=this;
	var attID, s, w, j;
	var v = this.insertPt().find('div.filter-vocab-row');
	v.each(function() {
		j = jQuery(this);
		attID = j.data('id');
		if (attID) {
			s = _.sortedIndex(self.sel, attID);
			if (self.sel[s] === attID) {
				w = (total > 0) ? Math.round((self.ctrs[s] * 100) / total) : 0;
			} else
				w = 0;
			j.next().width(w+"%");
		}
	});
} // evalDone()

PFilterVocab.prototype.setup = function()
{
	var self = this;
	var t = '<div class="filter-vocab-container"><div class="filter-vocab-hsa"><input type="checkbox" checked="checked" data-index=-1><i> '+
		dlText.sha+'</i></div>';
	this.att.l.forEach(function(lEntry, lI) {
		t += '<div class="filter-vocab-entry" data-index="'+lI+'"><div class="filter-vocab-row" data-id="'+
				lEntry.l+'">'+'<input type="checkbox" class="term-parent" checked="checked">'+
				lEntry.l+'</div><div class="filter-vocab-bar" style="background-color:'+lEntry.v+'"></div>';
		lEntry.z.forEach(function(zEntry, zI) {
			t += '<div class="filter-vocab-row" data-id="'+zEntry.l+'"><input type="checkbox" data-parent="'+lI+'" checked="checked">'+
				zEntry.l+'</div>';
			if (zEntry.v == null || zEntry.v === '') {
				t += '<div class="filter-vocab-bar" style="background-color:'+lEntry.v+'"></div>';
			} else {
				t += '<div class="filter-vocab-bar" style="background-color:'+zEntry.v+'"></div>';
			}
		});
		t+= '</div>';
	});

	var ip = this.insertPt();
	ip.append(t+'</div>');
		// A click on any checkboxes dirties filter
	ip.click(function(event) {
		var t = event.target;
		if (t.nodeName === 'INPUT') {
				// Show/Hide All
			if (typeof t.dataset.index !== 'undefined' && t.dataset.index == -1) {
				var s = t.checked;
				var cx = ip.find('div.filter-vocab-row input');
				cx.prop("checked", s);
			} else if (event.target.className === 'term-parent' && t.checked) {
				var index = event.target.parentElement.parentElement.dataset.index;
				ip.find('input[data-parent="'+index+'"]').prop("checked", true);
			}
			self.isDirty(2);
		}
	});
} // setup()

PFilterVocab.prototype.teardown = function()
{
	this.insertPt().off("click");
} // teardown()

PFilterVocab.prototype.getState = function()
{
	var s=[];
	var v = this.insertPt().find('div.filter-vocab-row input:checked');
	v.each(function() {
		var attID = jQuery(this).parent().data('id');
		if (attID)
			s.push(attID);
	});
	s.sort();
	return { s: s };
} // getState()

PFilterVocab.prototype.setState = function(state)
{
	var vr = this.insertPt().find('div.filter-vocab-row');
	var id;
	vr.each(function() {
		var j = jQuery(this);
		var id = j.data('id');
		var c = _.indexOf(state.s, id, true);
		j.find('input').prop("checked", c !== -1);
	});
} // setState()


// ================================================
// PFilterNum: Class to filter Number Attributes
//		rCats = category buckets for Number range (only if min and max defined!)
//		ctrs = array of integers for category counters (if rCats exists)
//		uNums = Working array of [min, max] from user entry
//		b0 = index of bucket for brush from (0-based) -- maintained dynamically if rCats exists
//		b1 = index of bucket for brush to -- maintained dynamically if rCats exists
//		min = minimum allowed Number (inclusive) -- maintained dynamically
//		max = maximum allowed Number (inclusive)  -- maintained dynamically
//		u = true if undefined checkbox is checked -- checked at evalPrep, savePerspective
//		xScale, yScale = D3 scales
//		chart = SVG for graph
//		brush = D3 brush object
//		brushg = SVG for brush

var PFilterNum = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterNum()

PFilterNum.prototype = Object.create(PFilterModel.prototype);

PFilterNum.prototype.constructor = PFilterNum;

	// PURPOSE: Set text in edit boxes acc. to min / max values
PFilterNum.prototype.refreshBoxes = function()
{
	var insert = this.insertPt();
	insert.find('.from').removeClass('error').val(this.min);
	insert.find('.to').removeClass('error').val(this.max);
	insert.find('.filter-update').prop('disabled', true);
} // refreshBoxes()

	// PURPOSE: Check values in edit boxes
	// SIDE-FX: Set or clear "error" class; sets values in uDates[]
PFilterNum.prototype.evalBoxes = function(insert)
{
	var self=this;
	var nRE = /^(\d+)$/;
	var attMin = (typeof this.att.r.min === 'undefined') ? null : this.att.r.min;
	var attMax = (typeof this.att.r.max === 'undefined') ? null : this.att.r.max;

	var failFrom, failTo;

		// RETURNS: true if passes conditions
	function checkOne(sel, i)
	{
		var fail=false;
		var val;

		function setError()
		{
			fail = true;
			insert.find(sel).addClass('error');
		} // setError()
		function noError()
		{
			insert.find(sel).removeClass('error');
		} // noError()

		var d = insert.find(sel);		// DOM element
		var t = d.val();				// Text value
		var r = nRE.exec(t);			// RegExp result
		if (r) {
			noError();
			val = parseInt(r[1], 10);
		} else
			setError();
			// If OK so far, check against bounds
		if (!fail) {
				// Check against bounds
			if (i == 0) {
				if (attMin !== null && val < attMin) {
					setError();
				}
			} else {
				if (attMax !== null && val > attMax) {
					setError();
				}
			}
		}
		self.uNums[i] = val;
		return fail;
	} // checkSet()

	failFrom = checkOne('.from', 0);
	failTo = checkOne('.to', 1);
	if (this.uNums[0] > this.uNums[1]) {
		failTo = true;
	}
	insert.find('.filter-update').prop('disabled', failFrom || failTo);
	return !(failFrom || failTo);
} // evalBoxes()

	// PURPOSE: Try to use values in boxes to calculate Filter settings,
	//				as when user clicks "Use Number"
	// INPUT: 	insert = insertPt() for this filter
	//			dirty = should change of values raise dirty signal?
	// SIDE-FX: Sets min, max, b0, b1 and brush from text boxes
PFilterNum.prototype.useBoxes = function(insert, dirty)
{
	if (this.evalBoxes(insert)) {
			// Update min, max
		this.min = this.uNums[0];
		this.max = this.uNums[1];
			// If rCats exist, find appropriate bounds for brush and redraw
		if (this.rCats !== null) {
			var b0, b1;
			for (b0=0; b0<this.rCats.length; b0++) {
				if (this.min >= this.rCats[b0].min && this.min <= this.rCats[b0].max)
					break;
			}
			for (b1=b0; b1<this.rCats.length; b1++) {
				if (this.max <= this.rCats[b1].max)
					break;
			}
			b1 = (b1 === this.rCats.length) ? this.rCats.length-1 : b1;
			this.b0 = b0;
			this.b1 = b1;
				// This automatically calls brushended, which will update custom handles
			this.brushg.call(this.brush.move, [b0, b1+1].map(this.xScale));
		}
		insert.find('.filter-update').prop('disabled', true);
			// Signal dirty filter after everything else updated
		if (dirty) {
			this.isDirty(2);
		}
	}
} // useBoxes()

	// ASSUMES: Code handling brush has set min & max
PFilterNum.prototype.evalPrep = function()
{
	if (this.rCats !== null) {
		for (var i=0; i<this.rCats.length; i++)
			this.ctrs[i] = 0;
	}
} // evalPrep()

PFilterNum.prototype.eval = function(rec)
{
	var num = rec.a[this.att.id];
	if (typeof num === 'undefined')
		return false;

		// Only true when i=0 -- no bar graph to update
	if (num === '?') {
		return this.u;
	}

	if ((num < this.min) || (num > this.max))
		return false;

	if (this.rCats === null)
		return true;

	var c;
		// in range but now must find category it matched to inc count
	for (var i=this.b0; i<= this.b1; i++) {
		c=this.rCats[i];
		if (c.min <= num && num <= c.max) {
			this.ctrs[i]++;
			break;
		}
	}
	return true;
} // eval()

PFilterNum.prototype.evalDone = function(total)
{
	if (this.rCats !== null) {
		var self=this;
		var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;
		var p = new Uint16Array(this.ctrs.length);
		for (var x=0; x<this.ctrs.length; x++)
			p[x] = (total > 0) ? Math.round((this.ctrs[x] * 100) / total) : 0;
		this.chart.selectAll(".bar")
			.transition().duration(500)
			.attr("height", function(d, i) { return innerH - self.yScale(p[i]); })
			.attr("y", function(d, i) { return self.yScale(p[i]); });
	}
} // evalDone()

PFilterNum.prototype.setup = function()
{
	var self=this;
	var xScale, rScale;
	var inprocess=false;		// Prevent brush handle recursion

		// Set defaults
	this.u   = false;
	this.uNums = new Array(2);

	var insert = this.insertPt();
	insert.append(document.getElementById('dltext-filter-nums').innerHTML);
		// Only enabled "allow undefined" if enabled by Attribute
	if (typeof this.att.r.u === 'undefined') {
		insert.find(".allow-undef").prop('disabled', true);
	} else {
		insert.find(".allow-undef").click(function() {
			self.u = insert.find('input.allow-undef').prop('checked');
			self.isDirty(2);
		});
	}

	this.rCats = PData.cRNew(this.att, false, false);

		// Create range category viz & slider
	if (this.rCats !== null) {
		this.ctrs = new Uint16Array(this.rCats.length);

		var cHs;	// custom brush handle elemnts

			// Set defaults
			// indices of rCats contained by brush (inclusive)
		this.b0  = 0;
		this.b1  = this.rCats.length-1;
		this.min = this.rCats[0].min;
		this.max = this.rCats[this.b1].max;

		var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;

			// RETURNS:	SVG path for brush resize handles
		function resizePath(d, i)
		{
			var	x = i ? 1 : -1,
				y = innerH / 4; // Relative positon of handles
			return "M"+(.5*x)+","+y+"A6,6 0 0 "+i+" "+(6.5*x)+","+(y+6)
				+"V"+(3*y-6)+"A6,6 0 0 "+i+" "+(.5*x)+","+(3*y)
				+"Z"+"M"+(2.5*x)+","+(y+8)+"V"+(3*y-8)
				+"M"+(4.5*x)+","+(y+8)+"V"+(3*y-8);
		} // resizePath()

			// PURPOSE:	Update custom brush handles; clip to box bounds ONLY if doing by hand
			// NOTES:	Different behavior brush vs. end:
			//				If end, then clip according to range bar edges;
			//				If brush, just follow the current seletion
		function brushended()
		{
			var sx;			// pixel x positions of brush selection
			var sel=d3.event.selection;
			if (sel == null) { return; }	// Ignore empty selections

				// Just move the handles if user still dragging or move comes from code (brush.move)
			if (!d3.event.sourceEvent || d3.event.type === "brush") {
				self.cHs.attr("display", null)
					.attr("transform", function(d, i) {
						return "translate(" + sel[i] + ",0)";
					});
			} else if (d3.event.type === "end") {
					// Don't recurse if already processing
				if (inprocess) { return; }
				inprocess = true;
					 // Convert d3.event.selection [x0, x1] in pixels to array indices
				var d = sel.map(xScale.invert);
				if (d[0] > d[1]) {
					var temp = d[0];
					d[0] = d[1];
					d[1] = temp;
				}
				d[0] = Math.floor(d[0]);
				d[1] = Math.min(Math.ceil(d[1]), self.rCats.length);

				self.b0  = d[0];
				self.b1  = d[1]-1;

				var sx = d.map(xScale);
				self.brush.move(self.brushg, sx);

					// Update custom brush handles
				self.cHs.attr("display", null)
					.attr("transform", function(dd, i) {
						return "translate(" + sx[i] + ",0)";
					});

				self.min = self.rCats[self.b0].min;
				self.max = self.rCats[self.b1].max;
				self.refreshBoxes();
				inprocess=false;
				self.isDirty(2);
			} // if brush move end
		} // brushended()

			// Create left-/right-arrows ONLY if not a Highlight filter
		if (this.id > 1) {
				// Create arrow buttons for moving selection
			insert.find(".move-left")
				.button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false })
				.click(function() {
						// Can't move left if already left-most
					if (self.b0 > 0) {
						self.b0 -= 1;
						self.b1 -= 1;
						self.min = self.rCats[self.b0].min;
						self.max = self.rCats[self.b1].max;
						self.refreshBoxes();
							// This automatically updates custom brush handles
						self.brushg.call(self.brush.move, [self.b0, self.b1+1].map(self.xScale));
							// Send Dirty filter signal
						self.isDirty(2);
					}
				});
				// Create arrow buttons for moving selection
			insert.find(".move-right")
				.button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false })
				.click(function() {
						// Can't move right if already right-most
					if (self.b1 < (self.rCats.length-1)) {
						self.b0 += 1;
						self.b1 += 1;
						self.min = self.rCats[self.b0].min;
						self.max = self.rCats[self.b1].max;
						self.refreshBoxes();
							// This automatically updates custom brush handles
						self.brushg.call(self.brush.move, [self.b0, self.b1+1].map(self.xScale));
							// Send Dirty filter signal
						self.isDirty(2);
					}
				});
		} else {
			insert.find(".move-left").remove();
			insert.find(".move-right").remove();
		} // if !Highlight

		var colW=0;
		this.rCats.forEach(function(c) {
			colW=Math.max(colW, c.l.length);
		});
		colW=Math.max(D3FG_BAR_WIDTH, colW*7);	// 7 px/letter estimate

		var innerW = this.rCats.length*colW;
		xScale = d3.scaleLinear().domain([0, this.rCats.length]).range([0, innerW]);
		this.xScale = xScale;

		var yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);
		this.yScale = yScale;

		rScale = d3.scaleBand()
				.domain(this.rCats.map(function(rc) { return rc.l; }))
				.range([0, innerW]);

		var yAxis = d3.axisLeft(yScale).ticks(4);
		var xAxis = d3.axisBottom(rScale);

		var chart = d3.select(insert.get(0)).append("svg")
			.attr("width", innerW+D3FG_MARGINS.left+D3FG_MARGINS.right)
			.attr("height", innerH+D3FG_MARGINS.top+D3FG_MARGINS.bottom)
			.append("g")
			.attr("transform", "translate("+D3FG_MARGINS.left+","+D3FG_MARGINS.top+")");

		this.chart = chart;

		chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0,"+innerH+")")
			.call(xAxis);

		chart.append("g")
			.attr("class", "y axis")
			.call(yAxis);

			// Initialize bars at 100%
		chart.selectAll(".bar")
			.data(this.rCats)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d, i) { return xScale(i)+2; })
			.attr("y", function(d) { return yScale(100); })
			.attr("fill", function(d) { return d.c; })
			.attr("height", function(d) { return innerH - yScale(100); })
			.attr("width", colW-4);

		this.brush = d3.brushX();
		this.brush.extent([[0,-1],[innerW, innerH+2]]);
		this.brushg = chart.append("g");
			// Call brush to create SVG elements
		this.brushg.attr("class", "brush")
			.call(this.brush);
			// Create custom handle SVG elements
		this.cHs = this.brushg.selectAll(".handle--custom")
			.data([{type: "w"}, {type: "e"}])
			.enter().append("path");
		this.cHs.attr("d", resizePath);

		this.brush.on("brush end", brushended);
			// Set SVG element positions and make visible
		this.brush.move(this.brushg, [0, innerW]);
	} else {
			// no rCats because of lack of min or max bounds
		this.min = typeof att.r.min === 'undefined' ? 0 : att.r.min;
		this.max = typeof att.r.max === 'undefined' ? 100 : att.r.max;
	}

	this.refreshBoxes();

		// Try to evaluate values whenever user enters something
	insert.find("input[type=text]").change(function() {
		self.evalBoxes(insert);
	});
		// Try to use Dates
	insert.find(".filter-update").click(function() {
		self.useBoxes(insert, true);
	});
} // setup()

PFilterNum.prototype.teardown = function()
{
	this.brush.on("brush end", null);
	var insert = this.insertPt();
	insert.find("input").off("change");
	insert.find(".allow-undef").off("click");
	insert.find(".filter-update").off("click");
} // teardown()

PFilterNum.prototype.getState = function()
{
	return { min: this.min, max: this.max, u: this.u };
} // getState()

PFilterNum.prototype.setState = function(state)
{
	var insert = this.insertPt();

	insert.find('input.allow-undef').prop('checked', state.u);
	this.u = state.u;
	insert.find('.from').removeClass('error').val(state.min);
	insert.find('.to').removeClass('error').val(state.max);
	this.useBoxes(insert, false);
} // setState()


// ==============================================
// PFilterDates: Class to filter Dates Attributes
//	Instance Variables:
//		rCats = category buckets for Date range
//		ctrs = array of integers for category counters
//		uDates = Working array of {y,m,d,ms}[min, max] from user entry
//		b0 = index of bucket for brush from (0-based) -- maintained dynamically
//		b1 = index of bucket for brush to -- maintained dynamically
//		min = minimum allowed Date (inclusive) -- maintained dynamically
//		max = maximum allowed Date (exclusive)  -- maintained dynamically
//		c = 'o' if overlap, 'c' if contain within range -- checked at eval time
//		u = true if undefined checkbox is checked -- checked at evalPrep, savePerspective
//		xScale, yScale = D3 scales
//		chart = SVG for graph
//		brush = D3 brush object
//		brushg = SVG for brush
//		cHs = custom brush handle elements

var PFilterDates = function(id, attRec, req)
{
	PFilterModel.call(this, id, attRec, req);
} // PFilterDates()

PFilterDates.prototype = Object.create(PFilterModel.prototype);

PFilterDates.prototype.constructor = PFilterDates;

	// PURPOSE: Set text in edit boxes acc. to min / max values
PFilterDates.prototype.refreshBoxes = function()
{
	var insert = this.insertPt();

	function upDate(date, sel)
	{
		var y = date.getUTCFullYear();
		var m = date.getUTCMonth() + 1;
		var d = date.getUTCDate();

		insert.find(sel+'-y').removeClass('error').val(y);
		insert.find(sel+'-m').removeClass('error').val(m);
		insert.find(sel+'-d').removeClass('error').val(d);
	} // upDate()
	upDate(this.min, '.from');
	upDate(this.max, '.to');
	insert.find('.filter-update').prop('disabled', true);
} // refreshBoxes()

	// PURPOSE: Check values in edit boxes
	// SIDE-FX: Set or clear "error" class; sets values in uDates[]
PFilterDates.prototype.evalBoxes = function(insert)
{
	var self=this;
	var yRE = /^(-?\d+)$/;
	var dRE = /^(\d{1,2})$/;

	var failFrom, failTo;

		// RETURNS: true if passes conditions
	function checkSet(sel, i)
	{
		var fail=false;
		var thisDate={y: 0, m: 0, d: 0, ms: null};

		function setError(e)
		{
			fail = true;
			insert.find(sel+e).addClass('error');
		} // setError()
		function noError(e)
		{
			insert.find(sel+e).removeClass('error');
		} // noError()

		var d = insert.find(sel+'-y');		// DOM element
		var t = d.val();					// Text value
		var r = yRE.exec(t);				// RegExp result
		if (r) {
			noError('-y');
			thisDate.y = parseInt(r[1], 10);
		} else
			setError('-y');
		d = insert.find(sel+'-m');
		t = d.val();
		r = dRE.exec(t);
		if (r) {
			thisDate.m = parseInt(r[1], 10);
			if (thisDate.m < 1 || thisDate.m > 12)
				setError('-m');
			else
				noError('-m');
		} else
			setError('-m');
		d = insert.find(sel+'-d');			// DOM element
		t = d.val();						// Text value
		r = dRE.exec(t);					// RegExp result
		if (r) {
			thisDate.d = parseInt(r[1], 10);
			if (thisDate.d < 1 || thisDate.d > 31)
				setError('-d')
			else
				noError('-d');
		} else
			setError('-d');
			// If OK so far, check against bounds
		if (!fail) {
				// <end> must be false to ensure ms is less than rCats.max for check
			thisDate.ms = PData.d3Nums(thisDate.y, thisDate.m, thisDate.d, false);
				// Check against bounds
			if (i == 0) {
				if (thisDate.ms < self.rCats[0].min) {
					setError('-y');
					setError('-m');
					setError('-d');
				}
			} else {
				if (thisDate.ms > self.rCats[self.rCats.length-1].max) {
					setError('-y');
					setError('-m');
					setError('-d');
				}
			}
		}
		self.uDates[i] = thisDate;
		return fail;
	} // checkSet()

	failFrom = checkSet('.from', 0);
	failTo = checkSet('.to', 1);
	if (this.uDates[0].ms > this.uDates[1].ms) {
		failTo = true;
	}
	insert.find('.filter-update').prop('disabled', failFrom || failTo);
	return !(failFrom || failTo);
} // evalBoxes()

	// PURPOSE: Try to use values in boxes to calculate Filter settings,
	//				as when user clicks "Use Date"
	// INPUT: 	insert = insertPt() for this filter
	//			dirty = should change of values raise dirty signal?
	// SIDE-FX: Sets min, max, b0, b1 and brush from text boxes
PFilterDates.prototype.useBoxes = function(insert, dirty)
{
	if (this.evalBoxes(insert)) {
			// Update min, max -- as max is exclusive date, don't modify it!
		this.min = this.uDates[0].ms;
		this.max = this.uDates[1].ms;
			// Find appropriate rCats bounds for brush and redraw
		var b0, b1;
		for (b0=0; b0<this.rCats.length; b0++) {
			if (this.min < this.rCats[b0].max)
				break;
		}
		for (b1=b0; b1<this.rCats.length; b1++) {
			if (this.max <= this.rCats[b1].max)
				break;
		}
		b1 = (b1 === this.rCats.length) ? this.rCats.length-1 : b1;
		this.b0 = b0;
		this.b1 = b1;
			// This automatically updates custom brush handles
		this.brushg.call(this.brush.move, [b0, b1+1].map(this.xScale));
		insert.find('.filter-update').prop('disabled', true);
			// Send Dirty filter signal after all data prepared (if allowed)
		if (dirty) {
			this.isDirty(2);
		}
	}
} // useBoxes()

PFilterDates.prototype.evalPrep = function()
{
	this.c = jQuery('input[name=dctrl-'+this.id+']:checked').val();
	for (var i=0; i<this.rCats.length; i++)
		this.ctrs[i] = 0;
} // evalPrep()

	// ASSUMES: Brush code in setup sets min & max
PFilterDates.prototype.eval = function(rec)
{
	function makeDate(y, m, d, field, end) {
		var dm, dd;
		if (typeof field.m !== 'undefined') {
			dm = field.m;
			if (typeof field.d !== 'undefined') {
				dd = field.d;
			} else {
				dd = d;
			}
		} else {
			dm = m;
			dd = d;
		}
		return PData.d3Nums(y, dm, dd, end);
	} // makeDate()

	var d = rec.a[this.att.id];
	if (typeof d === 'undefined')
		return false;

		// Check for 'undefined' exception -- we don't have bar graph for this
	if (d === '?')
		return this.u;

		// Is it a single event?
	if (typeof d.max === 'undefined') {
		var s = makeDate(d.min.y, 1, 1, d.min, false);
		if (s < this.min || s >= this.max)
			return false;
	} else {
		var s = makeDate(d.min.y, 1, 1, d.min, false);
		var e;
		if (d.max === 'open')
			e = TODAY;
		else 	// Since exclusive compare, don't push past start of day
			e = makeDate(d.max.y, 12, 31, d.max, false);

			// Overlap?
		if (this.c === 'o') {
			if (e < this.min || s >= this.max)
				return false;
		} else {
			if (this.min > s || e > this.max)
				return false;
		}
	}

		// Now find category it belongs to
	var c;
	for (var i=this.b0; i<=this.b1; i++) {
		c = this.rCats[i];
		if (c.min <= s && s < c.max) {
			this.ctrs[i]+=1;
			return true;
		}
	}
	return true;	// Ensure success even without bar graph
} // eval()

PFilterDates.prototype.evalDone = function(total)
{
	var self=this;
	var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;
	var p = new Uint16Array(this.ctrs.length);
	for (var x=0; x<this.ctrs.length; x++)
		p[x] = (total > 0) ? Math.round((this.ctrs[x] * 100) / total) : 0;
	this.chart.selectAll(".bar")
		.transition().duration(500)
		.attr("height", function(d, i) { return innerH - self.yScale(p[i]); })
		.attr("y", function(d, i) { return self.yScale(p[i]); });
} // evalDone()

PFilterDates.prototype.setup = function()
{
	var self = this;
	var xScale, rScale;
	var inprocess=false;		// Prevent brush handle recursion

	this.rCats = PData.cRNew(this.att, false, false);
	this.ctrs = new Uint16Array(this.rCats.length);

		// Set defaults
	this.b0  = 0;
	this.b1  = this.rCats.length-1;
	this.u   = false;
	this.min = this.rCats[0].min;
	this.max = this.rCats[this.b1].max;

	this.uDates = new Array(2);

	var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;

		// RETURNS:	SVG path for brush resize handles
	function resizePath(d, i)
	{
		var	x = i ? 1 : -1,
			y = innerH / 4; // Relative positon of handles
		return "M"+(.5*x)+","+y+"A6,6 0 0 "+i+" "+(6.5*x)+","+(y+6)
			+"V"+(3*y-6)+"A6,6 0 0 "+i+" "+(.5*x)+","+(3*y)
			+"Z"+"M"+(2.5*x)+","+(y+8)+"V"+(3*y-8)
			+"M"+(4.5*x)+","+(y+8)+"V"+(3*y-8);
	} // resizePath()

		// PURPOSE:	Update custom brush handles; clip to box bounds ONLY if doing by hand
		// NOTES:	Different behavior brush vs. end:
		//				If end, then clip according to range bar edges;
		//				If brush, just follow the current seletion
	function brushended()
	{
		var sx;			// pixel x positions of brush selection
			// Ignore empty selections
		var sel=d3.event.selection;
		if (sel == null) { return; }
			// Just move the handles if user still dragging or move comes from code (brush.move)
		if (!d3.event.sourceEvent || d3.event.type === "brush") {
			self.cHs.attr("display", null)
				.attr("transform", function(d, i) {
					return "translate(" + sel[i] + ",0)";
				});
		} else if (d3.event.type === "end") {
				// Don't recurse if already processing
			if (inprocess) { return; }
			inprocess = true;
				// Convert d3.event.selection [x0, x1] in pixels to array indices
			var d = sel.map(self.xScale.invert);
			if (d[0] > d[1]) {
				var temp = d[0];
				d[0] = d[1];
				d[1] = temp;
			}
			d[0] = Math.floor(d[0]);
			d[1] = Math.min(Math.ceil(d[1]), self.rCats.length);

			self.b0  = d[0];
			self.b1  = d[1]-1;
			sx = d.map(self.xScale);

			self.brush.move(self.brushg, sx);

				// Update custom brush handles
			self.cHs.attr("display", null)
				.attr("transform", function(d, i) {
					return "translate(" + sx[i] + ",0)";
				});

			self.min = self.rCats[self.b0].min;
			self.max = self.rCats[self.b1].max;
			self.refreshBoxes();
			inprocess=false;
			self.isDirty(2);
		}
	} // brushended()

	var insert = this.insertPt();

	var colW=0;
	this.rCats.forEach(function(c) {
		colW=Math.max(colW, c.l.length);
	});
	colW=Math.max(D3FG_BAR_WIDTH, colW*7);		// estimated 7 px/letter

	var innerW = this.rCats.length*colW;
	xScale = d3.scaleLinear().domain([0, this.rCats.length]).range([0, innerW]);
	this.xScale = xScale;

	var yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);
	this.yScale = yScale;

	rScale = d3.scaleBand()
			.domain(this.rCats.map(function(rc) { return rc.l; }))
			.range([0, innerW]);

	var yAxis = d3.axisLeft(yScale).ticks(4);
	var xAxis = d3.axisBottom(rScale);

	var fh = _.template(document.getElementById('dltext-filter-dates').innerHTML);
	insert.append(fh({ id: this.id }));
		// Dirty filter if user changes overlap/contain setting
	insert.find("input[name=dctrl-"+self.id+"]").change(function() {
		self.isDirty(2);
	});
		// Only enabled "allow undefined" if enabled by Attribute
	if (typeof this.att.r.u === 'undefined') {
		insert.find(".allow-undef").prop('disabled', true);
	} else {
		insert.find(".allow-undef").click(function() {
			self.u = insert.find('input.allow-undef').prop('checked');
			self.isDirty(2);
		});
	}

	this.refreshBoxes();

		// Try to evaluate Date values whenever user enters something
	insert.find("input[type=text]").change(function() {
		self.evalBoxes(insert);
	});
		// Try to use Dates
	insert.find(".filter-update").click(function() {
		self.useBoxes(insert, true);
	});

		// Create left-/right-arrows ONLY if not a Highlight filter
	if (this.id > 1) {
			// Create arrow buttons for moving selection
		insert.find(".move-left")
			.button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false })
			.click(function() {
					// Can't move left if already left-most
				if (self.b0 > 0) {
					self.b0 -= 1;
					self.b1 -= 1;
					self.min = self.rCats[self.b0].min;
					self.max = self.rCats[self.b1].max;
					self.refreshBoxes();
						// This automatically updates custom brush handles
					self.brushg.call(self.brush.move, [self.b0, self.b1+1].map(self.xScale));
						// Send Dirty filter signal
					self.isDirty(2);
				}
			});
			// Create arrow buttons for moving selection
		insert.find(".move-right")
			.button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false })
			.click(function() {
					// Can't move right if already right-most
				if (self.b1 < (self.rCats.length-1)) {
					self.b0 += 1;
					self.b1 += 1;
					self.min = self.rCats[self.b0].min;
					self.max = self.rCats[self.b1].max;
					self.refreshBoxes();
						// This automatically updates custom brush handles
					self.brushg.call(self.brush.move, [self.b0, self.b1+1].map(self.xScale));
						// Send Dirty filter signal
					self.isDirty(2);
				}
			});
	} else {
		insert.find(".move-left").remove();
		insert.find(".move-right").remove();
	} // if !Highlight

	var chart = d3.select(insert.get(0)).append("svg")
		.attr("width", innerW+D3FG_MARGINS.left+D3FG_MARGINS.right)
		.attr("height", innerH+D3FG_MARGINS.top+D3FG_MARGINS.bottom)
		.append("g")
		.attr("transform", "translate("+D3FG_MARGINS.left+","+D3FG_MARGINS.top+")");
	this.chart = chart;

	chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0,"+innerH+")")
		.call(xAxis);

	chart.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	chart.selectAll(".bar")
		.data(this.rCats)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d, i) { return xScale(i)+2; })
		.attr("y", function(d) { return yScale(100); })
		.attr("fill", function(d) { return d.c; })
		.attr("height", function(d) { return innerH - yScale(100); })
		.attr("width", colW-4);

	this.brush = d3.brushX();
	this.brush.extent([[0,-1],[innerW, innerH+2]]);
	this.brushg = chart.append("g");
		// Call brush to create SVG elements
	this.brushg.attr("class", "brush")
		.call(this.brush);
		// Create custom handle SVG elements
	this.cHs = this.brushg.selectAll(".handle--custom")
		.data([{type: "w"}, {type: "e"}])
		.enter().append("path");
	this.cHs.attr("d", resizePath);

	this.brush.on("brush end", brushended);
		// Set SVG element positions and make visible
	this.brush.move(this.brushg, [0, innerW]);
} // setup()

PFilterDates.prototype.teardown = function()
{
	this.brush.on("brush end", null);
	var insert = this.insertPt();
	insert.find("input").off("change");
	insert.find(".allow-undef").off("click");
	insert.find(".filter-update").off("click");
} // teardown()

PFilterDates.prototype.getState = function()
{
		// Construct min-max Dates
	function makeDate(d)
	{
		return 	d.getUTCFullYear()+'-'+(d.getUTCMonth()+1)+'-'+d.getUTCDate();
	}
	var c = jQuery('input[name=dctrl-'+this.id+']:checked').val();
	return { min: makeDate(this.min), max: makeDate(this.max), c: c, u: this.u };
} // getState()

PFilterDates.prototype.setState = function(state)
{
	var insert = this.insertPt();

	function setBoxes(s, d)
	{
		var c = d.split('-');
		var i=0;
			// Only 4 components if begins w/- (years BCE)
		if (c.length === 4) {
			insert.find(s+'-y').removeClass('error').val('-'+c[1]);
			i=1;
		} else {
			insert.find(s+'-y').removeClass('error').val(c[0]);
		}
		insert.find(s+'-m').removeClass('error').val(c[++i]);
		insert.find(s+'-d').removeClass('error').val(c[++i]);
	}

	jQuery('input[name="dctrl-'+this.id+'"]').val([state.c]);
	insert.find('input.allow-undef').prop('checked', state.u);
	this.u = state.u;
	setBoxes('.from', state.min);
	setBoxes('.to', state.max);
	this.useBoxes(insert, false);
} // setState()


// =================================================
// PFilterDSlider: Class to filter Dates with Slider
//	NOTES: This specially-configured Filter only exists in the Filter Stack of Exhibits
//		(not in Volumes or as a Highlight Filter)
//	Instance Variables:
//		xScale = D3 scale for converting between Dates and pixels
//		curDate = Date currently on slider
//		cy, cm, cd = components of current date, calculated by evalPrep()
//		pow = pixel outer width of DateSlider (g region)
//		piw = pixel inner width (actual controls)
//		dAtts = Dates Attribute IDs to use on Slider for each Template
//		svg
//		slider
//		handle = SVG circle that represents handle

var PFilterDSlider = function(id)
{
		// Create pseudo-Attribute entry with ID in it
	PFilterModel.call(this, id, { id: '_dslider' });
} // PFilterDSlider()

PFilterDSlider.prototype = Object.create(PFilterModel.prototype);

PFilterDSlider.prototype.constructor = PFilterDSlider;

	// PURPOSE: Get width of slide area and update widths, xScale and handle
PFilterDSlider.prototype.resize = function()
{
	var t = jQuery(window).width();
	this.pow = t-46;
	this.piw = this.pow-16;	// inner width (tracks)
	this.xScale.range([0, this.piw-1]);
		// Change sizes of SVG elements
	this.svg.attr("width", this.pow);
	this.slider.attr("width", this.piw);
	this.slider.select(".track").attr("x2", this.piw);
	this.slider.select(".track-inset").attr("x2", this.piw);
	this.slider.select(".track-overlay").attr("x2", this.piw);
		// Update handle position
	var newX = this.xScale(this.curDate);
	this.handle.attr("cx", newX);
} // resize()

PFilterDSlider.prototype.evalPrep = function()
{
	this.cy = this.curDate.getUTCFullYear();
	this.cm = (this.curDate.getMonth()+1);
	this.cd = this.curDate.getDate();
} // evalPrep()

	// NOTES: DateSlider is currently only Filter that takes Template Index
PFilterDSlider.prototype.eval = function(rec, tI)
{
	function makeDate(y, m, d, field, end) {
		var dm, dd;
		if (typeof field.m !== 'undefined') {
			dm = field.m;
			if (typeof field.d !== 'undefined') {
				dd = field.d;
			} else {
				dd = d;
			}
		} else {
			dm = m;
			dd = d;
		}
		return PData.d3Nums(y, dm, dd, end);
	} // makeDate()

	var a = this.dAtts[tI];
		// Data passed through whose Template is not checked
	if (a === 'disable')
		return true;

	var d = rec.a[a];
		// Reject undefined and uncertain values
	if (typeof d === 'undefined')
		return false;
	if (d === '?')
		return false;

		// Is it a single event?
	if (typeof d.max === 'undefined') {
		if (d.min.y !== this.cy)
			return false;
			// Handle ambiguity of unstated digits
		if (typeof d.min.m === 'undefined')
			return true;
		if (d.min.m !== this.cm)
			return false;
		if (typeof d.min.d === 'undefined')
			return true;
		return d.min.d === this.cd;
	} else {
		var s = makeDate(d.min.y, 1, 1, d.min, false);
		var e;
		if (d.max === 'open')
			e = TODAY;
		else
			e = makeDate(d.max.y, 12, 31, d.max, true);

		return (s <= this.curDate && this.curDate <= e);
	}
} // eval()

	// PURPOSE: Update the date display on FIlter
PFilterDSlider.prototype.refreshDate = function(insertPt)
{
	var dStr = this.curDate.getUTCFullYear() + '-' + (this.curDate.getMonth()+1) + '-' + this.curDate.getDate();
	insertPt.find('div.ds-data span.d').text(dStr);
} // refreshDate()

PFilterDSlider.prototype.setup = function()
{
	var self=this;
	var dsSettings=prspdata.e.g.ds;
	var sDate;
	var eDate;
	var insert = this.insertPt();
	var xScale;
	var svg, slider, handle;

	function roundByDay(x)
	{
		var newD = d3.timeDay.round(self.curDate);
		self.curDate = newD;
		var newX = xScale(newD);
		handle.attr("cx", newX);
	} // roundByDay()

	function dragStart()
	{
			// Get copy of date text
		var dText = insert.find('div.ds-data span.d').text();
		insert.find('div.ds-tip').addClass('on').text(dText).css("left",d3.event.x+"px");
	} // dragStart()

	function drag()
	{
		var x=Math.max(0,Math.min(d3.event.x,self.piw-1));
		handle.attr("cx", x);
		self.curDate = xScale.invert(x);
		self.refreshDate(insert);
			// Get copy of regularized date text
		var dText = insert.find('div.ds-data span.d').text();
		insert.find('div.ds-tip').text(dText).css("left",d3.event.x+"px");
	} // drag()

	function dragend()
	{
		insert.find('div.ds-tip').removeClass('on');
		roundByDay();
		self.refreshDate(insert);
		self.isDirty(2);
	} // dragStop()

		// set defaults
	this.cy = this.cm = this.cd = 0;

	sDate = PData.dStr(dsSettings.s, false);
	eDate = PData.dStr(dsSettings.e, true);
	eDate = d3.timeDay.floor(eDate); // reset date to start of day

	var totalWidth = jQuery(window).width();
	this.pow = totalWidth-46;
	this.piw = this.pow-16;	// inner width (tracks)
	xScale = d3.scaleTime().domain([sDate, eDate]).range([0, this.piw]).clamp(true);
	this.xScale = xScale;

	var el = document.getElementById('dltext-filter-dslider').innerHTML;
	insert.append(el);

	this.dAtts = dsSettings.dAtts;

		// Set names of Templates and chosen Attributes
	var tStr='', tDef, aDef, id;
	for (var i=0; i<PData.eTNum(); i++) {
		id = dsSettings.dAtts[i];
		if (id !== 'disable') {
			if (tStr.length > 0) {
				tStr += "; ";
			}
			aDef = PData.aByID(id);
			tDef = prspdata.t[i].def;
			tStr += tDef.l+": <i>"+aDef.def.l+"</i>";
		}
	}
	insert.find('div.ds-data span.t').html(tStr);
		// Show start and end dates
	insert.find('div.ds-range div.s').text(dsSettings.s);
	insert.find('div.ds-range div.e').text(dsSettings.e);

	svg = d3.select(insert.find('div.dateslider').get(0)).append("svg")
		.attr("width", this.pow)
		.attr("height", 18);
	this.svg = svg;
	slider = svg.append("g")
	    .attr("class", "slider")
		.attr("width", this.piw)
		.attr("transform", "translate(0,10)");
	this.slider = slider;
	slider.append("line")
		.attr("class", "track")
	    .attr("x1", 0)
	    .attr("x2", this.piw)
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	  	.attr("class", "track-inset")
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-overlay");

	handle = slider.insert("circle", ".track-overlay")
		.attr("class", "handle")
		.attr("r", 7)
		.call(d3.drag().on("start", dragStart).on("drag", drag).on("end", dragend));
	this.handle = handle;

		// Did user provide an explicit initial date for handle?
	if (typeof dsSettings.h === 'string') {
		this.curDate = PData.dStr(dsSettings.h, false);
	} else {
			// First, get the closest timestamp
		this.curDate = xScale.invert(this.piw/2);
	}
	roundByDay();

		// Show handle date
	this.refreshDate(insert);
} // setup()

PFilterDSlider.prototype.getState = function()
{
	return { d: this.curDate.getUTCFullYear()+'-'+(this.curDate.getUTCMonth()+1)+'-'+this.curDate.getUTCDate() };
} // getState()

PFilterDSlider.prototype.setState = function(state)
{
	this.curDate = PData.dStr(state.d, false);
		// Show date on display
	this.refreshDate(this.insertPt());
		// Move handle accordingly
	this.handle.attr("cx", this.xScale(this.curDate));
} // setState()


// ==============================================
// PFilterPtr: Class to filter Pointer Attributes
// 	Instance Variables:
//		cs = true if "Case Sensitive" is checked
//		s = text in search box
//		o = search option: c[ontains], x[act] or r[egexp]
//		x = regular expression (if any)

var PFilterPtr = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterPtr()

PFilterPtr.prototype = Object.create(PFilterModel.prototype);

PFilterPtr.prototype.constructor = PFilterPtr;

PFilterPtr.prototype.evalPrep = function()
{
	var ip = this.insertPt();
	this.cs = ip.find('input.filter-text-cs').prop('checked');
	this.s = ip.find('input.filter-text').val();
	this.o = ip.find('select.filter-text-ops').val();
	switch (this.o) {
	case 'c':	// Contains
	case 'x':	// Exact
		if (!this.cs) {
			this.s = this.s.toLocaleLowerCase();
		}
		break;
	case 'r':	// Regular Expression
		this.s = new RegExp(this.s);
		break;
	}
} // evalPrep()

PFilterPtr.prototype.eval = function(rec)
{
	var s = this.s;
	var l, r;

	if (s == null || s === '')
		return true;

	var p = rec.a[this.att.id];
	if (typeof p === 'undefined' || p.length === 0)
		return false;

	var o=this.o, cs=this.cs;

		// Process all of the Records pointed to, return true for first match
	for (var i=0; i<p.length; i++) {
		r = PData.rByID(p[i]);
		l = r.l;

		switch (o) {
		case 'c':	// Contains
			if (!cs) {
				l = l.toLocaleLowerCase();
			}
			if (l.indexOf(s) !== -1) {
				return true;
			}
			break;
		case 'x':	// Exact
			if (!cs) {
				l = l.toLocaleLowerCase();
			}
			if (l === s) {
				return true;
			}
			break;
		case 'r':	// Regular Expression
			if (s.test(l)) {
				return true;
			}
		}
	} // for all Pointers
	return false;
} // eval()

PFilterPtr.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-ptr').innerHTML;

	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('input.filter-text').change(function() {
		self.isDirty(2);
	});
	inserted.find('select.filter-text-ops').change(function() {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
	inserted.find('input.filter-text-cs').click(function(event) {
		var t = inserted.find('input.filter-text').val();
		if (t.length) {
			self.isDirty(2);
		}
	});
} // setup()

PFilterPtr.prototype.teardown = function()
{
	var inserted = this.insertPt();
	inserted.find('input.filter-text').off("change");
	inserted.find('input.filter-text-ops').off("change");
	inserted.find('input.filter-text-cs').off("click");
} // teardown()

PFilterPtr.prototype.getState = function()
{
	var ip = this.insertPt();
	return { cs: ip.find('input.filter-text-cs').prop('checked'),
			 t: ip.find('input.filter-text').val(),
			 o: ip.find('select.filter-text-ops').val()
		 	};
} // getState()

	// NOTE: Perspective data ≤ 1.6 doesn't have o[ptions] flag
PFilterPtr.prototype.setState = function(state)
{
	var ip = this.insertPt();
	ip.find('input.filter-text-cs').prop('checked', state.cs);
	ip.find('input.filter-text').val(state.t);
	if (typeof state.o === 'undefined') {	// Handle older Perspective data
		ip.find('select.filter-text-ops').val('c');
	} else {
		ip.find('select.filter-text-ops').val(state.o);
	}
} // setState()


// ==========================================================
// PData
// PURPOSE: Manages all data, orchestrates data streams, etc.

// USES: jQuery (for AJAX), underscore

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			PData is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// 			The s array of an IndexStream contains absolute index numbers to global data array
//			Function names are minimized in length for lookup speed, using abbreviations:
//				a[ttribute], c[ategory], d[ates], l[egend], r[ecord], s[tream], t[emplate], v[iz]
//				id, n[index]

var PData = (function() {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;	// default, overridden by WP-saved option
	var dltextTo;
	var dltextApprox;
	var dltextNow;

	var mnthDays = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

	// INTERNAL VARIABLES
	// ==================

	var recs=[];				// "head" array of all Records, one entry per Template type
								// Corresponding to prspdata.t
								// { n = # loaded, i = initial index for these records, d = data array }
	var rCount=0;				// Total number of Records
	var loaded=false;			// All data loaded?

	// INTERNAL FUNCTIONS
	// ==================


		// PURPOSE: Load a particular chunk of Records
	function rChunk(tIndex, from, count)
	{
		jQuery.ajax({
			type: 'POST',
			url: prspdata.ajax_url,
			data: {
				action: 'prsp_get_records',
				tmplt_id: prspdata.t[tIndex].id,
				from: from,
				count: count
			},
			success: function(data, textStatus, XMLHttpRequest)
			{
					// Append loaded data, update and look for more
				var r = recs[tIndex];
				var newD = JSON.parse(data);
				if (r.d)
					r.d = r.d.concat(newD);
				else
					r.d = newD;
				r.n += count;
				rLoad();
			},
			error: function(XMLHttpRequest, textStatus, errorThrown)
			{
			   alert(errorThrown);
			}
		});
	} // rChunk()

		// PURPOSE: Look for set of Records that haven't been loaded and request
	function rLoad()
	{
		var done = true;

		for (var i=0; i<prspdata.t.length; i++) {
			var current = recs[i].n;
			var needed = prspdata.t[i].n;
			if (current < needed) {
				done = false;
				var gap = needed - current;
				var size = gap < LOAD_DATA_CHUNK ? gap : LOAD_DATA_CHUNK;
				rChunk(i, current, size);
					// Since this is a recursive action, break on first find
				break;
			}
		}
		if (done) {
			loaded=true;
			setTimeout(function() {
				jQuery("body").trigger("prsp-loaded");
			}, 100);
		}
	} // rLoad()


	// PUBLIC INTERFACE
	// ================

	return {
			// PURPOSE: Initialize data hub, initiate data loading
		init: function()
		{
			dltextTo = document.getElementById('dltext-to').innerHTML;
			dltextApprox = document.getElementById('dltext-approximately').innerHTML;
			dltextNow = document.getElementById('dltext-now').innerHTML;

			if (typeof prspdata.x.chunk == 'number' && prspdata.x.chunk > 0)
				LOAD_DATA_CHUNK = prspdata.x.chunk;

				// For each entry: head entry for Record Data and collect Legends
			prspdata.t.forEach(function(tmplt) {
					// Head Record entry
				var newTData = { i: rCount, n: 0, d: null };
				recs.push(newTData);
				rCount += tmplt.n;
			});
			rLoad();
		}, // init()

		rSize: function()
		{
			return rCount;
		},

			// RETURNS: intersection between a and b (as array)
			// INPUT: 	a and b are both sorted arrays
		intersect: function(a, b)
		{
			var r=[];
			var sA = a.length, sB = b.length;
			var aE, bE;
			var aI=0, bI=0;

			while (aI < sA && bI < sB) {
				aE = a[aI]; bE = b[bI];
				if (aE > bE)
					bI++;
				else if (bE > aE)
					aI++;
				else {
					r.push(aE);
					aI++; bI++;
				}
			}
			return r;
		}, // intersect()

			// RETURNS: union of a and b (as array)
			// INPUT: 	a and b are both sorted arrays
		union: function(a, b)
		{
			var u=[];
			var aI=0, bI=0;
			var aV, bV;

			while (aI<a.length && bI<b.length) {
				aV=a[aI]; bV=b[bI];
				if (aV < bV) {
					u.push(aV);
					aI++;
				} else if (aV == bV) {
					u.push(aV);
					aI++; bI++;
				} else {
					u.push(bV);
					bI++;
				}
			}

				// Unused values (must be either aI or bI, not both!)
			for (; aI<a.length; aI++)
				u.push(a[aI]);
			for (; bI<b.length; bI++)
				u.push(b[bI]);
			return u;
		}, // union()

			// PURPOSE: Optimized and reliable string compare
			// TO DO: 	Handle non-ASCII UTF-8 characters
		strcmp: function(a, b) {
			for (var i=0,n=Math.max(a.length, b.length); i<n && a.charAt(i) === b.charAt(i); ++i) {};
			if (i === n) return 0;
			return a.charAt(i) > b.charAt(i) ? -1 : 1;
		}, // strcmp()

			// PURPOSE: Create a new IndexStream: { s = index array, t = array of template params, l = total length }
			// INPUT: 	if full, fill with entries for all Records
			// NOTE: 	JS Arrays are quirky; s is always full size, so l is used to maintain length
		sNew: function(full)
		{
			var newStream = { s: new Uint16Array(rCount), t: [], l: 0 };

			if (full) {
				var i;
				for (i=0; i<rCount; i++)
					newStream.s[i] = i;
				for (i=0; i<recs.length; i++) {
					var tEntry = recs[i];
					var newEntry = { i: tEntry.i, n: tEntry.n };
					newStream.t.push(newEntry);
				}
				newStream.l = rCount;
			}
			return newStream;
		}, // sNew()

			// RETURNS: The index of first entry in <stream> which belongs to Template <tIndex>
			//			-1 if the Template has no entries
			// NOTE: 	This is for effectively "fast-forwarding" to a particular Template section
			// 			This is tricky because binary-search needs to look for range
		s1stT: function(stream, tIndex)
		{
			var tEntry = stream.t[tIndex];
			if (tEntry.n === 0)
				return -1;
			return tEntry.i;
		}, // s1stT()

			// RETURNS: Index of Template to which absolute index <absI> belongs
		n2T: function(absI)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.i <= absI && absI < (tData.i+tData.n))
					return i;
			}
		}, // n2T()

			// RETURNS: The index of absI in stream (its relative index), or else -1
		nInS: function(absI, stream, tI)
		{
				// Use binary search
			var lo = 0;
			var hi = stream.l-1;
			var pos;
			var rec;

				// If we know the Template index, we can streamline
			if (tI != null) {
				var tRec = stream.t[tI];
				lo = tRec.i;
				hi = tRec.i+tRec.n;
			}

			while (lo <= hi) {
				pos = (lo + hi) >> 1;
				rec = stream.s[pos];

				if (rec < absI) {
					lo = pos + 1;
				} else if (rec > absI) {
					hi = pos - 1;
				} else {
					return pos;
				}
			}
			return -1;
		},

			// RETURNS: True if attID is in template tIndex
		aInT: function(attID, tIndex)
		{
			var tEntry = prspdata.t[tIndex];
			return (tEntry.def.a.findIndex(function(a) { return a == attID; }) != -1);
		}, // aInT()

			// RETURNS: Object for Record whose absolute index is <absI>
		rByN: function(absI)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0) {
					if (tData.i <= absI  && absI < (tData.i+tData.n))
						return tData.d[absI - tData.i];
				}
			}
			return null;
		}, // rByN()

			// RETURNS: Attribute value in string format
			// INPUT: 	attID = ID of Attribute
			//			a = raw attribute data
			// TO DO: 	Change attID to att definition
		procAttTxt: function(attID, a)
		{
			var att = PData.aByID(attID);
			switch (att.def.t) {
			case 'V':
			case 'g':
				return a.join(', ');
			case 'T':
				return a;
			case 'N':
				if (a === '?')
					return dlText.undef;
				return a.toString();
			case 'D':
				if (a === '?')
					return dlText.undef;

				var ds='';
					// Range
				if (a.max) {
					if (a.min.f)
						ds = dltextApprox+' ';
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
					ds += dltextTo+' ';
					if (a.max == 'open') {
						ds += dltextNow;
					} else {
						if (a.max.f)
							ds += dltextApprox+' ';
						ds += a.max.y.toString();
						if (a.max.m) {
							ds += '-'+a.max.m.toString();
							if (a.max.d)
								ds += '-'+a.max.d.toString();
						}
					}
				} else {
					if (a.min.f)
						ds = dltextApprox+' ';
					else
						ds = '';
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
				}
				return ds;
			case 'L':
			case 'X':
				if (att.def.d != null & att.def.d !== '') {
					if (typeof a[0] === 'number') {
						return a.join(', ');
					} else {
						return a.map(function(p) { return p.join(', '); }).join(att.def.d+' ');
					}
				} else
					return a.join(', ');
			case 'I':
				return '<img src="'+a+'" alt="'+att.def.l+'"/>';
			case 'l': 	// Link To
				return '<a href="'+a+'" target="_blank">(See Link)</a>';
			case 'S':
				return '<a href="'+a+'" target="_blank">(SoundCloud)</a>';
			case 'Y':
				return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
			case 'x': 	// Transcript
				return '<a href="'+a+'" target="_blank">(See Transcript File)</a>';
			case 't': 	// Timecode
				return a;
			case 'P':
				if (a.length > 0) {
					var t = '';
					a.forEach(function(onePtr) {
						var ptrRec = PData.rByID(onePtr);
						if (ptrRec) {
							if (t.length > 0) {
								t += ', ';
							}
							t += '<a href="'+prspdata.site_url+'?p='+ptrRec.wp+'" target="_blank">'+ptrRec.l+'</a>';
						}
					});
					return t;
				} else
					return null;
			// case 'J': 	// Should not appear
			} // switch
			return null;
		}, // procAttTxt()

			// RETURNS: Attribute value for <attID> in Record whose absolute index is <index>
			//				or null if either is non-existent
			// INPUT: 	If <raw>, return as is; otherwise, turn into string/HTML
		rAV: function(absI, attID, raw)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0 && tData.i <= absI  && absI < (tData.i+tData.n)) {
					var rec = tData.d[absI - tData.i];
					var a = rec.a[attID];
					if (a == null || typeof a === 'undefined')
						return null;
					if (raw)
						return a;
					return PData.procAttTxt(attID, a);
				}
			}
			return null;
		}, // rAV()

			// RETURNS: Absolute index for Record whose ID is recID
		nByID: function(recID)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0) {
						// Try binary search in each Template
					var lo = 0;
					var hi = tData.n-1;
					var pos, cmp;
					var rec;

					while (lo <= hi) {
						pos = (lo + hi) >> 1;
						rec = tData.d[pos];
						cmp = PData.strcmp(recID, rec.id);

						if (cmp < 0) {
							lo = pos + 1;
						} else if (cmp > 0) {
							hi = pos - 1;
						} else {
							return tData.i+pos;
						}
					}
				} // if tData
			} // for i
			return null;
		}, // nByID()

			// RETURNS: Record data for recID
		rByID: function(recID)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0) {
						// Try binary search in each Template
					var lo = 0;
					var hi = tData.n-1;
					var pos, cmp;
					var rec;

					while (lo <= hi) {
						pos = (lo + hi) >> 1;
						rec = tData.d[pos];
						cmp = PData.strcmp(recID, rec.id);

						if (cmp < 0) {
							lo = pos + 1;
						} else if (cmp > 0) {
							hi = pos - 1;
						} else {
							return rec;
						}
					}
				} // if tData
			} // for i
			return null;
		}, // rByID()

			// RETURNS: Attribute definition with this ID
			// INPUT:   attID = full Attribute ID (could be in Join dot notation)
			// TO DO: 	Use Intl.Collator for string compare??
		aByID: function(attID)
		{
			var lo = 0;
			var hi = prspdata.a.length-1;
			var pos, cmp;

			while (lo <= hi) {
				pos = (lo + hi) >> 1;
				cmp = PData.strcmp(attID, prspdata.a[pos].id);

				if (cmp < 0) {
					lo = pos + 1;
				} else if (cmp > 0) {
					hi = pos - 1;
				} else {
					return prspdata.a[pos];
				}
			}
			return null;
		}, // aByID()

		aByN: function(aIndex)
		{
			return prspdata.a[aIndex];
		}, // aByN()

			// RETURNS: Number of Templates used by this Exhibit
		eTNum: function()
		{
			return prspdata.e.g.ts.length;
		},

			// RETURNS: The data for this Exhibit's tIndex Template
		eTByN: function(tIndex)
		{
			return prspdata.e.g.ts[tIndex];
		},

			// RETURNS: Index of template whose ID is tID
		tIByID: function(tID)
		{
			for (var i=0; i<prspdata.t.length; i++) {
				if (tID === prspdata.t[i].id)
					return i;
			}
		}, // tByID()

			// RETURNS: Definition of template whose ID is tID
		tByID: function(tID)
		{
			for (var i=0; i<prspdata.t.length; i++) {
				if (tID === prspdata.t[i].id)
					return prspdata.t[i].def;
			}
		}, // tByID()

			// PURPOSE:	Create a "FeatureAtts" array to mimic ViewFrame.getSelFeatAtts()
			// NOTE:	Currently only supports single, non-hierarchical Legend
		allFAtts: function(att)
		{
			var fAtts=[];
			if (typeof att.r.u !== 'undefined') {
				fAtts.push(-1);
			}
			att.l.forEach(function(l, lI) {
				fAtts.push(lI);
			})
			return fAtts;
		}, // allFAtts()

			// RETURNS: The visual feature for an Attribute value, an array (if all), or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			att = full Attribute entry
			//			fSet = array of selected Legend indices ([x,y] for 2ndary level!)
			//			all = return array for all possible matches for <val> (true), or just first match (false)
		lRecs: function(val, att, fSet, all)
		{
			var fI, lI = fSet.length, lE;

			switch (att.def.t) {
			case 'V':
				function s(v) {
					for (var f=0; f<lI; f++) {
						fI = fSet[f];
							// Parent-level
						if (typeof fI === 'number') {
							lE = att.l[fI];
							if (lE.l === v)
								return lE;
							// Secondary-level
						} else {
							lE = att.l[fI[0]];
							var lE2 = lE.z[fI[1]];
							if (lE2.l === v) {
								if (lE2.v && lE2.v !== '')
									return lE2;
								else
									return lE;
							}
						}
					}
					return null;
				} // s()
					// Return all possible matched atts?
				if (all && att.def.d !== '') {
					var r = [], f;
					val.forEach(function(v) {
						f = s(v);
						if (f != null)
							r.push(f);
					});
					return r.length > 0 ? r : null;
				} else {
						// Could be multiple values, but just return first success
					if (att.def.d !== '') {
						var f;
						for (var vI=0; vI<val.length; vI++) {
							f = s(val[vI]);
							if (f != null)
								return f;
						}
						return null;
					} else
						return s(val[0]);
				}
			case 'T':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// Looking for match anywhere; TO DO: use RegExp?
					if (val.indexOf(lE.d) !== -1) {
						return lE;
					}
				}
				return null;
			case 'N':
				var f=0;
					// Check for undefined char/entry first to remove exceptional cases
				if (fSet[0] === -1) {
					if (val === '?') {
						if (typeof att.r.u === 'undefined')
							return null;
						return att.r.u;
					}
					f=1;
				}
					// As undefined is first entry (-1), abort now
				if (val === '?')
					return null;
				for (; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// either min and max can be left out (= no bound), but not both
					if (typeof lE.d.min !== 'undefined') {
						if (lE.d.min <= val) {
							if (typeof lE.d.max !== 'undefined') {
								if (val <= lE.d.max)
									return lE;
							} else
								return lE;
						}
					} else {	// max only
						if (val <= lE.d.max)
							return lE;
					}
				} // for
				return null;
			case 'D':
				var f=0;
					// Check for undefined char/entry first to remove exceptional cases
				if (fSet[0] === -1) {
					if (val === '?') {
						if (typeof att.r.u === 'undefined')
							return null;
						return att.r.u;
					}
					f=1;
				}
					// As undefined is first entry (-1), abort now
				if (val === '?')
					return null;
								// Disqualify if (1) end of event is before min bound, or
								//	(2) start of event is after max bound
								// NOTE: Code takes advantage of fact that month and day are 1-based (not 0)
				for (; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
					if (typeof lE.d.max.y !== 'undefined') {		// Legend entry has max bounds
							// Test val maxs against min bound for disqualification
						if (typeof val.max !== 'undefined' && val.max !== 'open') {
							if (val.max.y < lE.d.min.y)
								continue;
							if (val.max.y === lE.d.min.y) {
								if (typeof val.max.m !== 'undefined' && typeof lE.d.min.m !== 'undefined') {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m === lE.d.min.m) {
										if (val.max.d && lE.d.min.d) {
											if (val.max.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
						}
							// Test val mins against max bound for disqualification
						if (val.min.y > lE.d.max.y)
							continue;
						if (val.min.y === lE.d.max.y) {
							if (val.min.m && lE.d.max.m) {
								if (val.min.m > lE.d.max.m)
									continue;
								if (val.min.m === lE.d.max.m) {
									if (val.min.d && lE.d.max.d) {
										if (val.min.d > lE.d.max.d)
											continue;
									}
								}
							}
						}
							// Ensure also that val.min >= lE.d.min !!
						if (val.min.y < lE.d.min.y)
							continue;
						if (val.min.y === lE.d.min.y) {
							if (val.min.m && lE.d.max.m) {
								if (val.min.m < lE.d.min.m)
									continue;
								if (val.min.m === lE.d.min.m) {
									if (val.min.d && lE.d.min.d) {
										if (val.min.d < lE.d.min.d)
											continue;
									}
								}
							}
						}

						return lE;
					} else {				// Legend entry has min bound only
							// Event value is range
						if (typeof val.max !== 'undefined') {
							if (val.max === 'open')		// double open always overlap
								return lE;
							if (val.max.y < lE.d.min.y)
								continue;
							if (val.max.y === lE.d.min.y) {
								if (typeof val.max.m !== 'undefined' && typeof lE.d.min.m !== 'undefined') {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m === lE.d.min.m) {
										if (typeof val.max.d !== 'undefined' && typeof lE.d.min.d !== 'undefined') {
											if (val.max.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE;

							// Event value is single date
						} else {
							if (val.min.y < lE.d.min.y)
								continue;
							if (val.min.y === lE.d.min.y) {
								if (typeof val.min.m !== 'undefined' && typeof lE.d.min.m !== 'undefined') {
									if (val.min.m < lE.d.min.m)
										continue;
									if (val.min.m === lE.d.min.m) {
										if (typeof val.min.d !== 'undefined' && typeof lE.d.min.d !== 'undefined') {
											if (val.min.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE;
						}
					} // min bound only
				} // for f
				break;
			}
			return null;
		}, // lRecs()


			// RETURNS: Just color code for an Attribute value, an array (if all), or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			att = full Attribute entry
			//			fSet = array of selected Legend indices ([x,y] for 2ndary level!)
			//			all = return array for all possible matches for <val> (true), or just first match (false)
			// TO DO: 	Change to ptr to legend record so can access both <v> and <b> ??
		lClr: function(val, att, fSet)
		{
			var rec;

			if (rec = PData.lRecs(val, att, fSet, false)) {
				return rec.v;
			} else
				return null;
		}, // lClr()

			// PURPOSE: Find the visual code for this Attribute's vocabulary item
			// RETURNS: pointer to Legend record, or null if failure
			// ASSUMES: <att> is a complete record for a Vocabulary Attribute
		// vLVal: function(att, val)
		// {
		// 	var lo = 0;
		// 	var hi = att.x.length-1;
		// 	var pos, cmp;

		// 	while (lo <= hi) {
		// 		pos = (lo + hi) >> 1;
		// 		cmp = PData.strcmp(val, att.x[pos].l);

		// 		if (cmp < 0) {
		// 			lo = pos + 1;
		// 		} else if (cmp > 0) {
		// 			hi = pos - 1;
		// 		} else {
		// 			var i = att.x[pos].i;
		// 			if (typeof i === 'number')
		// 				return att.l[i];
		// 			else
		// 				return att.l[i[0]].z[i[1]];
		// 		}
		// 	}
		// 	return null;
		// }, // getVLgndVal()

			// PURPOSE: Return number of days in month, accounting for leap years
		lenMnth: function(y, m)
		{
				// if February, check to see if leap year
			if (m === 2 && ((y % 4) === 0) && ((y % 100) !== 0) || ((y % 400) === 0)) {
				return 29;
			} else
				return mnthDays[m-1];
		}, // lenMnth()

			// PURPOSE: Create a single Date from three numbers
			// INPUT:   year, month (1-12), day (1) must be definite numbers
			//			if end, make the Date the end of the day (not beginning)
			// NOTE:    JavaScript Date month is 0-based (not 1-based: 0=January)
		d3Nums: function(year, month, day, end)
		{
			var date;
			var MS_IN_DAY = 1000*60*60*24-100; 	// milliseconds in a day (minus 100): 1000*60*60*24 - 100

			if (year === 0) { // Convert year 0 to '1 CE'
				date = new Date (1, month-1, day);
				date.setUTCFullYear("0001");
			} else if (year < 0 || year > 99) { // Dates that won't be confused with dates since 1970 (short form)
				date = new Date(year, month-1, day);
			} else {	// One- or two-digit dates that will confuse standard Date creator
					// Reset with the correct year
				date = new Date(year, month-1, day);
				date.setUTCFullYear(("0000" + year).slice(-4));
			}
			if (end) {
				date.setTime(date.getTime() + MS_IN_DAY);
			}
			return date;
		}, // d3Nums

			// PURPOSE: Create a Date from minimal specification in Object fields
		dObj: function(field, m, end) {
			var dd, dm;

			if (typeof field.m !== 'undefined' && field.m !== null) {
				dm = field.m;
				if (typeof field.d !== 'undefined' && field.d !== null) {
					dd = field.d;
				} else {
					if (end) {
						dd = PData.lenMnth(field.y, dm);
					} else {
						dd = 1;
					}
				}
			} else {
				dm = m;
				if (end) {
					dd = PData.lenMnth(field.y, m);
				} else {
					dd = 1;
				}
			}

			return PData.d3Nums(field.y, dm, dd, end);
		}, // dObj()

			// PURPOSE: Create Date by parsing string
			// INPUT: 	end = true if last part of range
			// ASSUMES: Definite date: won't have initial ~ character
		dStr: function(str, end)
		{
			var m, d;

			if (str === 'open')
				return TODAY;

			var np = 1;
			if (str.charAt(0) === '-') {
				np = -1;
				str = str.substring(1);
			}
			var cmpts = str.split('-');
			var y = parseInt(cmpts[0])*np;
			if (cmpts.length > 1) {
				m = parseInt(cmpts[1]);
				if (cmpts.length == 3) {
					d = parseInt(cmpts[2]);
				} else {
					if (end)
						d = PData.lenMnth(y, m);
					else
						d = 1;
				}
			} else {
				if (end) {
					m=12; d=31;
				} else {
					m=1; d=1;
				}
			}

				// add end of day?
			return PData.d3Nums(y, m, d, end);
		}, // dStr()

			// PURPOSE: Create Dates (single date or range) from Record value
			//			-- Currently unused --
			// RETURNS: [date, date] (if a single day, second date is empty)
		// dData: function(data)
		// {
		// 	var s, e;
		// 	var y, m, d, single=false;

		// 	y = data.min.y;
		// 	if (typeof data.min.m === 'undefined') {
		// 		m = 1; d = 1;
		// 	} else {
		// 		m = data.min.m;
		// 		if (typeof data.min.d === 'undefined')
		// 			d = 1;
		// 		else {
		// 			d = data.min.d;
		// 			single=true;
		// 		}
		// 	}
		// 	s = PData.d3Nums(y,m,d,false);
		// 	if (typeof data.max !== 'undefined') {
		// 		if (data.max === 'open')
		// 			e = TODAY;
		// 		else {
		// 			y = data.max.y;
		// 			if (typeof data.max.m === 'undefined') {
		// 				m = 12; d = 31;
		// 			} else {
		// 				m = data.max.m;
		// 				if (typeof data.max.d === 'undefined')
		// 					d = PData.lenMnth(y, m);
		// 				else
		// 					d = data.max.d;
		// 			}
		// 			e = PData.d3Nums(y,m,d,true);
		// 		} // number
		// 	} else {
		// 		if (single)
		// 			return [s, null];
		// 		else {
		// 			if (typeof data.min.m === 'undefined') {
		// 				m = 12; d = 31;
		// 			} else {
		// 				m = data.min.m;
		// 				d = PData.lenMnth(y, m);
		// 			}
		// 			e = PData.d3Nums(y,m,d,true);
		// 		}
		// 	}
		// 	return [s, e];
		// }, // dData


			// PURPOSE: Return array of categories for facet att based on Legend definitions
			// INPUT: 	att = complete Attribute definition
			//			fSet = allowable Legend indices (returned by getSelFeatAtts) or null
			//			If undef, create initial category for undefined value if allowed in Attribute
			// RETURNS: category array in same format as cRNew (always has i[])
		cLNew: function(att, fSet, undef)
		{
			var rcs = [];
			switch (att.def.t) {
			case 'T':
				att.l.forEach(function(t) {
					if (fSet == null || PData.lRecs(t.d, att, fSet, false))
						rcs.push({ l: t.l, x: t.d, c: t.v, i: [] });
				});
				return rcs;
			case 'g': 	// Will be computed in cFill
				return rcs;
			case 'V':
				att.l.forEach(function(v) {
					if (fSet == null || PData.lRecs([v.l], att, fSet, false))
						rcs.push({ l: v.l, c: v.v, i: [] });
					v.z.forEach(function(v2) {
						if (fSet == null || PData.lRecs([v2.l], att, fSet, false)) {
								// Does it inherit from parent or have its own color?
							if (v2.v === '')
								rcs.push({ l: v2.l, c: v.v, i: [] });
							else
								rcs.push({ l: v2.l, c: v2.v, i: [] });
						}
					});
				});
				return rcs;
			case 'N':
					// Create undefined category? -- must be initial one
				if (undef && typeof att.r.u !== 'undefined') {
					if (fSet == null || PData.lRecs('?', att, fSet, false))
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?', i: [] });
				}
				att.l.forEach(function(n) {
					if (fSet == null || PData.lRecs(n.d.min, att, fSet, false))
						rcs.push({ l: n.l, c: n.v, min: n.d.min, max: n.d.max, i: [] })
				});
				return rcs;
			case 'D':
					// Create undefined category? -- must be initial one
				if (undef && typeof att.r.u !== 'undefined') {
					if (fSet == null || PData.lRecs('?', att, fSet, false))
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?', i: [] });
				}
				var dmin, dmax;
				att.l.forEach(function(d) {
					dmin = PData.dObj(d.d.min, 1, false);
					if (fSet === null || PData.lRecs(dmin, att, fSet, false)) {
						if (d.d.max.y == null)
							dmax = TODAY;
						else
							dmax = PData.dObj(d.d.max, 12, false);

							// Just bump slightly to enable exclusive comparison
						dmax.setTime(dmax.getTime() + 10);
						rcs.push({ l: d.l, c: d.v, min: dmin, max: dmax, i:[] });
					}
				});
				return rcs;
			} // switch
		}, // cLNew()


			// PURPOSE: Return array of range categories for facet att
			// INPUT: 	Complete Attribute definition <att>
			//			If addItems, create empty members array in range category entries
			//			If undef, create initial category for undefined value if allowed in Attribute
			// RETURNS: full range category array = { l[abel], c[olor], min, max, x, i[tems] },
			//					(min and max only used for Number and Dates types)
			//					(x is the text to match, only for Tags pattern type)
			//				or null if range categories not possible (lack of bounds or not defined)
			// ASSUMES: Only called for Text, Vocabulary, Number and Dates types
			//			Date range has minimum year
			//			JS Data creation deals with “spillover” values
			// NOTES: 	To match a Legend category, a value only needs to start within it
			//			A range category with no Legend match is assigned color black
			//			max value for Dates only (!) is exclusive (value must be less than, not equal!)
			//			If undefined color given for Number or Dates, that will be first category
			// TO DO: 	Handle case that scale of max-min and g would be too large ??
		cRNew: function(att, addItems, undef)
		{
			var rcs = [];
			switch (att.def.t) {
			case 'T':
				att.l.forEach(function(t) {
					if (addItems)
						rcs.push({ l: t.l, x: t.d, c: t.v, i: [] });
					else
						rcs.push({ l: t.l, x: t.d, c: t.v });
				});
				return rcs;
			case 'g': 	// Will be computed in cFill
				return rcs;
			case 'V':
				att.l.forEach(function(i) {
					if (addItems)
						rcs.push({ l: i.l, c: i.v, i: [] });
					else
						rcs.push({ l: i.l, c: i.v });
					i.z.forEach(function(i2) {
						var v = i2 === '' ? i.v : i2.v;
						if (addItems)
							rcs.push({ l: i2.l, c: v, i: [] });
						else
							rcs.push({ l: i2.l, c: v });
					});
				});
				return rcs;
			case 'N':
					// Can't create range category unless both bounds provided
				if (typeof att.r.min === 'undefined' || typeof att.r.max === 'undefined')
					return null;

					// Create undefined category? -- must be initial one
				if (undef && typeof att.r.u !== 'undefined') {
					if (addItems)
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?', i: [] });
					else
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?' });
				}

				var inc = Math.pow(10, att.r.g);
				var curV = att.r.min, lI=0, curL, min, rgb;
				if (att.l.length > 0)
					curL = att.l[0];
				while (curV <= att.r.max) {
						// Advance to the relevant legend category
					while (lI < att.l.length && typeof curL.d.max !== 'undefined' && curV > curL.d.max) {
						curL = att.l[++lI];
					}
						// Is current range category before current legend category?
					if (att.l.length == 0 || curV < curL.d.min) {
						rgb = '#777777';

						// Does it occur beyond last category?
					} else if (lI === att.l.length) {
						rgb = '#777777';

						// Does it start within current category (inc one w/o max bound)
					} else if (typeof curL.d.max === 'undefined' || curV <= curL.d.max) {
						rgb = curL.v;

					} else {
						rgb = '#777777';
					}
					min = curV;
					curV += inc;
					max = curV-1;	// Since Number max is inclusive
					if (max > att.r.max)
						max = att.r.max;
					var l=min.toString();
						// Show min and max if not individual digits and too long
					if (inc > 1 && l.length < 4 && min !== max) {
						l += "-"+max.toString();
					}
					if (addItems)
						rcs.push({ l: l, c: rgb, min: min, max: max, i: [] });
					else
						rcs.push({ l: l, c: rgb, min: min, max: max });
				}
				return rcs;
			case 'D':
				function makeDate(y, m, d, field) {
					if (typeof field.m !== 'undefined') {
						m = field.m;
						if (typeof field.d !== 'undefined') {
							d = field.d;
						}
					}
					return PData.d3Nums(y,m,d,false);
				} // makeDate()
				function makeMaxDate(field)
				{
					var y,m,d;
					if (typeof field.y === 'undefined') {
						return TODAY;
					} else {
						y = field.y;
						if (typeof field.m === 'undefined') {
							m = 12; d = 31;
						} else {
							m = field.m;
							if (typeof field.d === 'undefined')
								d = PData.lenMnth(y, m);
							else
								d = field.d;
						}
							// Since max value is exclusive boundary, don't add time to it
						return PData.d3Nums(y,m,d,false);
					}
				} // makeMaxDate()

				var maxDate = makeMaxDate(att.r.max);
				var inc = att.r.g;
				var curY=att.r.min.y, curM=1, curD=1;
				if (typeof att.r.min.m !== 'undefined') {
					curM = att.r.min.m;
					if (typeof att.r.min.d !== 'undefined') {
						curD = att.r.min.d;
					}
				}
				var curDate = PData.d3Nums(curY, curM, curD, false);
				var lI=0, curL, lMinDate, lMaxDate, maxMS;
				if (att.l.length > 0) {
					curL = att.l[0];
					lMinDate = makeDate(curL.d.min.y, 1, 1, curL.d.min);
					lMaxDate = makeMaxDate(curL.d.max);
				}

					// Create undefined category? -- must be initial one
				if (undef && typeof att.r.u !== 'undefined') {
					if (addItems)
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?', i: [] });
					else
						rcs.push({ l: '?', c: att.r.u.v, min: '?', max: '?' });
				}

				while (curDate <= maxDate) {
					var rCat={};
					if (addItems) {
						rCat.i = [];
					}

						// d3Nums() automatically converts year 0 to 1 CE, but need to do that w/string
					var yS = curY === 0 ? "1" : curY.toString();
					switch (inc) {
					case 'd':
						rCat.l = yS+"-"+curM.toString()+"-"+curD.toString();
						break;
					case 'm':
						rCat.l = yS+"-"+curM.toString();
						break;
					case 'y':
					case 't':
					case 'c':
						rCat.l = yS;
						break;
					}
						// Advance to the relevant legend category
					while (lI < att.l.length && curDate > lMaxDate) {
						curL = att.l[++lI];
						if (lI < att.l.length) {
							lMinDate = makeDate(curL.d.min.y, 1, 1, curL.d.min);
							lMaxDate = makeMaxDate(curL.d.max);
						}
					}
						// Is current range category before current legend category?
					if (att.l.length == 0 || curDate < lMinDate) {
						rCat.c = '#777777';

						// Does it occur beyond last category?
					} else if (lI == att.l.length) {
						rCat.c = '#777777';

						// Does it start within current category (inc one w/o max bound)
					} else if (curDate <= lMaxDate) {
						rCat.c = curL.v;

					} else {
						rCat.c = '#777777';
					}
					rCat.min = curDate;
					switch (inc) {
					case 'd':
						if (++curD > PData.lenMnth(curY, curM)) {
							curD=1;
							if (++curM > 12) {
								curM = 1;
								curY++;
							}
						}
						break;
					case 'm':
						if (++curM > 12) {
							curM = 1;
							curY++;
						}
						break;
					case 'y':
						curY++;
						break;
					case 't':
						curY += 10;
						break;
					case 'c':
						curY += 100;
						break;
					}
					maxMS = PData.d3Nums(curY, curM, curD, false);
					if (maxMS > TODAY) {
						maxMS = TODAY;
					}
						// Code not active: bump up slightly to enable exclusive comparison
					// maxMS.setTime(maxMS.getTime() + 10);
					rCat.max = maxMS;
					rcs.push(rCat);
					curDate = PData.d3Nums(curY, curM, curD, false);
				}
				return rcs;
			} // switch
		}, // cRNew()


			// PURPOSE: Sort all Records in stream into categories according to order Attribute
			// INPUT: 	cats = array generated by cLNew/cRNew (or empty array if Tags Attribute)
			//			oAttID = ID of Attribute used for ordering (used to make cats)
			//			sAttID = ID of secondary, required Attribute used later (or null)
			//			stream = datastream
			//			tOnly = null if do all Templates in stream, or else index of Template
			// NOTES: 	Puts aIDs from stream into i arrays of rCats
			// TO DO: 	Optimization tricks noted below
		cFill: function(cats, oAttID, sAttID, stream, tOnly)
		{
			var numTmplts;
			var tI, tRec;
			var rI, aI, rec, datum, fData;
			var cI, cRec;

			var oAtt = PData.aByID(oAttID);

				// Just do one Template?
			if (tOnly != null) {
				tI = tOnly;
				numTmplts = tOnly+1;
			} else {
				tI = 0;
				numTmplts = stream.t.length;
			}
			tRec = stream.t[tI];
			rI=tRec.i;	// Begin at start Template's first Record

			doStream:
			while (rI<stream.l) {
					// Advance until we get to next used Template rec that has both necessary Attributes
				while (tRec.n === 0 || (tRec.i+tRec.n) === rI || !PData.aInT(oAttID, tI) || (sAttID && !PData.aInT(sAttID, tI))) {
						// Have we run out of Templates?
					if (++tI === numTmplts)
						break doStream;
					tRec = stream.t[tI];
					rI = tRec.i;
				}

					// Get Record data
				aI = stream.s[rI];
				rec = PData.rByN(aI);
				datum = rec.a[oAttID];
				if (typeof datum !== 'undefined') {
					switch (oAtt.def.t) {
					case 'T':
						for (cI=0; cI<cats.length; cI++) {
							cRec = cats[cI];
							if (datum.indexOf(cRec.x) !== -1) {
								cRec.i.push(aI);
								break;
							}
						}
						break;
					case 'g':	// Mutiple Tags -- TO DO: Used sorted order to speed up?
						datum.forEach(function(d) {
							for (cI=0; cI<cats.length; cI++) {
								cRec = cats[cI];
								if (d === cRec.l) {
									cRec.i.push(aI);
									break;
								}
							}
							if (cI === cats.length) {
									// Create random color
								cats.push({ l: d, i: [ aI ], c:'#'+(Math.floor(Math.random()*16777215)).toString(16) });
							}
						});
						break;
					case 'V':	// Multiple Vocab
						datum.forEach(function(d) {
							for (cI=0; cI<cats.length; cI++) {
								cRec = cats[cI];
								if (d == cRec.l) {
									cRec.i.push(aI);
									break;
								}
							}
						});
						break;
					case 'N':
							// Check for 'undefined' category and value as initial exceptions
						cI=0; cRec = cats[0];
						if (cRec.min === '?') {
							if (datum === '?') {
								cRec.i.push(aI);
								break;
							}
							cI=1;
						}
							// if first category wasn't undefined, abort if undefined value
						if (datum === '?')
							break;
						for (; cI<cats.length; cI++) {
							cRec = cats[cI];
								// Did we pass eligible category?
							if (datum < cRec.min)
								break;
							if (cRec.min <= datum && datum <= cRec.max) {
								cRec.i.push(aI);
								break;
							}
						}
						break;
					case 'D':
							// Check for 'undefined' category and value as initial exceptions
						cI=0; cRec = cats[0];
						if (cRec.min === '?') {
							if (datum === '?') {
								cRec.i.push(aI);
								break;
							}
							cI=1;
						}
							// if first category wasn't undefined, abort if undefined value
						if (datum === '?')
							break;
							// Only need to look at start date!
						var sd = PData.dObj(datum.min, 1, false);
						for (; cI<cats.length; cI++) {
							cRec = cats[cI];
								// Did we pass eligible category?
							if (sd < cRec.min)
								break;
							if (cRec.min <= sd && sd < cRec.max) {
								cRec.i.push(aI);
								break;
							}
						}
						break;
					} // switch type
				} // if datum
				rI++;
			} // while

				// if collected Tags, sort them
			if (oAtt.def.t == 'g') {
				cats.sort(function(a,b) { return PData.strcmp(b.l, a.l); });
			}
		}, // cFill()

			// PURPOSE: Create new sorted category array in sCats based on sAtt value
			// INPUT: 	cat = array of aIs of Records
			//			sAtt = definition of Attribute to use for sorting
			//			sCats = category array created by cLNew for storing new aIs
		cSort: function(cat, sAtt, sCats)
		{
			var id=sAtt.id;
			var rec, sI, sRec;

			cat.forEach(function(aI) {
				rec = PData.rByN(aI);
				datum = rec.a[id];
				if (typeof datum !== 'undefined') {
					switch (sAtt.def.t) {
					case 'T':
						for (sI=0; sI<sCats.length; sI++) {
							sRec = sCats[sI];
							if (datum.indexOf(sRec.x) !== -1) {
								sRec.i.push(aI);
								break;
							}
						}
						break;
					case 'g':	// Mutiple Tags
						datum.forEach(function(d) {
							for (sI=0; sI<sCats.length; sI++) {
								sRec = sCats[sI];
								if (d === sRec.l) {
									sRec.i.push(aI);
									break;
								}
							}
							if (sI === sCats.length) {
								sCats.push({ l: d, i: [ aI ], c: '#777777' });
							}
						});
						break;
					case 'V': 	// Multiple Vocab Terms
						datum.forEach(function(d) {
							for (sI=0; sI<sCats.length; sI++) {
								sRec = sCats[sI];
								if (d === sRec.l) {
									sRec.i.push(aI);
									break;
								}
							}
						});
						break;
					case 'N':
							// Check for 'undefined' category and value as initial exceptions
						sI=0; sRec = sCats[0];
						if (sRec.min === '?') {
							if (datum === '?') {
								sRec.i.push(aI);
								break;
							}
							sI=1;
						}
							// if first category wasn't undefined, abort if undefined value
						if (datum === '?')
							break;
						for (; sI<sCats.length; sI++) {
							sRec = sCats[sI];
								// Did we pass eligible category?
							if (datum < sRec.min)
								break;
							if (sRec.min <= datum && datum <= sRec.max) {
								sRec.i.push(aI);
								break;
							}
						}
						break;
					case 'D':
							// Check for 'undefined' category and value as initial exceptions
						sI=0; sRec = sCats[0];
						if (sRec.min === '?') {
							if (datum === '?') {
								sRec.i.push(aI);
								break;
							}
							sI=1;
						}
							// if first category wasn't undefined, abort if undefined value
						if (datum === '?')
							break;
							// Only need to look at start date!
						var sd = PData.dObj(datum.min, 1, false);
						for (sI=0; sI<sCats.length; sI++) {
							sRec = sCats[sI];
								// Did we pass eligible category?
							if (sd < sRec.min)
								break;
							if (sRec.min <= sd && sd < sRec.max) {
								sRec.i.push(aI);
								break;
							}
						}
						break;
					} // switch type
				}
			});
				// if collected Tags, sort them
			if (sAtt.def.t == 'g') {
				sCats.sort(function(a,b) { return PData.strcmp(b.l, a.l); });
			}
		}, // cSort()

			// PURPOSE: Create index for records of particular Template in stream, ordered by the value of an Attribute
			// RETURNS: Array containing objects: { i [absolute index of record], v [value] }
			// NOTES: 	Only uses first value in the case of multiple (V, D, etc)
		rTOrder: function(att, stream, tI)
		{
			function vIden(v)
			{
				return v;
			}
			function vFirst(v)	// Could alternatively concat strings, but needs more space & time
			{
				return v[0];
			}
			function vDate(v)
			{
					// 'undefined' exception
				if (v === '?')
					return '?';
				var m = 1, d = 1;
				if (typeof v.min.m !== 'undefined') {
					m = v.min.m;
					if (typeof v.min.d !== 'undefined')
						d = v.min.d;
				}
				return PData.d3Nums(v.min.y, m, d, false);
			}

			var eval, maxV;
			switch (att.def.t) {
			case 'T': 	eval = vIden;	maxV = '~'; break;
			case 'V': 	eval = vFirst;	maxV = '~'; break;
			case 'g': 	eval = vFirst;	maxV = '~'; break;
			case 'N': 	eval = vIden;	maxV = att.r.max; break;
			case 'D': 	eval = vDate;	maxV = TODAY; break;
			}

			var ord = [];
			var tRec=stream.t[tI], ad=recs[tI];
			var relI=0, absI, rec, v;

			while (relI < tRec.n) {
				absI = stream.s[tRec.i+relI++];
				rec = ad.d[absI-ad.i];

				v = rec.a[att.id];
					// If there is no value, we need to use max value
				if (typeof v === 'undefined')
					ord.push({ i: absI, v: maxV });
				else
					ord.push({ i: absI, v: eval(v) });
			}

				// Sort array
			switch (att.def.t) {
			case 'T':
			case 'g':
			case 'V':
				ord.sort(function(a,b) { return PData.strcmp(b.v, a.v); });
				break;
			case 'D':
			// 	ord.sort(function(a,b) {
			// 		var av = a.v.valueOf(), bv = b.v.valueOf();
			// 		return av - bv;
			// 	});
			// 	break;
			case 'N':
				ord.sort(function(a,b) {
					if (a.v === '?')
						return -1;
					if (b.v === '?')
						return 1;
					return a.v - b.v;
				});
				break;
			}

			return ord;
		}, // rTOrder()

			// RETURNS: View configuration data for vIndex
		vByN: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		}, // vByN()

			// RETURNS: true after all data has been loaded
		ready: function()
		{
			return loaded;
		} // ready
	} // return
})(); // PData
