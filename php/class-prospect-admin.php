<?php

// PURPOSE: Code that handles Dashboard backend functionality
//				and all interface between WordPress and JS

// TO DO: 	

class ProspectAdmin {
		// CLASS METHODS
		// =============

		// PURPOSE: "clean" extraneous data from string passed via internet
	static private function clean_string($orig_string)
	{
		$new_string = $orig_string;
		for ($i = 0; $i <= 31; ++$i) { 
			$new_string = str_replace(chr($i), "", $new_string);
		}
		$new_string = str_replace(chr(127), "", $new_string);

		if (0 === strpos(bin2hex($new_string), 'efbbbf')) {
			$new_string = substr($new_string, 3);
		}

		$new_string = preg_replace("/\p{Cc}*$/u", "", $new_string);

		$new_string = rtrim($new_string, "\0");

		$new_string = preg_replace('/,\s*([\]}])/m', '$1', $new_string);

			// This seems to be the crucial process
		$new_string = stripslashes(str_replace('\"', '"', $new_string));

		return $new_string;
	} // clean_string()


		// PURPOSE: Called to retrieve file content to insert HTML fragments into a particular page
		// INPUT:   $scriptname = base name of HTML file (not pathname)
		// RETURNS: Contents of file as string
	static private function get_script_text($scriptname)
	{
		$scriptpath = plugin_dir_path(__FILE__).'scripts/'.$scriptname;
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


	static private function get_all_PNGs()
	{
		$pngs = array();

		$media_query = new WP_Query(
			array(
				'post_type' => 'attachment',
				'post_mime_type' =>'image/png',
				'post_status' => 'inherit',
				'posts_per_page' => -1,
			)
		);
		foreach ($media_query->posts as $post) {
			$onePNG = array();
			$onePNG['id'] = $post->ID;
			$onePNG['title'] = $post->post_title;
			$imageData = wp_get_attachment_image_src($post->ID);
			$onePNG['url'] = $imageData[0];
			$onePNG['w'] = $imageData[1];
			$onePNG['h'] = $imageData[2];
			array_push($pngs, $onePNG);
		}

		return $pngs;
	} // get_attached_PNGs()


		// INSTANCE VARIABLES AND METHODS
		// ==============================
	private $version;
	private $options;


		// PURPOSE: Ensure that txt and png files are able to be added to the Media Library
	public function add_mime_types($mime_types)
	{
		$mime_types['txt'] = 'text/plain';
		$mime_types['csv'] = 'text/csv';

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
		$theAtt = new ProspectAttribute(true, $postID, false, true, true, true);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_att_id" value="'.$theAtt->id.'"/>';
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
		$the_tmp = new ProspectTemplate(true, $postID, false, true);

			// Special hidden fields for custom fields coordinated by JavaScript code
		echo '<input type="hidden" name="prsp_tmp_id" value="'.$the_tmp->id.'"/>';
		echo '<textarea name="prsp_tmp_def" form="post" spellcheck="false" style="display:none">'.$the_tmp->meta_def.'</textarea>';
		echo '<textarea name="prsp_tmp_joins" form="post" spellcheck="false" style="display:none">'.$the_tmp->meta_joins.'</textarea>';

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
		echo '<textarea name="prsp_rec_atts" form="post" spellcheck="false" style="display:none">'.json_encode($the_rec->att_data).'</textarea>';

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
		echo '<textarea name="prsp_xhbt_widgets" form="post" spellcheck="false" style="display:none">'.$the_exhibit->meta_widgets.'</textarea>';
		echo '<textarea name="prsp_xhbt_pages" form="post" spellcheck="false" style="display:none">'.$the_exhibit->meta_pages.'</textarea>';

		echo '<div id="ractive-output"></div>';

			// Insert Edit Panel's HTML
		$dashboardscript = self::get_script_text('edit-exhibit.txt');
		echo $dashboardscript;
	} // show_prsp_exhibit_admin_edit()


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
			break;
		case 'prsp-record':
				// Verify the nonce is valid
			if (!wp_verify_nonce($nonce, 'prsp_save_record'.$post_id))
				return $post_id;

				// Update each value
			if (isset($_POST['prsp_rec_id'])) {
				$rec_id = $_POST['prsp_rec_id'];
				update_post_meta($post_id, 'record-id', $rec_id);
			}
			if (isset($_POST['prsp_tmplt_id'])) {
				$tmp_id = $_POST['prsp_tmplt_id'];
				update_post_meta($post_id, 'tmplt-id', $tmp_id);
			}
				// TO DO: Remove all other post_meta (in case Template type changed)? How?
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
			if (isset($_POST['prsp_xhbt_widgets'])) {
				$xhbt_widgets = $_POST['prsp_xhbt_widgets'];
				update_post_meta($post_id, 'xhbt-widgets', $xhbt_widgets);
			}
			if (isset($_POST['prsp_xhbt_pages'])) {
				$xhbt_pages = $_POST['prsp_xhbt_pages'];
				update_post_meta($post_id, 'xhbt-pages', $xhbt_pages);
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

				wp_enqueue_script('edit-attribute', plugins_url('/js/edit-attribute.js', dirname(__FILE__)),
								array('ractive', 'iris', 'jquery-ui-button', 'jquery-ui-dialog', 'underscore'));

					// Get list of all custom fields currently used by Records
				$cfs = ProspectAttribute::get_all_custom_field_names();
					// Get all current Attribute IDs except this one
				$att_ids = ProspectAttribute::get_all_attribute_ids($postID);
					// Get all PNGs in Media Library
				$pngs = self::get_all_PNGs();

				wp_localize_script('edit-attribute', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'cfs' => $cfs,
					'att_ids' => $att_ids,
					'pngs' => $pngs
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
				$tmp_defs = ProspectTemplate::get_all_template_defs($postID, true, false);
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
				$tmp_defs = ProspectTemplate::get_all_template_defs(0, true, true);
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

					// Prospect-specific
				wp_enqueue_script('ractive', plugins_url('/lib/ractive.min.js', dirname(__FILE__)));

				wp_enqueue_script('edit-exhibit', plugins_url('/js/edit-exhibit.js', dirname(__FILE__)),
								array('ractive', 'jquery-ui-button', 'jquery-ui-accordion', 'jquery-ui-tabs', 'underscore'));

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

					// Get all definitions of all current Templates
				$tmp_defs = ProspectTemplate::get_all_template_defs(0, true, true);
					// Compile into array
				$tmp_data = array();
				foreach($tmp_defs as $the_template) {
					$a_tmp = array();
					$a_tmp['id'] = $the_template->id;
					$a_tmp['def'] = $the_template->def;
					$a_tmp['joins'] = $the_template->joins;
					array_push($tmp_data, $a_tmp);
				}

				wp_localize_script('edit-exhibit', 'prspdata', array(
					'ajax_url' => $dev_url,
					'post_id' => $postID,
					'atts' => $att_data,
					'templates' => $tmp_data
				));
				break;
			} // switch
		}
	} // add_admin_scripts()


