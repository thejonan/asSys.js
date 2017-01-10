var a$ = require("../");


function SkillShow(a) { this.value = a; };
SkillShow.prototype.show = function () { return this.value; }

function SkillChange() { };
SkillChange.prototype.change = function (a) { this.value = a; }
SkillChange.prototype.step = function (s) { this.value += s; }

function SkillCombined() { };
SkillCombined.prototype.__depends = [ SkillShow, SkillChange ];
SkillCombined.prototype.combine = function (a, b) { this.value = a + b; }
SkillCombined.prototype.step = function (s) { this.value += s * s; }

function SkillDemanding() { };
SkillDemanding.prototype.__expects = [ "show", "own" ];
SkillDemanding.prototype.own = function () { };

describe("asSys", function () {
	// Now - GO with the tests.
	var topic =  new (a$(SkillShow))("one");

	// #1 set.
	describe("Agent allocation", function() {
		it("Primitive object", function() {
			expect(topic.value).toBe("one");
			expect(topic.show()).toBe("one");
		});

		it("Checking skills property", function() {
			expect(topic.__skills.indexOf(SkillShow) > -1).toBe(true);
		});

		it("Mimicing a native type", function() {
			expect(Array.isArray(a$.mimic([]))).toBe(true);
		});

		it("Emptiness of mimiced object", function() {
			expect(a$.mimic([1, 2, 3]).length).toBe(0);
			expect(a$.mimic(topic).value).toBeUndefined();
		});

		it("Respecting the dependent skills", function() {
			var o = new (a$(SkillCombined));
			expect(o.show).toBeDefined();
			expect(o.change).toBeDefined();
			expect(o.combine).toBeDefined();
		});
		
		it("Signaling on missing skill", function() {
  		var failed = false;
  		try {
  			var o = new (a$(null));
  		}
  		catch (o) {
    		failed = true;
    		expect(o.name).toBe("Missing skill");
    		expect(o.message).toBeDefined();
    		expect(o.skill).toBeUndefined();
  		}
  		
			expect(failed).toBeTruthy();
		});		

		it("Reporting missing expected methods", function() {
  		try {
			  var o = new (a$(SkillDemanding));
			  expect(true).toBeFalsy();
		  }
		  catch (e) {
  		  expect(e.method).toBe("show");
		  }
		});

		it("Noticing expected methods", function() {
		  var o = new (a$(SkillShow, SkillDemanding));
		  expect(o.show).toBeDefined();
		  expect(o.own).toBeDefined();
		});

		it("Using own methods when there are expected skills", function() {
			var o = new (a$(SkillCombined));
			o.combine("one", "two");
			expect(o.show()).toBe("onetwo");
		});

	
		it("Using methods from expected skills", function() {
			var o = new (a$(SkillCombined));
			o.change("test");
			expect(o.show()).toBe("test");
		});

		it("Use an already crafted skill as reference", function() {
			var s = a$(SkillShow),
					o = new (a$(s))("recursive");
			expect(o.show()).toBe("recursive");
		});
	});

	describe("Extending, mixing", function () {

		it("Extend empty object", function() {
			expect(a$.extend({}, {a: 1, b: 2})).toEqual({ a: 1, b: 2});
		});

		it("Extend from empty with two objects", function() {
			expect(a$.extend({}, {a: 1, b: 2}, { a: 3})).toEqual({a: 3, b: 2});
		});

		it("Extend from null", function() {
			expect(a$.extend(null, {a: 1, b: 2})).toEqual({a: 1, b: 2});
		});

		it("Extend with an array", function() {
			var o = a$.extend(null, [ 1, 2, 3]);
			expect(Array.isArray(o)).toBe(true);
			expect(o).toEqual([1, 2, 3]);
		});

		it("Extending an array", function() {
			expect(a$.extend([ 1, 2, 3], [4, 5, 6])).toEqual([4, 5, 6 ]);
		});

		it("Extending a deep array", function() {
			expect(a$.extend({ a: [ 1, 2, 3], b: 2}, { a: [4, 5, 6], b: [3, 4] })).toEqual({ a: [4, 5, 6], b: [3, 4]});
		});
		
		it("Extend from non-empty object", function () {
			expect(a$.extend({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } )).toEqual({_: "", a: 3, b: {ba: 5, bc: 7}, c: 4});
		});

		it("Extend deep", function() {
			expect(a$.extend(true, {_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bc: 7} } )).toEqual({_: "", a: 3, b: {ba: 5, bb: 6, bc: 7}, c: 4});
		});

		it("Extending with null object", function() {
			expect(a$.extend(null, {a: 1, b: 2 }, null, { b: 3 })).toEqual({a: 1, b: 3});
		});
		
		it ("Extends RegExp properly", function () {
  		expect(a$.extend(true, {}, { a: 1 }, { b: /Test/ })).toEqual({ a: 1, b: /Test/ });
		});

		it("Mixing with two objects", function() {
				expect(a$.mixin({}, {a: 1, b: 2}, { a: 3, c: 4})).toEqual({a: 1, b: 2, c: 4});
		});

		it("Mixing with three objects", function() {
			expect(a$.mixin({}, {a: 1, b: 2}, { a: 3})).toEqual({a: 1, b: 2});
		});

		it("Mixing with deep object", function() {
			expect(a$.mixin({}, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4})).toEqual({a: 1, b: {ba: 5, bb: 6}, c: 4});
		});
		
		it("Mixing a non-empty object", function () {
			expect(a$.mixin({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4})).toEqual({_: "", a: 1, b: { ba: 5, bb: 6}, c: 4});
		});
		
		it("Mixing a non-empty with deeper object", function () {
			expect(a$.mixin({_: "" }, {a: 1, b: { ba: 5, bb: 6} }, { a: 3, c: 4, b: { ba: 5, bb: 6, bc: 7} } )).toEqual({_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
		});

		it("Mixing deep", function() {
			expect(a$.mixin(true, {_: "" },  {a: 1, b: { ba: 5, bb: 6} },  { a: 3, c: 4, b: { ba: 5, bc: 7} } )).toEqual({_: "", a: 1, b: {ba: 5, bb: 6}, c: 4});
		});

		it("Getting common properties", function() {
			expect(a$.common({ a: 1, b: 2, c: 3},  { b: 2, c: 4, d: 5})).toEqual({ b: 2, c: 3 });
		});

		it("Getting equal common properties", function() {
			expect(a$.common(true, { a: 1, b: 2, c: 3}, { b: 2, c: 4, d: 5 })).toEqual({ b: 2 });
		});

		it("Getting commons from an array", function() {
			expect(a$.common([1, 2, 3, 4], [3, 4, 5])).toEqual([3, 4]);
		});
	});

	describe("Path based retrieval and manipulation", function() {
		var o =  { a: 1, b: 2, c: { ca: 3, cb: 4 } };

		it("Getting a value from a path in an agent", function() {
			expect(a$.path(o, "c.ca")).toBe(3);
		});

		it("Setting a value with a path", function() {
			a$.path(o, "c.cb", 5);
			expect(o.c.cb).toBe(5);
		});

		it("Building a path when components are missing", function() {
			a$.path(o, "c.cd", 7);
			expect(o.c.cd).toBe(7);
		});

		it("Bulding a path from the root of the object", function() {
			a$.path(o, "d.a.aa.aaa", 8);
			expect(o.d).toEqual({ a: { aa: { aaa: 8 } } });
		});

		it("Passing the path as an array", function() {
			expect(a$.path(o, ['c', 'ca'])).toBe(3);
		});
	});

	describe("Equality and similarity", function() {

		it("Simple equal check", function() {
			expect(a$.equal("0", "0")).toBe(true) ;
		});

		it("Type difference", function() {
			expect(a$.equal({ a: 1, b: 2}, { a: "1", b: 2} )).toBe(false);
		});

		it("Normal equal objects", function() {
			expect(a$.equal({ a: 1, b: 2}, { a: 1, b: 2} )).toBe(true);
		});

		it("Equality for unequal but similar objects", function() {
			expect(a$.equal({ a: 1, b: 2}, { a: 1, b: 2, c: 3} )).toBe(false);
		});

		it("Equality in depth", function() {
			expect(a$.equal(true, { a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "one" } } )).toBe(true);
		});

		it("Inequality in depth", function() {
			expect(a$.equal(true, { a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "two" } } )).toBe(false);
		});
		
		it("Inequality in depth, but not in values", function () {
			expect(a$.equal({ a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "one" } } )).toBe(false);
		});

		it("Equality for simple types", function() {
			expect(a$.equal("one", "one")).toBe(true);
		});

		it("Inequality for simple types", function() {
			expect(a$.equal("1", 1)).toBe(false);
		});

		it("Similarity for unequal but similar objects", function() {
			expect(a$.similar({ a: 1, b: 2}, { a: 1, b: 2, c: 3} )).toBe(true);
		});

		it("Similarity for object with different value for same property", function() {
			expect(a$.similar({ a: 1, b: 2}, { a: 1, b: 3, c: 3} )).toBe(false);
		});

		it("Similarity between number of its string", function() {
			expect(a$.similar(1, "1")).toBe(true);
		});

		it("Similarity with regexp", function() {
			expect(a$.similar("Another test string", /test/)).toBe(true);
		});

		it("Weird similarity with regexp", function() {
			expect(a$.similar({ a: "Another test string" }, /test/)).toBe(false);
		});

		it("Similarity unmatchable", function() {
			expect(a$.similar(/test/, "Without it")).toBe(false);
		});

		it("Similarity between object in depth", function() {
			expect(a$.similar(true, {a: 1, b: { ba: "one" } }, { b: { ba: /n/ } })).toBe(true);
		});
	});

	describe("Filtering and enumeration", function() {

		it("Simple iteration on array", function() {
			var sum = 0;
			a$.each([1, 2, 3, 4, 5], function (n) { sum += n; })
			expect(sum).toBe(15);
		});

		it("Simple iteration of an object", function() {
			var sum = 0;
			a$.each({ a: 1, b: 2, c: 3, d: 4, e: 5}, function (v) { sum += v; })
			expect(sum).toBe(15);
		});

		it("Enumerate a plain object", function() {
			var val = null;
			a$.each("one", function (v) { val = v; });
			expect(val).toBe("one");
		});

		it("Filtering an array", function() {
			expect(a$.filter([1, 2, 3, 4, 5], function (n) { return n < 4; })).toEqual([1, 2, 3]);
		}); 

		it("Filtering an object", function() {
			expect(a$.filter({ one: 1, two: 2, three: 3, four: 4, five: 5}, function (v, k) { return k.match(/[of]/) && v < 3; })).toEqual({ one: 1, two: 2 });
		});
	});

	describe("Agent simple characteristics:", function() {

		it("Weight counting with simple object", function() {
			expect(a$.weight({ a: 1})).toBe(1);
		});

		it("Weight counting of a bigger object", function() {
			expect(a$.weight({ a: 1, b: 2})).toBe(2);
		});

		it("Weight counting of an array", function() {
			expect(a$.weight([ 0, 1, 2])).toBe(3);
		});

		it("Weight counting of a string", function() {
			expect(a$.weight("string")).toBe(1);
		});

		it("Weight counting of a number", function() {
			expect(a$.weight(5)).toBe(1);
		});

		it("Awareness for a property", function() {
			expect(a$.aware({ a: 1}, 'a')).toBe(true);
		});

		it("Unawareness for a missing property", function() {
			expect(a$.aware({ a: 1}, 'b')).toBe(false);
		});

		it("Awareness for a method", function() {
			expect(a$.aware([], 'push')).toBe(true);
		});

		it("Ability to invoke a missing method check", function() {
			expect(a$.can({ a: 1}, 'push')).toBe(false);
		});

		it("Ability to invoke an existing method check", function() {
			expect(a$.can([], 'push')).toBe(true);
		});

		it("Ability to call custom method", function() {
			expect(a$.can({ a: 1, push: function () { } }, 'push')).toBe(true);
		});
		
	});

	describe("Agent capabilities: ", function () {
	
		describe("Single skills capabilities", function() {
			var aa =  new (a$(SkillShow))("one");

			it("Custom skill check", function() {
				expect(a$.capable(aa, SkillShow)).toBe(true);
			});

			it("One skill check", function() {
				expect(a$.capable(aa, true, SkillShow)).toBe(true);
			});

			it("Two skills complete check", function() {
				expect(a$.capable(aa, true, SkillShow, SkillChange)).toBe(false);
			});

			it("Two skills partial check", function() {
				expect(a$.capable(aa, false, SkillShow, SkillChange)).toBe(true);
			});

			it("Awareness of methods", function() {
				expect(a$.can(aa, "show")).toBe(true);
				expect(a$.can(aa, "change")).toBe(false);
			});
		});
	
		describe("Dual skills capabilities", function() {
			var aa =  new (a$(SkillShow, SkillChange))("one");

			it("Separate skill check", function() {
				expect(a$.capable(aa, SkillShow)).toBe(true);
				expect(a$.capable(aa, SkillChange)).toBe(true);
			});

			it("All skills check", function() {
				expect(a$.capable(aa, true, SkillShow, SkillChange)).toBe(true);
			});

			it("Awareness of combined methods", function() {
				expect(a$.can(aa, "show")).toBe(true);
				expect(a$.can(aa, "change")).toBe(true);
			});

			it("Workability of skills", function() {
				aa.change("two");
				expect(aa.show()).toBe("two");
			});
		});
	});

	describe("Agents grouping", function() {
		var topic =  [ new (a$(SkillShow))("one"), new (a$(SkillChange)), new (a$(SkillShow, SkillChange))("me") ];

		it("Select skilled agensts", function() {
			expect(a$.group(topic, function (a) { return a$.capable(a, SkillShow); }).length).toBe(2);
		});

		it("Existence of group methods", function() {
			expect(a$.group(topic, true, function (a) { return a$.capable(a, SkillShow); }).show).toBeDefined();
		});

		it("Invocation go group method", function() {
			var g = a$.group(topic, true, function (a) { return a$.capable(a, SkillShow); });
			expect(g.show()).toBe("me"); // i.e. the latest one
		});

		it("Invocation of modifying method", function() {
			var g = a$.group(topic, true, function (a) { return a$.capable(a, SkillChange); });
			g.change("our");
			for (var p in g)
				expect(g[p].value).toBe("our");
		});
	});

	describe("Acting and broadcasting", function() {
		var topic =  new (a$(SkillCombined))(1);

		it("Normal call of overriden activity", function() {
			topic.step(2);
			expect(topic.value).toBe(5);
		});

		it("Simple act on an agent", function() {
			topic.value = 1;
			expect(a$.act(topic, SkillShow.prototype.show)).toBe(1);
		});

		it("Constructor act on an agent", function() {
			topic.value = 1; // We need to RESET the value from previous test...
			a$.act(topic, SkillShow, 2);
			expect(topic.show()).toBe(2);
		});

		it("Broadcast to all skills", function() {
			topic.value = 1;
			a$.broadcast(topic, 'step', 2);
			expect(topic.value).toBe(7);
		});
	
		it("Pass to super's activity", function () {
			topic.value = 1;
			a$.pass(topic, SkillCombined, 'step', 2);
			expect(topic.value).toBe(3);
		});
	});
});
