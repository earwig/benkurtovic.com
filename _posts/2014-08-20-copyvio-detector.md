---
layout: post
title: Copyvio Detector
tags: Wikipedia
description: A technical writeup of some recent developments
---

This is an technical writeup of some recent developments involving the
[copyright violation](//en.wikipedia.org/wiki/WP:COPYVIO) detector for
Wikipedia articles that I maintain, located at
[tools.wmflabs.org/copyvios](//tools.wmflabs.org/copyvios). Its source code is
available on [GitHub](//github.com/earwig/copyvios).

## Dealing with sources

Of course, the central component of the detector is finding and parsing
potential sources of copyright violations. These sources are obtained through
two methods: investigating external links found in the article, and searching
for article content elsewhere on the web using a search engine
([Yahoo! BOSS](//developer.yahoo.com/boss/search/), paid for by the Wikimedia
Foundation).

To use the search engine, we must first break the article text up into plain
text search queries, or "chunks". This involves some help from
[mwparserfromhell](//github.com/earwig/mwparserfromhell), which is used to
strip out non-text wikicode from the article, and the [Python Natural Language
Toolkit](http://www.nltk.org/), which is then used to split this up into
sentences, of which we select a few medium-sized ones to search for.
mwparserfromhell is also used to extract the external links.

Sources are fetched and then parsed differently depending on the document type
(HTML is handled by
[beautifulsoup](http://www.crummy.com/software/BeautifulSoup/), PDFs are
handled by [pdfminer](http://www.unixuser.org/~euske/python/pdfminer/)), and
normalized to a plain text form. We then create multiple
[Markov chains](https://en.wikipedia.org/wiki/Markov_chain) – the *article
chain* is built from word [5-grams](https://en.wikipedia.org/wiki/N-gram) from
the article text, and a *source chain* is built from each source text. A *delta
chain* is created for each source chain, representing the intersection of it
and the article chain by examining which nodes are shared.

But how do we use these chains to decide whether a violation is present?

## Determining violation confidence

One of the most nuanced aspects of the detector is figuring out the likelihood
that a given article is a violation of a given source. We call this number, a
value between 0 and 1, the "confidence" of a violation. Values between 0 and
0.4 indicate no violation (green background in results page), between 0.4 and
0.75 a "possible" violation (yellow background), and between 0.75 and 1 a
"suspected" violation (red background).

To calculate the confidence of a violation, the copyvio detector uses the
maximum value of two functions, one of which accounts for the size of the delta
chain (<span>\\(\Delta\\)</span>) in relation to the article chain
(<span>\\(A\\)</span>), and the other of which accounts for just the size of
<span>\\(\Delta\\)</span>. This ensures a high confidence value when both
chains are small, but not when <span>\\(A\\)</span> is significantly larger
than <span>\\(\Delta\\)</span>.

The article–delta confidence function, <span>\\(C_{A\Delta}\\)</span>, is
piecewise-defined such that confidence increases at an exponential rate as
<span>\\(\frac{\Delta}{A}\\)</span> increases, until the value of
<span>\\(C_{A\Delta}\\)</span> reaches the "suspected" violation threshold, at
which point confidence increases at a decreasing rate, with
<span>\\(\lim_{\frac{\Delta}{A} \to 1}C\_{A\Delta}(A, \Delta)=1\\)</span>
holding true. The exact coefficients used are shown below:

<div>$$C_{A\Delta}(A, \Delta)=\begin{cases} -\ln(1-\frac{\Delta}{A}) &
\frac{\Delta}{A} \le 0.52763 \\[0.5em]
-0.8939(\frac{\Delta}{A})^2+1.8948\frac{\Delta}{A}-0.0009 &
\frac{\Delta}{A} \gt 0.52763 \end{cases}$$</div>

A graph can be viewed
[here](/static/content/copyvio-detector/article-delta_confidence_function.pdf),
with the x-axis indicating <span>\\(\frac{\Delta}{A}\\)</span> and the y-axis
indicating confidence. The background is colored red, yellow, and green when a
violation is considered suspected, possible, or not present, respectively.

The delta confidence function, <span>\\(C_{\Delta}\\)</span>, is also
piecewise-defined. A number of confidence values were derived experimentally,
and the function was extrapolated from there such that
<span>\\(\lim_{Δ \to +\infty}C\_{\Delta}(\Delta)=1\\)</span>. The reference
points were <span>\\(\\{(0, 0), (100, 0.5), (250, 0.75), (500, 0.9),
(1000, 0.95)\\}\\)</span>. The function is defined as follows:

<div>$$C_{\Delta}(\Delta)=\begin{cases} \frac{\Delta}{\Delta+100} & \Delta\leq
100 \\[0.5em] \frac{\Delta-25}{\Delta+50} &  100\lt \Delta\leq 250\; \\[0.5em]
\frac{10.5\Delta-750}{10\Delta} & 250\lt \Delta\leq 500\; \\[0.5em]
\frac{\Delta-50}{\Delta} & \Delta\gt500 \end{cases}$$</div>

A graph can be viewed
[here](/static/content/copyvio-detector/delta_confidence_function.pdf), with
the x-axis indicating <span>\\(\Delta\\)</span>. The background coloring is the
same as before.

Now that we have these two definitions, we can define the primary confidence
function, <span>\\(C\\)</span>, as follows:

<div>$$C(A, \Delta) = \max(C_{A\Delta}(A, \Delta), C_{\Delta}(\Delta))$$</div>

By feeding <span>\\(A\\)</span> and <span>\\(\Delta\\)</span> into
<span>\\(C\\)</span>, we get our final confidence value.

## Multithreaded worker model

At a high level, the detector needs to be able to rapidly handle a lot of
requests at the same time, but without falling victim to denial-of-service
attacks. Since the tool needs to download many webpages very quickly, it is
vulnerable to abuse if the same request is repeated many times without delay.
Therefore, all requests made to the tool share the same set of persistent
worker subprocesses, referred to as *global worker* mode. However, the
underlying detection machinery in earwigbot also supports a *local worker*
mode, which spawns individual workers for each copyvio check so that idle
processes aren't kept running all the time.

But how do these workers handle fetching URLs? The "safe" solution is to only
handle one URL at a time per request, but this is too slow when twenty-five
pages need to be checked in a few seconds – one single slow website will cause
a huge delay. The detector's solution is to keep unprocessed URLs in
site-specific queues, so that at any given point, only one worker is handling
URLs for a particular domain. This way, no individual website is overloaded by
simultaneous requests, but the copyvio check as a whole is completed quickly.

Other features enable efficiency: copyvio check results are cached for a period
of time so that the Foundation doesn't have to pay Yahoo! for the same
information multiple times; and if a possible source is found to have a
confidence value within the "suspected violation" range, yet-to-be-processed
URLs are skipped and the check short-circuits.
