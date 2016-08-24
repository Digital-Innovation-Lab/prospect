<?php get_header(); ?>

<div id="primary" class="content-area">
    <main id="main" class="site-main" role="main">

		<?php
		$tmplt_id = get_post_meta($post->ID, 'tmplt-id', true);

		if ($tmplt_id != '') {
				// Load Template definition
			$the_template = new ProspectTemplate(false, $tmplt_id, true, true, true);

			echo('<h1>'.$the_template->def->l.'</h1>');

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
					echo('<h2><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></h2><br/>');
						// Extract the necessary data in proper format
					// $extracted_rec = array();
					// $extracted_rec['id'] = $the_rec->id;
					// $extracted_rec['wp'] = $the_rec->post_id;
					// $extracted_rec['l']  = $the_rec->label;
					// $extracted_rec['a']  = $the_rec->att_data;
				} // foreach
			} // if have_posts
		} // if template has id

		?>
    </main>
</div>

<?php get_footer(); ?>
