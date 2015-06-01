// This file contains:
//		ViewFrame Object
//		ViewModel abstract Class
//		DataHub Module for handling data
//		Bootstrap for launching processes and organizing screen

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, w, p }

// ========================================================================
// ViewFrame: Pseudo-object that manages contents of visualization frame

// INPUT: 	vizIndex = index for this visualization frame (0 or 1)

function ViewFrame(vizIndex)
{
	var instance = { };					// used to create pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var selView = 0;				// index of currently selected View
	var selLegends = [];			// names of Legend selections (one per Template)

	// PRIVATE FUNCTIONS
	//==================

	function clickChangeView(event)
	{
		var selector = jQuery('#view-frame-'+vizIndex+' .view-control-bar .view-viz-select option:selected');
		var newSelIndex   = selector.val();
		selView = newSelIndex;
			// TO DO: Create Visualization Object
	} // clickChangeView()


	function clickShowHideLegend(event)
	{
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


	// INSTANCE METHODS
	//=================

		// PURPOSE: Do initialize of basic DOM elements in view frame
	instance.initDOM = function()
	{
		var head = jQuery('#view-frame-'+vizIndex+' .view-control-bar .view-viz-select');
			// Set Dropdown to View names
		prspdata.e.vf.forEach(function(theVF, i) {
				// Don't treat Facet Browser as View
			if (theVF.vf != 'Browser') {
				var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
				head.append(optionStr);
			}
		});
		head.change(clickChangeView);

			// Hook control bar Icon buttons
		head = jQuery('#view-frame-'+vizIndex+' .view-control-bar button:first');
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
	}; // initDOM()

	return instance;
} // ViewFrame


// ======================================================================
// ViewModel: An abstract class to be subclassed by specific visualizations

function ViewModel(viewFrame, viewParams)
{
	this.instParams = viewParams;		// instance parameters

		// All subclasses must implement the following:
	// this.streamIn = function(IndexStream)
	// this.getPerspective = function()
	// this.setPerspective = function(pData)
	// this.selectLegend = function()
	// this.setSelection = function(viewParams, dataSet, ids)
} // ViewModel


// ==========================================================
// FilterModel: An abstract class for data filters

// INPUT: fIndex = index for this filter

function FilterModel(fIndex)
{

		// All subclasses must implement the following:
	// this.evaluateRec(theRec)
} // FilterModel


// ==========================================================
// DataHub
// PURPOSE: Manages all of the data, implements Filters, feeds data streams, etc.

// USES: jQuery

// NOTES: 	There is only one hub at a time so no need for instantiating instances
//			DataHub is implemented with the "Module" design pattern for hiding
//				private variables and minimizing external interference
// TO DO: 	Change LOAD_DATA_CHUNK to Option setting passed by prspdata

var DataHub = (function () {

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
				// Create empty entries
			prspdata.t.forEach(function(tmplt) {
				var newTData = { l: 0, d: null };
				allData.push(newTData);
				allDataCount += tmplt.n;
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


		getVizIndex: function(vIndex)
		{
			return prspdata.e.vf[vIndex];
		} // getVizIndex()
	} // return
})();


// Bootstrap -- Bootstrap for Prospect Client
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
	DataHub.init();
	var view0 = ViewFrame(0);
	view0.initDOM();
});
