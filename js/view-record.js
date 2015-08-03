// ================================================================================
// PRecordView
// PURPOSE: Outputs a Record's data on Post page according to Exhibit Configuration

// USES: jQuery (for AJAX), underscore

// NOTES: 	The following data is loaded into prspdata
//				a = array of all Attribute data
//				ajax_url
//				d = Object of all Record (meta)data
//				j = Template's Join table
//				t = array of dependent Templates
//				v = Template's View configuration

jQuery(document).ready(function($) {
	var insertCnt = $('.entry-content');

	var dltextFrom = document.getElementById('dltext-from').innerHTML;
	var dltextTo = document.getElementById('dltext-to').innerHTML;
	var dltextApprox = document.getElementById('dltext-approximately').innerHTML;
	var dltextNow = document.getElementById('dltext-now').innerHTML;

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
			return a.join(', ');
		case 'T':
			return a;
		case 'N':
			return a.toString();
		case 'D':
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
		case 'L':
		case 'X':
			return a.join();
		case 'I':
			return '<img src="'+a+'" alt="'+att.def.l+'"/>';
		case 'l':
			return '<a href="'+a+'" target="_blank">(See Link)</a>';
		case 'S':
			return '<a href="'+a+'" target="_blank">(SoundCloud)</a>';
		case 'Y':
			return '<a href="https://www.youtube.com/watch?v='+a+'" target="_blank">(YouTube)</a>';
		case 'x':
			return '<a href="'+a+'" target="_blank">(See Transcript File)</a>';
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
			if (datum)
				newText += '<div><b>'+l+'</b>: '+datum+'</div>';
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
	if (newText.length > 0)
		insertCnt.prepend(newText);
});