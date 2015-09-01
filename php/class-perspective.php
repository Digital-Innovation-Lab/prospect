<?php

class ProspectPerspective {
		// CLASS METHODS
		// =============


		// INSTANCE VARIABLES & METHODS
		// ============================
	public $post_id;		// the WordPress ID of the post

		// Perspective-specific data
	public $l;				// User-supplied label for Perspective
	public $xhbt_id;		// ID of Exhibit to which this belongs
	public $note;			// Textual annotation for Perspective
	public $meta_state;		// JSON packed version of Attribute definition
	public $state;			// unpacked object version


		// PURPOSE: Create Perspective object and load its definition
	public function __construct($the_id, $unpack)
	{
		$this->l 			= null;
		$this->xhbt_id 		= null;
		$this->note 		= null;
		$this->meta_state	= $this->state = null;

		$this->post_id = $the_id;

		$this->l 			= get_post_meta($the_id, 'prspctv-l', true);
		$this->xhbt_id		= get_post_meta($the_id, 'xhbt-id', true);
		$this->note 		= get_post_meta($the_id, 'prspctv-note', true);
		$this->meta_state 	= get_post_meta($the_id, 'prspctv-state', true);

		if ($unpack) {
			$this->state = json_decode($this->meta_state, false);
		}
	} // __construct()
} // Class