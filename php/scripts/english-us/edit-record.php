
<!-- Ractive Template for jQueryUI Dialog Component -->
<script id="dialog-r-template" type='text/ractive'>
	<div class="jq-dialog-template" title="{{title}}">
		{{yield}}
	</div>
</script>


<!-- Outer-most (application) layer of output for Ractive to generate -->
<script id="ractive-base" type='text/ractive'>
	<div id="insert-dialog"></div>
	{{#if errorMsg.length > 0}}
	<div id="error-frame">{{errorMsg}}</div>
	{{/if}}
	<button id="prsp-save-data" on-click="saveRecord"><?php _e('Verify and Prepare Record for Publish/Update', 'prospect'); ?></button><br/>
	<div>
		<label for="rec-id"><?php _e('Unique Record ID', 'prospect'); ?> </label>
		<input type="text" id="rec-id" size="32" value="{{recID}}" pattern="[\w\-]+" required/>
		<button decorator="iconButton:ui-icon-info" on-click="idHint"><?php _e('Hint for IDs', 'prospect'); ?></button>
		<label for="rec-type"><?php _e('Template Type', 'prospect'); ?> </label>
		<select id="rec-type" value="{{recType}}">
		{{#each defTemplates}}
			<option value="{{this.id}}">{{this.def.l}} ({{this.id}})</option>
		{{/each}}
		</select>
	</div>
	<div>
		{{#each defRecord:rIndex}}
			<b>{{def.l}}</b>
			{{#if def.t == 'V'}}
				{{>att-type-Vocabulary}}
			{{elseif def.t == 'T'}}
				{{>att-type-Text}}
			{{elseif def.t == 'g'}}
				{{>att-type-Tags}}
			{{elseif def.t == 'N'}}
				{{>att-type-Number}}
			{{elseif def.t == 'D'}}
				{{>att-type-Dates}}
			{{elseif def.t == 'L'}}
				{{>att-type-Lat-Lon}}
			{{elseif def.t == 'X'}}
				{{>att-type-X-Y}}
			{{elseif def.t == 'I'}}
				{{>att-type-Image}}
			{{elseif def.t == 'l'}}
				{{>att-type-Link-To}}
			{{elseif def.t == 'S'}}
				{{>att-type-Audio}}
			{{elseif def.t == 'Y'}}
				{{>att-type-YouTube}}
			{{elseif def.t == 'x'}}
				{{>att-type-Transcript}}
			{{elseif def.t == 't'}}
				{{>att-type-Timecode}}
			{{elseif def.t == 'P'}}
				{{>att-type-Pointer}}
			{{elseif def.t == 'J'}}
				{{>att-type-Join}}
			{{/if}}
			{{#if def.h.length > 0}}
				<button decorator="iconButton:ui-icon-info" on-click="giveHint:{{rIndex}}"><?php _e('Hint', 'prospect'); ?></button>
			{{/if}}
			<br/>
		{{/each}}
	</div>
</script>

<!-- PARTIALS -->
<script id="att-type-Vocabulary" type='text/ractive'>
	<input type="text" size="32" value="{{value}}"/>
	{{#if def.d.length > 0}}<button on-click="clearVocab:{{rIndex}}"><?php _e('Clear', 'prospect'); ?></button>{{/if}}
	<select value="{{lgndSel}}">
	{{#each def.newLgnd}}
		<option value="{{this.newV}}">{{this.newL}}</option>
	{{/each}}
	</select>
	<button on-click="addVocab:{{rIndex}}">
	{{#if def.d.length > 0}}
	<?php _e('Add', 'prospect'); ?>
	{{else}}
	<?php _e('Set', 'prospect'); ?>
	{{/if}}
	</button>
</script>

<script id="att-type-Text" type='text/ractive'>
	<input type="text" size="48" value="{{value}}"/>
</script>

<script id="att-type-Tags" type='text/ractive'>
	<input type="text" size="32" value="{{value}}"/> (<?php _e('delimiter', 'prospect'); ?> "{{def.d}}")
</script>

<script id="att-type-Number" type='text/ractive'>
	<input type="text" size="10" value="{{value}}"/> (<?php _e('Min', 'prospect'); ?> {{def.r.min}}, <?php _e('Max', 'prospect'); ?> {{def.r.max}})
</script>

<script id="att-type-Dates" type='text/ractive'>
	<?php _e('From', 'prospect'); ?> <input type="text" size="6" value="{{value.min.y}}" placeholder=<?php _e('"YYYY"', 'prospect'); ?> pattern="(^$|\?|~?-?\d+)"/>
		<input type="text" size="2" value="{{value.min.m}}" placeholder=<?php _e('"MM"', 'prospect'); ?> pattern="\d{0,2}"/>
		<input type="text" size="2" value="{{value.min.d}}" placeholder=<?php _e('"DD"', 'prospect'); ?> pattern="\d{0,2}"/>
	<?php _e('To', 'prospect'); ?> <input type="text" size="6" value="{{value.max.y}}" placeholder=<?php _e('"YYYY"', 'prospect'); ?> pattern="(^$|open|~?-?\d+)"/>
		<input type="text" size="2" value="{{value.max.m}}" placeholder=<?php _e('"MM"', 'prospect'); ?> pattern="\d{0,2}"/>
		<input type="text" size="2" value="{{value.max.d}}" placeholder=<?php _e('"DD"', 'prospect'); ?> pattern="\d{0,2}"/>
</script>

<script id="att-type-Lat-Lon" type='text/ractive'>
	<?php _e('Lat,Long', 'prospect'); ?>: <input type="text" size="20" value="{{value}}"/>
	{{#if canGeoLoc}}<button on-click="setHere:{{rIndex}}"><?php _e('Here', 'prospect'); ?></button>{{/if}}
	<button decorator="iconButton:ui-icon-search" on-click="geoNames:{{rIndex}}"><?php _e('Look Up Coordinates', 'prospect'); ?></button>
</script>

<script id="att-type-X-Y" type='text/ractive'>
	<?php _e('X,Y', 'prospect'); ?>: <input type="text" size="8" value="{{value}}" pattern="^$|^-?\d{1,4},\s?-?\d{1,4}"/>
</script>

<script id="att-type-Image" type='text/ractive'>
	<?php _e('URL for image', 'prospect'); ?>: <input type="url" size="40" value="{{value}}"/>
</script>

<script id="att-type-Link-To" type='text/ractive'>
	<?php _e('URL to webpage', 'prospect'); ?>: <input type="url" size="40" value="{{value}}" pattern="^$|^https?://.+$"/>
</script>

<script id="att-type-Audio" type='text/ractive'>
	<?php _e('URL to Audio source', 'prospect'); ?>: <input type="url" size="40" value="{{value}}"/>
</script>

<script id="att-type-YouTube" type='text/ractive'>
	Y<?php _e('YouTube ID code', 'prospect'); ?>: <input type="text" size="12" value="{{value}}"/>
</script>

<script id="att-type-Transcript" type='text/ractive'>
	<?php _e('URL to Transcript text file', 'prospect'); ?>: <input type="url" size="40" value="{{value}}" pattern="^$|^https?://.+\.txt$"/>
</script>

<script id="att-type-Timecode" type='text/ractive'>
	<?php _e('Timestamped extract', 'prospect'); ?>: <input type="text" size="23" value="{{value}}" placeholder=<?php _e('"HH:MM:SS.ms-HH:MM:SS.ms"', 'prospect'); ?> pattern="^$|\d\d:\d\d:\d\d\.\d{1,2}(-\d\d:\d\d:\d\d\.\d{1,2})*"/>
</script>

<script id="att-type-Pointer" type='text/ractive'>
	<?php _e('(Record ID or IDs)', 'prospect'); ?>: <input type="text" size="32" value="{{value}}"/>
	{{#if def.d.length > 0}}<button on-click="clearPtr:{{rIndex}}"><?php _e('Clear', 'prospect'); ?></button>{{/if}}
	<button on-click="addPointerID:{{rIndex}}">
		{{#if def.d.length > 0}}<?php _e('Add ID', 'prospect'); ?>
		{{else}}<?php _e('Set ID', 'prospect'); ?>
		{{/if}}
	</button>
</script>

<script id="att-type-Join" type='text/ractive'>
	<?php _e('ID of Record to Join', 'prospect'); ?>: <input type="text" size="32" value="{{value}}" pattern="^$|[\w\-]+"/>
	<button on-click="getJoinIDs:{{rIndex}}"><?php _e('Select ID', 'prospect'); ?></button>
</script>


<!-- DIALOGS -->
<!-- Choose Template Dialog -->
<script id="dialog-choose-list" type='text/ractive'>
	<dialog title=<?php _e('"Choose ID"', 'prospect'); ?> width="300" height="350">
		{{#if loading}}<p style="color: red"><?php _e('Please wait while remote data is loaded', 'prospect'); ?></p>{{/if}}
		{{#if !loading && list.length==0}}<p style="color: red"><?php _e('No data available -- select "Cancel"', 'prospect'); ?></p>{{/if}}
		<div class="scroll-container">
			{{#each list:index}}
				{{#if selIndex == index}}
					<span style="color: red" on-click="doSelect:{{index}}"><b>{{.}}</b></span>
				{{else}}
					<span on-click="doSelect:{{index}}"><b>{{.}}</b></span>
				{{/if}}
				<br/>
			{{/each}}
		</div>
	</dialog>
</script>

<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/ractive'>
	<dialog title=<?php _e('"Confirm"', 'prospect'); ?> width="300" height="265">
		<div class="scroll-container">
			{{message}}
		</div>
	</dialog>
</script>

<!-- Hint Dialog -->
<script id="dialog-message" type='text/ractive'>
	<dialog title=<?php _e('"Display Hint"', 'prospect'); ?> width="300" height="350" cancel="false">
		<div class="scroll-container">
			{{message}}
		</div>
	</dialog>
</script>

<!-- GeoNames Dialog -->
<script id="dialog-geonames" type='text/ractive'>
	<dialog title="<?php _e('GeoNames Coordinate Search', 'prospect'); ?>" width="600" height="450">
		<div class="scroll-container" id="geonames">
			<form>
				<input type="text" size="50" value="{{query}}" placeholder="<?php _e('Look up coordinates by location name', 'prospect'); ?>" autofocus>
				<button type="submit"><?php _e('Search', 'prospect'); ?></button>
			</form>
			<ul>
				{{#results}}
					{{#if name}}<li on-click="select">{{name}}{{#if adminName1}}, {{adminName1}}{{/if}}{{#if countryName}}, {{countryName}}{{/if}}</li>{{/if}}
				{{/results}}
				{{^results}}
					<p><?php _e('Error.', 'prospect'); ?></p>
				{{/results}}
			</ul>
		</div>
	</dialog>
</script>

<!-- ERRORS -->
<script id="errmsg-id" type='text/ractive'>
<?php _e('You must supply an internal ID for the Record that is no more than 32 characters in length and consists entirely of alphanumeric characters (in plain ASCII), spaces and underscores (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-no-templates" type='text/ractive'>
<p><b><?php _e('You cannot create any Records until you have defined Templates.', 'prospect'); ?></b></p>
</script>

<script id="errmsg-number" type='text/ractive'>
<?php _e('You have entered a value into a number field that is not formatted properly.', 'prospect'); ?>
</script>

<script id="errmsg-number-range" type='text/ractive'>
<?php _e('A number you entered is below the minimum allowable value or above the allowable maximum.', 'prospect'); ?>
</script>

<script id="errmsg-date-range" type='text/ractive'>
<?php _e('A Date you entered is not a valid, or is before the minimum allowable year or past the maximum allowable year.', 'prospect'); ?>
</script>

<script id="errmsg-date-maxmin" type='text/ractive'>
<?php _e('The start year is greater than the end year for a Date you have entered.', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-vf" type='text/ractive'>
<?php _e('Are you sure that you wish to delete this View/Filter from your Exhibit?', 'prospect'); ?>
</script>

<script id="msg-saved" type='text/ractive'>
<?php _e('Record was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>
