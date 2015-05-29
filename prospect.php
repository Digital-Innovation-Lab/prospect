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
		$role->add_cap('read_gig_record');					// Records
		$role->add_cap('edit_gig_record');
		$role->add_cap('edit_gig_records');
		$role->add_cap('delete_gig_records');
		$role->add_cap('create_gig_records');
		$role->add_cap('read_gig_exhibit');					// Exhibits
		$role->add_cap('read_gig_exhibits');

		$role = get_role('editor');
		$role->add_cap('read_gig_attribute');				// Attributes
		$role->add_cap('read_gig_template');				// Templates
		$role->add_cap('read_gig_record');					// Records
		$role->add_cap('read_private_gig_records');
		$role->add_cap('edit_gig_record');
		$role->add_cap('edit_gig_records');
		$role->add_cap('edit_others_gig_records');
		$role->add_cap('edit_published_gig_records');
		$role->add_cap('publish_gig_records');
		$role->add_cap('delete_gig_records');
		$role->add_cap('delete_others_gig_records');
		$role->add_cap('delete_private_gig_records');
		$role->add_cap('delete_published_gig_records');
		$role->add_cap('create_gig_records');
		$role->add_cap('read_gig_exhibit');					// Exhibits
		$role->add_cap('read_gig_exhibits');
		$role->add_cap('read_gig_map');						// Maps

		$role = get_role('administrator');
		$role->add_cap('read_gig_attribute');				// Attributes
		$role->add_cap('read_private_gig_attributes');
		$role->add_cap('edit_gig_attribute');
		$role->add_cap('edit_gig_attributes');
		$role->add_cap('edit_others_gig_attributes');
		$role->add_cap('edit_published_gig_attributes');
		$role->add_cap('publish_gig_attributes');
		$role->add_cap('delete_gig_attributes');
		$role->add_cap('delete_others_gig_attributes');
		$role->add_cap('delete_private_gig_attributes');
		$role->add_cap('delete_published_gig_attributes');
		$role->add_cap('create_gig_attributes');
		$role->add_cap('read_gig_templates');				// Templates
		$role->add_cap('read_private_gig_templates');
		$role->add_cap('edit_gig_template');
		$role->add_cap('edit_gig_templates');
		$role->add_cap('edit_others_gig_templates');
		$role->add_cap('edit_published_gig_templates');
		$role->add_cap('publish_gig_templates');
		$role->add_cap('delete_gig_templates');
		$role->add_cap('delete_others_gig_templates');
		$role->add_cap('delete_private_gig_templates');
		$role->add_cap('delete_published_gig_templates');
		$role->add_cap('create_gig_templates');
		$role->add_cap('read_gig_record');					// Records
		$role->add_cap('read_private_gig_records');
		$role->add_cap('edit_gig_record');
		$role->add_cap('edit_gig_records');
		$role->add_cap('edit_others_gig_records');
		$role->add_cap('edit_published_gig_records');
		$role->add_cap('publish_gig_records');
		$role->add_cap('delete_gig_records');
		$role->add_cap('delete_others_gig_records');
		$role->add_cap('delete_private_gig_records');
		$role->add_cap('delete_published_gig_records');
		$role->add_cap('create_gig_records');
		$role->add_cap('read_gig_exhibit');					// Exhibits
		$role->add_cap('read_gig_exhibits');
		$role->add_cap('read_private_gig_exhibits');
		$role->add_cap('edit_gig_exhibit');
		$role->add_cap('edit_gig_exhibits');
		$role->add_cap('edit_others_gig_exhibits');
		$role->add_cap('edit_published_gig_exhibits');
		$role->add_cap('publish_gig_exhibits');
		$role->add_cap('delete_gig_exhibits');
		$role->add_cap('delete_others_gig_exhibits');
		$role->add_cap('delete_private_gig_exhibits');
		$role->add_cap('delete_published_gig_exhibits');
		$role->add_cap('create_gig_exhibits');
		$role->add_cap('read_gig_map');						// Maps
		$role->add_cap('read_private_gig_maps');
		$role->add_cap('edit_gig_map');
		$role->add_cap('edit_gig_maps');
		$role->add_cap('edit_others_gig_maps');
		$role->add_cap('edit_published_gig_maps');
		$role->add_cap('publish_gig_maps');
		$role->add_cap('delete_gig_maps');
		$role->add_cap('delete_others_gig_maps');
		$role->add_cap('delete_private_gig_maps');
		$role->add_cap('delete_published_gig_maps');
		$role->add_cap('create_gig_rmaps');
} // prospect_activate()

