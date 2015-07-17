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
<script src="<?php echo(includes_url('js/jquery/ui/slider.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/effect.min.js')); ?>"></script>
<script src="<?php echo(includes_url('js/jquery/ui/effect-slide.min.js')); ?>"></script>

<script src="<?php echo(plugins_url('lib/leaflet/leaflet.js', dirname(__FILE__))); ?>"></script>

<script src="<?php echo(plugins_url('lib/d3.js', dirname(__FILE__))); ?>"></script>

<script src="<?php echo(plugins_url('js/map-hub.js', dirname(__FILE__))); ?>"></script>
<script src="<?php echo(plugins_url('js/view-template.js', dirname(__FILE__))); ?>"></script>

<script>
	var prspdata = {
		ajax_url: <?php
	global $post;

	$blog_id = get_current_blog_id();
	echo('"'.get_admin_url($blog_id ,'admin-ajax.php').'"');
?>,
		site_url: <?php
	echo('"'.site_url().'"');
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
	$att_defs = array();
	foreach($the_xhbt->gen->ts as $template_id) {
		if (!$first)
			echo(', ');
		$first = false;
		$the_template = new ProspectTemplate(false, $template_id, true, true);
		echo('{ id: "'.$the_template->id.'", ');
		echo(' def: '.$the_template->meta_def.', ');
		echo(' n: '.$the_template->get_num_records().' }');
		$att_defs = array_merge($att_defs, $the_template->get_all_attributes(false));
	}

?> ],
		a: [ <?php

		// Get all definitions of all current Attributes
	$att_defs = ProspectAttribute::unique_sorted_att_array($att_defs);
		// Output each entry
	$first = true;
	foreach($att_defs as $the_attribute) {
			// Ignore Attributes whose Privacy setting protects them
		if ($the_attribute->privacy == 'o') {
			if (!$first)
				echo(', ');
			$first = false;
			echo('{ id: "'.$the_attribute->id.'", ');
			echo(' def: '.json_encode($the_attribute->def).', ');
			echo(' r: '.$the_attribute->meta_range.', ');
			echo(' l: '.json_encode($the_attribute->legend));
			if ($the_attribute->x != null)
				echo(', x: '.json_encode($the_attribute->x).' }');
			else
				echo(' }');
		}
	}
?> ],
		m: [ <?php
	$map_defs = ProspectMap::get_all_maps();
		// Output each entry
	$first = true;
	foreach($map_defs as $the_map) {
		if (!$first)
			echo(', ');
		$first = false;
		echo('{ id: "'.$the_map->id.'", ');
		echo(' sname: "'.$the_map->meta_data['sname'].'", ');
		echo(' credits: "'.$the_map->meta_data['credits'].'", ');
		echo(' url: "'.$the_map->meta_data['url'].'", ');
		echo(' subd: "'.$the_map->meta_data['subd'].'", ');
		echo(' swBounds: '.json_encode($the_map->meta_data['swBounds']).', ');
		echo(' neBounds: '.json_encode($the_map->meta_data['neBounds']).', ');
		echo(' minZoom: '.$the_map->meta_data['minZoom'].', ');
		echo(' maxZoom: '.$the_map->meta_data['maxZoom'].', ');
		echo(' inverseY: '.$the_map->meta_data['inverseY'].' }');
	}

?>	] };

</script>

<div id="command-bar">
	<span id="title"></span>
	&nbsp; &nbsp; <button id="btn-recompute">Recompute</button>
	<input type="checkbox" id="auto-refresh"/> <span class="command-bar-label">Automatic Refresh</span> &nbsp; &nbsp;
	<button id="btn-set-layout">Set Layout</button>
	<button id="btn-perspectives">Perspectives</button>
	<span class="home"><span id="home-title">Home</span> <button id="btn-home">Home</button></span>
</div>

<div id="loading-message">
	Please wait while data loads.
</div>

