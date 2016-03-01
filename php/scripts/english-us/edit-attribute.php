
<!-- Ractive Template for jQueryUI Dialog Component -->
<script id="dialog-r-template" type='text/ractive'>
	<div class="jq-dialog-template" title="{{title}}">
		{{yield}}
	</div> <!-- dialog -->
</script>

<!-- Ractive Template for Iris Color Picker -->
<script id="iris-r-template" type='text/ractive'>
	<input class="jq-iris-template" type="text" size="11" value="{{color}}"/>
</script>


<!-- Partial: generic Legend toolbar -->
<script id='legendBtns' type='text/ractive'>
	<div class="ui-widget-header ui-corner-all legend-btn-set">
		<button decorator="iconButton:ui-icon-wrench" on-click="doLegendEdit:{{index}}"><?php _e('Edit Entry', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-arrowthick-1-n" on-click="doLegendUp:{{index}}"><?php _e('Move Up', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-arrowthick-1-s" on-click="doLegendDown:{{index}}"><?php _e('Move Down', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-trash" on-click="doLegendDel:{{index}}"><?php _e('Delete', 'prospect'); ?></button>
	</div>
</script>

<!-- Partial: Generic Data entry for Legend -->
<script id='legendDataEntry' type='text/ractive'>
	<div class="legend-data-entry">
		<span class="legend-label">{{l}}</span> <span class="legend-val">{{val}}</span>
		<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{v}}" on-click="doLegendViz:{{index}}"></span>
		{{>legendBtns}}
	</div>
</script>


<!-- Partial: Range for Number -->
<script id="rangeNum" type='text/ractive'>
	<h3><?php _e('Set Valid Number Range', 'prospect'); ?></h3>
	<label for="num-r-min"><?php _e('Minimum number', 'prospect'); ?>: </label>
	<input type="text" id="num-r-min" value='{{theRange.min}}' placeholder="Min val" size="8"/>
	<label for="num-r-max"><?php _e('Maximum number', 'prospect'); ?>: </label>
	<input type="text" id="num-r-max" value='{{theRange.max}}' placeholder="Max val" size="8"/>
	<br/>
	<label for="num-g"><?php _e('Group values together by', 'prospect'); ?> </label>
	<input type="number" id="num-g" value='{{theRange.g}}' min="0" max="4"/> <?php _e('digits', 'prospect'); ?>
	<br/>
	<?php _e('Use', 'prospect'); ?> 
	<input type='checkbox' checked='{{theRange.useU}}'/> <?php _e('color for indefinite Number values ', 'prospect'); ?> 
	<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{theRange.u}}" on-click="setUColor"></span>
</script>

<!-- Partial: Range for Dates -->
<script id="rangeDates" type='text/ractive'>
	<h3><?php _e('Set Valid Date Range', 'prospect'); ?></h3>
	<?php _e('Earliest Date', 'prospect'); ?>:
		<label for="date-r-min-y"><?php _e('Year', 'prospect'); ?> </label> <input type="text" id="date-r-min-y" value='{{theRange.min.y}}' placeholder="YYYY" size="6" pattern="(open|-?\d+)" required>
		<label for="date-r-min-m"><?php _e('Month', 'prospect'); ?> </label> <input type="text" id="date-r-min-m" value='{{theRange.min.m}}' placeholder="MM" size="2" pattern="\d{0,2}">
		<label for="date-r-min-d"><?php _e('Day', 'prospect'); ?> </label> <input type="text" id="date-r-min-d" value='{{theRange.min.d}}' placeholder="DD" size="2" pattern="\d{0,2}">
		<br/>
	<?php _e('Latest Date', 'prospect'); ?>:
		<label for="date-r-max-y"><?php _e('Year', 'prospect'); ?> </label> <input type="text" id="date-r-max-y" value='{{theRange.max.y}}' placeholder="YYYY" size="6" pattern="(open|~?-?\d+)">
		<label for="date-r-max-m"><?php _e('Month', 'prospect'); ?> </label> <input type="text" id="date-r-max-m" value='{{theRange.max.m}}' placeholder="MM" size="2" pattern="\d{0,2}">
		<label for="date-r-max-d"><?php _e('Day', 'prospect'); ?> </label> <input type="text" id="date-r-max-d" value='{{theRange.max.d}}' placeholder="DD" size="2" pattern="\d{0,2}">
		<br/>
	<label for="date-g"><?php _e('Group Dates together by', 'prospect'); ?></label>
	<select id="date-g" value='{{theRange.g}}'>
		<option value="d"><?php _e('Day', 'prospect'); ?></option>
		<option value="m"><?php _e('Month', 'prospect'); ?></option>
		<option value="y"><?php _e('Year', 'prospect'); ?></option>
		<option value="t"><?php _e('Decade', 'prospect'); ?></option>
		<option value="c"><?php _e('Century', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Use', 'prospect'); ?> 
	<input type='checkbox' checked='{{theRange.useU}}'/> <?php _e('color for indefinite Number values ', 'prospect'); ?> 
	<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{theRange.u}}" on-click="setUColor"></span>
