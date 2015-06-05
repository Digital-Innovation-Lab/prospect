<!DOCTYPE html>
<meta charset="utf-8">

<head>
	<link rel="stylesheet" href="<?php echo(plugins_url('css/jquery-ui.min.css', dirname(__FILE__))); ?>" />
	<link rel="stylesheet" href="<?php echo(plugins_url('css/jquery-ui.theme.min.css', dirname(__FILE__))); ?>" />
	<link rel="stylesheet" href="<?php echo(plugins_url('lib/leaflet/leaflet.css', dirname(__FILE__))); ?>" />
	<link rel="stylesheet" href="<?php echo(plugins_url('css/view-template.css', dirname(__FILE__))); ?>" />
</head>


<body>

<script src="<?php echo(includes_url('js/underscore.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/jquery.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/core.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/widget.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/mouse.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/draggable.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/position.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/resizable.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/button.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/dialog.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/effect.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/effect-slide.min.js')); ?>"></script>

<script src="<?php echo(plugins_url('lib/leaflet/leaflet.js', dirname(__FILE__))); ?>"></script>

<script src="<?php echo(plugins_url('js/view-template.js', dirname(__FILE__))); ?>"></script>

<script>
	var prspdata = {
		ajax_url: <?php
	global $post;

	$blog_id = get_current_blog_id();
	echo('"'.get_admin_url($blog_id ,'admin-ajax.php').'"');
?>,
		e: <?php
	$the_xhbt = new ProspectExhibit(true, get_the_ID(), true);
		// Put Attribute list in sorted order
	sort($the_xhbt->gen->ts);
	echo(' { id: "'.$the_xhbt->id.'", ');
	echo(' g: '.json_encode($the_xhbt->gen).', ');
	echo(' vf: '.$the_xhbt->meta_views.', ');
	echo(' w: '.$the_xhbt->meta_widgets.', ');
	echo(' p: '.$the_xhbt->meta_pages.' }, ');

		// Also need to output Template data based on Exhibit data
	echo(' t: [ ');
	$first = true;
	foreach($the_xhbt->gen->ts as $template_id) {
		if (!$first)
			echo(', ');
		$first = false;
		$the_template = new ProspectTemplate(false, $template_id, false, false);
		echo('{ id: "'.$the_template->id.'", ');
		echo(' def: '.$the_template->meta_def.', ');
		echo(' n: '.$the_template->get_num_records().' }');
	}

?> ],
		a: [ <?php

		// Get all definitions of all current Attributes
	$att_defs = ProspectAttribute::get_all_attributes(true, false, true, true);
		// Output each entry
	$first = true;
	foreach($att_defs as $the_attribute) {
		if (!$first)
			echo(', ');
		$first = false;
		echo('{ id: "'.$the_attribute->id.'", ');
		echo(' def: '.json_encode($the_attribute->def).', ');
		echo(' r: '.$the_attribute->meta_range.', ');
		echo(' l: '.$the_attribute->meta_legend.' }');
	}
?> ] };

</script>

<div id="command-bar">
	<span id="title"></span>
	<button id="btn-recompute">Recompute</button>
	<button id="btn-set-layout">Set Layout</button>
	<button id="btn-perspectives">Perspectives</button>
	<span class="home"><span id="home-title">Home</span> <button id="btn-home">Home</button></span>
</div>

<div id="remainder" class="layout-1">
	<div id="filter-frame">
		<div id="filter-control-bar">
			Filters
			<button id="btn-new-filter">New Filter</button>
			<button id="btn-toggle-filters">Hide/Show Filters</button>
		</div>
		<div id="filter-instances">
			<div class="filter-instance">
				<p>This is one Filter Content; it will have graphical components like sliders.
				There can be multiple filters; each filter-instance div only takes as much space as it needs.</p>
			</div>
			<div class="filter-instance">
				<p>This is another Filter Content; it will have graphical components like sliders.
				There can be multiple filters; each filter-instance div only takes as much space as it needs.</p>
			</div>
		</div>
	</div>

	<div id="viz-display-frame">
		<div id="view-frame-0">
			<div class="view-control-bar">
				<select class="view-viz-select">
				</select>
				<button>Hide/Show Legend</button>
				<button>Open Selection</button>
				<button>Clear Selection</button>
				<button>View Options</button>
			</div>
			<div class="viz-loading">
				Please wait while data loads.
			</div>
			<div class="viz-content">
				<div class="viz-result">
				</div>
				<div class="legend-container">
					<button class="legend-update">Update</button>
					<div class="legend-scroll">
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- DYNAMIC JQUERYUI CONTENT -->
<div style="display:none">
	<div id="dialog-new-filter" title="New Data Filter">
		<p class="validateTips">How should the data be filtered?</p>
		<div class="scroll-container">
			<ul id="filter-list">
			</ul>
		</div>
	</div>

	<div id="dialog-set-layout" title="Screen Layout">
		<p class="validateTips">Choose screen layout</p>
		<img src="<?php echo(plugins_url('assets/layout1.jpg', dirname(__FILE__))); ?>"/>
		<img src="<?php echo(plugins_url('assets/layout2.jpg', dirname(__FILE__))); ?>"/>
		<img src="<?php echo(plugins_url('assets/layout3.jpg', dirname(__FILE__))); ?>"/>
	</div>
</div>

</body>
</html>
