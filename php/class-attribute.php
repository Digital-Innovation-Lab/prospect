<?php

// PURPOSE: Implement Attribute objects

// NOTES:   

class GigAttribute {
		// CLASS METHODS
		// =============

		// PURPOSE: Search for $att_id in sorted Attribute array (from get_all_attributes)
		// RETURNS: Attribute object if match found, else none
	static public function find_attribute(array $atts, $att_id)
	{
		$lo = 0;
		$hi = count($atts);
 
		while ($lo <= $hi) {
			$pos = (int)(($lo + $hi) / 2);
			// $pos = (int)(($hi – $lo) >> 1) + $lo;
			// $pos = (int)(($hi – $lo) / 2) + $lo;
			$the_att = $atts[$pos];
			$cmp = strcmp($the_att->id, $att_id);

			if ($cmp < 0) {
				$lo = $pos + 1;
			} elseif ($cmp > 0) {
				$hi = $pos - 1;
			} else {
				return $atts[$pos];
			}
		}
		return null;
	} // find_attribute()


		// PURPOSE: Insert the value into the array in sorted order
	static public function sorted_insert($value, &$the_array)
	{
		$size = count($the_array);
			// If array is empty, just add to end
		if ($size == 0) {
			array_push($the_array, $value);
		} else {
				// Go through array looking for insertion point
			for ($i=0; $i<$size; $i++) {
				$element = $the_array[$i];
				$cmp = strcmp($value, $element);
					// Don't want redundant values -- already exists, return
				if ($cmp == 0) {
					return;
				} elseif ($cmp < 0) {
					array_splice($the_array, $i, 0, $value);
					return;
				}
			}
				// Array exhausted -- just append
			array_push($the_array, $value);
		}
	} // sorted_insert()


		// PURPOSE:	To determine all the names of custom fields used by all Records
		// RETURNS: Array of all unique custom fields of all marker posts associated with the Project
		// WARNING: This will reset and lose the current post
	static public function get_all_custom_field_names()
	{
		$custom_fields = array();

			// Loop through all Records, adding custom fields to array
		$args = array('post_type' => 'gig-record', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$record_id = $rec->ID;
				$rec_fields = get_post_custom_keys($record_id);

				foreach ($rec_fields as $key => $value) {
					$trimmed = trim($value);
						// exclude WP internal fields
					if ($trimmed{0} == '_')
						continue;
					GigAttribute::sorted_insert($trimmed, $custom_fields);
				}
			}
		}

		return $custom_fields;
	} // get_all_custom_field_names()


		// PURPOSE: Compare two IDs for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_ids()


		// NOTES:	Only get published Attributes
	static public function get_all_attributes($unpack, $load_hint, $load_range, $load_legend)
	{
		$all_atts = array();

			// Loop through all published Attributes adding to array
		$args = array('post_type' => 'gig-attribute', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $att) {
				$new_att = new GigAttribute(true, $att->ID, $unpack, $load_hint, $load_range, $load_legend);
				array_push($all_atts, $new_att);
			}
		}
			// Sort by ID
		usort($all_atts, array('GigAttribute', 'cmp_ids'));
		return $all_atts;
	} // get_all_attributes()


		// RETURNS: A sorted array of all Attribute IDs (except $except_post_id)
		// INPUT: 	Ignore the Attribute whose WP post ID is $except_post_id
	static public function get_all_attribute_ids($except_post_id)
	{
		$all_att_ids = array();

		$args = array('post_type' => 'gig-attribute', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $att) {
				if ($att->ID != $except_post_id) {
					$new_att_id = get_post_meta($att->ID, 'att-id', true);
					array_push($all_att_ids, $new_att_id);
				}
			}
		}

		sort($all_att_ids);
		return $all_att_ids;
	} // get_all_attribute_ids()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Attribute (and custom field name)
	public $post_id;		// the WordPress ID of the post

		// Attribute-specific data
	public $meta_def;		// JSON packed version of Attribute definition
	public $def;			// unpacked object version
	public $meta_range;
	public $range;
	public $meta_legend;
	public $legend;


		// PURPOSE: Create Attribute object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Attribute ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Attribute, or '' if this is a new Attribute definition
		//			only load range data if load_range is true
		//			only load legend data if load_legend is true
	public function __construct($is_postid, $the_id, $unpack, $load_hint, $load_range, $load_legend)
	{
		$this->id			= $this->post_id = null;
		$this->meta_def 	= $this->def = null;
		$this->meta_range	= $this->range = null;
		$this->meta_legend	= $this->legend = null;

		if ($is_postid) {
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'att-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'gig-attribute',
								'meta_key' => 'att-id',
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
				// Load basic definition data
			$this->meta_def = get_post_meta($this->post_id, 'att-def', true);
			if ($unpack) {
				if ($this->meta_def != '')
					$this->def = json_decode($this->meta_def, false);
				if (!$load_hint)
					unset($this->def->h);
			}

			if ($load_range) {
				$this->meta_range = get_post_meta($this->post_id, 'att-range', true);
				if ($unpack) {
					if ($this->meta_range != '')
						$this->range = json_decode($this->meta_range, false);
				}
			}
			if ($load_legend) {
				$this->meta_legend = get_post_meta($this->post_id, 'att-legend', true);
				if ($unpack) {
					if ($this->meta_legend != '')
						$this->legend = json_decode($this->meta_legend, false);
				}
			}
		} // if post_id
	} // __construct()

} // class GigAttribute
