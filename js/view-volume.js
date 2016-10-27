// This file contains:
//		PViewFrame Objects
//		Immediately Invoked Function Expression for launching processes and organizing screen

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Volume definition { id, g, vf, i }
//				m = overlay map data

	// GLOBAL CONSTANTS

	// GLOBAL VARS
var volURL;

var tour, tourTxt, tourTOC;

var widgetData = {			// Widget state has to be global because YouTube API calls global function
							// Therefore code cannot rely upon closure to know state of widget data
	ytLoaded: false,			// YouTube not initially loaded
	ytCall: null,				// function to call once YouTube loaded
	ytCode: null, 				// YouTube code to video to play
	timer: null,				// Timer function for polling playhead
	extract: null,				// String of transcript extract timecodes
	sTime: null,				// start time for any extract in milliseconds
	eTime: null,				// end time for any extract in milliseconds
	playing: false,				// true if widget currently playing
	widget: null,				// JS playback widget object
	xscriptOn: false,			// Transcript showing
	tcArray: null,				// Array of timecode records { s[tart], e[nd] } in milliseconds
	tcIndex: -1 				// Index of playhead in tcArray
};

// ===================================================================================
// PViewFrame: An abstract class to subclassed by PTextFrame and PVizFrame
//			PViewFrame manages internal view and communicates changes
//
//			Instance Methods
//			----------------
//			getFrameID() = Return ID of Frame's outermost DIV container
//			setSel(sel) = array of absI of selected Records from external source (ideal)
//			selBtns(enable) = set state of Show Selection button
//			initDOM = initialize internal DOM
//			openSelection()
//
//			Subclasses must implement
//			-------------------------
//			clearSel() = clear the current selection
//			addSel(absI) = external request to add to selected Record in the frame
//			delSel(absI) = external request to remove from selected Record in the frame


function PViewFrame(vfIndex, callbacks)
{
	this.vfIndex	= vfIndex;
	this.callbacks	= callbacks;	// callback functions { addSel, delSel, newText }
	this.vizSel 	= [];			// array of absIs of selected Records that are visible in this frame
	this.selAbsIs	= [];			// array of absIs of selected Records requested externally
	this.curSelSize = 0;			// the size of current selection
	this.inspRec	= null;			// if ≠ null, Record to open on in Inspector
} // PViewFrame()

PViewFrame.prototype.getFrameID = function()
{
	return '#view-frame-'+this.vfIndex;
} // getFrameID()

	// PURPOSE: Inform ViewFrame of selection change, update GUI
	// INPUT:	selList = array of absIDs, or [] if nothing selected
	//			if force, then GUI always refreshed
	// NOTES:	Not useful to save pointer to selList, as it will be modified in other code
PViewFrame.prototype.upSel = function(selList, force)
{
	var newSize = selList.length;

	if (force || this.curSelSize > 0 || newSize > 0) {
		var vCnxt = jQuery(this.getFrameID()+' div.view-controls');
		var selDiv = jQuery(this.getFrameID()+' div.sellist > div.sellist-scroll');
		var txt = newSize + ' ' + dlText.selected;
		vCnxt.find('.btn-num-sel').text(txt);

		selDiv.empty();
		if (newSize > 0) {
			vCnxt.find('.osel').button("enable");
			vCnxt.find('.osel').addClass("pulse");
			vCnxt.find('.xsel').button("enable");
			selList.forEach(function(absI) {
				var r = PData.rByN(absI);
				selDiv.append('<div class="sellist-rec" data-id="'+r.id+'">'+r.l+'</div>');
			});
		} else {
			vCnxt.find('.osel').button("disable");
			vCnxt.find('.osel').removeClass("pulse");
			vCnxt.find('.xsel').button("disable");
		}
	}
	this.curSelSize = newSize;
} // upSel

	// PURPOSE: Open Record Inspector for current selection
PViewFrame.prototype.openSelection = function()
{
	var self=this;

	var container = jQuery('#inspect-content');
	var avAttID=null;	// ID of any A/V widget or null
	var avType=0;		// 0=none, 1=SoundCloud, 2=YouTube, 3=Native Audio
	var t2URL;			// URL for transcript 2 or null
		// Set default size -- change acc to widget settings & overrides
	var w=450;
	var h=400;
	var parseTC = /(\d\d)\:(\d\d)\:(\d\d)\.(\d\d?)/; 	// precise regular expression for parsing timecodes

	function tTrim(str)
	{
		return str.replace(/^[ \f\t\v​]+|[ \f\t\v​]+$/g, '');
	}
		// PURPOSE: Convert timecode string into # of milliseconds
		// INPUT:   timecode must be in format [HH:MM:SS] or [HH:MM:SS.ss]
		// ASSUMES: timecode in correct format, parseTC contains compiled RegEx
	function tcToMilliSecs(tc)
	{
		var milliSecs = new Number();
		var match = parseTC.exec(tc);
		if (match !== null) {
			milliSecs = (parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3])) * 1000;
				// The multiplier to use for last digits depends on if it is 1 or 2 digits long
			if (match[4].length == 1) {
				milliSecs += parseInt(match[4])*100;
			} else {
				milliSecs += parseInt(match[4])*10;
			}
		} else {
			throw new Error("Error in transcript file: Cannot parse " + tc + " as timecode.");
			milliSecs = 0;
		}
		return milliSecs;
	} // tcToMilliSecs()

		// PURPOSE: Format the second transcript (use first one's timecodes)
	function formatXscript2(text, xtbl)
	{
		var splitXcript = new String(text);
			// AJAX server request processes any extract
		splitXcript = tTrim(splitXcript).split(/\r\n|\r|\n/g);

		var ta = [];

		if (splitXcript) {
			var tb;
			var ti = 0;
			_.each(splitXcript, function(val) {
					// Skip values with line breaks...basically empty items
				val = tTrim(val);
				if (val.length>0) {
					if (val.charAt(0) === '[') {
						if (ti>0) {
							ta.push(tb);
						}
						tb='';
					} else {
						if (tb.length > 0)
							tb += '<br/>';
						tb += val;
					}
					ti++;
				}
			});
		}

			// Loop thru HTML for left-side transcript and add right-side text
		 _.each(ta, function(val, ti) {
			xtbl.find('div.timecode[data-tcindex="'+ti+'"]').next().after('<div class="xscript">'+val+'</div>');
		 });
	} // formatXscript2()

		// PURPOSE: Format the first transcript (with its timecodes)
	function formatXscript1(text)
	{
			// empty time code array -- each entry has start & end
		widgetData.tcArray = [];
		widgetData.tcIndex = -1;
		var tcs = widgetData.tcArray;

			// split transcript text into array by line breaks
		var splitXcript = new String(text);
			// Server request processes any extract
		splitXcript = tTrim(splitXcript).split(/\r\n|\r|\n/g);

		if (splitXcript) {
			var xtbl = jQuery('#xscript-tbl');
			var tcI = 0;
			var timeCode, lastCode=0, lastStamp=0;
			var tb='';		// Text block being built
			_.each(splitXcript, function(val) {
					// Each entry is (1) empty/line break, (2) timestamp, or (3) text
				val = tTrim(val);
					// Skip empty entries, which were line breaks
				if (val.length>1) {
						// Encountered timestamp -- compile previous material, if any
					if (val.charAt(0) === '[' && (val.charAt(1) >= '0' && val.charAt(1) <= '9'))
					{
						timeCode = tcToMilliSecs(val);
						if (tb.length > 0) {
								// Append timecode entry once range is defined
							if (lastStamp) {
								tcs.push({ s: lastCode, e: timeCode });
							}
							xtbl.append('<div class="row"><div class="timecode" data-timecode="'+
								lastCode+'" data-tcindex="'+tcI++ +'">'+lastStamp+'</div><div class="xscript">'+tb+'</div></div>');
							tb = '';
						}
						lastStamp = val;
						lastCode = timeCode;

						// Encountered textblock
					} else {
						if (tb.length > 0)
							tb += '<br/>';
						tb += val;
					}
				} // if length
			}); // _each
				// Handle any dangling text
			if (tb.length > 0) {
					// Append very large number to ensure can't go past last item! 9 hours * 60 minutes * 60 seconds * 1000 milliseconds
				tcs.push({ s: lastCode, e: 32400000 });
				xtbl.append('<div class="row"><div class="timecode" data-timecode="'+
					lastCode+'" data-tcindex="'+tcI+'">'+lastStamp+'</div><div class="xscript">'+tb+'</div></div>');
			}
				// Is there is a 2nd transcript? Load it so it is appended to this set
			if (typeof t2URL !== 'undefined' && t2URL != null) {
				jQuery.ajax({
					type: 'POST',
					url: prspdata.ajax_url,
					data: {
						action: 'prsp_get_transcript',
						transcript: t2URL,
						excerpt: widgetData.extract
					},
					success: function(data, textStatus, XMLHttpRequest) {
						formatXscript2(JSON.parse(data), xtbl);
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
					   alert(errorThrown);
					}
				});
			}
		} // if (split)
	} // formatXscript1()

		// PURPOSE: Update the timecode playhead if changed from last update
	function highlightXscript(ms)
	{
		var match;
		var oldI = widgetData.tcIndex;

		_.find(widgetData.tcArray, function(tc, tcI) {
			match = (tc.s <= ms && ms < tc.e);
			if (match && tcI != oldI) {
					// Should we synchronize audio and text transcript?
				var xt = jQuery('#xscript-tbl');
				if (document.getElementById("sync-xscript").checked) {
					var tsEntry = xt.find('[data-tcindex="'+tcI+'"]');
					var topDiff = tsEntry.offset().top - xt.offset().top;
					var scrollPos = xt.scrollTop() + topDiff;
					xt.animate({ scrollTop: scrollPos }, 300);
				}
				if (oldI != -1)
					xt.find('[data-tcindex="'+oldI+'"]').removeClass('current');
				xt.find('[data-tcindex="'+tcI+'"]').addClass('current');
				widgetData.tcIndex = tcI;
			}
			return match;
		});
	} // highlightXscript()

		// PURPOSE: Called by global function once YouTube API loaded
	function ytActivate()
	{
		function ytStateChange(event)
		{
			var curPos;

			switch (event.data) {
			case 1: // YT.PlayerState.PLAYING
				widgetData.playing = true;
				if (widgetData.timer == null) {
						// YouTube playback heartbeat
					widgetData.timer = setInterval(function() {
							// Need to convert to milliseconds
						curPos = widgetData.widget.getCurrentTime() * 1000;
							// Keep within bounds of excerpt is done automatically by cue function
							// If there is a transcript, highlight current section
						if (widgetData.playing && widgetData.xscriptOn) {
							highlightXscript(curPos);
						}
					}, 300);    // .3 second heartbeat
				}
				break;
			case 0: // YT.PlayerState.ENDED
			case 2: // YT.PlayerState.PAUSED
				widgetData.playing = false;
				window.clearInterval(widgetData.timer);
				widgetData.timer = null;
				break;
			case 3: // YT.PlayerState.BUFFERING
			case 5: // YT.PlayerState.CUED
				widgetData.playing = false;
				break;
			} // switch event
		} // ytStateChange()

		widgetData.widget = new YT.Player('yt-widget', {
			width: w-40, height: Math.floor(((w-40)*9)/16),
			videoId: widgetData.ytCode,
			events: {
				onError: function(event) { console.log("YouTube Error: "+event.data); },
				onStateChange: ytStateChange,
				onReady: function() {
						// If this is to play an excerpt, specify time bounds now (in seconds)
					if (widgetData.extract) {
						widgetData.widget.cueVideoById(
							{   videoId: widgetData.ytCode,
								startSeconds: (widgetData.sTime/1000),
								endSeconds: (widgetData.eTime/1000)
							});
					}
				}
			}
		});
	} // ytActivate()

		// Need to define native audio eventListeners here for add and remove
		// ==================
	function naWidgetPlaying()
	{
		widgetData.playing = true;
	}
	function naWidgetStopped()
	{
		widgetData.playing = false;
	}
	function naWidgetUpdate()
	{
		if (widgetData.playing && widgetData.xscriptOn) {
			highlightXscript(widgetData.widget.currentTime * 1000);
		}
	}

		// Inspector will either close or move to next Record -- remove all listeners, etc
	function unplugAllWidgets()
	{
			// Stop any A/V playing
		switch(avType) {
		case 3:
			if (widgetData.widget != null) {
				widgetData.widget.removeEventListener("ended", naWidgetStopped);
				widgetData.widget.removeEventListener("pause", naWidgetStopped);
				widgetData.widget.removeEventListener("playing", naWidgetPlaying);
				widgetData.widget.removeEventListener("timeupdate", naWidgetUpdate);
			}
		case 1:
			if (widgetData.widget != null && widgetData.playing)
				widgetData.widget.pause();
			widgetData.playing = false;
			widgetData.widget = null;
			break;
		case 2:
				// Prevent invoking player if code called after modal closed
			widgetData.ytCall = null;
				// Silence YouTube player if modal closed in another way
			if (widgetData.widget != null && widgetData.playing)
				widgetData.widget.stopVideo();
			widgetData.widget = null;
			widgetData.playing = false;
			if (widgetData.timer != null) {
				window.clearInterval(widgetData.timer);
				widgetData.timer = null;
			}
			break;
		} // switch
	} // unplugAllWidgets()

	var recSel=null;

	recSel = this.vizSel;
	if (recSel == null || recSel.length === 0)
		return;

	var inspector;
	var rec;
	var i=0;		// Index of item to show in Inspector from selection

	function inspectShow()
	{
		var recAbsI = recSel[i];
		rec = PData.rByN(recAbsI);
		var title = ' '+rec.l+' ('+(i+1)+'/'+recSel.length+') ';
		var nameDOM = jQuery('#inspect-name');
		nameDOM.text(title);
		nameDOM.prop('title', rec.id);
			// Which template type?
		var tI = PData.n2T(recAbsI);

			// PURPOSE: Prepare start and end times for extract if any
			// ASSUMES: Any timecode given contains both start and end separated by "-"
		function getSETimes()
		{
			widgetData.sTime = widgetData.eTime = null;
			var tcAttID;
			if (tcAttID = prspdata.e.i.t.tcAtts[tI]) {
				var tcAttVal = rec.a[tcAttID];

				if (tcAttVal && tcAttVal !== '') {
					widgetData.extract = tcAttVal;
					var tcs = tcAttVal.split('-');
					widgetData.sTime = tcToMilliSecs(tcs[0]);
					widgetData.eTime = tcToMilliSecs(tcs[1]);
				}
			}
		} // getSETimes()

		container.empty();
			// Handle Inspector widgets
		avAttID=null; avType=0;
		widgetData.extract=null;
		widgetData.xscriptOn=false;
		widgetData.playing=false;

			// Audio widget?
		if (prspdata.e.i.modal.scOn || (typeof prspdata.e.i.modal.aOn === 'boolean' && prspdata.e.i.modal.aOn)) {
			if (avAttID = prspdata.e.i.sc.atts[tI]) {
				var scAttVal;
				if (scAttVal = rec.a[avAttID]) {
					getSETimes();
						// Is this a URL to SoundCloud?
					if (scAttVal.match(/soundcloud\.com/)) {
						avType=1;
						container.append('<iframe id="sc-widget" class="player" width="100%" height="110" src="//w.soundcloud.com/player/?url='+
							scAttVal+'"></iframe>');

							// Must set these variables after HTML appended above
						var playWidget = SC.Widget(document.getElementById('sc-widget'));
						widgetData.widget = playWidget;
							// Setup SoundCloud player after entire sound clip loaded
						playWidget.bind(SC.Widget.Events.READY, function() {
							playWidget.bind(SC.Widget.Events.PLAY, function() {
								widgetData.playing = true;
							});
							playWidget.bind(SC.Widget.Events.PAUSE, function() {
								widgetData.playing = false;
							});
							playWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(params) {
									// Keep within bounds if only excerpt of longer transcript
								if (widgetData.extract) {
									if (params.currentPosition < widgetData.sTime) {
										playWidget.seekTo(widgetData.sTime);
									} else if (params.currentPosition > widgetData.eTime) {
										playWidget.pause();
										widgetData.playing = false;
									}
								}
								if (widgetData.playing && widgetData.xscriptOn) {
									highlightXscript(params.currentPosition);
								}
							});
								// Can't seek within the SEEK event because it causes infinite recursion
							playWidget.bind(SC.Widget.Events.FINISH, function() {
								widgetData.playing = false;
							});
						});
					} else {	// Use "native" audio
						avType=3;
							// If there is timecode extract, need to append to URL
						if (widgetData.extract) {
							var tcs = widgetData.extract.split('-');
							scAttVal += '#t='+tcs[0]+','+tcs[1];
						}
						container.append('<audio id="na-widget" controls src="'+scAttVal+'"></audio>');
						widgetData.widget = document.getElementById('na-widget');
						widgetData.widget.addEventListener("ended", naWidgetStopped);
						widgetData.widget.addEventListener("pause", naWidgetStopped);
						widgetData.widget.addEventListener("playing", naWidgetPlaying);
						widgetData.widget.addEventListener("timeupdate", naWidgetUpdate);
					}
				} // if scAttVal
			} // if avAttID
		} // if scOn

			// YouTube video widget?
		if (avType === 0 && prspdata.e.i.modal.ytOn) {
			if (avAttID = prspdata.e.i.yt.atts[tI]) {
				var ytAttVal = rec.a[avAttID];
				if (ytAttVal) {
					getSETimes();
					widgetData.ytCode = ytAttVal;

					container.append('<div id="yt-widget"></div>');

						// YouTube API is only loaded once but must handle race condition:
						//	Inspector modal can be closed before video fully loaded
					widgetData.ytCall = ytActivate;
					if (!widgetData.ytLoaded) {
						widgetData.ytLoaded = true;

							// Create a script DIV that will cause API to be loaded
						var tag = document.createElement('script');
						tag.src = "https://www.youtube.com/iframe_api";
						var scriptTag = document.getElementsByTagName('script')[0];
						scriptTag.parentNode.insertBefore(tag, scriptTag);
							// wait for hook invocation to set playWidget and bind handlers
					} else
						ytActivate();

					avType=2;
				}
			} // if avAttID
		} // if ytOn

			// Transcription widget?
		if (prspdata.e.i.modal.tOn) {
			var t1AttID = prspdata.e.i.t.t1Atts[tI];
				// Is there a 1st transcript Attribute?
			if (t1AttID && t1AttID !== '' && t1AttID !== 'disable') {
				var t1URL = rec.a[t1AttID];
				if (typeof t1URL === 'string' && t1URL !== '') {
						// Add synchronize button if both A/V and Transcript
					if (avType > 0) {
						container.append('<div>'+document.getElementById('dltext-sync-xscript').innerHTML+'</div>');
					}
					container.find('#xscript-tbl').remove();
					container.append('<div id="xscript-tbl"></div>');
					widgetData.xscriptOn=true;
						// Handle clicks on timecodes
					jQuery('#xscript-tbl').click(function(evt) {
						if (avType && jQuery(evt.target).hasClass('timecode')) {
							var seekTo = jQuery(evt.target).data('timecode');
							switch (avType) {
							case 1:
								widgetData.widget.seekTo(seekTo);
								if (!widgetData.playing) {
									widgetData.widget.play();
								}
								break;
							case 2:
								if (!widgetData.playing) {
									widgetData.playing = true;
									widgetData.widget.playVideo();
								}
									// YouTube player takes seconds (rather than milliseconds)
								widgetData.widget.seekTo(seekTo/1000);
								break;
							case 3:
								if (!widgetData.playing) {
									widgetData.playing = true;
									widgetData.widget.play();
								}
								widgetData.widget.currentTime = seekTo/1000;
								break;
							}
						}
					});

						// Is there a 2nd transcript Attribute?
						// Set up for 1st to load when complete
					t2URL=null;
					var t2AttID = prspdata.e.i.t.t2Atts[tI];
					if (t2AttID && t2AttID !== '' && t2AttID !== 'disable') {
						t2URL = rec.a[t2AttID];
					}

					jQuery.ajax({
						type: 'POST',
						url: prspdata.ajax_url,
						data: {
							action: 'prsp_get_transcript',
							transcript: t1URL,
							excerpt: widgetData.extract
						},
						success: function(data, textStatus, XMLHttpRequest) {
							formatXscript1(JSON.parse(data));
						},
						error: function(XMLHttpRequest, textStatus, errorThrown) {
						   alert(errorThrown);
						}
					});
				} // t1URL
			} // if t1AttID
		} // if tOn

			// Show all Attribute content data
		prspdata.e.i.modal.atts[tI].forEach(function(attID) {
			var attVal = PData.rAV(recAbsI, attID, false);
			if (attVal) {
				var theAtt = PData.aByID(attID);
				var html;
					// Special case - Labels that begin with underscore are "invisible"
				if (theAtt.def.l.charAt(0) == '_')
					html = '<div>'+attVal+'</div>';
				else {
					html = '<div><span class="att-label">'+theAtt.def.l+':</span> ';
						// Begin images on next line
					if (theAtt.def.t == 'I')
						html += '<br/>';
					html += attVal+'</div>';
				}
				container.append(html);
			}
		});
	} // inspectShow()

	function inspectSlide(diff)
	{
		var newI = i+diff;
		if (newI == -1)
			newI = recSel.length-1;
		else if (newI == recSel.length)
			newI = 0;

		if (newI != i) {
			i = newI;
			unplugAllWidgets();
			inspectShow();
			jQuery('#inspect-list').val(i);
		}
	} // inspectSlide()

	function inspectLeft(event)
	{
		inspectSlide(-1);
	}
	function inspectRight(event)
	{
		inspectSlide(1);
	}

	if (prspdata.e.i.modal.scOn)
	{
		w=550;
	} // if SoundCloud

	if (prspdata.e.i.modal.ytOn)
	{
		w=Math.max(w,475);
		h=500;
	} // if YouTube

	if (prspdata.e.i.modal.tOn)
	{
		h+=100;
		if (prspdata.e.i.modal.t2On) {
			w = Math.max(750, Math.floor(jQuery(document).width()*.80));
			w = Math.min(900, w);
		} else
			w=Math.max(w,550);
	} // if Transcriptions

	if (typeof prspdata.e.i.modal.w === 'number') {
		w=prspdata.e.i.modal.w;
	}
	if (typeof prspdata.e.i.modal.h === 'number') {
		h=prspdata.e.i.modal.h;
	}

		// Stop pulsing while Inspector open
