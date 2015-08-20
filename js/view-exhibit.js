// This file contains:
//		PVizModel abstract Class & implementations
//		PFilterModal abstract Class & implementations
//		PViewFrame Object
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

	// GLOBAL CONSTANTS
var EVENT_INSTANT = 1;			// Single instantaneous event (not Date range)
var EVENT_F_START = 2;			// Event has fuzzy start
var EVENT_F_END = 4;			// Event has fuzzy end

var PSTATE_INIT = 0;			// Internal initialization
var PSTATE_REQ = 1;				// Waiting for requested data
var PSTATE_PROCESS = 2;			// Processing data or handling command
var PSTATE_BUILD = 3;			// Building visuals
var PSTATE_READY = 4;			// Waiting for user

var D3FG_BAR_WIDTH = 25;		// D3 Graphs created for filters
var D3FG_MARGINS  = { top: 4, right: 7, bottom: 22, left: 30 };

var V_FLAG_LGND = 0x1;			// Uses Legend
var V_FLAG_SEL = 0x2;			// Can select individual Records
var V_FLAG_LOC = 0x4;			// Requires Location Attributes
var V_FLAG_SET = 0x8;			// Has an Options dialog

	// GLOBAL VARS
var TODAY = new Date();
var localD3;					// For localizing D3
var months;

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
		// All subclasses must implement the following:
	// this.flags()
	// this.setup()
	// this.render(stream)
	// this.setSel(absIDs)
	// this.getState()
	// this.setState(pData)
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

PVizModel.prototype.resize = function()
{
} // PVizModel.resize()

