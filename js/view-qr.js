// This file contains:
//		PVizModel Classes for Qualified Relationship visualizations

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
