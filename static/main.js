$(document).ready(function() {
    $("#post").find("h1, h2, h3, h4, h5, h6").hover(function() {
        $(this).append($("<a>")
            .attr("href", "#" + this.id)
            .attr("class", "para-link")
            .text("¶"));
    }, function() {
        $(this).find(".para-link").remove();
    });
});