// 	this.selBtns(false);

		// Handle scroll buttons
	jQuery('#btn-inspect-left').click(inspectLeft);
	jQuery('#btn-inspect-right').click(inspectRight);
	jQuery('#inspect-list').change(function() {
		i = jQuery('#inspect-list').val();
		i = parseInt(i);
		unplugAllWidgets();
		inspectShow();
	});

		// Build drop-down list -- check for selected item as we build
	for (var j=0; j<recSel.length; j++) {
		var r = PData.rByN(recSel[j]);
		jQuery('#inspect-list').append('<option value='+j+'>'+r.l+'</option>');
		if (this.inspRec && r.id === this.inspRec) {
			i=j;
			jQuery('#inspect-list').val(j);
		}
	}
		// Clear target item by default
	this.inspRec=null;

	inspectShow();

	var btns = [{
		text: dlText.findintext,
		click: function() {
			self.callbacks.textFrame.findRec(rec.id);
		}
	}];

		// Handle setting if undefined
	if (typeof prspdata.e.i.srOff === 'undefined' || !prspdata.e.i.srOff) {
		btns.push({
			text: dlText.seerec,
			click: function() { window.open(prspdata.site_url+'?p='+rec.wp, '_blank'); }
		});
	}

	btns.push({
		text: dlText.close,
		click: function() { inspector.dialog("close"); } // click
	});

	inspector = jQuery("#dialog-inspector").dialog({
		dialogClass: "no-close",
		width: w,
		height: h,
		modal: true,
		buttons: btns
	});

	inspector.on("dialogclose", function(event, ui) {
		unplugAllWidgets();
		jQuery('#btn-inspect-left').off("click");
		jQuery('#btn-inspect-right').off("click");
		jQuery('#inspect-list').off("change");
		jQuery('#inspect-list').empty();
			// turn pulsing back on
//		self.selBtns(true);
			// Unbind Inspector from this view -- one off only
		inspector.off("dialogclose");
	});
} // openSelection()


// ===================================================================================
// PVizFrame: Object that manages contents of visualization frame (always view-frame-1)
//
//			Instance Methods
//			----------------
//			getIndex()
//			setLDirty(s)
//			selectChangeViz()
//			computeSel()
//			createViz(selIndex, refresh)
//			setLegendFeatures(lIndex, attID)
//			setViz(vI, refresh)
//			getSelLocAtts(tIndex)
//			getSelFeatAtts(tIndex)
//			getSelLegend(tIndex)
//			getLgndSels()
//			setLgndSels(attIDs)
//			getState()
//			setState(state)
//			showStream(stream)
//			setStream(stream)
//			clearSel()
//			setSel(selList)
//			addSel(absI)
//			delSel(absI)
//			vizAddSel(absI)
//			vizDelSel(absI)
//			resize()
//			title()
//			flushLgnd()
//			getBMData()

var PVizFrame = function(vfIndex, callbacks)
{
	this.autoUpdate=false;		// Does viz immediately refresh itself after user interaction?
	this.lDirty = null;			// Legend Dirty (visualization needs refresh) if true
	this.vizSelIndex = 0;		// index of currently selected Viz
	this.vizModel = null;		// PVizModel currently in frame
	this.legendIDs = [];		// Attribute IDs of Legend selections (one per Template)
	this.datastream = null;		// pointer to datastream given to view

	this.vizStates = [];
		// Create array for saving state of visualizations as user switches between them
	for (var i=0; i<prspdata.e.vf.length; i++) {
		this.vizStates.push(null);
	}

	PViewFrame.call(this, vfIndex, callbacks);
} // PVizFrame()

PVizFrame.prototype = Object.create(PViewFrame.prototype);

PVizFrame.prototype.constructor = PViewFrame;

PVizFrame.prototype.getIndex = function()
{
	return 1;
} // getIndex()

	// PURPOSE: Set Legend Dirty flag to true or false
PVizFrame.prototype.setLDirty = function(s)
{
	if (this.autoUpdate) {
		if (s) {
			this.upSel([], false);	// Re-render always clears selection
			if (this.vizModel && this.datastream) {
				this.vizModel.render(this.datastream);
			}
		}
		this.lDirty=false;			// Legend is always left "clean"
	} else {
		if (s !== this.lDirty) {
			this.lDirty=s;
			jQuery('#view-frame-1 div.lgnd-container div.lgnd-handle button.lgnd-update').prop('disabled', !s);
		}
	}
} // setLDirty

PVizFrame.prototype.selectChangeViz = function()
{
	var selector = jQuery('#view-frame-1 div.view-controls select.view-viz-select option:selected');
	var newSelIndex   = selector.val();
	this.createViz(newSelIndex, true);
	this.computeSel();
} // selectChangeViz()

	// PURPOSE: Check selAbsI against Records shown in view, update view
PVizFrame.prototype.computeSel = function()
{
	this.vizSel=[];

	if (this.vizModel == null) {
		return;
	}

	if (this.selAbsIs.length === 0) {
		this.vizModel.clearSel();
		this.upSel([], false);
		return;
	}

	var vizSel=[];

		// Can't complete if viz has not rendered
	if (typeof this.vizModel.rMap === 'undefined' || this.vizModel.rMap == null) {
		return;
	}
	var r = this.vizModel.rMap;

	this.selAbsIs.forEach(function(absI) {
		if (r[absI >> 4] & (1 << (absI & 15))) {
			vizSel.push(absI);
		}
	});
	this.vizSel = vizSel;

	if (vizSel.length === 0) {
		this.vizModel.clearSel();
	} else {
		this.vizModel.setSel(vizSel);
	}
	this.upSel(vizSel, false);
} // computeSel()

