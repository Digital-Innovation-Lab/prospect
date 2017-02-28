<?php
/*
 * Plugin Name:       Prospect
 * Plugin URI:        https://prospect.unc.edu/
 * Description:       Digital Humanities platform for visualizing curated collections
 * Version:           1.8.6
 * Author:            msnewton, kvnjcby, Breon Williams, Digital Innovation Lab, UNC-CH
 * Text Domain:       prospect
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path:       /languages
 */

function prospect_register_post_types()
{
		// Register Attribute Custom Post Type
	$labels = array(
		'name' => __('Attributes', 'prospect'),
		'singular_name' => __('Attribute', 'prospect'),
		'add_new' => __('Add Attribute', 'prospect'),
		'add_new_item' => __('Add New Attribute', 'prospect'),
		'edit_item' => __('Edit Attribute', 'prospect'),
		'new_item' => __('New Attribute', 'prospect'),
		'all_items' => __('Attributes', 'prospect'),
		'view_item' => __('View Attribute', 'prospect'),
		'search_items' => __('Search Attributes', 'prospect'),
		'not_found' =>  __('No Attributes found', 'prospect'),
		'not_found_in_trash' => __('No Attributes found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Attributes', 'prospect')
	);
	$args = array(
		'labels' => $labels,
		'public' => true,
		'publicly_queryable' => true,
		'show_ui' => true,
		'show_in_menu' => 'prsp-top-level-handle',
		'rewrite' => array('slug' => 'prsp-attribute', 'with_front' => FALSE),
		'has_archive' => false,
		'hierarchical' => false,
		'menu_position' => null,
		'supports' => array('title', 'thumbnail', 'revisions'),
		'capability_type' => array('prsp_attribute','prsp_attributes'),
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_attributes',
			'edit_post' => 'edit_prsp_attribute',
			'edit_posts' => 'edit_prsp_attributes',
			'edit_others_posts' => 'edit_other_prsp_attributes',
			'publish_posts' => 'publish_prsp_attributes',
			'read_post' => 'read_prsp_attribute',
			'read_private_posts' => 'read_private_prsp_attributes',
			'delete_post' => 'delete_prsp_attribute'
		),
		'show_in_rest' => true,
		'rest_controller_class' => 'WP_REST_Posts_Controller'
	);
	register_post_type('prsp-attribute', $args);

		// Register Template Custom Post Type
	$labels = array(
		'name' => __('Templates', 'prospect'),
		'singular_name' => __('Template', 'prospect'),
		'add_new' => __('Add Template', 'prospect'),
		'add_new_item' => __('Add New Template', 'prospect'),
		'edit_item' => __('Edit Template', 'prospect'),
		'new_item' => __('New Template', 'prospect'),
		'all_items' => __('Templates', 'prospect'),
		'view_item' => __('View Template', 'prospect'),
		'search_items' => __('Search Templates', 'prospect'),
		'not_found' =>  __('No Templates found', 'prospect'),
		'not_found_in_trash' => __('No Templates found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Templates', 'prospect')
	);
	$args = array(
		'labels' => $labels,
		'public' => true,
		'publicly_queryable' => true,
		'show_ui' => true,
		'show_in_menu' => 'prsp-top-level-handle',
		'rewrite' => array('slug' => 'prsp-template', 'with_front' => FALSE),
		'has_archive' => false,
		'hierarchical' => false,
		'menu_position' => null,
		'supports' => array('title', 'thumbnail', 'revisions'),
		'capability_type' => array('prsp_template','prsp_templates'),
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_templates',
			'edit_post' => 'edit_prsp_template',
			'edit_posts' => 'edit_prsp_templates',
			'edit_others_posts' => 'edit_other_prsp_templates',
			'publish_posts' => 'publish_prsp_templates',
			'read_post' => 'read_prsp_template',
			'read_private_posts' => 'read_private_prsp_templates',
			'delete_post' => 'delete_prsp_template'
		),
		'show_in_rest' => true,
		'rest_controller_class' => 'WP_REST_Posts_Controller'
	);
	register_post_type('prsp-template', $args);

		// Register Record Custom Post Type
	$labels = array(
		'name' => __('Records', 'prospect'),
		'singular_name' => __('Record', 'prospect'),
		'add_new' => __('Add Record', 'prospect'),
		'add_new_item' => __('Add New Record', 'prospect'),
		'edit_item' => __('Edit Record', 'prospect'),
		'new_item' => __('New Record', 'prospect'),
		'all_items' => __('Records', 'prospect'),
		'view_item' => __('View Record', 'prospect'),
		'search_items' => __('Search Records', 'prospect'),
		'not_found' =>  __('No Records found', 'prospect'),
		'not_found_in_trash' => __('No Records found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Records', 'prospect')
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
		'supports' => array('title', 'editor', 'thumbnail', 'revisions', 'comments'),
		'taxonomies' => array('category', 'post_tag'),
		'capability_type' => array('prsp_record','prsp_records'),
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_records',
			'edit_post' => 'edit_prsp_record',
			'edit_posts' => 'edit_prsp_records',
			'edit_others_posts' => 'edit_other_prsp_records',
			'publish_posts' => 'publish_prsp_records',
			'read_post' => 'read_prsp_record',
			'read_private_posts' => 'read_private_prsp_records',
			'delete_post' => 'delete_prsp_record'
		),
		'show_in_rest' => true,
		'rest_controller_class' => 'WP_REST_Posts_Controller'
	);
	register_post_type('prsp-record', $args);

		// Register Exhibit Custom Post Type
	$labels = array(
		'name' => __('Exhibits', 'prospect'),
		'singular_name' => __('Exhibit', 'prospect'),
		'add_new' => __('Add Exhibit', 'prospect'),
		'add_new_item' => __('Add New Exhibit', 'prospect'),
		'edit_item' => __('Edit Exhibit', 'prospect'),
		'new_item' => __('New Exhibit', 'prospect'),
		'all_items' => __('Exhibits', 'prospect'),
		'view' => __('View', 'prospect'),
		'view_item' => __('View Exhibit', 'prospect'),
		'search_items' => __('Search Exhibits', 'prospect'),
		'not_found' =>  __('No Exhibits found', 'prospect'),
		'not_found_in_trash' => __('No Exhibits found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Exhibits', 'prospect')
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
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_exhibits',
			'edit_post' => 'edit_prsp_exhibit',
			'edit_posts' => 'edit_prsp_exhibits',
			'edit_others_posts' => 'edit_other_prsp_exhibits',
			'publish_posts' => 'publish_prsp_exhibits',
			'read_post' => 'read_prsp_exhibit',
			'read_private_posts' => 'read_private_prsp_exhibits',
			'delete_post' => 'delete_prsp_exhibit'
		)
	);
	register_post_type('prsp-exhibit', $args);

		// Register Map Custom Post Type
	$labels = array(
		'name' => __('Maps', 'prospect'),
		'singular_name' => __( 'Map', 'prospect'),
		'add_new' => __('Add New', 'prospect'),
		'add_new_item' => __('Add New Map', 'prospect'),
		'edit_item' => __('Edit Map', 'prospect'),
		'new_item' => __('New Map', 'prospect'),
		'all_items' => __('Map Library', 'prospect'),
		'view' => __('View', 'prospect'),
		'view_item' => __('View Map', 'prospect'),
		 'search_items' => __('Search Maps', 'prospect'),
		'not_found' =>  __('No maps found', 'prospect'),
		'not_found_in_trash' => __('No maps found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Map Library', 'prospect')
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
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_maps',
			'edit_post' => 'edit_prsp_map',
			'edit_posts' => 'edit_prsp_maps',
			'edit_others_posts' => 'edit_other_prsp_maps',
			'publish_posts' => 'publish_prsp_maps',
			'read_post' => 'read_prsp_map',
			'read_private_posts' => 'read_private_prsp_maps',
			'delete_post' => 'delete_prsp_map'
		)
	);
	register_post_type('prsp-map', $args);

		// Register Perspective Custom Post Type
	$labels = array(
		'name' => __('Perspectives', 'prospect'),
		'singular_name' => __('Perspective', 'prospect'),
		'add_new' => __('Add New', 'prospect'),
		'add_new_item' => __('Add New Perspective', 'prospect'),
		'edit_item' => __('Edit Perspective', 'prospect'),
		'new_item' => __('New Perspective', 'prospect'),
		'all_items' => __('Perspectives', 'prospect'),
		'view' => __('View', 'prospect'),
		'view_item' => __('View Perspective', 'prospect'),
		 'search_items' => __('Search Perspectives', 'prospect'),
		'not_found' =>  __('No Perspectives found', 'prospect'),
		'not_found_in_trash' => __('No Perspective found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Perspectives', 'prospect')
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
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_prspctvs',
			'edit_post' => 'edit_prsp_prspctv',
			'edit_posts' => 'edit_prsp_prspctvs',
			'edit_others_posts' => 'edit_other_prsp_prspctvs',
			'publish_posts' => 'publish_prsp_prspctvs',
			'read_post' => 'read_prsp_prspctv',
			'read_private_posts' => 'read_private_prsp_prspctvs',
			'delete_post' => 'delete_prsp_prspctv'
		)
	);
	register_post_type('prsp-prspctv', $args);

		// Register Volume Custom Post Type
	$labels = array(
		'name' => __('Volumes', 'prospect'),
		'singular_name' => __('Volume', 'prospect'),
		'add_new' => __('Add Volume', 'prospect'),
		'add_new_item' => __('Add New Volume', 'prospect'),
		'edit_item' => __('Edit Volume', 'prospect'),
		'new_item' => __('New Volume', 'prospect'),
		'all_items' => __('Volumes', 'prospect'),
		'view' => __('View', 'prospect'),
		'view_item' => __('View Volume', 'prospect'),
		'search_items' => __('Search Volumes', 'prospect'),
		'not_found' =>  __('No Volumes found', 'prospect'),
		'not_found_in_trash' => __('No Volumes found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Volumes', 'prospect')
	);
	$args = array(
		'labels' => $labels,
		'public' => true,
		'show_ui' => true,
		'show_in_menu' => 'prsp-top-level-handle',
		'rewrite' => array('slug' => 'prsp-volume', 'with_front' => FALSE),
		'has_archive' => false,
		'hierarchical' => false,
		'menu_position' => null,
		'supports' => array('title', 'editor', 'thumbnail', 'revisions'),
		'capability_type' => array('prsp_volume','prsp_volumes'),
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_volumes',
			'edit_post' => 'edit_prsp_volume',
			'edit_posts' => 'edit_prsp_volumes',
			'edit_others_posts' => 'edit_other_prsp_volumes',
			'publish_posts' => 'publish_prsp_volumes',
			'read_post' => 'read_prsp_volume',
			'read_private_posts' => 'read_private_prsp_volumes',
			'delete_post' => 'delete_prsp_volume'
		)
	);
	register_post_type('prsp-volume', $args);

		// Register Reading Custom Post Type
	$labels = array(
		'name' => __('Readings', 'prospect'),
		'singular_name' => __('Reading', 'prospect'),
		'add_new' => __('Add New', 'prospect'),
		'add_new_item' => __('Add New Reading', 'prospect'),
		'edit_item' => __('Edit Reading', 'prospect'),
		'new_item' => __('New Reading', 'prospect'),
		'all_items' => __('Readings', 'prospect'),
		'view' => __('View', 'prospect'),
		'view_item' => __('View Reading', 'prospect'),
		 'search_items' => __('Search Readings', 'prospect'),
		'not_found' =>  __('No Readings found', 'prospect'),
		'not_found_in_trash' => __('No Reading found in Trash', 'prospect'),
		'parent_item_colon' => '',
		'menu_name' => __('Readings', 'prospect')
	);
	$args = array(
		'labels' => $labels,
		'public' => true,
		'show_ui' => true,
		'show_in_menu' => 'prsp-top-level-handle',
		'rewrite' => array('slug' => 'prsp-reading', 'with_front' => FALSE),
		'has_archive' => false,
		'hierarchical' => false,
		'menu_position' => null,
		'supports' => array('title', 'thumbnail', 'revisions'),
		'capability_type' => array('prsp_reading','prsp_readings'),
		'map_meta_cap' => true,
		'capabilities' => array(
			'create_posts' => 'edit_prsp_readings',
			'edit_post' => 'edit_prsp_reading',
			'edit_posts' => 'edit_prsp_readings',
			'edit_others_posts' => 'edit_other_prsp_readings',
			'publish_posts' => 'publish_prsp_readings',
			'read_post' => 'read_prsp_reading',
			'read_private_posts' => 'read_private_prsp_readings',
			'delete_post' => 'delete_prsp_reading'
		)
	);
	register_post_type('prsp-reading', $args);
} // prospect_register_post_types()


