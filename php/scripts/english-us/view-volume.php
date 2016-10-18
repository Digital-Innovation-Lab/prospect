<div id="command-bar">
	<span id="title"></span>
	&nbsp; <button id="btn-about"><?php _e('About Prospect', 'prospect'); ?></button>
	<button id="btn-togtext"><?php _e('Min/Max Text Pane', 'prospect'); ?></button>
	<input type="radio" name="vizmode" id="vizmode-0" value="v0"/><label for="vizmode-0"><?php _e('All Data', 'prospect'); ?></label>
	<input type="radio" name="vizmode" id="vizmode-1" value="v1" checked/><label for="vizmode-1"><?php _e('In Text Only', 'prospect'); ?></label>
	<input type="radio" name="vizmode" id="vizmode-2" value="v2"/><label for="vizmode-2"><?php _e('Selected Only', 'prospect'); ?></label>
	<button id="clearsel" class="plain"><?php _e('Clear Highlighted', 'prospect'); ?></button>
	<button id="btn-show-reading"><?php _e('Show Reading', 'prospect'); ?></button>
	<button id="btn-save-reading"><?php _e('Save Reading', 'prospect'); ?></button>
	<button id="btn-annote"><?php _e('Show/Hide Annotation', 'prospect'); ?></button>
	&nbsp; <span id="pstate" class="attn"><?php _e('Initializing', 'prospect'); ?></span>
	<span class="home">
		<span id="home-title"></span> <button id="btn-home"><?php _e('Home', 'prospect'); ?></button>
		<button class="help"><?php _e('Help Tour', 'prospect'); ?></button>
	</span>
</div>

<div id="annote" style="display:none;">
</div>

<div id="viz-frame">
	<div id="view-frame-0">
		<div class="view-controls">
			<button id="hstoc"><?php _e('Show/Hide Table of Contents', 'prospect'); ?></button>
			<div id="toc-controls" style="display: none;">
				<input type="checkbox" id="tochcall" name="tochcall" title=<?php _e('"On Reading List"', 'prospect'); ?>/><label for="tochcall"><?php _e('Un/Check Reading List', 'prospect'); ?></label> &nbsp;
				<input type="checkbox" id="tochsall" name="tochsall" title=<?php _e('"Currently in Reading Pane"', 'prospect'); ?>/><label for="tochsall"><?php _e('Show/Hide All Selections', 'prospect'); ?></label> &nbsp;
				<button id="tocfind"><?php _e('Find Text', 'prospect'); ?></button>
			</div>
			<div id="text-controls">
				&nbsp;<button id="textprev"><?php _e('Previous', 'prospect'); ?></button>
				<button id="textnext"><?php _e('Next', 'prospect'); ?></button> &nbsp;
				<button class="hilite"><?php _e('Highlight', 'prospect'); ?></button>
				<button class="osel"><?php _e('Show Highlighted', 'prospect'); ?></button>
				<span class="btn-num-sel"></span>
			</div>
		</div>
		<div class="sellist" style="display:none;">
			<div class="sellist-handle">
				<button class="sellist-close"><?php _e('Close', 'prospect'); ?></button>&nbsp;<?php _e('Highlighted Items', 'prospect'); ?>
			</div>
			<div class="sellist-scroll">
			</div>
		</div>
		<div class="viz-content">
			<div id="toc-frame" style="display: none;">
				<ul class="toc-wrapper">
				</ul>
			</div>
			<div id="text-frame">
				<div id="bookmark">
				</div>
				<div id="read-pane">
				</div>
			</div>
		</div>
	</div>
	<div id="view-frame-1">
		<div class="view-controls">
			<select class="view-viz-select" title=<?php _e('"Select a visualization from this list"', 'prospect'); ?>>
			</select>
			<button class="hslgnd"><?php _e('Show/Hide Legend', 'prospect'); ?></button>
			<button class="vopts"><?php _e('View Options', 'prospect'); ?></button>
			<button class="vnote"><?php _e('Visualization Notes', 'prospect'); ?></button>
			<button class="hilite"><?php _e('Highlight', 'prospect'); ?></button>
			<button class="osel"><?php _e('Show Highlighted', 'prospect'); ?></button>
			<span class="btn-num-sel"></span>
		</div>
		<div class="lgnd-container">
			<div class="lgnd-handle">
				<button class="lgnd-update"><?php _e('Update', 'prospect'); ?></button>
			</div>
			<div class="lgnd-scroll">
			</div>
		</div>
		<div class="sellist" style="display:none;">
			<div class="sellist-handle">
				<button class="sellist-close"><?php _e('Close', 'prospect'); ?></button>&nbsp;<?php _e('Highlighted Items', 'prospect'); ?>
			</div>
			<div class="sellist-scroll">
			</div>
		</div>
		<div class="viz-content">
			<div class="viz-result">
			</div>
		</div>
	</div>
