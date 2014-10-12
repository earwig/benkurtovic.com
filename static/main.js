function fix_tag_links() {
    $("#post-info").find("a").attr("href", function() {
        return "/#" + encodeURIComponent($(this).text());
    });
}

function load_tag_filters() {
    var filter_posts = function(filter) {
        var num_selected = $(".tag-selected").length;
        if (num_selected == 0 || num_selected == $(".tag").length)
            $("#post-list li").show();
        else {
            $("#post-list li").hide();
            $("#post-list li").each(function() {
                var tags = $(this).data("tags").split("|");
                for (var t in tags) {
                    if ($.inArray(tags[t], filter) != -1) {
                        $(this).show();
                        return;
                    }
                }
            });
        }
    }

    if (window.location.hash) {
        var tags = decodeURIComponent(window.location.hash.substr(1)).split("|");
        $(".tag").each(function() {
            if ($.inArray($(this).text(), tags) != -1)
                $(this).toggleClass("tag-selected");
        });
        filter_posts(tags);
    }

    $(".tag").click(function() {
        $(this).toggleClass("tag-selected");

        var tags = [];
        $(".tag-selected").each(function() {
            tags.push($(this).text())
        });
        if (tags.length > 0)
            window.location.hash = encodeURIComponent(tags.join("|"));
        else
            history.pushState("", "", window.location.pathname);
        filter_posts(tags);
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
