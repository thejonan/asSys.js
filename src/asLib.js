(function () {
  var extractProps = function(vals) {
    var props = {}, a, p,
        args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0, al = args.length; i < al; ++i) {
      a = args[i];
      for (p in a)
        if (a.hasOwnProperty(p))
          props[p] = vals ? a[p] : true;
    }

    return props;
  };
  
  var mergeObjects = function (deep, newonly, objects) {
    if (!deep && !newonly && typeof Object.assign === 'function') {
      while (objects[0] == null) {
        if (!Array.isArray(objects))
          objects = Array.prototype.slice.call(objects, 1);
        else
          objects.shift();
      }
      return Object.assign.apply(Object, objects);
    }
    
    var obj = objects[0], t, o, p;
    for (var i = 1, ol = objects.length; i < ol; ++i) {
      o = objects[i];
      
      // First, make sure we have a target object.
      if (obj == null) {
        obj = o;
        continue;
      }

      for (p in o) {
        if (!o.hasOwnProperty(p))
          continue;
        if (newonly && obj.hasOwnProperty(p))
          continue;
        if (!deep || typeof o[p] !== 'object')
          obj[p] = o[p];
        else {
          t = typeof obj[p] === 'object' ? obj[p] : {};
          obj[p] = mergeObjects(deep, newonly, [t, o[p] ]);
        }
      }
    }
    
    return obj;
  };
  
  var twinScan = function(arr, callback) {
		var ai, j;
		for (var i = 0, al = arr.length; i < al; ++i) {
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
  
  var fnOnly = function (key, agent) {
    return agent && typeof agent[key] === 'function';
  };
  
  // Create a new agent, with given set of skills: arg1, arg2, ... argN, skill1, skill2, ..., skillN
  // Complexity: o(<number arguments> + <expected skills>)
	var asLib = function () {
  	var obj = null,
  	    skillmap = { },
  	    args = [],
  	    reset = false,
  	    missing,
  	    skills = Array.prototype.slice.call(arguments, 0);
  	    
    // Note: skills.length needs to be obtained everytime, because it may change.
  	for (var i = 0, a; i < skills.length; ++i) {
    	a = skills[i];
    	
    	// We've come to a skill reference
    	if (typeof a === 'function') {
      	// Prepare the arguments array first
      	if (!reset && args.length === 1)
      	  args = args[0];
      	reset = true;
      	
      	// If it has dependencies
      	if (a.__expects != null) {
        	missing = [i, 0];
        	for (var s, j = 0, el = a.__expects.length; j < el; ++j) {
            s = a.__expects[j];
            if (skillmap[s] !== undefined)
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
      	obj = mergeObjects(false, true, [ obj, new a(args) ]);
      	skillmap[fnName(a)] = true;
      }
      else {
        if (reset) {
          args = [];
          reset = false;
        }
        
        args.push(a);
      }
    }
    
    if (obj != null)
      obj.__skills = skillmap;
      
    return obj;
	};
	
	// The current version.
	asLib.version = "0.0.0";
		
  /** Compare if two objects are completely equal, i.e. each property has the same value.
    * Complexity: o(<number of properties>).
    */
    asLib.equal = function (deepCompare /*, objects */) {
    var deep = deepCompare,
        args = arguments;
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  args = Array.prototype.slice.call(arguments, 1);
		
		return twinScan(args, function (ai, aj) {
      for (var p in extractProps(false, ai, aj)) {
  		  if (deep && typeof ai[p] === 'object' && typeof aj[p] === 'object' && !asLib.equal(deep, ai[p], aj[p]))
  		    return false;
  		  else if (ai[p] !== aj[p])
          return false;
		  }
		  return true;
		});
	};
		
  /** Compare if two objects are similar, i.e. if existing properties match
    * Complexity: o(<number of properties>).
    */
	asLib.similar = function (deepCompare /*,objects */) {
  	var deep = deepCompare,
  	    args = arguments;
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  args = Array.prototype.slice.call(arguments, 1);
			
    return twinScan(args, function(ai, aj) {
		  for (var p in ai) {
  		  if (deep && typeof ai[p] === 'object' && typeof aj[p] === 'object' && !asLib.similar(deep, ai[p], aj[p]))
  		    return false;
        else if (aj[p] !== undefined && ai[p] !== aj[p])
			    return false;
		  }
		  
		  return true;
    });
	};
	
  /** Merges all the properties from given objects into the first one.
    * IF a property already exists - it is overriden.
    * Complexity: o(<number of properties> * <number of objects>).
    */
	asLib.extend = function (deep /*, objects */) {
  	var d = deep,
  	    objects = arguments;
		if (typeof d !== 'boolean')
			d = false;
		else
		  objects = Array.prototype.slice.call(arguments, 1);
    
    return mergeObjects(d, false, objects);
	};
	
  /** Merges the new properties from given objects into the first one.
    * Complexity: o(<number of properties> * <number of objects>).
    */
	asLib.enhance = function (deep /*, objects */) {
  	var d = deep,
  	    objects = arguments;
		if (typeof d !== 'boolean')
			d = false;
		else
		  objects = Array.prototype.slice.call(arguments, 1);
    
    return mergeObjects(d, true, objects);
	};
	
	/** Filters the properties, leaving only those which get `true` from the selector
  	*/
	asLib.filter = function (agent, selector) {
  	if (typeof agent.filter === 'function')
  	  return agent.filter(selector);
    
    var res = {};
    for (var p in agent) {
      if (selector(p, agent))
        res[p] = agent[p];
    }
    
    return res;
	};
	
	/** Walk on each property of an agent.
  	*/
	asLib.each = function (agent, actor) {
  	if (typeof agent.forEach ==='function')
    	agent.forEach(actor);
    else {
      for (var p in agent)
        if (agent.hasOwnProperty(p))
          actor(agent[p], p, agent);
    }
	};
	
  /** Calculates the number of properties in the agent. 
    * If `length` property exists and is number, it is returned.
    * Complexity: o(<number of properties>).
    */
	asLib.weight = function (agent) {
  	if (agent.hasOwnProperty('length') && typeof agent.length == 'number')
  	  return agent.length;
  	  
		var cnt = 0;
		for (var p in agent) {
  		if (agent.hasOwnProperty(p))
  		  ++cnt;
    }
    
    return cnt;
	};
	
	asLib.id = function (skill) {
  	return fnName(skill);
	};
	
	/** Copies all the skills from the given agent, into a new, blank one,
  	* Complexity: o(<number of functions in prototype>);
  	*/
	asLib.mimic = function (agent) {
		var obj = {};

		mergeObjects(false, true, obj, asLib.filter(agent, fnOnly));
    return obj;
	};
	
	/** Performs a specific method from a given skill, onto the object
  	* Complexity: o(1)
  	*/
	asLib.act = function (self, skill, activity /*, arguments */) {
		var args = Array.prototype.slice.call(arguments, 3);
		return skill.prototype[activity].apply(self, args);
	};
		
  /** Tells whether given agent can perform specific activity.
    */
	asLib.can = function (agent, activity) {
		return (typeof agent === 'object') && agent[activity] != null && (typeof agent[activity] === 'function');
	};

  /** Tells whether tiven agent is aware of given property (activity or value)
    */
	asLib.aware = function (agent, prop) {
		return (typeof agent === 'object') && agent[prop] !== undefined;
	};
	
	/** Tells whether given agent is capable for given set of skills.
  	* [1] If this is _our_ the `__skills` property is used.
  	* [2] If this is general object - it's properties are scanned.
  	* Complexity: [1] o(<number of skills>),
  	*             [2] o(<number of skills> * <number of properties>)
  	*/
	asLib.capable = function (agent, allskills /* skills */) {
  	var all = allskills, args;
		if (typeof all !== 'boolean') {
			all = false;
      args = Array.prototype.slice.call(arguments, 0);
		}
		else
		  args = Array.prototype.slice.call(arguments, 1);

    // Check if this is known agent and we can use the predefined
    // property				
    if (agent.__skills !== undefined) {
      for (var cnt = 0, i = 0, al = args.length; i < al; ++i) {
        if (agent.__skills[fnName(args[i])])
          ++cnt;
      }
      
      return all ? cnt == args.length : cnt > 0;
    }
    else {
      // The `vals` argument IS passed to the extractProps function.
      var prots = extractProps.apply(undefined, args.map(function (s, i) { return i > 0 ? s.prototype : true; })),
          cnt = 0, protcnt = 0;
      for (var p in prots) {
        if (agent[p] === prots[p])
          ++cnt;
          
        ++protcnt;
      }

      return all ? protcnt == cnt : cnt > 0;
    }
	};
	
	/** Groups agents from given pool, according to given selector.
  	* The returned group has same properties as the given pool.
  	* If `full` is set - the returned pool also has accumulative skills, i.e.
  	* methods, which invoke the corresponding methods of the containing agents.
  	* Complexity: o(<number of agents in the pool> * (<complexity of selector> + <number of properties>))
  	*/
	asLib.group = function (full, pool, selector) {
		if (typeof full !== 'boolean') {
  		selector = pool;
  		pool = full;
  		full = false;
    }
    
		var res = this.mimic(pool),
				protos = {}, e;
				
		for (var k in pool) {
			var e = pool[k];
			if (!selector.call(e, e, k, pool))
				continue;
			
			// Get this done, only if we're interested to use it afterwards...
			if (full)
			  mergeObjects(false, true, [ protos, extractProps(true, asLib.filter(e, fnOnly)) ]);
			  
			res.push(e);
		}

    if (full) {
      // Now make the pool itself performs the skills that are present in the
      // containing objects, by creating new functions
      for (var p in protos) {
        if (typeof protos[p] !== 'function')
          continue;
          
        res[p] = (function (key) { 
          return function () {
            for (var i in this) {
              var o = this[i];
              if (typeof o[key] === 'function')
                o[key].apply(o, arguments);
            }
          }
        })(p);
      }
    }
    
		return res;
	};

  /** Now finish with some module / export definition for according platforms
    */
  if ( typeof module === "object" && module && typeof module.exports === "object" )
  	module.exports = asLib;
  else {
    this.asLib = this.$$ = asLib;
    if ( typeof define === "function" && define.amd )
      define(asLib);
  }
})();
