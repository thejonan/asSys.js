/**
 * asSys.js - an Agent-Skills (a.k.a. Entity-Component) system for JavaScript
 * https://github.com/thejonan/a$.js
 * © 2017-2019 Ivan (Jonan) Georgiev
 * a$ may be freely distributed under the MIT license.
 */

 import _ from "lodash/core";
 
/** 
  * An actual `each` worker taken from either lodash (preferrably) or jQuery
  * */
var eachObj = !!_ && typeof _.each === 'function' ? _.each : $.each;

/** 
  * An actual `extend` worker taken either from lodash or jQuery.
  * */
var mergeObjs = !!_ && typeof _.extend === 'function' ? _.extend : $.extend;

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
var multiScan = function(arr, callback) {
  if (arr.length < 2)
    return true;
  
    var a0 = arr[0];
      
  for (var i = 1, al = arr.length; i < al; ++i)
    if (callback(a0, arr[i]) === false)
      return false;
  
  return true;
};

/** Create a new type of agents, that is capable of given set of skills.
  * @param {} ... A set of skills desired.
  * @description Complexity: o(<required skills>)
  */
var a$ = function () {
  var skillmap = [],
      expected = null,
      missing,
      skills = Array.prototype.slice.call(arguments, 0),
      A = function () {
        var agent = this,
            args = arguments;
            
        if (!agent.__initializing) {
          agent.__initializing = true;
          eachObj(agent.__skills, function (s) { s.apply(agent, args); });
          delete agent.__initializing;
        }
      };
      
  // NOTE: skills.length needs to be obtained everytime, because it may change.
  for (var i = 0, a; i < skills.length; ++i) {
    a = skills[i];
    
    if (a == null)
      throw { 
        name: "Missing skill", 
        message: "The skill-set liseted [" + a + "] is missing.",
        skill: s 
      };

    // We've come to a skill reference.
    if (typeof a === 'function' && a.prototype !== undefined) {
      if (skillmap.indexOf(a) > -1)
        continue;
        
      // If it has dependencies
      if (!!a.prototype.__depends) {
        missing = [i, 0];
        for (var s, j = 0, el = a.prototype.__depends.length; j < el; ++j) {
          s = a.prototype.__depends[j];
          if (skills.indexOf(s) == -1)
            missing.push(s);
        }
        
        // If we've found missing skills - we insert them right at the current position,
        // rollback the index increment and go forward.
        if (missing.length > 2) {
          Array.prototype.splice.apply(skills, missing);
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
      if (A.prototype === undefined)
        A.prototype = Object.create(a.prototype);
      else
        mergeObjs(A.prototype, a.prototype);
        
      if (a.prototype.__skills !== undefined) {
        for (var j = 0, ssl = a.prototype.__skills.length, ss; j < ssl; ++j ) {
          ss = a.prototype.__skills[j];
          if (skillmap.indexOf(ss) == -1)
            skillmap.push(ss);
        }
      }
    }
  }
  
  // Now check whether the prototype built has all the expected methods
  eachObj(expected, function (v, m) {
    if (!A.prototype[m])
      throw { 
        name: "Unmatched expectation", 
        message: "The expected method [" + m + "] was not found among provided skills.",
        method: m 
      };
  });
  
  Object.defineProperties(A.prototype, { __skills: { enumerable: false, writable: false, value: skillmap } });
  return A;
};

// The current version. Keep it this way - packaging script will put package.json's derived value here.
a$.VERSION = "{{VERSION}}";

/** 
  * Compare if two objects are completely equal, i.e. each property has the same value.
  * @param {object} ... The objects to be scanned and compared
  * @description Complexity: o(<number of object> ^ 2 * <number of properties>).
  */
a$.equal = function (/* objects */) {
  return multiScan(arguments, equalObjs);
};
  
/** 
  * Compare if two objects are similar, i.e. if existing properties match
  * @param {object} ... The objects to be scanned and compared
  * @description Complexity: o(<number of object> ^ 2 * <number of properties>).
  */
a$.similar = function (/*,objects */) {
  return multiScan(arguments, similarObjs);
};

/** Extract the properties which are common for all arguments. All enumerable
  * properties of an object are taken into account - own and prototype-deriven.
  *
  * Complexity: o(<number of object> * <number of properties>).
  */
a$.common = function (equal /*objects */) {
  var eq = equal,
      idx = 0,
      res = null,
      argl = arguments.length,
      extract = function (a, b) {
        // As always, arrays need special treatment...
        if (Array.isArray(a) && Array.isArray(b)) {
          if (res == null)
            res = [];
          
          for (var i = 0, al = a.length; i < al; ++i) {
            if (b.indexOf(a[i]) > -1)
              res.push(a[i]);
          }
        }
        else {
          if (res == null)
            res = {};
          for (var p in a) {
            if (b[p] !== undefined && (!eq || a[p] == b[p]))
              res[p] = a[p];
          }
        }
      };
  if (typeof equal !== 'boolean')
    eq = false;
  else
    idx = 1;
    
  while(++idx < argl)
    extract(res == null ? arguments[idx - 1] : res, arguments[idx]);
  
  return res;
};

/** Calculates the number of properties in the agent. 
  * If `length` property exists and is a number, it is returned. 
  * Non objects are considered to weight 1.
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
a$.clone = function (agent /*, arguments */) {
  var o = Object.create(Object.getPrototypeOf(agent));
  try {
    return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
  }
  catch (e) {
  }
  // Yes, otherwise we return `undefined` - fair enough
};

/** Escape a string to be used as a RegExp definition
  */
a$.escapeRegExp = function (str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
  
/** Gets or sets the value at the agent, following the given path.
  * If we're setting the value, the missing component along the way
  * will be created.
  */
  
a$.path = function (agent, path, value) {
  if (path == null)
    return;
    
  if (!Array.isArray(path)) {
    try {
      var pref = (path[0] != '[' ? "agent." : "agent") + path;
        
      if (value === undefined)
        eval("value = " + pref);
      else
        eval(pref + " = value");
        
      return value;
    }
    catch(e) { 
      path = path.split("."); 
    }
  }
    
  for (var i = 0, pl = path.length; i < pl - 1; ++i)
    agent = agent[path[i]] = agent[path[i]] || {};

  if (value !== undefined)
    agent[path[i]] = value;
  else
    value = agent[path[i]];
  
  return value;
};

/** Performs a specific method from a skill, onto the given agent.
  * Complexity: o(1)
  */
a$.act = function (agent, activity /*, arguments */) {
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
a$.broadcast = function (agent, activity /*, arguments */) {
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
  * [1] If this is _our_ the `__skills` property is used.
  * [2] If this is general object - it's properties are scanned.
  * Complexity: [1] o(<number of skills>),
  *             [2] o(<number of skills> * <number of properties>)
  */
a$.capable = function (agent, allskills /* skills */) {
  var all = allskills, s, w,
      proto = Object.getPrototypeOf(agent),
      i = 1;
  if (typeof all !== 'boolean')
    all = true;
  else
    i = 2;

  for (var cnt = 0, start = i, al = arguments.length; i < al; ++i) {
    s = arguments[i];
    
    // We try to go the cheap way...
    if (agent instanceof s)
      ++cnt;
    // ... but we eventually may need to go the universal way.
    else {
      w = a$.weight(s.prototype);
      if (w > 0 && a$.weight(a$.common(true, proto, s.prototype)) == w)
        ++cnt;
    }
  }

  return cnt > 0 && (all ? (arguments.length - start) == cnt : true);
};

/** Groups agents from given pool, according to given selector.
  * The returned group is an object with the same properties as the given pool.
  * If `full` is set - the returned pool also has accumulative skills, i.e.
  * methods, which invoke the corresponding methods of the containing agents.
  *
  * @description Complexity: o(<number of agents in the pool> * (<complexity of selector> + <number of properties>))
  */
a$.group = function (pool, full, selector) {
  if (typeof full !== 'boolean') {
    selector = full;
    full = false;
  }
  
  var res = this.clone(pool), 
      skills = {}, 
      e;
      
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
    var sks = Object.keys(skills), p, props = {};
    for (var i = 0, sl = sks.length; i < sl; ++i) {
      p = sks[i];
      props[p] = { enumerable: false, writable: false, value:typeof skills[p] !== 'function' ? 
        skills[p] : 
        (function (key) { 
          return function () {
            var r = undefined;
            for (var i in this) {
              var o = this[i];
              if (typeof o[key] === 'function')
                r = o[key].apply(o, arguments);
            }
            
            return r;
          }
        })(p) };
    }
    
    Object.defineProperties(res, props);
  }
  
  return res;
};

export default a$;