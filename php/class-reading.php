<?php

class ProspectReading {
		// CLASS METHODS
		// =============

		// PURPOSE: Compare two IDs for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_ids()

		// RETURNS: Array of all Readings belonging to a Volume, sorted by ID
		// NOTES:	Selects only published Readings
	static public function get_volume_readings($vol_id)
	{
		$all_readings = array();

			// Loop through all published Readings adding to array
		$args = array('post_type' => 'prsp-reading',
						'post_status' => 'publish',
						'meta_key' => 'vol-id',
						'meta_value' => $vol_id,
						'posts_per_page' => -1);
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $reading) {
				$new_reading = new ProspectReading(true, $reading->ID, true);
					// Ensure minimal data provided
				if ($new_reading->id != null && $new_reading->id != '') {
					array_push($all_readings, $new_reading);
				}
			}
		}
			// Sort by ID
		usort($all_readings, array('ProspectReading', 'cmp_ids'));
		return $all_readings;
	} // get_volume_readings()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $post_id;		// the WordPress ID of the post

		// Perspective-specific data
	public $id;				// Unique ID of Reading
	public $l;				// User-supplied label for Reading
	public $vol_id;			// ID of Volume to which this belongs
	public $note;			// Textual annotation for Reading
	public $meta_state;		// JSON packed version of Attribute definition
	public $state;			// unpacked object version


		// PURPOSE: Create Reading object and load its definition
	public function __construct($is_postid, $the_id, $unpack)
	{
		if ($is_postid) {
				// Check to see if Reading post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Reading not found by Post ID");
				return null;
			}
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'reading-id', true);
		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-reading',
								'meta_key' => 'reading-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Reading not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		$this->l 			= get_post_meta($this->post_id, 'reading-l', true);
		$this->vol_id		= get_post_meta($this->post_id, 'vol-id', true);
		$this->note 		= get_post_meta($this->post_id, 'reading-note', true);
		$this->meta_state 	= get_post_meta($this->post_id, 'reading-state', true);

		if ($unpack) {
			$this->state = json_decode($this->meta_state, false);
		}
	} // __construct()
} // Class