// This file contains:
//		PVizModel abstract Class
//		PViewFrame Object
//		PDataHub Module for handling data
//		PBootstrap for launching processes and organizing screen

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, w, p }


// ========================================================================
// PVizModel: An abstract class to be subclassed by specific visualizations

	// INPUT: 	viewFrame = instance variable returned from ViewModel pseudo-constructor
	//			frameID = base ID for frame DIV
	//			vizSettings = c section of VF entry
function PVizModel(viewFrame, vizSettings)
{
	this.vFrame   = viewFrame;
	this.frameID  = viewFrame.getFrameID()+' .viz-content .viz-result';
	this.settings = vizSettings;

		// All subclasses must implement the following:
	// this.usesLegend()
	// this.getLocAtts(tIndex)
	// this.getFeatureAtts(tIndex)
	// this.setup()
	// this.render(IndexStream)
	// this.updateTemplate(tIndex)
	// this.setSelection(ids)
	// this.getPerspective()
	// this.setPerspective(pData)
	// this.teardown()
} // PVizModel


PVizModel.prototype.sample = function()
{
} // PVizModel.sample


// ===================================
// VizMap: Class to visualize GIS maps


var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
		// Determine which 
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

	this.lMap = L.map("l-map-"+vIndex, { zoomControl:false }).setView([centerLat, centerLon], zoom);

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
console.log("VizMap setup");
} // setup()


	// PURPOSE: Draw the Records in the given datastream
VizMap.prototype.render = function(datastream)
{
	var mLayer = this.markerLayer;

		// Remove previous Markers
	mLayer.clearLayers();

		// Process one Template type at a time
	var numTmplts = PDataHub.getNumETmplts();
	var i=0, tIndex=0, attID, locAtts, featAtts, rec;
	var locData, parsed, coord, newMarker;

	while (i<datastream.l) {
			// If previous "fast-forward" went into empty Template, need to go to next
		while (i == -1) {
			if (++tIndex == numTmplts)
				return;
			else
					// Fast-forward to next Template source
				i = PDataHub.stream1stTEntry(datastream, tIndex);
		}
			// Starting with new Template?
		if (locAtts == null) {
			locAtts = this.vFrame.getSelLocAtts(tIndex);
				// Skip Template if no locate Atts
			if (locAtts.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tIndex == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tIndex);
					continue;
				}
			} // if no locAtts
			featAtts = this.vFrame.getSelFeatAtts(tIndex);
				// Skip Templates if no feature Atts
			if (featAtts.length == 0) {
				locAtts = null;
					// Have we exhausted all Templates?
				if (++tIndex == numTmplts)
					return;
				else {
						// Fast-forward to next Template source
					i = PDataHub.stream1stTEntry(datastream, tIndex);
					continue;
				}
			} // if no featAtts
				// Get Feature Attribute ID for this Template
			attID = this.vFrame.getSelLegend(tIndex);
		} // if new Template
			// Get Record data
		rec = PDataHub.getRecByIndex(datastream.s[i]);
			// For each of the locate Attributes
		locAtts.forEach(function(theLAtt) {
			locData = rec.a[theLAtt];
			if (locData && locData.length) {
				parsed = locData.split(',');
// console.log("Record "+i+"["+theLAtt+"]: "+locData);
				if (parsed.length == 2) {
					coord = [parseFloat(parsed[0]), parseFloat(parsed[1])];
					newMarker = L.circleMarker(coord,
						{	id: i, weight: 1, radius: 10,
							fillColor: "red", color: "#000",
							opacity: 1, fillOpacity: 1
						}
					);
					mLayer.addLayer(newMarker);
				}
			}
		}); // for locAtts
			// Increment stream index -- check if going into new Template
		if (++i == (datastream.t[tIndex].i + datastream.t[tIndex].n))
			locAtts = null;
	} // while 
} // render()

VizMap.prototype.teardown = function()
{
} // teardown()


