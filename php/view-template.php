<?php	get_header();
			// Get Template definition
		$the_template = null;
		$tmplt_id = get_post_meta($post->ID, 'tmplt-id', true);

		if ($tmplt_id != '') {
			$the_template = new ProspectTemplate(false, $tmplt_id, true, true, true);

			$display_style = 0;
		}
?>

<div id="primary" class="content-area">
    <main id="main" class="site-main<?php 	// Add class to main content?
		switch($display_style) {
		case 0:
			break;
		case 1:
			echo(' prospect-cards');
			break;
		case 2:
			break;
		}
	?>" role="main">

		<?php
		if ($the_template != null) {
			echo('<h1 class="prospect">'.$the_template->def->l.'</h1><hr/>');

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

					switch($display_style) {
					case 0:
						echo('<h2 class="prospect"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></h2>');
						echo('<div class="prospect-no-wrap"><img class="prospect-thumb" src="https://philipwalton.github.io/solved-by-flexbox/images/kitten.jpg">');
						echo('<p>Some fake text</p></div>');
						break;
					case 1:
						echo('<div class="prospect-card">');
						echo('<img class="prospect-thumb" src="https://philipwalton.github.io/solved-by-flexbox/images/kitten.jpg">');
						echo('<p class="prospect-card-text"><span style="font-weight: bold"><a href="'.
								get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></span><br/>');
						echo('A bunch of fake text as test content blah blah blah</p>');
						echo('</div>');
						break;
					case 2:
						echo('<figure class="prospect">');
						echo('<a href="'.get_permalink($the_rec->post_id).'"><img src="https://philipwalton.github.io/solved-by-flexbox/images/kitten.jpg"></a>');
						echo('<figcaption class="prospect"><div>'.$the_rec->label.'</div></figcaption>');
						echo('</figure>');
						break;
					} // switch by display_style
				} // foreach
			} // if have_posts
		} // if template has id

		?>
    </main>
</div>

<?php get_footer(); ?>
