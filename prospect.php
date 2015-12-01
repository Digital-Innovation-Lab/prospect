<?php
/*
 * Plugin Name:       Prospect
 * Plugin URI:        https://prospect.web.unc.edu/
 * Description:       Digital Humanities platform for visualizing curated collections
 * Version:           0.9.0
 * Author:            Michael Newton, Breon Williams, Digital Innovation Lab, UNC-CH
 * Author URI:        
 * Text Domain:       dil-prospect
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path:       /languages
 */


function prospect_register_post_types()
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
		'capability_type' => array('prsp_attribute','prsp_attributes'),
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
		'capability_type' => array('prsp_template','prsp_templates'),
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
		'capability_type' => array('prsp_record','prsp_records'),
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
		'capability_type' => array('prsp_exhibit','prsp_exhibits'),
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
		'capability_type' => array('prsp_map','prsp_maps'),
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
		'capability_type' => array('prsp_prspctv','prsp_prspctvs'),
		'map_meta_cap' => true
	);
	register_post_type('prsp-prspctv', $args);
} // prospect_register_post_types()


function prospect_activate()
{
	prospect_register_post_types();
	flush_rewrite_rules();

	$role = get_role('contributor');
	$role->add_cap('read_prsp_record');						// Records
	$role->add_cap('edit_prsp_record');
	$role->add_cap('edit_prsp_records');
	$role->add_cap('delete_prsp_records');
	$role->add_cap('create_prsp_records');
	$role->add_cap('read_prsp_exhibit');					// Exhibits
	$role->add_cap('read_prsp_exhibits');

	$role = get_role('editor');
	$role->add_cap('read_prsp_attribute');					// Attributes
	$role->add_cap('read_prsp_template');					// Templates
	$role->add_cap('read_prsp_record');						// Records
	$role->add_cap('read_private_prsp_records');
	$role->add_cap('edit_prsp_record');
	$role->add_cap('edit_prsp_records');
	$role->add_cap('edit_others_prsp_records');
	$role->add_cap('edit_published_prsp_records');
	$role->add_cap('publish_prsp_records');
	$role->add_cap('delete_prsp_records');
	$role->add_cap('delete_others_prsp_records');
	$role->add_cap('delete_private_prsp_records');
	$role->add_cap('delete_published_prsp_records');
	$role->add_cap('create_prsp_records');
	$role->add_cap('read_prsp_exhibit');					// Exhibits
	$role->add_cap('read_prsp_exhibits');
	$role->add_cap('read_prsp_map');						// Maps
	$role->add_cap('read_prsp_prspctv');					// Perspectives
	$role->add_cap('read_private_prsp_prspctvs');
	$role->add_cap('edit_prsp_prspctv');
	$role->add_cap('edit_prsp_prspctvs');
	$role->add_cap('edit_others_prsp_prspctvs');
	$role->add_cap('edit_published_prsp_prspctvs');
	$role->add_cap('publish_prsp_prspctvs');
	$role->add_cap('delete_prsp_prspctvs');
	$role->add_cap('delete_others_prsp_prspctvs');
	$role->add_cap('delete_private_prsp_prspctvs');
	$role->add_cap('delete_published_prsp_prspctvs');
	$role->add_cap('create_prsp_prspctvs');

	$role = get_role('administrator');
	$role->add_cap('read_prsp_attribute');					// Attributes
	$role->add_cap('read_private_prsp_attributes');
	$role->add_cap('edit_prsp_attribute');
	$role->add_cap('edit_prsp_attributes');
	$role->add_cap('edit_others_prsp_attributes');
	$role->add_cap('edit_published_prsp_attributes');
	$role->add_cap('publish_prsp_attributes');
	$role->add_cap('delete_prsp_attributes');
	$role->add_cap('delete_others_prsp_attributes');
	$role->add_cap('delete_private_prsp_attributes');
	$role->add_cap('delete_published_prsp_attributes');
	$role->add_cap('create_prsp_attributes');
	$role->add_cap('read_prsp_templates');					// Templates
	$role->add_cap('read_private_prsp_templates');
	$role->add_cap('edit_prsp_template');
	$role->add_cap('edit_prsp_templates');
	$role->add_cap('edit_others_prsp_templates');
	$role->add_cap('edit_published_prsp_templates');
	$role->add_cap('publish_prsp_templates');
	$role->add_cap('delete_prsp_templates');
	$role->add_cap('delete_others_prsp_templates');
	$role->add_cap('delete_private_prsp_templates');
	$role->add_cap('delete_published_prsp_templates');
	$role->add_cap('create_prsp_templates');
	$role->add_cap('read_prsp_record');						// Records
	$role->add_cap('read_private_prsp_records');
	$role->add_cap('edit_prsp_record');
	$role->add_cap('edit_prsp_records');
	$role->add_cap('edit_others_prsp_records');
	$role->add_cap('edit_published_prsp_records');
	$role->add_cap('publish_prsp_records');
	$role->add_cap('delete_prsp_records');
	$role->add_cap('delete_others_prsp_records');
	$role->add_cap('delete_private_prsp_records');
	$role->add_cap('delete_published_prsp_records');
	$role->add_cap('create_prsp_records');
	$role->add_cap('read_prsp_exhibit');					// Exhibits
	$role->add_cap('read_prsp_exhibits');
	$role->add_cap('read_private_prsp_exhibits');
	$role->add_cap('edit_prsp_exhibit');
	$role->add_cap('edit_prsp_exhibits');
	$role->add_cap('edit_others_prsp_exhibits');
	$role->add_cap('edit_published_prsp_exhibits');
	$role->add_cap('publish_prsp_exhibits');
	$role->add_cap('delete_prsp_exhibits');
	$role->add_cap('delete_others_prsp_exhibits');
	$role->add_cap('delete_private_prsp_exhibits');
	$role->add_cap('delete_published_prsp_exhibits');
	$role->add_cap('create_prsp_exhibits');
	$role->add_cap('read_prsp_map');						// Maps
	$role->add_cap('read_private_prsp_maps');
	$role->add_cap('edit_prsp_map');
	$role->add_cap('edit_prsp_maps');
	$role->add_cap('edit_others_prsp_maps');
	$role->add_cap('edit_published_prsp_maps');
	$role->add_cap('publish_prsp_maps');
	$role->add_cap('delete_prsp_maps');
	$role->add_cap('delete_others_prsp_maps');
	$role->add_cap('delete_private_prsp_maps');
	$role->add_cap('delete_published_prsp_maps');
	$role->add_cap('create_prsp_maps');
	$role->add_cap('read_prsp_prspctv');					// Perspectives
	$role->add_cap('read_private_prsp_prspctvs');
	$role->add_cap('edit_prsp_prspctv');
	$role->add_cap('edit_prsp_prspctvs');
	$role->add_cap('edit_others_prsp_prspctvs');
	$role->add_cap('edit_published_prsp_prspctvs');
	$role->add_cap('publish_prsp_prspctvs');
	$role->add_cap('delete_prsp_prspctvs');
	$role->add_cap('delete_others_prsp_prspctvs');
	$role->add_cap('delete_private_prsp_prspctvs');
	$role->add_cap('delete_published_prsp_prspctvs');
	$role->add_cap('create_prsp_prspctvs');
} // prospect_activate()