PVizFrame.prototype.initDOM = function(vI)
{
	var self=this;

	function clickShowHideLegend(event)
	{
		if (self.vizModel.flags() & V_FLAG_LGND) {
			jQuery('#view-frame-1 div.lgnd-container').toggle('slide', { direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizControls(event)
	{
		if (self.vizModel) {
			self.vizModel.doOptions();
		}
		event.preventDefault();
	} // clickVizControls()

		// PURPOSE: Hide/show visualization-specific hint notes
	function clickVizNotes(event)
	{
		var d = jQuery("#dialog-vnotes").dialog({
			dialogClass: "no-close",
			width: 300,
			height: 300,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						d.dialog("close");
					}
				}]
		});
		event.preventDefault();
	} // clickVizNotes()

	function clickHighlight(event)
	{
			// Send signal back to Prospect "main app" to create Highlight filter on this viz
		jQuery("body").trigger("prospect", { s: "hilite", v: 1, t: self.vizModel.tUsed });
		event.preventDefault();
	} // clickHighlight()


		// PURPOSE: Turn on or off all feature Attributes for tmpltIndex
	function doShowHideAll(tmpltIndex, show)
	{
		jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', show);
		self.setLDirty(true);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
		self.setLDirty(true);
	} // doLocateSelect()


		// PURPOSE: Make lID the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
			// Deselect everything
		jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate input.lgnd-entry-check').prop('checked', false);
			// Just reselect this one
		jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate[data-id="'+lID+'"] input.lgnd-entry-check').prop('checked', true);
		self.setLDirty(true);
	} // doLocateSelect()

		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
		self.setLDirty(true);
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
			// Deselect everything
		jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', false);
			// Just select this one
		jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group div.lgnd-value[data-index="'+vIndex+
								'"] input.lgnd-entry-check').prop('checked', true);
		self.setLDirty(true);
	} // doFeatureSelectOnly()

		// PURPOSE: Handle click anywhere on Legend
	function clickInLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'lgnd-update':
			if (self.vizModel && self.datastream) {
				self.vizModel.render(self.datastream);
				self.computeSel();
				self.setLDirty(false);
			}
			break;
			// Turn on or off just this one value
		case 'lgnd-entry-check':
			var lEntry = jQuery(event.target).closest('div.lgnd-entry');
			var isChecked = jQuery(event.target).is(':checked');
				// What does checkbox belong to?
			if (lEntry.hasClass('lgnd-sh'))
				doShowHideAll(tmpltIndex, isChecked);
				// A locate Attribute?
			else if (lEntry.hasClass('lgnd-locate'))
				doLocateSelect(tmpltIndex, lEntry.data('id'), isChecked);
					// Must belong to a lgnd-entry
			else if (lEntry.hasClass('lgnd-value'))
				doFeatureSelect(tmpltIndex, lEntry.data('index'), isChecked);
			break;

			// Make this only selected feature attribute
		case 'lgnd-viz':
		case 'lgnd-value-title': 		// Title used for both locate and feature Attributes!
			var lEntry = jQuery(event.target).closest('div.lgnd-entry');
			if (lEntry.hasClass('lgnd-locate'))
				doLocateSelectOnly(tmpltIndex, lEntry.data('id'));
			else if (lEntry.hasClass('lgnd-value'))
				doFeatureSelectOnly(tmpltIndex, lEntry.data('index'));
			break;

		case 'lgnd-template':
		case 'lgnd-select':
		case '':
				// Ignore these
			break;

		default:  // could be multiple
				// Show/Hide title?
			if (clickClass.match(/lgnd-sh/i)) {
					// Simulate click
				var checkBox = jQuery(event.target).find('input.lgnd-entry-check');
				var isChecked = !checkBox.is(':checked');
				checkBox.prop('checked', isChecked);
				doShowHideAll(tmpltIndex, isChecked);
			}
			break;
		}
	} // clickInLegend()

		// PURPOSE: Handle click on item on Selection List
	function clickSelList(event)
	{
		var recID = jQuery(event.target).closest('div.sellist-rec').data('id');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'sellist-rec':
			self.inspRec=recID;
			self.openSelection();
			break;
		} // switch
		event.preventDefault();
	} // clickSelList()

		// Can assume in right view frame
	var frame = jQuery('#view-frame-1');

		// Localize color scheme?
	var clr = prspdata.bClrs.vf;
	if (clr && clr.length > 0) {
		frame.find('div.view-controls').css('background-color', clr);
	}

		// Activate drag handle on Legend
	frame.find('div.lgnd-container').draggable({ handle: frame.find('div.lgnd-handle'), containment: "parent" });

	var select = frame.find('div.view-controls select.view-viz-select');
		// Set Dropdown to View names
	prspdata.e.vf.forEach(function(theVF, i) {
		var optionStr = '<option value="'+i+'">'+theVF.l+'</option>';
		select.append(optionStr);
	});
	select.val(vI);
	select.change(function() { self.selectChangeViz(); } );

		// Hook control bar Icon buttons
	frame.find('div.view-controls button:first')
			.button({icons: { primary: 'ui-icon-battery-0' }, text: false })
			.click(clickShowHideLegend).next()
			.button({icons: { primary: 'ui-icon-battery-1' }, text: false })
			.click(clickVizControls).next()
			.button({icons: { primary: 'ui-icon-info' }, text: false })
			.click(clickVizNotes).next()
			.button({icons: { primary: 'ui-icon-signal' }, text: false })
			.click(clickHighlight).next()
			.button({icons: { primary: 'ui-icon-battery-3' }, text: false })
			.click(function(event) {
				event.preventDefault();
				self.openSelection();
			 });
	frame.find('div.lgnd-container')
		.click(clickInLegend);

		// Activate Selection List drag handle
	frame.find('div.sellist').draggable({ handle: frame.find('div.sellist > div.sellist-handle'), containment: "parent" });
		// Click on selection number brings up Selection List
	frame.find('div.view-controls > span.btn-num-sel').click(function() {
		// TO DO: Keep track of whether visible for optimizing outputting list? i.e., lazy updating
		frame.find('div.sellist').show();
	});
		// Click on close button closes Selection List
	frame.find('div.sellist > div.sellist-handle > button.sellist-close').click(function() {
		// TO DO: Keep track of whether visible for optimizing outputting list? i.e., lazy updating
		frame.find('div.sellist').hide();
	});
		// Click on item
	frame.find('div.sellist > div.sellist-scroll')
		.click(clickSelList);

	this.createViz(vI, false);

		// Intercept signals
	jQuery("body").on("prospect", function(event, data) {
		switch (data.s) {
		case "auto":
			self.autoUpdate = data.a;
			if (data.s) {	// Turn on: disable Apply button, do any outstanding updates
				jQuery('#view-frame-1 div.lgnd-container div.lgnd-handle button.lgnd-update').prop('disabled', true);
					// Any outstand updates?
				if (self.lDirty) {
					self.upSel([], false);				// Re-render always clears selection
					if (self.vizModel && self.datastream) {
						self.vizModel.render(self.datastream);
					}
					self.lDirty=false;
				}
			}
				// Note: No need to enable Apply button on Legend, as that will happen if any user actions "dirty" it
			break;
		} // switch
	});
} // initDOM()

	// PURPOSE: Set feature attributes in Legend
	// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
	//			attID = ID of feature Attribute in the Legend set
	// NOTES: 	Does not affect menu selection itself
PVizFrame.prototype.setLegendFeatures = function(lIndex, attID)
{
	var element;

	var group = jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
					lIndex+'"] div.lgnd-group');
		// Clear any previous entries
	group.empty();
	this.legendIDs[lIndex] = attID;
		// Insert new items
	var attDef = PData.aByID(attID);
		// Create pseudo-entry for undefined value
	if (typeof attDef.r.u !== 'undefined') {
		element = '<div class="lgnd-value lgnd-entry" data-index="-1"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>'+
					'<div class="lgnd-viz" style="background-color: '+attDef.r.u.v+'"> </div> <span class="lgnd-value-title">'+dlText.undef+'</span></div>';
		group.append(element);
	}
	attDef.l.forEach(function(legEntry, lgIndex) {
		element = '<div class="lgnd-value lgnd-entry" data-index="'+lgIndex+'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>'+
					'<div class="lgnd-viz" style="background-color: '+legEntry.v+'"> </div> <span class="lgnd-value-title">'+legEntry.l+'</span></div>';
		group.append(element);
		if (legEntry.z && legEntry.z.length > 0) {
			legEntry.z.forEach(function(zEntry, zIndex) {
				element = '<div class="lgnd-value lgnd-entry" data-index="'+lgIndex+','+zIndex+
							'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/>';
				if (zEntry.v && zEntry.v !== '') {
					element += '<div class="lgnd-viz" style="background-color: '+zEntry.v+'"></div>';
				} else {
					element += '<div class="lgnd-viz lgnd-viz-empty"></div>';
				}
				element += ' <span class="lgnd-value-title">&raquo; '+zEntry.l+'</span></div>';
				group.append(element);
			});
		}
	});
		// Turn on Show/Hide All by default
	jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
					lIndex+'"] div.lgnd-sh input').prop('checked', true);
} // setLegendFeatures()

	// PURPOSE: Create appropriate new VizModel within frame
	// INPUT: 	vIndex is index in Exhibit array
	//			if refresh, check for saved state and immediately redraw
	// ASSUMES:	Initially empty Record selection
PVizFrame.prototype.createViz = function(vIndex, refresh)
{
	var self=this;

	var theView = PData.vByN(vIndex);

		// PURPOSE: Handle selecting a feature Attribute for a Template from menu
	function selectTmpltAtt(event)
	{
			// Determine Template to which this refers
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var attID = jQuery(event.target).val();
		self.setLegendFeatures(tmpltIndex, attID);
		self.setLDirty(true);
	} // selectTmpltAtt()

		// Remove current viz content
	if (this.vizModel) {
			// First save visualization's state so we can return to it later
		this.vizStates[this.vizSelIndex] = this.vizModel.getState();
		this.vizModel.teardown();
		this.vizModel = null;
	}
	var frame = jQuery('#view-frame-1');

	frame.find('div.viz-content div.viz-result').empty();

	var newViz;
	switch (theView.vf) {
	case 'M':
		newViz = new VizMap(this, theView.c);
		break;
	case 'p':
		newViz = new VizMap2(this, theView.c);
		break;
	case 'C':
		newViz = new VizCards(this, theView.c);
		break;
	case 'P':
		newViz = new VizPinboard(this, theView.c);
		break;
	case 'T':
		newViz = new VizTime(this, theView.c);
		break;
	case 'D':
		newViz = new VizDirectory(this, theView.c);
		break;
	case 't':
		newViz = new VizTextStream(this, theView.c);
		break;
	case 'N':
		newViz = new VizNetWheel(this, theView.c);
		break;
	case 'n':
		newViz = new VizNetGraph(this, theView.c);
		break;
	// case 'S':
	// 	newViz = new VizStackChart(this, theView.c);
	// 	break;
	// case 'F':
	// 	newViz = new VizFlow(this, theView.c);
	// 	break;
	// case 'B':
	// 	newViz = new VizBrowser(this, theView.c);
	// 	break;
	// case 'm':
	// 	newViz = new VizMBMap(this, theView.c);
	// 	break;
	case 'b':
		newViz = new VizBMatrix(this, theView.c);
		break;
	}
	this.vizSelIndex = vIndex;
	var flags = newViz.flags();

		// Either add scroll bars to viz-content and make viz-result fit content
		//	or else give max-size to viz-result
	if (flags & V_FLAG_HSCRL) {
		frame.find('div.viz-content').addClass('h-scroll');
		frame.find('div.viz-result').addClass('viz-fit-w');
		frame.find('div.viz-result').removeClass('viz-max-w');
	} else {
		frame.find('div.viz-content').removeClass('h-scroll');
		frame.find('div.viz-result').removeClass('viz-fit-w');
		frame.find('div.viz-result').addClass('viz-max-w');
	}
	if (flags & V_FLAG_VSCRL) {
		frame.find('div.viz-content').addClass('v-scroll');
		frame.find('div.viz-result').addClass('viz-fit-h');
		frame.find('div.viz-result').removeClass('viz-max-h');
	} else {
		frame.find('div.viz-content').removeClass('v-scroll');
		frame.find('div.viz-result').removeClass('viz-fit-h');
		frame.find('div.viz-result').addClass('viz-max-h');
	}

	this.legendIDs=[];

		// Does Viz support Legend at all?
	if (flags & V_FLAG_LGND) {
		frame.find('.hslgnd').button('enable');
			// Clear out previous Legend
			// remove all previous locate Attributes
		var lgndCntr = frame.find('div.lgnd-container div.lgnd-scroll');
		lgndCntr.empty();

			// Is it just a single Legend for all Records?
		if (flags & V_FLAG_SLGND) {
			var fAttID = newViz.getFeatureAtts();
			var fAtt = PData.aByID(fAttID);
			lgndCntr.append('<div class="lgnd-template" data-index="0"><div class="lgnd-title">'+fAtt.def.l+
				'</div><div class="lgnd-entry lgnd-sh"><input type="checkbox" checked="checked" class="lgnd-entry-check"/><i>'+
				dlText.sha+'</i></div><div class="lgnd-group"></div></div>');
				// Only a single Attribute available
			this.legendIDs.push(fAttID);
			this.setLegendFeatures(0, fAttID);
		} else {
				// Create Legend sections for each Template
			var prev=false;
			prspdata.e.g.ts.forEach(function(tID, tIndex) {
				var tmpltDef = PData.tByID(tID);
					// Insert locate attributes into Legends
				var locAtts = newViz.getLocAtts(tIndex);
				if ((locAtts && locAtts.length > 0) || !(flags & V_FLAG_LOC)) {
						// Create dropdown menu of visual feature Attributes
					var fAtts = newViz.getFeatureAtts(tIndex);
						// Don't show this Template at all if no feature Atts!
					if (fAtts.length > 0) {
						if (prev)
							lgndCntr.append('<hr/>');

							// Create DIV structure for Template's Legend entry
						var newTLegend = jQuery('<div class="lgnd-template" data-index="'+tIndex+
										'"><div class="lgnd-title">'+tmpltDef.l+'</div></div>');
						if (locAtts)
							locAtts.forEach(function(attID, aIndex) {
								var attDef = PData.aByID(attID);
								newTLegend.append('<div class="lgnd-entry lgnd-locate" data-id="'+attID+
									'"><input type="checkbox" checked="checked" class="lgnd-entry-check"/><span class="lgnd-value-title">'+
									attDef.def.l+'</span></div>');
							});
						var newStr = '<select class="lgnd-select">';
						fAtts.forEach(function(attID, aIndex) {
							var attDef = PData.aByID(attID);
							newStr += '<option value="'+attID+'">'+attDef.def.l+'</option>';
						});
						newStr += '</select>';
						var newSelect = jQuery(newStr);
						newSelect.change(selectTmpltAtt);
						jQuery(newTLegend).append(newSelect);
							// Create Hide/Show all checkbox
						jQuery(newTLegend).append('<div class="lgnd-entry lgnd-sh"><input type="checkbox" checked="checked" class="lgnd-entry-check"/><i>'+
							dlText.sha+'</i></div><div class="lgnd-group"></div>');
						lgndCntr.append(newTLegend);
							// Default feature selection is first Attribute
						var fAttID = fAtts[0];
						self.legendIDs.push(fAttID);
						self.setLegendFeatures(tIndex, fAttID);
						prev=true;
					}
				}
			});
		}
		frame.find('div.lgnd-container').show();
		this.flushLgnd();
	} else {
		frame.find('button.hslgnd').button('disable');
			// Just hide Legend
		frame.find('div.lgnd-container').hide();
	}
		// As we initially render view, "Update" should be disabled
	this.setLDirty(false);

		// Enable or disable corresponding Highlight button & Save Reading checkboxes
	// if (flags & V_FLAG_SEL) {
		frame.find('.hilite').button('enable');
		// jQuery('#save-reading-h1').prop('disabled', false).prop('checked', false);
	// } else {
	// 	frame.find('.hilite').button('disable');
	// 	jQuery('#save-reading-h1').prop('disabled', true).prop('checked', false);
	// }

		// Does Viz have an Options dialog?
	if (flags & V_FLAG_OPT) {
		frame.find('.vopts').button('enable');
	} else {
		frame.find('.vopts').button('disable');
	}

		// Does Viz have annotation?
	var hint = newViz.hint();
	if (hint || typeof theView.n === 'string' && theView.n !== '')
	{
		frame.find('.vnote').button('enable');
		if (hint) {
			if (typeof theView.n === 'string' && theView.n !== '')
				hint += '.<br/>'+theView.n;
			else
				hint += '.';
		} else {
			hint = theView.n;
		}
		jQuery('#vnotes-txt').empty().append(hint);
	} else {
		frame.find('.vnote').button("disable");
	}

	newViz.setup();

		// ViewFrames initially created w/o selection
	this.upSel([], true);

	if (refresh) {
		var s = this.vizStates[vIndex];
		if (s) {
			newViz.setState(s);
		}
		if (this.datastream) {
			newViz.render(this.datastream);
		}
	}

	this.vizModel = newViz;
} // createViz()

	// PURPOSE: Sets the visualization in the view and updates menu selection
	// ASSUMES: This is only called when restoring a Perspective, so it doesn't need to
	//			deal with vizStates[]
PVizFrame.prototype.setViz = function(vI, refresh)
{
	if (vI !== this.vizSelIndex) {
		var select = jQuery('#view-frame-1 div.view-controls select.view-viz-select');
		select.val(vI);
		this.createViz(vI, refresh);
	}
} // setViz()

	// RETURNS: Array of currently selected locate Attribute IDs for tIndex
PVizFrame.prototype.getSelLocAtts = function(tIndex)
{
	var attIDs = [];
	var boxes = jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						tIndex+'"] div.lgnd-locate input:checked');
	boxes.each(function() {
		var attID = jQuery(this).parent().data('id');
		attIDs.push(attID);
	});
	return attIDs;
} // getSelLocAtts()

	// RETURNS: Array of indices of currently selected feature Attribute IDs for tIndex
	// NOTES: 	Indices are in dot notation for 2ndary-level (x.y)
	//			Array must be in numeric order
PVizFrame.prototype.getSelFeatAtts = function(tIndex)
{
	var attIndices = [], attIndex, i;
	var boxes = jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						tIndex+'"] div.lgnd-group div.lgnd-value input:checked');
	boxes.each(function() {
		attIndex = jQuery(this).parent().data('index');
		if (typeof attIndex == 'number') {
			attIndices.push(attIndex);
		} else {
			if ((i=attIndex.indexOf(',')) != -1) {
				attIndices.push([parseInt(attIndex.substring(0,i),10), parseInt(attIndex.substring(i+1),10)]);
			} else
				attIndices.push(parseInt(attIndex,10));
		}
	});
	return attIndices;
} // getSelFeatAtts()

	// RETURNS: Attribute ID selected on Legend for tIndex
