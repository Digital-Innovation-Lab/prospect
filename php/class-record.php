<?php

class ProspectRecord {
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
		//				(2) unique ID for Record, or '' if this is a new Record definition
		//			If $keep_raw, then provide just values stored for Record
		//				if not, then Joins are done, label is determined, etc.
		//			If $the_template is not null, it is Template Object for Record
		//			$dependent_array is array of the dependent Templates used for Joins with
		//				this Records from this Template type
		//			$att_assocs is associative array for all possible Attributes: [att_id] = type
		// ASSUMED:	Record is newly created if record-id and tmplt-id are empty
		//			New Record created by Dashboard editor will always have $keep_raw = true, not use last fields
		//			if $the_template, all of its fields will be unpacked
		//			Only need to apply privacy setting if $keep_raw = false
		// TO DO:	Evaluate values against Legends to optimize look-ups ??
	public function __construct($is_postid, $the_id, $keep_raw, $the_template, $dependent_array, $att_assocs)
	{
		$this->id			= $this->post_id = null;
		$this->tmplt_id 	= null;
		$this->label 		= '';

		if ($is_postid) {
				// Check to see if Record post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Record not found by Post ID");
				return null;
			}
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

		if ($att_ids != null) {
			foreach ($att_ids as $att_to_load) {
				$val = get_post_meta($this->post_id, $att_to_load, true);
				if ($val != '') {
					if ($keep_raw)
						$this->att_data[$att_to_load] = $val;

						// Process Attribute values by type
					else {
						$att_def = $att_assocs[$att_to_load];
							// Ignore this Attribute if private
						if ($att_def->p != 'o')
							continue;

						switch($att_def->t) {
						case 'V':
						case 'P':
						case 'g':
							if ($att_def->d != '') {
								$v_set = explode($att_def->d, $val);
								$this->att_data[$att_to_load] = array();
								foreach ($v_set as $value) {
									if (strlen($value) > 0) {
										array_push($this->att_data[$att_to_load], trim($value));
									}
								}
							} else
								$this->att_data[$att_to_load] = array(trim($val));
							break;
						case 'N':
							if ($val == '?')
								$this->att_data[$att_to_load] = '?';
							else
								$this->att_data[$att_to_load] = (int)$val;
							break;
						case 'L':
						case 'X':
								// If delimiter, could specify polygon
							if ($att_def->d != '') {
								$split = explode($att_def->d, $val);
									// Just treat as point if only one data item
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
						case 'D':
								// Special undefined character?
							if ($val == '?') {
								$this->att_data[$att_to_load] = '?';
								break;
							}
								// Parse individual elements into max/min, f/y/m/d
							$date_val = array();
							$date_min = array();
							$parts = explode('/', $val);
							$str = $parts[0];
							if ($str[0] == '~') {
								$date_min['f'] = true;
								$str = substr($str, 1);
							} else {
								$date_min['f'] = false;
							}
							if ($str[0] == '-') {
								$bce = -1;
								$str = substr($str, 1);
							} else {
								$bce = 1;
							}
							$subparts = explode('-', $str);
							$date_min['y'] = (int)$subparts[0] * $bce;
							if (count($subparts) > 1) {
								$date_min['m'] = (int)$subparts[1];
								if (count($subparts) == 3) {
									$date_min['d'] = (int)$subparts[2];
								}
							}
							$date_val['min'] = $date_min;
								// Date has max component also
							if (count($parts) == 2) {
								$str = $parts[1];
								if ($str == 'open') {
									$date_val['max'] = 'open';
								} else {
									$date_max = array();
									if ($str[0] == '~') {
										$date_max['f'] = true;
										$str = substr($str, 1);
									} else {
										$date_max['f'] = false;
									}
									if ($str[0] == '-') {
										$bce = -1;
										$str = substr($str, 1);
									} else {
										$bce = 1;
									}
									$subparts = explode('-', $str);
									$date_max['y'] = (int)$subparts[0] * $bce;
									if (count($subparts) > 1) {
										$date_max['m'] = (int)$subparts[1];
										if (count($subparts) == 3) {
											$date_max['d'] = (int)$subparts[2];
										}
									}
									$date_val['max'] = $date_max;
								}
							}
							$this->att_data[$att_to_load] = $date_val;
							break;
						case 'J':
								// Look Attribute in Join array
							for ($i=0, $jlen=count($joins); $i<$jlen; $i++) {
								$j_entry = $joins[$i];
									// Matching Attribute name
								if ($att_to_load == $j_entry->id) {
										// Find matching dependent Template
									foreach ($dependent_array as $d_temp) {
										if ($j_entry->t == $d_temp->id) {
												// Get the Record to Join
											$j_rec = new ProspectRecord(false, $val, false, $d_temp, null, $att_assocs);
												// Ensure that it is a valid Record with valid data
											if ($j_rec != null && $j_rec->tmplt_id != null && $j_rec->tmplt_id != '' && count($j_rec->att_data) > 0) {
												foreach ($j_rec->att_data as $att_id => $att_val) {
													$this->att_data[$att_to_load.'.'.$att_id] = $att_val;
												}
											} // valid Record and data
											break;
										}
									}
									break;
								}
							} // for all Joins
							break;
						default:
							$this->att_data[$att_to_load] = $val;
							break;
						} // switch
					} // not raw
				} // if custom field loaded
			} // for atts
			if ($template_def->t != '') {
				$this->label = $this->att_data[$template_def->t];
			}
		}
	} // construct()
} // class ProspectRecord
?>
