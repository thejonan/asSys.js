var vows = require("vows"),
    assert = require("assert"),
    a$ = require("../"),
    suite = vows.describe("asSysJs");

function SkillShow(a) { this.value = a; };
SkillShow.prototype.show = function () { return this.value; }

function SkillChange() { };
SkillChange.prototype.change = function (a) { this.value = a; }

function SkillCombined() { };
SkillCombined.prototype.__expects = [ SkillShow, SkillChange ];
SkillCombined.prototype.combine = function (a, b) { this.value = a + b; }

suite.addBatch({
  "asSys:": {
    topic: a$(SkillShow, "one"),
    "is not a global when require’d": function() {
      assert.equal("asSys" in global, false);
    },
    
    "Agent allocation": {
      "Primitive object": function (o) {
        assert.deepEqual(o, { value: "one" });
        assert.equal(o.show(), "one");
      },
      "Checking skills property": function (o) {
        assert.isDefined(o.__skills.SkillShow);
      },
      "Mimicing a native type": function () {
        assert.isTrue(Array.isArray(a$.mimic([])));
      },
      "Emptiness of mimiced object": function (o) {
        assert.equal(a$.mimic([1, 2, 3]).length, 0);
        assert.isUndefined(a$.mimic(o).value);
      },
      "Respecting the expected skills": function () {
        var o = a$(SkillCombined);
        assert.isDefined(o.show);
        assert.isDefined(o.change);
        assert.isDefined(o.combine);
      },
      "Using own methods when there are expected skills": function () {
        var o = a$(SkillCombined);
        o.combine("one", "two");
        assert.equal(o.show(), "onetwo");
      },
      
      "Using methods from expected skills": function () {
        var o = a$(SkillCombined);
        o.change("test");
        assert.equal(o.show(), "test");
      }
    },
    
    "Extending and mixing": {
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
      "Extend from non-empty object": function () {
        assert.deepEqual(a$.extend({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bc: 7}, c: 4});
      },
      "Extend deep": function () {
        assert.deepEqual(a$.extend(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bb: 6, bc: 7}, c: 4});
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
      "Similarity for unequal but similar objects": function () {
        assert.isTrue(a$.similar({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
      },
      "Similarity for object with different value for same property": function () {
        assert.isFalse(a$.similar({ a: 1, b: 2}, { a: 1, b: 3, c: 3} ));
      },
      "Matching number of its string": function () {
        assert.isTrue(a$.match(1, "1"));
      },
      "Matching with regexp": function () {
        assert.isTrue(a$.match("Another test string", /test/));
      },
      "Matching unmatchable": function () {
        assert.isFalse(a$.match(/test/, "Without it"));
      },
      "Matching objects": function () {
        assert.isTrue(a$.match({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
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
      "An array capabilities check": function () {
        assert.isFalse(a$.capable([], SkillShow));
      },
      "An array own capabilities check": function () {
        assert.isTrue(a$.capable([], Array));
      },
      "Single skills capabilities": {
        topic: a$("one", SkillShow),
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
        topic: a$("one", SkillShow, SkillChange),
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
      },
      "Complex skills capabilities": {
        topic: a$("one", Array, SkillShow),
        "Array existance check": function (aa) {
          assert.isTrue(a$.capable(aa, Array));
        }
      }
    },
    "Agents grouping": {
      topic: [ a$(SkillShow, "one"), a$(SkillChange), a$(SkillShow, SkillChange, "me") ],
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
    
    "Overlapping skills": {
      topic: a$(SkillShow, "one"),
      "Simple act on an agent": function (a) {
        assert.equal(a$.act(a, SkillShow.prototype.show), "one");
      },
      "Constructor act on an agent": function (a) {
        a$.act(a, SkillShow, "two");
        assert.equal(a.show(), "two");
      }
      
    }
  }
});

suite.export(module);
