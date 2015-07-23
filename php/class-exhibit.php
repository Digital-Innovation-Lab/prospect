<?php

class ProspectExhibit {
		// CLASS METHODS
		// =============


		// RETURNS: An array of all Template definitions (except $except_post_id)
		// INPUT: 	Ignore the Template whose WP post ID is $except_post_id
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

} // class ProspectExhibit
