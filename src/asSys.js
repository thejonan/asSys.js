(function () {
  var extractProps = function(start) {
    var props = {}, a, keys;

    for (var i = start, al = arguments.length; i < al; ++i) {
      a = arguments[i];
      if( (typeof a === "object") && (a !== null) ){
        keys = Object.keys(a);
        for (var j = 0, kl = keys.length; j < kl; ++j) props[keys[j]] = true;
      }
    }

    return props;
  };
  
  var copyEnabled = function (agent) {
    return  (agent != null) && 
            (typeof agent === 'object') && 
            (typeof agent.constructor === 'function') &&
            !agent.nodeType;
  };
  
  var mergeObjects = function (deep, mode, i, objects) {
    if (!deep && mode === "all" && typeof Object.assign === 'function') {
      for (;objects[i] == null;++i);
      return Object.assign.apply(Object, i == 0 ? objects : Array.prototype.slice.call(objects, i));
    }
    
    var obj = objects[i], 
        ol = objects.length, 
        merge = function (target, src) {
          // First we make sure we have an object to merge with...
          if (src == null) 
            return;
          // ... then, we make sure we have a target object.
          else if (target == null) {
            target = src;
            return;
          }
          
          for (var p in src) {
            if (target[p] === src[p])
              continue;
              
            if (mode !== "all" && !(target[p] === undefined ^ mode === "old"))
              continue;
            else if (!deep || typeof src[p] !== 'object' || src[p] instanceof RegExp || !src.hasOwnProperty(p) || !copyEnabled(src[p]))
              target[p] = src[p];
            // it is pretty annoying not being able to detect copability of src[p].
            // Still, it is better to have the exception handling here, because
            // putting it in to copyEnabled will double the constructor invocation.
            else try { 
              if (target[p] == null)
                target[p] = asSys.mimic(src[p]);

              merge(target[p], src[p]);
            }
            catch (e) {
              target[p] = src[p];
            }
          }
        };
    
    // The actual iteration...
    while (++i < ol)
      merge(obj, objects[i]);
    
    return obj;
  };
  
  var twinScan = function(arr, start, callback) {
		var ai, j;
		for (var i = start, al = arr.length; i < al; ++i) {
      ai = arr[i];
      for (j = i + 1;j < al; ++j) {
        if (callback(ai, arr[j]) === false)
          return false;
		  }
		}
		
		return true;
  };
  
  /** Create a new type of agents, that is capable of given set of skills.
    *
    * Complexity: o(<required skills>)
    */
	var asSys = function () {
  	var skillmap = [],
  	    expected = null,
  	    missing,
  	    skills = Array.prototype.slice.call(arguments, 0),
  	    A = function () {
    	    var agent = this,
    	        args = arguments;
    	        
    	   if (!agent.__initializing) {
      	   agent.__initializing = true;
    	     asSys.each(agent.__skills, function (s) { s.apply(agent, args); });
      	   delete agent.__initializing;
    	   }
    	  };
  	    
    // NOTE: skills.length needs to be obtained everytime, because it may change.
  	for (var i = 0, a; i < skills.length; ++i) {
    	a = skills[i];
    	
    	if (a == null)
        throw { name: "Missing skill", 
          message: "The skill-set liseted [" + a + "] is missing.",
          skill: s 
          };

    	// We've come to a skill reference.
    	if (typeof a === 'function' && a.prototype !== undefined) {
      	if (skillmap.indexOf(a) > -1)
      	  continue;
      	  
      	// If it has dependencies
      	if (a.prototype.__depends != null) {
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
          if (expected == null)
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
          mergeObjects(true, "all", 0, [ A.prototype, a.prototype ])
          
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
    asSys.each(expected, function (v, m) {
      if (A.prototype[m] == null)
        throw { name: "Unmatched expectation", 
                message: "The expected method [" + m + "] was not found among provided skills.",
                method: m 
                };
    });
    
    Object.defineProperties(A.prototype, { __skills: { enumerable: false, writable: false, value: skillmap } });
    return A;
	};
	
	// The current version. Keep it this way - packaging script will put package.json's derived value here.
	asSys.version = "{{VERSION}}";
	
  /** Compare if two objects are completely equal, i.e. each property has the same value.
    *
    * Complexity: o(<number of object> ^ 2 * <number of properties>).
    */
  asSys.equal = function (deepCompare /*, objects */) {
    var deep = deepCompare,
        start = 0,
        match = function (a, b, dig) {
          if (typeof a !== 'object' || typeof b !== 'object')
            return a === b;
          else if (dig !== false) {
            for (var p in extractProps(0, a, b)) {
        		  if (!match(a[p], b[p], deep))
        		    return false;
            }
            
            return true;
    		  }
        };
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  start = 1;
		
		return twinScan(arguments, start, match);
	};
		
  /** Compare if two objects are similar, i.e. if existing properties match
    *
    * Complexity: o(<number of object> ^ 2 * <number of properties>).
    */
	asSys.similar = function (deepCompare /*,objects */) {
  	var deep = deepCompare,
  	    start = 0;
  	    match = function (a, b, dig) {
          if (a instanceof RegExp)
            return (typeof b === 'string') && b.match(a) != null;
          else if (b instanceof RegExp)
            return (typeof a === 'string') && a.match(b) != null;
          else if (typeof a !== 'object' || typeof b !== 'object')
            return a == b;
          else if (dig !== false) {
            for (var p in a) {
              if (b[p] !== undefined && !match(a[p], b[p], deep))
                return false;
            }
            
            return true;
          }
  	    };
		if (typeof deep !== 'boolean')
			deep = false;
		else
		  start = 1;
			
    return twinScan(arguments, start, match);
	};
	
  /** Extract the properties which are common for all arguments
    *
    * Complexity: o(<number of object> * <number of properties>).
    */
	asSys.common = function (equal /*objects */) {
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
              if (b.hasOwnProperty(p) && (!eq || a[p] == b[p]))
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
    
    return mergeObjects(d, "all", start, arguments);
	};
	
  /** Merges only the new properties from given objects into the first one.
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
    
    return mergeObjects(d, "new", start, arguments);
	};
	
  /** Merges only the common properties from given objects into the first one.
    *
    * Complexity: o(<number of properties> * <number of objects>).
    */
	asSys.update = function (deep /*, objects */) {
  	var d = deep,
  	    start = 0;
		if (typeof d !== 'boolean')
			d = false;
		else
		  start = 1;
    
    return mergeObjects(d, "old", start, arguments);
	};
		
	/** Filters the properties, leaving only those which get `true` from the selector
  	*
  	* Complexity: o(<number of own properties>)
  	*/
	asSys.filter = function (agent, selector) {
  	if (typeof agent.filter === 'function')
  	  return agent.filter(selector);
    
    var res = asSys.mimic(agent), p,
        keys = Object.keys(agent);
    for (var i = 0, kl = keys.length; i < kl; ++i) {
      p = keys[i];
      if (selector(agent[p], p, agent))
        res[p] = agent[p];
    }
    
    return res;
	};
	
	/** Walk on each property of an agent.
  	*
  	* Complexity: o(<number of own properties>).
  	*/
	asSys.each = function (agent, actor) {
  	if (agent == null)
  	  ;
  	else if (typeof agent.forEach ==='function')
    	agent.forEach(actor);
    else if (typeof agent !== 'object') {
      actor(agent);
    }
    else {
      var k = Object.keys(agent), p;
      for (var i = 0, kl = k.length; i < kl; ++i) {
        p = k[i];
        actor(agent[p], p, agent);
      }
    }
	};
	
	/** Finds the index of an element in the array. Uses native
  	* implementetion, if possible.
  	*/
  	
  asSys.findIndex = function (arr, needle) {
    if (typeof needle !== "function")
      return arr.indexOf(needle);
    else if (typeof arr.findIndex === "function")
      return arr.findIndex(needle);
      
    for (var i = 0, al = arr.length;i < al.length; ++i)
      if (!!needle.call(arr[i], arr[i], i))
        return i;
      
    return -1;
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
	
	asSys.name = function (fn) {
    if (typeof fn !== 'function')
      return skill.toString();
    else if (fn.name !== undefined)
      return fn.name;
    else {
      var s = fn.toString().match(/function ([^\(]+)/);
      return s != null ? s[1] : "";
    }
	};
	
	/** Copies all the skills from the given agent, into a new, blank one,
  	* Complexity: o(1);
  	*/
	asSys.mimic = function (agent) {
  	if (copyEnabled(agent)) {
    	var o = Object.create(Object.getPrototypeOf(agent));
    	try {
    	  return agent.constructor.apply(o, Array.prototype.slice(arguments, 1)) || o;
      }
      catch (e) {
      }
    }
    // Yes, otherwise we return `undefined` - fair enough
	};
	
	/** Escape a string to be used as a RegExp definition
  	*/
  asSys.escapeRegExp = function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
   	
	/** Gets or sets the value at the agent, following the given path.
  	* If we're setting the value, the missing component along the way
  	* will be created.
  	*/
  	
  asSys.path = function (agent, path, value) {
    if (path == null)
      return;
      
    if (!Array.isArray(path)) {
      try {
        if (value === undefined)
          eval("value = agent." + path);
        else
          eval("agent." + path + " = value");
          
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
	asSys.act = function (agent, activity /*, arguments */) {
  	if (agent != null && typeof activity === 'function') {
  		return activity.apply(agent, Array.prototype.slice.call(arguments, 2));
  	}
	};

	/** Invokes same activity on all skills of the agent.
  	* Complexity: o(1)
  	*/
	asSys.broadcast = function (agent, activity /*, arguments */) {
  	var args = Array.prototype.slice.call(arguments, 2);
      
    asSys.each(agent.__skills, function (s) {
      if (typeof s.prototype[activity] === 'function')
        s.prototype[activity].apply(agent, args); 
    });
    return agent;
	};
		
  /** Call the activity on the first skill containing it _before_
    * the given one, i.e. - the activity which most probably was
    * overriden by the given one.
    */
  asSys.pass = function (agent, skill, activity) {
    var i = agent.__skills && agent.__skills.indexOf(skill), s;
    if (i > -1) {
      while (--i >= 0) {
        s = agent.__skills[i];
        if (typeof s.prototype[activity] === 'function')
          return s.prototype[activity].apply(agent, Array.prototype.slice.call(arguments, 3));
      }
    }
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
        w = asSys.weight(s.prototype);
        if (w > 0 && asSys.weight(asSys.common(true, proto, s.prototype)) == w)
          ++cnt;
      }
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
			  mergeObjects(false, "all", 0, [ skills, Object.getPrototypeOf(e) ]);
			  
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
  else if ( typeof define === "function" && define.amd ) {
    define(asSys);
    this.asSys = asSys;
  }
  else { // Probably browser version...
    this.asSys = this.a$ = asSys;
  }
})();
