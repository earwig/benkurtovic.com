function show_tweets(tweets) {
    var element = document.getElementById("tweets");
    for (t in tweets) {
        var tweet = tweets[t];
        var t = '<li class="post">' + fmt_text(tweet["text"]) + "<br />";
        t += '<a href="http://twitter.com/' + tweet["user"]["screen_name"] + '/status/' + tweet["id_str"] + '">'
        t += '<span class="tweet description">' + fmt_date(tweet["created_at"]) + "</span>";
        t += "</a></li>";
        element.innerHTML += t;
    }
}

function fmt_text(t) {
    t = t.replace(/(http:\/\/.*?(\s|$))/ig, '<a href="$1">$1</a>$2');
    t = t.replace(/\@(.*?)(\s|$)/ig, '<a href="http://twitter.com/$1">@$1</a>$2');
    return t;
}

function fmt_date(d) {
    return dateFormat(d, "ddd, mmm d, yyyy 'at' h:MM TT");
}
