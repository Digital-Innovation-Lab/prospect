// sort selector
jQuery(function($){
    var $sort_select = $("select[name='sort-options']")
    var exp = /(sortby=)([^&]*)/g;
    var origin = location.origin;
    var pathname = location.pathname;
    var search = location.search;
    if (search.match(exp)) {
        var sortby_val = search.match(exp)[0];
        sortby_val = sortby_val.split("=")[1];
        $sort_select.find("option[value='"+ sortby_val +"']").prop("selected", true);
    }
    $sort_select.change(function(){
        var sort_val = $(this).find(":selected").val();
        if (!!search) {
            if (search.match(exp)) {
                search = search.replace(exp, "");
            }
            if (sort_val.toLowerCase() !== "default")
                search += "&sortby=" + sort_val;
        } else {
            if (sort_val.toLowerCase() !== "default")
                search += "?sortby=" + sort_val;
        }
        location.href = origin + pathname + search;
    });
})