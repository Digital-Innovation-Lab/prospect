// Exhibit Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   
// USES:    jQuery, Underscore, jQueryUI, and Ractive
// ASSUMES: All data not to be edited by user passed in prspdata
//			All data to be edited by user passed in hidden fields

// TO DO:	Check if Template & Attribute definitions changed since previous configuration??


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
				height: 300
			}
		}, // data

			// Intercept render to insert and active jQueryUI plugin
		onrender: function() {
			var self = this;
			var thisComponent = this.find('*');
			self.modal = jQuery(thisComponent).dialog({
				width: self.get('width'),
				height: self.get('height'),
				modal : true,
				autoOpen: true,
				buttons: [
				{
					text: 'Cancel',
					click: function() {
						// self.modal.dialog('close');
						// self.teardown();
						self.fire('cancel');
					}
				},
				{
					text: 'OK',
					click: function() {
						self.fire('ok');
					}
				}]
			});
			// self.modal.dialog('open');
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


		// LIVE DATA ABOUT THIS EXHIBIT
		// ==============================
		// NOTE: Some of this is temporarily generated for purposes of editing and is compiled
		//			before saving
	var embed;

		// General Attributes
	var xhbtID = jQuery('input[name="prsp_xhbt_id"]').val();

	var defGen = { l: '', hbtn: '', hurl: '', ts: [] };
	embedData = jQuery('textarea[name="prsp_xhbt_gen"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defGen = JSON.parse(embedData);
	}

		// Configurations of Views
	var defViews = [ ];
	embedData = jQuery('textarea[name="prsp_xhbt_views"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defViews = JSON.parse(embedData);
	}
		// Configurations of Inspector
	var defInspect = { sc: { atts: [] }, yt: { atts: [] }, t: { t1Atts: [], t2Atts: [], tcAtts: [] },
					modal: { scOn: false, ytOn: false, tOn: false, t2On: false, atts: [] } };
	embedData = jQuery('textarea[name="prsp_xhbt_inspect"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defInspect = JSON.parse(embedData);
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

		// Configuration data for all possible independent Templates
		//	The array Atts include fully unpacked join Atts in dot notation
		//	{	tid: this Template ID,
		//		use: used by this Exhibit (true/false),
		//		attsTxt: array of Text Attributes from Template
		//		attsDNum: array of Number Attributes (w/"disable")
		//		attsDates: array of Dates Atts
		//		attsLL: array of Lat-Lon Atts
		//		attsXY: array of X-Y Atts
		//		attsImg: array of Image Atts (w/"disable")
		//		attsLgnd: array of all Atts that can supply a Legend
		//		attsLink: array of Link Atts
		//		attsSC: array of SoundCloud Atts
		//		attsYT: array of YouTube Atts
		//		attsTrns: array of Transcript Atts
		//		attsTC: array of Timecode Atts
		//		attsPtr: array of Pointer Atts
		//		attsDPtr: array of Pointer Atts (w/"disable")
		//		attsCnt: array of Atts that can display content
		//		attsFct: array of Atts that can be Facets (discrete values, can be sorted in order)
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


		// PURPOSE: Show error message for 4 seconds
	function displayError(errID)
	{
			// If a clear-error timer is set, cancel it
		if (errTimer)
			clearTimeout(errTimer);
		var newError = getText(errID);
		rApp.set('errorMsg', newError);
		errTimer = setTimeout(function() { rApp.set('errorMsg', ''); }, 4000);
	} // displayError()


		// RETURNS: Attribute definition from ID
	function getAttribute(attID)
	{
		return _.find(defAtts, function(theAtt) { return theAtt.id === attID; });
	} // getAttribute()

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

		var exhibitID = rApp.get('xhbtID').trim();
		if (exhibitID.length == 0 || exhibitID.length > 24) {
			displayError('#errmsg-id');
			return false;
		}

		var exhibitL = rApp.get('genSettings.l').trim();
		if (exhibitL.length == 0 || exhibitL.length > 48) {
			displayError('#errmsg-label');
			return false;
		}
		saveGen.l = exhibitL;
		saveGen.hbtn = rApp.get('genSettings.hbtn').trim();
		saveGen.hurl = rApp.get('genSettings.hurl').trim();
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


		// Compile array of all (open) Attributes -- start by copying non-Join Attributes
		// Join Attributes will be handled from independent Template definitions below
	_.forEach(defAtts, function(theAttDef) {
		if (theAttDef.p == 'o' && theAttDef.def.t != 'J')
			defJoinedAtts.push(_.clone(theAttDef, true));
	});

		// Compile array about independent Template types from input configuration data
		//	into format usable by edit GUI
		//  'disable' applies to features that can be turned on or off
		//	'' (empty) means no suitable choice exists for required setting
	_.forEach(defTemplates, function(theTmplt) {
		if (!theTmplt.def.d) {
			var attsTxt=[], attsDates=[], attsDNum=['disable'], attsLL=[],
				attsXY=[], attsImg=['disable'], attsLgnd=[], attsSC=['disable'],
				attsYT=['disable'], attsTrns=['disable'], attsTC=['disable'],
				attsPtr=[], attsDPtr=['disable'], attsCnt=[], attsFct=[];

			_.forEach(theTmplt.def.a, function(theAttID) {
				function saveAttRef(prefix, theAttID, type)
				{
					switch (type) {
					case 'V':
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'T':
						attsTxt.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'N':
						attsDNum.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'D':
						attsLgnd.push(prefix+theAttID);
						attsDates.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'L':
						attsLL.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						break;
					case 'X':
						attsXY.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						break;
					case 'I':
						attsCnt.push(prefix+theAttID);
						attsImg.push(prefix+theAttID);
						break;
					case 'l': // Link To
						attsCnt.push(prefix+theAttID);
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
								if (_.find(defJoinedAtts, function(theAtt) { return theAtt.id === joinedID; }) == null)
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
						if (attDef.p == 'o')
							saveAttRef('', theAttID, attDef.def.t);
						break;
					}
				} else {
					confirmModal('#errmsg-tmplt-delid', null);
					console.log("Attribute ID "+theAttID+" is no longer used in Template "+theTmplt.id);
				}
			}); // forEach Template Att

				// Is Template ID given in existing configuration?
			var isUsed = getTemplateIndex(theTmplt.id) != -1;

			var tmpltEntry = { tid: theTmplt.id, use: isUsed,
								attsTxt: attsTxt, attsDates: attsDates, attsDNum: attsDNum,
								attsLL: attsLL, attsXY: attsXY, attsLgnd: attsLgnd, attsImg: attsImg,
								attsSC: attsSC, attsYT: attsYT, attsTrns: attsTrns, attsTC: attsTC,
								attsPtr: attsPtr, attsDPtr: attsDPtr, attsCnt: attsCnt,
								attsFct: attsFct
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
		case 'N':
		case 'D':
			defJoinedFacets.push(_.clone(theJAtt));
			break;
		}
	});

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
		// NOTES: 	This is guard against case that user has deleted Attribute
	function checkAttID(attID, possible, def)
	{
		if (typeof attID == 'undefined' || attID == null)
			return def;
		if (attID == 'disable')
			return attID;
		if (typeof possible == 'undefined' || possible == null)
			return def;
		if (possible.indexOf(attID) == -1)
			return def;
		return attID;
	} // checkAttID()

		// Closure for temporary vars
		// Initialize settings to correspond to iTemplates structures
	if (true) {
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
	}

		// Initialize View settings to correspond to iTemplates structures
	if (true) {
		for (var i=0; i<defViews.length; i++) {
			var theVF = defViews[i];
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
			case 'C': 	// Cards
				var newLgnds=[], newIAtts=[], newCnt=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newCnt.push(_.map(theTmplt.attsFct, function(theCnt) {
								return { attID: theCnt, useAtt: true };
							}));
						newIAtts.push(theTmplt.attsImg[0] || 'disable');
					} else {
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newCnt.push(createPaddedAtts(theTmplt.attsFct, theVF.c.cnt[origTIndex]));
						newIAtts.push(checkAttID(theVF.c.iAtts[origTIndex], theTmplt.attsImg, 'disable'));
					}
				});
				theVF.c.cnt = newCnt;
				theVF.c.iAtts = newIAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'P': 	// Pinboard
				var newXY=[], newLgnds=[], newPAtts=[], newSAtts=[], newLClrs=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newXY.push(theTmplt.attsXY[0] || '');
						newPAtts.push('disable');
						newLClrs.push('#FFD700');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newXY.push(checkAttID(theVF.c.cAtts[origTIndex], theTmplt.attsXY, ''));
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
						newD.push(theTmplt.attsDates[0] || '');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newD.push(checkAttID(theVF.c.dAtts[origTIndex], theTmplt.attsDates, ''));
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
						newCnt.push(theTmplt.attsCnt[0] || '');
						newOrder.push(theTmplt.attsFct[0] || '');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSize.push(theTmplt.attsDNum[0] || 'disable');
					} else {
						newCnt.push(checkAttID(theVF.c.cnt[origTIndex], theTmplt.attsCnt, ''));
						newOrder.push(checkAttID(theVF.c.order[origTIndex], theTmplt.attsFct, ''));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSize.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
					}
				});
				theVF.c.cnt = newCnt;
				theVF.c.order = newOrder;
				theVF.c.lgnds = newLgnds;
				theVF.c.sAtts = newSize;
				break;
			case 'S': 	// Stacked Chart
				theVF.c.oAtt = checkAttID(theVF.c.oAtt, facetAttIDs, '');
				theVF.c.sAtt = checkAttID(theVF.c.sAtt, facetAttIDs, '');
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

			case 'G': 	// Tree -- view not implemented
				var newP=[], newLgnds=[], newLClrs=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newP.push(theTmplt.attsPtr[0] || '');
						newLClrs.push('#FFD700');
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newP.push(checkAttID(theVF.c.pAtts[origTIndex], theTmplt.attsPtr, ''));
						newLClrs.push(theVF.c.lClrs[origTIndex]);
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.pAtts = newP;
				theVF.c.lClrs = newLClrs;
				theVF.c.lgnds = newLgnds;
				break;
			case 'F': 	// Flow -- view not implemented
				// TO DO -- check Atts
				break;
			} // switch viewtype
		} // for views
	}

	PMapHub.init(prspdata.maps);

		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			xhbtID: xhbtID,
			genSettings: defGen,
			iTemplates: iTemplates,
			inspectSettings: defInspect,
			viewSettings: defViews,
			vfLookup: vfLookup,
			facets: defJoinedFacets,
			errorMsg: errorString,
			baseMaps: PMapHub.getBaseLayers(),
			layerMaps: PMapHub.getOverlays()
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
			case 'C': 	// Cards
				newVFEntry.c.lOn  = true;
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
					// Content currently corresponds to Facet values
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsFct, function(theCntAtt) {
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
				newVFEntry.c.lclr = '#00CCFF';
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
					return theTemplate.attsDates[0] || '';
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
					return theTemplate.attsCnt[0] || '';
				});
				newVFEntry.c.order  = _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsFct[0] || '';
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
			case 'S': 	// Stacked Chart
				newVFEntry.c.tlit = false;
				newVFEntry.c.bw = 20;
				newVFEntry.c.gr = true;
				newVFEntry.c.h = 500;
				newVFEntry.c.oAtt = defJoinedFacets[0].id || '';
				newVFEntry.c.sAtt = defJoinedFacets[0].id || '';
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

			case 'F': 	// Flow -- view not implemented
				newVFEntry.c.w    = 1000;
				newVFEntry.c.h    = 500;
				newVFEntry.c.fct = [];
				break;
			case 'G': 	// Tree -- view not implemented
				newVFEntry.c.form = 'f';
				newVFEntry.c.w    = 1000;
				newVFEntry.c.h    = 1000;
				newVFEntry.c.head = '';
				newVFEntry.c.r    = 4;
				newVFEntry.c.f    = 12;
				newVFEntry.c.pad  = 100;
					// Pointers to children
				newVFEntry.c.pAtts= _.map(iTemplates, function(theTemplate) {
					return theTemplate.attsPtr[0] || '';
				});
					// Connection colors
				newVFEntry.c.lClrs= _.map(iTemplates, function(theTemplate) {
					return '#FFD700';
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				break;
			} // switch
			rApp.push('viewSettings', newVFEntry);
			newDialog.teardown();
		});
		newDialog.on('dialog.cancel', newDialog.teardown);
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

		// NOTES: 	For Maps and Pinboards
	rApp.on('setLColor', function(event, vIndex, tIndex) {
		var keypath='viewSettings['+vIndex+'].c.lClrs['+tIndex+']';
		chooseColor(keypath);
		return false;
	});

	rApp.on('addSVGLayer', function(event, vIndex) {
		rApp.push('viewSettings['+vIndex+'].c.lyrs', { url: '', o: 1 });
		return false;
	});

	rApp.on('delSVGLayer', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.lyrs', fIndex, 1);
		return false;
	});

	rApp.on('addFacet', function(event, vIndex) {
			// Get Facet and label for it
		var label = '';
		var fid = defJoinedFacets.length > 0 ? defJoinedFacets[0].id : '';
		var newDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-fct',
			data: {
				label: label,
				fid: fid,
				facets: defJoinedFacets
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		newDialog.on('dialog.ok', function() {
			var newFacet = { };
			newFacet.lbl = newDialog.get('label');
			newFacet.fid = newDialog.get('fid');
			rApp.push('viewSettings['+vIndex+'].c.fct', newFacet);
			newDialog.teardown();
			return false;
		});
		newDialog.on('dialog.cancel', newDialog.teardown);
		return false;
	});

	rApp.on('topFacet', function(event, vIndex, fIndex) {
		if (fIndex) {
			rApp.splice('viewSettings['+vIndex+'].c.fct', fIndex, 1).then(function(spliced) {
					rApp.splice('viewSettings['+vIndex+'].c.fct', 0, 0, spliced[0]);
				});
		}
		return false;
	});

	rApp.on('delFacet', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.fct', fIndex, 1);
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
	// rApp.on('topVF', function(event, vIndex) {
	// 	if (vIndex) {
	// 		rApp.splice('viewSettings', vIndex, 1).then(function(spliced) {
	// 				rApp.splice('viewSettings', 0, 0, spliced[0]);
	// 			});
	// 	}
	// 	return false;
	// });
	// Deleted line from script file
					// <button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="topVF:{{vIndex}}">Move to Top</button>

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

		// NOTE: Have to copy settings into fresh objects to prevent corrupting original
	rApp.on('saveExhibit', function() {
		var result = doErrorCheck();

		if (result) {
			var saveGen = result[0]; 		// saveGen.ts is list of all Template IDs to be saved!
			var saveTIndices = result[1];
			var saveID = rApp.get('xhbtID').trim();
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
					if (theID == '' || theID == 'disable')
						theID = null;
					newArray.push(theID);
				});
				return newArray;
			} // packUsedAttIDs

				// Compact View Attribute arrays
			var vCount = rApp.get('viewSettings.length');
			for (var i=0; i<vCount; i++) {
				var saveView = {}, viewSettings = rApp.get('viewSettings['+i+']');
				saveView.l  = viewSettings.l;
				saveView.vf = viewSettings.vf; 
				saveView.n = viewSettings.n.replace(/"/, '');
				saveView.c = {};
				switch (saveView.vf) {
				case 'M': 	// Map
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = viewSettings.c.zoom;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					saveView.c.lclr = viewSettings.c.lclr;
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
				case 'P': 	// Pinboard
					saveView.c.iw   = viewSettings.c.iw;
					saveView.c.ih   = viewSettings.c.ih;
					saveView.c.dw   = viewSettings.c.dw;
					saveView.c.dh   = viewSettings.c.dh;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					saveView.c.lclr = viewSettings.c.lclr;
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
				case 'S': 	// Stacked Chart
					saveView.c.tlit = viewSettings.c.tlit;
					saveView.c.bw   = viewSettings.c.bw;
					saveView.c.gr   = viewSettings.c.gr;
					saveView.c.h    = viewSettings.c.h;
					saveView.c.oAtt = viewSettings.c.oAtt;
					saveView.c.sAtt = viewSettings.c.sAtt;
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

				case 'G': 	// Tree -- not yet implemented
					saveView.c.form  = viewSettings.c.form;
					saveView.c.w     = viewSettings.c.w;
					saveView.c.h     = viewSettings.c.h;
					saveView.c.head  = viewSettings.c.head;
					saveView.c.r     = viewSettings.c.r;
					saveView.c.f     = viewSettings.c.f;
					saveView.c.pad   = viewSettings.c.pad;
					var newLgnds=[], newLClrs=[];
					saveTIndices.forEach(function(tIndex) {
						newLClrs.push(viewSettings.c.lClrs[tIndex]);
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.pAtts = packUsedAttIDs(viewSettings.c.pAtts);
					saveView.c.lClrs = newLClrs;
					saveView.c.lgnds = newLgnds;
					break;
				case 'F': 	// Flow -- not yet implemented
					saveView.c.w = viewSettings.c.w;
					saveView.c.h = viewSettings.c.h;
					saveView.c.fct = viewSettings.c.fct;
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
			saveInspect.modal.scOn = inspectSettings.modal.scOn;
			saveInspect.modal.ytOn = inspectSettings.modal.ytOn;
			saveInspect.modal.tOn  = inspectSettings.modal.tOn;
			saveInspect.modal.t2On  = inspectSettings.modal.t2On;
			var newModalCnt = [];
			saveTIndices.forEach(function(tIndex) {
				newModalCnt.push(packUsedAtts(inspectSettings.modal.atts[tIndex]));
			});
			saveInspect.modal.atts = newModalCnt;

// console.log("Saving: ");
// console.log("prsp_xhbt_gen: "+JSON.stringify(saveGen));
// console.log("prsp_xhbt_views: "+JSON.stringify(saveViews));
// console.log("prsp_xhbt_inspect: "+JSON.stringify(saveInspect));

				// Insert values into hidden fields if no problems
			jQuery('input[name="prsp_xhbt_id"]').val(saveID);
			jQuery('textarea[name="prsp_xhbt_gen"]').val(JSON.stringify(saveGen));
			jQuery('textarea[name="prsp_xhbt_views"]').val(JSON.stringify(saveViews));
			jQuery('textarea[name="prsp_xhbt_inspect"]').val(JSON.stringify(saveInspect));
		} // if saveGe
		return false;
	});
}); // ready
