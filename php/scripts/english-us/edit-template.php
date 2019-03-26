<!-- Outer-most (application) layer -->
<div id="vue-outer">
	<div id="error-frame" v-if="errorMsg.length > 0" v-bind:class="{ ok: errorOK }">{{errorMsg}}</div>
	<button id="prsp-save-data" v-on:click="saveTemplate"><?php _e('Verify and Prepare Template Definition for Publish/Update', 'prospect'); ?></button><br/>

	<label for="ext-label"><?php _e('Template’s external label', 'prospect'); ?>: </label>
	<input id="ext-label" v-model='label' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
	<br/>
	<label for="int-id"><?php _e('Template’s unique internal id', 'prospect'); ?>: </label>
	<input id="int-id" v-model='templateID' placeholder=<?php _e('"Enter id"', 'prospect'); ?> size="24" pattern="[\w\-]+" required/>
	<icon-btn symbol="ui-icon-info" v-on:click="idHint" label=<?php _e('"Hint about IDs"', 'prospect'); ?>></icon-btn>
	<input id="dep-tmplt" type='checkbox' v-model='dependent'> <?php _e('Dependent Template', 'prospect'); ?>
	<br/>
	<label for="hint"><?php _e('Hint for Record IDs', 'prospect'); ?>: </label>
	<input id="hint" v-model='hint' placeholder=<?php _e('"Enter Hint or leave blank"', 'prospect'); ?> size="44"/>
	<br/>
	<label for="label-latt"><?php _e('Label for each Record supplied by', 'prospect'); ?>: </label>
	<select id="label-latt" v-model='labelAttribute'>
		<option v-for="thisAtt in textAtts">
			{{ thisAtt }}
		</option>
	</select><br/>
	<button v-on:click="addAttribute"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
	<table class='att-table'>
		<tr>
			<th><?php _e('Attribute ID', 'prospect'); ?></th>
			<th><?php _e('Type', 'prospect'); ?></th>
			<th><?php _e('Join Dependent', 'prospect'); ?></th>
			<th><?php _e('Display on Post', 'prospect'); ?></th>

  		</tr>
		<tr v-for="(thisAttribute, index) in tmpltAttributes">
			<td>{{ thisAttribute.id }}</td>
			<td>{{ attMap[thisAttribute.t] }}</td>
			<td class="click-here" v-on:click="selJoin(index)">
				<span v-if="thisAttribute.j.length > 0">{{ thisAttribute.j }}</span>
				<span v-else-if="thisAttribute.t == 'J'"><i><?php _e('Click to choose', 'prospect'); ?></i></span>
			</td>
			<td><input type='checkbox' v-model='thisAttribute.view'/></td>
			<td>
				<icon-btn symbol="ui-icon-arrow-1-n" v-on:click="moveAttUp(index)"><?php _e('Move Up', 'prospect'); ?></icon-btn>
				<icon-btn symbol="ui-icon-arrow-1-s" v-on:click="moveAttDown(index)"><?php _e('Move Down', 'prospect'); ?></icon-btn>
				<icon-btn symbol="ui-icon-trash" v-on:click="delAttribute(index)"><?php _e('Delete', 'prospect'); ?></icon-btn>
			</td>
		</tr>
	</table>

	<h2><?php _e('Configure Widgets on Record Post Page displays', 'prospect'); ?></h2>
	<label for="label-scatt"><?php _e('Audio', 'prospect'); ?>: </label>
	<select id="label-scatt" v-model='recPostAtts.sc'>
		<option v-for="thisAtt in scAtts">
			{{ thisAtt }}
		</option>
	</select>
	<label for="label-ytatt"><?php _e('YouTube', 'prospect'); ?>: </label>
	<select id="label-ytatt" v-model='recPostAtts.yt'>
		<option v-for="thisAtt in ytAtts">
			{{ thisAtt }}
		</option>
	</select>
	<br/>
	<label for="label-tr1att"><?php _e('Transcript1', 'prospect'); ?>: </label>
	<select id="label-tr1att" v-model='recPostAtts.t.t1Att'>
		<option v-for="thisAtt in trAtts">
			{{ thisAtt }}
		</option>
	</select>
	<label for="label-tr2att"><?php _e('Transcript2', 'prospect'); ?>: </label>
	<select id="label-tr2att" v-model='recPostAtts.t.t2Att'>
		<option v-for="thisAtt in trAtts">
			{{thisAtt}}
		</option>
	</select>
	<label for="label-tcatt"><?php _e('TimeCode', 'prospect'); ?>: </label>
	<select id="label-tcatt" v-model='recPostAtts.t.tcAtt'>
		<option v-for="thisAtt in tcAtts">
			{{thisAtt}}
		</option>
	</select>
	<br/>

	<h2><?php _e('Template Post Page Display Configuration', 'prospect'); ?></h2>
	<label for="label-tmpdistype"><?php _e('Display Type', 'prospect'); ?>: </label>
	<select id="label-tmpdistype" v-model='tmpPostAtts.d'>
		<option value="l"><?php _e('Simple List', 'prospect'); ?></option>
		<option value="t"><?php _e('Tiling Cards', 'prospect'); ?></option>
		<option value="h"><?php _e('Primary Image Card', 'prospect'); ?></option>
	</select>
	<label for="label-tmpdistimage"><?php _e('Image', 'prospect'); ?>: </label>
	<select id="label-tmpdistimage" v-model='tmpPostAtts.i'>
		<option v-for="thisAtt in tpIAtts">
			{{thisAtt}}
		</option>
	</select>
	<label for="label-tmpdistcnt"><?php _e('Additional Content', 'prospect'); ?>: </label>
	<select id="label-tmpdistcnt" v-model='tmpPostAtts.c'>
		<option v-for="thisAtt in tpCAtts">
			{{thisAtt}}
		</option>
	</select>
	<label for="label-tmpdistcnt1"><?php _e('Additional Content2', 'prospect'); ?>: </label>
	<select id="label-tmpdistcnt1" v-model='tmpPostAtts.c1'>
		<option v-for="thisAtt in tpCAtts">
			{{thisAtt}}
		</option>
	</select>
	<br/>
	<label for="label-tmpdistcnt2"><?php _e('Additional Content3', 'prospect'); ?>: </label>
	<select id="label-tmpdistcnt2" v-model='tmpPostAtts.c2'>
		<option v-for="thisAtt in tpCAtts">
			{{thisAtt}}
		</option>
	</select>
    <br />
    <label for="label-tmpdistcnt3"><?php _e('Enabled Sort Options', 'prospect'); ?>: </label>
    <template v-for="thisAtt in tpCAtts" v-if="thisAtt != 'disable'">
        <input type="checkbox" :id="'checkbox-'+ thisAtt" :value="thisAtt" v-model="sortChecked">
        <label :for="'checkbox-'+ thisAtt">{{ thisAtt }}</label>
    </template>
    <span v-if="tpCAtts.length <= 1"><?php _e('No Options available yet', 'prospect'); ?></span>

	<component :is="modalShowing" :params="modalParams">
	</component>
