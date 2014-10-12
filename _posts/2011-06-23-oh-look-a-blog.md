---
layout: post
title: Oh Look, A Blog!
tags: ["Status report"]
description: Just kinda playing with the idea of my own site right now
---

Hello there.

As you can probably guess, I don't do web development often (or at all,
really). My experience lies almost completely in scripting languages like
Python, a little C++ and Java, some PHP, and a handful of other things, but I
tend to stick with Python almost entirely (it's just so awesome!). Designing
actual webpages (aside from coding the logic behind them &ndash; that's another
story) is kinda foreign to me.

I'm hoping to come up with a decent HTML/CSS design here over time, and
eventually use the code in the rewrite of my
[Toolserver](http://toolserver.org/~earwig) site. That desperately needs to be
updated. Half of the "tools" don't even work!

Either way, the Toolserver site rewrite (which will eventually be a GitHub
repo) will go hand-in-hand with the EarwigBot rewrite that has been underway
since April. I'm thinking that there will be a main repository &ndash;
something like `earwig/toolserver-public` &ndash; that will essentially be
everything inside the `public_html` folder. That will contain docs about
EarwigBot and my various (new) tools, the main `index.(html|php)` file, and the
CSS/image crud. Individual tools, which consist of code and web UI, will be
their own repos (think `earwig/toolserver-copyvio-intersect`) which will be git
submodules in the main `toolserver-public` repo. I think this could work.

Right now, I have to finish up EarwigBot's `feature/config-rewrite` branch,
merge that into develop, and get the live version of EarwigBot's config files
updated. Once that's settled, the bot's backbone is essentially complete
(finally!) The only remaining tasks are to start working on the actual wiki API
interface, and when that's done, the bot tasks themselves. Easily a summer of
work, but when it's complete, EarwigBot should be mostly finished, and up to at
least version 1.0!

So... questions? Comments? H8 mail? [Lay it on me!](mailto:ben.kurtovic@gmail.com)

: &mdash;earwig
