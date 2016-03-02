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
	var viewAtts;						// Attributes that can be viewed from Record's Post page
	var scAtts, ytAtts, trAtts, tcAtts;	// Attribute IDs for configuring widgets of specific types
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
	} else {
		defTemplate = { l: '', d: false, t: '', a: [], h: '' };
	}

	embedData = jQuery('textarea[name="prsp_tmp_view"]').val();
	if (embedData && embedData.length > 2) {
		viewAtts = JSON.parse(embedData);
			// Ensure that Attributes still exist
		function checkAtt(attID) {
			if (attID === 'disable')
				return 'disable';
			var attDef = _.find(defAtts, function(att) { return att.id == attID; });
			if (attDef)
				return attID;
			else
				return 'disable';
		} // checkAtt()
		viewAtts.sc 	= checkAtt(viewAtts.sc);
		viewAtts.yt 	= checkAtt(viewAtts.yt);
		viewAtts.t.t1Att = checkAtt(viewAtts.t.t1Att);
		viewAtts.t.t2Att = checkAtt(viewAtts.t.t2Att);
		viewAtts.t.tcAtt = checkAtt(viewAtts.t.tcAtt);
	} else {
			// Create default settings in case of new Template
		viewAtts 	= {};
		viewAtts.sc = 'disable';
		viewAtts.yt = 'disable';
		viewAtts.t 	= { t1Att: 'disable', t2Att: 'disable', tcAtt: 'disable' };
		viewAtts.cnt= [];
	}

		// Must integrate Joins into Attribute array: { id: att ID, t: type, j: Template ID (if Join) } ]
	embedData = jQuery('textarea[name="prsp_tmp_joins"]').val();
	var joins = [];
	if (embedData && embedData.length > 2) {
		var joins = JSON.parse(embedData);
	}
	var newAtts=[];
	for (i=0; i<defTemplate.a.length; i++) {
		var attID = defTemplate.a[i];
		var attObj = { id: attID };
			// Find Attribute definition
		var attDef = _.find(defAtts, function(att) { return att.id === attID; });
			// Only copy Attributes that exist now
		if (attDef) {
			attObj.view = viewAtts.cnt.findIndex(function(att) { return att === attDef.id; } ) != -1;
			attObj.t = attDef.def.t;
			if (attDef.def.t == 'J') {
					// Find Join entry and add template ID
				var joinDef = _.find(joins, function(j) { return j.id === attID; });
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


		// PURPOSE: Show error message for 5 seconds
	function displayError(errID)
	{
			// If a clear-error timer is set, cancel it
		if (errTimer)
			clearTimeout(errTimer);
		var newError = getText(errID);
		rApp.set('errorMsg', newError);
		errTimer = setTimeout(function() { rApp.set('errorMsg', ''); }, 5000);
	} // displayError()


		// PURPOSE: Check basic data provided by the user for Template definition
		// RETURNS: false if definition contains logical errors, else definition object
		// SIDE-FX: sets errorMsg to explanation of error
	function doErrorCheck()
	{
		var theID = rApp.get('templateID').trim();
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
		if (defTemplates.findIndex(function(tmplt) { return theID === tmplt.id; }) != -1) {
			displayError('#errmsg-id-taken');
			return false;
		}

		var theLabel = rApp.get('theTemplate.l').replace(/"/g, '').trim();
		if (theLabel.length == 0) {
			displayError('#errmsg-no-label');
			return false;
		}
		if (theLabel.length > 32) {
			displayError('#errmsg-label-too-long');
			return false;
		}

		var defObj = { l: theLabel };

		var theHint = rApp.get('theTemplate.h').replace(/"/g, '').trim();
		if (theHint.length > 0) {
			defObj.h = theHint;
		}

		return defObj;
	} // doErrorCheck()


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

		// PURPOSE: Recompute arrays of Attributes for configuring widget on Record page
		// INPUT: 	if update = true, rApp already created, need to update it
		//				otherwise, we are preparing for it
	function compileAttOptions(update)
	{
		textAtts = [];
		scAtts = ['disable'];
		ytAtts = ['disable'];
		trAtts = ['disable'];
		tcAtts = ['disable'];

		var curAttDefs;
		if (update)
			curAttDefs = rApp.get('theTemplate.a');
		else
			curAttDefs = defTemplate.a;

			// Get initial list of Attributes
		curAttDefs.forEach(function(theAtt) {
			switch (theAtt.t) {
			case 'T':
				textAtts.push(theAtt.id);
				break;
			case 'S':
				scAtts.push(theAtt.id);
				break;
			case 'Y':
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
			rApp.set('textAtts', textAtts);
			rApp.set('scAtts', scAtts);
			rApp.set('ytAtts', ytAtts);
			rApp.set('trAtts', trAtts);
			rApp.set('tcAtts', tcAtts);

				// NOTES: These forced resets overcome a Ractive quirk
			if (rApp.get('theTemplate.t') == '') {
				if (textAtts.length > 0)
					rApp.set('theTemplate.t', textAtts[0]);
			}
			if (rApp.get('viewAtts.sc') == '')
				rApp.set('viewAtts.sc', 'disable');
			if (rApp.get('viewAtts.yt') == '')
				rApp.set('viewAtts.yt', 'disable');
			if (rApp.get('viewAtts.t.t1Att') == '')
				rApp.set('viewAtts.t.t1Att', 'disable');
			if (rApp.get('viewAtts.t.t2Att') == '')
				rApp.set('viewAtts.t.t2Att', 'disable');
			if (rApp.get('viewAtts.t.tcAtt') == '')
				rApp.set('viewAtts.t.tcAtt', 'disable');
		}
	} // compileAttOptions()

	compileAttOptions(false);

		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			templateID: templateID,
			theTemplate: defTemplate,
			viewAtts: viewAtts,
			textAtts: textAtts,
			scAtts: scAtts,
			ytAtts: ytAtts,
			trAtts: trAtts,
			tcAtts: tcAtts,
			attMap: attMap,
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
			if (!isDep || attDef.def.t != 'J') {
					// Ensure not already used
				if (curList.findIndex(function(item) { return item.id === attDef.id; }) == -1) {
					var choice = { l: attDef.def.l, id: attDef.id, t: attMap[attDef.def.t], view: true };
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
			var attChoice = attChoices[i];
			var attDef = _.find(defAtts, function(att) { return att.id == attChoice.id; });
			var newAttRec = { id: attDef.id, t: attDef.def.t, j: '', view: false };

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


		// Pop up modal with hint about IDs
	rApp.on('idHint', function() {
		var hint = getText('#errmsg-id');
		messageModal(hint);
		return false;
	});

		// Compile Text Attribute list when Attributes change
		// 	initially oldValue == undefined
	rApp.observe('theTemplate.a', function (newValue, oldValue, keypath) {
			// Refresh what Attributes are available for Inspector settings
		if (typeof oldValue != 'undefined')
			compileAttOptions(true);
	});

		// Move an Attribute "down" in Template definition
	rApp.on('moveDown', function(event, index) {
		var r = rApp.get('theTemplate.a');
		if (index != r.length-1) {
			rApp.splice('theTemplate.a', index, 1).then(function(spliced) {
				rApp.splice('theTemplate.a', index+1, 0, spliced[0]);
			});
		}
		return false;
	});

		// Move an Attribute "up" in Template definition
	rApp.on('moveUp', function(event, index) {
		if (index) {
			rApp.splice('theTemplate.a', index, 1).then(function(spliced) {
				rApp.splice('theTemplate.a', index-1, 0, spliced[0]);
			});
		}
		return false;
	});

	rApp.on('selJoin', function(event, index) {
			// No Joins for dependent Templates
		if (rApp.get('theTemplate.d'))
			return false;

		var attIndex = 'theTemplate.a['+index+']';
		var type = rApp.get(attIndex+'.t');
		if (type != 'J') {
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
			tmpView.sc = rApp.get('viewAtts.sc');
			tmpView.yt = rApp.get('viewAtts.yt');
			tmpView.t = { };
			tmpView.t.t1Att = rApp.get('viewAtts.t.t1Att');
			tmpView.t.t2Att = rApp.get('viewAtts.t.t2Att');
			tmpView.t.tcAtt = rApp.get('viewAtts.t.tcAtt');
			tmpView.cnt 	= tmpCnt;

// console.log("View: "+JSON.stringify(tmpView));

				// Stuff results into hidden form fields
			jQuery('input[name="prsp_tmp_id"]').val(rApp.get('templateID').trim());
			jQuery('textarea[name="prsp_tmp_def"]').val(JSON.stringify(tmpltDef));
			jQuery('textarea[name="prsp_tmp_joins"]').val(JSON.stringify(tmpJoins));
			jQuery('textarea[name="prsp_tmp_view"]').val(JSON.stringify(tmpView));
		}
		return false;
	});
}); // ready
