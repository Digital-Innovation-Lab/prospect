<?php

// PURPOSE: Code that handles Dashboard backend functionality
//				and all interface between WordPress and JavaScript browser front-end
// NOTES:	Prospect has to compensate for the inconsistent handling of non-ASCII characters, namely:
//			All text encoded in JSON needs to be consistent and predictable because
//				of literal string matches and searches (Legend values, filter settings, &c)
//			JSON-representation (text) needs to embedded in HTML page to pass to JS and returned via POST.
//			But different PHP and JavaScript JSON mechanisms don't always produce the same results.
//			PHP json_encode() expects UTF-8 input but produces unicode encoded output by default (eg, "\u0039").
//			Furthermore, when WordPress stores text into the DB, it strips backslashes from Unicode encodings!
//			Therefore, JSON text produced by PHP & JS must retain UTF-8 encoding; it is stored in DB and
//				archive files, and passed back/forth via HTML.
//			Prospect currently assumes that JavaScript's JSON.stringify() leaves data in UTF-8; if not, the Dashboard
//				editing suite must force it to be in UTF-8.
//			PHP utf8_encode() and utf8_decode() will convert Unicode to UTF-8 and back (respectively).
//			For more on issues of character coding, JSON, JS and PHP, see:
//				https://www.stefan-wallin.se/utf-8-issues-in-wordpress-with-update_post_meta-and-json_encode/
//				https://mathiasbynens.be/notes/javascript-unicode
//				http://stackoverflow.com/questions/6771938/any-way-to-return-php-json-encode-with-encode-utf-8-and-not-unicode
//				http://stackoverflow.com/questions/12271547/shouldnt-json-stringify-escape-unicode-characters
//				http://stackoverflow.com/questions/4901133/json-and-escaping-characters
//				http://www.avoid.org/replace-u-characters-in-json-string/

class ProspectAdmin {

		// CLASS METHODS
		// =============

		// PURPOSE: "clean" extraneous data from string passed via internet
		// NOTES: 	Problems saving Date values unless some code in top portion also included
		//			Currently only used to treat Record data (Attribute values) by save_post()
	static private function clean_string($orig_string)
	{
		$new_string = $orig_string;
		for ($i = 0; $i <= 31; ++$i) { 
			$new_string = str_replace(chr($i), "", $new_string);
		}
		$new_string = str_replace(chr(127), "", $new_string);

			// Remove UTF-8 prefix
		if (0 === strpos(bin2hex($new_string), 'efbbbf')) {
			$new_string = substr($new_string, 3);
		}

		$new_string = preg_replace("/\p{Cc}*$/u", "", $new_string);

		$new_string = rtrim($new_string, "\0");

		$new_string = preg_replace('/,\s*([\]}])/m', '$1', $new_string);

			// One necessary process -- WARNING: Can't strip backlash from Unicode encoding!!
		$new_string = stripslashes(str_replace('\"', '"', $new_string));

		return $new_string;
	} // clean_string()


		// PURPOSE: Called to retrieve file content to insert HTML fragments into a particular page
		// INPUT:   $scriptname = base name of HTML file (not pathname)
		// RETURNS: Contents of file as string
	static public function get_script_text($scriptname)
	{
		$options = get_option('prsp_base_options');
		$lang = isset($options['prsp_lang']) ? $options['prsp_lang'] : 'english-us';

		$scriptpath = plugin_dir_path(__FILE__).'scripts/'.$lang.'/'.$scriptname;

		if (!file_exists($scriptpath)) {
			trigger_error("Script file ".$scriptpath." not found");
		}
		$scripthandle = fopen($scriptpath, "r");
		$scripttext = file_get_contents($scriptpath);
		fclose($scripthandle);
		return $scripttext;
	} // get_script_text()


