<?php

// PURPOSE: Core plugin file that maintains version info, plugin slug info, coordinates loader, ...

// NOTES:   Implementation leverages WordPress by creating custom post types, each of which
//				contains a specific set of custom fields. (Custom Field / AJAX-JSON data names)

class Prospect {
		// INSTANCE VARIABLES AND METHODS
		// ==============================
	protected $loader;
	protected $plugin_slug;
	protected $version;
	protected $admin;


		// PURPOSE: Compare two IDs for sorting
	static public function cmp_ids($a, $b)
	{
		return strcmp($a['id'], $b['id']);
	} // cmp_ids()


		// PURPOSE:	Called by WP to modify output when viewing any post type
		// INPUT:	$page_template = default path to file to use for template to render page
		// RETURNS:	Modified $page_template setting (file path to new php template file)
		// TO DO: 	Only get Attribute definitions that are used
	public function prsp_page_template($page_template)
	{
		global $post;

		$post_type = get_query_var('post_type');

			// What kind of page viewed?
		switch ($post_type) {
		case 'prsp-attribute':
		case 'prsp-template':
			break;

		case 'prsp-record':
			$blog_id = get_current_blog_id();
			$ajax_url = get_admin_url($blog_id ,'admin-ajax.php');

			$tmplt_id = get_post_meta($post->ID, 'tmplt-id', true);

			if ($tmplt_id != '') {
					// Load Template definition
				$the_template = new ProspectTemplate(false, $tmplt_id, true, true, true);

					// Get dependent Templates needed for Joins
				$d_templates = $the_template->get_dependent_templates(true);

					// Get associative array for all Attribute definitions
				$assoc_atts = ProspectAttribute::get_assoc_defs();				

				$record = new ProspectRecord(true, $post->ID, false, $the_template, $d_templates, $assoc_atts);
				wp_enqueue_script('jquery');
				wp_enqueue_script('underscore');

				wp_enqueue_style('view-record-css', plugins_url('/css/view-record.css', dirname(__FILE__)));

					// Audio Attribute? Check to see if the value contains soundcloud.com pattern
				if ($the_template->view->sc != null && $the_template->view->sc != 'disable') {
					if (array_key_exists($the_template->view->sc, $record->att_data)) {
						$sc_val = $record->att_data[$the_template->view->sc];
						if (preg_match('/soundcloud\.com/', $sc_val)) {
							wp_enqueue_script('soundcloud-api', 'http://w.soundcloud.com/player/api.js');
						}
					}
				}
				wp_enqueue_script('view-record', plugins_url('/js/view-record.js', dirname(__FILE__)),
								array('jquery', 'underscore'));

					// Convert attributes to serial array
				$att_array = array();
				foreach ($assoc_atts as $key => $value) {
					$att_entry = array();
					$att_entry['id'] = $key;
					$att_entry['def'] = $value;
					array_push($att_array, $att_entry);
				}
					// Sort by ID
				usort($att_array, array('Prospect', 'cmp_ids'));

					// Compile Dependent Template view data
				$d_t_array = array();
				foreach ($d_templates as $this_temp) {
					$d_t_entry = array();
					$d_t_entry['id'] = $this_temp->id;
					$d_t_entry['v'] = $this_temp->view;
					array_push($d_t_array, $d_t_entry);
				}

				wp_localize_script('view-record', 'prspdata', array(
					'ajax_url' => $ajax_url,
					'd' => $record->att_data,
					'a' => $att_array,
					'v' => $the_template->view,
					'j' => $the_template->joins,
					't' => $d_t_array
				) );

				ProspectAdmin::insert_html_file('view-record.php');
			}
			break;

		case 'prsp-exhibit':
			$page_template = dirname(__FILE__).'/view-exhibit.php';
			break;

			// Don't currently support any special views as they are meant for backend
		case 'prsp-map':
		case 'prsp-prspctv':
			break;
		} // switch

		return $page_template;
	} // prsp_page_template()


		// PURPOSE: Define a new top-level menu -- This hook used by custom post types
	public function add_menu()
	{
		add_menu_page(__('Prospect', 'prospect'), __('Prospect', 'prospect'), 'edit_posts', 'prsp-top-level-handle', null, '', 7);
	} // add_menu()


	public function __construct()
	{
		$this->plugin_slug = 'prsp-slug';
		$this->version = '0.9.19';

		$this->load_dependencies();

		add_action('admin_menu', array($this, 'add_menu'));

		$this->define_admin_hooks();
		$this->define_page_hooks();
	} // __construct()


		// PURPOSE: Force load of class files and create needed classes
	private function load_dependencies()
	{
			// Start with root directory for plugin
		require_once plugin_dir_path(__FILE__).'class-prospect-admin.php';
			// Load all Object files
		require_once plugin_dir_path(__FILE__).'class-attribute.php';
		require_once plugin_dir_path(__FILE__).'class-template.php';
		require_once plugin_dir_path(__FILE__).'class-record.php';
		require_once plugin_dir_path(__FILE__).'class-exhibit.php';
		require_once plugin_dir_path(__FILE__).'class-map.php';
		require_once plugin_dir_path(__FILE__).'class-perspective.php';

		require_once plugin_dir_path(__FILE__).'class-prospect-loader.php';
		$this->loader = new ProspectLoader();
	} // load_dependencies()


