---
layout: post
title: EarwigBot Progress&#58; Wiki Toolset
tags: ["Wikipedia", "Status report"]
description: YAWTF (Yet Another Wiki Tools Framework, or Yet Another... WTF?)
---

__Update Aug 08, 2011__: Some changes made thanks to updates in the new
`feature/tests-framework` branch.

So I've been spending the past week and a half working on EarwigBot's new
wikitools framework thing (to avoid confusion with Mr.Z-man's
`python-wikitools` package, I'm referring to it as "EarwigBot's Wiki Toolset"
in the docs, even though it's just `wiki` internally). Basically, it's the
interface between EarwigBot and the MediaWiki API.

As Josh put it, this is "the thing that actually makes it work".

So, now you can do this (from within Python's interpreter, a wiki bot task, or
an IRC command):

{% highlight pycon %}

>>> import wiki
>>> site = wiki.get_site()
>>> print site.name()
enwiki
>>> print site.project()
wikipedia
>>> print site.lang()
en
>>> print site.domain()
en.wikipedia.org

{% endhighlight %}

Our `config.json` file stores site information, along with our chosen "default
site". Pretty neat, huh? "But what can it actually do?" I hear you ask? Well,
for example, we can get information about users:

{% highlight pycon %}

>>> user = site.get_user("The Earwig")
>>> print user.editcount()
11079
>>> print user.groups()
[u'*', u'user', u'autoconfirmed', u'abusefilter', u'sysop']
>>> reg = user.registration()
>>> import time
>>> print time.strftime("%a, %d %b %Y %H:%M:%S", reg)
Thu, 03 Jul 2008 21:51:34

{% endhighlight %}

and pages as well, with intelligent namespace logic:

{% highlight pycon %}

>>> page = site.get_page("Wikipedia:Articles for creation")
>>> print page.url()
http://en.wikipedia.org/wiki/Wikipedia:Articles_for_creation
>>> print page.creator()
Uncle G
>>> print page.namespace()
4
>>> print site.namespace_id_to_name(4)
Wikipedia
>>> print site.namespace_id_to_name(4, all=True)
[u'Wikipedia', u'Project', u'WP']
>>> print page.is_talkpage()
False

>>> talkpage = page.toggle_talk()
>>> print talkpage.title()
Wikipedia talk:Articles for creation
>>> print talkpage.is_talkpage()
True

{% endhighlight %}

and with support for redirect following:

{% highlight pycon %}

>>> page = site.get_page("Main page")
>>> print page.is_redirect()
True
>>> print page.get()
#REDIRECT [[Main Page]]
[[Category:Protected redirects]]
[[Category:Main Page| ]]
>>> print page.get_redirect_target()
Main Page

>>> page = site.get_page("Main page", follow_redirects=True)
>>> print page.is_redirect()
False  # would only be True if "Main page" is a double redirect
>>> print page.get()
<!--        BANNER ACROSS TOP OF PAGE        -->
{| id="mp-topbanner" style="width:100%; background:#f9f9f9; margin:1.2em 0 6px 0; border:1px solid #ddd;"
| style="width:61%; color:#000;" |
...

{% endhighlight %}

Of course, a Wiki Toolset would be nothing without login! Our username and
password are stored (encrypted with Blowfish) in the bot's `config.json` file,
and we login automatically whenever we create a new Site object &ndash; unless
we're already logged in, of course, and we know that based on whether we have
valid login cookies.

{% highlight pycon %}

>>> user = site.get_user()  # gets the logged-in user
>>> print user.name()
EarwigBot

{% endhighlight %}

Cookies are stored in a special `.cookies` file in the project root (with no
access given to other users, of course). We support both per-project login and
CentralAuth, meaning I can do...

{% highlight pycon %}

>>> es = wiki.get_site("eswiki")
>>> print es.get_user().name()
EarwigBot

{% endhighlight %}

without making additional logins. One thing I strove for when designing the
toolset was as minimal API usage as possible &ndash; we accept gzipped data, we
don't make API queries unless they're actually requested, and we combine
queries whenever possible. Of course, I'm probably doing it all wrong, but
it seems to be working so far.

So... yeah. Carry on then!

: &mdash;earwig
