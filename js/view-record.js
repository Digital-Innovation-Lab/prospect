// ================================================================================
// PRecordView
// PURPOSE: Outputs a Record's data on Post page according to Exhibit Configuration

// USES: jQuery (for AJAX), underscore

// NOTES: 	The following data is loaded into prspdata
//				a = array of all Attribute data
//				ajax_url
//				d = Object of all Record (meta)data
//				v = View configuration

jQuery(document).ready(function($) {
	var insertCnt = $('.entry-content');

	var dltextFrom = 'From';
	var dltextTo = 'to';
	var dltextApprox = 'approximately';
	var dltextNow = 'now';

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
		case 'Vocabulary':
			return a.join(', ');
		case 'Text':
			return a;
		case 'Number':
			return a.toString();
		case 'Dates':
			var ds;
				// Range
			if (a.max) {
				ds = dltextFrom+' ';
				if (a.min.f)
					ds += ' '+dltextApprox+' ';
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
		case 'Lat-Lon':
		case 'X-Y':
			return a.join();
		case 'Image':
			return '<img src="'+a+'" alt="'+att.def.l+'"/>';
		case 'Link To':
			return '<a href="'+a+'" target="_blank">(See Link)</a>';
		case 'SoundCloud':
			return '<a href="'+a+'" target="_blank">(SoundCloud)</a>';
		case 'YouTube':
			return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
		case 'Transcript':
			return '<a href="'+a+'" target="_blank">(See Transcript File)</a>';
		case 'Timecode':
			return a;
		// case 'Pointer': 	// Can't process this without rest of DB
		// case 'Join': 	// Should not appear
		} // switch
		return null;
	} // procAttTxt()


		// Output all of the Post view Attributes
		// TO DO: process dot-notation Attribute names
	prspdata.v.cnt.forEach(function(attID) {
		var att = getAttID(attID);

		if (att) {
			var attPrefix = '';
			var datum = procAttTxt(attID, att);
			if (datum)
				insertCnt.append('<div><b>'+att.def.l+'</b>: '+datum+'</div>');
		}
	});
});