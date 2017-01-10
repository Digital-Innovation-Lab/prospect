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
			break;

		case 'prsp-template':
			wp_enqueue_style('prsp-view-template-style', plugins_url('css/view-template.css', dirname(__FILE__)));
			$page_template = dirname(__FILE__).'/view-template.php';
			break;

		case 'prsp-record':
			$blog_id = get_current_blog_id();
			$ajax_url = get_admin_url($blog_id ,'admin-ajax.php');

			$tmplt_id = get_post_meta($post->ID, 'tmplt-id', true);

			if ($tmplt_id != '') {
					// Load Template definition
				$the_template = new ProspectTemplate(false, $tmplt_id, true, true, true, false);

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
							wp_enqueue_script('soundcloud-api', '//w.soundcloud.com/player/api.js');
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
				// IMPORTANT: Must keep this list coordinated with code in view-exhibit.php!!
			wp_enqueue_style('prsp-jquery-ui-style', plugins_url('css/jquery-ui.min.css', dirname(__FILE__)));
			wp_enqueue_style('prsp-jquery-theme-style', plugins_url('css/jquery-ui.theme.min.css', dirname(__FILE__)));
			wp_enqueue_style('leaflet-style', plugins_url('lib/leaflet/leaflet.css', dirname(__FILE__)));
			wp_enqueue_style('prsp-exhibit-style', plugins_url('css/view-exhibit.min.css', dirname(__FILE__)));

			wp_enqueue_script('jquery');
			wp_enqueue_script('underscore');
			wp_enqueue_script('jquery-ui-core');
			wp_enqueue_script('jquery-ui-widget');
			wp_enqueue_script('jquery-ui-mouse');
			wp_enqueue_script('jquery-ui-draggable');
			wp_enqueue_script('jquery-ui-position');
			wp_enqueue_script('jquery-ui-resizable');
			wp_enqueue_script('jquery-ui-button');
			wp_enqueue_script('jquery-ui-dialog');
			wp_enqueue_script('jquery-effects-core');
			wp_enqueue_script('jquery-effects-slide');

			wp_enqueue_script('d3', plugins_url('lib/d3.min.js', dirname(__FILE__)));

			wp_enqueue_script('prsp-view-core', plugins_url('js/view-core.min.js', dirname(__FILE__)), array('underscore'));
			wp_enqueue_script('prsp-view-exhibit', plugins_url('js/view-exhibit.min.js', dirname(__FILE__)), array('prsp-view-core'));

				// Get Exhibit definition
			$the_xhbt = new ProspectExhibit(true, get_the_ID(), true);
			if ($the_xhbt->inspect->modal->scOn) {
				wp_enqueue_script('soundcloud', '//w.soundcloud.com/player/api.js');
			}

				// Check if need view-aggregate, map-dependent, qr modules
			$use_maps = false;
			$use_aggregate = false;
			$use_qr = isset($the_xhbt->gen->qr) && $the_xhbt->gen->qr->t != 'disable';

			foreach ($the_xhbt->views as $the_view) {
				switch ($the_view->vf) {
				case 'M':
				case 'p':
					$use_maps = true;
					break;
				case 'S':
				case 'F':
				case 'B':
				case 'm':
					$use_aggregate = true;
					break;
				case 'Q':
					$use_maps = true;
				// case 'q':
				// case 'E':
				// case 'e':
				// 	break;
				}
			}
			if ($use_maps) {
				wp_enqueue_script('leaflet', plugins_url('lib/leaflet/leaflet.js', dirname(__FILE__)));
				wp_enqueue_script('prsp-map-hub', plugins_url('js/map-hub.min.js', dirname(__FILE__)));
			}
			if ($use_aggregate) {
				wp_enqueue_script('prsp-view-aggregate', plugins_url('js/view-aggregate.min.js', dirname(__FILE__)), array('prsp-view-core'));
			}
			if ($use_qr) {
				wp_enqueue_script('prsp-view-qr', plugins_url('js/view-qr.min.js', dirname(__FILE__)), array('prsp-view-core'));
			}

				// Check for optional settings
			$options = get_option('prsp_base_options');

				// Insert Help Tour? Can be set at either Website or Exhibit level
			$tour = (isset($the_xhbt->gen->tour) && $the_xhbt->gen->tour) ||
				(isset($options['prsp_tour']) && ($options['prsp_tour'] == 'true'));
			if ($tour) {
				wp_enqueue_style('jquery-help-css', plugins_url('lib/hopscotch/css/hopscotch.min.css', dirname(__FILE__)), array('prsp-jquery-ui-style', 'prsp-jquery-theme-style'));
				wp_enqueue_script('jquery-help', plugins_url('lib/hopscotch/js/hopscotch.min.js', dirname(__FILE__)), array('jquery', 'prsp-view-exhibit'));
			}

				// 'Chunk-size' user option
			$chunk = isset($options['prsp_chunks']) ? (int)$options['prsp_chunks'] : 1000;

				// User-overrides for background colors
			$cb_color = isset($options['prsp_cb_color']) ? $options['prsp_cb_color'] : null;
			$fs_color = isset($options['prsp_fs_color']) ? $options['prsp_fs_color'] : null;
			$vf_color = isset($options['prsp_vf_color']) ? $options['prsp_vf_color'] : null;
			$b_clrs = array('cb' => $cb_color, 'fs' => $fs_color, 'vf' => $vf_color);

				// Collect Template data
			$t = array();
			$all_ts = array();
			$att_defs = array();
				// If viewing QRs, start with Roles Vocabulary Attributes
			if ($use_qr) {
				$att_defs = $the_xhbt->get_qr_attributes();
			}
			foreach ($the_xhbt->gen->ts as $template_id) {
				$the_template = new ProspectTemplate(false, $template_id, true, true, false, false);
					// Get Joined form of Template Attributes
				$att_defs = array_merge($att_defs, $the_template->get_all_attributes(false));
				array_push($all_ts, $the_template);
					// Replace Template's Unjoined Attribute list with Joined
				$the_template->def->a = $the_template->all_att_ids;
					// Remove any Record hints
				unset($the_template->def->h);
				array_push($t, array(
					'id' => $the_template->id,
					'def' => $the_template->def,
					'n' => $the_template->get_num_records()
				));
			}

				// Collect Attribute data
			$a = array();
				// Sort definitions of all current Attributes
			$att_defs = ProspectAttribute::unique_sorted_att_array($att_defs);
			foreach($att_defs as $the_attribute) {
					// Ignore Attributes whose Privacy setting protects them
				if ($the_attribute->privacy == 'o') {
					$the_attribute->convert_undefined();
					$att_def = array(
						'id'	=> $the_attribute->id,
						'def' 	=> $the_attribute->def,
						'r'		=> $the_attribute->range,
						'l'		=> $the_attribute->legend
					);
						// In which Templates does this Attribute appear?
					$appear_in_t = array();
					foreach($all_ts as $the_template) {
						array_push($appear_in_t, in_array($the_attribute->id, $the_template->all_att_ids));
					}
					$att_def['t'] = $appear_in_t;
					if ($the_attribute->x != null) {
						$att_def['x'] = $the_attribute->x;
					}
					array_push($a, $att_def);
				}
			}

				// Collect map group ID data
			$m = array();
			$map_groups = array();
			if ($use_maps) {
				$map_groups = $the_xhbt->get_used_map_groups();
				$map_ids = ProspectMap::get_mapids_from_groups($map_groups);
				$map_ids = array_merge($map_ids, $the_xhbt->get_used_map_ids());
				$map_ids = array_unique($map_ids);
				$map_defs = ProspectMap::map_ids_to_objects($map_ids);

					// Collect Map Library data (only those used by this Exhibit)
				foreach($map_defs as $the_map) {
					$map_def = array(
						'id'		=> $the_map->id,
						'sname'		=> $the_map->meta_data['sname'],
						'credits'	=> $the_map->meta_data['credits'],
						'url'		=> $the_map->meta_data['url'],
						'subd'		=> $the_map->meta_data['subd'],
						'swBounds'	=> $the_map->meta_data['swBounds'],
						'neBounds'	=> $the_map->meta_data['neBounds'],
						'minZoom'	=> $the_map->meta_data['minZoom'],
						'maxZoom'	=> $the_map->meta_data['maxZoom'],
						'inverseY'	=> $the_map->meta_data['inverseY']
					);
					array_push($m, $map_def);
				}
			}

				// Collect Perspectives
			$p = array();
			$all_prspctvs = ProspectPerspective::get_exhibit_perspectives($the_xhbt->id);
			foreach($all_prspctvs as $the_prspctv) {
				$p_def = array(
					'id'	=> $the_prspctv->id,
					'l'		=> $the_prspctv->l,
					'n'		=> $the_prspctv->note,
					's'		=> $the_prspctv->state
				);
				array_push($p, $p_def);
			}

				// Have to put numeric & boolean parameters into x or else they are treated as strings!
			wp_localize_script('prsp-view-exhibit', 'prspdata', array(
				'ajax_url'  	=> get_admin_url(get_current_blog_id() ,'admin-ajax.php'),
				'site_url'		=> site_url(),
				'assets'		=> plugins_url('/assets/', dirname(__FILE__)),
				'x'				=> array(
									'add_prspctv' => current_user_can('create_prsp_prspctvs') ? true : false,
									'chunks' => $chunk,
									'tour' => $tour
									),
				'bClrs'			=> $b_clrs,
				'e'				=> array('id' => $the_xhbt->id, 'g' => $the_xhbt->gen,
										 'vf' => $the_xhbt->views, 'i' => $the_xhbt->inspect
									),
				't'				=> $t,
				'a'				=> $a,
				'm'				=> $m,
				'mg'			=> $map_groups,
				'p'				=> $p,
				'show_prspctv'	=> get_query_var('prspctv')
			));

				// Get rid of WordPress extras
			wp_dequeue_style('screen');
			wp_deregister_style('screen');
			wp_dequeue_style('events-manager');

			wp_dequeue_script('site');
			wp_deregister_script('site');

				// REMOVE WP EMOJI
			remove_action('wp_head', 'print_emoji_detection_script', 7);
			remove_action('wp_print_styles', 'print_emoji_styles');

			remove_action('admin_print_scripts', 'print_emoji_detection_script');
			remove_action('admin_print_styles', 'print_emoji_styles');

			$page_template = dirname(__FILE__).'/view-exhibit.php';
			break;


		case 'prsp-volume':
				// IMPORTANT: Must keep this list coordinated with code in view-exhibit.php!!
			wp_enqueue_style('prsp-jquery-ui-style', plugins_url('css/jquery-ui.min.css', dirname(__FILE__)));
			wp_enqueue_style('prsp-jquery-theme-style', plugins_url('css/jquery-ui.theme.min.css', dirname(__FILE__)));
			wp_enqueue_style('leaflet-style', plugins_url('lib/leaflet/leaflet.css', dirname(__FILE__)));
			wp_enqueue_style('prsp-volume-style', plugins_url('css/view-volume.min.css', dirname(__FILE__)));

			wp_enqueue_script('jquery');
			wp_enqueue_script('underscore');
			wp_enqueue_script('jquery-ui-core');
			wp_enqueue_script('jquery-ui-widget');
			wp_enqueue_script('jquery-ui-mouse');
			wp_enqueue_script('jquery-ui-draggable');
			wp_enqueue_script('jquery-ui-position');
			wp_enqueue_script('jquery-ui-resizable');
			wp_enqueue_script('jquery-ui-button');
			wp_enqueue_script('jquery-ui-dialog');
			wp_enqueue_script('jquery-effects-core');
			wp_enqueue_script('jquery-effects-slide');

			wp_enqueue_script('d3', plugins_url('lib/d3.min.js', dirname(__FILE__)));

			wp_enqueue_script('prsp-view-core', plugins_url('js/view-core.min.js', dirname(__FILE__)));
			wp_enqueue_script('prsp-view-volume', plugins_url('js/view-volume.min.js', dirname(__FILE__)), array('prsp-view-core'));

				// Get Volume definition
			$the_volume = new ProspectVolume(true, get_the_ID(), true);
			if ($the_volume->inspect->modal->scOn) {
				wp_enqueue_script('soundcloud', '//w.soundcloud.com/player/api.js');
			}

				// Check if need view-aggregate, map-dependent modules
			$use_maps = false;
			foreach ($the_volume->views as $the_view) {
				switch ($the_view->vf) {
				case 'M':
				case 'p':
					$use_maps = true;
					break;
				}
			}
			if ($use_maps) {
				wp_enqueue_script('leaflet', plugins_url('lib/leaflet/leaflet.js', dirname(__FILE__)));
				wp_enqueue_script('prsp-map-hub', plugins_url('js/map-hub.min.js', dirname(__FILE__)));
			}

				// Check user options
			$options = get_option('prsp_base_options');

				// Insert Help Tour? Can be set at either Website or Volume level
			$tour = (isset($the_volume->gen->tour) && $the_volume->gen->tour) ||
				(isset($options['prsp_tour']) && ($options['prsp_tour'] == 'true'));
			if ($tour) {
				wp_enqueue_style('jquery-help-css', plugins_url('lib/hopscotch/css/hopscotch.min.css', dirname(__FILE__)), array('prsp-jquery-ui-style', 'prsp-jquery-theme-style'));
				wp_enqueue_script('jquery-help', plugins_url('lib/hopscotch/js/hopscotch.min.js', dirname(__FILE__)), array('jquery', 'prsp-view-volume'));
			}

			$chunk = isset($options['prsp_chunks']) ? (int)$options['prsp_chunks'] : 1000;

				// User-overrides for background colors
			$cb_color = isset($options['prsp_cb_color']) ? $options['prsp_cb_color'] : null;
			$vf_color = isset($options['prsp_vf_color']) ? $options['prsp_vf_color'] : null;
			$b_clrs = array('cb' => $cb_color, 'vf' => $vf_color);

				// Collect Template data
			$t = array();
			$all_ts = array();
			$att_defs = array();
			foreach ($the_volume->gen->ts as $template_id) {
				$the_template = new ProspectTemplate(false, $template_id, true, true, false, false);
					// Get Joined form of Template Attributes
				$att_defs = array_merge($att_defs, $the_template->get_all_attributes(false));
				array_push($all_ts, $the_template);
					// Replace Template's Unjoined Attribute list with Joined
				$the_template->def->a = $the_template->all_att_ids;
					// Remove any Record hints
				unset($the_template->def->h);
				array_push($t, array(
					'id' => $the_template->id,
					'def' => $the_template->def,
					'n' => $the_template->get_num_records()
				));
			}

				// Collect Attribute data
			$a = array();
				// Sort definitions of all current Attributes
			$att_defs = ProspectAttribute::unique_sorted_att_array($att_defs);
			foreach($att_defs as $the_attribute) {
					// Ignore Attributes whose Privacy setting protects them
				if ($the_attribute->privacy == 'o') {
					$the_attribute->convert_undefined();
					$att_def = array(
						'id'	=> $the_attribute->id,
						'def' 	=> $the_attribute->def,
						'r'		=> $the_attribute->range,
						'l'		=> $the_attribute->legend
					);
						// In which Templates does this Attribute appear?
					$appear_in_t = array();
					foreach($all_ts as $the_template) {
						array_push($appear_in_t, in_array($the_attribute->id, $the_template->all_att_ids));
					}
					$att_def['t'] = $appear_in_t;
					if ($the_attribute->x != null) {
						$att_def['x'] = $the_attribute->x;
					}
					array_push($a, $att_def);
				}
			}

				// Collect map group ID data
			$map_groups = $the_volume->get_used_map_groups();
			$map_ids = ProspectMap::get_mapids_from_groups($map_groups);
			$map_ids = array_merge($map_ids, $the_volume->get_used_map_ids());
			$map_ids = array_unique($map_ids);
			$map_defs = ProspectMap::map_ids_to_objects($map_ids);

				// Collect Map Library data (only those used by this Volume)
			$m = array();
			foreach($map_defs as $the_map) {
				$map_def = array(
					'id'		=> $the_map->id,
					'sname'		=> $the_map->meta_data['sname'],
					'credits'	=> $the_map->meta_data['credits'],
					'url'		=> $the_map->meta_data['url'],
					'subd'		=> $the_map->meta_data['subd'],
					'swBounds'	=> $the_map->meta_data['swBounds'],
					'neBounds'	=> $the_map->meta_data['neBounds'],
					'minZoom'	=> $the_map->meta_data['minZoom'],
					'maxZoom'	=> $the_map->meta_data['maxZoom'],
					'inverseY'	=> $the_map->meta_data['inverseY']
				);
				array_push($m, $map_def);
			}

				// Collect Readings (uses same structures as Perspectives)
			$p = array();
			$all_readings = ProspectReading::get_volume_readings($the_volume->id);
			foreach($all_readings as $the_reading) {
				$r_def = array(
					'id'	=> $the_reading->id,
					'l'		=> $the_reading->l,
					'n'		=> $the_reading->note,
					's'		=> $the_reading->state
				);
				array_push($p, $r_def);
			}

				// Have to put numberic parameters into x or else they are treated as strings!
			wp_localize_script('prsp-view-volume', 'prspdata', array(
				'ajax_url'  	=> get_admin_url(get_current_blog_id() ,'admin-ajax.php'),
				'site_url'		=> site_url(),
				'assets'		=> plugins_url('/assets/', dirname(__FILE__)),
				'x'				=> array(
									'add_reading' => current_user_can('create_prsp_readings') ? true : false,
									'chunks' => $chunk,
									'tour' => $tour
									),
				'bClrs'			=> $b_clrs,
				'e'				=> array('id' => $the_volume->id, 'g' => $the_volume->gen,
										 'vf' => $the_volume->views, 'i' => $the_volume->inspect
									),
				't'				=> $t,
				'a'				=> $a,
				'm'				=> $m,
				'mg'			=> $map_groups,
				'p'				=> $p,
				'show_reading'	=> get_query_var('reading')
			));

				// Get rid of WordPress extras
			wp_dequeue_style('screen');
			wp_deregister_style('screen');
			wp_dequeue_style('events-manager');

			wp_dequeue_script('site');
			wp_deregister_script('site');

				// REMOVE WP EMOJI
			remove_action('wp_head', 'print_emoji_detection_script', 7);
			remove_action('wp_print_styles', 'print_emoji_styles');

			remove_action('admin_print_scripts', 'print_emoji_detection_script');
			remove_action('admin_print_styles', 'print_emoji_styles');

			$page_template = dirname(__FILE__).'/view-volume.php';
			break;


			// Don't currently support any special views as they are meant for backend
		case 'prsp-map':
		case 'prsp-prspctv':
			break;

			// Any other page, enqueue styles for shortcodes
		default:
			wp_enqueue_style('prsp-view-template-style', plugins_url('css/view-template.css', dirname(__FILE__)));
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
		$this->version = '1.8.1';

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
		require_once plugin_dir_path(__FILE__).'class-map.php';
		require_once plugin_dir_path(__FILE__).'class-exhibit.php';
		require_once plugin_dir_path(__FILE__).'class-perspective.php';
		require_once plugin_dir_path(__FILE__).'class-volume.php';
		require_once plugin_dir_path(__FILE__).'class-reading.php';

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
		$this->loader->add_action('add_meta_boxes_prsp-volume', $this->admin, 'add_prsp_volume_admin_edit', null, null);
		$this->loader->add_action('add_meta_boxes_prsp-reading', $this->admin, 'add_prsp_reading_admin_edit', null, null);
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
		$this->loader->add_action('admin_action_prsp_export_all_t_dicts', $this->admin, 'prsp_export_all_t_dicts', null, null);
		$this->loader->add_action('admin_action_prsp_export_record', $this->admin, 'prsp_export_record', null, null);
		$this->loader->add_action('admin_action_prsp_export_exhibit', $this->admin, 'prsp_export_exhibit', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_exhibits', $this->admin, 'prsp_export_all_exhibits', null, null);
		$this->loader->add_action('admin_action_prsp_export_all', $this->admin, 'prsp_export_all', null, null);
		$this->loader->add_action('admin_action_prsp_export_map', $this->admin, 'prsp_export_map', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_maps', $this->admin, 'prsp_export_all_maps', null, null);
		$this->loader->add_action('admin_action_prsp_export_prspctv', $this->admin, 'prsp_export_prspctv', null, null);
		$this->loader->add_action('admin_action_prsp_export_xhbt_prspctvs', $this->admin, 'prsp_export_xhbt_prspctvs', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_prspctvs', $this->admin, 'prsp_export_all_prspctvs', null, null);
		$this->loader->add_action('admin_action_prsp_export_volume', $this->admin, 'prsp_export_volume', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_volumes', $this->admin, 'prsp_export_all_volumes', null, null);
		$this->loader->add_action('admin_action_prsp_export_reading', $this->admin, 'prsp_export_reading', null, null);
		$this->loader->add_action('admin_action_prsp_export_vol_readings', $this->admin, 'prsp_export_vol_readings', null, null);
		$this->loader->add_action('admin_action_prsp_export_all_readings', $this->admin, 'prsp_export_all_readings', null, null);

			// AJAX calls
		$this->loader->add_action('wp_ajax_prsp_get_rec_ids', $this->admin, 'prsp_get_rec_ids', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_records', $this->admin, 'prsp_get_records', null, null);
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_records', $this->admin, 'prsp_get_records', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_cf_vals', $this->admin, 'prsp_get_cf_vals', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_transcript', $this->admin, 'prsp_get_transcript', null, null);
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_transcript', $this->admin, 'prsp_get_transcript', null, null);
		$this->loader->add_action('wp_ajax_prsp_get_geonames', $this->admin, 'prsp_get_geonames', null, null);
		$this->loader->add_action('wp_ajax_nopriv_prsp_get_geonames', $this->admin, 'prsp_get_geonames', null, null);

		$this->loader->add_action('wp_ajax_prsp_save_prspctv', $this->admin, 'prsp_save_prspctv', null, null);
		$this->loader->add_action('wp_ajax_prsp_save_reading', $this->admin, 'prsp_save_reading', null, null);
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
