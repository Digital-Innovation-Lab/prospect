// Record Editor

// ASSUMES: A view area for the browser has been marked with HTML div as "ractive-output"
// NOTES:   Data about this Record passed in hidden fields
//			In case of newly created Record, prsp_rec_id and prsp_tmplt_id will be empty, and prsp_rec_atts will be "null"
//			prspdata will pass definitions of Templates and Attributes
// USES:    jQuery, Underscore, jQueryUI, and Ractive
// ASSUMES: 

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
			// self.modal.dialog('open');
		}, // onrender

			// Intercept teardown so that jQueryUI component destroyed
		onteardown: function () {
			this.modal.dialog('destroy');
		} // onteardown
	});

		// CONSTANTS
		// =========

		// DATA LOADED FROM SERVER
		// =======================

		// Definitions of Attributes
	var defAtts = prspdata.attDefs;
	for (i=0; i<defAtts.length; i++)
		if (defAtts[i].lgnd == null)
			defAtts[i].lgnd = [];

		// List of currently defined Templates; joins Object is added to it
	var defTemplates = prspdata.templates;		// [ { id, def, j } ]

		// Need to abort with Error message if no Templates defined
	if (defTemplates.length == 0) {
		jQuery('#ractive-output').append(jQuery('#errmsg-no-templates').html().trim());
	}

		// LIVE DATA ABOUT THIS RECORD
		// ==============================
	var recID = jQuery('input[name="prsp_rec_id"]').val();

	var recType = jQuery('input[name="prsp_tmplt_id"]').val();
	if (recType == null || recType == '')
		recType = defTemplates[0].id || '';

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
	var rApp;							// the main Ractive application
	var errTimer;
	var errorString = '';				// error readout

	var canGeoLoc = false;				// true if geolocation possible


		// CODE
		// ====

		// Can we get current geolocation from user?
	function enableGeoLoc()
	{
		if (rApp)	rApp.set('canGeoLoc', true);
		else		canGeoLoc = true;
	}

	function disableGeoLoc()
	{
		if (rApp)	rApp.set('canGeoLoc', false);
		else		canGeoLoc = false;
	}
	navigator.geolocation.getCurrentPosition(enableGeoLoc, disableGeoLoc);


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


		// RETURNS: Attribute definition from ID
	function getAttribute(attID)
	{
		return _.find(defAtts, function(theAtt) { return theAtt.id === attID; });
	} // getAttribute()

		// RETURNS: Dependent Template definition for templateID
	function getTemplate(templateID)
	{
		var t = _.find(defTemplates, function(theTemplate) { return theTemplate.id === templateID; });
		return t;
	} // getTemplate


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


		// PURPOSE: Fill defRecord with default values based on templateID
		// NOTES: 	All incoming values are strings; convert if necessary
	function fillRecordFromTemplate(templateID)
	{
		var theTemplate = getTemplate(templateID);

		_.forEach(theTemplate.def.a, function(attID) {
			var theAttribute = getAttribute(attID);
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
			case 'Vocabulary':
					// Create new arrays for selecting Legend values
				attObject.def.newLgnd = [];
				_.forEach(theAttribute.lgnd, function(theLegend) {
					var newItem = { newL: theLegend.l, newV: theLegend.l };
					attObject.def.newLgnd.push(newItem);
					if (theLegend.z.length)
						_.forEach(theLegend.z, function(child) {
							var newChild = { newL: theLegend.l+' > '+child, newV: child };
							attObject.def.newLgnd.push(newChild);
						});
				});
				if (attObject.def.newLgnd.length)
					attObject.lgndSel = attObject.def.newLgnd[0].newV;
				else
					attObject.lgndSel = '';
				attObject.value = defVal || '';
				break;
			case 'Text':
				attObject.value = defVal || '';
				break;
			case 'Number':
				if (defVal && defVal != '')
					attObject.value = defVal.toString();
				else if (theAttribute.r.min)
					attObject.value = theAttribute.r.min.toString();
				else
					attObject.value = 0;
				break;
			case 'Dates':
					// Is there some value given?
				if (defVal && defVal != '') {
					function parseDate(dateStr) {
						var date = { y: '' };
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
			case 'Lat-Lon':
					// Use a single string in case of multiple pts
				attObject.value = defVal || '';
				break;
			case 'X-Y':
					// Use a single string in case of multiple pts
				attObject.value = defVal || '';
				break;
			case 'Image':
				attObject.value = defVal || '';
				break;
			case 'Link To':
				attObject.value = defVal || '';
				break;
			case 'SoundCloud':
				attObject.value = defVal || '';
				break;
			case 'YouTube':
				attObject.value = defVal || '';
				break;
			case 'Transcript':
				attObject.value = defVal || '';
				break;
			case 'Timecode':
				attObject.value = defVal || '';
				break;
			case 'Pointer':
				attObject.value = defVal || '';
				break;
			case 'Join':
				attObject.value = defVal || '';
				break;
			} // switch
			rApp.push('defRecord', attObject);
		});
	} // fillRecordFromTemplate()

		// Create our main App Ractive instance with wrapped jQueryUI components
	rApp = new Ractive({
		el: '#ractive-output',
		template: '#ractive-base',
		data: {
			recID: recID,
			recType: recType,
			defAtts: defAtts,
			defRecord: defRecord,
			defTemplates: defTemplates,
			canGeoLoc: canGeoLoc
		},
		components: {
		}
	});

		// Set Record's initial default Attributes
	fillRecordFromTemplate(recType);

	rApp.observe('recType', function (newValue, oldValue, keypath) {
			// Non-initial change
		if (typeof(oldValue) !== 'undefined') {
			rApp.set('defRecord', []);
			fillRecordFromTemplate(newValue);
		}
	});

	rApp.on('clearVocab', function(event, index) {
		rApp.set('defRecord['+index+'].value', '');
		return false;
	});

		// Add a vocabulary term to a value list
	rApp.on('addVocab', function(event, index) {
		var theRec, newVal;

		theRec = rApp.get('defRecord['+index+']');
			// Only Add if pre-existing value and delimiter allows multiple values
		if (theRec.value.length && theRec.def.d.length)
			newVal = theRec.value + theRec.def.d + theRec.lgndSel;
		else
			newVal = theRec.lgndSel;
		rApp.set('defRecord['+index+'].value', newVal);
		return false;
	});

		// Pop up modal with all IDs of this Template type
	rApp.on('giveHint', function(event, index) {
		var theRec = rApp.get('defRecord['+index+']');
		messageModal(theRec.def.h);
		return false;
	});

		// Set Lat-Lon coordinate to current geo location
	rApp.on('setHere', function(event, index) {
		navigator.geolocation.getCurrentPosition(function(pos) {
			var newVal = pos.coords.latitude.toString() + "," + pos.coords.longitude.toString();
			rApp.set('defRecord['+index+'].value', newVal);
		});
		return false;
	});

		// Pop up modal with all IDs of some Template type, and then choose Record ID
		// TO DO: Handle case of no Records of chosen Template type
	rApp.on('getPointerIDs', function(event, index) {
		var tmpltList = [];
		_.forEach(defTemplates, function(theTemplate) { tmpltList.push(theTemplate.id); });

		var tmpltDialog = new Ractive({
			el: '#insert-dialog',
			template: '#dialog-choose-list',
			data: {
				list: tmpltList,
				loading: false,
				selIndex: 0
			},
			components: {
				dialog: RJDialogComponent
			}
		}); // new Ractive()

		tmpltDialog.on('doSelect', function(event, index) {
			tmpltDialog.set('selIndex', index);
			return false;
		});
		tmpltDialog.on('dialog.ok', function() {
			var tIndex = tmpltDialog.get('selIndex');
			tmpltDialog.teardown();

			recDialog = new Ractive({
				el: '#insert-dialog',
				template: '#dialog-choose-list',
				data: {
					list: [],
					loading: true,
					selIndex: 0
				},
				components: {
					dialog: RJDialogComponent
				}
			}); // new Ractive()

			recDialog.on('doSelect', function(event, index) {
				recDialog.set('selIndex', index);
				return false;
			});
			recDialog.on('dialog.ok', function() {
				if (!recDialog.get('loading')) {
					var selIndex = recDialog.get('selIndex');
					var newID = recDialog.get('list['+selIndex+']');
					rApp.set('defRecord['+index+'].value', newID);
				}
				recDialog.teardown();
				return false;
			});
			recDialog.on('dialog.cancel', recDialog.teardown);

				// AJAX call to get list of Record IDs
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_get_rec_ids',
					tmplt_id: tmpltList[tIndex]
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					recDialog.set('list', JSON.parse(data));
					recDialog.set('loading', false);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			}); // ajax

			return false;
		});
		tmpltDialog.on('dialog.cancel', tmpltDialog.teardown);

		return false;
	});

		// Pop up modal with all IDs of Joined Template type
	rApp.on('getJoinIDs', function(event, index) {
		var theRec = rApp.get('defRecord['+index+']');
		var thisTemplate = getTemplate(rApp.get('recType'));
			// Now find Template ID in join for this Attribute ID
		var joinRec = _.find(thisTemplate.j, function(theJoin) { return theJoin.id == theRec.id; });
		if (joinRec) {
			var modalDialog = new Ractive({
				el: '#insert-dialog',
				template: '#dialog-choose-list',
				data: {
					list: [],
					loading: true,
					selIndex: 0
				},
				components: {
					dialog: RJDialogComponent
				}
			}); // new Ractive()

			modalDialog.on('doSelect', function(event, index) {
				modalDialog.set('selIndex', index);
				return false;
			});
			modalDialog.on('dialog.ok', function() {
				if (!modalDialog.get('loading')) {
					var selIndex = modalDialog.get('selIndex');
					var newID = modalDialog.get('list['+selIndex+']');
					rApp.set('defRecord['+index+'].value', newID);
				}
				modalDialog.teardown();
				return false;
			});
			modalDialog.on('dialog.cancel', modalDialog.teardown);

				// AJAX call to get list of Record IDs
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_get_rec_ids',
					tmplt_id: joinRec.t
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					modalDialog.set('list', JSON.parse(data));
					modalDialog.set('loading', false);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			});
		}

		return false;
	});

	rApp.on('saveRecord', function() {
		var newRecID = rApp.get('recID').trim();
		if (newRecID.length > 32) {
			displayError('#errmsg-id');
			return false;
		}

		var newAttVals = { };
		var numAtts = rApp.get('defRecord.length');
		var i;

			// Check for errors and convert to single string if necessary
		for (i=0; i<numAtts; i++) {
			var thisAtt = rApp.get('defRecord['+i+']');
			var newVal = thisAtt.value;

				// Only need special processing for Numbers and Dates
			switch (thisAtt.def.t) {
			case 'Number':
				if (newVal < thisAtt.def.r.min || newVal > thisAtt.def.r.max) {
					displayError('#errmsg-number-range');
					return false;
				}
				newVal = newVal.toString();
				break;
			case 'Dates':
					// TO DO: Range check
				var newDate = newVal.min.y;
				if (newVal.min.m && newVal.min.m != '') {
					newDate += '-'+newVal.min.m;
					if (newVal.min.d && newVal.min.d != '')
						newDate += '-'+newVal.min.d;
				}
				if (newVal.max.y && newVal.max.y != '') {
					newDate += '/'+newVal.max.y;
					if (newVal.max.m && newVal.max.m != '') {
						newDate += '-'+newVal.max.m;
						if (newVal.max.d && newVal.max.d != '')
							newDate += '-'+newVal.max.d;
					}
				}
				newVal = newDate;
				break;
			} // switch type
			newAttVals[thisAtt.id] = newVal;
		}

			// Insert values into hidden fields if no problems
		jQuery('input[name="prsp_rec_id"]').val(newRecID);
		jQuery('input[name="prsp_tmplt_id"]').val(rApp.get('recType'));
		var encodedVals = JSON.stringify(newAttVals);
		jQuery('textarea[name="prsp_rec_atts"]').val(encodedVals);

// console.log("RecAtts: "+encodedVals);
// console.log("size: "+encodedVals.length);
		return false;
	});
}); // ready