// This file contains:
//		PState Module
//		PVizModel abstract Class & implementations
//		PFilterModal abstract Class & implementations
//		PViewFrame Objects
//		PData Module for handling data
//		PBootstrap for launching processes and organizing screen

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

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, i }
//				m = overlay map data
//				p = array of associated Perspectives { l, s, n }

	// GLOBAL CONSTANTS
var EVENT_INSTANT = 1;			// Single instantaneous event (not Date range)
var EVENT_F_START = 2;			// Event has fuzzy start
var EVENT_F_END = 4;			// Event has fuzzy end

var PSTATE_INIT = 0;			// Initialization
var PSTATE_LOAD = 1;			// Loading data
var PSTATE_PROCESS = 2;			// Processing data or handling command
var PSTATE_BUILD = 3;			// Building visuals
var PSTATE_UPDATE = 4;			// Updating visuals (selection, etc)
var PSTATE_READY = 5;			// Waiting for user

var D3FG_BAR_WIDTH 	= 25;		// D3 Graphs created for filters
var D3FG_MARGINS	= { top: 4, right: 7, bottom: 22, left: 30 };

var D3SC_MARGINS	= { top: 30, right: 5, bottom: 5, left: 40 };	// Stacked Chart margins

	// Flags for properties of Visualizations
var V_FLAG_LGND  = 0x01;		// Uses Legend
var V_FLAG_SEL   = 0x02;		// Can select individual Records
var V_FLAG_LOC   = 0x04;		// Requires Location Attributes
var V_FLAG_SLGND = 0x08;		// Single Legend (not Template-specific) with single Attribute
var V_FLAG_SET   = 0x10;		// Has an Options dialog
var V_FLAG_VSCRL = 0x20;		// Add vertical scroll bar
var V_FLAG_HSCRL = 0x40;		// Add horizontal scroll bar

var parseTC = /(\d\d)\:(\d\d)\:(\d\d)\.(\d\d?)/; 	// precise regular expression for parsing timecodes

var mnthDays = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

	// GLOBAL VARS
var TODAY = new Date();
var localD3;					// For localizing D3
var months;						// Array of month names (for localization)
var dlText={};					// Dynamically-loaded text stored in Object
								// .sha = "Show/Hide All", .ok, .cancel, .seerec, .close, .add
var xhbtURL;

var widgetData = {			// Widget state has to be global because YouTube API calls global function
							// Therefore code cannot rely upon closure to know state of widget data
	ytLoaded: false,			// YouTube not initially loaded
	ytCall: null,				// function to call once YouTube loaded
	ytCode: null, 				// YouTube code to video to play
	timer: null,				// Timer function for polling playhead
	extract: null,				// String of transcript extract timecodes
	sTime: null,				// start time for any extract in milliseconds
	eTime: null,				// end time for any extract in milliseconds
	playing: false,				// true if widget currently playing
	widget: null,				// JS playback widget object
	xscriptOn: false,			// Transcript showing
	tcArray: null,				// Array of timecode records { s[tart], e[nd] } in milliseconds
	tcIndex: -1 				// Index of playhead in tcArray
};

// ==========================================================
// PState
// PURPOSE: Manages state of Prospect and displaying it
// NOTES: 	Must be a global object because called by VizModels, VizFrames and global app object

var PState = (function() {

	var state = PSTATE_INIT; // current state of Prospect web app
	var pSTxts;				// array of PSTATE_ texts

	return {
		init: function()
		{
			var text = document.getElementById('dltext-pstates').innerHTML;
			pSTxts = text.trim().split('|');
		},

		set: function(s)
		{
			if (s != state) {
				var p = jQuery('#pstate');
				if (state == PSTATE_READY)
					p.addClass('attn');
				else if (s == PSTATE_READY)
					p.removeClass('attn');
				p.text(pSTxts[s-1]);
				state = s;
			}
		} // setState()
	}
})(); // PState


// ==============================================================================
// PVizModel: An abstract class to be subclassed by specific visualizations
//			VizModels are responsible for rendering graphics, handling selections
//			and indicating types of visual attributes

	// INPUT: 	viewFrame = instance variable returned from ViewModel pseudo-constructor
	//			frameID = base ID for frame DIV
	//			vizSettings = c section of VF entry
function PVizModel(viewFrame, vizSettings)
{
	this.vFrame   = viewFrame;
	this.frameID  = viewFrame.getFrameID()+' div.viz-content div.viz-result';
	this.settings = vizSettings;
	this.recSel   = [];

		// Subclasses can override the following:
	// this.getLocAtts(tIndex)
	// this.getFeatureAtts(tIndex)
	// this.teardown()
	// this.isSel(absI)
	// this.getSel()
	// this.toggleSel(absI)
	// this.clearSel()
	// this.resize()
	// this.optionsModal()
	// this.getState()
	// this.setState(pData)
		// All subclasses must implement the following:
	// this.flags()
	// this.setup()
	// this.render(stream)		// Clears any previous selection
	// this.setSel(absIDs)
} // PVizModel

	// PURPOSE: Describe Visualizations's capabilities
PVizModel.prototype.flags = function()
{
	return 0;
} // flags()

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
} // isSel()

	// PURPOSE: Toggle presence of record (by absolute index) in selection list
	// NOTES: 	Called by VizModel based on user interaction
	// RETURNS: true if didn't exist (added), false if existed (removed)
PVizModel.prototype.toggleSel = function(absI)
{
	var sz = this.recSel.length;
	var i = _.sortedIndex(this.recSel, absI);
	if (this.recSel[i] == absI) {
		this.recSel.splice(i, 1);
		if (sz > 0 && this.recSel.length == 0)
			this.vFrame.selBtns(false);
		return false;
	} else {
		this.recSel.splice(i, 0, absI);
		if (sz == 0 && this.recSel.length > 0)
			this.vFrame.selBtns(true);
		return true;
	}
} // toggleSel()

	// PURPOSE: Clear selection list (and remove visual indications of selection)
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
	return [];
} // PVizModel.getFeatureAtts()

PVizModel.prototype.teardown = function()
{
} // PVizModel.teardown()

	// NOTE: resize can get called after Viz created and setup() but before render()
PVizModel.prototype.resize = function()
{
} // PVizModel.resize()

PVizModel.prototype.optionsModal = function()
{
} // PVizModel.optionsModal()

PVizModel.prototype.getState = function()
{
	return {};
} // PVizModel.getState()

PVizModel.prototype.setState = function(state)
{
} // PVizModel.setState()


// ===================================
// VizMap: Class to visualize GIS maps

var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // ViewMap

VizMap.prototype = Object.create(PVizModel.prototype);

VizMap.prototype.constructor = VizMap;

VizMap.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC;
} // flags()

	// PURPOSE: Return IDs of locate Attributes 
VizMap.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.cAtts[tIndex];
	return this.settings.cAtts;
} // getLocAtts()