		// PURPOSE: Compare two objects by ID for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a->id, $b->id);
	} // cmp_ids()


		// INSTANCE VARIABLES AND METHODS
		// ==============================
	private $version;
	private $options;

		// PURPOSE: Add perspective parameter to URL query variables for use with Prospect
	public function add_query_vars_filter($vars)
	{
		$vars[] = "prspctv";
		return $vars;
	} // add_query_vars_filter()


		// PURPOSE: Ensure that txt and png files are able to be added to the Media Library
	public function add_mime_types($mime_types)
	{
		$mime_types['txt'] = 'text/plain';
		$mime_types['csv'] = 'text/csv';
		$mime_types['svg'] = 'image/svg+xml';

		return $mime_types;
	} // add_mime_types()


	public function add_prsp_attribute_admin_edit($post_type)
	{
		add_meta_box('prsp_attribute_box', 'Configure Attribute', array($this, 'show_prsp_attribute_admin_edit'),
					'prsp-attribute', 'normal', 'high');
	} // add_prsp_attribute_admin_edit()


		// PURPOSE: Insert HTML for Dashboard Attribute Editor and embed data
	public function show_prsp_attribute_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_attribute'.$postID, 'prsp_nonce');

			// Load this Attribute's data
		$theAtt = new ProspectAttribute(true, $postID, false, true, true, true, false);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_att_id" value="'.$theAtt->id.'"/>';
		echo '<textarea name="prsp_att_privacy" form="post" spellcheck="false" style="display:none">'.$theAtt->privacy.'</textarea>';
		echo '<textarea name="prsp_att_def" form="post" spellcheck="false" style="display:none">'.$theAtt->meta_def.'</textarea>';
		echo '<textarea name="prsp_att_r" form="post" spellcheck="false" style="display:none">'.$theAtt->meta_range.'</textarea>';
		echo '<textarea name="prsp_att_lgnd" form="post" spellcheck="false" style="display:none">'.$theAtt->meta_legend.'</textarea>';

		echo '<div id="ractive-output"></div>';

			// Insert Edit Panel's HTML
		$dashboardscript = self::get_script_text('edit-attribute.txt');
		echo $dashboardscript;
	} // show_prsp_attribute_admin_edit()


	public function add_prsp_template_admin_edit($post_type)
	{
		add_meta_box('prsp_template_box', 'Configure Template', array($this, 'show_prsp_template_admin_edit'),
					'prsp-template', 'normal', 'high');
	} // add_prsp_template_admin_edit()

		// PURPOSE: Insert HTML for Dashboard Template Editor and embed data
	public function show_prsp_template_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_template'.$postID, 'prsp_nonce');

			// Load this Template's data
		$the_tmp = new ProspectTemplate(true, $postID, false, true, true);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_tmp_id" value="'.$the_tmp->id.'"/>';
		echo '<textarea name="prsp_tmp_def" form="post" spellcheck="false" style="display:none">'.$the_tmp->meta_def.'</textarea>';
		echo '<textarea name="prsp_tmp_joins" form="post" spellcheck="false" style="display:none">'.$the_tmp->meta_joins.'</textarea>';
		echo '<textarea name="prsp_tmp_view" form="post" spellcheck="false" style="display:none">'.$the_tmp->meta_view.'</textarea>';

		echo '<div id="ractive-output"></div>';

			// Insert Edit Panel's HTML
		$dashboardscript = self::get_script_text('edit-template.txt');
		echo $dashboardscript;
	} // show_prsp_template_admin_edit()


	public function add_prsp_record_admin_edit($post_type)
	{
		add_meta_box('prsp_record_box', 'Edit Record', array($this, 'show_prsp_record_admin_edit'),
					'prsp-record', 'normal', 'high');
	} // add_prsp_record_admin_edit()

		// PURPOSE: Insert HTML for Dashboard Record Editor and embed data
	public function show_prsp_record_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_record'.$postID, 'prsp_nonce');

		$the_rec = new ProspectRecord(true, $postID, true, null, null, null);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_rec_id" value="'.$the_rec->id.'"/>';
		echo '<input type="hidden" name="prsp_tmplt_id" value="'.$the_rec->tmplt_id.'"/>';
			// NOTE: The cfs setting for new Record will be encoded as "null"
		echo '<textarea name="prsp_rec_atts" form="post" spellcheck="false" style="display:none">'.json_encode($the_rec->att_data, JSON_UNESCAPED_UNICODE).'</textarea>';

		echo '<div id="ractive-output"></div>';

			// Insert Edit Panel's HTML
		$dashboardscript = self::get_script_text('edit-record.txt');
		echo $dashboardscript;
	} // show_prsp_record_admin_edit()


	public function add_prsp_exhibit_admin_edit($post_type)
	{
		add_meta_box('prsp_exhibit_box', 'Edit Exhibit', array($this, 'show_prsp_exhibit_admin_edit'),
					'prsp-exhibit', 'normal', 'high');
	} // add_prsp_exhibit_admin_edit()

		// PURPOSE: Insert HTML for Dashboard Exhibit Editor and embed data
	public function show_prsp_exhibit_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_exhibit'.$postID, 'prsp_nonce');

		$the_exhibit = new ProspectExhibit(true, $postID, false);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_xhbt_id" value="'.$the_exhibit->id.'"/>';
		echo '<textarea name="prsp_xhbt_gen" form="post" spellcheck="false" style="display:none">'.$the_exhibit->meta_gen.'</textarea>';
		echo '<textarea name="prsp_xhbt_views" form="post" spellcheck="false" style="display:none">'.$the_exhibit->meta_views.'</textarea>';
		echo '<textarea name="prsp_xhbt_inspect" form="post" spellcheck="false" style="display:none">'.$the_exhibit->meta_inspect.'</textarea>';

		echo '<div id="ractive-output"></div>';

			// Insert Edit Panel's HTML
		$dashboardscript = self::get_script_text('edit-exhibit.txt');
		echo $dashboardscript;
	} // show_prsp_exhibit_admin_edit()


	public function add_prsp_map_admin_edit($post_type)
	{
		add_meta_box('prsp_map_box', 'Edit Map', array($this, 'show_prsp_map_admin_edit'),
					'prsp-map', 'normal', 'high');
	} // add_prsp_map_admin_edit()

		// PURPOSE: Insert HTML for Dashboard Map Editor and embed data
	public function show_prsp_map_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_map'.$postID, 'prsp_nonce');

		$the_map = new ProspectMap(true, $postID);

			// Can all be done in regular input fields
		echo '<table class="form-table">';
		echo '<tr><th style="width:20%"><label for="prsp_map_id">Unique ID: </label></th><td><input name="prsp_map_id" id="prsp_map_id" type="text" value="'.$the_map->id.'" size=20/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_sname">Short Name: </label></th><td><input name="prsp_map_sname" id="prsp_map_sname" type="text" value="'.$the_map->meta_data['sname'].'" size=30/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_url">Map URL: </label></th><td><input name="prsp_map_url" id="prsp_map_url" type="url" value="'.$the_map->meta_data['url'].'" size=60/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_inverse_y">Inverse Y? (true or false) </label></th><td><input name="prsp_map_inverse_y" id="prsp_map_inverse_y" type="text" value="'.$the_map->meta_data['inverseY'].'" size=5 pattern="true|false"/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_subd">Subdomain: </label></th><td><input name="prsp_map_subd" id="prsp_map_subd" type="text" value="'.$the_map->meta_data['subd'].'" size=12/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_min_zoom">Min Zoom: </label></th><td><input name="prsp_map_min_zoom" id="prsp_map_min_zoom" type="number" value="'.$the_map->meta_data['minZoom'].'" size=2 min=1 max=20/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_max_zoom">Max Zoom: </label></th><td><input name="prsp_map_max_zoom" id="prsp_map_max_zoom" type="number" value="'.$the_map->meta_data['maxZoom'].'" size=2 min=1 max=20/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_credits">Credits: </label></th><td><input name="prsp_map_credits" id="prsp_map_credits" type="text" value="'.$the_map->meta_data['credits'].'" size=30/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_n_bounds">N Bounds: </label></th><td><input name="prsp_map_n_bounds" id="prsp_map_n_bounds" type="text" value="'.$the_map->meta_data['nBounds'].'" size=10/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_s_bounds">S Bounds: </label></th><td><input name="prsp_map_s_bounds" id="prsp_map_s_bounds" type="text" value="'.$the_map->meta_data['sBounds'].'" size=10/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_e_bounds">E Bounds: </label></th><td><input name="prsp_map_e_bounds" id="prsp_map_e_bounds" type="text" value="'.$the_map->meta_data['eBounds'].'" size=10/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_map_w_bounds">W Bounds: </label></th><td><input name="prsp_map_w_bounds" id="prsp_map_w_bounds" type="text" value="'.$the_map->meta_data['wBounds'].'" size=10/></td></tr>';
		echo '</table>';
	} // show_prsp_map_admin_edit()


	public function add_prsp_prspctv_admin_edit($post_type)
	{
		add_meta_box('prsp_prspctv_box', 'Edit Perspective', array($this, 'show_prsp_prspctv_admin_edit'),
					'prsp-prspctv', 'normal', 'high');
	} // add_prsp_prspctv_admin_edit()


		// PURPOSE: Insert HTML for Perspective Editor and embed data
	public function show_prsp_prspctv_admin_edit()
	{
		$postID  = get_the_ID();

			// Use nonce for verification
		echo wp_nonce_field('prsp_save_prspctv'.$postID, 'prsp_nonce');

		$the_prspctv = new ProspectPerspective(true, $postID, false);

			// Can all be done in regular input fields
		echo '<table class="form-table">';
		echo '<tr><th style="width:20%"><label for="prsp_prspctv_id">Perspective ID: </label></th><td><input name="prsp_prspctv_id" id="prsp_prspctv_id" type="text" value="'.$the_prspctv->id.'" size=20/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_prspctv_l">Label: </label></th><td><input name="prsp_prspctv_l" id="prsp_prspctv_l" type="text" value="'.$the_prspctv->l.'" size=30/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_xbht_id">Exhibit ID: </label></th><td><input name="prsp_xbht_id" id="prsp_xbht_id" type="text" value="'.$the_prspctv->xhbt_id.'" size=20/></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_prspctv_note">Annotation: </label></th><td><textarea name="prsp_prspctv_note" id="prsp_prspctv_note" form="post" rows="4" cols="50">'.$the_prspctv->note.'</textarea></td></tr>';
		echo '<tr><th style="width:20%"><label for="prsp_prspctv_state">JSON data: </label></th><td><textarea name="prsp_prspctv_state" id="prsp_prspctv_state" form="post" rows="3" cols="50" spellcheck="false">'.$the_prspctv->meta_state.'</textarea></td></tr>';
		echo '</table>';
	} // show_prsp_prspctv_admin_edit()


		// PURPOSE: Save custom fields about data entity
	public function save_post($post_id)
	{
			// Check the user's permissions
		if (!current_user_can('edit_page', $post_id))
			return $post_id;

			// If autosave, form not been submitted, we don't want to do anything.
		if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
			return $post_id;

			// Verify nonce is set
		if (!isset($_POST['prsp_nonce']))
			return $post_id;
		$nonce = $_POST['prsp_nonce'];

			// Save track custom fields?
		switch($_POST['post_type']) {
		case 'prsp-attribute':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_attribute'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_att_id'])) {
				$att_id = $_POST['prsp_att_id'];
				update_post_meta($post_id, 'att-id', $att_id);
			}
			if (isset($_POST['prsp_att_privacy'])) {
				$att_r = $_POST['prsp_att_privacy'];
				update_post_meta($post_id, 'att-privacy', $att_r);
			}
			if (isset($_POST['prsp_att_def'])) {
				$att_def = $_POST['prsp_att_def'];
				update_post_meta($post_id, 'att-def', $att_def);
			}
			if (isset($_POST['prsp_att_r'])) {
				$att_r = $_POST['prsp_att_r'];
				update_post_meta($post_id, 'att-range', $att_r);
			}
			if (isset($_POST['prsp_att_lgnd'])) {
				$att_lgnd = $_POST['prsp_att_lgnd'];
				update_post_meta($post_id, 'att-legend', $att_lgnd);
			}
			break;
		case 'prsp-template':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_template'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_tmp_id'])) {
				$tmp_id = $_POST['prsp_tmp_id'];
				update_post_meta($post_id, 'tmplt-id', $tmp_id);
			}
			if (isset($_POST['prsp_tmp_def'])) {
				$tmp_def = $_POST['prsp_tmp_def'];
				update_post_meta($post_id, 'tmplt-def', $tmp_def);
			}
			if (isset($_POST['prsp_tmp_joins'])) {
				$tmp_joins = $_POST['prsp_tmp_joins'];
				update_post_meta($post_id, 'tmplt-joins', $tmp_joins);
			}
			if (isset($_POST['prsp_tmp_view'])) {
				$tmp_view = $_POST['prsp_tmp_view'];
				update_post_meta($post_id, 'tmplt-view', $tmp_view);
			}
			break;
		case 'prsp-record':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_record'.$post_id))
				return $post_id;

				// Update each value
				// TO DO: Remove all other post_meta (in case Template type changed)? How?
			if (isset($_POST['prsp_rec_id'])) {
				$rec_id = $_POST['prsp_rec_id'];
				update_post_meta($post_id, 'record-id', $rec_id);
			}
			if (isset($_POST['prsp_tmplt_id'])) {
				$tmp_id = $_POST['prsp_tmplt_id'];
				update_post_meta($post_id, 'tmplt-id', $tmp_id);
			}
			if (isset($_POST['prsp_rec_atts'])) {
				$rec_atts = self::clean_string($_POST['prsp_rec_atts']);
				$att_pairs = json_decode($rec_atts, true);

				if ($att_pairs) {
					foreach ($att_pairs as $key => $value) {
						update_post_meta($post_id, $key, $value);
					}
				}
			}
			break;
		case 'prsp-exhibit':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_exhibit'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_xhbt_id'])) {
				$xhbt_id = $_POST['prsp_xhbt_id'];
				update_post_meta($post_id, 'xhbt-id', $xhbt_id);
			}
			if (isset($_POST['prsp_xhbt_gen'])) {
				$xhbt_gen = $_POST['prsp_xhbt_gen'];
				update_post_meta($post_id, 'xhbt-gen', $xhbt_gen);
			}
			if (isset($_POST['prsp_xhbt_views'])) {
				$xhbt_views = $_POST['prsp_xhbt_views'];
				update_post_meta($post_id, 'xhbt-views', $xhbt_views);
			}
			if (isset($_POST['prsp_xhbt_inspect'])) {
				$xhbt_inspect = $_POST['prsp_xhbt_inspect'];
				update_post_meta($post_id, 'xhbt-inspect', $xhbt_inspect);
			}
			break;
		case 'prsp-map':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_map'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_map_id'])) {
				$data = sanitize_text_field($_POST['prsp_map_id']);
				update_post_meta($post_id, 'map-id', $data);
			}
			if (isset($_POST['prsp_map_sname'])) {
				$data = sanitize_text_field($_POST['prsp_map_sname']);
				update_post_meta($post_id, 'map_sname', $data);
			}
			if (isset($_POST['prsp_map_url'])) {
				$data = sanitize_text_field($_POST['prsp_map_url']);
				update_post_meta($post_id, 'map_url', $data);
			}
			if (isset($_POST['prsp_map_inverse_y'])) {
				$data = sanitize_text_field($_POST['prsp_map_inverse_y']);
				update_post_meta($post_id, 'map_inverse_y', $data);
			}
			if (isset($_POST['prsp_map_subd'])) {
				$data = sanitize_text_field($_POST['prsp_map_subd']);
				update_post_meta($post_id, 'map_subdomains', $data);
			}
			if (isset($_POST['prsp_map_min_zoom'])) {
				$data = sanitize_text_field($_POST['prsp_map_min_zoom']);
				update_post_meta($post_id, 'map_min_zoom', $data);
			}
			if (isset($_POST['prsp_map_max_zoom'])) {
				$data = sanitize_text_field($_POST['prsp_map_max_zoom']);
				update_post_meta($post_id, 'map_max_zoom', $data);
			}
			if (isset($_POST['prsp_map_credits'])) {
				$data = sanitize_text_field($_POST['prsp_map_credits']);
				update_post_meta($post_id, 'map_credits', $data);
			}
			if (isset($_POST['prsp_map_n_bounds'])) {
				$data = sanitize_text_field($_POST['prsp_map_n_bounds']);
				update_post_meta($post_id, 'map_n_bounds', $data);
			}
			if (isset($_POST['prsp_map_s_bounds'])) {
				$data = sanitize_text_field($_POST['prsp_map_s_bounds']);
				update_post_meta($post_id, 'map_s_bounds', $data);
			}
			if (isset($_POST['prsp_map_e_bounds'])) {
				$data = sanitize_text_field($_POST['prsp_map_e_bounds']);
				update_post_meta($post_id, 'map_e_bounds', $data);
			}
			if (isset($_POST['prsp_map_w_bounds'])) {
				$data = sanitize_text_field($_POST['prsp_map_w_bounds']);
				update_post_meta($post_id, 'map_w_bounds', $data);
			}
			break;
		case 'prsp-prspctv':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_prspctv'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_prspctv_id'])) {
				$data = sanitize_text_field($_POST['prsp_prspctv_id']);
				update_post_meta($post_id, 'prspctv-id', $data);
			}
			if (isset($_POST['prsp_prspctv_l'])) {
				$data = sanitize_text_field($_POST['prsp_prspctv_l']);
				update_post_meta($post_id, 'prspctv-l', $data);
			}
			if (isset($_POST['prsp_xbht_id'])) {
				$data = sanitize_text_field($_POST['prsp_xbht_id']);
				update_post_meta($post_id, 'xhbt-id', $data);
			}
			if (isset($_POST['prsp_prspctv_note'])) {
				$data = sanitize_text_field($_POST['prsp_prspctv_note']);
				update_post_meta($post_id, 'prspctv-note', $data);
			}
			if (isset($_POST['prsp_prspctv_state'])) {
				$data = sanitize_text_field($_POST['prsp_prspctv_state']);
				update_post_meta($post_id, 'prspctv-state', $data);
			}
			break;
		} // switch post_type
	} // save_post()


		// PURPOSE: Enqueue JS and CSS for Dashboard editors
	static public function add_admin_scripts($hook)
	{
		global $post;

		$blog_id = get_current_blog_id();
		$dev_url = get_admin_url($blog_id ,'admin-ajax.php');
		$postID  = get_the_ID();

			// Editing in Dashboard?
		if ($hook == 'post-new.php' || $hook == 'post.php') {
			switch ($post->post_type) {
			case 'prsp-attribute':
				wp_enqueue_style('jquery-ui-min-style', plugins_url('/css/jquery-ui.min.css', dirname(__FILE__)));
				wp_enqueue_style('jquery-ui-theme-style', plugins_url('/css/jquery-ui.theme.min.css', dirname(__FILE__)));
				wp_enqueue_style('edit-attribute-style', plugins_url('/css/edit-attribute.css', dirname(__FILE__)),
								array('jquery-ui-min-style', 'jquery-ui-theme-style'));

					// Built-in modules
				wp_enqueue_script('jquery');
				wp_enqueue_script('underscore');
				wp_enqueue_script('iris');
				wp_enqueue_script('jquery-ui-button');
				wp_enqueue_script('jquery-ui-dialog');

					// Prospect-specific
				wp_enqueue_script('ractive', plugins_url('/lib/ractive.min.js', dirname(__FILE__)));
				wp_enqueue_script('randomcolor', plugins_url('/lib/randomcolor.js', dirname(__FILE__)));
				wp_enqueue_script('rainbow', plugins_url('/lib/rainbowvis.js', dirname(__FILE__)));

				wp_enqueue_script('edit-attribute', plugins_url('/js/edit-attribute.js', dirname(__FILE__)),
								array('ractive', 'randomcolor', 'rainbow','iris', 'jquery-ui-button',
									'jquery-ui-dialog', 'underscore'));

					// Get list of all custom fields currently used by Records
				$cfs = ProspectAttribute::get_all_custom_field_names();
					// Get all current Attribute IDs except this one
				$att_ids = ProspectAttribute::get_all_attribute_ids($postID);

				wp_localize_script('edit-attribute', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'cfs' => $cfs,
					'att_ids' => $att_ids
				));
				break;
			case 'prsp-template':
				wp_enqueue_style('jquery-ui-min-style', plugins_url('/css/jquery-ui.min.css', dirname(__FILE__)));
				wp_enqueue_style('jquery-ui-theme-style', plugins_url('/css/jquery-ui.theme.min.css', dirname(__FILE__)));
				wp_enqueue_style('edit-template-style', plugins_url('/css/edit-template.css', dirname(__FILE__)),
								array('jquery-ui-min-style', 'jquery-ui-theme-style'));

					// Built-in modules
				wp_enqueue_script('jquery');
				wp_enqueue_script('underscore');
				wp_enqueue_script('jquery-ui-button');
				wp_enqueue_script('jquery-ui-dialog');

					// Prospect-specific
				wp_enqueue_script('ractive', plugins_url('/lib/ractive.min.js', dirname(__FILE__)));

				wp_enqueue_script('edit-template', plugins_url('/js/edit-template.js', dirname(__FILE__)),
								array('ractive', 'jquery-ui-button', 'jquery-ui-dialog', 'underscore'));

					// Get all definitions of all current Attributes
				$att_defs = ProspectAttribute::get_all_attributes(true, false, false, false);
					// Compile definition JSON strings into array
				$att_data = array();
				foreach($att_defs as $the_attribute) {
					$an_att = array();
					$an_att['id'] = $the_attribute->id;
					$an_att['def'] = $the_attribute->def;
					array_push($att_data, $an_att);
				}

					// Get all definitions of all other current Templates
				$tmp_defs = ProspectTemplate::get_all_template_defs($postID, true, false, false);
					// Compile into array
				$tmp_data = array();
				foreach($tmp_defs as $the_template) {
					$a_tmp = array();
					$a_tmp['id'] = $the_template->id;
					$a_tmp['def'] = $the_template->def;
					array_push($tmp_data, $a_tmp);
				}

				wp_localize_script('edit-template', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'atts' => $att_data,
					'templates' => $tmp_data
				));
				break;
			case 'prsp-record':
				wp_enqueue_style('jquery-ui-min-style', plugins_url('/css/jquery-ui.min.css', dirname(__FILE__)));
				wp_enqueue_style('jquery-ui-theme-style', plugins_url('/css/jquery-ui.theme.min.css', dirname(__FILE__)));
				wp_enqueue_style('edit-record-style', plugins_url('/css/edit-record.css', dirname(__FILE__)),
								array('jquery-ui-min-style', 'jquery-ui-theme-style'));

					// Built-in modules
				wp_enqueue_script('jquery');
				wp_enqueue_script('underscore');
				wp_enqueue_script('jquery-ui-button');
				wp_enqueue_script('jquery-ui-dialog');

					// Prospect-specific
				wp_enqueue_script('ractive', plugins_url('/lib/ractive.min.js', dirname(__FILE__)));

				wp_enqueue_script('edit-record', plugins_url('/js/edit-record.js', dirname(__FILE__)),
								array('ractive', 'jquery-ui-button', 'jquery-ui-dialog', 'underscore'));

				$att_defs = ProspectAttribute::get_all_attributes(true, true, true, true);
					// Compile definition JSON strings into array
				$att_data = array();
				foreach($att_defs as $the_attribute) {
					$an_att = array();
					$an_att['id'] = $the_attribute->id;
					$an_att['def'] = $the_attribute->def;
					$an_att['r'] = $the_attribute->range;
					$an_att['lgnd'] = $the_attribute->legend;
					array_push($att_data, $an_att);
				}

					// Get all definitions of all current Templates
				$tmp_defs = ProspectTemplate::get_all_template_defs(0, true, true, false);
					// Compile into array
				$tmp_data = array();
				foreach($tmp_defs as $the_template) {
					$a_tmp = array();
					$a_tmp['id'] = $the_template->id;
					$a_tmp['def'] = $the_template->def;
					$a_tmp['j'] = $the_template->joins;
					array_push($tmp_data, $a_tmp);
				}

				wp_localize_script('edit-record', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'attDefs' => $att_data,
					'templates' => $tmp_data
				));
				break;
			case 'prsp-exhibit':
				wp_enqueue_style('jquery-ui-min-style', plugins_url('/css/jquery-ui.min.css', dirname(__FILE__)));
				wp_enqueue_style('jquery-ui-theme-style', plugins_url('/css/jquery-ui.theme.min.css', dirname(__FILE__)));
				wp_enqueue_style('edit-exhibit-style', plugins_url('/css/edit-exhibit.css', dirname(__FILE__)),
								array('jquery-ui-min-style', 'jquery-ui-theme-style'));

					// Built-in modules
				wp_enqueue_script('jquery');
				wp_enqueue_script('underscore');
				wp_enqueue_script('jquery-ui-button');
				wp_enqueue_script('jquery-ui-dialog');
				wp_enqueue_script('jquery-ui-accordion');
				wp_enqueue_script('jquery-ui-tabs');
				wp_enqueue_script('iris');

					// Prospect-specific
				wp_enqueue_script('ractive', plugins_url('/lib/ractive.min.js', dirname(__FILE__)));

				wp_enqueue_script('p-map-hub', plugins_url('/js/map-hub.js', dirname(__FILE__)),
								array('jquery', 'underscore'));
				wp_enqueue_script('edit-exhibit', plugins_url('/js/edit-exhibit.js', dirname(__FILE__)),
								array('ractive', 'jquery-ui-button', 'jquery-ui-accordion', 'jquery-ui-tabs', 'underscore', 'p-map-hub'));

					// Get all definitions of all current Attributes
				$att_defs = ProspectAttribute::get_all_attributes(true, false, false, false);
					// Compile definition JSON strings into array
				$att_data = array();
				foreach($att_defs as $the_attribute) {
					$an_att = array();
					$an_att['id'] = $the_attribute->id;
					$an_att['p'] = $the_attribute->privacy;
					$an_att['def'] = $the_attribute->def;
					array_push($att_data, $an_att);
				}

					// Get all definitions of all current Templates
				$tmp_defs = ProspectTemplate::get_all_template_defs(0, true, true, false);
					// Compile into array
				$tmp_data = array();
				foreach($tmp_defs as $the_template) {
					$a_tmp = array();
					$a_tmp['id'] = $the_template->id;
					$a_tmp['def'] = $the_template->def;
					$a_tmp['joins'] = $the_template->joins;
					array_push($tmp_data, $a_tmp);
				}

				$map_defs = ProspectMap::get_map_layer_list();

				wp_localize_script('edit-exhibit', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'atts' => $att_data,
					'templates' => $tmp_data,
					'maps' => $map_defs
				));
				break;
			} // switch
		}
	} // add_admin_scripts()


		// PURPOSE: Open a UTF-8 file that will be written out to browser
		// INPUT: 	If $json, then MIME type will be text/plain, otherwise text/csv
		// NOTE: 	All Prospect archive export files are written in UTF-8 format, even though
		//				encoding as JSON will cause unicode encoding.
	public function createUTFOutput($filename, $json)
	{
			// Tells the browser to expect a json file and bring up the save dialog in the browser
		header('Pragma: public');
		header('Expires: 0');
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
		header('Cache-Control: private', false);

		if ($json)
			header('Content-Type: text/plain; charset=utf-8');
		else
			header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="'.$filename.'";');
		// header("Content-Transfer-Encoding: binary");

			// This opens up the output buffer as a "file"
		$fp = fopen('php://output', 'w');

			// Hack to write as UTF-8 format
		fwrite($fp, pack("CCC",0xef,0xbb,0xbf));
		return $fp;
	} // createUTFOutput()


		// PURPOSE: Write out data about Attribute $the_att to file $fp
	public function write_att_data($fp, $the_att)
	{
			// Create header to indicate Attribute record
		fwrite($fp, '{"type": "Attribute", "att-id": "'.$the_att->id.'", '."\n");
		fwrite($fp, '"att-privacy": "'.$the_att->privacy."\", \n");
		fwrite($fp, '"att-def": '.$the_att->meta_def.", \n");
		fwrite($fp, '"att-range": '.$the_att->meta_range.", \n");
		fwrite($fp, '"att-legend": '.$the_att->meta_legend."\n}");
	} // write_att_data()


		// PURPOSE: Export Attribute definition as a JSON file
	public function prsp_export_attribute()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Project Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_att = new ProspectAttribute(true, $postID, false, true, true, true, false);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_att->id.".json", true);

		$this->write_att_data($fp, $the_att);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_attribute()


		// PURPOSE: Export all Attribute definitions as a JSON Archive file
	public function prsp_export_all_attributes()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("allattributes.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Get all definitions of all current Attributes
		$att_defs = ProspectAttribute::get_all_attributes(false, true, true, true);
		$first = true;
		foreach($att_defs as $the_attribute) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_att_data($fp, $the_attribute);
		}
		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_attributes()


	public function write_template_data($fp, $the_template)
	{
			// Create header to indicate Template record
		fwrite($fp, '{"type": "Template", "tmplt-id": "'.$the_template->id.'", '."\n");
		fwrite($fp, '"tmplt-def": '.$the_template->meta_def.",\n");
		fwrite($fp, '"tmplt-joins": '.$the_template->meta_joins.",\n");
		fwrite($fp, '"tmplt-view": '.$the_template->meta_view." \n}");
	} // write_template_data()


		// PURPOSE: Export this Template definition as a JSON Archive file
	public function prsp_export_template()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Project Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_template = new ProspectTemplate(true, $postID, false, true, true);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_template->id.".json", true);

		$this->write_template_data($fp, $the_template);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_template()


		// PURPOSE: Export all Template definitions as a JSON Archive file
	public function prsp_export_all_ts()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("alltemplates.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Get all definitions of all current Templates
		$template_defs = ProspectTemplate::get_all_template_defs(0, false, true, true);
		$first = true;
		foreach($template_defs as $the_template) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_template_data($fp, $the_template);
		}
		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_ts()


		// PURPOSE: Export this Record definition as a CSV file
	public function prsp_export_record()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Project Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_record = new ProspectRecord(true, $postID, true, null, null, null);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_record->id.".csv", false);

			// List of attribute IDs/custom fields to write
		$rec_vals = array('csv_post_title', 'csv_post_type', 'record-id', 'tmplt-id');
		foreach ($the_record->att_data as $key => $value) {
			array_push($rec_vals, $key);
		}

			// Write out as first line of CSV file
		fputcsv($fp, $rec_vals);

			// Now create corresponding array of values
		$rec_vals = array();
		array_push($rec_vals, get_the_title($the_record->post_id));
		array_push($rec_vals, 'prsp-record');
		array_push($rec_vals, get_post_meta($the_record->post_id, 'record-id', true));
		array_push($rec_vals, get_post_meta($the_record->post_id, 'tmplt-id', true));
		foreach ($the_record->att_data as $key => $value) {
			array_push($rec_vals, $value);
		}

		fputcsv($fp, $rec_vals);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_record()


		// PURPOSE: Export a Template definition and all Attributes that belong to it as a JSON file
	public function prsp_export_template_and_atts($template_id)
	{
		$the_template = new ProspectTemplate(false, $template_id, true, true, true);

			// Create appropriate filename
		$fp = $this->createUTFOutput($template_id."-archive.json", true);

		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Fetch and write all Attribute definitions
		foreach ($the_template->def->a as $att_id) {
			$the_attribute = new ProspectAttribute(false, $att_id, false, true, true, true, false);
			if ($the_attribute) {
				$this->write_att_data($fp, $the_attribute);
				fwrite($fp, ",\n");
			}
		}
			// Finally the Template definition itself
		$this->write_template_data($fp, $the_template);

		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_template_and_atts()


		// PURPOSE: Export all Records that belong to a particular Template type as a CSV file
	public function prsp_export_all_template_records($template_id)
	{
		$the_template = new ProspectTemplate(false, $template_id, true, false, false);

			// Create appropriate filename
		$fp = $this->createUTFOutput($template_id."-records.csv", false);

			// List of attribute IDs/custom fields to write
		$firstLine = array_merge(array('csv_post_title', 'csv_post_type', 'record-id', 'tmplt-id'), $the_template->def->a);

			// Write out as first line of CSV file
		fputcsv($fp, $firstLine);

			// Create query to get all Records of this Template type
		$args = array('post_type' => 'prsp-record', 'meta_key' => 'tmplt-id',
						'meta_value' => $template_id, 'posts_per_page' => -1);
		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$rec_vals = array();
				array_push($rec_vals, $rec->post_title);
				array_push($rec_vals, 'prsp-record');
				array_push($rec_vals, get_post_meta($rec->ID, 'record-id', true));
				array_push($rec_vals, get_post_meta($rec->ID, 'tmplt-id', true));
				foreach ($the_template->def->a as $the_attribute) {
					$val = get_post_meta($rec->ID, $the_attribute, true);
					array_push($rec_vals, $val);
				}
				fputcsv($fp, $rec_vals);
			}
		}

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_template_records()


	public function write_exhibit_data($fp, $the_exhibit)
	{
			// Create header to indicate Exhibit record
		fwrite($fp, '{"type": "Exhibit", "xhbt-id": "'.$the_exhibit->id.'", '."\n");
		fwrite($fp, '"xhbt-gen": '.$the_exhibit->meta_gen.",\n");
		fwrite($fp, '"xhbt-views": '.$the_exhibit->meta_views.",\n");
		fwrite($fp, '"xhbt-inspect": '.$the_exhibit->meta_inspect."\n}");
	} // write_exhibit_data()


		// PURPOSE: Export this Exhibit definition as a JSON Archive file
	public function prsp_export_exhibit()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Project Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_exhibit = new ProspectExhibit(true, $postID, false);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_exhibit->id.".json", true);

		$this->write_exhibit_data($fp, $the_exhibit);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_exhibit()


		// PURPOSE: Export all Exhibit definitions as a JSON Archive file
	public function prsp_export_all_exhibits()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("allexhibits.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Get all definitions of all current Exhibits
		$exhibit_defs = ProspectExhibit::get_all_exhibit_defs(false);
		$first = true;
		foreach($exhibit_defs as $the_exhibit) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_exhibit_data($fp, $the_exhibit);
		}
		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_exhibits()


	public function write_map_data($fp, $the_map)
	{
			// Create header to indicate Exhibit record
		fwrite($fp, '{"type": "Map", "map-id": "'.$the_map->id.'", '."\n");
		fwrite($fp, '"map_sname": "'.$the_map->meta_data['sname']."\",\n");
		fwrite($fp, '"map_url": "'.$the_map->meta_data['url']."\",\n");
		fwrite($fp, '"map_inverse_y": "'.$the_map->meta_data['inverseY']."\",\n");
		fwrite($fp, '"map_subdomains": "'.$the_map->meta_data['subd']."\",\n");
		fwrite($fp, '"map_min_zoom": '.$the_map->meta_data['minZoom'].",\n");
		fwrite($fp, '"map_max_zoom": '.$the_map->meta_data['maxZoom'].",\n");
		fwrite($fp, '"map_credits": "'.$the_map->meta_data['credits']."\",\n");
		fwrite($fp, '"map_n_bounds": '.$the_map->meta_data['nBounds'].",\n");
		fwrite($fp, '"map_s_bounds": '.$the_map->meta_data['sBounds'].",\n");
		fwrite($fp, '"map_e_bounds": '.$the_map->meta_data['eBounds'].",\n");
		fwrite($fp, '"map_w_bounds": '.$the_map->meta_data['wBounds']."\n}");
	} // write_map_data()


		// PURPOSE: Export this Map definition as a JSON Archive file
	public function prsp_export_map()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Map Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_map = new ProspectMap(true, $postID);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_map->id.".json", true);

		$this->write_map_data($fp, $the_map);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_map()


		// PURPOSE: Export all Map definitions as a JSON Archive file
	public function prsp_export_all_maps()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("allmaps.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Get all definitions of all current Exhibits
		$all_maps = ProspectMap::get_all_maps();
		$first = true;
		foreach($all_maps as $the_map) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_map_data($fp, $the_map);
		}
		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_maps()


	public function write_prspctv_data($fp, $the_prspctv)
	{
			// Create header to indicate Exhibit record
		fwrite($fp, '{"type": "Perspective", "prspctv-id": "'.$the_prspctv->id.'", '."\n");
		fwrite($fp, '"prspctv-l": "'.$the_prspctv->l."\",\n");
		fwrite($fp, '"xhbt-id": "'.$the_prspctv->xhbt_id."\",\n");
		fwrite($fp, '"prspctv-note": "'.$the_prspctv->note."\",\n");
		fwrite($fp, '"prspctv-state": '.$the_prspctv->meta_state."\n}");
	} // write_prspctv_data()


		// PURPOSE: Export this Map definition as a JSON Archive file
	public function prsp_export_prspctv()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		if (!(isset($_GET['post']) || isset( $_POST['post']) || (isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action']))) {
			wp_die('No post to export has been supplied!');
		}

			// Get post ID and associated Map Data
		$postID = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
		$the_prspctv = new ProspectPerspective(true, $postID, false);

			// Create appropriate filename
		$fp = $this->createUTFOutput($the_prspctv->id.".json", true);

		$this->write_prspctv_data($fp, $the_prspctv);

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_prspctv()


	public function prsp_export_xhbt_prspctvs($xhbt)
	{
		$prspctvs = ProspectPerspective::get_exhibit_perspectives($xhbt);

			// Create appropriate filename
		$fp = $this->createUTFOutput($xhbt."-archive.json", true);

		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Fetch and write all Perspective definitions
		$first = true;
		foreach ($prspctvs as $the_prspctv) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_prspctv_data($fp, $the_prspctv);
		}

		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_xhbt_prspctvs()


		// PURPOSE: Export all Perspective definitions as a JSON Archive file
	public function prsp_export_all_prspctvs()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

		$all_prspctvs = array();

			// Loop through all Perspectives adding to array
		$args = array('post_type' => 'prsp-prspctv', 'posts_per_page' => 1);
		$loop = new WP_Query($args);
		if ($loop->have_posts()) {
			foreach ($loop->posts as $prspctv) {
				$new_prspctv = new ProspectPerspective(true, $prspctv->ID, false);
					// Ensure minimal data provided
				if ($new_prspctv->id != null && $new_prspctv->id != '') {
					array_push($all_prspctvs, $new_prspctv);
				}
			}
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("allperspectives.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

		$first = true;
		foreach($all_prspctvs as $the_prspctv) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_prspctv_data($fp, $the_prspctv);
		}
		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all_prspctvs()


		// PURPOSE: Export all Attribute, Template and Exhibit definitions as a JSON Archive file
	public function prsp_export_all()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create appropriate filename
		$fp = $this->createUTFOutput("totalbackup.json", true);

			// Create archive header
		fwrite($fp, '{"type": "Archive", "items": ['."\n");

		$first = true;

			// Get all definitions of all current Attributes
		$att_defs = ProspectAttribute::get_all_attributes(false, true, true, true);
		foreach($att_defs as $the_attribute) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_att_data($fp, $the_attribute);
		}

			// Get all definitions of all current Templates
		$template_defs = ProspectTemplate::get_all_template_defs(0, false, true, true);
		foreach($template_defs as $the_template) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_template_data($fp, $the_template);
		}

			// Get all definitions of all current Exhibits
		$exhibit_defs = ProspectExhibit::get_all_exhibit_defs(false);
		foreach($exhibit_defs as $the_exhibit) {
			if (!$first)
				fwrite($fp, ",\n");
			$first = false;
			$this->write_exhibit_data($fp, $the_exhibit);
		}

		fwrite($fp, "\n]}");

			// Close the output buffer
		fclose($fp);
		exit();
	} // prsp_export_all()


		// PURPOSE: Create Export link for specific posts
	public function prsp_export_post($actions, $post)
	{
			// Ignore if user doesn't have minimal permissions
		if (!current_user_can('edit_posts'))
			return $actions;

		switch ($post->post_type) {
		case 'prsp-attribute':
			$actions['Prsp_Att_Export'] = '<a href="admin.php?action=prsp_export_attribute&amp;post='.$post->ID.'" title="Export this Attribute as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-template':
			$actions['Prsp_Temp_Export'] = '<a href="admin.php?action=prsp_export_template&amp;post='.$post->ID.'" title="Export this Template as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-record':
			$actions['Prsp_Rec_Export'] = '<a href="admin.php?action=prsp_export_record&amp;post='.$post->ID.'" title="Export this Record as CSV file" rel="permalink">CSV Export</a>';
			break;
		case 'prsp-exhibit':
			$actions['Prsp_Exh_Export'] = '<a href="admin.php?action=prsp_export_exhibit&amp;post='.$post->ID.'" title="Export this Exhibit as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-map':
			$actions['Prsp_Map_Export'] = '<a href="admin.php?action=prsp_export_map&amp;post='.$post->ID.'" title="Export this Map as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-prspctv':
			$actions['Prsp_Prspctv_Export'] = '<a href="admin.php?action=prsp_export_prspctv&amp;post='.$post->ID.'" title="Export this Perspective as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		}
		return $actions;
	} // prsp_export_post()


		// PURPOSE: Ensure data entity exists; create if non-existing
		// RETURNS: 0 if already exists; post ID number if new
	public function create_entity($type, $id_field, $id, $title)
	{
			// Create query to get all Records of this Template type
		$args = array('post_type' => $type, 'meta_key' => $id_field, 'meta_value' => $id, 'posts_per_page' => 1);
		$query = new WP_Query($args);
		if ($query->have_posts())
			return 0;

		$post_id = wp_insert_post(
			array(
				'post_name'   => $id,
				'post_title'  => $title,
				'post_status' => 'publish',
				'post_type'   => $type
			)
		);
		if ($post_id)
			update_post_meta($post_id, $id_field, $id);
		return $post_id;
	} // create_entity()


		// PURPOSE: Create data entity for $data as CPT if it doesn't already exist
	public function parse_import_object($data)
	{
		switch ($data['type']) {
		case 'Attribute':
			$post_id = $this->create_entity('prsp-attribute', 'att-id', $data['att-id'], $data['att-def']['l']);
			if ($post_id) {
				update_post_meta($post_id, 'att-privacy', $data['att-privacy']);
				update_post_meta($post_id, 'att-def', json_encode($data['att-def'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'att-range', json_encode($data['att-range'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'att-legend', json_encode($data['att-legend'], JSON_UNESCAPED_UNICODE));
			}
			break;
		case 'Template':
			$post_id = $this->create_entity('prsp-template', 'tmplt-id', $data['tmplt-id'], $data['tmplt-def']['l']);
			if ($post_id) {
				update_post_meta($post_id, 'tmplt-def', json_encode($data['tmplt-def'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'tmplt-joins', json_encode($data['tmplt-joins'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'tmplt-view', json_encode($data['tmplt-view'], JSON_UNESCAPED_UNICODE));
			}
			break;
		case 'Exhibit':
			$post_id = $this->create_entity('prsp-exhibit', 'xhbt-id', $data['xhbt-id'], $data['xhbt-gen']['l']);
			if ($post_id) {
				update_post_meta($post_id, 'xhbt-gen', json_encode($data['xhbt-gen'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'xhbt-views', json_encode($data['xhbt-views'], JSON_UNESCAPED_UNICODE));
				update_post_meta($post_id, 'xhbt-inspect', json_encode($data['xhbt-inspect'], JSON_UNESCAPED_UNICODE));
			}
			break;
		case 'Map':
			$post_id = $this->create_entity('prsp-map', 'map-id', $data['map-id'], $data['map_sname']);
			if ($post_id) {
				update_post_meta($post_id, 'map_sname', $data['map_sname']);
				update_post_meta($post_id, 'map_url', $data['map_url']);
				update_post_meta($post_id, 'map_inverse_y', $data['map_inverse_y']);
				update_post_meta($post_id, 'map_subdomains', $data['map_subdomains']);
				update_post_meta($post_id, 'map_min_zoom', $data['map_min_zoom']);
				update_post_meta($post_id, 'map_max_zoom', $data['map_max_zoom']);
				update_post_meta($post_id, 'map_credits', $data['map_credits']);
				update_post_meta($post_id, 'map_n_bounds', $data['map_n_bounds']);
				update_post_meta($post_id, 'map_s_bounds', $data['map_s_bounds']);
				update_post_meta($post_id, 'map_e_bounds', $data['map_e_bounds']);
				update_post_meta($post_id, 'map_w_bounds', $data['map_w_bounds']);
			}
			break;
		case 'Perspective':
			$post_id = $this->create_entity('prsp-prspctv', 'prspctv-id', $data['prspctv-id'], $data['prspctv-l']);
			if ($post_id) {
				update_post_meta($post_id, 'prspctv-l', $data['prspctv-l']);
				update_post_meta($post_id, 'xhbt-id', $data['xhbt-id']);
				update_post_meta($post_id, 'prspctv-note', $data['prspctv-note']);
				update_post_meta($post_id, 'prspctv-state', json_encode($data['prspctv-state'], JSON_UNESCAPED_UNICODE));
			}
			break;
		} // switch
	} // parse_import_object()


		// PURPOSE: Import the selected file
		// ASSUMES: File info in the $_FILES['archive-import-select'] array
		// NOTES:   $_FILES[] contents: 'name', 'type' [mimetype], 'size', 'error', 'tmp_name'
		//				Use 'tmp_name' for opening file
		//			Assume file in UTF-8 format; we want to keep encoding as UTF-8!
	public function import_archive_file()
	{
		$fname = $_FILES['archive-import-select']['tmp_name'];
		$res = fopen($fname, 'r');

			// Return if file not found or empty file
		if ($res == false || $_FILES['archive-import-select']['size'] == 0)
			return;
		fclose($res);

		$contents = file_get_contents($fname);
		if ($contents === false) {
			trigger_error('Failed to get file contents.', E_USER_WARNING);
		}

			// The following section successfully reads files without any UTF-8-encoded
			//	characters, but fails to interpret special characters properly
			// Skip any UTF-8 header
		$header = substr($contents, 0, 3);
		if ($header == pack('CCC', 0xef, 0xbb, 0xbf))
			$contents = substr($contents, 3);

			// Parse as JSON Object
		$data = json_decode($contents, true);

			// Each Object begins with "type" property with values
			//		Archive, Attribute, Template, Exhibit, Perspective or Map
		if ($data['type'] == 'Archive') {
			foreach ($data['items'] as $datum) {
				$this->parse_import_object($datum);
			}
		} else
			$this->parse_import_object($data);
	} // import_archive_file()


		// NOTES: 	Must check POST vars at 'admin_init' as it creates file in output buffer
		// 			Check to see if POST with parameters sent to program that were generated
		//				from form on show_prsp_archive_page()
	public function do_prsp_init()
	{
			// Check to see if we've been sent here by a form operation
		if ($_SERVER['REQUEST_METHOD'] == 'POST') {
			if (isset($_POST['export_t_atts'])) {
				$this->prsp_export_template_and_atts($_POST['export-type']);
			} else if (isset($_POST['export_t_recs'])) {
				$this->prsp_export_all_template_records($_POST['export-type']);
			} else if (isset($_POST['export_xhbt_prspctvs'])) {
				$this->prsp_export_xhbt_prspctvs($_POST['export-type']);
			} else if (isset($_POST['import_submit'])) {
				$this->import_archive_file();
			}
		}

			// To save options in DB
		register_setting(
			'prsp_option_group', // Option group
			'prsp_base_options', // Option name
			array($this, 'sanitize_options') // Sanitize
		);

			// To show settings on Options page
		add_settings_section(
			'prsp_settings', // ID
			'Prospect Customization Settings', // Title
			array($this, 'prsp_settings_info'), // Callback
			'prsp-settings-page' // Page
		);

		add_settings_field(
			'prsp_chunks', // ID
			'Number of Records per AJAX request', // Title
			array($this, 'prsp_chunks_callback'), // Callback
			'prsp-settings-page', // Page
			'prsp_settings' // Section
		);

		add_settings_field(
			'prsp_lang',
			'Language to use',
			array($this, 'prsp_lang_callback'),
			'prsp-settings-page',
			'prsp_settings'
		);

		add_settings_field(
			'prsp_cb_color',
			'Command Bar Background Color',
			array($this, 'prsp_cb_color_callback'),
			'prsp-settings-page',
			'prsp_settings'
		);

		add_settings_field(
			'prsp_fs_color',
			'Filter Stack Background Color',
			array($this, 'prsp_fs_color_callback'),
			'prsp-settings-page',
			'prsp_settings'
		);

		add_settings_field(
			'prsp_sf_color',
			'Selection Filter Background Color',
			array($this, 'prsp_sf_color_callback'),
			'prsp-settings-page',
			'prsp_settings'
		);

		add_settings_field(
			'prsp_vf_color',
			'View Frame Background Color',
			array($this, 'prsp_vf_color_callback'),
			'prsp-settings-page',
			'prsp_settings'
		);
	} // do_prsp_init()


		// PURPOSE: Code to create Archive page
		// NOTE: 	Page also invoked after form submit done to process request
	public function show_prsp_archive_page()
	{
			// Get first bit of static text
		$archivepage = self::get_script_text('archive-page-1.txt');
		echo $archivepage;

			// Generate drop-down list of Template names for archiving Templates w/Attributes
		$temp_ids = ProspectTemplate::get_all_template_ids(0);
		foreach ($temp_ids as $tid) {
			echo '<option value="'.$tid.'">'.$tid.'</option>';
		}

		$archivepage = self::get_script_text('archive-page-2.txt');
		echo $archivepage;

			// Repeat Template names for command to archive all Records of a given Template type
		foreach ($temp_ids as $tid) {
			echo '<option value="'.$tid.'">'.$tid.'</option>';
		}

		$archivepage = self::get_script_text('archive-page-3.txt');
		echo $archivepage;

		$all_exhibits = ProspectExhibit::get_all_exhibit_defs(true);
		foreach ($all_exhibits as $xhbt) {
			echo '<option value="'.$xhbt->id.'">'.$xhbt->gen->l.'</option>';
		}

		$archivepage = self::get_script_text('archive-page-4.txt');
		echo $archivepage;
	} // show_prsp_archive_page()


		// PURPOSE: Sanitize each options field as needed
		// INPUT:   $input = all settings fields as array keys
	public function sanitize_options($input)
	{
		$new_input = array();

		if (isset($input['prsp_chunks']))
			$new_input['prsp_chunks'] = sanitize_text_field($input['prsp_chunks']);
		if (isset($input['prsp_lang']))
			$new_input['prsp_lang'] = sanitize_text_field($input['prsp_lang']);
		if (isset($input['prsp_cb_color']))
			$new_input['prsp_cb_color'] = sanitize_text_field($input['prsp_cb_color']);
		if (isset($input['prsp_fs_color']))
			$new_input['prsp_fs_color'] = sanitize_text_field($input['prsp_fs_color']);
		if (isset($input['prsp_sf_color']))
			$new_input['prsp_sf_color'] = sanitize_text_field($input['prsp_sf_color']);
		if (isset($input['prsp_vf_color']))
			$new_input['prsp_vf_color'] = sanitize_text_field($input['prsp_vf_color']);

		return $new_input;
	} // sanitize_options()


		// PURPOSE: Print the Section text
	public function prsp_settings_info()
	{
		echo '<p>Customize Prospect on this website with these settings</p>';
	}

		// PURPOSE: Get the settings option array and print one of its values
	public function prsp_chunks_callback()
	{
		printf(
			'<input type="number" id="prsp_chunks" name="prsp_base_options[prsp_chunks]" value="%s" />',
			isset($this->options['prsp_chunks']) ? esc_attr($this->options['prsp_chunks']) : 1000
		);
	} // prsp_chunks_callback()

		// PURPOSE: Get the settings option array and print one of its values
	public function prsp_lang_callback()
	{
		$dirs = array();
		$scriptpath = plugin_dir_path(__FILE__).'scripts/';
		$dirIt = new DirectoryIterator($scriptpath);
		foreach ($dirIt as $fileinfo) {
			if ($fileinfo->isDir() && !$fileinfo->isDot()) {
				array_push($dirs, $fileinfo->getFilename());
			}
		}

		$current = isset($this->options['prsp_lang']) ? esc_attr($this->options['prsp_lang']) : 'english-us';

		$html = '<select id="prsp_lang" name="prsp_base_options[prsp_lang]">';
 
		foreach ($dirs as $this_dir)
		{
			$html .= '<option value="'.$this_dir.'"';
	 
			if ($this_dir == $this->options['prsp_lang'])
				$html .= ' selected="selected"';
	 
			$html .= '>'. $this_dir .'</option>';
		}
		$html .= '</select>';
 
		echo($html);
	} // prsp_lang_callback()

		// PURPOSE: Get the Command Bar color option and print its value
	public function prsp_cb_color_callback()
	{
		printf(
			'<input type="text" size="12" id="prsp_cb_color" name="prsp_base_options[prsp_cb_color]" value="%s" />',
			isset($this->options['prsp_cb_color']) ? esc_attr($this->options['prsp_cb_color']) : ''
		);
	} // prsp_cb_color_callback()

		// PURPOSE: Get the Filter Stack color option and print its value
	public function prsp_fs_color_callback()
	{
		printf(
			'<input type="text" size="12" id="prsp_fs_color" name="prsp_base_options[prsp_fs_color]" value="%s" />',
			isset($this->options['prsp_fs_color']) ? esc_attr($this->options['prsp_fs_color']) : ''
		);
	} // prsp_fs_color_callback()

		// PURPOSE: Get the Selection Filter color option and print its value
	public function prsp_sf_color_callback()
	{
		printf(
			'<input type="text" size="12" id="prsp_sf_color" name="prsp_base_options[prsp_sf_color]" value="%s" />',
			isset($this->options['prsp_sf_color']) ? esc_attr($this->options['prsp_sf_color']) : ''
		);
	} // prsp_sf_color_callback()

		// PURPOSE: Get the View Frame color option and print its value
	public function prsp_vf_color_callback()
	{
		printf(
			'<input type="text" size="12" id="prsp_vf_color" name="prsp_base_options[prsp_vf_color]" value="%s" />',
			isset($this->options['prsp_vf_color']) ? esc_attr($this->options['prsp_vf_color']) : ''
		);
	} // prsp_vf_color_callback()


		// PURPOSE: Code to create Settings page
	public function show_prsp_settings_page()
	{
		// Set class property
		$this->options = get_option('prsp_base_options');
		?>
		<div class="wrap">
			<h2>Prospect Settings</h2>
			<form method="post" action="options.php">
			<?php
				// This prints out all hidden setting fields
				settings_fields('prsp_option_group');
				do_settings_sections('prsp-settings-page');
				submit_button();
			?>
			</form>
		</div>
		<?php
	} // show_prsp_settings_page()


		// PURPOSE: Register archive menu and hook to page creation function
	public function add_prsp_menus()
	{
		add_submenu_page('prsp-top-level-handle', 'Archive', 'Archive', 'manage_options', 'prsp-archive-menu', 
			array($this, 'show_prsp_archive_page'));
		add_submenu_page('prsp-top-level-handle', 'Settings', 'Settings', 'manage_options', 'prsp-settings-page',
			array($this, 'show_prsp_settings_page'));
	} // add_prsp_menus()


	// AJAX CALLS
	//===========

		// PURPOSE: Return array of record-ids of Records of a particular Template type
		// INPUT:	$_POST['tmplt_id'] = ID of Template whose IDs should be returned
	public function prsp_get_rec_ids()
	{
		$tmplt_id = $_POST['tmplt_id'];
		$result = array();

			// Get matching Records
		$args = array('post_type' => 'prsp-record', 'meta_key' => 'tmplt-id',
						'meta_value' => $tmplt_id, 'posts_per_page' => -1);
		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$rec_id = get_post_meta($rec->ID, 'record-id', true);
				if ($rec_id && $rec_id != '')
					array_push($result, $rec_id);
			}
		}
		sort($result);
		die(json_encode($result));
	} // prsp_get_rec_ids()


		// PURPOSE: Get data about these Records
		// INPUT:   $_POST['tmplt_id'] = ID of Template whose Records should be returned
		//			$_POST['from'] = index of first Record to get
		//			$_POST['to'] = index of last Record to get
		// ASSUMES: Records are sorted in ascending order of ID
		// TO DO: 	Resolve Legend values?
	public function prsp_get_records()
	{
		$tmplt_id = $_POST['tmplt_id'];
		$from = (int)$_POST['from'];
		$count = (int)$_POST['count'];

		$result = array();

			// Load Template definition
		$the_template = new ProspectTemplate(false, $tmplt_id, true, true, false);

			// Get dependent Templates needed for Joins
		$d_templates = $the_template->get_dependent_templates(false);

			// Get associative array for all Attribute definitions
		$assoc_atts = ProspectAttribute::get_assoc_defs();

			// Get Records -- Need to order by Record ID, etc
		$args = array('post_type' => 'prsp-record',
						'post_status' => 'publish',
						'meta_key' => 'record-id',
						'orderby' => 'meta_value',
						'order' => 'ASC',
						'offset' => $from,
						'posts_per_page' => $count,
						'meta_query' =>
							array('key' => 'tmplt-id',
								'value' => $tmplt_id,
								'compare' => '=')
					);

		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$the_rec = new ProspectRecord(true, $rec->ID, false, $the_template, $d_templates, $assoc_atts);
					// Extract the necessary data in proper format
				$extracted_rec = array();
				$extracted_rec['id'] = $the_rec->id;
				$extracted_rec['wp'] = $the_rec->post_id;
				$extracted_rec['l']  = $the_rec->label;
				$extracted_rec['a']  = $the_rec->att_data;
				array_push($result, $extracted_rec);
			}
		}
		die(json_encode($result, JSON_UNESCAPED_UNICODE));
	} // prsp_get_records()


		// PURPOSE: Return array of record-ids of Records of a particular Template type
		// INPUT:	$_POST['att_id'] = ID of Attribute whose values need to be fetched
	public function prsp_get_cf_vals()
	{
		$att_id = $_POST['att_id'];
		$d_char = $_POST['delim'];
		$result = array();

			// Get matching Records
		$args = array('post_type' => 'prsp-record', 'posts_per_page' => -1);
		$query = new WP_Query($args);
		if ($query->have_posts()) {
			foreach ($query->posts as $rec) {
				$data = get_post_meta($rec->ID, $att_id, true);
				if ($data && $data != '') {
					if ($d_char && $d_char != '' && $d_char != ' ') {
						$vals = explode($d_char, $data);
						foreach ($vals as $one_value) {
							$trimmed = trim($one_value);
							ProspectAttribute::sorted_insert($trimmed, $result);
						}
					} else {
						$trimmed = trim($data);
						ProspectAttribute::sorted_insert($trimmed, $result);
					}
				} // if data
			}
		}
		die(json_encode($result));
	} // prsp_get_cf_vals()


		// PURPOSE: Save Perspective data
		// INPUT:	$_POST['id'] = ID of Perspective
		//			$_POST['l'] = Label
		//			$_POST['x'] = ID of Exhibit
		//			$_POST['n'] = Note
		//			$_POST['s'] = Perspective data to save { f: [], s, v0, v1 } }
	public function prsp_save_prspctv()
	{
			// ensure that this URL has not been faked by non-admin user
		if (!current_user_can('edit_posts')) {
			wp_die('Invalid request');
		}

			// Create new Perspective Record
		$post_data = array(
			'post_type'		=> 'prsp-prspctv',
			'post_status'	=> 'draft',
			'post_content'	=> 'No content',
			'post_title'	=> wp_strip_all_tags($_POST['l'])
		);
		$post_id = wp_insert_post($post_data);
		if (!is_wp_error($post_id)) {
			add_post_meta($post_id, 'prspctv-id', $_POST['id'], true);
			add_post_meta($post_id, 'prspctv-l', $_POST['l'], true);
			add_post_meta($post_id, 'xhbt-id', $_POST['x'], true);
			add_post_meta($post_id, 'prspctv-note', $_POST['n'], true);
			add_post_meta($post_id, 'prspctv-state', $_POST['s'], true);
		}

		die($post_id);
	} // prsp_save_prspctv()


	// NEW OBJECT CONSTRUCTOR
	// ======================

	public function __construct($version)
	{
		$this->version = $version;
	} // __construct()

} // class ProspectAdmin
?>