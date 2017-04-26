<!-- Outer-most (application) layer -->
<div id="vue-outer">
	<div id="error-frame" v-if="errorMsg.length > 0" v-bind:class="{ ok: errorOK }">{{errorMsg}}</div>
	<button id="prsp-save-data" v-on:click="saveRecord"><?php _e('Verify and Prepare Record for Publish/Update', 'prospect'); ?></button><br/>
	<div>
		<label for="rec-id"><?php _e('Unique Record ID', 'prospect'); ?> </label>
		<input type="text" id="rec-id" size="32" v-model="recID" pattern="[\w\-]+" required/>
		<icon-btn symbol="ui-icon-info" v-on:click="idHint"><?php _e('Hint about IDs', 'prospect'); ?></icon-btn>
		<label for="rec-type"><?php _e('Template Type', 'prospect'); ?> </label>
		<select id="rec-type" v-model="recType">
			<option v-for="thisTemplate in defTemplates" v-bind:value="thisTemplate.id">
				{{thisTemplate.def.l}} ({{thisTemplate.id}})
			</option>
		</select>
	</div>
	<div>
		<div v-for="(thisElement,rIndex) in defRecord">
			<b>{{thisElement.def.l}}</b>
			<div v-if="thisElement.def.t == 'V'"><!-- Vocabulary -->
				<input type="text" size="32" v-model="thisElement.value"/>
				<button v-if="thisElement.def.d.length > 0" v-on:click="clearVocab(rIndex,$event)"><?php _e('Clear', 'prospect'); ?></button>
				<select v-model="thisElement.lgndSel">
					<option v-for="thisLegend in thisElement.def.newLgnd" v-bind:value="thisLegend.newV">
						{{thisLegend.newL}}
					</option>
				</select>
				<button v-on:click="addVocab(rIndex,$event)">
					<span v-if="thisElement.def.d.length === 0"><?php _e('Set', 'prospect'); ?></span>
					<span v-else><?php _e('Add', 'prospect'); ?></span>
				</button>
			</div>
			<div v-if="thisElement.def.t == 'T'"><!-- Text -->
				<input type="text" size="48" v-model="thisElement.value"/>
			</div>
			<div v-if="thisElement.def.t == 'g'"><!-- Tags -->
				<input type="text" size="32" v-model="thisElement.value"/> (<?php _e('delimiter', 'prospect'); ?> "{{thisElement.def.d}}")
			</div>
			<div v-if="thisElement.def.t == 'N'"><!-- Number -->
				<input type="text" size="10" v-model="thisElement.value"/> (<?php _e('Min', 'prospect'); ?> {{thisElement.def.r.min}}, <?php _e('Max', 'prospect'); ?> {{thisElement.def.r.max}})
			</div>
			<div v-if="thisElement.def.t == 'D'"><!-- Dates -->
				<?php _e('From', 'prospect'); ?> <input type="text" size="6" v-model="thisElement.value.min.y" placeholder=<?php _e('"YYYY"', 'prospect'); ?> pattern="(^$|\?|~?-?\d+)"/>
					<input type="text" size="2" v-model="thisElement.value.min.m" placeholder=<?php _e('"MM"', 'prospect'); ?> pattern="\d{0,2}"/>
					<input type="text" size="2" v-model="thisElement.value.min.d" placeholder=<?php _e('"DD"', 'prospect'); ?> pattern="\d{0,2}"/>
				<?php _e('To', 'prospect'); ?> <input type="text" size="6" v-model="thisElement.value.max.y" placeholder=<?php _e('"YYYY"', 'prospect'); ?> pattern="(^$|open|~?-?\d+)"/>
					<input type="text" size="2" v-model="thisElement.value.max.m" placeholder=<?php _e('"MM"', 'prospect'); ?> pattern="\d{0,2}"/>
					<input type="text" size="2" v-model="thisElement.value.max.d" placeholder=<?php _e('"DD"', 'prospect'); ?> pattern="\d{0,2}"/>
			</div>
			<div v-if="thisElement.def.t == 'L'"><!-- Lat-Lon -->
				<?php _e('Lat,Long', 'prospect'); ?>: <input type="text" size="20" v-model="thisElement.value"/>
				<button v-if="canGeoLoc" v-on:click="setHere(rIndex)"><?php _e('Here', 'prospect'); ?></button>
				<icon-btn symbol="ui-icon-search" v-on:click="geoNames(rIndex)"><?php _e('Look Up Coordinates', 'prospect'); ?></icon-btn>
			</div>
			<div v-if="thisElement.def.t == 'X'"><!-- X-Y -->
				<?php _e('X,Y', 'prospect'); ?>: <input type="text" size="8" v-model="thisElement.value" pattern="^$|^-?\d{1,4},\s?-?\d{1,4}"/>
			</div>
			<div v-if="thisElement.def.t == 'I'"><!-- Image -->
				<?php _e('URL for image', 'prospect'); ?>: <input type="url" size="40" v-model="thisElement.value"/>
			</div>
			<div v-if="thisElement.def.t == 'l'"><!-- Link-To -->
				<?php _e('URL to webpage', 'prospect'); ?>: <input type="url" size="40" v-model="thisElement.value" pattern="^$|^https?://.+$"/>
			</div>
			<div v-if="thisElement.def.t == 'S'"><!-- Audio -->
				<?php _e('URL to Audio source', 'prospect'); ?>: <input type="url" size="40" v-model="thisElement.value"/>
			</div>
			<div v-if="thisElement.def.t == 'Y'"><!-- YouTube -->
				<?php _e('YouTube ID code', 'prospect'); ?>: <input type="text" size="12" v-model="thisElement.value"/>
			</div>
			<div v-if="thisElement.def.t == 'x'"><!-- Transcript -->
				<?php _e('URL to Transcript text file', 'prospect'); ?>: <input type="url" size="40" v-model="thisElement.value" pattern="^$|^https?://.+\.txt$"/>
			</div>
			<div v-if="thisElement.def.t == 't'"><!-- Timecode -->
				<?php _e('Timestamped extract', 'prospect'); ?>: <input type="text" size="23" v-model="thisElement.value" placeholder=<?php _e('"HH:MM:SS.ms-HH:MM:SS.ms"', 'prospect'); ?> pattern="^$|\d\d:\d\d:\d\d\.\d{1,2}(-\d\d:\d\d:\d\d\.\d{1,2})*"/>
			</div>
			<div v-if="thisElement.def.t == 'P'"><!-- Pointer -->
				<?php _e('(Record ID or IDs)', 'prospect'); ?>: <input type="text" size="32" v-model="thisElement.value"/>
				<button v-if="thisElement.def.d.length > 0" v-on:click="clearPtr(rIndex,$event)"><?php _e('Clear', 'prospect'); ?></button>
				<button v-on:click="addPointerID(rIndex,thisElement.def.d,$event)">
					<span v-if="thisElement.def.d.length > 0"><?php _e('Add ID', 'prospect'); ?></span>
					<span v-else><?php _e('Set ID', 'prospect'); ?></span>
				</button>
			</div>
			<div v-if="thisElement.def.t == 'J'"><!-- Join -->
				<?php _e('ID of Record to Join', 'prospect'); ?>: <input type="text" size="32" v-model="thisElement.value" pattern="^$|[\w\-]+"/>
				<button v-on:click="getJoinID(rIndex,$event)"><?php _e('Select ID', 'prospect'); ?></button>
			</div>
			<icon-btn v-if="thisElement.def.h.length > 0" symbol="ui-icon-info" v-on:click="giveHint(rIndex)"><?php _e('Hint', 'prospect'); ?></icon-btn>
		</div>
	</div>

	<component :is="modalShowing" :params="modalParams">
	</component>
