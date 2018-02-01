# asSys - *A* *S*imple, *A*gent-*S*kills System
**General purpose [Entity-Component System](https://en.wikipedia.org/wiki/Entity–component–system) implemented in JavaScript.**

## Ideology

Traditional [Object Oriented Programming](https://en.wikipedia.org/wiki/Object-oriented_programming) has the inherent problem of enforcing tree-like distribution of functionality among active entities, which are the _instances of different classes_. A _class_ is wrapping of certain functionality, which is made accessible to the _"agent"_ in the memory, when an instance of this class, or any descendent, is created. This is limiting. If you need to have three types of instances:

* `Humans` which are capable of walking;
* `Planes` which are capable of flying;
* `Birds` which are capable of both flying and walking;

You can inherit **walking** in _Birds_ from _Humans_, but then you'll need to have separate implementation of **flying** for _Planes_. Alternatively, you can inherit **flying** in _Birds_ from _Planes_, but then **walking** should be re-implemented in _Humans_. In either scenario one _skill_ should be implemented twice. Multiple inheritance, found nowhere but in C++ is quite complicated solution, neither being recommended, nor actually solving many of the problems (e.g. - sharing of properties between different classes, in the same entity).

Additionally, some languages, like JavaScript, are _not_ designed in a traditional OOP manner. Rather, upon instantiation of an object, it is given a _prototype_, which it is bound to, and given access to its properties.

> So, if one has implementations of a set of _skills_, she can assemble them into a single _prototype_ and all objects (which we call _agents_) instantiated from this prototype will have _all_ the _skills_. This is exactly what _asSys_ library is doing.

## A story-like examples

Let's have our *Flying* and _Walking_ skills defined like this:

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

Not the most meaningful implementation, but enough for the example. So, what will it take to have _Humans_ type objects (entities, agents) defined? Only this:

```javascript
var Humans = a$(Walking);
```

Pay attention, that `Humans` is not an _instance_ in the normal sense. To have one we must do:

```javascript
var aGuy = new Humans();
```

Of course, we haven't added too much, because we could freely do it this way:

```javascript
var aGuy = new Walking();
```

It's the same. But, let's see how a _Birds_ are defined:

```javascript
var Birds = a$(Walking, Flying);
```

Now, that is different. Again new actual birds are instantiated this way:

```javascript
var aFalcon = new Birds();
```

And, of course, creating and instantiating a _Planes_ is no more difficult:

```javascript
var Planes = a$(Flying);
var aJumbo = new Planes();
```

In this example `Planes`, `Birds` and `Humans` are dynamically constructed _functions_ which (upon instantiation) invoke all the passed _skills_'s constructors (i.e. funtions) in the same order, in which they are given. For example `Birds` is a function, that invokes `Walking()` and then `Flying()`.

The above functionality can easily be achieved with C++ multiple-inheritance as well. Let's define the basic skills a bit differently:

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

This is quite convenient! Actually sharing of properties and methods is vital for effective combination of skills. And if certain cooperation (between skills) is about to happen, there are some expectation arising. Let's say we want to wrap the `isMoving` setup into a separate method like this:

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

That will fire an error, because no skill is providing `wakeUp()` method. But, this error will occur on the first attempt to use it, which could be quite misleading. So _asSys_ allows each skill to list methods that it _expects_ to be present already:

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

Now, there will be an error again, but this time it'll happen in these (type of) likes:

```javascript
var Humans = a$(Walking);
```

_asSys_ will report missing expectation. So, listing a skill that provides it, is the solution:

```javascript
var Being = function () { }
Thing.prototype.wakeUp = function () { this.isMoving = true; }

var Humans = a$(Being, Walking);
var aGuy = new Humans();
aGuy.go();
```

## Performance

Not assembling each _agent_ on every instantiation, is intentional, because the number of different combinations of _skills_ is quite limited, because it is (usually) manually provided, by the developer. However, number of _agents_ could be quite large. Hence, the approach of constructing these dynamic functions and prototypes - this let's the actual object creating to utilize the normal JavaScript engine routines.

Also, attaching desired set of methods to each new instance will lead to unnecessary memory consumption, while having them wrapped in the prototype will make this more efficient as well.

## ToDo

- Tests with overlapping methods
- Test overlapping methods when mimicing
- Test `act` tool with overlapping methods



## Legal notice (MIT License)

**Copyright © 2016-2018, Ivan (Jonan) Georgiev**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.