(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory(require("lodash/core")) : typeof define === "function" && define.amd ? define([ "lodash/core" ], factory) : (global = global || self, 
  global.asSys = factory(global._));
})(this, function(_) {
  "use strict";
  var eachObj = !!_ && typeof _.each === "function" ? _.each : $.each;
  var mergeObjs = !!_ && typeof _.extend === "function" ? _.extend : $.extend;
  var equalObjs = !!_ && typeof _.equal === "function" ? _.equal : function(a, b) {
    if (typeof a !== "object" || typeof b !== "object") return a === b; else {
      var testedProps = {};
      for (var p in a) {
        if (!a.hasOwnProperty(p)) continue;
        if (!b.hasOwnProperty(p) || !equalObjs(a[p], b[p])) return false;
        testedProps[p] = true;
      }
      for (var p in b) {
        if (testedProps[p] || !b.hasOwnProperty(p)) continue;
        if (!a.hasOwnProperty(p) || !equalObjs(a[p], b[p])) return false;
      }
    }
    return true;
  };
  var similarObjs = function(a, b) {
    if (a instanceof RegExp) return typeof b === "string" && b.match(a) != null; else if (b instanceof RegExp) return typeof a === "string" && a.match(b) != null; else if (typeof a !== "object" || typeof b !== "object") return a == b; else for (var p in a) {
      if (!a.hasOwnProperty(p)) continue;
      if (b.hasOwnProperty(p) && !similarObjs(a[p], b[p])) return false;
    }
    return true;
  };
  var multiScan = function(arr, callback) {
    if (arr.length < 2) return true;
    var a0 = arr[0];
    for (var i = 1, al = arr.length; i < al; ++i) if (callback(a0, arr[i]) === false) return false;
    return true;
  };
  var a$ = function() {
    var skillmap = [], expected = null, missing, skills = Array.prototype.slice.call(arguments, 0), A = function() {
      var agent = this, args = arguments;
      if (!agent.__initializing) {
        agent.__initializing = true;
        eachObj(agent.__skills, function(s) {
          s.apply(agent, args);
        });
        delete agent.__initializing;
      }
    };
    for (var i = 0, a; i < skills.length; ++i) {
      a = skills[i];
      if (a == null) throw {
        name: "Missing skill",
        message: "The skill-set liseted [" + a + "] is missing.",
        skill: s
      };
      if (typeof a === "function" && a.prototype !== undefined) {
        if (skillmap.indexOf(a) > -1) continue;
        if (!!a.prototype.__depends) {
          missing = [ i, 0 ];
          for (var s, j = 0, el = a.prototype.__depends.length; j < el; ++j) {
            s = a.prototype.__depends[j];
            if (skills.indexOf(s) == -1) missing.push(s);
          }
          if (missing.length > 2) {
            Array.prototype.splice.apply(skills, missing);
            --i;
            continue;
          }
        }
        if (a.prototype.__expects != null) {
          if (!expected) expected = {};
          for (var j = 0, el = a.prototype.__expects.length; j < el; ++j) expected[a.prototype.__expects[j]] = true;
        }
        skillmap.push(a);
        if (A.prototype === undefined) A.prototype = Object.create(a.prototype); else mergeObjs(A.prototype, a.prototype);
        if (a.prototype.__skills !== undefined) {
          for (var j = 0, ssl = a.prototype.__skills.length, ss; j < ssl; ++j) {
            ss = a.prototype.__skills[j];
            if (skillmap.indexOf(ss) == -1) skillmap.push(ss);
          }
        }
      }
    }
    eachObj(expected, function(v, m) {
      if (!A.prototype[m]) throw {
        name: "Unmatched expectation",
        message: "The expected method [" + m + "] was not found among provided skills.",
        method: m
      };
    });
    Object.defineProperties(A.prototype, {
      __skills: {
        enumerable: false,
        writable: false,
        value: skillmap
      }
    });
    return A;
  };
  a$.VERSION = "1.0.0";
  a$.equal = function() {
    return multiScan(arguments, equalObjs);
  };
  a$.similar = function() {
    return multiScan(arguments, similarObjs);
  };
  a$.common = function(equal) {
    var eq = equal, idx = 0, res = null, argl = arguments.length, extract = function(a, b) {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (res == null) res = [];
        for (var i = 0, al = a.length; i < al; ++i) {
          if (b.indexOf(a[i]) > -1) res.push(a[i]);
        }
      } else {
        if (res == null) res = {};
        for (var p in a) {
          if (b[p] !== undefined && (!eq || a[p] == b[p])) res[p] = a[p];
        }
      }
    };
    if (typeof equal !== "boolean") eq = false; else idx = 1;
    while (++idx < argl) extract(res == null ? arguments[idx - 1] : res, arguments[idx]);
    return res;
  };
  a$.weight = function(agent) {
    if (typeof agent !== "object") return 1; else if (agent.hasOwnProperty("length") && typeof agent.length == "number") return agent.length; else return Object.keys(agent).length;
  };
  a$.clone = function(agent) {
    var o = Object.create(Object.getPrototypeOf(agent));
    try {
      return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
    } catch (e) {}
  };
  a$.escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
  a$.path = function(agent, path, value) {
    if (path == null) return;
    if (!Array.isArray(path)) {
      try {
        var pref = (path[0] != "[" ? "agent." : "agent") + path;
        if (value === undefined) eval("value = " + pref); else eval(pref + " = value");
        return value;
      } catch (e) {
        path = path.split(".");
      }
    }
    for (var i = 0, pl = path.length; i < pl - 1; ++i) agent = agent[path[i]] = agent[path[i]] || {};
    if (value !== undefined) agent[path[i]] = value; else value = agent[path[i]];
    return value;
  };
  a$.act = function(agent, activity) {
    if (agent == null) return;
    if (typeof activity === "string") activity = agent[activity];
    if (typeof activity === "function") {
      return activity.apply(agent, Array.prototype.slice.call(arguments, 2));
    }
  };
  a$.broadcast = function(agent, activity) {
    var args = Array.prototype.slice.call(arguments, 2);
    eachObj(agent.__skills, function(s) {
      if (typeof s.prototype[activity] === "function") s.prototype[activity].apply(agent, args);
    });
    return agent;
  };
  a$.pass = function(agent, skill, activity) {
    var i = agent.__skills && agent.__skills.indexOf(skill), s;
    while (--i >= 0) {
      s = agent.__skills[i];
      if (typeof s.prototype[activity] === "function") return s.prototype[activity].apply(agent, Array.prototype.slice.call(arguments, 3));
    }
  };
  a$.can = function(agent, activity) {
    return typeof agent === "object" && typeof agent[activity] === "function";
  };
  a$.aware = function(agent, prop) {
    return typeof agent === "object" && agent[prop] !== undefined;
  };
  a$.capable = function(agent, allskills) {
    var all = allskills, s, w, proto = Object.getPrototypeOf(agent), i = 1;
    if (typeof all !== "boolean") all = true; else i = 2;
    for (var cnt = 0, start = i, al = arguments.length; i < al; ++i) {
      s = arguments[i];
      if (agent instanceof s) ++cnt; else {
        w = a$.weight(s.prototype);
        if (w > 0 && a$.weight(a$.common(true, proto, s.prototype)) == w) ++cnt;
      }
    }
    return cnt > 0 && (all ? arguments.length - start == cnt : true);
  };
  a$.group = function(pool, full, selector) {
    if (typeof full !== "boolean") {
      selector = full;
      full = false;
    }
    var res = this.clone(pool), skills = {}, e;
    for (var k in pool) {
      var e = pool[k];
      if (!selector.call(e, e, k, pool)) continue;
      if (full) mergeObjs(skills, Object.getPrototypeOf(e));
      res.push(e);
    }
    if (full) {
      var sks = Object.keys(skills), p, props = {};
      for (var i = 0, sl = sks.length; i < sl; ++i) {
        p = sks[i];
        props[p] = {
          enumerable: false,
          writable: false,
          value: typeof skills[p] !== "function" ? skills[p] : function(key) {
            return function() {
              var r = undefined;
              for (var i in this) {
                var o = this[i];
                if (typeof o[key] === "function") r = o[key].apply(o, arguments);
              }
              return r;
            };
          }(p)
        };
      }
      Object.defineProperties(res, props);
    }
    return res;
  };
  return a$;
});