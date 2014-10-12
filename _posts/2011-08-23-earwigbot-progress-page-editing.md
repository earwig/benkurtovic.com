---
layout: post
title: EarwigBot Progress&#58; Page Editing
tags: ["Wikipedia", "Status report"]
description: Exactly what it says on the tin
---

Because of [this](http://git.io/Nw-rLQ), doing this:

{% highlight pycon %}

>>> import wiki
>>> site = wiki.get_site()
>>> page = site.get_page("User:EarwigBot/Sandbox")
>>> page.edit("I can has content?", "BOT: Testing new framework", minor=True)
>>>

{% endhighlight %}

...produces
[this](//en.wikipedia.org/w/index.php?title=User%3AEarwigBot%2FSandbox&diff=prev&oldid=446401978).
Clearly a MASSIVE DEVELOPMENT.

After 5,800 lines of code, 54 files, and over 200 commits, EarwigBot can
actually edit Wikipedia!

Yay!

: &mdash;earwig
