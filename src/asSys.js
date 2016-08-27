(function () {
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
  
  var mergeObjects = function (deep, newonly, i, objects) {
    if (!deep && !newonly && typeof Object.assign === 'function') {
      for (;objects[i] == null;++i);
      return Object.assign.apply(Object, i == 0 ? objects : Array.prototype.slice.call(objects, i));
    }
    
    var obj = objects[i], ol = objects.length, keys, o, p;
    while (++i < ol) {
      o = objects[i];
      
      // First, make sure we have a target object.
      if (obj == null) {
        obj = o;
        continue;
      }
      
      keys = Object.keys(o);
      kl = keys.length;
      for (var j = 0, kl = keys.length; j < kl; ++j) {
        p = keys[j];
        if (!newonly || !obj.hasOwnProperty(p))
          obj[p] = !deep || typeof o[p] !== 'object' ? o[p] : mergeObjects(deep, newonly, 0, [ (typeof obj[p] === 'object' ? obj[p] : {}), o[p] ]);
      }
    }
    
    return obj;
  };
  
  var twinScan = function(arr, start, callback) {
		var ai, j;
		for (var i = start, al = arr.length; i < al; ++i) {
      ai = arr[i];
      for (j = i + 1;j < al; ++j) {
        if (!callback(ai, arr[j]))
          return false;
		  }
		}
		
		return true;
  };
  
  var fnName = function(fn) {
    if (typeof fn !== 'function')
      return null;
    else if (fn.name !== undefined)
      return fn.name;
    else {
      var s = fn.toString().match(/function ([^\(]+)/);
      return s != null ? s[1] : "";
    }
  };
    
  /** Create a new agent, with given set of skills: skill1, skill2, ..., skillN
    *
    * Complexity: o(<required skills>)
    */
	var asSys = function () {
  	var A = function () {},
  	    skillmap = { },
  	    missing, obj, nm,
  	    args = [],
  	    skills = Array.prototype.slice.call(arguments, 0);
  	    
    // Note: skills.length needs to be obtained everytime, because it may change.
  	for (var i = 0, a; i < skills.length; ++i) {
    	a = skills[i];
    	
    	// We've come to a skill reference
    	if (typeof a === 'function') {
      	nm = fnName(a);
      	if (skillmap[nm] !== undefined)
      	  continue;
      	  
      	// If it has dependencies
      	if (a.prototype.__expects != null) {
        	missing = [i, 0];
        	for (var s, j = 0, el = a.prototype.__expects.length; j < el; ++j) {
            s = a.prototype.__expects[j];
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
        
        // Ok, we don't have expectations that are not met - merge the prototypes
        // Invoke the initialization for it and add this skill to agent's.
      	skillmap[nm] = a;
      	if (A.prototype === undefined)
      	  A.prototype = Object.create(a.prototype);
        else
          mergeObjects(true, false, 0, [ A.prototype, a.prototype ])
      }
      else
        args.push(a);
    }
    
    Object.defineProperties(A.prototype, { __skills: { enumerable: false, writable: false, value: skillmap } });
    obj = new A();
    if (args.length > 0) {
      args.unshift(obj);
      asSys.init.apply(this, args);
    }
    return obj;
	};
	
	// The current version. Keep it this way - packaging script will put package.json's derived value here.
	asSys.version = "{{VERSION}}";

  /** Initialize the agent with given skill's constructor, passing the rest of the arguments
    *
    * Complexity: o(<number of capable skills>).
    */	
	asSys.init = function (agent) {
  	var args = Array.prototype.slice.call(arguments, 1);
  	if (agent.__skills === undefined)
      return agent.constructor.apply(agent, args) || agent;
      
    var skills = Object.keys(agent.__skills), s;
    for (var i = 0, sl = skills.length; i < sl; ++i) {
      s = agent.__skills[skills[i]];
      s.apply(agent, args);
    }
    
    return agent;
	};
	
  /** Compare if two objects are completely equal, i.e. each property has the same value.
    *
    * Complexity: o(<number of properties>).
    */
  asSys.equal = function (deepCompare /*, objects */) {
    var deep = deepCompare,
        start = 0;
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  start = 1;
		
		return twinScan(arguments, start, function (ai, aj) {
      for (var p in extractProps(false, ai, aj)) {
  		  if (deep && typeof ai[p] === 'object' && typeof aj[p] === 'object' && !asSys.equal(deep, ai[p], aj[p]))
  		    return false;
  		  else if (ai[p] !== aj[p])
          return false;
		  }
		  return true;
		});
	};
		
  /** Compare if two objects are similar, i.e. if existing properties match
    *
    * Complexity: o(<number of properties>).
    */
	asSys.similar = function (deepCompare /*,objects */) {
  	var deep = deepCompare,
  	    start = 0;
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  start = 1;
			
    return twinScan(arguments, start, function(ai, aj) {
		  for (var p in ai) {
  		  if (deep && typeof ai[p] === 'object' && typeof aj[p] === 'object' && !asSys.similar(deep, ai[p], aj[p]))
  		    return false;
        else if (aj[p] !== undefined && ai[p] !== aj[p])
			    return false;
		  }
		  
		  return true;
    });
	};
	
  /** Merges all the properties from given objects into the first one.
    * IF a property already exists - it is overriden.
    *
    * Complexity: o(<number of properties> * <number of objects>).
    */
	asSys.extend = function (deep /*, objects */) {
  	var d = deep,
  	    start = 0;
		if (typeof d !== 'boolean')
			d = false;
		else
		  start = 1;
    
    return mergeObjects(d, false, start, arguments);
	};
	
  /** Merges the new properties from given objects into the first one.
    *
    * Complexity: o(<number of properties> * <number of objects>).
    */
	asSys.mixin = function (deep /*, objects */) {
  	var d = deep,
  	    start = 0;
		if (typeof d !== 'boolean')
			d = false;
		else
		  start = 1;
    
    return mergeObjects(d, true, start, arguments);
	};
	
	/** Filters the properties, leaving only those which get `true` from the selector
  	*
  	* Complexity: o(<number of own properties>)
  	*/
	asSys.filter = function (agent, selector) {
  	if (typeof agent.filter === 'function')
  	  return agent.filter(selector);
    
    var res = {}, p,
        keys = Object.keys(agent);
    for (var i = 0, kl = keys.length; i < kl; ++i) {
      p = keys[i];
      if (selector(p, agent))
        res[p] = agent[p];
    }
    
    return res;
	};
	
	/** Walk on each property of an agent.
  	*
  	* Complexity: o(<number of own properties>).
  	*/
	asSys.each = function (agent, actor) {
  	if (typeof agent.forEach ==='function')
    	agent.forEach(actor);
    else {
      var k = Object.keys(p), p;
      for (var i = 0, kl = k.length; i < kl; ++i) {
        p = k[i];
        actor(agent[p], p, agent);
      }
    }
	};
	
  /** Calculates the number of properties in the agent. 
    * If `length` property exists and is a number, it is returned. 
    * Non objects are considered to weight 1.
    * Complexity: o(1).
    */
	asSys.weight = function (agent) {
  	if (typeof agent !== 'object')
  	  return 1;
  	else if (agent.hasOwnProperty('length') && typeof agent.length == 'number')
  	  return agent.length;
    else
      return Object.keys(agent).length;
	};
	
	asSys.id = function (skill) {
  	return typeof skill === 'function' ? fnName(skill) : skill.toString();
	};
	
	/** Copies all the skills from the given agent, into a new, blank one,
  	* Complexity: o(1);
  	*/
	asSys.mimic = function (agent) {
  	var o = Object.create(Object.getPrototypeOf(agent));
  	return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
	};
	
	/** Performs a specific method from a given skill, onto the object
  	* Complexity: o(1)
  	*/
	asSys.act = function (agent, skill, activity /*, arguments */) {
  	var act = skill.prototype[activity];
		return (act || skill).apply(agent, Array.prototype.slice.call(arguments, act !== undefined ? 3 : 2));
	};
		
  /** Tells whether given agent can perform specific activity.
    */
	asSys.can = function (agent, activity) {
		return (typeof agent === 'object') && agent[activity] != null && (typeof agent[activity] === 'function');
	};

  /** Tells whether tiven agent is aware of given property (activity or value)
    */
	asSys.aware = function (agent, prop) {
		return (typeof agent === 'object') && agent[prop] !== undefined;
	};
	
	/** Tells whether given agent is capable for given set of skills.
  	* [1] If this is _our_ the `__skills` property is used.
  	* [2] If this is general object - it's properties are scanned.
  	* Complexity: [1] o(<number of skills>),
  	*             [2] o(<number of skills> * <number of properties>)
  	*/
	asSys.capable = function (agent, allskills /* skills */) {
  	var all = allskills, s,
  	    i = 1;
		if (typeof all !== 'boolean')
			all = true;
		else
		  i = 2;

    for (var cnt = 0, start = i, al = arguments.length; i < al; ++i) {
      s = arguments[i];
      if (agent.__skills !== undefined && agent.__skills[fnName(s)] !== undefined)
        ++cnt;
      else if (agent instanceof s)
        ++cnt;
    }

    return cnt > 0 && (all ? (arguments.length - start) == cnt : true);
	};
	
	/** Groups agents from given pool, according to given selector.
  	* The returned group has same properties as the given pool.
  	* If `full` is set - the returned pool also has accumulative skills, i.e.
  	* methods, which invoke the corresponding methods of the containing agents.
  	*
  	* Complexity: o(<number of agents in the pool> * (<complexity of selector> + <number of properties>))
  	*/
	asSys.group = function (pool, full, selector) {
		if (typeof full !== 'boolean') {
  		selector = full;
  		full = false;
    }
    
		var res = this.mimic(pool), skills = {}, e;
				
		for (var k in pool) {
			var e = pool[k];
			if (!selector.call(e, e, k, pool))
				continue;
			
			// Get this done, only if we're interested to use it afterwards...
			if (full)
			  mergeObjects(false, false, 0, [ skills, extractProps(true, Object.getPrototypeOf(e)) ]);
			  
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

  /** Now finish with some module / export definition for according platforms
    */
  if ( typeof module === "object" && module && typeof module.exports === "object" )
  	module.exports = asSys;
  else {
    this.asSys = this.a$ = asSys;
    if ( typeof define === "function" && define.amd )
      define(asSys);
  }
})();
