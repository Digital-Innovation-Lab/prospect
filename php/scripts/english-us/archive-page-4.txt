</select>
<input type="submit" id="export_xhbt_prspctvs" name="export_xhbt_prspctvs" value="Export Perspectives"/>
</form>

<h3>Maps</h3>
<a href="admin.php?action=prsp_export_all_maps" title="Export all Maps as JSON archive file" rel="permalink">Export all Maps as JSON file</a>
<br/>

<h3>Perspectives</h3>
<a href="admin.php?action=prsp_export_all_prspctvs" title="Export all Perspectives as JSON archive file" rel="permalink">Export all Perspectives as JSON file</a>
<br/>

<h3>Website Configuration Export</h3>
<p><b>IMPORTANT:</b> All Records must still be exported on a Template-by-Template basis; this archive file does not include Maps or Perspectives.</p>
<a href="admin.php?action=prsp_export_all" title="Export all" rel="permalink">Export all Attributes, Templates and Exhibits from this website as a JSON archive file</a>

<h3>Import JSON Archive File</h3>
<p>You can import a JSON archive file containing Attributes, Templates, Exhibits, Maps and/or Perspectives. You must use other means for importing CSV files containing Records.</p>
<p><b>WARNING:</b> Data entities whose IDs already exist are ignored, rather than overriding existing definitions.</p>
<form id="prsp-archive-import-form" method="post" enctype="multipart/form-data">
<label for="archive-import-select">Archive JSON File to Import</label>
<input type="file" size="60" name="archive-import-select" id="archive_import_file"/><br/>
<input type="submit" id="import_submit" name="import_submit" value="Upload Archive"/>
</form>