</div>


<!-- DIALOGS -->

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

<!-- Template Dialog for Choosing from a list -->
<script id="dialog-choose-list" type='text/x-template'>
	<vuemodal title=<?php _e('"Choose ID"', 'prospect'); ?> cancel="true" size="wide" v-on:save="save">
		<div v-if="message.length != 0">
			<p v-if="error" style="color: red">{{message}}</p>
			<p v-else>{{message}}</p>
		</div>
		<div class="scroll-container">
			<div v-for="(thisItem,index) in list">
				<span v-if="selIndex == index" style="color: red" v-on:click="doSelect(index)">({{thisItem.id}}) {{thisItem.l}}</span>
				<span v-else v-on:click="doSelect(index)">({{thisItem.id}}) {{thisItem.l}}</span>
			</div>
		</div>
	</vuemodal>
</script>

<!-- GeoNames Dialog -->
<script id="dialog-geonames" type='text/x-template'>
	<vuemodal title="<?php _e('GeoNames Coordinate Search', 'prospect'); ?>" size="wide" v-on:save="ok">
		<div>
			<input type="text" size="50" v-model="query" placeholder="<?php _e('Look up coordinates by location name', 'prospect'); ?>" autofocus/>
			<button v-on:click="fetchGeoData"><?php _e('Search', 'prospect'); ?></button>
		</div>
		<div class="scroll-container" id="geonames">
			<div v-if="results.length === 0">
				<p>{{errorMsg}}</p>
			</div>
			<div v-else>
				<ul>
					<li v-for="(thisResult,index) in results" v-on:click="select(index)" v-bind:class="{ active: index === selected }">
						<span v-if="thisResult.name">{{thisResult.name}} </span>
						<span v-if="thisResult.adminName1">{{thisResult.adminName1}} </span>
						<span v-if="thisResult.countryName">{{thisResult.countryName}} </span>
					</li>
				</ul>
			</div>
		</div>
	</vuemodal>
</script>

<!-- ERRORS -->
<script id="errmsg-id" type='text'>
<?php _e('You must supply an internal ID for the Record that is no more than 32 characters in length and consists entirely of alphanumeric characters (in plain ASCII), spaces and underscores (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-no-templates" type='text'>
<p><b><?php _e('You cannot create any Records until you have defined Templates.', 'prospect'); ?></b></p>
</script>

<script id="errmsg-number" type='text'>
<?php _e('You have entered a value into a number field that is not formatted properly.', 'prospect'); ?>
</script>

<script id="errmsg-number-range" type='text'>
<?php _e('A number you entered is below the minimum allowable value or above the allowable maximum.', 'prospect'); ?>
</script>

<script id="errmsg-date-range" type='text'>
<?php _e('A Date you entered is not a valid, or is before the minimum allowable year or past the maximum allowable year.', 'prospect'); ?>
</script>

<script id="errmsg-date-maxmin" type='text'>
<?php _e('The start year is greater than the end year for a Date you have entered.', 'prospect'); ?>
</script>

<script id="errmsg-no-data-available" type='text'>
<?php _e('No data available -- select "Cancel"', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-vf" type='text'>
<?php _e('Are you sure that you wish to delete this View/Filter from your Exhibit?', 'prospect'); ?>
</script>

<script id="msg-saved" type='text'>
<?php _e('Record was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>

<script id="msg-rem-data-loading" type='text'>
<?php _e('Please wait while remote data is loaded', 'prospect'); ?>
</script>

<script id="msg-choose-record" type='text'>
<?php _e('Please choose the Record ID', 'prospect'); ?>
</script>
