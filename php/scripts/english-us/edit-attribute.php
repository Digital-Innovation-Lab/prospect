
<!-- Outer-most (application) layer of output for Ractive to generate -->
<div id="vue-outer">
	<div v-if="errorMsg.length > 0" id="error-frame">{{errorMsg}}</div>
	<button id="prsp-save-data" v-on:click="saveAttribute"><?php _e('Verify and Prepare Attribute Definition for Publish/Update', 'prospect'); ?></button><br/>
	<?php _e('Attribute’s external label', 'prospect'); ?>: <input v-model='label' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
	<?php _e('Privacy Setting', 'prospect'); ?>: <select v-model='privacy'>
		<option value="o"><?php _e('Open (Public)', 'prospect'); ?></option>
		<option value="p"><?php _e('Private', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Attribute’s unique internal id', 'prospect'); ?>:
	<input v-model='attID' placeholder=<?php _e('"Enter id"', 'prospect'); ?> size="24" pattern="[\w\-]+" required/>
	<icon-btn symbol="ui-icon-info" v-on:click="idHint" label=<?php _e('"Hint about IDs"', 'prospect'); ?>></icon-btn>
	<select v-model="chosenCF">
		<option v-for="thisCF in cfs">
			{{ thisCF }}
		</option>
	</select>
	<button v-on:click="copyCF"><?php _e('Use this Custom Field name', 'prospect'); ?></button>
	<br/>
	<?php _e('Attribute value delimiter (single character or blank)', 'prospect'); ?>: <input v-model='delim' size="2"/> &nbsp;
	<?php _e('Available as Filter in Exhibit', 'prospect'); ?> <input type='checkbox' v-model='fAvail'/>
	<br/>
	<?php _e('Contributor Hint', 'prospect'); ?>: <br/>
	<input type="text" size="64" maxlength="128" placeholder=<?php _e('"Explain Attribute entry to contributor"', 'prospect'); ?> v-model="hint" /><br/>
	<?php _e('Data type', 'prospect'); ?>:
	<select v-model="thisType">
		<option v-for="aType in dataTypes" v-bind:value="aType.code">
			{{ aType.label }}
		</option>
	</select><br/>

		<!-- Show settings editing depending on type of Attribute -->
	<div v-if="thisType === 'V'">
		<h3><?php _e('Configure Vocabulary Legend', 'prospect'); ?></h3>
		<button v-on:click="collectTerms"><?php _e('Collect Terms', 'prospect'); ?></button>
		<button v-on:click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
		<button v-if="others.length > 0" v-on:click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
		<br/>
		<input type="text" id="vocab-new-term" v-model='newVocab' placeholder=<?php _e('"New Vocab Term"', 'prospect'); ?> size="24"/>
		<label for="vocab-new-term"><?php _e(' New Term', 'prospect'); ?></label>
		<button v-on:click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
		<br/>
		<div class="legend-vocab">
			<ol class="vocab-parent">
				<li v-for="(lgnd1, index1) in vLegend" class="legend-data-entry">
					<span class="legend-label">{{lgnd1.l}}</span>
					<input type="color" v-model="lgnd1.v"/>
					<div class="ui-widget-header ui-corner-all legend-btn-set">
						<icon-btn symbol="ui-icon-transfer-e-w" v-on:click="doVocabMove(index1,-1)" label=<?php _e('"Move Entries"', 'prospect'); ?>></icon-btn>
						<icon-btn symbol="ui-icon-arrowthick-1-n" v-on:click="doLegendUp(index1,-1)" label=<?php _e('"Move Up"', 'prospect'); ?>></icon-btn>
						<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="doLegendTop(index1,-1)" label=<?php _e('"Move To Top"', 'prospect'); ?>></icon-btn>
						<icon-btn symbol="ui-icon-arrowthick-1-s" v-on:click="doLegendDown(index1,-1)" label=<?php _e('"Move Down"', 'prospect'); ?>></icon-btn>
						<icon-btn symbol="ui-icon-arrowthickstop-1-s" v-on:click="doLegendBottom(index1,-1)" label=<?php _e('"Move To Bottom"', 'prospect'); ?>></icon-btn>
						<icon-btn symbol="ui-icon-trash" v-on:click="doLegendDel(index1,-1)" label=<?php _e('"Delete"', 'prospect'); ?>></icon-btn>
					</div>
					<ol v-if="lgnd1.z.length >= 1" class='vocab-children'>
						<li v-for="(lgnd2, index2) in lgnd1.z" class="legend-data-entry">
							{{lgnd2.l}}
							<span v-if="lgnd2.v.length > 1" title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" v-bind:style="'background-color:' + v" v-on:click="doLegendViz(index1,index2)"></span>
							<span v-else title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" v-on:click="doLegendViz(index1,index2)"></span>
							<div class="ui-widget-header ui-corner-all legend-btn-set">
								<icon-btn symbol="ui-icon-transfer-e-w" v-on:click="doVocabMove(index1,index2)" label=<?php _e('"Move Entry"', 'prospect'); ?>></icon-btn>
								<icon-btn symbol="ui-icon-arrowthick-1-n" v-on:click="doLegendUp(index1,index2)" label=<?php _e('"Move Up"', 'prospect'); ?>></icon-btn>
								<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="doLegendTop(index1,index2)" label=<?php _e('"Move To Top"', 'prospect'); ?>></icon-btn>
								<icon-btn symbol="ui-icon-arrowthick-1-s" v-on:click="doLegendDown(index1,index2)" label=<?php _e('"Move Down"', 'prospect'); ?>></icon-btn>
								<icon-btn symbol="ui-icon-arrowthickstop-1-s" v-on:click="doLegendBottom(index1,index2)" label=<?php _e('"Move To Bottom"', 'prospect'); ?>></icon-btn>
								<icon-btn symbol="ui-icon-trash" v-on:click="doLegendDel(index1,index2)" label=<?php _e('"Delete"', 'prospect'); ?>></icon-btn>
							</div>
						</li>
					</ol>
				</li>
			</ol>
		</div>
	</div> <!-- Vocab editing -->
	<div v-if="thisType === 'T'">
		<h3><?php _e('Configure Text Legend', 'prospect'); ?></h3>
		<button v-on:click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
		<button v-on:click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
		<button v-if="others.length > 0" v-on:click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
		<br/>
		<div v-for="(lgnd, index) in tLegend" class="legend-data-entry">
			<span class="legend-label">{{lgnd.l}}</span> <span class="legend-val">{{lgnd.val}}</span>
			<input type="color" v-model="lgnd.v"/>
			<div class="ui-widget-header ui-corner-all legend-btn-set">
				<icon-btn symbol="ui-icon-wrench" v-on:click="doLegendEdit(index,-1)" label=<?php _e('"Edit Entry"', 'prospect'); ?>></icon-btn>
				<icon-btn symbol="ui-icon-arrowthick-1-n" v-on:click="doLegendUp(index,-1)" label=<?php _e('"Move Up"', 'prospect'); ?>></icon-btn>
				<icon-btn symbol="ui-icon-arrowthick-1-s" v-on:click="doLegendDown(index,-1)" label=<?php _e('"Move Down"', 'prospect'); ?>></icon-btn>
				<icon-btn symbol="ui-icon-trash" v-on:click="doLegendDel(index,-1)" label=<?php _e('"Delete"', 'prospect'); ?>></icon-btn>
			</div>
		</div>
	</div> <!-- Text editing -->
	<div v-if="thisType === 'N'">
		<h3><?php _e('Set Valid Number Range', 'prospect'); ?></h3>
		<label for="num-r-min"><?php _e('Minimum number', 'prospect'); ?>: </label>
		<input type="text" id="num-r-min" v-model='nRange.min' placeholder="Min val" size="8"/>
		<label for="num-r-max"><?php _e('Maximum number', 'prospect'); ?>: </label>
		<input type="text" id="num-r-max" v-model='nRange.max' placeholder="Max val" size="8"/>
		<br/>
		<label for="num-g"><?php _e('Group values together by', 'prospect'); ?> </label>
		<input type="number" id="num-g" v-model='nRange.group' min="0" max="4"/> <?php _e('digits', 'prospect'); ?>
		<br/>
		<?php _e('Use', 'prospect'); ?>
		<input type='checkbox' v-model='nRange.useU'/> <?php _e('color for indefinite Number values ', 'prospect'); ?>
		<input type="color" v-model="nRange.u"/>
		<h3><?php _e('Configure Numeric Legend', 'prospect'); ?></h3>
		<button v-on:click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
		<button v-on:click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
		<button v-if="others.length > 0" v-on:click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
		<br/>
		<div class="legend-data">
			<div v-for="(lgnd, index) in nLegend" class="legend-data-entry">
				<span class="legend-label">{{lgnd.l}}</span> <span class="legend-val">{{lgnd.val}}</span>
				<input type="color" v-model="lgnd.v"/>
				<div class="ui-widget-header ui-corner-all legend-btn-set">
					<icon-btn symbol="ui-icon-wrench" v-on:click="doLegendEdit(index,-1)" label=<?php _e('"Edit Entry"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-arrowthick-1-n" v-on:click="doLegendUp(index,-1)" label=<?php _e('"Move Up"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-arrowthick-1-s" v-on:click="doLegendDown(index,-1)" label=<?php _e('"Move Down"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-trash" v-on:click="doLegendDel(index,-1)" label=<?php _e('"Delete"', 'prospect'); ?>></icon-btn>
				</div>
			</div>
		</div>
	</div> <!-- Number editing -->
	<div v-if="thisType === 'D'">
		<h3><?php _e('Set Valid Date Range', 'prospect'); ?></h3>
		<?php _e('Earliest Date', 'prospect'); ?>:
			<label for="date-r-min-y"><?php _e('Year', 'prospect'); ?> </label> <input type="text" id="date-r-min-y" v-model='dRange.min.y' placeholder="YYYY" size="6" pattern="(open|-?\d+)" required>
			<label for="date-r-min-m"><?php _e('Month', 'prospect'); ?> </label> <input type="text" id="date-r-min-m" v-model='dRange.min.m' placeholder="MM" size="2" pattern="\d{0,2}">
			<label for="date-r-min-d"><?php _e('Day', 'prospect'); ?> </label> <input type="text" id="date-r-min-d" v-model='dRange.min.m' placeholder="DD" size="2" pattern="\d{0,2}">
			<br/>
		<?php _e('Latest Date', 'prospect'); ?>:
			<label for="date-r-max-y"><?php _e('Year', 'prospect'); ?> </label> <input type="text" id="date-r-max-y" v-model='dRange.max.y' placeholder="YYYY" size="6" pattern="(open|~?-?\d+)">
			<label for="date-r-max-m"><?php _e('Month', 'prospect'); ?> </label> <input type="text" id="date-r-max-m" v-model='dRange.max.m' placeholder="MM" size="2" pattern="\d{0,2}">
			<label for="date-r-max-d"><?php _e('Day', 'prospect'); ?> </label> <input type="text" id="date-r-max-d" v-model='dRange.max.d' placeholder="DD" size="2" pattern="\d{0,2}">
			<br/>
		<label for="date-g"><?php _e('Group Dates together by', 'prospect'); ?></label>
		<select id="date-g" v-model='dRange.group'>
			<option value="d"><?php _e('Day', 'prospect'); ?></option>
			<option value="m"><?php _e('Month', 'prospect'); ?></option>
			<option value="y"><?php _e('Year', 'prospect'); ?></option>
			<option value="t"><?php _e('Decade', 'prospect'); ?></option>
			<option value="c"><?php _e('Century', 'prospect'); ?></option>
		</select>
		<br/>
		<?php _e('Use', 'prospect'); ?>
		<input type='checkbox' v-model='dRange.useU'/> <?php _e('color for indefinite Number values ', 'prospect'); ?>>
		<input type="color" v-model="dRange.u"/>
		<div class="legend-data">
			<h3><?php _e('Configure Dates Legend', 'prospect'); ?></h3>
			<button v-on:click="resetLegend"><?php _e('Reset Visuals', 'prospect'); ?></button>
			<button v-on:click="addLegend"><?php _e('Add Entry', 'prospect'); ?></button>
			<button v-if="others.length > 0" v-on:click="copyLegend"><?php _e('Copy Legend', 'prospect'); ?></button>
			<br/>
			<div v-for="(lgnd, index) in dLegend" class="legend-data-entry">
				<span class="legend-label">{{lgnd.l}}</span> <span class="legend-val">{{lgnd.val}}</span>
				<input type="color" v-model="lgnd.v"/>
				<div class="ui-widget-header ui-corner-all legend-btn-set">
					<icon-btn symbol="ui-icon-wrench" v-on:click="doLegendEdit(index)" label=<?php _e('"Edit Entry"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-arrowthick-1-n" v-on:click="doLegendUp(index)" label=<?php _e('"Move Up"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-arrowthick-1-s" v-on:click="doLegendDown(index)" label=<?php _e('"Move Down"', 'prospect'); ?>></icon-btn>
					<icon-btn symbol="ui-icon-trash" v-on:click="doLegendDel(index)" label=<?php _e('"Delete"', 'prospect'); ?>></icon-btn>
				</div>
			</div>
		</div>
	</div>

	<component :is="modalShowing" :params="modalParams">
	</component>
</div>

<!-- VueJS Template Dialog Component -->
<script id="dialog-template" type="text/x-template">
	<div class="dialog-wrap open">
		<div>
			<div class="title">{{title}}</div>
			<slot></slot>
			<button class="btn cancel" v-if="cancel == 'true'" v-on:click="close"><?php _e('Cancel', 'prospect'); ?></button>
			<button class="btn ok" v-on:click="clickok"><?php _e('OK', 'prospect'); ?></button>
		</div>
	</div>
</script>

<!-- Message Dialog -->
<script id="dialog-message" type='text/x-template'>
	<vuemodal title=<?php _e('"Note"', 'prospect'); ?> size="size">
		{{ params.msg }}
	</vuemodal>
</script>

<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/x-template'>
	<vuemodal title=<?php _e('"Confirm"', 'prospect'); ?> cancel="true" size="size" v-on:save="ok">
		{{ params.msg }}
	</vuemodal>
</script>

<!-- Create/Edit Text Legend Entry Dialog -->
<script id="dialog-legend-text" type='text/x-template'>
	<vuemodal title=<?php _e('"Text Legend Entry"', 'prospect'); ?> cancel="true" v-on:save="save">
		<?php _e('Label', 'prospect'); ?>: <input type="text" size="20" v-model="label" placeholder=<?php _e('"Enter Label"', 'prospect'); ?>/><br/>
		<?php _e('Text pattern', 'prospect'); ?>: <input type="text" size="16" v-model="pattern" placeholder=<?php _e('"Enter Text Pattern"', 'prospect'); ?>/><br/>
		<input type="color" v-model="theColor"/>
	</vuemodal>
</script>

<!-- Create/Edit Number Legend Dialog -->
<script id="dialog-legend-number" type='text/x-template'>
	<vuemodal title=<?php _e('"Number Legend Entry"', 'prospect'); ?> cancel="true" v-on:save="save">
		<?php _e('Label for Range', 'prospect'); ?>: <input type="text" size="12" v-model="label" placeholder=<?php _e('"Enter Label"', 'prospect'); ?>/><br/>
		<?php _e('Minimum Value', 'prospect'); ?>: <input type="text" size="8" v-model="min" pattern="\d*"/><br/>
		<?php _e('Maximum Value', 'prospect'); ?>: <input type="text" size="8" v-model="max" pattern="\d*"/><br/>
		<input type="color" v-model="theColor"/>
	</vuemodal>
</script>

<!-- Create/Edit Dates Legend Dialog -->
<script id="dialog-legend-dates" type='text/x-template'>
	<vuemodal title=<?php _e('"Date Legend Entry"', 'prospect'); ?> cancel="true" v-on:save="save">
		<?php _e('Label for Range', 'prospect'); ?>: <input type="text" size="20" v-model="label" required placeholder=<?php _e('"Enter Range Label"', 'prospect'); ?>/><br/>
		<?php _e('Start Date: Year', 'prospect'); ?> <input type="text" size="5" v-model="min.y" placeholder="YYYY" pattern="(open|-?\d+)"/>
		<?php _e('Month', 'prospect'); ?> <input type="text" size="2" v-model="min.m" placeholder="MM" pattern="\d{0,2}"/>
		<?php _e('Day', 'prospect'); ?> <input type="text" size="2" v-model="min.d" placeholder="DD" pattern="\d{0,2}"/>
		<br/>
		<?php _e('End Date: Year', 'prospect'); ?> <input type="text" size="5" v-model="max.y" placeholder="YYYY" pattern="(open|-?\d+)"/>
		<?php _e('Month', 'prospect'); ?> <input type="text" size="2" v-model="max.m" placeholder="MM" pattern="\d{0,2}"/>
		<?php _e('Day', 'prospect'); ?> <input type="text" size="2" v-model="max.d" placeholder="DD" pattern="\d{0,2}"/>
		<br/>
		<input type="color" v-model="theColor"/>
	</vuemodal>
</script>

<!-- Move Vocab Dialog for top-level non-child -->
<script id="dialog-move-vocab-lone" type='text/x-template'>
	<vuemodal title=<?php _e('"Move Vocabulary Entry"', 'prospect'); ?> cancel="true" v-on:save="save">
		<?php _e('Move this Term so it becomes a child of', 'prospect'); ?> <br/>
		<select v-model='newParent'>
			<option v-for="aParent in parents">
    			{{ aParent }}
			</option>
		</select>
		<br/>
		<input type='radio' value='yes' v-model="keep"/> <?php _e('Keep visual config', 'prospect'); ?>
		<input type='radio' value='no' v-model="keep"/> <?php _e('Clear visual config', 'prospect'); ?>
	</vuemodal>
</script>

<!-- Move Vocab Dialog for top-level parent -->
<script id="dialog-move-vocab-parent" type='text/x-template'>
	<vuemodal title=<?php _e('"Move Vocabulary Children"', 'prospect'); ?> cancel="true" v-on:save="save">
		<input type='radio' value='yes' v-model="up"/> <?php _e('Move all children to top (parent) level', 'prospect'); ?>
		<br/>
		<input type='radio' value='no' v-model="up"/>  <?php _e('Move all to new parent', 'prospect'); ?>
		<br/>
		<?php _e('New parent', 'prospect'); ?>
		<select v-model='newParent'>
			<option v-for="aParent in parents">
    			{{ aParent }}
			</option>
		</select>
	</vuemodal>
</script>

<!-- Move Vocab Dialog for child node -->
<script id="dialog-move-vocab-child" type='text/x-template'>
	<vuemodal title=<?php _e('"Move Vocabulary Entry"', 'prospect'); ?> cancel="true" v-on:save="save">
		<input type='radio' value='yes' v-model="up"/> <?php _e('Move to top (parent) level', 'prospect'); ?>
		<input type='radio' value='no' v-model="up"/> <?php _e('Move to new parent', 'prospect'); ?>
		<br/>
		<?php _e('New Parent', 'prospect'); ?>
		<select v-model='newParent'>
			<option v-for="aParent in parents">
    			{{ aParent }}
			</option>
		</select>
	</vuemodal>
</script>

<!-- Reset Colors Dialog -->
<!-- NOTE: This uses color input which is not supported by all browsers -->
<script id="dialog-reset-colors" type='text/x-template'>
	<vuemodal title=<?php _e('"Reset Colors"', 'prospect'); ?> cancel="true" v-on:save="save">
		<input type='radio' v-model='reset' value='random'/> <?php _e('Random Colors', 'prospect'); ?>
		<br/>
		<input type='radio' v-model='reset' value='gradient'/> <?php _e('Create Gradient', 'prospect'); ?>
		<br/>
		<?php _e('From', 'prospect'); ?> <input type="color" v-model="c0"/>
		<?php _e('To', 'prospect'); ?> <input type="color" v-model="c1"/>
	</vuemodal>
</script>

<!-- Color Choice w/Clear Dialog -->
<script id="dialog-choose-color-clear" type='text/x-template'>
	<vuemodal title=<?php _e('"Choose Color"', 'prospect'); ?> cancel="true" v-on:save="save">
		<input type='checkbox' v-model='doClear'> <?php _e('Remove visuals', 'prospect'); ?><br/>
		<input type="color" v-model="theColor"/>
	</vuemodal>
</script>

<!-- List of peer Attributes with Legends Dialog -->
<script id="dialog-copy-legend" type='text/x-template'>
	<vuemodal title=<?php _e('"Choose Attribute"', 'prospect'); ?> cancel="true" v-on:save="save">
		<?php _e('Choose the Attribute whose Legend you wish to copy over the current Legend you are editing.', 'prospect'); ?><br/>
		<b><?php _e('WARNING: No undo.', 'prospect'); ?></b><br/>
		<label for="choose-att">Attribute </label>
		<select id="choose-att" v-model='fid'>
			<option v-for="another in others" v-bind:value="another.id">
    			{{ another.l }} ({{ another.id }})
			</option>
		</select>
	</vuemodal>
</script>

<!-- DYNAMIC TEXT -->
<script id="dltext-attributes" type='text'>
<?php _e('V,Vocabulary|T,Text|g,Tags|N,Number|D,Dates|L,Lat-Lon|X,X-Y|I,Image|l,Link To|S,Audio|Y,YouTube|x,Transcript|t,Timecode|P,Pointer|J,Join', 'prospect'); ?>
</script>

<!-- ERRORS -->
<script id="errmsg-no-term-name" type='text'>
<?php _e('You must supply a name for the new Term.', 'prospect'); ?>
</script>

<script id="errmsg-no-id" type='text'>
<?php _e('You must supply an internal ID for the Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-id-too-long" type='text'>
<?php _e('The Attribute internal ID is too long.', 'prospect'); ?>
</script>

<script id="errmsg-id-bad-chars" type='text'>
<?php _e('An Attribute internal ID must consist of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text'>
<?php _e('You must supply a label for the Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-label-too-long" type='text'>
<?php _e('The Attribute label is too long.', 'prospect'); ?>
</script>

<script id="errmsg-no-custom-field" type='text'>
<?php _e('You have not specified a custom field.', 'prospect'); ?>
</script>

<script id="errmsg-delim-too-long" type='text'>
<?php _e('The delimiter can only be 1 character, if specified at all.', 'prospect'); ?>
</script>

<script id="errmsg-id-taken" type='text'>
<?php _e('Another Attribute with that ID already exists. Please choose another.', 'prospect'); ?>
</script>

<script id="errmsg-term-name-taken" type='text'>
<?php _e('A Term with that name already exists in the Vocabulary.', 'prospect'); ?>
</script>

<script id="errmsg-too-few-vocab" type='text'>
<?php _e('No Vocabulary movements are possible until you have at least 2 Terms.', 'prospect'); ?>
</script>

<script id="errmsg-num-need-bound" type='text'>
<?php _e('You must either have a minimum or maximum Number bound (preferably both).', 'prospect'); ?>
</script>

<script id="errmsg-range-not-valid" type='text'>
<?php _e('One of your Number range boundaries is not a valid integer value.', 'prospect'); ?>
</script>

<script id="errmsg-num-range-inverted" type='text'>
<?php _e('One of the Number Legend entries has a minimum value that is greater than the maximum value.', 'prospect'); ?>
</script>

<script id="errmsg-no-min-date" type='text'>
<?php _e('You must provide a valid year for the minimum date range.', 'prospect'); ?>
</script>

<script id="errmsg-bad-year" type='text'>
<?php _e('A year you have given was not formatted as a valid number.', 'prospect'); ?>
</script>

<script id="errmsg-bad-month" type='text'>
<?php _e('A month number you have given is not valid (it must be 1-12).', 'prospect'); ?>
</script>

<script id="errmsg-bad-day" type='text'>
<?php _e('A day number you have given is not valid (it must be 1-31).', 'prospect'); ?>
</script>

<script id="errmsg-date-no-bound" type='text'>
<?php _e('You have a Date Legend without start or end year; you must specify at least one of these.', 'prospect'); ?>
</script>

<script id="errmsg-date-range-inverted" type='text'>
<?php _e('One of the Date Legend entries has a start date that is greater than the end date.', 'prospect'); ?>
</script>

<script id="errmsg-delim-bad-type" type='text'>
<?php _e('You cannot use a delimiter with this type of Attribute (Vocabulary, Tags, Lat-Lon and Pointer only).', 'prospect'); ?>
</script>

<script id="errmsg-delim-no-sp" type='text'>
<?php _e('You cannot use a space as a delimiter.', 'prospect'); ?>
</script>

<script id="errmsg-delim-comma-ll" type='text'>
<?php _e('You cannot use a comma as a delimiter with a Lat-Lon Attribute.', 'prospect'); ?>
</script>

<!-- MESSAGES -->

<script id="msg-confirm-del-vocab" type='text'>
<?php _e('Are you sure you wish to delete this Legend entry?', 'prospect'); ?>
</script>

<script id="msg-confirm-add-vocab" type='text'>
<?php _e('Vocabulary terms will be added to the current list based on those used by current Records. Are you sure that you provided the correct internal ID and delimiter settings? To ensure unused items are removed from your Vocabulary, delete all current terms.', 'prospect'); ?>
</script>

<script id="msg-saved" type='text'>
<?php _e('Attribute was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>
