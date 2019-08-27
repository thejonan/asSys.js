/**
 * asSys.js - an Agent-Skills (a.k.a. Entity-Component) system for JavaScript
 * https://github.com/thejonan/asSys.js
 * © 2017-2019 Ivan (Jonan) Georgiev
 * asSys may be freely distributed under the MIT license.
 */

import _ from "lodash/core";

/** 
 * An actual `each` worker taken from either lodash (preferrably) or jQuery
 */
var eachObj = !!_ && typeof _.each === 'function' ? _.each : $.each;

/** 
 * An actual `extend` worker taken either from lodash or jQuery.
 */
var mergeObjs = !!_ && typeof _.assignIn === 'function' ? _.assignIn : $.extend;

/**
 * An actual `equal` object comparer working for two - either from undescore or own.
 */
var equalObjs = !!_ && typeof _.equal === 'function' ? _.equal : function (a, b) {
	if (typeof a !== 'object' || typeof b !== 'object')
		return a === b;
	else {
		var testedProps = {};
		for (var p in a) {
			if (!a.hasOwnProperty(p))
				continue;
			if (!b.hasOwnProperty(p) || !equalObjs(a[p], b[p]))
				return false;
			testedProps[p] = true;
		}
		for (var p in b) {
			if (testedProps[p] || !b.hasOwnProperty(p))
				continue;
			if (!a.hasOwnProperty(p) || !equalObjs(a[p], b[p]))
				return false;
		}
	}

	return true;
};

/**
 * An internal function checking if two objects are similar, taking into account RegEx's
 * for mutual matching, string, etc.
 */
var similarObjs = function (a, b) {
	if (a instanceof RegExp)
		return (typeof b === 'string') && b.match(a) != null;
	else if (b instanceof RegExp)
		return (typeof a === 'string') && a.match(b) != null;
	else if (typeof a !== 'object' || typeof b !== 'object')
		return a == b;
	else for (var p in a) {
		if (!a.hasOwnProperty(p))
			continue;
		if (b.hasOwnProperty(p) && !similarObjs(a[p], b[p]))
			return false;
	}

	return true;
}

/**
 * An internal function used for comparing objects.
 * @param {} arr The array of objects to be compared with each other.
 * @param {*} callback The callback to be invoked with each pair.
 */
var multiScan = function (arr, callback) {
	if (arr.length < 2)
		return true;

	var a0 = arr[0];

	for (var i = 1, al = arr.length; i < al; ++i)
		if (callback(a0, arr[i]) === false)
			return false;

	return true;
};

/**
 * An internal function for obtaining the function (or other object) name, even in IE.
 * @param {function|any} fn The function which name needs obtaining.
 */
