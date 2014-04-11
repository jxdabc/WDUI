;

(function(){

	var object_info_stack = [];

	var static_inheritance_ignore_list = ['empty_obj_factory', 'classname', 'parent_classes', '$STATIC'];

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

		factory.empty_obj_factory = empty_obj_factory;
		factory.classname = name;
		factory.parent_classes = [];

		$.each(extend_list || [], function(i, parent) {
			factory.parent_classes.push(parent);
			$.each(parent, function(i,v) {
				if (!parent.hasOwnProperty(i)) return;
				if (static_inheritance_ignore_list.indexOf(i) != -1) return;
				// console.log(i);
				Object.defineProperty(factory, i, 
				{
					enumerable : true,
					configurable : true,
					set: function (val) 
					{
						parent[i] = val;
					},
					get: function () 
					{
						return parent[i];
					}
				});
			});
		});

		factory.$STATIC = dealWithStatic;

		function empty_obj_factory() {}
		function factory() {

			if (!this || !this.classobj)
				return factory.apply(new empty_obj_factory(), arguments);

			var me = this;
			var my_arguments = arguments;

			$.each(this, function(i, v){
				if (!me.hasOwnProperty(i)) return;
				throw new Exception('XUIClass::ONE', 'XUIClass: Object to be constructed is not empty. ');
			});

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
			addParentObject(this, extend_list, extend_list_with_args);

			// Member initialization. 
			$.each(object_info.public_list || [], function(i,v){
				$.each(v, function(ii,vv){
					Object.defineProperty(me, ii, {
						enumerable : true,
						configurable : true,
						writable : true,
						value : vv
					});
				});
			});

			// Self construction. 
			$.each(object_info.constructor_list || [], function(i,v){
				v.apply(me, my_arguments);
			});

			return this;
		}

		return factory;
	}

	function addParentObject(object, extend_list, extend_list_with_args) {

		var parent_list =[];

		$.each(extend_list || [], function(i,v){

			var name = v.classname;
			var parent = new v.empty_obj_factory();
			parent_list.push({'name' : name, 'obj' : parent});
			
			v.apply(object, extend_list_with_args[name] || []);
			$.each(object, function(i,v){
				if (!object.hasOwnProperty(i)) return;
				Object.defineProperty(parent, i, 
					Object.getOwnPropertyDescriptor(object, i));
				delete object[i];
			});
		});

		$.each(parent_list, function(i,v){
			var parent = v.obj;
			$.each(parent, function(i,v){
				if (!parent.hasOwnProperty(i)) return;
				if (i == '$PARENT') return;
				Object.defineProperty(object, i, 
				{
					enumerable : true,
					configurable : true,
					set: function (val) 
					{
						parent[i] = val;
					},
					get: function () 
					{
						return parent[i];
					}
				});
			});
		});

		object.$PARENT = function (name) {

			var direct_parent = null;
			$.each(parent_list, function(i,v){
				if (direct_parent) return;
				if (v.name == name) direct_parent = v.obj;
			});
			if (direct_parent) return direct_parent;
			var rst = null;
			$.each(parent_list, function(i,v){
				if (rst) return;
				rst = v.obj.$PARENT(name);
			});

			return rst;
		}
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


	function dealWithStatic(list) {
		var me = this;
		$.each(list, function(i,v){
			Object.defineProperty(me, i, {
				enumerable : true,
				configurable : true,
				writable : true,
				value : v
			});
		});
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

