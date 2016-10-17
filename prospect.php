<?php
/*
 * Plugin Name:       Prospect
 * Plugin URI:        https://prospect.web.unc.edu/
 * Description:       Digital Humanities platform for visualizing curated collections
 * Version:           1.6.3
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


	// PURPOSE: Return a text value based on the Attribute whose ID is $att_id in $att_array
function get_att_val($att_defs, $att_id, $att_array)
{
	$att_def = $att_defs[$att_id];
	$att_val = $att_array[$att_id];
	switch ($att_def->t) {
	case 'V':
	case 'g':
		return implode(", ", $att_val);
	case 'T':
	case 'N':
		return $att_val;
	case 'D':
		if ($att_val == '?') {
			return __('(uncertain)', 'prospect');
		}
		$date_string = '';
		$date_part = $att_val['min'];
		if (!isset($att_val['max'])) { // just a single date
			if ($date_part['f']) {
				$date_string = __('about', 'prospect').' ';
			}
			$date_string .= $date_part['y'];
			if (isset($date_part['m'])) {
				$date_string .= '-'.$date_part['m'];
				if (isset($date_part['d'])) {
					$date_string .= '-'.$date_part['d'];
				}
			}
		} else {	// from and to
			if ($date_part['f']) {
				$date_string = __('about', 'prospect').' ';
			}
			$date_string .=  $date_part['y'];
			if (isset($date_part['m'])) {
				$date_string .= '-'.$date_part['m'];
				if (isset($date_part['d'])) {
					$date_string .= '-'.$date_part['d'];
				}
			}

			$date_part = $att_val['max'];
			$date_string .= ' '.__('to', 'prospect').' ';
			if ($date_part == 'open') {
				$date_string .= __('now', 'prospect').' ';
			} else {
				if ($date_part['f']) {
					$date_string .= __('about', 'prospect').' ';
				}
				$date_string .= $date_part['y'];
				if (isset($date_part['m'])) {
					$date_string .= '-'.$date_part['m'];
					if (isset($date_part['d'])) {
						$date_string .= '-'.$date_part['d'];
					}
				}
			} // define to date
		} // from and to
		return $date_string;
	} // switch Attribute type
} // get_att_val()

	// PURPOSE: Generates Prospect shortcode for plain HTML views
function tmplt_shortcode($atts)
{
	$a = shortcode_atts( array(
			'template' => null,			// template id (required)
			'display' => 'list',		// display type (list, cards, images)
			'image_attr' => null,		// attribute id of image to be displayed (optional)
			'content_attr' => null,		// attribute id of additional content to be displayed (optional)	
			'filter_attr_id' => null,			// filter attribute id (optional)
			'filter_attr_val' => null,			// filter attribute value (optional)
			'filter_attr_comp' => '=='		// filter attribute comparison (==, !=)
	), $atts);

		// Return null if no template id is provided
	if ($a['template'] == null) return 'Error: Please provide a template ID.';				// *** Should an error message be provided?

	try {
		$the_template = new ProspectTemplate(false, $a['template'], true, true, false, true);
	} catch (NotFoundException $e) {
		return 'Error: Template not found with provided ID "'. $a['template'] .'".';
	}

		// Stores generated html to be returned
	$html = '<div class="prospect-shortcode">';

		// Styles
	$html .= '<style type="text/css" scoped>';
	$html .= '	/* Creates Flex style for tiled cards */
			.prospect-cards {
				padding: 4px;
			
				display: -webkit-flex; /* Safari */
				display: flex;
			
				-webkit-flex-direction: row; /* Safari */
				flex-direction:         row;
			
				-webkit-flex-wrap: wrap; /* Safari */
				flex-wrap:         wrap;
			
				-webkit-align-items: flex-start; /* Safari */
				align-items:         flex-start;
			
				-webkit-align-content: flex-start; /* Safari */
			    align-content:         flex-start;
			}

			div.prospect-card {
				margin: 3px;
				border: black solid 1px;
				box-shadow: 3px 2px 3px rgba(0, 0, 0, 0.3);
				padding: 3px;
				overflow: hidden;
				line-height: 1.1em;
			
					/* Flex properties as item within container */
				-webkit-flex-grow: 1; /* Safari */
				flex-grow: 1;
			
				-webkit-flex-shrink: 1; /* Safari */
				flex-shrink:         1;
			
				-webkit-flex-basis: 250px; /* Safari */
				flex-basis:         250px;
			
					/* Flex properties as a container */
				display: -webkit-flex; /* Safari */
				display: flex;
			
				-webkit-flex-direction: row; /* Safari */
				flex-direction:         row;
			
				-webkit-flex-wrap: wrap; /* Safari */
				flex-wrap:         wrap;
			
				-webkit-align-items: flex-start; /* Safari */
				align-items:         flex-start;
			
				-webkit-align-content: flex-start; /* Safari */
			    align-content:         flex-start;
			
				margin-bottom: 5px;
			}

			img.prospect-thumb {
				vertical-align: middle;
			
				width: 80px;
				margin-right: 5px;
			}

			p.prospect-card-text {
				margin: 2px;
				vertical-align: top;
			
				-webkit-margin-before: 0;
				-webkit-margin-after: 0;
				-webkit-margin-start: 0;
				-webkit-margin-end: 0;
			
					/* Flex properties as item within container */
				-webkit-flex-grow: 3; /* Safari */
				flex-grow: 3;
			
				-webkit-flex-shrink: 3; /* Safari */
				flex-shrink:         3;
			
				-webkit-flex-basis: 170px; /* Safari */
				flex-basis:         170px;
			}

			p.prospect-card-text span.title {
				font-weight: bold;
			}

			p.prospect-card-text span.content {
				font-size: .8em;
				font-style: italic;
			}

				/* Styles for Image cards with hover caption */
			figure.prospect {
				max-width: 200px;
				max-height: 200px;
				overflow: hidden;
				position: relative;
				display: inline-block;
				vertical-align: top;
				border: 5px solid #fff;
				box-shadow: 0 0 5px #ddd;
				margin: 1em;
			}

			figure.prospect > figcaption.prospect {
				position: absolute;
				left: 0; right: 0;
				top: 0; bottom: 0;
			
				text-align: center;
				font-weight: bold;
				line-height: 1.2em;
				padding-bottom: .2em;
				width: 100%;
				height: 100%;
				display: table;
			}

			figure.prospect > figcaption.prospect > div {
				display: table-cell;
				vertical-align: middle;
				position: relative;
				top: 20px;
				opacity: 0;
				color: #2c3e50;
			}

			figure.prospect > figcaption.prospect div:after {
				position: absolute;
				left: 0; right: 0;
				bottom: 40%;
				text-align: center;
				margin: auto;
				width: 0%;
				height: 2px;
				background: #2c3e50;
			}

			figure.prospect img {
				width: 100%;
				height: 100%;
			
				-webkit-transition: all 0.5s linear;
			    transition: all 0.5s linear;
				-webkit-transform: scale3d(1, 1, 1);
			    transform: scale3d(1, 1, 1);
			}

			figure.prospect:hover > figcaption.prospect {
			/*	background: rgba(255,255,255,0.3); */
				background: grey;
			}

			figure.prospect:hover > figcaption.prospect > div {
				opacity: 1;
				top: 0;
				color: white;
			}

			figure.prospect:hover > figcaption.prospect  span.content {
				font-size: .8em;
				font-style: italic;
			}

			figure.prospect > figcaption.prospect:hover div:after {
				width: 50%;
			}

			figure.prospect:hover img {
				-webkit-transform: scale3d(1.2, 1.2, 1);
			    transform: scale3d(1.2, 1.2, 1);
			}


			h1.prospect {
				margin-top: 1em;
				margin-bottom: .2em;
				margin-left: 0;
				margin-right: 0;
			}

			h2.prospect {
				margin-top: .4em;
				margin-bottom: .1em;
				margin-left: 0;
				margin-right: 0;
			}

			p.prospect {
				line-height: 1.2em;
				margin-top: .3em;
				margin-bottom: .1em;
				margin-left: 0;
				margin-right: 0;
			}

				/* Style for content Attribute in Simply List display */
			p.prospect-list-content {
				font-size: .75em;
				font-style: italic;
			}

			div.prospect-no-wrap {
				margin: 3px;
				padding: 2px;
				white-space: nowrap;
			}

			div.prospect-no-wrap img, div.prospect-no-wrap p {
				display: inline-block;
				padding-top: 3px;
				padding-right: 4px;
				vertical-align: top;
			}';
	$html .= '</style>';
			
	$html .= '<h1 class="prospect">'.$the_template->def->l.'</h1><hr/>';

		// Open any enclosing DIVs
	switch($a['display']) {
	case 'list':
		break;
	case 'cards':
		$html .= '<div class="prospect-cards">';
		break;
	case 'images':
		break;
	}

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
							'value' => $a['template'],
							'compare' => '=')
				);
	$query = new WP_Query($args);
	if ($query->have_posts()) {
		foreach ($query->posts as $rec) {
			$the_rec = new ProspectRecord(true, $rec->ID, false, $the_template, $d_templates, $assoc_atts);

			switch ($a['display']) {
			case 'list':
				$html .= '<h2 class="prospect"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></h2>';
				$html .= '<div class="prospect-no-wrap">';
				if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
					$html .= '<img class="prospect-thumb" src="'.$the_rec->att_data[$a['image_attr']].'">';
				}
				if ($a['content_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
					$html .= '<p class="prospect-list-content">'.get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</p>';
				}
				$html .= '</div>';
				break;
			case 'cards':
				$html .= '<div class="prospect-card">';
				if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
					$html .= '<img class="prospect-thumb" src="'.$the_rec->att_data[$a['image_attr']].'">';
				}
				$html .= '<p class="prospect-card-text"><span class="title"><a href="'.get_permalink($the_rec->post_id).'">'.$the_rec->label.'</a></span>';
				if ($a['content_attr'] != null && isset($the_rec->att_data[$a['content_attr']])) {
					$html .= '<br/><span class="content">'.get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</span>';
				}
				$html .= '</p></div>';
				break;
			case 'images':
				$html .= '<figure class="prospect">';
				$html .= '<a href="'.get_permalink($the_rec->post_id).'">';
				if ($a['image_attr'] != null && isset($the_rec->att_data[$a['image_attr']])) {
					$html .= '<img src="'.$the_rec->att_data[$a['image_attr']].'">';
				}
				$html .= '</a>';
				$html .= '<figcaption class="prospect"><div>'.$the_rec->label;
				if ($a['content_attr'] != null && isset($the_rec->att_data[$a['content_attr']])) {
					$html .= '<br/><span class="content">'.get_att_val($assoc_atts, $a['content_attr'], $the_rec->att_data).'</span>';
				}
				$html .= '</div></figcaption>';
				$html .= '</figure>';
				break;
			}


		} // foreach
	} // if have_posts

		// Close any enclosing DIV
	switch($a['display']) {
	case 'list':
		break;
	case 'cards':
		$html .= '</div>';
		break;
	case 'images':
		break;
	}

	$html .= '</div>';	// prospect-shortcode 

	return $html;
}
add_shortcode('prospect', 'tmplt_shortcode');


function run_prospect()
{
	$prospect = new Prospect();
	$prospect->run();
} // run_prospect()

run_prospect();