PVizFrame.prototype.getSelLegend = function(tIndex)
{
	return this.legendIDs[tIndex];
} // getSelLegend()

	// RETURNS: Array of Attribute IDs chosen for all Templates on Legend
PVizFrame.prototype.getLgndSels = function()
{
	return this.legendIDs.slice(0);
} // getLgndSels()

	// PURPOSE: Set the Feature Attribute selections on the Legends
	// NOTES: 	Utility function for setting Reading
PVizFrame.prototype.setLgndSels = function(attIDs)
{
	var self=this;
	attIDs.forEach(function(attID, i) {
			// IDs for Templates not shown can be null
		if (attID) {
			var select = jQuery('#view-frame-1 div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+i+'"] select.lgnd-select');
			select.val(attID);
			self.setLegendFeatures(i, attID);
		}
	});
} // setLgndSels()

	// RETURNS: The state of the current visualization
PVizFrame.prototype.getState = function()
{
	return this.vizModel ? this.vizModel.getState() : null;
} // getState()

	// PURPOSE: Set the state of the current visualization
PVizFrame.prototype.setState = function(state)
{
	if (this.vizModel) {
		this.vizModel.setState(state);
	}
} // setState()

	// PURPOSE: Called by external agent when new datastream is available for viewing
	// NOTES: 	Assumes that this clears out selection
PVizFrame.prototype.showStream = function(stream)
{
	this.vizSel = [];
	this.selAbsIs = [];
	this.datastream = stream;
	if (this.vizModel) {
		this.vizModel.render(stream);
	}
	this.setLDirty(false);
} // showStream()

PVizFrame.prototype.setStream = function(stream)
{
	this.datastream = stream;
} // setStream()

PVizFrame.prototype.clearSel = function()
{
	this.upSel([], false);
	if (this.vizModel) {
		this.vizModel.clearSel();
	}
		// Clear vizSel last in case shared by VizModel
	this.selAbsIs = [];
	this.vizSel = [];
} // clearSel()

	// PURPOSE: Attempt to set the Selection List of the VizModel to selList
	// RETURNS: true if possible, false if not
PVizFrame.prototype.setSel = function(selList)
{
	this.selAbsIs = selList.slice(0);	// clone
	if (this.vizModel) {
		this.computeSel();
	}
	return false;
} // setSel()

	// PURPOSE: Handle external request to add to selection
	// INPUT: 	absI = absolute index of Record
PVizFrame.prototype.addSel = function(absI)
{
	var i;
		// Always store in requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
		// Check to see if it already exists
	if (this.selAbsIs[i] !== absI) {
		this.selAbsIs.splice(i, 0, absI);
		this.computeSel();
	}
} // addSel()

	// PURPOSE: Handle external request to remove from selection
	// INPUT: 	id = Record ID
	//			absI = absolute index of Record
PVizFrame.prototype.delSel = function(absI)
{
	var i;
		// Always remove from requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
	this.selAbsIs.splice(i, 1);
	this.computeSel();
} // delSel()

	// PURPOSE: VizModel notifies frame that Record selected
	// NOTES: 	Need to keep vizSel updated as used by openSelection, but
	//				shared with VizModel itself, so need to double-check actions
PVizFrame.prototype.vizAddSel = function(absI)
{
	var i;
		// Always store in requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
	this.selAbsIs.splice(i, 0, absI);
		// Need to keep vizSel updated as used by openSelection
	i = _.sortedIndex(this.vizSel, absI);
	if (this.vizSel[i] !== absI) {
		this.vizSel.splice(i, 0, absI);
	}
	this.callbacks.addSel(1, absI);
} // vizAddSel()

	// PURPOSE: VizModel notifies frame that Record deselected
	// NOTES: 	Need to keep vizSel updated as used by openSelection, but
	//				shared with VizModel itself, so need to double-check actions
PVizFrame.prototype.vizDelSel = function(absI)
{
	var i;
		// Always remove from requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
	this.selAbsIs.splice(i, 1);
		// Need to keep vizSel updated as used by openSelection
	i = _.sortedIndex(this.vizSel, absI);
	if (this.vizSel[i] === absI) {
		this.vizSel.splice(i, 1);
	}
	this.callbacks.delSel(1, absI);
} // vizDelSel()

	// PURPOSE: Alert inner visualization that view frame has resized
PVizFrame.prototype.resize = function()
{
	if (this.vizModel) {
		this.vizModel.resize();
	}
} // resize()

PVizFrame.prototype.title = function()
{
	var v = PData.vByN(this.vizSelIndex);
	return v.l;
} // title()

	// PURPOSE: Ensure Legend visible
	// NOTES:	Move Legend to far right; leave Selection List for now …
PVizFrame.prototype.flushLgnd = function()
{
	var frame = jQuery('#view-frame-1');
	var l = frame.width() - 280;
	frame.find('div.lgnd-container').css('left', l);
	// frame.find('div.sellist').css('left', 5);
} // flushLgnd()

	// PURPOSE: Return the Record bitmap data for this view
PVizFrame.prototype.getBMData = function()
{
	if (this.vizModel) {
		return { t: this.vizModel.tUsed, r: this.vizModel.rMap };
	}
	return null;
} // getBMData()


// ===================================================================================
// PTextFrame: Object that manages contents of text frame
//
//			Instance Methods
//			----------------
//			initDOM()
//			txtIDs2IS() = IndexStream of all Records appearing in text
//			clearSel()
//			setSel(selList)
//			addSel(absI)
//			delSel(absI)
//			newBookMark()
//			updateBookMark()
//
//		if a href contains "#" it is assumed to be a record-id; otherwise, a real URL
//			When HTML is parsed by buildTextFrame(), href is rewritten, data-id added,
//				no-data class added if not record-id

var PTextFrame = function(vfIndex, callbacks)
{
	this.tocVis=false;			// Frame has TOC (true) or Text (false)
	this.volData=[];			// { e[lement for chapter], s[ections], z[size] }
	this.tocRL=[];				// Which chapters and sections on reading list { c, s:[] }
	this.tocSel=[];				// Which chapters and sections are highlighted for reading { c, s:[] }
	this.tocSelDirty=false;		// Has user changed TOC selection?
	this.bm=[];					// Bookmark: { i, cI, sI, l, sel, rl }
	this.txtIDs=[];				// IDs of all Records currently in text frame (in sorted order)
	this.svg;					// SVG for bookmark

	PViewFrame.call(this, vfIndex, callbacks);
} // PTextFrame()

PTextFrame.prototype = Object.create(PViewFrame.prototype);

PTextFrame.prototype.constructor = PViewFrame;

	// PURPOSE: Update book mark after any changes
PTextFrame.prototype.updateBookMark = function()
{
	var i=0, chap1, chap2, bm;

		// Update All Data
	for (var cI=0; cI<this.tocSel.length; cI++) {
		chap1=this.tocSel[cI];
		chap2=this.tocRL[cI];
		bm = this.bm[i++];
		bm.sel = chap1.c;
		bm.rl  = chap2.c;

		for (var sI=0; sI<chap1.s.length; sI++) {
			bm = this.bm[i++];
			bm.sel = chap1.s[sI];
			bm.rl  = chap2.s[sI];
		} // for
	} // for

		// Update Viz
	this.svg.selectAll(".bm")
			.attr("class", function(d) { return d.sel ? 'bm sel' : 'bm'; })
			.attr("fill", function(d) { return d.rl ? '#0099FF' : '#C0C0C0'; });
} // updateBookMark()

	// PURPOSE: Search through elements of text, marking sections for which evalFunc returns true
	// INPUT: 	evalFunc = function(element, header)
	//			if reset, then set move to page of first match
	// SIDE FX: sets tocRL array values
	// NOTES:	This searches through original HTML, not reconstituted TextFrame format
PTextFrame.prototype.searchFunc = function(evalFunc, reset)
{
	var self=this;
	var fnd, cur;
	this.volData.forEach(function(chap, cI) {
			// Set to false by default
		fnd=false;
			// Check first in Chapter header
		if (evalFunc(chap.e, true)) {
			fnd=true;
		} else {
				// Check in following text (up to next section)
			cur = jQuery(chap.e).next();
			while (cur.length != 0) {
				switch (cur.prop('tagName').toUpperCase()) {
				case 'H1':
				case 'H2':
					cur=[];
					break;
				default:
					if (evalFunc(cur, false)) {
						fnd=true;
						cur=[];
					} else {
						cur = cur.next();
					}
					break;
				} // switch
			} // while
		}
		self.tocRL[cI].c = fnd;

		chap.s.forEach(function(sec, sI) {
			fnd=false;
				// Check first in Section header
			if (evalFunc(sec.e, true)) {
				fnd=true;
			} else {
					// Check in following text (up to next section)
				cur = jQuery(sec.e).next();
				while (cur.length != 0) {
					switch (cur.prop('tagName').toUpperCase()) {
					case 'H1':
					case 'H2':
						cur=[];
						break;
					default:
						if (evalFunc(cur, false)) {
							fnd=true;
							cur=[];
						} else {
							cur = cur.next();
						}
						break;
					} // switch
				} // while
			}
			self.tocRL[cI].s[sI] = fnd;
		});
	});
	this.updateTOCRL();
	this.updateBookMark();

	if (reset) {
			// Put first (sub)section found in reading pane, if any
		search:
		for (var i=0; i<this.tocRL.length; i++) {
			var chap = this.tocRL[i];
			if (chap.c) {
				this.setTOCSel(true, i, -1);
				break;
			}
			for (var j=0; j<chap.s.length; j++) {
				if (chap.s[j]) {
					this.setTOCSel(true, i, j);
					break search;
				}
			} // for j
		} // for i
	}
} // searchFunc()

	// PURPOSE: Mark Reading List for all references to Record id in <a> links
	// NOTES:	Since code scans original HTML, need to check href
PTextFrame.prototype.findRec = function(id)
{
	function evalRecID(e, header)
	{
		var clan, i, d, f=false;
		if (!header) {
			clan = jQuery(e).children("a");
			for (i=0; i<clan.length; i++) {
				d = jQuery(clan[i]).attr('href');
				if (d.charAt(0) === '#') {
					if (d.substr(1) == id) {
						f=true;
						break;
					}

				}
			}
		}
		return f;
	} // evalRecID
	this.searchFunc(evalRecID, false);
} // findRec()

	// PURPOSE: Set reading list checkboxes based on tocRL
PTextFrame.prototype.updateTOCRL = function()
{
	var tf, cDom;

	tf = jQuery('#toc-frame');
	this.tocRL.forEach(function(chap, cI) {
		cDom = tf.find('ul.toc-wrapper > li.toc-chap[data-c="'+cI+'"]');
		cDom.find('.readlist-c').prop('checked', chap.c);
		chap.s.forEach(function(sec, sI) {
			cDom.find('li[data-s="'+sI+'"] > .readlist').prop('checked', sec);
		});
	});
} // updateTOCRL()

	// PURPOSE: Set chapter & section selection based on tocSel
PTextFrame.prototype.updateTOCSel = function()
{
	var tf, cDom, sDom;

	tf = jQuery('#toc-frame');
	this.tocSel.forEach(function(chap, cI) {
		cDom = tf.find('ul.toc-wrapper > li.toc-chap[data-c="'+cI+'"]');
		cDom.toggleClass('sel', chap.c);
		chap.s.forEach(function(sec, sI) {
			cDom.find('li[data-s="'+sI+'"]').toggleClass('sel', sec);
		});
	});
} // updateTOCSel()

	// PURPOSE: Set tocSel to indicate viewing chap, sec and update everything
	// INPUT: 	if clear, remove all other flags
	//			cI (chapter index) = 0..n-1
	//			sI (section index) = 0..n-1 or -1 if none
PTextFrame.prototype.setTOCSel = function(clear, cI, sI)
{
	var chap;
	if (clear) {
		for (var i=0; i<this.tocSel.length; i++) {
			chap = this.tocSel[i];
			chap.c = false;
			for (var j=0; j<chap.s.length; j++)
				chap.s[j] = false;
		}
	}

	chap = this.tocSel[cI];
		// Now set new reading material
	if (sI === -1) {
		chap.c = true;
	} else {
		chap.s[sI] = true;
	}

	this.updateTOCSel();
	this.updateBookMark();
	this.buildTextFrame();
} // setTOCSel()


	// PURPOSE: Insert appropriate text into text frame, given tocSel
	//				parse and modify links
	// SIDE-FX:	Compile list of Record IDs in <a> in txtIDs
	// ASSUMES: Scroll to next text section deselects previous selections
	// TO DO:	Disable prev/next buttons if no RL items before or after
PTextFrame.prototype.buildTextFrame = function()
{
	var self=this;
	var volC, volS, cur;

	var tf = jQuery('#read-pane');
	tf.empty();

	this.tocSel.forEach(function(chap, cI) {
		volC = self.volData[cI];

			// Chapter header and following DOM elements up to H1 or H2
		if (chap.c) {
			tf.append(jQuery(volC.e).clone());
			cur = jQuery(volC.e).next();
			while (cur.length != 0) {
				switch (cur.prop('tagName').toUpperCase()) {
				case 'H1':
				case 'H2':
					cur=[];
					break;
				default:
					tf.append(cur.clone());
					cur = cur.next();
					break;
				} // switch
			} // while
		} // if
			// Section headers and following DOM elements up to H1 or H2
		chap.s.forEach(function(sec, sI) {
			if (sec) {
				volS = volC.s[sI];
				tf.append(jQuery(volS.e).clone());
				cur = jQuery(volS.e).next();
				while (cur.length != 0) {
					switch (cur.prop('tagName').toUpperCase()) {
					case 'H1':
					case 'H2':
						cur=[];
						break;
					default:
						tf.append(cur.clone());
						cur = cur.next();
						break;
					} // switch
				} // while
			} // if
		});
	});

		// Find all <a>, create list of recs from data-id
	this.selAbsI=[];
	this.vizSel=[];
	this.txtIDs=[];
	this.upSel([], true);

	var txtIDs=[];
	var recs;
	var pos;
	recs = jQuery('#read-pane').find('a');
	recs.each(function(aI) {
			// Need to get raw DOM element, as prop('href') via jQuery prefixes current URL
		var link = jQuery(this).prop('href');
			// Is this a record-id?
		if ((pos=link.indexOf('#')) !== -1) {
			link = link.substr(pos+1);
			jQuery(this).prop('href', '#');
			jQuery(this).attr('data-id', link);
				// Keep list sorted; don't add if already exists
			if (txtIDs.length === 0) {
				txtIDs.push(link);
			} else {
				var i = _.sortedIndex(txtIDs, link);
				if (txtIDs[i] !== link) {
					txtIDs.splice(i, 0, link);
				}
			}
		} else {
			jQuery(this).addClass('no-data');
		}
	});
	this.txtIDs=txtIDs;
	this.callbacks.newText();
} // buildTextFrame()

PTextFrame.prototype.initDOM = function()
{
	var self=this;
	var maxL=0;		// maximum length of a H1/H2 section
	var frame = jQuery('#view-frame-0');

		// PURPOSE: Handle click of Un/Check All (Reading List) checkbox on TOC
	function clickTOCHCAll(event)
	{
		var c = event.target.checked;
		for (var i=0; i<self.tocRL.length; i++) {
			var chap = self.tocRL[i];
			chap.c = c;
			for (var j=0; j<chap.s.length; j++) {
				chap.s[j] = c;
			}
		}
		self.updateTOCRL();
		self.updateBookMark();
		// Don't prevent default, as that's what updates HTML Dom
	} // clickTOCHCAll()

		// PURPOSE: Handle click of De/Select All (Visible in Text Pane) checkbox on TOC
	function clickTOCHSAll(event)
	{
		self.tocSelDirty=true;
		var s = event.target.checked;
		self.tocSel.forEach(function(chap, cI) {
			var cDom = frame.find('#toc-frame > ul.toc-wrapper > li.toc-chap[data-c="'+cI+'"]');
			chap.c = s;
			for (i=0; i<chap.s.length; i++) {
				chap.s[i] = s;
			}
			if (s) {
				cDom.addClass('sel');
				cDom.find('ul.toc-secs > li').addClass('sel');
			} else {
				cDom.removeClass('sel');
				cDom.find('ul.toc-secs > li').removeClass('sel');
			}
		});
		self.updateBookMark();
		// Don't prevent default, as that's what updates HTML Dom
	} // clickTOCHCAll()

		// PURPOSE: Handle toggling between TOC and Text panes
	function clickHSTOC(event)
	{
		self.tocVis = !self.tocVis;
		if (self.tocVis) {
			tour = tourTOC;
			self.tocSelDirty=false;
			frame.find('#toc-controls').show();
			frame.find('#toc-frame').show();
			frame.find('#text-controls').hide();
			frame.find('#text-frame').hide();
		} else {
			tour = tourTxt;
			if (self.tocSelDirty) {
				self.buildTextFrame();
			}
			frame.find('#toc-controls').hide();
			frame.find('#toc-frame').hide();
			frame.find('#text-controls').show();
			frame.find('#text-frame').show();
		}
		event.preventDefault();
	} // clickHSTOC()

		// PURPOSE: Handle click of chapter open/close toggle
	function clickTOCCollapse(event)
	{
		var btn = jQuery(this);
		var chap = btn.closest('li.toc-chap');
		var secs = chap.find('ul.toc-secs');
		secs.toggle();
		event.preventDefault();
	} // clickTOCCollapse()

	function buildTOC()
	{
		var volC, volS;
		var txt = document.getElementById('prsp-volume').innerHTML;
		var str;

		var tf = frame.find('#toc-frame > ul.toc-wrapper');
		tf.empty();

		self.volData.forEach(function(chap, cI) {
			str = '<li class="toc-chap" data-c='+cI+'><input type="checkbox" class="readlist-c"/> ';
			if (chap.s.length > 0) {
				str += '<button class="toccollapse">Collapse</button> ';
			}
			str += chap.e.innerHTML;
			str += '<ul class="toc-secs">';
				// Section headers and following DOM elements up to H1 or H2
			chap.s.forEach(function(sec, sI) {
				str += '<li data-s='+sI+'><input type="checkbox" class="readlist"/>'+sec.e.innerHTML+'</li>';
			});
			str += '</ul></li>';
			tf.append(str);
		});

			// Bind click on chapters first
		frame.find('#toc-frame > ul.toc-wrapper > li.toc-chap').click(clickTOCChap);
			// Then bind clickk on sections
		frame.find('#toc-frame > ul.toc-wrapper > li.toc-chap > ul.toc-secs li').click(clickTOCSec);
			// Bind all RL checkbox clicks
		frame.find('#toc-frame > ul.toc-wrapper > li.toc-chap input[type=checkbox]').click(clickRLCheck);
			// Bind collapse/expand icon buttons
		frame.find('#toc-frame .toccollapse').button({icons: { primary: 'ui-icon-plus' }, text: false })
			.click(clickTOCCollapse);
	} // buildTOC()

		// PURPOSE: Create book mark after TOC and RL created
		// NOTES: 	Bookmark: { i, cI, sI, sel, rl }
	function buildBookMark()
	{
		var i=0, chap1, chap2, v;
		var bm=[];

		for (var cI=0; cI<self.tocSel.length; cI++) {
			chap1=self.tocSel[cI];
			chap2=self.tocRL[cI];
			v=self.volData[cI];
			bm.push({ i: i++, cI: cI, sI: -1, l: Math.floor((12*v.l)/maxL), sel: chap1.c, rl: chap2.c });
			for (var sI=0; sI<chap1.s.length; sI++) {
				bm.push({ i: i++, cI: cI, sI: sI, l: Math.floor((12*v.s[sI].l)/maxL), sel: chap1.s[sI], rl: chap2.s[sI] });
			} // for
		} // for
		self.bm = bm;

		self.svg = d3.select("#bookmark").append("svg");
		var bms = self.svg.selectAll(".bm")
				.data(bm)
				.enter()
				.append("rect")
				.attr("class", function(d) { return d.sel ? 'bm sel' : 'bm'; })
				.attr("x", function(d) { return d.i*6; })
				.attr("y", function (d) { return 12-d.l; })
				.attr("width", "5")
				.attr("height", function(d) { return 2+d.l; })
				.attr("fill", function(d) { return d.rl ? '#0099FF' : '#C0C0C0'; });
	} // buildBookMark()

		// PURPOSE: Handle a click on the reading pane
		// NOTE: 	As there can be multiple refereces to same Record in text frame,
		//				we need to un/highlight all of them simultaneously!
	function clickReadPane(event)
	{
		var a, i, id, n, t, x;
		var vizSel=self.vizSel;
		var node = event.target;
			// Clicked on a style inside of a link? Skip up
		if (node.nodeName !== 'A' && node.parentNode.nodeName === 'A') {
			node = node.parentNode;
		}
		if (node.nodeName === 'A') {
			id = node.dataset.id;
			a = PData.nByID(id);
			if (a != null) {
				i = _.sortedIndex(vizSel, a);
					// If it already exists, remove it
				if (vizSel[i] === a) {
					vizSel.splice(i, 1);
						// Also remove from selAbsIs
					self.selAbsIs.splice(_.sortedIndex(self.selAbsIs, a), 1);
					self.callbacks.delSel(0, a);
					frame.find('#read-pane a[data-id="'+id+'"]').removeClass('sel');
				} else {	// add selected absID
					if (vizSel.length === 0) {
						vizSel.push(a);
					} else {
						vizSel.splice(i, 0, a);
					}
						// Also add to selAbsIs
					self.selAbsIs.splice(_.sortedIndex(self.selAbsIs, a), 0, a);
					self.callbacks.addSel(0, a);
					frame.find('#read-pane a[data-id="'+id+'"]').addClass('sel');
				} // add ID
				self.upSel(vizSel, false);
					// Only prevent default if we can handle the "link"
				event.preventDefault();
			} // ID has absI
		} // clicked link
	} // clickReadPane()

		// PURPOSE: Handle click on a chapter in TOC
	function clickTOCChap(event)
	{
		var cI = event.target.dataset.c;
		if (typeof cI != 'undefined') {
			self.tocSelDirty=true;
				// De/Select chapter and all of its sections
			var chap = self.tocSel[cI];
			chap.c = !chap.c;
			var cDom = frame.find('#toc-frame > ul.toc-wrapper > li.toc-chap[data-c="'+cI+'"]');
			if (chap.c) {
				cDom.addClass('sel');
				// cDom.find('ul.toc-secs > li').addClass('sel');
				// for (i=0; i<chap.s.length; i++) {
				// 	chap.s[i] = true;
				// }
			} else {
				cDom.removeClass('sel');
				// cDom.find('ul.toc-secs > li').removeClass('sel');
				// for (i=0; i<chap.s.length; i++) {
				// 	chap.s[i] = false;
				// }
			}
			self.updateBookMark();
			event.preventDefault();
		}
	} // clickTOCChap()

		// PURPOSE: Handle click on a section in TOC
	function clickTOCSec(event)
	{
		var sI = event.target.dataset.s;
		if (typeof sI != 'undefined') {
			self.tocSelDirty=true;
			var cDom = jQuery(event.target).closest('li.toc-chap');
			var cI = cDom.data('c');
			var chap = self.tocSel[cI];
			var sOn = (chap.s[sI] = !chap.s[sI]);
			var sDom = cDom.find('ul.toc-secs > li[data-s="'+sI+'"]');
			if (sOn) {
				sDom.addClass('sel');
			} else {
				sDom.removeClass('sel');
			}
			self.updateBookMark();
			event.preventDefault();
		}
	} // clickTOCSec()

		// PURPOSE: Handle click on a RL checkbox in the TOC
	function clickRLCheck(event)
	{
		var on = event.target.checked;
		var cDom, sDom, cI, sI;
		if (event.target.className === 'readlist-c') {
			var cI = jQuery(event.target).closest('li.toc-chap').data('c');
			self.tocRL[cI].c = on;
		} else if (event.target.className === 'readlist') {
			var sI = jQuery(event.target).closest('li').data('s');
			var cI = jQuery(event.target).closest('li.toc-chap').data('c');
			self.tocRL[cI].s[sI] = on;
		}
		self.updateBookMark();
		// Don't prevent default, as that's what updates HTML Dom
	} // clickRLCheck()

		// PURPOSE: Find previous selection in Reading List and select (and show in text frame)
		// NOTES: 	Current text in tocSel; look for prev in tocRL
		//			Does not wrap around to the end!
	function clickTextPrev(event)
	{
		event.preventDefault();

			// Find earliest visible selection, save value before it
		var ptrC=null, ptrS=null;
		var chap, cI, sI;
		search:
		for (cI=0; cI<self.tocSel.length; cI++) {
			chap=self.tocSel[cI];
			if (chap.c) {
				ptrC=cI-1;
				break;
			}
			for (sI=0; sI<chap.s.length; sI++) {
				if (chap.s[sI]) {
					ptrC = cI;
					ptrS = sI-1;
					break search;
				}
			}
		}
			// If no selection, ignore
		if (ptrC == null)
			return;

			// Find selection in RL immediately before that
		while (ptrC > -1) {
			chap = self.tocRL[ptrC];
			if (ptrS == null) {
				ptrS = chap.s.length-1;
			}
				// First check sections inside chapter
			for (; ptrS > -1; ptrS--) {
				if (chap.s[ptrS]) {
					self.setTOCSel(true, ptrC, ptrS);
					return;
				}
			}
			ptrS = null;
				// Then check chapter itself
			if (chap.c) {
				self.setTOCSel(true, ptrC, -1);
				return;
			}
			ptrC--;
		}
	} // clickTextPrev()

		// PURPOSE: Find next selection in Reading List and select (and show in text frame)
		// NOTES: 	Current text in tocSel; look for next in tocRL
		//			Does not wrap around to the beginning!
	function clickTextNext(event)
	{
		event.preventDefault();

			// Find last visible selection -- save next item
		var ptrC=null, ptrS=null;
		var chap, cI, sI;
		var newStart=false;
		search:
		for (cI=self.tocSel.length-1; cI >= 0; cI--) {
			chap = self.tocSel[cI];
			for (sI=chap.s.length-1; sI >= 0; sI--) {
				if (chap.s[sI]) {
					ptrS=sI+1;
					if (sI == chap.s.length-1) {
						ptrC=cI+1;
						ptrS=0;
						newStart=true;
					} else {
						ptrC=cI;
					}
					break search;
				}
			}
			if (chap.c) {
				ptrC=cI;
				ptrS=0;
				break;
			}
		}
			// If no selection, ignore
		if (ptrC == null)
			return;

			// Find next item in RL after that
		while (ptrC < self.tocRL.length) {
			chap = self.tocRL[ptrC];
			if (newStart && chap.c) {
				self.setTOCSel(true, ptrC, -1);
				return;
			}
				// First finish examining sections in this chapter
			for (; ptrS<chap.s.length; ptrS++) {
				if (chap.s[ptrS]) {
					self.setTOCSel(true, ptrC, ptrS);
					return;
				}
			}
			ptrS=0;
			ptrC++;
			newStart=true;
		}
	} // clickTextNext()

		// PURPOSE: Handle clicking "Find" icon button in TOC
	function clickTOCFind(event)
	{
		var dialog;

		dialog = jQuery("#dialog-find-toc").dialog({
			dialogClass: "no-close",
			height: 150,
			width: 250,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						var txt = jQuery('#find-toc-txt').val();

						function evalTxtFind(e, header) {
							if (header) {
								return e.innerHTML.indexOf(txt) !== -1;
							} else {
								return jQuery(e).contents().text().indexOf(txt) !== -1;
							}
						} // evalTxtFind()

						self.searchFunc(evalTxtFind, true);

						dialog.dialog("close");
					}
				},
				{
					text: dlText.cancel,
					click: function() {
						dialog.dialog("close");
					}
				}
			]
		});

		event.preventDefault();
	} // clickTOCFind()

		// PURPOSE: Handle clicking "Find" icon button on Text Frame
	function clickTextFind(event)
	{
			// Send signal back to Prospect "main app" to create Highlight filter on this viz
		jQuery("body").trigger("prospect", { s: "hilite", v: 0, t: null });
		event.preventDefault();
	} // clickTextFind()

		// PURPOSE: Handle click on "Show Highlighted" icon button
	function clickTextShow(event)
	{
		self.openSelection();
		event.preventDefault();
	} // clickTextShow()

		// PURPOSE: Handle clicking an item on the Selection List
	function clickSelList(event)
	{
		var recID = jQuery(event.target).closest('div.sellist-rec').data('id');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'sellist-rec':
			self.inspRec=recID;
			self.openSelection();
			break;
		} // switch
		event.preventDefault();
	} // clickSelList()

		// PURPOSE: Create all volume data by parsing HTML text representing volume
		// SIDE-FX: Creates volData, tocRL, tocSel
		// NOTES: 	Reading List is all on by default; open with first chapter in text pane
	(function() {
			// Get first child DOM node
		var cur = jQuery('#prsp-volume').children(':first');
		var chap=null, sec=null, size=0;

		while (cur.length != 0) {
			switch (cur.prop('tagName').toUpperCase()) {
			case 'H1':
					// Previous H2 to save?
				if (sec != null) {
					if (chap != null) {
						chap.s.push(sec);
					}
					sec = null;
				}
					// Previous H1 to save?
				if (chap != null) {
					self.volData.push(chap);
				}
				chap = { e: cur.get(0), s: [], l: 0 };
				break;
			case 'H2':
					// Previous H2 to save?
				if (sec != null) {
					if (chap != null) {
						chap.s.push(sec);
					}
					sec = null;
				}
				sec = { e: cur.get(0), l: 0 };
				break;
			default:
					// Add size of content to whatever node is open
				size = jQuery(cur).contents().text().length;
				if (sec != null) {
					sec.l += size;
				} else if (chap != null) {
					chap.l += size;
				}
				break;
			}
			cur = cur.next();
		}
			// Flush any unsaved sections
		if (sec != null) {
			chap.s.push(sec);
		}
			// Flush any unsaved chapters
		if (chap != null) {
			self.volData.push(chap);
		}

			// Create default Reading List and Selection: everything selected on RL
		self.volData.forEach(function(chap) {
			maxL = Math.max(maxL, chap.l);
			var rlChap={c: true, s: []};
			var rlSel={c: false, s:[]};
			chap.s.forEach(function(sec) {
				maxL = Math.max(maxL, sec.l);
				rlChap.s.push(true);
				rlSel.s.push(false);
			});
			self.tocRL.push(rlChap);
			self.tocSel.push(rlSel);
		});

			// Open at very beginning by default
		self.tocSel[0].c = true;
	})();

		// Text Frame icon buttons
	frame.find('#hstoc').button({icons: { primary: 'ui-icon-bookmark' }, text: false })
		.click(clickHSTOC);
	frame.find('#tochcall').click(clickTOCHCAll);
	frame.find('#tochsall').click(clickTOCHSAll);
	frame.find('#tocfind').button({icons: { primary: 'ui-icon-star' }, text: false })
		.click(clickTOCFind);
	frame.find('#textprev').button({icons: { primary: 'ui-icon-arrow-1-w' }, text: false })
		.click(clickTextPrev);
	frame.find('#textnext').button({icons: { primary: 'ui-icon-arrow-1-e' }, text: false })
		.click(clickTextNext);
	frame.find('.hilite').button({icons: { primary: 'ui-icon-signal' }, text: false })
		.click(clickTextFind);
	frame.find('.osel').button({icons: { primary: 'ui-icon-battery-3' }, text: false })
		.click(clickTextShow);

	frame.find('#read-pane').click(clickReadPane);

		// Activate Selection List drag handle
	frame.find('div.sellist').draggable({ handle: frame.find('div.sellist > div.sellist-handle'), containment: "parent" });
		// Click on selection number brings up Selection List
	frame.find('div.view-controls > #text-controls > span.btn-num-sel').click(function(event) {
		// TO DO: Keep track of whether visible for optimizing outputting list? i.e., lazy updating
		frame.find('div.sellist').show();
		event.preventDefault();
	});
		// Click on close button closes Selection List
	frame.find('div.sellist > div.sellist-handle > button.sellist-close').click(function(event) {
		// TO DO: Keep track of whether visible for optimizing outputting list? i.e., lazy updating
		frame.find('div.sellist').hide();
		event.preventDefault();
	});
		// Click on item
	frame.find('div.sellist > div.sellist-scroll')
		.click(clickSelList);

	buildTOC();
	this.updateTOCRL();
	this.updateTOCSel();
	this.buildTextFrame();
	buildBookMark();
} // initDOM()

	// PURPOSE: Convert the IDs of all Records in text frame to IndexStream
