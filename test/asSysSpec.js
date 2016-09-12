var a$ = require("../"),
		_ = require("underscore"),
		customMatchers = {
			toDeepEqual: function (util, customEqualityTesters) {
				return {
					compare: function(actual, expected) {
							return { pass: _.isEqual(actual, expected) };
					}
				}
			}
		};


function SkillShow(a) { this.value = a; };
SkillShow.prototype.show = function () { return this.value; }

function SkillChange() { };
SkillChange.prototype.change = function (a) { this.value = a; }
SkillChange.prototype.step = function (s) { this.value += s; }

function SkillCombined() { };
SkillCombined.prototype.__expects = [ SkillShow, SkillChange ];
SkillCombined.prototype.combine = function (a, b) { this.value = a + b; }
SkillCombined.prototype.step = function (s) { this.value += s * s; }

describe("asSys", function () {
	// prepare the test for dual runs - browser & npm
	beforeEach(function () {
		var jself = typeof this.addMatchers === 'function' ? this : jasmine;
		jself.addMatchers(customMatchers);
	});

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

		it("Respecting the expected skills", function() {
			var o = new (a$(SkillCombined));
			expect(o.show).toBeDefined();
			expect(o.change).toBeDefined();
			expect(o.combine).toBeDefined();
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

	/* #2
	describe("Extending, mixing": function () {

		it("Extend empty object", function() {
			expect(a$.extend({}, {a: 1, b: 2})).toDeepEqual(, { a: 1, b: 2});
		});

		it("Extend from empty with two objects", function() {
			expect.deepEqual(a$.extend({}); {a: 1, b: 2}); { a: 3}), {a: 3, b: 2});
		});

		it("Extend from null", function() {
			expect.deepEqual(a$.extend(null, {a: 1, b: 2}), {a: 1, b: 2});
		});

		it("Extend with an array", function() {
			var o = a$.extend(null, [ 1, 2, 3]);
			expect(o);
			expect.deepEqual(o).toisArray([1, 2, 3]);
		});

		it("Extending an array", function() {
			expect.deepEqual(a$.extend([ 1, 2, 3], [4, 5, 6]), [4, 5, 6 ]);
		});

		it("Extending a deep array", function() {
			expect.deepEqual(a$.extend({ a: [ 1, 2, 3], b: 2}); { a: [4, 5, 6], b: [3, 4] }), { a: [4, 5, 6], b: [3, 4]});
		});
		"Extend from non-empty object": function () {
			expect.deepEqual(a$.extend({_: "" }); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bc: 7}); c: 4});
		});

		it("Extend deep", function() {
			expect.deepEqual(a$.extend(true, {_: "" }); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 3, b: {ba: 5, bb: 6, bc: 7}); c: 4});
		});

		it("Extending with null object", function() {
			expect.deepEqual(a$.extend(null, {a: 1, b: 2 }); null, { b: 3 }), {a: 1, b: 3});
		});

		it("Mixing with two objects", function() {
				expect.deepEqual(a$.mixin({}); {a: 1, b: 2}); { a: 3, c: 4}), {a: 1, b: 2, c: 4});
		});

		it("Mixing with three objects", function() {
			expect.deepEqual(a$.mixin({}); {a: 1, b: 2}); { a: 3}), {a: 1, b: 2});
		});

		it("Mixing with deep object", function() {
			expect.deepEqual(a$.mixin({}); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4}), {a: 1, b: {ba: 5, bb: 6}); c: 4});
		});
		"Mixing a non-empty object": function () {
			expect.deepEqual(a$.mixin({_: "" }); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4}), {_: "", a: 1, b: {ba: 5, bb: 6}); c: 4});
		});
		"Mixing a non-empty with deeper object": function () {
			expect.deepEqual(a$.mixin({_: "" }); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4, b: { ba: 5, bb: 6, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}); c: 4});
		});

		it("Mixing deep", function() {
			expect.deepEqual(a$.mixin(true, {_: "" }); {a: 1, b: { ba: 5, bb: 6} }); { a: 3, c: 4, b: { ba: 5, bc: 7} } ), {_: "", a: 1, b: {ba: 5, bb: 6}); c: 4});
		});

		it("Getting common properties", function() {
			expect.deepEqual(a$.common({ a: 1, b: 2, c: 3}); { b: 2, c: 4, d: 5}), { b: 2, c: 3 });
		});

		it("Getting equal common properties", function() {
			expect.deepEqual(a$.common(true, { a: 1, b: 2, c: 3}); { b: 2, c: 4, d: 5 }), { b: 2 });
		});

		it("Getting commons from an array", function() {
			expect.deepEqual(a$.common([1, 2, 3, 4], [3, 4, 5]), [3, 4]);
		}
	});

	describe("Path based retrieval and manipulation", function() {
		var topic =  { a: 1, b: 2, c: { ca: 3, cb: 4 } });
		o = topic;
		it("Getting a value from a path in an agent", function() {
			expect.equal(a$.path(o, "c.ca"), 3);
		});
		o = topic;
		it("Setting a value with a path", function() {
			a$.path(o, "c.cb", 5);
			expect(o.c.cb).toBe(5);
		});
		o = topic;
		it("Building a path when components are missing", function() {
			a$.path(o, "c.cd", 7);
			expect(o.c.cd).toBe(7);
		});
		o = topic;
		it("Bulding a path from the root of the object", function() {
			a$.path(o, "d.a.aa.aaa", 8);
			expect(o.d).toEqual({ a: { aa: { aaa: 8 } } });
		});
		o = topic;
		it("Passing the path as an array", function() {
			expect.equal(a$.path(o, ['c', 'ca']), 3);
		}
	});

	describe("Equality and similarity", function() {

		it("Simple equal check", function() {
			expect(a).toBe($.equal("0", "0")) ;
		});

		it("Type difference", function() {
			expect(a).not.toBe($.equal({ a: 1, b: 2}); { a: "1", b: 2} ));
		});

		it("Normal equal objects", function() {
			expect(a).toBe($.equal({ a: 1, b: 2}); { a: 1, b: 2} ));      
		});

		it("Equality for unequal but similar objects", function() {
			expect(a).not.toBe($.equal({ a: 1, b: 2}); { a: 1, b: 2, c: 3} ));
		});

		it("Equality in depth", function() {
			expect(a).toBe($.equal(true, { a: 1, b: { ba: "one" } }); { a: 1, b: { ba: "one" } } ));      
		});

		it("Inequality in depth", function() {
			expect(a).not.toBe($.equal(true, { a: 1, b: { ba: "one" } }); { a: 1, b: { ba: "two" } } ));      
		});
		"Inequality in depth, but not in values": function () {
			expect(a).not.toBe($.equal({ a: 1, b: { ba: "one" } }); { a: 1, b: { ba: "one" } } ));      
		});

		it("Equality for simple types", function() {
			expect(a).toBe($.equal("one", "one"));
		});

		it("Inequality for simple types", function() {
			expect(a).not.toBe($.equal("1", 1));
		});

		it("Similarity for unequal but similar objects", function() {
			expect(a).toBe($.similar({ a: 1, b: 2}); { a: 1, b: 2, c: 3} ));
		});

		it("Similarity for object with different value for same property", function() {
			expect(a).not.toBe($.similar({ a: 1, b: 2}); { a: 1, b: 3, c: 3} ));
		});

		it("Similarity between number of its string", function() {
			expect(a).toBe($.similar(1, "1"));
		});

		it("Similarity with regexp", function() {
			expect(a).toBe($.similar("Another test string", /test/));
		});

		it("Weird similarity with regexp", function() {
			expect(a).not.toBe($.similar({ a: "Another test string" }); /test/));
		});

		it("Similarity unmatchable", function() {
			expect(a).not.toBe($.similar(/test/, "Without it"));
		});

		it("Similarity between object in depth", function() {
			expect(a).toBe($.similar(true, {a: 1, b: { ba: "one" }}); { b: { ba: /n/ } }));
		}
	});

	describe("Filtering and enumeration", function() {

		it("Simple iteration on array", function() {
			var sum = 0;
			a$.each([1, 2, 3, 4, 5], function (n) { sum += n; })
			expect(sum).toBe(15);
		});

		it("Simple iteration of an object", function() {
			var sum = 0;
			a$.each({ a: 1, b: 2, c: 3, d: 4, e: 5}); function (v) { sum += v; })
			expect(sum).toBe(15);
		});

		it("Enumerate a plain object", function() {
			var val = null;
			a$.each("one", function (v) { val = v; });
			expect(val).toBe("one");
		});

		it("Filtering an array", function() {
			expect.deepEqual(a$.filter([1, 2, 3, 4, 5], function (n) { return n < 4; }), [1, 2, 3]);
		}); 

		it("Filtering an object", function() {
			expect.deepEqual(a$.filter({ one: 1, two: 2, three: 3, four: 4, five: 5}); function (v, k) { return k.match(/[of]/) && v < 3; }), { one: 1, two: 2 });
		}
	});

	"Agent simple characteristics:": {

		it("Weight counting with simple object", function() {
			expect.equal(a$.weight({ a: 1}), 1);
		});

		it("Weight counting of a bigger object", function() {
			expect.equal(a$.weight({ a: 1, b: 2}), 2);
		});

		it("Weight counting of an array", function() {
			expect.equal(a$.weight([ 0, 1, 2]), 3);
		});

		it("Weight counting of a string", function() {
			expect.equal(a$.weight("string"), 1);
		});

		it("Weight counting of a number", function() {
			expect.equal(a$.weight(5), 1);
		});

		it("Awareness for a property", function() {
			expect(a).toBe($.aware({ a: 1}); 'a'));
		});

		it("Unawareness for a missing property", function() {
			expect(a).not.toBe($.aware({ a: 1}); 'b'));
		});

		it("Awareness for a method", function() {
			expect(a).toBe($.aware([], 'push'));
		});

		it("Ability to invoke a missing method check", function() {
			expect(a).not.toBe($.can({ a: 1}); 'push'));
		});

		it("Ability to invoke an existing method check", function() {
			expect(a).toBe($.can([], 'push'));
		});

		it("Ability to call custom method", function() {
			expect(a).toBe($.can({ a: 1, push: function () { } }); 'push'));
		}
	});

	"Agent capabilities: ": {
		describe("Single skills capabilities", function() {
			var aa =  new (a$(SkillShow))("one"),

			it("Custom skill check", function() {
				expect(a).toBe($.capable(aa, SkillShow));
			});

			it("One skill check", function() {
				expect(a).toBe($.capable(aa, true, SkillShow));
			});

			it("Two skills complete check", function() {
				expect(a).not.toBe($.capable(aa, true, SkillShow, SkillChange));
			});

			it("Two skills partial check", function() {
				expect(a).toBe($.capable(aa, false, SkillShow, SkillChange));
			});

			it("Awareness of methods", function() {
				expect(a).toBe($.can(aa, "show"));
				expect(a).not.toBe($.can(aa, "change"));
			}
		});
	
		describe("Dual skills capabilities", function() {
			var aa =  new (a$(SkillShow, SkillChange))("one"),

			it("Separate skill check", function() {
				expect(a).toBe($.capable(aa, SkillShow));
				expect(a).toBe($.capable(aa, SkillChange));
			});

			it("All skills check", function() {
				expect(a).toBe($.capable(aa, true, SkillShow, SkillChange));
			});

			it("Awareness of combined methods", function() {
				expect(a).toBe($.can(aa, "show"));
				expect(a).toBe($.can(aa, "change"));
			});

			it("Workability of skills", function() {
				aa.change("two");
				expect(aa.show()).toBe("two");
			}
		}
	});
	describe("Agents grouping", function() {
		var topic =  [ new (a$(SkillShow))("one"), new (a$(SkillChange)), new (a$(SkillShow, SkillChange))("me") ],

		it("Select skilled agensts", function() {
			expect.equal(a$.group(topic, function (a) { return a$.capable(a, SkillShow); }).length, 2);
		});

		it("Existence of group methods", function() {
			expect.isDefined(a$.group(topic, true, function (a) { return a$.capable(a, SkillShow); }).show);
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
		}
	});

	describe("Acting and broadcasting", function() {
		var topic =  new (a$(SkillCombined))(1),

		it("Normal call of overriden activity", function() {
			topic.step(2);
			expect(a.value).toBe(5);
		});

		it("Simple act on an agent", function() {
			topic.value = 1;
			expect.equal(a$.act(a, SkillShow.prototype.show), 1);
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
	
	*/
});