function prospect_activate()
{
	prospect_register_post_types();
	flush_rewrite_rules();

	$role = get_role('contributor');
	$role->add_cap('read_prsp_record');						// Records
	$role->add_cap('edit_prsp_record');
	$role->add_cap('edit_prsp_records');
	$role->add_cap('delete_prsp_record');
	$role->add_cap('delete_prsp_records');
	$role->add_cap('create_prsp_records');
	$role->remove_cap('publish_prsp_record');					// Don't allow publishing Records
	$role->remove_cap('publish_prsp_records');
	$role->add_cap('read_prsp_exhibit');					// Exhibits
	$role->add_cap('read_prsp_exhibits');
	$role->add_cap('read_prsp_volume');						// Volumes
	$role->add_cap('read_prsp_volumes');

	$role = get_role('editor');
	$role->add_cap('read_prsp_attribute');					// Attributes
	$role->add_cap('read_prsp_template');					// Templates
	$role->add_cap('read_prsp_record');						// Records
	$role->add_cap('read_private_prsp_records');
	$role->add_cap('edit_prsp_record');
	$role->add_cap('edit_prsp_records');
	$role->add_cap('edit_other_prsp_records');
	$role->add_cap('edit_others_prsp_records');
	$role->add_cap('edit_published_prsp_records');
	$role->add_cap('publish_prsp_records');
	$role->add_cap('delete_prsp_record');
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
	$role->add_cap('edit_other_prsp_prspctvs');
	$role->add_cap('edit_others_prsp_prspctvs');
	$role->add_cap('edit_published_prsp_prspctvs');
	$role->add_cap('publish_prsp_prspctvs');
	$role->add_cap('delete_prsp_prspctvs');
	$role->add_cap('delete_others_prsp_prspctvs');
	$role->add_cap('delete_private_prsp_prspctvs');
	$role->add_cap('delete_published_prsp_prspctvs');
	$role->add_cap('create_prsp_prspctvs');
	$role->add_cap('read_prsp_volume');						// Volumes
	$role->add_cap('read_prsp_volumes');
	$role->add_cap('read_prsp_prspctv');					// Readings
	$role->add_cap('read_private_prsp_readings');
	$role->add_cap('edit_prsp_reading');
	$role->add_cap('edit_prsp_readings');
	$role->add_cap('edit_other_prsp_readings');
	$role->add_cap('edit_others_prsp_readings');
	$role->add_cap('edit_published_prsp_readings');
	$role->add_cap('publish_prsp_readings');
	$role->add_cap('delete_prsp_readings');
	$role->add_cap('delete_others_prsp_readings');
	$role->add_cap('delete_private_prsp_readings');
	$role->add_cap('delete_published_prsp_readings');
	$role->add_cap('create_prsp_readings');

	$role = get_role('administrator');
	$role->add_cap('read_prsp_attribute');					// Attributes
	$role->add_cap('read_private_prsp_attributes');
	$role->add_cap('edit_prsp_attribute');
	$role->add_cap('edit_prsp_attributes');
	$role->add_cap('edit_other_prsp_attributes');
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
	$role->add_cap('edit_other_prsp_templates');
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
	$role->add_cap('edit_other_prsp_records');
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
	$role->add_cap('edit_other_prsp_exhibits');
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
	$role->add_cap('edit_other_prsp_maps');
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
	$role->add_cap('edit_other_prsp_prspctvs');
	$role->add_cap('edit_others_prsp_prspctvs');
	$role->add_cap('edit_published_prsp_prspctvs');
	$role->add_cap('publish_prsp_prspctvs');
	$role->add_cap('delete_prsp_prspctvs');
	$role->add_cap('delete_others_prsp_prspctvs');
	$role->add_cap('delete_private_prsp_prspctvs');
	$role->add_cap('delete_published_prsp_prspctvs');
	$role->add_cap('create_prsp_prspctvs');
	$role->add_cap('read_prsp_volume');						// Volumes
	$role->add_cap('read_prsp_volumes');
	$role->add_cap('read_private_prsp_volumes');
	$role->add_cap('edit_prsp_volume');
	$role->add_cap('edit_prsp_volumes');
	$role->add_cap('edit_other_prsp_volumes');
	$role->add_cap('edit_others_prsp_volumes');
	$role->add_cap('edit_published_prsp_volumes');
	$role->add_cap('publish_prsp_volumes');
	$role->add_cap('delete_prsp_volumes');
	$role->add_cap('delete_others_prsp_volumes');
	$role->add_cap('delete_private_prsp_volumes');
	$role->add_cap('delete_published_prsp_volumes');
	$role->add_cap('create_prsp_volumes');
	$role->add_cap('read_prsp_prspctv');					// Readings
	$role->add_cap('read_private_prsp_readings');
	$role->add_cap('edit_prsp_reading');
	$role->add_cap('edit_prsp_readings');
	$role->add_cap('edit_other_prsp_readings');
	$role->add_cap('edit_others_prsp_readings');
	$role->add_cap('edit_published_prsp_readings');
	$role->add_cap('publish_prsp_readings');
	$role->add_cap('delete_prsp_readings');
	$role->add_cap('delete_others_prsp_readings');
	$role->add_cap('delete_private_prsp_readings');
	$role->add_cap('delete_published_prsp_readings');
	$role->add_cap('create_prsp_readings');
} // prospect_activate()