<div id="remainder" class="layout-1">
	<div id="filter-frame">
		<div id="filter-control-bar">
			Filters
			<button id="btn-new-filter">New Filter</button>
			<button id="btn-toggle-filters">Hide/Show Filters</button>
		</div>
		<div id="filter-instances">
		</div>
	</div>
	<div id="selector-frame">
		<div id="selector-control-bar">
			Selection
			<button id="btn-new-selector">New Filter</button>
			<button id="btn-toggle-selector">Hide/Show Filter</button>
			<button id="btn-apply-selector">Apply Selector Filter</button>
			<input type="checkbox" checked="checked" id="selector-v0"/> View 1
			<input type="checkbox" id="selector-v1" disabled/> View 2
		</div>
		<div id="selector-instance">
			<div class="filter-instance" data-id="0">
			</div>
		</div>
	</div>

	<div id="viz-display-frame">
	</div>
</div>

<!-- DYNAMIC JQUERYUI CONTENT -->
<div style="display:none">
	<div id="dialog-new-filter" title="New Data Filter">
		<p class="validateTips">Choose Attribute to Filter</p>
		<div class="scroll-container">
			<ul id="filter-list">
			</ul>
		</div>
	</div>

	<div id="dialog-set-layout" title="Screen Layout">
		<p class="validateTips">Choose screen layout</p>
		<div id="layout-choices">
			<img src="<?php echo(plugins_url('assets/layout1.jpg', dirname(__FILE__))); ?>" data-index="0"/>
			<img src="<?php echo(plugins_url('assets/layout2.jpg', dirname(__FILE__))); ?>" data-index="1"/>
			<img src="<?php echo(plugins_url('assets/layout3.jpg', dirname(__FILE__))); ?>" data-index="2"/>
		</div>
	</div>

	<div id="dialog-inspector" title="Selection Inspector">
		<div class="inspector-header">
			<button id="btn-inspect-left">Previous</button>
			<span id="inspect-name"></span>
			<button id="btn-inspect-right">Next</button>
		</div>
		<div id="inspect-content" class="scroll-container">
		</div>
	</div>

	<div id="dialog-map-opacities" title="Layer Opacities">
		<div class="layer-list">
		</div>
	</div>
</div> <!-- Hidden content ->

<!-- DYNAMICALLY LOADED TEXT -->
<script id="dltext-viewframe-dom" type='text'>
	<div class="view-control-bar">
		<select class="view-viz-select">
		</select>
		<button>Hide/Show Legend</button>
		<button>Open Selection</button>
		<button>Clear Selection</button>
		<button>View Options</button>
	</div>
	<div class="viz-content">
		<div class="viz-result">
		</div>
		<div class="lgnd-container">
			<button class="lgnd-update">Update</button>
			<div class="lgnd-scroll">
			</div>
		</div>
	</div>
</script>

<script id="dltext-filter-head" type='text'>
<div class="filter-instance" data-id="<%= newID %>">
	<div class="filter-head">
		<%= title %> &nbsp;
		<input type="checkbox" class="req-att" value="required" checked="checked">
		Require attribute value &nbsp; &nbsp;
		<button class="btn-filter-toggle">Toggle</button>
		<button class="btn-filter-del">Delete Filter</button>
	</div>
	<div class="filter-body">
	</div>
</div>
</script>

<script id="dltext-filter-text" type='text'>
Text must include <input class="filter-text" type="text" size="20"/>
</script>

<script id="dltext-filter-num-boxes" type='text'>
	Use minimum <input type="checkbox" class="filter-num-min-use" value="min-use" checked="checked">
	Min <input type="number" class="filter-num-min-val" min="<%= min %>" max="<%= max %>" value="<%= min %>"> &nbsp; &nbsp; &nbsp;
	&nbsp; &nbsp; Use maximum <input type="checkbox" class="filter-num-max-use" value="max-use" checked="checked">
	Max <input type="number" class="filter-num-max-val" min="<%= min %>" max="<%= max %>" value="<%= max %>">
</script>

<script id="dltext-selector-head" type='text'>
	<div class="filter-head">
		<%= title %> &nbsp;
		<button class="btn-filter-del">Delete Filter</button>
	</div>
	<div class="filter-body">
	</div>
</script>

<script id="dltext-from" type="text">
From
</script>

<script id="dltext-to" type="text">
to
</script>

<script id="dltext-approximately" type="text">
approximately
</script>

<script id="dltext-now" type="text">
now
</script>


</body>
</html>
