<?php

// PURPOSE: Implement Template objects

// NOTES:   

class ProspectTemplate {
		// CLASS METHODS
		// =============

		// PURPOSE: Compare two IDs for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_ids()


		// RETURNS: A sorted array of all Template IDs (except $except_post_id)
		// INPUT: 	Ignore the Template whose WP post ID is $except_post_id
	static public function get_all_template_ids($except_post_id)
	{
		$all_tmp_ids = array();

			// Loop through all Templates
		$args = array('post_type' => 'prsp-template', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query( $args );
		if ($loop->have_posts()) {
			foreach ($loop->posts as $tmp) {
				if ($tmp->ID != $except_post_id) {
					$new_tmp_id = get_post_meta($tmp->ID, 'tmplt-id', true);
					if ($new_tmp_id != '') {
						array_push($all_tmp_ids, $new_tmp_id);
					}
				}
			}
		}

		sort($all_tmp_ids);
		return $all_tmp_ids;
	} // get_all_template_ids()


		// RETURNS: An array of all Template definitions (except $except_post_id)
		// INPUT: 	Ignore the Template whose WP post ID is $except_post_id
	static public function get_all_template_defs($except_post_id, $unpack, $load_joins)
	{
		$all_tmp_defs = array();

			// Loop through all Templates
		$args = array('post_type' => 'prsp-template', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $tmp) {
				if ($tmp->ID != $except_post_id) {
					$the_temp = new ProspectTemplate(true, $tmp->ID, $unpack, $load_joins, false);
					if ($the_temp->id != null && $the_temp->id != '') {
						array_push($all_tmp_defs, $the_temp);
					}
				}
			}
		}
			// Sort by ID
		usort($all_tmp_defs, array('ProspectTemplate', 'cmp_ids'));
		return $all_tmp_defs;
	} // get_all_template_defs()


		// INSTANCE VARIABLES & METHODS
		// ============================

	public $id;				// the ID of the Template
	public $post_id;		// the WordPress ID of the post

		// Template-specific data
	public $meta_def;		// JSON packed version of Template definition
	public $def;			// unpacked object version
	public $meta_joins;
	public $joins;
	public $meta_view;
	public $view;

		// PURPOSE: Create Template object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Template ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Template, or '' if this is a new Template definition
		//			only load joins data if $load_joins is true
		//			only load view data if $load_view is true
	public function __construct($is_postid, $the_id, $unpack, $load_joins, $load_view)
	{
		$this->id			= $this->post_id = null;
		$this->meta_def 	= $this->def = null;
		$this->meta_joins	= $this->joins = null;


		if ($is_postid) {
			$this->post_id = $the_id;
			$this->id = get_post_meta($this->post_id, 'tmplt-id', true);

		} else {
			if ($the_id != null && $the_id != '') {
				$this->id = $the_id;

					// Get matching Attribute item
				$args = array('post_type' => 'prsp-template',
								'meta_key' => 'tmplt-id',
								'meta_value' => $the_id,
								'posts_per_page' => 1);
				$query = new WP_Query($args);

					// Abort if not found
				if (!$query->have_posts()) {
					trigger_error("Template not found by ID");
					return null;
				}
				$this->post_id = $query->posts[0]->ID;
			}
		}

		if ($this->post_id != null) {
				// Load basic definition data
			$this->meta_def = get_post_meta($this->post_id, 'tmplt-def', true);
			if ($unpack) {
				if ($this->meta_def != '')
					$this->def = json_decode($this->meta_def, false);
			}

			if ($load_joins) {
				$this->meta_joins = get_post_meta($this->post_id, 'tmplt-joins', true);
				if ($unpack) {
					if ($this->meta_joins != '' && $this->meta_joins != 'null')
						$this->joins = json_decode($this->meta_joins, false);
				}
			}
			if ($load_view) {
				$this->meta_view = get_post_meta($this->post_id, 'tmplt-view', true);
				if ($unpack) {
					if ($this->meta_view != '' && $this->meta_view != 'null')
						$this->view = json_decode($this->meta_view, false);
				}
			}
		} // if post_id
	} // __construct()


		// PURPOSE: Get number of Records of this Template type
	public function get_num_records()
	{
		$args = array('post_type' => 'prsp-record', 'meta_key' => 'tmplt-id',
						'meta_value' => $this->id, 'post_status' => 'publish');
		$query = new WP_Query($args);
		return (int)$query->found_posts;
	} // get_num_records()


		// RETURNS: Array of Dependent templates joined by this Template ordered by ID
	public function get_dependent_templates()
	{
			// Decode Join data if not already
		if ($this->joins == null && ($this->meta_joins != null && $this->meta_joins != '' && $this->meta_joins != 'null'))
			$this->joins = json_decode($this->meta_joins, false);

		$deps = array();

			// No Join data
		if ($this->joins == null || $this->joins == '') {
			return $deps;
		}

		foreach($this->joins as $join_pair) {
				// As they are dependent Templates, they will not have join data
			$the_template = new ProspectTemplate(false, $join_pair->t, true, false, false);
			array_push($deps, $the_template);
		}
			// Sort by ID
		usort($deps, array('ProspectTemplate', 'cmp_ids'));
		return $deps;
	} // get_dependent_templates()

		// RETURNS: Array of all Attributes used by this Template type
		// 				Creates pseudo-Attribute definitions for Joined Attributes
		// INPUT:	Sort by ID if sort = true
		// ASSUMES: Attributes are being loaded for purposes of visualization
		//			This Template's Joins and definition data has been loaded
		//			Attribute needs to be unpacked, hint is not needed
	public function get_all_attributes($sort)
	{
			// Decode Definition data if not already
		if ($this->def == null && ($this->meta_def != null && $this->meta_def != '' && $this->meta_def != 'null'))
			$this->def = json_decode($this->meta_def, false);

			// Decode Join data if not already
		if ($this->joins == null && ($this->meta_joins != null && $this->meta_joins != '' && $this->meta_joins != 'null'))
			$this->joins = json_decode($this->meta_joins, false);

		$all_atts = array();

		foreach($this->def->a as $att_id) {
			$the_att = new ProspectAttribute(false, $att_id, true, false, true, true, true);
			if ($the_att->def->t == 'Join') {
					// Find entry in Join table and get dependent Template
				for ($ji=0; $ji<count($this->joins); $ji++) {
					if ($att_id == $this->joins[$ji]->id) {
						$d_tmplt = new ProspectTemplate(false, $this->joins[$ji]->t, true, false, false);
						foreach ($d_tmplt->def->a as $d_att_id) {
								// Get dependent Attribute definition
							$d_att = new ProspectAttribute(false, $d_att_id, true, false, true, true, true);
								// Modify Joined ID and label for dot notation
							$d_att->id = $the_att->id.'.'.$d_att->id;
							$d_att->def->l = $the_att->def->l.' ('.$d_att->def->l.')';
							array_push($all_atts, $d_att);
						}
					}
				}
			} else
				array_push($all_atts, $the_att);
		}
		if ($sort) {
			usort($all_atts, array('ProspectTemplate', 'cmp_ids'));
		}
		return $all_atts;
	} // get_all_attributes()
} // class ProspectTemplate