// ========================================================================
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)

// INPUT: 	vizIndex = index for this visualization frame (0 or 1)

function PViewFrame(vizIndex)
{
	var instance = { };				// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var frameState = 0;				// 0 = internal initialization, 1 = waiting for data,
									// 2 = processing data, 3 = creating visualization,
									// 4 = ready for interaction
	var vizSelIndex = 0;			// index of currently selected Viz
	var vizModel = null;			// PVizModel currently in frame
	var legendIDs = [];				// Attribute IDs of Legend selections (one per Template)
	var selRecIDS = [];				// array of IDs of selected Records
	var datastream = null;			// pointer to datastream given to view

	// PRIVATE FUNCTIONS
	//==================

		// PURPOSE: Return ID of Frame's outermost DIV container
	function getFrameID()
	{
		return '#view-frame-'+vizIndex;
	} // getFrameID()


	function selectChangeViz(event)
	{
		var selector = jQuery(getFrameID()+' .view-control-bar .view-viz-select option:selected');
		var newSelIndex   = selector.val();
		createViz(newSelIndex);
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		if (vizModel.usesLegend()) {
			jQuery(getFrameID()+' .legend-container').toggle('slide', {direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()


		// PURPOSE: Open Inspector modal for current selection
	function clickOpenSelection(event)
	{
			// TO DO
		event.preventDefault();
	} // clickOpenSelection()

	function clickClearSelection(event)
	{
			// TO DO: Do visual clear
			// Reset array
		selRecIDS = [];
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
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-entry-check').prop('checked', show);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
console.log("Locate attribute "+lID+" for template "+tmpltIndex+", set to "+show);
	} // doLocateSelect()


		// PURPOSE: Make vIndex the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
console.log("Locate attribute "+lID+" only for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-locate .legend-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-locate[data-id="'+lID+'"] .legend-entry-check').prop('checked', true);
	} // doLocateSelect()


		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
console.log("Feature attribute "+vIndex+" for template "+tmpltIndex+", set to "+show);
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
console.log("Feature attribute "+vIndex+" only selected for template "+tmpltIndex);
			// Deselect everything
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
								tmpltIndex+'"] .legend-group .legend-value[data-index="'+vIndex+
								'"] .legend-entry-check').prop('checked', true);
	} // doFeatureSelectOnly()


		// PURPOSE: Handle click anywhere on Legend
	function clickInLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'legend-update':
			if (vizModel && datastream) {
					// TO DO: Set busy cursor
				vizModel.render(datastream);				
			}
			break;
			// Turn on or off just this one value
		case 'legend-entry-check':
			var lEntry = jQuery(event.target).closest('.legend-entry');
			var isChecked = jQuery(event.target).is(':checked');
				// What does checkbox belong to?
			if (lEntry.hasClass('legend-sh'))
				doShowHideAll(tmpltIndex, isChecked);
				// A locate Attribute?
			else if (lEntry.hasClass('legend-locate'))
				doLocateSelect(tmpltIndex, lEntry.data('id'), isChecked);
					// Must belong to a legend-entry
			else if (lEntry.hasClass('legend-value'))
				doFeatureSelect(tmpltIndex, lEntry.data('index'), isChecked);
			break;

			// Make this only selected feature attribute
		case 'legend-viz':
		case 'legend-value-title': 		// Title used for both locate and feature Attributes!
			var lEntry = jQuery(event.target).closest('.legend-entry');
			if (lEntry.hasClass('legend-locate'))
				doLocateSelectOnly(tmpltIndex, lEntry.data('id'));
			else if (lEntry.hasClass('legend-value'))
				doFeatureSelectOnly(tmpltIndex, lEntry.data('index'));
			break;

		case 'legend-template':
		case 'legend-select':
		case '':
				// Ignore these
			break;

		default:  // could be multiple
				// Show/Hide title?
			if (clickClass.match(/legend-sh/i)) {
					// Simulate click
				var checkBox = jQuery(event.target).find('.legend-entry-check');
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
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
		var attID = jQuery(event.target).val();
		setLegendFeatures(tmpltIndex, attID);
	} // selectTmpltAttribute()


		// PURPOSE: Set feature attributes in Legend
		// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
		//			attID = ID of feature Attribute in the Legend set
		// NOTES: 	Does not affect menu selection itself
	function setLegendFeatures(lIndex, attID)
	{
		var group = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
						lIndex+'"] .legend-group');
			// Clear any previous entries
		group.empty();
		legendIDs[lIndex] = attID;
			// Insert new items
		var attDef = PDataHub.getAttID(attID, true);
		attDef.l.forEach(function(legEntry, lgIndex) {
				// TO DO: Account for both icons and colors acc. to v string
				// TO DO: Handle children values (indented)
			var element = '<div class="legend-value legend-entry" data-index="'+lgIndex+'"><input type="checkbox" checked="checked" class="legend-entry-check"/>'+
						'<div class="legend-viz" style="background-color: '+legEntry.v+'"> </div> <span class="legend-value-title">'+legEntry.l+'</span></div>';
			group.append(element);
		});
	} // setLegendFeatures()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vfIndex is index in Exhibit array
	function createViz(vfIndex)
	{
		var theVF = PDataHub.getVizIndex(vfIndex);

			// Remove current viz content
		if (vizModel)
			vizModel.teardown();

		jQuery(getFrameID()+' .viz-content .viz-result').empty();

		switch (theVF.vf) {
		case 'Map':
			vizModel = new VizMap(instance, theVF.c);
			break;
		case 'Cards':
			break;
		case 'Pinboard':
			break;
		case 'Timeline':
			break;
		case 'Tree':
			break;
		case 'Flow':
			break;
		case 'Directory':
			break;
		}
		vizSelIndex = vfIndex;

			// Does Viz support Legend at all?
		if (vizModel.usesLegend()) {
				// Clear out previous Legend
				// remove all previous locate Attributes
			var lgndCntr = jQuery(getFrameID()+' .legend-container .legend-scroll');
			lgndCntr.empty();

				// Create Legend sections for each Template
			prspdata.e.g.ts.forEach(function(tID, tIndex) {
				var tmpltDef = PDataHub.getTmpltID(tID);
						// Create DIV structure for Template's Legend entry
				var newTLegend = jQuery('<div class="legend-template" data-index="'+tIndex+
								'"><div class="legend-title">'+tmpltDef.l+'</div></div>');
					// Insert locate attributes into Legends
				var locAtts = vizModel.getLocAtts(tIndex);
				if (locAtts && locAtts.length) {
					locAtts.forEach(function(attID, aIndex) {
						var attDef = PDataHub.getAttID(attID, false);
						newTLegend.append('<div class="legend-entry legend-locate" data-id="'+attID+
							'"><input type="checkbox" checked="checked" class="legend-entry-check"/><span class="legend-value-title">'+
							attDef.def.l+'</span></div>');
					});
				}
					// Create dropdown menu of visual Attributes
				var attSelection = vizModel.getFeatureAtts(tIndex);
				var newStr = '<select class="legend-select">';
				attSelection.forEach(function(attID, aIndex) {
					var attDef = PDataHub.getAttID(attID, true);
					newStr += '<option value="'+attID+'">'+attDef.def.l+'</option>';
				});
				newStr += '</select>';
				var newSelect = jQuery(newStr);
				newSelect.change(selectTmpltAttribute);
				jQuery(newTLegend).append(newSelect);
					// Create Hide/Show all checkbox
				jQuery(newTLegend).append('<div class="legend-entry legend-sh"><input type="checkbox" checked="checked" class="legend-entry-check"/>Hide/Show All</div><div class="legend-group"></div>');
				lgndCntr.append(newTLegend);
				if (tIndex != (prspdata.t.length-1))
					lgndCntr.append('<hr/>');
					// Default feature selection is first Attribute
				var fAttID = attSelection.length > 0 ? attSelection[0] : null;
				legendIDs.push(fAttID);
				if (fAttID) 
					setLegendFeatures(tIndex, fAttID);
			});
		} else {
				// Just hide Legend
			jQuery(getFrameID()+' .legend-container').hide();
		}
		vizModel.setup();

			// TO DO: Indicate to PDataHub that VizModel available for data -- InputQueue mechanism?
	} // createViz()


	// INSTANCE METHODS
	//=================

	instance.getFrameID = getFrameID;

	instance.getIndex = function()
	{
		return vizIndex;
	};

		// PURPOSE: Initialize basic DOM structure for ViewFrame
	instance.initDOM = function()
	{
		var head = jQuery(getFrameID()+' .view-control-bar .view-viz-select');
			// Set Dropdown to View names
		prspdata.e.vf.forEach(function(theVF, i) {
				// Don't treat Facet Browser as View
			if (theVF.vf != 'Browser') {
				var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
				head.append(optionStr);
			}
		});
		head.change(selectChangeViz);

			// Hook control bar Icon buttons
		head = jQuery(getFrameID()+' .view-control-bar button:first');
		head.button({icons: { primary: 'ui-icon-bookmark' }, text: false })
				.click(clickShowHideLegend).next()
				.button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(clickOpenSelection).next()
				.button({icons: { primary: 'ui-icon-close' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-gear' }, text: false })
				.click(clickVizControls).next();

		head = jQuery(getFrameID()+' .viz-content .legend-container');
		head.click(clickInLegend);

			// Create first VF by default
		createViz(0);

		frameState = 1;
	}; // initDOM()


		// RETURNS: Array of currently selected locate Attribute IDs for tIndex
	instance.getSelLocAtts = function(tIndex)
	{
		var attIDs = [];
		var boxes = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
							tIndex+'"] .legend-locate input:checked');
		boxes.each(function() {
			var attID = jQuery(this).parent().data('id');
			attIDs.push(attID);
		});
		return attIDs;
	}; // getSelLocAtts()


		// RETURNS: Array of indices of currently selected feature Attribute IDs for tIndex
	instance.getSelFeatAtts = function(tIndex)
	{
		var attIndices = [];
		var boxes = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
							tIndex+'"] .legend-group .legend-value input:checked');
		boxes.each(function() {
			var attIndex = jQuery(this).parent().data('index');
			attIndices.push(attIndex);
		});
		return attIndices;
	}; // getSelFeatAtts()


		// RETURNS: Attribute ID selected on Legend for tIndex
	instance.getSelLegend = function(tIndex)
	{
		return legendIDs[tIndex];
	} // getSelLegend()


	instance.state = function()
	{
		return frameState;
	} // state()

		// PURPOSE: Add or remove recordID to/from current selection list
		// NOTES: 	Called by VizModel based on user interaction
	instance.changeSelection = function(recordID, add)
	{
		if (add) {
			selRecIDS.push(recordID);
		} else {
			var i = _.indexOf(selRecIDS, recordID);
			selRecIDS.splice(i, 1);
		}
	} // changeSelection()

		// PURPOSE: Called by external agent when new datastream is available for viewing
		// ASSUMED: Caller has already set busy cursor
		// TO DO: 	Check and set frameState
	instance.showData = function(stream)
	{
		datastream = stream;
		if (vizModel)
			vizModel.render(stream);
	} // showData()

	return instance;
} // PViewFrame


// ==========================================================
// PFilterModel: An abstract class for data filters

// INPUT: fIndex = index for this filter

function PFilterModel(fIndex)
{

		// All subclasses must implement the following:
	// this.setup()
	// this.evaluateRec(theRec)
} // PFilterModel


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

	var dataLoaded = false;			// only true after all Record data loaded
	var allData = [];				// "head" array of all Records, one entry per Template type
									// Corresponding to prspdata.t
									// { n = # loaded, i = initial index for these records, d = data array }
	var allDataCount=0;				// Total number of Records
	var topStream=null;				// datastream from top

	// INTERNAL FUNCTIONS
	// ==================

		// PURPOSE: Make data flow from top of VF stack to bottom
	function flowFromTop()
	{

	} // flowFromTop()


	// PUBLIC INTERFACE
	// ================

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
				var d = allData[tIndex].d;
				var newD = JSON.parse(data);
				if (d)
					allData[tIndex].d = d.concat(newD);
				else
					allData[tIndex].d = newD;
				allData[tIndex].n += count;
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
			var current = allData[i].n;
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
// console.log("Done loading: "+JSON.stringify(allData));
			dataLoaded = true;
			flowFromTop();
		}
	} // checkDataLoad()


	return {
			// PURPOSE: Initialize data hub, initiate data loading
		init: function()
		{
				// For each entry: head entry for Record Data and collect Legends
			prspdata.t.forEach(function(tmplt) {
					// Head Record entry
				var newTData = { i: allDataCount, n: 0, d: null };
				allData.push(newTData);
				allDataCount += tmplt.n;
			});
			checkDataLoad();
		}, // init()


			// PURPOSE: Create a new IndexStream: { s = index array, t = array of template params, l = total length }
			// INPUT: 	if full, fill with entries for all Records
			// NOTE: 	JS Arrays are quirky; s is always full size, so l is used to maintain length
		newIndexStream: function(full)
		{
			var newStream = { };
			newStream.s = new Int16Array(allDataCount);
			newStream.t = [];
			newStream.l = 0;

			var i;

			if (full) {
				for (i=0; i<allDataCount; i++)
					newStream.s[i] = i;
				for (i=0; i<allData.length; i++) {
					var tEntry = allData[i];
					var newEntry = { i: tEntry.i, n: tEntry.n };
					newStream.t.push(newEntry);
				}
				newStream.l = allDataCount;
			}
			return newStream;
		}, // newIndexStream()


			// RETURNS: Index of Template to which absolute <index> belongs
		streamTemplate: function(index)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.i <= index  && index < (tData.i+tData.n))
					return i;
			}
		}, // streamTemplate()


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


			// RETURNS: Object for Record whose absolute index is <index>
		getRecByIndex: function(index)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.n > 0) {
					if (tData.i <= index  && index < (tData.i+tData.n))
						return tData.d[index - tData.i];
				}
			}
			return null;
		}, // getRecByIndex()


			// RETURNS: Attribute value for <attID> in Record whose absolute index is <index>
			// TO DO: 	Process data?
		getRecAtt: function(index, attID)
		{
			for (var i=0; i<allData.length; i++) {
				var tData = allData[i];
				if (tData.i <= index  && index < (tData.i+tData.n)) {
					var rec = tData.d[index - tData.i];
					return rec[attID];
				}
			}
			return null;
		}, // getRecAtt()


			// RETURNS: Absolute index for Record whose ID is recordID
		getRecIndexByID: function(recordID)
		{
				// TO DO: Binary search for each Template array
		}, // getRecIndexByID()


			// RETURNS: Attribute definition with this ID
			// INPUT:   attID = full Attribute ID (could be in Join dot notation)
			//			if in Join dot notation and suffix = true, find Attribute for suffix segment
			// NOTE: 	In case that ID is Joined with dot notation, find base Attribute
			// TO DO:   Use binary search
		getAttID: function(attID, suffix)
		{
				// Test if in dot notation
			var pos = attID.indexOf('.');
			if (pos != -1) {
				if (suffix)
					attID = attID.substr(pos+1);
				else
					attID = attID.substring(0, pos);
			}
			for (var i=0; i<prspdata.a.length; i++) {
				var thisID = prspdata.a[i].id;
				if (attID == thisID)
					return prspdata.a[i];
			}
		}, // getAttID()


			// RETURNS: first part of AttID if in Join dot notation
		getAttIDPrefix: function(attID)
		{
				// Test if in dot notation
			var pos = attID.indexOf('.');
			if (pos != -1)
				return attID.substring(0, pos);
			return attID;
		}, // getAttIDPrefix()


			// RETURNS: last part of AttID if in Join dot notation
		getAttIDSuffix: function(attID)
		{
				// Test if in dot notation
			var pos = attID.indexOf('.');
			if (pos != -1)
				return attID.substr(pos)+1;
			return attID;
		}, // getAttIDSuffix()


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
		getETmpltIDIndex: function(tIndex)
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

			// RETURNS: The visual feature for an Attribute value, or null if no match
			// INPUT:   val = raw Attribute val (String or Number)
			//			type = type of Attribute
			//			lgnd = complete Legend array
			//			indices = array of selected Legend indices
		getAttLgndVal: function(val, type, lgnd, indices)
		{
			// TO DO
		}, // getAttLgndVal()


		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		} // getVizIndex()
	} // return
})();


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services …

