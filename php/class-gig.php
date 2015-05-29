<?php

// PURPOSE: Core plugin file that maintains version info, plugin slug info, coordinates loader, ...

// NOTES:   Implementation leverages WordPress by creating custom post types, each of which
//				contains a specific set of custom fields. (Custom Field / AJAX-JSON data names)
//			gig-attribute: 
//			gig-template:
//			gig-record:
//			gig-exhibit:
//			gig-map:

class Gig {
		// INSTANCE VARIABLES AND METHODS
		// ==============================
	protected $loader;
	protected $plugin_slug;
	protected $version;
	protected $admin;


		// PURPOSE:	Called by WP to modify output when viewing any post type
		// INPUT:	$page_template = default path to file to use for template to render page
		// RETURNS:	Modified $page_template setting (file path to new php template file)
		// TO DO: 	Only get Attribute definitions that are used
	public function gig_page_template($page_template)
	{
		// global $post;

		$post_type = get_query_var('post_type');
		// $blog_id = get_current_blog_id();
		// $ajax_url = get_admin_url($blog_id ,'admin-ajax.php');

			// What kind of page viewed?
		switch ($post_type) {
		case 'gig-attribute':
		case 'gig-template':
		case 'gig-record':
			break;

		case 'gig-exhibit':
	    		// Get rid of default styles
			// wp_dequeue_style('screen');
			// wp_deregister_style('screen');
			// wp_dequeue_style('events-manager');

			// wp_enqueue_style('jqueryui-min-css', plugins_url('css/jquery-ui.min.css', dirname(__FILE__)), 
			// 	array(), $this->version);
			// wp_enqueue_style('jqueryui-theme-css', plugins_url('css/jquery-ui.theme.min.css', dirname(__FILE__)), 
			// 	array('jqueryui-min-css'), $this->version);
			// wp_enqueue_style('gig-view-css', plugins_url('css/view-template.css', dirname(__FILE__)), 
			// 	array('jqueryui-theme-css'), $this->version);

			// 	// Load required JS libraries
			// wp_enqueue_script('jquery');
			// wp_enqueue_script('jquery-ui-button');
			// wp_enqueue_script('jquery-ui-dialog');

			// // wp_enqueue_script('modernizr');
			// wp_enqueue_script('underscore');

			// 	// Enqueue page JS last, after we've determine what dependencies might be
			// wp_enqueue_script('gig-view', plugins_url('js/view-template.js', dirname(__FILE__)),
			// 	array('jquery', 'underscore', 'jquery-ui-button', 'jquery-ui-dialog'), $this->version);

				// Get this exhibit data
			// $the_xhbt = new GigExhibit(true, get_the_ID(), true);
			// 	// Put Attribute list in sorted order
			// sort($the_xhbt->gen->ts);
			// $e = array();
			// $e['id'] = $the_xhbt->id;
			// $e['g']  = $the_xhbt->gen;
			// $e['vf'] = $the_xhbt->views;
			// $e['w']  = $the_xhbt->widgets;
			// $e['p']  = $the_xhbt->pages;

			// 	// Get all definitions of all current Attributes
			// $att_defs = GigAttribute::get_all_attributes(true, false, true, true);
			// 	// Compile definition JSON strings into array
			// $att_data = array();
			// foreach($att_defs as $the_attribute) {
			// 	$an_att = array();
			// 	$an_att['id'] = $the_attribute->id;
			// 	$an_att['def'] = $the_attribute->def;
			// 	$an_att['r'] = $the_attribute->range;
			// 	$an_att['l'] = $the_attribute->legend;
			// 	array_push($att_data, $an_att);
			// }

				// Compile Template data into array
			// $tmp_data = array();
			// foreach($the_xhbt->gen->ts as $template_id) {
			// 	$the_template = new GigTemplate(false, $template_id, true, false);
			// 	$a_tmp = array();
			// 	$a_tmp['id'] = $the_template->id;
			// 	$a_tmp['def'] = $the_template->def;
			// 	$a_tmp['n'] = $the_template->get_num_records();
			// 	array_push($tmp_data, $a_tmp);
			// }

				// Save variables in structure to pass to JavaScript code
			// wp_localize_script('gig-view', 'gigdata', array(
			// 	'ajax_url'		=> $ajax_url,
			// 	'a'				=> $att_data,
			// 	't'				=> $tmp_data,
			// 	'e'				=> $e
			// ));

			$page_template = dirname(__FILE__).'/view-template.php';
			break;

		case 'gig-map':
			break;
		} // switch

		return $page_template;
	} // gig_page_template()


