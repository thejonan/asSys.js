var vows = require("vows"),
    assert = require("./assert"),
    $$ = require("../"),
    suite = vows.describe("asSysJs");

function Skill(a) { this.value = a; };
Skill.prototype.show = function () { return this.value; }

suite.addBatch({
  "asSys:": {
    "is not a global when require’d": function() {
      assert.equal("asSys" in global, false);
    },
    
    "Agent allocation": {
      "Primitive object": function () {
        var o = $$("one", Skill);
        assert.deepEqual(o, { value: "one" });
        assert.equal(o.show(), "one");
      },
      "Using native type": function () {
        
      },
      "Checking skills property": function () {
        var o = $$("one", Skill);
        assert.isTrue(o.__skills.Skill);
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
    },
    
    "Agent simple characteristics:": {
      "Weight counting with simple object": function () {
        assert.equal($$.weight({ a: 1}), 1);
      },
      "Weight counting of a bigger object": function () {
        assert.equal($$.weight({ a: 1, b: 2}), 2);
      },
      "Weight counting of an array": function () {
        assert.equal($$.weight([ 0, 1, 2]), 3);
      },
      "Weight counting of a string": function () {
        assert.equal($$.weight("string"), 1);
      },
      "Weight counting of a number": function () {
        assert.equal($$.weight(5), 1);
      },
      "Awareness for a property": function () {
        assert.isTrue($$.aware({ a: 1}, 'a'));
      },
      "Unawareness for a missing property": function () {
        assert.isFalse($$.aware({ a: 1}, 'b'));
      },
      "Awareness for a method": function () {
        assert.isTrue($$.aware([], 'push'));
      },
      "Ability to invoke a missing method check": function () {
        assert.isFalse($$.can({ a: 1}, 'push'));
      },
      "Ability to invoke an existing method check": function () {
        assert.isTrue($$.can([], 'push'));
      },
      "Ability to call custom method": function () {
        assert.isTrue($$.can({ a: 1, push: function () { } }, 'push'));
      }
    },
    
    "Agent capabilities checks": {
      "Custom skill check": function () {
        var aa = $$("one", Skill);
        assert.isTrue($$.capable(aa, Skill));
        
      },
      "An array capabilities check": function () {
        assert.isFalse($$.capable([], Skill));
      },
      "An array own capabilities check": function () {
        assert.isTrue($$.capable([], Array));
      }
    }
  }
});

suite.export(module);