var fnName = function (fn) {
	if (!fn)
		return undefined;
	if (typeof fn !== 'function')
		return fn.toString();
	else if (fn.name !== undefined)
		return fn.name;
	else {
		var s = fn.toString().match(/function ([^\(]+)/);
		return s != null ? s[1] : "";
	}
};

/** Create a new type of agents, that is capable of given set of skills.
 * @param {functions|strings} ... A set of skills desired.
 * @description Complexity: o(<required skills> * <avg. number of dependencies>)
 */
var a$ = function () {
	var skillmap = [], // must be an arr, cause new skills obtained from dependencies are added.
		growingArgs,
		expected = null,
		skills = Array.prototype.slice.call(arguments, 0);

	// What will become the actual prototype
	var A = function () {
		var skills = this.__skills;

		if (!this.__initializing) {
			this.__initializing = true;
			for (var i = 0, sl = skills.length; i < sl; ++i)
				skills[i].apply(this, arguments);
			delete this.__initializing;
		}
	};

	// NOTE: skills.length needs to be obtained everytime, because it may change.
	for (var i = 0, a; i < skills.length; ++i) {
		a = skills[i];

		// We've come to a skill reference, check if it was alredy taken care of -
		// can happen easily from the dependencies maps.
		if (skillmap.indexOf(a) > -1)
			continue;
		if (typeof a !== 'function' || !a.prototype)
			throw {
				name: "Missing skill",
				message: "The skill-set liseted [" + fnName(a) + "] is missing.",
				skill: s
			};
		// We have a valid skill now, to work with!
		// If it has dependencies
		if (!!a.prototype.__depends) {
			growingArgs = [i, 0]; // The first two arguments for the `splice` call.
			for (var s, j = 0, el = a.prototype.__depends.length; j < el; ++j) {
				s = a.prototype.__depends[j];
				if (skills.indexOf(s) == -1)
					growingArgs.push(s);
			}

			// If we've found missing skills - we insert them right at the current position,
			// rollback the index increment and restart skill adding from here.
			if (growingArgs.length > 2) {
				Array.prototype.splice.apply(skills, growingArgs);
				--i;
				continue;
			}
		}

		// Or it has expectations
		if (a.prototype.__expects != null) {
			if (!expected)
				expected = {};
			for (var j = 0, el = a.prototype.__expects.length; j < el; ++j)
				expected[a.prototype.__expects[j]] = true;
		}

		// Ok, we don't have dependencies that are not met - merge the prototypes
		// Invoke the initialization for it and add this skill to agent's.
		skillmap.push(a);
		A.prototype = (A.prototype === undefined) ?
			Object.create(a.prototype) :
			mergeObjs(A.prototype, a.prototype);

		// When the added skill is already built this way, its `prototype` does
		// contain the functions from the building sub-skills.
		if (a.prototype.__skills !== undefined) {
			for (var j = 0, ssl = a.prototype.__skills.length, ss; j < ssl; ++j) {
				ss = a.prototype.__skills[j];
				if (skillmap.indexOf(ss) == -1)
					skillmap.push(ss);
			}
		}
	}

	// Now check whether the prototype just built has all the expected methods
	if (!!expected) {
		eachObj(expected, function (v, m) {
			if (!A.prototype[m])
				throw {
					name: "Unmatched expectation",
					message: "The expected method [" + m + "] was not found among provided skills.",
					method: m
				};
		});
	}

	// Setup this new, important property `_skills` inside A.prototype and we're ready!
	Object.defineProperties(A.prototype, {
		__skills: {
			enumerable: false,
			writable: false,
			value: skillmap
		}
	});
	return A;
};

// The current version. Keep it this way - packaging script will put package.json's derived value here.
a$.VERSION = "{{VERSION}}";

/** 
 * Compare if two objects are completely equal, i.e. each property has the same value.
 * @param {object} ... The objects to be scanned and compared
 * @description Complexity: o(<number of object> * <number of properties>).
 */
a$.equal = function ( /* objects */ ) {
	return multiScan(arguments, equalObjs);
};

/** 
 * Compare if two objects are similar, i.e. if existing properties match
 * @param {object} ... The objects to be scanned and compared
 * @description Complexity: o(<number of object> * <number of properties>).
 */
a$.similar = function ( /*,objects */ ) {
	return multiScan(arguments, similarObjs);
};

/**
 * Gets the title of the method, working safely even for IE. Works on non-functions as well.
 * @param {function|any} fn The function/object to get the name of.
 * @returns {string} The ontained name.
 */
a$.title = fnName;

/** Extract the properties which are common for all arguments. All enumerable
 * properties of an object are taken into account - own and prototype-deriven.
 *
 * Complexity: o(<number of object> + <number of properties>).
 */
a$.common = function (equal /*objects */ ) {
	var keyCnt = {},
		keyVal = {},
		res = {},
		ia = 0,
		argsCnt = arguments.length;

	// Align with the actual arguments.
	if (typeof equal === 'boolean')
		ia = 1;

	// Iterate over all passed objects and count and build a map 
	// of all their properties.
	for (var a; ia < argsCnt; ++ia) {
		a = arguments[ia];

		// go over all of its properties.
		for (var p in a) {
			// The first entry.
			if (keyCnt[p] === undefined) {
				keyCnt[p] = 1;
				keyVal[p] = a[p];
			}
			else if (equal !== true || keyVal[p] === a[p])
				++keyCnt[p];
		}
	}

	// We need to clarify what are we checking against. Just here
	// in order to have the variable for use in the previous loop.
	if (typeof equal === 'boolean')
		--argsCnt;

	// Now - iterate over the mapped properties and
	for (var p in keyCnt)
		if (keyCnt[p] == argsCnt)
			res[p] = keyVal[p];
	
	return res;
};

/** Calculates the number of properties in the agent. 
 * If `length` property exists and is a number, it is returned. 
 * None objects are considered to be of weight 1.
 * 
 * @param {object} agent The object to be investigated.
 * @returns {int} The number of properties in that object.
 * @description Complexity: o(1).
 */
a$.weight = function (agent) {
	if (typeof agent !== 'object')
		return 1;
	else if (agent.hasOwnProperty('length') && typeof agent.length == 'number')
		return agent.length;
	else
		return Object.keys(agent).length;
};

/**
 * Copies all the skills from the given agent, into a new, blank one,  
 * @param {object} agent The agent to be copied
 * @return {object} a new object with the same set of skills.
 * @description Complexity: o(1);
 */
a$.clone = function (agent /*, arguments */ ) {
	var o = Object.create(Object.getPrototypeOf(agent));
	try {
		return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
	} catch (e) {}
	// Yes, otherwise we return `undefined` - fair enough
};

/** Escape a string to be used as a RegExp definition
 */
a$.escapeRegExp = function (str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

/** Performs a specific method from a skill, onto the given agent.
 * Complexity: o(1)
 */
a$.act = function (agent, activity /*, arguments */ ) {
	if (agent == null)
		return;
	if (typeof activity === 'string')
		activity = agent[activity];
	if (typeof activity === 'function') {
		return activity.apply(agent, Array.prototype.slice.call(arguments, 2));
	}
};

/** Invokes same activity on all skills of the agent.
 * Complexity: o(1)
 */
a$.broadcast = function (agent, activity /*, arguments */ ) {
	var args = Array.prototype.slice.call(arguments, 2);

	eachObj(agent.__skills, function (s) {
		if (typeof s.prototype[activity] === 'function')
			s.prototype[activity].apply(agent, args);
	});
	return agent;
};

/** Call the activity on the first skill containing it _before_
 * the given one, i.e. - the activity which most probably was
 * overriden by the given one.
 */
a$.pass = function (agent, skill, activity) {
	var i = agent.__skills && agent.__skills.indexOf(skill),
		s;

	while (--i >= 0) {
		s = agent.__skills[i];
		if (typeof s.prototype[activity] === 'function')
			return s.prototype[activity].apply(agent, Array.prototype.slice.call(arguments, 3));
	}
};

/** Tells whether given agent can perform specific activity.
 */
a$.can = function (agent, activity) {
	return (typeof agent === 'object') &&
		(typeof agent[activity] === 'function');
};

/** Tells whether tiven agent is aware of given property (activity or value)
 */
a$.aware = function (agent, prop) {
	return (typeof agent === 'object') &&
		agent[prop] !== undefined;
};

/** Tells whether given agent is capable for given set of skills.
 * [1] If this is a normal (single skill) agent - use `instanceOf`.
 * [2] If this is _our_ agent, the `__skills` property is used.
 * [3] If this is a general object - it's properties are scanned.
 * Complexity: [1] & [2] o(<number of skills>),
 *             [2] o(<number of skills> * <number of properties>)
 */
a$.capable = function (agent, all /*, ... skills*/ ) {
	var proto = Object.getPrototypeOf(agent), 
		cnt, firstIdx = 1;
	
	if (typeof all === 'boolean')
		firstIdx = 2;

	for (var s, cnt = 0, i = firstIdx, alen = arguments.length; i < alen; ++i) {
		s = arguments[i];

		// We try to go the cheap way... [1]
		if (agent instanceof s)
			++cnt;
		else if (!Array.isArray(proto.__skills)) {
			// ... but we eventually may need to go the universal way. [3]
			var w = a$.weight(s.prototype);
			if (w > 0 && a$.weight(a$.common(true, agent, s.prototype)) == w)
				++cnt;
		}
		else if (proto.__skills.indexOf(s) > -1)
			++cnt; // Or, this guy is ours [2].
	}

	return cnt > 0 && (all !== true || (arguments.length - firstIdx) == cnt);
};

/** Groups agents from given pool, according to given selector.
 * The returned group is an object with the same properties as the given pool.
 * If `full` is set - the returned pool also has accumulative skills, i.e.
 * methods, which invoke the corresponding methods of the containing agents.
 * @param {array} pool An array of agents to be grouped.
 * @param {boolean} full Whether to make the resulting array behave like agent - i.e. have corresponding methods.
 * @param {function} selector The filtering function for the pool.
 * @returns {array} An array of all filtered agents, potentially also having non-enumerable function properties
 * for group invocation of the methods of the containing agents.
 *
 * @description Complexity: o(<number of agents in the pool> * (<complexity of selector> + <number of properties>))
 */
a$.group = function (pool, full, selector) {
	var res = this.clone(pool),
		skills = {}, e;

	if (typeof full !== 'boolean') {
		selector = full;
		full = false;
	}

	for (var k in pool) {
		var e = pool[k];
		if (!selector.call(e, e, k, pool))
			continue;

		// Get this done, only if we're interested to use it afterwards...
		if (full)
			mergeObjs(skills, Object.getPrototypeOf(e));

		res.push(e);
	}

	if (full) {
		// Now make the pool itself performs the skills that are present in the
		// containing objects, by creating new functions
		var sks = Object.keys(skills),
			p, props = {};
		for (var i = 0, sl = sks.length; i < sl; ++i) {
			p = sks[i];
			props[p] = {
				enumerable: false,
				writable: false,
				value: typeof skills[p] !== 'function' 
					? skills[p] 
					: (function (key) {
						return function () {
							var r = undefined;
							for (var i in this) {
								var o = this[i];
								if (typeof o[key] === 'function')
									r = o[key].apply(o, arguments);
							}

							return r;
						}
					})(p)
			};
		}

		Object.defineProperties(res, props);
	}

	return res;
};

export default a$;