---
layout: post
title: Copyvio Detector
description: A technical writeup of some recent developments.
---

This is an in-progress technical writeup of some recent developments involving
the [copyright violation](//en.wikipedia.org/wiki/WP:COPYVIO) detector for
Wikipedia articles that I maintain, located at
[tools.wmflabs.org/copyvios](//tools.wmflabs.org/copyvios). Its source code is
available on [GitHub](//github.com/earwig/copyvios).

## Determining violation confidence

One of the most important aspects of the detector is not fetching and parsing
potential sources, but figuring out the likelihood that a given article is a
violation of a given source. We call this number, a value between 0 and 1, the
"confidence" of a violation. Values between 0 and 0.5 indicate no violation
(green background in results page), between 0.5 and 0.75 a "possible" violation
(yellow background), and between 0.75 and 1 a "suspected" violation (red
background).

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

<div>$$C_{A\Delta}(A, \Delta)=\begin{cases} \ln\frac{1}{1-\frac{\Delta}{A}} &
\frac{\Delta}{A} \le 0.52763 \\[0.5em]
-0.8939(\frac{\Delta}{A})^2+1.8948\frac{\Delta}{A}-0.0009 &
\frac{\Delta}{A} \gt 0.52763 \end{cases}$$</div>

A graph can be viewed [here](/static/article-delta_confidence_function.pdf),
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

A graph can be viewed [here](/static/delta_confidence_function.pdf), with the
x-axis indicating <span>\\(\Delta\\)</span>. The background coloring is the
same as before.

Now that we have these two definitions, we can define the primary confidence
function, <span>\\(C\\)</span>, as follows:

<div>$$C(A, \Delta) = \max(C_{A\Delta}(A, \Delta), C_{\Delta}(\Delta))$$</div>

By feeding <span>\\(A\\)</span> and <span>\\(\Delta\\)</span> into
<span>\\(C\\)</span>, we get our final confidence value.