function prospect_deactivate()
{
	$role = get_role('contributor');
	$role->remove_cap('read_prsp_record');
	$role->remove_cap('read_prsp_record');					// Records
	$role->remove_cap('edit_prsp_record');
	$role->remove_cap('edit_prsp_records');
	$role->remove_cap('delete_prsp_records');
	$role->remove_cap('create_prsp_records');
	$role->remove_cap('read_prsp_exhibit');					// Exhibits
	$role->remove_cap('read_prsp_exhibits');

	$role = get_role('editor');
	$role->remove_cap('read_prsp_attribute');				// Attributes
	$role->remove_cap('read_prsp_template');				// Templates
	$role->remove_cap('read_prsp_record');					// Records
	$role->remove_cap('read_private_prsp_records');
	$role->remove_cap('edit_prsp_record');
	$role->remove_cap('edit_prsp_records');
	$role->remove_cap('edit_others_prsp_records');
	$role->remove_cap('edit_published_prsp_records');
	$role->remove_cap('publish_prsp_records');
	$role->remove_cap('delete_prsp_records');
	$role->remove_cap('delete_others_prsp_records');
	$role->remove_cap('delete_private_prsp_records');
	$role->remove_cap('delete_published_prsp_records');
	$role->remove_cap('create_prsp_records');
	$role->remove_cap('read_prsp_exhibit');					// Exhibits
	$role->remove_cap('read_prsp_exhibits');
	$role->remove_cap('read_prsp_map');						// Maps
	$role->remove_cap('read_prsp_prspctv');					// Perspectives
	$role->remove_cap('read_private_prsp_prspctvs');
	$role->remove_cap('edit_prsp_prspctv');
	$role->remove_cap('edit_prsp_prspctvs');
	$role->remove_cap('edit_others_prsp_prspctvs');
	$role->remove_cap('edit_published_prsp_prspctvs');
	$role->remove_cap('publish_prsp_prspctvs');
	$role->remove_cap('delete_prsp_prspctvs');
	$role->remove_cap('delete_others_prsp_prspctvs');
	$role->remove_cap('delete_private_prsp_prspctvs');
	$role->remove_cap('delete_published_prsp_prspctvs');
	$role->remove_cap('create_prsp_prspctvs');

	$role = get_role('administrator');
	$role->remove_cap('read_prsp_attribute');				// Attributes
	$role->remove_cap('read_private_prsp_attributes');
	$role->remove_cap('edit_prsp_attribute');
	$role->remove_cap('edit_prsp_attributes');
	$role->remove_cap('edit_others_prsp_attributes');
	$role->remove_cap('edit_published_prsp_attributes');
	$role->remove_cap('publish_prsp_attributes');
	$role->remove_cap('delete_prsp_attributes');
	$role->remove_cap('delete_others_prsp_attributes');
	$role->remove_cap('delete_private_prsp_attributes');
	$role->remove_cap('delete_published_prsp_attributes');
	$role->remove_cap('create_prsp_attributes');
	$role->remove_cap('read_prsp_templates');				// Templates
	$role->remove_cap('read_private_prsp_templates');
	$role->remove_cap('edit_prsp_template');
	$role->remove_cap('edit_prsp_templates');
	$role->remove_cap('edit_others_prsp_templates');
	$role->remove_cap('edit_published_prsp_templates');
	$role->remove_cap('publish_prsp_templates');
	$role->remove_cap('delete_prsp_templates');
	$role->remove_cap('delete_others_prsp_templates');
	$role->remove_cap('delete_private_prsp_templates');
	$role->remove_cap('delete_published_prsp_templates');
	$role->remove_cap('create_prsp_templates');
	$role->remove_cap('read_prsp_record');					// Records
	$role->remove_cap('read_private_prsp_records');
	$role->remove_cap('edit_prsp_record');
	$role->remove_cap('edit_prsp_records');
	$role->remove_cap('edit_others_prsp_records');
	$role->remove_cap('edit_published_prsp_records');
	$role->remove_cap('publish_prsp_records');
	$role->remove_cap('delete_prsp_records');
	$role->remove_cap('delete_others_prsp_records');
	$role->remove_cap('delete_private_prsp_records');
	$role->remove_cap('delete_published_prsp_records');
	$role->remove_cap('create_prsp_records');
	$role->remove_cap('read_prsp_exhibit');					// Exhibits
	$role->remove_cap('read_prsp_exhibits');
	$role->remove_cap('read_private_prsp_exhibits');
	$role->remove_cap('edit_prsp_exhibit');
	$role->remove_cap('edit_prsp_exhibits');
	$role->remove_cap('edit_others_prsp_exhibits');
	$role->remove_cap('edit_published_prsp_exhibits');
	$role->remove_cap('publish_prsp_exhibits');
	$role->remove_cap('delete_prsp_exhibits');
	$role->remove_cap('delete_others_prsp_exhibits');
	$role->remove_cap('delete_private_prsp_exhibits');
	$role->remove_cap('delete_published_prsp_exhibits');
	$role->remove_cap('create_prsp_exhibits');
	$role->remove_cap('read_prsp_map');						// Maps
	$role->remove_cap('read_private_prsp_maps');
	$role->remove_cap('edit_prsp_map');
	$role->remove_cap('edit_prsp_maps');
	$role->remove_cap('edit_others_prsp_maps');
	$role->remove_cap('edit_published_prsp_maps');
	$role->remove_cap('publish_prsp_maps');
	$role->remove_cap('delete_prsp_maps');
	$role->remove_cap('delete_others_prsp_maps');
	$role->remove_cap('delete_private_prsp_maps');
	$role->remove_cap('delete_published_prsp_maps');
	$role->remove_cap('create_prsp_maps');
	$role->remove_cap('read_prsp_prspctv');					// Perspectives
	$role->remove_cap('read_private_prsp_prspctvs');
	$role->remove_cap('edit_prsp_prspctv');
	$role->remove_cap('edit_prsp_prspctvs');
	$role->remove_cap('edit_others_prsp_prspctvs');
	$role->remove_cap('edit_published_prsp_prspctvs');
	$role->remove_cap('publish_prsp_prspctvs');
	$role->remove_cap('delete_prsp_prspctvs');
	$role->remove_cap('delete_others_prsp_prspctvs');
	$role->remove_cap('delete_private_prsp_prspctvs');
	$role->remove_cap('delete_published_prsp_prspctvs');
	$role->remove_cap('create_prsp_prspctvs');
} // prospect_deactivate()


register_activation_hook(__FILE__, 'prospect_activate');
register_deactivation_hook(__FILE__, 'prospect_deactivate');


	// PURPOSE: Code to run on init of WordPress
function prospect_init()
{
	prospect_register_post_types();
} // prospect_init()

add_action('init', 'prospect_init');


require_once plugin_dir_path(__FILE__).'php/class-prospect.php';

function run_prospect()
{ 
    $prospect = new Prospect();
    $prospect->run();
} // run_prospect()
 
run_prospect();