PTextFrame.prototype.txtIDs2IS = function()
{
		// NOTE: Need splice method, so use generic arrays (not Uint16Array)
	var txtIS = { s: [], t: [], l: 0 };
	var a, i, n, t;
		// Create empty slots for each Template
	for (i=0, n=PData.eTNum(); i<n; i++) {
		txtIS.t.push({i: 0, n: 0});
	}
	this.txtIDs.forEach(function(id) {
			// Convert to absolute index
		a = PData.nByID(id);
		if (a != null) {
				// Insert absI in order
			if (txtIS.s.length === 0) {
				txtIS.s.push(a);
			} else {
				i = _.sortedIndex(txtIS.s, a);
				txtIS.s.splice(i, 0, a);
			}
				// Which Template does it belong to?
			t=PData.n2T(a);
				// Increment # Recs for this Template and starting indices for rest
			txtIS.t[t++].n += 1;
			while (t < n) {
				txtIS.t[t++].i += 1;
			}
			txtIS.l += 1;
		}
	});
	return txtIS;
} // txtIDs2IS()

PTextFrame.prototype.clearSel = function()
{
	this.selAbsIs = [];
	this.vizSel = [];
	this.upSel([], false);
	jQuery('#read-pane a').removeClass('sel');
} // clearSel()

	// PURPOSE: Attempt to set the Selection List of the VizModel to selList
	// RETURNS: true if possible, false if not
