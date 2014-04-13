;

(function(global){

	var object_info_stack = [];

	var static_inheritance_ignore_list = ['empty_obj_factory', 'classname', 'parent_classes', '$STATIC'];

	global.$CLASS = function(name, extend_list, scope) {

		/* overload function(name, scope) */

		if (!scope)
		{
			scope = extend_list;
			extend_list = undefined;
		}

		extend_list = extend_list || [];
		if (name != 'XUIObject' && !extend_list.length)
			extend_list.push(global.XUIObject);

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
				makeReference(factory, i, parent, i);
			});
		});

		factory.$STATIC = dealWithStatic;

		function empty_obj_factory() {}
		function factory() {

			if (!this || !this.classobj)
				return factory.apply(new empty_obj_factory(), arguments);

			var me = this;
			var my_arguments = arguments;

			// $.each(this, function(i, v){
			// 	if (!me.hasOwnProperty(i)) return;
			// 	throw new Exception('XUIClass::ONE', 'XUIClass: Object to be constructed is not empty. ');
			// });

			var polymorphism_obj = new empty_obj_factory();

			object_info_stack.push({});
			scope(polymorphism_obj, factory);
			var object_info = object_info_stack.pop();

			// Parent construction. 
			var extend_list_with_args = {};
			$.each(extend_list || [], function(i,v){
				extend_list_with_args[v.classname] = [];
			});
			$.each(object_info.parent_constructor_list || [], function(i,v){
				v.apply(global, 
					[extend_list_with_args].concat(Array.prototype.slice.call(my_arguments, 0)));
			});
			buildParent(this, extend_list, extend_list_with_args);

			// Member initialization. 
			$.each(object_info.public_var_list || [], function(i,v){
				$.each(v, function(ii,vv){
					makeProperty(me, ii, vv, true);
				});
			});
			$.each(object_info.public_fun_list || [], function(i,v){
				$.each(v, function(ii,vv){
					if (!object_info.public_fun_impl_map[vv])
						throw new Exception('XUIClass::PFNI', 
							'XUIClass: Public function ' + vv + ' not implemented. ');
					makeProperty(me, vv, object_info.public_fun_impl_map[vv], false);
				});
			});

			// Self construction. 
			$.each(object_info.constructor_list || [], function(i,v){
				v.apply(global, my_arguments);
			});

			return this;
		}

		return factory;
	}
	

	global.$EXTENDS = function(/* parent1, parent2, parent3, ... , parentN */) {
		return Array.prototype.slice.call(arguments, 0);
	}

	global.$PUBLIC_VAR = function(list) {
		var info = object_info_stack.last();
		info.public_var_list = info.public_var_list || [];
		info.public_var_list.push(list);
	}

	global.$PUBLIC_FUN = function(list) {

		if (list.constructor != global.Array) {
			var fun_list = [];
			$.each(list, function(i,v){
				fun_list.push(i);
				global.$PUBLIC_FUN_IMPL(i, v);
			});
			global.$PUBLIC_FUN(fun_list);

			return;
		}

		var info = object_info_stack.last();
		info.public_fun_list = info.public_fun_list || [];
		info.public_fun_list.push(list);
	}

	global.$PUBLIC_FUN_IMPL = function(name, fun) {
		var info = object_info_stack.last();
		info.public_fun_impl_map = info.public_fun_impl_map || {};
		info.public_fun_impl_map[name] = fun;
	}

	global.$PARENT_CONSTRUCTOR = function(fn) {
		var info = object_info_stack.last();
		info.parent_constructor_list = info.parent_constructor_list || [];
		info.parent_constructor_list.push(fn);
	}

	global.$CONSTRUCTOR = function(fn) {
		var info = object_info_stack.last();
		info.constructor_list = info.constructor_list || [];
		info.constructor_list.push(fn);
	}

	global.$ABSTRACT = function() { 
		throw new Exception('XUIClass::AFNI', 
			'Abstract funtion not implemented. '); 
	}

	global.$ENUM = function(classname, value_list) {
		var classobj = $CLASS(classname, function(me){

			$PUBLIC_VAR({
				'name' : ''
			});

			$CONSTRUCTOR(function(name){
				me.name = name;
			});
		});

		var global_list = {};

		if (value_list.constructor == Array)
			$.each(value_list, function(i,v){
				global_list[v] = new classobj(v);
			});
		else 
			$.each(value_list, function(i,v){
				global_list[i] = v;
			});

		classobj.$STATIC(global_list);
	}

	function buildParent(object, extend_list, extend_list_with_args) {

		var parent_list =[];

		$.each(extend_list || [], function(i,v){
			var name = v.classname;
			var parent = new v.empty_obj_factory();
			parent_list.push({'name' : name, 'obj' : parent});
			v.apply(parent, extend_list_with_args[name] || []);
		});

		$.each(parent_list, function(i,v){
			var parent = v.obj;
			$.each(parent, function(i,v){
				if (!parent.hasOwnProperty(i)) return;
				makeReference(object, i, parent, i);
			});
		});

		Object.defineProperty(object, '$PARENT', {
			enumerable : false,
			configurable : false,
			writable : false,
			value : function (name) {
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
		});

		var real_obj;
		Object.defineProperty(object, '$ME', 
		{
			enumerable : false,
			configurable : false,
			set: function (val) 
			{
				real_obj = val;
				$.each(parent_list, function(i,v){
					v.obj.$ME = val;
				});
			},
			get: function () 
			{
				return real_obj;			
			}
		});
		object.$ME = object;
	}


	function dealWithStatic(list) {
		var me = this;
		$.each(list, function(i,v){
			makeProperty(me, i, v, 
				typeof v != "function");
		});
	}


	function addObject(name, object) {
		name = name.split('.');
		var c = global;
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

	function makeReference(obj, name, target_obj, target_name) {
		Object.defineProperty(obj, name, 
		{
			enumerable : true,
			configurable : true,
			set: function (val) 
			{
				target_obj[target_name] = val;
			},
			get: function () 
			{
				return target_obj[target_name];
			}
		});
	}

	function makeProperty(obj, name, value, writable) {
		Object.defineProperty(obj, name, {
			enumerable : true,
			configurable : true,
			writable : writable,
			value : value
		});
	}

})(window);

