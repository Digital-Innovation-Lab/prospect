<?php

class ProspectAttribute {
		// CLASS METHODS
		// =============

		// PURPOSE: Search for $att_id in sorted Attribute array (from get_all_attributes)
		// RETURNS: Attribute object if match found, else none
		// NOTE: 	Algorithm from https://terenceyim.wordpress.com/2011/02/01/all-purpose-binary-search-in-php/
	static public function find_attribute(array $atts, $att_id)
	{
		$lo = 0;
		$hi = count($atts)-1;

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
		$args = array('post_type' => 'prsp-record', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $rec) {
				$record_id = $rec->ID;
				$rec_fields = get_post_custom_keys($record_id);

				foreach ($rec_fields as $key => $value) {
					$trimmed = trim($value);
						// exclude WP internal fields
					if ($trimmed[0] == '_')
						continue;
					ProspectAttribute::sorted_insert($trimmed, $custom_fields);
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

		// PURPOSE: Compare 'l' entry in array for sorting inverted indices
	static public function cmp_ls($a, $b)
	{
		return strcmp($a['l'], $b['l']);
	} // cmp_ls()

		// RETURNS: Array of all defined Attributes sorted by ID
		// NOTES:	Selects only published Attributes
		// ASSUMES: Attributes *not* loaded for visualization purposes
	static public function get_all_attributes($unpack, $load_hint, $load_range, $load_legend)
	{
		$all_atts = array();

			// Loop through all published Attributes adding to array
		$args = array('post_type' => 'prsp-attribute', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $att) {
				$new_att = new ProspectAttribute(true, $att->ID, $unpack, $load_hint, $load_range, $load_legend, false);
					// Ensure minimal data provided
				if ($new_att->id != null && $new_att->id != '') {
					array_push($all_atts, $new_att);
				}
			}
		}
			// Sort by ID
		usort($all_atts, array('ProspectAttribute', 'cmp_ids'));
		return $all_atts;
	} // get_all_attributes()


		// RETURNS: A sorted array of all Attribute IDs (except $except_post_id)
		// INPUT: 	Ignore the Attribute whose WP post ID is $except_post_id
	static public function get_all_attribute_ids($except_post_id)
	{
		$all_att_ids = array();

		$args = array('post_type' => 'prsp-attribute', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $att) {
				if ($att->ID != $except_post_id) {
					$new_att_id = get_post_meta($att->ID, 'att-id', true);
						// Ensure minimal data provided
					if ($new_att_id != null && $new_att_id != '') {
						array_push($all_att_ids, $new_att_id);
					}
				}
			}
		}

		sort($all_att_ids);
		return $all_att_ids;
	} // get_all_attribute_ids()


		// RETURNS: An associative array in which key is Attribute ID and the value is the Attribute definition
		// NOTES: 	Adds privacy setting as <p> field in each Attribute definition
	static public function get_assoc_defs()
	{
		$assocs = array();

		$args = array('post_type' => 'prsp-attribute', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $att) {
				$att_id = get_post_meta($att->ID, 'att-id', true);
				if ($att_id != '') {
					$att_def_meta = get_post_meta($att->ID, 'att-def', true);
					$att_def = json_decode($att_def_meta, false);
					$att_def->p = get_post_meta($att->ID, 'att-privacy', true);
					$assocs[$att_id] = $att_def;
				}
			}
		}

		return $assocs;
	} // get_assoc_defs()


		// RETURNS: Array of Attributes sorted by ID, ensuring that IDs are unique
	static public function unique_sorted_att_array($att_array)
	{
		$final = array();
		foreach ($att_array as $this_att) {
			$found = false;
			foreach ($final as $final_entry) {
				if ($this_att->id == $final_entry->id) {
					$found = true;
					break;
				}
			}
			if (!$found) {
				array_push($final, $this_att);
			}
		}
			// Sort by ID
		usort($final, array('ProspectAttribute', 'cmp_ids'));
		return $final;
	} // unique_sorted_att_array()


		// PURPOSE: Determine whether black or white is best color contast
		// INPUT:	viz_val is visual setting (could be color or icon ID)
		// RETURNS: true if black, false if white
		// NOTES:	http://www.particletree.com/notebook/calculating-color-contrast-for-legible-text/
		// 			http://stackoverflow.com/questions/5650924/javascript-color-contraster
	static public function black_contrast($viz_val)
	{
		if (substr($viz_val, 0, 1) === '#') {
			$brightness = ((hexdec(substr($viz_val, 1, 2)) * 299.0) +
						(hexdec(substr($viz_val, 3, 2)) * 587.0) +
						(hexdec(substr($viz_val, 5, 2)) * 114.0)) / 255000.0;
			if ($brightness >= 0.5)
				return true;
			else
				return false;
		} else
			return true;
	} // black_contrast()


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Attribute (and custom field name)
	public $post_id;		// the WordPress ID of the post

		// Attribute-specific data
	public $meta_def;		// JSON packed version of Attribute definition
	public $def;			// unpacked object version
	public $privacy;		// privacy setting: 'o' or 'p'
	public $meta_range;
	public $range;
	public $meta_legend;
	public $legend;
	public $x;				// inverted index array


