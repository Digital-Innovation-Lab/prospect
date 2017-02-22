
<!-- Ractive Template for jQueryUI Dialog Component -->
<script id="dialog-r-template" type='text/ractive'>
	<div class="jq-dialog-template" title="{{title}}">
		{{yield}}
	</div>
</script>

<!-- Ractive Template for Iris Color Picker -->
<script id="iris-r-template" type='text/ractive'>
	<input class="jq-iris-template" type="text" size="11" value="{{color}}"/>
</script>

<!-- Ractive Template for jQueryUI Accordion Component -->
<script id="accordion-r-template" type='text/ractive'>
	<div class="jq-accordion-template">
		{{yield}}
	</div>
</script>

<!-- Ractive Template for jQueryUI Tabs Component -->
<script id="tabs-r-template" type='text/ractive'>
	<div class="jq-tabs-template">
		{{yield}}
	</div>
</script>


<!-- Outer-most (application) layer of output for Ractive to generate -->
<script id="ractive-base" type='text/ractive'>
	<div id="insert-dialog"></div>
	{{#if errorMsg.length > 0}}
	<div id="error-frame">{{errorMsg}}</div>
	{{/if}}
	<button id="prsp-save-data" on-click="saveExhibit"><?php _e('Verify and Prepare Exhibit Definition for Publish/Update', 'prospect'); ?></button><br/>
	<accordion>
		<h3><?php _e('General Settings', 'prospect'); ?></h3>
		<div>
			<label for="ext-label"><?php _e('Exhibit’s external label', 'prospect'); ?>: </label>
			<input id="ext-label" type='text' value='{{genSettings.l}}' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
			<br/>
			<label for="int-id"><?php _e('Exhibit’s unique internal id', 'prospect'); ?>: </label>
			<input type='text' id="int-id" value='{{xhbtID}}' placeholder=<?php _e('"Enter id"', 'prospect'); ?> pattern="[\w\-]+" size="24" required/>
			<button decorator="iconButton:ui-icon-info" on-click="idHint"><?php _e('Hint about IDs', 'prospect'); ?></button>
			<br/>
			<input type='checkbox' checked='{{genSettings.tour}}'/> Show Help Tour &nbsp;
			<input type='checkbox' checked='{{genSettings.dspr}}'/> Disable Perspective Buttons &nbsp;
			<input type='checkbox' checked='{{genSettings.auto}}'/> Enable Auto-update
			<br/>
			<label for="home-btn"><?php _e('Home button label', 'prospect'); ?>: </label>
			<input type='text' id="home-btn" value='{{genSettings.hbtn}}' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="12"/>
			<label for="home-url"><?php _e('Home URL', 'prospect'); ?>: </label>
			<input type='url' id="home-url" value='{{genSettings.hurl}}' placeholder=<?php _e('"Enter URL"', 'prospect'); ?> size="32" pattern="^https?://.+"/>
			<br/>
			"{{genSettings.l}}" <?php _e('will display Template types', 'prospect'); ?>:<br/>
			{{#each iTemplates}}
				<input type='checkbox' checked='{{use}}'/> {{tid}}
			{{/each}}
			<br/>
			<input type='checkbox' checked='{{genSettings.ds.on}}'/> <?php _e('Enable Date Slider', 'prospect'); ?>
			{{#if genSettings.ds.on}}
				<br/>
				<?php _e('Start Date', 'prospect'); ?> <input type="text" value="{{genSettings.ds.s}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
				<?php _e('End Date', 'prospect'); ?> <input type="text" value="{{genSettings.ds.e}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
				<br/>
				{{#each iTemplates:tIndex}}
					<?php _e('Dates Attribute for', 'prospect'); ?> {{tid}}:
					<select value='{{genSettings.ds.tAtts[tIndex]}}'>
					{{#each attsDates}}
						<option>{{this}}</option>
					{{/each}} |&nbsp;
				{{/each}}
			{{/if}}
			<br/>
			<input type='checkbox' checked='{{qrOn}}'/> <?php _e('Enable Qualified Relationships', 'prospect'); ?> &nbsp;&nbsp;
			{{#if qrOn}}
				QR Template <select value='{{genSettings.qr.t}}'>
				{{#each qrOptions.t}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
				Entity 1 <select value='{{genSettings.qr.e1}}'> &nbsp;
				{{#each qrOptions.optsPtr}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Entity 2 <select value='{{genSettings.qr.e2}}'> &nbsp;
				{{#each qrOptions.optsPtr}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Dates <select value='{{genSettings.qr.d}}'>
				{{#each qrOptions.optsDates}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
				Relationships <select value='{{genSettings.qr.r}}'> &nbsp;
				{{#each qrOptions.optsVocab}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Role 1 <select value='{{genSettings.qr.r1}}'> &nbsp;
				{{#each qrOptions.optsTxt}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Role 2 <select value='{{genSettings.qr.r2}}'>
				{{#each qrOptions.optsTxt}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
				Lat-Lon 1 <select value='{{genSettings.qr.c1}}'> &nbsp;
				{{#each qrOptions.optsLL}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Lat-Lon 2 <select value='{{genSettings.qr.c2}}'> &nbsp;
				{{#each qrOptions.optsLL}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				Certainty <select value='{{genSettings.qr.c}}'> &nbsp;
				{{#each qrOptions.optsNum}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
				<button on-click="setRoles"><?php _e('Set Roles for Relationships', 'prospect'); ?></button>
				{{#if genSettings.qr.x.length == 0}}
					&nbsp; <?php _e('(currently empty)', 'prospect'); ?>
				{{/if}}
			{{/if}}
		</div>
		<h3><?php _e('Visualizations', 'prospect'); ?></h3>
		<div>
			<button on-click="addView"><?php _e('Add Visualization', 'prospect'); ?></button>
			<hr class="vf-divider"/>
			{{#each viewSettings:vIndex}}
				<div>
					<button decorator="togDiv"></button>
					<i>{{vfLookup[this.vf]}}</i>: <input type="text" value="{{l}}" size="32" required/>
					<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="topVF:{{vIndex}}"><?php _e('Move to Top', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-trash" on-click="delVF:{{vIndex}}"><?php _e('Delete', 'prospect'); ?></button>
					<br/>
					<?php _e('View Hint', 'prospect'); ?>: <input type="text" value="{{n}}" size="72"/>
				</div>
				<div id="vf-div-{{vIndex}}">
					{{#if vf === 'M'}}
						{{>vfMap}}
					{{elseif vf === 'p'}}
						{{>vfMap2}}
					{{elseif vf === 'C'}}
						{{>vfCards}}
					{{elseif vf === 'P'}}
						{{>vfPinboard}}
					{{elseif vf === 'T'}}
						{{>vfTimeline}}
					{{elseif vf === 'D'}}
						{{>vfDirectory}}
					{{elseif vf === 't'}}
						{{>vfTextStream}}
					{{elseif vf === 'S'}}
						{{>vfSChart}}
					{{elseif vf === 'N'}}
						{{>vfNetWheel}}
					{{elseif vf === 'n'}}
						{{>vfNetGraph}}
					{{elseif vf === 'F'}}
						{{>vfFlow}}
					{{elseif vf === 'm'}}
						{{>vfMBlockMap}}
					{{elseif vf === 'B'}}
						{{>vfBrowser}}
					{{elseif vf === 'b'}}
						{{>vfBucketMatrix}}
					{{elseif vf === 'Q'}}
						{{>vfQRMap}}
					{{elseif vf === 'q'}}
						{{>vfQRNetwork}}
					{{elseif vf === 'E'}}
						{{>vfEgoGraph}}
					{{elseif vf === 'e'}}
						{{>vfTimeRings}}
					{{/if}}
				</div>
				{{#if vIndex != (viewSettings.length-1) }}<hr class="vf-divider"/>{{/if}}
			{{/each}}
		</div>

		<h3><?php _e('Inspector', 'prospect'); ?></h3>
		<div>{{#with inspectSettings}}
			<div>
				<b><?php _e('Playback Widgets', 'prospect'); ?></b>:
				<input type='checkbox' checked='{{modal.aOn}}'/> <?php _e('Audio', 'prospect'); ?>
				<input type='checkbox' checked='{{modal.scOn}}'/> <?php _e('Load SoundCloud', 'prospect'); ?>
				<input type='checkbox' checked='{{modal.ytOn}}'/> <?php _e('YouTube', 'prospect'); ?>
				<input type='checkbox' checked='{{modal.tOn}}'/> <?php _e('Transcripts', 'prospect'); ?>
				<input type='checkbox' checked='{{modal.t2On}}'/> <?php _e('Dual Transcripts', 'prospect'); ?>
			</div>
			<input type='checkbox' id="see-rec-off" checked='{{srOff}}'/>
			<label for="see-rec-off"><?php _e('Disable “See Item” button', 'prospect'); ?> </label>
			<div>
				<?php _e('Size overrides (leave blank for default)', 'prospect'); ?>:
				<?php _e('Width', 'prospect'); ?> <input type='text' value='{{modal.w}}' placeholder=<?php _e('"Default"', 'prospect'); ?> size="5"/>
				<?php _e('Height', 'prospect'); ?> <input type='text' value='{{modal.h}}' placeholder=<?php _e('"Default"', 'prospect'); ?> size="5"/>
			</div>

			<accordion>
				<h3><?php _e('Attributes to Display', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Attribute(s) to display according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
						{{#each iTemplates:tIndex}}
							<li><a href="#inspect-tab-{{tIndex}}">{{tid}}</a></li>
						{{/each}}
						</ul>
						{{#each iTemplates:tIndex}}
						<div id="inspect-tab-{{tIndex}}">
							<button decorator="iconButton:ui-icon-check" on-click="allDispAttsOn:{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
							<button decorator="iconButton:ui-icon-cancel" on-click="allDispAttsOff:{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
							{{#each modal.atts[tIndex]:aIndex}}
								<span class="attribute-controls">
									<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
									<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveAttLeft:'i',{{tIndex}},{{aIndex}}"><?php _e('Left', 'prospect'); ?></button>
									<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveAttRight:'i',{{tIndex}},{{aIndex}}"><?php _e('Right', 'prospect'); ?></button>
								</span>
							{{/each}}
						</div>
						{{/each}}
					</tabs>
				</div>

				<h3><?php _e('Audio Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Audio Attribute (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
						{{#each iTemplates:tIndex}}
							<li><a href="#sc-tab-{{tIndex}}">{{tid}}</a></li>
						{{/each}}
						</ul>
						{{#each iTemplates:tIndex}}
						<div id="sc-tab-{{tIndex}}">
							<select value='{{sc.atts[tIndex]}}'>
							{{#each attsSC}}
								<option>{{this}}</option>
							{{/each}}
							</select>
						</div>
						{{/each}}
					</tabs>
				</div>

				<h3><?php _e('YouTube Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the YouTube Attribute (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
						{{#each iTemplates:tIndex}}
							<li><a href="#yt-tab-{{tIndex}}">{{tid}}</a></li>
						{{/each}}
						</ul>
						{{#each iTemplates:tIndex}}
						<div id="yt-tab-{{tIndex}}">
							<select value='{{yt.atts[tIndex]}}'>
							{{#each attsYT}}
								<option>{{this}}</option>
							{{/each}}
							</select>
						</div>
						{{/each}}
					</tabs>
				</div>

				<h3><?php _e('Transcript Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Transcript and Timecode Attributes (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
						{{#each iTemplates:tIndex}}
							<li><a href="#trans-tab-{{tIndex}}">{{tid}}</a></li>
						{{/each}}
						</ul>
						{{#each iTemplates:tIndex}}
						<div id="trans-tab-{{tIndex}}">
							<?php _e('Primary Transcript', 'prospect'); ?>: <select value='{{t.t1Atts[tIndex]}}'>
							{{#each attsTrns}}
								<option>{{this}}</option>
							{{/each}}
							</select>
							<?php _e('Secondary Transcript', 'prospect'); ?>: <select value='{{t.t2Atts[tIndex]}}'>
							{{#each attsTrns}}
								<option>{{this}}</option>
							{{/each}}
							</select>
						</div>
						{{/each}}
					</tabs>
				</div>


				<h3><?php _e('Timecodes (for Playback widget segments)', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Timecode Attribute (if any) for Playback widgets according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
						{{#each iTemplates:tIndex}}
							<li><a href="#timecode-tab-{{tIndex}}">{{tid}}</a></li>
						{{/each}}
						</ul>
						{{#each iTemplates:tIndex}}
						<div id="timecode-tab-{{tIndex}}">
							<?php _e('Extract Timecode', 'prospect'); ?>: <select id="tc-widget" value='{{t.tcAtts[tIndex]}}'>
							{{#each attsTC}}
								<option>{{this}}</option>
							{{/each}}
							</select>
						</div>
						{{/each}}
					</tabs>
				</div>

			</accordion>
		{{/with}}</div>
	</accordion>
</script>

<!-- PARTIALS -->
<script id="vfMap" type='text/ractive'>
	<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" value="{{c.clat}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<?php _e('Longitude', 'prospect'); ?>: <input type="text" value="{{c.clon}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<br/>
	<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" value="{{c.zoom}}" min="1" max="20" required/>
	<br/>
	<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="20" required/>
	<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="20" required/>
	<?php _e('Clustering', 'prospect'); ?>: <input type='checkbox' checked='{{c.clstr}}'/>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Locate Object by', 'prospect'); ?>:</b>
			{{#each c.cAtts[tIndex]:aIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
				</span>
			{{/each}}
			<br/>
			<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<br/>
			<b><?php _e('Connect to', 'prospect'); ?>: </b>
			<select value='{{c.pAtts[tIndex]}}'>
			{{#each attsDPtr}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Link Line Color', 'prospect'); ?>: <input type="text" value="{{c.lClrs[tIndex]}}" size="10"/>
			<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c.lClrs[tIndex]}}" on-click="setLColor:{{vIndex}},{{tIndex}}"></span>
			<br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
	<?php _e('Map Base Layer', 'prospect'); ?>: <select value="{{c.base}}">
	{{#each baseMaps}}
		<option value="{{id}}">{{sname}}</option>
	{{/each}}
	</select>
	<?php _e('Map Overlay Layers', 'prospect'); ?>:
	{{#if layerMaps.length > 0 }}
		<button on-click="addMapLayer:{{vIndex}}"><?php _e('Add Layer', 'prospect'); ?></button><br/>
	{{/if}}
	{{#each c.lyrs:lIndex}}
		<div class="map-layer-div">
			<?php _e('Map ID', 'prospect'); ?>: <select value="{{lid}}">
			{{#each layerMaps}}
				<option value="{{id}}">{{sname}}</option>
			{{/each}}
			</select>
			<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" value="{{o}}" step="0.1"/>
			<button decorator="iconButton:ui-icon-trash" on-click="delMapLayer:{{vIndex}},{{lIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		</div>
	{{/each}}
</script>

<script id="vfMap2" type='text/ractive'>
	<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" value="{{c.clat}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<?php _e('Longitude', 'prospect'); ?>: <input type="text" value="{{c.clon}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<br/>
	<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" value="{{c.zoom}}" min="1" max="20" required/>
	<br/>
	<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="20" required/>
	<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="20" required/>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Locate Object by', 'prospect'); ?>:</b>
			<select value='{{c.cAtts[tIndex]}}'>
			{{#each attsDLL}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Label Marker', 'prospect'); ?>:
			<select value='{{c.lbls[tIndex]}}'>
				<option value="n"><?php _e('None', 'prospect'); ?></option>
				<option value="a"><?php _e('Above', 'prospect'); ?></option>
			</select>
			<?php _e('Label Color', 'prospect'); ?>: <input type="text" value="{{c.tClrs[tIndex]}}" size="10"/>
			<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c.tClrs[tIndex]}}" on-click="setTColor:{{vIndex}},{{tIndex}}"></span>
			<br/>
			<b><?php _e('Marker Radius Size', 'prospect'); ?></b>:
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Link Line Color', 'prospect'); ?>: <input type="text" value="{{c.lClrs[tIndex]}}" size="10"/>
			<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c.lClrs[tIndex]}}" on-click="setLColor:{{vIndex}},{{tIndex}}"></span>
			<br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
	<?php _e('Map Base Layer', 'prospect'); ?>: <select value="{{c.base}}">
	{{#each baseMaps}}
		<option value="{{id}}">{{sname}}</option>
	{{/each}}
	</select>
	<?php _e('Map Overlay Groups', 'prospect'); ?>:
	{{#if mapGroups.length > 0 }}
		<button on-click="addMapGroup:{{vIndex}}"><?php _e('Add Map Group', 'prospect'); ?></button><br/>
	{{/if}}
	{{#each c.lyrs:lIndex}}
		<div class="map-layer-div">
			<?php _e('Map Group ID', 'prospect'); ?>: <select value="{{gid}}">
			{{#each mapGroups}}
				<option value="{{this}}">{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" value="{{o}}" step="0.1"/>
			<button decorator="iconButton:ui-icon-trash" on-click="delMapGroup:{{vIndex}},{{lIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		</div>
	{{/each}}
</script>

<script id="vfCards" type='text/ractive'>
	<input type='checkbox' checked='{{c.lOn}}'/> <?php _e('Show Title', 'prospect'); ?> &nbsp;&nbsp;
	<?php _e('Width', 'prospect'); ?>:
		<select value="{{c.w}}">
			<option value="t"><?php _e('Thin', 'prospect'); ?></option>
			<option value="m"><?php _e('Medium', 'prospect'); ?></option>
			<option value="w"><?php _e('Wide', 'prospect'); ?></option>
		</select>
	<?php _e('Height', 'prospect'); ?>:
		<select value="{{c.h}}">
			<option value="s"><?php _e('Short', 'prospect'); ?></option>
			<option value="m"><?php _e('Medium', 'prospect'); ?></option>
			<option value="t"><?php _e('Tall', 'prospect'); ?></option>
		</select>
	<input type='checkbox' checked='{{c.v}}'/> <?php _e('Stack image vertically', 'prospect'); ?>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Image', 'prospect'); ?>: </b>
			<select value='{{c.iAtts[tIndex]}}'>
			{{#each attsImg}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<br/>
			<b><?php _e('Show content', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allCntOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allCntOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.cnt[tIndex]:cIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveAttLeft:{{vIndex}},{{tIndex}},{{cIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveAttRight:{{vIndex}},{{tIndex}},{{cIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
			<br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfPinboard" type='text/ractive'>
	<?php _e('Original Image URL', 'prospect'); ?>: <input type="url" value="{{c.img}}" size="48" pattern="^https?://.+(\.jpg|\.jpeg|\.png)$" required/><br/>
	<?php _e('Original Image Width', 'prospect'); ?>: <input type="number" value="{{c.iw}}" min="1" max="9999"/>
	<?php _e('Height', 'prospect'); ?>: <input type="number" value="{{c.ih}}" min="1" max="9999"/><br/>
	<?php _e('Display Width', 'prospect'); ?>: <input type="number" value="{{c.dw}}" min="1" max="9999"/>
	<?php _e('Height', 'prospect'); ?>: <input type="number" value="{{c.dh}}" min="1" max="9999"/>
	<br/>
	<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="50" required/>
	<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="50" required/>
	<br/>
	<?php _e('Shape Type', 'prospect'); ?>: <select value='{{c.ms}}'>
		<option value="C"><?php _e('Circles', 'prospect'); ?></option>
		<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
		<option value="I"><?php _e('Images', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('X,Y Attribute to use:', 'prospect'); ?> </b>
			<select value='{{c.cAtts[tIndex]}}'>
			{{#each attsXY}}
				<option>{{this}}</option>
			{{/each}}
			</select><br/>
			<b><?php _e('Marker Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<b><?php _e('Connect to', 'prospect'); ?>: </b>
			<select value='{{c.pAtts[tIndex]}}'>
			{{#each attsDPtr}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Link Line Color', 'prospect'); ?>: <input type="text" value="{{c.lClrs[tIndex]}}" size="10"/>
			<span title=<?php _e('"Click to select color"', 'prospect'); ?> class="viz-icon" style="background-color:{{c.lClrs[tIndex]}}" on-click="setLColor:{{vIndex}},{{tIndex}}"></span>
			<br/>
			{{#if c.ms === 'S'}}
				<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
				<select value='{{c.syms[tIndex]}}'>
					<option value=0><?php _e('Circle', 'prospect'); ?></option>
					<option value=1><?php _e('Cross', 'prospect'); ?></option>
					<option value=2><?php _e('Diamond', 'prospect'); ?></option>
					<option value=3><?php _e('Square', 'prospect'); ?></option>
					<option value=4><?php _e('Star', 'prospect'); ?></option>
					<option value=5><?php _e('Wye', 'prospect'); ?></option>
				</select>
				<br/>
			{{elseif c.ms === 'I'}}
				<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
				<select value='{{c.iAtts[tIndex]}}'>
				{{#each attsImg}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
			{{/if}}
			<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>

	<?php _e('Overlay SVG Layers', 'prospect'); ?>: <button on-click="addSVGLayer:{{vIndex}}"><?php _e('Add SVG Layer', 'prospect'); ?></button><br/>
	{{#each c.lyrs:lIndex}}
		<div class="map-layer-div">
			<?php _e('SVG Layer', 'prospect'); ?> {{lIndex}} URL: <input type="text" value="{{url}}" size="40" pattern="^https?://.+" required/>
			<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" value="{{o}}" step="0.1"/>
			<button decorator="iconButton:ui-icon-trash" on-click="delSVGLayer:{{vIndex}},{{lIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		</div>
	{{/each}}
</script>

<script id="vfSChart" type='text/ractive'>
	<input type='checkbox' checked='{{c.gr}}'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
	<br/>
	<?php _e('Pixel height of visualization', 'prospect'); ?>: <input type="number" value="{{c.h}}" min="1" max="1000"/>
	<br/>
	<?php _e('Sort and order Records along x axis by ', 'prospect'); ?>
	<select value='{{c.oAtt}}'>
	{{#each facets}}
		<option value="{{this.id}}">{{this.id}}</option>
	{{/each}}
	</select>
	<?php _e('Group Records in each vertical stack by', 'prospect'); ?>
	<select value='{{c.sAtt}}'>
	{{#each facets}}
		<option value="{{this.id}}">{{this.id}}</option>
	{{/each}}
	</select>
</script>

<script id="vfTimeline" type='text/ractive'>
	<?php _e('Height of Events in Zoom', 'prospect'); ?>: <input type="number" value="{{c.bHt}}" min="2" max="99"/>
	<?php _e('Width of Frame Axis Labels', 'prospect'); ?>: <input type="number" value="{{c.xLbl}}" min="2" max="99"/><br/>
	<?php _e('Macro Frame From Date', 'prospect'); ?>: <input type="text" value="{{c.from}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
	<?php _e('To Date', 'prospect'); ?>: <input type="text" value="{{c.to}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/><br/>
	<?php _e('Zoom Frame From Date', 'prospect'); ?>: <input type="text" value="{{c.zFrom}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
	<?php _e('To Date', 'prospect'); ?>: <input type="text" value="{{c.zTo}}" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/><br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Dates Attribute to use', 'prospect'); ?>: </b>
			<select value='{{c.dAtts[tIndex]}}'>
			{{#each attsDates}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfDirectory" type='text/ractive'>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Show content', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allCntOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allCntOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.cnt[tIndex]:cIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveAttLeft:{{vIndex}},{{tIndex}},{{cIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveAttRight:{{vIndex}},{{tIndex}},{{cIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfTextStream" type='text/ractive'>
	<?php _e('Minimum Font Size', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="2" max="9999"/>
	<?php _e('Maximum Font Size', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="2" max="9999"/>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Record visible content', 'prospect'); ?>: </b>
			<select value='{{c.cnt[tIndex]}}'>
			{{#each attsTCnt}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<b><?php _e('Order by', 'prospect'); ?>: </b>
			<select value='{{c.order[tIndex]}}'>
			{{#each attsOAtt}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<b><?php _e('Text Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select>
			<br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfNetWheel" type='text/ractive'>
	<?php _e('Maximum Label Pixel Width', 'prospect'); ?>: <input type="number" value="{{c.lw}}" min="2" max="9999"/><br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			{{#if attsPtr.length > c.pAtts[tIndex].length}}
				<button on-click="addPtrPair:{{vIndex}},{{tIndex}}"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
			{{/if}}
			{{#each c.pAtts[tIndex]:pIndex}}
				<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
				<select value='{{pid}}'>
				{{#each attsPtr}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<?php _e('Use color', 'prospect'); ?>: <input type="text" value="{{clr}}" size="10"/>
				<span title=<?php _e('"Click to select visual representation"', 'prospect'); ?> class="viz-icon" style="background-color:{{clr}}" on-click="setNetLColor:{{vIndex}},{{tIndex}},{{pIndex}}"></span>
				<button decorator="iconButton:ui-icon-trash" on-click="delPtrPair:{{vIndex}},{{tIndex}},{{pIndex}}"><?php _e('Delete', 'prospect'); ?></button>
				<br/>
			{{/each}}
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfNetGraph" type='text/ractive'>
	<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="50" required/>
	<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="50" required/>
	<?php _e('Display size', 'prospect'); ?>: <input type="number" value="{{c.s}}" min="100" max="1500" required/>
	<br/>
	<?php _e('Shape Type', 'prospect'); ?>: <select value='{{c.ms}}'>
		<option value="C"><?php _e('Circles', 'prospect'); ?></option>
		<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
		<option value="I"><?php _e('Images', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Marker Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select><br/>
			{{#if attsPtr.length > c.pAtts[tIndex].length}}
				<button on-click="addPtrPair:{{vIndex}},{{tIndex}}"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
			{{/if}}
			{{#each c.pAtts[tIndex]:pIndex}}
				<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
				<select value='{{pid}}'>
				{{#each attsPtr}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<?php _e('Use color', 'prospect'); ?>: <input type="text" value="{{clr}}" size="10"/>
				<span title=<?php _e('"Click to select visual representation"', 'prospect'); ?> class="viz-icon" style="background-color:{{clr}}" on-click="setNetLColor:{{vIndex}},{{tIndex}},{{pIndex}}"></span>
				<button decorator="iconButton:ui-icon-trash" on-click="delPtrPair:{{vIndex}},{{tIndex}},{{pIndex}}"><?php _e('Delete', 'prospect'); ?></button>
				<br/>
			{{/each}}
			<br/>
			{{#if c.ms === 'S'}}
				<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
				<select value='{{c.syms[tIndex]}}'>
					<option value=0><?php _e('Circle', 'prospect'); ?></option>
					<option value=1><?php _e('Cross', 'prospect'); ?></option>
					<option value=2><?php _e('Diamond', 'prospect'); ?></option>
					<option value=3><?php _e('Square', 'prospect'); ?></option>
					<option value=4><?php _e('Star', 'prospect'); ?></option>
					<option value=5><?php _e('Wye', 'prospect'); ?></option>
				</select>
				<br/>
			{{elseif c.ms === 'I'}}
				<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
				<select value='{{c.iAtts[tIndex]}}'>
				{{#each attsImg}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
			{{/if}}
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfFlow" type='text/ractive'>
	<?php _e('Display Width', 'prospect'); ?>: <input type="number" value="{{c.w}}" min="2" max="9999"/>
	<br/>
	<input type='checkbox' checked='{{c.gr}}'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
	<br/>
	<?php _e('Attributes (Facets) to Display', 'prospect'); ?>: <button on-click="addFacet:{{vIndex}}"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
	{{#each c.fcts:cIndex}}
		<?php _e('Attribute ID', 'prospect'); ?>: "{{this}}"
		<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="topFacet:{{vIndex}},{{cIndex}}"><?php _e('Move to Top', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-trash" on-click="delFacet:{{vIndex}},{{cIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		<br/>
	{{/each}}
</script>

<script id="vfBrowser" type='text/ractive'>
	<input type='checkbox' checked='{{c.gr}}'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
	<br/>
	<?php _e('Attributes (Facets) to Display', 'prospect'); ?>: <button on-click="addFacet:{{vIndex}}"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
	{{#each c.fcts:cIndex}}
		<?php _e('Attribute ID', 'prospect'); ?>: "{{this}}"
		<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="topFacet:{{vIndex}},{{cIndex}}"><?php _e('Move to Top', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-trash" on-click="delFacet:{{vIndex}},{{cIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		<br/>
	{{/each}}
</script>

<script id="vfMBlockMap" type='text/ractive'>
	<?php _e('Display Width', 'prospect'); ?>: <input type="number" value="{{c.w}}" min="2" max="9999"/>
	<?php _e('Height', 'prospect'); ?>: <input type="number" value="{{c.h}}" min="2" max="9999"/>
	<br/>
	<input type='checkbox' checked='{{c.gr}}'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
	<br/>
	<?php _e('Primary Grouping Attribute', 'prospect'); ?> <select value='{{c.p}}'>
	{{#each facets}}
		<option value="{{this.id}}">{{id}} ({{this.def.l}})</option>
	{{/each}}
	</select>
	<br/>
	<?php _e('Attributes (Facets) to Display', 'prospect'); ?>: <button on-click="addFacet:{{vIndex}}"><?php _e('Add Secondary Attribute', 'prospect'); ?></button><br/>
	{{#each c.fcts:cIndex}}
		<?php _e('Attribute ID', 'prospect'); ?>: "{{this}}"
		<button decorator="iconButton:ui-icon-arrowthickstop-1-n" on-click="topFacet:{{vIndex}},{{cIndex}}"><?php _e('Move to Top', 'prospect'); ?></button>
		<button decorator="iconButton:ui-icon-trash" on-click="delFacet:{{vIndex}},{{cIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		<br/>
	{{/each}}
</script>

<script id="vfBucketMatrix" type='text/ractive'>
	<?php _e('Radius of each node (1-20)', 'prospect'); ?>: <input type="number" value="{{c.nr}}" min="1" max="20"/>
	<?php _e('Width of buckets (2-28 nodes)', 'prospect'); ?>: <input type="number" value="{{c.bw}}" min="2" max="28"/>
	<br/>
	<input type='checkbox' checked='{{c.gr}}'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<?php _e('Sort into buckets by ', 'prospect'); ?>
			<select value='{{c.oAtts[tIndex]}}'>
			{{#each attsFct}}
				<option value="{{this}}">{{this}}</option>
			{{/each}}
			</select>
			<br/>
			{{#if attsPtr.length > c.pAtts[tIndex].length}}
				<button on-click="addPtrPair:{{vIndex}},{{tIndex}}"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
			{{/if}}
			{{#each c.pAtts[tIndex]:pIndex}}
				<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
				<select value='{{pid}}'>
				{{#each attsPtr}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<?php _e('Use color', 'prospect'); ?>: <input type="text" value="{{clr}}" size="10"/>
				<span title=<?php _e('"Click to select visual representation"', 'prospect'); ?> class="viz-icon" style="background-color:{{clr}}" on-click="setNetLColor:{{vIndex}},{{tIndex}},{{pIndex}}"></span>
				<button decorator="iconButton:ui-icon-trash" on-click="delPtrPair:{{vIndex}},{{tIndex}},{{pIndex}}"><?php _e('Delete', 'prospect'); ?></button>
				<br/>
			{{/each}}
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfQRMap" type='text/ractive'>
	<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" value="{{c.clat}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<?php _e('Longitude', 'prospect'); ?>: <input type="text" value="{{c.clon}}" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
	<br/>
	<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" value="{{c.zoom}}" min="1" max="20" required/>
	<br/>
	<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="20" required/>
	<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="20" required/>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select><br/>
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
	<?php _e('Map Base Layer', 'prospect'); ?>: <select value="{{c.base}}">
	{{#each baseMaps}}
		<option value="{{id}}">{{sname}}</option>
	{{/each}}
	</select>
	<?php _e('Map Overlay Groups', 'prospect'); ?>:
	{{#if mapGroups.length > 0 }}
		<button on-click="addMapGroup:{{vIndex}}"><?php _e('Add Map Group', 'prospect'); ?></button><br/>
	{{/if}}
	{{#each c.lyrs:lIndex}}
		<div class="map-layer-div">
			<?php _e('Map Group ID', 'prospect'); ?>: <select value="{{gid}}">
			{{#each mapGroups}}
				<option value="{{this}}">{{this}}</option>
			{{/each}}
			</select>
			<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" value="{{o}}" step="0.1"/>
			<button decorator="iconButton:ui-icon-trash" on-click="delMapGroup:{{vIndex}},{{lIndex}}"><?php _e('Delete', 'prospect'); ?></button>
		</div>
	{{/each}}
</script>

<script id="vfQRNetwork" type='text/ractive'>
	<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.min}}" min="1" max="50" required/>
	<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" value="{{c.max}}" min="1" max="50" required/>
	<?php _e('Display size', 'prospect'); ?>: <input type="number" value="{{c.s}}" min="100" max="1500" required/>
	<br/>
	<?php _e('Shape Type', 'prospect'); ?>: <select value='{{c.ms}}'>
		<option value="C"><?php _e('Circles', 'prospect'); ?></option>
		<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
		<option value="I"><?php _e('Images', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
			<select value='{{c.sAtts[tIndex]}}'>
			{{#each attsDNum}}
				<option>{{this}}</option>
			{{/each}}
			</select><br/>
			{{#if c.ms === 'S'}}
				<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
				<select value='{{c.syms[tIndex]}}'>
					<option value=0><?php _e('Circle', 'prospect'); ?></option>
					<option value=1><?php _e('Cross', 'prospect'); ?></option>
					<option value=2><?php _e('Diamond', 'prospect'); ?></option>
					<option value=3><?php _e('Square', 'prospect'); ?></option>
					<option value=4><?php _e('Star', 'prospect'); ?></option>
					<option value=5><?php _e('Wye', 'prospect'); ?></option>
				</select>
				<br/>
			{{elseif c.ms === 'I'}}
				<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
				<select value='{{c.iAtts[tIndex]}}'>
				{{#each attsImg}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
			{{/if}}
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfEgoGraph" type='text/ractive'>
	<?php _e('Display size (in pixels)', 'prospect'); ?>: <input type="number" value="{{c.s}}" min="100" max="1500" required/>
	<br/>
	<?php _e('Marker size (2-50 pixels)', 'prospect'); ?>: <input type="number" value="{{c.r}}" min="2" max="50" required/>
	<?php _e('Initial degrees of separation (1-6)', 'prospect'); ?>: <input type="number" value="{{c.n}}" min="1" max="6" required/>
	<br/>
	<?php _e('Shape Type', 'prospect'); ?>: <select value='{{c.ms}}'>
		<option value="C"><?php _e('Circles', 'prospect'); ?></option>
		<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
		<option value="I"><?php _e('Images', 'prospect'); ?></option>
	</select>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			{{#if c.ms === 'S'}}
				<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
				<select value='{{c.syms[tIndex]}}'>
					<option value=0><?php _e('Circle', 'prospect'); ?></option>
					<option value=1><?php _e('Cross', 'prospect'); ?></option>
					<option value=2><?php _e('Diamond', 'prospect'); ?></option>
					<option value=3><?php _e('Square', 'prospect'); ?></option>
					<option value=4><?php _e('Star', 'prospect'); ?></option>
					<option value=5><?php _e('Wye', 'prospect'); ?></option>
				</select>
				<br/>
			{{elseif c.ms === 'I'}}
				<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
				<select value='{{c.iAtts[tIndex]}}'>
				{{#each attsImg}}
					<option>{{this}}</option>
				{{/each}}
				</select>
				<br/>
			{{/if}}
			<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
			<button decorator="iconButton:ui-icon-check" on-click="allLgndsOn:{{vIndex}},{{tIndex}}"><?php _e('All On', 'prospect'); ?></button>
			<button decorator="iconButton:ui-icon-cancel" on-click="allLgndsOff:{{vIndex}},{{tIndex}}"><?php _e('All Off', 'prospect'); ?></button>
			{{#each c.lgnds[tIndex]:lIndex}}
				<span class="attribute-controls">
					<input type='checkbox' checked='{{useAtt}}'/> {{attID}}
					<button decorator="iconButton:ui-icon-arrowthick-1-w" on-click="moveLgndLeft:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Left', 'prospect'); ?></button>
					<button decorator="iconButton:ui-icon-arrowthick-1-e" on-click="moveLgndRight:{{vIndex}},{{tIndex}},{{lIndex}}"><?php _e('Right', 'prospect'); ?></button>
				</span>
			{{/each}}
		</div>
		{{/each}}
	</tabs>
</script>

<script id="vfTimeRings" type='text/ractive'>
	<?php _e('Initial space between rings (10-100 pixels)', 'prospect'); ?>: <input type="number" value="{{c.r}}" min="10" max="100" required/>
	<br/>
	<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
	<tabs>
		<ul>
		{{#each iTemplates:tIndex}}
			<li><a href="#tmpt-vf-tab-{{incID}}-{{tIndex}}">{{tid}}</a></li>
		{{/each}}
		</ul>
		{{#each iTemplates:tIndex}}
		<div id="tmpt-vf-tab-{{incID}}-{{tIndex}}">
			<b><?php _e('Dates Attribute to use', 'prospect'); ?>: </b>
			<select value='{{c.dAtts[tIndex]}}'>
			{{#each attsDates}}
				<option>{{this}}</option>
			{{/each}}
			</select>
		</div>
		{{/each}}
	</tabs>
</script>


<!-- DIALOGS -->
<!-- New View Dialog -->
<script id="dialog-choose-vf" type='text/ractive'>
	<dialog title=<?php _e('"New Visualization"', 'prospect'); ?> width="300" height="200">
		<label for="choose-att-label"><?php _e('Label', 'prospect'); ?>&nbsp;</label>
		<input type="text" id="choose-att-label" value="{{label}}" size="24" required/>
		<br/>
		<label for="choose-vf-type"><?php _e('Type', 'prospect'); ?>&nbsp;</label>
		<select id="choose-vf-type" value='{{vfType}}'>
		{{#each vfTypes}}
			<option value="{{this.c}}">{{this.l}}</option>
		{{/each}}
		</select>
	</dialog>
</script>

<!-- Choose Facet Dialog -->
<script id="dialog-choose-fct" type='text/ractive'>
	<dialog title=<?php _e('"Add Attribute Facet"', 'prospect'); ?> width="400" height="160">
		<label for="choose-facet-att"><?php _e('Attribute', 'prospect'); ?> </label>
		<select id="choose-facet-att" value='{{fid}}'>
		{{#each facets}}
			<option value="{{this.id}}">{{id}} ({{this.def.l}})</option>
		{{/each}}
		</select>
	</dialog>
</script>

<!-- Confirm Dialog -->
<script id="dialog-confirm" type='text/ractive'>
	<dialog title=<?php _e('"Confirm"', 'prospect'); ?> width="300" height="200">
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

<!-- Map Relationhip values to Roles Attributes Dialog -->
<script id="dialog-qr-x" type='text/ractive'>
	<dialog title=<?php _e('"Set Roles for Relationships"', 'prospect'); ?> width="450" height="300">
		<button on-click="resetterms"><?php _e('Read & Reset Terms', 'prospect'); ?></button><br/>
		{{#each pairs}}
			<span class="oneterm">{{this.t}}</span>
			<select value='{{this.id}}'>
			{{#each vocabOpts}}
				<option value="{{this}}">{{this}}</option>
			{{/each}}
			</select>
			<br/>
		{{/each}}
	</dialog>
</script>


<!-- DYNAMIC TEXT -->
<script id="dltext-visualizations" type='text/ractive'>
<?php _e('D,Directory|B,Facet Browser|C,Cards|t,TextStream|M,Map 1|p,Map 2|T,Timeline|P,Pinboard|S,Stacked Chart|N,Network Wheel|n,Network Graph|F,Facet Flow|m,MultiBlock Map|b,Bucket Matrix|Q,QR-Map|q,QR-Network|E,Ego-Graph|e,Time-Rings', 'prospect'); ?>
</script>


<!-- ERRORS -->
<script id="errmsg-tmplt-delid" type='text/ractive'>
<?php _e('One of your Templates uses an Attribute ID that has since been deleted. Please re-edit your Templates to ensure obsolete Attributes have been removed from them. (See your browser’s error console for details on IDs.)', 'prospect'); ?>
</script>

<script id="errmsg-id" type='text/ractive'>
<?php _e('You must supply an internal ID for the Exhibit that is no more than 24 characters in length and consists of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-label" type='text/ractive'>
<?php _e('You must supply a Label for the Exhibit that is no more than 48 characters in length.', 'prospect'); ?>
</script>

<script id="errmsg-num-templates" type='text/ractive'>
<?php _e('Every Exhibit needs at least one and no more than four Templates. Please (de)select Templates until this requirement is met.', 'prospect'); ?>
</script>

<script id="errmsg-templates-need-labels" type='text/ractive'>
<?php _e('Every Template needs an Attribute which can serve as a label, but at least one of your Templates is missing a label Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-bad-facet" type='text/ractive'>
<?php _e('You have specified an Attribute that does not exist in the selected Templates for the view named', 'prospect'); ?>
</script>

<script id="errmsg-few-facets" type='text/ractive'>
<?php _e('In order to work, you need more facet Attributes in the view named', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text/ractive'>
<?php _e('All visualizations need unique, non-empty labels. You have not provided a valid label for view', 'prospect'); ?>
</script>

<script id="errmsg-dup-label" type='text/ractive'>
<?php _e('All visualizations need unique, non-empty labels. More than one view has the label', 'prospect'); ?>
</script>

<script id="errmsg-stckchrt-diffats" type='text/ractive'>
<?php _e('You cannot use the same Attribute for both axes on Stacked chart', 'prospect'); ?>
</script>

<script id="errmsg-map-coords" type='text/ractive'>
<?php _e('You must provide the center lat-long coordinate for map', 'prospect'); ?>
</script>

<script id="errmsg-qr-missing" type='text/ractive'>
<?php _e('Some required Attributes are missing from the Qualified Relationship configuration', 'prospect'); ?>
</script>

<script id="errmsg-qr-unique" type='text/ractive'>
<?php _e('Qualified Relationships require unique settings for entity Attribute pairs E1/E2, R1/R2 and C1/C2', 'prospect'); ?>
</script>

<script id="errmsg-qr-usage" type='text/ractive'>
<?php _e('You cannot use QR visualizations if the QR settings have not been configured; provide settings or remove', 'prospect'); ?>
</script>

<script id="errmsg-qr-coord" type='text/ractive'>
<?php _e('You cannot use a QRMap visualization if you haven’t provided the C1 setting at a minimum', 'prospect'); ?>
</script>

<script id="errmsg-qr-rel-lgnd" type='text/ractive'>
<?php _e('The legend for the QR Template must have the Relationship Attribute selected (and only that Attribute) for', 'prospect'); ?>
</script>

<script id="errmsg-ds-bad-date" type='text/ractive'>
<?php _e('A date in your Date Slider is empty or poorly formatted (must be in format YYYY-MM-DD)', 'prospect'); ?>
</script>

<script id="errmsg-ds-date-order" type='text/ractive'>
<?php _e('The start date in your Date Slider is after your end date', 'prospect'); ?>
</script>

<script id="errmsg-ds-date-atts" type='text/ractive'>
<?php _e('You must have at least one non-disable Attribute chosen in the Date Slider', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-vf" type='text/ractive'>
<?php _e('Are you sure that you wish to delete this View from your Exhibit?', 'prospect'); ?>
</script>

<script id="msg-saved" type='text/ractive'>
<?php _e('Exhibit was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>
