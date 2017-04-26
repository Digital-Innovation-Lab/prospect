// Record Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   Data about this Record passed in hidden fields
//			In case of newly created Record, prsp_rec_id and prsp_tmplt_id will be empty, and prsp_rec_atts will be "null"
//			prspdata will pass definitions of Templates and Attributes
// USES:    jQuery, Underscore, jQueryUI, and VueJS

// TO DO:	Enable loading items to Media Library


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
				if (event) { event.preventDefault(); }
				console.log("vuemodal > close");
				this.$el.className = 'dialog-wrap open';
				setTimeout(function() {
					vApp.$emit('dialogclose');
				}.bind(this), 300);
			},
			clickok: function(event) {
				if (event) { event.preventDefault(); }
				console.log("vuemodal > clickok1");
				this.$emit('save');
				console.log("vuemodal > clickok2");
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

		// INPUT:	params.msg = Message to display
		//			params.callback = Callback function
	Vue.component('dlgGeoNames', {
		props: {
			params: Object
		},
		template: '#dialog-geonames',
		data: function () {		// Local copies of data that user can edit
			return {
				query: '',
				errorMsg: '',
				results: [],
				selected: -1	// index of current selection
			}
		},
		methods: {
			ok: function(event) {
				if (event) { event.preventDefault(); }
				console.log("Clicked OK");
				if (this.params.callback != null && this.selected != -1) {
					var item = this.results[this.selected];
					this.params.callback(item.latlon);
				}
			},
			select: function(index) {
				console.log("Clicked select");
				if (this.selected != index) {
					this.selected = index;
				}
			},
			fetchGeoData: function() {
				console.log("Clicked fetchGeoData");
					// Reset selected index (list size may differ)
				this.selected = -1;
				var self=this;
				jQuery.ajax({
					type: 'POST',
					url: prspdata.ajax_url,
					data: {
						action: 'prsp_get_geonames',
						query: this.query
					},
					success: function(val) {
						console.log("Success: "+JSON.stringify(val));
						self.errorMsg = '';
						self.results = val;
					},
					error: function(e) {
						console.log(e);
						self.errorMsg = e;
						self.results = [];
					}
				});
			} // fetchGeoData()
		}
	});

		// PURPOSE:	Choose a Record ID belonging to a particular Template
		// INPUT:	params.callback = Callback function
		//			params.tID = ID of Template to which Records must belong
	Vue.component('dlgChooseRecord', {
		props: {
			params: Object
		},
		template: '#dialog-choose-list',
		data: function () {		// Local copies of data that user can edit
			return {
				message: getText('#msg-rem-data-loading'),
				error: false,
				list: [],
				selIndex: -1	// index of current selection
			}
		},
		created: function() {
			var self=this;
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_get_rec_creds',
					tmplt_id: self.params.tID
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					var list = JSON.parse(data);
					self.list = list;
					if (list.length == 0) {
						self.message = getText('#errmsg-no-data-available');
						self.error = true;
					} else {
						self.message = getText('#msg-choose-record');
						self.error = false;
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			}); // ajax
		},
		methods: {
			save: function(event) {
				if (event) { event.preventDefault(); }
				console.log("Clicked save");
				if (this.params.callback != null && this.selIndex != -1) {
					var item = this.list[this.selIndex];
					this.params.callback(item.id);
				}
			},
			doSelect: function(index) {
				console.log("Clicked select "+index);
				this.selIndex = index;
			}
		}
	}); // dlgChooseRecord

		// PURPOSE:	Choose a Template
		// INPUT:	params.callback = Callback function
	Vue.component('dlgChooseTemplate', {
		props: {
			params: Object
		},
		template: '#dialog-choose-list',
		data: function () {		// Local copies of data that user can edit
			return {
				message: '',
				error: false,
				list: [],
				selIndex: -1	// index of current selection
			}
		},
			// Compile list of independent Template IDs and labels
		created: function() {
			var tmpltList=[];
				// Only Independent Templates!
			defTemplates.forEach(function(theTemplate) {
				if (!theTemplate.def.d) {
					tmpltList.push({id: theTemplate.id, l: theTemplate.def.l });
				}
			});
			this.list=tmpltList;
		},
		methods: {
			save: function(event) {
				if (event) { event.preventDefault(); }
				console.log("Clicked save");
				if (this.params.callback != null && this.selIndex != -1) {
					var item = this.list[this.selIndex];
					this.params.callback(item.id);
				}
			},
			doSelect: function(index) {
				this.selIndex = index;
			}
		}
	}); // dlgChooseTemplate


		// DATA LOADED FROM SERVER
		// =======================

		// Definitions of Attributes
	var defAtts = prspdata.attDefs;
	for (i=0; i<defAtts.length; i++) {
		if (defAtts[i].lgnd == null) {
			defAtts[i].lgnd = [];
		}
	}

		// List of currently defined Templates; joins Object is added to it
	var defTemplates = prspdata.templates;		// [ { id, def, j } ]

		// Need to abort with Error message if no Templates defined
	if (defTemplates.length == 0) {
		jQuery('#vue-outer').append(jQuery('#errmsg-no-templates').html().trim());
	}

		// LIVE DATA ABOUT THIS RECORD
		// ==============================
	var recID = jQuery('input[name="prsp_rec_id"]').val();

	var recType = jQuery('input[name="prsp_tmplt_id"]').val();
	if (recType == null || recType == '') {
		recType = defTemplates[0].id || '';
	}

		// Attribute ID/Value pairs, passed from/to server
	var attData = { };
	var embedData = jQuery('textarea[name="prsp_rec_atts"]').val();
	if (embedData && embedData != 'null' && embedData.length > 4) {
		attData = JSON.parse(embedData);
	}

		// Expanded Attribute values for Record
		// Consists of { id: Attribute ID, def: Attribute definition, value: Value }
	var defRecord = [ ];

		// OTHER VARS
		// ==========
	var vApp;							// the main Ractive application
	var errTimer;
	var canGeoLoc = false;				// true if geolocation possible


		// CODE
		// ====

		// Can we get current geolocation from user?
	function enableGeoLoc()
	{
		if (vApp)	vApp.canGeoLoc = true;
		else		canGeoLoc = true;
	}

	function disableGeoLoc()
	{
		if (vApp)	vApp.canGeoLoc = false;
		else		canGeoLoc = false;
	}
	navigator.geolocation.getCurrentPosition(enableGeoLoc, disableGeoLoc);


		// PURPOSE: Retrieve language-dependent text embedded in script
	function getText(scriptName)
	{
		return jQuery(scriptName).html().trim();
	}

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
	function getAttribute(attID)
	{
		return defAtts.find(function(theAtt) { return theAtt.id === attID; });
	} // getAttribute()

		// RETURNS: Dependent Template definition for templateID
	function getTemplate(templateID)
	{
		var t = defTemplates.find(function(theTemplate) { return theTemplate.id === templateID; });
		return t;
	} // getTemplate

		// PURPOSE: Present user message in modal dialog box
	function messageModal(msgID)
	{
		var mText = getText(msgID);
		vApp.modalParams.msg = mText;
		vApp.modalShowing = 'dlgMessage';
	} // messageModal()

		// PURPOSE: Present user message in modal dialog box
	function textModal(text)
	{
		vApp.modalParams.msg = text;
		vApp.modalShowing = 'dlgMessage';
	} // textModal()

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


		// PURPOSE: Fill defRecord with default values based on templateID
		// NOTES: 	All incoming values are strings; convert if necessary
	function fillRecordFromTemplate(templateID)
	{
		var newRecord=[];
		var theTemplate = getTemplate(templateID);

		theTemplate.def.a.forEach(function(attID) {
			var theAttribute = getAttribute(attID);
				// Ignore if Attribute not defined
			if (theAttribute) {
					// get default value from Attributes passed
				var defVal = attData[attID];
				if (typeof(defVal) === 'undefined')
					defVal = null;

					// Create expanded Attribute info
				var attObject = { };
				attObject.id   = attID;
				attObject.def  = theAttribute.def;
				attObject.def.r= theAttribute.r;
					// Create default values
				switch(theAttribute.def.t) {
				case 'V':
						// Create new arrays for selecting Legend values
					attObject.def.newLgnd = [];
					theAttribute.lgnd.forEach(function(theLegend) {
						var newItem = { newL: theLegend.l, newV: theLegend.l };
						attObject.def.newLgnd.push(newItem);
						if (theLegend.z.length)
							theLegend.z.forEach(function(child) {
								var newChild = { newL: '> '+child.l, newV: child.l };
								attObject.def.newLgnd.push(newChild);
							});
					});
					if (attObject.def.newLgnd.length)
						attObject.lgndSel = attObject.def.newLgnd[0].newV;
					else
						attObject.lgndSel = '';
					attObject.value = defVal || '';
					break;
				case 'T':
				case 'g':
					attObject.value = defVal || '';
					break;
				case 'N':
					if (defVal && defVal != '')
						attObject.value = defVal.toString();
					else if (theAttribute.r.min)
						attObject.value = theAttribute.r.min.toString();
					else
						attObject.value = 0;
					break;
				case 'D':
						// Is there some value given?
					if (defVal && defVal != '') {
						function parseDate(dateStr) {
							var date = { y: '' };
								// Special undefined character
							if (dateStr == '?') {
								date.y = "?";
								return date;
							}
							if (dateStr.charAt(0) == '~') {
								date.y = '~';
								dateStr = dateStr.substring(1);
							}
							if (dateStr.charAt(0) == '-') {
								date.y += '-';
								dateStr = dateStr.substring(1);
							}
							var yearSegs = dateStr.split('-');
							date.y += yearSegs[0];
							date.m = yearSegs[1] || '';
							date.d = yearSegs[2] || '';
							return date;
						} // parseDate()
						attObject.value = { min: { }, max: { y: '', m: '', d: '' } };
						var dateSegs = defVal.split('/');
						if (dateSegs.length == 2) {
							var parsedSegs = parseDate(dateSegs[0]);
							attObject.value.min.y = parsedSegs.y;
							attObject.value.min.m = parsedSegs.m;
							attObject.value.min.d = parsedSegs.d;
							parsedSegs = parseDate(dateSegs[1])
							attObject.value.max.y = parsedSegs.y;
							attObject.value.max.m = parsedSegs.m;
							attObject.value.max.d = parsedSegs.d;
						} else {
							var parsedSegs = parseDate(defVal);
							attObject.value.min.y = parsedSegs.y;
							attObject.value.min.m = parsedSegs.m;
							attObject.value.min.d = parsedSegs.d;
						}
						// Provide default of start date
					} else {
						attObject.value = { min: { }, max: { y: '', m: '', d: '' } };
						attObject.value.min.y = theAttribute.r.min.y + '';		// Convert to string
						attObject.value.min.m = theAttribute.r.min.m || '';
						attObject.value.min.d = theAttribute.r.min.d || '';
					}
					break;
				case 'L':
						// Use a single string in case of multiple pts
					attObject.value = defVal || '';
					break;
				case 'X':
						// Use a single string in case of multiple pts
					attObject.value = defVal || '';
					break;
				case 'I':
					attObject.value = defVal || '';
					break;
				case 'l': 	// Link To
					attObject.value = defVal || '';
					break;
				case 'S':
					attObject.value = defVal || '';
					break;
				case 'Y':
					attObject.value = defVal || '';
					break;
				case 'x': 	// Transcript
					attObject.value = defVal || '';
					break;
				case 't': 	// Timecode
					attObject.value = defVal || '';
					break;
				case 'P':
					attObject.value = defVal || '';
					break;
				case 'J':
					attObject.value = defVal || '';
					break;
				} // switch
				newRecord.push(attObject);
			} else {
				console.log("Attribute ID "+attID+" is not defined and will be ignored. You must, however, update your Template definition.");
			}
		});
		vApp.defRecord = newRecord;
	} // fillRecordFromTemplate()

		// Create our main App instance
	vApp = new Vue({
		el: '#vue-outer',
		data: {
			recID: recID,
			recType: recType,
			defAtts: defAtts,
			defRecord: defRecord,
			defTemplates: defTemplates,
			canGeoLoc: canGeoLoc,
				// GUI state & modal parameters
			errorMsg: '',						// current error string (if any)
			errorOK: false,						// Is message actually not an error?
			modalParams: {						// parameters passed to modal dialogs
				msg: '',
				tID: '',						// ID of Template
				callback: null,
				nextModal: ''					// Needed for chaining modals, due to timeout mechanism on close
			},
			modalShowing: 'nullcomponent'		// modal currently showing (initially nothing)
		}, // data
		methods: {
			saveRecord: function(event) {
				console.log("Click: saveRecord");
				if (event) { event.preventDefault(); }
				doSaveRecord();
			},
			idHint: function(event) {
				console.log("Click: idHint");
				if (event) { event.preventDefault(); }

				var templateID = vApp.recType;
				var theTemplate = getTemplate(templateID);
				if (typeof theTemplate.def.h == 'undefined')
					messageModal('#errmsg-id');
				else
					textModal(theTemplate.def.h);
			},
			clearVocab: function(index, event) {
				console.log("Click: clearVocab");
				if (event) { event.preventDefault(); }
				this.defRecord[index].value = '';
			},
				// Add a vocabulary term to a value list
			addVocab: function(index, event) {
				console.log("Click: addVocab "+index);
				if (event) { event.preventDefault(); }

				var newVal;
				var theElement = this.defRecord[index];
					// Only Add if pre-existing value and delimiter allows multiple values
				if (theElement.value.length > 0 && theElement.def.d.length > 0)
					newVal = theElement.value + theElement.def.d + theElement.lgndSel;
				else
					newVal = theElement.lgndSel;
				theElement.value = newVal;
			},
				// Pop up modal with all IDs of this Template type
			giveHint: function(index, event) {
				console.log("Click: giveHint");
				if (event) { event.preventDefault(); }
				textModal(this.defRecord[index].def.h);
			},
			setHere: function(index, event) {
				console.log("Click: setHere");
				if (event) { event.preventDefault(); }
				var self=this;
				navigator.geolocation.getCurrentPosition(function(pos) {
					var newVal = pos.coords.latitude.toString() + "," + pos.coords.longitude.toString();
					self.defRecord[index].value = newVal;
				});
			},
			geoNames: function(index, event) {
				console.log("Click: geoNames");
				if (event) { event.preventDefault(); }
				var self=this;
				function setGeoLL(ll) {
					self.defRecord[index].value = newVal;
				}
				this.modalParams.callback = setGeoLL;
				this.modalShowing = 'dlgGeoNames';
			},
			clearPtr: function(index, event) {
				console.log("Click: clearPtr");
				if (event) { event.preventDefault(); }
				this.defRecord[index].value = '';
			},
				// Create modal for selecting Record ID, after first selecting Template
			addPointerID: function(index, delim, event) {
				console.log("Click: addPointerID");
				if (event) { event.preventDefault(); }
				var self=this;
					// First choose Template, then Record
				function templateChosen(chosenTemplateID) {
					function savePtrID(recID) {
						var target = self.defRecord[index];
						if (delim.length == 0 || target.value.length == 0) {
							target.value = recID;
						} else {
							target.value += delim+recID;
						}
					}
					self.modalParams.tID = chosenTemplateID;
					self.modalParams.callback = savePtrID;
						// Chaining modal parameter
					self.modalParams.nextModal = 'dlgChooseRecord'
				}
				this.modalParams.callback = templateChosen;
				this.modalShowing = 'dlgChooseTemplate';
			},
				// Create modal for getting single ID of Record to join (Template preselected)
			getJoinID: function(index, event) {
				console.log("Click: getJoinID");
				if (event) { event.preventDefault(); }
				var thisAtttibute = this.defRecord[index];
				var thisTemplate = getTemplate(this.recType);
					// Now find Template ID for join for this Attribute ID
				var joinAtt = thisTemplate.j.find(function(theJoin) { return theJoin.id == thisAtttibute.id; });
				if (joinAtt) {
					this.modalParams.tID = joinAtt.t;
					function saveJoinID(theID) {
						thisAtttibute.value = theID;
					}
					this.modalParams.callback = saveJoinID;
					this.modalShowing = 'dlgChooseRecord';
				}
			}
		}
	}); // vApp
	vApp.$on('dialogclose', function () {
		console.log("dialogclose");
			// Do we need to chain to another modal?
		if (this.modalParams.nextModal != '') {
			this.modalShowing = this.modalParams.nextModal;
			this.modalParams.nextModal = '';
		} else {
			this.modalShowing = 'nullcomponent';
		}
	});

		// Set Record's initial default Attributes
	fillRecordFromTemplate(recType);
		// Repack Record if user changes Template
	vApp.$watch('recType', function(newVal, oldVal) {
		this.defRecord = [];
		fillRecordFromTemplate(newVal);
	});

		// PURPOSE: Prepare Record data to save, if no errors
	function doSaveRecord()
	{
		var newRecID = vApp.recID.trim();
		if (newRecID.length > 32) {
			displayError('#errmsg-id');
			return false;
		}
		if (!/^[\w\-]+$/.test(newRecID)) {
			displayError('#errmsg-id');
			return false;
		}

		var newAttVals = { };
		var numAtts = vApp.defRecord.length;
		var i;
		var numCheck = /^(-?\d+)$/;
		var yearCheck = /^~?(-?\d+)$/;

			// Check for errors and convert to single string if necessary
		for (i=0; i<numAtts; i++) {
			var thisAtt = vApp.defRecord[i];
			var newVal = thisAtt.value;

				// Special processing for Text, Tags, Numbers and Dates
			switch (thisAtt.def.t) {
			case 'T':
			case 'g':
				newVal = newVal.replace(/"/g, '');
				break;
			case 'N':
					// Allow null
				if (newVal.length == 0)
					break;
					// Allow undefined value
				if (newVal == '?')
					break;

				if (typeof newVal != 'string')
					newVal = newVal.toString();

					// Ensure valid number
				if (newVal.match(numCheck) == null) {
					displayError('#errmsg-number');
					return false;
				}

				var newNum = parseInt(newVal, 10);

				if (newNum < thisAtt.def.r.min || newNum > thisAtt.def.r.max) {
					displayError('#errmsg-number-range');
					return false;
				}
				break;
			case 'D':
				var newDate = newVal.min.y;
					// Blank or special undefined character?
				if (newDate.length === 0 || newDate === '?') {
					newVal = newDate;
					break;
				}
					// Range check minimum year
				var dateMatch = yearCheck.exec(newDate);
				if (dateMatch == null) {
					displayError('#errmsg-date-range');
					return false;
				}
				var minYear = parseInt(dateMatch[1]);
				if (minYear < thisAtt.def.r.min.y || minYear > thisAtt.def.r.max.y) {
					displayError('#errmsg-date-range');
					return false;
				}

				if (newVal.min.m && newVal.min.m !== '') {
					newDate += '-'+newVal.min.m;
					if (newVal.min.d && newVal.min.d !== '')
						newDate += '-'+newVal.min.d;
				}
				if (newVal.max.y && newVal.max.y !== '') {
					newDate += '/'+newVal.max.y;

						// Skip other processing if "open"
					if (newVal.max.y == 'open') {
						newVal = newDate;
						break;
					}
						// Range check maximum year
					dateMatch = yearCheck.exec(newVal.max.y);
					if (dateMatch == null) {
						displayError('#errmsg-date-range');
						return false;
					}
					var maxYear = parseInt(dateMatch[1]);
					if (maxYear < thisAtt.def.r.min.y || maxYear > thisAtt.def.r.max.y) {
						displayError('#errmsg-date-range');
						return false;
					}
					if (minYear > maxYear) {
						displayError('#errmsg-date-maxmin');
						return false;
					}

					if (newVal.max.m && newVal.max.m !== '') {
						newDate += '-'+newVal.max.m;
						if (newVal.max.d && newVal.max.d !== '')
							newDate += '-'+newVal.max.d;
					}
				}
				newVal = newDate;
				break;
			} // switch type
			newAttVals[thisAtt.id] = newVal;
		}

// console.log("RecAtts: "+encodedVals);
// console.log("size: "+encodedVals.length);

			// Insert values into hidden fields if no problems
		jQuery('input[name="prsp_rec_id"]').val(newRecID);
		jQuery('input[name="prsp_tmplt_id"]').val(vApp.recType);
		var encodedVals = JSON.stringify(newAttVals);
		jQuery('textarea[name="prsp_rec_atts"]').val(encodedVals);
			// Confirm to user that Record saved successfully
		displayError('#msg-saved', '', true);

		return false;
	} // doSaveRecord()
}); // ready
