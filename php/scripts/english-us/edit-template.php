
<!-- Ractive Template for jQueryUI Dialog Component -->
<script id="dialog-r-template" type='text/ractive'>
	<div class="jq-dialog-template" title="{{title}}">
		{{yield}}
	</div> <!-- dialog -->
</script>

<!-- Outer-most (application) layer of output for Ractive to generate -->
<script id="ractive-base" type='text/ractive'>
	<div id="insert-dialog"></div>
	{{#if errorMsg.length > 0}}
	<div id="error-frame">{{errorMsg}}</div>
	{{/if}}
	<button id="prsp-save-data" on-click="saveTemplate"><?php _e('Verify and Save Template Definition', 'prospect'); ?></button><br/>
	<label for="ext-label"><?php _e('Template’s external label', 'prospect'); ?>: </label>
	<input id="ext-label" value='{{theTemplate.l}}' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
	<br/>
	<label for="int-id"><?php _e('Template’s unique internal id', 'prospect'); ?>: </label>
	<input id="int-id" value='{{templateID}}' placeholder=<?php _e('"Enter id"', 'prospect'); ?> size="24" pattern="[\w\-]+" required/>
	<button decorator="iconButton:ui-icon-info" on-click="idHint"><?php _e('Hint about IDs', 'prospect'); ?></button>
	<input id="dep-tmplt" type='checkbox' checked='{{theTemplate.d}}'> <?php _e('Dependent Template', 'prospect'); ?>
	<br/>

	<label for="hint"><?php _e('Hint for Record IDs', 'prospect'); ?>: </label>
	<input id="hint" value='{{theTemplate.h}}' placeholder=<?php _e('"Enter Hint or leave blank"', 'prospect'); ?> size="44"/>
	<br/>

	<label for="label-latt"><?php _e('Label for each Record supplied by', 'prospect'); ?>: </label>
	<select id="label-latt" value='{{theTemplate.t}}'>
		{{#each textAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select><br/>

	<button on-click="addAttribute"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
	<table class='att-table'>
		<tr>
			<th><?php _e('Attribute ID', 'prospect'); ?></th>
			<th><?php _e('Type', 'prospect'); ?></th>
			<th><?php _e('Join Dependent', 'prospect'); ?></th>
			<th><?php _e('Display on Post', 'prospect'); ?></th>
  		</tr>
		{{#each theTemplate.a:index}}
			<tr>
				<td>{{id}}</td>
				<td>{{attMap[this.t]}}</td>
				<td class="click-here" on-click="selJoin:{{index}}">
					{{#if this.j.length > 0}}
						{{this.j}}
					{{elseif this.t == 'J'}}
						<i><?php _e('Click to choose', 'prospect'); ?></i>
					{{/if}}
				</td>
				<td><input type='checkbox' checked='{{view}}'/></td>
				<td>
					<button decorator="iconButton:ui-icon-arrow-1-n" on-click="moveUp:{{index}}"><?php _e('Move Up', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrow-1-s" on-click="moveDown:{{index}}"><?php _e('Move Down', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-trash" on-click="delAttribute:{{index}}"><?php _e('Delete', 'prospect'); ?></button>
				</td>
			</tr>
		{{/each}}
	</table>

	<h2><?php _e('Configure Widgets on Post Page displays', 'prospect'); ?></h2>
	<label for="label-scatt"><?php _e('Audio', 'prospect'); ?>: </label>
	<select id="label-scatt" value='{{viewAtts.sc}}'>
		{{#each scAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select>
	<label for="label-ytatt"><?php _e('YouTube', 'prospect'); ?>: </label>
	<select id="label-ytatt" value='{{viewAtts.yt}}'>
		{{#each ytAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select><br/>

	<label for="label-tr1att"><?php _e('Transcript1', 'prospect'); ?>: </label>
	<select id="label-tr1att" value='{{viewAtts.t.t1Att}}'>
		{{#each trAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select>
	<label for="label-tr2att"><?php _e('Transcript2', 'prospect'); ?>: </label>
	<select id="label-tr2att" value='{{viewAtts.t.t2Att}}'>
		{{#each trAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select>
	<label for="label-tcatt"><?php _e('TimeCode', 'prospect'); ?>: </label>
	<select id="label-tcatt" value='{{viewAtts.t.tcAtt}}'>
		{{#each tcAtts}}
			<option>{{this}}</option>
		{{/each}}
	</select>
	<br/>
</script>

<!-- Choose Attribute Dialog -->
<script id="dialog-choose-attribute" type='text/ractive'>
	<dialog title=<?php _e('"Choose Attribute to Add"', 'prospect'); ?> width="400" height="350">
		<div class="choose-container">
			{{#each attributes:index}}
				{{#if selIndex == index}}
					<span style="color: red" on-click="doSelect:{{index}}"><b>{{id}}</b> ({{l}}): {{t}} </span>
				{{else}}
					<span on-click="doSelect:{{index}}"><b>{{id}}</b> ({{l}}): {{t}} </span>
				{{/if}}
				<br/>
			{{/each}}
		</div>
	</dialog>
</script>

<!-- Choose Dependent Template Dialog -->
<script id="dialog-choose-dependent" type='text/ractive'>
	<dialog title=<?php _e('"Choose Template to Join"', 'prospect'); ?> width="400" height="350">
		<div class="choose-container">
			{{#each templates:index}}
				{{#if selIndex == index}}
					<span style="color: red" on-click="doSelect:{{index}}"><b>{{id}}</b> ({{def.l}}) </span>
				{{else}}
					<span on-click="doSelect:{{index}}"><b>{{id}}</b> ({{def.l}}) </span>
				{{/if}}
				<br/>
			{{/each}}
		</div>
	</dialog>
</script>


<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/ractive'>
	<dialog title=<?php _e('"Confirm"', 'prospect'); ?> width="300" height="200">
		{{message}}
	</dialog>
</script>

<!-- Message Dialog -->
<script id="dialog-message" type='text/ractive'>
	<dialog title=<?php _e('"Display Hint"', 'prospect'); ?> width="300" height="300" cancel="false">
		{{message}}
	</dialog>
</script>

<!-- ERRORS -->
<script id="errmsg-id" type='text/ractive'>
<?php _e('You must supply an internal ID for the new Template. It must only consist of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-id-taken" type='text/ractive'>
<?php _e('There is already another Template with that ID. Please choose another.', 'prospect'); ?>
</script>

<script id="errmsg-id-too-long" type='text/ractive'>
<?php _e('The ID for your Template cannot be longer than 32 characters. Please shorten it.', 'prospect'); ?>
</script>

<script id="errmsg-label-too-long" type='text/ractive'>
<?php _e('The label for your Template cannot be longer than 32 characters. Please shorten it.', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text/ractive'>
<?php _e('You must supply a label for the new Template.', 'prospect'); ?>
</script>

<script id="errmsg-no-atts" type='text/ractive'>
<?php _e('All Templates must have at least one Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-all-atts-used" type='text/ractive'>
<?php _e('All of the defined Attributes have already been added to your Template.', 'prospect'); ?>
</script>

<script id="errmsg-not-join" type='text/ractive'>
<?php _e('This is not an Attributes of type “Join” so no further configuration is possible for it in a Template definition.', 'prospect'); ?>
</script>

<script id="errmsg-no-dependents" type='text/ractive'>
<?php _e('No dependent Templates have been defined yet, so no join is currently possible.', 'prospect'); ?>
</script>

<script id="errmsg-no-join-for-dep" type='text/ractive'>
<?php _e('You are defining a dependent Template, which cannot have Attributes of type “Join”.', 'prospect'); ?>
</script>

<script id="errmsg-missing-join-tmp" type='text/ractive'>
<?php _e('You added an Attribute of type “Join” but have not yet connected it to a Template.', 'prospect'); ?>
</script>

<script id="errmsg-missing-dep-tmp" type='text/ractive'>
<?php _e('Your Template refers to a dependent Template definition, which is missing. You will not be able to proceed editing this Template until the missing dependent Template is loaded or defined.', 'prospect'); ?>
</script>

<script id="errmsg-hint-quotes" type='text/ractive'>
<?php _e('You used a straight double quote (") in your hint, but this is not allowed. If you need double-quotes, use angled ones (“ ”).', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-att" type='text/ractive'>
<?php _e('Are you sure that you wish to delete this Attribute from your Template?', 'prospect'); ?>
</script>

<!-- DYNAMICALLY LOADED TEXT -->
<script id="att-types" type='text/ractive'>
<?php _e('V,Vocabulary|T,Text|g,Tags|N,Number|D,Dates|L,Lat-Lon|X,X-Y|I,Image|l,Link To|S,Audio|Y,YouTube|x,Transcript|t,Timecode|P,Pointer|J,Join', 'prospect'); ?>
</script>