		// PURPOSE: Open a UTF-8 file that will be written out to browser
		// INPUT: 	If $json, then MIME type will be application/json, otherwise text/csv
	public function createUTFOutput($filename, $json)
	{
			// Tells the browser to expect a json file and bring up the save dialog in the browser
		header('Pragma: public');
		header('Expires: 0');
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
		header('Cache-Control: private', false);

		if ($json)
			header('Content-Type: text/plain; charset=utf-8');
			// header('Content-Type: application/json; charset=utf-8');
		else
			header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="'.$filename.'";');
		header("Content-Transfer-Encoding: binary");
		// header('Content-Description: File Transfer');

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
		$the_att = new ProspectAttribute(true, $postID, false, true, true, true);

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
		fwrite($fp, '"tmplt-joins": '.$the_template->meta_joins."\n}");
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
		$the_template = new ProspectTemplate(true, $postID, false, true);

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
		$template_defs = ProspectTemplate::get_all_template_defs(0, false, true);
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
		$rec_vals = array('csv_post_title', 'csv_post_type');
		foreach ($the_record->att_data as $key => $value) {
			array_push($rec_vals, $key);
		}

			// Write out as first line of CSV file
		fputcsv($fp, $rec_vals);

			// Now create corresponding array of values
		$rec_vals = array();
		array_push($rec_vals, get_the_title($the_record->post_id));
		array_push($rec_vals, 'prsp-record');
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
		$the_template = new ProspectTemplate(false, $template_id, true, true);

			// Create appropriate filename
		$fp = $this->createUTFOutput($template_id."-archive.json", true);

		fwrite($fp, '{"type": "Archive", "items": ['."\n");

			// Fetch and write all Attribute definitions
		foreach ($the_template->def->a as $att_id) {
			$the_attribute = new ProspectAttribute(false, $att_id, false, true, true, true);
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
		$the_template = new ProspectTemplate(false, $template_id, true, false);

			// Create appropriate filename
		$fp = $this->createUTFOutput($template_id."-records.csv", false);

			// List of attribute IDs/custom fields to write
		$firstLine = array_merge(array('csv_post_title', 'csv_post_type'), $the_template->def->a);

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
		fwrite($fp, '"xhbt-widgets": '.$the_exhibit->meta_widgets.",\n");
		fwrite($fp, '"xhbt-pages": '.$the_exhibit->meta_pages."\n}");
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

			// Get all definitions of all current Attributes
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


		// PURPOSE: Create Export link for specific posts
	public function prsp_export_post($actions, $post)
	{
			// Ignore if user doesn't have minimal permissions
		if (!current_user_can('edit_posts'))
			return $actions;

		switch ($post->post_type) {
		case 'prsp-attribute':
			$actions['Prsp_A_Export'] = '<a href="admin.php?action=prsp_export_attribute&amp;post='.$post->ID.'" title="Export this Attribute as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-template':
			$actions['Prsp_A_Template'] = '<a href="admin.php?action=prsp_export_template&amp;post='.$post->ID.'" title="Export this Template as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		case 'prsp-record':
			$actions['Prsp_A_Record'] = '<a href="admin.php?action=prsp_export_record&amp;post='.$post->ID.'" title="Export this Record as CSV file" rel="permalink">CSV Export</a>';
			break;
		case 'prsp-exhibit':
			$actions['Prsp_An_Exhibit'] = '<a href="admin.php?action=prsp_export_exhibit&amp;post='.$post->ID.'" title="Export this Exhibit as JSON archive file" rel="permalink">JSON Export</a>';
			break;
		}
		return $actions;
	} // prsp_export_post()


		// PURPOSE: Ensure data entity exists; create if non-existing
		// RETURNS: 0 if already exists; post ID number if new
	public function create_entity($type, $id_field, $id)
	{
			// Create query to get all Records of this Template type
		$args = array('post_type' => $type, 'meta_key' => $id_field, 'meta_value' => $id, 'posts_per_page' => 1);
		$query = new WP_Query($args);
		if ($query->have_posts())
			return 0;

		$post_id = wp_insert_post(
			array(
				'post_name'   => $id,
				'post_title'  => $id,
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
			$post_id = $this->create_entity('prsp-attribute', 'att-id', $data['att-id']);
			if ($post_id) {
				update_post_meta($post_id, 'att-def', json_encode($data['att-def']));
				update_post_meta($post_id, 'att-range', json_encode($data['att-range']));
				update_post_meta($post_id, 'att-legend', json_encode($data['att-legend']));
			}
			break;
		case 'Template':
			$post_id = $this->create_entity('prsp-template', 'tmplt-id', $data['tmplt-id']);
			if ($post_id) {
				update_post_meta($post_id, 'tmplt-def', json_encode($data['tmplt-def']));
				update_post_meta($post_id, 'tmplt-joins', json_encode($data['tmplt-joins']));
			}
			break;
		case 'Exhibit':
			$post_id = $this->create_entity('prsp-exhibit', 'xhbt-id', $data['xhbt-id']);
			if ($post_id) {
				update_post_meta($post_id, 'xhbt-def', json_encode($data['xhbt-def']));
				update_post_meta($post_id, 'xhbt-gen', json_encode($data['xhbt-gen']));
				update_post_meta($post_id, 'xhbt-views', json_encode($data['xhbt-views']));
				update_post_meta($post_id, 'xhbt-widgets', json_encode($data['xhbt-widgets']));
				update_post_meta($post_id, 'xhbt-pages', json_encode($data['xhbt-pages']));
			}
			break;
		} // switch
	} // parse_import_object()


		// PURPOSE: Import the selected file
		// ASSUMES: File info in the $_FILES['archive-import-select'] array
		// NOTES:   Array contents: 'name', 'type' [mimetype], 'size', 'error', 'tmp_name'
		//				Use 'tmp_name' for opening file
	public function import_archive_file()
	{
		$fname = $_FILES['archive-import-select']['tmp_name'];
		$res = fopen($fname, 'rb');
			// Return if file not found or empty file
		if ($res == false || $_FILES['archive-import-select']['size'] == 0)
			return;

		$contents = file_get_contents($fname);
		if ($contents === false) {
			trigger_error('Failed to get file contents.', E_USER_WARNING);
		}

			// Skip any UTF-8 header
		$header = substr($contents, 0, 3);
		if ($header == pack('CCC', 0xef, 0xbb, 0xbf))
			$contents = substr($contents, 3);

			// Parse as JSON Object
		$data = json_decode($contents, true);

			// Each Object begins with "type" property with values Archive, Attribute, Template, or Exhibit
		if ($data['type'] == 'Archive') {
			foreach ($data['items'] as $datum) {
				$this->parse_import_object($datum);
			}
		} else
			$this->parse_import_object($data);
	} // import_archive_file()


		// PURPOSE: Check to see if POST with parameters sent to program that were generated
		//				from form on show_prsp_archive_page()
		// NOTES: 	Must add this action with 'admin_init' as it creates file in output buffer
	public function check_archive_output()
	{
			// Check to see if we've been sent here by a form operation
		if ($_SERVER['REQUEST_METHOD'] == 'POST') {
			if (isset($_POST['export_t_atts'])) {
				// echo 'trying export-t-atts with: '.$_POST['export-type'];
				$this->prsp_export_template_and_atts($_POST['export-type']);
			} else if (isset($_POST['export_t_recs'])) {
				// echo 'trying export-t-recs with: '.$_POST['export-type'];
				$this->prsp_export_all_template_records($_POST['export-type']);
			} else if (isset($_POST['import_submit'])) {
				$this->import_archive_file();
			}
		}
	} // check_archive_output()


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

			// Get last bit of static text
		$archivepage = self::get_script_text('archive-page-3.txt');
		echo $archivepage;
	} // show_prsp_archive_page()


		// PURPOSE: Register archive menu and hook to page creation function
	public function add_prsp_archive_menu()
	{
		add_submenu_page('prsp-top-level-handle', 'Archive', 'Archive', 'manage_options', 'prsp-archive-menu', 
			array($this, 'show_prsp_archive_page'));
	} // add_prsp_archive_menu()


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
				$rec_id = get_metadata('post', $rec->ID, 'record-id', true);
				if ($rec_id && $rec_id != '')
					array_push($result, $rec_id);
			}
		}
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
		$the_template = new ProspectTemplate(false, $tmplt_id, true, true);

			// Get dependent Templates needed for Joins
		$d_templates = $the_template->get_dependent_templates();

			// Get associative array for all Attribute definitions
		$assoc_atts = ProspectAttribute::get_assoc_defs();

			// Get Records -- Need to order by Record ID, etc
		$args = array('post_type' => 'prsp-record',
						'post_status' => 'publish',
						'meta_key' => 'record-id',
						'orderby' => 'meta_value_num',
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
				$extracted_rec['l']  = $the_rec->label;
				$extracted_rec['a']  = $the_rec->att_data;
				array_push($result, $extracted_rec);
			}
		}
		die(json_encode($result));
	} // prsp_get_records()


	// NEW OBJECT CONSTRUCTOR
	// ======================

	public function __construct($version)
	{
		$this->version = $version;
	} // __construct()

} // class ProspectAdmin
?>