// Volume Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "vue-outer"
// USES:    jQuery, Underscore, jQueryUI, and VueJS
// ASSUMES: All data not to be edited by user passed in prspdata
//			All data to be edited by user passed in hidden fields

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
if (!Array.prototype.fill) {
  Object.defineProperty(Array.prototype, 'fill', {
    value: function(value) {

      // Steps 1-2.
      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);

      // Steps 3-5.
      var len = O.length >>> 0;

      // Steps 6-7.
      var start = arguments[1];
      var relativeStart = start >> 0;

      // Step 8.
      var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

      // Steps 9-10.
      var end = arguments[2];
      var relativeEnd = end === undefined ?
        len : end >> 0;

      // Step 11.
      var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

      // Step 12.
      while (k < final) {
        O[k] = value;
        k++;
      }

      // Step 13.
      return O;
    }
  });
}

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
	Vue.component('icon-btn', {
		props: {
			symbol: {
	    		type: String,
	    		default: ''
	    	},
			label: {
	    		type: String,
	    		default: ''
	    	}
		},
		template: `<button v-on:click="click">{{label}}</button>`,
		data: function () {
			return {
				jBtn: null
			}
		},
		methods: {
			click: function(event) {
				if (event) event.preventDefault();
				this.$emit('click');
	    	}
		},
			// Lifecycle hooks
		mounted: function() {
			this.jBtn = jQuery(this.$el).button({
				text: false,
				icons: { primary: this.symbol }
			});
		},
		beforeDestroy: function() {
			jQuery(this.jBtn).button('destroy');
		}
	});

	Vue.component('accordion', {
		template: `<div class="jq-accordion-template">
			<slot></slot>
		</div>`,
		data: function () {
			return {
				jAcc: null
			}
		},
			// Lifecycle hooks
		mounted: function() {
			this.jAcc = jQuery(this.$el).accordion({
				heightStyle: "content",
				collapsible: true
			});
		},
		beforeDestroy: function() {
			jQuery(this.jAcc).accordion('destroy');
		}
	});

	Vue.component('tabs', {
		template: `<div class="jq-tabs-template">
			<slot></slot>
		</div>`,
		data: function () {
			return {
				jTabs: null
			}
		},
			// Lifecycle hooks
		mounted: function() {
			this.jTabs = jQuery(this.$el).tabs();
		},
		beforeDestroy: function() {
			jQuery(this.jTabs).tabs('destroy');
		}
	});

		// "Null" placeholder when no dialog should be shown
	Vue.component('nullcomponent', {
		template: '<div style="display: none"></div>'
	});

		// Wrapper for modal dialog boxes
		// Strategy for using modal:
		//		Caller puts parameters into modalParams
		//		Caller sets vApp.modalParams to appropriate dialog component name
		//		Dialog component makes local copies of relevant parameters in data (if modifiable)
		//		Bind GUI to those local data
		//		If user clicks "OK" then call callback function with feedback data
	Vue.component('vuemodal', {
		props: {
			title: {
	    		type: String,
	    		default: 'Dialog'
	    	},
			cancel: {
				type: String,
				default: 'false'
			},
			size: {
				type: String,
				default: ''
			}
		},
		template: '#dialog-template',
		methods: {
			close: function(event) {
				console.log("vuemodal > close");
				this.$el.className = 'dialog-wrap open';
				setTimeout(function() {
					vApp.$emit('dialogclose');
				}.bind(this), 300);
				if (event) { event.preventDefault(); }
			},
			clickok: function(event) {
				console.log("vuemodal > clickok1");
				this.$emit('save');
				console.log("vuemodal > clickok2");
				if (event) { event.preventDefault(); }
				this.close();
			}
		},
			// Lifecycle hooks
		mounted: function() {
			if (this.size != '') {
				this.$el.firstChild.className = this.size;
			} // switch()
			setTimeout(function() {
	            this.$el.className = 'dialog-wrap open pop';
	        }.bind(this), 20);
		}
	});

		// INPUT: Message to display is in params.msg
	Vue.component('dlgMessage', {
		props: {
			params: Object
		},
		template: '#dialog-message'
	});

		// INPUT:	params.msg = Message to display
		//			params.callback = Callback function
	Vue.component('dlgConfirm', {
		props: {
			params: Object
		},
		template: '#dialog-confirm',
		methods: {
			ok: function() {
				console.log("Clicked OK");
				if (this.params.callback != null) {
					this.params.callback();
				}
			}
		}
	});

		// Component (dialog) to choose visualization type and label
	Vue.component('dlgChooseVizType', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				label: '', vfType: ''
			}
		},
		created: function() {
			this.vfType = this.params.vfTypes[0].c;
		},
		template: '#dialog-choose-vf',
		methods: {
			save: function() {
				console.log("Save dlgChooseVizType");
				this.params.callback(this.label, this.vfType);
			}
		}
	});

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
	var vApp;							// the VueJS application
	var errTimer;

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
	} // getText()

	function ensureInt(val)
	{
		if (typeof val === 'number') {
			return val;
		}
		if (typeof val === 'string') {
			return parseInt(val, 10);
		}
		return 0;
	} // ensureInt()

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
		}
		var newError = getText(errID);
		if (append != null && typeof append != 'undefined') {
			newError += ' '+append;
		}
		vApp.errorOK = ok === true;
		vApp.errorMsg = newError;
		errTimer = setTimeout(function() {
			vApp.errorMsg = '';
		}, 5000);
	} // displayError()


		// RETURNS: Attribute definition from ID
		// NOTE:	ONLY checks predefined Attributes, NOT Joined Attributes
	function getAttribute(attID)
	{
		return defAtts.find(function(theAtt) { return theAtt.id === attID; });
	} // getAttribute()

		// RETURNS: Attribute definition from ID
		// NOTE:	Checks ALL Attributes, inc. Joined Attributes
	function getJAttribute(attID)
	{
		return defJoinedAtts.find(function(theAtt) { return theAtt.id === attID; });
	} // getJAttribute()

		// INPUT: iTemplate = the independent Template definition, jAttID = Join Attribute ID
		// RETURNS: Dependent Template definition
	function getDependentTemplate(iTemplate, jAttID)
	{
		var join = iTemplate.joins.find(function(theJoin) { return theJoin.id === jAttID; });
		var dTemplate = defTemplates.find(function(theDTmplt) { return theDTmplt.id === join.t; });
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

		var volumeID = vApp.volID.trim();
		if (volumeID.length == 0 || volumeID.length > 24) {
			displayError('#errmsg-id');
			return false;
		}

		var volumeL = vApp.label.replace(/"/g, '').trim();
		if (volumeL.length == 0 || volumeL.length > 48) {
			displayError('#errmsg-label');
			return false;
		}
		saveGen.l = volumeL;
		saveGen.hbtn = vApp.hbtn.trim();
		saveGen.hurl = vApp.hurl.trim();
		saveGen.tour = vApp.tour;
		saveGen.dspr = vApp.dspr;
		saveGen.auto = vApp.auto;
		saveGen.ts = [];

		var i;
		for (i=0; i<iTemplates.length; i++) {
			var used = vApp.iTemplates[i].use;
			if (used) {
				saveGen.ts.push(vApp.iTemplates[i].tid);
				saveTIndices.push(i);
			}
		}

		if (saveGen.ts.length == 0 || saveGen.ts.length > 4) {
			displayError('#errmsg-num-templates');
			return false;
		}
		return [saveGen, saveTIndices];
	} // doErrorCheck()



			// PURPOSE: Present user message in modal dialog box
		function messageModal(msgID)
		{
			var mText = getText(msgID);
			vApp.modalParams.msg = mText;
			vApp.modalShowing = 'dlgMessage';
		} // messageModal()

			// PURPOSE: Present a confirmation modal
			// RETURNS: true if OK, false if Cancel
		function confirmModal(msgID, addText, callback)
		{
			var mText = getText(msgID);
			if (typeof addText == 'string') {
				mText += addText;
			}
			vApp.modalParams.msg = mText;
			vApp.modalParams.callback = callback;
			vApp.modalShowing = 'dlgConfirm';
		} // confirmModal()

		// Compile array about independent Template types from input configuration data
		//	into format usable by edit GUI
		//  'disable' applies to features that can be turned on or off
		//	'' (empty) means no suitable choice exists for required setting
		// Also compile list of all Attributes (Joined and unjoined)
	defTemplates.forEach(function(theTmplt) {
		if (!theTmplt.def.d) {
			var attsTxt=[], attsDates=['disable'], attsDNum=['disable'], attsLL=[], attsDLL=['disable'],
				attsXY=['disable'], attsImg=['disable'], attsSC=['disable'], attsYT=['disable'],
				attsTrns=['disable'], attsTC=['disable'], attsPtr=[], attsDPtr=['disable'],
				attsLgnd=[], attsCnt=[], attsTCnt=[], attsOAtt=[], attsFct=['disable'];

			theTmplt.def.a.forEach(function(theAttID) {
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
						dTemplate.def.a.forEach(function(joinAttID) {
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
					messageModal('#errmsg-tmplt-delid');
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
	defJoinedAtts.forEach(function(theJAtt) {
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
		iTemplates.forEach(function(theTmplt) {
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
				newModalAtts.push(theTmplt.attsCnt.map(function(theCntAtt) {
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
						newLL.push(theTmplt.attsLL.map(function(theLLAtt) {
								return { attID: theLLAtt, useAtt: true };
							}));
						newPAtts.push('disable');
						newLClrs.push('#FFD700');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newCnt.push(theTmplt.attsTCnt.map(function(theCnt) {
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
					// Add Symbol-shape fields, if necessary (features added 1.8.3)
				if (typeof theVF.c.ms === 'undefined') {
					theVF.c.ms = 'C';
				}
				if (typeof theVF.c.syms === 'undefined') {
					theVF.c.syms = new Array(iTemplates.length).fill(0);
				}
				if (typeof theVF.c.iAtts === 'undefined') {
					theVF.c.iAtts = new Array(iTemplates.length).fill('disable');
				}
				var newXY=[], newLgnds=[], newPAtts=[], newSAtts=[], newLClrs=[], newSyms=[], newIAtts=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newXY.push(theTmplt.attsXY[0] || 'disable');
						newPAtts.push('disable');
						newLClrs.push('#FFD700');
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSyms.push(0);
						newIAtts.push('disable');
					} else {
						newXY.push(checkAttID(theVF.c.cAtts[origTIndex], theTmplt.attsXY, 'disable'));
						newPAtts.push(checkAttID(theVF.c.pAtts[origTIndex], theTmplt.attsDPtr, 'disable'));
						newLClrs.push(theVF.c.lClrs[origTIndex]);
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSyms.push(theVF.c.syms[origTIndex]);
						newIAtts.push(theVF.c.iAtts[origTIndex]);
					}
				});

				theVF.c.cAtts = newXY;
				theVF.c.pAtts = newPAtts;
				theVF.c.lClrs = newLClrs;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				theVF.c.syms  = newSyms;
				theVF.c.iAtts = newIAtts;
				break;
			case 'T': 	// Timeline
				var newD=[], newLgnds=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newD.push(theTmplt.attsDates[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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
						newCnt.push(theTmplt.attsCnt.map(function(theCnt) {
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
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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
					// Add Symbol-shape fields, if necessary (featres added 1.8.3)
				if (typeof theVF.c.ms === 'undefined') {
					theVF.c.ms = 'C';
				}
				if (typeof theVF.c.syms === 'undefined') {
					theVF.c.syms = new Array(iTemplates.length).fill(0);
				}
				if (typeof theVF.c.iAtts === 'undefined') {
					theVF.c.iAtts = new Array(iTemplates.length).fill('disable');
				}

				var newPAtts=[], newSAtts=[], newLgnds=[], newSyms=[], newIAtts=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newPAtts.push([]);
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSyms.push(0);
						newIAtts.push('disable');
					} else {
						var newP=[];
						theVF.c.pAtts[origTIndex].forEach(function(p) {
							newP.push({ pid: checkAttID(p.pid, theTmplt.attsPtr, ''), clr: p.clr });
						});
						newPAtts.push(newP);
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSyms.push(theVF.c.syms[origTIndex]);
						newIAtts.push(theVF.c.iAtts[origTIndex]);
					}
				});
				theVF.c.pAtts = newPAtts;
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				theVF.c.syms  = newSyms;
				theVF.c.iAtts = newIAtts;
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
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
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


		// PURPOSE: Create new visualization with default settings
	function createNewViz(label, vizType)
	{
		var newVFEntry = { l: label, incID: vizInc++, vf: vizType, n: '', c: {} };

			// Provide defaults according to vf type
		switch(vizType) {
		case 'M': 	// Map
			newVFEntry.c.clat = '';
			newVFEntry.c.clon = '';
			newVFEntry.c.zoom = 10;
			newVFEntry.c.min = 7;
			newVFEntry.c.max = 7;
			newVFEntry.c.clstr= false;
				// Lat-Long Coordinates
			newVFEntry.c.cAtts= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLL.map(function(theLLAtt) {
					return { attID: theLLAtt, useAtt: true };
				})
			});
				// Potential Pointers
			newVFEntry.c.pAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Connection colors
			newVFEntry.c.lClrs= iTemplates.map(function(theTemplate) {
				return '#FFD700';
			});
				// Potential Size
			newVFEntry.c.sAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
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
			newVFEntry.c.cAtts= iTemplates.map(function(theTemplate) {
				return theTemplate.attsDLL[0] || 'disable';
			});
				// Connection colors
			newVFEntry.c.lClrs= iTemplates.map(function(theTemplate) {
				return '#FFD700';
			});
				// Title colors (added in 1.7)
			newVFEntry.c.tClrs= iTemplates.map(function(theTemplate) {
				return '';
			});
				// Potential Size
			newVFEntry.c.sAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map( function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
				// Default Label settings
			newVFEntry.c.lbls= iTemplates.map(function(theTemplate) {
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
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
				// Image Attribute
			newVFEntry.c.iAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Textual Content
			newVFEntry.c.cnt  = iTemplates.map(function(theTemplate) {
				return theTemplate.attsTCnt.map(function(theCntAtt) {
					return { attID: theCntAtt, useAtt: true };
				});
			});
			break;
		case 'P': 	// Pinboard
			newVFEntry.c.iw   = 500;
			newVFEntry.c.ih   = 500;
			newVFEntry.c.dw   = 500;
			newVFEntry.c.dh   = 500;
			newVFEntry.c.min  = 7;
			newVFEntry.c.max  = 7;
			newVFEntry.c.img  = '';
				// Since 1.8.3
			newVFEntry.c.ms   = 'C';
			newVFEntry.c.syms = new Array(iTemplates.length).fill(0);
			newVFEntry.c.iAtts= new Array(iTemplates.length).fill('disable');
				// X,Y Coordinates
			newVFEntry.c.cAtts= iTemplates.map(function(theTemplate) {
				return theTemplate.attsXY[0] || 'disable';
			});
				// Potential Pointers
			newVFEntry.c.pAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Connection colors
			newVFEntry.c.lClrs= iTemplates.map(function(theTemplate) {
				return '#FFD700';
			});
				// Potential Size
			newVFEntry.c.sAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
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
			newVFEntry.c.dAtts= iTemplates.map(function(theTemplate) {
				return theTemplate.attsDates[0] || 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
			break;
		case 'D': 	// Directory
				// Attribute Content to display
			newVFEntry.c.cnt  = iTemplates.map(function(theTemplate) {
				return theTemplate.attsCnt.map(function(theCntAtt) {
					return { attID: theCntAtt, useAtt: true };
				});
			});
			break;
		case 't': 	// TextStream
			newVFEntry.c.min = 8;
			newVFEntry.c.max = 50;
			newVFEntry.c.cnt  = iTemplates.map(function(theTemplate) {
				return theTemplate.attsTCnt[0] || '';
			});
			newVFEntry.c.order  = iTemplates.map(function(theTemplate) {
				return theTemplate.attsOAtt[0] || '';
			});
			newVFEntry.c.sAtts  = iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
			break;
		case 'N': 	// Network Wheel
			newVFEntry.c.lw = 120;
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
			newVFEntry.c.pAtts = iTemplates.map(function(theTemplate) {
				return [];
			});
			break;
		case 'n': 	// Network Graph
			newVFEntry.c.min = 4;
			newVFEntry.c.max = 10;
			newVFEntry.c.s = 500;
				// Since 1.8.3
			newVFEntry.c.ms   = 'C';
			newVFEntry.c.syms = new Array(iTemplates.length).fill(0);
			newVFEntry.c.iAtts= new Array(iTemplates.length).fill('disable');
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
				// Potential Size
			newVFEntry.c.sAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
			newVFEntry.c.pAtts = iTemplates.map(function(theTemplate) {
				return [];
			});
			break;
		case 'b':	// Bucket Matrix
			newVFEntry.c.nr = 4;
			newVFEntry.c.bw = 8;
			newVFEntry.c.gr = true;
			newVFEntry.c.oAtts  = iTemplates.map(function(theTemplate) {
				return 'disable';
			});
				// Potential Legends
			newVFEntry.c.lgnds= iTemplates.map(function(theTemplate) {
				return theTemplate.attsLgnd.map(function(theLgndAtt) {
					var attDef = getJAttribute(theLgndAtt);
					return { attID: theLgndAtt, useAtt: attDef.def.t !== 'T'  };
				});
			});
			newVFEntry.c.pAtts = iTemplates.map(function(theTemplate) {
				return [];
			});
			break;
		} // switch
		return newVFEntry;
	} // createNewViz()


		// PURPOSE:	Verify and prepare Volume Configuration
		// SIDE-FX:	Pack data in hidden fields, if it verifies
	function doSaveVolume()
	{
		var result = doErrorCheck();

		if (result) {
			var saveGen = result[0];
			var saveTIndices = result[1];
			var saveID = vApp.volID.trim();
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
				// INPUT:	expandedArray = "original" full array
				//			emptyVal = value to use to indicate empty/disable
			function packUsedAttIDs(expandedArray, emptyVal)
			{
				var newArray = [];
				saveTIndices.forEach(function(tIndex) {
					var theID = expandedArray[tIndex];
					if (theID == '' || theID == 'disable') {
						theID = emptyVal;
					}
					newArray.push(theID);
				});
				return newArray;
			} // packUsedAttIDs

				// Compact View Setting arrays
			var vCount = vApp.viewSettings.length;
			for (var i=0; i<vCount; i++) {
				var saveView = {}, viewSettings = vApp.viewSettings[i];
				var abort=false;

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
					if (viewSettings.c.clat.length == 0 || viewSettings.c.clon.length == 0)
					{
						displayError('#errmsg-map-coords', i);
						return false;
					}
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = ensureInt(viewSettings.c.zoom);
					saveView.c.min  = ensureInt(viewSettings.c.min);
					saveView.c.max  = ensureInt(viewSettings.c.max);
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
					saveView.c.pAtts = packUsedAttIDs(viewSettings.c.pAtts, null);
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
						// Don't need to modify map layer settings
					saveView.c.base = viewSettings.c.base;
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'p': 	// Map2
					if (viewSettings.c.clat.length == 0 || viewSettings.c.clon.length == 0)
					{
						displayError('#errmsg-map-coords', i);
						return false;
					}
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = ensureInt(viewSettings.c.zoom);
					saveView.c.min  = ensureInt(viewSettings.c.min);
					saveView.c.max  = ensureInt(viewSettings.c.max);
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
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts, null);
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
						// Don't need to modify map layer settings
					saveView.c.base = viewSettings.c.base;
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'P': 	// Pinboard
					saveView.c.iw   = ensureInt(viewSettings.c.iw);
					saveView.c.ih   = ensureInt(viewSettings.c.ih);
					saveView.c.dw   = ensureInt(viewSettings.c.dw);
					saveView.c.dh   = ensureInt(viewSettings.c.dh);
					saveView.c.min  = ensureInt(viewSettings.c.min);
					saveView.c.max  = ensureInt(viewSettings.c.max);
					saveView.c.img  = viewSettings.c.img;
					var newLgnds=[], newLClrs=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newLClrs.push(viewSettings.c.lClrs[tIndex]);
					});
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts, null);
					saveView.c.lgnds = newLgnds;
					saveView.c.pAtts = packUsedAttIDs(viewSettings.c.pAtts, null);
					saveView.c.lClrs = newLClrs;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
						// Don't need to modify svg layer settings
					saveView.c.lyrs = viewSettings.c.lyrs;
						// Handle shape-symbol options (new since 1.8.3)
					if (viewSettings.c.ms === 'S') {
						var newSyms=[];
						saveView.c.ms = 'S';
						saveTIndices.forEach(function(tIndex) {
							newSyms.push(ensureInt(viewSettings.c.syms[tIndex]));
						});
						saveView.c.syms = newSyms;
					} else if (viewSettings.c.ms === 'I') {
						var newIAtts=[];
						saveView.c.ms = 'I';
						saveTIndices.forEach(function(tIndex) {
							newIAtts.push(viewSettings.c.iAtts[tIndex]);
						});
						saveView.c.iAtts = newIAtts;
					}
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
					saveView.c.iAtts = packUsedAttIDs(viewSettings.c.iAtts, null);
					break;
				case 'T': 	// Timeline
					saveView.c.bHt  = ensureInt(viewSettings.c.bHt);
					saveView.c.xLbl = ensureInt(viewSettings.c.xLbl);
					saveView.c.from = viewSettings.c.from;
					saveView.c.to   = viewSettings.c.to;
					saveView.c.zFrom= viewSettings.c.zFrom;
					saveView.c.zTo  = viewSettings.c.zTo;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.dAtts = packUsedAttIDs(viewSettings.c.dAtts, null);
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
					saveView.c.min = ensureInt(viewSettings.c.min);
					saveView.c.max = ensureInt(viewSettings.c.max);
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cnt = packUsedAttIDs(viewSettings.c.cnt, null);
					saveView.c.order = packUsedAttIDs(viewSettings.c.order, null);
					saveView.c.lgnds = newLgnds;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
					break;
				case 'N': 	// Network Wheel
					saveView.c.lw = ensureInt(viewSettings.c.lw);
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.lgnds = newLgnds;
					break;
				case 'n': 	// Network Graph
					saveView.c.min = ensureInt(viewSettings.c.min);
					saveView.c.max = ensureInt(viewSettings.c.max);
					saveView.c.s = ensureInt(viewSettings.c.s);
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
					saveView.c.lgnds = newLgnds;
						// Handle shape-symbol options (new since 1.8.3)
					if (viewSettings.c.ms === 'S') {
						var newSyms=[];
						saveView.c.ms = 'S';
						saveTIndices.forEach(function(tIndex) {
							newSyms.push(ensureInt(viewSettings.c.syms[tIndex]));
						});
						saveView.c.syms = newSyms;
					} else if (viewSettings.c.ms === 'I') {
						var newIAtts=[];
						saveView.c.ms = 'I';
						saveTIndices.forEach(function(tIndex) {
							newIAtts.push(viewSettings.c.iAtts[tIndex]);
						});
						saveView.c.iAtts = newIAtts;
					}
					break;
				case 'b':	// Bucket Matrix
					saveView.c.nr   = ensureInt(viewSettings.c.nr);
					saveView.c.bw   = ensureInt(viewSettings.c.bw);
					saveView.c.gr   = viewSettings.c.gr;
					var newPAtts=[], newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
						newPAtts.push(viewSettings.c.pAtts[tIndex]);
					});
					saveView.c.pAtts = newPAtts;
					saveView.c.lgnds = newLgnds;
					saveView.c.oAtts = packUsedAttIDs(viewSettings.c.oAtts, null);
					break;
				} // switch
				saveViews.push(saveView);
			}

				// Compact Inspector settings
			saveInspect.sc = {};
			saveInspect.sc.atts = packUsedAttIDs(vApp.sc.atts, null);
			saveInspect.yt = {};
			saveInspect.yt.atts = packUsedAttIDs(vApp.yt.atts, null);
			saveInspect.t = {};
			saveInspect.t.t1Atts = packUsedAttIDs(vApp.t.t1Atts, null);
			saveInspect.t.t2Atts = packUsedAttIDs(vApp.t.t2Atts, null);
			saveInspect.t.tcAtts = packUsedAttIDs(vApp.t.tcAtts, null);
			saveInspect.modal =  {};
				// W/H overrides?
			var n = vApp.modalW;
			if (n !== '' && n !== ' ' && !isNaN(n)) {
				saveInspect.modal.w = +n;
			}
			var n = vApp.modalH;
			if (n !== '' && n !== ' ' && !isNaN(n)) {
				saveInspect.modal.h = +n;
			}
			saveInspect.modal.aOn = vApp.modal.aOn;
			saveInspect.modal.scOn = vApp.modal.scOn;
			saveInspect.modal.ytOn = vApp.modal.ytOn;
			saveInspect.modal.tOn  = vApp.modal.tOn;
			saveInspect.modal.t2On  = vApp.modal.t2On;
			var newModalCnt = [];
			saveTIndices.forEach(function(tIndex) {
				newModalCnt.push(packUsedAtts(vApp.modal.atts[tIndex]));
			});
			saveInspect.modal.atts = newModalCnt;
			saveInspect.srOff = vApp.srOff;

console.log("Saving: ");
console.log("prsp_vol_gen: "+JSON.stringify(saveGen));
console.log("prsp_vol_views: "+JSON.stringify(saveViews));
console.log("prsp_vol_inspect: "+JSON.stringify(saveInspect));

				// Insert values into hidden fields if no problems
			jQuery('input[name="prsp_vol_id"]').val(saveID);
			jQuery('textarea[name="prsp_vol_gen"]').val(JSON.stringify(saveGen));
			jQuery('textarea[name="prsp_vol_views"]').val(JSON.stringify(saveViews));
			jQuery('textarea[name="prsp_vol_inspect"]').val(JSON.stringify(saveInspect));
				// Confirm to user that Exhibit was successfully saved
			displayError('#msg-saved', null, true);
		} // if saveGen
	} // doSaveVolume()

	PMapHub.init(prspdata.maps);

		// Create our main App instance
	vApp = new Vue({
		el: '#vue-outer',
		data: {
				// Configuration settings for all Exhibit settings
			volID: volID,
			label: defGen.l,
			tour: defGen.tour,
			dspr: defGen.dspr,
			autoUpdate: defGen.auto,
			hbtn: defGen.hbtn,
			hurl: defGen.hurl,
			viewSettings: defViews,
			modal: defInspect.modal,
			srOff: defInspect.srOff,
			modalW: defInspect.w,
			modalH: defInspect.h,
			sc: defInspect.sc,
			yt: defInspect.yt,
			t: defInspect.t,
				// Options
			iTemplates: iTemplates,
			vfLookup: vfLookup,
			baseMaps: PMapHub.getBaseLayers(),
			layerMaps: PMapHub.getOverlays(),
			mapGroups: prspdata.map_groups,
				// GUI state & modal parameters
			errorMsg: '',						// current error string (if any)
			errorOK: false,						// Is message actually not an error?
			modalParams: {						// parameters passed to modal dialogs
				vfTypes: vfTypes,
				pairs: [],						// QR Role pairs
				facets: defJoinedFacets,
				callback: null
			},
			modalShowing: 'nullcomponent'		// modal currently showing (initially nothing)
		},
		methods: {
			saveVolume: function(event) {
				console.log("Click: saveAttribute");
				if (event) { event.preventDefault(); }
				doSaveVolume();
			},
			idHint: function(event) {
				console.log("Click: idHint");
				if (event) { event.preventDefault(); }
				messageModal('#errmsg-id');
			},
			addView: function(event) {
				console.log("Click: addView");
				if (event) { event.preventDefault(); }
				var self=this;
				function saveNewView(label, vizType) {
					var newEntry = createNewViz(label, vizType);
					self.viewSettings.push(newEntry);
				}
				this.modalParams.callback = saveNewView;
				this.modalShowing = 'dlgChooseVizType';
			},
			topVF: function(vIndex, event) {
				console.log("Click: topVF");
				if (event) { event.preventDefault(); }
				if (vIndex > 0) {
					var spliced;
					spliced = this.viewSettings.splice(vIndex, 1);
					this.viewSettings.splice(0, 0, spliced[0]);
				}
			},
			delVF: function(vIndex, event) {
				console.log("Click: delVF");
				if (event) { event.preventDefault(); }
				var self=this;
				confirmModal('#msg-confirm-del-vf', null, function() {
					self.viewSettings.splice(vIndex, 1);
				});
			},
			allLgndsOn: function(vIndex, tIndex, event) {
				console.log("Click: allLgndsOn");
				if (event) { event.preventDefault(); }
				var lgnds = this.viewSettings[vIndex].c.lgnds[tIndex];
				var n = lgnds.length;
				for (var i=0; i<n; i++) {
					lgnds[i].useAtt = true;
				}
			},
			allLgndsOff: function(vIndex, tIndex, event) {
				console.log("Click: allLgndsOff");
				if (event) { event.preventDefault(); }
				var lgnds = this.viewSettings[vIndex].c.lgnds[tIndex];
				var n = lgnds.length;
				for (var i=0; i<n; i++) {
					lgnds[i].useAtt = false;
				}
			},
			moveLgndLeft: function(vIndex, tIndex, lIndex, event) {
				console.log("Click: moveLgndLeft");
				if (event) { event.preventDefault(); }
				var spliced;
				var lgnds = this.viewSettings[vIndex].c.lgnds[tIndex];
				if (lIndex > 0) {
					spliced = lgnds.splice(lIndex, 1);
					lgnds.splice(lIndex-1, 0, spliced[0]);
				}
			},
			moveLgndRight: function(vIndex, tIndex, lIndex, event) {
				console.log("Click: moveLgndRight");
				if (event) { event.preventDefault(); }
				var spliced;
				var lgnds = this.viewSettings[vIndex].c.lgnds[tIndex];
				if (lIndex < (lgnds.length-1)) {
					spliced = lgnds.splice(lIndex, 1);
					lgnds.splice(lIndex+1, 0, spliced[0]);
				}
			},
			addMapLayer: function(vIndex, event) {
				console.log("Click: addMapLayer");
				if (event) { event.preventDefault(); }
				var ol = PMapHub.getOverlays();
				var lid0 = ol.length > 0 ? ol[0].id : '';
				this.viewSettings[vIndex].c.lyrs.push({ lid: lid0, o: 1 });
			},
			delMapLayer: function(vIndex, lIndex, event) {
				console.log("Click: delMapLayer "+vIndex+", "+lIndex);
				if (event) { event.preventDefault(); }
				this.viewSettings[vIndex].c.lyrs.splice(lIndex, 1);
			},
			addMapGroup: function(vIndex, event) {
				console.log("Click: addMapGroup");
				if (event) { event.preventDefault(); }
				var gid0 = prspdata.map_groups.length > 0 ? prspdata.map_groups[0] : '';
				this.viewSettings[vIndex].c.lyrs.push({ gid: gid0, o: 1 });
			},
			delMapGroup: function(vIndex, lIndex, event) {
				console.log("Click: delMapGroup");
				if (event) { event.preventDefault(); }
				vApp.viewSettings[vIndex].c.lyrs.splice(lIndex, 1);
			},
			allCntOn: function(vIndex, tIndex, event) {
				console.log("Click: allCntOn");
				if (event) { event.preventDefault(); }
				var cnt=this.viewSettings[vIndex].c.cnt[tIndex];
				var n = cnt.length;
				for (var i=0; i<n; i++) {
					cnt[i].useAtt = true;
				}
			},
			allCntOff: function(vIndex, tIndex, event) {
				console.log("Click: allCntOff");
				if (event) { event.preventDefault(); }
				var cnt=this.viewSettings[vIndex].c.cnt[tIndex];
				var n = cnt.length;
				for (var i=0; i<n; i++) {
					cnt[i].useAtt = false;
				}
			},
			moveAttLeft: function(vIndex, tIndex, cIndex, event) {
				console.log("Click: moveAttLeft");
				if (event) { event.preventDefault(); }
				var spliced, atts;
					// This is called for both Visualizations and Inspector
				if (typeof(vIndex) == 'string') {	// For Inspector
					if (cIndex > 0) {
						atts = this.modal.atts[tIndex];
						spliced = atts.splice(cIndex, 1);
						atts.splice(cIndex-1, 0, spliced[0]);
					}
				} else {	// Visualization
					if (cIndex > 0) {
						atts = this.viewSettings[vIndex].c.cnt[tIndex];
						spliced = atts.splice(cIndex, 1);
						atts.splice(cIndex-1, 0, spliced[0]);
					}
				}
			},
			moveAttRight: function(vIndex, tIndex, cIndex, event) {
				console.log("Click: moveAttRight");
				if (event) { event.preventDefault(); }
				var spliced, atts;
					// This is called for both Visualizations and Inspector
				if (typeof(vIndex) == 'string') {	// For Inspector
					atts = this.modal.atts[tIndex];
					if (cIndex < (atts.length-1)) {
						spliced = atts.splice(cIndex, 1);
						atts.splice(cIndex+1, 0, spliced[0]);
					}
				} else {	// Visualization
					atts = this.viewSettings[vIndex].c.cnt[tIndex];
					if (cIndex < (atts.length-1)) {
						spliced = atts.splice(cIndex, 1);
						atts.splice(cIndex+1, 0, spliced[0]);
					}
				}
			},
			addSVGLayer: function(vIndex, event) {
				console.log("Click: addSVGLayer");
				if (event) { event.preventDefault(); }
				this.viewSettings[vIndex].c.lyrs.push({ url: '', o: 1 });
			},
			delSVGLayer: function(vIndex, lIndex, event) {
				console.log("Click: delSVGLayer");
				if (event) { event.preventDefault(); }
				this.viewSettings[vIndex].c.lyrs.splice(lIndex, 1);
			},
				// NOTE: Unclear why $event needs to be added to parameters in invocation of function
			addPtrPair: function(vIndex, tIndex, event) {
				console.log("Click: addPtrPair "+vIndex+", "+tIndex);
				if (event) { event.preventDefault(); }
				var newPtrPair = { };
				newPtrPair.pid =iTemplates[tIndex].attsPtr[0] || '';
				newPtrPair.clr = '#888888';
				this.viewSettings[vIndex].c.pAtts[tIndex].push(newPtrPair);
			},
			delPtrPair: function(vIndex, tIndex, pIndex, event) {
				console.log("Click: delPtrPair");
				if (event) { event.preventDefault(); }
				this.viewSettings[vIndex].c.pAtts[tIndex].splice(pIndex, 1);
			},
				// NOTE: It was necessary to add $event to parameters in invocation of addFacet in HTML -- I have no idea why
			addFacet: function(vIndex, event) {
				console.log("Click: addFacet "+vIndex);
				if (event) { event.preventDefault(); }
				var self=this;
				function doAddFacet(fid) {
					self.viewSettings[vIndex].c.fcts.push(fid);
				}
				this.modalParams.callback = doAddFacet;
				this.modalShowing = 'dlgChooseFacet';
			},
			topFacet: function(vIndex, fIndex, event) {
				console.log("Click: topFacet");
				if (event) { event.preventDefault(); }
				if (fIndex > 0) {
					var spliced = this.viewSettings[vIndex].c.fcts.splice(fIndex,1);
					this.viewSettings[vIndex].c.fcts.splice(0, 0, spliced[0]);
				}
			},
			delFacet: function(vIndex, fIndex, event) {
				console.log("Click: delFacet");
				if (event) { event.preventDefault(); }
				this.viewSettings[vIndex].c.fcts.splice(fIndex, 1);
			},
			allDispAttsOn: function(tIndex, event) {
				console.log("Click: allDispAttsOn");
				if (event) { event.preventDefault(); }
				var atts = this.modal.atts[tIndex];
				var n = atts.length;
				for (var i=0; i<n; i++) {
					atts[i].useAtt = true;
				}
			},
			allDispAttsOff: function(tIndex, event) {
				console.log("Click: allDispAttsOff");
				if (event) { event.preventDefault(); }
				var atts = this.modal.atts[tIndex];
				var n = atts.length;
				for (var i=0; i<n; i++) {
					atts[i].useAtt = false;
				}
			}
		} // methods
	}); // Vue
	vApp.$on('dialogclose', function () {
		console.log("dialogclose");
		this.modalShowing = 'nullcomponent';
	});
}); // ready