function prospect_deactivate()
{
		$role = get_role('contributor');
		$role->remove_cap('read_gig_record');
		$role->remove_cap('read_gig_record');					// Records
		$role->remove_cap('edit_gig_record');
		$role->remove_cap('edit_gig_records');
		$role->remove_cap('delete_gig_records');
		$role->remove_cap('create_gig_records');
		$role->remove_cap('read_gig_exhibit');					// Exhibits
		$role->remove_cap('read_gig_exhibits');

		$role = get_role('editor');
		$role->remove_cap('read_gig_attribute');				// Attributes
		$role->remove_cap('read_gig_template');				// Templates
		$role->remove_cap('read_gig_record');					// Records
		$role->remove_cap('read_private_gig_records');
		$role->remove_cap('edit_gig_record');
		$role->remove_cap('edit_gig_records');
		$role->remove_cap('edit_others_gig_records');
		$role->remove_cap('edit_published_gig_records');
		$role->remove_cap('publish_gig_records');
		$role->remove_cap('delete_gig_records');
		$role->remove_cap('delete_others_gig_records');
		$role->remove_cap('delete_private_gig_records');
		$role->remove_cap('delete_published_gig_records');
		$role->remove_cap('create_gig_records');
		$role->remove_cap('read_gig_exhibit');					// Exhibits
		$role->remove_cap('read_gig_exhibits');
		$role->remove_cap('read_gig_map');						// Maps

		$role = get_role('administrator');
		$role->remove_cap('read_gig_attribute');				// Attributes
		$role->remove_cap('read_private_gig_attributes');
		$role->remove_cap('edit_gig_attribute');
		$role->remove_cap('edit_gig_attributes');
		$role->remove_cap('edit_others_gig_attributes');
		$role->remove_cap('edit_published_gig_attributes');
		$role->remove_cap('publish_gig_attributes');
		$role->remove_cap('delete_gig_attributes');
		$role->remove_cap('delete_others_gig_attributes');
		$role->remove_cap('delete_private_gig_attributes');
		$role->remove_cap('delete_published_gig_attributes');
		$role->remove_cap('create_gig_attributes');
		$role->remove_cap('read_gig_templates');				// Templates
		$role->remove_cap('read_private_gig_templates');
		$role->remove_cap('edit_gig_template');
		$role->remove_cap('edit_gig_templates');
		$role->remove_cap('edit_others_gig_templates');
		$role->remove_cap('edit_published_gig_templates');
		$role->remove_cap('publish_gig_templates');
		$role->remove_cap('delete_gig_templates');
		$role->remove_cap('delete_others_gig_templates');
		$role->remove_cap('delete_private_gig_templates');
		$role->remove_cap('delete_published_gig_templates');
		$role->remove_cap('create_gig_templates');
		$role->remove_cap('read_gig_record');					// Records
		$role->remove_cap('read_private_gig_records');
		$role->remove_cap('edit_gig_record');
		$role->remove_cap('edit_gig_records');
		$role->remove_cap('edit_others_gig_records');
		$role->remove_cap('edit_published_gig_records');
		$role->remove_cap('publish_gig_records');
		$role->remove_cap('delete_gig_records');
		$role->remove_cap('delete_others_gig_records');
		$role->remove_cap('delete_private_gig_records');
		$role->remove_cap('delete_published_gig_records');
		$role->remove_cap('create_gig_records');
		$role->remove_cap('read_gig_exhibit');					// Exhibits
		$role->remove_cap('read_gig_exhibits');
		$role->remove_cap('read_private_gig_exhibits');
		$role->remove_cap('edit_gig_exhibit');
		$role->remove_cap('edit_gig_exhibits');
		$role->remove_cap('edit_others_gig_exhibits');
		$role->remove_cap('edit_published_gig_exhibits');
		$role->remove_cap('publish_gig_exhibits');
		$role->remove_cap('delete_gig_exhibits');
		$role->remove_cap('delete_others_gig_exhibits');
		$role->remove_cap('delete_private_gig_exhibits');
		$role->remove_cap('delete_published_gig_exhibits');
		$role->remove_cap('create_gig_exhibits');
		$role->remove_cap('read_gig_map');						// Maps
		$role->remove_cap('read_private_gig_maps');
		$role->remove_cap('edit_gig_map');
		$role->remove_cap('edit_gig_maps');
		$role->remove_cap('edit_others_gig_maps');
		$role->remove_cap('edit_published_gig_maps');
		$role->remove_cap('publish_gig_maps');
		$role->remove_cap('delete_gig_maps');
		$role->remove_cap('delete_others_gig_maps');
		$role->remove_cap('delete_private_gig_maps');
		$role->remove_cap('delete_published_gig_maps');
		$role->remove_cap('create_gig_rmaps');
} // prospect_deactivate()


register_activation_hook(__FILE__, 'prospect_activate');
register_deactivation_hook(__FILE__, 'prospect_deactivate');


require_once plugin_dir_path(__FILE__).'php/class-gig.php';

function run_prospect()
{ 
    $gig = new Prospect();
    $gig->run();
} // run_prospect()
 
run_prospect();
