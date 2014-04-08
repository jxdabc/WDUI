;

(function(){

	var object_info_stack = [];

	window.$CLASS = function(name, extend_list, scope) {

		/* overload function(name, scope) */

		if (!scope)
		{
			scope = extend_list;
			extend_list = undefined;
		}

		extend_list = extend_list || [];
		if (name != 'XUIObject' && !extend_list.length)
			extend_list.push(window.XUIObject);

		addObject(name, factory);

		var prototype = {'constructor' : null, 'classobj' : factory};
		factory.prototype = empty_obj_factory.prototype = prototype;

		factory.classname = name;
		factory.parent_classes = [];
		$.each(extend_list || [], function(i,v){
			factory.parent_classes.push(v);
		});

		factory.$STATIC = dealWithStatic;
		factory.$S = getStatic;

		function empty_obj_factory() {}
		function factory() {

			if (!this || !this.classobj)
				return factory.apply(new empty_obj_factory(), arguments);

			var me = this;
			var my_arguments = arguments;

			object_info_stack.push({});
			scope(this);
			var object_info = object_info_stack.pop();

			// Parent construction. 
			var extend_list_with_args = {};
			$.each(extend_list || [], function(i,v){
				extend_list_with_args[v.classname] = [];
			});
			$.each(object_info.parent_constructor_list || [], function(i,v){
				v.apply(me, 
					[extend_list_with_args].concat(Array.prototype.slice.call(my_arguments, 0)));
			});
			$.each(extend_list || [], function(i,v){
				v.apply(me, extend_list_with_args[v.classname] || []);
			});

			// Member initialization. 
			$.each(object_info.public_list || [], function(i,v){
				$.each(v, function(ii,vv){
					me[ii] = vv;
				})
			});

			// Self construction. 
			$.each(object_info.constructor_list || [], function(i,v){
				v.apply(me, my_arguments);
			});

			return this;
		}

		return factory;
	}

	window.$EXTENDS = function(/* parent1, parent2, parent3, ... , parentN */) {
		return Array.prototype.slice.call(arguments, 0);
	}

	window.$PUBLIC = function(list) {
		var info = object_info_stack.last();
		info.public_list = info.public_list || [];
		info.public_list.push(list);
	}

	window.$PARENT_CONSTRUCTOR = function(fn) {
		var info = object_info_stack.last();
		info.parent_constructor_list = info.parent_constructor_list || [];
		info.parent_constructor_list.push(fn);
	}

	window.$CONSTRUCTOR = function(fn) {
		var info = object_info_stack.last();
		info.constructor_list = info.constructor_list || [];
		info.constructor_list.push(fn);
	}

	window.$ABSTRACT = function() { 
		throw new Exception('XUIClass::AFNI', 
			'Abstract funtion not implemented. '); 
	}

	function getStatic(name) {
		return dealWithStatic.call(this, name)[name];
	}

	function dealWithStatic(name_or_list) {

		if (typeof name_or_list == "string") {
			var name = name_or_list;
			if (typeof this[name] !== 'undefined') return this;
			for (var i = 0; i < this.parent_classes.length; i++) {
				var rst = dealWithStatic.apply(this.parent_classes[i], arguments);
				if (rst) return rst;
			}
			return undefined;
		} else {
			var list = name_or_list;
			var me = this;
			$.each(list, function(i,v){
				me[i] = v;
			});
		}
	}


	function addObject(name, object) {
		name = name.split('.');
		var c = window;
		var c_name = '';
		for (var i = 0; i < name.length - 1; i++) {
			c_name += name[i];
			c = c[name[i]];
			if (!c) 
				throw new Exception('XUIClass::OOND', 
					'XUIClass: Outter object ' + c_name + ' not defined. ');
			c_name += '.';
		}

		c[name.last()] = object;
	}

})();

