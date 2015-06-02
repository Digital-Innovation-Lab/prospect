// This file contains:
//		PViewFrame Object
//		PViewModel abstract Class
//		PDataHub Module for handling data
//		PBootstrap for launching processes and organizing screen

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, w, p }


// ========================================================================
// PVizModel: An abstract class to be subclassed by specific visualizations

function PVizModel(viewFrame, frameID, vizSettings)
{
	this.vFrame   = viewFrame;
	this.frameID  = frameID;
	this.settings = vizSettings;

		// All subclasses must implement the following:
	// this.draw = function(IndexStream)
	// this.getPerspective = function()
	// this.setPerspective = function(pData)
	// this.getLayoutAtts = function()
	// this.selectLegend = function(tIndex, attID)
	// this.updateLegend = function(tIndex)
	// this.setSelection = function(viewParams, dataSet, ids)
	// this.teardown() = function()
} // PVizModel


PVizModel.prototype.initDOM = function()
{
} // PVizModel.initDOM


// ===================================
// VizMap: Class to visualize GIS maps


var VizMap = function(viewFrame, vSettings)
{
	PVizModel.call(this, vSettings, viewFrame);
		// Determine which 
} // ViewMap

VizMap.prototype = Object.create(PVizModel.prototype);

VizMap.prototype.constructor = VizMap;

VizMap.prototype.draw = function()
{
	// Do stuff
} // draw


// ========================================================================
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)

// INPUT: 	vizIndex = index for this visualization frame (0 or 1)