// USES: 	jQuery, jQueryUI, …
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// CONSTANTS
		//==========


		// VARIABLES
		//==========
	var view0;				// Primary viewFrame

		// FUNCTIONS
		//==========

	function clickRecompute(event)
	{
			// TO DO: Check and set frameState; make cursor busy during compute!
var stream = PDataHub.newIndexStream(true);
view0.showData(stream);
		event.preventDefault();
	} // clickRecompute()


	function clickSetLayout(event)
	{
			// Clear previous selection
		// jQuery("#filter-list li").removeClass("selected");
		var setLayoutDialog;

		setLayoutDialog = jQuery("#dialog-set-layout").dialog({
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				Set: function() {
					// var selected = jQuery("#filter-list li.selected");
					// if (selected.length) {
					// 	createNewFilter(selected.data("type"), selected.data("id"));
					// }
						// Remove click handler
					setLayoutDialog.dialog("close");
				},
				Cancel: function() {
						// Remove click handler
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
				jQuery('#filter-list').append('<li data-type="a" data-id="'+theAttribute.id+'">'+theAttribute.def.l+'</li>');
				break;
			}
		});
		prspdata.e.vf.forEach(function(theVF, vIndex) {
			if (theVF.vf == 'Browser') {
				jQuery('#filter-list').append('<li data-type="v" data-id="'+vIndex+'">'+theVF.l+'</li>');
			}
		});

			// Handle selection of item
		jQuery('#filter-list').click(function(event) {
			if (event.target.nodeName == 'LI') {
				jQuery("#filter-list li").removeClass("selected");
				jQuery(event.target).addClass("selected");
			}
		});
	} // prepFilterData()


		// PURPOSE: Add a new filter to the stack
		// INPUT: 	fType = 'a' (Attribute) or 'b' (Facet Browser)
		//			fID = Attribute ID or index of Facet Browser
	function createNewFilter(fType, fID)
	{
console.log("Create Filter "+fType+", "+fID);
	} // createNewFilter()


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
						createNewFilter(selected.data("type"), selected.data("id"));
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

		// TO DO: Handle selection on setLayout modal

		// Filter Control Bar
	jQuery('#btn-new-filter').button({icons: { primary: 'ui-icon-search' }, text: false })
			.click(clickNewFilter);
	jQuery('#btn-toggle-filters').button({icons: { primary: 'ui-icon-arrow-2-n-s' }, text: false })
			.click(clickToggleFilters);

	prepFilterData();

		// Init hub using config settings
	PDataHub.init();

		// Initial primary visualization frame
	view0 = PViewFrame(0);
	view0.initDOM();
});
