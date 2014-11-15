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

This article is written for [CPython](https://en.wikipedia.org/wiki/CPython)
2.7.<sup><a id="ref1" href="#fn1">[1]</a></sup>

## Review

First, a recap on terminology here. You can skip this section if you know
Python well.

In Python, _names_ are what most languages call "variables". They reference
_objects_. So when we do:

{% highlight python %}

a = [1, 2, 3, 4]

{% endhighlight %}

...we are creating a list object with four integers, and binding it to the name
`a`. In graph form:<sup><a id="ref2" href="#fn2">[2]</a></sup>

<svg width="223pt" height="44pt" viewBox="0.00 0.00 223.01 44.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(4 40)"><title>%3</title><polygon fill="white" stroke="none" points="-4,4 -4,-40 219.012,-40 219.012,4 -4,4"/><g id="node1" class="node"><title>L</title><polygon fill="none" stroke="black" stroke-width="0.5" points="215.018,-36 126.994,-36 126.994,-0 215.018,-0 215.018,-36"/><text text-anchor="middle" x="171.006" y="-15" font-family="Courier,monospace" font-size="10.00">[1, 2, 3, 4]</text></g><g id="node2" class="node"><title>a</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="27" cy="-18" rx="27" ry="18"/><text text-anchor="middle" x="27" y="-13.8" font-family="Courier,monospace" font-size="14.00">a</text></g><g id="edge1" class="edge"><title>a&#45;&gt;L</title><path fill="none" stroke="black" stroke-width="0.5" d="M54.0461,-18C72.2389,-18 97.1211,-18 119.173,-18"/><polygon fill="black" stroke="black" stroke-width="0.5" points="119.339,-20.6251 126.839,-18 119.339,-15.3751 119.339,-20.6251"/></g></g></svg>

In each of the following examples, we are creating new _references_ to the
list object, but we are never duplicating it. Each reference points to the same
memory address (which you can get using `id(a)`).

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

<svg width="254pt" height="234pt" viewBox="0.00 0.00 253.96 234.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(4 238)"><title>%3</title><polygon fill="white" stroke="none" points="-4,4 -4,-238 249.96,-238 249.96,4 -4,4"/><g id="clust3" class="cluster"><title>cluster0</title><polygon fill="none" stroke="black" stroke-width="0.5" points="8,-8 8,-82 78,-82 78,-8 8,-8"/><text text-anchor="middle" x="43" y="-66.8" font-family="Courier,monospace" font-size="14.00">d</text></g><g id="node1" class="node"><title>obj</title><polygon fill="none" stroke="black" stroke-width="0.5" points="245.966,-153 157.943,-153 157.943,-117 245.966,-117 245.966,-153"/><text text-anchor="middle" x="201.954" y="-132" font-family="Courier,monospace" font-size="10.00">[1, 2, 3, 4]</text></g><g id="node2" class="node"><title>a</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="43" cy="-216" rx="27" ry="18"/><text text-anchor="middle" x="43" y="-211.8" font-family="Courier,monospace" font-size="14.00">a</text></g><g id="edge1" class="edge"><title>a&#45;&gt;obj</title><path fill="none" stroke="black" stroke-width="0.5" d="M64.8423,-205.244C88.7975,-192.881 128.721,-172.278 159.152,-156.573"/><polygon fill="black" stroke="black" stroke-width="0.5" points="160.422,-158.872 165.883,-153.1 158.014,-154.206 160.422,-158.872"/></g><g id="node3" class="node"><title>b</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="43" cy="-162" rx="27" ry="18"/><text text-anchor="middle" x="43" y="-157.8" font-family="Courier,monospace" font-size="14.00">b</text></g><g id="edge2" class="edge"><title>b&#45;&gt;obj</title><path fill="none" stroke="black" stroke-width="0.5" d="M69.2174,-157.662C90.9996,-153.915 123.147,-148.385 150.231,-143.726"/><polygon fill="black" stroke="black" stroke-width="0.5" points="150.777,-146.295 157.724,-142.437 149.887,-141.121 150.777,-146.295"/></g><g id="node4" class="node"><title>c</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="43" cy="-108" rx="41.897" ry="18"/><text text-anchor="middle" x="43" y="-103.8" font-family="Courier,monospace" font-size="14.00">c.data</text></g><g id="edge3" class="edge"><title>c&#45;&gt;obj</title><path fill="none" stroke="black" stroke-width="0.5" d="M82.3954,-114.605C102.772,-118.11 128.077,-122.463 150.069,-126.247"/><polygon fill="black" stroke="black" stroke-width="0.5" points="149.86,-128.874 157.697,-127.559 150.75,-123.7 149.86,-128.874"/></g><g id="node5" class="node"><title>L</title><ellipse fill="none" stroke="black" stroke-width="0.5" cx="43" cy="-34" rx="27" ry="18"/><text text-anchor="middle" x="43" y="-29.8" font-family="Courier,monospace" font-size="14.00">L</text></g><g id="edge4" class="edge"><title>L&#45;&gt;obj</title><path fill="none" stroke="black" stroke-width="0.5" d="M62.9324,-46.183C88.5083,-62.6411 134.554,-92.2712 166.386,-112.755"/><polygon fill="black" stroke="black" stroke-width="0.5" points="165.223,-115.128 172.951,-116.98 168.064,-110.714 165.223,-115.128"/></g></g></svg>

Note that these references are all equal. `a` is no more valid a name for the
list than `b`, `c.data`, or `L` (from the perspective of `d`, which is exposed
to everyone else as `d.func_closure[0].cell_contents`, but that's cumbersome
and you would never do that in practice). As a result, if you delete one of
these references—explicitly with `del a`, or implicitly if a name goes out of
scope—then the other references are still around, and object continues to
exist. If all of an object's references disappear, then Python's garbage
collector should eliminate it.

## Dead ends

My first thought when approaching this problem was to physically write over the
memory where our target object is stored. This can be done using
[`ctypes.memmove()`](https://docs.python.org/2/library/ctypes.html#ctypes.memmove)
from the Python standard library:

{% highlight pycon %}

>>> class A(object): pass
...
>>> class B(object): pass
...
>>> obj = A()
>>> print obj
<__main__.A object at 0x10e3e1190>
>>> import ctypes
>>> ctypes.memmove(id(A), id(B), object.__sizeof__(A))
140576340136752
>>> print obj
<__main__.B object at 0x10e3e1190>

{% endhighlight %}

What we are doing here is overwriting the fields of the `A` instance of the
[`PyClassObject` C struct](https://github.com/python/cpython/blob/2.7/Include/classobject.h#L12)
with fields from the `B` struct instance. As a result, they now share various
properties, such as their attribute dictionaries
([`__dict__`](https://docs.python.org/2/reference/datamodel.html#the-standard-type-hierarchy)).
So, we can do things like this:

{% highlight pycon %}

>>> B.foo = 123
>>> obj.foo
123

{% endhighlight %}

However, there are clear issues. What we've done is create a
[_shallow copy_](https://en.wikipedia.org/wiki/Object_copy#Shallow_copy).
Therefore, `A` and `B` are still distinct objects, so certain changes made to
one will not be replicated to the other:

{% highlight pycon %}

>>> A is B
False
>>> B.__name__ = "C"
>>> A.__name__
'B'

{% endhighlight %}

Also, this won't work if `A` and `B` are different sizes, since we will be
either reading from or writing to memory that we don't necessarily own:

{% highlight pycon %}

>>> A = ()
>>> B = []
>>> print A.__sizeof__(), B.__sizeof__()
24 40
>>> import ctypes
>>> ctypes.memmove(id(A), id(B), A.__sizeof__())
4321271888
Python(33575,0x7fff76925300) malloc: *** error for object 0x6f: pointer being freed was not allocated
*** set a breakpoint in malloc_error_break to debug
Abort trap: 6

{% endhighlight %}

Oh, and there's a bit of a problem when we deallocate these objects, too...

{% highlight pycon %}

>>> A = []
>>> B = range(8)
>>> import ctypes
>>> ctypes.memmove(id(A), id(B), A.__sizeof__())
4514685728
>>> print A
[0, 1, 2, 3, 4, 5, 6, 7]
>>> del A
>>> del B
Segmentation fault: 11

{% endhighlight %}

## Fishing for references with Guppy

A more correct solution is finding all of the _references_ to the old object,
and then updating them to point to the new object, rather than replacing the
old object directly.

But how do we track references? Fortunately, there is a library called
[Guppy](http://guppy-pe.sourceforge.net/) that allows us to do this. Often used
for diagnosing memory leaks, we can take advantage of its robust object
tracking features here. Install it with [pip](https://pypi.python.org/pypi/pip)
(`pip install guppy`).

I've always found Guppy hard to use (as many debuggers are, though justified by
the complexity of the task involved), so we'll begin with a feature demo before
delving into the actual problem.

### Feature demonstration

Guppy's interface is deceptively simple. We begin by calling
[`guppy.hpy()`](http://guppy-pe.sourceforge.net/guppy.html#kindnames.guppy.hpy),
to expose the Heapy interface, which is the component of Guppy that has the
features we want:

{% highlight pycon %}

>>> import guppy
>>> hp = guppy.hpy()
>>> hp
Top level interface to Heapy.
Use eg: hp.doc for more info on hp.

{% endhighlight %}

Calling
[`hp.heap()`](http://guppy-pe.sourceforge.net/heapy_Use.html#heapykinds.Use.heap)
shows us a table of the objects known to Guppy, grouped together
(mathematically speaking,
[_partitioned_](https://en.wikipedia.org/wiki/Partition_of_a_set)) by
type<sup><a id="ref3" href="#fn3">[3]</a></sup> and sorted by how much space
they take up in memory:

{% highlight pycon %}

>>> heap = hp.heap()
>>> heap
Partition of a set of 45761 objects. Total size = 4699200 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0  15547  34  1494736  32   1494736  32 str
     1   8356  18   770272  16   2265008  48 tuple
     2    346   1   452080  10   2717088  58 dict (no owner)
     3  13685  30   328440   7   3045528  65 int
     4     71   0   221096   5   3266624  70 dict of module
     5   1652   4   211456   4   3478080  74 types.CodeType
     6    199   0   210856   4   3688936  79 dict of type
     7   1614   4   193680   4   3882616  83 function
     8    199   0   177008   4   4059624  86 type
     9    124   0   135328   3   4194952  89 dict of class
<91 more rows. Type e.g. '_.more' to view.>

{% endhighlight %}

This object (called an
[`IdentitySet`](http://guppy-pe.sourceforge.net/heapy_UniSet.html#heapykinds.IdentitySet))
looks bizarre, but it can be treated roughly like a list. If we want to take a
look at strings, we can do `heap[0]`:

{% highlight pycon %}

>>> heap[0]
Partition of a set of 22606 objects. Total size = 2049896 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0  22606 100  2049896 100   2049896 100 str

{% endhighlight %}

This isn't very useful, though. What we really want to do is re-partition this
subset by another relationship. There are a number of options:

{% highlight pycon %}

>>> heap[0].byid  # Group by object ID; each subset therefore has one element
Set of 22606 <str> objects. Total size = 2049896 bytes.
 Index     Size   %   Cumulative  %   Representation (limited)
     0     7480   0.4      7480   0.4 'The class Bi... copy of S.\n'
     1     4872   0.2     12352   0.6 "Support for ... 'error'.\n\n"
     2     4760   0.2     17112   0.8 'Heap queues\...at Art! :-)\n'
     3     4760   0.2     21872   1.1 'Heap queues\...at Art! :-)\n'
     4     3896   0.2     25768   1.3 'This module ...ng function\n'
     5     3824   0.2     29592   1.4 'The type of ...call order.\n'
     6     3088   0.2     32680   1.6 't\x00\x00|\x...x00|\x02\x00S'
     7     2992   0.1     35672   1.7 'HeapView(roo... size, etc.\n'
     8     2808   0.1     38480   1.9 'Directory tr...ories\n\n    '
     9     2640   0.1     41120   2.0 'The class No... otherwise.\n'
<22596 more rows. Type e.g. '_.more' to view.>

{% endhighlight %}

{% highlight pycon %}

>>> heap[0].byrcs  # Group by what types of objects reference the strings
Partition of a set of 22606 objects. Total size = 2049896 bytes.
 Index  Count   %     Size   % Cumulative  % Referrers by Kind (class / dict of class)
     0   6146  27   610752  30    610752  30 types.CodeType
     1   5304  23   563984  28   1174736  57 tuple
     2   4104  18   237536  12   1412272  69 dict (no owner)
     3   1959   9   139880   7   1552152  76 list
     4    564   2   136080   7   1688232  82 function, tuple
     5    809   4    97896   5   1786128  87 dict of module
     6    346   2    71760   4   1857888  91 dict of type
     7    365   2    19408   1   1877296  92 dict of module, tuple
     8    192   1    16176   1   1893472  92 dict (no owner), list
     9    232   1    11784   1   1905256  93 dict of class, function, tuple, types.CodeType
<229 more rows. Type e.g. '_.more' to view.>

{% endhighlight %}

{% highlight pycon %}

>>> heap[0].byvia  # Group by how the strings are related to their referrers
Partition of a set of 22606 objects. Total size = 2049896 bytes.
 Index  Count   %     Size   % Cumulative  % Referred Via:
     0   2656  12   420456  21    420456  21 '[0]'
     1   2095   9   259008  13    679464  33 '.co_code'
     2   2095   9   249912  12    929376  45 '.co_filename'
     3    564   2   136080   7   1065456  52 '.func_doc', '[0]'
     4    243   1   103528   5   1168984  57 "['__doc__']"
     5   1930   9   100584   5   1269568  62 '.co_lnotab'
     6    502   2    31128   2   1300696  63 '[1]'
     7    306   1    16272   1   1316968  64 '[2]'
     8    242   1    12960   1   1329928  65 '[3]'
     9    184   1     9872   0   1339800  65 '[4]'
<7323 more rows. Type e.g. '_.more' to view.>

{% endhighlight %}

From this, we can see that the plurality of memory devoted to strings is taken
up by those referenced by code objects (`types.CodeType` represents
Python code—accessible from a non-C-defined function through
`func.func_code`—and contains things like the names of its local variables and
the actual sequence of opcodes that make it up).

For fun, let's pick a random string.

{% highlight pycon %}

>>> import random
>>> obj = heap[0].byid[random.randrange(0, heap[0].count)]
>>> obj
Set of 1 <str> object. Total size = 176 bytes.
 Index     Size   %   Cumulative  %   Representation (limited)
     0      176 100.0       176 100.0 'Define names...not listed.\n'

{% endhighlight %}

Interesting. Since this heap subset contains only one element, we can use
[`.theone`](http://guppy-pe.sourceforge.net/heapy_UniSet.html#heapykinds.IdentitySetSingleton.theone)
to get the actual object represented here:

{% highlight pycon %}

>>> obj.theone
'Define names for all type symbols known in the standard interpreter.\n\nTypes that are part of optional modules (e.g. array) are not listed.\n'

{% endhighlight %}

Looks like the docstring for the
[`types`](https://docs.python.org/2/library/types.html) module. We can confirm
by using
[`.referrers`](http://guppy-pe.sourceforge.net/heapy_UniSet.html#heapykinds.IdentitySet.referrers)
to get the set of objects that refer to objects in the given set:

{% highlight pycon %}

>>> obj.referrers
Partition of a set of 1 object. Total size = 3352 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0      1 100     3352 100      3352 100 dict of module

{% endhighlight %}

This is `types.__dict__` (since the docstring we got is actually stored as
`types.__dict__["__doc__"]`), so if we use `.referrers` again:

{% highlight pycon %}

>>> obj.referrers.referrers
Partition of a set of 1 object. Total size = 56 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0      1 100       56 100        56 100 module
>>> obj.referrers.referrers.theone
<module 'types' from '/usr/local/Cellar/python/2.7.8_2/Frameworks/Python.framework/Versions/2.7/lib/python2.7/types.pyc'>
>>> import types
>>> types.__doc__ is obj.theone
True

{% endhighlight %}

_But why did we find an object in the `types` module if we never imported it?_
Well, let's see. We can use
[`hp.iso()`](http://guppy-pe.sourceforge.net/heapy_Use.html#heapykinds.Use.iso)
to get the Heapy set consisting of a single given object:

{% highlight pycon %}

>>> hp.iso(types)
Partition of a set of 1 object. Total size = 56 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0      1 100       56 100        56 100 module

{% endhighlight %}

Using a similar procedure as before, we see that `types` is imported by the
[`traceback`](https://docs.python.org/2/library/traceback.html) module:

{% highlight pycon %}

>>> hp.iso(types).referrers
Partition of a set of 10 objects. Total size = 25632 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0      2  20    13616  53     13616  53 dict (no owner)
     1      5  50     9848  38     23464  92 dict of module
     2      1  10     1048   4     24512  96 dict of guppy.etc.Glue.Interface
     3      1  10     1048   4     25560 100 dict of guppy.etc.Glue.Share
     4      1  10       72   0     25632 100 tuple
>>> hp.iso(types).referrers[1].byid
Set of 5 <dict of module> objects. Total size = 9848 bytes.
 Index     Size   %   Cumulative  %   Owner Name
     0     3352  34.0      3352  34.0 traceback
     1     3352  34.0      6704  68.1 warnings
     2     1048  10.6      7752  78.7 __main__
     3     1048  10.6      8800  89.4 abc
     4     1048  10.6      9848 100.0 guppy.etc.Glue

{% endhighlight %}

...and that is imported by
[`site`](https://docs.python.org/2/library/site.html):

{% highlight pycon %}

>>> import traceback
>>> hp.iso(traceback).referrers
Partition of a set of 3 objects. Total size = 15992 bytes.
 Index  Count   %     Size   % Cumulative  % Kind (class / dict of class)
     0      1  33    12568  79     12568  79 dict (no owner)
     1      1  33     3352  21     15920 100 dict of module
     2      1  33       72   0     15992 100 tuple
>>> hp.iso(traceback).referrers[1].byid
Set of 1 <dict of module> object. Total size = 3352 bytes.
 Index     Size   %   Cumulative  %   Owner Name
     0     3352 100.0      3352 100.0 site

{% endhighlight %}

Since `site` is imported by Python on startup, we've figured out why objects
from `types` exist, even though we've never used them.

We've learned something important, too. When objects are stored as ordinary
attributes of a parent object (like `types.__doc__`, `traceback.types`, and
`site.traceback` from above), they are not referenced directly by the parent
object, but by that object's `__dict__` attribute. Therefore, if we want to
replace `A` with `B` and `A` is an attribute of `C`, we (probably) don't need
to know anything special about `C`—just how to modify dictionaries.

A good Guppy/Heapy tutorial, while a bit old and incomplete, can be found on
[Andrey Smirnov's website](http://smira.ru/wp-content/uploads/2011/08/heapy.html).

## Handling different reference types

[...]

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

## Footnotes

1. <a id="fn1" href="#ref1">^</a> This post relies _heavily_ on implementation
   details of CPython 2.7. While it could be adapted for Python 3 by examining
   changes to the internal structures of objects that we used above, that would
   be a lost cause if you wanted to replicate this on
   [Jython](http://www.jython.org/) or some other implementation. We are so
   dependent on concepts specific to CPython that you would need to start from
   scratch, beginning with a language-specific replacement for Guppy.

2. <a id="fn2" href="#ref2">^</a> The
   [DOT files](https://en.wikipedia.org/wiki/DOT_(graph_description_language))
   used to generate graphs in this post are
   [available on Gist](https://gist.github.com/earwig/edc13f04f871c110eea6).

3. <a id="fn3" href="#ref3">^</a> They're actually grouped together by _clodo_
   ("class or dict object"), which is similar to type, but groups `__dict__`s
   separately by their owner's type.
