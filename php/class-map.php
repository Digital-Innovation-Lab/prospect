<?php

class ProspectMap {

		// CLASS METHODS
		// =============

		// PURPOSE: Compare map IDs for sort function
	static function cmp_map_array_ids($a, $b)
	{
		return strcmp($a["id"], $b["id"]);
	} // cmp_map_array_ids()

		// PURPOSE: Compare map IDs for sort function
	static function cmp_map_obj_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_map_obj_ids()


		// PURPOSE: Return list of all prsp-maps on website
		// RETURNS: array [id, sname]
	static function get_map_layer_list()
	{
		$layer_data = array();
		$meta_data_set = array('id' => 'map_id', 'sname' => 'map_sname');

		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1);
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$new_map_data = array();
				foreach ($meta_data_set as $array_key => $meta_name) {
					$new_map_data[$array_key] = get_post_meta($rec->ID, $meta_name, true);
				}
				array_push($layer_data, $new_map_data);
			}
		}

			// Sort array according to map IDs
		usort($layer_data, array('ProspectMap', 'cmp_map_array_ids'));

		return $layer_data;
	} // get_map_layer_list()


		// PURPOSE: Return list of all prsp-maps on website
		// RETURNS: array [id, sname]
	static function get_all_maps()
	{
		$layer_data = array();

		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1);
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$new_map = new ProspectMap(true, $rec->ID);
				array_push($layer_data, $new_map);
			}
		}

			// Sort array according to map IDs
		usort($layer_data, array('ProspectMap', 'cmp_map_obj_ids'));

		return $layer_data;
	} // get_all_maps()

		// PURPOSE: Extract DHP custom map data from Map Library so they can be rendered in Map view
		// INPUT:	$map_ids = array of EP Map layers (each containing ['id' = unique Map ID])
		// RETURNS: Array of ProspectMap objects, sorted by ID
		// NOTE:    If id begins with '.' it is a base layer and does not need to be loaded
		// TO DO:	Further error handling if necessary map data doesn't exist?
	static function get_maps($map_ids)
	{
		$map_array = array();

			// Loop thru all map layers, collecting essential data to pass
		foreach ($mapLayers as $layer) {
				// Ignore base maps
			if ($layer->id[0] != '.') {
				if ($loop->have_posts()) {
					foreach ($loop->posts as $rec) {
						$new_map = new ProspectMap(true, $rec->ID);
						array_push($map_array, $new_map);
					}
				}
			}
		}
			// Sort array according to map IDs
		usort($map_array, array('ProspectMap', 'cmp_map_obj_ids'));

		return $map_array;
	} // get_maps()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Map (and custom field name)
	public $post_id;		// the WordPress ID of the post for the map

		// All custom fields related to maps
	public $meta_data;		// associative array of metadata

		// PURPOSE: Create Map object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Attribute ID) or -1
		//			the_id is either (1) WordPress post ID, (2) unique ID for Map, or
		//				(3) '' if this is a new Map definition
	public function __construct($is_postid, $the_id)
	{
		$map_meta_list = array(	"sname"  	=> "map_sname",
								"url" 		=> "map_url",
								"inverseY" 	=> "map_inverse_y",
								"subd" 		=> "map_subdomains",
								"minZoom"   => "map_min_zoom",
								"maxZoom" 	=> "map_max_zoom",
								"credits"	=> "map_credits",
								"nBounds" 	=> "map_n_bounds",
								"sBounds" 	=> "map_s_bounds",
								"eBounds" 	=> "map_e_bounds",
								"wBounds" 	=> "map_w_bounds"
							);
		$int_meta = array("minZoom", "maxZoom");
		$float_meta = array("nBounds", "sBounds", "eBounds", "wBounds");

		$this->id 	= $this->post_id = null;
		$this->meta_data	= array();

		if ($is_postid) {
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'map-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-map',
								'meta_key' => 'map-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Attribute not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		if ($this->post_id != null) {
				// Load all definition data
			foreach ($map_meta_list as $array_key => $meta_name) {
				$thisMetaData = get_post_meta($this->post_id, $meta_name, true);
				$this->meta_data[$array_key] = $thisMetaData;
			}
				// Do numeric conversions
			foreach ($int_meta as $key) {
				if ($this->meta_data[$key] != '')
					$this->meta_data[$key] = intval($this->meta_data[$key]);
			}
			foreach ($float_meta as $key) {
				if ($this->meta_data[$key] != '')
					$this->meta_data[$key] = floatval($this->meta_data[$key]);
			}
				// Create composite data
			$this->meta_data['swBounds'] = array($this->meta_data['map_s_bounds'], $this->meta_data['map_w_bounds']);
			$this->meta_data['neBounds'] = array($this->meta_data['map_n_bounds'], $this->meta_data['map_e_bounds']);
		}
	} // new()

} // class ProspectMap
