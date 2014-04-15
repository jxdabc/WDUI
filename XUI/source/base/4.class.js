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

			var my_arguments = Array.prototype.slice.call(arguments, 0);

			// $.each(this, function(i, v){
			// 	if (!me.hasOwnProperty(i)) return;
			// 	throw new Exception('XUIClass::ONE', 'XUIClass: Object to be constructed is not empty. ');
			// });

			var protected_this_reference = new empty_obj_factory();

			object_info_stack.push({});
			scope(protected_this_reference, factory);
			var object_info = object_info_stack.pop();

			var parent_list = buildParent(my_arguments, object_info, this, extend_list);

			memberInitialize(object_info, this);
			
			addMessageHandingMechanism(object_info, this, parent_list);

			buildThisReference(this, parent_list);

			buildProtectedThisReferenceObject(this, protected_this_reference);

			construct(object_info, my_arguments);

			this.$THIS = this;

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

	global.$MESSAGE_MAP = function(name, items) {
		var info = object_info_stack.last();
		info.message_map = info.message_map || {};
		info.message_map[name] = items;
	}

	global.$MAP = function(id, fun) {
		return {'id' : id, 'handler' : fun};		
	}

	global.$CHAIN = function(direct_parent) {

		if (typeof direct_parent != 'string')
			direct_parent = direct_parent.classname;

		return {'chain' : direct_parent};
	}

	global.$MESSAGE_HANDLER = function(name, fn) {
		var info = object_info_stack.last();
		info.message_handlers = info.message_handlers || {};
		info.message_handlers[name] = fn;
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

	function buildParent(args, object_info, object, extend_list) {

		var extend_list_with_args = {};
		$.each(extend_list || [], function(i,v){
			extend_list_with_args[v.classname] = [];
		});
		$.each(object_info.parent_constructor_list || [], function(i,v){
			v.apply(global, 
				[extend_list_with_args].concat(args));
		});

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
				if (typeof name == 'undefined')
					return parent_list;

				if (typeof name != "string")
					name = name.classname;

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

		return parent_list;
	}

	function memberInitialize(object_info, object) {
		$.each(object_info.public_var_list || [], function(i,v){
			$.each(v, function(ii,vv){
				makeProperty(object, ii, vv, true);
			});
		});
		$.each(object_info.public_fun_list || [], function(i,v){
			$.each(v, function(ii,vv){
				if (!object_info.public_fun_impl_map[vv])
					throw new Exception('XUIClass::PFNI', 
						'XUIClass: Public function ' + vv + ' not implemented. ');
				makeProperty(object, vv, object_info.public_fun_impl_map[vv], false);
			});
		});
	}

	function addMessageHandingMechanism(object_info, object, parent_list) {
		var maps = object_info.message_map;
		var handlers = object_info.message_handlers;

		$.each(maps || {}, function(i,v){
			$.each(v, function(i,v){
				if (v.chain) {
					var parent_name = v.chain;
					var parent = null;
					$.each(parent_list, function(i,v){
						if (parent) return;
						if (v.name == parent_name)
							parent = v.obj;
					});

					if (!parent)
						throw new Exception('XUIClass::NDP', 
							'XUIClass: ' + parent_name + ' not a direct parent of this class. ');

					v.chain = parent;
				} 
				else if (!handlers[v.handler])
					throw new 
						Exception('XUIClass::MHND', 'XUIClass: Message handler ' + v.handler + ' not defined. ');
			});
		});

		Object.defineProperty(object, '$DISPATCH_MESSAGE', {
			enumerable : false,
			configurable : false,
			writable : false,
			value : function (type, msg) {
				var map = maps && maps[type];
				var handled = false;
				if (!map) {
					$.each(parent_list, function(i,v) {
						if (handled) return;
						handled = v.obj.$DISPATCH_MESSAGE(type, msg);
					});
				} else {
					$.each(map, function(i,v){
						if (handled) return;
						if (v.chain)
							handled = v.chain.$DISPATCH_MESSAGE(type, msg);
						else if (v.id == msg.id)
							handled = handlers[v.handler](msg);
					});
				}
				return handled;
			}
		});
	}

	function buildThisReference(object, parent_list) {
		var real_obj = object;
		Object.defineProperty(object, '$THIS', 
		{
			enumerable : false,
			configurable : false,
			set: function (val) 
			{
				real_obj = val;
				$.each(parent_list, function(i,v){
					v.obj.$THIS = val;
				});
			},
			get: function () 
			{
				return real_obj;			
			}
		});
	}

	function buildProtectedThisReferenceObject(object, protected_this_reference) {
		$.each(object, function(i,v){
			if (!object.hasOwnProperty(i)) return;
			if (typeof v != "function")
				makeReference(protected_this_reference, i, object, i);
			else
			{
				Object.defineProperty(protected_this_reference, i, 
				{
					enumerable : true,
					configurable : false,
					set: function (val) 
					{
						protected_this_reference.$THIS[i] = val;
					},
					get: function () 
					{
						return protected_this_reference.$THIS[i];
					}
				});
			}
		});

		makeReference(protected_this_reference, '$THIS', object, '$THIS');
		makeReference(protected_this_reference, '$PARENT', object, '$PARENT');
		makeReference(protected_this_reference, '$DISPATCH_MESSAGE', object, '$DISPATCH_MESSAGE');

		protected_this_reference.$SELFOBJ = object;
	}

	function construct(object_info, args) {
		$.each(object_info.constructor_list || [], function(i,v){
			v.apply(global, args);
		});
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

