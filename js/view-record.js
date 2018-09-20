// ================================================================================
// PRecordView
// PURPOSE: Outputs a Record's data on Post page according to Exhibit Configuration
// NOTES:   As Prospect data comes before blog content, must prepend into DOM DIV
//				in reverse order; this also means that we need to get extract timecode
//				before transcript is processed.

// USES: jQuery (for AJAX), underscore, SoundCloud, YouTube


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
	tcArray: [],				// Array of timecode records { s[tart], e[nd] } in milliseconds
	tcIndex: -1 				// Index of playhead in tcArray
};

// NOTES: 	The following data is loaded into prspdata
//				a = array of all Attribute data
//				ajax_url
//				d = Object of all Record (meta)data
//				j = Template's Join table
//				t = array of dependent Templates
//				v = Template's View configuration

jQuery(document).ready(function($) {
	var container = $('.entry-content');

	var avType=0;		// 0=none, 1=SoundCloud, 2=YouTube, 3=Native Audio
	var scAttVal;		// SoundCloud URL or null
	var ytAttVal;		// YouTube code or null

	var parseTC = /(\d\d)\:(\d\d)\:(\d\d)\.(\d\d?)/; 	// precise regular expression for parsing timecodes



	var dltextTo = document.getElementById('dltext-to').innerHTML;
	var dltextApprox = document.getElementById('dltext-approximately').innerHTML;
	var dltextNow = document.getElementById('dltext-now').innerHTML;
	var dlTextUndef = document.getElementById('dltext-undef').innerHTML;
	var dlTextSeeLink = document.getElementById('dltext-see-link').innerHTML;
	var dlTextGoAudio = document.getElementById('dltext-go-audio').innerHTML;
	var dlTextGoTranscript = document.getElementById('dltext-go-transcript').innerHTML;

		// RETURNS: Attribute definition with this ID
		// INPUT:   attID = full Attribute ID (could be in Join dot notation)
	function getAttID(attID)
	{
		var lo = 0;
		var hi = prspdata.a.length-1;
		var pos, cmp;

		while (lo <= hi) {
			pos = (lo + hi) >> 1;
			cmp = prspdata.a[pos].id.localeCompare(attID);

			if (cmp < 0) {
				lo = pos + 1;
			} else if (cmp > 0) {
				hi = pos - 1;
			} else {
				return prspdata.a[pos];
			}
		}
		return null;
	} // getAttID()

		// RETURNS: Attribute value in string format
	function procAttTxt(attID, att)
	{
		var a = prspdata.d[attID];
		if (typeof a == 'undefined' || a == null)
			return null;

		switch (att.def.t) {
		case 'V':
		case 'g':
			return a.join(', ');
		case 'T':
			return a;
		case 'N':
			if (a === '?')
				return dlTextUndef;
			return a.toString();
		case 'D':
			if (a === '?')
				return dlTextUndef;
			var ds;
				// Range
			if (a.max) {
				ds = ' ';
				if (a.min.f)
					ds = dltextApprox+' ';
				ds += a.min.y.toString();
				if (a.min.m) {
					ds += '-'+a.min.m.toString();
					if (a.min.d)
						ds += '-'+a.min.d.toString();
				}
				ds += ' '+dltextTo+' ';
				if (a.max == 'open') {
					ds += dltextNow;
				} else {
					if (a.max.f)
						ds += dltextApprox+' ';
					ds += a.max.y.toString();
					if (a.max.m) {
						ds += '-'+a.max.m.toString();
						if (a.max.d)
							ds += '-'+a.max.d.toString();
					}
				}
			} else {
				if (a.min.f)
					ds = dltextApprox+' ';
				else
					ds = '';
				ds += a.min.y.toString();
				if (a.min.m) {
					ds += '-'+a.min.m.toString();
					if (a.min.d)
						ds += '-'+a.min.d.toString();
				}
			}
			return ds;
		case 'L':
		case 'X':
			if (att.def.d != null & att.def.d !== '') {
				if (typeof a[0] === 'number') {
					return a.join(', ');
				} else {
					return a.map(function(p) { return p.join(', '); }).join(att.def.d+' ');
				}
			} else
				return a.join(', ');
		case 'I':
			return '<img src="'+a+'" alt="'+att.def.l+'"/>';
		case 'l':
			return '<a href="'+a+'" target="_blank">('+dlTextSeeLink+')</a>';
		case 'S':
			return '<a href="'+a+'" target="_blank">('+dlTextGoAudio+')</a>';
		case 'Y':
			return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
		case 'x':
			return '<a href="'+a+'" target="_blank">'+dlTextGoTranscript+'</a>';
		case 't':
			return a;
		// case 'P': 	// Can't process this without rest of DB
		// case 'J': 	// Should not appear
		} // switch
		return null;
	} // procAttTxt()

	var newText = '';

		// Output all of the Post view Attributes
	prspdata.v.cnt.forEach(function(attID) {
		function appendAttData(id, att, l)
		{
			var datum = procAttTxt(id, att);
			if (datum) {
				if (l.charAt(0) == '_')
					newText += '<div>'+datum+'</div>';
				else if (att.def.t == 'I')
					newText += '<div><b>'+l+'</b>:<br/>'+datum+'</div>';
				else
					newText += '<div><b>'+l+'</b>: '+datum+'</div>';
			}
		} // appendAttData

		var att = getAttID(attID);

			// If a Join Attribute, must apply dependent Template's View table
		if (att) {
			if (att.def.t == 'J') {
					// Look up Attribute name in Join table
				var join = _.find(prspdata.j, function(theJoin) { return theJoin.id === attID; });
				if (join) {
						// Find dependent Template
					var dTemp = _.find(prspdata.t, function(theDTmplt) { return theDTmplt.id === join.t; });
					if (dTemp) {
							// Output all dependent view Attributes
						dTemp.v.cnt.forEach(function(jAttID) {
							var jAtt = getAttID(jAttID);
							if (jAtt) {
								appendAttData(attID+'.'+jAttID, jAtt, att.def.l+' ('+jAtt.def.l+')');
							}
						});
					}
				}
			} else
				appendAttData(attID, att, att.def.l);
		}
	});
	if (newText.length > 0) {
		container.prepend(newText);
	}

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
			// console.log("Parsed " + match[1] + ":" + match[2] + ":" + match[3]);
			milliSecs = (parseInt(match[1])*3600 + parseInt(match[2])*60 + parseFloat(match[3])) * 1000;
				// The multiplier to use for last digits depends on if it is 1 or 2 digits long
			if (match[4].length == 1) {
				milliSecs += parseInt(match[4])*100;
			} else {
				milliSecs += parseInt(match[4])*10;
			}
		} else {
			reportError(false, "Error in transcript file: Cannot parse " + tc + " as timecode.");
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
			var tb='';
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
		var tcs = widgetData.tcArray;

			// split transcript text into array by line breaks
		var splitXcript = new String(text);
			// Server request processes any extract
		splitXcript = tTrim(splitXcript).split(/\r\n|\r|\n/g);

		if (splitXcript) {
			var tcI = 0;
			var timeCode, lastCode=0, lastStamp=0;
			var tb='';		// Text block being built
			var xtbl = jQuery('#xscript-tbl');
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
			var t2AttID = prspdata.v.t.t2Att;
				// Is there is a 2nd transcript? Load it
			if (t2AttID && t2AttID !== '' && t2AttID !== 'disable') {
				var t2URL = prspdata.d[t2AttID];
				if (t2URL) {
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
				} // if t2URL
			} // if t2AttID
		} // if (split)
	} // formatXscript1()

		// PURPOSE: Return start and end times for extract if any
		// ASSUMES: Any timecode given contains both start and end separated by "-"
	function getSETimes()
	{
		var tcAttID = prspdata.v.t.tcAtt;
		if (tcAttID && tcAttID != '' && tcAttID != 'disable')
		{
			var tcAttVal=prspdata.d[tcAttID];

			if (tcAttVal && tcAttVal != '')
			{
				widgetData.extract = tcAttVal;
				var tcs = tcAttVal.split('-');
				widgetData.sTime = tcToMilliSecs(tcs[0]);
				widgetData.eTime = tcToMilliSecs(tcs[1]);
			}
		}
	} // getSETimes()


		// Need to determine A/V widget usage and timecode extracts before
		//	transcript parsed
	avAttID = prspdata.v.sc;
	if (avAttID && avAttID !== '' && avAttID !== 'disable') {
		scAttVal = prspdata.d[avAttID];
		if (scAttVal) {
			getSETimes();
			if (scAttVal.match(/soundcloud\.com/)) {
				avType=1;
			} else {
				avType=3;
			}
		}
	}
	if (avType === 0) {
		avAttID = prspdata.v.yt;
		if (avAttID && avAttID !== '' && avAttID !== 'disable') {
			ytAttVal = prspdata.d[avAttID];
			if (ytAttVal) {
				getSETimes();
				avType=2;
			}
		}
	}


		// Create transcription widget?
	if (prspdata.v.t.t1Att) {
		var t1AttID = prspdata.v.t.t1Att;
		var t1URL = prspdata.d[t1AttID];
		if (t1URL) {
			container.prepend('<div id="xscript-tbl"><div>');
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

				// Load and parse transcript file
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
	} // if tOn


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
						if (widgetData.playing) {
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

		// Process SoundCloud value
	if (avType === 1) {
			// Add synchronize button if both A/V and Transcript
		if (widgetData.xscriptOn) {
			container.prepend('<div>'+document.getElementById('dltext-sync-xscript').innerHTML+'</div>');
		}
		container.prepend('<iframe id="sc-widget" class="player" width="100%" height="166" src="//w.soundcloud.com/player/?url='+
			scAttVal+'"></iframe></p>');

			// Must set these variables after HTML added above
		var playWidget = SC.Widget(document.getElementById('sc-widget'));
		widgetData.widget = playWidget;
			// Setup SoundCloud player after entire sound clip loaded
		playWidget.bind(SC.Widget.Events.READY, function() {
				// Prime the audio -- must initially play (seekTo won't work until sound loaded and playing)
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
	} // if SoundCloud

		// Process YouTube value
	else if (avType === 2) {
		widgetData.ytCode = ytAttVal;
			// Add synchronize button if both A/V and Transcript
		if (widgetData.xscriptOn) {
			container.prepend('<div>'+document.getElementById('dltext-sync-xscript').innerHTML+'</div>');
		}
		container.prepend('<div id="yt-widget"></div>');

			// YouTube API is only loaded once
		if (!widgetData.ytLoaded) {
			widgetData.ytLoaded = true;
			widgetData.ytCall = ytActivate;

				// Create a script DIV that will cause API to be loaded
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var scriptTag = document.getElementsByTagName('script')[0];
			scriptTag.parentNode.insertBefore(tag, scriptTag);
				// wait for hook invocation to set playWidget and bind handlers
		} else
			ytActivate();
	} // if YouTube

		// Process native audio widget
	else if (avType === 3) {
			// Add synchronize button if both A/V and Transcript
		if (widgetData.xscriptOn) {
			container.prepend('<div>'+document.getElementById('dltext-sync-xscript').innerHTML+'</div>');
		}
			// If there is timecode extract, need to add to URL
		if (widgetData.extract) {
			var tcs = widgetData.extract.split('-');
			scAttVal += '#t='+tcs[0]+','+tcs[1];
		}
		container.prepend('<audio id="na-widget" controls src="'+scAttVal+'"></audio>');
		widgetData.widget = document.getElementById('na-widget');
		widgetData.widget.addEventListener("ended", naWidgetStopped);
		widgetData.widget.addEventListener("pause", naWidgetStopped);
		widgetData.widget.addEventListener("playing", naWidgetPlaying);
		widgetData.widget.addEventListener("timeupdate", naWidgetUpdate);
	} // if native audio
});


	// Interface between embedded YouTube player and code that uses it
	// This is called once iFrame and API code is ready
function onYouTubeIframeAPIReady()
{
		// Call saved function call
	widgetData.ytCall();
} // onYouTubeIframeAPIReady()
