function fix_tag_links() {
    $(".post-tag").attr("href", function() {
        return "/#" + encodeURIComponent($(this).text());
    });
}

function load_tag_filters() {
    var filter_posts = function() {
        var filter = [];
        $(".tag-selected").each(function() {
            filter.push($(this).data("tag"))
        });
        $("#post-list li").show();
        $("#null-post").hide();
        if ($(".tag-selected").length == 0)
            return;
        $("#post-list li").each(function() {
            var tags = $(this).data("tags").split("|");
            for (var i in filter) {
                if ($.inArray(filter[i], tags) == -1) {
                    $(this).hide();
                    return;
                }
            }
        });
        if ($("#post-list li:not(:hidden)").length == 0)
            $("#null-post").show();
    }

    if (window.location.hash) {
        var tags = decodeURIComponent(window.location.hash.substr(1)).split("|");
        $(".tag").each(function() {
            if ($.inArray($(this).data("tag"), tags) != -1)
                $(this).toggleClass("tag-selected");
        });
        filter_posts();
    }

    $(".tag").click(function() {
        var tags = [];
        $(this).toggleClass("tag-selected");
        $(".tag-selected").each(function() {
            tags.push($(this).data("tag"))
        });
        if (tags.length > 0)
            window.location.hash = encodeURIComponent(tags.join("|"));
        else
            history.pushState("", "", window.location.pathname);
        filter_posts();
    });
}

function load_paragraph_links() {
    $("#post").find("h1, h2, h3, h4, h5, h6").hover(function() {
        $(this).append($("<a>")
            .attr("href", "#" + this.id)
            .attr("class", "para-link")
            .text("¶"));
    }, function() {
        $(this).find(".para-link").remove();
    });
}

$(document).ready(function() {
    fix_tag_links();
    load_tag_filters();
    load_paragraph_links();
});
