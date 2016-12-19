// This file contains:
//		PViewFrame Objects
//		immediately executed function for launching processes and organizing screen

// NOTES: 	prspdata will pass the following information:
//				a = array of Attribute definitions { id, def, r, l }
//				t = array of Template definitions (no Joins) and Record numbers: { id, def, n }
//				e = Exhibit definition { id, g, vf, i }
//				m = overlay map data
//				p = array of associated Perspectives { l, s, n }

	// GLOBAL CONSTANTS

	// GLOBAL VARS
var xhbtURL;

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
// PViewFrame: Pseudo-object that manages contents of visualization frame
//				Creates Legend and maintains selection (passed to PVizModel on update)
// INPUT: 	vfIndex = index for this visualization frame (0 or 1)

function PViewFrame(vfIndex)
{
	var instance = { };			// creates pseudo-instance of Object

	// INSTANCE VARIABLES
	//===================

	var autoUpdate=false;		// If true, view should immediately update whenever change happens
	var vizSelIndex = 0;		// index of currently selected Viz
	var vizModel = null;		// PVizModel currently in frame
	var legendIDs = [];			// Attribute IDs of Legend selections (one per Template)
	var lDirty = null;			// Legend Dirty (enabled) if true
	var datastream = null;		// pointer to datastream given to view
	var vizStates = [];			// saves state of each vizualization between views as Perspective
	var curSelSize = 0;			// current selection size (don't save pointer to array)
	var inspRec=null;			// If ≠ null, open Inspector at this Record ID

	// PRIVATE FUNCTIONS
	//==================

		// PURPOSE: A Legend setting has changed and needs to be applied by refresh
		// INPUT:	s = true if Legend is dirty, false if not
	function setLDirty(s)
	{
		if (autoUpdate) {
			if (s) {
				doUpSel([], false);		// Re-render always clears selection
				if (vizModel)
					vizModel.render(datastream);
			}
			lDirty=false;				// Legend is always left "clean"
		} else {
			if (s !== lDirty) {
				lDirty=s;
				jQuery(getFrameID()+' div.lgnd-container div.lgnd-handle button.lgnd-update').prop('disabled', !s);
			}
		}
	} // setLDirty

		// PURPOSE: Return ID of Frame's outermost DIV container
	function getFrameID()
	{
		return '#view-frame-'+vfIndex;
	} // getFrameID()


	function selectChangeViz(event)
	{
		var selector = jQuery(getFrameID()+' div.view-controls select.view-viz-select option:selected');
		var newSelIndex   = selector.val();
		createViz(newSelIndex, true);
	} // selectChangeViz()


	function clickShowHideLegend(event)
	{
		if (vizModel.flags() & V_FLAG_LGND) {
			jQuery(getFrameID()+' div.lgnd-container').toggle('slide', {direction: "left" });
		}
		event.preventDefault();
	} // clickShowHideLegend()


		// PURPOSE: Open Record Inspector for current selection
	function clickOpenSelection(event)
	{
		var container = jQuery('#inspect-content');		// Inner container for Attributes & widgets
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

		if (vizModel)
			recSel = vizModel.getSel();
		if (recSel == null || recSel.length == 0)
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
									// seekTo doesn't work unless sound is already playing
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
//		doSelBtns(false);

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
			if (inspRec && r.id === inspRec) {
				i=j;
				jQuery('#inspect-list').val(j);
			}
		}
			// Clear target item by default
		inspRec=null;

			// Show first (or selected) item
		inspectShow();

		var btns = [];
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
//			doSelBtns(true);
				// Unbind Inspector from this view -- one off only
			inspector.off("dialogclose");
		});

		event.preventDefault();
	} // clickOpenSelection()

		// PURPOSE: Inform ViewFrame of selection change in ViewModel, update GUI
		// INPUT:	selList = array of absIDs, or [] if nothing selected
		//			if force, then GUI always refreshed
		// NOTES:	Does NOT modify the actual selection of the ViewModel!
		//			Not useful to save pointer to selList, as it will be modified in other code
	function doUpSel(selList, force)
	{
		var newSize = selList.length;

		if (force || curSelSize > 0 || newSize > 0) {
			var vCnxt = jQuery(getFrameID()+' div.view-controls');
			var selDiv = jQuery(getFrameID()+' div.sellist > div.sellist-scroll');
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
		curSelSize = newSize;
	} // doUpSel

	function clickHighlight(event)
	{
			// Send signal back to Prospect "main app" to create Highlight filter on this viz
		jQuery("body").trigger("prsp-hilite", { v: vfIndex, t: vizModel.tUsed });
		event.preventDefault();
	} // clickHighlight()

	function clickClearSelection(event)
	{
		if (vizModel)
			vizModel.clearSel();
		doUpSel([], false);
		event.preventDefault();
	} // clickClearSelection()

		// PURPOSE: Hide/show viz-specific controls on right side
	function clickVizControls(event)
	{
		if (vizModel)
			vizModel.doOptions();
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

		// PURPOSE: Turn on or off all feature Attributes for tmpltIndex
	function doShowHideAll(tmpltIndex, show)
	{
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', show);
		setLDirty(true);
	} // doShowHideAll()


		// PURPOSE: Set state of locate attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doLocateSelect(tmpltIndex, lID, show)
	{
		setLDirty(true);
	} // doLocateSelect()


		// PURPOSE: Make lID the only selected locate attribute for tmpltIndex
		// NOTE: 	Must update GUI
	function doLocateSelectOnly(tmpltIndex, lID)
	{
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate input.lgnd-entry-check').prop('checked', false);
			// Just reselect this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-locate[data-id="'+lID+'"] input.lgnd-entry-check').prop('checked', true);
		setLDirty(true);
	} // doLocateSelect()


		// PURPOSE: Set state of feature attribute vIndex within Legend tmpltIndex to show
		// NOTE: 	GUI already updated
	function doFeatureSelect(tmpltIndex, vIndex, show)
	{
		setLDirty(true);
	} // doFeatureSelect()


		// PURPOSE: Make vIndex the only selected feature attribute for tmpltIndex Legend
		// NOTE: 	Must update GUI
	function doFeatureSelectOnly(tmpltIndex, vIndex)
	{
			// Deselect everything
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group input.lgnd-entry-check').prop('checked', false);
			// Just select this one
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
								tmpltIndex+'"] div.lgnd-group div.lgnd-value[data-index="'+vIndex+
								'"] input.lgnd-entry-check').prop('checked', true);
		setLDirty(true);
	} // doFeatureSelectOnly()


		// PURPOSE: Handle click anywhere on Legend
	function clickLegend(event)
	{
			// Which Template does selection belong to?
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'lgnd-update':
			if (vizModel && datastream) {
				doUpSel([], false);				// Re-render from Apply on Legend always clears selection
				vizModel.render(datastream);
				setLDirty(false);
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
	} // clickLegend()

		// PURPOSE: Handle clicking an item on the Selection List
	function clickSelList(event)
	{
		var recID = jQuery(event.target).closest('div.sellist-rec').data('id');
		var clickClass = event.target.className;
		switch (clickClass) {
		case 'sellist-rec':
			inspRec=recID;
			clickOpenSelection(event);
			break;
		} // switch
	} // clickSelList()

		// PURPOSE: Handle selecting a feature Attribute for a Template from menu
	function selectTmpltAtt(event)
	{
			// Determine Template to which this refers
		var tmpltIndex = jQuery(event.target).closest('div.lgnd-template').data('index');
		var attID = jQuery(event.target).val();
		setLegendFeatures(tmpltIndex, attID);
		setLDirty(true);
	} // selectTmpltAtt()


		// PURPOSE: Set feature attributes in Legend
		// INPUT: 	lIndex = index of the Legend to change (0..numTemplates-1)
		//			attID = ID of feature Attribute in the Legend set
		// NOTES: 	Does not affect menu selection itself
	function setLegendFeatures(lIndex, attID)
	{
		var element;

		var group = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						lIndex+'"] div.lgnd-group');
			// Clear any previous entries
		group.empty();
		legendIDs[lIndex] = attID;
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
		jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
						lIndex+'"] div.lgnd-sh input').prop('checked', true);
	} // setLegendFeatures()


		// PURPOSE: Create appropriate VizModel within frame
		// INPUT: 	vIndex is visualization's index in Exhibit array
		//			if refresh, check for saved state and immediately redraw
	function createViz(vIndex, refresh)
	{
		var theView = PData.vByN(vIndex);

			// Remove current viz content
		if (vizModel) {
				// First save visualization's state so we can return to it later
			vizStates[vizSelIndex] = vizModel.getState();
			vizModel.teardown();
			vizModel = null;
		}
		var frame = jQuery(getFrameID());

		frame.find('div.viz-content div.viz-result').empty();

		var newViz;
		switch (theView.vf) {
		case 'M':
			newViz = new VizMap(instance, theView.c);
			break;
		case 'p':
			newViz = new VizMap2(instance, theView.c);
			break;
		case 'C':
			newViz = new VizCards(instance, theView.c);
			break;
		case 'P':
			newViz = new VizPinboard(instance, theView.c);
			break;
		case 'T':
			newViz = new VizTime(instance, theView.c);
			break;
		case 'D':
			newViz = new VizDirectory(instance, theView.c);
			break;
		case 't':
			newViz = new VizTextStream(instance, theView.c);
			break;
		case 'S':
			newViz = new VizStackChart(instance, theView.c);
			break;
		case 'N':
			newViz = new VizNetWheel(instance, theView.c);
			break;
		case 'n':
			newViz = new VizNetGraph(instance, theView.c);
			break;
		case 'F':
			newViz = new VizFlow(instance, theView.c);
			break;
		case 'B':
			newViz = new VizBrowser(instance, theView.c);
			break;
		case 'm':
			newViz = new VizMBMap(instance, theView.c);
			break;
		case 'b':
			newViz = new VizBMatrix(instance, theView.c);
			break;
		case 'Q':
			newViz = new VizQRMap(instance, theView.c);
			break;
		case 'q':
			newViz = new VizQRNet(instance, theView.c);
			break;
		case 'E':
			newViz = new VizEgoGraph(instance, theView.c);
			break;
		case 'e':
			newViz = new VizTimeRing(instance, theView.c);
			break;
		}
		vizSelIndex = vIndex;
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

		legendIDs=[];

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
				legendIDs.push(fAttID);
				setLegendFeatures(0, fAttID);
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
							legendIDs.push(fAttID);
							setLegendFeatures(tIndex, fAttID);
							prev=true;
						}
					}
				});
			}
			frame.find('div.lgnd-container').show();
		} else {	// No Legend
			frame.find('button.hslgnd').button('disable');
				// Just hide Legend
			frame.find('div.lgnd-container').hide();
		}
		instance.flushLgnd();
			// As we initially render view, "Update" should be disabled
		setLDirty(false);

			// Enable or disable corresponding Highlight button & Save Perspective checkboxes
		if (flags & V_FLAG_SEL) {
			frame.find('.hilite').button('enable');
			jQuery('#save-prspctv-h'+vfIndex).prop('disabled', false).prop('checked', false);
		} else {
			frame.find('.hilite').button('disable');
			jQuery('#save-prspctv-h'+vfIndex).prop('disabled', true).prop('checked', false);
		}

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
		doUpSel([], true);

			// Check if there is a previously saved state
		if (refresh) {
			var s = vizStates[vIndex];
			if (s) {
				newViz.setState(s);
			}
			if (datastream) {
				newViz.render(datastream);
			}
		}
		vizModel = newViz;
	} // createViz()


	// INSTANCE METHODS
	//=================

	instance.getFrameID = getFrameID;

		// Create array for saving state of visualizations as user switches between them
	for (var i=0; i<prspdata.e.vf.length; i++) {
		vizStates.push(null);
	}

	instance.getIndex = function()
	{
		return vfIndex;
	}

		// PURPOSE: Sets the visualization in the view and updates menu selection
		// ASSUMES: This is only called when restoring a Perspective, so it doesn't need to
		//			deal with vizStates[]
	instance.setViz = function(vI, refresh)
	{
		if (vI != vizSelIndex) {
			var select = jQuery(getFrameID()+' div.view-controls select.view-viz-select');
			select.val(vI);
			createViz(vI, refresh);
		}
	} // setViz()

		// PURPOSE: Initialize basic DOM structure for ViewFrame
	instance.initDOM = function(vI)
	{
		var viewDOM = document.getElementById('dltext-view-controls').innerHTML;
		jQuery('#viz-frame').append('<div id="view-frame-'+vfIndex+'">'+viewDOM+'</div>');

		var frame = jQuery(getFrameID());

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
		select.change(selectChangeViz);

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
				.button({icons: { primary: 'ui-icon-signal-diag' }, text: false })
				.click(clickClearSelection).next()
				.button({icons: { primary: 'ui-icon-battery-3' }, text: false })
				.click(clickOpenSelection);

		frame.find('div.lgnd-container')
			.click(clickLegend);

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

		createViz(vI, false);

			// Intercept Auto-Update signal
		jQuery("body").on("prsp-auto", function(event, data) {
				// Only act on it if different
			if (autoUpdate !== data.a) {
				autoUpdate = data.a;
				if (autoUpdate) {	// Turn on: disable Apply button, do any outstanding updates
					jQuery(getFrameID()+' div.lgnd-container div.lgnd-handle button.lgnd-update').prop('disabled', true);
						// Any outstand updates?
					if (lDirty) {
						doUpSel([], false);				// Re-render always clears selection
						if (vizModel) {
							vizModel.render(datastream);
						}
						lDirty=false;
					}
				}
					// NOTE: No need to enable Apply button on Legend, as that will happen if any user actions "dirty" it
			}
		});
	} // initDOM()


		// RETURNS: Array of currently selected locate Attribute IDs for tIndex
	instance.getSelLocAtts = function(tIndex)
	{
		var attIDs = [];
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
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
	instance.getSelFeatAtts = function(tIndex)
	{
		var attIndices = [], attIndex, i;
		var boxes = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+
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
	instance.getSelLegend = function(tIndex)
	{
		return legendIDs[tIndex];
	} // getSelLegend()

		// RETURNS: Array of Attribute IDs chosen for all Templates on Legend
	instance.getLgndSels = function()
	{
		return legendIDs.slice(0);
	} // getLgndSels()

		// PURPOSE: Set the Feature Attribute selections on the Legends
		// NOTES: 	Utility function for setting Perspective
	instance.setLgndSels = function(attIDs)
	{
		attIDs.forEach(function(attID, i) {
				// IDs for Templates not shown can be null
			if (attID) {
				var select = jQuery(getFrameID()+' div.lgnd-container div.lgnd-scroll div.lgnd-template[data-index="'+i+'"] select.lgnd-select');
				select.val(attID);
				setLegendFeatures(i, attID);
			}
		});
	} // setLgndSels()

		// RETURNS: The state of the current visualization
	instance.getState = function()
	{
		return vizModel ? vizModel.getState() : null;
	} // getState()

		// PURPOSE: Set the state of the current visualization
		// ASSUMES: This is used only to restore Perspective
		//			No need to save in vizStates[]
	instance.setState = function(state)
	{
		if (vizModel) {
			vizModel.setState(state);
		}
	} // getState()

		// PURPOSE: Called by external agent when new datastream is available for viewing
	instance.showStream = function(stream)
	{
		datastream = stream;
		if (vizModel) {
			vizModel.render(stream);
		}
		setLDirty(false);
	} // showStream()

	instance.setStream = function(stream)
	{
		datastream = stream;
	} // setStream()

		// PURPOSE: Inform ViewFrame of update to selection in View
	instance.upSel = function(selList)
	{
		doUpSel(selList, false);
	} // upSel()

		// PURPOSE: Inform view to clear current selection
		// NOTES:	Imposed because of recompute, filter reset, …
	instance.clearSel = function()
	{
		if (vizModel) {
			vizModel.clearSel();
		}
		doUpSel([], false);
	} // clearSel()

		// PURPOSE: Attempt to set the Selection List of the VizModel to selList
		// RETURNS: true if possible, false if not
		// NOTES:	Called with Highlight Filter results
	instance.setSel = function(selList)
	{
		if (vizModel) {
			if (vizModel.flags() & V_FLAG_SEL) {
				vizModel.setSel(selList);
				doUpSel(selList, false);
				return true;
			}
			return false;
		}
		return false;
	} // selSel()

		// PURPOSE: Handle VizModel reporting back -- only used for Volumes, so can ignore
	instance.vizAddSel = function(absI)
	{
	} // vizAddSel()

		// PURPOSE: Handle VizModel reporting back -- only used for Volumes, so can ignore
	instance.vizDelSel = function(absI)
	{
	} // vizDelSel()

		// PURPOSE: Alert inner visualization that view frame has resized
	instance.resize = function()
	{
		if (vizModel) {
			vizModel.resize();
		}
	} // resize()

	instance.title = function()
	{
		var v = PData.vByN(vizSelIndex);
		return v.l;
	} // title()

		// PURPOSE: Ensure Legend visible on right; may move Sel List to left
	instance.flushLgnd = function()
	{
		var frame = jQuery(getFrameID());
		var l = frame.width() - 280;
		frame.find('div.lgnd-container').css('left', l).css('top', 100);
		frame.find('div.sellist').css('left', l).css('top', 30);
	} // flushLgnd()

		// PURPOSE: Return the Record bitmap data for this view
	instance.getBMData = function()
	{
		return vizModel ? { t: vizModel.tUsed, r: vizModel.rMap } : null;
	} // getBMData()

	return instance;
} // PViewFrame


// Immediately Invoked Function Expression -- Bootstrap for Prospect Exhibit Client
// PURPOSE: Create DOM structure, initiate services, manage filters, …

// USES: 	jQuery, jQueryUI, view-core
// ASSUMES: prspdata is fully loaded


jQuery(document).ready(function($) {

		// VARIABLES
		//==========
	var views = [null, null];	// 2 possible viewFrames

	var apTmStr;				// Apply to <template label> for Filters
	var filters=[];				// Filter Stack: { id, f [PFilterModel], out [stream] }
	var fState=0;				// Filter State: 0 = no filter, 1 = filters changed, 2 = filters run

	var autoUpdate=false;		// If true, then all GUI changes trigger recompute

	var hFilters=[null, null];	// Highlight Filter
	var hFilterIDs=[null, null]; // Highlight Filter Attribute IDs

	var annote;					// Annotation from current Perspective

	var topStream;				// Top-level IndexStream (before Filters)
	var endStream;				// Final resulting IndexStream (after Filters)

	var localStore=null;		// Local (Browser) storage (if Browser capable)
	var localPrspctvs=[];		// locally-stored Perspectives

	var tour;

	var useQR;					// Are QRs enabled?
	var qrTI;					// index of QR Template

	useQR = typeof prspdata.e.g.qr !== 'undefined' && prspdata.e.g.qr.t !== 'disable';
	if (useQR) {
		qrTI = PData.tIByID(prspdata.e.g.qr.t);
	}

		// FUNCTIONS
		//==========

	function doRecompute()
	{
		var fDiv;

		if (topStream == null)
			topStream = PData.sNew(true);
		endStream = topStream;

			// Go through filter stack -- find 1st dirty and recompute from there
		var started=false, fI, theF;
		for (fI=0; fI<filters.length; fI++) {
			theF = filters[fI];
			fDiv = jQuery('div.filter-instance[data-id="'+theF.id+'"]');
				// If we've started, evaluate and propagate
			if (started || theF.f.isDirty(null) > 0) {
				started = true;
				var f = theF.f;
				f.evalPrep();
				var newStream = PData.sNew(false);
				var relI=0, absI, rec;
				var tI=0, tRec=endStream.t[0], tRn=0, rTotal=0;
				var e;
					// If not QR Filter, then check checkbox, but oNly run QR Filter on QR Template
				e = (f.att.id === '_qr' && qrTI === 0) || (fDiv.find('.apply-tmplt-0').is(':checked'));

					// Must keep absolute indices and template params updated!
				while (relI < endStream.l) {
						// Advance until we get to current Template rec
					while (tRec.n === 0 || (tRec.i+tRec.n) === relI) {
						newStream.t.push({ i: (newStream.l-tRn), n: tRn });
						tRn = 0;
						tRec = endStream.t[++tI];
						e = (f.att.id === '_qr' && qrTI === tI) || (fDiv.find('.apply-tmplt-'+tI).is(':checked'));
					}
					absI = endStream.s[relI++];
						// Need to evaluate
					if (e) {
						rec = PData.rByN(absI);
						if (f.eval(rec)) {
							newStream.s[newStream.l++] = absI;
							tRn++;
						}
						rTotal++;
						// Pass-through
					} else {
						newStream.s[newStream.l++] = absI;
						tRn++;
					}
				}
					// push out remaining Template recs
				while (tI++ < PData.eTNum()) {
					newStream.t.push( { i: (newStream.l-tRn), n: tRn } );
					tRn = 0;
				}
				f.isDirty(0);
				f.out = newStream;
				f.evalDone(rTotal);
				endStream = newStream;
			} else
				endStream = theF.f.out;
		}
		views.forEach(function(v) {
			if (v) {
				v.showStream(endStream);
			}
		});

		if (filters.length > 0) {
			fState = 2;
			jQuery('#btn-f-state').prop('disabled', true).html(dlText.filtered);
		} else {
			fState = 0;
			jQuery('#btn-f-state').prop('disabled', true).html(dlText.nofilter);
		}
	} // doRecompute()

	function clickFilter(event)
	{
			// Remove any selections first
		views.forEach(function(v) {
			if (v) {
				v.clearSel();
			}
		});
		doRecompute();
		event.preventDefault();
	} // clickFilter()

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


		// PURPOSE: Add 2nd window if not already there; remove if so
	function clickTog2nd()
	{
		if (views[1] !== null) {
			views[1] = null;
			jQuery('#view-frame-1').remove();
		} else {
			views[1] = PViewFrame(1);
			views[1].initDOM(0);
			views[1].showStream(endStream);
				// signal Auto-Update setting (off by default)
			if (autoUpdate) {
				jQuery("body").trigger("prsp-auto", { a: autoUpdate });
			}
		}
		views[0].resize();
		views[0].flushLgnd();
	} // clickTog2nd()

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
	function getPerspective(id)
	{
			// Check Perspectives from server
		var prspctv = _.find(prspdata.p, function(theP) {
			return id == theP.id;
		});
		if (prspctv)
			return prspctv;

		if (localStore == null || localPrspctvs.length == 0)
			return null;

		prspctv = _.find(localPrspctvs, function(theP) {
			return id == theP.id;
		});
		if (prspctv)
			return prspctv;

		return null;
	} // getPerspective()

		// PURPOSE: Save current Perspective as <id>
		// RETURNS: "local" or "server" if save successful, else null
	function doSavePerspective(id, label)
	{
			// Where to save it?
		var dest = jQuery('input[name=save-prspctv-dest]:checked').val();
		if (dest == '')
			return null;

		var note = jQuery('#save-prspctv-note').val();
		note = note.replace(/"/g, '');

			// Compile Perspective state from Views & Filter Stack
		var pState = { f: [], h0: null, h1: null, v0: null, v1: null };
		views.forEach(function(v, vI) {
			if (v) {
				pState['v'+vI] = { l: v.title(), s: v.getState() }
			}
		});
		filters.forEach(function(theF) {
			var a=[];
			var fDiv = jQuery('div.filter-instance[data-id="'+theF.id+'"]');
			for (var ti=0; ti<PData.eTNum(); ti++) {
				a.push(fDiv.find('.apply-tmplt-'+ti).is(':checked'));
			}
			pState.f.push({ id: theF.attID, a: a, s: theF.f.getState() });
		});

			// Save Highlight filters?
		for (var h=0; h<2; h++) {
			var hFilter = hFilters[h];
			if (hFilter !== null && jQuery('#save-prspctv-h'+h).is(':checked')) {
				pState['h'+h] = { id: hFilterIDs[h], s: hFilter.getState() };
			}
		}
			// Store everything in Perspective object
		var sPrspctv = { id: id, l: label, n: note, s: pState };

		if (dest == 'local') {
			localPrspctvs.push(sPrspctv);
			localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
		} else if (dest == 'server') {
				// Send via AJAX -- if successful, add locally
			jQuery.ajax({
				type: 'POST',
				url: prspdata.ajax_url,
				data: {
					action: 'prsp_save_prspctv',
					id: id,
					l: label,
					x: prspdata.e.id,
					n: note,
					s: JSON.stringify(pState)
				},
				success: function(data, textStatus, XMLHttpRequest)
				{
					if (data != '0')
						prspdata.p.push(sPrspctv);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
				   alert(errorThrown);
				}
			});
		}
		return dest;
	} // doSavePerspective()

	function clickSavePerspective(event)
	{
		var spDialog;
		var idExp = /[^\w\-]/;

			// Clear any previous input values
		jQuery('#save-prspctv-id').val('');
		jQuery('#save-prspctv-lbl').val('');
		jQuery('#save-prspctv-note').val('');

			// Make sure Browser has local storage capability
		if (!localStore) {
			jQuery('#save-prspctv-d-1').prop('disabled', true);
		}
			// If user not logged in, disable server capability
		if (!prspdata.x.add_prspctv) {
			jQuery('#save-prspctv-d-2').prop('disabled', true);
		}

			// Uncheck Highlight filters by default
		jQuery('#save-prspctv-h0').prop('checked', false);
		jQuery('#save-prspctv-h1').prop('checked', false);
			// Dis-/enable if no filter
		for (var h=0; h<2; h++) {
			var disable = (hFilters[h] === null || views[h] === null);
			jQuery('#save-prspctv-h'+h).prop('disabled', disable);
		}

		spDialog = jQuery("#dialog-save-prsrctv").dialog({
			dialogClass: "no-close",
			width: 350,
			height: 370,
			modal: true,
			buttons: [
				{
					text: dlText.ok,
					click: function() {
						var id = jQuery('#save-prspctv-id').val().trim();
							// Make sure ID correct format
						var idError = id.match(idExp);
						var label = jQuery('#save-prspctv-lbl').val().trim();
						label = label.replace(/"/g, '');

						if (id.length === 0 || id.length > 20 || idError)
							idError = '#dialog-prspctv-id-badchars';
							// Make sure ID not already taken
						else if (getPerspective(id))
							idError = '#dialog-prspctv-id-used';
						else if (label.length === 0 || label.length > 32)
							idError = '#dialog-prspctv-label-bad';
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
							var saved = doSavePerspective(id, label);
							spDialog.dialog("close");

							if (saved == 'server') {
									// Calculate Embed value
								var embed = xhbtURL + '/?prspctv=' + id;

								jQuery('#save-prspctv-embed').val(embed);
								var embedDialog = jQuery("#dialog-prspctv-url").dialog({
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
	} // clickSavePerspective()

	function managePerspectives()
	{
		var mpDialog;
		var xData=[];
		var xDataDirty=false;

		function createList()
		{
				// Clear scroll areas and recreate
			var pList = jQuery('#prspctv-mlist');
			pList.empty();

				// Populate local list
			localPrspctvs.forEach(function(theP) {
				pList.append('<li data-type="l" data-id="'+theP.id+'"><span class="label">'+theP.l+'</span> <button class="del">'+dlText.del+
					'</button> <button class="edit">'+dlText.edit+'</button></li>');
			});

				// Get other Perspectives of other Exhibits (on this domain)
			for (var i=0; i<localStore.length; i++) {
				var xKey = localStore.key(i);
				if (xKey != prspdata.e.id) {
					var xItem = localStore.getItem(xKey);
						// Put parse inside of try to prevent crash on parse problems
					try {
					    var parsed = JSON.parse(xItem);
						xData.push({ id: xKey, ps: parsed });
					} catch (e) {
						// Just ignore entry
					}
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

			// Handle selection of item on Manage Perspective list
		jQuery('#prspctv-mlist').click(function(event) {
			if (event.target.nodeName == 'BUTTON') {	// Edit or Delete?
				var del = jQuery(event.target).hasClass('del');
				var parent = jQuery(event.target).parent();
				var t = parent.data('type');
				var id = parent.data('id');
				var pI;
				if (del) {
					switch (t) {
					case 'l':
						pI = localPrspctvs.findIndex(function(theP) {
							return id == theP.id;
						});
						if (pI != -1) {
							localPrspctvs.splice(pI, 1);
							if (localPrspctvs.length == 0)
								localStore.removeItem(prspdata.e.id);
							else
								localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
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
						pRec = _.find(localPrspctvs, function(theP) {
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
					jQuery('#edit-prspctv-lbl').val(pRec.l);
					jQuery('#edit-prspctv-note').val(pRec.n);

					var epDialog = jQuery("#dialog-edit-prsrctv").dialog({
						dialogClass: "no-close",
						width: 340,
						height: 270,
						modal: true,
						buttons: [
							{
								text: dlText.ok,
								click: function() {
									pRec.l = jQuery('#edit-prspctv-lbl').val();
									pRec.n = jQuery('#edit-prspctv-note').val();
									parent.find('.label').text(pRec.l);
									if (t == 'x')
										xDataDirty = true;
									else
										localStore.setItem(prspdata.e.id, JSON.stringify(localPrspctvs));
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

		mpDialog = jQuery("#dialog-manage-prsrctv").dialog({
			dialogClass: "no-close",
			width: 450,
			height: 350,
			modal: true,
			buttons: [{
					text: dlText.ok,
					click: function() {
						if (xDataDirty) {
							xData.forEach(function(xEntry) {
								if (xEntry.ps.length > 0)
									localStore.setItem(xEntry.id, JSON.stringify(xEntry.ps));
								else
									localStore.removeItem(xEntry.id);
							});
						}
						jQuery('#prspctv-mlist').off("click");
						mpDialog.dialog("close");
					} // OK
				}]
		});
	} // managePerspectives()

	function clickShowPerspective(event)
	{
			// Clear scroll areas and recreate
		var pList = jQuery('#prspctv-slist');
		pList.empty();

			// Populate server list
		prspdata.p.forEach(function(theP) {
			pList.append('<li data-src="server" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

			// Populate local list
		localPrspctvs.forEach(function(theP) {
			pList.append('<li data-src="local" data-id="'+theP.id+'">'+theP.l+'</li>');
		});

		var bs = [{
					text: dlText.ok,
					click: function() {
						spDialog.dialog("close");
						var selItem = pList.find('li.selected');
						if (selItem.length) {
							var setP = selItem.data('id');
							doShowPerspective(setP);
						}
					} // OK
				},
				{
					text: dlText.cancel,
					click: function() {
						spDialog.dialog("close");
					}
				}];
		if (localStore)
			bs.push({text: dlText.manage,
					click: function() {
						spDialog.dialog("close");
						managePerspectives();
					}});

		var spDialog = jQuery("#dialog-show-prsrctv").dialog({
			dialogClass: "no-close",
			width: 350,
			height: 350,
			modal: true,
			buttons: bs
		});
		event.preventDefault();
	} // clickShowPerspective()

	function clickGoHome(event)
	{
		window.location.href=prspdata.e.g.hurl;
		event.preventDefault();
	} // clickGoHome()

	function clickFilterToggle(event)
	{
		jQuery(this).parent().next().slideToggle(400);
		event.preventDefault();
	} // clickFilterToggle()

		// PURPOSE: Handle clicking which Template Filter should apply to
	function clickFilterApply(event)
	{
		var head = jQuery(this).closest('div.filter-instance');
		if (head) {
			var fID = head.data('id');
			if (fID && fID !== '') {
				var fRec;
				fRec = filters.find(function(fr) { return fr.id == fID; });
				if (fRec == null)	{ alert('Bad Filter ID '+fID); return; }
				fRec.f.isDirty(2);
			}
		}
	} // clickFilterApply()

	function clickFilterDel(event)
	{
		var head = jQuery(this).closest('div.filter-instance');
		var fID = head.data('id');

		var fI, fRec, dirtyI;
		fI = filters.findIndex(function(fRec) { return fRec.id == fID; });
		if (fI === -1)	{ alert('Bad Filter ID '+fID); return; }

		fRec = filters[fI].f;
		fRec.teardown();

		filters.splice(fI, 1);
			// Deleted last filter in stack
		if (fI >= filters.length) {
			var endStream;
				// No filters left, reset ViewFrame data source
			if (filters.length === 0) {
				endStream = topStream;
			} else {
				endStream = filters[fI-1].out;
			}
			views.forEach(function(v) {
				if (v) {
					v.setStream(endStream);
				}
			});
		} else {
				// Datastream must be recomputed from successor on
			dirtyI=fI;
		}

			// Remove this DOM element
		head.remove();

			// Emptied Filter Stack?
		if (filters.length === 0) {
			jQuery('#btn-toggle-filters').button("disable");
				// Invalidate selections
			views.forEach(function(v) {
				if (v) {
					v.clearSel();
					v.showStream(endStream);
				}
			});
			jQuery('#btn-f-state').prop('disabled', true).html(dlText.nofilter);
		} else {
			if (!autoUpdate) {
				fState = 1;
				jQuery('#btn-f-state').prop('disabled', false).html(dlText.dofilters);
			}
				// This will either (1) dirty filter, or (2) trigger recompute
			if (dirtyI != null) {
				filters[dirtyI].f.isDirty(2);
			}
		}
		event.preventDefault();
	} // clickFilterDel()

		// PURPOSE: Add a new filter to the stack
		// INPUT: 	fID = Attribute ID
		//			apply = initial state of apply array (boolean for each Template)
		//			highlight = null if in Filter stack, else 0 or 1 (to indicate view applied to)
		// RETURNS: The Filter object created
		// NOTES:   IDs 0 and 1 are specially allocated to Highlight those respective views
		// ASSUMED: Remove && QR filters won't be created for Highlight condition
	function createFilter(fID, apply, highlight)
	{
		var newID;
		var newFilter;
		var theAtt;
		var insert;
		var appBoxes=apTmStr;
		var title;

		if (highlight !== null) {
			newID = highlight;
		} else {
			do {
				newID = Math.floor((Math.random() * 1000) + 2);
				if (filters.findIndex(function(theF) { return theF.id == newID; }) != -1)
					newID = -1;
			} while (newID == -1);
		}

		if (fID === '_remove') {
			newFilter = new PFilterRemove(newID);
			theAtt = { t: [ true, true, true, true ] };	// Create pseudo-Attribute entry
		} else if (fID === '_qr') {
			newFilter = new PFilterQR(newID);
			appBoxes='';
			title = dlText.qrrr;
		} else {
			theAtt = PData.aByID(fID);
			title = theAtt.def.l;
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

		if (highlight !== null) {
			insert = jQuery('#dialog-hilite-'+highlight+' span.filter-id').html(title);
			insert = jQuery('#hilite-'+highlight);
			insert.empty();

		} else {
			var newFRec = { id: newID, attID: fID, f: newFilter, out: null };
			filters.push(newFRec);

				// Now create DOM structure and handle clicks
			var fh = _.template(document.getElementById('dltext-filter-head').innerHTML);
			jQuery('#filter-instances').append(fh({ newID: newID, title: newFilter.title(), apply: appBoxes }));

			var head = jQuery('div.filter-instance[data-id="'+newID+'"]');

				// Check each checkbox acoording to default settings, disable acc to Template appearance
				// Only if type of Filter uses them
			if (appBoxes.length > 0) {
				for (var i=0; i<PData.eTNum(); i++) {
					var applier = head.find('.apply-tmplt-'+i);
					applier.prop('disabled', !theAtt.t[i]);
					applier.prop('checked', apply[i] && theAtt.t[i]);
					applier.click(clickFilterApply);
				}
			}

			head.find('button.btn-filter-toggle').button({
						text: false, icons: { primary: 'ui-icon-arrowthick-2-n-s' }
					}).click(clickFilterToggle);
			head.find('button.btn-filter-del').button({
						text: false, icons: { primary: 'ui-icon-trash' }
					}).click(clickFilterDel);
				// Code below should not be necessary, as initial state of all Filters allow all data through
			// fState = 1;
			// jQuery('#btn-f-state').prop('disabled', false).html(dlText.dofilters);
		}

			// Allow Filter to insert required HTML
		newFilter.setup();
		return newFilter;
	} // createFilter()

		// PURPOSE: Allow user to choose an Attribute from a list
		// INPUT: 	if forViz, then show visualization (not Highlight) Attributes
		//			if secondary, this dialog must appear on top of another
		//			usedTs is either null (show all Attributes) or is array of flags for each Template
		//				(Attribute must belong to one to appear)
		//			if Attribute is chosen, pass selection on to callback function
		// NOTES: 	Since this dialog can be invoked from two other modal dialogs, need
		//				to append at particular point in DOM to ensure stacked properly
	function chooseAttribute(forViz, secondary, usedTs, callback)
	{
			// Clear previous selection
		jQuery("#filter-list li").removeClass("selected");
			// Hide or Show Attributes
		var attList = jQuery("#filter-list li");
		var li, attID, attDef, on;
		attList.each(function(i) {
			li = jQuery(this);
			attID = li.data("id");
			if (attID === '_remove') {
					// Do we show "Remove" Filter Option?
				if (forViz) {
					li.show();
				} else {
					li.hide();
				}
			} else if (attID === '_qr') {
					// Enable QR filter to appear both in Filter Stack and Highlight dialog
				if (useQR) {
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
					if (on)
						li.show();
					else
						li.hide();
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

	function clickNewFilter(event)
	{
		chooseAttribute(true, false, null, function(id) {
			jQuery('#filter-instances').show(400);
				// Deselect All Templates ONLY in case of Remove All Filter
				// Created (default) state of Filters always have no effect
			var applyTs = (id === '_remove') ? [false, false, false, false] : [true, true, true, true];
			createFilter(id, applyTs, null);
			jQuery('#btn-toggle-filters').button("enable");
		});
		event.preventDefault();
	} // clickNewFilter()


	function clickToggleFilters(event)
	{
		jQuery('#filter-instances').slideToggle(400);
		event.preventDefault();
	} // clickToggleFilters()

		// PURPOSE: Apply effect of a Highlight filter
		// TO DO: 	Get tUsed, rMap from the VizModels themselves!
	function doApplyHighlight(vI)
	{
		var vf = views[vI];
		var bm = vf.getBMData();
		var list=[];
		var hFilter=hFilters[vI];
		var qrF = (hFilter.att.id === '_qr');

		if (endStream !== null) {
			hFilter.evalPrep();

			var relI=0, absI, rec;
			var tI=0, tRec=endStream.t[0];
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
						// Ensure that we only call QR Filter for QR Templates
					if (!qrF || (qrTI === tI)) {
						rec = PData.rByN(absI);
						if (hFilter.eval(rec)) {
							list.push(absI);
						}
					}
				}
			}
			hFilter.evalDone(endStream.l);
		}

		if (list.length > 0) {
			vf.setSel(list);
		} else {
			vf.clearSel();
		}
	} // doApplyHighlight()

		// PURPOSE: Handle click on "Highlight" button
		// INPUT: 	vI = index of view frame
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


		// PURPOSE: Attempt to show Perspective pID
		// RETURN:  false if error
	function doShowPerspective(pID)
	{
		function vizIndex(vID)
		{
			return prspdata.e.vf.findIndex(function(vf) {
				return vID == vf.l;
			});
		}

		var p = getPerspective(pID);
		if (p == null)
			return false;
			// Minimize filter and selector bars
		jQuery('#filter-frame').hide();

			// Clear current Filter Stack & Selector Filter
		filters.forEach(function(theF) {
			theF.f.teardown();
		});
		filters=[];
		jQuery('#filter-instances').empty();

		p.s.f.forEach(function(fRec) {
			var newF = createFilter(fRec.id, fRec.a, null);
			newF.setState(fRec.s);
		});
		jQuery('#filter-instances').hide();
		jQuery('#btn-toggle-filters').button(p.s.f.length == 0 ? "disable" : "enable");

			// Load Highlight filters?
		for (var h=0; h<2; h++) {
			if (p.s['h'+h] != null) {	// Want to check for both null and undefined!
				var hFData = p.s['h'+h];
				hFilterIDs[h] = hFData.id;
				var hFilter = createFilter(hFData.id, null, h);
				hFilters[h] = hFilter;
				hFilter.setState(hFData.s);
			} else {
				hFilters[h] = null;
				hFilterIDs[h] = null;
			}
		}

		var vI, v0=views[0], v1=views[1];
		var resize0=false;

		vI = vizIndex(p.s.v0.l);
			// Already exists?
		if (v0) {
			v0.setViz(vI, false);
			v0.upSel([], true);
		} else {
			views[0] = PViewFrame(0);
			v0 = views[0];
			v0.initDOM(vI);
		}

		if (p.s.v1 !== null) {
			vI = vizIndex(p.s.v1.l);
				// Already exists?
			if (v1) {
				v1.upSel([], true);
				v1.setViz(vI, false);
				v1.setState(p.s.v1.s);
			} else {
				views[1] = PViewFrame(1);
				v1 = views[1];
				v1.initDOM(vI);
				v1.setState(p.s.v1.s);
				resize0 = true;
				v0.flushLgnd();
			}
		} else {
			if (v1) {
				views[1] = null;
				jQuery('#view-frame-1').remove();
				resize0 = true;
			}
		}
			// Do left-side last because of resizing with right side
		if (resize0)
			v0.resize();
		v0.setState(p.s.v0.s);

		setAnnote(p.n);

			// Don't recompute if data not loaded yet
		if (PData.ready() && topStream) {
			doRecompute();
			for (h=0; h<2; h++) {
				if (hFilterIDs[h] !== null) {
					doApplyHighlight(h);
				}
			}
		}

		return true;
	} // doShowPerspective()


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
	localizeColor('fs', '#filter-frame');

	if (typeof PMapHub !== 'undefined') {
		PMapHub.init(prspdata.m, prspdata.mg);
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
		loadFrag('dltext-qr-rr', 'qrrr');
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

		// Remove any Perspective query string and prefix and trailing /
	xhbtURL = window.location.pathname;
	xhbtURL = xhbtURL.replace(/\&*prspctv=[\w\-]+/, '');
	xhbtURL = xhbtURL.replace(/\/$/, '');
	xhbtURL = xhbtURL.replace(/^\//, '');
	xhbtURL = "http://" + window.location.host + "/" + xhbtURL;

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

		// Is there a local storage mechanism? Get local Perspectives if so
	try {
		var storage = window['localStorage'], x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		var lp = storage.getItem(prspdata.e.id);
		localStore = storage;
		if (lp.length > 0) {
			localPrspctvs = JSON.parse(lp);			// Parse errors will leave array empty
		}
	} catch(e) {
		// If there are any errors in local Perspective data, leave empty
	}

		// Command Bar
	jQuery('#btn-about').button({icons: { primary: 'ui-icon-power' }, text: false })
			.click(clickAbout);
	jQuery('#btn-set-layout').button({icons: { primary: 'ui-icon-newwin' }, text: false })
			.click(clickTog2nd);
	jQuery('#btn-hs-bars').button({icons: { primary: 'ui-icon-arrowthick-2-n-s' }, text: false })
			.click(function(event) {
				jQuery('#filter-frame').slideToggle(400);
				event.preventDefault();
			});

		// Check if need to disable Perspective buttons (added 1.7)
	if (typeof prspdata.e.g.dspr != 'undefined' && prspdata.e.g.dspr) {
		jQuery('#btn-show-prspctv').remove();
		jQuery('#btn-save-prspctv').remove();
	} else {
		jQuery('#btn-show-prspctv').button({icons: { primary: 'ui-icon-image' }, text: false })
				.click(clickShowPerspective);
		jQuery('#btn-save-prspctv').button({icons: { primary: 'ui-icon-calendar' }, text: false })
				.click(clickSavePerspective);
	}
	jQuery('#btn-annote').button({icons: { primary: 'ui-icon-comment' }, text: false })
			.click(clickAnnotation);

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

		// Handle selection of item on Show Perspective list
	jQuery('#prspctv-slist').click(function(event) {
		if (event.target.nodeName == 'LI') {
			jQuery("#prspctv-slist li").removeClass("selected");
			jQuery(event.target).addClass("selected");
		}
	});

		// Filter Control Bar
	jQuery('#btn-new-filter').button({icons: { primary: 'ui-icon-plus' }, text: false })
			.click(clickNewFilter);
	jQuery('#btn-toggle-filters').button({icons: { primary: 'ui-icon-arrowthick-2-n-s' }, text: false })
			.click(clickToggleFilters);
	jQuery('#btn-f-state').click(clickFilter);

	jQuery('#dialog-about .logo').attr("src", prspdata.assets+"prospectlogo.jpg");

		// Inspector Modal
	jQuery('#btn-inspect-left').button({ icons: { primary: 'ui-icon-arrowthick-1-w' }, text: false });
	jQuery('#btn-inspect-right').button({ icons: { primary: 'ui-icon-arrowthick-1-e' }, text: false });

		// Create New Filter list
	(function () {
		jQuery('#filter-list').append('<li class="remove" data-id="_remove"><i>'+dlText.rha+'</i></li>');
		if (useQR) {
			jQuery('#filter-list').append('<li class="remove" data-id="_qr"><i>'+dlText.qrrr+'</i></li>');
		}
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
				}
			}
		});
		attList.sort(function (a, b) {
			return a.l.localeCompare(b.l);
		});
		attList.forEach(function(theAtt) {
			jQuery('#filter-list').append('<li data-id="'+theAtt.id+'">'+theAtt.l+'</li>');
		});
	}());

		// Restore Perspective or create default?
	if (prspdata.show_prspctv.length == 0 || !doShowPerspective(prspdata.show_prspctv)) {
		views[0] = PViewFrame(0);
		views[0].initDOM(0);
		setAnnote('');
	}

		// Allow ViewFrames to handle changes in size
	jQuery(window).resize(function() {
		views.forEach(function(v) {
			if (v) {
				v.resize();
			}
		})
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
		jQuery("body").trigger("prsp-auto", { a: autoUpdate });
	}

		// Watch Auto-Update checkbox (added 1.7)
	jQuery('#auto-re').change(function() {
		autoUpdate = jQuery('#auto-re').prop('checked');
		if (autoUpdate) {	// If turned on, apply any outstanding updates and disable buttons
			if (fState === 1) {
				views.forEach(function(v) {
					if (v) {
						v.clearSel();
					}
				});
				doRecompute();
			}
		}	// If turned off autoUpdate, assumed any updates already applied!
			// Notify all listeners, which may need to update visuals
			// This will trigger an update of Legend changes for ViewFrames
		jQuery("body").trigger("prsp-auto", { a: autoUpdate });
	});

		// Intercept global signals: data { s[tate] }

		// ASSUMED: Loaded signal won't be sent until after Filters & Views set up
	jQuery("body").on("prsp-loaded", function(event) {
		var ready = document.getElementById('dltext-ready').innerHTML;
		var el = document.getElementById('pstate');
		el.classList.remove('attn');
		el.textContent = ready.trim();
		doRecompute();
		for (var h=0; h<2; h++) {
			if (hFilters[h] !== null) {
				doApplyHighlight(h);
			}
		}
		jQuery('body').removeClass('waiting');
	});
	jQuery("body").on("prsp-fdirty", function(event) {
		if (autoUpdate) {
			views.forEach(function(v) {
				if (v) {
					v.clearSel();
				}
			});
			doRecompute();
		} else {
			fState = 1;
			jQuery('#btn-f-state').prop('disabled', false).html(dlText.dofilters);
		}
	});
	jQuery("body").on("prsp-hilite", function(event, data) {
		clickHighlight(data.v, data.t);
	});

		// Init hub using config settings
	PData.init();

		// Set up Help Tour?
	if (prspdata.x.tour) {
		tour = {
			id: "ProspectTour",
			showPrevButton: true,
			i18n: {
				nextBtn: dlText.next,
				prevBtn: dlText.prev,
				doneBtn: dlText.close
			},
			steps: []
		};
		var cur = jQuery('#help-tour').children(':first');
		while (cur.length != 0) {
			var nextStep = {	target: jQuery(cur).data('t'),
								placement: jQuery(cur).data('p'),
								title: jQuery(cur).data('l'),
								xOffset: jQuery(cur).data('x'),
								yOffset: jQuery(cur).data('y'),
								content: jQuery(cur).contents().text() };
			tour.steps.push(nextStep);
			cur = cur.next();
		}
		jQuery('#command-bar .help') // .button({icons: { primary: 'ui-icon-info' }, text: false })
				.click(function() {
						// Ensure Filter section open
					jQuery('#filter-frame').slideDown(200);
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
