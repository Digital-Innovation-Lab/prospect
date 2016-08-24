<?php get_header(); ?>

<div id="primary" class="content-area">
    <main id="main" class="site-main" role="main">
		<?php
			echo $post->post_content;
		?>
	</main>
</div>

<script id="dltext-undef" type="text">
<?php _e('Indefinite', 'prospect'); ?>
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

<script id="dltext-see-link" type="text">
<?php _e('See Link', 'prospect'); ?>
</script>

<script id="dltext-go-audio" type="text">
<?php _e('Go To Audio', 'prospect'); ?>
</script>

<script id="dltext-go-transcript" type="text">
<?php _e('Go To Transcript', 'prospect'); ?>
</script>

<script id="dltext-sync-xscript" type="text">
<input type="checkbox" id="sync-xscript" name="sync-xscript" checked> <?php _e('Scroll transcript to follow playback', 'prospect'); ?>
</script>

<?php get_footer(); ?>