</div>

	<!-- Insertion points to ensure proper stacking of multiple dialogs -->
<div id="dialog-1">
</div>

<div id="dialog-2">
</div>

<!-- DYNAMIC JQUERYUI CONTENT -->
<div style="display:none">
	<div id="dialog-hilite-0" title=<?php _e('"Highlight On View 1"', 'prospect'); ?>>
		<div class="filter-instance" data-id="0">
			<?php _e('Attribute that provides condition', 'prospect'); ?>: <span class="filter-id">(<?php _e('None selected', 'prospect'); ?>)</span>
			<div id="hilite-0" class="filter-body">
			</div>
		</div>
	</div>

	<div id="dialog-hilite-1" title=<?php _e('"Highlight On View 2"', 'prospect'); ?>>
		<div class="filter-instance" data-id="1">
			<?php _e('Attribute which provides condition', 'prospect'); ?>: <span class="filter-id">(<?php _e('None selected', 'prospect'); ?>)</span>
			<div id="hilite-1" class="filter-body">
			</div>
		</div>
	</div>

	<div id="dialog-choose-att" title=<?php _e('"Choose Attribute"', 'prospect'); ?>>
		<div class="scroll-container">
			<ul id="filter-list">
			</ul>
		</div>
	</div>

	<div id="dialog-sortby" title=<?php _e('"Sort By"', 'prospect'); ?>>
	</div>

	<div id="dialog-inspector" title=<?php _e('"Inspector"', 'prospect'); ?>>
		<div class="inspector-header">
			<button id="btn-inspect-left"><?php _e('Previous', 'prospect'); ?></button>
			<span id="inspect-name"></span>
			<button id="btn-inspect-right"><?php _e('Next', 'prospect'); ?></button>
			<br/>
			<select id="inspect-list" value=0>
			</select>
		</div>
		<div id="inspect-content" class="scroll-container">
		</div>
	</div>

	<div id="dialog-opacities" title=<?php _e('"Layer Opacities"', 'prospect'); ?>>
		<div class="layer-list">
		</div>
	</div>

	<div id="dialog-prune" title=<?php _e('"Network Options"', 'prospect'); ?>>
		<input type="checkbox" name="prune-nodes" id="prune-nodes"/> <?php _e('Hide unconnected items', 'prospect'); ?>
	</div>

	<div id="dialog-netgraph" title=<?php _e('"Options"', 'prospect'); ?>>
		<?php _e('Relationships to display', 'prospect'); ?>
		<div class="scroll-container">
		</div>
	</div>

	<div id="dialog-about" title=<?php _e('"About Prospect&#8482;"', 'prospect'); ?>>
		<div class="scroll-container">
			<p>Prospect&#8482; 1.6.3</p>
			<img class="logo"/>
			<p><?php _e('From the', 'prospect'); ?>
			<a href="http://digitalinnovation.unc.edu" target="_blank">Digital Innovation Lab</a> <?php _e('of the', 'prospect'); ?> <a href="http://www.unc.edu" target="_blank">University of North Carolina, Chapel Hill</a>.</p>
			<p style="margin:6px"><b><?php _e('Credits', 'prospect'); ?>:</b><br/>
			Michael Newton: <?php _e('Software architect and developer.', 'prospect'); ?><br/>
			Breon Williams: <?php _e('CSS contributions.', 'prospect'); ?><br/>
			Kevin Jacoby: <?php _e('Miscellaneous contributions.', 'prospect'); ?></p>
			<p><a href="http://prospect.web.unc.edu" target="_blank"><?php _e('See more about Prospect', 'prospect'); ?></a>.</p>
		</div>
	</div>

	<div id="dialog-vnotes" title=<?php _e('"Notes on Visualization"', 'prospect'); ?>>
		<div id="vnotes-txt" class="scroll-container">
		</div>
	</div>

	<div id="dialog-save-reading" title=<?php _e('"Save Reading"', 'prospect'); ?>>
		<fieldset class="radiogroup">
			<legend><?php _e('Where to save', 'prospect'); ?></legend>
			<ul class="radio">
				<li><input type="radio" name="save-reading-dest" id="save-reading-d-1" value="local" checked/><label for="save-reading-d-1"><?php _e('Private (Your Browser)', 'prospect'); ?></label></li>
				<li><input type="radio" name="save-reading-dest" id="save-reading-d-2" value="server"/><label for="save-reading-d-2"><?php _e('Public (Web Server: Account required)', 'prospect'); ?></label></li>
			</ul>
		</fieldset>
		<?php _e('Unique ID', 'prospect'); ?>:<br/>
		<input id="save-reading-id" type="text" size="20" placeholder=<?php _e('"Unique ID"', 'prospect'); ?>/><br/>
		<?php _e('Label', 'prospect'); ?>:<br/>
		<input id="save-reading-lbl" type="text" size="42" placeholder=<?php _e('"Label"', 'prospect'); ?>/><br/>

		<fieldset class="radiogroup">
			<legend><?php _e('Select items By', 'prospect'); ?></legend>
			<ul class="radio">
				<li><input type="radio" name="select-read-by" id="read-by-recs" value="recs" checked/><label for="read-by-recs"><?php _e('Restoring Exact Current Selection', 'prospect'); ?></label></li>
				<li><input type="radio" name="select-read-by" id="read-by-h0" value="h0"/><label for="read-by-h0"><?php _e('Applying Text Frame Highlight Filter', 'prospect'); ?></label></li>
				<li><input type="radio" name="select-read-by" id="read-by-h1" value="h1"/><label for="read-by-h1"><?php _e('Applying Visualization Frame Highlight Filter', 'prospect'); ?></label></li>
			</ul>
		</fieldset>

		<textarea id="save-reading-note" rows="4" cols="50" placeholder=<?php _e('"Add an annotation (cannot use double quotes)"', 'prospect'); ?> style="margin-top: 4px"></textarea>
	</div>

	<div id="dialog-edit-reading" title=<?php _e('"Edit Perspective or Reading"', 'prospect'); ?>>
		Label:<br/>
		<input id="edit-reading-lbl" type="text" size="42" placeholder=<?php _e('"Label"', 'prospect'); ?>/><br/>
		<textarea id="edit-reading-note" rows="5" cols="48" placeholder=<?php _e('"Annotation (cannot use double quotes)"', 'prospect'); ?> style="margin-top: 4px"></textarea>
	</div>

	<div id="dialog-show-reading" title=<?php _e('"Show Reading"', 'prospect'); ?>>
		<?php _e('Readings', 'prospect'); ?>:<br/>
		<div class="scroll-container">
			<ul id="reading-slist">
			</ul>
		</div>
	</div>

	<div id="dialog-manage-reading" title=<?php _e('"Manage Perspectives and Readings"', 'prospect'); ?>>
		<div class="scroll-container">
			<ul id="reading-mlist">
			</ul>
		</div>
	</div>

	<div id="dialog-reading-id-used" title=<?php _e('"Reading ID Error"', 'prospect'); ?>>
		<p><?php _e('That ID has already been used by a Perspective or Reading. Please create another (alphabetic characters, numbers, hyphens and underscores only), or click the Cancel button.', 'prospect'); ?></p>
	</div>

	<div id="dialog-reading-id-badchars" title=<?php _e('"ID Error"', 'prospect'); ?>>
		<p><?php _e('That ID has illegal characters or is too long. Please create another ID of no more than 20 characters (alphabetic characters, numbers, hyphens and underscores only, no spaces), or click the Cancel button.', 'prospect'); ?></p>
	</div>

	<div id="dialog-reading-label-bad" title=<?php _e('"Reading ID Error"', 'prospect'); ?>>
		<p><?php _e('You must enter a label for the Reading between 1 and 32 characters in length.', 'prospect'); ?></p>
	</div>

	<div id="dialog-reading-url" title=<?php _e('"Reading URL"', 'prospect'); ?>>
		<p><?php _e('To show this Reading after it has been Published on the server, use the following URL', 'prospect'); ?>:</p>
		<textarea id="save-reading-embed" cols="60" rows="3" readonly="readonly"></textarea>
	</div>

	<div id="dialog-find-toc" title=<?php _e('"Find Text"', 'prospect'); ?>>
		<input id="find-toc-txt" type="text" size="30" placeholder=<?php _e('"Enter Text To Find"', 'prospect'); ?>/>
	</div>

	<ol id="help-txt-tour">
		<li data-t="#pstate" data-l=<?php _e('"Current State"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Indicates the current state of Prospect (whether or not it is loading data, etc)', 'prospect'); ?></li>
		<li data-t="#btn-togtext" data-l=<?php _e('"Min/Max Text Pane"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click to minimize or maximize the size of the Text Pane', 'prospect'); ?></li>
		<li data-t="#vizmode-0" data-l=<?php _e('"Show All Data"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this option if you want all item data to be shown in the visualization on the right', 'prospect'); ?></li>
		<li data-t="#vizmode-1" data-l=<?php _e('"Show Data in Text"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this option if you want the visualization on the right to only show items that are embedded in the text on the left', 'prospect'); ?></li>
		<li data-t="#vizmode-2" data-l=<?php _e('"Only Show Selected Items"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this option if you want the visualization on the right to only show items that have been selected in the text on the left', 'prospect'); ?></li>
		<li data-t="#clearsel" data-l=<?php _e('"Clear Highlighted"', 'prospect'); ?> data-p="bottom" data-x=0 data-y=0><?php _e('Click this to clear out the currently highlighted selection on the current visualization', 'prospect'); ?></li>
		<li data-t="#btn-show-reading" data-l=<?php _e('"Show Reading"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to see which Readings are available for current Volume', 'prospect'); ?></li>
		<li data-t="#btn-save-reading" data-l=<?php _e('"Save Reading"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to save the current state of your activity as a Reading', 'prospect'); ?></li>
		<li data-t="#btn-annote" data-l=<?php _e('"Hide/Show Annotation"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to hide or show the annotation of the last Perspective opened', 'prospect'); ?></li>
		<li data-t="#hstoc" data-l=<?php _e('"Toggle TOC/Text"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to toggle between the Table of Contents and the Reading Pane', 'prospect'); ?></li>
		<li data-t="#textprev" data-l=<?php _e('"Previous Section"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to show the previous section of the Reading List on the Reading Pane', 'prospect'); ?></li>
		<li data-t="#textnext" data-l=<?php _e('"Next Section"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to show the next section of the Reading List on the Reading Pane', 'prospect'); ?></li>
		<li data-t="#text-controls .hilite" data-l=<?php _e('"Highlight Filter"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this to show or apply Filters that select items programatically on the Reading Pane', 'prospect'); ?></li>
		<li data-t="#text-controls .osel" data-l=<?php _e('"Show Highlighted"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this when it is pulsing to show all of the currently highlighted selection of items in the Inspector modal dialog window', 'prospect'); ?></li>
		<li data-t="#bookmark" data-l=<?php _e('"Bookmark"', 'prospect'); ?> data-p="bottom" data-x=0 data-y=-22><?php _e('Shows the relative size of each section of the Volume; sections that are currently displayed are orange; sections not in the Reading List are greyed out', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .view-viz-select" data-l=<?php _e('"Select Visualization"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Choose which visualization you wish to see in this Exhibit', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .hslgnd" data-l=<?php _e('"Hide/Show Legend"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this to hide or show the Legend panel', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .vopts" data-l=<?php _e('"Visualization Options"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this to show the configuration options available for this visualization', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .vnote" data-l=<?php _e('"Visualization Notes"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this to show notes providing extra explanation about this visualization', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .hilite" data-l=<?php _e('"Highlight Filter"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this to show or apply Filters that select items programatically on the current visualization', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .osel" data-l=<?php _e('"Show Highlighted"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Click this when it is pulsing to show all of the currently highlighted selection of items in the Inspector modal dialog window', 'prospect'); ?></li>
		<li data-t="#view-frame-1 .btn-num-sel" data-l=<?php _e('"Highlighted List"', 'prospect'); ?> data-p="right" data-x=0 data-y=-22><?php _e('Displays the number of items currently highlighted. Click it to display a list of the names of the items.', 'prospect'); ?></li>
	</ol>

	<ol id="help-toc-tour">
		<li data-t="#hstoc" data-l=<?php _e('"Toggle TOC/Text"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click this to toggle between the Table of Contents and the Reading Pane', 'prospect'); ?></li>
		<li data-t="#tochcall" data-l=<?php _e('"Un/Check All"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Adds all possible sections to, or removes them all from, the current Reading List', 'prospect'); ?></li>
		<li data-t="#tochsall" data-l=<?php _e('"Show/Hide All Selections"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Adds all possible sections to, or removes them all from, the current Reading Pane', 'prospect'); ?></li>
		<li data-t="#tocfind" data-l=<?php _e('"Find Text"', 'prospect'); ?> data-p="bottom" data-x=-22 data-y=0><?php _e('Click to bring up a dialog box that allows you to search for text; only sections in which that text appears will be on the resulting Reading List', 'prospect'); ?></li>
		<li data-t="#toc-frame" data-l=<?php _e('"Table of Contents"', 'prospect'); ?> data-p="right" data-x=-10 data-y=10><?php _e('The Table of Contents showing all of the sections in the Volume; checkboxes indicate which sections are on the Reading List; sections outlined in yellow are shown in the Reading Pane', 'prospect'); ?></li>
	</ol>
</div> <!-- Hidden content ->

<!-- DYNAMICALLY LOADED TEXT -->
<script id="dltext-v-map" type='text'>
	<div class="ui-widget-header ui-corner-all iconbar">
		<button id="map-zoom-<%= vi %>"><?php _e('Zoom', 'prospect'); ?></button>
		<button id="map-unzoom-<%= vi %>"><?php _e('Unzoom', 'prospect'); ?></button>
		<button id="map-reset-<%= vi %>"><?php _e('Reset', 'prospect'); ?></button>
		<button id="map-cloc-<%= vi %>"><?php _e('Current Location', 'prospect'); ?></button>
	</div>
</script>

<script id="dltext-v-nwheel" type='text'>
	<div class="ui-widget-header ui-corner-all iconbar">
		<button id="nw-prev-<%= vi %>"><?php _e('Reverse', 'prospect'); ?></button> <button id="nw-for-<%= vi %>"><?php _e('Forward', 'prospect'); ?></button>&nbsp;
		<span id="nw-size-<%= vi %>">
			<input type="radio" id="nw-size-1-<%= vi %>" name="nw-size-<%= vi %>" checked="checked">
			<label for="nw-size-1-<%= vi %>"><?php _e('Single', 'prospect'); ?></label>
			<input type="radio" id="nw-size-90-<%= vi %>" name="nw-size-<%= vi %>">
			<label for="nw-size-90-<%= vi %>">90&deg;</label>
		</span>
	</div>
</script>

<script id="dltext-filter-head" type='text'>
<div class="filter-instance" data-id="<%= newID %>">
	<div class="filter-head">
		<%= title %> &nbsp; <%= apply %></span>
		<button class="btn-filter-toggle"><?php _e('Toggle', 'prospect'); ?></button>
		<button class="btn-filter-del"><?php _e('Delete Filter', 'prospect'); ?></button>
	</div>
	<div class="filter-body">
	</div>
</div>
</script>

<script id="dltext-filter-template" type='text'>
	<input type="checkbox" class="apply-tmplt-<%= ti %>"> <?php _e('Apply to', 'prospect'); ?> <%= tl %>
</script>

<script id="dltext-filter-text" type='text'>
	<select class="filter-text-ops" value="c">
		<option value="c"><?php _e('Text contains', 'prospect'); ?></option>
		<option value="x"><?php _e('Exact match', 'prospect'); ?></option>
		<option value="r"><?php _e('Regular expression', 'prospect'); ?></option>
	</select>
	<input class="filter-text" type="text" size="20"/>
	<input type="checkbox" class="filter-text-cs" checked="checked"><?php _e('Case sensitive', 'prospect'); ?>
</script>

<script id="dltext-filter-tags" type='text'>
	<select class="filter-text-ops" value="c">
		<option value="c"><?php _e('Tag that contains', 'prospect'); ?></option>
		<option value="x"><?php _e('Exact tag match with', 'prospect'); ?></option>
		<option value="r"><?php _e('Regular expression', 'prospect'); ?></option>
	</select>
	<input class="filter-text" type="text" size="20"/>
	<input type="checkbox" class="filter-text-cs" checked="checked"><?php _e('Case sensitive', 'prospect'); ?>
</script>

<script id="dltext-filter-nums" type='text'>
	<div class="cntrl-blck">
		<input type="checkbox" class="allow-undef"> <?php _e('Allow indefinite', 'prospect'); ?><br/>
		<?php _e('Min', 'prospect'); ?> <input type="text" class="from" size="5"><br/>
		<?php _e('Max', 'prospect'); ?> <input type="text" class="to" size="5"><br/>
		<button class="filter-update" disabled="disabled"><?php _e('Use Numbers', 'prospect'); ?></button>
	</div>
</script>

<script id="dltext-filter-dates" type='text'>
	<div class="cntrl-blck">
		<input type="radio" name="dctrl-<%= id %>" value="o" checked> <?php _e('Overlap', 'prospect'); ?><br>
		<input type="radio" name="dctrl-<%= id %>" value="c"> <?php _e('Contain', 'prospect'); ?><br>
		<input type="checkbox" class="allow-undef"> <?php _e('Allow indefinite', 'prospect'); ?>
	</div>
	<div class="cntrl-blck">
		<?php _e('Date Format: YYYY &nbsp; MM &nbsp; DD', 'prospect'); ?><br/>
		<?php _e('From', 'prospect'); ?> <input type="text" class="from-y" size="5" placeholder=<?php _e('"YYYY"', 'prospect'); ?>/> <input type="text" class="from-m" size="2" placeholder=<?php _e('"MM"', 'prospect'); ?>/> <input type="text" class="from-d" size="2" placeholder=<?php _e('"DD"', 'prospect'); ?>/>
		<br/>
		<?php _e('To', 'prospect'); ?> <input type="text" class="to-y" size="5" placeholder=<?php _e('"YYYY"', 'prospect'); ?>/> <input type="text" class="to-m" size="2" placeholder=<?php _e('"MM"', 'prospect'); ?>/> <input type="text" class="to-d" size="2" placeholder=<?php _e('"DD"', 'prospect'); ?>/>
		<br/>
		<button class="filter-update" disabled="disabled"><?php _e('Use Dates', 'prospect'); ?></button>
	</div>
</script>

<script id="dltext-filter-ptr" type='text'>
	<?php _e('Points to an item label', 'prospect'); ?>
	<select class="filter-text-ops" value="c">
		<option value="c"><?php _e('that contains', 'prospect'); ?></option>
		<option value="x"><?php _e('is exact match', 'prospect'); ?></option>
		<option value="r"><?php _e('regular expression', 'prospect'); ?></option>
	</select>
	<input class="filter-text" type="text" size="20"/>
	<input type="checkbox" class="filter-text-cs" checked="checked"><?php _e('Case sensitive', 'prospect'); ?>
</script>

<script id="dltext-removehideall" type="text">
<?php _e('Remove/Hide All', 'prospect'); ?>
</script>

<script id="dltext-showhideall" type="text">
<?php _e('Show/Hide All', 'prospect'); ?>
</script>

<script id="dltext-ok" type="text">
<?php _e('OK', 'prospect'); ?>
</script>

<script id="dltext-cancel" type="text">
<?php _e('Cancel', 'prospect'); ?>
</script>

<script id="dltext-next" type="text">
<?php _e('Next', 'prospect'); ?>
</script>

<script id="dltext-prev" type="text">
<?php _e('Prev', 'prospect'); ?>
</script>

<script id="dltext-seerec" type="text">
<?php _e('See Item', 'prospect'); ?>
</script>

<script id="dltext-close" type="text">
<?php _e('Close', 'prospect'); ?>
</script>

<script id="dltext-add" type="text">
<?php _e('Add', 'prospect'); ?>
</script>

<script id="dltext-choose-att" type="text">
<?php _e('Choose Attribute', 'prospect'); ?>
</script>

<script id="dltext-to" type="text">
<?php _e('to', 'prospect'); ?>
</script>

<script id="dltext-approximately" type="text">
<?php _e('about', 'prospect'); ?>
</script>

<script id="dltext-now" type="text">
<?php _e('now', 'prospect'); ?>
</script>

<script id="dltext-undefined" type="text">
<?php _e('Indefinite', 'prospect'); ?>
</script>

<script id="dltext-delete" type="text">
<?php _e('Delete', 'prospect'); ?>
</script>

<script id="dltext-manage" type="text">
<?php _e('Manage', 'prospect'); ?>
</script>

<script id="dltext-edit" type="text">
<?php _e('Edit', 'prospect'); ?>
</script>

<script id="dltext-markers" type="text">
<?php _e('Markers', 'prospect'); ?>
</script>

<script id="dltext-hint-marker" type="text">
<?php _e('Marker size corresponds to', 'prospect'); ?>
</script>

<script id="dltext-hint-text" type="text">
<?php _e('Text size corresponds to', 'prospect'); ?>
</script>

<script id="dltext-xaxis" type="text">
<?php _e('X-Axis', 'prospect'); ?>
</script>

<script id="dltext-yaxis" type="text">
<?php _e('Y-Axis', 'prospect'); ?>
</script>

<script id="dltext-orderedby" type="text">
<?php _e('items ordered by', 'prospect'); ?>
</script>

<script id="dltext-grpblks" type="text">
<?php _e('Items grouped in blocks by', 'prospect'); ?>
</script>

<script id="dltext-reset" type="text">
<?php _e('RESET', 'prospect'); ?>
</script>

<script id="dltext-nofilter" type="text">
<?php _e('No Filters', 'prospect'); ?>
</script>

<script id="dltext-dofilters" type="text">
<?php _e('Run Filters', 'prospect'); ?>
</script>

<script id="dltext-filtered" type="text">
<?php _e('Filtered', 'prospect'); ?>
</script>

<script id="dltext-findintext" type="text">
<?php _e('Find In Text', 'prospect'); ?>
</script>

<script id="dltext-selected" type="text">
<?php _e('selected', 'prospect'); ?>
</script>

<script id="dltext-sync-xscript" type="text">
<input type="checkbox" id="sync-xscript" name="sync-xscript" checked> <?php _e('Scroll transcript to follow playback', 'prospect'); ?>
</script>

<script id="dltext-month-names" type="text">
<?php _e('Jan|Feb|Mar|Apr|May|June|July|Aug|Sep|Oct|Nov|Dec', 'prospect'); ?>
</script>

<!-- Localization data for D3JS: see https://github.com/mbostock/d3/wiki/Localization -->
<!-- Leave empty if no localization needed (English default) -->
<script id="dltext-d3-local" type="text">
no-d3-local
</script>

<script id="dltext-pstates" type="text">
<?php _e('Loading|Processing|Building|Updating|Ready', 'prospect'); ?>
</script>
