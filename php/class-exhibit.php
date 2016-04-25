<?php

class ProspectExhibit {
		// CLASS METHODS
		// =============

		// PURPOSE: Compare map group IDs for sort function
	static public function cmp_map_group_ids($a, $b)
	{
		return strcmp($a["gid"], $b["gid"]);
	} // cmp_map_group_ids()


		// RETURNS: An array of all Exhibit definitions (except $except_post_id)
	static public function get_all_exhibit_defs($unpack)
	{
		$all_exhibit_defs = array();

			// Loop through all Templates
		$args = array('post_type' => 'prsp-exhibit', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $tmp) {
				$the_exhibit = new ProspectExhibit(true, $tmp->ID, $unpack);
				if ($the_exhibit->id != null && $the_exhibit->id != '') {
					array_push($all_exhibit_defs, $the_exhibit);
				}
			}
		}

		return $all_exhibit_defs;
	} // get_all_exhibit_defs()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Exhibit
	public $post_id;		// the WordPress ID of the post

		// Attribute-specific data
	public $meta_gen;		// JSON packed version of general settings
	public $gen;			// unpacked object version
	public $meta_views;		// JSON packed version of view settings
	public $views;			// unpacked object version
	public $meta_inspect;	// JSON packed version of Inspector settings
	public $inspect;		// unpacked object version

		// PURPOSE: Create Exhibit object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Exhibit ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Attribute, or '' if this is a new Attribute definition
	public function __construct($is_postid, $the_id, $unpack)
	{
		$this->id			= $this->post_id = null;
		$this->meta_def 	= $this->def = null;

		if ($is_postid) {
				// Check to see if Exhibit post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Exhibit not found by Post ID");
				return null;
			}
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'xhbt-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-exhibit',
								'meta_key' => 'xhbt-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Exhibit not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		if ($this->post_id != null) {
				// Load general settings data
			$this->meta_gen = get_post_meta($this->post_id, 'xhbt-gen', true);
			if ($unpack) {
				if ($this->meta_gen != '')
					$this->gen = json_decode($this->meta_gen, false);
			}
				// Load view/filter configuration
			$this->meta_views = get_post_meta($this->post_id, 'xhbt-views', true);
			if ($unpack) {
				if ($this->meta_views != '')
					$this->views = json_decode($this->meta_views, false);
			}
				// Load Inspector configuration
			$this->meta_inspect = get_post_meta($this->post_id, 'xhbt-inspect', true);
			if ($unpack) {
				if ($this->meta_inspect != '')
					$this->inspect = json_decode($this->meta_inspect, false);
			}
		} // if post_id
	} // _construct()

		// RETURNS: An array of all Map IDs used by this Exhibit
		// ASSUMES: That Exhibit view data has been unpacked
	public function get_used_map_ids()
	{
		$map_id_array = array();

			// Find Map views and compile maps
		foreach ($this->views as $the_view) {
			if ($the_view->vf == 'M') {
				foreach ($the_view->c->lyrs as $the_layer) {
					array_push($map_id_array, $the_layer->lid);
				}
			}
		}
			// Sort array according to map IDs
		sort($map_id_array);

		return $map_id_array;
	} // get_used_map_ids()


		// RETURNS: An array of all Map Group IDs (and their map IDs) used by this Exhibit
		// NOTES:	[ { gid, mapids: [ ] } ]
		// ASSUMES: That Exhibit view data has been unpacked
	public function get_used_map_groups()
	{
		$map_group_ids = array();

			// Find Map views and compile maps
		foreach ($this->views as $the_view) {
			if ($the_view->vf == 'p') {
				foreach ($the_view->c->lyrs as $the_layer) {
					array_push($map_group_ids, $the_layer->gid);
				}
			}
		}

			// Sort array according to map group IDs and ensure unique
		$map_group_ids = array_unique($map_group_ids);
		sort($map_group_ids);

		$map_groups = array();
		foreach ($map_group_ids as $group_id) {
			array_push($map_groups, array('gid' => $group_id, 'mapids' => array()));
		}

			// Now go through all Published maps to find out which have this in their group ID
		$args = array('post_type' => 'prsp-map', 'posts_per_page' => -1, 'post_status' => 'publish');
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$map_id = get_post_meta($rec->ID, 'map-id', true);
					// Valid map ID?
				if ($map_id && $map_id != '') {
					$group_data = get_post_meta($rec->ID, 'map_group_id', true);
						// Valid map group ID?
					if ($group_data && $group_data != '') {
							// Get all map group IDs for current map
						$ids = explode("|", $group_data);
						foreach ($ids as $group_id) {
								// Add this map to all groups it belongs to
							$count = count($map_groups);
							for ($i=0; $i<$count; $i++) {
								$map_group = $map_groups[$i];
								if ($map_group['gid'] == $group_id) {									
									array_push($map_groups[$i]['mapids'], $map_id);
									$map_groups[$i]['mapids'] = array_unique($map_groups[$i]['mapids'], SORT_STRING);
									sort($map_groups[$i]['mapids']);
									break;
								}
							} // for map_groups
						} // foreach
					} // if group_data
				} // map_id
			} // foreach
		} // have_posts

		return $map_groups;
	} // get_used_map_groups()


		// RETURNS: An array of all Map definitions used by this Exhibit
		// ASSUMES: That Exhibit view data has been unpacked
	// public function get_used_maps()
	// {
	// 	$map_array = array();

	// 		// Find Map views and compile maps
	// 	foreach ($this->views as $the_view) {
	// 		if ($the_view->vf == 'M') {
	// 			foreach ($the_view->c->lyrs as $the_layer) {
	// 				$new_map = new ProspectMap(false, $the_layer->lid);
	// 				array_push($map_array, $new_map);
	// 			}
	// 		}
	// 	}
	// 		// Sort array according to map IDs
	// 	usort($map_array, array('ProspectMap', 'cmp_map_obj_ids'));

	// 	return $map_array;
	// } // get_used_maps()
} // class ProspectExhibit
