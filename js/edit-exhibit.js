// Exhibit Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   
// USES:    jQuery, Underscore, jQueryUI, and Ractive
// ASSUMES: 

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
	var vfTypes = [ 'Map', 'Cards', 'Pinboard', 'Browser', 'Timeline', 'Tree', 'Flow', 'Directory',
					'TextStream' ];

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
		// Configurations of Widgets
	var defWidgets = { sc: { atts: [] }, yt: { atts: [] }, t: { t1Atts: [], t2Atts: [], tcAtts: [] } };
	embedData = jQuery('textarea[name="prsp_xhbt_widgets"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defWidgets = JSON.parse(embedData);
	}
		// Configurations of Page
	var defPages = { modal: { scOn: false, ytOn: false, tOn: false, atts: [] },
					 post:  { scOn: false, ytOn: false, tOn: false, atts: [] }
					};
	embedData = jQuery('textarea[name="prsp_xhbt_pages"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defPages = JSON.parse(embedData);
	}

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
		//		attsImg: array of Image Atts
		//		attsLgnd: array of all Atts that can supply a Legend
		//		attsLink: array of Link Atts
		//		attsSC: array of SoundCloud Atts
		//		attsYT: array of YouTube Atts
		//		attsTrns: array of Transcript Atts
		//		attsTC: array of Timecode Atts
		//		attsPtr: array of Pointer Atts
		//		attsCnt: array of Atts that can display content
		//		attsFct: array of Atts that can be Facets (discrete values, can be sorted in order)
		//	}
	var iTemplates = [ ];
		// Array of all (open) Attributes after Joins done
	var defJoinedAtts = [ ];
		// Array of all (open) Facet Attributes after Joins done
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
			callback();
			modalDialog.teardown();
			return false;
		});
		modalDialog.on('dialog.cancel', modalDialog.teardown);
	} // confirmModal()


		// Set lodash templates to work like Mustache and Ractive
	// _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


		// Compile array of all (open) Attributes -- start by copying non-Join Attributes
		// Join Attributes will be handled from independent Template definitions below
	_.forEach(defAtts, function(theAttDef) {
		if (theAttDef.p == 'o' && theAttDef.def.t != 'Join')
			defJoinedAtts.push(_.clone(theAttDef, true));
	});

		// Compile array about independent Template types from input configuration data
		//	into format usable by edit GUI
	_.forEach(defTemplates, function(theTmplt) {
		if (!theTmplt.def.d) {
			var attsTxt=[], attsDates=[], attsDNum=['disable'], attsLL=[],
				attsXY=[], attsLgnd=[], attsSC=['disable'], attsYT=['disable'],
				attsTrns=['disable'], attsTC=['disable'], attsPtr=[], attsCnt=[],
				attsFct=[];

			_.forEach(theTmplt.def.a, function(theAttID) {
				function saveAttRef(prefix, theAttID, type)
				{
					switch (type) {
					case 'Vocabulary':
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'Text':
						attsTxt.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'Number':
						attsDNum.push(prefix+theAttID);
						attsLgnd.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'Dates':
						attsLgnd.push(prefix+theAttID);
						attsDates.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						attsFct.push(prefix+theAttID);
						break;
					case 'Lat-Lon':
						attsLL.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						break;
					case 'X-Y':
						attsXY.push(prefix+theAttID);
						attsCnt.push(prefix+theAttID);
						break;
					case 'Image':
						attsCnt.push(prefix+theAttID);
						break;
					case 'Link To':
						attsCnt.push(prefix+theAttID);
						break;
					case 'SoundCloud':
						attsSC.push(prefix+theAttID);
						break;
					case 'YouTube':
						attsYT.push(prefix+theAttID);
						break;
					case 'Transcript':
						attsTrns.push(prefix+theAttID);
						break;
					case 'Timecode':
						attsTC.push(prefix+theAttID);
						break;
					case 'Pointer':
						attsPtr.push(prefix+theAttID);
						break;
					}
				} // saveAttRef()

				var attDef = getAttribute(theAttID);
				switch (attDef.def.t) {
					// Do Join for dependent Template Attributes
				case 'Join':
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
			}); // forEach Template Att

				// Is Template ID given in existing configuration?
			var isUsed = getTemplateIndex(theTmplt.id) != -1;

			var tmpltEntry = { tid: theTmplt.id, use: isUsed,
								attsTxt: attsTxt, attsDates: attsDates, attsDNum: attsDNum,
								attsLL: attsLL, attsXY: attsXY, attsLgnd: attsLgnd, attsSC: attsSC,
								attsYT: attsYT, attsTrns: attsTrns, attsTC: attsTC,
								attsPtr: attsPtr, attsCnt: attsCnt, attsFct: attsFct
							};
			iTemplates.push(tmpltEntry);
		}
	});
		// Sort Joined Attributes by ID
	defJoinedAtts = _.sortBy(defJoinedAtts, 'id');

		// Compile Joined Facets from Joined Attributes
	_.forEach(defJoinedAtts, function(theJAtt) {
		switch (theJAtt.def.t) {
		case 'Vocabulary':
		case 'Number':
		case 'Dates':
			defJoinedFacets.push(_.clone(theJAtt));
			break;
		}
	});

		// PURPOSE: Created expanded array with useAtt: false if selArray not in fullArray
		// INPUT:   fullArray = complete list of potential Attributes
		//			selArray = list of just those Attributes selected to display
		// NOTE:    *Must* keep selected Attributes in the order of this array -- order of unselected
		//				don't matter
	function createPaddedAtts(fullArray, selArray)
	{
		var padded = [];
		selArray.forEach(function(theAtt) {
			padded.push({ attID: theAtt, useAtt: true });
		});
		var unused = _.difference(fullArray, selArray);
		unused.forEach(function(theAtt) {
			padded.push({ attID: theAtt, useAtt: false });
		})
		return padded;
	} // createPaddedAtts


		// Closure for temporary vars
		// Initialize widgets & pages settings to correspond to iTemplates structures
	if (true) {
		var newSCAtts = [], newYTAtts = [], newT1Atts = [], newT2Atts = [], newTCAtts = [],
			newModalAtts = [], newPostAtts = [];
		_.forEach(iTemplates, function(theTmplt) {
			var origTIndex = getTemplateIndex(theTmplt.tid);
				// Is Template absent in original configuration?
			if (origTIndex == -1) {
					// Initialize widgetSettings so that everything starts disabled
				newSCAtts.push('disable');
				newYTAtts.push('disable');
				newT1Atts.push('disable');
				newT2Atts.push('disable');
				newTCAtts.push('disable');
					// Initialize pageSettings with all content Attributes
				newModalAtts.push(_.map(theTmplt.attsCnt, function(theCntAtt) {
								return { attID: theCntAtt, useAtt: true };
							}));
				newPostAtts.push(_.map(theTmplt.attsCnt, function(theCntAtt) {
								return { attID: theCntAtt, useAtt: true };
							}));
			} else {
				newSCAtts.push(defWidgets.sc.atts[origTIndex] || 'disable');
				newYTAtts.push(defWidgets.yt.atts[origTIndex] || 'disable');
				newT1Atts.push(defWidgets.t.t1Atts[origTIndex] || 'disable');
				newT2Atts.push(defWidgets.t.t2Atts[origTIndex] || 'disable');
				newTCAtts.push(defWidgets.t.tcAtts[origTIndex] || 'disable');
					// Fill in unused Attributes with useAtt: false
				newModalAtts.push(createPaddedAtts(theTmplt.attsCnt, defPages.modal.atts[origTIndex]));
				newPostAtts.push(createPaddedAtts(theTmplt.attsCnt, defPages.post.atts[origTIndex]));
			} // in original config
		}); // for iTemplate
			// Save recomputed values
		defWidgets.sc.atts = newSCAtts;
		defWidgets.yt.atts = newYTAtts;
		defWidgets.t.t1Atts = newT1Atts;
		defWidgets.t.t2Atts = newT2Atts;
		defWidgets.t.tcAtts = newTCAtts;
		defPages.modal.atts = newModalAtts;
		defPages.post.atts = newPostAtts;
	}

		// Initialize View/Filter settings to correspond to iTemplates structures
	if (true) {
		for (var i=0; i<defViews.length; i++) {
			var theVF = defViews[i];
			switch (theVF.vf) {
			case 'Map':
				var newLL = [], newLgnds = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLL.push(_.map(theTmplt.attsLL, function(theLLAtt) {
								return { attID: theLLAtt, useAtt: true };
							}));
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newLL.push(createPaddedAtts(theTmplt.attLL, theVF.c.cAtts[origTIndex]));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.cAtts = newLL;
				theVF.c.lgnds = newLgnds;
				break;
			case 'Cards':
				var newLgnds = [], newCnt = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newCnt.push(_.map(theTmplt.attsCnt, function(theCnt) {
								return { attID: theCnt, useAtt: true };
							}));
					} else {
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newCnt.push(createPaddedAtts(theTmplt.attsCnt, theVF.c.cnt[origTIndex]));
					}
				});
				theVF.c.lgnds = newLgnds;
				theVF.c.cnt = newCnt;
				break;
			case 'Pinboard':
				var newXY = [], newLgnds = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newXY.push(theTmplt.attsXY[0]);
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newXY.push(theVF.c.cAtts[origTIndex]);
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.cAtts = newXY;
				theVF.c.lgnds = newLgnds;
				break;
			case 'Browser':
			case 'Flow':
				// Just a list -- nothing to do
				break;
			case 'Timeline':
				var newD = [], newLgnds = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newD.push(_.map(theTmplt.attsDates, function(theDAtt) {
								return { attID: theDAtt, useAtt: true };
							}));
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newD.push(createPaddedAtts(theTmplt.attsDates, theVF.c.dAtts[origTIndex]));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.dAtts = newD;
				theVF.c.lgnds = newLgnds;
				break;
			case 'Tree':
				var newP = [], newLgnds = [];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newP.push(_.map(theTmplt.attsPtr, function(thePAtt) {
								return { attID: thePAtt, useAtt: true };
							}));
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newP.push(createPaddedAtts(theTmplt.attsPtr, theVF.c.pAtts[origTIndex]));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.pAtts = newP;
				theVF.c.lgnds = newLgnds;
				break;
			case 'Directory':
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
			case 'TextStream':
				var newCnt = [], newOrder=[], newLgnds = [], newSize=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newCnt.push(theTmplt.attsCnt[0]);
						newOrder.push(theTmplt.attsFct[0]);
						newLgnds.push(_.map(theTmplt.attsLgnd, function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSize.push(theTmplt.attsDNum[0] || 'disable');
					} else {
						newCnt.push(theVF.c.cnt[origTIndex]);
						newOrder.push(theVF.c.order[origTIndex]);
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSize.push(theVF.c.sz[origTIndex]);
					}
				});
				theVF.c.cnt = newCnt;
				theVF.c.order = newOrder;
				theVF.c.lgnds = newLgnds;
				theVF.c.sz = newSize;
				break;
			} // switch viewtype
		} // for views
	}

		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			xhbtID: xhbtID,
			genSettings: defGen,
			iTemplates: iTemplates,
			viewSettings: defViews,
			widgetSettings: defWidgets,
			pageSettings: defPages,
			errorMsg: errorString
		},
		components: {
			accordion: RJAccordionComponent,
			tabs: RJTabsComponent
		}
	});

		// Create a blank new View/Filter
	rApp.on('addView', function() {
		var label = '';
		var vfType = vfTypes[0];
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
			newVFEntry.c = { };
				// Provide defaults according to vf type
			switch(newVFEntry.vf) {
			case 'Map':
				newVFEntry.c.clat = '';
				newVFEntry.c.clon = '';
				newVFEntry.c.zoom = 10;
				newVFEntry.c.size = 's';
				newVFEntry.c.clstr= false;
					// Lat-Long Coordinates
				newVFEntry.c.cAtts= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLL, function(theLLAtt) {
						return { attID: theLLAtt, useAtt: true };
					})
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.lyrs= [];
				break;
			case 'Cards':
				newVFEntry.c.lOn  = true;
				newVFEntry.c.w    = 'm';
				newVFEntry.c.h    = 'm';
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
					// Attribute Content to display
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsCnt, function(theCntAtt) {
						return { attID: theCntAtt, useAtt: true };
					});
				});
				break;
			case 'Pinboard':
				newVFEntry.c.iw   = 500;
				newVFEntry.c.ih   = 500;
				newVFEntry.c.dw   = 500;
				newVFEntry.c.dh   = 500;
				newVFEntry.c.size = 's';
				newVFEntry.c.img  = '';
					// X,Y Coordinates
				newVFEntry.c.cAtts= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsXY, function(theXYAtt) {
						return { attID: theXYAtt, useAtt: true };
					});
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.lyrs= [];
				break;
			case 'Browser':
				newVFEntry.c.fct = [];
				break;
			case 'Timeline':
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
					return _.map(theTemplate.attsDates, function(theDAtt) {
						return { attID: theDAtt, useAtt: true };
					});
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				break;
			case 'Tree':
				newVFEntry.c.form = 'f';
				newVFEntry.c.w    = 1000;
				newVFEntry.c.h    = 1000;
				newVFEntry.c.head = '';
				newVFEntry.c.r    = 4;
				newVFEntry.c.f    = 12;
				newVFEntry.c.pad  = 100;
					// Pointers to children
				newVFEntry.c.pAtts= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsPtr, function(thePAtt) {
						return { attID: thePAtt, useAtt: true };
					});
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				break;
			case 'Flow':
				newVFEntry.c.w    = 1000;
				newVFEntry.c.h    = 500;
				newVFEntry.c.fct = [];
				break;
			case 'Directory':
					// Attribute Content to display
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsCnt, function(theCntAtt) {
						return { attID: theCntAtt, useAtt: true };
					});
				});
				break;
			case 'TextStream':
				newVFEntry.c.min = 8;
				newVFEntry.c.max = 50;
				newVFEntry.c.cnt  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsCnt, function(theCntAtt) {
						return { attID: theCntAtt, useAtt: true };
					});
				});
				newVFEntry.c.order  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsFct, function(theFctAtt) {
						return { attID: theFctAtt, useAtt: true };
					});
				});
					// Potential Legends
				newVFEntry.c.lgnds= _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsLgnd, function(theLgndAtt) {
						return { attID: theLgndAtt, useAtt: true };
					});
				});
				newVFEntry.c.sz  = _.map(iTemplates, function(theTemplate) {
					return _.map(theTemplate.attsNum, function(theNumAtt) {
						return { attID: theNumAtt, useAtt: true };
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
			// TO DO: -- Select Map ID from Dialog with list
		rApp.push('viewSettings['+vIndex+'].c.lyrs', { mapID: 'temp', o: 1 });
		return false;
	});

	rApp.on('delMapLayer', function(event, vIndex, fIndex) {
		rApp.splice('viewSettings['+vIndex+'].c.lyrs', fIndex, 1);
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

			if (a == 'p')
				keypath = 'pageSettings.post.atts['+b+']';
			else
				keypath = 'pageSettings.modal.atts['+b+']';
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

			if (a == 'p')
				keypath = 'pageSettings.post.atts['+b+']';
			else
				keypath = 'pageSettings.modal.atts['+b+']';
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
			var saveViews=[], saveWidgets={}, savePages={};

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
					if (theID == 'disable')
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
				saveView.c = {};
				switch (saveView.vf) {
				case 'Map':
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = viewSettings.c.zoom;
					saveView.c.size = viewSettings.c.size;
					saveView.c.clstr= viewSettings.c.clstr;
					var newCAtts = [], newLgnds = [];
					saveTIndices.forEach(function(tIndex) {
						newCAtts.push(packUsedAtts(viewSettings.c.cAtts[tIndex]));
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cAtts = newCAtts;
					saveView.c.lgnds = newLgnds;
						// Don't need to modify map layer settings
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'Pinboard':
					saveView.c.iw   = viewSettings.c.iw;
					saveView.c.ih   = viewSettings.c.ih;
					saveView.c.dw   = viewSettings.c.dw;
					saveView.c.dh   = viewSettings.c.dh;
					saveView.c.size = viewSettings.c.size;
					saveView.c.img  = viewSettings.c.img;
					var newLgnds = [];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts);
					saveView.c.lgnds = newLgnds;
						// Don't need to modify svg layer settings
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'Cards':
					saveView.c.lOn  = viewSettings.c.lOn;
					saveView.c.w    = viewSettings.c.w;
					saveView.c.h    = viewSettings.c.h;
					var newLgnds = [], newCnt = [];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newCnt.push(packUsedAtts(viewSettings.c.cnt[tIndex]));
					});
					saveView.c.lgnds = newLgnds;
					saveView.c.cnt = newCnt;
					break;
				case 'Flow':
					saveView.c.w = viewSettings.c.w;
					saveView.c.h = viewSettings.c.h;
				case 'Browser':
						// Doesn't require changing
					saveView.c.fct = viewSettings.c.fct;
					break;
				case 'Timeline':
					saveView.c.bHt  = viewSettings.c.bHt;
					saveView.c.xLbl = viewSettings.c.xLbl;
					saveView.c.from = viewSettings.c.from;
					saveView.c.to   = viewSettings.c.to;
					saveView.c.zFrom= viewSettings.c.zFrom;
					saveView.c.zTo  = viewSettings.c.zTo;
					var newDAtts = [], newLgnds = [];
					saveTIndices.forEach(function(tIndex) {
						newDAtts.push(packUsedAtts(viewSettings.c.dAtts[tIndex]));
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.dAtts = newDAtts;
					saveView.c.lgnds = newLgnds;
					break;
				case 'Tree':
					saveView.c.form  = viewSettings.c.form;
					saveView.c.w     = viewSettings.c.w;
					saveView.c.h     = viewSettings.c.h;
					saveView.c.head  = viewSettings.c.head;
					saveView.c.r     = viewSettings.c.r;
					saveView.c.f     = viewSettings.c.f;
					saveView.c.pad   = viewSettings.c.pad;
					var newPAtts = [], newLgnds = [];
					saveTIndices.forEach(function(tIndex) {
						newPAtts.push(packUsedAtts(viewSettings.c.pAtts[tIndex]));
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.lgnds = newLgnds;
					break;
				case 'Directory':
					var newCnt = [];
					saveTIndices.forEach(function(tIndex) {
						newCnt.push(packUsedAtts(viewSettings.c.cnt[tIndex]));
					});
					saveView.c.cnt = newCnt;
					break;
				case 'TextStream':
					saveView.c.min = viewSettings.c.min;
					saveView.c.max = viewSettings.c.max;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cnt = packUsedAttIDs(viewSettings.c.cnt);
					saveView.c.order = packUsedAttIDs(viewSettings.c.order);
					saveView.c.lgnds = newLgnds;
					saveView.c.sz = packUsedAttIDs(viewSettings.c.sz);
					break;
				} // switch
				saveViews.push(saveView);
			}

				// Compact Widgets settings
			var widgetSettings = rApp.get('widgetSettings');
			saveWidgets.sc = {};
			saveWidgets.sc.atts = packUsedAttIDs(widgetSettings.sc.atts);
			saveWidgets.yt = {};
			saveWidgets.yt.atts = packUsedAttIDs(widgetSettings.yt.atts);
			saveWidgets.t = {};
			saveWidgets.t.t1Atts = packUsedAttIDs(widgetSettings.t.t1Atts);
			saveWidgets.t.t2Atts = packUsedAttIDs(widgetSettings.t.t2Atts);
			saveWidgets.t.tcAtts = packUsedAttIDs(widgetSettings.t.tcAtts);
				// Compact Page settings
			var pageSettings = rApp.get('pageSettings');
			savePages.modal =  {};
			savePages.modal.scOn = pageSettings.modal.scOn;
			savePages.modal.ytOn = pageSettings.modal.ytOn;
			savePages.modal.tOn  = pageSettings.modal.tOn;
			var newModalCnt = [];
			saveTIndices.forEach(function(tIndex) {
				newModalCnt.push(packUsedAtts(pageSettings.modal.atts[tIndex]));
			});
			savePages.modal.atts = newModalCnt;
			savePages.post = {};
			savePages.post.scOn = pageSettings.post.scOn;
			savePages.post.ytOn = pageSettings.post.ytOn;
			savePages.post.tOn  = pageSettings.post.tOn;
			var newPostCnt = [];
			saveTIndices.forEach(function(tIndex) {
				newPostCnt.push(packUsedAtts(pageSettings.post.atts[tIndex]));
			});
			savePages.post.atts = newPostCnt;

// console.log("Saving: ");
// console.log("prsp_xhbt_gen: "+JSON.stringify(saveGen));
// console.log("prsp_xhbt_views: "+JSON.stringify(saveViews));
// console.log("prsp_xhbt_widgets: "+JSON.stringify(saveWidgets));
// console.log("prsp_xhbt_pages: "+JSON.stringify(savePages));

				// Insert values into hidden fields if no problems
			jQuery('input[name="prsp_xhbt_id"]').val(saveID);
			jQuery('textarea[name="prsp_xhbt_gen"]').val(JSON.stringify(saveGen));
			jQuery('textarea[name="prsp_xhbt_views"]').val(JSON.stringify(saveViews));
			jQuery('textarea[name="prsp_xhbt_widgets"]').val(JSON.stringify(saveWidgets));
			jQuery('textarea[name="prsp_xhbt_pages"]').val(JSON.stringify(savePages));
		} // if saveGe
		return false;
	});
}); // ready
