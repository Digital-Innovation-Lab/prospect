<!DOCTYPE html>
<meta charset="utf-8">
<html>
<head>
	<title><?php the_title(); ?></title>

	<?php
		add_action('wp_enqueue_scripts', 'prspct_dequeue_scripts');

			// PURPOSE: Dequeues all scripts and styles except those used by Prospect Exhibit
			// IMPORTANT: Must keep this list coordinated with prsp_page_template() in class-prospect.php
		function prspct_dequeue_scripts()
		{
			global $wp_scripts, $wp_styles;
			global $post;

			$prsp_exhibit_styles = array(
				// 'admin-bar',
				'prsp-jquery-ui-style',
				'prsp-jquery-theme-style',
				'leaflet-style',
				'prsp-exhibit-style',
				'jquery-help-css'
			);
			$prsp_exhibit_scripts = array(
				// 'admin-bar',
				'jquery',
				'underscore',
				'jquery-ui-core',
				'jquery-ui-widget',
				'jquery-ui-mouse',
				'jquery-ui-draggable',
				'jquery-ui-position',
				'jquery-ui-resizable',
				'jquery-ui-button',
				'jquery-ui-dialog',
				'jquery-effects-core',
				'jquery-effects-slide',
				'leaflet',
				'd3',
				'prsp-map-hub',
				'prsp-view-core',
				'prsp-view-aggregate',
				'prsp-view-qr',
				'prsp-view-exhibit',
				'soundcloud',
				'jquery-help'
			);

			foreach ($wp_styles->queue as $style) {
				if (!in_array($style, $prsp_exhibit_styles)) {
					wp_dequeue_style($style);
				}
			}

			foreach ($wp_scripts->queue as $script) {
				if (!in_array($script, $prsp_exhibit_scripts)) {
					wp_dequeue_script($script);
				}
			}
		} // prspct_dequeue_scripts()

		wp_head();
	?>
</head>

<body>

<?php
		ProspectAdmin::insert_html_file('view-exhibit.php');

		wp_footer();
?>
<style>
 /* fix exhibit page admin bar issue */
	html {
		margin-top: 0 !important;
	}
</style>
</body>
</html>
