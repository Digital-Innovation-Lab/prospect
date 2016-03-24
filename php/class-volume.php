<?php

class ProspectVolume {
		// CLASS METHODS
		// =============


		// RETURNS: An array of all Exhibit definitions (except $except_post_id)
	static public function get_all_volume_defs($unpack)
	{
		$all_volume_defs = array();

			// Loop through all Templates
		$args = array('post_type' => 'prsp-volume', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $tmp) {
				$the_volume = new ProspectVolume(true, $tmp->ID, $unpack);
				if ($the_volume->id != null && $the_volume->id != '') {
					array_push($all_volume_defs, $the_volume);
				}
			}
		}

		return $all_volume_defs;
	} // get_all_volume_defs()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Volume
	public $post_id;		// the WordPress ID of the post

		// Attribute-specific data
	public $meta_gen;		// JSON packed version of general settings
	public $gen;			// unpacked object version
	public $meta_views;		// JSON packed version of view settings
	public $views;			// unpacked object version
	public $meta_inspect;	// JSON packed version of Inspector settings
	public $inspect;		// unpacked object version

		// PURPOSE: Create Volume object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Volume ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Attribute, or '' if this is a new Attribute definition
	public function __construct($is_postid, $the_id, $unpack)
	{
		$this->id			= $this->post_id = null;
		$this->meta_def 	= $this->def = null;

		if ($is_postid) {
				// Check to see if Volume post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Volume not found by Post ID");
				return null;
			}
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'vol-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-volume',
								'meta_key' => 'vol-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Volume not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		if ($this->post_id != null) {
				// Load general settings data
			$this->meta_gen = get_post_meta($this->post_id, 'vol-gen', true);
			if ($unpack) {
				if ($this->meta_gen != '')
					$this->gen = json_decode($this->meta_gen, false);
			}
				// Load view/filter configuration
			$this->meta_views = get_post_meta($this->post_id, 'vol-views', true);
			if ($unpack) {
				if ($this->meta_views != '')
					$this->views = json_decode($this->meta_views, false);
			}
				// Load Inspector configuration
			$this->meta_inspect = get_post_meta($this->post_id, 'vol-inspect', true);
			if ($unpack) {
				if ($this->meta_inspect != '')
					$this->inspect = json_decode($this->meta_inspect, false);
			}
		} // if post_id
	} // _construct()

		// RETURNS: An array of all Map definitions used by this Volume
		// ASSUMES: That Exhibit view data has been unpacked
	public function get_used_maps()
	{
		$map_array = array();

			// Find Map views and compile maps
		foreach ($this->views as $the_view) {
			if ($the_view->vf == 'M') {
				foreach ($the_view->c->lyrs as $the_layer) {
					$new_map = new ProspectMap(false, $the_layer->lid);
					array_push($map_array, $new_map);
				}
			}
		}
			// Sort array according to map IDs
		usort($map_array, array('ProspectMap', 'cmp_map_obj_ids'));

		return $map_array;
	} // get_used_maps()
} // class ProspectVolume
