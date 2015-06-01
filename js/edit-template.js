// Template Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   
// USES:    jQuery, Underscore, jQueryUI, and Ractive
// ASSUMES: 

// TO DO:	

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


		// DATA LOADED FROM SERVER
		// =======================
		// Unpack list of definition data for currently defined Templates
	var defTemplates = prspdata.templates;
		// Unpack list of currently defined Attributes (just minimal definition data)
	var defAtts = prspdata.atts;

		// LIVE DATA ABOUT THIS TEMPLATE (Needs un-/repacking)
		// ===================================================
	var templateID = jQuery('input[name="prsp_tmp_id"]').val();
	var defTemplate;
	var textAtts = [];					// Text Attributes in this Template

	var embedData;

	embedData = jQuery('textarea[name="prsp_tmp_def"]').val();
	if (embedData && embedData.length > 2) {
		defTemplate = JSON.parse(embedData);
	} else {
		defTemplate = { l: '', d: false, t: '', a: [] };
	}

		// Must integrate Joins into Attribute array: { id: att ID, t: type, j: Template ID (if Join) } ]
	embedData = jQuery('textarea[name="prsp_tmp_joins"]').val();
	var joins = [];
	if (embedData && embedData.length > 2) {
		var joins = JSON.parse(embedData);
	}
	for (i=0; i<defTemplate.a.length; i++) {
		var attID = defTemplate.a[i];
		var attObj = { id: attID };
			// Find Attribute definition
		var attDef = _.find(defAtts, function(att) { return att.id == attID; });
			// Set Attribute type
		if (attDef) {
			attObj.t = attDef.def.t;
			if (attDef.def.t == 'Join') {
					// Find Join entry and add template ID
				var joinDef = _.find(joins, function(j) { return j.id == attID; });
				if (joinDef)
					attObj.j = joinDef.t;
			} else {
				attObj.j = '';
			}
		} else {
			attObj.t = '';
			attObj.j = '';
		}
			// Convert to Object
		defTemplate.a[i] = attObj;
	} // for atts


		// OTHER VARS
		// ==========
	var rApp;							// the main Ractive application
	var errTimer;
	var errorString = '';				// error readout


		// CODE
		// ====

		// PURPOSE: Retrieve language-dependent text embedded in script
	function getText(scriptName)
	{
		return jQuery(scriptName).html().trim();
	}


		// PURPOSE: Show error message for 3 seconds
	function displayError(errID)
	{
			// If a clear-error timer is set, cancel it
		if (errTimer)
			clearTimeout(errTimer);
		var newError = getText(errID);
		rApp.set('errorMsg', newError);
		errTimer = setTimeout(function() { rApp.set('errorMsg', ''); }, 3000);
	} // displayError()


		// PURPOSE: Check basic data provided by the user for Template definition
		// RETURNS: false if definition contains logical errors, else definition object
		// SIDE-FX: sets errorMsg to explanation of error
	function doErrorCheck()
	{
		var defObj;

		var theID = rApp.get('templateID').trim();
		if (theID.length == 0) {
			displayError('#errmsg-no-id');
			return false;
		}
		if (theID.length > 32) {
			displayError('#errmsg-id-too-long');
			return false;
		}
		if (defTemplates.findIndex(function(tmplt) { return theID === tmplt.id; }) != -1) {
			displayError('#errmsg-id-taken');
			return false;
		}

		var theLabel = rApp.get('theTemplate.l').trim();
		if (theLabel.length == 0) {
			displayError('#errmsg-no-label');
			return false;
		}
		if (theLabel.length > 32) {
			displayError('#errmsg-label-too-long');
			return false;
		}

		return { l: theLabel };
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

		// PURPOSE: Provide default setting for Template title
		// NOTES:   To overcome Ractive quirk
	function setTextAttDefault()
	{
		if (rApp.get('theTemplate.t') == '') {
			if (rApp.get('textAtts.length') > 0)
				rApp.set('theTemplate.t', rApp.get('textAtts[0]'));
		}
	} // setTextAttDefault()


		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			templateID: templateID,
			theTemplate: defTemplate,
			textAtts: textAtts,
			errorMsg: errorString
		},
	});


	rApp.on('addAttribute', function() {
			// Only show Attributes not already in Template's list
		var curList = rApp.get('theTemplate.a');
		var isDep = rApp.get('theTemplate.d');

			// Create list of Attribute IDs not already used in this Template
		var attChoices = [ ];
		_.forEach(defAtts, function(attDef) {
				// If this dependent template, don't allow Join Attributes!
			if (!isDep || attDef.def.t != 'Join') {
					// Ensure not already used
				if (curList.findIndex(function(item) { return item.id === attDef.id; }) == -1) {
					var choice = { l: attDef.def.l, id: attDef.id, t: attDef.def.t };
					attChoices.push(choice);
				}
			}
		});

		if (attChoices.length == 0) {
			displayError('#errmsg-all-atts-used');
			return false;
		}

		attChoices.sort();

		var selected = 0;
		var attDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-attribute',
			data: {
				attributes: attChoices,
				selIndex: selected
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		attDialog.on('doSelect', function(event, index) {
			attDialog.set('selIndex', index);
			return false;
		});

		attDialog.on('dialog.ok', function() {
			var i = attDialog.get('selIndex');
			var useAttDef = attChoices[i];
			var newAttRec = { id: useAttDef.id, t: useAttDef.t, j: '' };

			rApp.push('theTemplate.a', newAttRec);

			attDialog.teardown();
			return false;
		});
		attDialog.on('dialog.cancel', attDialog.teardown);
		return false;
	}); // addAttribute


	rApp.on('delAttribute', function(event, index) {
		confirmModal('#msg-confirm-del-att', function() {
			rApp.splice('theTemplate.a', index, 1);
		});
		return false;
	}); // delAttribute


		// Compile Text Attribute list when Attributes change
		// 	initially oldValue == undefined
	rApp.observe('theTemplate.a', function (newValue, oldValue, keypath) {
		rApp.set('textAtts', []);
		var curAttDefs = rApp.get('theTemplate.a');
			// Get initial list of TextAttributes
		curAttDefs.forEach(function(theAtt) {
			if (theAtt.t == 'Text')
				rApp.push('textAtts', theAtt.id);
		});
		setTextAttDefault();
	});


	rApp.on('selJoin', function(event, index) {
			// No Joins for dependent Templates
		if (rApp.get('theTemplate.d'))
			return false;

		var attIndex = 'theTemplate.a['+index+']';
		var type = rApp.get(attIndex+'.t');
		if (type != 'Join') {
			displayError('#errmsg-not-join');
			return false;
		}
			// Compile list of dependent Templates
		var dChoices = [ ];
		_.forEach(defTemplates, function(theTmplt) {
			if (theTmplt.def.d) {
				dChoices.push(theTmplt);
			}
		});
		if (dChoices.length == 0) {
			displayError('#errmsg-no-dependents');
			return false;
		}

		var selected = 0;
		var depDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-dependent',
			data: {
				templates: dChoices,
				selIndex: selected
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		depDialog.on('doSelect', function(event, i) {
			depDialog.set('selIndex', i);
			return false;
		});

		depDialog.on('dialog.ok', function() {
			var i = depDialog.get('selIndex');
			var att = rApp.get(attIndex);
			att.j = dChoices[i].id;
			rApp.set(attIndex, att);
			depDialog.teardown();
			return false;
		});
		depDialog.on('dialog.cancel', depDialog.teardown);
		return false;
	});


	rApp.on('saveTemplate', function() {
		var tmpltDef = doErrorCheck();

		if (tmpltDef) {
			var theError = null;

			tmpltDef.d = rApp.get('theTemplate.d');
			tmpltDef.t = rApp.get('theTemplate.t');

			var atts = rApp.get('theTemplate.a');
			if (atts.length == 0) {
				displayError('#errmsg-no-atts');
				return false;
			}

			tmpltDef.a = [];
			var tmpJoins = [];

			atts.forEach(function(theAtt) {
				tmpltDef.a.push(theAtt.id);
				if (theAtt.t == 'Join') {
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

				// Stuff results into hidden form fields
			jQuery('input[name="prsp_tmp_id"]').val(rApp.get('templateID').trim());
			jQuery('textarea[name="prsp_tmp_def"]').val(JSON.stringify(tmpltDef));
			jQuery('textarea[name="prsp_tmp_joins"]').val(JSON.stringify(tmpJoins));
		}
		return false;
	});
}); // ready
