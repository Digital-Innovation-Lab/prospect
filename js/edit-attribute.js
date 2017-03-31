// Attribute Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   See notes in class-prospect-admin.php about JSON, Unicode and UTF-8
// USES:    jQuery, Underscore, jQueryUI, and Ractive


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
			click: function (event) {
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

		// Component (dialog) to edit Text Legend entries
		// INPUT:	params.label = label for Legend entry
		//			params.pattern = text pattern
		//			params.theColor = color value
	Vue.component('dlgEditLgndText', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				label: '', pattern: '', theColor: ''
			}
		},
		created: function() {	// Copy params into local data variables
			this.label = this.params.label;
			this.pattern = this.params.pattern;
			this.theColor = this.params.theColor;
			console.log("Created dlgEditLgndText");
		},
		methods: {
			save: function() {
				console.log("Clicked save for "+this.label+", "+this.pattern+", "+this.theColor);
				this.params.callback(this.label, this.pattern, this.theColor);
			}
		},
		template: '#dialog-legend-text'
	});

		// Component (dialog) to edit Text Legend entries
		// INPUT:	params.label = label for Legend entry
		//			params.min = minimum numeric value
		//			params.max = maximum numeric value
		//			params.theColor = color value
	Vue.component('dlgEditLgndNumber', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				label: '', min: 0, max: 100, theColor: ''
			}
		},
		created: function() {	// Copy params into local data variables
			this.label = this.params.label;
			this.min = this.params.min;
			this.max = this.params.max;
			this.theColor = this.params.theColor;
		},
		methods: {
			save: function() {
				console.log("Clicked save");
				this.params.callback(this.label, this.min, this.max, this.theColor);
			}
		},
		template: '#dialog-legend-number'
	});

		// Component (dialog) to edit Text Legend entries
		// INPUT:	params.label = label for Legend entry
		//			params.min = minimum numeric value
		//			params.max = maximum numeric value
		//			params.theColor = color value
	Vue.component('dlgEditLgndDates', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				label: '', min: { y: '', m: '', d: '' }, max: { y: '', m: '', d: '' }, theColor: ''
			}
		},
		created: function() {	// Copy params into local data variables
			this.label = this.params.label;
			this.min = this.params.min;
			this.max = this.params.max;
			this.theColor = this.params.theColor;
		},
		methods: {
			save: function() {
				console.log("Clicked save");
				this.params.callback(this.label, this.min, this.max, this.theColor);
			}
		},
		template: '#dialog-legend-dates'
	});

		// Component (dialog) to choose parent for Vocab term at top-level
		//			This is a Term that has no children
		// INPUT:	params.parents = array of parent Terms
	Vue.component('dlgMoveLgndTop', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				newParent: '', keep: 'yes'
			}
		},
		created: function() {
			this.newParent = this.params.parents[0] || ''; // Initial selection
		},
		methods: {
			save: function() {
				console.log("dlgMoveLgndTop > Clicked save");
				this.params.callback(this.newParent, this.keep == 'yes');
			}
		},
		template: '#dialog-move-vocab-lone'
	});

		// Component (dialog) to move children Terms of parent
	Vue.component('dlgMoveLgndParent', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				newParent: '', up: 'yes'
			}
		},
		created: function() {
			this.newParent = this.params.parents[0] || ''; // Initial selection
		},
		template: '#dialog-move-vocab-parent',
		methods: {
			save: function() {
				console.log("dlgMoveLgndParent > Clicked save");
				this.params.callback(this.up == 'yes', this.newParent);
			}
		}
	});

		// Component (dialog) to move children Terms of parent
	Vue.component('dlgMoveLgndChild', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				newParent: '', up: 'yes'
			}
		},
		created: function() {
			this.newParent = this.params.parents[0] || ''; // Initial selection
		},
		template: '#dialog-move-vocab-child',
		methods: {
			save: function() {
				console.log("dlgMoveLgndChild > Clicked save");
				this.params.callback(this.up == 'yes', this.newParent);
			}
		}
	});

		// Component (dialog) to reset color legend (multiple entries)
	Vue.component('dlgResetColors', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				reset: 'random', c0: randomColor(), c1: randomColor()
			}
		},
		template: '#dialog-reset-colors',
		methods: {
			save: function() {
				console.log("Save dlgResetColors");
				this.params.callback(this.reset == 'gradient', this.c0, this.c1);
			}
		}
	});

		// Component (dialog) to set single color entry for child Vocab term
	Vue.component('dlgChooseColor', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				doClear: false, theColor: ''
			}
		},
		created: function() {
			this.theColor = this.params.theColor;
		},
		template: '#dialog-choose-color-clear',
		methods: {
			save: function() {
				console.log("Save dlgChooseColor");
				this.params.callback(this.doClear, this.theColor);
			}
		}
	});

		// Component (dialog) to choose Legend from another Attribute def to copy
	Vue.component('dlgCopyLegend', { // TO DO
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return {
				attid: ''
			}
		},
		created: function() {
			this.attid = this.params.attList[0].id;
		},
		template: '#dialog-copy-legend',
		methods: {
			save: function() {
				console.log("dlgCopyLegend save");
				this.params.callback(this.attid);
			}
		}
	});

		// DATA LOADED FROM SERVER
		// =======================
	var customFields = prspdata.cfs;			// Custom fields used in Records
	var allAttributeIDs = prspdata.att_ids;		// List of previously defined Attributes (not including this one!)

		// Configuration settings common to all Attribute types (with defaults)
		// ====================================================================
	var label = '';
	var attID = '';
	var thisType = 'V';
	var privacy = 'o';
	var hint = '';
	var delim = '';
	var fAvail = true;
		// Configuration settings specific to particular Attribute types
	var vLegend = [];					// Vocab Legend definition
	var tLegend = [];					// Text Legend definition
	var nRange = { min: '0', max: '100', g: 0, u: '#888888', useU: false };				// Number Range definition
	var nLegend = [];					// Number Legend definition
	var dRange = { min: {y: '', m: '', d: ''}, max: {y: '', m: '', d: ''}, g: 'y', u: '#888888', useU: false };	// Dates Range definition
	var dLegend = [];					// Dates Legend definition

		// GUI Vars
	var errTimer;
	var dataTypes=[];					// { code, label }

		// OTHER VARS
		// ==========
	var vApp;							// the VueJS application
	var embedData;

	embedData = document.getElementById('dltext-attributes').innerHTML;
	embedData = embedData.trim().split('|');
	embedData.forEach(function(dType) {
		var p = dType.split(',');
		dataTypes.push({code: p[0], label: p[1]});
	});


		// Compact representations saved for Attributes are unpacked for editing purposes
		//		(unsaved unpacked fields marked with '*')
		// Generic Legend definition: l = label (String), d = data (Type-specific), v = visual code
		//		val* = value (String representation)
		// Vocabulary Legend definition: l = label (String), v = visual code, z = children
		//   If a 2ndary child node, v = '' indicates inheriting from parent

		// Data for ranges and legends are stored as strings because must allow for empty values
		//		This is packed and unpacked on load and save

	attID = jQuery('input[name="prsp_att_id"]').val();
	privacy = jQuery('textarea[name="prsp_att_privacy"]').val();
	if (privacy == '') privacy = 'o';

		// Unpack and prepare the Attribute definition
	embedData = jQuery('textarea[name="prsp_att_def"]').val();
	if (embedData && embedData.length > 2) {
		embedData = JSON.parse(embedData);

			// Copy values over
		label = embedData.l;
		delim = embedData.d;
		thisType = embedData.t;
		hint = embedData.h;

			// Define f[ilter] flag if left undefined -- only relevant for some Attribute types
		if (typeof embedData.f === 'undefined') {
			switch (embedData.t) {
			case 'V':
			case 'T':
			case 'g':
			case 'N':
			case 'D':
				fAvail = true;
				break;
			default:
				fAvail = false;
				break;
			} // switch
		} else {
			fAvail = embedData.f;
		}
	}

	embedData = jQuery('textarea[name="prsp_att_r"]').val();
	if (embedData && embedData.length > 2) {
		embedData = JSON.parse(embedData);
			// Interpret undefined range values -- turn into strings
		switch (thisType) {
		case 'N':
				// Convert numeric values to strings for ease of editing
			if (typeof(embedData.min) != 'undefined')
				nRange.min = embedData.min.toString();
			if (typeof(embedData.max) != 'undefined')
				nRange.max = embedData.max.toString();
			if (typeof(embedData.u) != 'undefined') {
				nRange.u = embedData.u;
				nRange.useU = true;
			}
			nRange.g = embedData.g;
			break;
		case 'D':
				// Convert numeric values into strings
			dRange.min.y = embedData.min.y.toString();
			if (typeof(embedData.min.m) != 'undefined')
				dRange.min.m = embedData.min.m.toString();
			if (typeof(embedData.min.d) != 'undefined')
				dRange.min.d = embedData.min.d.toString();
			if (typeof(embedData.max.y) != 'undefined') {
				dRange.max.y = embedData.max.y.toString();
				if (typeof(embedData.max.m) != 'undefined') {
					dRange.max.m = embedData.max.m.toString();
					if (typeof(embedData.max.d) != 'undefined') {
						dRange.max.d = embedData.max.d.toString();
					}
				}
			}
			if (typeof(embedData.u) != 'undefined') {
				dRange.u = embedData.u;
				dRange.useU = true;
			}
			dRange.g = embedData.g;
			break;
		} // switch
	} // Unpack range configuration data

		// PURPOSE: Reformat raw Legend array for editing purposes into defLegend
	function unpackLegend(legArray)
	{
		var newLegend=[];
		legArray.forEach(function(lgndEntry) {
			var newEntry = lgndEntry;
			switch (thisType) {
			case 'V':
				var newZ = [];
				lgndEntry.z.forEach(function(child) {
					var newChild = {};
						// v is null if uses parent as default
					if (child.v != null) {
						newChild.v = child.v;
						newChild.l = child.l;
					} else {
						newChild.l = child.l;
						newChild.v = '';
					}
					newZ.push(newChild);
				});
				newEntry.z = newZ;
				break;
			case 'T':
				newEntry.val = newEntry.d;
				break;
			case 'N':
				if (typeof(lgndEntry.d.min) == 'undefined')
					newEntry.d.min = '';
				else
					newEntry.d.min = newEntry.d.min.toString();
				if (typeof(lgndEntry.d.max) == 'undefined')
					newEntry.d.max = '';
				else
					newEntry.d.max = newEntry.d.max.toString();
				newEntry.val = (newEntry.d.min.length == 0) ? '(none)' : newEntry.d.min;
				newEntry.val += ' to ';
				newEntry.val += (newEntry.d.max.length == 0) ? '(none)' : newEntry.d.max;
				break;
			case 'D':
				newEntry.d.min.y = newEntry.d.min.y.toString();
				if (typeof(newEntry.d.min.m) == 'undefined')
					newEntry.d.min.m = '';
				else
					newEntry.d.min.m = newEntry.d.min.m.toString();
				if (typeof(newEntry.d.min.d) == 'undefined')
					newEntry.d.min.d = '';
				else
					newEntry.d.min.d = newEntry.d.min.d.toString();
				if (typeof(newEntry.d.max.y) == 'undefined') {
					newEntry.d.max.y = '';
					newEntry.d.max.m = '';
					newEntry.d.max.d = '';
				} else {
					newEntry.d.max.y = newEntry.d.max.y.toString();
					if (typeof(newEntry.d.max.m) == 'undefined')
						newEntry.d.max.m = '';
					else
						newEntry.d.max.m = newEntry.d.max.m.toString();
					if (typeof(newEntry.d.max.d) == 'undefined')
						newEntry.d.max.d = '';
					else
						newEntry.d.max.d = newEntry.d.max.d.toString();
				}
				var val;
				val = newEntry.d.min.y;
				if (newEntry.d.min.m.length > 0) {
					val += '-'+ newEntry.d.min.m;
					if (newEntry.d.min.d.length > 0) {
						val += '-'+ newEntry.d.min.d;
					}
				}
				val += ' / ';
				if (newEntry.d.max.y.length > 0) {
					val += newEntry.d.max.y;
					if (newEntry.d.max.m.length > 0) {
						val += '-'+ newEntry.d.max.m;
						if (newEntry.d.max.d.length > 0) {
							val += '-'+ newEntry.d.max.d;
						}
					}
				} else
					val += ' (now)';
				newEntry.val = val;
				break;
			} // switch
			newLegend.push(newEntry);
		}); // forEach
			// Now that new version of Legend is built, save in appropriate variables
		switch (thisType) {
		case 'V':
			vLegend = newLegend;
			break;
		case 'T':
			tLegend = newLegend;
			break;
		case 'N':
			nLegend = newLegend;
			break;
		case 'D':
			dLegend = newLegend;
			break;
		} // switch
		return newLegend;
	} // unpackLegend()

		// Unpack Legend data
	embedData = jQuery('textarea[name="prsp_att_lgnd"]').val();
	if (embedData && embedData.length > 2) {
		embedData = JSON.parse(embedData);
		unpackLegend(embedData);
	} // if legend


		// PURPOSE: Retrieve language-dependent text embedded in script
	function getText(scriptName)
	{
		return jQuery(scriptName).html().trim();
	}

		// PURPOSE: Extract settings from modalParams and create new Legend entry based on current data type
		// NOTES:	Only for Text, Number and Dates types!
		// TO DO: 	Error checking
	function createLegendEntry(label, color, pattern, min, max) {
		var newEntry = { l: label.replace(/"/g, '').trim(), v: color };

		switch (vApp.thisType) {
		case 'T':
			newEntry.d = pattern;
			newEntry.val = pattern;
			break;
		case 'N':
			newEntry.d = { min: min.trim(), max: max.trim() };
			newEntry.val = (min.length == 0) ? '(none)' : newEntry.d.min;
			newEntry.val += ' to ';
			newEntry.val += (max.length == 0) ? '(none)' : newEntry.d.max;
			break;
		case 'D':
			newEntry.d = { };
			newEntry.d.min = { y: min.y, m: min.m, d: min.d };
			newEntry.d.max = { y: max.y, m: max.m, d: max.d };
			var val;
			val = newEntry.d.min.y;
			if (newEntry.d.min.m.length > 0) {
				val += '-'+ newEntry.d.min.m;
				if (newEntry.d.min.d.length > 0) {
					val += '-'+ newEntry.d.min.d;
				}
			}
			val += ' / ';
			if (newEntry.d.max.y.length > 0) {
				val += newEntry.d.max.y;
				if (newEntry.d.max.m.length > 0) {
					val += '-'+ newEntry.d.max.m;
					if (newEntry.d.max.d.length > 0) {
						val += '-'+ newEntry.d.max.d;
					}
				}
			} else
				val += ' (now)';
			newEntry.val = val;
			break;
		} // switch
		return newEntry;
	} // extractLegendEntry()


		// PURPOSE: Show message for 5 seconds
	function displayError(errID, ok)
	{
			// If a clear-error timer is set, cancel it
		if (errTimer) {
			clearTimeout(errTimer);
		}
		var newError = getText(errID);
		vApp.errorOK = ok === true;
		vApp.errorMsg = newError;
		errTimer = setTimeout(function() {
			vApp.errorMsg = '';
		}, 5000);
	} // displayError()


		// PURPOSE: Check basic data provided by the user for Attribute definition
		// RETURNS: false if basic errors, else Attribute object with ID, Label, cf, delim
		// SIDE-FX: sets errorMsg to explanation of error
	function doErrorCheck()
	{
		var theID = vApp.attID.trim();
		if (theID.length == 0) {
			displayError('#errmsg-no-id');
			return false;
		}
		if (theID.length > 24) {
			displayError('#errmsg-id-too-long');
			return false;
		}
		if (allAttributeIDs.findIndex(function(existingID) { return existingID === theID; }) != -1) {
			displayError('#errmsg-id-taken');
			return false;
		}
			// Ensure ID only consists of alphanumeric, underscore or hyphen
		if (!/^[\w\-]+$/.test(theID)) {
			displayError('#errmsg-id-bad-chars');
			return false;
		}

		var theLabel = vApp.label.trim().replace(/"/g, '');
		if (theLabel.length == 0) {
			displayError('#errmsg-no-label');
			return false;
		}
		if (theLabel.length > 32) {
			displayError('#errmsg-label-too-long');
			return false;
		}

		var attType = vApp.thisType;
		var canFilter = vApp.fAvail;

		var theDelim = vApp.delim;
		if (theDelim.length > 1) {
			displayError('#errmsg-delim-too-long');
			return false;
		} else if (theDelim.length == 1) {
			if (theDelim === ' ') {
				displayError('#errmsg-delim-no-sp');
				return false;
			}

			switch (attType) {
			case 'V':
			case 'g':
			case 'P':
				break;
			case 'L':
				if (theDelim === ',') {
					displayError('#errmsg-delim-comma-ll');
					return false;
				}
				break;
			default:
				displayError('#errmsg-delim-bad-type');
				return false;
			}
		}
		var theHint = vApp.hint;
		theHint = theHint.replace(/"/g, '');

		return { l: theLabel, t: attType,
				 d: theDelim, h: theHint, f: canFilter };
	} // doErrorCheck()

		// PURPOSE: Find pre-defined Attributes of this type that have Legends
		// RETURN: 	Array of { Attribute id, l[abel] }
	function attMatch(type, notID)
	{
		var atts=[];

		if (prspdata.att_data.length === 0)
			return [];
		prspdata.att_data.forEach(function(theAtt) {
			if (theAtt.def.t === type && theAtt.id !== notID && theAtt.l.length > 0)
				atts.push({ id: theAtt.id, l: theAtt.def.l })
		});
		return atts;
	} // attMatch()

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
		var mText = getText(msgID) + addText;
		vApp.modalParams.msg = mText;
		vApp.modalParams.callback = callback;
		vApp.modalShowing = 'dlgConfirm';
	} // confirmModal()

		// Create our main App instance
	vApp = new Vue({
		el: '#vue-outer',
		data: {
				// Configuration settings for all Attributes
			label: label,
			attID: attID,
			privacy: privacy,
			thisType: thisType,					// the data type chosen for the Attribute
			delim: delim,						// delimiter character
			fAvail: fAvail,						// available as Filter?
			hint: hint,
				// Datatype-specific configuration settings
			vLegend: vLegend,					// legend definition (array) for Vocabulary
			tLegend: tLegend,					// legend definition (array) for Text
			nRange: nRange,						// Range info for Number Attribute
			nLegend: nLegend,					// legend definition (array) for Number
			dRange: dRange,						// Range info for Dates Attribute
			dLegend: dLegend,					// legend definition (array) for Dates
				// GUI state & options
			errorMsg: '',						// current error string (if any)
			errorOK: false,						// Is message actually not an error?
			dataTypes: dataTypes,				// Array of dataTypes
			newVocab: '',
			cfs: customFields,					// Array of all custom field names
			chosenCF: customFields[0] || '',	// custom field currently chosen on selection
			modalParams: {						// parameters passed to modal dialogs
				msg: '',
				label: '',
				pattern: '',
				theColor: '',
				min: 0,
				max: 100,
				attList: [],					// Attribute data: { l, id }
				parents: [],					// array of strings
				callback: null
			},
			modalShowing: 'nullcomponent'		// modal currently showing (initially nothing)
		},
		methods: {
			getLegend: function() {		// Utility for getting active legend
				switch (this.thisType) {
				case 'V':	return this.vLegend;
				case 'T':	return this.tLegend;
				case 'N':	return this.nLegend;
				case 'D':	return this.dLegend;
				}
			},
			saveAttribute: function(event) {
				console.log("Click: saveAttribute");
				if (event) { event.preventDefault(); }
				var attDef = doErrorCheck();
				if (attDef) {
					var error;
					var attR = { };
					var attL = [ ];

					switch(attDef.t) {
					case 'V':
						this.vLegend.forEach(function(parent) {
							var newParent = { };
							newParent.l = parent.l;
							newParent.v = parent.v;
							newParent.z = [];
							if (parent.z.length) {
								parent.z.forEach(function(child) {
									var newChild = { };
									newChild.l = child.l;
									newChild.v = child.v.length ? child.v : null;
									newParent.z.push(newChild);
								})
							}
							attL.push(newParent);
						});
						break;
					case 'T':
						this.tLegend.forEach(function(entry) {
							var newEntry = { };
							newEntry.l = entry.l;
							newEntry.d = entry.d;
							newEntry.v = entry.v;
							attL.push(newEntry);
						});
						break;

					case 'N':
						var minN = this.nRange.min;
						var maxN = this.nRange.max;
							// Allow one but not both to be empty
						if (minN.length == 0 && maxN.length == 0) {
							displayError('#errmsg-num-need-bound');
							return;
						}
							// Convert range to Numbers
						if (minN.length) {
							attR.min = parseInt(minN, 10);
							if (!_.isFinite(attR.min)) {
								displayError('#errmsg-range-not-valid');
								return;
							}
						}
						if (maxN.length) {
							attR.max = parseInt(maxN, 10);
							if (!_.isFinite(attR.max)) {
								displayError('#errmsg-range-not-valid');
								return;
							}
						}
						attR.g = this.nRange.g;
						if (this.nRange.useU == true) {
							attR.u = this.nRange.u;
						}

						this.nLegend.forEach(function(entry) {
							var newEntry = { };
							newEntry.l = entry.l;
							newEntry.v = entry.v;
							newEntry.d = { };
							if (entry.d.min.length) newEntry.d.min = parseInt(entry.d.min, 10);
							if (entry.d.max.length) newEntry.d.max = parseInt(entry.d.max, 10);
							if (entry.d.min > entry.d.max) {
								error = '#errmsg-num-range-inverted';
							}
							attL.push(newEntry);
						});
						break;

					case 'D':
						attR.min = { }; attR.max = { };
						attR.g = this.dRange.g;
							// minimum Date
						var y = this.dRange.min.y;
						if (y.length == 0) {
							displayError('#errmsg-no-min-date');
							return;
						}
						attR.min.y = parseInt(y, 10);
						if (!_.isFinite(attR.min.y)) {
							displayError('#errmsg-no-min-date');
							return;
						}
						var m = this.dRange.min.m;
						var d;
						if (m.length) {
							attR.min.m = parseInt(m, 10);
							if (!_.isFinite(attR.min.m) || (attR.min.m < 1) || (attR.min.m > 12)) {
								displayError('#errmsg-bad-month');
								return;
							}
							d = this.dRange.min.d;
							if (d.length) {
								attR.min.d = parseInt(d, 10);
								if (!_.isFinite(attR.min.d) || (attR.min.d < 1) || (attR.min.m > 31)) {
									displayError('#errmsg-bad-day');
									return;
								}
							}
						}
							// maximum Date
						y = this.dRange.max.y;
						if (y.length) {
							attR.max.y = parseInt(y, 10);
							if (!_.isFinite(attR.min.y)) {
								displayError('#errmsg-no-min-date');
								return;
							}
							m = this.dRange.max.m;
							if (m.length) {
								attR.max.m = parseInt(m, 10);
								if (!_.isFinite(attR.max.m) || (attR.max.m < 1) || (attR.max.m > 12)) {
									displayError('#errmsg-bad-month');
									return;
								}
								d = this.dRange.max.d;
								if (d.length) {
									attR.max.d = parseInt(d, 10);
									if (!_.isFinite(attR.max.d) || (attR.max.d < 1) || (attR.max.d > 31)) {
										displayError('#errmsg-bad-day');
										return;
									}
								}
							}
						}

						if (this.dRange.useU == true) {
							attR.u = this.dRange.u;
						}

							// Compile Date Legend
						this.dLegend.forEach(function(entry) {
							var newEntry = { };
							newEntry.l = entry.l;
							newEntry.v = entry.v;
							newEntry.d = { min: {}, max: {} };
							if (entry.d.min.y.length) {
								newEntry.d.min.y = parseInt(entry.d.min.y, 10);
								if (!_.isFinite(newEntry.d.min.y)) {
									error = '#errmsg-bad-year';
								}
								if (entry.d.min.m.length) {
									newEntry.d.min.m = parseInt(entry.d.min.m, 10);
									if (!_.isFinite(newEntry.d.min.m) || (entry.d.min.m < 1) || (entry.d.min.m > 12)) {
										error = '#errmsg-bad-month';
									}
									if (entry.d.min.d.length) {
										newEntry.d.min.d = parseInt(entry.d.min.d, 10);
										if (!_.isFinite(newEntry.d.min.d) || (entry.d.min.d < 1) || (entry.d.min.d > 31)) {
											error = '#errmsg-bad-day';
										}
									}
								}
							}
							if (entry.d.max.y.length) {
								newEntry.d.max.y = parseInt(entry.d.max.y, 10);
								if (!_.isFinite(newEntry.d.max.y)) {
									error = '#errmsg-bad-year';
								}
								if (entry.d.max.m.length) {
									newEntry.d.max.m = parseInt(entry.d.max.m, 10);
									if (!_.isFinite(newEntry.d.max.m) || (entry.d.max.m < 1) || (entry.d.max.m > 12)) {
										error = '#errmsg-bad-month';
									}
									if (entry.d.max.d.length) {
										newEntry.d.max.d = parseInt(entry.d.max.d, 10);
										if (!_.isFinite(newEntry.d.max.d) || (entry.d.max.d < 1) || (entry.d.max.d > 31)) {
											error = '#errmsg-bad-day';
										}
									}
								}
							}
							if (typeof(newEntry.d.min.y) == "undefined" && typeof(newEntry.d.max.y) == "undefined")
							{
								error = "#errmsg-date-no-bound";
							}
							if (newEntry.d.min.y > newEntry.d.max.y)
							{
								error = "#errmsg-date-range-inverted";
							}
							attL.push(newEntry);
						}); // forEach
							// Abort here if any errors signalled
						if (error) {
							displayError(error);
							return false;
						}
						break;
					} // switch
						// Stuff in hidden fields
					var theID = this.attID.trim();
					jQuery('input[name="prsp_att_id"]').val(theID);
					var pSetting = this.privacy;
					jQuery('textarea[name="prsp_att_privacy"]').val(pSetting);
					jQuery('textarea[name="prsp_att_def"]').val(JSON.stringify(attDef));
					jQuery('textarea[name="prsp_att_r"]').val(JSON.stringify(attR));
					jQuery('textarea[name="prsp_att_lgnd"]').val(JSON.stringify(attL));
					console.log("Def: "+JSON.stringify(attDef));
					console.log("Range: "+JSON.stringify(attR));
					console.log("Legend: "+JSON.stringify(attL));
						// Confirm Attribute data saved to user
					displayError('#msg-saved', true);
				} // if no error
			},
				// Show hint info about IDs in a modal dialog
			idHint: function(event) {
				if (event) { event.preventDefault(); }
				messageModal('#errmsg-id-bad-chars');
			},
				// Use current choice of custom field as ID
			copyCF: function(event) {
				if (event) { event.preventDefault(); }
				this.attID = this.chosenCF;
			},
			collectTerms: function(event) {
				if (event) { event.preventDefault(); }
				console.log("Click: collectTerms");
				if (this.attID.length == 0) {
					displayError('#errmsg-no-custom-field');
					return;
				}
				var self=this;
				confirmModal('#msg-confirm-add-vocab', '', function() {
					jQuery.ajax({
						type: 'POST',
						url: prspdata.ajax_url,
						data: {
							action: 'prsp_get_cf_vals',
							att_id: self.attID,
							delim: self.delim
						},
						success: function(data, textStatus, XMLHttpRequest)
						{
							var cfTerms = JSON.parse(data);

							cfTerms.forEach(function(name) {
								var found=false;
								for (var i=0; i<self.vLegend.length; i++) {
									var lItem = self.vLegend[i];
									if (lItem.l == name) {
										found=true;
									} else {
										for (var j=0; j<lItem.z.length; j++)
											if (lItem.z[j].l == name) {
												found=true;
												break;
											}
									}
									if (found)
										break;
								}
								if (!found) {
									self.vLegend.push({ l: name, v: '#888888', z: [] });
								}
							});
						},
						error: function(XMLHttpRequest, textStatus, errorThrown)
						{
						   alert(errorThrown);
						}
					}); // jQuery.ajax
				}); // confirm
			}, // collectTerms()
			resetLegend: function(event) {
				console.log("Click: resetLegend");
				if (event) { event.preventDefault(); }
				var self=this, lgnd=this.getLegend();
				function colorize(gradient, c0, c1) {
					if (gradient) {
						var rainbow = new Rainbow();
						rainbow.setSpectrum(c0, c1);
						rainbow.setNumberRange(0, lgnd.length-1);

						for (var i=0; i<lgnd.length; i++) {
							var grad = '#'+rainbow.colourAt(i);
							lgnd[i].v = grad;
								// If Vocab, all children inherit parent color by default
							if (self.thisType === 'V') {
								var children = lgnd[i].z;
								for (var j=0; j<children.length; j++) {
									children[j].v = '';
								}
							}
						}
					} else {	// Random colors
						for (var i=0; i<lgnd.length; i++) {
							lgnd[i].v = randomColor();
							if (self.thisType === 'V') {
								var children = lgnd[i].z;
								for (var j=0; j<children.length; j++) {
									children[j].v = randomColor();
								}
							}
						}
					}
				} // colorize()
				this.modalParams.callback = colorize;
				this.modalShowing = 'dlgResetColors';
			}, // resetLegend()
			copyLegend: function(event) {
				console.log("Click: copyLegend");
				if (event) { event.preventDefault(); }
				var self=this;
				function doCopy(choiceID) {
					for (var i=0; i<prspdata.att_data.length; i++) {
						var theAtt = prspdata.att_data[i];
						if (theAtt.id == choiceID) {
							var newLgnd = unpackLegend(theAtt.l);
							switch(self.thisType) {
							case 'V': self.vLegend=newLgnd;	break;
							case 'T': self.tLegend=newLgnd;	break;
							case 'N': self.nLegend=newLgnd;	break;
							case 'D': self.dLegend=newLgnd;	break;
							}
							break;
						}
					}
				} // doCopy()
				this.modalParams.attList = this.others;
				this.modalParams.callback = doCopy;
				this.modalShowing = 'dlgCopyLegend';
			}, // copyLegend()
			addLegend: function(event) {
				console.log("Click: addLegend");
				if (event) { event.preventDefault(); }
				var self=this;
				switch (this.thisType) {
				case 'V':
					var newTerm = this.newVocab.replace(/"/g, '').trim();
					if (newTerm.length > 0) {
							// Ensure term doesn't already exist!
						if (this.vLegend.findIndex(function(item) { return item.l == newTerm; }) != -1) {
							displayError('#errmsg-term-name-taken');
							break;
						}
						this.vLegend.push({ l: newTerm, v: '#777777', z: [] });
					}
					break;
				case 'T':
					function saveTEntry(label, pattern, color) {
						console.log("Reached saveTEntry");
						self.tLegend.push(createLegendEntry(label, color, pattern));
					}
					this.modalParams.label = '';
					this.modalParams.pattern = '';
					this.modalParams.theColor = '#777777';
					this.modalParams.callback = saveTEntry;
					this.modalShowing = 'dlgEditLgndText';
					break;
				case 'N':
					function saveNEntry(label, min, max, color) {
						self.nLegend.push(createLegendEntry(label, color, null, min, max));
					}
					this.modalParams.label = '';
					this.modalParams.min = '';
					this.modalParams.max = '';
					this.modalParams.theColor = '#777777';
					this.modalParams.callback = saveNEntry;
					this.modalShowing = 'dlgEditLgndNumber';
					break;
				case 'D':
					function saveDEntry(label, min, max, color) {
						self.dLegend.push(createLegendEntry(label, color, null, min, max));
					}
					this.modalParams.label = '';
					this.modalParams.min = { y: '', m: '', d: '' };
					this.modalParams.max = { y: '', m: '', d: '' };
					this.modalParams.theColor = '#777777';
					this.modalParams.callback = saveDEntry;
					this.modalShowing = 'dlgEditLgndDates';
					break;
				} // switch by data type
			}, // addLegend()
			doVocabMove: function(i1, i2, event) {	// Move a Vocab Term up or down the hierarchy
				console.log("Click: doVocabMove: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				if (this.vLegend.length < 2) {
					displayError('#errmsg-too-few-vocab');
					return;
				}
				var self=this;
					// Get array of names of all top-level Vocabulary items (except this parent)
				var parentNames = [];
				for (var i=0; i<this.vLegend.length; i++) {
					if (i != i1) {
						parentNames.push(this.vLegend[i].l);
					}
				}
				this.modalParams.parents = parentNames;
					// Is it a child node?
				if (i2 != -1) {
						// Either move child to top or to another parent
					function moveChild(toTop, newParentTerm) {
						var popped=self.vLegend[i1].z.splice(i2, 1)[0];
							// Move it to top level?
						if (toTop) {
								// do we need to give new default visual config?
							if (popped.v === '') {
								popped.v = '#888888';
							}
								// We need to add empty children array to it!
							popped.z = [];
							self.vLegend.push(popped);
						} else {
							var newParentIndex = self.vLegend.findIndex(function(item) { return item.l === newParentTerm; });
								// Insert into new parent's array
							self.vLegend[newParentIndex].z.push(popped);
						}
					} // moveChild()
					this.modalParams.callback = moveChild;
					this.modalShowing = 'dlgMoveLgndChild';
				} else {	// A top-level Term
					var item=this.vLegend[i1];
						// Does it have any children?
					if (item.z.length > 0) {
							// Remove all children from parent, and either move to top or other parent
						function moveTopLevelParent(freeChildren, newParentTerm)
						{
							var newParentIndex;
							function popNextChild()
							{
									// Can we end recursion?
								if (item.z.length === 0)
									return;
									// First extract it
								var popped = item.z.splice(0, 1)[0];
									// Add to top?
								if (freeChildren) {
										// Add empty children array
									popped.z = [];
									if (popped.v === '') {
										popped.v = '#777777';
									}
									self.vLegend.push(popped);
								} else {
									self.vLegend[newParentIndex].z.push(popped);
								}
								popNextChild();
							} // doNextChild
							if (!freeChildren) {
								newParentIndex = self.vLegend.findIndex(function(item) { return item.l === newParentTerm; });
							}
								// Begin recursion
							popNextChild();
						} // moveTopLevelParent()
						this.modalParams.callback = moveTopLevelParent;
						this.modalShowing = 'dlgMoveLgndParent';
					} else { // no children
						function moveTopLevelTerm(newParentTerm, keepVisual)
						{
							var popped = self.vLegend.splice(i1, 1)[0];
								// Remove its children array
							delete popped.z;
								// Clear visual data?
							if (!keepVisual) {
								popped.v = '';
							}
								// Get index of new parent
							var newIndex = self.vLegend.findIndex(function(item) { return item.l === newParentTerm; });
								// Insert into new parent's array
							self.vLegend[newIndex].z.push(popped);
						} // moveTopLevelTerm()
						this.modalParams.callback = moveTopLevelTerm;
						this.modalShowing = 'dlgMoveLgndTop';
					}
				} // top-level node
			}, // doVocabMove()
			doLegendUp: function(i1, i2, event) {
				console.log("Click: doLegendUp: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var removed, lgnd;
				switch (this.thisType) {
				case 'V':
					if (i2 === -1) {
						if (i1) {	// Ignore if already at top
							removed = this.vLegend.splice(i1, 1);
							this.vLegend.splice(i1-1, 0, removed[0]);
						}
					} else {
						if (i2) {	// Ignore if already at top of children
							removed = this.vLegend[i1].z.splice(i2, 1);
							this.vLegend[i1].z.splice(i2-1, 0, removed[0]);
						}
					}
					break;
				case 'T':
				case 'N':
				case 'D':
					lgnd = this.getLegend();
					if (i1) {	// Ignore if already at top
						removed = lgnd.splice(i1, 1);
						lgnd.splice(i1-1, 0, removed[0]);
					}
					break;
				} // switch by data type
			}, // doLegendUp()
			doLegendTop: function(i1, i2, event) {
				console.log("Click: doLegendTop: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var removed, lgnd;
				switch (this.thisType) {
				case 'V':
					if (i2 === -1) {
						if (i1) {	// Ignore if already at top
							removed = this.vLegend.splice(i1, 1);
							this.vLegend.splice(0, 0, removed[0]);
						}
					} else {
						if (i2) {	// Ignore if already at top of children
							removed = this.vLegend[i1].z.splice(i2, 1);
							this.vLegend[i1].z.splice(0, 0, removed[0]);
						}
					}
					break;
				case 'T':
				case 'N':
				case 'D':
					lgnd = this.getLegend();
					if (i1) {	// Ignore if already at top
						removed = lgnd.splice(i1, 1);
						lgnd.splice(0, 0, removed[0]);
					}
					break;
				} // switch by data type
			}, // doLegendTop()
			doLegendDown: function(i1, i2, event) {
				console.log("Click: doLegendDown: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var removed, lgnd;
				switch (this.thisType) {
				case 'V':
					if (i2 === -1) {
						if (i1 < (this.vLegend.length-1)) {	// Ignore if already at bottom
							removed = this.vLegend.splice(i1, 1);
							this.vLegend.splice(i1+1, 0, removed[0]);
						}
					} else {
						if (i2 < (this.vLegend[i1].z.length-1)) {	// Ignore if already at bottom of children
							removed = this.vLegend[i1].z.splice(i2, 1);
							this.vLegend[i1].z.splice(i2+1, 0, removed[0]);
						}
					}
					break;
				case 'T':
				case 'N':
				case 'D':
					lgnd = this.getLegend();
					if (i1 < (lgnd.length-1)) {	// Ignore if already at bottom
						removed = lgnd.splice(i1, 1);
						lgnd.splice(i1+1, 0, removed[0]);
					}
					break;
				} // switch by data type
			},
			doLegendBottom: function(i1, i2, event) {
				console.log("Click: doLegendBottom: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var removed, lgnd;
				switch (this.thisType) {
				case 'V':
					if (i2 === -1) {
						if (i1 < (this.vLegend.length-1)) {	// Ignore if already at bottom
							removed = this.vLegend.splice(i1, 1);
							this.vLegend.push(removed[0]);
						}
					} else {
						if (i2 < (this.vLegend[i1].z.length-1)) {	// Ignore if already at bottom of children
							removed = this.vLegend[i1].z.splice(i2, 1);
							this.vLegend[i1].z.push(removed[0]);
						}
					}
					break;
				case 'T':
				case 'N':
				case 'D':
					lgnd = this.getLegend();
					if (i1 < (lgnd.length-1)) {	// Ignore if already at bottom
						removed = lgnd.splice(i1, 1);
						lgnd.push(removed[0]);
					}
					break;
				} // switch by data type
			}, // doLegendBottom()
			doLegendDel: function(i1, i2, event) {
				console.log("Click: doLegendDel: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var self=this, lgnd;
				confirmModal('#msg-confirm-del-vocab', '', function() {
					switch (self.thisType) {
					case 'V':
						if (i2 == -1) {
							self.vLegend.splice(i1, 1);
						} else {
							self.vLegend[i1].z.splice(i2, 1);
						}
						break;
					case 'T':
					case 'N':
					case 'D':
						lgnd=self.getLegend();
						lgnd.splice(i1, 1);
						break;
					} // switch by data type
				});
			}, // doLegendDel()
			doLegendEdit: function(i1, event) {		// Only called for Text, Number and Dates types
				console.log("Click: doLegendEdit: "+i1);
				if (event) { event.preventDefault(); }
					// Extract current values, edit, and save in callback
				var self=this, entry;
				switch (this.thisType) {
				case 'T':
					entry = this.tLegend[i1];
					function saveTEntry(label, pattern, color) {
						console.log("Reached saveTEntry");
						self.tLegend[i1] = createLegendEntry(label, color, pattern);
					}
					this.modalParams.label = entry.l;
					this.modalParams.pattern = entry.d;
					this.modalParams.theColor = entry.v;
					this.modalParams.callback = saveTEntry;
					this.modalShowing = 'dlgEditLgndText';
					break;
				case 'N':
					entry = this.nLegend[i1];
					function saveNEntry(label, min, max, color) {
						console.log("Reached saveNEntry");
						self.nLegend[i1] = createLegendEntry(label, color, null, min, max);
					}
					this.modalParams.label = entry.l;
					this.modalParams.min = entry.d.min;
					this.modalParams.max = entry.d.max;
					this.modalParams.theColor = entry.v;
					this.modalParams.callback = saveNEntry;
					this.modalShowing = 'dlgEditLgndNumber';
					break;
				case 'D':
					entry = this.dLegend[i1];
					function saveNEntry(label, min, max, color) {
						console.log("Reached saveNEntry");
						self.nLegend[i1] = createLegendEntry(label, color, null, min, max);
					}
					this.modalParams.label = entry.l;
					this.modalParams.min = entry.d.min;
					this.modalParams.max = entry.d.max;
					this.modalParams.theColor = entry.v;
					this.modalParams.callback = saveNEntry;
					this.modalShowing = 'dlgEditLgndNumber';
					break;
				} // switch by data type
			}, // doLegendEdit()
				// Set or clear the color of a child Vocab Term
			doLegendViz: function(i1, i2, event) {
				console.log("Click: doLegendViz: "+i1+","+i2);
				if (event) { event.preventDefault(); }
				var term = this.vLegend[i1].z[i2];
				function setChildColor(clear,newColor) {
					if (clear) {
						term.v = '';
					} else {
						term.v = newColor;
					}
				} // setChildColor()
				this.modalParams.theColor = term.v;
				this.modalParams.callback = setChildColor;
				this.modalShowing = 'dlgChooseColor';
			} // doLegendViz()
		}, // methods
		computed: {
				// Other Vocabulary Attributes with Legends
			others: function() {
				return attMatch(this.thisType, this.attID);
			}
		}
	});
	vApp.$on('dialogclose', function () {
		console.log("dialogclose");
		this.modalShowing = 'nullcomponent';
	});
}); // ready