		// PURPOSE: Add hooks related to Dashboard and Options page
	private function define_admin_hooks()
	{
			// Add Dashboard hooks
		$this->admin = new ProspectAdmin($this->get_version());

		$this->loader->add_action('admin_init', $this->admin, 'do_prsp_init', null, null);

			// Hook for Archive page
		$this->loader->add_action('admin_menu', $this->admin, 'add_prsp_menus', null, null);

			// Hooks for REST API
		$this->loader->add_action('rest_api_init', $this->admin, 'add_rest_api', null, null);

		$this->loader->add_action('upload_mimes', $this->admin, 'add_mime_types', null, null);
		$this->loader->add_filter('query_vars', $this->admin, 'add_query_vars_filter', null, null);

			// Patch taxonomy issue
		$this->loader->add_filter('pre_get_posts', $this->admin, 'add_custom_types_to_tax', null, null);

			// Add JS to Dashboard editors
		$this->loader->add_action('admin_enqueue_scripts', $this->admin, 'add_admin_scripts', null, null);
			// Modify HTML for Dashboard editors
		$this->loader->add_action('add_meta_boxes_prsp-attribute', $this->admin, 'add_prsp_attribute_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-template', $this->admin, 'add_prsp_template_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-record', $this->admin, 'add_prsp_record_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-exhibit', $this->admin, 'add_prsp_exhibit_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-map', $this->admin, 'add_prsp_map_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-prspctv', $this->admin, 'add_prsp_prspctv_admin_edit', null, null);
			// Hook for saving Dashboard data
		$this->loader->add_action('save_post', $this->admin, 'save_post', null, null);
			// Restrict Records to a particular Template type
		$this->loader->add_action('restrict_manage_posts', $this->admin, 'filter_restrict_rec_by_id', null, null);
		$this->loader->add_action('parse_query', $this->admin, 'filter_rec_query', null, null);
			// Add columns to directory views
		$this->loader->add_filter('manage_prsp-attribute_posts_columns', $this->admin, 'set_attribute_columns', null, null);
		$this->loader->add_action('manage_prsp-attribute_posts_custom_column', $this->admin, 'attribute_custom_column', 10, 2);
		$this->loader->add_filter('manage_prsp-record_posts_columns', $this->admin, 'set_record_columns', null, null);
		$this->loader->add_action('manage_prsp-record_posts_custom_column', $this->admin, 'record_custom_column', 10, 2);

			// Hooks for exporting JSON files from directory and simple Archive page links
		$this->loader->add_action('admin_action_prsp_export_attribute', $this->admin, 'prsp_export_attribute', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_attributes', $this->admin, 'prsp_export_all_attributes', null, null);
		$this->loader->add_action('admin_action_prsp_export_template', $this->admin, 'prsp_export_template', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_ts', $this->admin, 'prsp_export_all_ts', null, null);
		$this->loader->add_action('admin_action_prsp_export_record', $this->admin, 'prsp_export_record', null, null);
		$this->loader->add_action('admin_action_prsp_export_exhibit', $this->admin, 'prsp_export_exhibit', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_exhibits', $this->admin, 'prsp_export_all_exhibits', null, null);
		$this->loader->add_action('admin_action_prsp_export_all', $this->admin, 'prsp_export_all', null, null);
		$this->loader->add_action('admin_action_prsp_export_map', $this->admin, 'prsp_export_map', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_maps', $this->admin, 'prsp_export_all_maps', null, null);
		$this->loader->add_action('admin_action_prsp_export_prspctv', $this->admin, 'prsp_export_prspctv', null, null);
		$this->loader->add_action('admin_action_prsp_export_xhbt_prspctvs', $this->admin, 'prsp_export_xhbt_prspctvs', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_prspctvs', $this->admin, 'prsp_export_all_prspctvs', null, null);

			// AJAX calls
		$this->loader->add_action('wp_ajax_prsp_get_rec_ids', $this->admin, 'prsp_get_rec_ids', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_records', $this->admin, 'prsp_get_records', null, null);
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_records', $this->admin, 'prsp_get_records', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_cf_vals', $this->admin, 'prsp_get_cf_vals', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_transcript', $this->admin, 'prsp_get_transcript', null, null);
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_transcript', $this->admin, 'prsp_get_transcript', null, null);

		$this->loader->add_action('wp_ajax_prsp_save_prspctv', $this->admin, 'prsp_save_prspctv', null, null);
	} // define_admin_hooks()


		// PURPOSE: Add hooks related to Page display
		// ASSUMES: admin has been created
	private function define_page_hooks()
	{
			// Modify template for viewing pages
		$this->loader->add_filter('single_template', $this, 'prsp_page_template', null, null);

			// Add code to injet Export links
		$this->loader->add_filter('post_row_actions', $this->admin, 'prsp_export_post', 10, 2);
	} // define_page_hooks()


	public function run()
	{
		$this->loader->run();
	} // run()


	public function get_version()
	{
		return $this->version;
	} // get_version()

} // class Prospect
