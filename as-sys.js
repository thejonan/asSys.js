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
  var fnOnly = function(key, agent) {
    return agent && typeof agent[key] === "function";
  };
  var asSys = function() {
    var cls = function() {}, skillmap = {}, missing, obj, args = [], skills = Array.prototype.slice.call(arguments, 0);
    for (var i = 0, a; i < skills.length; ++i) {
      a = skills[i];
      if (typeof a === "function") {
        if (a.__expects != null) {
          missing = [ i, 0 ];
          for (var s, j = 0, el = a.__expects.length; j < el; ++j) {
            s = a.__expects[j];
            if (skillmap[s] !== undefined) missing.push(s);
          }
          if (missing.length > 2) {
            Array.prototype.splice.apply(skills, missing);
            --i;
            continue;
          }
        }
        skillmap[fnName(a)] = a;
        if (cls.prototype === undefined) cls.prototype = Object.create(a.prototype); else mergeObjects(true, false, 0, [ cls.prototype, a.prototype ]);
      } else args.push(a);
    }
    Object.defineProperties(cls.prototype, {
      __skills: {
        enumerable: false,
        writable: false,
        value: skillmap
      }
    });
    obj = new cls();
    if (args.length > 0) {
      args.unshift(obj);
      asSys.init.apply(this, args);
    }
    return obj;
  };
  asSys.version = "{{VERSION}}";
  asSys.init = function(agent) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (agent.__skills === undefined) return agent.prototype.apply(agent, args) || agent;
    var skills = Object.keys(agent.__skills), s;
    for (var i = 0, sl = skills.length; i < sl; ++i) {
      s = agent.__skills[skills[i]];
      s.apply(agent, args);
    }
    return agent;
  };
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
        if (deep && typeof ai[p] === "object" && typeof aj[p] === "object" && !asSys.similar(deep, ai[p], aj[p])) return false; else if (aj[p] !== undefined && ai[p] !== aj[p]) return false;
      }
      return true;
    });
  };
  asSys.extend = function(deep) {
    var d = deep, start = 0;
    if (typeof d !== "boolean") d = false; else start = 1;
    return mergeObjects(d, false, start, arguments);
  };
  asSys.enhance = function(deep) {
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
    if (typeof agent.forEach === "function") agent.forEach(actor); else {
      var k = Object.keys(p), p;
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
    return fnName(skill);
  };
  asSys.mimic = function(agent) {
    var o = Object.create(Object.getPrototypeOf(agent));
    if (arguments.length > 1) {
      agent = o;
      asSys.init.apply(this, arguments);
    }
    return o;
  };
  asSys.act = function(self, skill, activity) {
    return skill.prototype[activity].apply(self, Array.prototype.slice.call(arguments, 3));
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
      if (agent.__skills !== undefined && agent.__skills[fnName(s)]) ++cnt; else if (s.prototype.isPrototypeOf(agent)) ++cnt;
    }
    return cnt > 0 && (all ? arguments.length - start == cnt : true);
  };
  asSys.group = function(full, pool, selector) {
    if (typeof full !== "boolean") {
      selector = pool;
      pool = full;
      full = false;
    }
    var res = this.mimic(pool), protos = {}, e;
    for (var k in pool) {
      var e = pool[k];
      if (!selector.call(e, e, k, pool)) continue;
      if (full) mergeObjects(false, true, 0, [ protos, extractProps(true, asSys.filter(e, fnOnly)) ]);
      res.push(e);
    }
    if (full) {
      for (var p in protos) {
        if (typeof protos[p] !== "function") continue;
        res[p] = function(key) {
          return function() {
            for (var i in this) {
              var o = this[i];
              if (typeof o[key] === "function") o[key].apply(o, arguments);
            }
          };
        }(p);
      }
    }
    return res;
  };
  if (typeof module === "object" && module && typeof module.exports === "object") module.exports = asSys; else {
    this.asSys = this.$$ = asSys;
    if (typeof define === "function" && define.amd) define(asSys);
  }
})();