function PViewFrame(vizIndex)
{
	var instance = { };				// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var vizSelIndex = 0;			// index of currently selected Viz
	var vizModel = null;			// PVizModel currently in frame
	var legendIDs = [];				// Attribute IDs of Legend selections (one per Template)

	// PRIVATE FUNCTIONS
	//==================

		// PURPOSE: Return ID of Frame for 
	function getFrameID()
	{
		return '#view-frame-'+vizIndex;
	} // getFrameID()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vfIndex is index in Exhibit array
	function createViz(vfIndex)
	{
		var theVF = PDataHub.getVizIndex(vfIndex);

			// Remove current viz content
		if (vizModel)
			vizModel.teardown();

		// jQuery(getFrameID()+' .viz-content').empty();

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
			// Construct new Legend

		vizSelIndex = vfIndex;
	} // createViz()


	function selectChangeViz(event)
	{
		var selector = jQuery(getFrameID()+' .view-control-bar .view-viz-select option:selected');
		var newSelIndex   = selector.val();
console.log("Change frame's viz to # "+newSelIndex);
		createViz(newSelIndex);
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		jQuery(getFrameID()+' .legend-container').toggle('slide');
		event.preventDefault();
	} // clickShowHideLegend()


	function clickOpenSelection(event)
	{
		event.preventDefault();
	} // clickOpenSelection()


	function clickClearSelection(event)
	{
		event.preventDefault();
	} // clickClearSelection()


	function clickVizControls(event)
	{
		event.preventDefault();
	} // clickVizControls()


	function clickAnnotations(event)
	{
		event.preventDefault();
	} // clickAnnotations()


		// PURPOSE: 
	function doShowHideAll(tmpltIndex, show)
	{
console.log("doShowHideAll for template "+tmpltIndex+", set to "+show);
	} // doShowHideAll()


	function doLegendSelect(tmpltIndex, vIndex, show)
	{
console.log("Legend box "+vIndex+" for template "+tmpltIndex+", set to "+show);
	} // doLegendSelect()


		// PURPOSE: Make vIndex the only selected value for tmpltIndex Legend
	function doLegendSelectOnly(tmpltIndex, vIndex)
	{
console.log("Legend box "+vIndex+" only selected for template "+tmpltIndex);
	} // doLegendSelectOnly()


		// PURPOSE: Handle click anywhere on Legend
	function clickInLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
		var clickClass = event.target.className;
// console.log("Clicked class: "+clickClass);
		switch (clickClass) {
			// Turn on or off just this one value
		case 'legend-entry-check':
			var lgndEntry = jQuery(event.target).closest('.legend-entry');
			var isChecked = jQuery(event.target).is(':checked');
				// What does checkbox belong to?
			if (lgndEntry.hasClass('legend-sh')) {
				doShowHideAll(tmpltIndex, isChecked);
					// Must belong to a legend-entry
			} else {
				var vIndex = lgndEntry.data('index');
				doLegendSelect(tmpltIndex, vIndex, isChecked);
			}
			break;

			// Make this only selected value
		case 'legend-viz':
		case 'legend-value-title':
			var vIndex = jQuery(event.target).closest('.legend-entry').data('index');
			doLegendSelectOnly(tmpltIndex, vIndex);
			break;

		case 'legend-select':
		case '':
				// Ignore these
// console.log("Ignored");
			break;

		default:  // could be multiple
				// Show/Hide title?
			var shTitle = /legend-sh/i;
			if (clickClass.match(shTitle)) {
					// Simulate click
				var checkBox = jQuery(event.target).find('.legend-entry-check');
				var isChecked = !checkBox.is(':checked');
				checkBox.prop('checked', isChecked);
				doShowHideAll(tmpltIndex, isChecked);
			}
			break;
		}
	} // clickInLegend()


		// PURPOSE: Handle selecting a visual Attribute for a Template from menu
	function selectTmpltAttribute(event)
	{
		var selAttID = jQuery(event.target).val();
			// Determine Template to which this refers
		var tmpltIndex = jQuery(event.target).closest('.legend-template').data('index');
console.log("Selected Attribute ID '"+selAttID+'" for Template index '+tmpltIndex);
	} // selectTmpltAttribute()


		// PURPOSE: Set the Legend selection and update corresponding legend-value entries
		// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
		//			vIndex = index of Attribute in the Legend
		// NOTES: 	Does not affect menu selection itself
	function setLegend(lIndex, vIndex)
	{
		var group = jQuery(getFrameID()+' .legend-container .legend-template[data-index="'+
						lIndex+'"] .legend-group');
			// Clear any previous entries
		group.empty();
		var attIDSelection = PDataHub.getTLegendsIndex(lIndex);
		if (attIDSelection.length) {
			var newLegendID = attIDSelection[vIndex];
			legendIDs[lIndex] = newLegendID;
				// Insert new items
			var attDef = PDataHub.getAttID(newLegendID);
			attDef.l.forEach(function(legEntry, lgIndex) {
					// TO DO: Account for both icons and colors acc. to v string
					// TO DO: Handle children values (indented)
				var element = '<div class="legend-value legend-entry" data-index="'+lgIndex+'"><input type="checkbox" checked="checked" class="legend-entry-check"/>'+
							'<div class="legend-viz" style="background-color: '+legEntry.v+'"> </div> <span class="legend-value-title">'+legEntry.l+'</span></div>';
				group.append(element);
			});
		}
	} // setLegend()


	// INSTANCE METHODS
	//=================

		// PURPOSE: Do initialize of basic DOM elements in view frame
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
				.click(clickVizControls).next()
				.button({icons: { primary: 'ui-icon-document' }, text: false })
				.click(clickAnnotations);

		head = jQuery(getFrameID()+' .viz-content .legend-container');
		head.click(clickInLegend);

			// Create Legend containers and Handle selections
		prspdata.t.forEach(function(tmplt, tIndex) {
					// Create DIV structure for Template's Legend entry
			var newTLegend = jQuery('<div class="legend-template" data-index="'+tIndex+
							'"><div class="legend-title">'+tmplt.def.l+'</div></div>');
				// VizModel must create legend-locate entries
				// Create dropdown menu of visual Attributes
			var attSelection = PDataHub.getTLegendsIndex(tIndex);
			var newStr = '<select class="legend-select">';
			attSelection.forEach(function(attID, aIndex) {
				var attDef = PDataHub.getAttID(attID);
				newStr += '<option value="'+attID+'">'+attDef.def.l+'</option>';
			});
			newStr += '</select>';
			var newSelect = jQuery(newStr);
			newSelect.change(selectTmpltAttribute);
			jQuery(newTLegend).append(newSelect);
				// Create Hide/Show all checkbox
			jQuery(newTLegend).append('<div class="legend-entry legend-sh"><input type="checkbox" checked="checked" class="legend-entry-check"/>Hide/Show All</div><div class="legend-group"></div>');
			head.append(newTLegend);
			if (tIndex != (prspdata.t.length-1))
				head.append('<hr/>');
				// Insert new Legend DOM structure into Legend
			legendIDs.push(attSelection.length > 0 ? attSelection[0] : null);
				// Default selection is first Attribute ID
			setLegend(tIndex, 0);
		});

	}; // initDOM()

	return instance;
} // ViewFrame


// ==========================================================
// PFilterModel: An abstract class for data filters

