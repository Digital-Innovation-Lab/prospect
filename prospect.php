<?php
/*
 * Plugin Name:       Prospect
 * Plugin URI:        
 * Description:       Digital Humanities platform for visualizing curated collections
 * Version:           0.1
 * Author:            Michael Newton, Digital Innovation Lab, UNC-CH
 * Author URI:        
 * Text Domain:       dil-prospect
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path:       /languages
 */

// PURPOSE: Registers the plugin with WordPress and sets everything in motion

function prospect_activate()
{
		$role = get_role('contributor');
		$role->add_cap('read_prsp_record');					// Records
		$role->add_cap('edit_prsp_record');
		$role->add_cap('edit_prsp_records');
		$role->add_cap('delete_prsp_records');
		$role->add_cap('create_prsp_records');
		$role->add_cap('read_prsp_exhibit');				// Exhibits
		$role->add_cap('read_prsp_exhibits');

		$role = get_role('editor');
		$role->add_cap('read_prsp_attribute');				// Attributes
		$role->add_cap('read_prsp_template');				// Templates
		$role->add_cap('read_prsp_record');					// Records
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

		$role = get_role('administrator');
		$role->add_cap('read_prsp_attribute');				// Attributes
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
		$role->add_cap('read_prsp_templates');				// Templates
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
		$role->add_cap('read_prsp_record');					// Records
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
		$role->add_cap('create_prsp_rmaps');
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
		$role->remove_cap('create_prsp_rmaps');
} // prospect_deactivate()


register_activation_hook(__FILE__, 'prospect_activate');
register_deactivation_hook(__FILE__, 'prospect_deactivate');


require_once plugin_dir_path(__FILE__).'php/class-prospect.php';

function run_prospect()
{ 
    $prospect = new Prospect();
    $prospect->run();
} // run_prospect()
 
run_prospect();
