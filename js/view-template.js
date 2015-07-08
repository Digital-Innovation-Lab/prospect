// This file contains:
//		PVizModel abstract Class
//		PViewFrame Object
//		PDataHub Module for handling data
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
//				e = Exhibit definition { id, g, vf, w, p }

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
	// this.usesLegend()
	// this.getLocAtts(tIndex)
	// this.getFeatureAtts(tIndex)
	// this.teardown()
	// this.canSel
	// this.isSel(absI)
	// this.getSel()
	// this.toggleSel(absI)
	// this.clearSel()
		// All subclasses must implement the following:
	// this.setup()
	// this.render(IndexStream)
	// this.setSel(absIDs)
	// this.getState()
	// this.setState(pData)
} // PVizModel


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
	var i = _.sortedIndex(this.recSel, absI);
	if (this.recSel[i] == absI) {
		this.recSel.splice(i, 1);
		return false;
	} else {
		this.recSel.splice(i, 0, absI);
		return true;
	}
} // toggleSel()

	// PURPOSE: Clear selection list (and remove visual indications of selection)
PVizModel.prototype.clearSel = function()
{
	this.recSel = [];
} // clearSel()

	// PURPOSE: Return true if this VizModel supports selection of individual Records
	//				(rather than aggregate representation/interaction implying the selection)
PVizModel.prototype.canSel = function()
{
	return true;
} // canSel()

PVizModel.prototype.usesLegend = function()
{
	return false;
} // usesLegend()

PVizModel.prototype.getLocAtts = function(tIndex)
{
	return [];
} // PVizModel.getLocAtts

PVizModel.prototype.getFeatureAtts = function(tIndex)
{
	return [];
} // PVizModel.getFeatureAtts

PVizModel.prototype.teardown = function()
{
} // PVizModel.teardown


// ===================================
// VizMap: Class to visualize GIS maps


var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // ViewMap

VizMap.prototype = Object.create(PVizModel.prototype);

VizMap.prototype.constructor = VizMap;

VizMap.prototype.usesLegend = function()
{
	return true;
} // usesLegend()

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
		// Create instance of Leaflet
	var centerLat = parseFloat(this.settings.clat);
	var centerLon = parseFloat(this.settings.clon);
	var zoom;
	if (typeof(this.settings.zoom) == 'string')
		parseInt(this.settings.zoom);
	else
		zoom = this.settings.zoom;
	var vIndex = this.vFrame.getIndex();

		// Leaflet requires a DIV ID to startup: create and insert one
	jQuery(this.frameID).append('<div id="l-map-'+vIndex+'" class="max-size"></div>');

	this.lMap = L.map("l-map-"+vIndex, { zoomControl: false }).setView([centerLat, centerLon], zoom);

		// Add an OpenStreetMap base layer
	L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
		subdomains: '1234',
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(this.lMap);

		// Create controls in top-right
	var layerControl = L.control.zoom({position: 'topright'});
	layerControl.addTo(this.lMap);

	var markers;
	if (this.settings.clster) {
		markers = new L.MarkerClusterGroup();
	} else {
		markers = L.featureGroup();            
	}
	this.markerLayer = markers;

		// Create options properties if they don't already exist
	markers.options = markers.options || { };
	markers.options.layerName = 'TO DO';

	markers.addTo(this.lMap);

		// Maintain number of Loc Atts per Template type
	var numT = PDataHub.getNumETmplts();
	this.tLCnt = new Uint16Array(numT);
	for (var i=0; i<numT; i++)
		this.tLCnt[i] = 0;
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizMap.prototype.render = function(datastream)
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
// console.log("Added "+e.target.options._aid+"? "+added);

				// Which Template type does absolute index belong to? Does it have multiple location Attributes?
			var tI = PDataHub.aIndex2Tmplt(aid);
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

	var rad;

	switch (self.settings.size) {
	case 's': rad=3; break;
	case 'm': rad=7; break;
	case 'l': rad=12; break;
	}

	var numTmplts = PDataHub.getNumETmplts();
	var i=0, aI, tI=0, fAttID, fAtt, locAtts, featSet, rec;
	var locData, fData, newMarker, s;

		// Clear out marker counts
	for (i=0; i<numTmplts; i++)
		this.tLCnt[i] = 0;

	i=0;
	while (i<datastream.l) {
			// If previous "fast-forward" went to empty Template, must go to next
		while (i == -1) {
			if (++tI == numTmplts)
				return;
			else
					// Fast-forward to next Template source
				i = PDataHub.stream1stTEntry(datastream, tI);
		}
			// Starting with new Template?
		if (locAtts == null) {
			locAtts = this.vFrame.getSelLocAtts(tI);
			self.tLCnt[tI] = locAtts.length;
// console.log("tIndex: "+tI+"; locAtts: "+JSON.stringify(locAtts));
				// Skip Template if no locate Atts
			if (locAtts.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tI == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tI);
					continue;
				}
			} // if no locAtts
			featSet = self.vFrame.getSelFeatAtts(tI);