PTextFrame.prototype.setSel = function(selList)
{
		// First clear everything
	jQuery('#read-pane a').removeClass('sel');

	this.selAbsIs = selList.slice(0);	// clone
	var r, t, vizSel=[];
	selList.forEach(function(absI) {
		r = PData.rByN(absI);
		if (r) {
			t = jQuery('#read-pane a[data-id="'+r.id+'"]');
			if (t.length > 0) {
				t.addClass('sel');
				vizSel.push(absI);
			}
		}
	});
	this.vizSel = vizSel;
	this.upSel(vizSel, false);

	return true;
} // setSel()

	// PURPOSE: Handle external request to add to selection
	// INPUT: 	absI = absolute index of Record
PTextFrame.prototype.addSel = function(absI)
{
	var i, r, t;
		// Always store in requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
	this.selAbsIs.splice(i, 0, absI);
		// Check and see if visible
	r = PData.rByN(absI);
	t = jQuery('#read-pane a[data-id="'+r.id+'"]');
	if (t.length > 0) {
		t.addClass('sel');
			// First item?
		if (this.vizSel.length === 0) {
			this.vizSel.push(absI);
		} else {
			i = _.sortedIndex(this.vizSel, absI);
			this.vizSel.splice(i, 0, absI);
		}
		this.upSel(this.vizSel, false);
	}
} // addSel()

	// PURPOSE: Handle external request to remove from selection
	// INPUT: 	absI = absolute index of Record
PTextFrame.prototype.delSel = function(absI)
{
	var i, r, t;
		// Always remove from requested IDs
	i = _.sortedIndex(this.selAbsIs, absI);
	this.selAbsIs.splice(i, 1);
		// Check to see if on visible list
	i = _.sortedIndex(this.vizSel, absI);
	if (this.vizSel[i] === absI) {
		this.vizSel.splice(i, 1);
		r = PData.rByN(absI);
		jQuery('#read-pane a[data-id="'+r.id+'"]').removeClass('sel');
		this.upSel(this.vizSel, false);
	}
} // delSel()


