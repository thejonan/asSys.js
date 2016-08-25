var vows = require("vows"),
    assert = require("./assert"),
    $$ = require("../"),
    suite = vows.describe("asLib");

var Skill = function (a) { this.value = a; };
Skill.prototype.show = function () { return a.value; }

suite.addBatch({
  "asLib": {
    "is not a global when require’d": function() {
      assert.equal("asLib" in global, false);
    },
    
    "Agent allocation": {
      "Primitive object": function (Skill) {
        var o = $$("one", Skill);
        assert.deepEqual(o, { value: "one" });
        assert.isEqual(o.show(), "one");
      },
      "Using native type": function () {
        
      }
    },
    
    "Extending and enhancing": {
      "Extend empty object": function () {
        assert.deepEqual($$.extend({}, {a: 1, b: 2}), { a: 1, b: 2});
      },
      "Extend from empty with two objects": function () {
        assert.deepEqual($$.extend({}, {a: 1, b: 2}, { a: 3}), {a: 3, b: 2});
      },
      "Extend from null": function () {
        assert.deepEqual($$.extend(null, {a: 1, b: 2}), {a: 1, b: 2});
      },
      "Extend with an array": function () {
        var o = $$.extend(null, [ 1, 2, 3]);
        assert.isArray(o);
        assert.deepEqual(o, [1, 2, 3]);
      },
      "Extend from non-empty object": function () {
        assert.deepEqual($$.extend({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bc: 7}, c: 4});
      },
      "Extend deep": function () {
        assert.deepEqual($$.extend(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bb: 6, bc: 7}, c: 4});
      },
      "Enhance with two objects": function () {
        assert.deepEqual($$.enhance({}, {a: 1, b: 2}, { a: 3, c: 4}), {a: 1, b: 2, c: 4});
      },
      "Enhance with three objects": function () {
        assert.deepEqual($$.enhance({}, {a: 1, b: 2}, { a: 3}), {a: 1, b: 2});
      },
      "Enhance with deep object": function () {
        assert.deepEqual($$.enhance({}, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4}), {a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Enhance a non-empty object": function () {
        assert.deepEqual($$.enhance({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4}), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Enhance a non-empty with deeper object": function () {
        assert.deepEqual($$.enhance({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bb: 6, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      },
      "Enhance deep": function () {
        assert.deepEqual($$.enhance(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
      }
    },
    
    "Equality and similarity": {
      "Simple equal check": function () {
        assert.isTrue($$.equal("0", "0")) ;
      },
      "Type difference": function () {
        assert.isFalse($$.equal({ a: 1, b: 2}, { a: "1", b: 2} ));
      },
      "Normal equal objects": function () {
        assert.isTrue($$.equal({ a: 1, b: 2}, { a: 1, b: 2} ));      
      },
      "Equality for unequal but similar objects": function () {
        assert.isFalse($$.equal({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
      },
      "Similarity for unequal but similar objects": function () {
        assert.isTrue($$.similar({ a: 1, b: 2}, { a: 1, b: 2, c: 3} ));
      },
      "Similarity for object with different value for same property": function () {
        assert.isFalse($$.similar({ a: 1, b: 2}, { a: 1, b: 3, c: 3} ));
      }
    }
  }
});

suite.export(module);
