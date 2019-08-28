# asSys - *A* *S*imple, *A*gent-*S*kills System
**General purpose [Entity-Component System](https://en.wikipedia.org/wiki/Entity–component–system) implemented in JavaScript.**

## Overview

Traditional [Object Oriented Programming](https://en.wikipedia.org/wiki/Object-oriented_programming) has the _inherent_ problem of enforcing tree-like distribution of functionality among active entities, which are the _instances of different classes_. A _class_ is a wrapper of certain functionality, which is then accessible via an _"agent”_ in the memory, when an instance of this class, or any descendent, is created. This is quite limiting. 

Let's investigate, an artificial, but illustrative example. If you need to have three types of instances:

* `Humans` which are capable of **walking**;
* `Planes` which are capable of **flying**;
* `Birds` which are capable of both **flying** and **walking**;

You can inherit **walking** in _Birds_ from _Humans_, but then you'll need to have separate implementation of **flying** for _Planes_. Alternatively, you can inherit **flying** in _Birds_ from _Planes_, but then **walking** should be re-implemented in _Humans_. In either scenario one _skill_ (a.k.a set of methods) should be implemented twice. 

Multiple inheritance, found nowhere but in C++ is quite complicated solution, neither being recommended, nor actually solving many of the problems — sharing some state information between different classes, within the same entity.

Additionally, some languages, like JavaScript, are _not_ designed in a traditional inheritance centric OOP manner. Rather, upon instantiation of an object, it is assigned a _prototype_, which defines the core (basic, fallback) functionality of this entity.

> So, if one has implementations of different_skills_, he/she can assemble them into a single _prototype_ and all objects (which we call _agents_) instantiated from this prototype, will have _all_ the _skills_. This is exactly what _asSys_ library is doing.

## A story of examples

The shorthand for _asSys_ is chosen to be `a$`, so this is going to be used from now on. Let’s have our *Flying* and _Walking_ skills defined like this:

```javascript
var Flying = function () { this.isFlying = false; }

Flying.prototype = {
    takeOff: function () { this.isFlying = true; },
    land: function() { this.isFlying = false; }
};

var Walking = function () { this.isWalking = false; }

Walking.prototype = {
    go: function () { this.isWalking = true; },
    stop: function() { this.isWalking = false; }
};

```

It’s not the most meaningful implementation, but enough for the example. So, what will it take to have _Humans_ type objects (entities, agents) defined using _a$_? Only this:

```javascript
var Humans = a$(Walking);
```

Pay attention, that `Humans` is not an _instance_ in the normal OOP sense. To allocate one we must do:

```javascript
var aGuy = new Humans();
```

Of course, we haven't added too much functionality — because we could freely use standard JavaScript allocation, like this:

```javascript
var aGuy = new Walking();
```

It's the same. But, let's see how _Birds_ are defined:

```javascript
var Birds = a$(Walking, Flying);
```

Now, that is different! Again, new actual birds are instantiated this way:

```javascript
var aFalcon = new Birds();
```

And, of course, creating and instantiating _Planes_ is no more difficult:

```javascript
var Planes = a$(Flying);
var aJumbo = new Planes();
```

In this example `Planes`, `Birds` and `Humans` are dynamically constructed _functions_, which (upon instantiation) invoke all the passed _skills_'s constructors (i.e. functions) in the same order, in which they are given. This function construction happens only once - during `a$(<whatever skill>)` invocation, not during each instantiation. 

However, in its role as a constructor, this function _does_ invoke all supplied skill-defining function on each invocation.For example `Birds` is a function, that invokes `Walking()` then `Flying()` each time a new bird entity is allocated, but `Birds` function itself, is constructed once.

The functionality presented so far, can easily be achieved with C++ multiple-inheritance as well. But, stay tuned...

Let's define the basic skills a bit differently:

```javascript
var Flying = function () { this.isFlying = false; }

Flying.prototype = {
    takeOff: function () { this.isFlying = this.isMoving = true; },
    land: function() { this.isFlying = false; }
};

var Walking = function () { this.isWalking = false; }

Walking.prototype = {
    go: function () { this.isWalking = this.isMoving = true; },
    stop: function() { this.isWalking = false; }
};

```

We've added `isMoving` property. Now we can check for it in all agents:

```javascript
aGuy.go();
if (aGuy.isMoving) { alert("aGuy is moving!")}
aFalcon.takeOff();
if (aFalcon.isMoving) { alert("aFalcon is moving!")}
```

This is quite convenient! Actually sharing of properties and methods is vital for effective combination of skills, and quite natural when one combines different sets of features. 

If certain cooperation (between skills) is about to happen, there are some expectations arising. Let's say we want to wrap the `isMoving` setup into a separate method like this:

```javascript
var Flying = function () { this.isFlying = false; }

Flying.prototype = {
    takeOff: function () { this.wakeUp(); this.isFlying = true; },
    land: function() { this.isFlying = false; }
};

var Walking = function () { this.isWalking = false; }

Walking.prototype = {
    go: function () { this.wakeUp(); this.isWalking = true; },
    stop: function() { this.isWalking = false; }
};

```

That will fire an exception, because no skill is providing `wakeUp()` method. But, this error will occur on the first attempt to use it, which could be quite misleading. So, _asSys_ allows each skill to list methods that it _expects_ to be present already:

```javascript
var Flying = function () { this.isFlying = false; }

Flying.prototype = {
    __expects: ["wakeUp"],
    takeOff: function () { this.wakeUp(); this.isFlying = true; },
    land: function() { this.isFlying = false; }
};

var Walking = function () { this.isWalking = false; }

Walking.prototype = {
    __expects: ["wakeUp"],
    go: function () { this.wakeUp(); this.isWalking = true; },
    stop: function() { this.isWalking = false; }
};

```

Now, there will be an error again, but this time it'll happen in this line, i.e. - at the moment a new type of agent is defined:

```javascript
var Humans = a$(Walking);
```

_asSys_ will report missing expectation, as an exception. Providing a skill that actually has this method defined, is what needs to be done. For exmple:

```javascript
var Being = function () { }
Being.prototype.wakeUp = function () { this.isMoving = true; }

var Humans = a$(Being, Walking);
var aGuy = new Humans();
aGuy.go();
```

## Chemistry at help

As can be seen, this approach allows one to combine functionality from different places freely, in order to _cover_ the features a certain type of object in the system is expected to have. This opens the gate for much more independent approach in developing libraries and combining them.

Bringing an analogy from chemistry—another way to look at this is like atoms and molecules. Atoms are the basic building blocks and they don’t have hierarchy among them—they have valence i.e. potential for combining. What we actually use and observe as characteristics, however, are the molecules. They are built from atoms, with different combinations, based on their valences. And, again, there is _no_ hierarchy implied in the domain of molecules as well.

So, the Agent-Skills, (a.k.a Entity-Component) system’s paradigm follows the same principles—decomposing the set of features into atomic groups (_skills_ in our terminology), and opening the possibility for free composition.

## A longer guide

A crucial part of Entity-Component system is the ability to handle _sets_ of similar entities. In our case they are called _groups_ and this is how they are created, for example:

```javascript
var birds = a$.group(everybody, (a) => a instanceof Birds); // birds only
var airborne = a$.group(everybody, true, (a) => a$.capable(a, Flying));
```

Here, `everybody` is supposed to hold _all_ entities of the system, and the predicate provided as a last argument to `group()` function is for filtering. The `capable()` function will described later, because the `true` found as a second argument in the second example is more interesting.

It tells the _asSys_ construct the resulting group _as an agent_ with invocable methods, i.e. it has non-enumerable properties, which are common for all filtered agents/entities, including functions. And here is the best part—those functions are constructed to invoke the corresponding method of all listed agents in the group. In other words, in the context of the above example, this:

```javascript
airborne.takeOff();
```

... is totally valid and it will invoke `takeOff()` method of all agents/entities inside `airborne` array (yes, it is an array).

A simpler set of convenient methods are `capable()`, `can()`, `common()`, etc. They are better explained in the Reference.

## Method overlapping

The last piece of trickery is managing the overlapping methods, i.e. those that are present in more than one provided skill. The most obvious case would be the very popular `init()` method. If we need to enrich our example case:

```javascript
Flying.prototype.init = function (state) { this.isFlying = state; };
Walking.prototype.init = function (state) { this.isWalking = state; };
Being.prototype.init = function (state) { this.isMoving = state; };
```

They all have it. One obvious consequence is that the function built with _asSys_ will have the method, which comes form the last skill in the provided list:

```javascript
var aFalcon = new (a$(Flying, Walking))();
aFalcon.init(false); // This will invoke `Waling.prototype.init()`.

```

Which makes sense. What if, however, someone would like to invoke the methods that have been overridden? In the case of  `init()`, it is quite natural to let other skills initialize the object as well. This is what `a$.pass()` function is for:

```javascript
a$.pass(aFalcon, Flying, 'init', false);
```

This method will invoke `init()` function of the first skill _before_ `Flying`, that has it. Of course, with `aFalcon` as `this`. So, a skill doesn’t need to know where was it, in the initial call to `a$()`, nor need to be aware that other skills exist, or are part of this agent’s functionality—the only thing which is important is _"Am I expected to let overridden with my name, still be executed?”_.

A improved definition of the `init()` method would be:

```javascript
Flying.prototype.init = function (state) { 
	this.isFlying = state;
	a$.pass(this, Flying, 'init', state);
};

Walking.prototype.init = function (state) { 
	this.isWalking = state; 
	a$.pass(this, Walking, 'init', state);
};

Being.prototype.init = function (state) { 
	this.isMoving = state; 
	a$.pass(this, Being, 'init', state);
};
```

## Performance

Same type of functionality can be achieved _manually_ using common `extend` functionality (found in [jQuery](https://api.jquery.com/jQuery.extend/#jQuery-extend-target-object1-objectN), [underscore](https://underscorejs.org/#extend), [lodash](https://lodash.com/docs/4.17.15#assignIn), etc.), in a patter like this:

```javascript
var a = _.extend({}, Flying.prototype, Walking.prototype);
Flying.call(a);
Walking.call(a);
```

However, this routine need to be executed on each new entity allocation, which can be costly. Also, the memory usage will be higher, especially with large number of entities, because each of them will need to hold the references to the methods.

Therefore, _asSys_’s approach avoids assembling each _agent_ on every instantiation, because the number of different combinations of _skills_ is quite limited—it is (usually) manually coded as part of the system’s architecture. The number of _agents_, on the other side, could be quite large. Hence, the approach of constructing these dynamic functions and prototypes, which enables the actual object creation to be handled natively by the JavaScript engine.

### The numbers

The actual method invocation is no different, therefore I’ve conducted few types for entity allocation, and here are the results:

* The _native_, direct allocation from single function (i.e. `new SingleSkill()`) is around 100 times _faster_ than single-skill _asSys_-based allocation. There are good news here, however.
* The _manual_ allocation with two skills (as the example above) is ≈60% _slower_, than the corresponding _asSys_-based two-skill allocation.
* The manual allocation with four skills is nearly 4 _times_ slower than the corresponding four skills _asSys_-based allocation.
* The number of skills in the _asSys_-based allocation doesn’t really influence the speed.
* In the browser, the results are almost the same, just that native, simple `new` allocation is 10 times faster, than the single-skill _asSys_-allocation, not a 100.

First, it is important to note, that by allocation, I also mean invocation of the constructor, which in the case of many skills, means invocation of that many functions.

Second, it is important to clarify that all of the convenient methods of the library (`group()`, `can()`, `capable()`, etc.) work with natively built objects too, so it is not a problem to utilize the faster, native allocation for the cases of simple, single-skill agents/entities.

And third, the idea of this approach is to achieve higher granularity of feature-sets, and work on the ability to combine small, simple groups of features, rather than handling well behemoths. As a consequence, single-skill agents/entities are not very likely to be popular. At least, they shouldn’t.

## The distant future

_Language changes..._ I think that this type of functionality will perfectly fit as part of the language itself, with very few changes, namely two:

* Ability to provide more than one constructor function the `new` operator, lile `var a = new [fnA, fnB, ...]()`. The syntax can be either array-like `[]`, or custom (e.g. `<>`).
* Altering `Object.prototype.instanceOf()` function to be aware of that possibility and return `true` if any of the provided functions is given.
* Introduction of `Object.prototype.getAllPrototypesOf()` with the obvious behavior.
* Introduction of new underlying class, with array-like behavior, which can handle entity grouping, and automatically provide the set method invocation.

And, such change will feel much more natural to JavaScript, than the continuous attempts to bring the `class`-ical, inheritance-based OOP paradigm in it.

## Legal notice (MIT License)

**Copyright © 2016-2018, Ivan (Jonan) Georgiev**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.