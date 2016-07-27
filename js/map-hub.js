// PURPOSE: Handle low-level Map interface between Leaflet and Prospect
//			Base Layers are built-in; Overlay layers can be added via Map Library
// USES:    Libraries jQuery, underscore, Leaflet
// NOTES:   Don't rely on WordPress post ID of map library entries -- Use unique ID
//			There is only one hub at a time so no need for instantiating instances
//			Implemented with the "Module" design pattern for hiding
//				private variables and minimizing public accessibility
//			Useful list of free base maps: http://wiki.openstreetmap.org/wiki/Tile_servers

//			Map entries (as passed in arrays to init) consists of the following fields:
//				id = unique identifier [String]; if starts with "." it is a Base map
//				sname = a short name [String]
//				url = base pattern for URL
//				subd = subdomain(s) (optional)
//				credits = credit for map (optional)
//			Overlay Maps also contain the following information:
//				minZoom = integer
//				maxZoom = integer
//				swBounds = LatLong
//				neBounds = LatLong


var PMapHub = (function () {
		// Built-in Base Layers
		// ASSUMES! That Maps are in sorted order by id!!
	var baseLayers	= [
		{ id: '.blank', sname: 'Blank', url: '', subd: '', credits: '', desc: 'Blank Base Map' },
		{	id: '.esri-natgeoworld', sname: 'Esri, Nat Geo Landscape',
			url: "http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
			subd: '', credits: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', desc: 'Esri, National Geographic Landscape'
		},
		{	id: '.osm-base', sname: 'OSM Base',
			url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
			subd: 'a|b|c', credits: 'OpenStreetMap', desc: 'OpenStreetMap Base Map'
		},
		{	id: '.osm-bw', sname: 'OpenStreetMap B/W',
			url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
			subd: '', credits: 'OpenStreetMap', desc: 'OpenStreetMap B/W Base Map'
		},
		{	id: '.stamen-watercolor', sname: 'Stamen Watercolor',
			url: 'http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg',
			subd: '', credits: 'Stamen Design', desc: 'Stamen Watercolor Base Map'
		},
		{	id: '.thunder-land', sname: 'Thunderforest Landscape',
			url: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
			subd: '', credits: 'Thunderforest', desc: 'Thunderforest Landscape Base Map'
		}
	];
	var overLayers	= [];
	var groups = [];


	function baseByID(id)
	{
		var index = _.sortedIndex(baseLayers, { id: id }, 'id');
		var item = baseLayers[index];
		if (item.id !== id) {
			throw new Error("Base map "+id+" does not exist.");
		}
		return item.id === id ? item : null;
	}; // baseByID()


	function overlayByID(id)
	{
		var index = _.sortedIndex(overLayers, { id: id }, 'id');
		var item = overLayers[index];
		if (item.id !== id) {
			throw new Error("Overlay map "+id+" does not exist.");
		}
		return item.id === id ? item : null;
	}; // overlayByID()

	function groupByID(id)
	{
		var index = _.sortedIndex(groups, { gid: id }, 'gid');
		var item = groups[index];
		return item.gid === id ? item : null;
	}; // groupByID

		// The Interface return object
	return {
			// PURPOSE: Initialize Map Services
			// INPUT:   overlay = array of overlay map data
			//			groupData = array of map group data [ { gid, mapids: [ ] } ]
		init: function(overlayArray, groupData)
		{
			overLayers	= overlayArray;
			groups 		= groupData;
		}, // init()


			// PURPOSE: Return array of available base layers
		getBaseLayers: function()
		{
			return baseLayers;
		}, // getBaseLayers()


			// PURPOSE: Return array of available overlay layers
		getOverlays: function()
		{
			return overLayers;
		}, // getOverlays()


			// PURPOSE: Return base map object by id
		getBaseByID: function(id)
		{
			return baseByID(id);
		}, // getBaseByID()


			// PURPOSE: Return overlay map object by id
		getOverlayByID: function(id)
		{
			return overlayByID(id);
		}, // getOverlayByID()


			// PURPOSE: Return map object by id
		getMapByID: function(id)
		{
			if (id.charAt(0) === '.') {
				return baseByID(id);
			} else {
				return overlayByID(id);
			}
		}, // getMapByID()

			// PURPOSE: Return array of maps which have groupID in their groupID array
		getGroupByID: function(groupID)
		{
			return groupByID(groupID);
		}, // getGroupByID()


			// PURPOSE: Create a Leaflet map layer, add to Leaflet control
			// INPUT: 	id = unique ID of map layer
			//			opacity = initial opacity of layer
			//			leafMap = Leaflet map to which to add the layer, or null if none
			//			control = Leaflet control to which to add the layer, or null if none
			// RETURNS: Object representing Leaflet layer with fields
			//				leafletLayer
			//				options
			//				opacity
			//				layerName
			//				isBaseLayer [true|false]
		createMapLayer: function(id, opacity, leafMap, control)
		{
			var layerDef, newLeafLayer, subDomains, inverseY, options;

				// Prepare return layer data

			if (id === '.blank') {
				newLeafLayer = { };
				newLeafLayer.options = { };
				newLeafLayer.options.opacity = opacity;
				newLeafLayer.options.layerName = 'Blank';
				newLeafLayer.options.isBaseLayer = true;
				if (leafMap) {
					leafMap.minZoom = 1;
					leafMap.maxZoom = 20;
				}

			} else if (id.charAt(0) === '.') {
				layerDef = baseByID(id);
				options = {
						attribution: layerDef.credits,
						maxZoom: 20,
						opacity: opacity
					};
				subDomains = layerDef.subd !== '' ? layerDef.subd.split('|') : [];
				if (subDomains.length>1) {
					options.subdomains = subDomains;
				}
				newLeafLayer = L.tileLayer(layerDef.url, options);
				newLeafLayer.options.isBaseLayer = true;
				newLeafLayer.options.layerName = layerDef.sname;
				if (leafMap) {
					newLeafLayer.addTo(leafMap);
				}
				if (control) {
					control.addBaseLayer(newLeafLayer, layerDef.sname);
				}
			} else {
				layerDef = overlayByID(id);

				inverseY = (layerDef.inverseY === true || layerDef.inverseY === 'true' || layerDef.inverseY === 'TRUE');
				options = {
						attribution: layerDef.credits,
						minZoom: layerDef.minZoom,
						maxZoom: layerDef.maxZoom,
						tms: inverseY,
						opacity: opacity,
						bounds: L.latLngBounds(layerDef.swBounds, layerDef.neBounds)
					};
				subDomains = layerDef.subd !== '' ? layerDef.subd.split('|') : [];
				if (subDomains.length>1) {
					options.subdomains=subDomains;
				}
				newLeafLayer = L.tileLayer(layerDef.url, options);
				newLeafLayer.options.isBaseLayer = false;
				newLeafLayer.options.layerName = layerDef.sname;

				if (leafMap) {
					newLeafLayer.addTo(leafMap);
				}
				if (control) {
					control.addOverlay(newLeafLayer, layerDef.sname);
				}
			}
			newLeafLayer.options.id = id;
			return newLeafLayer;
		}, // createMapLayer()

			// PURPOSE: Create a Leaflet layerGroup to handle a set of overlay layers
			// INPUT: 	id = unique ID of map group
			//			opacity = initial opacity of layer
			//			leafMap = Leaflet map to which to add the layer, or null if none
			// RETURNS: Object representing Leaflet layer with fields
			//				leafletLayer
			//				options
			//				opacity
			//				layerName
			//				isBaseLayer [true|false]
		createMapGroup: function(id, opacity, leafMap)
		{
			var groupDef, layerGroup=null, layerDef, oneOverlay, subDomains, inverseY, options;

			groupDef = groupByID(id);
			if (groupDef) {
				layerGroup = L.layerGroup();
				layerGroup.options.id = layerGroup.options.layerName = id;
				groupDef.mapids.forEach(function(mapid) {
					layerDef = overlayByID(mapid);
					if (layerDef) {
						inverseY = (layerDef.inverseY === true || layerDef.inverseY === 'true' || layerDef.inverseY === 'TRUE');
						options = {
								attribution: layerDef.credits,
								minZoom: layerDef.minZoom,
								maxZoom: layerDef.maxZoom,
								tms: inverseY,
								opacity: opacity,
								bounds: L.latLngBounds(layerDef.swBounds, layerDef.neBounds)
							};
						subDomains = layerDef.subd !== '' ? layerDef.subd.split('|') : [];
						if (subDomains.length>1) {
							options.subdomains = subDomains;
						}
						oneOverlay = L.tileLayer(layerDef.url, options);
						oneOverlay.options.id = mapid;
						oneOverlay.options.isBaseLayer = false;
						oneOverlay.options.layerName = mapid;
						layerGroup.addLayer(oneOverlay);
					} // if layerDef
				}); // forEach mapids

				if (leafMap) {
					layerGroup.addTo(leafMap);
				}
			}
			return layerGroup;
		} // createMapLayer()
	} // return
})();
