<!-- Outer-most (application) layer -->
<div id="vue-outer">
	<div id="error-frame" v-if="errorMsg.length > 0" v-bind:class="{ ok: errorOK }">{{errorMsg}}</div>
	<button id="prsp-save-data" v-on:click="saveExhibit"><?php _e('Verify and Prepare Exhibit Definition for Publish/Update', 'prospect'); ?></button><br/>
	<accordion>
		<h3><?php _e('General Settings', 'prospect'); ?></h3>
		<div>
			<label for="ext-label"><?php _e('Exhibit’s external label', 'prospect'); ?>: </label>
			<input id="ext-label" type='text' v-model='label' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="24" required/>
			<br/>
			<label for="int-id"><?php _e('Exhibit’s unique internal id', 'prospect'); ?>: </label>
			<input type='text' id="int-id" v-model='xhbtID' placeholder=<?php _e('"Enter id"', 'prospect'); ?> pattern="[\w\-]+" size="24" required/>
			<icon-btn symbol="ui-icon-info" v-on:click="idHint"><?php _e('Hint about IDs', 'prospect'); ?></icon-btn>
			<br/>
			<input type='checkbox' v-model='tour'/> Show Help Tour &nbsp;
			<input type='checkbox' v-model='dspr'/> Disable Perspective Buttons &nbsp;
			<input type='checkbox' v-model='autoUpdate'/> Enable Auto-update
			<br/>
			<label for="home-btn"><?php _e('Home button label', 'prospect'); ?>: </label>
			<input type='text' id="home-btn" v-model='hbtn' placeholder=<?php _e('"Enter label"', 'prospect'); ?> size="12"/>
			<label for="home-url"><?php _e('Home URL', 'prospect'); ?>: </label>
			<input type='url' id="home-url" v-model='hurl' placeholder=<?php _e('"Enter URL"', 'prospect'); ?> size="32" pattern="^https?://.+"/>
			<br/>
			"{{ label }}" <?php _e('will display Template types', 'prospect'); ?>:<br/>
			<span v-for="thisTemplate in iTemplates"><input type='checkbox' v-model='thisTemplate.use'/> {{ thisTemplate.tid }}</span>
			<br/>
			<input type='checkbox' v-model='dateslider.on'/> <?php _e('Enable Date Slider', 'prospect'); ?>
			<div v-if="dateslider.on">
				<?php _e('Start Date', 'prospect'); ?> <input type="text" v-model="dateslider.s" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
				<?php _e('End Date', 'prospect'); ?> <input type="text" v-model="dateslider.e" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
				<br/>
				<?php _e('Initial handle Date (or leave blank)', 'prospect'); ?> <input type="text" v-model="dateslider.h" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
				<input type='checkbox' v-model='dateslider.o'/> <?php _e('Create when Exhibit opened', 'prospect'); ?>
				<br/>
				<div v-for="(thisTemplate,tIndex) in iTemplates">
					<?php _e('Dates Attribute for', 'prospect'); ?> {{ thisTemplate.tid }}:
					<select v-model='dateslider.dAtts[tIndex]'>
						<option v-for="thisAtt in thisTemplate.attsDates">
							{{ thisAtt }}
						</option>
					</select>
				</div>
			</div>
			<input type='checkbox' v-model='qrOn'/> <?php _e('Enable Qualified Relationships', 'prospect'); ?> &nbsp;&nbsp;
			<div v-if="qrOn">
				QR Template <select v-model='qr.t'>
					<option v-for="thisTemplate in qrOptions.t">
						{{ thisTemplate }}
					</option>
				</select>
				<br/>
				Entity 1 <select v-model='qr.e1'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsPtr">
						{{ thisAtt }}
					</option>
				</select>
				Entity 2 <select v-model='qr.e2'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsPtr">
						{{ thisAtt }}
					</option>
				</select>
				Dates <select v-model='qr.d'>
					<option v-for="thisAtt in qrOptions.optsDates">
						{{ thisAtt }}
					</option>
				</select>
				<br/>
				Relationships <select v-model='qr.r'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsVocab">
						{{ thisAtt }}
					</option>
				</select>
				Role 1 <select v-model='qr.r1'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsTxt">
						{{ thisAtt }}
					</option>
				</select>
				Role 2 <select v-model='qr.r2'>
					<option v-for="thisAtt in qrOptions.optsTxt">
						{{ thisAtt }}
					</option>
				</select>
				<br/>
				Lat-Lon 1 <select v-model='qr.c1'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsLL">
						{{ thisAtt }}
					</option>
				</select>
				Lat-Lon 2 <select v-model='qr.c2'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsLL">
						{{ thisAtt }}
					</option>
				</select>
				Certainty <select v-model='qr.c'> &nbsp;
					<option v-for="thisAtt in qrOptions.optsNum">
						{{ thisAtt }}
					</option>
				</select>
				<br/>
				<button v-on:click="setRoles"><?php _e('Set Roles for Relationships', 'prospect'); ?></button>
				<span v-if="qr.x.length == 0">
					&nbsp; <?php _e('(currently empty)', 'prospect'); ?>
				</span>
			</div>
		</div>
	</accordion>
	<accordion>
		<h3><?php _e('Visualizations', 'prospect'); ?></h3>
		<div>
			<button v-on:click="addView"><?php _e('Add Visualization', 'prospect'); ?></button>
			<hr class="vf-divider"/>
			<div v-for="(thisView,vIndex) in viewSettings">
				<div>
					<icon-btn symbol="ui-icon-carat-2-n-s" v-on:click="togDiv"></icon-btn>
					<i>{{ vfLookup[thisView.vf] }}</i>: <input type="text" v-model="thisView.l" size="32" required/>
					<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="topVF(vIndex)"><?php _e('Move to Top', 'prospect'); ?></icon-btn>
					<icon-btn symbol="ui-icon-trash" v-on:click="delVF(vIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
					<br/>
					<?php _e('View Hint', 'prospect'); ?>: <input type="text" v-model="thisView.n" size="72"/>
				</div>
				<div v-bind:id="'vf-div-'+vIndex">
					<div v-if="thisView.vf === 'M'"><!-- Map 1-->
						<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clat" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<?php _e('Longitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clon" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<br/>
						<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" v-model="thisView.c.zoom" min="1" max="20" required/>
						<br/>
						<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="20" required/>
						<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="20" required/>
						<?php _e('Clustering', 'prospect'); ?>: <input type='checkbox' v-model='thisView.c.clstr'/>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Locate Object by', 'prospect'); ?>:</b>
								<span class="attribute-controls" v-for="thisAtt in thisView.c.cAtts[tIndex]">
									<input type='checkbox' v-model='thisAtt.useAtt'/> {{ thisAtt.attID }}
								</span>
								<br/>
								<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<b><?php _e('Connect to', 'prospect'); ?>: </b>
								<select v-model='thisView.c.pAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDPtr">
										{{ thisAtt }}
									</option>
								</select>
								<?php _e('Link Line Color', 'prospect'); ?>: <input type="color" v-model="thisView.c.lClrs[tIndex]"/>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
						<?php _e('Map Base Layer', 'prospect'); ?>: <select v-model="thisView.c.base">
							<option v-for="thisMap in baseMaps" v-bind:value="thisMap.id">
								{{ thisMap.sname }}
							</option>
						</select>
						<?php _e('Map Overlay Layers', 'prospect'); ?>:
						<button v-if="layerMaps.length > 0" v-on:click="addMapLayer(vIndex)"><?php _e('Add Layer', 'prospect'); ?></button><br/>
						<div v-for="(thisLayer,lIndex) in thisView.c.lyrs" class="map-layer-div">
							<?php _e('Map ID', 'prospect'); ?>: <select v-model="thisLayer.lid">
								<option v-for="thisMap in layerMaps" v-bind:value="thisMap.id">
									{{ thisMap.sname }}
								</option>
							</select>
							<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" v-model="thisLayer.o" step="0.1"/>
							<icon-btn symbol="ui-icon-trash" v-on:click="delMapLayer(vIndex,lIndex)"><?php _e('Delete', 'prospect'); ?></button>
						</div>
					</div><!-- Map1 -->
					<div v-if="thisView.vf === 'p'"><!-- Map 2-->
						<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clat" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<?php _e('Longitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clon" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<br/>
						<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" v-model="thisView.c.zoom" min="1" max="20" required/>
						<br/>
						<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="20" required/>
						<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="20" required/>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Locate Object by', 'prospect'); ?>:</b>
								<select v-model='thisView.c.cAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDLL">
										{{ thisAtt }}
									</option>
								</select>
								<?php _e('Label Marker', 'prospect'); ?>:
								<select v-model='thisView.c.lbls[tIndex]'>
									<option value="n"><?php _e('None', 'prospect'); ?></option>
									<option value="a"><?php _e('Above', 'prospect'); ?></option>
								</select>
								<?php _e('Label Color', 'prospect'); ?>: <input type="color" v-model="thisView.c.tClrs[tIndex]"/>
								<br/>
								<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<?php _e('Link Line Color', 'prospect'); ?>: <input type="color" v-model="thisView.c.lClrs[tIndex]"/>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
						<?php _e('Map Base Layer', 'prospect'); ?>: <select v-model="thisView.c.base">
							<option v-for="thisMap in baseMaps" v-bind:value="thisMap.id">
								{{ thisMap.sname }}
							</option>
						</select>
						<?php _e('Map Overlay Groups', 'prospect'); ?>:
						<button v-if="mapGroups.length > 0" v-on:click="addMapGroup(vIndex)"><?php _e('Add Map Group', 'prospect'); ?></button>
						<br/>
						<div v-for="(thisGroup,lIndex) in thisView.c.lyrs" class="map-layer-div">
							<?php _e('Map Group ID', 'prospect'); ?>: <select v-model="thisGroup.gid">
								<option v-for="thisGroup in mapGroups">
									{{ thisGroup }}
								</option>
							</select>
							<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" v-model="thisGroup.o" step="0.1"/>
							<icon-btn symbol="ui-icon-trash" v-on:click="delMapGroup(vIndex,lIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
						</div>
					</div><!-- Map 2 -->
					<div v-if="thisView.vf === 'C'"><!-- Cards -->
						<input type='checkbox' v-model='thisView.c.lOn'/> <?php _e('Show Title', 'prospect'); ?> &nbsp;&nbsp;
						<?php _e('Width', 'prospect'); ?>:
							<select v-model="thisView.c.w">
								<option value="t"><?php _e('Thin', 'prospect'); ?></option>
								<option value="m"><?php _e('Medium', 'prospect'); ?></option>
								<option value="w"><?php _e('Wide', 'prospect'); ?></option>
							</select>
						<?php _e('Height', 'prospect'); ?>:
							<select v-model="thisView.c.h">
								<option value="s"><?php _e('Short', 'prospect'); ?></option>
								<option value="m"><?php _e('Medium', 'prospect'); ?></option>
								<option value="t"><?php _e('Tall', 'prospect'); ?></option>
							</select>
						<input type='checkbox' v-model='thisView.c.v'/> <?php _e('Stack image vertically', 'prospect'); ?>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Image', 'prospect'); ?>: </b>
								<select v-model='thisView.c.iAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsImg">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<b><?php _e('Show content', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allCntOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allCntOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span v-for="(thisContent,cIndex) in thisView.c.cnt[tIndex]" class="attribute-controls">
									<input type='checkbox' v-model='thisContent.useAtt'/> {{ thisContent.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveAttLeft(vIndex,tIndex,cIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveAttRight(vIndex,tIndex,cIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- Cards -->
					<div v-if="thisView.vf === 'P'"><!-- Pinboard -->
						<?php _e('Original Image URL', 'prospect'); ?>: <input type="url" v-model="thisView.c.img" size="48" pattern="^https?://.+(\.jpg|\.jpeg|\.png)$" required/><br/>
						<?php _e('Original Image Width', 'prospect'); ?>: <input type="number" v-model="thisView.c.iw" min="1" max="9999"/>
						<?php _e('Height', 'prospect'); ?>: <input type="number" v-model="thisView.c.ih" min="1" max="9999"/><br/>
						<?php _e('Display Width', 'prospect'); ?>: <input type="number" v-model="thisView.c.dw" min="1" max="9999"/>
						<?php _e('Height', 'prospect'); ?>: <input type="number" v-model="thisView.c.dh" min="1" max="9999"/>
						<br/>
						<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="50" required/>
						<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="50" required/>
						<br/>
						<?php _e('Shape Type', 'prospect'); ?>: <select v-model='thisView.c.ms'>
							<option value="C"><?php _e('Circles', 'prospect'); ?></option>
							<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
							<option value="I"><?php _e('Images', 'prospect'); ?></option>
						</select>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('X,Y Attribute to use:', 'prospect'); ?> </b>
								<select v-model='thisView.c.cAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsXY">
										{{ thisAtt }}
									</option>
								</select><br/>
								<b><?php _e('Marker Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select>
								<b><?php _e('Connect to', 'prospect'); ?>: </b>
								<select v-model='thisView.c.pAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDPtr">
										{{ thisAtt }}
									</option>
								</select>
								<?php _e('Link Line Color', 'prospect'); ?>: <input type="color" v-model="thisView.c.lClrs[tIndex]" size="10"/>
								<br/>
								<div v-if="this.c.ms === 'S'">
									<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.syms[tIndex]'>
										<option value=0><?php _e('Circle', 'prospect'); ?></option>
										<option value=1><?php _e('Cross', 'prospect'); ?></option>
										<option value=2><?php _e('Diamond', 'prospect'); ?></option>
										<option value=3><?php _e('Square', 'prospect'); ?></option>
										<option value=4><?php _e('Star', 'prospect'); ?></option>
										<option value=5><?php _e('Wye', 'prospect'); ?></option>
									</select>
								</div>
								<div v-else-if="thisView.c.ms === 'I'">
									<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.iAtts[tIndex]'>
										<option v-for="thisAtt in theTemplate.attsImg">
											{{ thisAtt }}
										</option>
									</select>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
						<?php _e('Overlay SVG Layers', 'prospect'); ?>: <button v-on:click="addSVGLayer(vIndex)"><?php _e('Add SVG Layer', 'prospect'); ?></button><br/>
						<div v-for="(thisLayer,lIndex) in thisView.c.lyrs" class="map-layer-div">
							<?php _e('SVG Layer', 'prospect'); ?> {{lIndex}} URL: <input type="text" v-model="thisLayer.url" size="40" pattern="^https?://.+" required/>
							<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" v-model="thisLayer.o" step="0.1"/>
							<icon-btn symbol="ui-icon-trash" v-on:click="delSVGLayer(vIndex,lIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
						</div>
					</div><!-- Pinboard -->
					<div v-if="thisView.vf === 'S'"><!-- Stacked Chart -->
						<input type='checkbox' v-model='thisView.c.gr'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
						<br/>
						<?php _e('Pixel height of visualization', 'prospect'); ?>: <input type="number" v-model="thisView.c.h" min="1" max="1000"/>
						<br/>
						<?php _e('Sort and order Records along x axis by ', 'prospect'); ?>
						<select v-model='thisView.c.oAtt'>
							<option v-for="thisFacet in facets" v-bind:value="thisFacet.id">
								{{ thisFacet.id }}
							</option>
						</select>
						<?php _e('Group Records in each vertical stack by', 'prospect'); ?>
						<select v-model='thisView.c.sAtt'>
							<option v-for="thisFacet in facets" v-bind:value="thisFacet.id">
								{{ thisFacet.id }}
							</option>
						</select>
					</div><!-- Stacked Chart -->
					<div v-if="thisView.vf === 'T'"><!-- Timeline -->
						<?php _e('Height of Events in Zoom', 'prospect'); ?>: <input type="number" v-model="thisView.c.bHt" min="2" max="99"/>
						<?php _e('Width of Frame Axis Labels', 'prospect'); ?>: <input type="number" v-model="thisView.c.xLbl" min="2" max="99"/><br/>
						<?php _e('Macro Frame From Date', 'prospect'); ?>: <input type="text" v-model="thisView.c.from" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
						<?php _e('To Date', 'prospect'); ?>: <input type="text" v-model="thisView.c.to" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/><br/>
						<?php _e('Zoom Frame From Date', 'prospect'); ?>: <input type="text" v-model="thisView.c.zFrom" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/>
						<?php _e('To Date', 'prospect'); ?>: <input type="text" v-model="thisView.c.zTo" size="12" placeholder=<?php _e('"YYYY-MM-DD"', 'prospect'); ?>/><br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Dates Attribute to use', 'prospect'); ?>: </b>
								<select v-model='thisView.c.dAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDates">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- Timeline -->
					<div v-if="thisView.vf === 'D'"><!-- Directory -->
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Show content', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allCntOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allCntOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span v-for="(theContent,cIndex) in thisView.c.cnt[tIndex]" class="attribute-controls">
									<input type='checkbox' v-model='theContent.useAtt'/> {{ theContent.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveAttLeft(vIndex,tIndex,cIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveAttRight(vIndex,tIndex,cIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- Directory -->
					<div v-if="thisView.vf === 't'"><!-- TextStream -->
						<?php _e('Minimum Font Size', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="2" max="9999"/>
						<?php _e('Maximum Font Size', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="2" max="9999"/>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Record visible content', 'prospect'); ?>: </b>
								<select v-model='thisView.c.cnt[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsTCnt">
										{{ thisAtt }}
									</option>
								</select>
								<b><?php _e('Order by', 'prospect'); ?>: </b>
								<select v-model='thisView.c.order[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsOAtt">
										{{ thisAtt }}
									</option>
								</select>
								<b><?php _e('Text Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>: </b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- TextStream -->
					<div v-if="thisView.vf === 'N'"><!-- NetWheel -->
						<?php _e('Maximum Label Pixel Width', 'prospect'); ?>: <input type="number" v-model="thisView.c.lw" min="2" max="9999"/><br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<button v-if="theTemplate.attsPtr.length > thisView.c.pAtts[tIndex].length" v-on:click="addPtrPair(vIndex,tIndex)"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
								<div v-for="(thisPointer,pIndex) in c.pAtts[tIndex]">
									<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
									<select v-model='thisPointer.pid'>
										<option v-for="thisAtt in theTemplate.attsPtr">
											{{ thisAtt }}
										</option>
									</select>
									<?php _e('Use color', 'prospect'); ?>: <input type="color" v-model="thisPointer.clr" size="10"/>
									<icon-btn symbol="ui-icon-trash" v-on:click="delPtrPair(vIndex,tIndex,pIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- NetWheel -->
					<div v-if="thisView.vf === 'n'"><!-- NetGraph -->
						<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="50" required/>
						<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="50" required/>
						<?php _e('Display size', 'prospect'); ?>: <input type="number" v-model="thisView.c.s" min="100" max="1500" required/>
						<br/>
						<?php _e('Shape Type', 'prospect'); ?>: <select v-model='thisView.c.ms'>
							<option value="C"><?php _e('Circles', 'prospect'); ?></option>
							<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
							<option value="I"><?php _e('Images', 'prospect'); ?></option>
						</select>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Marker Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select><br/>
								<button v-if="theTemplate.attsPtr.length > thisView.c.pAtts[tIndex].length" v-on:click="addPtrPair(vIndex,tIndex)"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
								<div v-for="(thePointer,pIndex) in theView.c.pAtts[tIndex]">
									<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
									<select v-model='thePointer.pid'>
										<option v-for="thisAtt in theTemplate.attsPtr">
											{{ thisAtt }}
										</option>
									</select>
									<?php _e('Use color', 'prospect'); ?>: <input type="color" v-model="thePointer.clr"/>
									<icon-btn symbol="ui-icon-trash" v-on:click="delPtrPair(vIndex,tIndex,pIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
								</div>
								<br/>
								<div v-if="thisView.c.ms === 'S'">
									<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.syms[tIndex]'>
										<option value=0><?php _e('Circle', 'prospect'); ?></option>
										<option value=1><?php _e('Cross', 'prospect'); ?></option>
										<option value=2><?php _e('Diamond', 'prospect'); ?></option>
										<option value=3><?php _e('Square', 'prospect'); ?></option>
										<option value=4><?php _e('Star', 'prospect'); ?></option>
										<option value=5><?php _e('Wye', 'prospect'); ?></option>
									</select>
								</div>
								<div v-else-if="thisView.c.ms === 'I'">
									<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.iAtts[tIndex]'>
										<option v-for="thisAtt in theTemplate.attsImg">
											{{ thisAtt }}
										</option>
									</select>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<span class="attribute-controls" v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<input type='checkbox' v-model='thisLegend.useAtt'/> {{ thisLegend.attID }}
									<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
									<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
								</span>
							</div>
						</tabs>
					</div><!-- NetGraph -->
					<div v-if="thisView.vf === 'F'"><!-- FacetFlow -->
						<?php _e('Display Width', 'prospect'); ?>: <input type="number" v-model="thisView.c.w" min="2" max="9999"/>
						<br/>
						<input type='checkbox' v-model='thisView.c.gr'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
						<br/>
						<?php _e('Attributes (Facets) to Display', 'prospect'); ?>: <button v-on:click="addFacet(vIndex)"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
						<div v-for="(thisFacet,cIndex) in thisView.c.fcts">
							<?php _e('Attribute ID', 'prospect'); ?>: "{{thisFacet}}"
							<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="topFacet(vIndex,cIndex)"><?php _e('Move to Top', 'prospect'); ?></button>
							<icon-btn symbol="ui-icon-trash" v-on:click="delFacet(vIndex,cIndex)"><?php _e('Delete', 'prospect'); ?></button>
						</div>
					</div><!-- FacetFlow -->
					<div v-if="thisView.vf === 'm'"><!-- MultiBlockMap -->
						<?php _e('Display Width', 'prospect'); ?>: <input type="number" v-model="thisView.c.w" min="2" max="9999"/>
						<?php _e('Height', 'prospect'); ?>: <input type="number" v-model="thisView.c.h" min="2" max="9999"/>
						<br/>
						<input type='checkbox' v-model='thisView.c.gr'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
						<br/>
						<?php _e('Primary Grouping Attribute', 'prospect'); ?>
						<select v-model='thisView.c.p'>
							<option v-for="thisFacet in facets" v-bind:value="thisFacet.id">
								{{ thisFacet.id }} ({{ thisFacet.def.l }})
							</option>
						</select>
						<br/>
						<?php _e('Attributes (Facets) to Display', 'prospect'); ?>:
						<button v-on:click="addFacet(vIndex)"><?php _e('Add Secondary Attribute', 'prospect'); ?></button><br/>
						<div v-for="(thisFacet,cIndex) in thisView.c.fcts">
							<?php _e('Attribute ID', 'prospect'); ?>: "{{ thisFacet }}"
							<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="topFacet(vIndex,cIndex)"><?php _e('Move to Top', 'prospect'); ?></icon-btn>
							<icon-btn symbol="ui-icon-trash" v-on:click="delFacet(vIndex,cIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
						</div>
					</div><!-- MultiBlockMap -->
					<div v-if="thisView.vf === 'B'"><!-- FacetBrowser -->
						<input type='checkbox' v-model='thisView.c.gr'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
						<br/>
						<?php _e('Attributes (Facets) to Display', 'prospect'); ?>: <button v-on:click="addFacet(vIndex)"><?php _e('Add Attribute', 'prospect'); ?></button><br/>
						<div v-for="(thisFacet,cIndex) in thisView.c.fcts">
							<?php _e('Attribute ID', 'prospect'); ?>: "{{ thisFacet }}"
							<icon-btn symbol="ui-icon-arrowthickstop-1-n" v-on:click="topFacet(vIndex,cIndex)"><?php _e('Move to Top', 'prospect'); ?></icon-btn>
							<icon-btn symbol="ui-icon-trash" v-on:click="delFacet(vIndex,cIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
							<br/>
						</div>
					</div><!-- FacetBrowser -->
					<div v-if="thisView.vf === 'b'"><!-- BucketMatrix -->
						<?php _e('Radius of each node (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.nr" min="1" max="20"/>
						<?php _e('Width of buckets (2-28 nodes)', 'prospect'); ?>: <input type="number" v-model="thisView.c.bw" min="2" max="28"/>
						<br/>
						<input type='checkbox' v-model='thisView.c.gr'/> <?php _e('Break Number and Date ranges into graduated scale?', 'prospect'); ?>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<?php _e('Sort into buckets by ', 'prospect'); ?>
								<select v-model='thisView.c.oAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsFct">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<button v-if="theTemplate.attsPtr.length > thisView.c.pAtts[tIndex].length" v-on:click="addPtrPair(vIndex,tIndex)"><?php _e('Add Attribute/Color Pair', 'prospect'); ?></button><br/>
								<div v-for="(thisPointer,pIndex) in thisView.c.pAtts[tIndex]">
									<b><?php _e('Use Pointer Attribute', 'prospect'); ?>: </b>
									<select v-model='thisPointer.pid'>
										<option v-for="thisAtt in theTemplate.attsPtr">
											{{ thisAtt }}
										</option>
									</select>
									<?php _e('Use color', 'prospect'); ?>: <input type="color" v-model="thisPointer.clr"/>
									<icon-btn symbol="ui-icon-trash" v-on:click="delPtrPair(vIndex,tIndex,pIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
									<br/>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<div v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<span class="attribute-controls">
										<input type='checkbox' v-model='thisLegend.useAtt'/> {{attID}}
										<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
										<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
									</span>
								</div>
							</div>
						</tabs>
					</div><!-- BucketMatrix -->
					<div v-if="thisView.vf === 'Q'"><!-- QRMap -->
						<?php _e('Initial Map Center: Latitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clat" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<?php _e('Longitude', 'prospect'); ?>: <input type="text" v-model="thisView.c.clon" size="10" pattern="^-?\d{1,3}(\.\d*)*" required/>
						<br/>
						<?php _e('Initial Zoom Level (1=Max Zoom Out, 20=Max Zoom In)', 'prospect'); ?>: <input type="number" v-model="thisView.c.zoom" min="1" max="20" required/>
						<br/>
						<?php _e('Min Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="20" required/>
						<?php _e('Max Radius (1-20)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="20" required/>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select>
								<br/>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<div v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<span class="attribute-controls">
										<input type='checkbox' v-model='thisLegend.useAtt'/> {{attID}}
										<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
										<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
									</span>
								</div>
							</div>
						</tabs>
						<?php _e('Map Base Layer', 'prospect'); ?>: <select v-model="thisView.c.base">
							<option v-for="thisMap in baseMaps" v-bind:value="thisMap.id">
								{{ thisMap.sname }}
							</option>
						</select>
						<?php _e('Map Overlay Groups', 'prospect'); ?>:
						<button v-if="mapGroups.length > 0" v-on:click="addMapGroup(vIndex)"><?php _e('Add Map Group', 'prospect'); ?></button>
						<br/>
						<div v-for="(thisGroup,lIndex) in thisView.c.lyrs" class="map-layer-div">
							<?php _e('Map Group ID', 'prospect'); ?>: <select v-model="thisGroup.gid">
								<option v-for="thisGroup in mapGroups">
									{{ thisGroup }}
								</option>
							</select>
							<?php _e('Opacity', 'prospect'); ?>: <input type="range" min="0" max="1" v-model="thisGroup.o" step="0.1"/>
							<icon-btn symbol="ui-icon-trash" v-on:click="delMapGroup(vIndex,lIndex)"><?php _e('Delete', 'prospect'); ?></icon-btn>
						</div>
					</div><!-- QRMap -->
					<div v-if="thisView.vf === 'q'"><!-- QRNetwork -->
						<?php _e('Min Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.min" min="1" max="50" required/>
						<?php _e('Max Marker Size (1-50)', 'prospect'); ?>: <input type="number" v-model="thisView.c.max" min="1" max="50" required/>
						<?php _e('Display size', 'prospect'); ?>: <input type="number" v-model="thisView.c.s" min="100" max="1500" required/>
						<br/>
						<?php _e('Shape Type', 'prospect'); ?>: <select v-model='thisView.c.ms'>
							<option value="C"><?php _e('Circles', 'prospect'); ?></option>
							<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
							<option value="I"><?php _e('Images', 'prospect'); ?></option>
						</select>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Marker Radius Size', 'prospect'); ?>: </b>
								<select v-model='thisView.c.sAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDNum">
										{{ thisAtt }}
									</option>
								</select><br/>
								<div v-if="thisView.c.ms === 'S'">
									<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
									<select v-model='this.c.syms[tIndex]'>
										<option value=0><?php _e('Circle', 'prospect'); ?></option>
										<option value=1><?php _e('Cross', 'prospect'); ?></option>
										<option value=2><?php _e('Diamond', 'prospect'); ?></option>
										<option value=3><?php _e('Square', 'prospect'); ?></option>
										<option value=4><?php _e('Star', 'prospect'); ?></option>
										<option value=5><?php _e('Wye', 'prospect'); ?></option>
									</select>
									<br/>
								</div>
								<div v-else-if="thisView.c.ms === 'I'">
									<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.iAtts[tIndex]'>
										<option v-for="thisAtt in theTemplate.attsImg">
											{{ thisAtt }}
										</option>
									</select>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<div v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<span class="attribute-controls">
										<input type='checkbox' v-model='thisLegend.useAtt'/> {{attID}}
										<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
										<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
									</span>
								</div>
							</div>
						</tabs>
					</div><!-- QRNetwork -->
					<div v-if="thisView.vf === 'E'"><!-- EgoGraph -->
						<?php _e('Display size (in pixels)', 'prospect'); ?>: <input type="number" v-model="thisView.c.s" min="100" max="1500" required/>
						<br/>
						<?php _e('Marker size (2-50 pixels)', 'prospect'); ?>: <input type="number" v-model="thisView.c.r" min="2" max="50" required/>
						<?php _e('Initial degrees of separation (1-6)', 'prospect'); ?>: <input type="number" v-model="thisView.c.n" min="1" max="6" required/>
						<br/>
						<?php _e('Shape Type', 'prospect'); ?>: <select v-model='thisView.c.ms'>
							<option value="C"><?php _e('Circles', 'prospect'); ?></option>
							<option value="S"><?php _e('Symbols', 'prospect'); ?></option>
							<option value="I"><?php _e('Images', 'prospect'); ?></option>
						</select>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<div v-if="thisView.c.ms === 'S'">
									<b><?php _e('For this Template, use shape ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.syms[tIndex]'>
										<option value=0><?php _e('Circle', 'prospect'); ?></option>
										<option value=1><?php _e('Cross', 'prospect'); ?></option>
										<option value=2><?php _e('Diamond', 'prospect'); ?></option>
										<option value=3><?php _e('Square', 'prospect'); ?></option>
										<option value=4><?php _e('Star', 'prospect'); ?></option>
										<option value=5><?php _e('Wye', 'prospect'); ?></option>
									</select>
								</div>
								<div v-else-if="thisView.c.ms === 'I'">
									<b><?php _e('For this Template, use Image Attribute ', 'prospect'); ?>: </b>
									<select v-model='thisView.c.iAtts[tIndex]'>
										<option v-for="thisAtt in theTemplate.attsImg">
											{{ thisAtt }}
										</option>
									</select>
									<br/>
								</div>
								<b><?php _e('Provide Legends', 'prospect'); ?>:</b>
								<icon-btn symbol="ui-icon-check" v-on:click="allLgndsOn(vIndex,tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
								<icon-btn symbol="ui-icon-cancel" v-on:click="allLgndsOff(vIndex,tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
								<div v-for="(thisLegend,lIndex) in thisView.c.lgnds[tIndex]">
									<span class="attribute-controls">
										<input type='checkbox' v-model='thisLegend.useAtt'/> {{attID}}
										<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveLgndLeft(vIndex,tIndex,lIndex)"><?php _e('Left', 'prospect'); ?></icon-btn>
										<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveLgndRight(vIndex,tIndex,lIndex)"><?php _e('Right', 'prospect'); ?></icon-btn>
									</span>
								</div>
							</div>
						</tabs>
					</div><!-- EgoGraph -->
					<div v-if="thisView.vf === 'e'"><!-- TimeRings -->
						<?php _e('Initial space between rings (10-100 pixels)', 'prospect'); ?>: <input type="number" v-model="thisView.c.r" min="10" max="100" required/>
						<br/>
						<?php _e('Configure Attribute(s) by Template type', 'prospect'); ?>
						<tabs>
							<ul>
								<li v-for="(theTemplate,tIndex) in iTemplates">
									<a v-bind:href="'#tmpt-vf-tab-'+thisView.incID+'-'+tIndex">{{ theTemplate.tid }}</a>
								</li>
							</ul>
							<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'tmpt-vf-tab-'+thisView.incID+'-'+tIndex">
								<b><?php _e('Dates Attribute to use', 'prospect'); ?>: </b>
								<select v-model='thisView.c.dAtts[tIndex]'>
									<option v-for="thisAtt in theTemplate.attsDates">
										{{ thisAtt }}
									</option>
								</select>
							</div>
						</tabs>
					</div><!-- TimeRings -->
				</div>
				<hr class="vf-divider" v-if="vIndex != (viewSettings.length-1)"/>
			</div><!-- Each view -->
		</div><!-- Visualization section -->
	</accordion>
	<accordion>
		<h3><?php _e('Inspector', 'prospect'); ?></h3>
		<div>
			<div>
				<b><?php _e('Playback Widgets', 'prospect'); ?></b>:
				<input type='checkbox' v-model='modal.aOn'/> <?php _e('Audio', 'prospect'); ?>
				<input type='checkbox' v-model='modal.scOn'/> <?php _e('Load SoundCloud', 'prospect'); ?>
				<input type='checkbox' v-model='modal.ytOn'/> <?php _e('YouTube', 'prospect'); ?>
				<input type='checkbox' v-model='modal.tOn'/> <?php _e('Transcripts', 'prospect'); ?>
				<input type='checkbox' v-model='modal.t2On'/> <?php _e('Dual Transcripts', 'prospect'); ?>
			</div>
			<input type='checkbox' id="see-rec-off" v-model='srOff'/>
			<label for="see-rec-off"><?php _e('Disable “See Item” button', 'prospect'); ?> </label>
			<div>
				<?php _e('Size overrides (leave blank for default)', 'prospect'); ?>:
				<?php _e('Width', 'prospect'); ?> <input type='text' v-model='modalW' placeholder=<?php _e('"Default"', 'prospect'); ?> size="5"/>
				<?php _e('Height', 'prospect'); ?> <input type='text' v-model='modalH' placeholder=<?php _e('"Default"', 'prospect'); ?> size="5"/>
			</div>

			<accordion>
				<h3><?php _e('Attributes to Display', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Attribute(s) to display according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
							<li v-for="(theTemplate,tIndex) in iTemplates">
								<a v-bind:href="'#inspect-tab-'+tIndex">{{ theTemplate.tid }}</a>
							</li>
						</ul>
						<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'inspect-tab-'+tIndex">
							<icon-btn symbol="ui-icon-check" v-on:click="allDispAttsOn(tIndex)"><?php _e('All On', 'prospect'); ?></icon-btn>
							<icon-btn symbol="ui-icon-cancel" v-on:click="allDispAttsOff(tIndex)"><?php _e('All Off', 'prospect'); ?></icon-btn>
							<span class="attribute-controls" v-for="(thisAttribute,aIndex) in modal.atts[tIndex]">
								<input type='checkbox' v-model='thisAttribute.useAtt'/> {{ thisAttribute.attID }}
								<icon-btn symbol="ui-icon-arrowthick-1-w" v-on:click="moveAttLeft('i',tIndex,aIndex)"><?php _e('Left', 'prospect'); ?></button>
								<icon-btn symbol="ui-icon-arrowthick-1-e" v-on:click="moveAttRight('i',tIndex,aIndex)"><?php _e('Right', 'prospect'); ?></button>
							</span>
						</div>
					</tabs>
				</div>
			</accordion>
			<accordion>
				<h3><?php _e('Audio Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Audio Attribute (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
							<li v-for="(theTemplate,tIndex) in iTemplates">
								<a v-bind:href="'#sc-tab-'+tIndex">{{ theTemplate.tid }}</a>
							</li>
						</ul>
						<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'sc-tab-'+tIndex">
							<select v-model='sc.atts[tIndex]'>
								<option v-for="thisAtt in theTemplate.attsSC">
									{{ thisAtt }}
								</option>
							</select>
						</div>
					</tabs>
				</div>
			</accordion>
			<accordion>
				<h3><?php _e('YouTube Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the YouTube Attribute (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
							<li v-for="(theTemplate,tIndex) in iTemplates">
								<a v-bind:href="'#yt-tab-'+tIndex">{{ theTemplate.tid }}</a>
							</li>
						</ul>
						<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'yt-tab-'+tIndex">
							<select v-model='yt.atts[tIndex]'>
								<option v-for="thisAtt in theTemplate.attsYT">
									{{ thisAtt }}
								</option>
							</select>
						</div>
					</tabs>
				</div>
			</accordion>
			<accordion>
				<h3><?php _e('Transcript Widget', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Transcript and Timecode Attributes (if any) according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
							<li v-for="(theTemplate,tIndex) in iTemplates">
								<a v-bind:href="'#trans-tab-'+tIndex">{{ theTemplate.tid }}</a>
							</li>
						</ul>
						<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'trans-tab-'+tIndex">
							<?php _e('Primary Transcript', 'prospect'); ?>: <select v-model='t.t1Atts[tIndex]'>
								<option v-for="thisAtt in theTemplate.attsTrns">
									{{ thisAtt }}
								</option>
							</select>
							<?php _e('Secondary Transcript', 'prospect'); ?>: <select v-model='t.t2Atts[tIndex]'>
								<option v-for="thisAtt in theTemplate.attsTrns">
									{{ thisAtt }}
								</option>
							</select>
						</div>
					</tabs>
				</div>
			</accordion>
			<accordion>
				<h3><?php _e('Timecodes (for Playback widget segments)', 'prospect'); ?></h3>
				<div>
					<?php _e('Choose the Timecode Attribute (if any) for Playback widgets according to Template type', 'prospect'); ?>:
					<tabs>
						<ul>
							<li v-for="(theTemplate,tIndex) in iTemplates">
								<a v-bind:href="'#timecode-tab-'+tIndex">{{ theTemplate.tid }}</a>
							</li>
						</ul>
						<div v-for="(theTemplate,tIndex) in iTemplates" v-bind:id="'timecode-tab-'+tIndex">
							<?php _e('Extract Timecode', 'prospect'); ?>: <select v-model='t.tcAtts[tIndex]'>
								<option v-for="thisAtt in theTemplate.attsTC">
									{{ thisAtt }}
								</option>
							</select>
						</div>
					</tabs>
				</div>
			</accordion>
		</div>
	</accordion>

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

<!-- DIALOGS -->
<!-- New View Dialog -->
<script id="dialog-choose-vf" type='text/x-template'>
	<vuemodal title=<?php _e('"New Visualization"', 'prospect'); ?> cancel="true" v-on:save="save">
		<label for="choose-att-label"><?php _e('Label', 'prospect'); ?>&nbsp;</label>
		<input type="text" id="choose-att-label" v-model="label" size="24" required/>
		<br/>
		<label for="choose-vf-type"><?php _e('Type', 'prospect'); ?>&nbsp;</label>
		<select id="choose-vf-type" v-model='vfType'>
			<option v-for="thisType in params.vfTypes" v-bind:value="thisType.c">
				{{ thisType.l }}
			</option>
		</select>
	</vuemodal>
</script>

<!-- Choose Facet Dialog -->
<script id="dialog-choose-fct" type='text/x-template'>
	<vuemodal title=<?php _e('"Add Attribute Facet"', 'prospect'); ?> cancel="true" v-on:save="save">
		<select v-model='facetid'>
			<option v-for="thisFacet in params.facets" v-bind:value="thisFacet.id">
				{{ thisFacet.id }} ({{ thisFacet.def.l }})
			</option>
		</select>
	</vuemodal>
</script>

<!-- Map Relationhip values to Roles Attributes Dialog -->
<script id="dialog-qr-x" type='text/x-template'>
	<vuemodal title=<?php _e('"Set Roles for Relationships"', 'prospect'); ?> cancel="true" v-on:save="save">
		<button v-on:click="resetterms"><?php _e('Read & Reset Terms', 'prospect'); ?></button>
		<br/>
		<div v-for="thisPair in pairs">
			<span class="oneterm">{{ thisPair.t }}</span>
			<select v-model='{{ thisPair.id }}'>
				<option v-for="thisAtt in params.vocabOpts">
					{{ thisAtt }}
				</option>
			</select>
			<br/>
		</div>
	</vuemodal>
</script>


<!-- DYNAMIC TEXT -->
<script id="dltext-visualizations" type='text'>
<?php _e('D,Directory|B,Facet Browser|C,Cards|t,TextStream|M,Map 1|p,Map 2|T,Timeline|P,Pinboard|S,Stacked Chart|N,Network Wheel|n,Network Graph|F,Facet Flow|m,MultiBlock Map|b,Bucket Matrix|Q,QR-Map|q,QR-Network|E,Ego-Graph|e,Time-Rings', 'prospect'); ?>
</script>


<!-- ERRORS -->
<script id="errmsg-tmplt-delid" type='text'>
<?php _e('One of your Templates uses an Attribute ID that has since been deleted. Please re-edit your Templates to ensure obsolete Attributes have been removed from them. (See your browser’s error console for details on IDs.)', 'prospect'); ?>
</script>

<script id="errmsg-id" type='text'>
<?php _e('You must supply an internal ID for the Exhibit that is no more than 24 characters in length and consists of alphabetic characters (in plain ASCII), numbers, underscores and hyphens (it cannot contain spaces, punctuation, Unicode-only characters, etc).', 'prospect'); ?>
</script>

<script id="errmsg-label" type='text'>
<?php _e('You must supply a Label for the Exhibit that is no more than 48 characters in length.', 'prospect'); ?>
</script>

<script id="errmsg-num-templates" type='text'>
<?php _e('Every Exhibit needs at least one and no more than four Templates. Please (de)select Templates until this requirement is met.', 'prospect'); ?>
</script>

<script id="errmsg-templates-need-labels" type='text'>
<?php _e('Every Template needs an Attribute which can serve as a label, but at least one of your Templates is missing a label Attribute.', 'prospect'); ?>
</script>

<script id="errmsg-bad-facet" type='text'>
<?php _e('You have specified an Attribute that does not exist in the selected Templates for the view named', 'prospect'); ?>
</script>

<script id="errmsg-few-facets" type='text'>
<?php _e('In order to work, you need more facet Attributes in the view named', 'prospect'); ?>
</script>

<script id="errmsg-no-label" type='text'>
<?php _e('All visualizations need unique, non-empty labels. You have not provided a valid label for view', 'prospect'); ?>
</script>

<script id="errmsg-dup-label" type='text'>
<?php _e('All visualizations need unique, non-empty labels. More than one view has the label', 'prospect'); ?>
</script>

<script id="errmsg-stckchrt-diffats" type='text'>
<?php _e('You cannot use the same Attribute for both axes on Stacked chart', 'prospect'); ?>
</script>

<script id="errmsg-map-coords" type='text'>
<?php _e('You must provide the center lat-long coordinate for map', 'prospect'); ?>
</script>

<script id="errmsg-qr-missing" type='text'>
<?php _e('Some required Attributes are missing from the Qualified Relationship configuration', 'prospect'); ?>
</script>

<script id="errmsg-qr-unique" type='text'>
<?php _e('Qualified Relationships require unique settings for entity Attribute pairs E1/E2, R1/R2 and C1/C2', 'prospect'); ?>
</script>

<script id="errmsg-qr-usage" type='text'>
<?php _e('You cannot use QR visualizations if the QR settings have not been configured; provide settings or remove', 'prospect'); ?>
</script>

<script id="errmsg-qr-coord" type='text'>
<?php _e('You cannot use a QRMap visualization if you haven’t provided the C1 setting at a minimum', 'prospect'); ?>
</script>

<script id="errmsg-qr-rel-lgnd" type='text'>
<?php _e('The legend for the QR Template must have the Relationship Attribute selected (and only that Attribute) for', 'prospect'); ?>
</script>

<script id="errmsg-ds-bad-date" type='text'>
<?php _e('A date in your Date Slider is empty or poorly formatted (must be in format YYYY-MM-DD)', 'prospect'); ?>
</script>

<script id="errmsg-ds-date-order" type='text'>
<?php _e('The start date in your Date Slider is after your end date', 'prospect'); ?>
</script>

<script id="errmsg-ds-date-atts" type='text'>
<?php _e('You must have at least one non-disable Attribute chosen in the Date Slider', 'prospect'); ?>
</script>


<!-- MESSAGE -->
<script id="msg-confirm-del-vf" type='text'>
<?php _e('Are you sure that you wish to delete this View from your Exhibit?', 'prospect'); ?>
</script>

<script id="msg-saved" type='text'>
<?php _e('Exhibit was verified and prepared to be saved: now click the Publish or Update button on the right.', 'prospect'); ?>
</script>
