---
layout: post
title: Obfuscating "Hello world!"
tags: Python
description: Fun with functional programming in Python
---

A few months ago, I got first place in
[this Code Golf contest](//codegolf.stackexchange.com/q/22533) to create the
weirdest obfuscated program that prints the string "Hello world!". I decided to
write up an explanation of how the hell it works. So, here's the entry, in
Python 2.7:

{% highlight python linenos=table %}

(lambda _, __, ___, ____, _____, ______, _______, ________:
    getattr(
        __import__(True.__class__.__name__[_] + [].__class__.__name__[__]),
        ().__class__.__eq__.__class__.__name__[:__] +
        ().__iter__().__class__.__name__[_____:________]
    )(
        _, (lambda _, __, ___: _(_, __, ___))(
            lambda _, __, ___:
                chr(___ % __) + _(_, __, ___ // __) if ___ else
                (lambda: _).func_code.co_lnotab,
            _ << ________,
            (((_____ << ____) + _) << ((___ << _____) - ___)) + (((((___ << __)
            - _) << ___) + _) << ((_____ << ____) + (_ << _))) + (((_______ <<
            __) - _) << (((((_ << ___) + _)) << ___) + (_ << _))) + (((_______
            << ___) + _) << ((_ << ______) + _)) + (((_______ << ____) - _) <<
            ((_______ << ___))) + (((_ << ____) - _) << ((((___ << __) + _) <<
            __) - _)) - (_______ << ((((___ << __) - _) << __) + _)) + (_______
            << (((((_ << ___) + _)) << __))) - ((((((_ << ___) + _)) << __) +
            _) << ((((___ << __) + _) << _))) + (((_______ << __) - _) <<
            (((((_ << ___) + _)) << _))) + (((___ << ___) + _) << ((_____ <<
            _))) + (_____ << ______) + (_ << ___)
        )
    )
)(
    *(lambda _, __, ___: _(_, __, ___))(
        (lambda _, __, ___:
            [__(___[(lambda: _).func_code.co_nlocals])] +
            _(_, __, ___[(lambda _: _).func_code.co_nlocals:]) if ___ else []
        ),
        lambda _: _.func_code.co_argcount,
        (
            lambda _: _,
            lambda _, __: _,
            lambda _, __, ___: _,
            lambda _, __, ___, ____: _,
            lambda _, __, ___, ____, _____: _,
            lambda _, __, ___, ____, _____, ______: _,
            lambda _, __, ___, ____, _____, ______, _______: _,
            lambda _, __, ___, ____, _____, ______, _______, ________: _
        )
    )
)

{% endhighlight %}

String literals weren't allowed, but I set some other restrictions for fun: it
had to be a single expression (so no `print` statement) with minimal builtin
usage and no integer literals.

## Getting started

Since we can't use `print`, we can write to the `stdout` file object:

{% highlight python %}

import sys
sys.stdout.write("Hello world!\n")

{% endhighlight %}

But let's use something lower-level:
[`os.write()`](//docs.python.org/2/library/os.html#os.write). We need
`stdout`'s [file descriptor](//en.wikipedia.org/wiki/File_descriptor), which is
`1` (you can check with `print sys.stdout.fileno()`).

{% highlight python %}

import os
os.write(1, "Hello world!\n")

{% endhighlight %}

We want a single expression, so we'll use
[`__import__()`](//docs.python.org/2/library/functions.html#__import__):

{% highlight python %}

__import__("os").write(1, "Hello world!\n")

{% endhighlight %}

We also want to be able to obfuscate the `write()`, so we'll throw in a
`getattr()`:

{% highlight python %}

getattr(__import__("os"), "write")(1, "Hello world!\n")

{% endhighlight %}

This is the starting point. Everything from now on will be obfuscating the
three strings and the int.

## Stringing together strings

`"os"` and `"write"` are fairly simple, so we'll create them by joining parts
of the names of various built-in classes. There are many different ways to do
this, but I chose the following:

- `"o"` from the second letter of `bool`: `True.__class__.__name__[1]`
- `"s"` from the third letter of `list`: `[].__class__.__name__[2]`
- `"wr"` from the first two letters of `wrapper_descriptor`, an implementation
  detail in CPython found as the type of some builtin classes' methods (more on
  that
  [here](http://utcc.utoronto.ca/~cks/space/blog/python/SlotWrapperObjects)):
  `().__class__.__eq__.__class__.__name__[:2]`
- `"ite"` from the sixth through eighth letters of `tupleiterator`, the type of
  object returned by calling `iter()` on a tuple:
  `().__iter__().__class__.__name__[5:8]`

We're starting to make some progress!

{% highlight python linenos=table %}

getattr(
    __import__(True.__class__.__name__[1] + [].__class__.__name__[2]),
    ().__class__.__eq__.__class__.__name__[:2] +
    ().__iter__().__class__.__name__[5:8]
)(1, "Hello world!\n")

{% endhighlight %}

`"Hello world!\n"` is more complicated. We're going to encode it as a big
integer, which will be formed of the ASCII code of each character multiplied by
256 to the power of the character's index in the string. In other words, the
following sum:

<div>$$\sum_{n=0}^{L-1} c_n(256^n)$$</div>

where <span>\\(L\\)</span> is the length of the string and
<span>\\(c_n\\)</span> is the ASCII code of the
<span>\\(n\\)</span><sup>th</sup> character in the string. To create the
number:

{% highlight pycon %}

>>> codes = [ord(c) for c in "Hello world!\n"]
>>> num = sum(codes[i] * 256 ** i for i in xrange(len(codes)))
>>> print num
802616035175250124568770929992

{% endhighlight %}

Now we need the code to convert this number back into a string. We use a simple
recursive algorithm:

{% highlight pycon %}

>>> def convert(num):
...     if num:
...         return chr(num % 256) + convert(num // 256)
...     else:
...         return ""
...
>>> convert(802616035175250124568770929992)
'Hello world!\n'

{% endhighlight %}

Rewriting in one line with `lambda`:

{% highlight python %}

convert = lambda num: chr(num % 256) + convert(num // 256) if num else ""

{% endhighlight %}

Now we use
[anonymous recursion](//en.wikipedia.org/wiki/Anonymous_recursion) to turn this
into a single expression. This requires a
[combinator](//en.wikipedia.org/wiki/Combinatory_logic). Start with this:

{% highlight pycon %}

>>> comb = lambda f, n: f(f, n)
>>> convert = lambda f, n: chr(n % 256) + f(f, n // 256) if n else ""
>>> comb(convert, 802616035175250124568770929992)
'Hello world!\n'

{% endhighlight %}

Now we just substitute the two definitions into the expression, and we have our
function:

{% highlight pycon %}

>>> (lambda f, n: f(f, n))(
...     lambda f, n: chr(n % 256) + f(f, n // 256) if n else "",
...     802616035175250124568770929992)
'Hello world!\n'

{% endhighlight %}

Now we can stick this into our code from before, replacing some variable names
along the way (`f` &rarr; `_`, `n` &rarr; `__`):

{% highlight python linenos=table %}

getattr(
    __import__(True.__class__.__name__[1] + [].__class__.__name__[2]),
    ().__class__.__eq__.__class__.__name__[:2] +
    ().__iter__().__class__.__name__[5:8]
)(
    1, (lambda _, __: _(_, __))(
        lambda _, __: chr(__ % 256) + _(_, __ // 256) if __ else "",
        802616035175250124568770929992
    )
)

{% endhighlight %}

## Function internals

We're left with a `""` in the body of our convert function (remember: no string
literals!), and a large number that we'll have to hide somehow. Let's start
with the empty string. We can make one on the fly by examining the internals of
some random function:

{% highlight pycon %}

>>> (lambda: 0).func_code.co_lnotab
''

{% endhighlight %}

What we're _really_ doing here is looking at the
[line number table](http://svn.python.org/projects/python/branches/pep-0384/Objects/lnotab_notes.txt)
of the `code` object contained within the function. Since it's anonymous, there
are no line numbers, so the string is empty. Replace the `0` with `_` to make
it more confusing (it doesn't matter, since the function's not being called),
and stick it in. We'll also refactor out the `256` into an argument that gets
passed to our obfuscated `convert()` along with the number. This requires
adding an argument to the combinator:

{% highlight python linenos=table %}

getattr(
    __import__(True.__class__.__name__[1] + [].__class__.__name__[2]),
    ().__class__.__eq__.__class__.__name__[:2] +
    ().__iter__().__class__.__name__[5:8]
)(
    1, (lambda _, __, ___: _(_, __, ___))(
        lambda _, __, ___:
            chr(___ % __) + _(_, __, ___ // __) if ___ else
            (lambda: _).func_code.co_lnotab,
        256,
        802616035175250124568770929992
    )
)

{% endhighlight %}

## A detour

Let's tackle a different problem for a bit. We want a way to obfuscate the
numbers in our code, but it'll be cumbersome (and not particularly interesting)
to recreate them each time they're used. If we can implement, say,
`range(1, 9) == [1, 2, 3, 4, 5, 6, 7, 8]`, then we can wrap our current work in
a function that takes variables containing the numbers from 1 to 8, and replace
occurrences of integer literals in the body with these variables:

{% highlight python linenos=table %}

(lambda n1, n2, n3, n4, n5, n6, n7, n8:
    getattr(
        __import__(True.__class__.__name__[n1] + [].__class__.__name__[n2]),
        ...
    )(
        ...
    )
)(*range(1, 9))

{% endhighlight %}

Even though we need to form `256` and `802616035175250124568770929992` as well,
these can be created using arithmetic operations on these eight "fundamental"
numbers. The choice of 1–8 is arbitrary, but seems to be a good middle ground.

We can get the number of arguments a function takes via its `code` object:

{% highlight pycon %}

>>> (lambda a, b, c: 0).func_code.co_argcount
3

{% endhighlight %}

Build a tuple of functions with argcounts between 1 and 8:

{% highlight python linenos=table %}

funcs = (
    lambda _: _,
    lambda _, __: _,
    lambda _, __, ___: _,
    lambda _, __, ___, ____: _,
    lambda _, __, ___, ____, _____: _,
    lambda _, __, ___, ____, _____, ______: _,
    lambda _, __, ___, ____, _____, ______, _______: _,
    lambda _, __, ___, ____, _____, ______, _______, ________: _
)

{% endhighlight %}

Using a recursive algorithm, we can turn this into the output of `range(1, 9)`:

{% highlight pycon %}

>>> def convert(L):
...     if L:
...         return [L[0].func_code.co_argcount] + convert(L[1:])
...     else:
...         return []
...
>>> convert(funcs)
[1, 2, 3, 4, 5, 6, 7, 8]

{% endhighlight %}

As before, we convert this into `lambda` form:

{% highlight python %}

convert = lambda L: [L[0].func_code.co_argcount] + convert(L[1:]) if L else []

{% endhighlight %}

Then, into anonymous-recursive form:

{% highlight pycon %}

>>> (lambda f, L: f(f, L))(
...     lambda f, L: [L[0].func_code.co_argcount] + f(f, L[1:]) if L else [],
...     funcs)
[1, 2, 3, 4, 5, 6, 7, 8]

{% endhighlight %}

For fun, we'll factor out argcount operation into an additional function
argument, and obfuscate some variable names:

{% highlight python linenos=table %}

(lambda _, __, ___: _(_, __, ___))(
    (lambda _, __, ___:
        [__(___[0])] + _(_, __, ___[1:]) if ___ else []
    ),
    lambda _: _.func_code.co_argcount,
    funcs
)

{% endhighlight %}

There's a new problem now: we still need a way to hide `0` and `1`. We can get
these by examining the number of local variables within arbitrary functions:

{% highlight pycon %}

>>> (lambda: _).func_code.co_nlocals
0
>>> (lambda _: _).func_code.co_nlocals
1

{% endhighlight %}

Even though the function bodies look the same, `_` in the first function is not
an argument, nor is it defined in the function, so Python interprets it as a
global variable:

{% highlight pycon %}

>>> import dis
>>> dis.dis(lambda: _)
  1           0 LOAD_GLOBAL              0 (_)
              3 RETURN_VALUE
>>> dis.dis(lambda _: _)
  1           0 LOAD_FAST                0 (_)
              3 RETURN_VALUE

{% endhighlight %}

This happens regardless of whether `_` is actually defined in the global scope.

Putting this into practice:

{% highlight python linenos=table %}

(lambda _, __, ___: _(_, __, ___))(
    (lambda _, __, ___:
        [__(___[(lambda: _).func_code.co_nlocals])] +
        _(_, __, ___[(lambda _: _).func_code.co_nlocals:]) if ___ else []
    ),
    lambda _: _.func_code.co_argcount,
    funcs
)

{% endhighlight %}

Now we can substitute the value of `funcs` in, and then using `*` to pass the
resulting list of integers as eight separate variables, we get this:

{% highlight python linenos=table %}

(lambda n1, n2, n3, n4, n5, n6, n7, n8:
    getattr(
        __import__(True.__class__.__name__[n1] + [].__class__.__name__[n2]),
        ().__class__.__eq__.__class__.__name__[:n2] +
        ().__iter__().__class__.__name__[n5:n8]
    )(
        n1, (lambda _, __, ___: _(_, __, ___))(
            lambda _, __, ___:
                chr(___ % __) + _(_, __, ___ // __) if ___ else
                (lambda: _).func_code.co_lnotab,
            256,
            802616035175250124568770929992
        )
    )
)(
    *(lambda _, __, ___: _(_, __, ___))(
        (lambda _, __, ___:
            [__(___[(lambda: _).func_code.co_nlocals])] +
            _(_, __, ___[(lambda _: _).func_code.co_nlocals:]) if ___ else []
        ),
        lambda _: _.func_code.co_argcount,
        (
            lambda _: _,
            lambda _, __: _,
            lambda _, __, ___: _,
            lambda _, __, ___, ____: _,
            lambda _, __, ___, ____, _____: _,
            lambda _, __, ___, ____, _____, ______: _,
            lambda _, __, ___, ____, _____, ______, _______: _,
            lambda _, __, ___, ____, _____, ______, _______, ________: _
        )
    )
)

{% endhighlight %}

## Shifting bits

Almost there! We'll replace the `n{1..8}` variables with `_`, `__`, `___`,
`____`, etc., since it creates confusion with the variables used in our inner
functions. This doesn't cause actual problems, since scoping rules mean the
right ones will be used. This is also one of the reasons why we refactored
`256` out to where `_` refers to `1` instead of our obfuscated `convert()`
function. It's getting long, so I'll paste only the first half:

{% highlight python linenos=table %}

(lambda _, __, ___, ____, _____, ______, _______, ________:
    getattr(
        __import__(True.__class__.__name__[_] + [].__class__.__name__[__]),
        ().__class__.__eq__.__class__.__name__[:__] +
        ().__iter__().__class__.__name__[_____:________]
    )(
        _, (lambda _, __, ___: _(_, __, ___))(
            lambda _, __, ___:
                chr(___ % __) + _(_, __, ___ // __) if ___ else
                (lambda: _).func_code.co_lnotab,
            256,
            802616035175250124568770929992
        )
    )
)

{% endhighlight %}

Only two more things are left. We'll start with the easy one: `256`.
<span>\\(256 = 2^8\\)</span>, so we can rewrite it as `1 << 8` (using a
[left bit shift](//stackoverflow.com/a/141873)), or `_ << ________` with our
obfuscated variables.

We'll use the same idea with `802616035175250124568770929992`. A simple
divide-and-conquer algorithm can break it up into sums of numbers which are
themselves sums of numbers that are shifted together, and so on. For example,
if we had `112`, we could break it up into `96 + 16` and then
`(3 << 5) + (2 << 3)`. I like using bit shifts because the `<<` reminds me of
`std::cout << "foo"` in C++, or
[`print` chevron](//docs.python.org/2/reference/simple_stmts.html#the-print-statement)
(`print >>`) in Python, both of which are red herrings involving other ways of
doing I/O.

The number can be decomposed in a variety of ways; no one method is correct
(after all, we could just break it up into `(1 << 0) + (1 << 0) + ...`, but
that's not interesting). We should have some substantial amount of nesting, but
still use most of our numerical variables. Obviously, doing this by hand isn't
fun, so we'll come up with an algorithm. In pseudocode:

{% highlight text linenos=table %}

func encode(num):
    if num <= 8:
        return "_" * num
    else:
        return "(" + convert(num) + ")"

func convert(num):
    base = shift = 0
    diff = num
    span = ...
    for test_base in range(span):
        for test_shift in range(span):
            test_diff = |num| - (test_base << test_shift)
            if |test_diff| < |diff|:
                diff = test_diff
                base = test_base
                shift = test_shift
    encoded = "(" + encode(base) + " << " + encode(shift) + ")"
    if diff == 0:
        return encoded
    else:
        return encoded + " + " + convert(diff)

convert(802616035175250124568770929992)

{% endhighlight %}

The basic idea here is that we test various combinations of numbers in a
certain range until we come up with two numbers, `base` and `shift`,
such that `base << shift` is as closest to `num` as possible (i.e. we minimize
their absolute difference, `diff`). We then use our divide-and-conquer
algorithm to break up `best_base` and `best_shift`, and then repeat the
procedure on `diff` until it reaches zero, summing the terms along the way.

The argument to `range()`, `span`, represents the width of the search space.
This can't be too large, or we'll end getting `num` as our `base` and `0` as
our `shift` (because `diff` is zero), and since `base` can't be represented as
a single variable, it'll repeat, recursing infinitely. If it's too small, we'll
end up with something like the `(1 << 0) + (1 << 0) + ...` mentioned above. In
practice, we want `span` to get smaller as the recursion depth increases.
Through trial and error, I found this equation to work well:

<div>$$\mathit{span} = \lceil\log_{1.5} \lvert{\mathit{num}}\lvert\rceil + \lfloor2^{4-\mathit{depth}}\rfloor$$</div>

Translating the pseudocode into Python and making some tweaks (support for the
`depth` argument, and some caveats involving negative numbers), we get this:

{% highlight python linenos=table %}

from math import ceil, log

def encode(num, depth):
    if num == 0:
        return "_ - _"
    if num <= 8:
        return "_" * num
    return "(" + convert(num, depth + 1) + ")"

def convert(num, depth=0):
    result = ""
    while num:
        base = shift = 0
        diff = num
        span = int(ceil(log(abs(num), 1.5))) + (16 >> depth)
        for test_base in xrange(span):
            for test_shift in xrange(span):
                test_diff = abs(num) - (test_base << test_shift)
                if abs(test_diff) < abs(diff):
                    diff = test_diff
                    base = test_base
                    shift = test_shift
        if result:
            result += " + " if num > 0 else " - "
        elif num < 0:
            base = -base
        if shift == 0:
            result += encode(base, depth)
        else:
            result += "(%s << %s)" % (encode(base, depth),
                                      encode(shift, depth))
        num = diff if num > 0 else -diff
    return result

{% endhighlight %}

Now, when we call `convert(802616035175250124568770929992)`, we get a nice
decomposition:

{% highlight pycon %}

>>> convert(802616035175250124568770929992)
(((_____ << ____) + _) << ((___ << _____) - ___)) + (((((___ << __) - _) << ___) + _) << ((_____ << ____) + (_ << _))) + (((_______ << __) - _) << (((((_ << ___) + _)) << ___) + (_ << _))) + (((_______ << ___) + _) << ((_ << ______) + _)) + (((_______ << ____) - _) << ((_______ << ___))) + (((_ << ____) - _) << ((((___ << __) + _) << __) - _)) - (_______ << ((((___ << __) - _) << __) + _)) + (_______ << (((((_ << ___) + _)) << __))) - ((((((_ << ___) + _)) << __) + _) << ((((___ << __) + _) << _))) + (((_______ << __) - _) << (((((_ << ___) + _)) << _))) + (((___ << ___) + _) << ((_____ << _))) + (_____ << ______) + (_ << ___)

{% endhighlight %}

Stick this in as a replacement for `802616035175250124568770929992`, and put
all the parts together:

{% highlight python linenos=table %}

(lambda _, __, ___, ____, _____, ______, _______, ________:
    getattr(
        __import__(True.__class__.__name__[_] + [].__class__.__name__[__]),
        ().__class__.__eq__.__class__.__name__[:__] +
        ().__iter__().__class__.__name__[_____:________]
    )(
        _, (lambda _, __, ___: _(_, __, ___))(
            lambda _, __, ___:
                chr(___ % __) + _(_, __, ___ // __) if ___ else
                (lambda: _).func_code.co_lnotab,
            _ << ________,
            (((_____ << ____) + _) << ((___ << _____) - ___)) + (((((___ << __)
            - _) << ___) + _) << ((_____ << ____) + (_ << _))) + (((_______ <<
            __) - _) << (((((_ << ___) + _)) << ___) + (_ << _))) + (((_______
            << ___) + _) << ((_ << ______) + _)) + (((_______ << ____) - _) <<
            ((_______ << ___))) + (((_ << ____) - _) << ((((___ << __) + _) <<
            __) - _)) - (_______ << ((((___ << __) - _) << __) + _)) + (_______
            << (((((_ << ___) + _)) << __))) - ((((((_ << ___) + _)) << __) +
            _) << ((((___ << __) + _) << _))) + (((_______ << __) - _) <<
            (((((_ << ___) + _)) << _))) + (((___ << ___) + _) << ((_____ <<
            _))) + (_____ << ______) + (_ << ___)
        )
    )
)(
    *(lambda _, __, ___: _(_, __, ___))(
        (lambda _, __, ___:
            [__(___[(lambda: _).func_code.co_nlocals])] +
            _(_, __, ___[(lambda _: _).func_code.co_nlocals:]) if ___ else []
        ),
        lambda _: _.func_code.co_argcount,
        (
            lambda _: _,
            lambda _, __: _,
            lambda _, __, ___: _,
            lambda _, __, ___, ____: _,
            lambda _, __, ___, ____, _____: _,
            lambda _, __, ___, ____, _____, ______: _,
            lambda _, __, ___, ____, _____, ______, _______: _,
            lambda _, __, ___, ____, _____, ______, _______, ________: _
        )
    )
)

{% endhighlight %}

And there you have it.