</script>


<!-- Partial: Legend for Vocabulary -->
<script id="legendVocab" type='text/ractive'>
	<h3><?php _e('Configure Vocabulary Legend', 'prospect'); ?></h3>
	<button id="vocab-add-terms" on-click="addTerms"><?php _e('Add Terms', 'prospect'); ?></button>
	<button on-click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
	{{#if others.length > 0}}
		<button on-click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
	{{/if}}
	<br/>
	<input type="text" id="vocab-new-term" value='{{newVocab}}' placeholder=<?php _e('"New Vocab Term"', 'prospect'); ?> size="24"/>
	<label for="vocab-new-term"><?php _e(' New Term', 'prospect'); ?></label>
	<button on-click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
	<br/>
	<div class="legend-vocab">
		{{#if theLegend.length}}
		<ol class="vocab-parent">
			{{#each theLegend:index1}}
				<li class="legend-data-entry" id="vocab_{{index1}}">
					<span class="legend-label">{{l}}</span>
					<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{v}}" on-click="doLegendViz:{{index1}}"></span>
					<div class="ui-widget-header ui-corner-all legend-btn-set">
						<button decorator="iconButton:ui-icon-transfer-e-w" on-click="doVocabMove:{{index1}}"><?php _e('Move Entries', 'prospect'); ?></button>
						<button decorator="iconButton:ui-icon-arrowthick-1-n" on-click="doLegendUp:{{index1}}"><?php _e('Move Up', 'prospect'); ?></button>
						<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="doLegendTop:{{index1}}"><?php _e('Move To Top', 'prospect'); ?></button>
						<button decorator="iconButton:ui-icon-arrowthick-1-s" on-click="doLegendDown:{{index1}}"><?php _e('Move Down', 'prospect'); ?></button>
						<button decorator="iconButton:ui-icon-arrowthickstop-1-s" on-click="doLegendBottom:{{index1}}"><?php _e('Move To Bottom', 'prospect'); ?></button>
						<button decorator="iconButton:ui-icon-trash" on-click="doLegendDel:{{index1}}"><?php _e('Delete', 'prospect'); ?></button>
					</div>
					{{#if z.length >= 1}}
					<ol class='vocab-children'>
						{{#each z:index2}}
							<li class="legend-data-entry" id="vocab_{{index1}}_{{index2}}">
								{{l}}
								{{#if v.length > 1}}
								<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{v}}" on-click="doLegendViz:{{index1}},{{index2}}"></span>
								{{else}}
								<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" on-click="doLegendViz:{{index1}},{{index2}}"></span>
								{{/if}}
								<div class="ui-widget-header ui-corner-all legend-btn-set">
									<button decorator="iconButton:ui-icon-transfer-e-w" on-click="doVocabMove:{{index1}},{{index2}}"><?php _e('Move Entry', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-arrowthick-1-n" on-click="doLegendUp:{{index1}},{{index2}}"><?php _e('Move Up', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="doLegendTop:{{index1}},{{index2}}"><?php _e('Move To Top', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-arrowthick-1-s" on-click="doLegendDown:{{index1}},{{index2}}"><?php _e('Move Down', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-arrowthickstop-1-s" on-click="doLegendBottom:{{index1}},{{index2}}"><?php _e('Move To Bottom', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-trash" on-click="doLegendDel:{{index1}},{{index2}}"><?php _e('Delete', 'prospect'); ?></button>
								</div>
							</li>
						{{/each}}
					</ol>
					{{/if}}
				</li>
			{{/each}}
		</ol>
		{{/if}}
	</div>
</script>

<!-- Partial: Legend for Text -->
<script id="legendText" type='text/ractive'>
	<h3><?php _e('Configure Text Legend', 'prospect'); ?></h3>
	<button on-click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
	<button on-click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
	{{#if others.length > 0}}
		<button on-click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
	{{/if}}
	<br/>
	<div class="legend-data">
		{{#each theLegend:index}}
			{{>legendDataEntry}}
		{{/each}}
	</div>
</script>

<!-- Partial: Legend for Number -->
<script id="legendNum" type='text/ractive'>
	<h3><?php _e('Configure Numeric Legend', 'prospect'); ?></h3>
	<button on-click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
	<button on-click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
	{{#if others.length > 0}}
		<button on-click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
	{{/if}}
	<br/>
	<div class="legend-data">
		{{#each theLegend:index}}
			{{>legendDataEntry}}
		{{/each}}
	</div>
</script>

<!-- Partial: Legend for Dates -->
<script id="legendDates" type='text/ractive'>
	<h3><?php _e('Configure Date Legend', 'prospect'); ?></h3>
	<button on-click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
	<button on-click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
	{{#if others.length > 0}}
		<button on-click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
	{{/if}}
	<br/>
	<div class="legend-data">
		{{#each theLegend:index}}
			{{>legendDataEntry}}
		{{/each}}
	</div>
</script>


<!-- Outer-most (application) layer of output for Ractive to generate -->
<script id="ractive-base" type='text/ractive'>
	<div id="att-insert-dialog"></div>
	{{#if errorMsg.length > 0}}
	<div id="error-frame">{{errorMsg}}</div>
	{{/if}}
	<button id="prsp-save-data" on-click="saveAttribute"><?php _e('Verify and Save Attribute Definition', 'prospect'); ?></button><br/>
	<?php _e('Attribute’s external label', 'prospect'); ?>: <input value='{{theAttribute.l}}' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
	<?php _e('Privacy Setting', 'prospect'); ?>: <select value='{{privacy}}'>
		<option value="o"><?php _e('Open (Public)', 'prospect'); ?></option>
		<option value="p"><?php _e('Private', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Attribute’s unique internal id', 'prospect'); ?>: 
	<input value='{{attID}}' placeholder=<?php _e('"Enter id"', 'prospect'); ?> size="24" pattern="[\w\-]+" required/>
	<button decorator="iconButton:ui-icon-info" on-click="idHint"><?php _e('Hint about IDs', 'prospect'); ?></button>
	<select value='{{chosenCF}}'>
		{{#each cfs}}
			<option>{{this}}</option>
		{{/each}}
	</select>
	<button on-click="copyCF"><?php _e('Use this Custom Field name', 'prospect'); ?></button>
	<br/>
	<?php _e('Attribute value delimiter (single character or blank)', 'prospect'); ?>: <input value='{{theAttribute.d}}' size="2"/><br/>
	<?php _e('Contributor Hint', 'prospect'); ?>: <br/>
	<input type="text" size="64" maxlength="128" placeholder=<?php _e('"Explain Attribute entry to contributor"', 'prospect'); ?> value="{{theAttribute.h}}" /><br/>
	<?php _e('Data type', 'prospect'); ?>: 
	<select value='{{theAttribute.t}}'>
		{{#each dataTypes}}
			<option value="{{code}}">{{label}}</option>
		{{/each}}
	</select><br/>

	{{#if theAttribute.t == 'N'}}
		{{>rangeNum}}
	{{elseif theAttribute.t == 'D'}}
		{{>rangeDates}}
	{{else}}
		<?php _e('(no Range settings for this data type)', 'prospect'); ?><br/>
	{{/if}}

	{{#if theAttribute.t == 'V'}}
		{{>legendVocab}}
	{{elseif theAttribute.t == 'T'}}
		{{>legendText}}
	{{elseif theAttribute.t == 'N'}}
		{{>legendNum}}
	{{elseif theAttribute.t == 'D'}}
		{{>legendDates}}
	{{else}}
		<?php _e('(no Legend available for this data type)', 'prospect'); ?><br/>
	{{/if}}
</script>


<!-- Create/Edit Text Legend Dialog -->
<script id="dialog-legend-text" type='text/ractive'>
	<dialog title=<?php _e('"Text Legend Entry"', 'prospect'); ?> width="300" height="200">
		<?php _e('Label', 'prospect'); ?>: <input type="text" size="20" value="{{label}}" placeholder=<?php _e('"Enter Label"', 'prospect'); ?>/><br>
		<?php _e('Text pattern', 'prospect'); ?>: <input type="text" size="16" value="{{pattern}}" placeholder=<?php _e('"Enter Text Pattern"', 'prospect'); ?>/><br>
	</dialog>
</script>

<!-- Create/Edit Number Legend Dialog -->
<script id="dialog-legend-number" type='text/ractive'>
	<dialog title=<?php _e('"Number Legend Entry"', 'prospect'); ?> width="300" height="250">
		<?php _e('Label for Range', 'prospect'); ?>: <input type="text" size="12" value="{{label}}" placeholder=<?php _e('"Enter Label"', 'prospect'); ?>/><br>
		<?php _e('Minimum Value', 'prospect'); ?>: <input type="text" size="8" value="{{min}}" pattern="\d*"/><br>
		<?php _e('Maximum Value', 'prospect'); ?>: <input type="text" size="8" value="{{max}}" pattern="\d*"/>
	</dialog>
</script>

<!-- Create/Edit Dates Legend Dialog -->
<script id="dialog-legend-dates" type='text/ractive'>
	<dialog title=<?php _e('"Date Legend Entry"', 'prospect'); ?> width="400" height="210">
		<?php _e('Label for Range', 'prospect'); ?>: <input type="text" size="20" value="{{label}}" required placeholder=<?php _e('"Enter Range Label"', 'prospect'); ?>/><br>
		<?php _e('Start Date: Year', 'prospect'); ?> <input type="text" size="5" value="{{min.y}}" placeholder="YYYY" pattern="(open|-?\d+)"/>
		<?php _e('Month', 'prospect'); ?> <input type="text" size="2" value="{{min.m}}" placeholder="MM" pattern="\d{0,2}"/>
		<?php _e('Day', 'prospect'); ?> <input type="text" size="2" value="{{min.d}}" placeholder="DD" pattern="\d{0,2}"/>
		<br>
		<?php _e('End Date: Year', 'prospect'); ?> <input type="text" size="5" value="{{max.y}}" placeholder="YYYY" pattern="(open|-?\d+)"/>
		<?php _e('Month', 'prospect'); ?> <input type="text" size="2" value="{{max.m}}" placeholder="MM" pattern="\d{0,2}"/>
		<?php _e('Day', 'prospect'); ?> <input type="text" size="2" value="{{max.d}}" placeholder="DD" pattern="\d{0,2}"/>
	</dialog>
</script>

<!-- Move Vocab Dialog for top-level non-child -->
<script id="dialog-move-vocab-lone" type='text/ractive'>
	<dialog title=<?php _e('"Move Vocabulary Entry"', 'prospect'); ?> width="400" height="200">
		<?php _e('Move this Term so it becomes a child of', 'prospect'); ?> <br/>
		<select value='{{newParent}}'>
			{{#each parents}}
				<option>{{this}}</option>
			{{/each}}
		</select>
		<br/>
		<input type='radio' name='{{keep}}' value='yes'/> <?php _e('Keep visual config', 'prospect'); ?>
		<input type='radio' name='{{keep}}' value='no'/> <?php _e('Clear visual config', 'prospect'); ?>
	</dialog>
</script>

<!-- Move Vocab Dialog for top-level parent -->
<script id="dialog-move-vocab-parent" type='text/ractive'>
	<dialog title=<?php _e('"Move Vocabulary Children"', 'prospect'); ?> width="400" height="200">
		<input type='radio' name='{{up}}' value='yes'/> <?php _e('Move all children to top (parent) level', 'prospect'); ?> 
		<br/>
		<input type='radio' name='{{up}}' value='no'/>  <?php _e('Move all to new parent', 'prospect'); ?>
		<br/>
		<?php _e('New parent', 'prospect'); ?> 
		<select value='{{newParent}}'>
			{{#each parents}}
				<option>{{this}}</option>
			{{/each}}
		</select>
	</dialog>
</script>

<!-- Move Vocab Dialog for child node -->
<script id="dialog-move-vocab-child" type='text/ractive'>
	<dialog title=<?php _e('"Move Vocabulary Entry"', 'prospect'); ?> width="400" height="200">
		<input type='radio' name='{{up}}' value='yes'/> <?php _e('Move to top (parent) level', 'prospect'); ?>
		<input type='radio' name='{{up}}' value='no'/> <?php _e('Move to new parent', 'prospect'); ?>
		<br/>
		<?php _e('New Parent', 'prospect'); ?> <select value='{{newParent}}'>
			{{#each parents}}
				<option>{{this}}</option>
			{{/each}}
		</select>
	</dialog>
</script>

<!-- Reset Colors Dialog -->
<script id="dialog-reset-colors" type='text/ractive'>
	<dialog title=<?php _e('"Reset Colors"', 'prospect'); ?> width="300" height="200">
		<input type='radio' name='{{reset}}' value='random'/> <?php _e('Random Colors', 'prospect'); ?>
		<br/>
		<input type='radio' name='{{reset}}' value='gradient'/> <?php _e('Create Gradient', 'prospect'); ?>
		<br/>
		<?php _e('From', 'prospect'); ?> <span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c0}}" on-click="selectColor:'0'"></span>
		<?php _e('To', 'prospect'); ?> <span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c1}}" on-click="selectColor:'1'"></span>
		<div id="insert-2nd-dialog"></div>
	</dialog>
</script>


<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/ractive'>
	<dialog title=<?php _e('"Confirm"', 'prospect'); ?> width="320" height="300">
		{{message}}
	</dialog>
</script>

<!-- Hint Dialog -->
<script id="dialog-message" type='text/ractive'>
	<dialog title=<?php _e('"Display Hint"', 'prospect'); ?> width="300" height="300" cancel="false">
		{{message}}
	</dialog>
</script>

<!-- Color Choice Dialog -->
<script id="dialog-choose-color" type='text/ractive'>
	<dialog title=<?php _e('"Choose Color"', 'prospect'); ?> width="250" height="330">
		<iris color="{{color}}"></iris>
	</dialog>
</script>

<!-- Color Choice w/Clear Dialog -->
<script id="dialog-choose-color-clear" type='text/ractive'>
	<dialog title=<?php _e('"Choose Color"', 'prospect'); ?> width="250" height="355">
		<input type='checkbox' checked='{{doClear}}'> <?php _e('Remove visuals', 'prospect'); ?><br/>
		<iris color="{{color}}"></iris>
	</dialog>
</script>

<!-- List of peer Attributes with Legends Dialog -->
<script id="dialog-copy-legend" type='text/ractive'>
	<dialog title=<?php _e('"Choose Attribute"', 'prospect'); ?> width="400" height="230">
		<?php _e('Choose the Attribute whose Legend you wish to copy over the current Legend you are editing.', 'prospect'); ?>
		<br/>
		<b><?php _e('WARNING: No undo.', 'prospect'); ?></b><br/>
		<label for="choose-att">Attribute </label>
		<select id="choose-att" value='{{fid}}'>
		{{#each others}}
			<option value="{{this.id}}">{{this.l}} ({{this.id}})</option>
		{{/each}}
	</dialog>
</script>


<!-- DYNAMIC TEXT -->
<script id="dltext-attributes" type='text/ractive'>
<?php _e('V,Vocabulary|T,Text|g,Tags|N,Number|D,Dates|L,Lat-Lon|X,X-Y|I,Image|l,Link To|S,Audio|Y,YouTube|x,Transcript|t,Timecode|P,Pointer|J,Join', 'prospect'); ?>
</script>


<!-- ERRORS -->
<script id="errmsg-no-term-name" type='text/ractive'>
<?php _e('You must supply a name for the new Term.', 'prospect'); ?>
</script>

<script id="errmsg-no-id" type='text/ractive'>
<?php _e('You must supply an internal ID for the Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-id-too-long" type='text/ractive'>
<?php _e('The Attribute internal ID is too long.', 'prospect'); ?>
</script>

<script id="errmsg-id-bad-chars" type='text/ractive'>
<?php _e('An Attribute internal ID must consist of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text/ractive'>
<?php _e('You must supply a label for the Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-label-too-long" type='text/ractive'>
<?php _e('The Attribute label is too long.', 'prospect'); ?>
</script>

<script id="errmsg-no-custom-field" type='text/ractive'>
<?php _e('You have not specified a custom field.', 'prospect'); ?>
</script>

<script id="errmsg-delim-too-long" type='text/ractive'>
<?php _e('The delimiter can only be 1 character, if specified at all.', 'prospect'); ?>
</script>

<script id="errmsg-id-taken" type='text/ractive'>
<?php _e('Another Attribute with that ID already exists. Please choose another.', 'prospect'); ?>
</script>

<script id="errmsg-term-name-taken" type='text/ractive'>
<?php _e('A Term with that name already exists in the Vocabulary.', 'prospect'); ?>
</script>

<script id="errmsg-too-few-vocab" type='text/ractive'>
<?php _e('No Vocabulary movements are possible until you have at least 2 Terms.', 'prospect'); ?>
</script>

<script id="errmsg-num-need-bound" type='text/ractive'>
<?php _e('You must either have a minimum or maximum Number bound (preferably both).', 'prospect'); ?>
</script>

<script id="errmsg-range-not-valid" type='text/ractive'>
<?php _e('One of your Number range boundaries is not a valid integer value.', 'prospect'); ?>
</script>

<script id="errmsg-num-range-inverted" type='text/ractive'>
<?php _e('One of the Number Legend entries has a minimum value that is greater than the maximum value.', 'prospect'); ?>
</script>

<script id="errmsg-no-min-date" type='text/ractive'>
<?php _e('You must provide a valid year for the minimum date range.', 'prospect'); ?>
</script>

<script id="errmsg-bad-year" type='text/ractive'>
<?php _e('A year you have given was not formatted as a valid number.', 'prospect'); ?>
</script>

<script id="errmsg-bad-month" type='text/ractive'>
<?php _e('A month number you have given is not valid (it must be 1-12).', 'prospect'); ?>
</script>

<script id="errmsg-bad-day" type='text/ractive'>
<?php _e('A day number you have given is not valid (it must be 1-31).', 'prospect'); ?>
</script>

<script id="errmsg-date-no-bound" type='text/ractive'>
<?php _e('You have a Date Legend without start or end year; you must specify at least one of these.', 'prospect'); ?>
</script>

<script id="errmsg-date-range-inverted" type='text/ractive'>
<?php _e('One of the Date Legend entries has a start date that is greater than the end date.', 'prospect'); ?>
</script>

<script id="errmsg-delim-bad-type" type='text/ractive'>
<?php _e('You cannot use a delimiter with this type of Attribute (Vocabulary, Tags, Lat-Lon and Pointer only).', 'prospect'); ?>
</script>

<script id="errmsg-delim-no-sp" type='text/ractive'>
<?php _e('You cannot use a space as a delimiter.', 'prospect'); ?>
</script>

<script id="errmsg-delim-comma-ll" type='text/ractive'>
<?php _e('You cannot use a comma as a delimiter with a Lat-Lon Attribute.', 'prospect'); ?>
</script>

<!-- MESSAGES -->

<script id="msg-confirm-del-vocab" type='text/ractive'>
<?php _e('Are you sure you wish to delete this Legend entry?', 'prospect'); ?>
</script>

<script id="msg-confirm-add-vocab" type='text/ractive'>
<?php _e('Vocabulary terms will be added to the current list based on those used by current Records. Are you sure that you provided the correct internal ID and delimiter settings? To ensure unused items are removed from your Vocabulary, delete all current terms.', 'prospect'); ?>
</script>
