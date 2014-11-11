---
layout: post
title: Replacing Objects in Python
tags: Python
description: More reflection than you cared to ask for
draft: true
---

Today, we're going to demonstrate a fairly evil thing in Python, which I call
_object replacement_.

Say you have some program that's been running for a while, and a particular
object has made its way throughout your code. It lives inside lists, class
attributes, maybe even inside some closures. You want to completely replace
this object with another one; that is to say, you want to find all references
to object `A` and replace them with object `B`, enabling `A` to be garbage
collected.

_But why on Earth would you want to do that?_ you ask. I'll focus on a concrete
use case in a future post, but for now, I imagine this could be useful in some
kind of advanted unit testing situation with mock objects. Still, it's fairly
insane, so let's leave it as primarily an intellectual exercise.

## Review

First, a recap on terminology here. You can skip this section if you know
Python well.

In Python, _names_ are what most languages call "variables". They reference
_objects_. So when we do:

{% highlight python %}

a = [1, 2, 3, 4]

{% endhighlight %}

We are creating a list object with four integers, and binding it to the name
`a`:

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="303px" height="53px" version="1.1"><defs/><g transform="translate(0.5,0.5)"><rect x="181" y="6" width="120" height="40" fill="#ffffff" stroke="#000000" pointer-events="none"/><g transform="translate(185,17)"><switch><foreignObject pointer-events="all" width="112" height="20" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"><div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 14px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.26; vertical-align: top; width: 112px; white-space: normal; text-align: center;"><div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;"><font face="Courier New">[1, 2, 3, 4]</font></div></div></foreignObject><text x="56" y="17" fill="#000000" text-anchor="middle" font-size="14px" font-family="Helvetica">[Not supported by viewer]</text></switch></g><ellipse cx="26" cy="26" rx="25" ry="25" fill="#ffffff" stroke="#000000" pointer-events="none"/><g transform="translate(13,11)"><switch><foreignObject pointer-events="all" width="26" height="32" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"><div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; font-size: 24px; font-family: 'Courier New'; color: rgb(0, 0, 0); line-height: 1.26; vertical-align: top; width: 26px; white-space: normal; text-align: center;"><div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;text-align:inherit;text-decoration:inherit;">a</div></div></foreignObject><text x="13" y="28" fill="#000000" text-anchor="middle" font-size="24px" font-family="Courier New">[Not supported by viewer]</text></switch></g><path d="M 51 26 L 175 26" fill="none" stroke="#000000" stroke-miterlimit="10" pointer-events="none"/><path d="M 180 26 L 173 30 L 175 26 L 173 23 Z" fill="#000000" stroke="#000000" stroke-miterlimit="10" pointer-events="none"/></g></svg>

In each of the following examples, we are creating new _references_ to the
list object, but we are never duplicating it. Each reference points to the same
memory address (which you can get using `id(a)`, but that's a CPython
implementation detail).

{% highlight python %}

b = a

{% endhighlight %}

{% highlight python %}

c = SomeContainerClass()
c.data = a

{% endhighlight %}

{% highlight python %}

def wrapper(L):
    def inner():
        return L.pop()
    return inner

d = wrapper(a)

{% endhighlight %}

[insert charts here]

Note that these references are all equal. `a` is no more valid a name for the
list than `b`, `c.data`, or `L` (from the perspective of `d`, which is exposed
to everyone else as `d.func_closure[0].cell_contents`, but that's cumbersome
and you would never do that in practice). As a result, if you delete one of
these references—explicitly with `del a`, or implicitly if a name goes out of
scope—then the other references are still around, and object continues to
exist. If all of an object's references disappear, then Python's garbage
collector should eliminate it.

## Fishing for references with Guppy

Guppy!

## Handling different references

### Dictionaries

dicts, class attributes via `__dict__`, locals()

### Lists

simple replacement

### Tuples

recursively replace parent since immutable

### Bound methods

note that built-in methods and regular methods have different underlying C
structs, but have the same offsets for their self field

### Closure cells

function closures

### Frames

...