PVizModel.prototype.optionsModal = function()
{
} // PVizModel.optionsModal()


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
		parseInt(this.settings.zoom);
	else
		zoom = this.settings.zoom;

	// function resetMap()
	// {
	// 	self.lMap.setView([centerLat, centerLon], zoom);
	// } // resetMap()

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

	var zoomControl = L.control.zoom({position: 'topright'});
	zoomControl.addTo(this.lMap);

		// Reset button
	// var resetControl = L.control({position: 'topright'});
	// resetControl.onAdd = function (map) {
	// 	this._div = L.DomUtil.create('div', 'reset-control leaflet-bar');
	// 	this.update();
	// 	return this._div;
	// };
	// resetControl.update = function (props) {
	// 	this._div.innerHTML = '<span class="ui-icon ui-icon-arrowrefresh-1-e"></span>';
	// 	this._div.innerHTML = '<a class="reset-map" ><i class="fi-refresh"></i></a>';
	// };
	// resetControl.addTo(this.lMap);
	// jQuery('div.reset-control').click(resetMap);

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


		// Remove previous Markers
	mLayer.clearLayers();

	var lines = this.lineLayer;
	lines.clearLayers();

	var rad=this.settings.min;

	var numTmplts = PData.getNumETmplts();
	var i=0, aI, tI=0, tRec, tLClr, rec;
	var fAttID, fAtt, locAtts, featSet, pAttID, sAttID;
	var locData, fData, newMarker, s;

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
				if (fData = rec.a[fAttID]) {
					fData = PData.getAttLgndVal(fData, fAtt, featSet);
					if (fData) {
						s = self.isSel(aI);
						if (typeof locData[0] == 'number') {
							newMarker = L.circleMarker(locData,
								{	_aid: aI, weight: 1, radius: rad,
									fillColor: fData, color: s ? "#ff0000" : "#000",
									opacity: 1, fillOpacity: 1
								});
							if (cEntry)
								cEntry.c.push(locData);
						} else {
							if (locData.length == 2) {
								// TO DO: draw line
							} else {
								// TO DO: draw polygon
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
		mCache.sort(function(a,b) { return a.id.localeCompare(b.id); });
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
	return V_FLAG_LGND | V_FLAG_SEL;
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
	var featSet, rec, c, s;
	var hasC, cnt, datum, t, tDiv, tC;

	var thisFrame = jQuery(this.frameID);
	thisFrame.empty();

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
		if (datum = rec.a[fAttID]) {
			c = PData.getAttLgndRecs(datum, fAtt, featSet, false);

			if (c) {
				s = self.isSel(aI) ? ' obj-sel' : '';
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
				insert.append('<div class="card '+div+s+'" style="background-color:'+c.v+'" data-ai="'+aI+'">'+tDiv+t+'</div>');
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

	function checkSel(d)
	{
		return self.isSel(d.ai) ? 'recobj obj-sel' : 'recobj';
	} // checkSel()

		// Remove all previous icons
	this.gRecs.selectAll('svg.recobj').remove();

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
			if (fData = rec.a[fAttID]) {
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
		.append('svg').attr('class', checkSel)
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
		buttons: {
			OK: function() {
				d.dialog("close");
			},
			Cancel: function() {
				d.dialog("close");
			}
		}
	});
} // optionsModal()


// ===============================================
// VizTime: Class to visualize Records on Timeline

var VizTime = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);

	if (typeof this.settings.xLbl != 'number')
		this.settings.xLbl = parseInt(this.settings.xLbl);
} // VizTime

VizTime.prototype = Object.create(PVizModel.prototype);

VizTime.prototype.constructor = VizTime;

VizTime.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC;
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
	//              0 = total width (ViewFrame), 1 = outer svg-container, 2 = inner chart
	// NOTES:   Must account for margins of outer container (inc. scrollbar) and margins of inner container
	// TO DO: 	Make into getRects()?
VizTime.prototype.getWidths = function()
{
			// svgMargin is for space inside of outer container occupied by #svg-container
	var svgMargin = { top: 6, right: 22, bottom: 6, left: 6 };
			// chartMargin is for space inside of #svg-container occupied by timeline chart
	var chartMargin = { top: 4, right: 9, bottom: 4, left: 4 };
	var widths = [];
	var svgWidth;

	var curWidth = jQuery(this.frameID).width();

		// Total width of window
	widths.push(curWidth);
		// Width of svg-container
	svgWidth = curWidth - (svgMargin.left + svgMargin.right);
	widths.push(svgWidth);
		// Width of chart itself
	widths.push(svgWidth-(chartMargin.left + chartMargin.right));

		// Automatically recompute
	this.threshold  = widths[2] / (this.settings.xLbl*6.25);

	return widths;
} // getWidths()

VizTime.prototype.setup = function()
{
	var self = this;

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
									maxD = 12;
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
								maxD = 12;
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
									maxD = 31;
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

			// Size of instananeous event: 3% of total time period space
		self.instGap = (self.maxDate - self.minDate) * .03;
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
	} // makeDefs

	makeDefs();

		// Create further SVG elements (will resize later)
	var vI = this.vFrame.getIndex();

		// Clip all graphics to inner area of chart
	svg.append("clipPath")
		.attr("id", "tl-clip-"+vI)
		.append("rect")
		.attr("width", widths[2]);

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
		var band = {	id: bi, l: 0, t:0, h:0, w: widths[2],
						svgID: "#tl-b-"+vI+"-"+bi,
						tHt: 0, iHt: 0,
						xScale: null,
						yScale: function(t) { return t * band.tHt; },
						parts: [],
						g: null,
						labels: null, labelSVGs: null
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

		band.xScale = d3.time.scale();
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
			//             return self.months[d.getMonth()];
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
		self.cmpnts.push(axisDraw); // for timeline.redraw -- Need both??
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
// console.log("Which Date: "+JSON.stringify(l.whichDate(min,max)));
				return l.whichDate(min,max).getUTCFullYear();
				// ?? does not return proper value ??
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

	self.events=[];		// All event data
	self.lgBds=[];		// Date Legend Backgrounds: { s[tart], e[nd], t[top track #], h[eight], d[ata in Legend rec] }

	var numTracks=0;

		// Process each Template's data
	function procTmplts()
	{
		var numTmplts = PData.getNumETmplts();
		var tI=0, tRec, aI;
		var featSet, dAttID, dAtt, fData, dData;

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

				// Event records { s[tart], e[nd], ai, f[lags], c[olor data], l[abel], t[rack] }
			var te=[];

			for (var i=tRec.i; i<(tRec.i+tRec.n); i++) {
				aI = stream.s[i];

				rec = PData.getRecByIndex(aI);
				if (fData = rec.a[fAttID]) {
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
											d = 31;
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
							d = 31;
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
				// Only highlight for zoom band
			if (bi == 1 && self.isSel(d.ai)) {
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

			// NOTE: Only zoom band responds to click
		function clickEvent(d, i)
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
		allEs = d3.select(band.svgID).selectAll(".event").remove();

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
				// TO DO: How to contrast text color???  Create white label background??
			instants.append("text")
				.attr("class", "instantLbl")
				.attr("x", instLX)
				.attr("y", fPos)
				.style("font-size", fHt)
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
	function createBrush()
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
			};

			BrushHandles.prototype.height = function(h) {
				if (h == null) { return this._height; }
				this._height = h;
				this.mask.selectAll("rect").attr("height", h);
				return this;
			};

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
			};

			return BrushHandles;
		})();

		var band = self.bands[0];	// Place brush in top macro band

			// This calculation is not well supported by current JS Date
		// var openTime = self.minDate.getTime();
		// var timeSpan = self.maxDate - self.minDate;

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
				// d3.select(this).call(self.brush.extent(extent1));

				self.brush.extent(extent1);
				self.brushHandler.redraw();

					// Rescale top timeline(s) according to bottom brush
				macro = self.bands[1];
				macro.xScale.domain(extent1);
				macro.redraw();
			});

			// SVG area where brush will be created
		self.brushSVG = band.g.append("svg");

		self.brushHandler =
			new BrushHandler(self.brushSVG, band.h-1)
				.x(band.xScale)
				.redraw();

			// Create SVG component and connect to controller
		// self.brushSVG = band.g.append("svg")
		//     .attr("class", "brush")
		//     .call(self.brush);

		//     // Container is opaque rectangle
		// self.brushSVG.selectAll("rect")
		//     .attr("y", 0)
		//     .attr("height", band.h-1);
	} // createBrush()

	createBrush();

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
VizTime.prototype.resize = function()
{
	// TO DO
} // resize()

