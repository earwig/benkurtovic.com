function load_tag_filters() {
    $(".tag").click(function() {
        $(this).toggleClass("tag-selected");

        var allowed = [];
        $(".tag-selected").each(function() {
            allowed.push($(this).text())
        });

        var num_selected = $(".tag-selected").length;
        if (num_selected == 0 || num_selected == $(".tag").length)
            $("#post-list li").show();
        else {
            $("#post-list li").hide();
            $("#post-list li").each(function() {
                var tags = $(this).data("tags").split("|");
                for (var t in tags) {
                    if ($.inArray(tags[t], allowed) != -1) {
                        $(this).show();
                        return;
                    }
                }
            });
        }
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
    load_tag_filters();
    load_paragraph_links();
});
