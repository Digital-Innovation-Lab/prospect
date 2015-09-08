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

				if ($the_template->view->sc != null && $the_template->view->sc != 'disable')
					wp_enqueue_script('soundcloud-api', 'http://w.soundcloud.com/player/api.js');

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

				$dltext = ProspectAdmin::get_script_text('view-record.txt');
				echo $dltext;
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
		add_menu_page(__('Prospect', 'prsp-menu'), __('Prospect', 'prsp-menu'), 'manage_options', 'prsp-top-level-handle', null, '', 7);
	} // add_menu()


		// PURPOSE: Code to run on init of WordPress
	public function init_prospect()
	{
			// Register Attribute Custom Post Type
		$labels = array(
			'name' => _x('Attributes', 'post type general name'),
			'singular_name' => _x('Attribute', 'post type singular name'),
			'add_new' => _x('Add Attribute', 'prsp-attribute'),
			'add_new_item' => __('Add New Attribute'),
			'edit_item' => __('Edit Attribute'),
			'new_item' => __('New Attribute'),
			'all_items' => __('Attributes'),
			'view_item' => __('View Attribute'),
			'search_items' => __('Search Attributes'),
			'not_found' =>  __('No Attributes found'),
			'not_found_in_trash' => __('No Attributes found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Attributes')
		);
		$args = array(
			'labels' => $labels,
			'show_ui' => true, 
			'show_in_menu' => 'prsp-top-level-handle',
			'rewrite' => array('slug' => 'prsp-attribute', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'prsp_attribute',
			'map_meta_cap' => true
		); 
		register_post_type('prsp-attribute', $args);

			// Register Template Custom Post Type
		$labels = array(
			'name' => _x('Templates', 'post type general name'),
			'singular_name' => _x('Template', 'post type singular name'),
			'add_new' => _x('Add Template', 'prsp-template'),
			'add_new_item' => __('Add New Template'),
			'edit_item' => __('Edit Template'),
			'new_item' => __('New Template'),
			'all_items' => __('Templates'),
			'view_item' => __('View Template'),
			'search_items' => __('Search Templates'),
			'not_found' =>  __('No Templates found'),
			'not_found_in_trash' => __('No Templates found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Templates')
		);
		$args = array(
			'labels' => $labels,
			'show_ui' => true, 
			'show_in_menu' => 'prsp-top-level-handle',
			'rewrite' => array('slug' => 'prsp-template', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'prsp_template',
			'map_meta_cap' => true
		); 
		register_post_type('prsp-template', $args);

			// Register Record Custom Post Type
		$labels = array(
			'name' => _x('Records', 'post type general name'),
			'singular_name' => _x('Record', 'post type singular name'),
			'add_new' => _x('Add Record', 'prsp-record'),
			'add_new_item' => __('Add New Record'),
			'edit_item' => __('Edit Record'),
			'new_item' => __('New Record'),
			'all_items' => __('Records'),
			'view_item' => __('View Record'),
			'search_items' => __('Search Records'),
			'not_found' =>  __('No Records found'),
			'not_found_in_trash' => __('No Records found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Records')
		);
		$args = array(
			'labels' => $labels,
			'public' => true,
			'publicly_queryable' => true,
			'show_ui' => true, 
			'show_in_menu' => 'prsp-top-level-handle',
			'rewrite' => array('slug' => 'prsp-record', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'editor', 'thumbnail', 'revisions'),
			'capability_type' => 'prsp_record',
			'map_meta_cap' => true
		); 
		register_post_type('prsp-record', $args);

			// Register Exhibit Custom Post Type
		$labels = array(
			'name' => _x('Exhibits', 'post type general name'),
			'singular_name' => _x('Exhibit', 'post type singular name'),
			'add_new' => _x('Add Exhibit', 'prsp-exhibit'),
			'add_new_item' => __('Add New Exhibit'),
			'edit_item' => __('Edit Exhibit'),
			'new_item' => __('New Exhibit'),
			'all_items' => __('Exhibits'),
			'view' => __('View'),
			'view_item' => __('View Exhibit'),
			'search_items' => __('Search Exhibits'),
			'not_found' =>  __('No Exhibits found'),
			'not_found_in_trash' => __('No Exhibits found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Exhibits')
		);
		$args = array(
			'labels' => $labels,
			'public' => true,
			'show_ui' => true, 
			'show_in_menu' => 'prsp-top-level-handle',
			'rewrite' => array('slug' => 'prsp-exhibit', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'prsp_exhibit',
			'map_meta_cap' => true
		); 
		register_post_type('prsp-exhibit', $args);

			// Register Map Custom Post Type
		$labels = array(
			'name' => _x( 'Maps', 'taxonomy general name' ),
			'singular_name' => _x( 'Map', 'taxonomy singular name' ),
			'add_new' => __('Add New', 'prsp-map'),
			'add_new_item' => __('Add New Map'),
			'edit_item' => __('Edit Map'),
			'new_item' => __('New Map'),
			'all_items' => __('Map Library'),
			'view' => __('View'),
			'view_item' => __('View Map'),
			 'search_items' => __('Search Maps'),
			'not_found' =>  __('No maps found'),
			'not_found_in_trash' => __('No maps found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Map Library')
		);
		$args = array(
			'labels' => $labels,
			'public' => true,
			'publicly_queryable' => true,
			'show_ui' => true,
			'show_in_menu' => 'prsp-top-level-handle',
			'query_var' => true,
			'rewrite' => false,
			'has_archive' => true,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'comments', 'revisions'),
			'capability_type' => 'prsp_map',
			'map_meta_cap' => true
		);
		register_post_type('prsp-map', $args);

			// Register Perspective Custom Post Type
		$labels = array(
			'name' => _x( 'Perspectives', 'taxonomy general name' ),
			'singular_name' => _x( 'Perspective', 'taxonomy singular name' ),
			'add_new' => __('Add New', 'prsp-prspctv'),
			'add_new_item' => __('Add New Perspective'),
			'edit_item' => __('Edit Perspective'),
			'new_item' => __('New Perspective'),
			'all_items' => __('Perspectives'),
			'view' => __('View'),
			'view_item' => __('View Perspective'),
			 'search_items' => __('Search Perspectives'),
			'not_found' =>  __('No Perspectives found'),
			'not_found_in_trash' => __('No Perspective found in Trash'), 
			'parent_item_colon' => '',
			'menu_name' => __('Perspectives')
		);
		$args = array(
			'labels' => $labels,
			'public' => true,
			'show_ui' => true, 
			'show_in_menu' => 'prsp-top-level-handle',
			'rewrite' => array('slug' => 'prsp-prspctv', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'prsp_prspctv',
			'map_meta_cap' => true
		);
		register_post_type('prsp-prspctv', $args);
	} // init_prospect()


	public function __construct()
	{
		$this->plugin_slug = 'prsp-slug';
		$this->version = '0.5.1';

		$this->load_dependencies();

		add_action('admin_menu', array($this, 'add_menu'));

		add_action('init', array($this, 'init_prospect'));

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

		$this->loader->add_action('upload_mimes', $this->admin, 'add_mime_types');
		$this->loader->add_filter('query_vars', $this->admin, 'add_query_vars_filter', null, null);

			// Add JS to Dashboard editors
		$this->loader->add_action('admin_enqueue_scripts', $this->admin, 'add_admin_scripts');
			// Modify HTML for Dashboard editors
		$this->loader->add_action('add_meta_boxes_prsp-attribute', $this->admin, 'add_prsp_attribute_admin_edit');
		$this->loader->add_action('add_meta_boxes_prsp-template', $this->admin, 'add_prsp_template_admin_edit');
		$this->loader->add_action('add_meta_boxes_prsp-record', $this->admin, 'add_prsp_record_admin_edit');
		$this->loader->add_action('add_meta_boxes_prsp-exhibit', $this->admin, 'add_prsp_exhibit_admin_edit');
		$this->loader->add_action('add_meta_boxes_prsp-map', $this->admin, 'add_prsp_map_admin_edit');
		$this->loader->add_action('add_meta_boxes_prsp-prspctv', $this->admin, 'add_prsp_prspctv_admin_edit');
			// Hook for saving Dashboard data
		$this->loader->add_action('save_post', $this->admin, 'save_post');

			// Hooks for exporting JSON files from directory and simple Archive page links
		$this->loader->add_action('admin_action_prsp_export_attribute', $this->admin, 'prsp_export_attribute');
		$this->loader->add_action('admin_action_prsp_export_all_attributes', $this->admin, 'prsp_export_all_attributes');
		$this->loader->add_action('admin_action_prsp_export_template', $this->admin, 'prsp_export_template');
		$this->loader->add_action('admin_action_prsp_export_all_ts', $this->admin, 'prsp_export_all_ts');
		$this->loader->add_action('admin_action_prsp_export_record', $this->admin, 'prsp_export_record');
		$this->loader->add_action('admin_action_prsp_export_exhibit', $this->admin, 'prsp_export_exhibit');
		$this->loader->add_action('admin_action_prsp_export_all_exhibits', $this->admin, 'prsp_export_all_exhibits');
		$this->loader->add_action('admin_action_prsp_export_all', $this->admin, 'prsp_export_all');
		$this->loader->add_action('admin_action_prsp_export_map', $this->admin, 'prsp_export_map');
		$this->loader->add_action('admin_action_prsp_export_all_maps', $this->admin, 'prsp_export_all_maps');
		$this->loader->add_action('admin_action_prsp_export_prspctv', $this->admin, 'prsp_export_prspctv');
		$this->loader->add_action('admin_action_prsp_export_xhbt_prspctvs', $this->admin, 'prsp_export_xhbt_prspctvs');
		$this->loader->add_action('admin_action_prsp_export_all_prspctvs', $this->admin, 'prsp_export_all_prspctvs');

		$this->loader->add_action('admin_init', $this->admin, 'do_prsp_init');

			// Hook for Archive page
		$this->loader->add_action('admin_menu', $this->admin, 'add_prsp_menus');

			// AJAX calls
		$this->loader->add_action('wp_ajax_prsp_get_rec_ids', $this->admin, 'prsp_get_rec_ids');
		$this->loader->add_action('wp_ajax_prsp_get_records', $this->admin, 'prsp_get_records');
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_records', $this->admin, 'prsp_get_records');
		$this->loader->add_action('wp_ajax_prsp_get_cf_vals', $this->admin, 'prsp_get_cf_vals');
		$this->loader->add_action('wp_ajax_prsp_save_prspctv', $this->admin, 'prsp_save_prspctv');
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
