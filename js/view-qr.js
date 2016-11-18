// This file contains:
//		PVizModel Classes for Qualified Relationship visualizations
//		PFilterQR Class for Filtering on Relationship-Roles

// ================================================================================
// VizEgoGraph: Class to visualize relationships from a given "ego" node
//	Instance Variables:

var VizEgoGraph = function(viewFrame, vSettings)
{
	PVizModel.call(this, viewFrame, vSettings);
} // VizEgoGraph

VizEgoGraph.prototype = Object.create(PVizModel.prototype);

VizEgoGraph.prototype.constructor = VizEgoGraph;

VizEgoGraph.prototype.flags = function()
{
	return V_FLAG_LGND | V_FLAG_SLGND | V_FLAG_VSCRL | V_FLAG_HSCRL;
} // flags()

VizEgoGraph.prototype.getFeatureAtts = function(tIndex)
{
	return this.settings.sAtt;
} // getFeatureAtts()


// ====================================================================================
// PFilterQR: Filter class that removes all QR Records based on Relationships and Roles
//	Instance Variables:
//		t = index of QR Template
//		qr = shortcut to QR settings
//		r = ID of Vocab Attribute for currently selected Relationship term
//		rT = currently selected Relationship term
//		rOn = if true, eval on basis of <r>
//		r1 = ID of Vocab Attribute for currently selected Relationship term
//		r1On = if true, eval on basis of <r1>
//		r2 = ID of Vocab Attribute for currently selected Relationship term
//		r2On = if true, eval on basis of <r2>

var PFilterQR = function(id, tI)
{
		// Create pseudo-Attribute object w/ID
	PFilterModel.call(this, id, { id: '_qr' });
	this.t = tI;
	this.qr = prspdata.e.g.qr;
		// Set default Relationship ID
	this.r = prspdata.e.g.qr.x[0].id;
} // PFilterQR()

PFilterQR.prototype = Object.create(PFilterModel.prototype);

PFilterQR.prototype.constructor = PFilterQR;

PFilterQR.prototype.title = function()
{
	return dlText.qrrr;
} // title()

	// PURPOSE: Set the options for the Roles 1 and 2 dropdowns based on current Relationship selection
PFilterQR.prototype.setRoles = function()
{
	var inserted = this.insertPt();
	var cntrl1 = inserted.find('select.filter-qr-r1');
	var cntrl2 = inserted.find('select.filter-qr-r2');
	cntrl1.empty();
	cntrl2.empty();
	var rAtt = PData.aByID(this.r);
	var opt;
	if (rAtt) {
		rAtt.l.forEach(function(lgnd) {
			opt = '<option value="'+lgnd.l+'">'+lgnd.l+'</option>';
			cntrl1.append(opt);
			cntrl2.append(opt);
		});
	}
} // setRoles()

PFilterQR.prototype.setup = function()
{
	var self = this;

	var inserted = this.insertPt();
	var htmlText = document.getElementById('dltext-filter-qr').innerHTML;
	inserted.append(htmlText);

		// Create Relationship options
	var options=inserted.find('select.filter-qr-r');
	prspdata.e.g.qr.x.forEach(function(x) {
		options.append('<option value="'+x.id+'">'+x.t+'</option>');
	});

	this.setRoles();

		// Intercept changes to Relationship & Roles selections!
	options.change(function() {
		self.r = options.val();
		self.setRoles();
		self.isDirty(2);
	});
	inserted.find('select.filter-qr-r1').change(function() {
		self.isDirty(2);
	});
	inserted.find('select.filter-qr-r2').change(function() {
		self.isDirty(2);
	});
		// Any clicks on "use" settings just dirty filter
	inserted.find('input.filter-qr-use-r').click(function(event) {
		self.isDirty(2);
	});
	inserted.find('input.filter-qr-use-r1').click(function(event) {
		self.isDirty(2);
	});
	inserted.find('input.filter-qr-use-r2').click(function(event) {
		self.isDirty(2);
	});
} // setup()

PFilterText.prototype.teardown = function()
{
	var inserted = this.insertPt();
	inserted.find('select.filter-qr-r').off("change");
	inserted.find('select.filter-qr-r1').off("change");
	inserted.find('select.filter-qr-r2').off("change");
	inserted.find('input.filter-qr-use-r').off("click");
	inserted.find('input.filter-qr-use-r1').off("click");
	inserted.find('input.filter-qr-use-r2').off("click");
} // teardown()

PFilterQR.prototype.evalPrep = function()
{
	var inserted = this.insertPt();
	this.rOn  = inserted.find('input.filter-qr-use-r').prop('checked');
	this.r1On = inserted.find('input.filter-qr-use-r1').prop('checked');
	this.r2On = inserted.find('input.filter-qr-use-r2').prop('checked');
		// NOTE: this.r always kept updated
	this.rT = inserted.find('select.filter-qr-r :selected').text();
	this.r1 = inserted.find('select.filter-qr-r1').val();
	this.r2 = inserted.find('select.filter-qr-r2').val();
} // evalPrep()

	// PURPOSE: Evaluate QR Records specifically
	// ASSUMRS:	Not called for non-QR Template Records
	//			Attribute value for Relationship has only 1 value! (not multiple)
PFilterQR.prototype.eval = function(rec)
{
	var r1Avail=true, r2Avail=true;

		// Pass Records not belonging to QR Template
		// This shouldn't be needed, as recompute() doesn't call for non-QR templates
	// if (this.t !== tI)
	// 	return true;
		// Do we need to test the Relationship type?
	if (this.rOn && this.rT !== rec.a[this.qr.r][0]) {
		return false;
	}

		// Do we need to test one Role? Need to be flexible about R1/R2
	if (this.r1On) {
		if (this.r1 === rec.a[this.qr.r1]) {
			r1Avail=false;
		} else if (this.r1 === rec.a[this.qr.r2]) {
			r2Avail=false;
		} else {
			return false;
		}
	}

		// Fail if no matches in any leftover "slots"
	if (this.r2On) {
		if ((r1Avail && this.r2 !== rec.a[this.qr.r1]) || (r2Avail && this.r2 !== rec.a[this.qr.r2]))
		{
			return false;
		}
	}

	return true;
} // eval()

PFilterQR.prototype.getState = function()
{
	var ip = this.insertPt();
	// return { cs: ip.find('input.filter-text-cs').prop('checked'),
	// 		 t: ip.find('input.filter-text').val(),
	// 		 o: ip.find('select.filter-text-ops').val()
	// 	 	};
} // getState()

	// NOTE: Perspective data ≤ 1.6 doesn't have o[ptions] setting
PFilterQR.prototype.setState = function(state)
{
	var ip = this.insertPt();
	// ip.find('input.filter-text-cs').prop('checked', state.cs);
	// ip.find('input.filter-text').val(state.t);
	// if (typeof state.o === 'undefined') {	// Handle older Perspective data
	// 	ip.find('select.filter-text-ops').val('c');
	// } else {
	// 	ip.find('select.filter-text-ops').val(state.o);
	// }
} // setState()
