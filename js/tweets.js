function load_tweets() {
    var element = document.getElementById("tweets");
    if (element) {
        var callback = "like_a_boss";
        var username = "the_earwig";
        var count = 4;
        var url = "https://twitter.com/statuses/user_timeline/" + username + ".json?count=" + count + "&callback=" + callback;

        var script = document.createElement("script");
        var head = document.getElementsByTagName("head")[0];

        window[callback] = function(tweets) {
            head.removeChild(script);
            show_tweets(tweets, element);
        };

        script.src = url;
        head.appendChild(script);
    }
}

function show_tweets(tweets, element) {
    var addedHTML = "";
    for (t in tweets) {
        var tweet = tweets[t];
        var t = '<li class="post">' + fmt_text(tweet["text"]) + "<br />";
        t += '<a href="http://twitter.com/' + tweet["user"]["screen_name"] + '/status/' + tweet["id_str"] + '">'
        t += '<span class="tweet description">' + fmt_date(tweet["created_at"]) + "</span>";
        t += "</a></li>";
        addedHTML += t;
    }
    element.innerHTML = addedHTML + element.innerHTML;
}

function fmt_text(t) {
    t = t.replace(/(http:\/\/.*?(\s|$))/ig, '<a href="$1">$1</a>$2');
    t = t.replace(/\@(.*?)(\s|$)/ig, '<a href="http://twitter.com/$1">@$1</a>$2');
    t = t.replace(/\#(.*?)(\s|$)/ig, '<a href="http://twitter.com/search/%23$1">#$1</a>$2');
    return t;
}

function fmt_date(d) {
    return dateFormat(d, "ddd, mmm d, yyyy 'at' h:MM TT");
}
