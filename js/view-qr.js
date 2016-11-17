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

var PFilterQR = function(id)
{
	PFilterModel.call(this, id, null);
} // PFilterQR()

PFilterQR.prototype = Object.create(PFilterModel.prototype);

PFilterQR.prototype.constructor = PFilterQR;

PFilterQR.prototype.title = function()
{
	return dlText.qrrr;
} // title()

PFilterQR.prototype.eval = function(rec, tI)
{
		// TO DO
	return true;
} // eval()

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

		// Intercept changes to Relationship & Roles selections!
	options.change(function() {
		// TO DO: This will actually require changing selections on Roles dropdowns
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
} // evalPrep()

PFilterQR.prototype.eval = function(rec)
{
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