</div>

<!-- VueJS Template Dialog Component -->
<script id="dialog-template" type="text/x-template">
	<div class="dialog-wrap open">
		<div>
			<div class="title">{{ title }}</div>
			<slot></slot>
			<br/>
			<button class="btn cancel" v-if="cancel == 'true'" v-on:click="close"><?php _e('Cancel', 'prospect'); ?></button>
			<button class="btn ok" v-on:click="clickok"><?php _e('OK', 'prospect'); ?></button>
		</div>
	</div>
</script>

<!-- Message Dialog -->
<script id="dialog-message" type='text/x-template'>
	<vuemodal title=<?php _e('"Note"', 'prospect'); ?>>
		{{ params.msg }}
	</vuemodal>
</script>

<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/x-template'>
	<vuemodal title=<?php _e('"Confirm"', 'prospect'); ?> cancel="true" v-on:save="ok">
		{{ params.msg }}
	</vuemodal>
</script>

<!-- Choose Attribute Dialog -->
<script id="dialog-choose-attribute" type='text/x-template'>
	<vuemodal title=<?php _e('"Choose Attribute to Add"', 'prospect'); ?> cancel="true" size="wide" v-on:save="save">
		<div class="choose-container">
			<div v-for="(thisAttribute,index) in params.attList">
				<span v-if="selIndex == index" style="color: red" v-on:click="doSelect(index)"><b>{{ thisAttribute.id }}</b> ({{ thisAttribute.l }}): {{ thisAttribute.t }}</span>
				<span v-else v-on:click="doSelect(index)"><b>{{ thisAttribute.id }}</b> ({{ thisAttribute.l }}): {{ thisAttribute.t }}</span>
			</div>
		</div>
	</vuemodal>
