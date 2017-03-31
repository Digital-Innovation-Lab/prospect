// Template Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
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

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
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

		// Component (dialog) to choose Attribute from list
	Vue.component('dlgChooseAttribute', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return { selIndex: 0 }
		},
		methods: {
			save: function() {
				console.log("dlgChooseAttribute > Clicked save");
				this.params.callback(this.selIndex);
			},
			doSelect: function(index) {
				this.selIndex = index;
			}
		},
		template: '#dialog-choose-attribute'
	});

		// Component (dialog) to choose Dependent Template from list
	Vue.component('dlgChooseTemplate', {
		props: {
			params: Object
		},
		data: function () {		// Local copies of data that user can edit
			return { selIndex: 0 }
		},
		methods: {
			save: function() {
				console.log("dlgChooseTemplate > Clicked save");
				this.params.callback(this.selIndex);
			},
			doSelect: function(index) {
				this.selIndex = index;
			}
		},
		template: '#dialog-choose-dependent'
	});


		// PURPOSE: Ensure that Attributes exist in current set of definitions
		// NOTES:	In case user has deleted or changed Attribute definition since this
		//				Template was initially created
	function checkAtt(attID) {
		if (attID === 'disable')
			return 'disable';
		var attDef = defAtts.find(function(att) { return att.id == attID; });
		if (attDef)
			return attID;
		else
			return 'disable';
	} // checkAtt()


		// DATA LOADED FROM SERVER
		// =======================
		// Unpack list of definition data for currently defined Templates
	var allTemplates = prspdata.templates;
		// Unpack list of currently defined Attributes (just minimal definition data)
	var defAtts = prspdata.atts;

		// LIVE DATA ABOUT THIS TEMPLATE (Needs un-/repacking)
		// ===================================================
	var templateID = jQuery('input[name="prsp_tmp_id"]').val();
	var defTemplate;
	var depTemplates=[];				// List of Dependent Templates
	var textAtts=[];					// Text Attributes in this Template
	var recPostAtts;					// Attributes that can be viewed from Record's Post page
	var tmpPostAtts;					// Attributes of Records displayed on Template Post page
	var scAtts, ytAtts, trAtts, tcAtts;	// Attribute IDs available for configuring widgets of specific types
	var tpIAtts, tpCAtts;				// Attribute IDs for configuring Template Post page
	var attMap = {};					// For translating from code to label/name

	var embedData;

	embedData = getText('#att-types');
	embedData.split("|").forEach(function(pair) {
		var t = pair.split(",");
		attMap[t[0]] = t[1];
	});

	embedData = jQuery('textarea[name="prsp_tmp_def"]').val();
	if (embedData && embedData.length > 2) {
		defTemplate = JSON.parse(embedData);
		if (typeof defTemplate.h === 'undefined')
			defTemplate.h = '';
			// Ensure that textual label attribute still exists
		defTemplate.t = checkAtt(defTemplate.t);
	} else {
		defTemplate = { l: '', d: false, t: '', a: [], h: '' };
	}

	embedData = jQuery('textarea[name="prsp_tmp_view"]').val();
	if (embedData && embedData.length > 2) {
		recPostAtts = JSON.parse(embedData);
		recPostAtts.sc 	= checkAtt(recPostAtts.sc);
		recPostAtts.yt 	= checkAtt(recPostAtts.yt);
		recPostAtts.t.t1Att = checkAtt(recPostAtts.t.t1Att);
		recPostAtts.t.t2Att = checkAtt(recPostAtts.t.t2Att);
		recPostAtts.t.tcAtt = checkAtt(recPostAtts.t.tcAtt);
	} else {
			// Create default settings in case of new Template
		recPostAtts = { sc: 'disable', yt: 'disable', cnt: [], t: { t1Att: 'disable', t2Att: 'disable', tcAtt: 'disable' } };
	}

	embedData = jQuery('textarea[name="prsp_tmp_pview"]').val();
	if (embedData && embedData.length > 2) {
		tmpPostAtts = JSON.parse(embedData);
		tmpPostAtts.i 	= checkAtt(tmpPostAtts.i);
		tmpPostAtts.c 	= checkAtt(tmpPostAtts.c);
	} else {
			// Create default settings
		tmpPostAtts = { d: 'l', i: 'disable', c: 'disable' };
	}

		// Must integrate Joins into Attribute array: { id: att ID, t: type, j: Template ID (if Join), view } ]
	embedData = jQuery('textarea[name="prsp_tmp_joins"]').val();
	var joins = [];
	if (embedData && embedData.length > 2) {
		joins = JSON.parse(embedData);
	}
	var newAtts=[];
	for (i=0; i<defTemplate.a.length; i++) {
		var attID = defTemplate.a[i];
		var attObj = { id: attID };
			// Find Attribute definition
		var attDef = defAtts.find(function(att) { return att.id === attID; });
			// Only copy Attributes that exist now
		if (attDef) {
			attObj.view = recPostAtts.cnt.findIndex(function(att) { return att === attDef.id; } ) != -1;
			attObj.t = attDef.def.t;
			if (attDef.def.t == 'J') {
					// Find Join entry and add template ID
				var joinDef = joins.find(function(j) { return j.id === attID; });
				if (joinDef) {
					attObj.j = joinDef.t;
				} else {
					var es = jQuery("#errmsg-missing-dep-tmp").html().trim();
					jQuery("#prsp_template_box .inside").prepend(es);
					throw new Error("Dependent Template for Join Attribute "+attID+" is missing.");
				}
			} else {
				attObj.j = '';
			}
			newAtts.push(attObj);
		} else {
			console.log("Attribute ID "+attID+" is undefined and will be removed from the definition.");
		}
	} // for atts
	defTemplate.a = newAtts;

		// Compile list of dependent Templates
	allTemplates.forEach(function(theTmplt) {
		if (theTmplt.def.d) {
			depTemplates.push(theTmplt);
		}
	});


		// OTHER VARS
		// ==========
	var vApp;							// the main VueJS application
	var errTimer;


		// CODE
		// ====

		// PURPOSE: Retrieve language-dependent text embedded in script
	function getText(scriptName)
	{
		return jQuery(scriptName).html().trim();
	}

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


		// PURPOSE: Check basic data provided by the user for Template definition
		// RETURNS: false if definition contains logical errors, else definition object
		// SIDE-FX: sets errorMsg to explanation of error
	function doErrorCheck()
	{
		var theID = vApp.templateID.trim();
		if (theID.length == 0) {
			displayError('#errmsg-id');
			return false;
		}
		if (!/^[\w\-]+$/.test(theID)) {
			displayError('#errmsg-id');
			return false;
		}
		if (theID.length > 32) {
			displayError('#errmsg-id-too-long');
			return false;
		}
		if (allTemplates.findIndex(function(tmplt) { return theID === tmplt.id; }) != -1) {
			displayError('#errmsg-id-taken');
			return false;
		}

		var theLabel = vApp.label.replace(/"/g, '').trim();
		if (theLabel.length == 0) {
			displayError('#errmsg-no-label');
			return false;
		}
		if (theLabel.length > 32) {
			displayError('#errmsg-label-too-long');
			return false;
		}

		var defObj = { l: theLabel };

		var theHint = vApp.hint.replace(/"/g, '').trim();
		if (theHint.length > 0) {
			defObj.h = theHint;
		}

		return defObj;
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
		var mText = getText(msgID) + addText;
		vApp.modalParams.msg = mText;
		vApp.modalParams.callback = callback;
		vApp.modalShowing = 'dlgConfirm';
	} // confirmModal()

		// PURPOSE: Compile list of unused Attributes
		// RETURNS: true if there are attributes that can be added
	function getUnusedAtts()
	{
		var attChoices = [];
		var curList = vApp.tmpltAttributes;
		defAtts.forEach(function(attDef) {
				// If this dependent template, don't allow Join Attributes!
			if (!vApp.dependent || attDef.def.t != 'J') {
					// Ensure not already used
				if (curList.findIndex(function(item) { return item.id == attDef.id; }) == -1) {
					var choice = { l: attDef.def.l, id: attDef.id, t: attMap[attDef.def.t] };
					attChoices.push(choice);
				}
			}
		});

		if (attChoices.length == 0) {
			displayError('#errmsg-all-atts-used');
			return false;
		}

		attChoices.sort(function(a, b) {
			if (a.id < b.id) { return -1; } else { return 1; }
		});
		vApp.modalParams.attList = attChoices;

		return true;
	} // getUnusedAtts()

		// PURPOSE: (Re)Compute arrays of Attributes for configuring widgets and Template Post page
		// INPUT: 	if update = true, vApp already created, need to update it
		//				otherwise, we are preparing for it
		//			delAtt = ID of Attribute that has been deleted (or null if none)
	function compileAttOptions(update, delAtt)
	{
		textAtts = [];
		scAtts = ['disable'];
		ytAtts = ['disable'];
		trAtts = ['disable'];
		tcAtts = ['disable'];

		tpIAtts = ['disable'];
		tpCAtts = ['disable'];

		var curAttDefs;
		if (update)
			curAttDefs = vApp.tmpltAttributes;
		else
			curAttDefs = defTemplate.a;

			// Get initial list of Attributes
		curAttDefs.forEach(function(theAtt) {
			switch (theAtt.t) {
			case 'V':	// Vocab
			case 'g':	// Tags
			case 'N':	// number
			case 'D':	// Dates
				tpCAtts.push(theAtt.id);
				break;
			case 'I':	// Image
				tpIAtts.push(theAtt.id);
				break;
			case 'T':	// Text
				textAtts.push(theAtt.id);
				tpCAtts.push(theAtt.id);
				break;
			case 'S':	// Audio
				scAtts.push(theAtt.id);
				break;
			case 'Y':	// YouTube
				ytAtts.push(theAtt.id);
				break;
			case 'x': 	// Transcript
				trAtts.push(theAtt.id);
				break;
			case 't': 	// Timecode
				tcAtts.push(theAtt.id);
				break;
			}
		});

		if (update)
		{
			vApp.textAtts	= textAtts;
			vApp.scAtts		= scAtts;
			vApp.ytAtts		= ytAtts;
			vApp.trAtts		= trAtts;
			vApp.tcAtts		= tcAtts;

			vApp.tpIAtts	= tpIAtts;
			vApp.tpCAtts	= tpCAtts;

			if (delAtt != null) {
				if (vApp.labelAttribute == delAtt)
					vApp.labelAttribute = vApp.textAtts[0] || '';
				if (vApp.recPostAtts.sc == delAtt)
					vApp.recPostAtts.sc = 'disable';
				if (vApp.recPostAtts.yt == delAtt)
					vApp.recPostAtts.yt = 'disable';
				if (vApp.recPostAtts.t.t1Att == delAtt)
					vApp.recPostAtts.t.t1Att = 'disable';
				if (vApp.recPostAtts.t.t2Att == delAtt)
					vApp.recPostAtts.t.t2Att = 'disable';
				if (vApp.recPostAtts.t.tcAtt == delAtt)
					vApp.recPostAtts.t.tcAtt = 'disable';
				if (vApp.tmpPostAtts.i == delAtt)
					vApp.tmpPostAtts.i = 'disable';
				if (vApp.tmpPostAtts.c == delAtt)
					vApp.tmpPostAtts.c = 'disable';
			}
		}
	} // compileAttOptions()

	compileAttOptions(false, null);

		// Create our main App Ractive instance with wrapped jQueryUI components
	vApp = new Vue({
		el: '#vue-outer',
		data: {
			templateID: templateID,
			label: defTemplate.l,
			dependent: defTemplate.d,
			hint: defTemplate.h,
			labelAttribute: defTemplate.t,
			tmpltAttributes: defTemplate.a,
			recPostAtts: recPostAtts,
			tmpPostAtts: tmpPostAtts,
				// GUI state & options
			textAtts: textAtts,
			scAtts: scAtts,
			ytAtts: ytAtts,
			trAtts: trAtts,
			tcAtts: tcAtts,
			tpIAtts: tpIAtts,
			tpCAtts: tpCAtts,
			attMap: attMap,
			errorMsg: '',						// current error string (if any)
			errorOK: false,						// Is message actually not an error?
			modalParams: {						// parameters passed to modal dialogs
				msg: '',
				attList: [],
				tmpltList: depTemplates,
				callback: null
			},
			modalShowing: 'nullcomponent'		// modal currently showing (initially nothing)
		},
		methods: {
			saveTemplate: function(event) {
				console.log("Click: saveTemplate");
				if (event) { event.preventDefault(); }
				var tmpltDef = doErrorCheck();
				if (tmpltDef) {
					var theError = null;
					tmpltDef.d = vApp.dependent;
					tmpltDef.t = vApp.labelAttribute;

					var atts = vApp.tmpltAttributes;
					if (atts.length === 0) {
						displayError('#errmsg-no-atts');
						return false;
					}

					tmpltDef.a = [];
					var tmpJoins = [];
					var tmpCnt = [];

					atts.forEach(function(theAtt) {
						tmpltDef.a.push(theAtt.id);
						if (theAtt.view)
							tmpCnt.push(theAtt.id);
						if (theAtt.t == 'J') {
								// Attempt to add Join Attribute to dependent Template?
							if (tmpltDef.d) {
								theError = '#errmsg-no-join-for-dep';
								// Unspecified Join?
							} else if (theAtt.j == '') {
								theError = '#errmsg-missing-join-tmp';
							}
							tmpJoins.push({ id: theAtt.id, t: theAtt.j });
						}
					});

					if (theError) {
						displayError(theError);
						return false;
					}

					var tmpView = { };
					tmpView.sc = vApp.recPostAtts.sc;
					tmpView.yt = vApp.recPostAtts.yt;
					tmpView.t = { };
					tmpView.t.t1Att = vApp.recPostAtts.t.t1Att;
					tmpView.t.t2Att = vApp.recPostAtts.t.t2Att;
					tmpView.t.tcAtt = vApp.recPostAtts.t.tcAtt;
					tmpView.cnt 	= tmpCnt;

					var tmpPost = { };
					tmpPost.d = vApp.tmpPostAtts.d;
					tmpPost.i = vApp.tmpPostAtts.i;
					tmpPost.c = vApp.tmpPostAtts.c;

					console.log("Def: "+JSON.stringify(tmpltDef));
					console.log("Joins: "+JSON.stringify(tmpJoins));
					console.log("Post: "+JSON.stringify(tmpPost));
					console.log("View: "+JSON.stringify(tmpView));

						// Stuff results into hidden form fields
					jQuery('input[name="prsp_tmp_id"]').val(vApp.templateID.trim());
					jQuery('textarea[name="prsp_tmp_def"]').val(JSON.stringify(tmpltDef));
					jQuery('textarea[name="prsp_tmp_joins"]').val(JSON.stringify(tmpJoins));
					jQuery('textarea[name="prsp_tmp_view"]').val(JSON.stringify(tmpView));
					jQuery('textarea[name="prsp_tmp_pview"]').val(JSON.stringify(tmpPost));
						// Confirm to user that Template saved
					displayError('#msg-saved', true);
				}

			}, // saveTemplate()
			idHint: function(event) {
				console.log("Click: idHint");
				if (event) { event.preventDefault(); }
				messageModal('#errmsg-id');
			}, // idHint()
			delAttribute: function(index, event) {
				console.log("Click: delAttribute "+index);
				if (event) { event.preventDefault(); }
				var self=this;
				confirmModal('#msg-confirm-del-att', '', function() {
					var oldID = self.tmpltAttributes[index].id;
					self.tmpltAttributes.splice(index, 1);
					console.log("Checking against ID "+oldID);
						// As this can affect current Attribute selections, we need to update them
					compileAttOptions(true, oldID);
				});
			}, // delAttribute()
			addAttribute: function(event) {
				console.log("Click: addAttribute");
				if (event) { event.preventDefault(); }
				if (getUnusedAtts()) {
					var self=this;
					function addAttChoice(index) {
						var attChoice = self.modalParams.attList[index];
						var attDef = defAtts.find(function(att) { return att.id == attChoice.id; });
						var newAttRec = { id: attDef.id, t: attDef.def.t, j: '', view: false };
						self.tmpltAttributes.push(newAttRec);
							// As this can affect current Attribute selections, we need to update them
						compileAttOptions(true, null);
					}
					this.modalParams.callback = addAttChoice;
					this.modalShowing = 'dlgChooseAttribute';
				}
			}, // addAttribute()
			selJoin: function(index, event) {
				console.log("Click: selJoin");
				if (event) { event.preventDefault(); }
					// Can't create joins on a dependent Template
				if (this.dependent) {
					return;
				}
				var attItem = this.tmpltAttributes[index];
					// Can only join a Join data type
				if (attItem.t != 'J') {
					displayError('#errmsg-not-join');
					return;
				}
				if (depTemplates.length == 0) {
					displayError('#errmsg-no-dependents');
					return;
				}
				function setJoinTemplate(tI) {
					attItem.j = depTemplates[tI].id;
				}
				this.modalParams.callback = setJoinTemplate;
				this.modalShowing = 'dlgChooseTemplate';
			}, // selJoin()
			moveAttUp: function(index, event) {
				console.log("Click: moveAttUp");
				if (event) { event.preventDefault(); }
				if (index > 0) {
					var spliced = this.tmpltAttributes.splice(index, 1);
					this.tmpltAttributes.splice(index-1, 0, spliced[0]);
				}
			}, // moveAttUp()
			moveAttDown: function(index, event) {
				console.log("Click: moveAttDown");
				if (event) { event.preventDefault(); }
				if (index != this.tmpltAttributes.length-1) {
					var spliced = this.tmpltAttributes.splice(index, 1);
					this.tmpltAttributes.splice(index+1, 0, spliced[0]);
				}
			} // moveAttDown()
		}
	});
	vApp.$on('dialogclose', function () {
		console.log("dialogclose");
		this.modalShowing = 'nullcomponent';
	});
}); // ready
