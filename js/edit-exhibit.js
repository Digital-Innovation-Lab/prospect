// Exhibit Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// USES:    jQuery, Underscore, jQueryUI, and Ractive
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

		// Component (dialog) to choose Facet
	Vue.component('dlgChooseFacet', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				facetid: ''
			}
		},
		created: function() {
			this.facetid = this.params.facets[0].id;
		},
		template: '#dialog-facet',
		methods: {
			save: function() {
				console.log("Save dlgChooseFacet");
				this.params.callback(this.facetid);
			}
		}
	});

		// Component (dialog) to set single color entry for child Vocab term
	Vue.component('dlgSetRoles', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				pairs: []
			}
		},
		created: function() {
			this.pairs = JSON.parse(JSON.stringify(this.params.pairs)); // must create "deep" copy
		},
		template: '#dialog-qr-x',
		methods: {
			save: function() {
				console.log("Save dlgSetRoles");
				this.params.callback(this.pairs);
			},
			resetterms: function(event) {
				if (event) { event.preventDefault(); }
				var newPairs=[];
					// Default selection is first Vocabulary Attribute
				var defID  = allVocabAttIDs.length > 0 ? allVocabAttIDs[0] : '';
					// Is there a valid Relationship Attribute choice?
				var rAttID = vApp.qr.r;
				if (rAttID != '') {
					var rAtt = getJAttribute(rAttID);
					if (rAtt) {
							// Set all Relationship Terms in pairs with default setting
						rAtt.l.forEach(function(l) {
							newPairs.push({ t: l.l, id: defID });
						});
					}
				}
				this.pairs = newPairs;
			}
		}
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

	var qrOn = false;
		// NOTE: ds.dAtts[] will be filled out as iTemplates built
	var defGen = { l: '', hbtn: '', hurl: '', ts: [], tour: false, dspr: false, auto: true,
					qr: { t: 'disable', e1: '', e2: '', d: null, r: '', r1: '', r2: '',
							c1: null, c2: null, c: null, x: []
						},
					ds: { on: false, dAtts: new Array(defTemplates.length).fill('disable'), s: '', e: '', h: '', o: true }
 				 };
	embedData = jQuery('textarea[name="prsp_xhbt_gen"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defGen = JSON.parse(embedData);
			// Create default settings for Date Slider if not defined (added in 1.8.6)
			// NOTE: dAtts[] modified after iTemplates created
		if (typeof defGen.ds === 'undefined') {
			defGen.ds = { on: false, dAtts: new Array(defTemplates.length).fill('disable'), s: '', e: '', h: '', o: true };
		} else {
			defGen.ds.on = true;
		}
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
			// Create default settings for Qualified Relationships if not defined (added in 1.8)
		if (typeof defGen.qr === 'undefined') {
			defGen.qr = { t: 'disable', e1: '', e2: '', d: null, r: '', r1: '', r2: '',
						 c1: null, c2: null, c: null, x: []
						};
		} else {
			qrOn=true;
		}
	}

		// Configurations of Views
	var defViews = [ ];
	embedData = jQuery('textarea[name="prsp_xhbt_views"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		defViews = JSON.parse(embedData);
	}
		// Configurations of Inspector
	var defInspect = {	modal: { aOn: false, scOn: false, ytOn: false, tOn: false, t2On: false, atts: [] },
						sc: { atts: [] }, yt: { atts: [] }, t: { t1Atts: [], t2Atts: [], tcAtts: [] },
						srOff: false, w: '', h: ''
					 };
	embedData = jQuery('textarea[name="prsp_xhbt_inspect"]').val();
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
	var vApp;							// the main VueJS application
	var errTimer;

	var vizInc=0;						// Counter used to give every exhibit a unique ID

		// Configuration data for all possible independent Templates
		//	The array Atts include fully unpacked join Atts in dot notation
		//	{	tid: this Template ID,
		//		use: used by this Exhibit (true/false),
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
		//		attsFct: array of Atts that can be Facets, discrete values to which Record can be assigned (w/"disable")
		//	}
	var iTemplates = [ ];
		// Array of all (open) Attribute definitions after Joins done
	var defJoinedAtts = [ ];
		// Array of all (open) Facet Attribute definitions after Joins done
	var defJoinedFacets = [ ];
		// Configuration options for Qualified Templates
	var qrOptions = {   optsPtr: [], optsLL: [], optsTxt: [], optsVocab: [],
						optsDates: [], optsNum: [], t: ['disable']
					};


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

		// PURPOSE: Ensure all of the QR Att IDs are valid (still found in QR Template)
		// INPUT:	qrID is ID of QR Template, or 'disable'
	function resetQRAttIDs(qrID)
	{
		var qrT;	// Points to QR Template (if set)

			// PURPOSE: Ensure that Attribute actually exists in chosen Template
			//			and convert nulls into 'disable'
			// INPUT:	id = original Attribute ID
			//			disable = true if "disable" stands for lack of setting (only optional settings)
		function checkQRAttID(id, disable)
		{
				// Is it alread 'disable'?
			if (id == 'disable') {
				return id;
			}
				// Do we need to translate null to non-selection?
			if (id == null) {
				return disable ? 'disable' : '';
			}

			var failed=false;
			var checkAtt, prefixID;
				// First check for Attribute ID in Template definition
				// If this is a Joined Attribute, Template will only have Join ID
			prefixID = id.split('.')[0];
			checkAtt = qrT.def.a.findIndex(function(theAttID) { return prefixID == theAttID; })
			if (checkAtt == -1) {
				failed=true;
			} else {
				checkAtt = getJAttribute(id);
				if (typeof checkAtt === 'undefined') {
					failed=true;
				}
			}
			if (failed) {
				return disable ? 'disable' : '';
			}
			return id;
		} // checkQRAttID()

		var hasQRT = (qrID==='disable') ? false : true;
		var qrI;
			// Check that Template with this ID actually exists
		if (hasQRT) {
			qrI = defTemplates.findIndex(function(theT) { return qrID === theT.id; });
			if (qrI == -1) {
				hasQRT=false;
			} else {
				qrT = defTemplates[qrI];
			}
		}
			// If a valid QR Template is selected and exists, ensure current selection valid
		if (hasQRT) {
			vApp.qr.e1 = checkQRAttID(vApp.qr.e1, false);
			vApp.qr.e2 = checkQRAttID(vApp.qr.e2, false);
			vApp.qr.d  = checkQRAttID(vApp.qr.d,  true);
			vApp.qr.r  = checkQRAttID(vApp.qr.r,  false);
			vApp.qr.r1 = checkQRAttID(vApp.qr.r1, false);
			vApp.qr.r2 = checkQRAttID(vApp.qr.r2, false);
			vApp.qr.c  = checkQRAttID(vApp.qr.c,  true);
			vApp.qr.c1 = checkQRAttID(vApp.qr.c1, true);
			vApp.qr.c2 = checkQRAttID(vApp.qr.c2, true);
		} else {
			vApp.qr.t  = 'disable';
			vApp.qr.e1 = '';
			vApp.qr.e2 = '';
			vApp.qr.d  = 'disable';
			vApp.qr.r  = '';
			vApp.qr.r1 = '';
			vApp.qr.r2 = '';
			vApp.qr.c  = 'disable';
			vApp.qr.c1 = 'disable';
			vApp.qr.c2 = 'disable';
			vApp.qr.x  = [];
		}
	} // resetQRAttIDs()

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

		var exhibitID = vApp.xhbtID.trim();
		if (exhibitID.length == 0 || exhibitID.length > 24) {
			displayError('#errmsg-id');
			return false;
		}

		var exhibitL = vApp.label.replace(/"/g, '').trim();
		if (exhibitL.length == 0 || exhibitL.length > 48) {
			displayError('#errmsg-label');
			return false;
		}
		saveGen.l = exhibitL;
		saveGen.hbtn = vApp.hbtn.trim();
		saveGen.hurl = vApp.hurl.trim();
		saveGen.tour = vApp.tour;
		saveGen.dspr = vApp.dspr;
		saveGen.auto = vApp.auto;

			// Has user enabled Qualified Relationships?
		if (vApp.qrOn && vApp.qr.t != 'disable') {
			function preID(id)
			{
				if (id == 'disable') {
					return null;
				}
				return id;
			} // disableToNull()
			saveGen.qr = JSON.parse(JSON.stringify(vApp.qr));
				// Check that all required Attribute settings are given
			if (saveGen.qr.e1 == '' || saveGen.qr.e2 == '' || saveGen.qr.r == '' ||
				saveGen.qr.r1 == '' || saveGen.qr.r2 == '')
			{
				displayError('#errmsg-qr-missing');
				return false;
			}
				// Check that r1/r2, e1/e2, c1/c2 are different Attributes
			if (saveGen.qr.e1 == saveGen.qr.e2 || saveGen.qr.r1 == saveGen.qr.r2 ||
				(saveGen.qr.c1 != 'disable' && saveGen.qr.c1 == saveGen.qr.c2))
			{
				displayError('#errmsg-qr-unique');
				return false;
			}
			// TO DO: Error checking
			//		Check that terms in qr.x are in the selected Relationship Attribute
			saveGen.qr.e1 = preID(saveGen.qr.e1);
			saveGen.qr.e2 = preID(saveGen.qr.e2);
			saveGen.qr.d  = preID(saveGen.qr.d);
			saveGen.qr.r  = preID(saveGen.qr.r);
			saveGen.qr.r1 = preID(saveGen.qr.r1);
			saveGen.qr.r2 = preID(saveGen.qr.r2);
			saveGen.qr.c  = preID(saveGen.qr.c);
			saveGen.qr.c1 = preID(saveGen.qr.c1);
			saveGen.qr.c2 = preID(saveGen.qr.c2);
		}

		saveGen.ts = [];

		var i;
		for (i=0; i<iTemplates.length; i++) {
			var used = vApp.iTemplates[i].use;
			if (used) {
				saveGen.ts.push(vApp.iTemplates[i].tid);
				saveTIndices.push(i);
			}
		}

			// PURPOSE: Parse a string for a Date
			// ASSUMES: String has passed RegEx test
		function parseDate(str, end)
		{
			var m, d;

			var np = 1;
			if (str.charAt(0) === '-') {
				np = -1;
				str = str.substring(1);
			}
			var cmpts = str.split('-');
			var y = parseInt(cmpts[0])*np;
			if (cmpts.length > 1) {
				m = parseInt(cmpts[1]);
				if (cmpts.length == 3) {
					d = parseInt(cmpts[2]);
				} else {
					if (end)
						d = 31;
					else
						d = 1;
				}
			} else {
				if (end) {
					m=12; d=31;
				} else {
					m=1; d=1;
				}
			}
				// add end of day?
			return [y, m, d];
		} // parseDate

			// Do we need to save Date Slider params?
		if (vApp.dateslider.on) {
			var dateRegEx = /^-?\d+(-?\d+(-?\d+))$/;
			var sDateVal = vApp.dateslider.s;
			if (!sDateVal.match(dateRegEx))
			{
				displayError('#errmsg-ds-bad-date');
				return false;
			}
			var eDateVal = vApp.dateslider.e;
			if (!eDateVal.match(dateRegEx))
			{
				displayError('#errmsg-ds-bad-date');
				return false;
			}
			var parsedSDate = parseDate(sDateVal, false);
			var parsedEDate = parseDate(eDateVal, true);
			if ((parsedSDate[0] > parsedEDate[0]) ||
				((parsedSDate[0] === parsedEDate[0]) && (parsedSDate[1] > parsedEDate[1])) ||
				((parsedSDate[0] === parsedEDate[0]) && (parsedSDate[1] === parsedEDate[1]) && (parsedSDate[2] > parsedEDate[2])))
			{
					displayError('#errmsg-ds-date-order');
					return false;
			}
				// dAtts will get processed further later
			saveGen.ds = { s: sDateVal, e: eDateVal, dAtts: vApp.dateslider.dAtts, o: vApp.dateslider.o };
				// Did user provide handle date?
			var hDateVal = vApp.dateslider.h;
			if (hDateVal.length != 0) {
				if (!hDateVal.match(dateRegEx))
				{
					displayError('#errmsg-ds-bad-date');
					return false;
				}
				saveGen.ds.h = hDateVal;
			}
		}

			// Ensure unique labels given to all views
		var vNames=[];
		for (i=0; i<vApp.viewSettings.length; i++) {
			var label = vApp.viewSettings[i].l;
			label = label.trim();
			if (_.indexOf(vNames,label) != -1) {
				displayError('#errmsg-dup-label', label);
				return false;
			}
			vNames.push(label);
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
				attsTrns=['disable'], attsTC=['disable'], attsPtr=[], attsDPtr=['disable'], attsVocab=[],
				attsLgnd=[], attsCnt=[], attsTCnt=[], attsOAtt=[], attsFct=['disable'];

			theTmplt.def.a.forEach(function(theAttID) {
				function saveAttRef(prefix, theAttID, type)
				{
					switch (type) {
					case 'V':
						attsVocab.push(prefix+theAttID);
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

			qrOptions.t.push(theTmplt.id);

			var tmpltEntry = { tid: theTmplt.id, use: isUsed,
								attsTxt: attsTxt, attsDates: attsDates, attsDNum: attsDNum,
								attsLL: attsLL, attsDLL: attsDLL, attsXY: attsXY, attsImg: attsImg, attsSC: attsSC,
								attsYT: attsYT, attsTrns: attsTrns, attsTC: attsTC, attsPtr: attsPtr,
								attsDPtr: attsDPtr, attsLgnd: attsLgnd, attsCnt: attsCnt, attsTCnt: attsTCnt,
								attsOAtt: attsOAtt, attsFct: attsFct, attsVocab: attsVocab
							};
			iTemplates.push(tmpltEntry);
		}
	}); // foreach defTemplates

		// Sort Joined Attributes by ID
	defJoinedAtts = _.sortBy(defJoinedAtts, 'id');

		// Compile Joined Facets from Joined Attributes
	defJoinedAtts.forEach(function(theJAtt) {
		switch (theJAtt.def.t) {
		case 'V':
		case 'T':
		case 'g':
		case 'N':
		case 'D':
			defJoinedFacets.push(_.clone(theJAtt));
			break;
		}
	});

		// Collect IDs of all Vocabulary Attributes for creating Relationship Term map
		// These Vocab Attributes define valid Roles
		// NOTE: Vocab Attributes don't need to be included in any Template
	var allVocabAttIDs=[];
	defAtts.forEach(function(theAtt) {
		if (theAtt.def.t == 'V') {
			allVocabAttIDs.push(theAtt.id);
		}
	});

		// Create list of Attribute IDs of all Joined facets for drop-down menu
	var facetAttIDs = defJoinedFacets.map(function(f) { return f.id; });

		// PURPOSE: Create all of the options for QRs based on which Template has been chosen
		// INPUT:	selectedT = ID of Template selected for QR
	function updateQROptions(selectedT)
	{
		var newPtr=[], newLL=[], newDates=[], newNum=[], newVocab=[], newTxt=[];

		if (selectedT != 'disable') {
			var tDef = iTemplates.find(function(thisTemplate) { return thisTemplate.tid === selectedT; });
			if (tDef) {
				newPtr = tDef.attsPtr;
				newLL = tDef.attsDLL;
				newDates  = tDef.attsDates;
				newNum  = tDef.attsDNum;
				newVocab  = tDef.attsVocab;
				newTxt = tDef.attsTxt;
			}
		}

		vApp.qrOptions.optsPtr   = newPtr;
		vApp.qrOptions.optsLL    = newLL;
		vApp.qrOptions.optsDates = newDates;
		vApp.qrOptions.optsNum   = newNum;
		vApp.qrOptions.optsVocab = newVocab;
		vApp.qrOptions.optsTxt   = newTxt;
	} // updateQROptions()

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
		// Initialize playback widget settings that correspond to iTemplates structures
		// Created "padded" array for Date Slider
	(function() {
		var oldDSAtts=defGen.ds.dAtts, newDSAtts=[];
		var newSCAtts=[], newYTAtts=[], newT1Atts=[], newT2Atts=[], newTCAtts=[],
			newModalAtts=[];
		iTemplates.forEach(function(theTmplt) {
			var origTIndex = getTemplateIndex(theTmplt.tid);
				// Is Template absent in original configuration?
			if (origTIndex == -1) {
					// Date Slider Attributes
				newDSAtts.push('disable');
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
					// Date Slider Attributes
				newDSAtts.push(checkAttID(oldDSAtts[origTIndex], theTmplt.attsDates, 'disable'));
					// Widget Attributes
				newSCAtts.push(checkAttID(defInspect.sc.atts[origTIndex], theTmplt.attsSC, 'disable'));
				newYTAtts.push(checkAttID(defInspect.yt.atts[origTIndex], theTmplt.attsYT, 'disable'));
				newT1Atts.push(checkAttID(defInspect.t.t1Atts[origTIndex], theTmplt.attsTrns, 'disable'));
				newT2Atts.push(checkAttID(defInspect.t.t2Atts[origTIndex], theTmplt.attsTrns, 'disable'));
				newTCAtts.push(checkAttID(defInspect.t.tcAtts[origTIndex], theTmplt.attsTC, 'disable'));
					// Fill in unused Attributes with useAtt: false
				newModalAtts.push(createPaddedAtts(theTmplt.attsCnt, defInspect.modal.atts[origTIndex]));
			} // in original config
		}); // for iTemplate
		defGen.ds.dAtts = newDSAtts;
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
			case 'm': 	// MultiBlockMap
				theVF.c.p = checkAttID(theVF.c.p, facetAttIDs, '');
			case 'F': 	// Facet Flow
			case 'B': 	// Facet Browser
				var newFcts=[];
				theVF.c.fcts.forEach(function(f) {
					var tF = checkAttID(f, facetAttIDs, '');
					if (tF != '')
						newFcts.push(tF);
				});
				theVF.c.fcts = newFcts;
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
			case 'Q':	// QR-Map
				var newLgnds=[], newSAtts=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
					} else {
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
					}
				});
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				break;
			case 'q':	// QR-Network
				var newSAtts=[], newLgnds=[], newSyms=[], newIAtts=[];
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
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newSAtts.push(theTmplt.attsDNum[0] || 'disable');
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSyms.push(0);
						newIAtts.push('disable');
					} else {
						newSAtts.push(checkAttID(theVF.c.sAtts[origTIndex], theTmplt.attsDNum, 'disable'));
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSyms.push(theVF.c.syms[origTIndex]);
						newIAtts.push(theVF.c.iAtts[origTIndex]);
					}
				});
				theVF.c.sAtts = newSAtts;
				theVF.c.lgnds = newLgnds;
				theVF.c.syms  = newSyms;
				theVF.c.iAtts = newIAtts;
				break;
			case 'E':	// Ego-graph
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
				var newLgnds=[], newSyms=[], newIAtts=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newLgnds.push(theTmplt.attsLgnd.map(function(theLgndAtt) {
								return { attID: theLgndAtt, useAtt: true };
							}));
						newSyms.push(0);
						newIAtts.push('disable');
					} else {
						newLgnds.push(createPaddedAtts(theTmplt.attsLgnd, theVF.c.lgnds[origTIndex]));
						newSyms.push(theVF.c.syms[origTIndex]);
						newIAtts.push(theVF.c.iAtts[origTIndex]);
					}
				});
				theVF.c.lgnds = newLgnds;
				theVF.c.syms  = newSyms;
				theVF.c.iAtts = newIAtts;
				break;
			case 'e':	// Time-rings
				var newD=[];
				iTemplates.forEach(function(theTmplt) {
					var origTIndex = getTemplateIndex(theTmplt.tid);
						// Was this Template absent in original config?
					if (origTIndex == -1) {
						newD.push(theTmplt.attsDates[0] || 'disable');
					} else {
						newD.push(checkAttID(theVF.c.dAtts[origTIndex], theTmplt.attsDates, 'disable'));
					}
				});
				theVF.c.dAtts = newD;
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
		case 'S': 	// Stacked Chart
			newVFEntry.c.gr = true;
			newVFEntry.c.h = 500;
			newVFEntry.c.oAtt = defJoinedFacets[0].id || '';
			newVFEntry.c.sAtt = defJoinedFacets[0].id || '';
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
		case 'F': 	// Facet Flow
			newVFEntry.c.w    = 1000;
		case 'B': 	// Facet Browser
			newVFEntry.c.gr   = true;
			newVFEntry.c.fcts = [];
			break;
		case 'm': 	// MultiBlockMap
			newVFEntry.c.w    = 600;
			newVFEntry.c.h    = 400;
			newVFEntry.c.p    = '';
			newVFEntry.c.fcts = [];
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
		case 'Q':	// QR-Map
			newVFEntry.c.clat = '';
			newVFEntry.c.clon = '';
			newVFEntry.c.zoom = 10;
			newVFEntry.c.min = 7;
			newVFEntry.c.max = 7;
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
		case 'q':	// QR-Network
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
			break;
		case 'E':	// Ego-graph
			newVFEntry.c.s = 400;
			newVFEntry.c.n = 3;
			newVFEntry.c.r = 20;
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
			break;
		case 'e':	// Time-rings
			newVFEntry.c.r = 20;
				// Potential Dates Attributes
			newVFEntry.c.dAtts= iTemplates.map(function(theTemplate) {
				return 'disable';
			});
			break;
		} // switch
		return newVFEntry;
	} // createNewViz()

		// PURPOSE:	Verify and prepare Exhibit Configuration
		// SIDE-FX:	Pack data in hidden fields, if it verifies
	function doSaveExhibit()
	{
		var result = doErrorCheck();

		if (result) {
			var saveGen = result[0];
			var saveTIndices = result[1];
			var saveID = vApp.xhbtID.trim();
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

				// PURPOSE: Ensure that Legends for QR Template have single entry for QR Relationship Attribute
				// RETURNS: true if OK, false if problem
			function checkRelLegends(legends, name)
			{
					// First get index to QR Template
				var tID = saveGen.qr.t;
				var qrI = defTemplates.findIndex(function(theT) { return tID === theT.id; });

				for (var i=0; i<legends.length; i++) {
					var lSet=legends[i];
					for (j=0; j<lSet.length; j++) {
						lItem=lSet[j];
							// Are we checking the QR Template? Make sure only Relationship Att checked
						if (i === qrI) {
							if (lItem.attID == saveGen.qr.r) {
								if (!lItem.useAtt) {
									displayError('#errmsg-qr-rel-lgnd', name);
									return false;
								}
							} else {
								if (lItem.useAtt) {
									displayError('#errmsg-qr-rel-lgnd', name);
									return false;
								}
							}
						}
					}
				}

				return true;
			} // checkRelLegends()

				// Pack Date Slider Attributes
			if (typeof saveGen.ds !== 'undefined') {
				saveGen.ds.dAtts = packUsedAttIDs(saveGen.ds.dAtts, 'disable');
				if (saveGen.ds.dAtts.findIndex(function(d) { return d !== 'disable'; }) === -1) {
					displayError('#errmsg-ds-date-atts', name);
					return false;
				}
			}

				// Compact View Setting arrays
			var vCount = vApp.viewSettings.length;
			for (var i=0; i<vCount; i++) {
				var saveView = {}, viewSettings = vApp.viewSettings[i];
				var abort=false;

					// PURPOSE: Confirm that att is in the list of facets in selected Templates
					// RETURNS: False if not
				function validFacet(att)
				{
					var valid = iTemplates.find(function(t, tI) {
						if (vApp.iTemplates[tI].use) {
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
					if (viewSettings.c.clat.length == 0 || viewSettings.c.clon.length == 0)
					{
						displayError('#errmsg-map-coords', i);
						return false;
					}
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
					saveView.c.cAtts = packUsedAttIDs(viewSettings.c.cAtts, null);
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
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
					saveView.c.min = viewSettings.c.min;
					saveView.c.max = viewSettings.c.max;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.cnt = packUsedAttIDs(viewSettings.c.cnt, null);
					saveView.c.order = packUsedAttIDs(viewSettings.c.order, null);
					saveView.c.lgnds = newLgnds;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
					break;
				case 'S': 	// Stacked Chart
					saveView.c.gr   = viewSettings.c.gr;
					saveView.c.h    = viewSettings.c.h;
					saveView.c.oAtt = viewSettings.c.oAtt;
					saveView.c.sAtt = viewSettings.c.sAtt;
					if (!validFacet(saveView.c.oAtt) || !validFacet(saveView.c.sAtt)) {
						return false;
					}
					if (saveView.c.oAtt == saveView.c.sAtt) {
						displayError('#errmsg-stckchrt-diffats', saveView.l);
						return false;
					}
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
				case 'F': 	// Facet Flow
					saveView.c.w = viewSettings.c.w;
					saveView.c.gr   = viewSettings.c.gr;
					saveView.c.fcts = viewSettings.c.fcts;
					saveView.c.fcts.forEach(function(f) {
						if (!validFacet(f)) {
							abort = true;
						}
					});
					if (abort) {
						return false;
					}
					if (saveView.c.fcts.length < 2) {
						displayError('#errmsg-few-facets', saveView.l);
						return false;
					}
					break;
				case 'B': 	// Facet Browser
					saveView.c.gr   = viewSettings.c.gr;
					saveView.c.fcts = viewSettings.c.fcts;
					saveView.c.fcts.forEach(function(f) {
						if (!validFacet(f)) {
							abort = true;
						}
					});
					if (abort) {
						return false;
					}
					if (saveView.c.fcts.length === 0) {
						displayError('#errmsg-few-facets', saveView.l);
						return false;
					}
					break;
				case 'm': 	// MultiBlockMap
					saveView.c.w = viewSettings.c.w;
					saveView.c.h = viewSettings.c.h;
					saveView.c.gr   = viewSettings.c.gr;
					saveView.c.p   = viewSettings.c.p;
					saveView.c.fcts = viewSettings.c.fcts;
					saveView.c.fcts.forEach(function(f) {
						if (!validFacet(f)) {
							abort = true;
						}
					});
					if (abort) {
						return false;
					}
					if (saveView.c.fcts.length === 0) {
						displayError('#errmsg-few-facets', saveView.l);
						return false;
					}
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
					saveView.c.oAtts = packUsedAttIDs(viewSettings.c.oAtts, null);
					break;
				case 'Q':	// QR-Map
						// Ensure that QR-Template enabled if QR views are defined
					if (typeof saveGen.qr === 'undefined') {
						displayError('#errmsg-qr-usage', i);
						return false;
					}
					if (saveGen.qr.c1 == null) {
						displayError('#errmsg-qr-coord');
						return false;
					}
					if (viewSettings.c.clat.length == 0 || viewSettings.c.clon.length == 0)
					{
						displayError('#errmsg-map-coords', i);
						return false;
					}
					if (!checkRelLegends(viewSettings.c.lgnds, saveView.l)) {
						return false;
					}
					saveView.c.clat = viewSettings.c.clat;
					saveView.c.clon = viewSettings.c.clon;
					saveView.c.zoom = viewSettings.c.zoom;
					saveView.c.min  = viewSettings.c.min;
					saveView.c.max  = viewSettings.c.max;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.lgnds = newLgnds;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
						// Don't need to modify map layer settings
					saveView.c.base = viewSettings.c.base;
					saveView.c.lyrs = viewSettings.c.lyrs;
					break;
				case 'q':	// QR-Network
						// Ensure that QR-Template enabled if QR views are defined
					if (typeof saveGen.qr === 'undefined') {
						displayError('#errmsg-qr-usage', i);
						return false;
					}
					if (!checkRelLegends(viewSettings.c.lgnds, saveView.l)) {
						return false;
					}
					saveView.c.min = viewSettings.c.min;
					saveView.c.max = viewSettings.c.max;
					saveView.c.s   = viewSettings.c.s;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
					saveView.c.lgnds = newLgnds;
					saveView.c.sAtts = packUsedAttIDs(viewSettings.c.sAtts, null);
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
				case 'E':	// Ego-graph
						// Ensure that QR-Template enabled if QR views are defined
					if (typeof saveGen.qr === 'undefined') {
						displayError('#errmsg-qr-usage', i);
						return false;
					}
					if (!checkRelLegends(viewSettings.c.lgnds, saveView.l)) {
						return false;
					}
					saveView.c.s = viewSettings.c.s;
					saveView.c.n = viewSettings.c.n;
					saveView.c.r = viewSettings.c.r;
					var newLgnds=[];
					saveTIndices.forEach(function(tIndex) {
						newLgnds.push(packUsedAtts(viewSettings.c.lgnds[tIndex]));
					});
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
				case 'e':	// Time-rings
						// Ensure that QR-Template enabled if QR views are defined
					if (typeof saveGen.qr === 'undefined') {
						displayError('#errmsg-qr-usage', i);
						return false;
					}
					saveView.c.r = viewSettings.c.r;
					saveView.c.dAtts = packUsedAttIDs(viewSettings.c.dAtts, null);
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
console.log("prsp_xhbt_gen: "+JSON.stringify(saveGen));
console.log("prsp_xhbt_views: "+JSON.stringify(saveViews));
console.log("prsp_xhbt_inspect: "+JSON.stringify(saveInspect));

				// Insert values into hidden fields if no problems
			jQuery('input[name="prsp_xhbt_id"]').val(saveID);
			jQuery('textarea[name="prsp_xhbt_gen"]').val(JSON.stringify(saveGen));
			jQuery('textarea[name="prsp_xhbt_views"]').val(JSON.stringify(saveViews));
			jQuery('textarea[name="prsp_xhbt_inspect"]').val(JSON.stringify(saveInspect));
				// Confirm to user that Exhibit was successfully saved
			displayError('#msg-saved', null, true);
		} // if saveGen
	} // doSaveExhibit()


	PMapHub.init(prspdata.maps);

		// Create our main App instance
	vApp = new Vue({
		el: '#vue-outer',
		data: {
				// Configuration settings for all Exhibit settings
			xhbtID: xhbtID,
			label: defGen.l,
			tour: defGen.tour,
			dspr: defGen.dspr,
			autoUpdate: defGen.auto,
			hbtn: defGen.hbtn,
			hurl: defGen.hurl,
			dateslider: defGen.ds,
			qr: defGen.qr,
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
			facets: defJoinedFacets,
			qrOn: qrOn,
			qrOptions: qrOptions,
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
				vocabOpts: allVocabAttIDs,
				callback: null
			},
			modalShowing: 'nullcomponent'		// modal currently showing (initially nothing)
		},
		methods: {
			saveExhibit: function(event) {
				console.log("Click: saveAttribute");
				if (event) { event.preventDefault(); }
				doSaveExhibit();
			},
			idHint: function(event) {
				console.log("Click: idHint");
				if (event) { event.preventDefault(); }
				messageModal('#errmsg-id');
			},
			setRoles: function(event) {
				console.log("Click: setRoles");
				if (event) { event.preventDefault(); }
				var self=this;
				function saveQRPairs(newPairs) {
					self.qr.x = newPairs;
				}
				this.modalParams.pairs = this.qr.x;
				this.modalParams.callback = saveQRPairs;
				this.modalShowing = 'dlgSetRoles';
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
				// Couldn't get this to work properly -- bug with event parameter
			// togDiv: function(vIndex,event) {
			// 	console.log("Click: togDiv "+vIndex);
			// 	jQuery(event.target).parent().next().slideToggle(400);
			// 		// TO DO -- not working -- event not passed correctly
			// 	if (event) { event.preventDefault(); }
			// },
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
		// If user chooses new Template for QR, need to change Attribute options
	vApp.$watch('qr.t', function(newVal, oldVal) {
		updateQROptions(newVal);
		resetQRAttIDs(newVal);
	});
		// Set initial options for QR Template options and Attribute IDs
	updateQROptions(defGen.qr.t);
	resetQRAttIDs(defGen.qr.t);
}); // ready
