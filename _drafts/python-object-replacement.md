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
collected. This has some interesting implications for special object types. If
you have methods that are bound to `A`, you want to rebind them to `B`. If `A`
is a class, you want all instances of `A` to become instances of `B`. And so
on.

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

<svg width="223pt" height="44pt" viewBox="0.00 0.00 223.01 44.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(4 40)"><title>%3</title><polygon fill="white" stroke="none" points="-4,4 -4,-40 219.012,-40 219.012,4 -4,4"/><g id="node1" class="node"><title>L</title><polygon fill="none" stroke="black" stroke-width="0.5" points="215.018,-36 126.994,-36 126.994,-0 215.018,-0 215.018,-36"/><text text-anchor="middle" x="171.006" y="-15" font-family="Courier,monospace" font-size="10.00">[1, 2, 3, 4]</text></g><g id="node2" class="node"><title>a</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="27" cy="-18" rx="27" ry="18"/><text text-anchor="middle" x="27" y="-13.8" font-family="Courier,monospace" font-size="14.00">a</text></g><g id="edge1" class="edge"><title>a&#45;&gt;L</title><path fill="none" stroke="black" stroke-width="0.5" d="M54.0461,-18C72.2389,-18 97.1211,-18 119.173,-18"/><polygon fill="black" stroke="black" stroke-width="0.5" points="119.339,-20.6251 126.839,-18 119.339,-15.3751 119.339,-20.6251"/></g></g></svg>

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

So, this boils down to finding all of the references to a particular object,
and then updating them to point to a different object.

But how do we track references? Fortunately for us, there is a library called
[Guppy](http://guppy-pe.sourceforge.net/) that allows us to do this.

## Handling different reference types

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

### Slots

...

### Classes

...

### Other cases

Certainly, not every case is handled above, but it seems to cover the vast
majority of instances that I've found through testing. There are a number of
reference relations in Guppy that I couldn't figure out how to replicate
without doing something insane (`R_HASATTR`, `R_CELL`, and `R_STACK`), so some
obscure replacements are likely unimplemented.

Some other kinds of replacements are known, but impossible. For example,
replacing a class object that uses `__slots__` with another class will not work
if the replacement class has a different slot layout and instances of the old
class exist. More generally, replacing a class with a non-class object won't
work if instances of the class exist. Furthermore, references stored in data
structures managed by C extensions cannot be changed, since there's no good way
for us to track these.

Remaining areas to explore include behavior when metaclasses and more complex
descriptors are involved. Implementing a more complete version of `replace()`
is left as an exercise for the reader.