// console.log("tIndex: "+tI+"; featAtts: "+JSON.stringify(featAtts));

				// Skip Templates if no feature Atts
			if (featSet.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tI == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tI);
					continue;
				}
			} // if no featAtts
				// Get Feature Attribute ID and def for this Template
			fAttID = self.vFrame.getSelLegend(tI);
			fAtt = PDataHub.getAttID(fAttID);
		} // if new Template
			// Get Record data
		aI = datastream.s[i];
		rec = PDataHub.getRecByIndex(aI);
			// For each of the locate Attributes
		locAtts.forEach(function(theLAtt) {
			locData = rec.a[theLAtt];
			if (locData) {
				if (fData = rec.a[fAttID]) {
					fData = PDataHub.getAttLgndVal(fData, fAtt, featSet, false);
					if (fData) {
// console.log("Record "+i+"["+fAttID+"]: "+rec.a[fAttID]+" = "+fData);
							// TO DO: Handle PNG icons
						s = self.isSel(i);
						if (typeof locData[0] == 'number') {
							newMarker = L.circleMarker(locData,
								{	_aid: aI, weight: 1, radius: rad,
									fillColor: fData, color: s ? "#ff0000" : "#000",
									opacity: 1, fillOpacity: 1
								}
							);
						} else {
							if (locData.length == 2) {
								// draw line
							} else {
								// draw polygon
							}
						}
						newMarker.on('click', markerClick);
						mLayer.addLayer(newMarker);
					}
				}
			}
		}); // for locAtts
			// Increment stream index -- check if going into new Template
		if (++i == (datastream.t[tI].i + datastream.t[tI].n)) {
			locAtts = null;
			tI++;
		}
	} // while 
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


// ====================================================
// VizPinboard: Class to visualize images with overlays


var VizPinboard = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizPinboard

VizPinboard.prototype = Object.create(PVizModel.prototype);

VizPinboard.prototype.constructor = VizPinboard;

VizPinboard.prototype.usesLegend = function()
{
	return true;
} // usesLegend()

	// PURPOSE: Return IDs of locate Attributes 
VizPinboard.prototype.getLocAtts = function(tIndex)
{
	if (tIndex != null)
		return this.settings.cAtts[tIndex];
	return this.settings.cAtts;
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

	var xScale = d3.scale.linear().domain([0, s.iw-1])
		.rangeRound([0, s.dw-1]);
	var yScale = d3.scale.linear().domain([0,s.ih-1]).range([0,s.dh-1]);

	var xAxis = d3.svg.axis().scale(xScale).orient("top");
	var yAxis = d3.svg.axis().scale(yScale).orient("left");

	var chart = d3.select(this.frameID).append("svg")
		.attr("width", s.dw+30+3)
		.attr("height", s.dh+30+2)

	.append("g")
		.attr("transform", "translate(30,30)");

	chart.append("g")
		.attr("class", "x axis")
		.call(xAxis);

	chart.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	chart.append("image")
		.attr("xlink:href", s.img)
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", s.dh+"px")
		.attr("width", s.dw+"px");
} // setup

	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizPinboard.prototype.render = function(datastream)
{
	// TO DO
} // render()


VizPinboard.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		// TO DO
	}
} // clearSel()


VizPinboard.prototype.setSel = function(absIArray)
{
	var s;

	this.recSel = absIArray;
	// TO DO
} // setSel()


