<?php

// PURPOSE: Implement ProspectRecord objects

// NOTES:   

class ProspectRecord {
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
		//			$att_assocs is associative array for all possible Attributes: [att_id] = type
		// ASSUMED:	Record is newly created if record-id and tmplt-id are empty
		//			A new Record will always have $keep_raw = true, not use last fields
		//			if $the_template, all of its fields will be unpacked
		// TO DO:	If Joins and Dependent Array in alphaorder, can do sorted comparison
		//			Evaluate value against Legend ??
	public function __construct($is_postid, $the_id, $keep_raw, $the_template, $dependent_array, $att_assocs)
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
				$args = array('post_type' => 'prsp-record',
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
				$args = array('post_type' => 'prsp-template',
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

						// Process Attribute values by type
					else {
						$att_def = $att_assocs[$att_to_load];
						switch($att_def->t) {
						case 'Number':
							$this->att_data[$att_to_load] = (int)$val;
							break;
						case 'Lat-Lon':
						case 'X-Y':
							if ($att_def->d != '') {
								$split = explode($att_def->d, $val);
									// Just treat as Point if only one data item
								if (count($split) == 1) {
									$split = explode(',', $val);
									$this->att_data[$att_to_load] = array((float)$split[0],(float)$split[1]);
								} else {
									$poly = array();
									foreach ($split as $thisPt) {
										$pts = explode(',', $thisPt);
										array_push($poly, array((float)$pts[0], (float)$pts[1]));
									}
									$this->att_data[$att_to_load] = $poly;
								}
							} else {
								$split = explode(',', $val);
								$this->att_data[$att_to_load] = array((float)$split[0],(float)$split[1]);
							}
							break;
						case 'Join':
								// Look Attribute in Join array
							for ($i=0, $jlen=count($joins); $i<$jlen; $i++) {
								$j_entry = $joins[$i];
									// Matching Attribute name
								if ($att_to_load == $j_entry->id) {
										// Find matching depending Template 
									foreach ($dependent_array as $d_temp) {
										if ($j_entry->t == $d_temp->id) {
												// Get the Record to Join
											$j_rec = new ProspectRecord(false, $val, false, $d_temp, null, $att_assocs);
											foreach ($j_rec->att_data as $att_id => $att_val) {
												$this->att_data[$att_to_load.'.'.$att_id] = $att_val;
											}
											break; // can break out of foreach loop
										}
									}
									break; // can break out of for loop
								}
							} // for all Joins
							break;
						default:
							$this->att_data[$att_to_load] = $val;
							break;
						} // switch
					} // not raw
				} // if custom field loaded
			} // for each att
				// Set Record's label
			$this->label = $this->att_data[$template_def->t];
		} // if atts to load
	} // _construct()

} // class ProspectRecord
