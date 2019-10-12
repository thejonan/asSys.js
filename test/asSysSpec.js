var _ = require("lodash"),
	benchmark = require("benchmark"),
	a$ = require("../");

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

// Now - GO with the tests.
describe("asSys", function () {
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

		it("Cloning a native type", function() {
			expect(Array.isArray(a$.clone([]))).toBe(true);
		});

		it("Emptiness of cloned object", function() {
			expect(a$.clone([1, 2, 3]).length).toBe(0);
			expect(a$.clone(topic).value).toBeUndefined();
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
  			var o = new (a$("NonExistentSkill"));
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

	describe("Working with (deep) properties", function () {

		it ("Setups properly", function () {
			expect(a$.setup({ a: 1, b: 2}, {b: 3, c: 5 })).toEqual({ a: 1, b: 3 });
		});

		it ("Endures setup with undefined", function () {
			expect(a$.setup({ a: 1, b: 2}, undefined)).toEqual({ a: 1, b: 2 });
		});

		it ("Makes a deep copy during setup", function () {
			var src = { inner: { b: 3, c: 5 } },
				target = a$.setup({ a: 1, inner: { b: 2 } }, src);

			src.inner.b = 4;
			expect(target).toEqual({ a: 1, inner: { b: 3 } });
		});

		it("Getting common properties", function() {
			expect(a$.common({ a: 1, b: 2, c: 3},  { b: 2, c: 4, d: 5 })).toEqual({ b: 2, c: 3 });
		});

		it("Getting equal common properties", function() {
			expect(a$.common(true, { a: 1, b: 2, c: 3}, { b: 2, c: 4, d: 5 })).toEqual({ b: 2 });
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
			expect(a$.equal({ a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "one" } } )).toBe(true);
		});

		it("Inequality in depth", function() {
			expect(a$.equal({ a: 1, b: { ba: "one" } }, { a: 1, b: { ba: "two" } } )).toBe(false);
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
			expect(a$.similar({a: 1, b: { ba: "one" } }, { b: { ba: /n/ } })).toBe(true);
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

		describe("Generic object capabilities", function () {
			it("Normally allocated object capabilities", function () {
				var aa = new SkillShow("one");

				expect(a$.capable(aa, SkillShow)).toBe(true);
				expect(a$.capable(aa, SkillChange)).toBe(false);
			});

			it("Manually assembled object capabilities", function () {
				var aa = _.extend({}, SkillShow.prototype, SkillChange.prototype);

				expect(a$.capable(aa, SkillChange)).toBe(true);
				expect(a$.capable(aa, SkillCombined)).toBe(false);
			});
		});
	});

	describe("Agents grouping", function() {
		it("Select skilled agensts", function() {
			var gr =  [
				new (a$(SkillShow))("one"), 
				new (a$(SkillChange)), 
				new (a$(SkillShow, SkillChange))("me") ];

			expect(a$.group(gr, function (a) { return a$.capable(a, SkillShow); }).length).toBe(2);
		});

		it("Existence of group methods", function() {
			var gr =  [
				new (a$(SkillShow))("one"), 
				new (a$(SkillChange)), 
				new (a$(SkillShow, SkillChange))("me") 
			];

			expect(a$.group(gr, true, function (a) { return a$.capable(a, SkillShow); }).show).toBeDefined();
		});

		it("Invocation go group method", function() {
			var gr = a$.group([
					new (a$(SkillShow))("one"), 
					new (a$(SkillChange)), 
					new (a$(SkillShow, SkillChange))("me")], 
				true, 
				function (a) { return a$.capable(a, SkillShow); });
			expect(gr.length).toBe(2);
			expect(gr.show()).toBe("me"); // i.e. the latest one
		});

		it("Invocation of modifying method", function() {
			var gr = a$.group([
					new (a$(SkillShow))("one"), 
					new (a$(SkillChange)), 
					new (a$(SkillShow, SkillChange))("me") ], 
				true, 
				function (a) { return a$.capable(a, SkillChange); }
			);
			expect(gr.length).toBe(2);
			gr.change("our");
			for (var p in gr)
				expect(gr[p].value).toBe("our");
		});
	});

	describe("Acting and broadcasting", function() {
		it("Normal call of overriden activity", function() {
			var o =  new (a$(SkillCombined))(1);
			o.step(2);
			expect(o.value).toBe(5);
		});

		it("Simple act on an agent", function() {
			var o =  new (a$(SkillCombined))(1);
			expect(a$.act(o, SkillShow.prototype.show)).toBe(1);
		});

		it("String method acting", function() {
			var o =  new (a$(SkillCombined))(1);
			expect(a$.act(o, "show")).toBe(1);
		});

		it("Constructor act on an agent", function() {
			var o =  new (a$(SkillCombined))(1);
			a$.act(o, SkillShow, 2);
			expect(o.show()).toBe(2);
		});

		it("Broadcast to all skills", function() {
			var o =  new (a$(SkillCombined))(1);
			a$.broadcast(o, 'step', 2);
			expect(o.value).toBe(7);
		});
	
		it("Pass to super's activity", function () {
			var o =  new (a$(SkillCombined))(1);
			a$.pass(o, SkillCombined, 'step', 2);
			expect(o.value).toBe(3);
		});
	});

	describe("Performance testing", function () {
		var benchOpts = {async: true, maxTime: 2},
			aSingle = a$(SkillShow),
			aDouble = a$(SkillShow, SkillChange),
			aQuad = a$(SkillShow, SkillChange, SkillCombined, SkillDemanding),
			reportFn = function () { 
				console.log(this.name + 
					": speed " + benchmark.formatNumber(Math.round(this.hz)) + 
					"Hz (total of " + this.count + 
					" executions)"); 
			};

		benchmark("Single skill a$ allocation", function () { new aSingle("a");})
			.on("complete", reportFn)
			.run(benchOpts);

		benchmark("Single skill standard allocation", function () { new SkillShow("a"); })
			.on("complete", reportFn)
			.run(benchOpts);

		benchmark("Double skill a$ allocation", function () { new aDouble("a"); })
			.on("complete", reportFn)
			.run(benchOpts);

		benchmark("Double skill extend allocation", function () {
				var a = _.extend({}, SkillShow.prototype, SkillChange.prototype);
				SkillShow.call(a, "a");
				SkillChange.call(a, "a");
			})
			.on("complete", reportFn)
			.run(benchOpts);

		benchmark("Quad skill a$ allocation", function () { new aQuad("a"); })
			.on("complete", reportFn)
			.run(benchOpts);

		benchmark("Quad skill extend allocation", function () {
				var a = _.extend({}, SkillShow.prototype, SkillChange.prototype, SkillCombined.prototype, SkillDemanding.prototype);
				SkillShow.call(a, "a");
				SkillChange.call(a, "a");
				SkillChange.call(a, "a");
				SkillDemanding.call(a, "a");
			})
			.on("complete", reportFn)
			.run(benchOpts);
	});
});