</script>

<!-- Choose Dependent Template Dialog -->
<script id="dialog-choose-dependent" type='text/x-template'>
	<vuemodal title=<?php _e('"Choose Template to Join"', 'prospect'); ?> cancel="true" size="wide" v-on:save="save">
		<div class="choose-container">
			<div v-for="(thisTemplate,index) in params.tmpltList">
				<span v-if="selIndex == index" style="color: red" v-on:click="doSelect(index)"><b>{{thisTemplate.id}}</b> ({{thisTemplate.def.l}}) </span>
				<span v-else v-on:click="doSelect(index)"><b>{{thisTemplate.id}}</b> ({{thisTemplate.def.l}}) </span>
			</div>
		</div>
	</vuemodal>
</script>


<!-- ERRORS -->
<script id="errmsg-id" type='text'>
<?php _e('You must supply an internal ID for the new Template. It must only consist of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-id-taken" type='text'>
<?php _e('There is already another Template with that ID. Please choose another.', 'prospect'); ?>
</script>

<script id="errmsg-id-too-long" type='text'>
<?php _e('The ID for your Template cannot be longer than 32 characters. Please shorten it.', 'prospect'); ?>
</script>

<script id="errmsg-label-too-long" type='text'>
<?php _e('The label for your Template cannot be longer than 32 characters. Please shorten it.', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text'>
<?php _e('You must supply a label for the new Template.', 'prospect'); ?>
</script>

<script id="errmsg-no-atts" type='text'>
<?php _e('All Templates must have at least one Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-all-atts-used" type='text'>
<?php _e('All of the defined Attributes have already been added to your Template.', 'prospect'); ?>
</script>

<script id="errmsg-not-join" type='text'>
<?php _e('This is not an Attributes of type “Join” so no further configuration is possible for it in a Template definition.', 'prospect'); ?>
</script>

<script id="errmsg-no-dependents" type='text'>
<?php _e('No dependent Templates have been defined yet, so no join is currently possible.', 'prospect'); ?>
</script>

<script id="errmsg-no-join-for-dep" type='text'>
<?php _e('You are defining a dependent Template, which cannot have Attributes of type “Join”.', 'prospect'); ?>
</script>

<script id="errmsg-missing-join-tmp" type='text'>
<?php _e('You added an Attribute of type “Join” but have not yet connected it to a Template.', 'prospect'); ?>
</script>

<script id="errmsg-missing-dep-tmp" type='text'>
<?php _e('Your Template refers to a dependent Template definition, which is missing. You will not be able to proceed editing this Template until the missing dependent Template is loaded or defined.', 'prospect'); ?>
</script>

<script id="errmsg-hint-quotes" type='text'>
<?php _e('You used a straight double quote (") in your hint, but this is not allowed. If you need double-quotes, use angled ones (“ ”).', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-att" type='text'>
<?php _e('Are you sure that you wish to delete this Attribute from your Template?', 'prospect'); ?>
</script>

<script id="msg-saved" type='text'>
<?php _e('Template was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>

<!-- DYNAMICALLY LOADED TEXT -->
<script id="att-types" type='text'>
<?php _e('V,Vocabulary|T,Text|g,Tags|N,Number|D,Dates|L,Lat-Lon|X,X-Y|I,Image|l,Link To|S,Audio|Y,YouTube|x,Transcript|t,Timecode|P,Pointer|J,Join', 'prospect'); ?>
</script>
