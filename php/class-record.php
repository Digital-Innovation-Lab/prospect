<?php

// PURPOSE: Implement GigRecord objects

// NOTES:   

class GigRecord {
		// CLASS METHODS
		// =============



		// INSTANCE VARIABLES & METHODS
		// ============================
	public $id;				// the ID of the Record
	public $post_id;		// the WordPress ID of the post

		// Record-specific data
	public $tmplt_id;		// ID of the Template
	public $att_data;		// Associative array of Attribute data
	public $label;


		// PURPOSE: Create Record object given its ID and load its custom field values
		// INPUT:	If is_postid, then the_id is the WordPress post ID (not Record ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Attribute, or '' if this is a new Attribute definition
		//			If $keep_raw, then provide just values stored for Record
		//				if not, then Joins are done, label is determined, etc.
		//			If $the_template is not null, it is Template Object for Record	
		//			$dependent_array is array of the dependent Templates used for Joins with
		//				this Records from this Template type
		// NOTES:	Assumed to be newly created Record if record-id and tmplt-id are empty
		// ASSUMED: if $the_template, must have all fields and be unpacked
		// TO DO:	If Joins and Dependent Array in alphaorder, can do sorted comparison
		//			Evaluate value against Legend ??
	public function __construct($is_postid, $the_id, $keep_raw, $the_template, $dependent_array)
	{
		$this->id			= $this->post_id = null;
		$this->tmplt_id 	= null;
		$this->label 		= '';

		if ($is_postid) {
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'record-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'gig-record',
								'meta_key' => 'record-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Record not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

			// $att_ids and $template_def need to get set by next block of code or left as null
		$att_ids = $template_def = $joins = null;

			// Has a Template Object been provided for Record?
		if ($the_template) {
			$this->tmplt_id 	= $the_template->id;
			$template_def 		= $the_template->def;
			$joins 				= $the_template->joins;
			$att_ids 			= $template_def->a;
		} else {
				// Try to load template ID -- this and id will be empty if new Record
			$this->tmplt_id = get_post_meta($this->post_id, 'tmplt-id', true);			
				// If not new Record
			if ($this->tmplt_id != '') {
					// Get matching Attribute item
				$args = array('post_type' => 'gig-template',
								'meta_key' => 'tmplt-id',
								'meta_value' => $this->tmplt_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);
					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Record's Template not found by ID");
					return null;
				}
				$tmplt_wp_id = $query->posts[0]->ID;
					// Get Template's definition
				$template_def = get_post_meta($tmplt_wp_id, 'tmplt-def', true);
				if ($template_def != '') {
					$template_def = json_decode($template_def);
					$att_ids = $template_def->a;
				} else
					$template_def = null;
					// Get Join data for Template
				$joins = get_post_meta($tmplt_wp_id, 'tmplt-joins', true);
				if ($joins != '' && $joins != 'null') {
					$joins = json_decode($joins);
				} else
					$joins = null;
			} // has template ID
		} // no template given


		$this->att_data = array();

		if ($att_ids) {
			foreach($att_ids as $att_to_load) {
				$val = get_post_meta($this->post_id, $att_to_load, true);
				if ($val != '') {
					if ($keep_raw)
						$this->att_data[$att_to_load] = $val;
					else {
							// Resolve any Joins
						$jlen = 0;
						$joined = false;
						if ($joins)
							$jlen = count($joins);
						if ($jlen) {
								// Look for Attribute matches on Join array
							for ($i=0; $i<$jlen; $i++) {
								$j_entry = $joins[$i];
									// Matching Attribute name
								if ($j_entry->id == $att_to_load) {
										// Find matching depending Template
									foreach ($dependent_array as $d_temp) {
										if ($j_entry->t == $d_temp->id) {
												// Get the Record to Join
											$j_rec = new GigRecord(false, $val, true, $d_temp, null);
											foreach ($j_rec->att_data as $att_id => $att_val) {
												$this->att_data[$att_to_load.'.'.$att_id] = $att_val;
											}
											$joined = true;
											break; // can break out of foreach loop
										}
									}
									break; // can break out of for loop
								}
							} // for all Joins
								// No Join match -- store Attribute
							if (!$joined)
								$this->att_data[$att_to_load] = $val;
						} else
							$this->att_data[$att_to_load] = $val;
					}
				} // if custom field loaded
			} // for each att
				// Set Record's label
			$this->label = $this->att_data[$template_def->t];
		} // if atts to load
	} // _construct()

} // class GigRecord