function prospect_deactivate()
{
	$role = get_role('contributor');
	$role->remove_cap('read_prsp_record');					// Records
	$role->remove_cap('edit_prsp_record');
	$role->remove_cap('edit_prsp_records');
	$role->remove_cap('delete_prsp_record');
	$role->remove_cap('delete_prsp_records');
	$role->remove_cap('create_prsp_records');
	$role->remove_cap('read_prsp_exhibit');					// Exhibits
	$role->remove_cap('read_prsp_exhibits');
	$role->remove_cap('read_prsp_volume');					// Volumes
	$role->remove_cap('read_prsp_volumes');

	$role = get_role('editor');
	$role->remove_cap('read_prsp_attribute');				// Attributes
	$role->remove_cap('read_prsp_template');				// Templates
	$role->remove_cap('read_prsp_record');					// Records
	$role->remove_cap('read_private_prsp_records');
	$role->remove_cap('edit_prsp_record');
	$role->remove_cap('edit_prsp_records');
	$role->remove_cap('edit_other_prsp_records');
	$role->remove_cap('edit_others_prsp_records');
	$role->remove_cap('edit_published_prsp_records');
	$role->remove_cap('publish_prsp_records');
	$role->remove_cap('delete_prsp_record');
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
	$role->remove_cap('edit_other_prsp_prspctvs');
	$role->remove_cap('edit_others_prsp_prspctvs');
	$role->remove_cap('edit_published_prsp_prspctvs');
	$role->remove_cap('publish_prsp_prspctvs');
	$role->remove_cap('delete_prsp_prspctvs');
	$role->remove_cap('delete_others_prsp_prspctvs');
	$role->remove_cap('delete_private_prsp_prspctvs');
	$role->remove_cap('delete_published_prsp_prspctvs');
	$role->remove_cap('create_prsp_prspctvs');
	$role->remove_cap('read_prsp_volume');					// Volumes
	$role->remove_cap('read_prsp_volumes');
	$role->remove_cap('read_prsp_reading');					// Perspectives
	$role->remove_cap('read_private_prsp_readings');
	$role->remove_cap('edit_prsp_reading');
	$role->remove_cap('edit_prsp_readings');
	$role->remove_cap('edit_other_prsp_readings');
	$role->remove_cap('edit_others_prsp_readings');
	$role->remove_cap('edit_published_prsp_readings');
	$role->remove_cap('publish_prsp_readings');
	$role->remove_cap('delete_prsp_readings');
	$role->remove_cap('delete_others_prsp_readings');
	$role->remove_cap('delete_private_prsp_readings');
	$role->remove_cap('delete_published_prsp_readings');
	$role->remove_cap('create_prsp_readings');

	$role = get_role('administrator');
	$role->remove_cap('read_prsp_attribute');				// Attributes
	$role->remove_cap('read_private_prsp_attributes');
	$role->remove_cap('edit_prsp_attribute');
	$role->remove_cap('edit_prsp_attributes');
	$role->remove_cap('edit_other_prsp_attributes');
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
	$role->remove_cap('edit_other_prsp_templates');
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
	$role->remove_cap('edit_other_prsp_records');
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
	$role->remove_cap('edit_other_prsp_exhibits');
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
	$role->remove_cap('edit_other_prsp_maps');
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
	$role->remove_cap('edit_other_prsp_prspctvs');
	$role->remove_cap('edit_others_prsp_prspctvs');
	$role->remove_cap('edit_published_prsp_prspctvs');
	$role->remove_cap('publish_prsp_prspctvs');
	$role->remove_cap('delete_prsp_prspctvs');
	$role->remove_cap('delete_others_prsp_prspctvs');
	$role->remove_cap('delete_private_prsp_prspctvs');
	$role->remove_cap('delete_published_prsp_prspctvs');
	$role->remove_cap('create_prsp_prspctvs');
	$role->remove_cap('read_prsp_volume');					// Volumes
	$role->remove_cap('read_prsp_volumes');
	$role->remove_cap('read_private_prsp_volumes');
	$role->remove_cap('edit_prsp_volume');
	$role->remove_cap('edit_prsp_volumes');
	$role->remove_cap('edit_other_prsp_volumes');
	$role->remove_cap('edit_others_prsp_volumes');
	$role->remove_cap('edit_published_prsp_volumes');
	$role->remove_cap('publish_prsp_volumes');
	$role->remove_cap('delete_prsp_volumes');
	$role->remove_cap('delete_others_prsp_volumes');
	$role->remove_cap('delete_private_prsp_volumes');
	$role->remove_cap('delete_published_prsp_volumes');
	$role->remove_cap('create_prsp_volumes');
	$role->remove_cap('read_prsp_reading');					// Perspectives
	$role->remove_cap('read_private_prsp_readings');
	$role->remove_cap('edit_prsp_reading');
	$role->remove_cap('edit_prsp_readings');
	$role->remove_cap('edit_other_prsp_readings');
	$role->remove_cap('edit_others_prsp_readings');
	$role->remove_cap('edit_published_prsp_readings');
	$role->remove_cap('publish_prsp_readings');
	$role->remove_cap('delete_prsp_readings');
	$role->remove_cap('delete_others_prsp_readings');
	$role->remove_cap('delete_private_prsp_readings');
	$role->remove_cap('delete_published_prsp_readings');
	$role->remove_cap('create_prsp_readings');
} // prospect_deactivate()


register_activation_hook(__FILE__, 'prospect_activate');
register_deactivation_hook(__FILE__, 'prospect_deactivate');


	// PURPOSE: Code to run on init of WordPress
function prospect_init()
{
	prospect_register_post_types();

	// show_admin_bar(false);
	add_filter('show_admin_bar', '__return_false');
} // prospect_init()

add_action('init', 'prospect_init');


require_once plugin_dir_path(__FILE__).'php/class-prospect.php';

if (!class_exists('CSVImporterImprovedPlugin')) {
	require_once(dirname(__FILE__) . '/lib/csv-importer/csv_importer.php');
}

add_shortcode('prospect', array('ProspectTemplate', 'tmplt_shortcode'));

function run_prospect()
{
	$prospect = new Prospect();
	$prospect->run();
} // run_prospect()

run_prospect();