// Immediately Invoked Function Expression -- Bootstrap for Prospect Volume Client
// ===============================================================================
// PURPOSE: Create DOM structure, initiate services, manage filters, …
// USES: 	jQuery, jQueryUI, view-core
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// VARIABLES
		//==========
	var views = [null, null];	// 2 possible viewFrames

	var hFilters=[null, null];	// Highlight Filter
	var hFilterIDs=[null, null]; // Highlight Filter Attribute IDs

	var annote;					// Annotation from current Reading

	var topStream=null;			// Top-level IndexStream (before Filters)
	var endStream=null;			// Final resulting IndexStream (after Filters)

	var localStore=null;		// Local (Browser) storage (if Browser capable)
	var localReadings=[];		// locally-stored Readings

	var autoUpdate=false;		// Does visualization immediately respond to user actions?

		// Volume extensions (not in Exhibit)
	var vMode='v1';				// view option: selection from selaction radio buttons: 'v0', 'v1' or 'v2'
	var callbacks;				// callbacks used by ViewFrames: { addSel, delSel, newText, textFrame }
	var v0Sel=null;				// Array of RecIDs to select in TextFrame after data ready
	var v1Sel=null;				// Array of RecIDs to select in VizFrame after data ready

		// FUNCTIONS
		//==========

		// PURPOSE: Set values of 2-dimensional boolean array (for Text Frame)
	function cloneTOCArray(orig)
	{
		var n=[];
		orig.forEach(function(c) {
			n.push({ c: c.c, s: c.s.slice(0) });
		});
		return n;
	} // cloneTOCArray()

		// PURPOSE: Convert array of absolute indices to Record IDs
	function absIs2IDs(absIs)
	{
		var ids=[], r;

		absIs.forEach(function(absI) {
			r = PData.rByN(absI);
			if (r != null) {
				ids.push(r.id);
			}
		});
		return ids;
	} // absIs2IDs()

	function ids2absIs(ids)
	{
		var absIs=[], absI;
		ids.forEach(function(id) {
			absI = PData.nByID(id);
			if (absI != null) {
				absIs.push(absI);
			}
		});
		return absIs;
	} // ids2absIs()

		// PURPOSE: Convert absolute IDs to IndexStream
		// INPUT: 	absIs = array of absolute IDs
	function absIs2IS(absIs)
	{
			// NOTE: Need splice method, use generic arrays (not Uint16Array)
		var is = { s: [], t: [], l: 0 };
		var i, n, t;
			// Create empty slots for each Template
		for (i=0, n=PData.eTNum(); i<n; i++) {
			is.t.push({i: 0, n: 0});
		}
		absIs.forEach(function(a) {
				// Insert absI in order
			if (is.s.length === 0) {
				is.s.push(a);
			} else {
				i = _.sortedIndex(is.s, a);
				is.s.splice(i, 0, a);
			}
				// Which Template does it belong to?
			t=PData.n2T(a);
				// Increment # Recs for this Template and starting indices for rest
			is.t[t++].n += 1;
			while (t < n) {
				is.t[t++].i += 1;
			}
			is.l += 1;
		});
		return is;
	} // absIs2IS()

		// PURPOSE: Called after data has been loaded to prepare dataStreams for rendering
	function doRecompute()
	{
		if (topStream == null)
			topStream = PData.sNew(true);
		endStream = topStream;
	} // doRecompute()

		// PURPOSE: Set annotation text to <t>
	function setAnnote(t)
	{
		annote = t;

		var n = jQuery('#annote');
		n.text(t);

		if (t.length > 0) {
			jQuery('#btn-annote').button("enable");
			n.show();
		} else {
			jQuery('#btn-annote').button("disable");
			n.hide();
		}
	} // setAnnote()

		// PURPOSE: Hide/show the annotation for this View Frame
	function clickAnnotation(event)
	{
		jQuery('#annote').toggle('slide', { direction: "right" });
		event.preventDefault();
	} // clickAnnotation()

	function clickAbout(event)
	{
		var aboutDialog;

		jQuery("#dialog-about img").removeClass("zoomin");
		aboutDialog = jQuery("#dialog-about").dialog({
			dialogClass: "no-close",
			height: 390,
			width: 350,
			modal: true,
			buttons: [{
				text: dlText.ok,
				click: function() {
					aboutDialog.dialog("close");
				}
			}]
		});
		jQuery("#dialog-about img").addClass("zoomin");

		event.preventDefault();
	} // clickAbout()

		// RETURNS: Record for ID or else null
	function getReading(id)
	{
			// Check Readings from server
		var reading = _.find(prspdata.p, function(theP) {
			return id == theP.id;
		});
		if (reading)
			return reading;

		if (localStore == null || localReadings.length == 0)
			return null;

		reading = _.find(localReadings, function(theP) {
			return id == theP.id;
		});
		if (reading) {
			return reading;
		}

		return null;
	} // getReading()

		// PURPOSE: Save current Reading as <id>
		// RETURNS: "local" or "server" if save successful, else null
	function doSaveReading(id, label)
	{
		var v0=views[0], v1=views[1];

			// Where to save it?
		var dest = jQuery('input[name=save-reading-dest]:checked').val();
		if (dest == '')
			return null;

		var note = jQuery('#save-reading-note').val();
		note = note.replace(/"/g, '');

			// Compile Reading state
		var pState = { rl: cloneTOCArray(v0.tocRL), sel: cloneTOCArray(v0.tocSel), vm: vMode, h0: null, h1: null, recs: null, v1: null };

		if (v1) {
			pState.v1 = { l: v1.title(), s: v1.getState() }
		}

			// Save Highlight filters or Record selection IDs?
		switch(jQuery('input[name=select-read-by]:checked').val()) {
		case 'recs':
			pState.recs = [absIs2IDs(v0.vizSel), absIs2IDs(v1.vizSel)];
			break;
		case 'h0':
			pState.h0 = { id: hFilterIDs[0], s: hFilters[0].getState() };
			break;
		case 'h1':
			pState.h1 = { id: hFilterIDs[1], s: hFilters[1].getState() };
			break;
		} // switch

			// Store everything in Reading object
		var sReading = { id: id, l: label, n: note, s: pState };

		if (dest == 'local') {
			localReadings.push(sReading);
			localStore.setItem(prspdata.e.id, JSON.stringify(localReadings));
		} else if (dest == 'server') {
				// Send via AJAX -- if successful, add locally
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_save_reading',
					id: id,
					l: label,
					x: prspdata.e.id,
					n: note,
					s: JSON.stringify(pState)
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					if (data != '0') {
						prspdata.p.push(sReading);
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			});
		}
		return dest;
	} // doSaveReading()

	function clickSaveReading(event)
	{
		var spDialog;
		var idExp = /[^\w\-]/;

			// Clear any previous input values
		jQuery('#save-reading-id').val('');
		jQuery('#save-reading-lbl').val('');
		jQuery('#save-reading-note').val('');

			// Make sure Browser has local storage capability
		if (!localStore) {
			jQuery('#save-reading-d-1').prop('disabled', true);
		}
			// If user not logged in, disable server capability
		if (!prspdata.x.add_reading) {
			jQuery('#save-reading-d-2').prop('disabled', true);
		}

			// Uncheck Highlight filters by default
		jQuery('#read-by-h0').prop('disabled', hFilters[0] == null);
		jQuery('#read-by-h1').prop('disabled', hFilters[1] == null);

		spDialog = jQuery("#dialog-save-reading").dialog({
			dialogClass: "no-close",
			width: 350,
			height: 420,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						var id = jQuery('#save-reading-id').val().trim();
							// Make sure ID correct format
						var idError = id.match(idExp);
						var label = jQuery('#save-reading-lbl').val().trim();
						label = label.replace(/"/g, '');

						if (id.length === 0 || id.length > 20 || idError) {
							idError = '#dialog-reading-id-badchars';
							// Make sure ID not already taken
						} else if (getReading(id)) {
							idError = '#dialog-reading-id-used';
						} else if (label.length === 0 || label.length > 32) {
							idError = '#dialog-reading-label-bad';
						}
						if (idError) {
							var errDialog = jQuery(idError).dialog({
								dialogClass: "no-close",
								width: 320,
								height: 210,
								modal: true,
								buttons: [{
									text: dlText.ok,
									click: function() {
										errDialog.dialog("close");
									}
								}]
							});
						} else {
							var saved = doSaveReading(id, label);
							spDialog.dialog("close");

							if (saved == 'server') {
									// Calculate Embed value
								var embed = volURL + '/?reading=' + id;

								jQuery('#save-reading-embed').val(embed);
								var embedDialog = jQuery("#dialog-reading-url").dialog({
									dialogClass: "no-close",
									width: 480,
									height: 230,
									modal: true,
									buttons: [{
										text: dlText.ok,
										click: function() {
											embedDialog.dialog("close");
										}
									}]
								});
							} // saved on server
						} // no redundancy
					} // OK
				},
				{
					text: dlText.cancel,
					click: function() {
						spDialog.dialog("close");
					}
				}
			]
		});
		event.preventDefault();
	} // clickSaveReading()

	function manageReadings()
	{
		var mpDialog;
		var xData=[];
		var xDataDirty=false;

		function createList()
		{
				// Clear scroll areas and recreate
			var pList = jQuery('#reading-mlist');
			pList.empty();

				// Populate local list
			localReadings.forEach(function(theP) {
				pList.append('<li data-type="l" data-id="'+theP.id+'"><span class="label">'+theP.l+'</span> <button class="del">'+dlText.del+
					'</button> <button class="edit">'+dlText.edit+'</button></li>');
			});

				// Get other Readings/Perspectives of other Volumes/Exhibits (on this domain)
			for (var i=0; i<localStore.length; i++) {
				var xKey = localStore.key(i);
				if (xKey != prspdata.e.id) {
					var xItem = localStore.getItem(xKey);
					xData.push({ id: xKey, ps: JSON.parse(xItem) });
				}
			}

			xData.forEach(function(xEl, xI) {
				xEl.ps.forEach(function(pEl) {
					pList.append('<li data-type="x" data-xid="'+xEl.id+'" data-xindex="'+xI+'" data-id="'+
						pEl.id+'"><i class="label">'+pEl.l+'</i> <button class="del">'+dlText.del+
						'</button> <button class="edit">'+dlText.edit+'</button></li>');
				});
			});
		} // createList()

		createList();

			// Handle selection of item on Manage Readings list
		jQuery('#reading-mlist').click(function(event) {
			if (event.target.nodeName == 'BUTTON') {	// Edit or Delete?
				var del = jQuery(event.target).hasClass('del');
				var parent = jQuery(event.target).parent();
				var t = parent.data('type');
				var id = parent.data('id');
				var pI;
				if (del) {
					switch (t) {
					case 'l':
						pI = localReadings.findIndex(function(theP) {
							return id == theP.id;
						});
						if (pI != -1) {
							localReadings.splice(pI, 1);
							if (localReadings.length == 0)
								localStore.removeItem(prspdata.e.id);
							else
								localStore.setItem(prspdata.e.id, JSON.stringify(localReadings));
						}
						break;
					case 'x':
						var xI = parent.data('xindex');
						var xEntry = xData[xI];
						pI = xEntry.ps.findIndex(function(theP) {
							return id == theP.id;
						});
						if (pI != -1) {
							xEntry.ps.splice(pI, 1);
							xDataDirty = true;
						}
						break;
					} // switch type
					parent.remove();
				} else {
					var pRec;

					switch (t) {
					case 'l':
						pRec = _.find(localReadings, function(theP) {
							return id == theP.id;
						});
						break;
					case 'x':
						var xI = parent.data('xindex');
						var xEntry = xData[xI];
						pRec = _.find(xEntry.ps, function(theP) {
							return id == theP.id;
						});
						break;
					} // switch
					jQuery('#edit-reading-lbl').val(pRec.l);
					jQuery('#edit-reading-note').val(pRec.n);

					var epDialog = jQuery("#dialog-edit-reading").dialog({
						dialogClass: "no-close",
						width: 340,
						height: 270,
						modal: true,
						buttons: [
							{
								text: dlText.ok,
								click: function() {
									pRec.l = jQuery('#edit-reading-lbl').val();
									pRec.n = jQuery('#edit-reading-note').val();
									parent.find('.label').text(pRec.l);
									if (t == 'x') {
										xDataDirty = true;
									} else {
										localStore.setItem(prspdata.e.id, JSON.stringify(localReadings));
									}
									epDialog.dialog("close");
								}
							}, // OK
							{
								text: dlText.cancel,
								click: function() {
									epDialog.dialog("close");
								}
							}]});
				} // else edit
			} // if BUTTON
		});

		mpDialog = jQuery("#dialog-manage-reading").dialog({
			dialogClass: "no-close",
			width: 450,
			height: 350,
			modal: true,
			buttons: [{
					text: dlText.ok,
					click: function() {
						if (xDataDirty) {
							xData.forEach(function(xEntry) {
								if (xEntry.ps.length > 0) {
									localStore.setItem(xEntry.id, JSON.stringify(xEntry.ps));
								} else {
									localStore.removeItem(xEntry.id);
								}
							});
						}
						jQuery('#reading-mlist').off("click");
						mpDialog.dialog("close");
					} // OK
				}]
		});
	} // manageReadings()

	function clickShowReading(event)
	{
			// Clear scroll areas and recreate
		var pList = jQuery('#reading-slist');
		pList.empty();

			// Populate server list
		prspdata.p.forEach(function(theP) {
			pList.append('<li data-src="server" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

			// Populate local list
		localReadings.forEach(function(theP) {
			pList.append('<li data-src="local" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

		var bs = [{
					text: dlText.ok,
					click: function() {
						spDialog.dialog("close");
						var selItem = pList.find('li.selected');
						if (selItem.length) {
							var setP = selItem.data('id');
							doShowReading(setP);
						}
					} // OK
				},
				{
					text: dlText.cancel,
					click: function() {
						spDialog.dialog("close");
					}
				}];
		if (localStore) {
			bs.push({text: dlText.manage,
					click: function() {
						spDialog.dialog("close");
						manageReadings();
					}});
		}

		var spDialog = jQuery("#dialog-show-reading").dialog({
			dialogClass: "no-close",
			width: 350,
			height: 350,
			modal: true,
			buttons: bs
		});
		event.preventDefault();
	} // clickShowReading()

	function clickGoHome(event)
	{
		window.location.href=prspdata.e.g.hurl;
		event.preventDefault();
	} // clickGoHome()

		// PURPOSE: Add a new filter to the stack
		// INPUT: 	fID = Attribute ID
		//			apply = initial state of apply array (boolean for each Template)
		//			highlight = null if in Filter stack, else 0 or 1 (to indicate view applied to)
		// RETURNS: The Filter object created
		// NOTES:   IDs 0 and 1 are specially allocated to Highlight those respective views
		// ASSUMED: Remove filter won't be created for Highlight condition
	function createFilter(fID, apply, highlight)
	{
		var newID;
		var newFilter;
		var theAtt;
		var insert;

		newID = highlight;

		if (fID == '_remove') {
			newFilter = new PFilterRemove(newID);
			theAtt = { t: [true, true, true, true ] };	// Create pseudo-Attribute entry
		} else {
			theAtt = PData.aByID(fID);
			switch (theAtt.def.t) {
			case 'V':
				newFilter = new PFilterVocab(newID, theAtt);
				break;
			case 'T':
				newFilter = new PFilterText(newID, theAtt);
				break;
			case 'g':
				newFilter = new PFilterTags(newID, theAtt);
				break;
			case 'N':
				newFilter = new PFilterNum(newID, theAtt);
				break;
			case 'D':
				newFilter = new PFilterDates(newID, theAtt);
				break;
			case 'P':
				newFilter = new PFilterPtr(newID, theAtt);
				break;
			}
		}

		jQuery('#dialog-hilite-'+highlight+' span.filter-id').html(theAtt.def.l);
		insert = jQuery('#hilite-'+highlight);
		insert.empty();

			// Allow Filter to insert required HTML
		newFilter.setup();
		return newFilter;
	} // createFilter()

		// PURPOSE: Allow user to choose an Attribute from a list
		// INPUT: 	if showRemove, then show the "Remove All" pseudo-Filter
		//			if secondary, this dialog must appear on top of another
		//			usedTs is either null (show all Attributes) or is array of flags for each Template
		//				(Attribute must belong to one to appear)
		//			if Attribute is chosen, pass selection on to callback function
		// NOTES: 	Since this dialog can be invoked from two other modal dialogs, need
		//				to append at particular point in DOM to ensure stacked properly
	function chooseAttribute(showRemove, secondary, usedTs, callback)
	{
			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
			// Hide or Show Attributes
		var attList = jQuery("#filter-list li");
		var li, attID, attDef, on;
		attList.each(function(i) {
			li = jQuery(this);
			attID = li.data("id");
			if (attID == '_remove') {
					// Do we show "Remove" Filter Option?
				if (showRemove) {
					li.show();
				} else {
					li.hide();
				}
			} else {
				if (usedTs) {
					attDef = PData.aByID(attID);
						// Only show an Attribute if it appears in a Template that was rendered in the view
					on = false;
					attDef.t.forEach(function(u, uI) {
						on = on || (u && usedTs[uI]);
					});
					if (on) {
						li.show();
					} else {
						li.hide();
					}
				} else {
					li.show();
				}
			}
		});

		var attDialog;

		var dialogParams = {
			dialogClass: "no-close",
			height: 300,
			width: 350,
			modal: true,
			buttons: [
				{
					text: dlText.add,
					click: function() {
						var selected = jQuery("#filter-list li.selected");
						if (selected.length === 1) {
							callback(selected.data("id"));
						}
							// Remove click handler
						attDialog.dialog("close");
					}
				},
				{
					text: dlText.cancel,
					click: function() {
							// Remove click handler
						attDialog.dialog("close");
					}
				}
			]
		};
		if (secondary) {
			dialogParams.appendTo = '#dialog-2';
		}

		attDialog = jQuery("#dialog-choose-att").dialog(dialogParams);
	} // chooseAttribute()

		// PURPOSE: Apply effect of a Highlight filter
	function doApplyHighlight(vI)
	{
		var hFilter=hFilters[vI];
		var v0=views[0], v1=views[1];
		var relI=0, absI, rec;
		var tI=0, tRec;
		var list=[];

			// Apply to Text Frame?
		if (vI === 0) {
			var txtIS = v0.txtIDs2IS();
			jQuery('#read-pane a').removeClass('sel');
			hFilter.evalPrep();

			tRec=txtIS.t[0];
				// Must keep absolute indices and template params updated!
			outer:
			while (relI < txtIS.l) {
					// Advance until we get to current Template rec
				while (tRec.n == 0 || (tRec.i+tRec.n) == relI) {
						// Fast-forward to next used template set
					if (++tI === PData.eTNum()) {
						break outer;
					}
					tRec = txtIS.t[tI];
					relI = tRec.i;
				}
				absI = txtIS.s[relI++];
				rec = PData.rByN(absI);
				if (hFilter.eval(rec)) {
					list.push(absI);
				}
			}
			hFilter.evalDone(txtIS.l);

			switch (vMode) {
			case 'v0': 		// Show all Records, highlight selected
			case 'v1': 		// Show Records visible from Text, highlight selected
				if (list.length > 0) {
					v0.setSel(list);
					v1.setSel(list);
				} else {
					v0.clearSel();
					v1.clearSel();
				}
				break;
			case 'v2': 		// Only Show selected Records
				if (list.length > 0) {
					v0.setSel(list);
				} else {
					v0.clearSel();
				}
				v1.clearSel();
				endStream = absIs2IS(list);
				v1.showStream(endStream);
				break;
			} // switch

		} else {	// Apply to Viz Frame
			var bm = v1.getBMData();

			if (endStream != null) {
				hFilter.evalPrep();

				tRec=endStream.t[0];
					// Must keep absolute indices and template params updated!
				outer:
				while (relI < endStream.l) {
						// Advance until we get to current Template rec
					while (!bm.t[tI] || tRec.n == 0 || (tRec.i+tRec.n) == relI) {
							// Fast-forward to next used template set
						if (++tI === PData.eTNum()) {
							break outer;
						}
						tRec = endStream.t[tI];
						relI = tRec.i;
					}
					absI = endStream.s[relI++];
						// Check bitflag if Record rendered
					if (bm.r[absI >> 4] & (1 << (absI & 15))) {
						rec = PData.rByN(absI);
						if (hFilter.eval(rec)) {
							list.push(absI);
						}
					}
				}
				hFilter.evalDone(endStream.l);
			}

			if (list.length > 0) {
				v1.setSel(list);
				if (vMode !== 'v2') {
					v0.setSel(list);
				}
			} else {
				v1.clearSel();
				if (vMode !== 'v2') {
					v0.clearSel();
				}
			}
		} // if VizFrame
	} // doApplyHighlight()

		// PURPOSE: Handle click on "Highlight" button
		// INPUT: 	vI = index of view frame
		//			tUsed = null (allow all Attributes) or array of booleans corresponding to Templates
	function clickHighlight(vI, tUsed)
	{
		var dialog;

		dialog = jQuery("#dialog-hilite-"+vI).dialog({
			dialogClass: "no-close",
			height: 275,
			width: Math.min(jQuery(window).width() - 20, 675),
			modal: true,
			appendTo: "#dialog-1",
			buttons: [
				{
					text: dlText.chsatt,
					click: function() {
						chooseAttribute(false, true, tUsed, function(id) {
							hFilterIDs[vI] = id;
							hFilters[vI] = createFilter(id, null, vI);
						});
					}
				},
				{
					text: dlText.ok,
					click: function() {
						dialog.dialog("close");
						if (hFilters[vI] !== null) {
							doApplyHighlight(vI);
						}
					}
				},
				{
					text: dlText.cancel,
					click: function() {
						dialog.dialog("close");
					}
				}
			]
		});
	} // clickHighlight()


		// PURPOSE: Attempt to show Reading pID
		// RETURN:  false if error
	function doShowReading(pID)
	{
		var v0=views[0], v1=views[1];

		function vizIndex(vID)
		{
			return prspdata.e.vf.findIndex(function(vf) {
				return vID === vf.l;
			});
		}
		v0Sel = null;
		v1Sel = null;

		var p = getReading(pID);
		if (p == null) {
			return false;
		}

			// Set Reading List, Reading Selection and vMode
		vMode = p.s.vm;

			// PURPOSE: Set Reading List or Selection array safely (in case structure has changed since Reading was saved)
		function setEntries(src, dest)
		{
			var i0, i1, s0, d0;

			for (i0=0; i0<dest.length && i0<src.length; i0++) {
				s0 = src[i0];
				d0 = dest[i0];
				d0.c = s0.c;
				for (i1=0; i1<d0.s.length && i1<s0.s.length; i1++) {
					d0.s[i1] = s0.s[i1];
				}
			}
		} // setEntries()
		setEntries(p.s.rl, v0.tocRL);
		setEntries(p.s.sel, v0.tocSel);

		jQuery('#command-bar input[type=radio][name=vizmode]').val([vMode]);

		v0.updateTOCRL();
		v0.updateTOCSel();
		v0.updateBookMark();
		v0.buildTextFrame();

		vI = vizIndex(p.s.v1.l);

			// Does viz already exist?
		if (v1) {
			v1.setViz(vI, false);
			v1.upSel([], true);
		} else {
			views[1] = new PVizFrame(1, callbacks);
			v1 = views[1];
			v1.initDOM(vI);
		}
		v1.setState(p.s.v1.s);

		setAnnote(p.n);

			// ASSUMES: hI is either 0 or 1
		function setHFilter(hI, f)
		{
			var hFilter = createFilter(f.id, null, hI);
			var other = hI ^ 1;
			hFilterIDs[hI] = f.id;
			hFilters[hI] = hFilter;
			hFilter.setState(f.s);

			hFilterIDs[other] = null;
			hFilters[other] = null;
			jQuery('#hilite-'+(hI^1)).empty();
			jQuery('#dialog-hilite-'+(hI^1)+' .filter-id').empty();
		} // setHFilter()

			// Load Highlight filters?
		if (p.s.h0 != null) {
			setHFilter(0, p.s.h0);
		} else if (p.s.h1 != null) {
			setHFilter(1, p.s.h1);
		} else {
			hFilterIDs[0] = hFilterIDs[1] = hFilters[0] = hFilters[1] = null;
			jQuery('#dialog-hilite-0 .filter-id').empty();
			jQuery('#dialog-hilite-1 .filter-id').empty();
			jQuery('#hilite-0').empty();
			jQuery('#hilite-1').empty();
			v0Sel = p.s.recs[0];
			v1Sel = p.s.recs[1];
		}

			// Don't recompute if data not loaded yet
		if (PData.ready() && topStream) {
			doRecompute();
			if (hFilterIDs[0] != null) {
				doApplyHighlight(0);
			} else if (vMode === 'v2' && v0Sel != null) {	// Special case of view mode 2 -- need to set before render()
				v0.setSel(ids2absIs(v0Sel));
				v0Sel = null;
			}
			render();
			if (hFilterIDs[1] != null) {
				doApplyHighlight(1);
			} else {
					// Have RecID selections been saved?
				if (v0Sel != null) {
					v0.setSel(ids2absIs(v0Sel));
					v0Sel = null;
				}
				if (v1Sel != null) {
					v1.setSel(ids2absIs(v1Sel));
					v1Sel = null;
				}
			}
		}

		return true;
	} // doShowReading()

		// PURPOSE: Handle clicking global "Clear" icon button
	function clickClear(event)
	{
		var v0=views[0], v1=views[1];
		v0.clearSel();
		switch (vMode) {
		case 'v0': 		// Show all Records, highlight selected
		case 'v1': 		// Show Records visible from Text, highlight selected
			v1.clearSel();
			break;
		case 'v2': 		// Only Show selected Records (none)
			endStream = absIs2IS([]);
			v1.showStream(endStream);
			v1.upSel([], false);
			break;
		}
		event.preventDefault();
	} // clickClear()

		// PURPOSE: Called by ViewFrame when a Record is selected
		// INPUT: 	vI = 0 if called by TextFrame, 1 by VizFrame
		//			absI = the absolute index of the Record that has been selected
	function doAddSel(vI, absI)
	{
		var vTo=views[vI^1];
		switch (vMode) {
		case 'v0': 		// Show all Records, highlight selected
		case 'v1': 		// Show Records visible from Text, highlight selected
			vTo.addSel(absI);
			break;
		case 'v2': 		// Only Show selected Records
				// Don't affect Text if selected in Viz
			if (vI === 0) {
				render();
			}
			break;
		}
	} // doAddSel()

		// PURPOSE: Called by ViewFrame when a Record is deselected
		// INPUT: 	vI = 0 for TextFrame, 1 for VizFrame
		//			absI = the absolute index of the Record that has been deselected
	function doDelSel(vI, absI)
	{
		var vTo=views[vI^1];
		switch (vMode) {
		case 'v0': 		// Show all Records, highlight selected
		case 'v1': 		// Show Records visible from Text, highlight selected
			vTo.delSel(absI);
			break;
		case 'v2': 		// Only Show selected Records
				// Don't affect Text if selected in Viz
			if (vI === 0) {
				render();
			}
			break;
		}
	} // doDelSel()

		// PURPOSE: Text Frame has rendered itself, requests that Viz build itself
		// NOTES: 	Record data may not yet be loaded -- may have to save text data for later use
		//			Assumed that we can clear selection when new text frame created
	function doNewText()
	{
		var v1=views[1];
		if (v1 != null) {
			v1.clearSel();
		}
		render();
	} // doNewText()

		// PURPOSE: Called to request VizFrame be rendered
		// ASSMES: 	Called after Record data loaded, Text Frame renders itself or vMode changed
	function render()
	{
		var v0=views[0], v1=views[1];
		var sel;

			// Is data available yet?
		if (topStream == null) {
			return;
		}

		switch (vMode) {
		case 'v0': 		// Show all Records, highlight selected
			endStream = topStream;
			v1.showStream(topStream);
			sel = v0.vizSel;
			if (sel.length > 0) {
				v1.setSel(sel.slice(0));	// slice(0) clones the array
			} else {
				v1.clearSel();
			}
			break;
		case 'v1': 		// Show Records visible from Text, highlight selected
			endStream = v0.txtIDs2IS();
			v1.showStream(endStream);
			sel = v0.vizSel;
			if (sel.length > 0) {
				v1.setSel(sel.slice(0));	// slice(0) clones the array
			} else {
				v1.clearSel();
			}
			break;
		case 'v2': 		// Only Show selected Records
			v1.clearSel();	// Clear any previous selection
			endStream = absIs2IS(v0.vizSel);
			v1.showStream(endStream);
			break;
		}
	} // render()

		// IMMEDIATE EXECUTION
		//====================

	jQuery('body').addClass('waiting');

		// Localize color scheme?
	function localizeColor(c, div)
	{
		var clr = prspdata.bClrs[c];
		if (clr && clr.length > 0) {
			jQuery(div).css('background-color', clr);
		}
	} // localizeColor()
	localizeColor('cb', '#command-bar');

	if (typeof PMapHub !== 'undefined') {
		PMapHub.init(prspdata.m);
	}

		// PURPOSE: Load all dynamic, language-independent resources
	(function () {
		var text;
		function loadFrag(domID, field)
		{
			text = document.getElementById(domID).innerHTML;
			dlText[field] = text.trim();
		} // loadFrag()

		loadFrag('dltext-removehideall', 'rha');
		loadFrag('dltext-showhideall', 'sha');
		loadFrag('dltext-ok', 'ok');
		loadFrag('dltext-cancel', 'cancel');
		loadFrag('dltext-next', 'next');
		loadFrag('dltext-prev', 'prev');
		loadFrag('dltext-choose-att', 'chsatt');
		loadFrag('dltext-seerec', 'seerec');
		loadFrag('dltext-close', 'close');
		loadFrag('dltext-add', 'add');
		loadFrag('dltext-manage', 'manage');
		loadFrag('dltext-delete', 'del');
		loadFrag('dltext-edit', 'edit');
		loadFrag('dltext-markers', 'markers');
		loadFrag('dltext-hint-marker', 'markersize');
		loadFrag('dltext-hint-text', 'textsize');
		loadFrag('dltext-xaxis', 'xaxis');
		loadFrag('dltext-yaxis', 'yaxis');
		loadFrag('dltext-undefined', 'undef');
		loadFrag('dltext-orderedby', 'orderedby');
		loadFrag('dltext-grpblks', 'grpblks');
		loadFrag('dltext-reset', 'reset');
		loadFrag('dltext-nofilter', 'nofilter');
		loadFrag('dltext-dofilters', 'dofilters');
		loadFrag('dltext-filtered', 'filtered');
		loadFrag('dltext-findintext', 'findintext');
		loadFrag('dltext-selected', 'selected');

		text = document.getElementById('dltext-month-names').innerHTML;
		months = text.trim().split('|');

			// Do we need to localize D3?
		if (text = document.getElementById('dltext-d3-local')) {
			if ((text = text.innerHTML.trim()) && (text !== 'no-d3-local'))
			{
				var locale = d3.locale(JSON.parse(text));
				localD3 = locale.timeFormat.multi([
					["%H:%M", function(d) { return d.getMinutes(); }],
					["%H:%M", function(d) { return d.getHours(); }],
					["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
					["%b %d", function(d) { return d.getDate() != 1; }],
					["%B", function(d) { return d.getMonth(); }],
					["%Y", function() { return true; }]
				]);
			}
		}
	}());

		// Remove any Reading query string and prefix and trailing /
	volURL = window.location.pathname;
	volURL = volURL.replace(/\&*reading=[\w\-]+/, '');
	volURL = volURL.replace(/\/$/, '');
	volURL = volURL.replace(/^\//, '');
	volURL = "http://" + window.location.host + "/" + volURL;

		// Insert reference to CrimsonText font on Google
	jQuery("script").first().before('<link href="//fonts.googleapis.com/css?family=Crimson+Text:n,b,i" rel="stylesheet" type="text/css"/>');

		// Create string to add to Filter Headers inserting Template IDs & labels
	(function () {
		var at = _.template(document.getElementById('dltext-filter-template').innerHTML);
		var ts = [];
		prspdata.t.forEach(function(tmplt, ti) {
			ts.push(at({ ti: ti, tl: tmplt.def.l }));
		});
		apTmStr = ts.join('&nbsp;');
	}());

		// Insert relevant Attribute IDs into Sort by Dialog
	(function () {
		var att;
		prspdata.t.forEach(function(tmplt, ti) {
			var opts='';
			tmplt.def.a.forEach(function(attID) {
				att = PData.aByID(attID);
				switch (att.def.t) {
				case 'T':
				case 'V':
				case 'N':
				case 'D':
					opts += '<option value="'+attID+'">'+att.def.l+'</option>';
					break;
				}
			});
			jQuery('#dialog-sortby').append('<b>'+tmplt.def.l+'</b>: <select data-ti='+ti+'>'+opts+'</select><br/>');
		});
	}());

		// Ensure proper ending for creating URLs
	if (prspdata.site_url.charAt(prspdata.site_url.length-1) != '/') {
		prspdata.site_url += '/';
	}

	if (prspdata.e.g.l != '') {
		jQuery('#title').text(prspdata.e.g.l);
	}
		// Is there a local storage mechanism? Get local Readings if so
	try {
		var storage = window['localStorage'], x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		var lp = storage.getItem(prspdata.e.id);
		localStore = storage;
		if (lp.length > 0)
			localReadings = JSON.parse(lp);
	} catch(e) {
	}

		// Command Bar
	jQuery('#btn-about').button({icons: { primary: 'ui-icon-signal-diag' }, text: false })
			.click(clickAbout);
	jQuery('#btn-togtext').button({icons: { primary: 'ui-icon-arrow-2-e-w' }, text: false })
		.click(function() {
			jQuery('#view-frame-0').toggleClass('mini-text');
			jQuery('#view-frame-1').toggleClass('mini-text');
			views[1].resize();
		});

		// Check if need to disable Perspective buttons (added 1.7)
	if (typeof prspdata.e.g.dspr != 'undefined' && prspdata.e.g.dspr) {
		jQuery('#btn-show-reading').remove();
		jQuery('#btn-save-reading').remove();
	} else {
		jQuery('#btn-show-reading').button({icons: { primary: 'ui-icon-image' }, text: false })
				.click(clickShowReading);
		jQuery('#btn-save-reading').button({icons: { primary: 'ui-icon-pencil' }, text: false })
				.click(clickSaveReading);
	}

	jQuery('#btn-annote').button({icons: { primary: 'ui-icon-comment' }, text: false })
			.click(clickAnnotation);
	jQuery('#clearsel') //.button({icons: { primary: 'ui-icon-cancel' }, text: false })
		.click(clickClear);
	jQuery('#command-bar input[type=radio][name=vizmode]').change(function() {
		vMode = this.value;
		views[0].clearSel();
		views[1].clearSel();
			// Only try viz update if Record data loaded
		if (topStream != null) {
			render();
		}
	});

		// Are there Home settings?
	if (prspdata.e.g.hbtn.length > 0 && prspdata.e.g.hurl.length > 0) {
		jQuery('#home-title').text(prspdata.e.g.hbtn);
		jQuery('#btn-home').button({icons: { primary: 'ui-icon-home' }, text: false })
				.click(clickGoHome);
	} else {
		jQuery('#btn-home').remove();
	}

		// Handle selection of item on New Filter modal
	jQuery('#filter-list').click(function(event) {
			// Special case for "Hide/Remove All" pseudo-Filter
		if (event.target.nodeName == 'I') {
			jQuery("#filter-list li").removeClass("selected");
			jQuery(event.target).parent().addClass("selected");
		} else if (event.target.nodeName == 'LI') {
			jQuery("#filter-list li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Handle selection of item on Show Readings list
	jQuery('#reading-slist').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#reading-slist li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

	jQuery('#dialog-about .logo').attr("src", prspdata.assets+"prospectlogo.jpg");

		// Inspector Modal
	jQuery('#btn-inspect-left').button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false });
	jQuery('#btn-inspect-right').button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false });

		// Create New Filter list
	(function () {
		jQuery('#filter-list').append('<li class="remove" data-id="_remove"><i>'+dlText.rha+'</i></li>');
		var attList=[];
		prspdata.a.forEach(function(theAtt) {
				// Check to see if Attribute should be available to use on Filter
			if (typeof theAtt.def.f === 'undefined' || theAtt.def.f === true) {
				switch (theAtt.def.t) {
				case 'V':
				case 'T':
				case 'g':
				case 'N':
				case 'D':
				case 'P':
					attList.push({ id: theAtt.id, l: theAtt.def.l });
					break;
				} // switch
			} // if
		});
		attList.sort(function (a, b) {
			return a.l.localeCompare(b.l);
		});
		attList.forEach(function(theAtt) {
			jQuery('#filter-list').append('<li data-id="'+theAtt.id+'">'+theAtt.l+'</li>');
		});
	}());

	callbacks = { addSel: doAddSel, delSel: doDelSel, newText: doNewText, textFrame: null };

		// Always create and initialize Text Frame first
	views[0] = new PTextFrame(0, callbacks);
	views[0].initDOM();
	callbacks.textFrame = views[0];		// Set it retroactively after PTextFrame created

		// Not restoring Reading: create default
	if (prspdata.show_reading.length === 0 || !doShowReading(prspdata.show_reading)) {
		views[1] = new PVizFrame(1, callbacks);
		views[1].initDOM(0);
		setAnnote('');

			// Check to see if anchor passed in: if so, find in TOC
		var hash = window.location.hash;
		if (hash.length > 0) {
			hash = hash.substr(1);
			function evalIDFind(e, header) {
				return jQuery(e).attr('id') === hash;
				// return jQuery(e).find(hash).size() > 0;
			} // evalTxtFind()
			views[0].searchFunc(evalIDFind, true);
		}
	} // if no Reading

		// Allow ViewFrames to handle changes in size
	jQuery(window).resize(function() {
		if (views[1]) {
			views[1].resize();
		}
	});

		// If Auto-update is not set for this Exhibit, turn on if total num records < 500
		// NOTE: Must do this AFTER both ViewFrames have been created (i.e., by Perspective)
		//		so that they can intercept signal
	if (typeof prspdata.e.g.auto === 'undefined') {
		var total=0;
		for (var t=0; t<prspdata.t.length; t++) {
			total += prspdata.t[t].n;
		}
		if (total < 500) {
			autoUpdate=true;
		}
	} else {
		autoUpdate=prspdata.e.g.auto;
	}
	if (autoUpdate) {
		jQuery('#auto-re').prop('checked', true);
		jQuery("body").trigger("prospect", { s: "auto", a: autoUpdate });
	}

		// Watch Auto-Update checkbox (added 1.7)
	jQuery('#auto-re').change(function() {
		autoUpdate = jQuery('#auto-re').prop('checked');
			// If turned off autoUpdate, assumed any updates already applied!
			// Notify all listeners, which may need to update visuals
			// This will trigger an update of Legend changes for ViewFrames
		jQuery("body").trigger("prospect", { s: "auto", a: autoUpdate });
	});

		// Intercept global signals: data { s[tate] }
	jQuery("body").on("prospect", function(event, data) {
		switch (data.s) {
		case "loaded":
			var ready = document.getElementById('dltext-ready').innerHTML;
			var el = document.getElementById('pstate');
			el.classList.remove('attn');
			el.textContent = ready.trim();
				// ASSUMED: This won't be triggered until after Volume, Filters & Views set up
			doRecompute();
			if (hFilterIDs[0] != null) {
				doApplyHighlight(0);
			} else if (vMode === 'v2' && v0Sel != null) { 	// Special case of view mode 2 -- need to set before render()
				views[0].setSel(ids2absIs(v0Sel));
				v0Sel = null;
			}
			render();
			if (hFilterIDs[1] != null) {
				doApplyHighlight(1);
			} else {
					// Have RecID selections been saved?
				if (v0Sel != null) {
					views[0].setSel(ids2absIs(v0Sel));
					v0Sel = null;
				}
				if (v1Sel != null) {
					views[1].setSel(ids2absIs(v1Sel));
					v1Sel = null;
				}
			}
			jQuery('body').removeClass('waiting');
			break;
		case "hilite":
			clickHighlight(data.v, data.t);
			break;
		}
	});

		// Init hub using config settings
	PData.init();

		// Set up Help Tour?
	if (prspdata.x.tour) {
		function makeTour(domID, tourID) {
			var thisTour = {
				id: tourID,
				showPrevButton: true,
				i18n: {
					nextBtn: dlText.next,
					prevBtn: dlText.prev,
					doneBtn: dlText.close
				},
				steps: []
			};
			var cur = jQuery(domID).children(':first');
			while (cur.length != 0) {
				var nextStep = {	target: jQuery(cur).data('t'),
									placement: jQuery(cur).data('p'),
									title: jQuery(cur).data('l'),
									xOffset: jQuery(cur).data('x'),
									yOffset: jQuery(cur).data('y'),
									content: jQuery(cur).contents().text() };
				thisTour.steps.push(nextStep);
				cur = cur.next();
			}
			return thisTour;
		} // makeTour()
		tourTxt = makeTour('#help-txt-tour', 'helpTxt');
		tourTOC = makeTour('#help-toc-tour', 'helpTOC');
		tour = tourTxt;
		jQuery('#command-bar .help') // .button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(function() {
					hopscotch.startTour(tour);
				});
	} else {
		jQuery('#command-bar .help').hide();
	}
});

	// Interface between embedded YouTube player and code that uses it
	// This is called once iFrame and API code is ready
function onYouTubeIframeAPIReady()
{
		// Call saved function call
	if (widgetData.ytCall) {
		widgetData.ytCall();
	}
} // onYouTubeIframeAPIReady()
