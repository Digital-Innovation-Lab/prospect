<?php
	get_header();

		// Get Template definition
	$the_template = null;
	$tmplt_id = get_post_meta($post->ID, 'tmplt-id', true);

	if ($tmplt_id != '') {
		$the_template = new ProspectTemplate(false, $tmplt_id, true, true, false, true);

			// Default settings
		$display_style = 'l';
		$display_image = 'disable';
		$display_content = 'disable';
		if ($the_template->pview != null) {
			$display_style = $the_template->pview->d;
			$display_image = $the_template->pview->i;
			$display_content = $the_template->pview->c;
		}
	}

		// Give title of Templates
	echo('<h1 class="prospect">'.$the_template->def->l.'</h1><hr/>');

		// Open any enclosing DIVs
	switch($display_style) {
	case 'l':
		break;
	case 't':
		echo('<div class="prospect-cards">');
		break;
	case 'h':
		break;
	}

		// If Template has been properly defined
	if ($the_template != null) {
			// Get dependent Templates needed for Joins
		$d_templates = $the_template->get_dependent_templates(true);
			// Get associative array for all Attribute definitions
		$assoc_atts = ProspectAttribute::get_assoc_defs();

			// Get Records -- Need to order by Record ID, etc
		$args = array('post_type' => 'prsp-record',
						'post_status' => 'publish',
						'meta_key' => 'record-id',
						'orderby' => 'meta_value',
						'order' => 'ASC',
						'posts_per_page' => -1,
						'meta_query' =>
							array('key' => 'tmplt-id',
								'value' => $tmplt_id,
								'compare' => '=')
					);

		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$the_rec = new ProspectRecord(true, $rec->ID, false, $the_template, $d_templates, $assoc_atts);

				switch ($display_style) {
				case 'l':
					echo('<h2 class="prospect"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></h2>');
					echo('<div class="prospect-no-wrap">');
					if ($display_image != 'disable' && isset($the_rec->att_data[$display_image])) {
						echo('<img class="prospect-thumb" src="'.$the_rec->att_data[$display_image].'">');
					}
					if ($display_content != 'disable' && isset($the_rec->att_data[$display_content])) {
						echo('<p class="prospect-list-content">'.prospect_att_val($assoc_atts, $display_content, $the_rec->att_data).'</p>');
					}
					echo('</div>');
					break;
				case 't':
					echo('<div class="prospect-card">');
					if ($display_image != 'disable' && isset($the_rec->att_data[$display_image])) {
						echo('<img class="prospect-thumb" src="'.$the_rec->att_data[$display_image].'">');
					}
					echo('<p class="prospect-card-text"><span class="title"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></span>');
					if ($display_content != 'disable' && isset($the_rec->att_data[$display_content])) {
						echo('<br/><span class="content">'.prospect_att_val($assoc_atts, $display_content, $the_rec->att_data).'</span>');
					}
					echo('</p></div>');
					break;
				case 'h':
					echo('<figure class="prospect">');
					echo('<a href="'.get_permalink($the_rec->post_id).'">');
					if ($display_image != 'disable' && isset($the_rec->att_data[$display_image])) {
						echo('<img src="'.$the_rec->att_data[$display_image].'">');
					}
					echo('</a>');
					echo('<figcaption class="prospect"><div>'.$the_rec->label);
					if ($display_content != 'disable' && isset($the_rec->att_data[$display_content])) {
						echo('<br/><span class="content">'.prospect_att_val($assoc_atts, $display_content, $the_rec->att_data).'</span>');
					}
					echo('</div></figcaption>');
					echo('</figure>');
					break;
				} // switch by display_style
			} // foreach
		} // if have_posts
	} // if template has id

		// PURPOSE: Return a text value based on the Attribute whose ID is $att_id in $att_array
	function prospect_att_val($att_defs, $att_id, $att_array)
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
	} // prospect_att_val()

		// Close any enclosing DIV
	switch($display_style) {
	case 'l':
		break;
	case 't':
		echo('</div>');
		break;
	case 'h':
		break;
	}

	get_footer();
