<?php

class ProspectPerspective {
		// CLASS METHODS
		// =============

		// PURPOSE: Compare two IDs for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_ids()

		// RETURNS: Array of all Perspectives belonging to an Exhibit, sorted by ID
		// NOTES:	Selects only published Perspectives
	static public function get_exhibit_perspectives($xhbt_id)
	{
		$all_prspctvs = array();

			// Loop through all published Perspectives adding to array
		$args = array('post_type' => 'prsp-prspctv',
						'post_status' => 'publish',
						'meta_key' => 'xhbt-id',
						'meta_value' => $xhbt_id,
						'posts_per_page' => -1);
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $prspctv) {
				$new_prspctv = new ProspectPerspective(true, $prspctv->ID, false);
					// Ensure minimal data provided
				if ($new_prspctv->id != null && $new_prspctv->id != '') {
					array_push($all_prspctvs, $new_prspctv);
				}
			}
		}
			// Sort by ID
		usort($all_prspctvs, array('ProspectPerspective', 'cmp_ids'));
		return $all_prspctvs;
	} // get_exhibit_perspectives()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $post_id;		// the WordPress ID of the post

		// Perspective-specific data
	public $id;				// Unique ID of Perspective
	public $l;				// User-supplied label for Perspective
	public $xhbt_id;		// ID of Exhibit to which this belongs
	public $note;			// Textual annotation for Perspective
	public $meta_state;		// JSON packed version of Attribute definition
	public $state;			// unpacked object version


		// PURPOSE: Create Perspective object and load its definition
	public function __construct($is_postid, $the_id, $unpack)
	{
		if ($is_postid) {
				// Check to see if Perspective post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Perspective not found by Post ID");
				return null;
			}
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'prspctv-id', true);
		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-prspctv',
								'meta_key' => 'prspctv-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Perspective not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		$this->l 			= get_post_meta($this->post_id, 'prspctv-l', true);
		$this->xhbt_id		= get_post_meta($this->post_id, 'xhbt-id', true);
		$this->note 		= get_post_meta($this->post_id, 'prspctv-note', true);
		$this->meta_state 	= get_post_meta($this->post_id, 'prspctv-state', true);

		if ($unpack) {
			$this->state = json_decode($this->meta_state, false);
		}
	} // __construct()
} // Class