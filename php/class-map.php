<?php

class ProspectMap {

		// CLASS METHODS
		// =============

		// PURPOSE: Compare map IDs for sort function
	static public function cmp_map_array_ids($a, $b)
	{
		return strcmp($a["id"], $b["id"]);
	} // cmp_map_array_ids()

		// PURPOSE: Compare map IDs for sort function
	static public function cmp_map_obj_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_map_obj_ids()


		// PURPOSE: Return sorted list of all prsp-maps on website (that have been Published)
		// RETURNS: sorted array [id, sname]
	static function get_map_layer_list()
	{
		$layer_data = array();
		$meta_data_set = array('id' => 'map-id', 'sname' => 'map_sname');

		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1, 'post_status' => 'publish');
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


		// PURPOSE: Return sorted list of all map_group_ids by parsing map definition data
		// ASSUMES: Only need to scan published maps
	static function get_all_map_group_ids()
	{
		$group_ids = array();

		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1, 'post_status' => 'publish');

		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$group_data = get_post_meta($rec->ID, 'map_group_id', true);
				if ($group_data && $group_data != '') {
					$ids = explode("|", $group_data);
					$ids = array_map('trim', $ids);
					$group_ids = array_merge($group_ids, $ids);
				}
			}
		}

		$group_ids = array_unique($group_ids, SORT_STRING);
		sort($group_ids);
		return $group_ids;
	} // get_all_map_group_ids()


		// PURPOSE: Extract list of map IDs from group list
		// NOTES:	group list is in format as returned by Exhibit/Volume::get_used_map_groups()
		//				[ { gid, mapids: [ ] } ]
	static function get_mapids_from_groups($group_list)
	{
		$map_ids = array();

		foreach ($group_list as $the_group) {
			foreach ($the_group['mapids'] as $the_id) {
				array_push($map_ids, $the_id);
			}
		}

		$map_ids = array_unique($map_ids, SORT_STRING);
		sort($map_ids);
		return $map_ids;
	} // get_mapids_from_groups()


		// PURPOSE: Return array describing map groups as follows:
		//			[ { gid: groupID , maps: [ ] }, … ]
		//			All arrays in sorted order
		// ASSUMES: Only need to scan published maps
	// static function get_all_map_groups()
	// {
	// 	$groups = array();

	// 	$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1, 'post_status' => 'publish');

	// 	$loop = new WP_Query($args);
	// 	if ($loop->have_posts()) {
	// 		foreach ($loop->posts as $rec) {
	// 			$map_id = get_post_meta($rec->ID, 'map-id', true);
	// 				// Valid map ID?
	// 			if ($map_id && $map_id != '') {
	// 				$group_data = get_post_meta($rec->ID, 'map_group_id', true);
	// 					// Valid map group ID?
	// 				if ($group_data && $group_data != '') {
	// 						// Get all map group IDs and add map ID
	// 					$ids = explode("|", $group_data);
	// 					foreach ($ids as $group_id) {
	// 						if (array_key_exists($group_id, $groups)) {
	// 							array_push($groups[$group_id], $map_id);
	// 						} else {
	// 							$groups[$group_id] = array($map_id);
	// 						}
	// 					} // foreach
	// 				} // if group_data
	// 			} // map_id
	// 		} // foreach
	// 	} // have_posts

	// 		// Sort by keys (map group ID)
	// 	ksort($groups);

	// 		// Sort each group's map IDs
	// 	$new_groups = array();
	// 	$count = count($groups);
	// 	for ($i=0; $i<$count; $i++) {
	// 		array_push($new_groups, array('gid' => $groups[$i], 'maps' => array_unique($groups[$i])));
	// 	}

	// 	return $new_groups;
	// } // get_all_map_groups()

		// PURPOSE: Return the unique map IDs in sorted list of maps used in all groups
		// INPUT:	$group_list is result from get_all_map_groups()
	// static function get_map_ids_in_groups($group_list)
	// {
	// 	$map_ids = array();
	// 	foreach ($group_list as $this_group) {
	// 		$map_ids = array_merge($map_ids, $this_group['maps']);
	// 	}
	// 	return array_unique($map_ids);
	// } // get_map_ids_in_groups()

		// PURPOSE: Return array of ProspectMap objects given their IDs
		// INPUT:	$ids = array of map ids
		// NOTES:	array of maps made in same order as IDs
	static function map_ids_to_objects($ids)
	{
		$map_defs = array();
		foreach ($ids as $the_id) {
			$new_map = new ProspectMap(false, $the_id);
			array_push($map_defs, $new_map);
		}
		return $map_defs;
	} // map_ids_to_objects()


		// PURPOSE: Return list of all ProspectMap objects on website sorted by ID
		// INPUT: 	If $only_published, only return those that in Published state
	static function get_all_maps($only_published)
	{
		$layer_data = array();

		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1);
		if ($only_published)
			$args = array_merge($args, array('post_status' => 'publish'));

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
	// static function get_maps($map_ids)
	// {
	// 	$map_array = array();

	// 		// Loop thru all map layers, collecting essential data to pass
	// 	foreach ($map_ids as $layer) {
	// 			// Ignore base maps
	// 		if ($layer->id[0] != '.') {
	// 			if ($loop->have_posts()) {
	// 				foreach ($loop->posts as $rec) {
	// 					$new_map = new ProspectMap(true, $rec->ID);
	// 					array_push($map_array, $new_map);
	// 				}
	// 			}
	// 		}
	// 	}
	// 		// Sort array according to map IDs
	// 	usort($map_array, array('ProspectMap', 'cmp_map_obj_ids'));

	// 	return $map_array;
	// } // get_maps()


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
								"wBounds" 	=> "map_w_bounds",
								"groupID"	=> "map_group_id"
							);
		$int_meta = array("minZoom", "maxZoom");
		$float_meta = array("nBounds", "sBounds", "eBounds", "wBounds");

		$this->id 	= $this->post_id = null;
		$this->meta_data	= array();

		if ($is_postid) {
				// Check to see if Map post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Map not found by Post ID");
				return null;
			}
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
			$this->meta_data['swBounds'] = array($this->meta_data['sBounds'], $this->meta_data['wBounds']);
			$this->meta_data['neBounds'] = array($this->meta_data['nBounds'], $this->meta_data['eBounds']);
		}
	} // new()

} // class ProspectMap
