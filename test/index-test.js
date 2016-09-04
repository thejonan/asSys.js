var vows = require("vows"),
    assert = require("assert"),
    a$ = require("../"),
    suite = vows.describe("asSysJs");

function SkillShow(a) { this.value = a; };
SkillShow.prototype.show = function () { return this.value; }

function SkillChange() { };
SkillChange.prototype.change = function (a) { this.value = a; }
SkillChange.prototype.step = function (s) { this.value += s; }

function SkillCombined() { };
SkillCombined.prototype.__expects = [ SkillShow, SkillChange ];
SkillCombined.prototype.combine = function (a, b) { this.value = a + b; }
SkillCombined.prototype.step = function (s) { this.value += s * s; }

suite.addBatch({
  "asSys:": {
    topic: new (a$(SkillShow))("one"),
    "is not a global when require’d": function() {
      assert.equal("asSys" in global, false);
    },
    
    "Agent allocation": {
      "Primitive object": function (o) {
        assert.deepEqual(o, { value: "one" });
        assert.equal(o.show(), "one");
      },
      "Checking skills property": function (o) {
        assert.isDefined(o.__skills.indexOf(SkillShow) > -1);
      },
      "Mimicing a native type": function () {
        assert.isTrue(Array.isArray(a$.mimic([])));
      },
      "Emptiness of mimiced object": function (o) {
        assert.equal(a$.mimic([1, 2, 3]).length, 0);
        assert.isUndefined(a$.mimic(o).value);
      },
      "Respecting the expected skills": function () {
        var o = new (a$(SkillCombined));
        assert.isDefined(o.show);
        assert.isDefined(o.change);
        assert.isDefined(o.combine);
      },
      "Using own methods when there are expected skills": function () {
        var o = new (a$(SkillCombined));
        o.combine("one", "two");
        assert.equal(o.show(), "onetwo");
      },
      
      "Using methods from expected skills": function () {
        var o = new (a$(SkillCombined));
        o.change("test");
        assert.equal(o.show(), "test");
      },
      "Use an already crafted skill as reference": function () {
        var s = a$(SkillShow),
            o = new (a$(s))("recursive");
        assert.equal(o.show(), "recursive");
      }
    },
    
    "Extending, mixing": {
      "Extend empty object": function () {
        assert.deepEqual(a$.extend({}, {a: 1, b: 2}), { a: 1, b: 2});
      },
      "Extend from empty with two objects": function () {
        assert.deepEqual(a$.extend({}, {a: 1, b: 2}, { a: 3}), {a: 3, b: 2});
      },
      "Extend from null": function () {
        assert.deepEqual(a$.extend(null, {a: 1, b: 2}), {a: 1, b: 2});
      },
      "Extend with an array": function () {
        var o = a$.extend(null, [ 1, 2, 3]);
        assert.isArray(o);
        assert.deepEqual(o, [1, 2, 3]);
      },
      "Extending an array": function () {
        assert.deepEqual(a$.extend([ 1, 2, 3], [4, 5, 6]), [4, 5, 6 ]);
      },
      "Extending a deep array": function () {
        assert.deepEqual(a$.extend({ a: [ 1, 2, 3], b: 2}, { a: [4, 5, 6], b: [3, 4] }), { a: [4, 5, 6], b: [3, 4]});
      },
      "Extend from non-empty object": function () {
        assert.deepEqual(a$.extend({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bc: 7}, c: 4});
      },
      "Extend deep": function () {
        assert.deepEqual(a$.extend(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bb: 6, bc: 7}, c: 4});
      },
      "Extending with null object": function () {
        assert.deepEqual(a$.extend(null, {a: 1, b: 2 }, null, { b: 3 }), {a: 1, b: 3});
      },
      "Mixing with two objects": function () {
          assert.deepEqual(a$.mixin({}, {a: 1, b: 2}, { a: 3, c: 4}), {a: 1, b: 2, c: 4});
      },
      "Mixing with three objects": function () {
        assert.deepEqual(a$.mixin({}, {a: 1, b: 2}, { a: 3}), {a: 1, b: 2});
      },
      "Mixing with deep object": function () {
        assert.deepEqual(a$.mixin({}, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4}), {a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Mixing a non-empty object": function () {
        assert.deepEqual(a$.mixin({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4}), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Mixing a non-empty with deeper object": function () {
        assert.deepEqual(a$.mixin({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bb: 6, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Mixing deep": function () {
        assert.deepEqual(a$.mixin(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Getting common properties": function () {
        assert.deepEqual(a$.common({ a: 1, b: 2, c: 3}, { b: 2, c: 4, d: 5}), { b: 2, c: 3 });
      },
      "Getting equal common properties": function () {
        assert.deepEqual(a$.common(true, { a: 1, b: 2, c: 3}, { b: 2, c: 4, d: 5 }), { b: 2 });
      },
      "Getting commons from an array": function () {
        assert.deepEqual(a$.common([1, 2, 3, 4], [3, 4, 5]), [3, 4]);
      }
    },
    
    "Path based retrieval and manipulation": {
      topic: { a: 1, b: 2, c: { ca: 3, cb: 4 } },
      "Getting a value from a path in an agent": function (o) {
        assert.equal(a$.path(o, "c.ca"), 3);
      },
      "Setting a value with a path": function (o) {
        a$.path(o, "c.cb", 5);
        assert.equal(o.c.cb, 5);
      },
      "Building a path when components are missing": function (o) {
        a$.path(o, "c.cd", 7);
        assert.equal(o.c.cd, 7);
      },
      "Bulding a path from the root of the object": function (o) {
        a$.path(o, "d.a.aa.aaa", 8);
        assert.deepEqual(o.d, { a: { aa: { aaa: 8 } } });
      },
      "Passing the path as an array": function (o) {
        assert.equal(a$.path(o, ['c', 'ca']), 3);
      }
    },
    
    "Equality and similarity": {
      "Simple equal check": function () {
        assert.isTrue(a$.equal("0", "0")) ;
      },
      "Type difference": function () {
        assert.isFalse(a$.equal({ a: 1, b: 2}, { a: "1", b: 2} ));
      },
      "Normal equal objects": function () {
        assert.isTrue(a$.equal({ a: 1, b: 2}, { a: 1, b: 2} ));      
      },
      "Equality for unequal but similar objects": function () {
        assert.isFalse(a$.equal({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
      },
      "Equality in depth": function () {
        assert.isTrue(a$.equal(true, { a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "one" } } ));      
      },
      "Inequality in depth": function () {
        assert.isFalse(a$.equal(true, { a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "two" } } ));      
      },
      "Inequality in depth, but not in values": function () {
        assert.isFalse(a$.equal({ a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "one" } } ));      
      },
      "Equality for simple types": function () {
        assert.isTrue(a$.equal("one", "one"));
      },
      "Inequality for simple types": function () {
        assert.isFalse(a$.equal("1", 1));
      },
      "Similarity for unequal but similar objects": function () {
        assert.isTrue(a$.similar({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
      },
      "Similarity for object with different value for same property": function () {
        assert.isFalse(a$.similar({ a: 1, b: 2}, { a: 1, b: 3, c: 3} ));
      },
      "Similarity between number of its string": function () {
        assert.isTrue(a$.similar(1, "1"));
      },
      "Similarity with regexp": function () {
        assert.isTrue(a$.similar("Another test string", /test/));
      },
      "Weird similarity with regexp": function () {
        assert.isFalse(a$.similar({ a: "Another test string" }, /test/));
      },
      "Similarity unmatchable": function () {
        assert.isFalse(a$.similar(/test/, "Without it"));
      },
      "Similarity between object in depth": function () {
        assert.isTrue(a$.similar(true, {a: 1, b: { ba: "one" }}, { b: { ba: /n/ } }));
      }
    },
    
    "Filtering and enumeration": {
      "Simple iteration on array": function () {
        var sum = 0;
        a$.each([1, 2, 3, 4, 5], function (n) { sum += n; })
        assert.equal(sum, 15);
      },
      "Simple iteration of an object": function () {
        var sum = 0;
        a$.each({ a: 1, b: 2, c: 3, d: 4, e: 5}, function (v) { sum += v; })
        assert.equal(sum, 15);
      },
      "Enumerate a plain object": function () {
        var val = null;
        a$.each("one", function (v) { val = v; });
        assert.equal(val, "one");
      },
      "Filtering an array": function () {
        assert.deepEqual(a$.filter([1, 2, 3, 4, 5], function (n) { return n < 4; }), [1, 2, 3]);
      }, 
      "Filtering an object": function () {
        assert.deepEqual(a$.filter({ one: 1, two: 2, three: 3, four: 4, five: 5}, function (v, k) { return k.match(/[of]/) && v < 3; }), { one: 1, two: 2 });
      }
    },
    
    "Agent simple characteristics:": {
      "Weight counting with simple object": function () {
        assert.equal(a$.weight({ a: 1}), 1);
      },
      "Weight counting of a bigger object": function () {
        assert.equal(a$.weight({ a: 1, b: 2}), 2);
      },
      "Weight counting of an array": function () {
        assert.equal(a$.weight([ 0, 1, 2]), 3);
      },
      "Weight counting of a string": function () {
        assert.equal(a$.weight("string"), 1);
      },
      "Weight counting of a number": function () {
        assert.equal(a$.weight(5), 1);
      },
      "Awareness for a property": function () {
        assert.isTrue(a$.aware({ a: 1}, 'a'));
      },
      "Unawareness for a missing property": function () {
        assert.isFalse(a$.aware({ a: 1}, 'b'));
      },
      "Awareness for a method": function () {
        assert.isTrue(a$.aware([], 'push'));
      },
      "Ability to invoke a missing method check": function () {
        assert.isFalse(a$.can({ a: 1}, 'push'));
      },
      "Ability to invoke an existing method check": function () {
        assert.isTrue(a$.can([], 'push'));
      },
      "Ability to call custom method": function () {
        assert.isTrue(a$.can({ a: 1, push: function () { } }, 'push'));
      }
    },
    
    "Agent capabilities: ": {
      "Single skills capabilities": {
        topic: new (a$(SkillShow))("one"),
        "Custom skill check": function (aa) {
          assert.isTrue(a$.capable(aa, SkillShow));
        },
        "One skill check": function (aa) {
          assert.isTrue(a$.capable(aa, true, SkillShow));
        },
        "Two skills complete check": function (aa) {
          assert.isFalse(a$.capable(aa, true, SkillShow, SkillChange));
        },
        "Two skills partial check": function (aa) {
          assert.isTrue(a$.capable(aa, false, SkillShow, SkillChange));
        },
        "Awareness of methods": function (aa) {
          assert.isTrue(a$.can(aa, "show"));
          assert.isFalse(a$.can(aa, "change"));
        }
      },
      "Dual skills capabilities": {
        topic: new (a$(SkillShow, SkillChange))("one"),
        "Separate skill check": function (aa) {
          assert.isTrue(a$.capable(aa, SkillShow));
          assert.isTrue(a$.capable(aa, SkillChange));
        },
        "All skills check": function (aa) {
          assert.isTrue(a$.capable(aa, true, SkillShow, SkillChange));
        },
        "Awareness of combined methods": function (aa) {
          assert.isTrue(a$.can(aa, "show"));
          assert.isTrue(a$.can(aa, "change"));
        },
        "Workability of skills": function (aa) {
          aa.change("two");
          assert.equal(aa.show(), "two");
        }
      }
    },
    "Agents grouping": {
      topic: [ new (a$(SkillShow))("one"), new (a$(SkillChange)), new (a$(SkillShow, SkillChange))("me") ],
      "Select skilled agensts": function (pool) {
        assert.equal(a$.group(pool, function (a) { return a$.capable(a, SkillShow); }).length, 2);
      },
      "Existence of group methods": function (pool) {
        assert.isDefined(a$.group(pool, true, function (a) { return a$.capable(a, SkillShow); }).show);
      },
      "Invocation go group method": function (pool) {
        var g = a$.group(pool, true, function (a) { return a$.capable(a, SkillShow); });
        assert.equal(g.show(), "me"); // i.e. the latest one
      },
      "Invocation of modifying method": function (pool) {
        var g = a$.group(pool, true, function (a) { return a$.capable(a, SkillChange); });
        g.change("our");
        for (var p in g)
          assert.equal(g[p].value, "our");
      }
    },
    
    "Acting and broadcasting": {
      topic: new (a$(SkillCombined))(1),
      "Normal call of overriden activity": function (a) {
        a.step(2);
        assert.equal(a.value, 5);
      },
      "Simple act on an agent": function (a) {
        a.value = 1;
        assert.equal(a$.act(a, SkillShow.prototype.show), 1);
      },
      "Constructor act on an agent": function (a) {
        a.value = 1; // We need to RESET the value from previous test...
        a$.act(a, SkillShow, 2);
        assert.equal(a.show(), 2);
      },
      "Broadcast to all skills": function (a) {
        a.value = 1;
        a$.broadcast(a, 'step', 2);
        assert.equal(a.value, 7);
      },
      "Pass to super's activity": function (a) {
        a.value = 1;
        a$.pass(a, SkillCombined, 'step', 2);
        assert.equal(a.value, 3);
      }
    }
  }
});

suite.export(module);