VizTime.prototype.teardown = function()
{
} // teardown()

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
	return V_FLAG_SEL;
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
		t = '<tr data-id="'+rec.id+'" data-ai='+aI;
		if (self.isSel(aI))
			t += ' class="obj-sel" ';
		t += '>';
		fAtts.forEach(function(attID) {
			datum = rec.a[attID];
			if (datum) {
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
	return V_FLAG_LGND | V_FLAG_SEL | V_FLAG_LOC;
} // usesLegend()

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
			if (aI && aI >= 0) {
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
	var insert, rec, datum, t, s, h;

	var order, oAtt, cAttID, cAtt, featSet, fAttID, fAtt, fData;
	var szAtt, szAttID, da, dt, bC;

	var vizDiv = jQuery(this.frameID);

	vizDiv.empty();

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
				if (datum) {
					fData = PData.getAttLgndRecs(datum, fAtt, featSet, false);
					if (fData) {
						t = rec.a[cAttID];
						if (t)
							t = PData.procAttTxt(cAttID, t);
						if (t)
						{
							if (szAttID) {
								s = rec.a[szAttID];
								if (s) {
									s = Math.floor(((s-szAtt.r.min)*dt)/da) + self.settings.min;
								} else
									s = self.settings.min;
							} else
								s = self.settings.min;
							h = self.isSel(oRec.i) ? ' obj-sel' : '';
							bC = fData.b ? ';background-color:black' : '';
							insert.append('<div class="recitem'+h+'" data-ai='+oRec.i+' style="color:'+fData.v+bC+';font-size:'+s+'px">'+t+'</div>');
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
	this.req 		= true;

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

	// PURPOSE: Either set or get setting if Filter value is required
	// RETURNS: true if Attribute is required by Filter, false if records without pass through
	// INPUT:   null if only retrieving state, else true or false
PFilterModel.prototype.isReq = function(setReq)
{
	if (setReq != null) {
		if (this.req != setReq)
			this.isDirty(true);
		this.req = setReq;
	}
	return this.dirty;
} // isReq

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
	this.findStr = this.insertPt().find('input.filter-text').val();
} // evalPrep()

PFilterText.prototype.eval = function(rec)
{
	var str = this.findStr;

	if (str == null || str == '')
		return true;

	var txt = rec.a[this.att.id];
	if (typeof txt == 'undefined') {
		if (this.req)
			return false;
		return true;
	}
	return txt.indexOf(str) != -1;
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
	if (typeof v == 'undefined') {
		if (this.req)
			return false;
		return true;
	}
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
				lEntry.l+'</div>';
		if (lEntry.v.charAt(0) == '#') {
			t += '<div class="filter-vocab-bar" style="background-color:'+lEntry.v+'"></div>';
		}
		lEntry.z.forEach(function(zEntry, zI) {
			t += '<div class="filter-vocab-row" data-id="'+zEntry.l+'"><input type="checkbox" value="min-use" checked="checked">'+
				zEntry.l+'</div>';
			if (zEntry.v == null || zEntry.v == '') {
				if (lEntry.v.charAt(0) == '#')
					t += '<div class="filter-vocab-bar" style="background-color:'+lEntry.v+'"></div>';
			} else if (zEntry.v.charAt(0) == '#') {
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
	if (typeof num == 'undefined') {
		if (this.req)
			return false;
		return true;
	}

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

	this.rCats = PData.getRCats(this.att);
		// Lack of range bounds? Create generic HTML input boxes, can't create range sliders
	if (this.rCats == null) {
		var fh = _.template(document.getElementById('dltext-filter-number').innerHTML);
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
		var brush;

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
			var extent0 = brush.extent();
			var extent1 = [Math.floor(extent0[0]), Math.floor(extent0[1])];
				// if empty when rounded, use floor & ceil instead
			if (extent1[0] >= extent1[1]) {
				extent1[0] = Math.floor(extent0[0]);
				extent1[1] = Math.ceil(extent0[1]);
			}
				// must enclose at least 1 graph!
			extent1[1] = Math.max(extent1[1], extent1[0]+1);
			d3.select(this).transition()
				.call(brush.extent(extent1));

			self.min = self.rCats[extent1[0]].min;
			self.max = self.rCats[extent1[1]-1].max;
			self.isDirty(true);
		} // brushended()

		var innerW = this.rCats.length*D3FG_BAR_WIDTH;
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
			.attr("x", function(d, i) { return xScale(i); })
			.attr("y", function(d) { return yScale(100); })
			.attr("fill", function(d) { return d.c; })
			.attr("height", function(d) { return innerH - yScale(100); })
			.attr("width", D3FG_BAR_WIDTH-2);

		brush = d3.svg.brush()
			.x(xScale)
			.extent([0, this.rCats.length])
			.on("brushend", brushended);

		var brushg = chart.append("g")
			.attr("class", "brush")
			.call(brush);
		brushg.selectAll("rect")
			.attr("y", 0)
			.attr("height", innerH);
		brushg.selectAll(".resize")
			.append("path")
			.attr("d", resizePath);
	}
} // setup()


// ==============================================
// PFilterDates: Class to filter Dates Attributes

var PFilterDates = function(id, attRec)
{
	PFilterModel.call(this, id, attRec);
} // PFilterDates()

PFilterDates.prototype = Object.create(PFilterModel.prototype);

PFilterDates.prototype.constructor = PFilterDates;

PFilterDates.prototype.evalPrep = function()
{
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
	if (typeof d == 'undefined') {
		if (this.req)
			return false;
		return true;
	}
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
		if (e < this.min || s >= this.max)
			return false;
		return true;
	}
} // eval()

PFilterDates.prototype.setup = function()
{
	var self = this;

	this.rCats = PData.getRCats(this.att);
		// Set defaults
	this.useMin = this.useMax = true;
	this.min = this.rCats[0].min;
	this.max = this.rCats[this.rCats.length-1].max;

	var innerH = 80 - D3FG_MARGINS.top - D3FG_MARGINS.bottom;
	var brush;

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
		var extent0 = brush.extent();
		var extent1 = [Math.floor(extent0[0]), Math.floor(extent0[1])];
			// if empty when rounded, use floor & ceil instead
		if (extent1[0] >= extent1[1]) {
			extent1[0] = Math.floor(extent0[0]);
			extent1[1] = Math.ceil(extent0[1]);
		}
			// must enclose at least 1 graph!
		extent1[1] = Math.max(extent1[1], extent1[0]+1);
		d3.select(this).transition()
			.call(brush.extent(extent1));

		self.min = self.rCats[extent1[0]].min;
		self.max = self.rCats[extent1[1]-1].max;
		self.isDirty(true);
	} // brushended()

	var innerW = this.rCats.length*D3FG_BAR_WIDTH;
	var xScale = d3.scale.linear().domain([0, this.rCats.length])
		.rangeRound([0, innerW]);
	var yScale = d3.scale.linear().domain([0,100]).range([innerH, 0]);

	var rScale = d3.scale.ordinal().rangeRoundBands([0, innerW]);
	rScale.domain(this.rCats.map(function(rc) { return rc.l; }));
	var xAxis = d3.svg.axis().scale(rScale).orient("bottom");
	var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);

	var insert = this.insertPt();
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
		.attr("x", function(d, i) { return xScale(i); })
		.attr("y", function(d) { return yScale(100); })
		.attr("fill", function(d) { return d.c; })
		.attr("height", function(d) { return innerH - yScale(100); })
		.attr("width", D3FG_BAR_WIDTH-2);

	brush = d3.svg.brush()
		.x(xScale)
		.extent([0, this.rCats.length])
		.on("brushend", brushended);

	var brushg = chart.append("g")
		.attr("class", "brush")
		.call(brush);
	brushg.selectAll("rect")
		.attr("y", 0)
		.attr("height", innerH);
	brushg.selectAll(".resize")
		.append("path")
		.attr("d", resizePath);
} // setup()


// ========================================================================
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)

// INPUT: 	vfIndex = index for this visualization frame (0 or 1)

function PViewFrame(vfIndex)
{
	var instance = { };			// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var state = PSTATE_INIT;	// One of PSTATE_
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
		createViz(newSelIndex);
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		if (vizModel.flags() & V_FLAG_LGND) {
			jQuery(getFrameID()+' div.lgnd-container').toggle('slide', {direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()


		// PURPOSE: Open Inspector modal for current selection
	function clickOpenSelection(event)
	{
		var recSel=null;
		var rec;

		if (vizModel)
			recSel = vizModel.getSel();
		if (recSel == null || recSel.length == 0)
			return;

		var inspector;
		var i=0;

		function inspectShow()
		{
			var recAbsI = recSel[i];
			rec = PData.getRecByIndex(recAbsI);
			var title = ' '+rec.l+' ('+(i+1)+'/'+recSel.length+') ';
			jQuery('#inspect-name').text(title);
				// Which template type?
			var tI = PData.aIndex2Tmplt(recAbsI);
				// Show all data
			var container = jQuery('#inspect-content');
			container.empty();
// console.log("Show atts: "+JSON.stringify(prspdata.e.i.modal.atts[tI]));
			prspdata.e.i.modal.atts[tI].forEach(function(attID) {
				var attVal = PData.getRecAtt(recAbsI, attID, false);
// console.log("AttID: "+attID+"; val: "+attVal);
				if (attVal) {
					var theAtt = PData.getAttID(attID);
					var html = '<div><span class="att-label">'+theAtt.def.l+':</span> '+attVal+'</div>';
					container.append(html);
				}
			});
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

			// Show first item
		inspectShow();
		jQuery('#btn-inspect-left').click(inspectLeft);
		jQuery('#btn-inspect-right').click(inspectRight);

			// TO DO: Determine size based on extra widgets
		inspector = jQuery("#dialog-inspector").dialog({
			height: 300,
			width: 400,
			modal: true,
			buttons: {
				'See Record': function() {
					window.open(prspdata.site_url+'?p='+rec.wp, '_blank');
				},
				Close: function() {
					jQuery('#btn-inspect-left').off("click");
					jQuery('#btn-inspect-right').off("click");
					inspector.dialog("close");
				}
			}
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

		// PURPOSE: Hide/show the annotation for this View Frame
	function clickAnnotation(event)
	{
		jQuery(getFrameID()+' div.annote').toggle('slide', {direction: "right" });
		event.preventDefault();
	} // clickAnnotation()

		// PURPOSE: Turn on or off all feature Attributes for tmpltIndex
	function doShowHideAll(tmpltIndex, show)
	{
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', show);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
// console.log("Locate attribute "+lID+" for template "+tmpltIndex+", set to "+show);
	} // doLocateSelect()


		// PURPOSE: Make vIndex the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
// console.log("Locate attribute "+lID+" only for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate input.lgnd-entry-check').prop('checked', false);
			// Just reselect this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate[data-id="'+lID+'"] input.lgnd-entry-check').prop('checked', true);
	} // doLocateSelect()


		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
// console.log("Feature attribute "+vIndex+" for template "+tmpltIndex+", set to "+show);
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
// console.log("Feature attribute "+vIndex+" only selected for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
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
					// TO DO: Set busy cursor
				vizModel.render(datastream);				
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

		var group = jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
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
	} // setLegendFeatures()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vIndex is index in Exhibit array
	function createViz(vIndex)
	{
		var theView = PData.getVizIndex(vIndex);

			// Remove current viz content
		if (vizModel)
			vizModel.teardown();

		jQuery(getFrameID()+' div.viz-content div.viz-result').empty();

		switch (theView.vf) {
		case 'Map':
			vizModel = new VizMap(instance, theView.c);
			break;
		case 'Cards':
			vizModel = new VizCards(instance, theView.c);
			break;
		case 'Pinboard':
			vizModel = new VizPinboard(instance, theView.c);
			break;
		case 'Timeline':
			vizModel = new VizTime(instance, theView.c);
			break;
		case 'Tree':
			break;
		case 'Flow':
			break;
		case 'Directory':
			vizModel = new VizDirectory(instance, theView.c);
			break;
		case 'TextStream':
			vizModel = new VizTextStream(instance, theView.c);
			break;
		}
		vizSelIndex = vIndex;
		var flags = vizModel.flags();

			// Does Viz support Legend at all?
		if (flags & V_FLAG_LGND) {
			jQuery(getFrameID()+' .hslgnd').button("enable");
				// Clear out previous Legend
				// remove all previous locate Attributes
			var lgndCntr = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll');
			lgndCntr.empty();

				// Create Legend sections for each Template
			prspdata.e.g.ts.forEach(function(tID, tIndex) {
				var tmpltDef = PData.getTmpltID(tID);
					// Insert locate attributes into Legends
				var locAtts = vizModel.getLocAtts(tIndex);
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
					var attSelection = vizModel.getFeatureAtts(tIndex);
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
					jQuery(newTLegend).append('<div class="lgnd-entry lgnd-sh"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>Hide/Show All</div><div class="lgnd-group"></div>');
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
			jQuery(getFrameID()+' div.lgnd-container').show();
		} else {
			jQuery(getFrameID()+' .hslgnd').button("disable");
				// Just hide Legend
			jQuery(getFrameID()+' div.lgnd-container').hide();
		}

			// Enable or disable corresponding Selector Filter 
		var c = jQuery('#selector-v'+vfIndex);
		if (flags & V_FLAG_SEL) {
			jQuery(getFrameID()+' .xsel').button("enable");
			c.removeAttr("disabled");
			c.prop('checked', true);
		} else {
			jQuery(getFrameID()+' .xsel').button("disable");
			c.attr("disabled", true);
			c.prop('checked', false);
		}

			// Does Viz have an Options dialog?
		if (flags & V_FLAG_SET) {
			jQuery(getFrameID()+' .vopts').button("enable");
		} else {
			jQuery(getFrameID()+' .vopts').button("disable");
		}

		vizModel.setup();
		doSelBtns(false);

		if (datastream)
			vizModel.render(datastream);		
	} // createViz()


	// INSTANCE METHODS
	//=================

	instance.getFrameID = getFrameID;

	instance.getIndex = function()
	{
		return vfIndex;
	};

		// PURPOSE: Initialize basic DOM structure for ViewFrame
	instance.initDOM = function()
	{
		var viewDOM = document.getElementById('dltext-viewframe-dom').innerHTML;
		jQuery('#viz-display-frame').append('<div id="view-frame-'+vfIndex+'">'+viewDOM+'</div>');

		var head = jQuery(getFrameID()+' div.view-control-bar select.view-viz-select');
			// Set Dropdown to View names
		prspdata.e.vf.forEach(function(theVF, i) {
			var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
			head.append(optionStr);
		});
		head.change(selectChangeViz);

			// Hook control bar Icon buttons
		head = jQuery(getFrameID()+' div.view-control-bar button:first');
		head.button({icons: { primary: 'ui-icon-bookmark' }, text: false })
				.click(clickShowHideLegend).next()
				.button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(clickOpenSelection).next()
				.button({icons: { primary: 'ui-icon-cancel' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-gear' }, text: false })
				.click(clickVizControls).next()
				.button({icons: { primary: 'ui-icon-comment' }, text: false })
				.click(clickAnnotation).next();

		head = jQuery(getFrameID()+' div.viz-content div.lgnd-container');
		head.click(clickInLegend);

		jQuery(getFrameID()+' div.annote').hide();

			// Create first VF by default
		createViz(0);

		state = PSTATE_REQ;
	}; // initDOM()


		// RETURNS: Array of currently selected locate Attribute IDs for tIndex
	instance.getSelLocAtts = function(tIndex)
	{
		var attIDs = [];
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
							tIndex+'"] div.lgnd-locate input:checked');
		boxes.each(function() {
			var attID = jQuery(this).parent().data('id');
			attIDs.push(attID);
		});
		return attIDs;
	}; // getSelLocAtts()


		// RETURNS: Array of indices of currently selected feature Attribute IDs for tIndex
		// NOTE: 	Indices are in dot notation for 2ndary-level (x.y)
	instance.getSelFeatAtts = function(tIndex)
	{
		var attIndices = [], attIndex, i;
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-template[data-index="'+
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
	}; // getSelFeatAtts()


		// RETURNS: Attribute ID selected on Legend for tIndex
	instance.getSelLegend = function(tIndex)
	{
		return legendIDs[tIndex];
	} // getSelLegend()


	instance.getState = function()
	{
		return state;
	} // getState()

		// PURPOSE: Called by external agent when new datastream is available for viewing
		// ASSUMED: Caller has already set busy cursor
		// TO DO: 	Check and set frameState
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
	} // resize

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
// TO DO: 	Change LOAD_DATA_CHUNK to Option setting passed by prspdata


var PData = (function () {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;
	var dltextFrom;
	var dltextTo;
	var dltextApprox;
	var dltextNow;

	// INTERNAL VARIABLES
	// ==================

	var recs = [];				// "head" array of all Records, one entry per Template type
									// Corresponding to prspdata.t
									// { n = # loaded, i = initial index for these records, d = data array }
	var recsCount=0;				// Total number of Records


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
			jQuery('#btn-recompute').addClass('pulse');
			setTimeout(function(){ jQuery('#loading-message').hide(); }, 1000);
			jQuery("body").trigger("prospect", { pstate: PSTATE_PROCESS, component: 0 });
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
						cmp = rec.id.localeCompare(recID);

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
						cmp = rec.id.localeCompare(recID);

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
				cmp = prspdata.a[pos].id.localeCompare(attID);

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
					if (lE.d.min) {
						if (lE.d.min <= val) {
							if (lE.d.max) {
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
				cmp = att.x[pos].l.localeCompare(val);

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
		objDate: function(field, m, d) {
			if (typeof field.m != 'undefined') {
				m = field.m;
				if (typeof field.d != 'undefined') {
					d = field.d;
				}
			}
			return PData.date3Nums(field.y, m, d);
		}, // objDate()

			// PURPOSE: Create Date by parsing string
		parseDate: function(str, m, d)
		{
			if (str == 'open')
				return TODAY;

			var cmpts = str.split('-');
			var y = parseInt(cmpts[0]);
			if (cmpts.length > 1) {
				m = parseInt(cmpts[1]);
				if (cmpts.length == 3)
					d = parseInt(cmpts[2]);
			}

			return PData.date3Nums(y, m, d);
		}, // parseDate()


			// PURPOSE: Return array of range categories for facet att
			// INPUT: 	Complete Attribute definition <att>
			// RETURNS: range category array = { l[abel], c[olor], min, max },
			//				or null if range categories not possible (lack of bounds or not defined)
			// ASSUMES: Only called for Number and Dates types
			//			Date range has minimum year
			//			JS Data creation deals with “spillover” values
			// NOTES: 	To qualify for a Legend category, a range category only needs to start within it
			//			A range category with no Legend match is assigned color black
			//			max value is exclusive (must be less than, not equal!)
			// TO DO: 	Handle case that scale of max-min and g would be too large ??
		getRCats: function(att)
		{
			var rcs = [];
			switch (att.def.t) {
			case 'N':
					// Can't create range category unless both bounds provided
				if (typeof att.r.min == 'undefined' || typeof att.r.max == 'undefined')
					return null;
				var inc = Math.pow(10, att.r.g);
				var curV = att.r.min, lI=0, curL;
				if (att.l.length > 0)
					curL = att.l[0];
				while (curV <= att.r.max) {
					var rCat = { l: curV.toString() };
						// Advance to the relevant legend category
					while (lI < att.l.length && curL.d.max && curV > curL.d.max) {
						curL = att.l[++lI];
					}
						// Is current range category before current legend category?
					if (att.l.length == 0 || curV < curL.d.min) {
						rCat.c = '#000000';

						// Does it occur beyond last category?
					} else if (lI == att.l.length) {
						rCat.c = '#000000';

						// Does it start within current category (inc one w/o max bound)
					} else if (typeof curL.d.max == 'undefined' || curV <= curL.d.max) {
						rCat.c = curL.v;

					} else {
						rCat.c = '#000000';
					}
					rCat.min = curV;
					curV += inc;
					rCat.max = curV;
					rcs.push(rCat);
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
					if (typeof field.y == 'undefined') {
						return TODAY;
					} else {
						return makeDate(field.y, 12, 31, field);
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
					var rCat = { };
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

			// PURPOSE: Return count of records with values in range categories defined in getRCats
			// INPUT: 	att = Complete Attribute definition
			//			rCats = array generated by getRCats
			//			stream = datastream
			// RETURNS: Array of counts corresponding to array returned by getRCats
			// NOTES: 	In case of Vocabulary, returns sorted list of { l[abel], c[ount] }
		getRCnts: function(att, rCats, stream)
		{
				// TO DO
			switch (att.def.t) {
			case 'N':
				break;
			case 'D':
				break;
			case 'V':
				break;
			}
		}, // getRCnts()

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
		// 		ord.sort(function(a,b) { return a.v.localeCompare(b.v); });
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
				ord.sort(function(a,b) { return a.v.localeCompare(b.v); });
				break;
			case 'D':
			case 'N':
				ord.sort(function(a,b) { return a.v - b.v; });
				break;
			// case 'D':
			// 	ord.sort(function(a,b) {
			// 		var av = a.v.valueOf(), bv = b.v.valueOf();
			// 		return av - bv;
			// 	});
			// 	break;
			}

			return ord;
		}, // orderTBy()

			// RETURNS: View configuration data for vIndex
		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		} // getVizIndex()
	} // return
})(); // PData


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services, manage filters, …

// USES: 	jQuery, jQueryUI, PData, PViewFrame
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// VARIABLES
		//==========
	var state = PSTATE_INIT; // current state of Prospect web app
	var view0;				// Primary viewFrame
	var view1;				// Secondary

	var filters = [];		// Filter Stack: { id, f [PFilterModel], out }
	var selFilter = null;	// Selector Filter

	var topStream;			// Top-level IndexStream (before Filters)
	var endStream;			// Final resulting IndexStream (after Filters)

		// FUNCTIONS
		//==========

	function doRecompute()
	{
console.log("Start recompute");
		state = PSTATE_BUILD;

			// Recompute must clear current selection
		view0.clearSel();
		if (view1)
			view1.clearSel();

		if (topStream == null)
			topStream = PData.newIndexStream(true);
		endStream = topStream;

			// Go through filter stack -- find 1st dirty and recompute from there
		var started=false, fI, theF;
		for (fI=0; fI<filters.length; fI++) {
			theF = filters[fI];
				// If we've started, evaluate and propagate
			if (started || theF.f.isDirty(null)) {
				started = true;
				theF.f.evalPrep();
				var newStream = PData.newIndexStream(false);
				var relI=0, absI, rec;
				var tI=0, tRec=endStream.t[0], tRn=0;
					// Must keep absolute indices and template params updated!
				while (relI < endStream.l) {
						// Advance until we get to current Template rec
					while (tRec.n == 0 || (tRec.i+tRec.n) == relI) {
						newStream.t.push({ i: (newStream.l-tRn), n: tRn });
						tRn = 0;
						tRec = endStream.t[++tI];
					}
					absI = endStream.s[relI++];
					rec = PData.getRecByIndex(absI);
					if (theF.f.eval(rec)) {
						newStream.s[newStream.l++] = absI;
						tRn++;
					}
				}
					// push out any remaining Template recs
				while (tI++ < PData.getNumETmplts()) {
					newStream.t.push( { i: (newStream.l-tRn), n: tRn } );
					tRn = 0;
				}
				theF.f.isDirty(false);
				theF.f.out = newStream;
				endStream = newStream;
console.log("Output stream ["+fI+"]: "+JSON.stringify(newStream));
			} else
				endStream = theF.f.out;
		}
console.log("Filtering complete: visualization beginning");
		view0.showStream(endStream);
		if (view1)
			view1.showStream(endStream);
		jQuery('#btn-recompute').removeClass('pulse');
console.log("Visualization complete");
		state = PSTATE_READY;
	} // doRecompute()

		// TO DO: Check and set frameState; make cursor busy during compute!
	function clickRecompute(event)
	{
		doRecompute();
		event.preventDefault();
	} // clickRecompute()


		// PURPOSE: Add 2nd window if not already there; remove if so
		// TO DO: 	Set state
	function clickTog2nd()
	{
		if (view1 != null) {
			jQuery('#view-frame-1').remove();
			view1 = null;
			jQuery('#selector-v1').button("disable");
		} else {
			view1 = PViewFrame(1);
			view1.initDOM();
			view1.showStream(endStream);
			jQuery('#selector-v1').button("enable");
		}
		view0.resize();
	} // clickTog2nd()

	// function doSetLayout(lIndex)
	// {
	// } // doSetLayout()


	// function clickSetLayout(event)
	// {
	// 		// Clear previous selection
	// 	jQuery("#layout-choices img").removeClass("selected");
	// 	var setLayoutDialog;

	// 	setLayoutDialog = jQuery("#dialog-set-layout").dialog({
	// 		height: 250,
	// 		width: 300,
	// 		modal: true,
	// 		buttons: {
	// 			Set: function() {
	// 				var selected = jQuery("#layout-choices img.selected");
	// 				if (selected.length) {
	// 					doSetLayout(selected.data("index"));
	// 				}
	// 				setLayoutDialog.dialog("close");
	// 			},
	// 			Cancel: function() {
	// 				setLayoutDialog.dialog("close");
	// 			}
	// 		},
	// 		close: function() {
	// 		}
	// 	});

	// 	event.preventDefault();
	// } // clickSetLayout()


	function clickAbout(event)
	{
		var aboutDialog;

		aboutDialog = jQuery("#dialog-about").dialog({
			height: 250,
			width: 350,
			modal: true,
			buttons: {
				OK: function() {
					aboutDialog.dialog("close");
				}
			}
		});

		event.preventDefault();
	} // clickAbout()


	function clickPerspectives(event)
	{
		event.preventDefault();
	} // clickPerspectives()


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

	function clickFilterDirty(event)
	{
		var head = jQuery(this).closest('div.filter-instance');
		if (head) {
			var fID = head.data('id');
			var req = head.find('input.req-att').is(':checked');
			if (fID && fID != '') {
				var fRec;
				fRec = filters.find(function(fr) { return fr.id == fID; });
				if (fRec == null)	{ alert('Bad Filter ID '+fID); return; }
				fRec.f.isReq(req);
			}
		}
	} // clickFilterDirty()

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
	function createFilter(fID, selector)
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
			newFilter.isReq(true);
			selFilter = newFilter;

			var fh = _.template(document.getElementById('dltext-selector-head').innerHTML);
			var head = jQuery('div.filter-instance[data-id="0"]');
			head.append(fh({ title: newFilter.title() }));
			head.find('button.btn-filter-del').button({
						text: false, icons: { primary: 'ui-icon-trash' }
					}).click(doDelSelFilter);

		} else {
			var newFRec = { id: newID, f: newFilter, out: null };
			filters.push(newFRec);

				// Now create DOM structure and handle clicks
			var fh = _.template(document.getElementById('dltext-filter-head').innerHTML);
			jQuery('#filter-instances').append(fh({ newID: newID, title: newFilter.title() }));

			var head = jQuery('div.filter-instance[data-id="'+newID+'"]');
			head.find('button.btn-filter-toggle').button({
						text: false, icons: { primary: 'ui-icon-carat-2-n-s' }
					}).click(clickFilterToggle);
			head.find('button.btn-filter-del').button({
						text: false, icons: { primary: 'ui-icon-trash' }
					}).click(clickFilterDel);
			head.find('input.req-att').click(clickFilterDirty);

			jQuery('#btn-recompute').addClass('pulse');
		}

			// Allow Filter to insert required HTML
		newFilter.setup();
	} // createFilter()


	function clickNewFilter(event)
	{
			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
		var newFilterDialog;

		newFilterDialog = jQuery("#dialog-new-filter").dialog({
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				Add: function() {
					var selected = jQuery("#filter-list li.selected");
					if (selected.length) {
						jQuery('#filter-instances').show(400);
						createFilter(selected.data("id"), false);
					}
						// Remove click handler
					newFilterDialog.dialog("close");
				},
				Cancel: function() {
						// Remove click handler
					newFilterDialog.dialog("close");
				}
			},
			close: function() {
			}
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
			buttons: {
				Add: function() {
					var selected = jQuery("#filter-list li.selected");
					if (selected.length) {
						jQuery('#selector-instance').show(400);
						createFilter(selected.data("id"), true);
					}
						// Remove click handler
					newFilterDialog.dialog("close");
				},
				Cancel: function() {
						// Remove click handler
					newFilterDialog.dialog("close");
				}
			},
			close: function() {
			}
		});

		event.preventDefault();
	} // clickNewSelector()


	function clickToggleSelector(event)
	{
		jQuery('#selector-instance').slideToggle(400);
		event.preventDefault();
	} // clickToggleSelector()

	function clickApplySelector(event)
	{
		var selList = [], mustCopy=false;
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

			// Which Views to send Selection?
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

		event.preventDefault();
	} // clickApplySelector()

	function localize()
	{
		var text;

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
	} // localize()


		// IMMEDIATE EXECUTION
		//====================

	PMapHub.init(prspdata.m);

		// Ensure proper ending for creating URLs
	if (prspdata.site_url.charAt(prspdata.site_url.length-1) != '/')
		prspdata.site_url += '/';

	if (prspdata.e.g.l != '')
		jQuery('#title').text(prspdata.e.g.l);

	localize();

		// Command Bar
	jQuery('#btn-about').button({icons: { primary: 'ui-icon-info' }, text: false })
			.click(clickAbout);
	jQuery('#btn-recompute').button({icons: { primary: 'ui-icon-refresh' }, text: false })
			.click(clickRecompute);
	// jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
	// 		.click(clickSetLayout);
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickTog2nd);
	jQuery('#btn-perspectives').button({icons: { primary: 'ui-icon-note' }, text: false })
			.click(clickPerspectives);

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

		// Create options on Layout modal
	// jQuery('#layout-choices').append('<img src="'+prspdata.assets+'layout1.jpg" data-index="0"/><img src="'+
	// 		prspdata.assets+'layout2.jpg" data-index="1"/><img src="'+prspdata.assets+'layout3.jpg" data-index="2"/>');

		// Handle selection of item on Set Layout modal
	jQuery('#layout-choices').click(function(event) {
		if (event.target.nodeName == 'IMG') {
			jQuery("#layout-choices img").removeClass("selected");
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

	state = PSTATE_REQ;

		// Intercept global state changes: data { pstate, component [0=global, 1=view1, 2=view2] }
	jQuery("body").on("prospect", function(event, data) {
		if (data.pstate = PSTATE_PROCESS) {
			state = PSTATE_PROCESS;
				// TO DO: Check views for ready state until they can render -- use timer
			doRecompute();
		}
	});

		// Allow ViewFrames to handle changes in size
	jQuery(window).resize(function() {
		if (view0)
			view0.resize();
		if (view1)
			view1.resize();
	});

		// Initial primary visualization frame
	view0 = PViewFrame(0);
	view0.initDOM();

		// Init hub using config settings
	PData.init();
});