		// PURPOSE: Define a new top-level menu -- This hook used by custom post types
	public function add_menu()
	{
		add_menu_page(__('Gig', 'gig-menu'), __('Gig', 'gig-menu'), 'manage_options', 'gig-top-level-handle', null, '', 7);
	} // add_menu()


	// public function disable_emojicons_tinymce($plugins) {
	// 	if ( is_array( $plugins ) ) {
	// 		return array_diff( $plugins, array('wpemoji') );
	// 	} else {
	// 		return array();
	// 	}
	// }

		// PURPOSE: Code to run on init of WordPress
	public function init_gig()
	{
			// Register Attribute Custom Post Type
		$labels = array(
			'name' => _x('Attributes', 'post type general name'),
			'singular_name' => _x('Attribute', 'post type singular name'),
			'add_new' => _x('Add Attribute', 'gig-attribute'),
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
			'show_in_menu' => 'gig-top-level-handle',
			'rewrite' => array('slug' => 'gig-attribute', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'gig_attribute',
			'map_meta_cap' => true
		); 
		register_post_type('gig-attribute', $args);

			// Register Template Custom Post Type
		$labels = array(
			'name' => _x('Templates', 'post type general name'),
			'singular_name' => _x('Template', 'post type singular name'),
			'add_new' => _x('Add Template', 'gig-template'),
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
			'show_in_menu' => 'gig-top-level-handle',
			'rewrite' => array('slug' => 'gig-template', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'gig_template',
			'map_meta_cap' => true
		); 
		register_post_type('gig-template', $args);

			// Register Record Custom Post Type
		$labels = array(
			'name' => _x('Records', 'post type general name'),
			'singular_name' => _x('Record', 'post type singular name'),
			'add_new' => _x('Add Record', 'gig-record'),
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
			'show_in_menu' => 'gig-top-level-handle',
			'rewrite' => array('slug' => 'gig-record', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'editor', 'thumbnail', 'revisions'),
			'capability_type' => 'gig_record',
			'map_meta_cap' => true
		); 
		register_post_type('gig-record', $args);

			// Register Exhibit Custom Post Type
		$labels = array(
			'name' => _x('Exhibits', 'post type general name'),
			'singular_name' => _x('Exhibit', 'post type singular name'),
			'add_new' => _x('Add Exhibit', 'gig-exhibit'),
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
			'show_in_menu' => 'gig-top-level-handle',
			'rewrite' => array('slug' => 'gig-exhibit', 'with_front' => FALSE),
			'has_archive' => false,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'thumbnail', 'revisions'),
			'capability_type' => 'gig_exhibit',
			'map_meta_cap' => true
		); 
		register_post_type('gig-exhibit', $args);

		$labels = array(
			'name' => _x( 'Maps', 'taxonomy general name' ),
			'singular_name' => _x( 'Map', 'taxonomy singular name' ),
			'add_new' => __('Add New', 'gig-map'),
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
			'show_in_menu' => 'gig-top-level-handle',
			'query_var' => true,
			'rewrite' => false,
			'has_archive' => true,
			'hierarchical' => false,
			'menu_position' => null,
			'supports' => array('title', 'comments', 'revisions'),
			'capability_type' => 'gig_map',
			'map_meta_cap' => true
		);
		register_post_type('gig-map', $args);

			// Remove superfluous emojicon crud
		// remove_action('admin_print_styles', 'print_emoji_styles');
		// remove_action('wp_head', 'print_emoji_detection_script', 7);
		// remove_action('admin_print_scripts', 'print_emoji_detection_script');
		// remove_action('wp_print_styles', 'print_emoji_styles');
		// remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
		// remove_filter('the_content_feed', 'wp_staticize_emoji');
		// remove_filter('comment_text_rss', 'wp_staticize_emoji');
		// add_filter('tiny_mce_plugins', array ($this, 'disable_emojicons_tinymce'));
	} // init_gig()


	public function __construct()
	{
		$this->plugin_slug = 'gig-slug';
		$this->version = '0.1.0';

		$this->load_dependencies();

		add_action('admin_menu', array($this, 'add_menu'));

		add_action('init', array($this, 'init_gig'));

		$this->define_admin_hooks();
		$this->define_page_hooks();
	} // __construct()


		// PURPOSE: Force load of class files and create needed classes
	private function load_dependencies()
	{
			// Start with root directory for plugin
		require_once plugin_dir_path(__FILE__).'class-gig-admin.php';
			// Load all Object files
		require_once plugin_dir_path(__FILE__).'class-attribute.php';
		require_once plugin_dir_path(__FILE__).'class-template.php';
		require_once plugin_dir_path(__FILE__).'class-record.php';
		require_once plugin_dir_path(__FILE__).'class-exhibit.php';

		require_once plugin_dir_path(__FILE__).'class-gig-loader.php';
		$this->loader = new GigLoader();
	} // load_dependencies()


		// PURPOSE: Add hooks related to Dashboard and Options page
	private function define_admin_hooks()
	{
			// Add Dashboard hooks
		$this->admin = new GigAdmin($this->get_version());

		$this->loader->add_action('upload_mimes', $this->admin, 'add_mime_types');
			// Add JS to Dashboard editors
		$this->loader->add_action('admin_enqueue_scripts', $this->admin, 'add_admin_scripts');
			// Modify HTML for Dashboard editors
		$this->loader->add_action('add_meta_boxes_gig-attribute', $this->admin, 'add_gig_attribute_admin_edit');
		$this->loader->add_action('add_meta_boxes_gig-template', $this->admin, 'add_gig_template_admin_edit');
		$this->loader->add_action('add_meta_boxes_gig-record', $this->admin, 'add_gig_record_admin_edit');
		$this->loader->add_action('add_meta_boxes_gig-exhibit', $this->admin, 'add_gig_exhibit_admin_edit');
			// Hook for saving Dashboard data
		$this->loader->add_action('save_post', $this->admin, 'save_post');

			// Hooks for exporting JSON files from directory and simple Archive page links
		$this->loader->add_action('admin_action_gig_export_attribute', $this->admin, 'gig_export_attribute');
		$this->loader->add_action('admin_action_gig_export_all_attributes', $this->admin, 'gig_export_all_attributes');
		$this->loader->add_action('admin_action_gig_export_template', $this->admin, 'gig_export_template');
		$this->loader->add_action('admin_action_gig_export_all_ts', $this->admin, 'gig_export_all_ts');
		$this->loader->add_action('admin_action_gig_export_record', $this->admin, 'gig_export_record');
		$this->loader->add_action('admin_action_gig_export_exhibit', $this->admin, 'gig_export_exhibit');
		$this->loader->add_action('admin_action_gig_export_all_exhibits', $this->admin, 'gig_export_all_exhibits');

		$this->loader->add_action('admin_init', $this->admin, 'check_archive_output');

			// Hook for Archive page
		$this->loader->add_action('admin_menu', $this->admin, 'add_gig_archive_menu');

			// AJAX calls
		$this->loader->add_action('wp_ajax_gig_get_rec_ids', $this->admin, 'gig_get_rec_ids');
		$this->loader->add_action('wp_ajax_gig_get_records', $this->admin, 'gig_get_records');
		$this->loader->add_action('wp_ajax_nopriv_gig_get_records', $this->admin, 'gig_get_records');
	} // define_admin_hooks()


		// PURPOSE: Add hooks related to Page display
		// ASSUMES: admin has been created
	private function define_page_hooks()
	{
			// Modify template for viewing pages
		$this->loader->add_filter('single_template', $this, 'gig_page_template', null, null);

			// Add code to injet Export links
		$this->loader->add_filter('post_row_actions', $this->admin, 'gig_export_post', 10, 2);
	} // define_page_hooks()


	public function run()
	{
		$this->loader->run();
	} // run()


	public function get_version()
	{
		return $this->version;
	} // get_version()

} // class Gig