// ==========================================================
// VizDirectory: Class to visualize lists of Template records


var VizDirectory = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizDirectory

VizDirectory.prototype = Object.create(PVizModel.prototype);

VizDirectory.prototype.constructor = VizDirectory;

VizDirectory.prototype.setup = function()
{
	var self = this;
	var vIndex = this.vFrame.getIndex();

		// Insert a scrolling container
	jQuery(this.frameID).append('<div id="directory-'+vIndex+'" class="scroll-container"></div>');

		// Listen for clicks on it
	jQuery('#directory-'+vIndex).click(function(event) {
		if (event.target.nodeName == 'TD') {
			var row = jQuery(event.target).closest('tr');
			var absI = row.data('ai');
			if (absI != null) {
				var s = self.toggleSel(absI);
				if (s)
					row.addClass("obj-selected");
				else
					row.removeClass("obj-selected");
			}
		} else if (event.target.nodeName == 'TH') {
console.log("Clicked column name");
		}
	});
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizDirectory.prototype.render = function(datastream)
{
	var self = this;

	var numTmplts = PDataHub.getNumETmplts();
	var i=0, aI, tI=0, tID, tRec, tDef;
	var insert=null, fAtts, datum, rec, t;

	var vIndex = this.vFrame.getIndex();

	jQuery('#directory-'+vIndex).empty();

	tRec = datastream.t[0];
	while (i<datastream.l) {
			// Advance until we get to current Template rec
		while (tRec.n == 0 || (tRec.i+tRec.n) == i) {
				// Have we run out of Templates?
			if (++tI == numTmplts)
				return;
			tRec = datastream.t[tI];
			insert = null;
		}
			// Starting with new Template? Create new table
		if (insert == null) {
// console.log("Starting new Template: "+tI);
			tID = PDataHub.getETmpltIndex(tI);
			tDef = PDataHub.getTmpltID(tID);
			jQuery('#directory-'+vIndex).append('<div class="template-label">'+tDef.l+'</div>'+
				'<table cellspacing="0" class="viz-directory" data-id='+tID+'></table>');
			insert = jQuery('#directory-'+vIndex+' table[data-id="'+tID+'"]');
			fAtts = self.settings.cnt[tI];
			t = '<thead><tr>';
			fAtts.forEach(function(theAtt) {
				var att = PDataHub.getAttID(theAtt);
				t += '<th>'+att.def.l+'</th>';
			})
			insert.append(t+'<tr></thead><tbody></tbody>');
			insert = insert.find('tbody');
		} // if new Template

			// Get Record data
		aI = datastream.s[i];
// console.log("Next record: "+i+" (absI) "+aI);
		rec = PDataHub.getRecByIndex(aI);
		t = '<tr data-id="'+rec.id+'" data-ai='+aI;
		if (self.isSel(aI))
			t += ' class="obj-selected" '
		t += '>';
		fAtts.forEach(function(attID) {
			datum = rec.a[attID];
			if (datum) {
				datum = PDataHub.procAttTxt(attID, datum);
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

VizDirectory.prototype.setSel = function(absIArray)
{
	var self=this;
	var vIndex = this.vFrame.getIndex();
	var absI, t;

	this.recSel = absIArray;
	var rows = jQuery('#directory-'+vIndex+' tr');
	rows.each(function() {
		t = jQuery(this);
		absI = t.data('ai');
		if (absI != null) {
			if (self.isSel(absI))
				t.addClass('obj-selected');
			else
				t.removeClass('obj-selected');
		}
	});
} // setSel()

VizDirectory.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		var vIndex = this.vFrame.getIndex();
		jQuery('#directory-'+vIndex+' tr').removeClass('obj-selected');
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

VizTextStream.prototype.usesLegend = function()
{
	return true;
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
	var vIndex = this.vFrame.getIndex();

		// Insert a scrolling container
	jQuery(this.frameID).append('<div id="textstream-'+vIndex+'" class="scroll-container"></div>');

		// Listen for clicks on it
	jQuery('#textstream-'+vIndex).click(function(event) {
		if (event.target.nodeName == 'DIV') {
			var word = jQuery(event.target);
			var aI = word.data('ai');
			if (aI && aI >= 0) {
				var s = self.toggleSel(aI);
				if (s)
					word.addClass("obj-selected");
				else
					word.removeClass("obj-selected");
			}
		}
	});
} // setup()


	// PURPOSE: Draw the Records in the given datastream
	// NOTES: 	absolute index of Record is saved in <id> field of map marker
VizTextStream.prototype.render = function(datastream)
{
	var self = this;

	var numTmplts = PDataHub.getNumETmplts();
	var i=0, tI=0, tID, tRec, tDef;
	var insert, rec, datum, t, s;

	var order, oAtt, cAttID, cAtt, featSet, fAttID, fAtt, fData;
	var szAtt, szAttID, da, dt;

	var vizDiv = jQuery('#textstream-'+this.vFrame.getIndex());

	vizDiv.empty();

	dt = this.settings.max - this.settings.min;

	tRec = datastream.t[0];
	while (tI<numTmplts) {
			// Advance until we get to current Template rec
		while (tRec.n == 0 || (tRec.i+tRec.n) == i) {
				// Have we run out of Templates?
			if (++tI == numTmplts)
				return;
			tRec = datastream.t[tI];
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
		fAtt = PDataHub.getAttID(fAttID);

			// Starting with new Template? Create new DIV & order Records
		vizDiv.append('<div class="viz-textstream" data-ti='+tI+'></div>');
		insert = vizDiv.find('div.viz-textstream[data-ti='+tI+']');

			// Begin with Template name
		tID = PDataHub.getETmpltIndex(tI);
		tDef = PDataHub.getTmpltID(tID);
		insert.append('<div class="template-label">'+tDef.l+'</div>');

		cAttID = self.settings.cnt[tI];
		szAttID = self.settings.sz[tI];
		if (szAttID) {
			szAtt = PDataHub.getAttID(szAttID);
			if (typeof szAtt.r.min == 'number' && typeof szAtt.r.max == 'number')
				da = szAtt.r.max - szAtt.r.min;
			else
				szAttID = null;
		}
		if (cAttID) {
			oAtt = PDataHub.getAttID(self.settings.order[tI]);
			order = PDataHub.orderTBy(oAtt, datastream, tI);
// console.log("Order for Template "+tI+": "+JSON.stringify(order));

			order.forEach(function(oRec) {
				rec = PDataHub.getRecByIndex(oRec.i);
					// Apply Legend
				datum = rec.a[fAttID];
				if (datum) {
					fData = PDataHub.getAttLgndVal(datum, fAtt, featSet, false);
					if (fData) {
						t = rec.a[cAttID];
						if (t)
							t = PDataHub.procAttTxt(cAttID, t);
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
							insert.append('<div class="recitem" data-ai='+oRec.i+' style="color:'+fData+';font-size:'+s+'px">'+t+'</div>');
						} // t
					} // if fData
				}
			});	// forEach order
		} // if cAtt
		tI++;
	} // while 
} // render()

VizTextStream.prototype.setSel = function(absIArray)
{
	var self=this;
	var vIndex = this.vFrame.getIndex();
	var absI, t;

	this.recSel = absIArray;
	var rows = jQuery('#textstream-'+vIndex+' div.recitem');
	rows.each(function() {
		t = jQuery(this);
		absI = t.data('aI');
		if (absI != null) {
			if (self.isSel(absI))
				t.addClass('obj-selected');
			else
				t.removeClass('obj-selected');
		}
	});
} // setSel()

VizTextStream.prototype.clearSel = function()
{
	if (this.recSel.length > 0) {
		this.recSel = [];
		var vIndex = this.vFrame.getIndex();
		jQuery('#textstream-'+vIndex+' div.recitem').removeClass('obj-selected');
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
		this.dirty = setDirty;
		if (setDirty && this.id > 0)
			jQuery('#btn-recompute').addClass('highlight');
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

	this.rCats = PDataHub.getRCats(this.att);
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
		return PDataHub.date3Nums(y, m, d);
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
			e = new Date();
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

	this.rCats = PDataHub.getRCats(this.att);
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
		if (vizModel.usesLegend()) {
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
			rec = PDataHub.getRecByIndex(recAbsI);
			var title = ' '+rec.l+' ('+(i+1)+'/'+recSel.length+') ';
			jQuery('#inspect-name').text(title);
				// Which template type?
			var tI = PDataHub.aIndex2Tmplt(recAbsI);
				// Show all data
			var container = jQuery('#inspect-content');
			container.empty();
// console.log("Show atts: "+JSON.stringify(prspdata.e.p.modal.atts[tI]));
			prspdata.e.p.modal.atts[tI].forEach(function(attID) {
				var attVal = PDataHub.getRecAtt(recAbsI, attID, false);
// console.log("AttID: "+attID+"; val: "+attVal);
				if (attVal) {
					var theAtt = PDataHub.getAttID(attID);
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
					var newURL = prspdata.site_url;
					if (prspdata.site_url.charAt(prspdata.site_url.length-1) != '/')
						newURL += '/';
					newURL += '?p='+ rec.wp;
// console.log("Go to URL: "+newURL);
					window.open(newURL, '_blank');
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

	function clickClearSelection(event)
	{
		if (vizModel)
			vizModel.clearSel();
		event.preventDefault();
	} // clickClearSelection()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizControls(event)
	{
		event.preventDefault();
	} // clickVizControls()

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
		// TO DO: 	Handle 2ndary level (Vocab) items properly, logically??
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
		var attDef = PDataHub.getAttID(attID);
		attDef.l.forEach(function(legEntry, lgIndex) {
				// TO DO: Account for both icons and colors acc. to v string
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
		var theView = PDataHub.getVizIndex(vIndex);

			// Remove current viz content
		if (vizModel)
			vizModel.teardown();

		jQuery(getFrameID()+' div.viz-content div.viz-result').empty();

		switch (theView.vf) {
		case 'Map':
			vizModel = new VizMap(instance, theView.c);
			break;
		case 'Cards':
			break;
		case 'Pinboard':
			vizModel = new VizPinboard(instance, theView.c);
			break;
		case 'Timeline':
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

			// Does Viz support Legend at all?
		if (vizModel.usesLegend()) {
				// Clear out previous Legend
				// remove all previous locate Attributes
			var lgndCntr = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll');
			lgndCntr.empty();

				// Create Legend sections for each Template
			prspdata.e.g.ts.forEach(function(tID, tIndex) {
				var tmpltDef = PDataHub.getTmpltID(tID);
					// Insert locate attributes into Legends
				var locAtts = vizModel.getLocAtts(tIndex);
				if (locAtts && locAtts.length > 0) {
							// Create DIV structure for Template's Legend entry
					var newTLegend = jQuery('<div class="lgnd-template" data-index="'+tIndex+
									'"><div class="lgnd-title">'+tmpltDef.l+'</div></div>');
					locAtts.forEach(function(attID, aIndex) {
						var attDef = PDataHub.getAttID(attID);
						newTLegend.append('<div class="lgnd-entry lgnd-locate" data-id="'+attID+
							'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/><span class="lgnd-value-title">'+
							attDef.def.l+'</span></div>');
					});
						// Create dropdown menu of visual Attributes
					var attSelection = vizModel.getFeatureAtts(tIndex);
					var newStr = '<select class="lgnd-select">';
					attSelection.forEach(function(attID, aIndex) {
						var attDef = PDataHub.getAttID(attID);
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
				// Just hide Legend
			jQuery(getFrameID()+' div.lgnd-container').hide();
		}

			// Enable or disable corresponding Selector Filter 
		var c = jQuery('#selector-v'+vfIndex);
		if (vizModel.canSel()) {
			c.removeAttr("disabled");
			c.prop('checked', true);
		} else {
			c.attr("disabled", true);
			c.prop('checked', false);
			// c.removeAttr("checked"); // ?? this instead?
		}

		vizModel.setup();

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
				.button({icons: { primary: 'ui-icon-close' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-gear' }, text: false })
				.click(clickVizControls).next();

		head = jQuery(getFrameID()+' div.viz-content div.lgnd-container');
		head.click(clickInLegend);

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

	instance.clearSel = function()
	{
		if (vizModel)
			vizModel.clearSel();
	} // clearSel()

		// PURPOSE: Attempt to set the Selection List of the VizModel to selList
		// RETURNS: true if possible, false if not
	instance.setSel = function(selList)
	{
		if (vizModel) {
			if (vizModel.canSel()) {
				vizModel.setSel(selList);
				return true;
			}
			return false;
		}
		return false;
	} // selSel()

	return instance;
} // PViewFrame


// ==========================================================
// PDataHub
// PURPOSE: Manages all data, orchestrates data streams, etc.

// USES: jQuery (for AJAX)

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			PDataHub is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// The s array of an IndexStream contains absolute index numbers to global data array
// TO DO: 	Change LOAD_DATA_CHUNK to Option setting passed by prspdata


var PDataHub = (function () {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;


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
				var d = recs[tIndex].d;
				var newD = JSON.parse(data);
				if (d)
					recs[tIndex].d = d.concat(newD);
				else
					recs[tIndex].d = newD;
				recs[tIndex].n += count;
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
			jQuery('#btn-recompute').addClass('highlight');
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
		procAttTxt: function(attID, a)
		{
			var att = PDataHub.getAttID(attID);
			switch (att.def.t) {
			case 'Vocabulary':
				return a.join();
			case 'Text':
				return a;
			case 'Number':
				return a.toString();
			case 'Dates':
				var ds;
					// Range
				if (a.max) {
					ds = 'From ';
					if (a.min.f)
						ds += 'no later than ';
					ds += a.min.y.toString();
					if (a.min.m) {
						ds += '-'+a.min.m.toString();
						if (a.min.d)
							ds += '-'+a.min.d.toString();
					}
					ds += ' to ';
					if (a.max.f)
						ds += 'at least ';
					ds += a.max.y.toString();
					if (a.max.m) {
						ds += '-'+a.max.m.toString();
						if (a.max.d)
							ds += '-'+a.max.d.toString();
					}
				} else {
					if (a.min.f)
						ds = 'Approximately ';
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
			case 'Lat-Lon':
			case 'X-Y':
				return a.join();
			case 'Image':
				return '<img src="'+a+'" alt="'+att.def.l+'"/>';
			case 'Link To':
				return '<a href="'+a+'" target="_blank">(See Link)</a>';
			case 'SoundCloud':
				return '<a href="'+a+'" target="_blank">(SoundCloud)</a>';
			case 'YouTube':
				return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
			case 'Transcript':
				return '<a href="'+a+'" target="_blank">(See Transcript File)</a>';
			case 'Timecode':
				return a;
			case 'Pointer': 	// Only handle first value
				if (a.length > 0) {
					// TO DO -- Find Rec, get WP ID, create URL to it
					var ptRec = PDataHub.getRecByID(a[0]);
					var newURL = prspdata.site_url;
					if (prspdata.site_url.charAt(prspdata.site_url.length-1) != '/')
						newURL += '/';
					newURL += '?p='+ ptRec.wp;
					return '<a href="'+newURL+'" target="_blank">'+ptRec.l+'</a>';
				} else
					return null;
			// case 'Join': 	// Should not appear
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
					return PDataHub.procAttTxt(attID, a);
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
					var hi = tData.n;
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
					var hi = tData.n;
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
			var hi = prspdata.a.length;
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
			// TO DO: 	Change to ptr to legend record so can access both <v> and <b> ??
		getAttLgndVal: function(val, att, fSet, all)
		{
			var fI, lI = fSet.length, lE;

			switch (att.def.t) {
			case 'Vocabulary':
				function s(v) {
					for (var f=0; f<lI; f++) {
						fI = fSet[f];
							// Parent-level 
						if (typeof fI === 'number') {
							lE = att.l[fI];
							if (lE.l == v)
								return lE.v;
							// Secondary-level
						} else {
							lE = att.l[fI[0]];
							var lE2 = lE.z[fI[1]];
							if (lE2.l == v) {
								if (lE2.v && lE2.v != '')
									return lE2.v;
								else
									return lE.v;
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
			case 'Text':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// Looking for match anywhere; TO DO: use RegExp?
					if (val.indexOf(lE.d) != -1) {
						return lE.v;
					}
				}
				return null;
			case 'Number':
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
						// either min and max can be left out (= no bound), but not both
					if (lE.d.min) {
						if (lE.d.min <= val) {
							if (lE.d.max) {
								if (val <= lE.d.max)
									return lE.v;
							} else
								return lE.v;
						}
					} else {	// max only
						if (val <= lE.d.max)
							return lE.v;
					}
				}
				return null;
			case 'Dates': 			// Just looking for overlap, date doesn't have to be completely contained
									// Disqualify for overlap if (1) end of event is before min bound, or
									//	(2) start of event is after max bound
				for (var f=0; f<lI; f++) {
					fI = fSet[f];
					lE = att.l[fI];
					if (lE.d.max.y) {		// max bounds
							// Test val maxs against min bound for disqualification
						if (val.max && val.max != 'open') {
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
						return lE.v;
					} else {				// min bound only
							// Event is range
						if (val.max) {
							if (val.max == 'open')		// double open always overlap
								return lE.v;
							if (val.max.y < lE.min.y)
								continue;
							if (val.max.y == lE.min.y) {
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
							return lE.v;

							// Single date
						} else {
							if (val.min.y < lE.min.y)
								continue;
							if (val.min.y == lE.min.y) {
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
							return lE.v;
						}
					}
				} // for f
				break;
			}
			return null;
		}, // getAttLgndVal()

			// PURPOSE: Find the visual code for this Attribute's vocabulary item
			// RETURNS: pointer to Legend record, or null if failure
			// ASSUMES: <att> is a complete record for a Vocabulary Attribute
		getVLgndVal: function(att, val)
		{
			var lo = 0;
			var hi = att.x.length;
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
			case 'Number':
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
			case 'Dates':
				function makeDate(y, m, d, field) {
					if (typeof field.m != 'undefined') {
						m = field.m;
						if (typeof field.d != 'undefined') {
							d = field.d;
						}
					}
					return PDataHub.date3Nums(y, m, d);
				} // makeDate()
				function makeMaxDate(field)
				{
					if (typeof field.y == 'undefined') {
						return new Date();
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
				var curDate = PDataHub.date3Nums(curY, curM, curD);
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
						rCat.max = PDataHub.date3Nums(curY, curM, curD+1);
						curD++;
						break;
					case 'm':
						rCat.max = PDataHub.date3Nums(curY, curM+1, curD);
						curM++;
						break;
					case 'y':
						rCat.max = PDataHub.date3Nums(curY+1, curM, curD);
						curY++;
						break;
					case 't':
						rCat.max = PDataHub.date3Nums(curY+10, curM, curD);
						curY += 10;
						break;
					case 'c':
						rCat.max = PDataHub.date3Nums(curY+100, curM, curD);
						curY += 100;
						break;
					}
					rcs.push(rCat);
					curDate = PDataHub.date3Nums(curY, curM, curD);
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
			case 'Number':
				break;
			case 'Dates':
				break;
			case 'Vocabulary':
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
		// 		return PDataHub.date3Nums(v.min.y, m, d);
		// 	}

		// 	var eval, maxV;
		// 	switch (att.def.t) {
		// 	case 'Text': 		eval = vIden;	maxV = '~'; break;
		// 	case 'Vocabulary': 	eval = vVocab;	maxV = '~'; break;
		// 	case 'Number': 		eval = vIden;	maxV = att.r.max; break;
		// 	case 'Dates': 		eval = vDate;	maxV = new Date(); break;
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
		// 	case 'Text':
		// 	case 'Vocabulary':
		// 		ord.sort(function(a,b) { return a.v.localeCompare(b.v); });
		// 		break;
		// 	case 'Dates':
		// 	case 'Number':
		// 		ord.sort(function(a,b) { return a.v - b.v; });
		// 		break;
		// 	// case 'Dates':
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
			// NOTES: 	Only uses first value in the case of multiple (Vocabulary, Dates, etc)
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
				return PDataHub.date3Nums(v.min.y, m, d);
			}

			var eval, maxV;
			switch (att.def.t) {
			case 'Text': 		eval = vIden;	maxV = '~'; break;
			case 'Vocabulary': 	eval = vVocab;	maxV = '~'; break;
			case 'Number': 		eval = vIden;	maxV = att.r.max; break;
			case 'Dates': 		eval = vDate;	maxV = new Date(); break;
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
			case 'Text':
			case 'Vocabulary':
				ord.sort(function(a,b) { return a.v.localeCompare(b.v); });
				break;
			case 'Dates':
			case 'Number':
				ord.sort(function(a,b) { return a.v - b.v; });
				break;
			// case 'Dates':
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
})(); // PDataHub


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services, manage filters, …

// USES: 	jQuery, jQueryUI, PDataHub, PViewFrame
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

		if (topStream == null) {
			topStream = PDataHub.newIndexStream(true);
		}
		endStream = topStream;

			// Go through filter stack -- find 1st dirty and recompute from there
		var started=false, fI, theF;
		for (fI=0; fI<filters.length; fI++) {
			theF = filters[fI];
				// If we've started, evaluate and propagate
			if (started || theF.f.isDirty(null)) {
				started = true;
				theF.f.evalPrep();
				var newStream = PDataHub.newIndexStream(false);
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
					rec = PDataHub.getRecByIndex(absI);
					if (theF.f.eval(rec)) {
						newStream.s[newStream.l++] = absI;
						tRn++;
					}
				}
					// push out any remaining Template recs
				while (tI++ < PDataHub.getNumETmplts()) {
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
		jQuery('#btn-recompute').removeClass('highlight');
console.log("Visualization complete");
		state = PSTATE_READY;
	} // doRecompute()

		// TO DO: Check and set frameState; make cursor busy during compute!
	function clickRecompute(event)
	{
		doRecompute();
		event.preventDefault();
	} // clickRecompute()


	function doSetLayout(lIndex)
	{
console.log("Set layout to: "+lIndex);
	} // doSetLayout()


	function clickSetLayout(event)
	{
			// Clear previous selection
		jQuery("#layout-choices img").removeClass("selected");
		var setLayoutDialog;

		setLayoutDialog = jQuery("#dialog-set-layout").dialog({
			height: 250,
			width: 300,
			modal: true,
			buttons: {
				Set: function() {
					var selected = jQuery("#layout-choices img.selected");
					if (selected.length) {
						doSetLayout(selected.data("index"));
					}
					setLayoutDialog.dialog("close");
				},
				Cancel: function() {
					setLayoutDialog.dialog("close");
				}
			},
			close: function() {
			}
		});

		event.preventDefault();
	} // clickSetLayout()


	function clickPerspectives(event)
	{
		event.preventDefault();
	} // clickPerspectives()


	function clickGoHome(event)
	{
		event.preventDefault();
	} // clickGoHome()


		// PURPOSE: Gather data about Filterable Attributes & Facet Browsers
	function prepFilterData()
	{
		prspdata.a.forEach(function(theAttribute) {
			switch (theAttribute.def.t) {
			case 'Vocabulary':
			case 'Text':
			case 'Number':
			case 'Dates':
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
			jQuery('#btn-recompute').addClass('highlight');
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
// console.log("Create Filter "+fID);
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
		var theAtt = PDataHub.getAttID(fID);
		switch (theAtt.def.t) {
		case 'Vocabulary':
			newFilter = new PFilterVocab(newID, theAtt);
			break;
		case 'Text':
			newFilter = new PFilterText(newID, theAtt);
			break;
		case 'Number':
			newFilter = new PFilterNum(newID, theAtt);
			break;
		case 'Dates':
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

			jQuery('#btn-recompute').addClass('highlight');
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
				rec = PDataHub.getRecByIndex(absI);
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


		// IMMEDIATE EXECUTION
		//====================

	if (prspdata.e.g.l != '')
		jQuery('#title').append(prspdata.e.g.l);

		// Command Bar
	jQuery('#btn-recompute').button({icons: { primary: 'ui-icon-refresh' }, text: false })
			.click(clickRecompute);
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickSetLayout);
	jQuery('#btn-perspectives').button({icons: { primary: 'ui-icon-note' }, text: false })
			.click(clickPerspectives);
	jQuery('#btn-home').button({icons: { primary: 'ui-icon-home' }, text: false })
			.click(clickGoHome);


		// Handle selection of item on New Filter modal
	jQuery('#filter-list').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#filter-list li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

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

		// Initial primary visualization frame
	view0 = PViewFrame(0);
	view0.initDOM();

		// Init hub using config settings
	PDataHub.init();
});