VizMap.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizMap.prototype.setup = function()
{
	var self=this;

	var centerLat = parseFloat(this.settings.clat);
	var centerLon = parseFloat(this.settings.clon);
	var zoom;
	if (typeof(this.settings.zoom) == 'string')
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

	var vIndex = this.vFrame.getIndex();

		// Leaflet requires a DIV ID to startup: create and insert one
	jQuery(this.frameID).append('<div id="l-map-'+vIndex+'" class="max-size"></div>');

	this.lMap = L.map("l-map-"+vIndex, { zoomControl: false }).setView([centerLat, centerLon], zoom);

		// Layer controls
	var layerControl = L.control.layers();
	layerControl.addTo(this.lMap);

		// Create basemap
	this.baseMap = PMapHub.createMapLayer(this.settings.base, 1, this.lMap, layerControl);

		// Create overlay layers
	var opacity;
	this.mapLayers = [];

		// Compile map layer data into mapLayers array and create with Leaflet
	_.each(this.settings.lyrs, function(layerToUse) {
		opacity = layerToUse.o || 1;

		var newLayer;
		newLayer = PMapHub.createMapLayer(layerToUse.lid, opacity, self.lMap, layerControl);
		self.mapLayers.push(newLayer);
	});

	var vi = this.vFrame.getIndex();
	var fh = _.template(document.getElementById('dltext-v-map').innerHTML);
	jQuery('#view-frame-'+vi+' div.view-control-bar').append(fh({ vi: vi }));

	jQuery('#map-zoom-'+vi).button({ text: false, icons: { primary: "ui-icon-plus" }})
		.click(zoomMap);
	jQuery('#map-unzoom-'+vi).button({ text: false, icons: { primary: "ui-icon-minus" }})
		.click(unzoomMap);
	jQuery('#map-reset-'+vi).button({ text: false, icons: { primary: "ui-icon-arrowrefresh-1-w" }})
		.click(resetMap);

	// var markers;
	// if (this.settings.clster) {
	// 	markers = new L.MarkerClusterGroup();
	// } else {
	var markers = L.featureGroup();            
	// }
	this.markerLayer = markers;

		// Create options properties if they don't already exist
	markers.options = markers.options || { };
	markers.options.layerName = 'Markers';

	markers.addTo(this.lMap);

	var lines = L.featureGroup();
	this.lineLayer = lines;
	lines.addTo(this.lMap);

		// Maintain number of Loc Atts per Template type
	var numT = PData.getNumETmplts();
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
			var tI = PData.aIndex2Tmplt(aid);
				// If so, go through all markers looking for fellows of same _aid and setStyle accordingly
			if (self.tLCnt[tI] > 1) {
				mLayer.eachLayer(function(marker) {
					if (marker.options._aid == aid) {
						if (added)
							marker.setStyle({ color: "#ff0000" });
						else
							marker.setStyle({ color: "#000" });
					}
				});
			} else {
				if (added)
					this.setStyle({ color: "#ff0000" });
				else
					this.setStyle({ color: "#000" });
			}
		}
	} // markerClick()

	if (this.recSel.length > 0)
		this.recSel=[];

		// Remove previous Markers
	mLayer.clearLayers();

	var lines = this.lineLayer;
	lines.clearLayers();

	var numTmplts = PData.getNumETmplts();
	var i=0, aI, tI=0, tRec, tLClr, rec;
	var fAttID, fAtt, locAtts, featSet, pAttID;
	var locData, fData, newMarker;

	var sAttID, sAtt, minR, maxR, dR, minS, dS;

	minR = this.settings.min;
	if (typeof(minR) == 'string')
		minR = parseInt(minR);
	maxR = this.settings.max;
	if (typeof(maxR) == 'string')
		maxR = parseInt(maxR);
	dR = maxR - minR;

		// Clear out marker counts
	for (i=0; i<numTmplts; i++)
		this.tLCnt[i] = 0;

		// If Pointers used, need to cach marker data need to construct links
		//		{ id, c(oordinates)[], p(ointers)[] }
	var mCache;
	for (i=0; i<numTmplts; i++)
		if (this.settings.pAtts[i] != 'disable') {
			mCache=[];
			break;
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
			} while (tRec.n == 0 || (tRec.i+tRec.n) == i);

			locAtts = this.vFrame.getSelLocAtts(tI);
				// Skip Template if no locate Atts
			if (locAtts.length == 0) {
				locAtts = null;
				continue;
			} // if no locAtts
			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				locAtts = null;
				continue;
			} // if no featAtts

			self.tLCnt[tI] = locAtts.length;

				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.getAttID(fAttID);

			pAttID = self.settings.pAtts[tI];
			tLClr = self.settings.lClrs[tI];
			sAttID = self.settings.sAtts[tI];
			if (sAttID) {
				sAtt = PData.getAttID(sAttID);
				if (typeof sAtt.r.min == 'number' && typeof sAtt.r.max == 'number') {
					minS = sAtt.r.min;
					dS = sAtt.r.max - minS;
				} else
					sAttID = null;
			}
		} // if new Template

			// Get Record data and create cache entry
		aI = stream.s[i];
		rec = PData.getRecByIndex(aI);
		var cEntry;
		if (mCache) {
			cEntry={ id: rec.id, c: [], p: rec.a[pAttID], l: tLClr };
		}
			// For each of the locate Attributes
		locAtts.forEach(function(theLAtt) {
			locData = rec.a[theLAtt];
			if (locData) {
				fData = rec.a[fAttID];
				if (typeof fData != 'undefined') {
					fData = PData.getAttLgndVal(fData, fAtt, featSet);
					if (fData) {
						if (typeof locData[0] == 'number') {
							if (sAttID) {
								sAtt = rec.a[sAttID];
								if (typeof sAtt != 'undefined') {
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
							if (locData.length == 2) {
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
// console.log("cEntry: "+JSON.stringify(cEntry));
		if (cEntry && cEntry.c.length > 0)
			mCache.push(cEntry);
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
					var cnnctd = mCache[i];
					if (cnnctd.id == aPtr) {
						node.c.forEach(function(from) {
							cnnctd.c.forEach(function(to) {
								if (from[0] != to[0] || from[1] != to[1])
									links.push({p: [from, to], c: node.l });
							})
						})
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
	jQuery('#view-frame-'+vi+' div.view-control-bar div.iconbar').remove();
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
				marker.setStyle({ color: "#000" });
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
			if (self.isSel(marker.options._aid))
				marker.setStyle({ color: "#ff0000" });
			else
				marker.setStyle({ color: "#000" });
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
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL;
} // flags()

VizCards.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizCards.prototype.setup = function()
{
	var self = this;

	jQuery(this.frameID).on("click.vf", function(event) {
		if (event.target.nodeName == 'DIV') {
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
} // setup()


	// PURPOSE: Draw the Records in the given stream
VizCards.prototype.render = function(stream)
{
	var self = this;

	var numTmplts = PData.getNumETmplts();
	var i=0, aI, tI=-1, tID, tRec, tDef;
	var newT=true, fAttID, fAtt, iAttID;
	var featSet, rec, c;
	var hasC, cnt, datum, t, tDiv, tC;

	var thisFrame = jQuery(this.frameID);
	thisFrame.empty();

	if (this.recSel.length > 0)
		this.recSel=[];

	var insert;

	var div = 'w'+this.settings.w+' h'+this.settings.h;

	while (i<stream.l) {
			// Starting with new Template?
		if (newT) {
			do {
				if (++tI == numTmplts)
					return;
				tRec = stream.t[tI];
			} while (tRec.n == 0 || (tRec.i+tRec.n) == i);

			tID = PData.getETmpltIndex(tI);
			tDef = PData.getTmpltID(tID);

			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				newT = true;
				continue;
			} // if no featAtts

			thisFrame.append('<div class="template-label">'+tDef.l+'</div><div class="cards" data-ti="'+tI+'"></div>');
			insert = jQuery('div.cards[data-ti="'+tI+'"]');

				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.getAttID(fAttID);

			iAttID = self.settings.iAtts[tI];
			cnt = self.settings.cnt[tI];
			newT = false;
		} // if new Template

			// Get Record data and create cache entry
		aI = stream.s[i];
		rec = PData.getRecByIndex(aI);
			// Eval Legend
		datum = rec.a[fAttID];
		if (typeof datum != 'undefined') {
			c = PData.getAttLgndRecs(datum, fAtt, featSet, false);

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
				if (datum = rec.a[iAttID]) {
					if (hasC)
						t = '<div class="card-body"><img src="'+datum+'"/><div class="card-cnt"'+tC+'>'+t+'</div></div>';
					else
						t = '<div class="card-body"><img class="full" src="'+datum+'"/></div>';
				} else {
					t = '<div class="card-body"><div class="card-cnt"'+tC+'>'+t+'</div>';
				}
				insert.append('<div class="card '+div+'" style="background-color:'+c.v+'" data-ai="'+aI+'">'+tDiv+t+'</div>');
			} // if Legend selected
		} // if Legend datum
		if (++i == (tRec.i + tRec.n)) {
			newT = true;
		}
	} // while
} // render()

VizCards.prototype.teardown = function()
{
	jQuery(this.frameID).off("click.vf");
}

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
	return { l: this.vFrame.getLgndSels() };
} // getState()


VizCards.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
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
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC;
} // flags()

	// PURPOSE: Return IDs of locate Attributes 
VizPinboard.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null)
		return [this.settings.cAtts[tIndex]];
	return [this.settings.cAtts];
} // getLocAtts()

VizPinboard.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizPinboard.prototype.setup = function()
{
	var s = this.settings;

		// Maintain number of Loc Atts per Template type
	var numT = PData.getNumETmplts();

	this.xScale = d3.scale.linear().domain([0, s.iw-1])
		.rangeRound([0, s.dw-1]);
	this.yScale = d3.scale.linear().domain([0,s.ih-1]).range([0,s.dh-1]);

	this.xAxis = d3.svg.axis().scale(this.xScale).orient("top");
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

	var svg = d3.select(this.frameID).append("svg")
		.attr("width", s.dw+30+3)
		.attr("height", s.dh+30+2);

	var defs = svg.append('defs');

	defs.append("marker")
		.attr("id", "arrowhead")
		.attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
		.attr("refY", 2)
		.attr("markerWidth", 6)
		.attr("markerHeight", 4)
		.attr("orient", "auto")
		.append("path")
			.attr("d", "M 0,0 V 4 L6,2 Z");

		// Create definition for pin icon
		// made by http://www.flaticon.com/authors/bogdan-rosu
	var pinDef = defs.append('g')
		.attr('id', 'pin');
	pinDef.append('path')
		.attr('d', "M36.439,12.646c0-6.919-5.608-12.527-12.528-12.527S11.384,5.727,11.384,12.646c0,9.913,12.527,24.582,12.527,24.582 S36.439,22.508,36.439,12.646z M17.733,11.898c0-3.413,2.767-6.179,6.179-6.179s6.179,2.766,6.179,6.179 c0,3.413-2.767,6.179-6.179,6.179S17.733,15.311,17.733,11.898z");
	pinDef.append('circle')
		.attr('cx', '23.911')
		.attr('cy', '11.898')
		.attr('r', '3.038')
	pinDef.append('path')
		.attr('d', "M30.994,32.87c-1.021,1.476-1.979,2.761-2.777,3.793c7.916,0.476,13.104,2.185,15.034,3.456 c-2.261,1.491-8.979,3.587-19.338,3.587c-10.358,0-17.077-2.097-19.338-3.587c1.93-1.271,7.114-2.979,15.022-3.455 c-0.8-1.032-1.759-2.316-2.781-3.792C7.075,33.831,0,36.713,0,40.118c0,4.19,10.707,7.588,23.913,7.588 c13.207,0,23.912-3.396,23.912-7.588C47.827,36.711,40.744,33.828,30.994,32.87z");

	this.chart = svg.append("g")
		.attr("transform", "translate(30,30)");

	this.chart.append("g")
		.attr("class", "x axis")
		.call(this.xAxis);

	this.chart.append("g")
		.attr("class", "y axis")
		.call(this.yAxis);

	this.chart.append("image")
		.attr("xlink:href", s.img)
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", s.dh)
		.attr("width", s.dw);

		// Dragging background
	this.chart.on("click", function()
	{
		// d3.event.preventDefault();
	});

		// TO DO -- add SVG layers

		// Create icon palette
	this.gRecs = this.chart.append('g')
		.attr('id', 'recs');
} // setup

	// PURPOSE: Draw the Records in the given stream
	// NOTES: 	Creates nodes 
VizPinboard.prototype.render = function(stream)
{
	var self = this;

	function clickPin(d, i)
	{
		// console.log("Clicked "+i+": "+JSON.stringify(d));
			// Toggle class
		var s = self.toggleSel(d.ai);
		d3.select(this).classed('obj-sel', s);
	} // clickPin()

		// Remove all previous icons
	this.gRecs.selectAll('svg.recobj').remove();

	if (this.recSel.length > 0)
		this.recSel=[];

	var idx, idy, iw, ih;
	var numTmplts = PData.getNumETmplts();
	var i, aI, tI=0, tRec, rec;
	var fAttID, fAtt, locAtts, featSet, pAttID;
	var locData, fData;

		// If Pointers used, need to cach marker data need to construct links
		//		{ id, c(oordinates)[], p(ointers)[] }
	var mCache;
	for (i=0; i<numTmplts; i++)
		if (this.settings.pAtts[i] != 'disable') {
			mCache=[];
			break;
		}

	// switch (this.settings.size) {
	// case 's':
	// 	idx = -6; idy = -10; iw = 12; ih = 12;
	// 	break;
	// case 'm':
	// 	idx = -12; idy = -20; iw = 24; ih = 24;
	// 	break;
	// case 'l':
	// 	idx = -16; idy = -30; iw = 32; ih = 32;
	// 	break;
	// }

		// TO DO
	idx = -12; idy = -20; iw = 24; ih = 24;

	i=0; tI=-1;
	doStream:
	while (i<stream.l) {
			// Starting with new Template?
		if (locAtts == null) {
			do {
				if (++tI == numTmplts)
					break doStream;
				tRec = stream.t[tI];
			} while (tRec.n == 0 || (tRec.i+tRec.n) == i);

			locAtts = this.vFrame.getSelLocAtts(tI);
				// Skip Template if no locate Atts
			if (locAtts.length == 0) {
				locAtts = null;
				continue;
			} // if no locAtts
				// Can only be a single Attribute on Pinboards
			locAtts = locAtts[0];
			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				locAtts = null;
				continue;
			} // if no featAtts
				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.getAttID(fAttID);
			pAttID = self.settings.pAtts[tI];
		} // if new Template
			// Get Record data
		aI = stream.s[i];
		rec = PData.getRecByIndex(aI);
		var cEntry;
		if (mCache) {
			cEntry={ id: rec.id, c: null, p: rec.a[pAttID] };
		}

		locData = rec.a[locAtts];
		if (locData) {
			fData = rec.a[fAttID];
			if (typeof fData != 'undefined') {
				fData = PData.getAttLgndVal(fData, fAtt, featSet);
				if (fData) {
// console.log("Record "+i+"["+fAttID+"]: "+rec.a[fAttID]+" = "+fData);
					if (typeof locData[0] == 'number') {
						nodes.push({ ai: aI, id: rec.id, v: fData,
									 x: locData[0]+idx, y: locData[1]+idy, w: iw, h: ih
								});
						if (cEntry)
							cEntry.c = locData;
					} else {
							// TO DO: Create separate arrays to store lines & polygons?
						if (locData.length == 2) {
							// draw line
						} else {
							// draw polygon
						}
					} // Not a single coord
				} // if fData
			} // if fData
		} // if locData
		if (cEntry && cEntry.c.length > 0)
			mCache.push(cEntry);
			// Increment stream index -- check if going into new Template
		if (++i == (tRec.i + tRec.n)) {
			locAtts = null;
		}
	} // while

		// Apply D3 to nodes
	this.gRecs.selectAll('svg.recobj')
		.data(nodes)
		.enter()
		.append('svg').attr('class', 'recobj')
		.attr('x', function(d) { return self.xScale(d.x); })
		.attr('y', function(d) { return self.yScale(d.y); })
		.attr('width', function(d) { return self.xScale(d.w); })
		.attr('height', function(d) { return self.yScale(d.h); })
		.attr('viewBox', '0 0 48 48')
		.attr('data-ai', function(d) { return d.ai; })
		.on('click', clickPin)
		.append('use')
		.attr('xlink:href', '#pin')
		.attr('fill', function(d) { return d.v; });
} // render()

VizPinboard.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];

		this.gRecs.selectAll('svg.recobj').classed('obj-sel', false);
	}
} // clearSel()

VizPinboard.prototype.setSel = function(absIArray)
{
	var self = this;

	this.recSel = absIArray;
	this.gRecs.selectAll('svg.recobj').classed('obj-sel', function(d) {
		return self.isSel(d.ai);
	});
} // setSel()

VizPinboard.prototype.optionsModal = function()
{
	var self=this;

	function slide()
	{
		var p = jQuery(this).parent().data('i');
// console.log("Slide "+p+" to: "+this.value);
		if (p == -1) {
			// self.baseMap.setOpacity(this.value);
		}
	} // slide()

	var layerPt = jQuery('#dialog-opacities div.layer-list');
	layerPt.empty();

	var newBit = jQuery('<div data-i="-1"><input type="checkbox" checked="checked"> Base Image <input type=range class="op-slider" min=0 max=100 value=90 step=5></div>');
	newBit.find('.op-slider').on('change', slide);
	layerPt.append(newBit);

	var d = jQuery("#dialog-map-opacities").dialog({
		height: 300,
		width: 320,
		modal: true,
		buttons: [
			{
				text: dlText.ok,
				click: function() {
					d.dialog("close");
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
} // optionsModal()

VizPinboard.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()


VizPinboard.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()


// ===============================================
// VizTime: Class to visualize Records on Timeline

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

VizTime.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

	// PURPOSE: Return IDs of locate Attributes 
VizTime.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null)
		return [this.settings.dAtts[tIndex]];
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

	if (typeof this.settings.xLbl != 'number')
		this.settings.xLbl = parseInt(this.settings.xLbl);

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

	if (typeof s.bHt === 'string')
		s.bHt = parseInt(s.bHt, 10);

	function minMaxDates()
	{
		var minY, minM, minD, maxY, maxM, maxD;

			// By default, use min & max time bounds from Dates Attributes
		s.dAtts.forEach(function(dAttID) {
			if (dAttID != null && dAttID != 'disable') {
				var dAtt = PData.getAttID(dAttID);
				if (dAtt) {
						// Check mins
					if (minY == null || dAtt.r.min.y < minY) {
						minY = dAtt.r.min.y;
						if (typeof dAtt.r.min.m != 'undefined') {
							minM = dAtt.r.min.m;
							if (typeof dAtt.r.min.d != 'undefined')
								minD = dAtt.r.min.d;
							else
								minD = 1;
						} else {
							minM = 1; minD = 1;
						}
					} else if (dAtt.r.min.y == minY) {
						if (typeof dAtt.r.min.m != 'undefined') {
							if (dAtt.r.min.m < minM) {
								minM = dAtt.r.min.m;
								if (typeof dAtt.r.min.d != 'undefined')
									minD = dAtt.r.min.d;
								else
									minD = 1;
							} else if (dAtt.r.min.m == minM) {
								if (typeof dAtt.r.min.d != 'undefined') {
									if (dAtt.r.min.d < minD)
										minD = dAtt.r.min.d;
								}
							}
						}
					}
						// Check maxs
					if (maxY == null) {
						if (typeof dAtt.r.max.y == 'undefined') {
							maxY = TODAY.getUTCFullYear();
							maxM = TODAY.getMonth() + 1;
							maxD = TODAY.getDate();
						} else {
							maxY = dAtt.r.max.y;
							if (typeof dAtt.r.max.m != 'undefined') {
								maxM = dAtt.r.max.m;
								if (typeof dAtt.r.max.d != 'undefined')
									maxD = dAtt.r.max.d;
								else
									maxD = mnthDays[maxM-1];
							} else {
								maxM = 12; maxD = 31;
							}
						}
					} else if (dAtt.r.max.y > maxY) {
						maxY = dAtt.r.max.y;
						if (typeof dAtt.r.max.m != 'undefined') {
							maxM = dAtt.r.max.m;
							if (typeof dAtt.r.max.d != 'undefined')
								maxD = dAtt.r.max.d;
							else
								maxD = mnthDays[maxM-1];
						} else {
							maxM = 12; maxD = 31;
						}
					} else if (dAtt.r.max.y == maxY) {
						if (typeof dAtt.r.max.m != 'undefined') {
							if (dAtt.r.max.m > maxM) {
								maxM = dAtt.r.max.m;
								if (typeof dAtt.r.max.d != 'undefined')
									maxD = dAtt.r.max.d;
								else
									maxD = mnthDays[maxM-1];
							} else if (dAtt.r.max.m == maxM) {
								if (typeof dAtt.r.max.d != 'undefined') {
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
		if (s.from.length > 0)
			self.minDate = PData.parseDate(s.from, 1, 1);
		else
			self.minDate = PData.date3Nums(minY, minM, minD);
		if (s.to.length > 0)
			self.maxDate = PData.parseDate(s.to, 12, 31);
		else
			self.maxDate = PData.date3Nums(maxY, maxM, maxD);
// console.log("Min: "+minY+"-"+minM+"-"+minD);
// console.log("Max: "+maxY+"-"+maxM+"-"+maxD);

			// Size of instananeous event: 1.5% of total time period space
		self.instGap = (self.maxDate - self.minDate) * .015;
// console.log("InstGap = "+JSON.stringify(self.instGap));
	} // minMaxDates

	minMaxDates();

		// Create outer SVG container
	var widths = self.getWidths();

	var svg = d3.select(this.frameID).append("svg")
		.attr("class", "tl-vf")
		.attr("width", widths[1]);

	function makeDefs()
	{
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
			var att = PData.getAttID(lAttID);
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
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', 'white');
			gradDef.append('stop').attr('offset', '5%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', cVal);
			gradDef = defs.append('linearGradient').attr('id', name+'-fe');
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '95%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', 'white');
			gradDef = defs.append('linearGradient').attr('id', name+'-fb');
			gradDef.append('stop').attr('offset', '0%').attr('stop-color', 'white');
			gradDef.append('stop').attr('offset', '5%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '95%').attr('stop-color', cVal);
			gradDef.append('stop').attr('offset', '100%').attr('stop-color', 'white');
		});

			// The XOR filter ensures that text contrasts with any background
			// TO DO: Not quite working properly...
		var filter = defs.append('filter')
			.attr('id', 'xortext');
		filter.append('feComposite')
			.attr('operator', "xor");
	} // makeDefs

	makeDefs();

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
						xScale: d3.time.scale(),
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

		if (bi == 1)
		{
			var zMin=self.minDate, zMax=self.maxDate;
			if (self.settings.zFrom.length > 0)
				zMin = PData.parseDate(self.settings.zFrom, 1, 1);
			if (self.settings.zTo.length > 0)
				zMax = PData.parseDate(self.settings.zTo, 12, 31);
			band.xScale.domain([zMin, zMax]);
			self.zMinDate = zMin;
			self.zMaxDate = zMax;
		} else {
			band.xScale.domain([self.minDate, self.maxDate]);
		}
		band.xScale.range([0, band.w]);

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
		var axis = d3.svg.axis()
			.scale(band.xScale)
			.orient("bottom")
			.tickSize(6, 0)
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
			;

			// Do we need to localize the axis labels?
		if (localD3)
			axis.tickFormat(localD3);

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
		self.cmpnts.push(axisDraw); // for timeline.redraw -- TO DO: Need both?? Test
	} // createXAxis()

	createXAxis(0);
	createXAxis(1);

	function createLabels(bi)
	{
		var band = self.bands[bi];

		var labelH;
			// Zoom band has double height labels
		if (bi == 1) {
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
		if (bi == 1) {
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
				})
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

	function createBrush()
	{
		var band = self.bands[0];	// Place brush in top macro band

			// Create logical controller
		self.brush = d3.svg.brush()
			.x(band.xScale.range([0, band.w]))
				// Start with default zoom position
			.extent([self.zMinDate, self.zMaxDate])
				// Code to bind when brush moves
			.on('brush', function() {
				var extent0 = self.brush.extent(); // "original" default value
				var extent1;                  		// new recomputed value

				  // if dragging, preserve the width of the extent, rounding by days
				if (d3.event.mode === "move") {
					var d0 = d3.time.day.round(extent0[0]),
						d1 = d3.time.day.offset(d0, Math.round((extent0[1] - extent0[0]) / 864e5));
					extent1 = [d0, d1];

					// otherwise, if new position, round both dates
				} else {
					extent1 = extent0.map(d3.time.day.round);

						// if empty when rounded, create minimal sized lens -- at least 1 day long
					if (extent1[0] >= extent1[1]) {
						extent1[0] = d3.time.day.floor(extent0[0]);
						extent1[1] = d3.time.day.ceil(d3.time.day.offset(extent1[0], Math.round(self.instGap / 864e5)));
					}
				}

					// "this" will actually point to the brushSVG object
					// Replaces SVG data to correspond to new brush params
				// self.brushSVG.call(self.brush.extent(extent1));

				self.brush.extent(extent1);
				self.brushHandler.redraw();

					// Rescale bottom/zoom timeline
				zoom = self.bands[1];
				zoom.xScale.domain(extent1);
				zoom.redraw();
			});
	} // createBrush()

	createBrush();
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
	var vI = self.vFrame.getIndex();

	if (this.recSel.length > 0)
		this.recSel=[];

	self.events=[];		// All event data
	self.lgBds=[];		// Date Legend Backgrounds: { s[tart], e[nd], t[top track #], h[eight], d[ata in Legend rec] }

	var numTracks=0;

		// Process each Template's data
	function procTmplts()
	{
		var numTmplts = PData.getNumETmplts();
		var tI=0, tRec, aI;
		var featSet, dAttID, dAtt, fData, dData;
		var fAtt, fAttID;

			// Process the Date data by each Template type
		while (tI<numTmplts) {
			tRec = stream.t[tI];
				// Advance until we get to current Template rec
			while (tRec.n == 0) {
					// Have we run out of Templates?
				if (++tI == numTmplts)
					return;
				tRec = stream.t[tI];
			}

				// only 1 Location Attribute possible - skip if not selected
			featSet = self.vFrame.getSelLocAtts(tI);
			if (featSet.length == 0) {
				tI++;
				continue;
			}

			featSet = self.vFrame.getSelFeatAtts(tI);
				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				tI++;
				continue;
			}
				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PData.getAttID(fAttID);
			dAttID = self.settings.dAtts[tI];

			var y, m, d;
			var s, e, f, l;
			var rec;

				// Event records { s[tart], e[nd], ai, f[lags], c[olor data], l[abel], t[rack] }
			var te=[];

			for (var i=tRec.i; i<(tRec.i+tRec.n); i++) {
				aI = stream.s[i];

				rec = PData.getRecByIndex(aI);
				fData = rec.a[fAttID];
				if (typeof fData != 'undefined') {
					if (fData = PData.getAttLgndRecs(fData, fAtt, featSet, false)) {
						if (dData = rec.a[dAttID]) {
							f = dData.min.f ? EVENT_F_START : 0;
							y = dData.min.y;
							if (typeof dData.min.m == 'undefined') {
								m = 1; d = 1;
							} else {
								m = dData.min.m;
								if (typeof dData.min.d == 'undefined')
									d = 1;
								else
									d = dData.min.d;
							}
							s = PData.date3Nums(y,m,d);
							if (typeof dData.max == 'undefined') {
								f |= EVENT_INSTANT;
								e = s.getTime() + self.instGap;
							} else {
								if (dData.max == 'open')
									e = TODAY;
								else {
									if (dData.max.f)
										f |= EVENT_F_END;
									y = dData.max.y;
									if (typeof dData.max.m == 'undefined') {
										m = 12; d = 31;
									} else {
										m = dData.max.m;
										if (typeof dData.max.d == 'undefined')
											d = mnthDays[m-1];
										else
											d = dData.max.d;
									}
									e = PData.date3Nums(y,m,d);
								} // number
							}
							te.push({ s: s, e: e, ai: aI, f: f, c: fData, l: rec.l, t: 0 });
						} // has Date data
					} // translates to Legend value
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
			dAtt = PData.getAttID(dAttID);
			dAtt.l.forEach(function(lEntry) {
				l = lEntry.d;
				y = l.min.y;
				if (typeof l.min.m == 'undefined') {
					m = 1; d = 1;
				} else {
					m = l.min.m;
					if (typeof l.min.d == 'undefined')
						d = 1;
					else
						d = l.min.d;
				}
				s = PData.date3Nums(y,m,d);
				if (typeof l.max.y == 'undefined') {
					e = TODAY;
				} else {
					y = l.max.y;
					if (typeof l.max.m == 'undefined') {
						m = 12; d = 31;
					} else {
						m = l.max.m;
						if (typeof l.max.d == 'undefined')
							d = mnthDays[m-1];
						else
							d = l.max.d;
					}
					e = PData.date3Nums(y,m,d);
				}
				self.lgBds.push({s: s, e: e, t: numTracks, h: tracks.length+1, d: lEntry });
			});

				// Add track position for Template legend labels
			numTracks += tracks.length+1;
				// Append event data
			self.events = self.events.concat(te);

			tI++;
		} // while 
	} // procTmplts()

	procTmplts();

// console.log("Events: "+JSON.stringify(self.events));
// console.log("Legend Backgrounds: "+JSON.stringify(self.lgBds));

	var widths = self.getWidths();

		// PURPOSE: Update macro & zoom band info based on track data
		// INPUT: 	i = 0 for top macro band, 1 for lower zoom band
	function updateBand(bi)
	{
		function eventClass(d)
		{
			if (d.f & EVENT_INSTANT)
				return "event instant";
			else
				return "event range";
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
		if (bi == 1) {
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

		if (bi == 1)
			allEs.on("click", clickEvent);

			// Complete specifying data for date ranges
		var ranges = d3.select(band.svgID).selectAll(".range");
			// Solid rectangle to fill interval with color
		ranges.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", function(d) {
					// check to see if fuzzy start or end
				if (bi == 1 && (d.f & (EVENT_F_START|EVENT_F_END))) {
						// both?
					if ((d.f & (EVENT_F_START|EVENT_F_END)) == (EVENT_F_START|EVENT_F_END)) {
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
		if (bi == 1) {
			ranges.append("text")
				.attr("class", "rangeLbl")
				.attr("x", 4)
				.attr("y", fPos)
				// .style('filter', "url(#xortext)")
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
		if (bi == 1) {
				// Create label
				// XOR filter not quite working...
			instants.append("text")
				.attr("class", "instantLbl")
				.attr("x", instLX)
				.attr("y", fPos)
				.style("font-size", fHt)
				.style('filter', "url(#xortext)")
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

		// NOTES: 	Brush SVGs must be "on top" of everything else and hence must be created last
		//			Code must destroy any previous SVG which would now be below stack
	function updateBrush()
	{
			// Object for creating brush handles, variant of: http://bl.ocks.org/jisaacks/5678983
			// NOTE: Assumes that self.brush has already been created
		var BrushHandler = (function() {
			function BrushHandles(g, height) {
				this._height = height;
				this.g = g;
				this.mask  = this.g.attr("class", "brush").call(self.brush);
				this.mask.selectAll("rect").attr("y", 0).attr("height", height);

				this.left  = this.mask.append("polygon").attr("class","dragger");
				this.right = this.mask.append("polygon").attr("class","dragger");
				this._x = null;
				this._top = null;
				this._bottom = null;
			}

			BrushHandles.prototype.style = function(prop, val) {
				this.left.style(prop, val);
				this.right.style(prop, val);
				return this;
			}

			BrushHandles.prototype.x = function(f) {
				if (f == null) { return this._x; }
				this._x = f;
				return this;
			}

			BrushHandles.prototype.height = function(h) {
				if (h == null) { return this._height; }
				this._height = h;
				this.mask.selectAll("rect").attr("height", h);
				return this;
			}

				// NOTE: This only redraws handles
			BrushHandles.prototype.redraw = function() {
				var lTime, rTime, lp, rp, xRange, theExtent;

				theExtent = self.brush.extent();

				xRange = this._x.range();
				lTime = theExtent[0];
				rTime = theExtent[1];
				lp = this._x(lTime);
				rp = this._x(rTime);

					// Side handles -- but they are not "hot" themselves, so may be misleading
				// var midH = this._height / 2;
				// this.left.attr("points", "" + lp+","+(midH-5) + " " + lp+","+(midH+5) + " " + (lp-5)+","+(midH+5) + " " +
				//                 (lp-9)+","+midH + " " + (lp-5)+","+(midH-5) + " " + lp+","+(midH-5));
				// this.right.attr("points", "" + rp+","+(midH-5) + " " + (rp+5)+","+(midH-5) + " " + (rp+9)+","+midH + " " +
				//                 (rp+5)+","+(midH+5) + " " + rp+","+(midH+5) + " " + rp+","+(midH-5));

					// Bottom handles
				this.left.attr("points", "" + lp+","+this._height + " " + (lp+5)+","+(this._height+5) + " " + (lp+5)+","+(this._height+9) + " " +
								(lp-5)+","+(this._height+9) + " " + (lp-5)+","+(this._height+5) + " " + lp+","+this._height);
				this.right.attr("points", "" + rp+","+this._height + " " + (rp+5)+","+(this._height+5) + " " + (rp+5)+","+(this._height+9) + " " +
								(rp-5)+","+(this._height+9) + " " + (rp-5)+","+(this._height+5) + " " + rp+","+this._height);
				return this;
			}

			return BrushHandles;
		})();

		var band = self.bands[0];	// Place brush in top macro band

			// SVG area where brush will be created
		if (self.brushSVG != null)
			self.brushSVG.remove();
		self.brushSVG = band.g.append("svg");

		self.brushHandler =
			new BrushHandler(self.brushSVG, band.h-1)
				.x(band.xScale)
				.redraw();
	} // updateBrush()

	updateBrush();

		// PURPOSE: Update the clipping rectangle
	function updateSizes()
	{
		var zoom = self.bands[1];
		var h = zoom.t + zoom.h + 45;

			// Set total height of chart container
		d3.select(self.frameID+" svg.tl-vf").attr("height", h);

			// update clipping rectangle
		d3.select('#tl-clip-'+vI+' rect').attr("height", h);
	} // updateClip()

	updateSizes();

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
	var self=this;

		// Expand width of containers for visual space
	var widths = self.getWidths();

	var tlSVG = d3.select(self.frameID+" svg.tl-vf");
	tlSVG.attr("width", widths[1]);

		// Clip all graphics to inner area of chart
	tlSVG.select("#tl-clip-"+self.vFrame.getIndex()+" rect").attr("width", widths[1]);

		// Now update each band
	for (var bi=0; bi<2; bi++) {
		b = self.bands[bi];
		b.w = widths[1];
		tlSVG.select(b.svgID).attr("width", widths[1]);
		b.xScale.range([0, widths[1]]);

			// Need to update position of end labels (rect and text)
		var toLabel = b.labels[1];
		var txtLeft = toLabel.x()+toLabel.tDelta;
		b.labelSVGs.select('#rect-'+toLabel.name).attr("x", toLabel.left() );
		b.labelSVGs.select('#txt-'+toLabel.name).attr("x", txtLeft);
		if (bi == 0) {
			if (self.brush) {
					// Update brush by reinstating its extent
				if (self.brushSVG) {
					var extent = self.brush.extent();
					self.brushSVG.call(self.brush.extent(extent));
				}
				if (self.brushHandler)
					self.brushHandler.redraw();
			}
			b.labelSVGs.select('#m-txt-'+toLabel.name).attr("x", txtLeft);
		}
	}

		// Now recompute everything!
	self.cmpnts.forEach(function(c) {
		c.redraw();
	});
} // resize()

VizTime.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	function eventClass(d)
	{
		if (self.isSel(d.ai)) {
			if (d.f & EVENT_INSTANT)
				return "event instant obj-sel";
			else
				return "event range obj-sel";
		} else {
			if (d.f & EVENT_INSTANT)
				return "event instant";
			else
				return "event range";
		}
	} // checkSel()

		// Only zoom band events are selected
	d3.select(this.bands[1].svgID).selectAll(".event")
			.attr("class", eventClass);
} // setSel()

VizTime.prototype.clearSel = function()
{
	function eventClass(d)
	{
		if (d.f & EVENT_INSTANT)
			return "event instant";
		else
			return "event range";
	} // checkSel()

	if (this.recSel.length > 0) {
		this.recSel = [];
			// Only zoom band events are selected
		d3.select(this.bands[1].svgID).selectAll(".event")
				.attr("class", eventClass);
	}
} // clearSel()

VizTime.prototype.getState = function()
{
		// Create more compact form for date to parse later
	var e = this.brush.extent();
	var e0 = e[0], e1 = e[1];
	var m = e0.getUTCMonth()+1;
	var d0 = e0.getUTCFullYear().toString()+'-'+m.toString()+'-'+e0.getDate().toString();
	m = e1.getUTCMonth()+1;
	var d1 = e1.getUTCFullYear().toString()+'-'+m.toString()+'-'+e1.getDate().toString();
	return { d0: d0, d1: d1, l: this.vFrame.getLgndSels() };
} // getState()

VizTime.prototype.setState = function(state)
{
	var e0 = PData.parseDate(state.d0, 1, 1);
	var e1 = PData.parseDate(state.d1, 12, 31);

		// Rescale bottom/zoom timeline
	var zoom = this.bands[1];
	zoom.xScale.domain([e0, e1]);

	this.brush.extent([e0, e1]);

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
	return V_FLAG_SEL | V_FLAG_VSCRL;
} // flags()

VizDirectory.prototype.setup = function()
{
	var self = this;

	jQuery(this.frameID).on("click.vf", function(event) {
		if (event.target.nodeName == 'TD') {
			var row = jQuery(event.target).closest('tr');
			var absI = row.data('ai');
			if (absI != null) {
				var s = self.toggleSel(absI);
				if (s)
					row.addClass("obj-sel");
				else
					row.removeClass("obj-sel");
			}
		} else if (event.target.nodeName == 'TH') {
			// TO DO: Sort by this column
		}
	});
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizDirectory.prototype.render = function(stream)
{
	var self = this;

	var numTmplts = PData.getNumETmplts();
	var i=0, aI, tI=0, tID, tRec, tDef;
	var insert=null, fAtts, datum, rec, t;

	var thisFrame = jQuery(this.frameID);
	thisFrame.empty();

	if (this.recSel.length > 0)
		this.recSel=[];

	tRec = stream.t[0];
	while (i<stream.l) {
			// Advance until we get to current Template rec
		while (tRec.n == 0 || (tRec.i+tRec.n) == i) {
				// Have we run out of Templates?
			if (++tI == numTmplts)
				return;
			tRec = stream.t[tI];
			insert = null;
		}
			// Starting with new Template? Create new table
		if (insert == null) {
// console.log("Starting new Template: "+tI);
			tID = PData.getETmpltIndex(tI);
			tDef = PData.getTmpltID(tID);
			thisFrame.append('<div class="template-label">'+tDef.l+'</div>'+
				'<table cellspacing="0" class="viz-directory" data-id='+tID+'></table>');
			insert = thisFrame.find('table[data-id="'+tID+'"]');
			fAtts = self.settings.cnt[tI];
			t = '<thead><tr>';
			fAtts.forEach(function(theAtt) {
				var att = PData.getAttID(theAtt);
				t += '<th>'+att.def.l+'</th>';
			})
			insert.append(t+'<tr></thead><tbody></tbody>');
			insert = insert.find('tbody');
		} // if new Template

			// Get Record data
		aI = stream.s[i];
// console.log("Next record: "+i+" (absI) "+aI);
		rec = PData.getRecByIndex(aI);
		t = '<tr data-id="'+rec.id+'" data-ai='+aI+'>';
		fAtts.forEach(function(attID) {
			datum = rec.a[attID];
			if (typeof datum != 'undefined') {
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
			// Increment stream index
		i++;
	} // while 
} // render()

VizDirectory.prototype.teardown = function()
{
	jQuery(this.frameID).off("click.vf");
}

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
	if (tIndex != null)
		return [this.settings.order[tIndex]];
	return _.map(this.settings.order, function(attID) { return [attID]; });
} // getLocAtts()

VizTextStream.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizTextStream.prototype.setup = function()
{
	var self = this;

	jQuery(this.frameID).on("click.vf", function(event) {
		if (event.target.nodeName == 'DIV') {
			var word = jQuery(event.target);
			var aI = word.data('ai');
			if (typeof aI != 'undefined' && aI >= 0) {
				var s = self.toggleSel(aI);
				if (s)
					word.addClass("obj-sel");
				else
					word.removeClass("obj-sel");
			}
		}
	});
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizTextStream.prototype.render = function(stream)
{
	var self = this;

	var numTmplts = PData.getNumETmplts();
	var tI=0, tID, tRec, tDef;
	var insert, rec, datum, t, s;

	var order, oAtt, cAttID, cAtt, featSet, fAttID, fAtt, fData;
	var szAtt, szAttID, da, dt, bC;

	var vizDiv = jQuery(this.frameID);
	vizDiv.empty();

	if (this.recSel.length > 0)
		this.recSel=[];

	dt = this.settings.max - this.settings.min;

	tRec = stream.t[0];
	while (tI<numTmplts) {
			// Advance until we get to current Template rec
		while (tRec.n == 0) {
				// Have we run out of Templates?
			if (++tI == numTmplts)
				return;
			tRec = stream.t[tI];
		}

			// only 1 Location Attribute possible - skip if not selected
		featSet = self.vFrame.getSelLocAtts(tI);
		if (featSet.length == 0) {
			tI++;
			continue;
		}

		featSet = self.vFrame.getSelFeatAtts(tI);
			// Skip Templates if no feature Atts
		if (featSet.length == 0) {
			tI++;
			continue;
		}
			// Which Attribute chosen for Legend?
		fAttID = self.vFrame.getSelLegend(tI);
		fAtt = PData.getAttID(fAttID);

			// Starting with new Template? Create new DIV & order Records
		vizDiv.append('<div class="viz-textstream" data-ti='+tI+'></div>');
		insert = vizDiv.find('div.viz-textstream[data-ti='+tI+']');

			// Begin with Template name
		tID = PData.getETmpltIndex(tI);
		tDef = PData.getTmpltID(tID);
		insert.append('<div class="template-label">'+tDef.l+'</div>');

		cAttID = self.settings.cnt[tI];
		szAttID = self.settings.sAtts[tI];
		if (szAttID) {
			szAtt = PData.getAttID(szAttID);
			if (typeof szAtt.r.min == 'number' && typeof szAtt.r.max == 'number')
				da = szAtt.r.max - szAtt.r.min;
			else
				szAttID = null;
		}
		if (cAttID) {
			oAtt = PData.getAttID(self.settings.order[tI]);
			order = PData.orderTBy(oAtt, stream, tI);
// console.log("Order for Template "+tI+": "+JSON.stringify(order));

			order.forEach(function(oRec) {
				rec = PData.getRecByIndex(oRec.i);
					// Apply Legend
				datum = rec.a[fAttID];
				if (typeof datum != 'undefined') {
					fData = PData.getAttLgndRecs(datum, fAtt, featSet, false);
					if (fData) {
						t = rec.a[cAttID];
						if (t)
							t = PData.procAttTxt(cAttID, t);
						if (t)
						{
							if (szAttID) {
								s = rec.a[szAttID];
								if (typeof s != 'undefined') {
									s = Math.floor(((s-szAtt.r.min)*dt)/da) + self.settings.min;
								} else
									s = self.settings.min;
							} else
								s = self.settings.min;
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


// ================================================================================
// VizStackChart: Class to visualize 2 dimensions of record data as a stacked chart

var VizStackChart = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);

	this.bSel=[];
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

	// PURPOSE: Set up SVG and D3 once cats has been created
VizStackChart.prototype.setup2 = function()
{
	var colW=0;
	this.cats.forEach(function(c) {
		colW=Math.max(colW, c.l.length);
	});
	colW=Math.max(D3FG_BAR_WIDTH, (colW*8)+4);
	this.colW = colW;

	var innerW = this.cats.length*colW;
	var innerH = this.settings.h;
	this.xScale = d3.scale.linear().domain([0, this.cats.length])
		.rangeRound([0, innerW]);
	this.yScale = d3.scale.linear().range([0, innerH-1]);

	this.rScale = d3.scale.ordinal().rangeRoundBands([0, innerW]);
	this.rScale.domain(this.cats.map(function(rc) { return rc.l; }));
	this.xAxis = d3.svg.axis().scale(this.rScale).orient("top");
	this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(10);

	this.svg = d3.select(this.frameID).append("svg")
		.attr("width", innerW+D3SC_MARGINS.left+D3SC_MARGINS.right)
		.attr("height", innerH+D3SC_MARGINS.top+D3SC_MARGINS.bottom);

	var chart = this.svg.append("g")
		.attr("class", "chart")
		.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")");

	this.svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")")
		.call(this.xAxis);
	this.svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate("+D3SC_MARGINS.left+","+D3SC_MARGINS.top+")");
		// .call(this.yAxis);
} // setup2()

VizStackChart.prototype.setup = function()
{
	var oAttID = this.settings.oAtt;
	var oAtt = PData.getAttID(oAttID);

	if (oAtt.def.t != 'T' || !this.settings.tlit) {
		if (this.settings.gr)
			this.cats = PData.getRCats(oAtt, true);
		else
			this.cats = PData.getLCats(oAtt, null);
		this.setup2();
	} else
		this.cats = null;
} // setup()

	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizStackChart.prototype.render = function(stream)
{
	var self = this;

	function clickEvent(d, bI)
	{
		var sz = self.bSel.length;
		var i = _.sortedIndex(self.bSel, bI);
		if (self.bSel[i] == bI) {
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
	var sAttID = this.settings.sAtt;

	this.svg.selectAll(".block").remove();

		// Pass 1 -- sort all Records into categories on X-Axis by oAtt
	if (this.cats == null) {
		this.cats = [];
		PData.fillCats(this.cats, oAttID, sAttID, stream, true);
		this.setup2();

	} else
		PData.fillCats(this.cats, oAttID, sAttID, stream, false);

	this.blocks=[];		// { x[rCat index], c[olor], y, h, a[Indices] }
	var sAtt = PData.getAttID(sAttID);
	var maxY=0, rec;
	var fSet = self.vFrame.getSelFeatAtts(0);
	var yCats = PData.getLCats(sAtt, fSet);

		// Pass 2 -- create Blocks by processing Records within a single Range Category by sAtt
	for (var rI=0; rI<this.cats.length; rI++) {
		if (rI > 0) { // clear previous entries
			for (var yi=0; yi<yCats.length; yi++)
				yCats[yi].i = [];
		}
		PData.sortCats(self.cats[rI].i, sAtt, yCats);

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
		u = _.union(u, self.blocks[bI].a);
	});

	return u;
} // isSel()

VizStackChart.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizStackChart.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()


// ===============================================================================
// VizNetWheel: Class to visualize connections between Records as Network on Wheel

var VizNetWheel = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);

	this.bSel=[];
} // VizNetWheel

VizNetWheel.prototype = Object.create(PVizModel.prototype);

VizNetWheel.prototype.constructor = VizNetWheel;

VizNetWheel.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizNetWheel.prototype.getFeatureAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.lgnds[tIndex];
	return this.settings.lgnds;
} // getFeatureAtts()

VizNetWheel.prototype.setup = function()
{
	var self=this;

	this.spin = 0;

	function rotate()
	{
		if (self.spin > 360)
			self.spin -= 360;
		else if (self.spin < 0)
			self.spin += 360;

		self.center
			.attr("transform", "translate(" + self.cr + "," + self.cr + ")rotate(" + self.spin + ")");

				// Failed experiments
			// .selectAll("g.node")
			// .attr("transform", function(d) { return "rotate(" + (((d.x-90) + self.spin) % 360) + ")translate(" + (d.y + 8) + ",0)"; })

			// .selectAll("text")
			// 	.attr("dx", function(d) { return ((d.x + self.spin) % 360) < 180 ? "10" : "-10"; })
			// 	.attr("transform", function(d) { ((d.x + self.spin) % 360) < 180 ? "" : "rotate(180)"; })
			// 	.style("text-anchor", function(d) { return ((d.x + self.spin) % 360) < 180 ? "start" : "end"; });
	} // rotate()

	var vi = this.vFrame.getIndex();
	var fh = _.template(document.getElementById('dltext-v-nwheel').innerHTML);
	jQuery('#view-frame-'+vi+' div.view-control-bar').append(fh({ vi: vi }));

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
VizNetWheel.prototype.render = function(stream)
{
	var self = this;
	var links=[], link;
	var nodes, node;

	function clickDot(d)
	{
		var s = self.toggleSel(d.ai);
		d3.select(this).classed('obj-sel', s);
	} // clickDot()

		// INPUT: 	nL = node entry bound to label
	function clickName(nL)
	{
		var lSelf=this;

		PState.set(PSTATE_UPDATE);

			// First clear out all variables
		node.each(function(n) { n.linked = false; });

			// Go through links, setting colors and flags
		link.each(function(l) {
				// Is this the source of a link?
			if (l.s === nL) {
				l.t.linked = true;
					// Search for corresponding entry in original array
				for (var lI=0; lI<links.length; lI++) {
					var lk = links[lI];
					if (lk.source === nL && lk.target === l.t) {
						d3.select(this).attr("stroke", lk.c)
							.classed("thick", true);
						break;
					}
				}
				// target of a link?
			} else if (l.t === nL) {
				l.s.linked = true;
					// Search for corresponding entry in original array
				for (var lI=0; lI<links.length; lI++) {
					var lk = links[lI];
					if (lk.target === nL && lk.source === l.s) {
						d3.select(this).attr("stroke", lk.c)
							.classed("thick", true);
						break;
					}
				}
			} else {
				d3.select(this).attr("stroke", "white")
							.classed("thick", false);
			}
		});

		node.select("text").attr("fill", function(n) { return n.linked ? "black" : "white"; });

		d3.select(lSelf).attr("fill", "red");

		PState.set(PSTATE_READY);
	} // clickName()

		// remove any existing nodes and links
	this.svg.selectAll(".node").remove();
	this.svg.selectAll(".link").remove();

	this.inc = 360/(stream.l+stream.t.length);

		// Compute inner radius based on circumference needed to show all labels
	var rad = Math.max((stream.l*14 + 20)/(Math.PI*2), 30);
	var lw = this.settings.lw;
	if (typeof lw == 'string')
		lw = parseInt(lw);

	this.cr = lw+12+rad;	// Radius to center

	var diam = this.cr*2;	// Accommodate dot and spacing

		// Set sizes and centers
	this.svg.attr("width", diam)
		.attr("height", diam);

	this.center.attr("transform", "translate(" + this.cr + "," + this.cr + ")");

	if (this.recSel.length > 0)
		this.recSel=[];

		// Create nested array of nodes for each Template { ti, children }
		// or Record { r[ecord], ai, children }

	var head = { children: [] };

	function createNodes()
	{
		var tRec, tI=0;
		var i=0, rec, datum, aI, clan=[];
		var featSet=null, fAtt, fAttID;

		tRec = stream.t[0];
		fAttID = self.vFrame.getSelLegend(0);
		fAtt = PData.getAttID(fAttID);
		featSet = self.vFrame.getSelFeatAtts(0);

		tLoop: while (i<stream.l) {
				// Advance until we get to current Template rec
			while (tRec.n == 0 || (tRec.i+tRec.n) == i || featSet.length == 0) {
				if (clan.length > 0) {
					head.children.push({ ti: tI, children: clan});
					clan=[];
				}
					// Have we run out of Templates?
				if (++tI == PData.getNumETmplts()) {
					break tLoop;
				}

				clan=[];
				tRec = stream.t[tI];
					// Which Attribute chosen for Legend?
				fAttID = self.vFrame.getSelLegend(tI);
				fAtt = PData.getAttID(fAttID);
				featSet = self.vFrame.getSelFeatAtts(tI);
			}

				// Get Record data
			aI = stream.s[i];
			rec = PData.getRecByIndex(aI);
			datum = rec.a[fAttID];
			if (typeof datum != 'undefined') {
				fData = PData.getAttLgndRecs(datum, fAtt, featSet, false);
				if (fData)
					clan.push({ r: rec, ai: aI, c: fData.v, children: [] });
			}

			i++;
		} // while
		if (clan.length > 0) {
			head.children.push({ ti: tI, children: clan});
		}
	} // createNodes()
	createNodes();

	var cluster = d3.layout.cluster()
		.size([360, rad])
		.sort(null);

	nodes = cluster.nodes(head);

	node = this.center.append("g").selectAll(".node")
		.data(nodes.filter(function(n) { return !n.children; }))    // Only showing leaf nodes
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)"; });

	node.append("circle")
			.attr("r", "5")
			.style("fill", function(n) { return n.c; })
			.on("click", clickDot);

	node.append("text")
			.attr("dy", ".31em")
			.attr("dx", function(d) { return d.x < 180 ? "10" : "-10"; })
			.attr("transform", function(d) { return d.x < 180 ? "" : "rotate(180)"; })
			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.attr("fill", "white")
			.text(function(d) { return d.r.l; })
			.on("click", clickName);

	var bundle = d3.layout.bundle();

	var line = d3.svg.line.radial()
		.interpolate("bundle")
		.tension(.85)
		.radius(function(d) { return d.y; })
		.angle(function(d) { return d.x / 180 * Math.PI; });

		// Compile links between nodes
		//  { source, target, c[olor] }
	head.children.forEach(function(theT) {
		var pAtts = self.settings.pAtts[theT.ti];
		var q;
		theT.children.forEach(function(d) {
			pAtts.forEach(function(p) {
				q = d.r.a[p.pid];
				if (typeof q != 'undefined') {
						// Array of Rec IDs -- must find each one in head.children.children!
					q.forEach(function(rID) {
						var found=false, r2;
						tLoop: for (var tI=0; tI<head.children.length; tI++) {
							var tRecs = head.children[tI];
								// TO DO: binary search!
							for (var rI=0; rI<tRecs.children.length; rI++) {
								r2 = tRecs.children[rI];
								if (r2.r.id == rID) {
									found=true;
									break tLoop;
								}
							}
						}
						if (found)
							links.push({ source: d, target: r2, c: p.clr});
					}); // for Pointer values
				}
			}); // for Pointer entries
		}); // for Records in Template
	}); // for Templates

	link = this.center.append("g").selectAll(".link")
		.data(bundle(links))
		.enter().append("path")
    	.each(function(d) { d.s = d[0], d.t = d[d.length - 1]; })
		.attr("class", "link")
		.attr("d", line)
		.attr("stroke", "white");
} // render()

VizNetWheel.prototype.teardown = function()
{
	var vi = this.vFrame.getIndex();
	jQuery('#view-frame-'+vi+' div.view-control-bar div.iconbar').remove();
} // teardown()

VizNetWheel.prototype.setSel = function(absIArray)
{
	var self=this;

	self.recSel = absIArray;
	this.svg.selectAll(".node circle")
			.attr("class", function(d) { return self.isSel(d.ai) ? 'obj-sel' : '' });
} // setSel()

VizNetWheel.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
			// Only zoom band events are selected
		this.svg.selectAll(".node circle")
				.attr("class", '');
	}
} // clearSel()

VizNetWheel.prototype.getState = function()
{
	return { l: this.vFrame.getLgndSels() };
} // getState()

VizNetWheel.prototype.setState = function(state)
{
	this.vFrame.setLgndSels(state.l);
} // setState()


// ====================================================================
// PFilterModel: An abstract class to be subclassed by specific filters

	// INPUT: 	id = unique ID for this filter (0 = selector filter)
	//			attRec = pointer to complete Attribute or Facet Browser settings
	// ASSUMES: required is true by default
function PFilterModel(id, attRec)
{
	this.id 		= id;
	this.att 		= attRec;

	this.dirty 		= true;

		// Sublcasses can override the following:
	// this.title()
	// this.teardown()
		// All subclasses must implement the following:
	// this.setUp()
	// this.evalPrep()
	// this.eval(rec)
	// this.getState()
	// this.setState(data)
} // PFilterModel

	// PURPOSE: Either set or get dirty state of Filter
	// RETURNS: true if filter is "dirty" (has been changed and thus forces recompute)
	// INPUT:   null if only retrieving state, else true or false
PFilterModel.prototype.isDirty = function(setDirty)
{
	if (setDirty != null) {
		if (!this.dirty && setDirty && this.id > 0)
			jQuery('#btn-recompute').addClass('pulse');
		this.dirty = setDirty;
	}
	return this.dirty;
} // isDirty

	// PURPOSE: Return title for filter component
	// NOTES: 	Handles default case of Attribute label
PFilterModel.prototype.title = function()
{
	return this.att.def.l;
} // title()

	// PURPOSE: Return jQuery result for contents of this filter
PFilterModel.prototype.insertPt = function()
{
	return jQuery('div.filter-instance[data-id="'+this.id+'"] div.filter-body');
} // insertPt()

PFilterModel.prototype.teardown = function()
{
} // teardown()

// ============================================
// PFilterText: Class to filter Text Attributes

var PFilterText = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterText()

PFilterText.prototype = Object.create(PFilterModel.prototype);

PFilterText.prototype.constructor = PFilterText;

PFilterText.prototype.evalPrep = function()
{
	this.fStr = this.insertPt().find('input.filter-text').val();
} // evalPrep()

PFilterText.prototype.eval = function(rec)
{
	var s = this.fStr;

	if (s == null || s == '')
		return true;

	var t = rec.a[this.att.id];
	if (typeof t == 'undefined')
		return false;
	return t.indexOf(s) != -1;
} // eval()

PFilterText.prototype.setup = function()
{
	var self = this;
	var inserted = this.insertPt();
	// var htmlText = jQuery('#dltext-filter-text').html().trim();
	var htmlText = document.getElementById('dltext-filter-text').innerHTML;

	inserted.append(htmlText);
		// Intercept changes to text
	inserted.find('input.filter-text').change(function() {
		self.isDirty(true);
	});
} // setup()

PFilterText.prototype.getState = function()
{
	return { t: this.insertPt().find('input.filter-text').val() };
} // getState()

PFilterText.prototype.setState = function(state)
{
	this.insertPt().find('input.filter-text').val(state.t);
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
		self.sel.push(attID);
	});
	self.sel.sort();
} // evalPrep()

PFilterVocab.prototype.eval = function(rec)
{
	if (this.sel.length == 0)
		return false;
	var v = rec.a[this.att.id];
	if (typeof v == 'undefined')
		return false;
		// Try all possible Attribute values
	var s, vi;
	for (var i=0; i<v.length; i++) {
		vi = v[i];
		s = _.sortedIndex(this.sel, vi);
		if (this.sel[s] == vi)
			return true;
	}
	return false;
} // eval()

PFilterVocab.prototype.setup = function()
{
	var self = this;
	var t = '<div class="filter-vocab-container">';
	this.att.l.forEach(function(lEntry, lI) {
		t += '<div class="filter-vocab-entry" data-index="'+lI+'"><div class="filter-vocab-row" data-id="'+
				lEntry.l+'">'+'<input type="checkbox" value="min-use" checked="checked">'+
				lEntry.l+'</div><div class="filter-vocab-bar" style="background-color:'+lEntry.v+'"></div>';
		lEntry.z.forEach(function(zEntry, zI) {
			t += '<div class="filter-vocab-row" data-id="'+zEntry.l+'"><input type="checkbox" value="min-use" checked="checked">'+
				zEntry.l+'</div>';
			if (zEntry.v == null || zEntry.v == '') {
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
		if (event.target.nodeName == 'INPUT')
			self.isDirty(true);
	});
} // setup()

PFilterVocab.prototype.getState = function()
{
	var s=[];
	var v = this.insertPt().find('div.filter-vocab-row input:checked');
	v.each(function() {
		var attID = jQuery(this).parent().data('id');
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
		j.find('input').prop("checked", c != -1);
	});
} // setState()


// ================================================
// PFilterNum: Class to filter Number Attributes

var PFilterNum = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterNum()

PFilterNum.prototype = Object.create(PFilterModel.prototype);

PFilterNum.prototype.constructor = PFilterNum;

	// ASSUMES: Code handling brush has set min & max
PFilterNum.prototype.evalPrep = function()
{
	if (this.rCats == null) {
		var dom = this.insertPt();
		this.min = parseInt(dom.find('input.filter-num-min-val').val());
		this.max = parseInt(dom.find('input.filter-num-max-val').val());
		this.useMin = dom.find('input.filter-num-min-use').is(':checked');
		this.useMax = dom.find('input.filter-num-max-use').is(':checked');
	}
} // evalPrep()

PFilterNum.prototype.eval = function(rec)
{
	var num = rec.a[this.att.id];
	if (typeof num == 'undefined')
		return false;

	if (this.useMin && num < this.min)
		return false;
	if (this.rCats == null) {
		if (this.useMax && num > this.max)
			return false;
	} else {
		if (num >= this.max)
			return false;
	}
	return true;
} // eval()

PFilterNum.prototype.setup = function()
{
	var self = this;
	var insert = this.insertPt();

	this.rCats = PData.getRCats(this.att, false);

		// Lack of range bounds? Create generic HTML input boxes, can't create range sliders
	if (this.rCats == null) {
		var fh = _.template(document.getElementById('dltext-filter-num-boxes').innerHTML);
		var min = (typeof this.att.r.min == 'undefined') ? 0 : this.att.r.min;
		var max = (typeof this.att.r.max == 'undefined') ? min+100 : this.att.r.max;
		insert.append(fh({ min: min, max: max }));

		insert.click(function(event) {
			if (event.target.nodeName == 'INPUT') {
				self.isDirty(true);
			}
		});

			// Intercept changes to min & max checkboxes
		// insert.find('.filter-num-min-use').change(function() {
		// 	self.isDirty(true);
		// });
		// insert.find('.filter-num-max-use').change(function() {
		// 	self.isDirty(true);
		// });

		insert.find('input.filter-num-min-val').change(function() {
				// Ensure it is less than max
			var newMin = jQuery(this).val();
			var curMax = insert.find('input.filter-num-max-val').val();
			if (newMin <= curMax) {
				self.isDirty(true);
			} else {
				jQuery(this).val(curMax);
			}
		});
		insert.find('input.filter-num-max-val').change(function() {
				// Ensure it is greater than min
			var newMax = jQuery(this).val();
			var curMin = insert.find('input.filter-num-min-val').val();
			if (newMax >= curMin) {
				self.isDirty(true);
			} else {
				jQuery(this).val(curMin);
			}
		});

		// Create range category viz & slider
	} else {
			// Set defaults
		this.useMin = this.useMax = true;
		this.min = this.rCats[0].min;
		this.max = this.rCats[this.rCats.length-1].max;

		var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;

		function resizePath(d)
		{
			// Create SVG path for brush resize handles
			var e = +(d == "e"),
				x = e ? 1 : -1,
				y = innerH / 4; // Relative positon if handles
			return "M"+(.5*x)+","+y+"A6,6 0 0 "+e+" "+(6.5*x)+","+(y+6)
				+"V"+(2*y-6)+"A6,6 0 0 "+e+" "+(.5*x)+","+(2*y)
				+"Z"+"M"+(2.5*x)+","+(y+8)+"V"+(2*y-8)
				+"M"+(4.5*x)+","+(y+8)
				+"V"+(2*y-8);
		} // resizePath()
		function brushended()
		{
				// Ignore unless user event
			if (!d3.event.sourceEvent)
				return;
			var extent0 = self.brush.extent();
			var extent1 = [Math.floor(extent0[0]), Math.floor(extent0[1])];
				// if empty when rounded, use floor & ceil instead
			if (extent1[0] >= extent1[1]) {
				extent1[0] = Math.floor(extent0[0]);
				extent1[1] = Math.ceil(extent0[1]);
			}
				// must enclose at least 1 graph!
			extent1[1] = Math.max(extent1[1], extent1[0]+1);
			d3.select(this).transition()
				.call(self.brush.extent(extent1));

			self.min = self.rCats[extent1[0]].min;
			self.max = self.rCats[extent1[1]-1].max;
			self.isDirty(true);
		} // brushended()

		var colW=0;
		this.rCats.forEach(function(c) {
			colW=Math.max(colW, c.l.length);
		});
		colW=Math.max(D3FG_BAR_WIDTH, colW*8);

		var innerW = this.rCats.length*colW;
		var xScale = d3.scale.linear().domain([0, this.rCats.length])
			.rangeRound([0, innerW]);
		var yScale = d3.scale.linear().domain([0,100]).range([innerH, 0]);

		var rScale = d3.scale.ordinal().rangeRoundBands([0, innerW]);
		rScale.domain(this.rCats.map(function(rc) { return rc.l; }));
		var xAxis = d3.svg.axis().scale(rScale).orient("bottom");
		var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);

		var chart = d3.select(insert.get(0)).append("svg")
			.attr("width", innerW+D3FG_MARGINS.left+D3FG_MARGINS.right)
			.attr("height", innerH+D3FG_MARGINS.top+D3FG_MARGINS.bottom)
			.append("g")
			.attr("transform", "translate("+D3FG_MARGINS.left+","+D3FG_MARGINS.top+")");

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

		self.brush = d3.svg.brush()
			.x(xScale)
			.extent([0, this.rCats.length])
			.on("brushend", brushended);

		self.brushg = chart.append("g");
		self.brushg.attr("class", "brush")
			.call(self.brush);
		self.brushg.selectAll("rect")
			.attr("y", 0)
			.attr("height", innerH);
		self.brushg.selectAll(".resize")
			.append("path")
			.attr("d", resizePath);
	}
} // setup()

PFilterNum.prototype.getState = function()
{
	if (this.rCats == null) {
		var dom = this.insertPt();
		var min = parseInt(dom.find('input.filter-num-min-val').val());
		var max = parseInt(dom.find('input.filter-num-max-val').val());
		var useMin = dom.find('input.filter-num-min-use').is(':checked');
		var useMax = dom.find('input.filter-num-max-use').is(':checked');
		return { rc: false, min: min, max: max, useMin: useMin, useMax: useMax };
	} else {
		var e = this.brush.extent();
		return { rc: true, e0: e[0], e1: e[1] };
	}
} // getState()

PFilterNum.prototype.setState = function(state)
{
	if (state.rc) {
		this.min = this.rCats[state.e0].min;
		this.max = this.rCats[state.e1-1].max;
		this.brush.extent([state.e0, state.e1]);
		this.brushg.call(this.brush);
	} else {
		var dom = this.insertPt();
		dom.find('input.filter-num-min-val').val(state.min);
		dom.find('input.filter-num-max-val').val(state.max);
		dom.find('input.filter-num-min-use').prop('checked', state.useMin);
		dom.find('input.filter-num-max-use').prop('checked', state.useMax);
	}
} // setState()


// ==============================================
// PFilterDates: Class to filter Dates Attributes

var PFilterDates = function(id, attRec, req)
{
	PFilterModel.call(this, id, attRec, req);
} // PFilterDates()

PFilterDates.prototype = Object.create(PFilterModel.prototype);

PFilterDates.prototype.constructor = PFilterDates;

PFilterDates.prototype.evalPrep = function()
{
	this.c = jQuery('input[name=dctrl-'+this.id+']:checked').val();
} // evalPrep()

	// ASSUMES: Brush code in setup sets min & max
PFilterDates.prototype.eval = function(rec)
{
	function makeDate(y, m, d, field) {
		if (typeof field.m != 'undefined') {
			m = field.m;
			if (typeof field.d != 'undefined') {
				d = field.d;
			}
		}
		return PData.date3Nums(y, m, d);
	} // makeDate()

	var d = rec.a[this.att.id];
	if (typeof d == 'undefined')
		return false;

		// Is it a single event?
	if (typeof d.max == 'undefined') {
		var c = makeDate(d.min.y, 1, 1, d.min);
		return (this.min <= c) && (c < this.max);
	} else {
		var s = makeDate(d.min.y, 1, 1, d.min);
		var e;
		if (d.max == 'open')
			e = TODAY;
		else
			e = makeDate(d.max.y, 12, 31, d.max);

			// Overlap?
		if (this.c == 'o') {
			if (e < this.min || s >= this.max)
				return false;
			return true;
		} else {
			return (this.min <= s) && (e <= this.max);
		}
	}
} // eval()

PFilterDates.prototype.setup = function()
{
	var self = this;

	this.rCats = PData.getRCats(this.att, false);
		// Set defaults
	this.min = this.rCats[0].min;
	this.max = this.rCats[this.rCats.length-1].max;

	var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;

	function resizePath(d)
	{
		// Create SVG path for brush resize handles
		var e = +(d == "e"),
			x = e ? 1 : -1,
			y = innerH / 4; // Relative positon if handles
		return "M"+(.5*x)+","+y+"A6,6 0 0 "+e+" "+(6.5*x)+","+(y+6)
			+"V"+(2*y-6)+"A6,6 0 0 "+e+" "+(.5*x)+","+(2*y)
			+"Z"+"M"+(2.5*x)+","+(y+8)+"V"+(2*y-8)
			+"M"+(4.5*x)+","+(y+8)
			+"V"+(2*y-8);
	} // resizePath()
	function brushended()
	{
			// Ignore unless user event
		if (!d3.event.sourceEvent)
			return;
		var extent0 = self.brush.extent();
		var extent1 = [Math.floor(extent0[0]), Math.floor(extent0[1])];
			// if empty when rounded, use floor & ceil instead
		if (extent1[0] >= extent1[1]) {
			extent1[0] = Math.floor(extent0[0]);
			extent1[1] = Math.ceil(extent0[1]);
		}
			// must enclose at least 1 graph!
		extent1[1] = Math.max(extent1[1], extent1[0]+1);
		d3.select(this).transition()
			.call(self.brush.extent(extent1));

		self.min = self.rCats[extent1[0]].min;
		self.max = self.rCats[extent1[1]-1].max;
		self.isDirty(true);
	} // brushended()


	var colW=0;
	this.rCats.forEach(function(c) {
		colW=Math.max(colW, c.l.length);
	});
	colW=Math.max(D3FG_BAR_WIDTH, colW*8);

	var innerW = this.rCats.length*colW;
	var xScale = d3.scale.linear().domain([0, this.rCats.length])
		.rangeRound([0, innerW]);
	var yScale = d3.scale.linear().domain([0,100]).range([innerH, 0]);

	var rScale = d3.scale.ordinal().rangeRoundBands([0, innerW]);
	rScale.domain(this.rCats.map(function(rc) { return rc.l; }));
	var xAxis = d3.svg.axis().scale(rScale).orient("bottom");
	var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);

	var insert = this.insertPt();

	var fh = _.template(document.getElementById('dltext-filter-date-ctrl').innerHTML);
	insert.append(fh({ id: this.id }));
	insert.find("input[name=dctrl-"+self.id+"]").change(function() {
		self.isDirty(true);
	});

	var chart = d3.select(insert.get(0)).append("svg")
		.attr("width", innerW+D3FG_MARGINS.left+D3FG_MARGINS.right)
		.attr("height", innerH+D3FG_MARGINS.top+D3FG_MARGINS.bottom)
		.append("g")
		.attr("transform", "translate("+D3FG_MARGINS.left+","+D3FG_MARGINS.top+")");

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

	self.brush = d3.svg.brush()
		.x(xScale)
		.extent([0, this.rCats.length])
		.on("brushend", brushended);

	self.brushg = chart.append("g");
	self.brushg.attr("class", "brush")
		.call(self.brush);
	self.brushg.selectAll("rect")
		.attr("y", 0)
		.attr("height", innerH);
	self.brushg.selectAll(".resize")
		.append("path")
		.attr("d", resizePath);
} // setup()

PFilterDates.prototype.getState = function()
{
	var e = this.brush.extent();
	var c = jQuery('input[name=dctrl-'+this.id+']:checked').val();
	return { e0: e[0], e1: e[1], c: c };
} // getState()

PFilterDates.prototype.setState = function(state)
{
	jQuery('input[name="dctrl-'+this.id+'"]').val([state.c]);
	this.min = this.rCats[state.e0].min;
	this.max = this.rCats[state.e1-1].max;
	this.brush.extent([state.e0, state.e1]);
	this.brushg.call(this.brush);
} // setState()


// ========================================================================
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)

// INPUT: 	vfIndex = index for this visualization frame (0 or 1)

function PViewFrame(vfIndex)
{
	var instance = { };			// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var vizSelIndex = 0;		// index of currently selected Viz
	var vizModel = null;		// PVizModel currently in frame
	var legendIDs = [];			// Attribute IDs of Legend selections (one per Template)
	var datastream = null;		// pointer to datastream given to view

	// PRIVATE FUNCTIONS
	//==================

		// PURPOSE: Return ID of Frame's outermost DIV container
	function getFrameID()
	{
		return '#view-frame-'+vfIndex;
	} // getFrameID()


	function selectChangeViz(event)
	{
		var selector = jQuery(getFrameID()+' div.view-control-bar select.view-viz-select option:selected');
		var newSelIndex   = selector.val();
		PState.set(PSTATE_BUILD);
		createViz(newSelIndex, true);
		PState.set(PSTATE_READY)
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		if (vizModel.flags() & V_FLAG_LGND) {
			jQuery(getFrameID()+' div.lgnd-container').toggle('slide', {direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()


		// PURPOSE: Open Selection Inspector for current selection
	function clickOpenSelection(event)
	{
		var container = jQuery('#inspect-content');
		var avAttID=null;	// ID of any A/V widget or null
		var avType=0;		// 0=none, 1=SoundCloud, 2=YouTube
		var t2URL;			// URL for transcript 2 or null

			// PURPOSE: Convert timecode string into # of milliseconds
			// INPUT:   timecode must be in format [HH:MM:SS] or [HH:MM:SS.ss]
			// ASSUMES: timecode in correct format, parseTC contains compiled RegEx
		function tcToMilliSecs(tc)
		{
			var milliSecs = new Number();
			var match = parseTC.exec(tc);
			if (match !== null) {
				// console.log("Parsed " + match[1] + ":" + match[2] + ":" + match[3]);
				milliSecs = (parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3])) * 1000;
					// The multiplier to use for last digits depends on if it is 1 or 2 digits long
				if (match[4].length == 1) {
					milliSecs += parseInt(match[4])*100;
				} else {
					milliSecs += parseInt(match[4])*10;
				}
			} else {
				reportError(false, "Error in transcript file: Cannot parse " + tc + " as timecode.");
				throw new Error("Error in transcript file: Cannot parse " + tc + " as timecode.");
				milliSecs = 0;
			}
			return milliSecs;
		} // tcToMilliSecs()

			// PURPOSE: Format the second transcript (use first one's timecodes)
		function formatXscript2(text, xtbl)
		{
			var splitXcript = new String(text);
			if (widgetData.extract) {
				var tc1 = splitXcript.indexOf(widgetData.extract[0]);
				if (tc1 == -1) {
					throw new Error("Transcript2 excerpt error: Cannot find timestamp "+widgetData.extract[0]);
					return;
				}
				var tc2 = splitXcript.indexOf(widgetData.extract[1]);
				if (tc2 == -1) {
					throw new Error("Transcript2 excerpt error: Cannot find timestamp "+widgetData.extract[1]);
					return;
				}
				splitXcript = splitXcript.substring(tc1-1, tc2-1);
			}
			splitXcript = splitXcript.trim().split(/\r\n|\r|\n/g);

			var ta = [];

			if (splitXcript) {
				var tb;
				var ti = 0;
				_.each(splitXcript, function(val) {
						// Skip values with line breaks...basically empty items
					val = val.trim();
					if (val.length>0) {
						if (val.charAt(0) === '[') {
							if (ti>0) {
								ta.push(tb);
							}
							tb='';
						} else {
							tb += val;
						}
						ti++;
					}
				});
			}

				// Loop thru HTML for left-side transcript and add right-side text
			 _.each(ta, function(val, ti) {
				xtbl.find('div.timecode[data-tcindex="'+ti+'"]').next().after('<div class="xscript">'+val+'</div>');
			 });
		} // formatXscript2()

			// PURPOSE: Format the first transcript (with its timecodes)
		function formatXscript1(text)
		{
				// empty time code array -- each entry has start & end
			widgetData.tcArray = [];
			widgetData.tcIndex = -1;
			var tcs = widgetData.tcArray;

				// split transcript text into array by line breaks
			var splitXcript = new String(text);
			if (widgetData.extract) {
				var tc1 = splitXcript.indexOf(widgetData.extract[0]);
				if (tc1 == -1) {
					throw new Error("Transcript excerpt error: Cannot find timestamp "+widgetData.extract[0]);
					return;
				}
				var tc2 = splitXcript.indexOf(widgetData.extract[1]);
				if (tc2 == -1) {
					throw new Error("Transcript excerpt error: Cannot find timestamp "+widgetData.extract[1]);
					return;
				}
				splitXcript = splitXcript.substring(tc1-1, tc2-1);
			}
			splitXcript = splitXcript.trim().split(/\r\n|\r|\n/g);

			if (splitXcript) {
				var tcI = 0;
				var timeCode, lastCode=0, lastStamp=0;
				var tb='';		// Text block being built
				var xtbl = jQuery('#xscript-tbl');
				_.each(splitXcript, function(val) {
						// Each entry is (1) empty/line break, (2) timestamp, or (3) text
					val = val.trim();
						// Skip empty entries, which were line breaks
					if (val.length>1) {
							// Encountered timestamp -- compile previous material, if any
						if (val.charAt(0) === '[' && (val.charAt(1) >= '0' && val.charAt(1) <= '9'))
						{
							timeCode = tcToMilliSecs(val);
							if (tb.length > 0) {
									// Append timecode entry once range is defined
								if (lastStamp) {
									tcs.push({ s: lastCode, e: timeCode });
								}
								xtbl.append('<div class="row"><div class="timecode" data-timecode="'+
									lastCode+'" data-tcindex="'+tcI++ +'">'+lastStamp+'</div><div class="xscript">'+tb+'</div></div>');
								tb = '';
							}
							lastStamp = val;
							lastCode = timeCode;

							// Encountered textblock
						} else {
							tb += val;
						}
					} // if length
				}); // _each
					// Handle any dangling text
				if (tb.length > 0) {
						// Append very large number to ensure can't go past last item! 9 hours * 60 minutes * 60 seconds * 1000 milliseconds
					tcs.push({ s: lastCode, e: 32400000 });
					xtbl.append('<div class="row"><div class="timecode" data-timecode="'+
						lastCode+'" data-tcindex="'+tcI+'">'+lastStamp+'</div><div class="xscript">'+tb+'</div></div>');
				}
					// Is there is a 2nd transcript? Load it
				if (typeof t2URL != 'undefined' && t2URL != null) {
						// Load and parse transcript file
					var xhr = new XMLHttpRequest();
					xhr.onload = function(e) {
						formatXscript2(xhr.responseText, xtbl);
					}
					xhr.open('GET', t2URL, true);
					xhr.send();
				}
			} // if (split)
		} // formatXscript1()

			// PURPOSE: Update the timecode playhead if changed from last update
		function highlightXscript(ms)
		{
			var match;
			var oldI = widgetData.tcIndex;

			_.find(widgetData.tcArray, function(tc, tcI) {
				match = (tc.s <= ms && ms < tc.e);
				if (match && tcI != oldI) {
						// Should we synchronize audio and text transcript?
					var xt = jQuery('#xscript-tbl');
					if (document.getElementById("sync-xscript").checked) {
						var tsEntry = xt.find('[data-tcindex="'+tcI+'"]');
						var topDiff = tsEntry.offset().top - xt.offset().top;
						var scrollPos = xt.scrollTop() + topDiff;
						xt.animate({ scrollTop: scrollPos }, 300);
					}
					if (oldI != -1)
						xt.find('[data-tcindex="'+oldI+'"]').removeClass('current');
					xt.find('[data-tcindex="'+tcI+'"]').addClass('current');
					widgetData.tcIndex = tcI;
				}
				return match;
			});
		} // highlightXscript()

			// PURPOSE: Called by global function once YouTube API loaded
		function ytActivate()
		{
			function ytStateChange(event)
			{
				var curPos;

				switch (event.data) {
				case 1: // YT.PlayerState.PLAYING
					widgetData.playing = true;
					if (widgetData.timer == null) {
							// YouTube playback heartbeat
						widgetData.timer = setInterval(function() {
								// Need to convert to milliseconds
							curPos = widgetData.widget.getCurrentTime() * 1000;
								// Keep within bounds of excerpt is done automatically by cue function
								// If there is a transcript, highlight current section
							if (widgetData.playing) {
								highlightXscript(curPos);
							}
						}, 300);    // .3 second heartbeat
					}
					break;
				case 0: // YT.PlayerState.ENDED
				case 2: // YT.PlayerState.PAUSED
					widgetData.playing = false;
					window.clearInterval(widgetData.timer);
					widgetData.timer = null;
					break;
				case 3: // YT.PlayerState.BUFFERING
				case 5: // YT.PlayerState.CUED
					widgetData.playing = false;
					break;
				} // switch event
			} // ytStateChange()

			widgetData.widget = new YT.Player('yt-widget', {
				width: '426', height: '240',
				videoId: widgetData.ytCode,
				events: {
					onError: function(event) { console.log("YouTube Error: "+event.data); },
					onStateChange: ytStateChange,
					onReady: function() {
							// If this is to play an excerpt, specify time bounds now (in seconds)
						if (widgetData.extract) {
							widgetData.widget.cueVideoById(
								{   videoId: widgetData.ytCode,
									startSeconds: (widgetData.sTime/1000),
									endSeconds: (widgetData.eTime/1000)
								});
						}
					}
				}
			});
		} // ytActivate()

		var recSel=null;

		if (vizModel)
			recSel = vizModel.getSel();
		if (recSel == null || recSel.length == 0)
			return;

		var inspector;
		var rec;
		var i=0;		// Index of item to show in Inspector from selection

		function inspectShow()
		{
			var recAbsI = recSel[i];
			rec = PData.getRecByIndex(recAbsI);
			var title = ' '+rec.l+' ('+(i+1)+'/'+recSel.length+') ';
			jQuery('#inspect-name').text(title);
				// Which template type?
			var tI = PData.aIndex2Tmplt(recAbsI);

				// PURPOSE: Return start and end times for extract if any
				// ASSUMES: Any timecode given contains both start and end separated by "-"
			function getSETimes()
			{
				widgetData.sTime = widgetData.eTime = null;
				var tcAttID;
				if (tcAttID = prspdata.e.i.t.tcAtts[tI])
				{
					var tcAttVal = rec.a[tcAttID];

					if (tcAttVal && tcAttVal != '')
					{
						var tcs = tcAttVal.split('-');
						widgetData.extract = tcs;
						widgetData.sTime = tcToMilliSecs(tcs[0]);
						widgetData.eTime = tcToMilliSecs(tcs[1]);
					}
				}
			} // getSETimes()

				// Show all Attribute content data
			container.empty();
			prspdata.e.i.modal.atts[tI].forEach(function(attID) {
				var attVal = PData.getRecAtt(recAbsI, attID, false);
				if (attVal) {
					var theAtt = PData.getAttID(attID);
					var html = '<div><span class="att-label">'+theAtt.def.l+':</span> '+attVal+'</div>';
					container.append(html);
				}
			});
				// Handle Inspector widgets
			avAttID=null; avType=0;
			widgetData.extract=null;
			widgetData.xscriptOn=false;
			widgetData.playing=false;

				// Show audio or video widget? (Not both)
			if (prspdata.e.i.modal.scOn) {
				if (avAttID = prspdata.e.i.sc.atts[tI]) {
					var scAttVal;
					if (scAttVal = rec.a[avAttID]) {
						var primeAudio=true;
						getSETimes();

						avType=1;
						container.append('<iframe id="sc-widget" class="player" width="100%" height="150" src="http://w.soundcloud.com/player/?url='+
							scAttVal+'"></iframe></p>');

							// Must set these variables after HTML appended above
						var playWidget = SC.Widget(document.getElementById('sc-widget'));
						widgetData.widget = playWidget;
							// Setup SoundCloud player after entire sound clip loaded
						playWidget.bind(SC.Widget.Events.READY, function() {
								// Prime the audio -- must initially play (seekTo won't work until sound loaded and playing)
							playWidget.play();
							playWidget.bind(SC.Widget.Events.PLAY, function() {
								widgetData.playing = true;
							});
							playWidget.bind(SC.Widget.Events.PAUSE, function() {
								widgetData.playing = false;
							});
							playWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(params) {
									// Pauses audio after it primes so seekTo will work properly
								if (primeAudio) {
									playWidget.pause();
									primeAudio = false;
									widgetData.playing = false;
								}
									// Keep within bounds if only excerpt of longer transcript
								if (widgetData.extract) {
									if (params.currentPosition < widgetData.sTime) {
										playWidget.seekTo(widgetData.sTime);
									} else if (params.currentPosition > widgetData.eTime) {
										playWidget.pause();
										widgetData.playing = false;
									}
								}
								if (widgetData.playing && widgetData.xscriptOn) {
									highlightXscript(params.currentPosition);
								}
							});
								// Can't seek within the SEEK event because it causes infinite recursion
							playWidget.bind(SC.Widget.Events.FINISH, function() {
								widgetData.playing = false;
							});
						});
					}
				} // if avAttID
			} // if scOn

			if (avType == 0 && prspdata.e.i.modal.ytOn) {
				if (avAttID = prspdata.e.i.yt.atts[tI]) {
					var ytAttVal = rec.a[avAttID];
					if (ytAttVal) {
						getSETimes();
						widgetData.ytCode = ytAttVal;

						container.append('<div id="yt-widget"></div>');

							// YouTube API is only loaded once but must handle race condition:
							//	Inspector modal can be closed before video fully loaded
						widgetData.ytCall = ytActivate;
						if (!widgetData.ytLoaded) {
							widgetData.ytLoaded = true;

								// Create a script DIV that will cause API to be loaded
							var tag = document.createElement('script');
							tag.src = "https://www.youtube.com/iframe_api";
							var scriptTag = document.getElementsByTagName('script')[0];
							scriptTag.parentNode.insertBefore(tag, scriptTag);
								// wait for hook invocation to set playWidget and bind handlers
						} else
							ytActivate();

						avType=2;
					}
				} // if avAttID
			} // if ytOn

				// Create transcription widget?
			if (prspdata.e.i.modal.tOn) {
				var t1AttID = prspdata.e.i.t.t1Atts[tI];
					// Is there a 1st transcript Attribute?
				if (t1AttID && t1AttID !== '' && t1AttID != 'disable') {
					var t1URL = rec.a[t1AttID];
					if (t1URL) {
							// Add synchronize button if both A/V and Transcript
						if (avType > 0) {
							container.append('<div>'+document.getElementById('dltext-sync-xscript').innerHTML+'</div>');
						}
						container.append('<div id="xscript-tbl"><div>');
						widgetData.xscriptOn=true;

							// Handle clicks on timecodes
						jQuery('#xscript-tbl').click(function(evt) {
							if (avType && jQuery(evt.target).hasClass('timecode')) {
								var seekTo = jQuery(evt.target).data('timecode');

									// seekTo doesn't work unless sound is already playing
								switch (avType) {
								case 1:
									if (!widgetData.playing) {
										widgetData.playing = true;
										widgetData.widget.play();
									}
									widgetData.widget.seekTo(seekTo);
									break;
								case 2:
									if (!widgetData.playing) {
										widgetData.playing = true;
										widgetData.widget.playVideo();
									}
										// YouTube player takes seconds (rather than milliseconds)
									widgetData.widget.seekTo(seekTo/1000);
									break;
								}
							}
						});

							// Is there a 2nd transcript Attribute?
							// Set up for 1st to load when complete
						t2URL=null;
						var t2AttID = prspdata.e.i.t.t2Atts[tI];
						if (t2AttID && t2AttID !== '' && t2AttID != 'disable') {
							t2URL = rec.a[t2AttID];
						}
							// Load and parse transcript file
						var xhr = new XMLHttpRequest();
						xhr.onload = function(e) {
							formatXscript1(xhr.responseText);
						}
						xhr.open('GET', t1URL, true);
						xhr.send();
					} // t1URL
				} // if t1AttID
			} // if tOn
		} // inspectShow()

		function inspectSlide(diff)
		{
			var newI = i+diff;
			if (newI == -1)
				newI = recSel.length-1;
			else if (newI == recSel.length)
				newI = 0;

			if (newI != i) {
				i = newI;
				inspectShow();
			}
		} // inspectSlide()

		function inspectLeft(event)
		{
			inspectSlide(-1);
		}
		function inspectRight(event)
		{
			inspectSlide(1);
		}

			// Show first item & handle scroll buttons
		inspectShow();
		jQuery('#btn-inspect-left').click(inspectLeft);
		jQuery('#btn-inspect-right').click(inspectRight);

			// Set default size -- increase according to widget settings
		var w=450;
		var h=400;

		if (prspdata.e.i.modal.scOn)
		{
			w=550;
		} // if SoundCloud

		if (prspdata.e.i.modal.ytOn)
		{
			w=Math.max(w,460);
			h=500;
		} // if YouTube

		if (prspdata.e.i.tOn)
		{
			// w=650;
			h+=100;
			if (prspdata.e.i.t2On)
				w=750;
			else
				w=Math.max(w,500);
		} // if Transcriptions

		inspector = jQuery("#dialog-inspector").dialog({
			width: w,
			height: h,
			modal: true,
			buttons: [
				{
					text: dlText.seerec,
					click: function() {
						window.open(prspdata.site_url+'?p='+rec.wp, '_blank');
					}
				},
				{
					text: dlText.close,
					click: function() {
							// Stop any A/V playing
						switch(avType) {
						case 1:
							if (widgetData.widget != null && widgetData.playing)
								widgetData.widget.pause();
							widgetData.playing = false;
							widgetData.widget = null;
							break;
						case 2:
								// Prevent invoking player if code called after modal closed
							widgetData.ytCall = null;
								// Silence YouTube player if modal closed in another way
							if (widgetData.widget != null && widgetData.playing)
								widgetData.widget.stopVideo();
							widgetData.widget = null;
							widgetData.playing = false;
							if (widgetData.timer != null) {
								window.clearInterval(widgetData.timer);
								widgetData.timer = null;
							}
							break;
						} // switch
						jQuery('#btn-inspect-left').off("click");
						jQuery('#btn-inspect-right').off("click");
						inspector.dialog("close");
					} // click
				}
			]
		});

		event.preventDefault();
	} // clickOpenSelection()

	function doSelBtns(enable)
	{
		var vCnxt = jQuery(getFrameID()+' .view-control-bar');

		if (enable) {
			vCnxt.find('.osel').button("enable");
			vCnxt.find('.osel').addClass("pulse");
			vCnxt.find('.xsel').button("enable");
		} else {
			vCnxt.find('.osel').button("disable");
			vCnxt.find('.osel').removeClass("pulse");
			vCnxt.find('.xsel').button("disable");
		}
	} // doSelBtns()

	function clickClearSelection(event)
	{
		if (vizModel)
			vizModel.clearSel();
		doSelBtns(false);
		event.preventDefault();
	} // clickClearSelection()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizControls(event)
	{
		if (vizModel)
			vizModel.optionsModal();
		event.preventDefault();
	} // clickVizControls()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizNotes(event)
	{
		var d = jQuery("#dialog-vnotes").dialog({
			width: 300,
			height: 300,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						d.dialog("close");
					}
				}]
		});
		event.preventDefault();
	} // clickVizNotes()

		// PURPOSE: Turn on or off all feature Attributes for tmpltIndex
	function doShowHideAll(tmpltIndex, show)
	{
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', show);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
	} // doLocateSelect()


		// PURPOSE: Make vIndex the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate input.lgnd-entry-check').prop('checked', false);
			// Just reselect this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate[data-id="'+lID+'"] input.lgnd-entry-check').prop('checked', true);
	} // doLocateSelect()


		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group div.lgnd-value[data-index="'+vIndex+
								'"] input.lgnd-entry-check').prop('checked', true);
	} // doFeatureSelectOnly()


		// PURPOSE: Handle click anywhere on Legend
	function clickInLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'lgnd-update':
			if (vizModel && datastream) {
				PState.set(PSTATE_BUILD);
				doSelBtns(false);
				vizModel.render(datastream);
				PState.set(PSTATE_READY);
			}
			break;
			// Turn on or off just this one value
		case 'lgnd-entry-check':
			var lEntry = jQuery(event.target).closest('div.lgnd-entry');
			var isChecked = jQuery(event.target).is(':checked');
				// What does checkbox belong to?
			if (lEntry.hasClass('lgnd-sh'))
				doShowHideAll(tmpltIndex, isChecked);
				// A locate Attribute?
			else if (lEntry.hasClass('lgnd-locate'))
				doLocateSelect(tmpltIndex, lEntry.data('id'), isChecked);
					// Must belong to a lgnd-entry
			else if (lEntry.hasClass('lgnd-value'))
				doFeatureSelect(tmpltIndex, lEntry.data('index'), isChecked);
			break;

			// Make this only selected feature attribute
		case 'lgnd-viz':
		case 'lgnd-value-title': 		// Title used for both locate and feature Attributes!
			var lEntry = jQuery(event.target).closest('div.lgnd-entry');
			if (lEntry.hasClass('lgnd-locate'))
				doLocateSelectOnly(tmpltIndex, lEntry.data('id'));
			else if (lEntry.hasClass('lgnd-value'))
				doFeatureSelectOnly(tmpltIndex, lEntry.data('index'));
			break;

		case 'lgnd-template':
		case 'lgnd-select':
		case '':
				// Ignore these
			break;

		default:  // could be multiple
				// Show/Hide title?
			if (clickClass.match(/lgnd-sh/i)) {
					// Simulate click
				var checkBox = jQuery(event.target).find('input.lgnd-entry-check');
				var isChecked = !checkBox.is(':checked');
				checkBox.prop('checked', isChecked);
				doShowHideAll(tmpltIndex, isChecked);
			}
			break;
		}
	} // clickInLegend()


		// PURPOSE: Handle selecting a feature Attribute for a Template from menu
	function selectTmpltAttribute(event)
	{
			// Determine Template to which this refers
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var attID = jQuery(event.target).val();
		setLegendFeatures(tmpltIndex, attID);
	} // selectTmpltAttribute()


		// PURPOSE: Set feature attributes in Legend
		// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
		//			attID = ID of feature Attribute in the Legend set
		// NOTES: 	Does not affect menu selection itself
	function setLegendFeatures(lIndex, attID)
	{
		var element;

		var group = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						lIndex+'"] div.lgnd-group');
			// Clear any previous entries
		group.empty();
		legendIDs[lIndex] = attID;
			// Insert new items
		var attDef = PData.getAttID(attID);
		attDef.l.forEach(function(legEntry, lgIndex) {
			element = '<div class="lgnd-value lgnd-entry" data-index="'+lgIndex+'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>'+
						'<div class="lgnd-viz" style="background-color: '+legEntry.v+'"> </div> <span class="lgnd-value-title">'+legEntry.l+'</span></div>';
			group.append(element);
			if (legEntry.z && legEntry.z.length > 0) {
				legEntry.z.forEach(function(zEntry, zIndex) {
					element = '<div class="lgnd-value lgnd-entry" data-index="'+lgIndex+','+zIndex+
								'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>';
					if (zEntry.v && zEntry.v != '') {
						element += '<div class="lgnd-viz" style="background-color: '+zEntry.v+'"></div>';
					} else {
						element += '<div class="lgnd-viz lgnd-viz-empty"></div>';
					}
					element += ' <span class="lgnd-value-title"> > '+zEntry.l+'</span></div>';
					group.append(element);
				});
			}
		});
			// Turn on Show/Hide All by default
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						lIndex+'"] div.lgnd-sh input').prop('checked', true);
	} // setLegendFeatures()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vIndex is index in Exhibit array
		//			if refresh, then immediately redraw
	function createViz(vIndex, refresh)
	{
		var theView = PData.getVizIndex(vIndex);

			// Remove current viz content
		if (vizModel) {
			vizModel.teardown();
			vizModel = null;
		}
		var frame = jQuery(getFrameID());

		frame.find('div.viz-content div.viz-result').empty();

		var newViz;
		switch (theView.vf) {
		case 'M':
			newViz = new VizMap(instance, theView.c);
			break;
		case 'C':
			newViz = new VizCards(instance, theView.c);
			break;
		case 'P':
			newViz = new VizPinboard(instance, theView.c);
			break;
		case 'T':
			newViz = new VizTime(instance, theView.c);
			break;
		case 'D':
			newViz = new VizDirectory(instance, theView.c);
			break;
		case 't':
			newViz = new VizTextStream(instance, theView.c);
			break;
		case 'S':
			newViz = new VizStackChart(instance, theView.c);
			break;
		case 'N':
			newViz = new VizNetWheel(instance, theView.c);
			break;
		}
		vizSelIndex = vIndex;
		var flags = newViz.flags();

			// Either add scroll bars to viz-content and make viz-result fit content
			//	or else give max-size to viz-result
		if (flags & V_FLAG_HSCRL) {
			frame.find('div.viz-content').addClass('h-scroll');
			frame.find('div.viz-result').addClass('viz-fit-w');
			frame.find('div.viz-result').removeClass('viz-max-w');
		} else {
			frame.find('div.viz-content').removeClass('h-scroll');
			frame.find('div.viz-result').removeClass('viz-fit-w');
			frame.find('div.viz-result').addClass('viz-max-w');
		}
		if (flags & V_FLAG_VSCRL) {
			frame.find('div.viz-content').addClass('v-scroll');
			frame.find('div.viz-result').addClass('viz-fit-h');
			frame.find('div.viz-result').removeClass('viz-max-h');
		} else {
			frame.find('div.viz-content').removeClass('v-scroll');
			frame.find('div.viz-result').removeClass('viz-fit-h');
			frame.find('div.viz-result').addClass('viz-max-h');
		}

		legendIDs=[];

			// Does Viz support Legend at all?
		if (flags & V_FLAG_LGND) {
			frame.find('.hslgnd').button("enable");
				// Clear out previous Legend
				// remove all previous locate Attributes
			var lgndCntr = frame.find('div.lgnd-container div.lgnd-scroll');
			lgndCntr.empty();

				// Is it just a single Legend for all Records?
			if (flags & V_FLAG_SLGND) {
				var fAttID = newViz.getFeatureAtts();
				var fAtt = PData.getAttID(fAttID);
				lgndCntr.append('<div class="lgnd-template" data-index="0"><div class="lgnd-title">'+fAtt.def.l+
					'</div><div class="lgnd-entry lgnd-sh"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>'+
					dlText.sha+'</div><div class="lgnd-group"></div></div>');
					// Only a single Attribute available
				legendIDs.push(fAttID);
				setLegendFeatures(0, fAttID);
			} else {
					// Create Legend sections for each Template
				prspdata.e.g.ts.forEach(function(tID, tIndex) {
					var tmpltDef = PData.getTmpltID(tID);
						// Insert locate attributes into Legends
					var locAtts = newViz.getLocAtts(tIndex);
					if ((locAtts && locAtts.length > 0) || !(flags & V_FLAG_LOC)) {
							// Create DIV structure for Template's Legend entry
						var newTLegend = jQuery('<div class="lgnd-template" data-index="'+tIndex+
										'"><div class="lgnd-title">'+tmpltDef.l+'</div></div>');
						if (locAtts)
							locAtts.forEach(function(attID, aIndex) {
								var attDef = PData.getAttID(attID);
								newTLegend.append('<div class="lgnd-entry lgnd-locate" data-id="'+attID+
									'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/><span class="lgnd-value-title">'+
									attDef.def.l+'</span></div>');
							});
							// Create dropdown menu of visual Attributes
						var attSelection = newViz.getFeatureAtts(tIndex);
						var newStr = '<select class="lgnd-select">';
						attSelection.forEach(function(attID, aIndex) {
							var attDef = PData.getAttID(attID);
							newStr += '<option value="'+attID+'">'+attDef.def.l+'</option>';
						});
						newStr += '</select>';
						var newSelect = jQuery(newStr);
						newSelect.change(selectTmpltAttribute);
						jQuery(newTLegend).append(newSelect);
							// Create Hide/Show all checkbox
						jQuery(newTLegend).append('<div class="lgnd-entry lgnd-sh"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>'+
							dlText.sha+'</div><div class="lgnd-group"></div>');
						lgndCntr.append(newTLegend);
						if (tIndex != (prspdata.t.length-1))
							lgndCntr.append('<hr/>');
							// Default feature selection is first Attribute
						var fAttID = attSelection.length > 0 ? attSelection[0] : null;
						legendIDs.push(fAttID);
						if (fAttID) 
							setLegendFeatures(tIndex, fAttID);
					}
				});
			}
			frame.find('div.lgnd-container').show();
		} else {
			frame.find('.hslgnd').button("disable");
				// Just hide Legend
			frame.find('div.lgnd-container').hide();
		}

			// Enable or disable corresponding Selector Filter
		var c = jQuery('#selector-v'+vfIndex);
		if (flags & V_FLAG_SEL) {
			c.removeAttr("disabled");
			c.prop('checked', true);
		} else {
			c.attr("disabled", true);
			c.prop('checked', false);
		}

			// Does Viz have an Options dialog?
		if (flags & V_FLAG_SET) {
			frame.find('.vopts').button("enable");
		} else {
			frame.find('.vopts').button("disable");
		}

			// Does Viz have annotation?
		if (typeof theView.n == 'string' && theView.n != '')
		{
			frame.find('.vnote').button("enable");
			jQuery('#vnotes-txt').empty().append('<p>'+theView.n+'</p>');
		} else {
			frame.find('.vnote').button("disable");
		}

		newViz.setup();

			// ViewFrames initially created w/o selection
		doSelBtns(false);

		if (datastream && refresh)
			newViz.render(datastream);
		vizModel = newViz;
	} // createViz()


	// INSTANCE METHODS
	//=================

	instance.getFrameID = getFrameID;

	instance.getIndex = function()
	{
		return vfIndex;
	}

	instance.setViz = function(vI, refresh)
	{
		if (vI != vizSelIndex) {
			var select = jQuery(getFrameID()+' div.view-control-bar select.view-viz-select');
			select.val(vI);
			createViz(vI, refresh);
		}
	} // setViz()

		// PURPOSE: Initialize basic DOM structure for ViewFrame
	instance.initDOM = function(vI)
	{
		var viewDOM = document.getElementById('dltext-viewframe-dom').innerHTML;
		jQuery('#viz-display-frame').append('<div id="view-frame-'+vfIndex+'">'+viewDOM+'</div>');

		var frame = jQuery(getFrameID());

			// Activate drag handle on Legend
		frame.find('div.lgnd-container').draggable({ handle: frame.find('div.lgnd-handle'), containment: "parent" });

		var select = frame.find('div.view-control-bar select.view-viz-select');
			// Set Dropdown to View names
		prspdata.e.vf.forEach(function(theVF, i) {
			var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
			select.append(optionStr);
		});
		select.val(vI);
		select.change(selectChangeViz);

			// Hook control bar Icon buttons
		frame.find('div.view-control-bar button:first')
				.button({icons: { primary: 'ui-icon-bookmark' }, text: false })
				.click(clickShowHideLegend).next()
				.button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(clickOpenSelection).next()
				.button({icons: { primary: 'ui-icon-cancel' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-gear' }, text: false })
				.click(clickVizControls).next()
				.button({icons: { primary: 'ui-icon-help' }, text: false })
				.click(clickVizNotes).next();

		frame.find('div.lgnd-container')
			.click(clickInLegend);

		createViz(vI, false);
	} // initDOM()


		// RETURNS: Array of currently selected locate Attribute IDs for tIndex
	instance.getSelLocAtts = function(tIndex)
	{
		var attIDs = [];
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
							tIndex+'"] div.lgnd-locate input:checked');
		boxes.each(function() {
			var attID = jQuery(this).parent().data('id');
			attIDs.push(attID);
		});
		return attIDs;
	} // getSelLocAtts()


		// RETURNS: Array of indices of currently selected feature Attribute IDs for tIndex
		// NOTES: 	Indices are in dot notation for 2ndary-level (x.y)
		//			Array must be in numeric order
	instance.getSelFeatAtts = function(tIndex)
	{
		var attIndices = [], attIndex, i;
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
							tIndex+'"] div.lgnd-group div.lgnd-value input:checked');
		boxes.each(function() {
			attIndex = jQuery(this).parent().data('index');
			if (typeof attIndex == 'number') {
				attIndices.push(attIndex);
			} else {
				if ((i=attIndex.indexOf(',')) != -1) {
					attIndices.push([parseInt(attIndex.substring(0,i),10), parseInt(attIndex.substring(i+1),10)]);
				} else
					attIndices.push(parseInt(attIndex,10));
			}
		});
		return attIndices;
	} // getSelFeatAtts()


		// RETURNS: Attribute ID selected on Legend for tIndex
	instance.getSelLegend = function(tIndex)
	{
		return legendIDs[tIndex];
	} // getSelLegend()

		// RETURNS: Array of Attribute IDs chosen for all Templates on Legend
	instance.getLgndSels = function()
	{
		return legendIDs.slice(0);
	} // getLgndSels()

		// PURPOSE: Set the Feature Attribute selections on the Legends
		// NOTES: 	Utility function for setting Perspective
	instance.setLgndSels = function(attIDs)
	{
		attIDs.forEach(function(attID, i) {
			var select = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+i+'"] select.lgnd-select');
			select.val(attID);
			setLegendFeatures(i, attID);
		});
	} // setLgndSels()

		// RETURNS: The state of the current visualization
	instance.getState = function()
	{
		return vizModel ? vizModel.getState() : null;
	} // getState()

		// PURPOSE: Set the state of the current visualization
	instance.setState = function(state)
	{
		if (vizModel)
			vizModel.setState(state);
	} // getState()

		// PURPOSE: Called by external agent when new datastream is available for viewing
	instance.showStream = function(stream)
	{
		datastream = stream;
		if (vizModel)
			vizModel.render(stream);
	} // showStream()

	instance.setStream = function(stream)
	{
		datastream = stream;
	} // setStream()

		// PURPOSE: Either enable or disable selection buttons for this ViewFrame
	instance.selBtns = function(enable)
	{
		doSelBtns(enable);
	} // selBtns()

	instance.clearSel = function()
	{
		if (vizModel)
			vizModel.clearSel();
		doSelBtns(false);
	} // clearSel()

		// PURPOSE: Attempt to set the Selection List of the VizModel to selList
		// RETURNS: true if possible, false if not
	instance.setSel = function(selList)
	{
		if (vizModel) {
			if (vizModel.flags() & V_FLAG_SEL) {
				vizModel.setSel(selList);
				doSelBtns(selList.length > 0);
				return true;
			}
			return false;
		}
		return false;
	} // selSel()

		// PURPOSE: Alert inner visualization that view frame has resized
	instance.resize = function()
	{
		if (vizModel)
			vizModel.resize();
	} // resize()

	instance.title = function()
	{
		var v = PData.getVizIndex(vizSelIndex);
		return v.l;
	} // title()

	return instance;
} // PViewFrame


// ==========================================================
// PData
// PURPOSE: Manages all data, orchestrates data streams, etc.

// USES: jQuery (for AJAX), underscore

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			PData is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// 			The s array of an IndexStream contains absolute index numbers to global data array


var PData = (function() {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;	// default, overridden by WP-saved option
	var dltextFrom;
	var dltextTo;
	var dltextApprox;
	var dltextNow;

	// INTERNAL VARIABLES
	// ==================

	var recs=[];				// "head" array of all Records, one entry per Template type
								// Corresponding to prspdata.t
								// { n = # loaded, i = initial index for these records, d = data array }
	var recsCount=0;			// Total number of Records
	var loaded=false;			// All data loaded?


	// INTERNAL FUNCTIONS
	// ==================


		// PURPOSE: Load a particular chunk of Records
	function loadAJAXRecs(tIndex, from, count)
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
				checkDataLoad();
			},
			error: function(XMLHttpRequest, textStatus, errorThrown)
			{
			   alert(errorThrown);
			}
		});
	} // loadAJAXRecs()


		// PURPOSE: Look for set of Records that haven't been loaded and request
	function checkDataLoad()
	{
		var done = true;

		for (var i=0; i<prspdata.t.length; i++) {
			var current = recs[i].n;
			var needed = prspdata.t[i].n;
			if (current < needed) {
				done = false;
				var gap = needed - current;
				var size = gap < LOAD_DATA_CHUNK ? gap : LOAD_DATA_CHUNK;
				loadAJAXRecs(i, current, size);
					// Since this is a recursive action, break on first find
				break;
			}
		}
		if (done) {
// console.log("Done loading: "+JSON.stringify(recs));
			loaded=true;
			// jQuery('#btn-recompute').addClass('pulse');
			setTimeout(function() {
				jQuery("body").trigger("prospect", { pstate: PSTATE_PROCESS, component: 0 });
			}, 500);
		}
	} // checkDataLoad()


	// PUBLIC INTERFACE
	// ================

	return {
			// PURPOSE: Initialize data hub, initiate data loading
		init: function()
		{
			dltextFrom = document.getElementById('dltext-from').innerHTML;
			dltextTo = document.getElementById('dltext-to').innerHTML;
			dltextApprox = document.getElementById('dltext-approximately').innerHTML;
			dltextNow = document.getElementById('dltext-now').innerHTML;

			if (typeof prspdata.chunk == 'number' && prspdata.chunk > 0)
				LOAD_DATA_CHUNK = prspdata.chunk;

				// For each entry: head entry for Record Data and collect Legends
			prspdata.t.forEach(function(tmplt) {
					// Head Record entry
				var newTData = { i: recsCount, n: 0, d: null };
				recs.push(newTData);
				recsCount += tmplt.n;
			});
			checkDataLoad();
		}, // init()

			// PURPOSE: Optimized and reliable string compare
		strcmp: function(a, b) {
			for (var i=0,n=Math.max(a.length, b.length); i<n && a.charAt(i) === b.charAt(i); ++i) {};
			if (i === n) return 0;
			return a.charAt(i) > b.charAt(i) ? -1 : 1;
		}, // strcmp()

			// PURPOSE: Create a new IndexStream: { s = index array, t = array of template params, l = total length }
			// INPUT: 	if full, fill with entries for all Records
			// NOTE: 	JS Arrays are quirky; s is always full size, so l is used to maintain length
		newIndexStream: function(full)
		{
			var newStream = { };
			newStream.s = new Uint16Array(recsCount);
			newStream.t = [];
			newStream.l = 0;

			if (full) {
				var i;
				for (i=0; i<recsCount; i++)
					newStream.s[i] = i;
				for (i=0; i<recs.length; i++) {
					var tEntry = recs[i];
					var newEntry = { i: tEntry.i, n: tEntry.n };
					newStream.t.push(newEntry);
				}
				newStream.l = recsCount;
			}
			return newStream;
		}, // newIndexStream()


			// RETURNS: Index of Template to which absolute index <absI> belongs
		aIndex2Tmplt: function(absI)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.i <= absI  && absI < (tData.i+tData.n))
					return i;
			}
		}, // aIndex2Tmplt()

			// RETURNS: True if attID is in template tIndex
			// NOTE: 	Since list of Attributes in Template definition not in Join form, assume
			//				that appearance of prefix is sufficient
		attInTmplt: function(attID, tIndex)
		{
			var tEntry = prspdata.t[tIndex];
			var p = attID.split('.');
			p = p[0];
			return (tEntry.def.a.findIndex(function(att) { return att == p; }) != -1);
		}, // attInTmplt()


			// RETURNS: The index of first entry in <datastream> which belongs to Template <tIndex>
			//			-1 if the Template has no entries
			// NOTE: 	This is for effectively "fast-forwarding" to a particular Template section
			// 			This is tricky because binary-search needs to look for range
		stream1stTEntry: function(datastream, tIndex)
		{
			var tEntry = datastream.t[tIndex];
			if (tEntry.n == 0)
				return -1;
			return tEntry.i;
		}, // stream1stTEntry()


			// RETURNS: Object for Record whose absolute index is <absI>
		getRecByIndex: function(absI)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0) {
					if (tData.i <= absI  && absI < (tData.i+tData.n))
						return tData.d[absI - tData.i];
				}
			}
			return null;
		}, // getRecByIndex()

			// RETURNS: Attribute value in string format
			// INPUT: 	attID = ID of Attribute
			//			a = raw attribute data
			// TO DO: 	Change attID to att definition
		procAttTxt: function(attID, a)
		{
			var att = PData.getAttID(attID);
			switch (att.def.t) {
			case 'V':
				return a.join(', ');
			case 'T':
				return a;
			case 'N':
				return a.toString();
			case 'D':
				var ds;
					// Range
				if (a.max) {
					ds = dltextFrom;
					if (a.min.f)
						ds += dltextApprox;
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
					ds += dltextTo;
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
						ds = dltextApprox;
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
						var ptrRec = PData.getRecByID(onePtr);
						if (ptrRec) {
							t += '<a href="'+prspdata.site_url+'?p='+ptrRec.wp+'" target="_blank">'+ptrRec.l+'</a> ';
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
		getRecAtt: function(absI, attID, raw)
		{
			for (var i=0; i<recs.length; i++) {
				var tData = recs[i];
				if (tData.n > 0 && tData.i <= absI  && absI < (tData.i+tData.n)) {
					var rec = tData.d[absI - tData.i];
					var a = rec.a[attID];
					if (a == null || typeof a == 'undefined')
						return null;
					if (raw)
						return a;
					return PData.procAttTxt(attID, a);
				}
			}
			return null;
		}, // getRecAtt()

			// RETURNS: Absolute index for Record whose ID is recID
		getAbsIByID: function(recID)
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
		}, // getAbsIByID()


			// RETURNS: Record data for recID
		getRecByID: function(recID)
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
		}, // getRecByID()


			// RETURNS: Attribute definition with this ID
			// INPUT:   attID = full Attribute ID (could be in Join dot notation)
			// TO DO: 	Use Intl.Collator for string compare??
		getAttID: function(attID)
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
		}, // getAttID()

		getAttIndex: function(aIndex)
		{
			return prspdata.a[aIndex];
		}, // getAttIndex()

			// RETURNS: Number of Templates used by this Exhibit
		getNumETmplts: function()
		{
			return prspdata.e.g.ts.length;
		},

			// RETURNS: The ID of this Exhibit's tIndex Template
		getETmpltIndex: function(tIndex)
		{
			return prspdata.e.g.ts[tIndex];
		},

			// RETURNS: Definition of template whose ID is tID
		getTmpltID: function(tID)
		{
			for (var i=0; i<prspdata.t.length; i++) {
				if (tID == prspdata.t[i].id)
					return prspdata.t[i].def;
			}
		}, // getTmpltID()

			// RETURNS: The visual feature for an Attribute value, an array (if all), or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			att = full Attribute entry
			//			fSet = array of selected Legend indices ([x,y] for 2ndary level!)
			//			all = return array for all possible matches for <val> (true), or just first match (false)
		getAttLgndRecs: function(val, att, fSet, all)
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
							if (lE.l == v)
								return lE;
							// Secondary-level
						} else {
							lE = att.l[fI[0]];
							var lE2 = lE.z[fI[1]];
							if (lE2.l == v) {
								if (lE2.v && lE2.v != '')
									return lE2;
								else
									return lE;
							}
						}
					}
					return null;
				} // s()
					// Return all possible matched atts?
				if (all && att.def.d != '') {
					var r = [], f;
					val.forEach(function(v) {
						f = s(v);
						if (f != null)
							r.push(f);
					});
					return r.length > 0 ? r : null;
				} else {
						// Could be multiple values, but just return first success
					if (att.def.d != '') {
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
					if (val.indexOf(lE.d) != -1) {
						return lE;
					}
				}
				return null;
			case 'N':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// either min and max can be left out (= no bound), but not both
					if (typeof lE.d.min != 'undefined') {
						if (lE.d.min <= val) {
							if (typeof lE.d.max != 'undefined') {
								if (val <= lE.d.max)
									return lE;
							} else
								return lE;
						}
					} else {	// max only
						if (val <= lE.d.max)
							return lE;
					}
				}
				return null;
			case 'D': 			// Just looking for overlap, date doesn't have to be completely contained
								// Disqualify for overlap if (1) end of event is before min bound, or
								//	(2) start of event is after max bound
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
					if (typeof lE.d.max.y != 'undefined') {		// max bounds
							// Test val maxs against min bound for disqualification
						if (typeof val.max != 'undefined' && val.max != 'open') {
							if (val.max.y < lE.d.min.y)
								continue;
							if (val.max.y == lE.d.min.y) {
								if (val.max.m && lE.d.min.m) {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m == lE.d.min.m) {
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
						if (val.min.y == lE.d.max.y) {
							if (val.min.m && lE.d.max.m) {
								if (val.min.m > lE.d.max.m)
									continue;
								if (val.min.m == lE.d.max.m) {
									if (val.min.d && lE.d.max.d) {
										if (val.min.d > lE.d.max.d)
											continue;
									}
								}
							}
						}
						return lE;
					} else {				// min bound only
							// Event is range
						if (typeof val.max != 'undefined') {
							if (val.max == 'open')		// double open always overlap
								return lE;
							if (val.max.y < lE.d.min.y)
								continue;
							if (val.max.y == lE.d.min.y) {
								if (val.max.m && lE.d.min.m) {
									if (val.max.m < lE.d.min.m)
										continue;
									if (val.max.m == lE.d.min.m) {
										if (val.max.d && lE.d.min.d) {
											if (val.max.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE;

							// Single date
						} else {
							if (val.min.y < lE.d.min.y)
								continue;
							if (val.min.y == lE.d.min.y) {
								if (val.min.m && lE.d.min.m) {
									if (val.min.m < lE.d.min.m)
										continue;
									if (val.min.m == lE.d.min.m) {
										if (val.min.d && lE.d.min.d) {
											if (val.min.d < lE.d.min.d)
												continue;
										}
									}
								}
							}
							return lE;
						}
					}
				} // for f
				break;
			}
			return null;
		}, // getAttLgndRecs()


			// RETURNS: Just color code for an Attribute value, an array (if all), or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			att = full Attribute entry
			//			fSet = array of selected Legend indices ([x,y] for 2ndary level!)
			//			all = return array for all possible matches for <val> (true), or just first match (false)
			// TO DO: 	Change to ptr to legend record so can access both <v> and <b> ??
		getAttLgndVal: function(val, att, fSet)
		{
			var rec;

			if (rec = PData.getAttLgndRecs(val, att, fSet, false)) {
				return rec.v;
			} else
				return null
		}, // getAttLgndVal()


			// PURPOSE: Find the visual code for this Attribute's vocabulary item
			// RETURNS: pointer to Legend record, or null if failure
			// ASSUMES: <att> is a complete record for a Vocabulary Attribute
		getVLgndVal: function(att, val)
		{
			var lo = 0;
			var hi = att.x.length-1;
			var pos, cmp;

			while (lo <= hi) {
				pos = (lo + hi) >> 1;
				cmp = PData.strcmp(val, att.x[pos].l);

				if (cmp < 0) {
					lo = pos + 1;
				} else if (cmp > 0) {
					hi = pos - 1;
				} else {
					var i = att.x[pos].i;
					if (typeof i == 'number')
						return att.l[i];
					else
						return att.l[i[0]].z[i[1]];
				}
			}
			return null;
		}, // getVLgndVal()

			// PURPOSE: Create a single Date from three numbers
			// INPUT:   year, month (1-12), day (1) must be definite numbers
			// NOTE:    JavaScript Date month is 0-based (not 1-based: 0=January)
		date3Nums: function(year, month, day)
		{
			var date;

			if (year < 0 || year > 99) { // 'Normal' dates
				date = new Date(year, month-1, day);
			} else if (year == 0) { // Year 0 is '1 BC'
				date = new Date (-1, month-1, day);
			} else {
				// Create arbitrary year and then set the correct year
				date = new Date(year, month-1, day);
				date.setUTCFullYear(("0000" + year).slice(-4));
			}
			return date;
		}, // date3Nums

			// PURPOSE: Create a Date from minimal specification in Object fields
		objDate: function(field, m) {
			var d;

			if (typeof field.m != 'undefined' && field.m != null) {
				m = field.m;
				if (typeof field.d != 'undefined' && field.d != null)
					d = field.d;
				else
					d = mnthDays[m-1];
			} else {
				d = mnthDays[m-1];
			}
			return PData.date3Nums(field.y, m, d);
		}, // objDate()

			// PURPOSE: Create Date by parsing string
			// ASSUMES: Definite date: won't have initial ~ character
		parseDate: function(str, m, d)
		{
			if (str == 'open')
				return TODAY;

			var np = 1;
			if (str.charAt(0) == '-') {
				np = -1;
				str = str.substring(1);
			}
			var cmpts = str.split('-');
			var y = parseInt(cmpts[0])*np;
			if (cmpts.length > 1) {
				m = parseInt(cmpts[1]);
				if (cmpts.length == 3)
					d = parseInt(cmpts[2]);
			}

			return PData.date3Nums(y, m, d);
		}, // parseDate()

			// PURPOSE: Create Dates (single date or range) from Record value
			// RETURNS: [date, date] (if a single day, second date is empty)
		makeDates: function(data)
		{
			var s, e;
			var y, m, d, single=false;

			y = data.min.y;
			if (typeof data.min.m == 'undefined') {
				m = 1; d = 1;
			} else {
				m = data.min.m;
				if (typeof data.min.d == 'undefined')
					d = 1;
				else {
					d = data.min.d;
					single=true;
				}
			}
			s = PData.date3Nums(y,m,d);
			if (typeof data.max != 'undefined') {
				if (data.max == 'open')
					e = TODAY;
				else {
					y = data.max.y;
					if (typeof data.max.m == 'undefined') {
						m = 12; d = 31;
					} else {
						m = data.max.m;
						if (typeof data.max.d == 'undefined')
							d = mnthDays[m-1];
						else
							d = data.max.d;
					}
					e = PData.date3Nums(y,m,d);
				} // number
			} else {
				if (single)
					return [s, null];
				else {
					if (typeof data.min.m == 'undefined') {
						m = 12; d = 31;
					} else {
						d = mnthDays[m-1];
					}
					e = PData.date3Nums(y,m,d);
				}
			}
			return [s, e];
		}, // makeDates


			// PURPOSE: Return array of categories for facet att based on Legend definitions
			// INPUT: 	att = complete Attribute definition
			//			fSet = allowable Legend indices (returned by getSelFeatAtts) or null
			// RETURNS: category array in same format as getRCats (always has i[])
		getLCats: function(att, fSet)
		{
			var rcs = [];
			switch (att.def.t) {
			case 'T':
				att.l.forEach(function(t) {
					if (fSet == null || PData.getAttLgndRecs(t.d, att, fSet, false))
						rcs.push({ l: t.l, x: t.d, c: t.v, i: [] });
				});
				return rcs;
			case 'V':
				att.l.forEach(function(v) {
					if (fSet == null || PData.getAttLgndRecs([v.l], att, fSet, false))
						rcs.push({ l: v.l, c: v.v, i: [] });
					v.z.forEach(function(v2) {
						if (fSet == null || PData.getAttLgndRecs([v2.l], att, fSet, false))
							rcs.push({ l: v2.l, c: v2.v, i: [] });
					});
				});
				return rcs;
			case 'N':
				att.l.forEach(function(n) {
					if (fSet == null || PData.getAttLgndRecs(n.d.min, att, fSet, false))
						rcs.push({ l: n.l, c: n.v, min: n.d.min, max: n.d.max, i: [] })
				});
				return rcs;
			case 'D':
				var dmin, dmax;
				att.l.forEach(function(d) {
					dmin = PData.objDate(d.min, 1);
					if (fSet == null || PData.getAttLgndRecs(dmin, att, fSet, false)) {
						if (d.max.y == null)
							dmax = TODAY;
						else
							dmax = PData.objDate(d.max, 12);
						rcs.push({ l: d.l, c: d.v, min: dmin, max: dmax });
					}
				});
				return rcs;
			} // switch
		}, // getLCats()


			// PURPOSE: Return array of range categories for facet att
			// INPUT: 	Complete Attribute definition <att>
			//			If addItems, create empty members array in range category entries
			// RETURNS: full range category array = { l[abel], c[olor], min, max, x, i[tems] },
			//					(min and max only used for Number and Dates types)
			//					(x is the text to match, only for Text pattern type)
			//				or null if range categories not possible (lack of bounds or not defined)
			// ASSUMES: Only called for Text, Vocabulary, Number and Dates types
			//			Date range has minimum year
			//			JS Data creation deals with “spillover” values
			// NOTES: 	To qualify for a Legend category, a range category only needs to start within it
			//			A range category with no Legend match is assigned color black
			//			max value is exclusive (must be less than, not equal!)
			// TO DO: 	Handle case that scale of max-min and g would be too large ??
		getRCats: function(att, addItems)
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
			case 'V':
				att.l.forEach(function(i) {
					if (addItems)
						rcs.push({ l: i.l, c: i.v, i: [] });
					else
						rcs.push({ l: i.l, c: i.v });
					i.z.forEach(function(i2) {
						if (addItems)
							rcs.push({ l: i2.l, c: i2.v, i: [] });
						else
							rcs.push({ l: i2.l, c: i2.v });
					});
				});
				return rcs;
			case 'N':
					// Can't create range category unless both bounds provided
				if (typeof att.r.min == 'undefined' || typeof att.r.max == 'undefined')
					return null;
				var inc = Math.pow(10, att.r.g);
				var curV = att.r.min, lI=0, curL, min, rgb;
				if (att.l.length > 0)
					curL = att.l[0];
				while (curV <= att.r.max) {
						// Advance to the relevant legend category
					while (lI < att.l.length && typeof curL.d.max != 'undefined' && curV > curL.d.max) {
						curL = att.l[++lI];
					}
						// Is current range category before current legend category?
					if (att.l.length == 0 || curV < curL.d.min) {
						rgb = '#000000';

						// Does it occur beyond last category?
					} else if (lI == att.l.length) {
						rgb = '#000000';

						// Does it start within current category (inc one w/o max bound)
					} else if (typeof curL.d.max == 'undefined' || curV <= curL.d.max) {
						rgb = curL.v;

					} else {
						rgb = '#000000';
					}
					min = curV;
					curV += inc;
					max = curV;
					if (addItems)
						rcs.push({ l: min.toString(), c: rgb, min: min, max: curV, i: [] });
					else
						rcs.push({ l: min.toString(), c: rgb, min: min, max: curV });
				}
				return rcs;
			case 'D':
				function makeDate(y, m, d, field) {
					if (typeof field.m != 'undefined') {
						m = field.m;
						if (typeof field.d != 'undefined') {
							d = field.d;
						}
					}
					return PData.date3Nums(y, m, d);
				} // makeDate()
				function makeMaxDate(field)
				{
					var y,m,d;
					if (typeof field.y == 'undefined') {
						return TODAY;
					} else {
						y = field.y;
						if (typeof field.m == 'undefined') {
							m = 12; d = 31;
						} else {
							m = field.m;
							if (typeof field.d == 'undefined')
								d = mnthDays[m-1];
							else
								d = field.d;
						}
						return PData.date3Nums(y,m,d);
					}
				} // makeMaxDate()

				var maxDate = makeMaxDate(att.r.max);
				var inc = att.r.g;
				var curY=att.r.min.y, curM=1, curD=1;
				if (typeof att.r.min.m != 'undefined') {
					curM = att.r.min.m;
					if (typeof att.r.min.d != 'undefined') {
						curD = att.r.min.d;
					}
				}
				var curDate = PData.date3Nums(curY, curM, curD);
				var lI=0, curL, lMinDate, lMaxDate;
				if (att.l.length > 0) {
					curL = att.l[0];
					lMinDate = makeDate(curL.d.min.y, 1, 1, curL.d.min);
					lMaxDate = makeMaxDate(curL.d.max);
				}
				while (curDate <= maxDate) {
					var rCat={};
					if (addItems)
						rCat.i = [];

					switch (inc) {
					case 'd':
						rCat.l = curY.toString()+"-"+curM.toString()+"-"+curD.toString();
						break;
					case 'm':
						rCat.l = curY.toString()+"-"+curM.toString();
						break;
					case 'y':
					case 't':
					case 'c':
						rCat.l = curY.toString();
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
						rCat.c = '#000000';

						// Does it occur beyond last category?
					} else if (lI == att.l.length) {
						rCat.c = '#000000';

						// Does it start within current category (inc one w/o max bound)
					} else if (curDate <= lMaxDate) {
						rCat.c = curL.v;

					} else {
						rCat.c = '#000000';
					}
					rCat.min = curDate;
					switch (inc) {
					case 'd':
						rCat.max = PData.date3Nums(curY, curM, curD+1);
						curD++;
						break;
					case 'm':
						rCat.max = PData.date3Nums(curY, curM+1, curD);
						curM++;
						break;
					case 'y':
						rCat.max = PData.date3Nums(curY+1, curM, curD);
						curY++;
						break;
					case 't':
						rCat.max = PData.date3Nums(curY+10, curM, curD);
						curY += 10;
						break;
					case 'c':
						rCat.max = PData.date3Nums(curY+100, curM, curD);
						curY += 100;
						break;
					}
					rcs.push(rCat);
					curDate = PData.date3Nums(curY, curM, curD);
				}
				return rcs;
			} // switch
		}, // getRCats()


			// PURPOSE: Sort all Records in stream into categories according to order Attribute
			// INPUT: 	cats = array generated by getLCats/getRCats (or empty array if unique Text values)
			//			oAttID = ID of Attribute used for ordering (used to make rCats)
			//			sAttID = ID of secondary, required Attribute used later (or null)
			//			stream = datastream
			//			uT = if true, collect all unique text strings (add to rCats)
			// NOTES: 	Puts aIDs from stream into i arrays of rCats
		fillCats: function(cats, oAttID, sAttID, stream, uT)
		{
			var numTmplts = PData.getNumETmplts();
			var tI=0, tRec;
			var rI=0, aI, rec, datum, fData;
			var cI, cRec;

			var oAtt = PData.getAttID(oAttID);

			tRec = stream.t[0];
			while (rI<stream.l) {
					// Advance until we get to next used Template rec that has both necessary Attributes
				while (tRec.n == 0 || (tRec.i+tRec.n) == rI || !PData.attInTmplt(oAttID, tI) || (sAttID && !PData.attInTmplt(sAttID, tI))) {
						// Have we run out of Templates?
					if (++tI == numTmplts)
						return;
					tRec = stream.t[tI];
					rI = tRec.i;
				}

					// Get Record data
				aI = stream.s[rI];
				rec = PData.getRecByIndex(aI);
				datum = rec.a[oAttID];
// console.log("Next record: "+rI+" (absI) "+aI+" Datum: "+JSON.stringify(datum));
				if (typeof datum != 'undefined') {
					switch (oAtt.def.t) {
					case 'T':
						if (uT) {
							for (cI=0; cI<cats.length; cI++) {
								cRec = cats[cI];
								if (datum == cRec.l) {
									cRec.i.push(aI);
									break;
								}
							}
							if (cI == cats.length) {
								cats.push({ l: datum, i: [ aI ] });
							}
						} else {
							for (cI=0; cI<cats.length; cI++) {
								cRec = cats[cI];
								if (datum.indexOf(cRec.x) != -1) {
									cRec.i.push(aI);
									break;
								}
							}
						}
						break;
					case 'V':
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
						for (cI=0; cI<cats.length; cI++) {
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
							// Only need to look at start date!
						var sd = PData.objDate(datum.min, 1);
						for (cI=0; cI<cats.length; cI++) {
							cRec = cats[cI];
								// Did we pass eligible category?
							if (sd < cRec.min)
								break;
							if (cRec.min <= sd && sd <= cRec.max) {
								cRec.i.push(aI);
								break;
							}
						}
						break;
					} // switch type
				} // if datum
				rI++;
			} // while

				// if collected unique texts, sort them
			if (uT) {
				cats.sort(function(a,b) { return PData.strcmp(b.l, a.l); });
			}
		}, // fillRCats()

			// PURPOSE: Created new sorted category array in sCats based on sAtt value
			// INPUT: 	cat = array of aIs of Records
			//			sAtt = definition of Attribute used for sorting
			//			sCats = category array created by getLCats for storing new aIs
		sortCats: function(cat, sAtt, sCats)
		{
			var id=sAtt.id;
			var rec, sI, sRec;

			cat.forEach(function(aI) {
				rec = PData.getRecByIndex(aI);
				datum = rec.a[id];
				if (typeof datum != 'undefined') {
					switch (sAtt.def.t) {
					case 'T':
						for (sI=0; sI<sCats.length; sI++) {
							sRec = sCats[sI];
							if (datum.indexOf(sRec.x) != -1) {
								sRec.i.push(aI);
								break;
							}
						}
						break;
					case 'V':
						datum.forEach(function(d) {
							for (sI=0; sI<sCats.length; sI++) {
								sRec = sCats[sI];
								if (d == sRec.l) {
									sRec.i.push(aI);
									break;
								}
							}
						});
						break;
					case 'N':
						for (sI=0; sI<sCats.length; sI++) {
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
							// Only need to look at start date!
						var sd = PData.objDate(datum.min, 1);
						for (sI=0; sI<sCats.length; sI++) {
							sRec = sCats[sI];
								// Did we pass eligible category?
							if (sd < sRec.min)
								break;
							if (sRec.min <= sd && sd <= sRec.max) {
								sRec.i.push(aI);
								break;
							}
						}
						break;
					} // switch type
				}
			});
		}, // sortCats()


			// PURPOSE: Create index for all records in stream, ordered by the value of an Attribute
			// RETURNS: Array containing objects: { i [absolute index of record], v [value] }
			// NOTES: 	Only uses first value in the case of multiple (Vocabulary, Dates, etc)
		// orderBy: function(att, stream)
		// {
		// 	function vIden(v)
		// 	{
		// 		return v;
		// 	}
		// 	function vVocab(v)
		// 	{
		// 		return v[0];
		// 	}
		// 	function vDate(v)
		// 	{
		// 		var m = 1, d = 1;
		// 		if (typeof v.min.m != 'undefined') {
		// 			m = v.m;
		// 			if (typeof v.min.d != 'undefined')
		// 				d = v.d;
		// 		}
		// 		return PData.date3Nums(v.min.y, m, d);
		// 	}

		// 	var eval, maxV;
		// 	switch (att.def.t) {
		// 	case 'T': 	eval = vIden;	maxV = '~'; break;
		// 	case 'V': 	eval = vVocab;	maxV = '~'; break;
		// 	case 'N': 	eval = vIden;	maxV = att.r.max; break;
		// 	case 'D': 	eval = vDate;	maxV = TODAY; break;
		// 	}

		// 	var ord = [];
		// 	var relI=0, absI, rec, v;
		// 	var tI=0, tRec=stream.t[0], td=recs[0].d;
		// 		// Must keep absolute indices and template params updated
		// 	while (relI < stream.l) {
		// 			// Advance until we get to current Template rec
		// 		while (tRec.n == 0 || (tRec.i+tRec.n) == relI) {
		// 			tRec = stream.t[++tI];
		// 			td = recs[tI].d;
		// 		}
		// 		absI = stream.s[relI++];
		// 		// rec = tRec.d[absI-tRec.i];
		// 		rec = td[absI-tRec.i];
		// 		v = rec[att.id];
		// 			// If there is no value, we need to use max value
		// 		if (typeof v == 'undefined')
		// 			ord.push({ i: absI, v: maxV });
		// 		else
		// 			ord.push({ i: absI, v: eval(v) });
		// 	}

		// 		// Sort array
		// 	switch (att.def.t) {
		// 	case 'T':
		// 	case 'V':
		// 		ord.sort(function(a,b) { return PData.strcmp(b.v, a.v); });
		// 		break;
		// 	case 'D':
		// 	case 'N':
		// 		ord.sort(function(a,b) { return a.v - b.v; });
		// 		break;
		// 	// case 'D':
		// 	// 	ord.sort(function(a,b) {
		// 	// 		var av = a.v.valueOf(), bv = b.v.valueOf();
		// 	// 		return av - bv;
		// 	// 	});
		// 	// 	break;
		// 	}

		// 	return ord;
		// }, // orderBy()


			// PURPOSE: Create index for records of particular Template in stream, ordered by the value of an Attribute
			// RETURNS: Array containing objects: { i [absolute index of record], v [value] }
			// NOTES: 	Only uses first value in the case of multiple (V, D, etc)
		orderTBy: function(att, stream, tI)
		{
			function vIden(v)
			{
				return v;
			}
			function vVocab(v)
			{
				return v[0];
			}
			function vDate(v)
			{
				var m = 1, d = 1;
				if (typeof v.min.m != 'undefined') {
					m = v.m;
					if (typeof v.min.d != 'undefined')
						d = v.d;
				}
				return PData.date3Nums(v.min.y, m, d);
			}

			var eval, maxV;
			switch (att.def.t) {
			case 'T': 	eval = vIden;	maxV = '~'; break;
			case 'V': 	eval = vVocab;	maxV = '~'; break;
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
				if (typeof v == 'undefined')
					ord.push({ i: absI, v: maxV });
				else
					ord.push({ i: absI, v: eval(v) });
			}

				// Sort array
			switch (att.def.t) {
			case 'T':
			case 'V':
				ord.sort(function(a,b) { return PData.strcmp(a.v, b.v); });
				break;
			case 'D':
			// 	ord.sort(function(a,b) {
			// 		var av = a.v.valueOf(), bv = b.v.valueOf();
			// 		return av - bv;
			// 	});
			// 	break;
			case 'N':
				ord.sort(function(a,b) { return a.v - b.v; });
				break;
			}

			return ord;
		}, // orderTBy()

			// RETURNS: View configuration data for vIndex
		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		}, // getVizIndex()

			// RETURNS: true after all data has been loaded
		ready: function()
		{
			return loaded;
		} // ready
	} // return
})(); // PData


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services, manage filters, …

// USES: 	jQuery, jQueryUI, PData, PViewFrame
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// VARIABLES
		//==========
	var view0;				// Primary viewFrame
	var view1;				// Secondary

	var filters=[];			// Filter Stack: { id, f [PFilterModel], out }
	var selFilter=null;		// Selector Filter
	var selFID;				// Attribute ID for Selector Filter
	var apTmStr;			// Apply to <template label> for Filters

	var annote;				// Annotation from Perspective

	var topStream;			// Top-level IndexStream (before Filters)
	var endStream;			// Final resulting IndexStream (after Filters)

	var localStore=null;	// Local (Browser) storage (if Browser capable)
	var localPrspctvs=[];	// locally-stored Perspectives

		// FUNCTIONS
		//==========

	function doRecompute()
	{
		var fDiv;

		PState.set(PSTATE_PROCESS);

		if (topStream == null)
			topStream = PData.newIndexStream(true);
		endStream = topStream;

			// Go through filter stack -- find 1st dirty and recompute from there
		var started=false, fI, theF;
		for (fI=0; fI<filters.length; fI++) {
			theF = filters[fI];
			fDiv = jQuery('div.filter-instance[data-id="'+theF.id+'"]');
				// If we've started, evaluate and propagate
			if (started || theF.f.isDirty(null)) {
				started = true;
				theF.f.evalPrep();
				var newStream = PData.newIndexStream(false);
				var relI=0, absI, rec;
				var tI=0, tRec=endStream.t[0], tRn=0, e;
				e=fDiv.find('.apply-tmplt-0').is(':checked');
					// Must keep absolute indices and template params updated!
				while (relI < endStream.l) {
 						// Advance until we get to current Template rec
 					while (tRec.n == 0 || (tRec.i+tRec.n) == relI) {
 						newStream.t.push({ i: (newStream.l-tRn), n: tRn });
 						tRn = 0;
						tRec = endStream.t[++tI];
						e=fDiv.find('.apply-tmplt-'+tI).is(':checked');
 					}
	 				absI = endStream.s[relI++];
 					if (e) {
	 					rec = PData.getRecByIndex(absI);
						if (theF.f.eval(rec)) {
							newStream.s[newStream.l++] = absI;
							tRn++;
						}
 					} else {
						newStream.s[newStream.l++] = absI;
						tRn++;
 					}
				}
					// push out remaining Template recs
				while (tI++ < PData.getNumETmplts()) {
					newStream.t.push( { i: (newStream.l-tRn), n: tRn } );
					tRn = 0;
				}
				theF.f.isDirty(false);
				theF.f.out = newStream;
				endStream = newStream;
// console.log("Output stream ["+fI+"]: "+JSON.stringify(newStream));
			} else
				endStream = theF.f.out;
		}
		PState.set(PSTATE_BUILD);
		view0.showStream(endStream);
		if (view1)
			view1.showStream(endStream);
		jQuery('#btn-recompute').removeClass('pulse');
	} // doRecompute()

	function clickRecompute(event)
	{
		doRecompute();
		PState.set(PSTATE_READY);
		event.preventDefault();
	} // clickRecompute()

		// PURPOSE: Set annotation text to <t>
	function setAnnote(t)
	{
		annote = t;

		var n = jQuery('#annote');
		n.text(t);

		if (t.length > 0) {
			jQuery('#btn-annote').button("enable");
			n.show();
		} else {
			jQuery('#btn-annote').button("disable");
			n.hide();
		}
	} // setAnnote()

		// PURPOSE: Hide/show the annotation for this View Frame
	function clickAnnotation(event)
	{
		jQuery('#annote').toggle('slide', { direction: "right" });
		event.preventDefault();
	} // clickAnnotation()


		// PURPOSE: Add 2nd window if not already there; remove if so
	function clickTog2nd()
	{
		PState.set(PSTATE_BUILD);
		if (view1 != null) {
			view1 = null;
			jQuery('#view-frame-1').remove();
			jQuery('#selector-v1').prop("disabled", true);
		} else {
			view1 = PViewFrame(1);
			view1.initDOM(0);
			view1.showStream(endStream);
			jQuery('#selector-v1').prop("disabled", false);
		}
		view0.resize();
		PState.set(PSTATE_READY);
	} // clickTog2nd()


	function clickAbout(event)
	{
		var aboutDialog;

		aboutDialog = jQuery("#dialog-about").dialog({
			height: 250,
			width: 350,
			modal: true,
			buttons: [{
				text: dlText.ok,
				click: function() {
					aboutDialog.dialog("close");
				}
			}]
		});

		event.preventDefault();
	} // clickAbout()

		// RETURNS: Record for ID or else null
	function getPerspective(id)
	{
			// Check Perspectives from server
		var prspctv = _.find(prspdata.p, function(theP) {
			return id == theP.id;
		});
		if (prspctv)
			return prspctv;

		if (localStore == null || localPrspctvs.length == 0)
			return null;

		prspctv = _.find(localPrspctvs, function(theP) {
			return id == theP.id;
		});
		if (prspctv)
			return prspctv;

		return null;
	} // getPerspective()

		// PURPOSE: Save current Perspective as <id>
		// RETURNS: "local" or "server" if save successful, else null
	function doSavePerspective(id)
	{
			// Where to save it?
		var dest = jQuery('input[name=save-prspctv-dest]:checked').val();
		if (dest == '')
			return null;

		var note = jQuery('#save-psrctv-note').val();
		note = note.replace(/"/, '');

		var label = jQuery('#save-psrctv-lbl').val().trim();
		label = label.replace(/"/, '');

		var a0 = !jQuery('#selector-v0').prop("disabled") && jQuery('#selector-v0').is(':checked');
		var a1 = !jQuery('#selector-v1').prop("disabled") && jQuery('#selector-v1').is(':checked');

			// Compile Perspective state from Filter stack, Selector Filter & Views
		var pState = { f: [], s: null, a0: a0, a1: a1, v0: { l: view0.title(), s: view0.getState() },
						v1: null };
		filters.forEach(function(theF) {
			var a=[];
			var fDiv = jQuery('div.filter-instance[data-id="'+theF.id+'"]');
			for (var ti=0; ti<PData.getNumETmplts(); ti++)
				a.push(fDiv.find('.apply-tmplt-'+ti).is(':checked'));
			pState.f.push({ id: theF.attID, a: a, s: theF.f.getState() });
		});
		if (selFilter) {
			pState.s = { id: selFID, s: selFilter.getState() };
		}
		if (view1)
			pState.v1 = { l: view1.title(), s: view1.getState() };
		var sPrspctv = { id: id, l: label, n: note, s: pState };

// console.log("Perspective Save Data: "+JSON.stringify(sPrspctv));

		if (dest == 'local') {
			localPrspctvs.push(sPrspctv);
			localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
		} else if (dest == 'server') {
				// Send via AJAX -- if successful, add locally
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_save_prspctv',
					id: id,
					l: label,
					x: prspdata.e.id,
					n: note,
					s: JSON.stringify(pState)
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					if (data != '0')
						prspdata.p.push(sPrspctv);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			});
		}
		return dest;
	} // doSavePerspective()

	function clickSavePerspective(event)
	{
		var spDialog;
		var idExp = /[^\w\-]/;

			// Clear any previous input values
		jQuery('#save-psrctv-id').val('');
		jQuery('#save-psrctv-lbl').val('');
		jQuery('#save-psrctv-note').val('');

			// Make sure Browser has local storage capability
		if (!localStore) {
			jQuery('#save-prspctv-d-1').attr('disabled', 'disabled');
		}
			// If user not logged in, disable server capability
		if (!prspdata.add_prspctv) {
			jQuery('#save-prspctv-d-2').attr('disabled', 'disabled');
		}

		spDialog = jQuery("#dialog-save-prsrctv").dialog({
			width: 340,
			height: 350,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						var id = jQuery('#save-psrctv-id').val().trim();
							// Make sure ID correct format
						var idError = id.match(idExp);
						if (id.length == 0 || id.length > 20 || idError)
							idError = '#dialog-prspctv-id-badchars';
							// Make sure ID not already taken
						else if (getPerspective(id))
							idError = '#dialog-prspctv-id-used';
						if (idError) {
							var errDialog = jQuery(idError).dialog({
								width: 320,
								height: 210,
								modal: true,
								buttons: [{
									text: dlText.ok,
									click: function() {
										errDialog.dialog("close");
									}
								}]
							});
						} else {
							var saved = doSavePerspective(id);
							spDialog.dialog("close");

							if (saved == 'server') {
									// Calculate Embed value
								var embed = xhbtURL + '/?prspctv=' + id;

								jQuery('#save-psrctv-embed').val(embed);
								var embedDialog = jQuery("#dialog-prspctv-url").dialog({
									width: 480,
									height: 230,
									modal: true,
									buttons: [{
										text: dlText.ok,
										click: function() {
											embedDialog.dialog("close");
										}
									}]
								});
							} // saved on server
						} // no redundancy
					} // OK
				},
				{
					text: dlText.cancel,
					click: function() {
						spDialog.dialog("close");
					}
				}
			]
		});
		event.preventDefault();
	} // clickSavePerspective()

	function managePerspectives()
	{
		var mpDialog;
		var xData=[];
		var xDataDirty=false;

		function createList()
		{
				// Clear scroll areas and recreate
			var pList = jQuery('#prspctv-mlist');
			pList.empty();

				// Populate local list
			localPrspctvs.forEach(function(theP) {
				pList.append('<li data-type="l" data-id="'+theP.id+'"><span class="label">'+theP.l+'</span> <button class="del">'+dlText.del+
					'</button> <button class="edit">'+dlText.edit+'</button></li>');
			});

				// Get other Perspectives of other Exhibits (on this domain)
			for (var i=0; i<localStore.length; i++) {
				var xKey = localStore.key(i);
				if (xKey != prspdata.e.id) {
					var xItem = localStore.getItem(xKey);
					xData.push({ id: xKey, ps: JSON.parse(xItem) });
				}
			}

			xData.forEach(function(xEl, xI) {
				xEl.ps.forEach(function(pEl) {
					pList.append('<li data-type="x" data-xid="'+xEl.id+'" data-xindex="'+xI+'" data-id="'+
						pEl.id+'"><i class="label">'+pEl.l+'</i> <button class="del">'+dlText.del+
						'</button> <button class="edit">'+dlText.edit+'</button></li>');
				});
			});
		} // createList()

		createList();

			// Handle selection of item on Manage Perspective list
		jQuery('#prspctv-mlist').click(function(event) {
			if (event.target.nodeName == 'BUTTON') {	// Edit or Delete?
				var del = jQuery(event.target).hasClass('del');
				var parent = jQuery(event.target).parent();
				var t = parent.data('type');
				var id = parent.data('id');
				var pI;
// console.log("Del? "+del+"; type = "+t+"; id = "+id);
				if (del) {
					switch (t) {
					case 'l':
						pI = localPrspctvs.findIndex(function(theP) {
							return id == theP.id;
						});
						if (pI != -1) {
// console.log("Delete ID '"+id+"' at "+pI);
							localPrspctvs.splice(pI, 1);
							if (localPrspctvs.length == 0)
								localStore.removeItem(prspdata.e.id);
							else
								localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
						}
						break;
					case 'x':
						var xI = parent.data('xindex');
						var xEntry = xData[xI];
						pI = xEntry.ps.findIndex(function(theP) {
							return id == theP.id;
						});
						if (pI != -1) {
							xEntry.ps.splice(pI, 1);
							xDataDirty = true;
						}
						break;
					} // switch type
					parent.remove();
				} else {
					var pRec;

					switch (t) {
					case 'l':
						pRec = _.find(localPrspctvs, function(theP) {
							return id == theP.id;
						});
						break;
					case 'x':
						var xI = parent.data('xindex');
						var xEntry = xData[xI];
						pRec = _.find(xEntry.ps, function(theP) {
							return id == theP.id;
						});
						break;
					} // switch
					jQuery('#edit-psrctv-lbl').val(pRec.l);
					jQuery('#edit-psrctv-note').val(pRec.n);

					var epDialog = jQuery("#dialog-edit-prsrctv").dialog({
						width: 340,
						height: 270,
						modal: true,
						buttons: [
							{
								text: dlText.ok,
								click: function() {
									pRec.l = jQuery('#edit-psrctv-lbl').val();
									pRec.n = jQuery('#edit-psrctv-note').val();
									parent.find('.label').text(pRec.l);
									if (t == 'x')
										xDataDirty = true;
									else
										localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
									epDialog.dialog("close");
								}
							}, // OK
							{
								text: dlText.cancel,
								click: function() {
									epDialog.dialog("close");
								}
							}]});
				} // else edit
			} // if BUTTON
		});

		mpDialog = jQuery("#dialog-manage-prsrctv").dialog({
			width: 450,
			height: 350,
			modal: true,
			buttons: [{
					text: dlText.ok,
					click: function() {
						if (xDataDirty) {
							xData.forEach(function(xEntry) {
								if (xEntry.ps.length > 0)
									localStore.setItem(xEntry.id, JSON.stringify(xEntry.ps));
								else
									localStore.removeItem(xEntry.id);
							});
						}
						jQuery('#prspctv-mlist').off("click");
						mpDialog.dialog("close");
					} // OK
				}]
		});
	} // managePerspectives()

	function clickShowPerspective(event)
	{
			// Clear scroll areas and recreate
		var pList = jQuery('#prspctv-slist');
		pList.empty();

			// Populate server list
		prspdata.p.forEach(function(theP) {
			pList.append('<li data-src="server" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

			// Populate local list
		localPrspctvs.forEach(function(theP) {
			pList.append('<li data-src="local" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

		var bs = [{
					text: dlText.ok,
					click: function() {
						spDialog.dialog("close");
						var selItem = pList.find('li.selected');
						if (selItem.length) {
							var setP = selItem.data('id');
							doShowPerspective(setP);
							PState.set(PSTATE_READY);
						}
					} // OK
				},
				{
					text: dlText.cancel,
					click: function() {
						spDialog.dialog("close");
					}
				}];
		if (localStore)
			bs.push({text: dlText.manage,
					click: function() {
						spDialog.dialog("close");
						managePerspectives();
					}});

		var spDialog = jQuery("#dialog-show-prsrctv").dialog({
			width: 350,
			height: 350,
			modal: true,
			buttons: bs
		});
		event.preventDefault();
	} // clickShowPerspective()

	function clickGoHome(event)
	{
		window.location.href=prspdata.e.g.hurl;
		event.preventDefault();
	} // clickGoHome()


		// PURPOSE: Gather data about Filterable Attributes
	function prepFilterData()
	{
		prspdata.a.forEach(function(theAttribute) {
			switch (theAttribute.def.t) {
			case 'V':
			case 'T':
			case 'N':
			case 'D':
				jQuery('#filter-list').append('<li data-id="'+theAttribute.id+'">'+theAttribute.def.l+'</li>');
				break;
			}
		});
	} // prepFilterData()

	function clickFilterToggle(event)
	{
		jQuery(this).parent().next().slideToggle(400);
		event.preventDefault();
	} // clickFilterToggle()

	function clickFilterApply(event)
	{
		var head = jQuery(this).closest('div.filter-instance');
		if (head) {
			var fID = head.data('id');
			// var req = head.find('input.req-att').is(':checked');
			if (fID && fID != '') {
				var fRec;
				fRec = filters.find(function(fr) { return fr.id == fID; });
				if (fRec == null)	{ alert('Bad Filter ID '+fID); return; }
				fRec.f.isDirty(true);
				// fRec.f.isReq(true, req);
			}
		}
	} // clickFilterApply()

	function clickFilterDel(event)
	{
		var head = jQuery(this).closest('div.filter-instance');
		var fID = head.data('id');

		var fI, fRec;
		fI = filters.findIndex(function(fRec) { return fRec.id == fID; });
		if (fI == -1)	{ alert('Bad Filter ID '+fID); return; }

		fRec = filters[fI].f;
		fRec.teardown();

		filters.splice(fI, 1);
			// Deleted last filter in stack
		if (fI >= filters.length) {
			var endStream;
				// No filters left, reset ViewFrame data source
			if (filters.length == 0)
				endStream = topStream;
			else
				endStream = filters[fI-1].out;
			view0.setStream(endStream);
			if (view1)
				view1.setStream(endStream);
			jQuery('#btn-recompute').addClass('pulse');
		} else {
				// Output must be recomputed from successor on
			filters[fI].f.isDirty(true);
		}

			// Remove this DOM element
		head.remove();
		event.preventDefault();
	} // clickFilterDel()

	function doDelSelFilter()
	{
		if (selFilter != null) {
			selFilter.teardown();
			jQuery('div.filter-instance[data-id="0"]').empty();
			selFilter = null;
		}
	} // doDelSelFilter()

		// PURPOSE: Add a new filter to the stack
		// INPUT: 	fID = Attribute ID
		//			selector = true if filter for the selector
		//			apply = initial state of apply array (boolean for each Template)
		// RETURNS: The Filter object created
	function createFilter(fID, apply, selector)
	{
		var newID;

		if (selector) {
				// Remove any pre-existing selector filter
			doDelSelFilter();
			newID = 0;
		} else {
			do {
				newID = Math.floor((Math.random() * 1000) + 1);
				if (filters.findIndex(function(theF) { return theF.id == newID; }) != -1)
					newID = -1;
			} while (newID == -1);
		}

		var newFilter;
		var theAtt = PData.getAttID(fID);
		switch (theAtt.def.t) {
		case 'V':
			newFilter = new PFilterVocab(newID, theAtt);
			break;
		case 'T':
			newFilter = new PFilterText(newID, theAtt);
			break;
		case 'N':
			newFilter = new PFilterNum(newID, theAtt);
			break;
		case 'D':
			newFilter = new PFilterDates(newID, theAtt);
			break;
		}

		if (selector) {
			selFilter = newFilter;
			selFID = fID;

			var fh = _.template(document.getElementById('dltext-selector-head').innerHTML);
			var head = jQuery('div.filter-instance[data-id="0"]');
			head.append(fh({ title: newFilter.title() }));
			head.find('button.btn-filter-del').button({
						text: false, icons: { primary: 'ui-icon-trash' }
					}).click(doDelSelFilter);

		} else {
			var newFRec = { id: newID, attID: fID, f: newFilter, out: null };
			filters.push(newFRec);

				// Now create DOM structure and handle clicks
			var fh = _.template(document.getElementById('dltext-filter-head').innerHTML);
			jQuery('#filter-instances').append(fh({ newID: newID, title: newFilter.title(), apply: apTmStr }));

			var head = jQuery('div.filter-instance[data-id="'+newID+'"]');

				// Check each checkbox acoording to default settings, disable acc to Template appearance
			for (var i=0; i<PData.getNumETmplts(); i++) {
				var applier = head.find('.apply-tmplt-'+i);
				applier.prop('disabled', !theAtt.t[i]);
				applier.prop('checked', apply[i]);
				applier.click(clickFilterApply);
			}

			head.find('button.btn-filter-toggle').button({
						text: false, icons: { primary: 'ui-icon-carat-2-n-s' }
					}).click(clickFilterToggle);
			head.find('button.btn-filter-del').button({
						text: false, icons: { primary: 'ui-icon-trash' }
					}).click(clickFilterDel);

			jQuery('#btn-recompute').addClass('pulse');
		}

			// Allow Filter to insert required HTML
		newFilter.setup();
		return newFilter;
	} // createFilter()


	function clickNewFilter(event)
	{
		var applyDef = PData.getNumETmplts() == 1 ? [true] : [false, false, false, false];

			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
		var newFilterDialog;

		newFilterDialog = jQuery("#dialog-new-filter").dialog({
			height: 300,
			width: 350,
			modal: true,
			buttons: [
				{
					text: dlText.add,
					click: function() {
						var selected = jQuery("#filter-list li.selected");
						if (selected.length) {
							jQuery('#filter-instances').show(400);
							createFilter(selected.data("id"), applyDef, false);
						}
							// Remove click handler
						newFilterDialog.dialog("close");
					}
				},
				{
					text: dlText.cancel,
					click: function() {
							// Remove click handler
						newFilterDialog.dialog("close");
					}
				}
			]
		});

		event.preventDefault();
	} // clickNewFilter()


	function clickToggleFilters(event)
	{
		jQuery('#filter-instances').slideToggle(400);
		event.preventDefault();
	} // clickToggleFilters()


	function clickNewSelector(event)
	{
			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
		var newFilterDialog;

		newFilterDialog = jQuery("#dialog-new-filter").dialog({
			height: 300,
			width: 350,
			modal: true,
			buttons: [
				{
					text: dlText.add,
					click: function() {
						var selected = jQuery("#filter-list li.selected");
						if (selected.length) {
							jQuery('#selector-instance').show(400);
							createFilter(selected.data("id"), null, true);
						}
							// Remove click handler
						newFilterDialog.dialog("close");
					}
				},
				{
					text: dlText.cancel,
					click: function() {
							// Remove click handler
						newFilterDialog.dialog("close");
					}
				}
			]
		});

		event.preventDefault();
	} // clickNewSelector()


	function clickToggleSelector(event)
	{
		jQuery('#selector-instance').slideToggle(400);
		event.preventDefault();
	} // clickToggleSelector()

	function doApplySelector()
	{
		PState.set(PSTATE_PROCESS);

		var selList=[], mustCopy=false;
		if (selFilter != null && endStream != null) {
			selFilter.evalPrep();
			var relI=0, absI, rec;
			while (relI < endStream.l) {
				absI = endStream.s[relI++];
				rec = PData.getRecByIndex(absI);
				if (selFilter.eval(rec)) {
					selList.push(absI);
				}
			}
			selFilter.isDirty(false);
		}
// console.log("Selection: "+JSON.stringify(selList));

		PState.set(PSTATE_BUILD);
			// Which Views to send Selection? Assumed won't be checked if disabled
		if (jQuery('#selector-v0').is(':checked')) {
			mustCopy = view0.setSel(selList);
		}
		if (jQuery('#selector-v1').is(':checked')) {
			if (view1) {
				if (mustCopy)
					selList = selList.slice(0);
				view1.setSel(selList);				
			}
		}
	} // doApplySelector()

	function clickApplySelector(event)
	{
		doApplySelector();
		PState.set(PSTATE_READY);
		event.preventDefault();
	} // clickApplySelector()


		// PURPOSE: Attempt to show Perspective pID
		// RETURN:  false if error
	function doShowPerspective(pID)
	{
		function vizIndex(vID)
		{
			return prspdata.e.vf.findIndex(function(vf) {
				return vID == vf.l;
			});
		}

		var p = getPerspective(pID);
		if (p == null)
			return false;

// console.log("Show perspective: "+JSON.stringify(p));
		PState.set(PSTATE_PROCESS);

			// Clear current Filter Stack & Selector Filter
		filters.forEach(function(theF) {
			theF.f.teardown();
		});
		filters=[];
		jQuery('#filter-instances').empty();
		p.s.f.forEach(function(fRec) {
			var newF = createFilter(fRec.id, fRec.a, false);
			newF.setState(fRec.s);
		});
		jQuery('#filter-instances').hide();

		doDelSelFilter();
		if (p.s.s != null) {
			createFilter(p.s.s.id, null, true);
			selFilter.setState(p.s.s.s);
		}
		jQuery('#selector-instance').hide();

		var vI;

		vI = vizIndex(p.s.v0.l);
		if (view0) {
			view0.setViz(vI, false);
		} else {
			view0 = PViewFrame(0);
			view0.initDOM(vI);
		}
		view0.setState(p.s.v0.s);

		if (p.s.v1 != null) {
			vI = vizIndex(p.s.v1.l);
			if (view1) {
				view1.setViz(vI, false);
				view1.setState(p.s.v1.s);
			} else {
				view1 = PViewFrame(1);
				view1.initDOM(vI);
				view1.setState(p.s.v1.s);
				view0.resize();
			}
		} else {
			if (view1) {
				view1 = null;
				jQuery('#view-frame-1').remove();
				jQuery('#selector-v1').prop("disabled", true);
				view0.resize();
			}
		}

		setAnnote(p.n);

		jQuery('#selector-v0').prop('checked', p.s.a0);
		jQuery('#selector-v1').prop('checked', p.s.a1);

			// Don't recompute if data not loaded yet
		if (PData.ready() && topStream) {
			doRecompute();
			if (selFilter)
				doApplySelector();
		}

		return true;
	} // doShowPerspective()


		// IMMEDIATE EXECUTION
		//====================

	jQuery('body').addClass('waiting');

	PState.init();
	PMapHub.init(prspdata.m);

		// PURPOSE: Load all dynamic, language-independent resources
	(function () {
		var text;
		function loadFrag(domID, field)
		{
			text = document.getElementById(domID).innerHTML;
			dlText[field] = text.trim();
		} // loadFrag()

		loadFrag('dltext-showhideall', 'sha');
		loadFrag('dltext-ok', 'ok');
		loadFrag('dltext-cancel', 'cancel');
		loadFrag('dltext-seerec', 'seerec');
		loadFrag('dltext-close', 'close');
		loadFrag('dltext-add', 'add');
		loadFrag('dltext-manage', 'manage');
		loadFrag('dltext-delete', 'del');
		loadFrag('dltext-edit', 'edit');

		text = document.getElementById('dltext-month-names').innerHTML;
		months = text.trim().split('|');

			// Do we need to localize D3?
		if (text = document.getElementById('dltext-d3-local')) {
			if ((text = text.innerHTML) && (text.length > 1))
			{
				var locale = d3.locale(JSON.parse(text));
				localD3 = locale.timeFormat.multi([
					["%H:%M", function(d) { return d.getMinutes(); }],
					["%H:%M", function(d) { return d.getHours(); }],
					["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
					["%b %d", function(d) { return d.getDate() != 1; }],
					["%B", function(d) { return d.getMonth(); }],
					["%Y", function() { return true; }]
				]);
			}
		}
	}());

		// Remove any Perspective query string and prefix and trailing /
	xhbtURL = window.location.pathname;
	xhbtURL = xhbtURL.replace(/\&*prspctv=[\w\-]+/, '');
	xhbtURL = xhbtURL.replace(/\/$/, '');
	xhbtURL = xhbtURL.replace(/^\//, '');
	xhbtURL = window.location.protocol + "//" + window.location.host + "/" + xhbtURL;

		// Create string for apply Filters to Templates
	(function () {
		var at = _.template(document.getElementById('dltext-filter-template').innerHTML);
		var ts = [];
		prspdata.t.forEach(function(tmplt, ti) {
			ts.push(at({ ti: ti, tl: tmplt.def.l }));
		});
		apTmStr = ts.join('&nbsp;');
	}());

		// Ensure proper ending for creating URLs
	if (prspdata.site_url.charAt(prspdata.site_url.length-1) != '/')
		prspdata.site_url += '/';

	if (prspdata.e.g.l != '')
		jQuery('#title').text(prspdata.e.g.l);

		// Is there a local storage mechanism? Get local Perspectives if so
	try {
		var storage = window['localStorage'], x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		var lp = storage.getItem(prspdata.e.id);
		localStore = storage;
		if (lp.length > 0)
			localPrspctvs = JSON.parse(lp);
	} catch(e) {
	}
// console.log("localStorage? "+localStore != null);
// console.log("localPrspctvs = "+JSON.stringify(localPrspctvs));

		// Command Bar
	jQuery('#btn-about').button({icons: { primary: 'ui-icon-info' }, text: false })
			.click(clickAbout);
	jQuery('#btn-recompute').button({icons: { primary: 'ui-icon-refresh' }, text: false })
			.click(clickRecompute);
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickTog2nd);
	jQuery('#btn-show-prspctv').button({icons: { primary: 'ui-icon-image' }, text: false })
			.click(clickShowPerspective);
	jQuery('#btn-save-prspctv').button({icons: { primary: 'ui-icon-pencil' }, text: false })
			.click(clickSavePerspective);
	jQuery('#btn-annote').button({icons: { primary: 'ui-icon-comment' }, text: false })
			.click(clickAnnotation);

		// Are there Home settings?
	if (prspdata.e.g.hbtn.length > 0 && prspdata.e.g.hurl.length > 0) {
		jQuery('#home-title').text(prspdata.e.g.hbtn);
		jQuery('#btn-home').button({icons: { primary: 'ui-icon-home' }, text: false })
				.click(clickGoHome);
	} else {
		jQuery('#btn-home').remove();
	}

		// Handle selection of item on New Filter modal
	jQuery('#filter-list').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#filter-list li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Handle selection of item on Show Perspective list
	jQuery('#prspctv-slist').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#prspctv-list li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Filter Control Bar
	jQuery('#btn-new-filter').button({icons: { primary: 'ui-icon-search' }, text: false })
			.click(clickNewFilter);
	jQuery('#btn-toggle-filters').button({icons: { primary: 'ui-icon-arrow-2-n-s' }, text: false })
			.click(clickToggleFilters);

		// Selector Control Bar
	jQuery('#btn-new-selector').button({icons: { primary: 'ui-icon-search' }, text: false })
			.click(clickNewSelector);
	jQuery('#btn-toggle-selector').button({icons: { primary: 'ui-icon-arrow-2-n-s' }, text: false })
			.click(clickToggleSelector);
	jQuery('#btn-apply-selector').button({icons: { primary: 'ui-icon-arrowreturn-1-e' }, text: false })
			.click(clickApplySelector);

		// Inspector Modal
	jQuery('#btn-inspect-left').button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false });
	jQuery('#btn-inspect-right').button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false });

	prepFilterData();

		// Restore Perspective or create default?
	if (prspdata.show_prspctv.length == 0 || !doShowPerspective(prspdata.show_prspctv)) {
		view0 = PViewFrame(0);
		view0.initDOM(0);
		setAnnote('');
	}

		// Allow ViewFrames to handle changes in size
	jQuery(window).resize(function() {
		if (view0)
			view0.resize();
		if (view1)
			view1.resize();
	});

		// Intercept global state changes: data { pstate, component [0=global, 1=view1, 2=view2] }
	jQuery("body").on("prospect", function(event, data) {
			// ASSUMED: This won't be triggered until after Filters & Views set up
		if (data.pstate == PSTATE_PROCESS) {
			PState.set(PSTATE_PROCESS);
			doRecompute();
			if (selFilter)
				doApplySelector();
			PState.set(PSTATE_READY);
			jQuery('body').removeClass('waiting');
		}
	});

		// Init hub using config settings
	PState.set(PSTATE_LOAD);
	PData.init();
});

	// Interface between embedded YouTube player and code that uses it
	// This is called once iFrame and API code is ready
function onYouTubeIframeAPIReady()
{
		// Call saved function call
	if (widgetData.ytCall)
		widgetData.ytCall();
} // onYouTubeIframeAPIReady()