// Volume Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// USES:    jQuery, Underscore, jQueryUI, and Ractive
// ASSUMES: All data not to be edited by user passed in prspdata
//			All data to be edited by user passed in hidden fields


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


jQuery(document).ready(function() {

	Ractive.decorators.iconButton = function (node, icon) {
		jQuery(node).button({
			text: false,
			icons: { primary: icon }
		});

		return {
			teardown: function () {
				jQuery(node).button('destroy');
			}
		}
	};

		// Assumes toggle button within DIV coming before DIV to hide/close!
	Ractive.decorators.togDiv = function (node, theDiv) {
		var thisTog = jQuery(node).button({
			text: false,
			icons: { primary: 'ui-icon-carat-2-n-s' }
		}).click(function() {
			jQuery(this).parent().next().slideToggle(400);
			return false;
		});

		return {
			teardown: function () {
				thisTog.button('destroy');
			}
		}
	};


		// Create Ractive component to wrap jQueryUI Dialog
	var RJDialogComponent = Ractive.extend({
		template: '#dialog-r-template',
		data: function() {
			return {
				title: '',
				width: 350,
				height: 300,
				cancel: true
			}
		}, // data

			// Intercept render to insert and active jQueryUI plugin
		onrender: function() {
			var self = this;
			var thisComponent = this.find('*');
			var theButtons = [ {
					text: 'OK',
					click: function() {
						self.fire('ok');
					}
				} ];
			if (self.get('cancel')) {
				theButtons.push( {
					text: 'Cancel',
					click: function() {
						self.fire('cancel');
					}
				} );
			}
			self.modal = jQuery(thisComponent).dialog({
				dialogClass: "no-close",
				width: self.get('width'),
				height: self.get('height'),
				modal : true,
				autoOpen: true,
				buttons: theButtons
			});
		}, // onrender

			// Intercept teardown so that jQueryUI component destroyed
		onteardown: function () {
			this.modal.dialog('destroy');
		} // onteardown
	});

	var RJIrisColor = Ractive.extend({
		template: '#iris-r-template',
		data: function() {
			return {
				color: ''				// the selected color
			}
		}, // data
		onrender: function() {
			var self = this;
			var thisComponent = this.find('.jq-iris-template');

			jQuery(thisComponent).iris({
				width: 200,
				hide: false,
				palettes: true,
				change: function(event, ui) {
					self.set('color', ui.color.toString());
				}
			});
		}, // onrender()

			// Intercept teardown to create jQueryUI component
		onteardown: function () {
			var thisComponent = this.find('.jq-iris-template');
			jQuery(thisComponent).iris('destroy');
		} // onteardown()
	});

		// Create Ractive component to wrap jQueryUI Accordion
	var RJAccordionComponent = Ractive.extend({
		template: '#accordion-r-template',
			// Intercept render to insert and active jQueryUI plugin
		onrender: function() {
			var self = this;
			var thisComponent = this.find('.jq-accordion-template');
			self.acc = jQuery(thisComponent).accordion({
				heightStyle: "content"
			});
		}, // onrender

			// Intercept teardown so that jQueryUI component destroyed
		onteardown: function () {
			this.acc.accordion('destroy');
		} // onteardown
	});

		// Create Ractive component to wrap jQueryUI Tabs
	var RJTabsComponent = Ractive.extend({
		template: '#tabs-r-template',
			// Intercept render to insert and active jQueryUI plugin
		onrender: function() {
			var self = this;
			var thisComponent = this.find('.jq-tabs-template');
			self.tabs = jQuery(thisComponent).tabs();
		}, // onrender

			// Intercept teardown so that jQueryUI component destroyed
		onteardown: function () {
			this.tabs.tabs('destroy');
		} // onteardown
	});

		// CONSTANTS
		// =========

		// DATA LOADED FROM SERVER
		// =======================
		// List of all currently defined Attributes
	var defAtts = prspdata.atts;				// { id, p, def }
		// List of all currently defined Templates; joins Object is added to it
	var defTemplates = prspdata.templates;		// { id, def, joins }


		// LIVE DATA ABOUT THIS VOLUME
		// ==============================
		// NOTE: Some of this is temporarily generated for purposes of editing and is compiled
		//			before saving
	var embed;

		// General Attributes
	var volID = jQuery('input[name="prsp_vol_id"]').val();

	var defGen = { l: '', hbtn: '', hurl: '', ts: [], tour: false, dspr: false, auto: true };
	embedData = jQuery('textarea[name="prsp_vol_gen"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defGen = JSON.parse(embedData);
			// Create default setting for Help Tour if not defined (added in 1.7)
		if (typeof defGen.tour === 'undefined') {
			defGen.tour = false;
		}
			// Create default setting for Disable Perspectives if not defined (added in 1.7)
		if (typeof defGen.dspr === 'undefined') {
			defGen.dspr = false;
		}
			// Create default setting for Disable Perspectives if not defined (added in 1.7)
		if (typeof defGen.auto === 'undefined') {
			defGen.auto = true;
		}
	}

		// Configurations of Views
	var defViews = [ ];
	embedData = jQuery('textarea[name="prsp_vol_views"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defViews = JSON.parse(embedData);
	}
		// Configurations of Inspector
	var defInspect = {	modal: { aOn: false, scOn: false, ytOn: false, tOn: false, t2On: false, atts: [] },
						sc: { atts: [] }, yt: { atts: [] }, t: { t1Atts: [], t2Atts: [], tcAtts: [] },
						srOff: false, w: '', h: ''
					 };
	embedData = jQuery('textarea[name="prsp_vol_inspect"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defInspect = JSON.parse(embedData);
			// Create default override width & height if not defined
		if (typeof defInspect.w === 'undefined') {
			defInspect.w = '';
		}
		if (typeof defInspect.h === 'undefined') {
			defInspect.h = '';
		}
			// Create native audio setting if missing
		if (typeof defInspect.modal.aOn === 'undefined') {
			defInspect.modal.aOn = false;
		}
			// Create default setting for disable See Record button (1.6.1)
		if (typeof defInspect.srOff === 'undefined') {
			defInspect.srOff = false;
		}
	}

		// Read text labels for visualization types: c[ode], l[abel]
	var vfTypes=[];
	embed = document.getElementById('dltext-visualizations').innerHTML;
	embed = embed.trim().split('|');
	embed.forEach(function(vType) {
		var p = vType.split(',');
		vfTypes.push({c: p[0], l: p[1]});
	});
	var vfLookup={};
	vfTypes.forEach(function(vType) {
		vfLookup[vType.c] = vType.l;
	});

		// RUN-TIME VARS
		// =============
	var rApp;							// the main Ractive application
	var errTimer;
	var errorString = '';				// error readout

	var vizInc=0;						// Counter used to give every volume a unique ID

		// Configuration data for all possible independent Templates
		//	The array Atts include fully unpacked join Atts in dot notation
		//	{	tid: this Template ID,
		//		use: used by this Volume (true/false),
		//		attsTxt: array of Text Attributes from Template
		//		attsDNum: array of Number Attributes (w/"disable")
		//		attsDates: array of Dates Atts
		//		attsDLL: array of Lat-Lon Atts (w/"disable")
		//		attsLL: array of Lat-Lon Atts
		//		attsXY: array of X-Y Atts (w/"disable")
		//		attsImg: array of Image Atts (w/"disable")
		//		attsLink: array of Link Atts
		//		attsSC: array of SoundCloud Atts
		//		attsYT: array of YouTube Atts
		//		attsTrns: array of Transcript Atts
		//		attsTC: array of Timecode Atts
		//		attsPtr: array of Pointer Atts
		//		attsDPtr: array of Pointer Atts (w/"disable")
		//		attsLgnd: array of all Atts that can supply a Legend
		//		attsCnt: array of Atts that can display any kind of content
		//		attsTCnt: array of Atts that can display textual content
		//		attsOAtt: array of Atts that can be given single sort order (no multiple values!)
		//		attsFct: array of Atts that can be Facets (discrete values to which Record can be assigned)
		//	}
	var iTemplates = [ ];
		// Array of all (open) Attribute definitions after Joins done
	var defJoinedAtts = [ ];
		// Array of all (open) Facet Attribute definitions after Joins done
	var defJoinedFacets = [ ];

		// CODE
		// ====

		// PURPOSE: Retrieve language-dependent text embedded in script
	function getText(scriptName)
	{
		return jQuery(scriptName).html().trim();
	}

		// PURPOSE: Retrieve language-dependent text and insert variables
		// INPUT:   scriptName = name of script text in DOM
		//          vars = names and values of variables in text
	// function compileText(scriptName, vars)
	// {
	// 	var baseText = jQuery(scriptName).html().trim();
	// 	var template = _.template(baseText);

	// 	return template(vars);
	// } // compileText()


		// PURPOSE: Show error message for 5 seconds
	function displayError(errID, append, ok)
	{
			// If a clear-error timer is set, cancel it
		if (errTimer) {
			clearTimeout(errTimer);
			jQuery('#error-frame').removeClass('ok');
		}
		var newError = getText(errID);
		if (append) {
			newError += ' '+append+'.';
		}
		rApp.set('errorMsg', newError);
		if (ok === true) {
			jQuery('#error-frame').addClass('ok');
		}
		errTimer = setTimeout(function() { rApp.set('errorMsg', ''); jQuery('#error-frame').removeClass('ok'); }, 5000);
	} // displayError()


		// RETURNS: Attribute definition from ID
		// NOTE:	ONLY checks predefined Attributes, NOT Joined Attributes
	function getAttribute(attID)
	{
		return _.find(defAtts, function(theAtt) { return theAtt.id === attID; });
	} // getAttribute()

		// RETURNS: Attribute definition from ID
		// NOTE:	Checks ALL Attributes, inc. Joined Attributes
	function getJAttribute(attID)
	{
		return _.find(defJoinedAtts, function(theAtt) { return theAtt.id === attID; });
	} // getJAttribute()

		// INPUT: iTemplate = the independent Template definition, jAttID = Join Attribute ID
		// RETURNS: Dependent Template definition
	function getDependentTemplate(iTemplate, jAttID)
	{
		var join = _.find(iTemplate.joins, function(theJoin) { return theJoin.id === jAttID; });
		var dTemplate = _.find(defTemplates, function(theDTmplt) { return theDTmplt.id === join.t; });
		return dTemplate;
	} // getDependentTemplate()

		// PURPOSE: Get index for independent Template in original configuration
		// RETURNS: index (0..n) or -1
	function getTemplateIndex(tmpltID)
	{
		return defGen.ts.findIndex(function(theAttID) { return theAttID == tmpltID; });
	} // getTemplateIndex()

		// PURPOSE: Allow user to choose a color
		// INPUT: 	initColor is the initial color
		// RETURNS: New color (as hex string) or null if cancal
	function chooseColor(keypath)
	{
		var c = rApp.get(keypath);

		var colorPicker = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-color',
			data: {
				color: c
			},
			components: {
				dialog: RJDialogComponent,
				iris: RJIrisColor
			}
		}); // new Ractive()
		colorPicker.on('dialog.ok', function() {
			var finalColor = colorPicker.get('color');
			colorPicker.teardown();
			rApp.set(keypath, finalColor);
		});
		colorPicker.on('dialog.cancel', function() {
			colorPicker.teardown();
		});
	} // chooseColor()

		// PURPOSE: Check basic data provided by the user for Template definition
		// RETURNS: false if definition has errors, otherwise array:
		//			[0] = gen settings conf object, [1] = indices of Template entries to save
		// SIDE-FX: sets errorMsg to explanation of error
	function doErrorCheck()
	{
		var saveGen = { };
		var saveTIndices = [];

		var volumeID = rApp.get('volID').trim();
		if (volumeID.length == 0 || volumeID.length > 24) {
			displayError('#errmsg-id');
			return false;
		}

		var volumeL = rApp.get('genSettings.l').replace(/"/g, '').trim();
		if (volumeL.length == 0 || volumeL.length > 48) {
			displayError('#errmsg-label');
			return false;
		}
		saveGen.l = volumeL;
		saveGen.hbtn = rApp.get('genSettings.hbtn').trim();
		saveGen.hurl = rApp.get('genSettings.hurl').trim();
		saveGen.tour = rApp.get('genSettings.tour');
		saveGen.dspr = rApp.get('genSettings.dspr');
		saveGen.auto = rApp.get('genSettings.auto');
		saveGen.ts = [];

		for (var i=0; i<iTemplates.length; i++) {
			var used = rApp.get('iTemplates['+i+'].use');
			if (used) {
				saveGen.ts.push(rApp.get('iTemplates['+i+'].tid'));
				saveTIndices.push(i);
			}
		}

		if (saveGen.ts.length == 0 || saveGen.ts.length > 4) {
			displayError('#errmsg-num-templates');
			return false;
		}
		return [saveGen, saveTIndices];
	} // doErrorCheck()


		// PURPOSE: Present a confirmation modal
		// RETURNS: true if OK, false if Cancel
	function confirmModal(msgID, callback)
	{
		var mText = getText(msgID);
		var modalDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-confirm',
			data: {
				message: mText
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		modalDialog.on('dialog.ok', function() {
			if (callback)
				callback();
			modalDialog.teardown();
			return false;
		});
		modalDialog.on('dialog.cancel', modalDialog.teardown);
	} // confirmModal()

		// PURPOSE: Present user message in modal dialog box
	function messageModal(mText)
	{
		var modalDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-message',
			data: {
				message: mText
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		modalDialog.on('dialog.ok', function() {
			modalDialog.teardown();
			return false;
		});
	} // messageModal()


		// Compile array about independent Template types from input configuration data
		//	into format usable by edit GUI
		//  'disable' applies to features that can be turned on or off
		//	'' (empty) means no suitable choice exists for required setting
		// Also compile list of all Attributes (Joined and unjoined)
	_.forEach(defTemplates, function(theTmplt) {
		if (!theTmplt.def.d) {
			var attsTxt=[], attsDates=['disable'], attsDNum=['disable'], attsLL=[], attsDLL=['disable'],
				attsXY=['disable'], attsImg=['disable'], attsSC=['disable'], attsYT=['disable'],
				attsTrns=['disable'], attsTC=['disable'], attsPtr=[], attsDPtr=['disable'],
				attsLgnd=[], attsCnt=[], attsTCnt=[], attsOAtt=[], attsFct=['disable'];

			_.forEach(theTmplt.def.a, function(theAttID) {
				function saveAttRef(prefix, theAttID, type)
				{
					switch (type) {
					case 'V':
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'T':
						attsTxt.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						attsOAtt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'g':
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'N':
						attsDNum.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsOAtt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'D':
						attsLgnd.push(prefix+theAttID);
						attsDates.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						attsOAtt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'L':
						attsDLL.push(prefix+theAttID);
						attsLL.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						break;
					case 'X':
						attsXY.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						break;
					case 'I':
						attsCnt.push(prefix+theAttID);
						attsImg.push(prefix+theAttID);
						break;
					case 'l': // Link To
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						break;
					case 'S':
						attsSC.push(prefix+theAttID);
						break;
					case 'Y':
						attsYT.push(prefix+theAttID);
						break;
					case 'x': 	// Transcript
						attsTrns.push(prefix+theAttID);
						break;
					case 't': 	// Timecode
						attsTC.push(prefix+theAttID);
						break;
					case 'P':
						attsPtr.push(prefix+theAttID);
						attsDPtr.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsTCnt.push(prefix+theAttID);
						break;
					}
				} // saveAttRef()

				var attDef = getAttribute(theAttID);
					// Ignore Attributes that have been deleted since Template edited (and give error)
				if (attDef) {
					switch (attDef.def.t) {
						// Do Join for dependent Template Attributes
					case 'J':
						var dTemplate = getDependentTemplate(theTmplt, attDef.id);
						_.forEach(dTemplate.def.a, function(joinAttID) {
							var joinAtt = getAttribute(joinAttID);
								// Restrict to "Open" level of security
							if (joinAtt.p == 'o') {
								saveAttRef(attDef.id+'.', joinAttID, joinAtt.def.t);
									// If Joined Attribute not in global list, add it
								var joinedID = attDef.id+'.'+joinAttID;
								if (getJAttribute(joinedID) == null)
								{
									var clonedAtt = _.clone(joinAtt);
									clonedAtt.id = joinedID;
									defJoinedAtts.push(clonedAtt);
								}
							}
						});
						break;
					default:
							// Restrict to "Open" level of security
						if (attDef.p == 'o') {
								// Does it need to be added to global list of Joined Attributes?
							if (getJAttribute(theAttID) == null) {
								defJoinedAtts.push(_.clone(attDef));
							}
							saveAttRef('', theAttID, attDef.def.t);
						}
						break;
					}
				} else {
					confirmModal('#errmsg-tmplt-delid', null);
					console.log("Attribute ID "+theAttID+" cannot be found and will no longer be available in Template "+theTmplt.id);
				}
			}); // forEach Template Att

				// Is Template ID given in existing configuration?
			var isUsed = getTemplateIndex(theTmplt.id) != -1;

			var tmpltEntry = { tid: theTmplt.id, use: isUsed,
								attsTxt: attsTxt, attsDates: attsDates, attsDNum: attsDNum,
								attsLL: attsLL, attsDLL: attsDLL, attsXY: attsXY, attsImg: attsImg, attsSC: attsSC,
								attsYT: attsYT, attsTrns: attsTrns, attsTC: attsTC, attsPtr: attsPtr,
								attsDPtr: attsDPtr, attsLgnd: attsLgnd, attsCnt: attsCnt, attsTCnt: attsTCnt,
								attsOAtt: attsOAtt, attsFct: attsFct
							};
			iTemplates.push(tmpltEntry);
		}
	});
		// Sort Joined Attributes by ID
	defJoinedAtts = _.sortBy(defJoinedAtts, 'id');

		// Compile Joined Facets from Joined Attributes
	_.forEach(defJoinedAtts, function(theJAtt) {
		switch (theJAtt.def.t) {
		case 'T':
		case 'V':
		case 'g':
		case 'N':
		case 'D':
			defJoinedFacets.push(_.clone(theJAtt));
			break;
		}
	});

		// Create list of Attribute IDs of all Joined facets for drop-down menu
	var facetAttIDs = defJoinedFacets.map(function(f) { return f.id; });

		// PURPOSE: Created expanded array with useAtt: false if selArray not in fullArray
		// INPUT:   fullArray = complete list of potential Attributes
		//			selArray = list of just those Attributes selected to display
		// NOTE:    *Must* keep selected Attributes in the order of this array -- order of unselected
		//				don't matter
	function createPaddedAtts(fullArray, selArray)
	{
		var padded = [];
			// Don't include any deleted Attribute IDs
		selArray.forEach(function(theAtt) {
			if (fullArray.findIndex(function(a) { return a == theAtt; }) != -1)
				padded.push({ attID: theAtt, useAtt: true });
		});
		var unused = _.difference(fullArray, selArray);
		unused.forEach(function(theAtt) {
			padded.push({ attID: theAtt, useAtt: false });
		})
		return padded;
	} // createPaddedAtts

		// PURPOSE: Ensure that attID exists as a potential option
		// INPUT: 	attID is the Attribute ID previously saved
		//			possible is the array of valid IDs
		//			def is the default setting (if any)
		// NOTES: 	This is guard against case that user has deleted Attribute
		//			If attID is '' (no previous saved value) and default is '', need to get value from possible
	function checkAttID(attID, possible, def)
	{
			// Was not previously set and no default
		if (attID == null && def === '' && possible.length > 0) {
			return possible[0];
		}
			// Previously unset
		if (typeof attID == 'undefined' || attID == null) {
			return def;
		}
			// Disable
		if (attID == 'disable') {
			return attID;
		}
			// No current options
		if (typeof possible == 'undefined' || possible == null) {
			return def;
		}
			// Attribute ID does exist in current list of possible IDs
		if (possible.indexOf(attID) == -1) {
			return def;
		}
		return attID;
	} // checkAttID()

		// Closure for temporary vars
		// Initialize settings to correspond to iTemplates structures
	(function() {
		var newSCAtts=[], newYTAtts=[], newT1Atts=[], newT2Atts=[], newTCAtts=[],
			newModalAtts=[];
		_.forEach(iTemplates, function(theTmplt) {

			var origTIndex = getTemplateIndex(theTmplt.tid);
				// Is Template absent in original configuration?
			if (origTIndex == -1) {
					// Initialize inspectSettings so that everything starts disabled
				newSCAtts.push('disable');
				newYTAtts.push('disable');
				newT1Atts.push('disable');
				newT2Atts.push('disable');
				newTCAtts.push('disable');
					// Initialize with all content Attributes
				newModalAtts.push(_.map(theTmplt.attsCnt, function(theCntAtt) {
								return { attID: theCntAtt, useAtt: true };
							}));
			} else {
				newSCAtts.push(checkAttID(defInspect.sc.atts[origTIndex], theTmplt.attsSC, 'disable'));
				newYTAtts.push(checkAttID(defInspect.yt.atts[origTIndex], theTmplt.attsYT, 'disable'));
				newT1Atts.push(checkAttID(defInspect.t.t1Atts[origTIndex], theTmplt.attsTrns, 'disable'));
				newT2Atts.push(checkAttID(defInspect.t.t2Atts[origTIndex], theTmplt.attsTrns, 'disable'));
				newTCAtts.push(checkAttID(defInspect.t.tcAtts[origTIndex], theTmplt.attsTC, 'disable'));
					// Fill in unused Attributes with useAtt: false
				newModalAtts.push(createPaddedAtts(theTmplt.attsCnt, defInspect.modal.atts[origTIndex]));
			} // in original config
		}); // for iTemplate
			// Save recomputed values
		defInspect.sc.atts = newSCAtts;
		defInspect.yt.atts = newYTAtts;
		defInspect.t.t1Atts = newT1Atts;
		defInspect.t.t2Atts = newT2Atts;
		defInspect.t.tcAtts = newTCAtts;
		defInspect.modal.atts = newModalAtts;
	})();

		// Initialize View settings to correspond to iTemplates structures
	(function() {
		for (var i=0; i<defViews.length; i++) {
			var theVF = defViews[i];
				// Assign each one a temporary unique ID (only used by Editor)
			theVF.incID = vizInc++;
				// Create blank comment if doesn't already exist
			if (typeof theVF.n == 'undefined')
				theVF.n = '';
			switch (theVF.vf) {
			case 'M': 	// Map
				var newLL=[], newLgnds=[], newPAtts=[], newSAtts=[], newLClrs=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLL.push(_.map(theTmplt.attsLL, function(theLLAtt) {
								return { attID: theLLAtt, useAtt: true };
							}));
						newPAtts.push('disable');
						newLClrs.push('#FFD700');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newLL.push(createPaddedAtts(theTmplt.attsLL, theVF.c.cAtts[origTIndex]));
						newPAtts.push(checkAttID(theVF.c.pAtts[origTIndex], theTmplt.attsDPtr, 'disable'));
						newLClrs.push(theVF.c.lClrs[origTIndex]);
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.cAtts = newLL;
				theVF.c.pAtts = newPAtts;
				theVF.c.lClrs = newLClrs;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'p': 	// Map2
				var newLL=[], newLgnds=[], newSAtts=[], newLClrs=[], newTClrs=[], newLbls=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLL.push(theTmplt.attsDLL[0] || 'disable');
						newLClrs.push('#FFD700');
						newTClrs.push('');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newLbls.push('n');
					} else {
						newLL.push(checkAttID(theVF.c.cAtts[origTIndex], theTmplt.attsDLL, 'disable'));
						newLClrs.push(theVF.c.lClrs[origTIndex]);
							// New setting added v1.7
						if (typeof theVF.c.tClrs === 'undefined') {
							newTClrs.push('');
						} else {
							newTClrs.push(theVF.c.tClrs[origTIndex]);
						}
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newLbls.push(theVF.c.lbls[origTIndex]);
					}
				});
				theVF.c.cAtts = newLL;
				theVF.c.lClrs = newLClrs;
				theVF.c.tClrs = newTClrs;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				theVF.c.lbls  = newLbls;
				break;
			case 'C': 	// Cards
				var newLgnds=[], newIAtts=[], newCnt=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newCnt.push(_.map(theTmplt.attsTCnt, function(theCnt) {
								return { attID: theCnt, useAtt: true };
							}));
						newIAtts.push(theTmplt.attsImg[0] || 'disable');
					} else {
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newCnt.push(createPaddedAtts(theTmplt.attsTCnt, theVF.c.cnt[origTIndex]));
						newIAtts.push(checkAttID(theVF.c.iAtts[origTIndex], theTmplt.attsImg, 'disable'));
					}
				});
				theVF.c.cnt = newCnt;
				theVF.c.iAtts = newIAtts;
				theVF.c.lgnds = newLgnds;
					// Ensure it has a value if older version of data in use
				if (typeof theVF.c.v === 'undefined') {
					theVF.c.v = false;
				}
				break;
			case 'P': 	// Pinboard
				var newXY=[], newLgnds=[], newPAtts=[], newSAtts=[], newLClrs=[];

				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newXY.push(theTmplt.attsXY[0] || 'disable');
						newPAtts.push('disable');
						newLClrs.push('#FFD700');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newXY.push(checkAttID(theVF.c.cAtts[origTIndex], theTmplt.attsXY, 'disable'));
						newPAtts.push(checkAttID(theVF.c.pAtts[origTIndex], theTmplt.attsDPtr, 'disable'));
						newLClrs.push(theVF.c.lClrs[origTIndex]);
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});

				theVF.c.cAtts = newXY;
				theVF.c.pAtts = newPAtts;
				theVF.c.lClrs = newLClrs;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'T': 	// Timeline
				var newD=[], newLgnds=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newD.push(theTmplt.attsDates[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newD.push(checkAttID(theVF.c.dAtts[origTIndex], theTmplt.attsDates, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.dAtts = newD;
				theVF.c.lgnds = newLgnds;
				break;
			case 'D': 	// Directory
				var newCnt = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newCnt.push(_.map(theTmplt.attsCnt, function(theCnt) {
								return { attID: theCnt, useAtt: true };
							}));
					} else {
						newCnt.push(createPaddedAtts(theTmplt.attsCnt, theVF.c.cnt[origTIndex]));
					}
				});
				theVF.c.cnt = newCnt;
				break;
			case 't': 	// TextStream
				var newCnt=[], newOrder=[], newLgnds=[], newSize=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newCnt.push(theTmplt.attsTCnt[0] || '');
						newOrder.push(theTmplt.attsOAtt[0] || '');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSize.push(theTmplt.attsDNum[0] || 'disable');
					} else {
						newCnt.push(checkAttID(theVF.c.cnt[origTIndex], theTmplt.attsTCnt, ''));
						newOrder.push(checkAttID(theVF.c.order[origTIndex], theTmplt.attsOAtt, ''));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSize.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
					}
				});
				theVF.c.cnt = newCnt;
				theVF.c.order = newOrder;
				theVF.c.lgnds = newLgnds;
				theVF.c.sAtts = newSize;
				break;
			case 'N': 	// Network Wheel
				var newPAtts=[], newLgnds=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newPAtts.push([]);
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						var newP=[];
						theVF.c.pAtts[origTIndex].forEach(function(p) {
							newP.push({ pid: checkAttID(p.pid, theTmplt.attsPtr, ''), clr: p.clr });
						});
						newPAtts.push(newP);
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.pAtts = newPAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'n': 	// Network Graph
				if (typeof theVF.c.s === 'undefined') {
					theVF.c.s = 500;
				}
				var newPAtts=[], newSAtts=[], newLgnds=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newPAtts.push([]);
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						var newP=[];
						theVF.c.pAtts[origTIndex].forEach(function(p) {
							newP.push({ pid: checkAttID(p.pid, theTmplt.attsPtr, ''), clr: p.clr });
						});
						newPAtts.push(newP);
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.pAtts = newPAtts;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'b':	// Bucket Matrix
				var newPAtts=[], newOAtts=[], newLgnds=[];
				if (typeof theVF.c.nr === 'undefined') {
					theVF.c.nr = 4;
				}
				if (typeof theVF.c.bw === 'undefined') {
					theVF.c.bw = 8;
				}
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newPAtts.push([]);
						newOAtts.push('disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						var newP=[];
						theVF.c.pAtts[origTIndex].forEach(function(p) {
							newP.push({ pid: checkAttID(p.pid, theTmplt.attsPtr, ''), clr: p.clr });
						});
						newPAtts.push(newP);
						newOAtts.push(checkAttID(theVF.c.oAtts[origTIndex], theTmplt.attsFct, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.pAtts = newPAtts;
				theVF.c.oAtts = newOAtts;
				theVF.c.lgnds = newLgnds;
				break;
			} // switch viewtype
		} // for views
	})();

	PMapHub.init(prspdata.maps);

		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			volID: volID,
			genSettings: defGen,
			iTemplates: iTemplates,
			inspectSettings: defInspect,
			viewSettings: defViews,
			vfLookup: vfLookup,
			facets: defJoinedFacets,
			errorMsg: errorString,
			baseMaps: PMapHub.getBaseLayers(),
			layerMaps: PMapHub.getOverlays(),
			mapGroups: prspdata.map_groups
		},
		components: {
			accordion: RJAccordionComponent,
			tabs: RJTabsComponent
		}
	});

		// Create a blank new View/Filter
	rApp.on('addView', function() {
		var label = '';
		var vfType = vfTypes[0].c;
		var newDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-vf',
			data: {
				label: label,
				vfType: vfType,
				vfTypes: vfTypes
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		newDialog.on('dialog.ok', function() {
			var newVFEntry = { };
			newVFEntry.incID = vizInc++;
			newVFEntry.l = newDialog.get('label');
			newVFEntry.vf = newDialog.get('vfType');
			newVFEntry.n = '';
			newVFEntry.c = { };

				// Provide defaults according to vf type
			switch(newVFEntry.vf) {
			case 'M': 	// Map
				newVFEntry.c.clat = '';
				newVFEntry.c.clon = '';
				newVFEntry.c.zoom = 10;
				newVFEntry.c.min = 7;
				newVFEntry.c.max = 7;
				newVFEntry.c.clstr= false;
					// Lat-Long Coordinates
				newVFEntry.c.cAtts= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLL, function(theLLAtt) {
						return { attID: theLLAtt, useAtt: true };
					})
				});
					// Potential Pointers
				newVFEntry.c.pAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Connection colors
				newVFEntry.c.lClrs= _.map(iTemplates, function(theTemplate) {
					return '#FFD700';
				});
					// Potential Size
				newVFEntry.c.sAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.base= '.blank';
				newVFEntry.c.lyrs= [];
				break;

			case 'p': 	// Map2
				newVFEntry.c.clat = '';
				newVFEntry.c.clon = '';
				newVFEntry.c.zoom = 10;
				newVFEntry.c.min = 7;
				newVFEntry.c.max = 7;
					// Lat-Long Coordinates
				newVFEntry.c.cAtts= _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsDLL[0] || 'disable';
				});
					// Connection colors
				newVFEntry.c.lClrs= _.map(iTemplates, function(theTemplate) {
					return '#FFD700';
				});
					// Title colors (added in 1.7)
				newVFEntry.c.tClrs= _.map(iTemplates, function(theTemplate) {
					return '';
				});
					// Potential Size
				newVFEntry.c.sAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
					// Default Label settings
				newVFEntry.c.lbls= _.map(iTemplates, function(theTemplate) {
					return 'n';
				});
				newVFEntry.c.base= '.blank';
				newVFEntry.c.lyrs= [];
				break;

			case 'C': 	// Cards
				newVFEntry.c.lOn  = true;
				newVFEntry.c.v	  = false;
				newVFEntry.c.w    = 'm';
				newVFEntry.c.h    = 'm';
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
					// Image Attribute
				newVFEntry.c.iAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Textual Content
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsTCnt, function(theCntAtt) {
						return { attID: theCntAtt, useAtt: true };
					});
				});
				break;
			case 'P': 	// Pinboard
				newVFEntry.c.iw   = 500;
				newVFEntry.c.ih   = 500;
				newVFEntry.c.dw   = 500;
				newVFEntry.c.dh   = 500;
				newVFEntry.c.min = 7;
				newVFEntry.c.max = 7;
				newVFEntry.c.img  = '';
					// X,Y Coordinates
				newVFEntry.c.cAtts= _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsXY[0] || '';
				});
					// Potential Pointers
				newVFEntry.c.pAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Connection colors
				newVFEntry.c.lClrs= _.map(iTemplates, function(theTemplate) {
					return '#FFD700';
				});
					// Potential Size
				newVFEntry.c.sAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.lyrs= [];
				break;
			case 'T': 	// Timeline
				newVFEntry.c.bHt  = 12;
				newVFEntry.c.xLbl   = 37;
					// Macro window from Date (only if override)
				newVFEntry.c.from   = '';
					// Macro window to Date (only if override)
				newVFEntry.c.to     = '';
					// Zoom window from Date (default is total)
				newVFEntry.c.zFrom  = '';
					// Zoom window to Date (default is total)
				newVFEntry.c.zTo    = '';
					// Dates Attribute (to place)
				newVFEntry.c.dAtts= _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsDates[0] || 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				break;
			case 'D': 	// Directory
					// Attribute Content to display
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsCnt, function(theCntAtt) {
						return { attID: theCntAtt, useAtt: true };
					});
				});
				break;
			case 't': 	// TextStream
				newVFEntry.c.min = 8;
				newVFEntry.c.max = 50;
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsTCnt[0] || '';
				});
				newVFEntry.c.order  = _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsOAtt[0] || '';
				});
				newVFEntry.c.sAtts  = _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				break;
			case 'N': 	// Network Wheel
				newVFEntry.c.lw = 120;
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.pAtts = _.map(iTemplates, function(theTemplate) {
					return [];
				});
				break;
			case 'n': 	// Network Graph
				newVFEntry.c.min = 4;
				newVFEntry.c.max = 10;
				newVFEntry.c.s = 500;
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
					// Potential Size
				newVFEntry.c.sAtts= _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
				newVFEntry.c.pAtts = _.map(iTemplates, function(theTemplate) {
					return [];
				});
				break;
			case 'b':	// Bucket Matrix
				newVFEntry.c.nr = 4;
				newVFEntry.c.bw = 8;
				newVFEntry.c.gr = true;
				newVFEntry.c.oAtts  = _.map(iTemplates, function(theTemplate) {
					return 'disable';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.pAtts = _.map(iTemplates, function(theTemplate) {
					return [];
				});
				break;

			} // switch
			rApp.push('viewSettings', newVFEntry);
			newDialog.teardown();
		});
		newDialog.on('dialog.cancel', newDialog.teardown);
		return false;
	});

		// Pop up modal with hint about IDs
	rApp.on('idHint', function() {
		var hint = getText('#errmsg-id');
		messageModal(hint);
		return false;
	});

	rApp.on('addMapLayer', function(event, vIndex) {
		var ol = PMapHub.getOverlays();
		var lid0 = ol.length > 0 ? ol[0].id : '';
		rApp.push('viewSettings['+vIndex+'].c.lyrs', { lid: lid0, o: 1 });
		return false;
	});

	rApp.on('delMapLayer', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.lyrs', fIndex, 1);
		return false;
	});

	rApp.on('addMapGroup', function(event, vIndex) {
		var gid0 = prspdata.map_groups.length > 0 ? prspdata.map_groups[0] : '';
		rApp.push('viewSettings['+vIndex+'].c.lyrs', { gid: gid0, o: 1 });
		return false;
	});

	rApp.on('delMapGroup', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.lyrs', fIndex, 1);
		return false;
	});

		// For Maps and Pinboards
	rApp.on('setLColor', function(event, vIndex, tIndex) {
		var keypath='viewSettings['+vIndex+'].c.lClrs['+tIndex+']';
		chooseColor(keypath);
		return false;
	});

		// For Map2
	rApp.on('setTColor', function(event, vIndex, tIndex) {
		var keypath='viewSettings['+vIndex+'].c.tClrs['+tIndex+']';
		chooseColor(keypath);
		return false;
	});

		// For Pinboards
	rApp.on('addSVGLayer', function(event, vIndex) {
		rApp.push('viewSettings['+vIndex+'].c.lyrs', { url: '', o: 1 });
		return false;
	});

	rApp.on('delSVGLayer', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.lyrs', fIndex, 1);
		return false;
	});

	rApp.on('addPtrPair', function(event, vIndex, tIndex) {
		var newPtrPair = { };
		newPtrPair.pid =iTemplates[tIndex].attsPtr[0] || '';
		newPtrPair.clr = '#888888';
		rApp.push('viewSettings['+vIndex+'].c.pAtts['+tIndex+']', newPtrPair);
		return false;
	});

	rApp.on('delPtrPair', function(event, vIndex, tIndex, pIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.pAtts['+tIndex+']', pIndex, 1);
		return false;
	});


	rApp.on('setNetLColor', function(event, vIndex, tIndex, pIndex) {
		var keypath = 'viewSettings['+vIndex+'].c.pAtts['+tIndex+']['+pIndex+'].clr';
		chooseColor(keypath);
		return false;
	});

		// Move View/Filter to top
	rApp.on('topVF', function(event, vIndex) {
		if (vIndex) {
			rApp.splice('viewSettings', vIndex, 1).then(function(spliced) {
					rApp.splice('viewSettings', 0, 0, spliced[0]);
				});
		}
		return false;
	});

		// Delete a View/Filter
	rApp.on('delVF', function(event, vIndex) {
		confirmModal('#msg-confirm-del-vf', function() {
			rApp.splice('viewSettings', vIndex, 1);
		});
		return false;
	});

		// Move an Attribute "left" in Page/VF array
	rApp.on('moveAttLeft', function(event, a, b, c) {
			// Is it Post/Inspector?
		if (typeof(a) == 'string') {
			var keypath;

			keypath = 'inspectSettings.modal.atts['+b+']';
			if (c) {
				rApp.splice(keypath, c, 1).then(function(spliced) {
					rApp.splice(keypath, c-1, 0, spliced[0]);
				});
			}

		} else {
			if (c) {
				var keypath = 'viewSettings['+a+'].c.cnt['+b+']';
				rApp.splice(keypath, c, 1).then(function(spliced) {
					rApp.splice(keypath, c-1, 0, spliced[0]);
				});
			}
		}
		return false;
	});

		// Move an Attribute "right" in Page/VF array
	rApp.on('moveAttRight', function(event, a, b, c) {
			// Is it Post/Inspector?
		if (typeof(a) == 'string') {
			var keypath;

			keypath = 'inspectSettings.modal.atts['+b+']';
			var atts = rApp.get(keypath);
			if (c < (atts.length-1)) {
				rApp.splice(keypath, c, 1).then(function(spliced) {
					rApp.splice(keypath, c+1, 0, spliced[0]);
				});
			}

		} else {
			var keypath = 'viewSettings['+a+'].c.cnt['+b+']';
			var atts = rApp.get(keypath);
			if (c < (atts.length-1)) {
				rApp.splice(keypath, c, 1).then(function(spliced) {
					rApp.splice(keypath, c+1, 0, spliced[0]);
				});
			}
		}
		return false;
	});

		// Select all Content for a particular Viz's Template
	rApp.on('allCntOn', function(event, a, b) {
		var keypath = 'viewSettings['+a+'].c.cnt['+b+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', true);
		return false;
	});

		// Deselect all Content for a particular Viz's Template
	rApp.on('allCntOff', function(event, a, b) {
		var keypath = 'viewSettings['+a+'].c.cnt['+b+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', false);
		return false;
	});

		// Turn all Legends On for a particular Viz's Template
	rApp.on('allLgndsOn', function(event, a, b) {
		var keypath = 'viewSettings['+a+'].c.lgnds['+b+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', true);
		return false;
	});

		// Turn all Legends Off for a particular Viz's Template
	rApp.on('allLgndsOff', function(event, a, b) {
		var keypath = 'viewSettings['+a+'].c.lgnds['+b+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', false);
		return false;
	});

		// Move a Legend ID "left" in visualization's Template - Legend array
	rApp.on('moveLgndLeft', function(event, a, b, c) {
		if (c) {
			var keypath = 'viewSettings['+a+'].c.lgnds['+b+']';
			rApp.splice(keypath, c, 1).then(function(spliced) {
				rApp.splice(keypath, c-1, 0, spliced[0]);
			});
		}
		return false;
	});

		// Move a Legend ID "left" in visualization's Template - Legend array
	rApp.on('moveLgndRight', function(event, a, b, c) {
		var keypath = 'viewSettings['+a+'].c.lgnds['+b+']';
		var atts = rApp.get(keypath);
		if (c < (atts.length-1)) {
			rApp.splice(keypath, c, 1).then(function(spliced) {
				rApp.splice(keypath, c+1, 0, spliced[0]);
			});
		}
		return false;
	});

		// Display all Attributes for a particular Viz's Template
	rApp.on('allDispAttsOn', function(event, a) {
		var keypath = 'inspectSettings.modal.atts['+a+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', true);
		return false;
	});

		// Display no Attributes for a particular Viz's Template
	rApp.on('allDispAttsOff', function(event, a) {
		var keypath = 'inspectSettings.modal.atts['+a+']';
		var n = rApp.get(keypath+'.length');
		for (var i=0; i<n; i++)
			rApp.set(keypath+'['+i+'].useAtt', false);
		return false;
	});


		// NOTE: Have to copy settings into fresh objects to prevent corrupting original
	rApp.on('saveVolume', function() {
		var result = doErrorCheck();

		if (result) {
			var saveGen = result[0]; 		// saveGen.ts is list of all Template IDs to be saved!
			var saveTIndices = result[1];
			var saveID = rApp.get('volID').trim();
			var saveViews=[], saveInspect={};

				// PURPOSE: Only return Attribute IDs which are marked as used (in same order)
			function packUsedAtts(expandedArray)
			{
				var newArray = [];
				expandedArray.forEach(function(theEntry) {
					if (theEntry.useAtt)
						newArray.push(theEntry.attID);
				});
				return newArray;
			} // packUsedAtts()

				// PURPOSE: Only return IDs in positions of saveTIndices entries
			function packUsedAttIDs(expandedArray)
			{
				var newArray = [];
				saveTIndices.forEach(function(tIndex) {
					var theID = expandedArray[tIndex];
					if (theID == '' || theID == 'disable') {
						theID = null;
					}
					newArray.push(theID);
				});
				return newArray;
			} // packUsedAttIDs

				// Compact View Attribute arrays
			var vCount = rApp.get('viewSettings.length');
			for (var i=0; i<vCount; i++) {
				var saveView = {}, viewSettings = rApp.get('viewSettings['+i+']');
				var abort=false;

					// PURPOSE: Confirm that att is in the list of facets in selected Templates
					// RETURNS: False if not
				function validFacet(att)
				{
					var valid = iTemplates.find(function(t, tI) {
						if (rApp.get('iTemplates['+tI+'].use')) {
							return iTemplates[tI].attsFct.find(function(f) {
								return att === f;
							}) != null;
						} else {
							return false;
						}
					}) != null;

					if (!valid) {
						displayError('#errmsg-bad-facet', saveView.l);
					}
					return valid;
				} // validFacet

					// All views need labels
				saveView.l  = viewSettings.l.replace(/"/g, '');
				if (saveView.l.length === 0) {
					displayError('#errmsg-no-label', i);
					return false;
				}
				saveView.vf = viewSettings.vf;
				saveView.n = viewSettings.n.replace(/"/g, '');
				saveView.c = {};
				switch (saveView.vf) {
				case 'M': 	// Map
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = viewSettings.c.zoom;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					saveView.c.clstr= viewSettings.c.clstr;
					var newCAtts=[], newLgnds=[], newLClrs=[];
					saveTIndices.forEach(function(tIndex) {
						newCAtts.push(packUsedAtts(viewSettings.c.cAtts[tIndex]));
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newLClrs.push(viewSettings.c.lClrs[tIndex]);
					});
					saveView.c.cAtts = newCAtts;
					saveView.c.lgnds = newLgnds;
					saveView.c.lClrs = newLClrs;
					saveView.c.pAtts = packUsedAttIDs(viewSettings.c.pAtts);
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts);
						// Don't need to modify map layer settings
					saveView.c.base = viewSettings.c.base;
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'p': 	// Map2
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = viewSettings.c.zoom;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					var newLgnds=[], newLClrs=[], newTClrs=[], newLbls=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newLClrs.push(viewSettings.c.lClrs[tIndex]);
						newTClrs.push(viewSettings.c.tClrs[tIndex]);
						newLbls.push(viewSettings.c.lbls[tIndex]);
					});
					saveView.c.lgnds = newLgnds;
					saveView.c.lClrs = newLClrs;
					saveView.c.tClrs = newTClrs;
					saveView.c.lbls = newLbls;
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts);
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts);
						// Don't need to modify map layer settings
					saveView.c.base = viewSettings.c.base;
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'P': 	// Pinboard
					saveView.c.iw   = viewSettings.c.iw;
					saveView.c.ih   = viewSettings.c.ih;
					saveView.c.dw   = viewSettings.c.dw;
					saveView.c.dh   = viewSettings.c.dh;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					saveView.c.img  = viewSettings.c.img;
					var newLgnds=[], newLClrs=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newLClrs.push(viewSettings.c.lClrs[tIndex]);
					});
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts);
					saveView.c.lgnds = newLgnds;
					saveView.c.pAtts = packUsedAttIDs(viewSettings.c.pAtts);
					saveView.c.lClrs = newLClrs;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts);
						// Don't need to modify svg layer settings
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'C': 	// Cards
					saveView.c.lOn  = viewSettings.c.lOn;
					saveView.c.v	= viewSettings.c.v;
					saveView.c.w    = viewSettings.c.w;
					saveView.c.h    = viewSettings.c.h;
					var newLgnds=[], newCnt=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newCnt.push(packUsedAtts(viewSettings.c.cnt[tIndex]));
					});
					saveView.c.lgnds = newLgnds;
					saveView.c.cnt = newCnt;
					saveView.c.iAtts = packUsedAttIDs(viewSettings.c.iAtts);
					break;
				case 'T': 	// Timeline
					saveView.c.bHt  = viewSettings.c.bHt;
					saveView.c.xLbl = viewSettings.c.xLbl;
					saveView.c.from = viewSettings.c.from;
					saveView.c.to   = viewSettings.c.to;
					saveView.c.zFrom= viewSettings.c.zFrom;
					saveView.c.zTo  = viewSettings.c.zTo;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.dAtts = packUsedAttIDs(viewSettings.c.dAtts);
					saveView.c.lgnds = newLgnds;
					break;
				case 'D': 	// Directory
					var newCnt = [];
					saveTIndices.forEach(function(tIndex) {
						newCnt.push(packUsedAtts(viewSettings.c.cnt[tIndex]));
					});
					saveView.c.cnt = newCnt;
					break;
				case 't': 	// TextStream
					saveView.c.min = viewSettings.c.min;
					saveView.c.max = viewSettings.c.max;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cnt = packUsedAttIDs(viewSettings.c.cnt);
					saveView.c.order = packUsedAttIDs(viewSettings.c.order);
					saveView.c.lgnds = newLgnds;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts);
					break;
				case 'N': 	// Network Wheel
					saveView.c.lw = viewSettings.c.lw;
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.lgnds = newLgnds;
					break;
				case 'n': 	// Network Graph
					saveView.c.min = viewSettings.c.min;
					saveView.c.max = viewSettings.c.max;
					saveView.c.s = viewSettings.c.s;
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts);
					saveView.c.lgnds = newLgnds;
					break;
				case 'b':	// Bucket Matrix
					saveView.c.nr   = viewSettings.c.nr;
					saveView.c.bw   = viewSettings.c.bw;
					saveView.c.gr   = viewSettings.c.gr;
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.lgnds = newLgnds;
					saveView.c.oAtts = packUsedAttIDs(viewSettings.c.oAtts);
					break;
				} // switch
				saveViews.push(saveView);
			}

				// Compact Inspector settings
			var inspectSettings = rApp.get('inspectSettings');
			saveInspect.sc = {};
			saveInspect.sc.atts = packUsedAttIDs(inspectSettings.sc.atts);
			saveInspect.yt = {};
			saveInspect.yt.atts = packUsedAttIDs(inspectSettings.yt.atts);
			saveInspect.t = {};
			saveInspect.t.t1Atts = packUsedAttIDs(inspectSettings.t.t1Atts);
			saveInspect.t.t2Atts = packUsedAttIDs(inspectSettings.t.t2Atts);
			saveInspect.t.tcAtts = packUsedAttIDs(inspectSettings.t.tcAtts);
			saveInspect.modal =  {};
				// W/H overrides?
			var n = inspectSettings.modal.w;
			if (n !== '' && n !== ' ' && !isNaN(n)) {
				saveInspect.modal.w = +n;
			}
			var n = inspectSettings.modal.h;
			if (n !== '' && n !== ' ' && !isNaN(n)) {
				saveInspect.modal.h = +n;
			}
			saveInspect.modal.aOn = inspectSettings.modal.aOn;
			saveInspect.modal.scOn = inspectSettings.modal.scOn;
			saveInspect.modal.ytOn = inspectSettings.modal.ytOn;
			saveInspect.modal.tOn  = inspectSettings.modal.tOn;
			saveInspect.modal.t2On  = inspectSettings.modal.t2On;
			var newModalCnt = [];
			saveTIndices.forEach(function(tIndex) {
				newModalCnt.push(packUsedAtts(inspectSettings.modal.atts[tIndex]));
			});
			saveInspect.modal.atts = newModalCnt;
			saveInspect.srOff = inspectSettings.srOff;

// console.log("Saving: ");
// console.log("prsp_vol_gen: "+JSON.stringify(saveGen));
// console.log("prsp_vol_views: "+JSON.stringify(saveViews));
// console.log("prsp_vol_inspect: "+JSON.stringify(saveInspect));

				// Insert values into hidden fields if no problems
			jQuery('input[name="prsp_vol_id"]').val(saveID);
			jQuery('textarea[name="prsp_vol_gen"]').val(JSON.stringify(saveGen));
			jQuery('textarea[name="prsp_vol_views"]').val(JSON.stringify(saveViews));
			jQuery('textarea[name="prsp_vol_inspect"]').val(JSON.stringify(saveInspect));
				// Confirm to user that Volume saved successfully
			displayError('#msg-saved', null, true);
		} // if saveGe
		return false;
	});
}); // ready