// INPUT: fIndex = index for this filter

function PFilterModel(fIndex)
{

		// All subclasses must implement the following:
	// this.evaluateRec(theRec)
} // FilterModel


// ==========================================================
// PDataHub
// PURPOSE: Manages all data, orchestrates data streams, etc.

// USES: jQuery (for AJAX)

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			PDataHub is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// TO DO: 	Change LOAD_DATA_CHUNK to Option setting passed by prspdata

var PDataHub = (function () {

	// CONSTANTS
	// =========

	var LOAD_DATA_CHUNK = 1000;


	// INTERNAL VARIABLES
	// ==================

	var allData = [];				// "head" array of all Records, one entry per Template type
									// Corresponding to prspdata.t
									// { l = # loaded, i = initial index for these records, d = data array itself }
	var allDataCount=0;				// Total number of Records
	var allVs = [];					// array of all Views
	var allLegends = [];			// Legend info, corresponding to Templates
									// each entry is array of Attribute IDs that can act as Legends


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
				allData[tIndex].l += count;
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
			var current = allData[i].l;
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
		if (done)
			flowFromTop();
	} // checkDataLoad()


	return {
			// PURPOSE: Initialize data hub, initiate data loading
		init: function()
		{
				// For each entry: head entry for Record Data and collect Legends
			prspdata.t.forEach(function(tmplt) {
					// Head Record entry
				var newTData = { l: 0, d: null };
				allData.push(newTData);
				allDataCount += tmplt.n;
					// New Legend entry; check all Attributes
				var lgndArray = [];
				tmplt.def.a.forEach(function(tAttID) {
					var theAtt = PDataHub.getAttID(tAttID);
						// Must be appropriate type and have Legend entries
					switch (theAtt.def.t) {
					case 'Text':
					case 'Vocabulary':
					case 'Number':
					case 'Dates':
						if (theAtt.l.length)
							lgndArray.push(tAttID);
						break;
					}
				});
				allLegends.push(lgndArray);
			});
			checkDataLoad();
		}, // init()


			// PURPOSE: Create an array of indices for each object in full data stream
		newIndexStream: function()
		{
			// var size = allData.length;
			// var dataStream = new Array(size);
			// for (var i=0; i<size; i++)
			// 	dataStream[i] = 0;
			// return datastream;

			var newStream = new Int16Array(allDataCount);
			return newStream;
		}, // newIndexStream()


			// RETURNS: Attribute with this ID
			// TO DO:   Use binary search
		getAttID: function(attID)
		{
			for (var i=0; i<prspdata.a.length; i++) {
				var thisID = prspdata.a[i].id;
				if (attID == thisID)
					return prspdata.a[i];
			}
		}, // getAttID()


		getAttIndex: function(aIndex)
		{
			return prspdata.a[aIndex];
		}, // getAttIndex()

		getTmpltNum: function()
		{
			return prspdata.t.length;
		},

		getTmpltIndex: function(tIndex)
		{
			return prspdata.t[tIndex];
		},

			// PURPOSE: Return array of Attribute IDs available as Legends for Template by index
		getTLegendsIndex: function(tIndex)
		{
			return allLegends[tIndex];
		}, // getTLegendsIndex()


		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		} // getVizIndex()
	} // return
})();


// PBootstrap -- Bootstrap for Prospect Client
// PURPOSE: Create DOM structure, initiate services …

// USES: 	jQuery, jQueryUI, …
// ASSUMES: prspdata is set


jQuery(document).ready(function($) {

		// CONSTANTS
		//==========


		// VARIABLES
		//==========

		// FUNCTIONS
		//==========

	function clickSetLayout(event)
	{
		event.preventDefault();
	} // clickSetLayout()


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


	function clickGoHome(event)
	{
		event.preventDefault();
	} // clickGoHome()


		// IMMEDIATE EXECUTION
		//====================

	if (prspdata.e.g.l != '')
		jQuery('#title').append(prspdata.e.g.l);

		// Command Bar
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickSetLayout);
	jQuery('#btn-new-filter').button({icons: { primary: 'ui-icon-search' }, text: false })
			.click(clickNewFilter);
	jQuery('#btn-home').button({icons: { primary: 'ui-icon-home' }, text: false })
			.click(clickGoHome);

	prepFilterData();

		// Init hub using config settings
	PDataHub.init();

		// Initial primary visualization frame
	var view0 = PViewFrame(0);
	view0.initDOM();
});
