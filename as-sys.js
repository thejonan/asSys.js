(function() {
  var extractProps = function(vals) {
    var props = {}, a, p, keys;
    for (var i = 1, al = arguments.length; i < al; ++i) {
      a = arguments[i];
      keys = Object.keys(a);
      for (var j = 0, kl = keys.length; j < kl; ++j) {
        p = keys[j];
        props[p] = vals ? a[p] : true;
      }
    }
    return props;
  };
  var mergeObjects = function(deep, newonly, i, objects) {
    if (!deep && !newonly && typeof Object.assign === "function") {
      for (;objects[i] == null; ++i) ;
      return Object.assign.apply(Object, i == 0 ? objects : Array.prototype.slice.call(objects, i));
    }
    var obj = objects[i], ol = objects.length, keys, o, p;
    while (++i < ol) {
      o = objects[i];
      if (obj == null) {
        obj = o;
        continue;
      }
      keys = Object.keys(o);
      kl = keys.length;
      for (var j = 0, kl = keys.length; j < kl; ++j) {
        p = keys[j];
        if (!newonly || !obj.hasOwnProperty(p)) obj[p] = !deep || typeof o[p] !== "object" ? o[p] : mergeObjects(deep, newonly, 0, [ typeof obj[p] === "object" ? obj[p] : {}, o[p] ]);
      }
    }
    return obj;
  };
  var twinScan = function(arr, start, callback) {
    var ai, j;
    for (var i = start, al = arr.length; i < al; ++i) {
      ai = arr[i];
      for (j = i + 1; j < al; ++j) {
        if (!callback(ai, arr[j])) return false;
      }
    }
    return true;
  };
  var fnName = function(fn) {
    if (typeof fn !== "function") return null; else if (fn.name !== undefined) return fn.name; else {
      var s = fn.toString().match(/function ([^\(]+)/);
      return s != null ? s[1] : "";
    }
  };
  var asSys = function() {
    var skillmap = {}, missing, nm, skills = Array.prototype.slice.call(arguments, 0), A = function() {
      var agent = this, args = arguments;
      asSys.each(agent.__skills, function(s) {
        s.apply(agent, args);
      });
    };
    for (var i = 0, a; i < skills.length; ++i) {
      a = skills[i];
      if (typeof a === "function" && a.prototype !== undefined) {
        nm = fnName(a);
        if (skillmap[nm] !== undefined) continue;
        if (a.prototype.__expects != null) {
          missing = [ i, 0 ];
          for (var s, j = 0, el = a.prototype.__expects.length; j < el; ++j) {
            s = a.prototype.__expects[j];
            if (skills.indexOf(s) == -1) missing.push(s);
          }
          if (missing.length > 2) {
            Array.prototype.splice.apply(skills, missing);
            --i;
            continue;
          }
        }
        skillmap[nm] = a;
        if (A.prototype === undefined) A.prototype = Object.create(a.prototype); else mergeObjects(true, false, 0, [ A.prototype, a.prototype ]);
      }
    }
    Object.defineProperties(A.prototype, {
      __skills: {
        enumerable: false,
        writable: false,
        value: skillmap
      }
    });
    return A;
  };
  asSys.version = "0.9.0";
  asSys.equal = function(deepCompare) {
    var deep = deepCompare, start = 0;
    if (typeof deep !== "boolean") deep = false; else start = 1;
    return twinScan(arguments, start, function(ai, aj) {
      for (var p in extractProps(false, ai, aj)) {
        if (deep && typeof ai[p] === "object" && typeof aj[p] === "object" && !asSys.equal(deep, ai[p], aj[p])) return false; else if (ai[p] !== aj[p]) return false;
      }
      return true;
    });
  };
  asSys.similar = function(deepCompare) {
    var deep = deepCompare, start = 0;
    if (typeof deep !== "boolean") deep = false; else start = 1;
    return twinScan(arguments, start, function(ai, aj) {
      for (var p in ai) {
        if (deep && typeof ai[p] === "object" && typeof aj[p] === "object" && !asSys.similar(deep, ai[p], aj[p])) return false; else if (aj[p] !== undefined && ai[p] != aj[p]) return false;
      }
      return true;
    });
  };
  asSys.match = function(a, b) {
    if (typeof a === "object" && typeof b === "object") return asSys.similar(a, b); else if (a instanceof RegExp && typeof b === "string") return b.match(a) != null; else if (b instanceof RegExp && typeof a === "string") return a.match(b) != null; else return a == b;
  };
  asSys.extend = function(deep) {
    var d = deep, start = 0;
    if (typeof d !== "boolean") d = false; else start = 1;
    return mergeObjects(d, false, start, arguments);
  };
  asSys.mixin = function(deep) {
    var d = deep, start = 0;
    if (typeof d !== "boolean") d = false; else start = 1;
    return mergeObjects(d, true, start, arguments);
  };
  asSys.filter = function(agent, selector) {
    if (typeof agent.filter === "function") return agent.filter(selector);
    var res = {}, p, keys = Object.keys(agent);
    for (var i = 0, kl = keys.length; i < kl; ++i) {
      p = keys[i];
      if (selector(p, agent)) res[p] = agent[p];
    }
    return res;
  };
  asSys.each = function(agent, actor) {
    if (agent == null) ; else if (typeof agent.forEach === "function") agent.forEach(actor); else {
      var k = Object.keys(agent), p;
      for (var i = 0, kl = k.length; i < kl; ++i) {
        p = k[i];
        actor(agent[p], p, agent);
      }
    }
  };
  asSys.weight = function(agent) {
    if (typeof agent !== "object") return 1; else if (agent.hasOwnProperty("length") && typeof agent.length == "number") return agent.length; else return Object.keys(agent).length;
  };
  asSys.id = function(skill) {
    return typeof skill === "function" ? fnName(skill) : skill.toString();
  };
  asSys.mimic = function(agent) {
    var o = Object.create(Object.getPrototypeOf(agent));
    return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
  };
  asSys.act = function(agent, activity) {
    if (agent != null && typeof activity === "function") {
      return activity.apply(agent, Array.prototype.slice.call(arguments, 2));
    }
  };
  asSys.broadcast = function(agent, activity) {
    var args = Array.prototype.slice.call(arguments, 2);
    asSys.each(agent.__skills, function(s) {
      s.prototype[activity].apply(agent, args);
    });
    return agent;
  };
  asSys.can = function(agent, activity) {
    return typeof agent === "object" && agent[activity] != null && typeof agent[activity] === "function";
  };
  asSys.aware = function(agent, prop) {
    return typeof agent === "object" && agent[prop] !== undefined;
  };
  asSys.capable = function(agent, allskills) {
    var all = allskills, s, i = 1;
    if (typeof all !== "boolean") all = true; else i = 2;
    for (var cnt = 0, start = i, al = arguments.length; i < al; ++i) {
      s = arguments[i];
      if (agent.__skills !== undefined && agent.__skills[fnName(s)] !== undefined) ++cnt; else if (agent instanceof s) ++cnt;
    }
    return cnt > 0 && (all ? arguments.length - start == cnt : true);
  };
  asSys.group = function(pool, full, selector) {
    if (typeof full !== "boolean") {
      selector = full;
      full = false;
    }
    var res = this.mimic(pool), skills = {}, e;
    for (var k in pool) {
      var e = pool[k];
      if (!selector.call(e, e, k, pool)) continue;
      if (full) mergeObjects(false, false, 0, [ skills, extractProps(true, Object.getPrototypeOf(e)) ]);
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
  if (typeof module === "object" && module && typeof module.exports === "object") module.exports = asSys; else {
    this.asSys = this.a$ = asSys;
    if (typeof define === "function" && define.amd) define(asSys);
  }
})();