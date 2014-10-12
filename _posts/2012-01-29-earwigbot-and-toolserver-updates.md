---
layout: post
title: EarwigBot and Toolserver Updates
tags: ["Wikipedia", "Status report"]
description: More progress on EarwigBot and the Toolserver site rewrite, including dynamic backgrounds
---

Haven't really said much in a while, so I felt it appropriate to make a new
blog post. No, I'm not dead, and yes, I _am_ busy working on my Wikipedia
responsibilities, including EarwigBot and my Toolserver site (which I'll go
into detail about in a bit). Progress is not as quick now as it was over the
summer, and you can blame school for the delay in getting things done. My
primary to-do list for Wikipedia right now looks like this:

1. Finish copyvio detection in the new EarwigBot
2. Integrate EarwigBot's copyvio detection with the new Toolserver site

\#1 has a good portion of its work done, but I still have to finish the actual
detection. I've isolated the work down to a few methods of
`earwigbot.wiki.copyright.CopyrightMixin`: `_copyvio_strip_html()`, to
extract the "text" (i.e. content inside &lt;p&gt; tags) from an HTML document
(I'll probably use something like
[Beautiful Soup](http://www.crummy.com/software/BeautifulSoup/) for this);
`_copyvio_strip_article()`, to extract the "text" from an article (that is,
stripping templates, quotes, references); and `_copyvio_chunk_article()`, to
divide a stripped article into a list of web-searchable queries. Everything
else, including the Task class for `afc_copyvios` is done.

\#2 is very simple once #1 is done. I've already written the code to load
EarwigBot's wiki toolset from `copyvios.mako`, and the config file is written,
so running the detector is trivial once it works. The only thing left here is
to have the tool produce relatively eye-pleasing output, perhaps with a
"details" section showing the Markov chains formed from the two sources and
comparing them visually. Not necessary at all, but a nice touch.

Unfortunately, there's still a bit more work to do on EarwigBot before he's
ready for his first release (0.1!). Aside from the copyvio stuff above, which
is integrated directly as a function of `Page`, I want to finish porting over
the remaining tasks from old EarwigBot that are still running via cron, improve
the Wiki Toolset such that new sites can be added programmatically, and improve
config such that it can be created by the bot and not only by hand. This is the
main barrier stopping other people from running EarwigBot, and thus the primary
concern before v0.1 is good. Of course, none of this urgent; getting copyvio
detection finished is my primary concern.

## Dynamic Backgrounds

Now that that's covered, let's look at something (mostly unrelated) I finished
a couple days ago: dynamic backgrounds for
[my new toolserver site](http://toolserver.org/~earwig/rewrite)! You can see it
in action a bit better on [this page](http://toolserver.org/~earwig/earwigbot).
The background is the the [Wikimedia Commons](//commons.wikimedia.org/)
[Picture of the Day](//commons.wikimedia.org/wiki/Commons:Picture_of_the_day),
loaded and displayed with JavaScript.
[Here's the code for it](//github.com/earwig/toolserver/blob/master/static/js/potd.js),
a good deal more code than I had expected to write.

Here's what we have to do:

1. Query Commons' API for the content of the template \{\{Potd/YYY-MM-DD}}.
2. Parse that content for the filename of the image, which will be hidden in
   something like \{\{Potd filename|1=Foo.png}}.
3. Query Commons' API again for Foo.png's URL and dimensions.
4. Since we want the image to "cover" the background (that is, be the smallest
   size possible while leaving none of the background color visible), we need
   to calculate the image's aspect ratio and our own aspect ratio, then
   determine the width of the thumbnail we want. If the image is shorter than
   our screen, the necessary width is our screen's width, but if the image is
   longer than our screen, the necessary width is our screen's height
   multiplied by the image's aspect ratio.
5. If the width of our desired thumbnail is less than the width of the image,
   we'll alter the image's URL (insert a `/thumb/` in the middle somewhere and
   add a resolution at the end) and set that as our `body`'s `background-image`
   property. This is better than loading the full image and downscaling it,
   because less bandwidth is required.
6. If the width of our desired thumbnail is _greater_ than (or equal to) the
   width of the image, we load the full image and upscale it (gasp! horror!)
   using the CSS bit `background-size: cover;`.

All of the images I tested looked decent when displayed under this method, some
better than others, but all acceptable. I figured this code provided a nice
touch to an otherwise drab webpage (like the one you're viewing now, it
wouldn't have been very pretty), which is why I did it, but I couldn't help but
wonder if there was an... easier... method that still saved bandwidth and
didn't resort to ugly scaling/cropping/repeating/whatever, but I could come up
with nothing. It was a fun project in a language I almost never use, though, so
worth it in the end.

That's all for now!

: &mdash;earwig
