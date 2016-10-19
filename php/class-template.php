<?php

	// Exception for template not found error (used for shortcode generation)
class NotFoundException extends Exception {}

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
	static public function get_all_template_defs($except_post_id, $unpack, $load_joins, $load_rviews, $load_tviews)
	{
		$all_tmp_defs = array();

			// Loop through all Templates
		$args = array('post_type' => 'prsp-template', 'post_status' => 'publish', 'posts_per_page' => -1 );
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $tmp) {
				if ($tmp->ID != $except_post_id) {
					$the_temp = new ProspectTemplate(true, $tmp->ID, $unpack, $load_joins, $load_rviews, $load_tviews);
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


		// PURPOSE: Return a text value based on the Attribute whose ID is $att_id in $att_array
	public static function get_att_val($att_defs, $att_id, $att_array)
	{
		$att_def = $att_defs[$att_id];
		$att_val = $att_array[$att_id];
		switch ($att_def->t) {
		case 'V':
		case 'g':
			return implode(", ", $att_val);
		case 'T':
		case 'N':
			return $att_val;
		case 'D':
			if ($att_val == '?') {
				return __('(uncertain)', 'prospect');
			}
			$date_string = '';
			$date_part = $att_val['min'];
			if (!isset($att_val['max'])) { // just a single date
				if ($date_part['f']) {
					$date_string = __('about', 'prospect').' ';
				}
				$date_string .= $date_part['y'];
				if (isset($date_part['m'])) {
					$date_string .= '-'.$date_part['m'];
					if (isset($date_part['d'])) {
						$date_string .= '-'.$date_part['d'];
					}
				}
			} else {	// from and to
				if ($date_part['f']) {
					$date_string = __('about', 'prospect').' ';
				}
				$date_string .=  $date_part['y'];
				if (isset($date_part['m'])) {
					$date_string .= '-'.$date_part['m'];
					if (isset($date_part['d'])) {
						$date_string .= '-'.$date_part['d'];
					}
				}

				$date_part = $att_val['max'];
				$date_string .= ' '.__('to', 'prospect').' ';
				if ($date_part == 'open') {
					$date_string .= __('now', 'prospect').' ';
				} else {
					if ($date_part['f']) {
						$date_string .= __('about', 'prospect').' ';
					}
					$date_string .= $date_part['y'];
					if (isset($date_part['m'])) {
						$date_string .= '-'.$date_part['m'];
						if (isset($date_part['d'])) {
							$date_string .= '-'.$date_part['d'];
						}
					}
				} // define to date
			} // from and to
			return $date_string;
		} // switch Attribute type
	} // get_att_val()

		// PURPOSE: Generates Prospect shortcode for plain HTML views
	public static function tmplt_shortcode($atts)
	{
		$a = shortcode_atts( array(
				'template' => null,					// template id (required)
				'display' => 'list',				// display type (list, cards, images)
				'image_attr' => null,				// attribute id of image to be displayed (optional)
				'content_attr' => null,				// attribute id of additional content to be displayed (optional)	
				'filter_attr_id' => null,			// filter attribute id (optional)
				'filter_attr_val' => null,			// filter attribute value (optional)
				'filter_attr_comp' => '='			// filter attribute comparison (=, !=)
		), $atts);

			// Return error if no template id is provided
		if ($a['template'] == null) return 'Error: Please provide a template ID.';

		try {
			$the_template = new ProspectTemplate(false, $a['template'], true, true, false, true);
		} catch (NotFoundException $e) {
			return 'Error: Template not found with provided ID "'. $a['template'] .'".';
		}

			// Stores generated html to be returned
		$html = '<div class="prospect-shortcode">';

			// Styles
		$html .= '<style type="text/css" scoped>';
		$html .= '	/* Creates Flex style for tiled cards */
				.prospect-cards {
					padding: 4px;
				
					display: -webkit-flex; /* Safari */
					display: flex;
				
					-webkit-flex-direction: row; /* Safari */
					flex-direction:         row;
				
					-webkit-flex-wrap: wrap; /* Safari */
					flex-wrap:         wrap;
				
					-webkit-align-items: flex-start; /* Safari */
					align-items:         flex-start;
				
					-webkit-align-content: flex-start; /* Safari */
				    align-content:         flex-start;
				}

				div.prospect-card {
					margin: 3px;
					border: black solid 1px;
					box-shadow: 3px 2px 3px rgba(0, 0, 0, 0.3);
					padding: 3px;
					overflow: hidden;
					line-height: 1.1em;
				
						/* Flex properties as item within container */
					-webkit-flex-grow: 1; /* Safari */
					flex-grow: 1;
				
					-webkit-flex-shrink: 1; /* Safari */
					flex-shrink:         1;
				
					-webkit-flex-basis: 250px; /* Safari */
					flex-basis:         250px;
				
						/* Flex properties as a container */
					display: -webkit-flex; /* Safari */
					display: flex;
				
					-webkit-flex-direction: row; /* Safari */
					flex-direction:         row;
				
					-webkit-flex-wrap: wrap; /* Safari */
					flex-wrap:         wrap;
				
					-webkit-align-items: flex-start; /* Safari */
					align-items:         flex-start;
				
					-webkit-align-content: flex-start; /* Safari */
				    align-content:         flex-start;
				
					margin-bottom: 5px;
				}

				img.prospect-thumb {
					vertical-align: middle;
				
					width: 80px;
					margin-right: 5px;
				}

				p.prospect-card-text {
					margin: 2px;
					vertical-align: top;
				
					-webkit-margin-before: 0;
					-webkit-margin-after: 0;
					-webkit-margin-start: 0;
					-webkit-margin-end: 0;
				
						/* Flex properties as item within container */
					-webkit-flex-grow: 3; /* Safari */
					flex-grow: 3;
				
					-webkit-flex-shrink: 3; /* Safari */
					flex-shrink:         3;
				
					-webkit-flex-basis: 170px; /* Safari */
					flex-basis:         170px;
				}

				p.prospect-card-text span.title {
					font-weight: bold;
				}

				p.prospect-card-text span.content {
					font-size: .8em;
					font-style: italic;
				}

					/* Styles for Image cards with hover caption */
				figure.prospect {
					max-width: 200px;
					max-height: 200px;
					overflow: hidden;
					position: relative;
					display: inline-block;
					vertical-align: top;
					border: 5px solid #fff;
					box-shadow: 0 0 5px #ddd;
					margin: 1em;
				}

				figure.prospect > figcaption.prospect {
					position: absolute;
					left: 0; right: 0;
					top: 0; bottom: 0;
				
					text-align: center;
					font-weight: bold;
					line-height: 1.2em;
					padding-bottom: .2em;
					width: 100%;
					height: 100%;
					display: table;
				}

				figure.prospect > figcaption.prospect > div {
					display: table-cell;
					vertical-align: middle;
					position: relative;
					top: 20px;
					opacity: 0;
					color: #2c3e50;
				}

				figure.prospect > figcaption.prospect div:after {
					position: absolute;
					left: 0; right: 0;
					bottom: 40%;
					text-align: center;
					margin: auto;
					width: 0%;
					height: 2px;
					background: #2c3e50;
				}

				figure.prospect img {
					width: 100%;
					height: 100%;
				
					-webkit-transition: all 0.5s linear;
				    transition: all 0.5s linear;
					-webkit-transform: scale3d(1, 1, 1);
				    transform: scale3d(1, 1, 1);
				}

				figure.prospect:hover > figcaption.prospect {
				/*	background: rgba(255,255,255,0.3); */
					background: grey;
				}

				figure.prospect:hover > figcaption.prospect > div {
					opacity: 1;
					top: 0;
					color: white;
				}

				figure.prospect:hover > figcaption.prospect  span.content {
					font-size: .8em;
					font-style: italic;
				}

				figure.prospect > figcaption.prospect:hover div:after {
					width: 50%;
				}

				figure.prospect:hover img {
					-webkit-transform: scale3d(1.2, 1.2, 1);
				    transform: scale3d(1.2, 1.2, 1);
				}


				h1.prospect {
					margin-top: 1em;
					margin-bottom: .2em;
					margin-left: 0;
					margin-right: 0;
				}

				h2.prospect {
					margin-top: .4em;
					margin-bottom: .1em;
					margin-left: 0;
					margin-right: 0;
				}

				p.prospect {
					line-height: 1.2em;
					margin-top: .3em;
					margin-bottom: .1em;
					margin-left: 0;
					margin-right: 0;
				}

					/* Style for content Attribute in Simply List display */
				p.prospect-list-content {
					font-size: .75em;
					font-style: italic;
				}

				div.prospect-no-wrap {
					margin: 3px;
					padding: 2px;
					white-space: nowrap;
				}

				div.prospect-no-wrap img, div.prospect-no-wrap p {
					display: inline-block;
					padding-top: 3px;
					padding-right: 4px;
					vertical-align: top;
				}';
		$html .= '</style>';

		$html .= '<h1 class="prospect">'.$the_template->def->l.'</h1><hr/>';

			// Open any enclosing DIVs
		switch($a['display']) {
		case 'list':
			break;
		case 'cards':
			$html .= '<div class="prospect-cards">';
			break;
		case 'images':
			break;
		}

			// Get dependent Templates needed for Joins
		$d_templates = $the_template->get_dependent_templates(true);
			// Get associative array for all Attribute definitions
		$assoc_atts = ProspectAttribute::get_assoc_defs();

			// Set up meta_query for use in $args
		$meta_query = array(
						array(
							'key' => 'tmplt-id',
							'value' => $a['template'],
							'compare' => '='
						)
		);
			// Provide filter if defined
		if (array_key_exists($a['filter_attr_id'], $assoc_atts) && $a['filter_attr_val'] != null && ($a['filter_attr_comp'] == '=' || $a['filter_attr_comp'] == '!=')) {
			$meta_query[] = array(
				'key' => $a['filter_attr_id'],
				'value' => $a['filter_attr_val'],
				'compare' => $a['filter_attr_comp']
			);
		}

			// Get Records -- Need to order by Record ID, etc
		$args = array('post_type' => 'prsp-record',
						'post_status' => 'publish',
						'meta_key' => 'record-id',
						'orderby' => 'meta_value',
						'order' => 'ASC',
						'posts_per_page' => -1,
						'meta_query' => $meta_query
					);
		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$the_rec = new ProspectRecord(true, $rec->ID, false, $the_template, $d_templates, $assoc_atts);

				switch ($a['display']) {
				case 'list':
					$html .= '<h2 class="prospect"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></h2>';
					$html .= '<div class="prospect-no-wrap">';
					if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
						$html .= '<img class="prospect-thumb" src="'.$the_rec->att_data[$a['image_attr']].'">';
					}
					if ($a['content_attr'] != null && isset($the_rec->att_data[$a['content_attr']])) {
						$html .= '<p class="prospect-list-content">'.ProspectTemplate::get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</p>';
					}
					$html .= '</div>';
					break;
				case 'cards':
					$html .= '<div class="prospect-card">';
					if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
						$html .= '<img class="prospect-thumb" src="'.$the_rec->att_data[$a['image_attr']].'">';
					}
					$html .= '<p class="prospect-card-text"><span class="title"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></span>';
					if ($a['content_attr'] != null && isset($the_rec->att_data[$a['content_attr']])) {
						$html .= '<br/><span class="content">'.ProspectTemplate::get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</span>';
					}
					$html .= '</p></div>';
					break;
				case 'images':
					$html .= '<figure class="prospect">';
					$html .= '<a href="'.get_permalink($the_rec->post_id).'">';
					if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
						$html .= '<img src="'.$the_rec->att_data[$a['image_attr']].'">';
					}
					$html .= '</a>';
					$html .= '<figcaption class="prospect"><div>'.$the_rec->label;
					if ($a['content_attr'] != null && isset($the_rec->att_data[$a['content_attr']])) {
						$html .= '<br/><span class="content">'.ProspectTemplate::get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</span>';
					}
					$html .= '</div></figcaption>';
					$html .= '</figure>';
					break;
				}
			} // foreach
		} // if have_posts

			// Close any enclosing DIV
		switch($a['display']) {
		case 'list':
			break;
		case 'cards':
			$html .= '</div>';
			break;
		case 'images':
			break;
		}

		$html .= '</div>';	// prospect-shortcode 

		return $html;
	}


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
	public $meta_pview;		// JSON packed version of Template post view config
	public $pview;

	public $all_att_ids;	// created by get_all_attributes() -- Joined version of Attributes

		// PURPOSE: Create Template object and load its definition given its ID
		// INPUT:	if is_postid, then the_id is the WordPress post ID (not Template ID)
		//			the_id is either (1) WordPress post ID, or
		//				unique ID for Template, or '' if this is a new Template definition
		//			only load joins data if $load_joins is true
		//			only load Record view data if $load_rview is true
		//			only load Template view data if $load_tview is
	public function __construct($is_postid, $the_id, $unpack, $load_joins, $load_rview, $load_tview)
	{
		$this->id			= $this->post_id= null;
		$this->meta_def 	= $this->def 	= null;
		$this->meta_joins	= $this->joins 	= null;
		$this->meta_view	= $this->view 	= null;
		$this->meta_pview	= $this->pview 	= null;


		if ($is_postid) {
				// Check to see if Template post exists; trick from https://tommcfarlin.com/wordpress-post-exists-by-id/
			if (!is_string(get_post_status($the_id))) {
				trigger_error("Template not found by Post ID");
				throw new NotFoundException();
				return null;
			}
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
					throw new NotFoundException();
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
			if ($load_rview) {
				$this->meta_view = get_post_meta($this->post_id, 'tmplt-view', true);
				if ($unpack) {
					if ($this->meta_view != '' && $this->meta_view != 'null')
						$this->view = json_decode($this->meta_view, false);
				}
			}
			if ($load_tview) {
				$this->meta_pview = get_post_meta($this->post_id, 'tmplt-pview', true);
				if ($unpack) {
					if ($this->meta_pview != '' && $this->meta_pview != 'null')
						$this->pview = json_decode($this->meta_pview, false);
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

		// PURPOSE: Return all Record IDs of this Template type
	public function get_all_record_ids()
	{
		$args = array('post_type' => 'prsp-record', 'meta_key' => 'tmplt-id',
						'meta_value' => $this->id, 'post_status' => 'publish');
		$query = new WP_Query($args);

		$ids = array();
		if ($query->have_posts()) {
			foreach ($query->posts as $post) {
				$id = get_post_meta($post->ID, 'record-id', true);
				if ($id && $id != '')
					array_push($ids, $id);
			}
		}
		return $ids;
	} // get_all_record_ids()


		// RETURNS: Array of Dependent templates joined by this Template ordered by ID
		// INPUT: 	$view is passed as $load_rview parameter
	public function get_dependent_templates($rview)
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
			$the_template = new ProspectTemplate(false, $join_pair->t, true, false, $rview, false);
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

		foreach ($this->def->a as $att_id) {
			$the_att = new ProspectAttribute(false, $att_id, true, false, true, true, true);
			if ($the_att->def->t == 'J') {
					// Find entry in Join table and get dependent Template
				for ($ji=0; $ji<count($this->joins); $ji++) {
					if ($att_id == $this->joins[$ji]->id) {
						$d_tmplt = new ProspectTemplate(false, $this->joins[$ji]->t, true, false, false, false);
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

			// Store the IDs in Template array
		$this->all_att_ids = array();
		foreach ($all_atts as $the_att) {
			array_push($this->all_att_ids, $the_att->id);
		}

		return $all_atts;
	} // get_all_attributes()
} // class ProspectTemplate