		// PURPOSE: Create Attribute object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Attribute ID) or -1
		//			the_id is either (1) WordPress post ID, (2) unique ID for Attribute, or
		//				(3) '' if this is a new Attribute definition
		//			only load range data if load_range is true
		//			only load legend data if load_legend is true
		//			if for_viz is true, prepare Attribute Legend for visualization
	public function __construct($is_postid, $the_id, $unpack, $load_hint, $load_range, $load_legend, $for_viz)
	{
		$this->id			= $this->post_id = null;
		$this->meta_def 	= $this->def = null;
		$this->meta_range	= $this->range = null;
		$this->meta_legend	= $this->legend = null;
		$this->x = null;

		if ($is_postid) {
				// Check to see if Attribute post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Attribute not found by Post ID");
				return null;
			}
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'att-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-attribute',
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

			$this->privacy = get_post_meta($this->post_id, 'att-privacy', true);

			if ($load_range) {
				$this->meta_range = get_post_meta($this->post_id, 'att-range', true);
				if ($unpack) {
					if ($this->meta_range != '') {
						$this->range = json_decode($this->meta_range, false);
							// Process Range data for Number and Dates
						switch ($this->def->t) {
						case 'N':
							$this->range->min = (int)$this->range->min;
							$this->range->max = (int)$this->range->max;
							$this->range->g = (int)$this->range->g;
							break;
						case 'D':
							$this->range->min->y = (int)$this->range->min->y;
							if (isset($this->range->min->m))
								$this->range->min->m = (int)$this->range->min->m;
							if (isset($this->range->min->d))
								$this->range->min->d = (int)$this->range->min->d;
							if (isset($this->range->max->y))
								$this->range->max->y = (int)$this->range->max->y;
							if (isset($this->range->max->m))
								$this->range->max->m = (int)$this->range->max->m;
							if (isset($this->range->min->d))
								$this->range->max->d = (int)$this->range->max->d;
							break;
						} // switch()
					} // if meta_range
				}
			} // if load_range
			if ($load_legend) {
				$this->meta_legend = get_post_meta($this->post_id, 'att-legend', true);
				if ($unpack) {
					if ($this->meta_legend != '') {
						$this->legend = json_decode($this->meta_legend, false);
							// Process Legend data for Number, Dates
						switch ($this->def->t) {
						case 'T':
							if ($for_viz) {
								$num = count($this->legend);
								for ($i=0; $i<$num; $i++) {
									$entry = $this->legend[$i];
									$entry->b = ProspectAttribute::black_contrast($entry->v);
								}
							}
							break;
						case 'V':
							if ($for_viz) {
								$this->x = array();
								$i_num = count($this->legend);
								for ($i=0; $i<$i_num; $i++) {
									$x_item = array();
									$entry = $this->legend[$i];
									$entry->b = ProspectAttribute::black_contrast($entry->v);
									$x_item['l'] = $entry->l;
									$x_item['i'] = $i;
									array_push($this->x, $x_item);
									$z_num = count($entry->z);
									for ($j=0; $j<$z_num; $j++) {
										$z_entry = $entry->z[$j];
										$z_entry->b = ProspectAttribute::black_contrast($z_entry->v);
										$x_item = array();
										$x_item['l'] = $z_entry->l;
										$x_item['i'] = array($i, $j);
										array_push($this->x, $x_item);
									}
								}
								usort($this->x, array('ProspectAttribute', 'cmp_ls'));
							}
							break;
						case 'N':
							$num = count($this->legend);
							for ($i=0; $i<$num; $i++) {
								$entry = $this->legend[$i];
								if (isset($entry->d->min))
									$entry->d->min = (int)$entry->d->min;
								if (isset($entry->d->max))
									$entry->d->max = (int)$entry->d->max;
								if ($for_viz) {
									$entry->b = ProspectAttribute::black_contrast($entry->v);
								}
							}
							break;
						case 'D':
							$num = count($this->legend);
							for ($i=0; $i<$num; $i++) {
								$entry = $this->legend[$i];
								$entry->d->min->y = (int)$entry->d->min->y;
								if (isset($entry->d->min->m))
									$entry->d->min->m = (int)$entry->d->min->m;
								if (isset($entry->d->min->d))
									$entry->d->min->d = (int)$entry->d->min->d;
								if (isset($entry->d->max->y) && $entry->d->max->y != 'open')
									$entry->d->max->y = (int)$entry->d->max->y;
								if (isset($entry->d->max->m))
									$entry->d->max->m = (int)$entry->d->max->m;
								if (isset($entry->d->max->d))
									$entry->d->max->d = (int)$entry->d->max->d;
								if ($for_viz) {
									$entry->b = ProspectAttribute::black_contrast($entry->v);
								}
							}
							break;
						} // switch
					} // if meta_legend
				}
			} // if load_legend
		} // if post_id
	} // __construct()

		// PURPOSE: If an undefined color given, convert the <u> field of range to look like Legend entry
	public function convert_undefined()
	{
		if (($this->def->t == 'N' || $this->def->t == 'D') && isset($this->range->u)) {
			$color = $this->range->u;
			$b = ProspectAttribute::black_contrast($color);
				// Create pseudo-obect to contain Legend entry
			$this->range->u = new stdClass;
			$this->range->u->v = $color;
			$this->range->u->b = $b;
			$this->range->u->l = '?';
		}
	} // convert_undefined()
} // class ProspectAttribute
