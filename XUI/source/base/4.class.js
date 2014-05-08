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

		addClass(name, factory);

		var prototype = {'constructor' : null, 'classobj' : factory};
		factory.prototype = empty_obj_factory.prototype = prototype;

		factory.empty_obj_factory = empty_obj_factory;
		factory.classname = name;
		factory.parent_classes = [];

		extend_list = extend_list || [];
		for (var i = 0; i < extend_list.length; i++) {
			var parent = extend_list[i];

			if (parent.__struct__)
				throw new Exception('XUIClass::CDS', 
					'XUIClass: can not derive the struct class ' + parent.classname + '. ');

			factory.parent_classes.push(parent);
			for (var k in parent) {
				if (!parent.hasOwnProperty(k)) continue;
				if (static_inheritance_ignore_list.indexOf(k) != -1) continue;
				makeReference(factory, k, parent, k);
			}
		}

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

			profile_new_object(name);

			return this;
		}

		return factory;
	}

	global.$STRUCT = function(name, scope) {

		addClass(name, factory);

		object_info_stack.push({});
		scope(factory);
		var object_info = object_info_stack.pop();
		
		factory.prototype = empty_obj_factory.prototype = {
			'constructor' : null,
			'classobj' : factory,
			'instanceOf' : instanceOf,
		}
		memberInitialize(object_info, factory.prototype);

		factory.classname = name;
		factory.__struct__ = true;
		factory.$STATIC = dealWithStatic;

		var constructor_list = object_info.constructor_list || [];

		function empty_obj_factory() {}
		function factory() {
			if (!this || !this.classobj)
				return factory.apply(new empty_obj_factory(), arguments);

			for (var i = 0; i < constructor_list.length; i++)
				constructor_list[i].apply(this, arguments);

			profile_new_object(name);

			return this;
		}

		function instanceOf(cls) {
			if (typeof cls != 'string')
				cls = cls.classname;
			return cls == name;
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
			for (var k in list) {
				fun_list.push(k);
				global.$PUBLIC_FUN_IMPL(k, list[k]);
			}
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
		var classobj = $STRUCT(classname, function(me){

			$PUBLIC_VAR({
				'name' : ''
			});

			$CONSTRUCTOR(function(name){
				this.name = name;
			});
		});

		var global_list = {};

		if (value_list.constructor == Array)
			for (var i = 0; i < value_list.length; i++) {
				var v = value_list[i];
				global_list[v] = new classobj(v);
			}
		else 
			for (var k in value_list)
				global_list[k] = value_list[k];

		classobj.$STATIC(global_list);
	}

	function buildParent(args, object_info, object, extend_list) {

		var extend_list_with_args = {};
		extend_list = extend_list || [];
		for (var i = 0; i < extend_list.length; i++)
			extend_list_with_args[extend_list[i].classname] = [];

		object_info.parent_constructor_list = 
			object_info.parent_constructor_list || [];
		for (var i = 0; i < object_info.parent_constructor_list.length; i++)
			object_info.parent_constructor_list[i].apply(global, [extend_list_with_args].concat(args));

		var parent_list = [];

		for (var i = 0; i < extend_list.length; i++) {
			var v = extend_list[i];
			var name = v.classname;
			var parent = v.apply(global, extend_list_with_args[name] || []);
			parent_list.push({'name' : name, 'obj' : parent});
		}

		for (var i = 0; i < parent_list.length; i++) {
			var v = parent_list[i];
			var parent = v.obj;
			for (var k in parent) {
				if (!parent.hasOwnProperty(k)) continue;
				makeReference(object, k, parent, k);
			}
		}

		Object.defineProperty(object, '$PARENT', {
			enumerable : false,
			configurable : false,
			writable : false,
			value : function (name) {
				if (typeof name == 'undefined')
					return parent_list;

				if (typeof name != "string")
					name = name.classname;

				for (var i = 0; i < parent_list.length; i++) {
					var v = parent_list[i];
					if (v.name == name) return v.obj;
				}

				for (var i = 0; i < parent_list.length; i++) {
					var rst = parent_list[i].obj.$PARENT(name);
					if (rst) return rst;
				}

				return null;
			}
		});

		return parent_list;
	}

	function memberInitialize(object_info, object) {

		object_info.public_var_list = 
			object_info.public_var_list || [];
		for (var i = 0; i < object_info.public_var_list.length; i++) {
			var v = object_info.public_var_list[i];
			for (var k in v)
				makeProperty(object, k, v[k], true);
		}

		object_info.public_fun_list = 
			object_info.public_fun_list || [];
		for (var i = 0; i < object_info.public_fun_list.length; i++) {
			var v = object_info.public_fun_list[i];
			for (var j = 0; j < v.length; j++) {
				var vv = v[j];
				if (!object_info.public_fun_impl_map[vv])
					throw new Exception('XUIClass::PFNI', 
						'XUIClass: Public function ' + vv + ' not implemented. ');
				makeProperty(object, vv, object_info.public_fun_impl_map[vv], false);
			}
		}
	}

	function addMessageHandingMechanism(object_info, object, parent_list) {
		var maps = object_info.message_map;
		var handlers = object_info.message_handlers;

		maps = maps || {};

		for (var k in maps) {
			var v = maps[k];
			for (var i = 0; i < v.length; i++) {
				var vv = v[i];
				if (vv.chain) {
					var parent_name = vv.chain;
					var parent = null;
					for (var j = 0; j < parent_list.length; j++) {
						var vvv = parent_list[j];
						if (vvv.name == parent_name) {
							parent = vvv.obj;
							break;
						}
					}
					if (!parent)
						throw new Exception('XUIClass::NDP', 
								'XUIClass: ' + parent_name + ' not a direct parent of this class. ');
					vv.chain = parent;
				} else if (!handlers[vv.handler])
					throw new 
							Exception('XUIClass::MHND', 'XUIClass: Message handler ' + vv.handler + ' not defined. ');
			}
		}

		Object.defineProperty(object, '$DISPATCH_MESSAGE', {
			enumerable : false,
			configurable : false,
			writable : false,
			value : function (type, msg) {
				var map = maps && maps[type];
				var handled = false;
				if (!map) {
					for (var i = 0; i < parent_list.length; i++) {
						handled = parent_list[i].obj.$DISPATCH_MESSAGE(type, msg);
						if (handled) break;
					}
				} else {
					for (var i = 0; i < map.length; i++) {
						var v = map[i];
						if (v.chain)
							handled = v.chain.$DISPATCH_MESSAGE(type, msg);
						else if (v.id == msg.id)
							handled = handlers[v.handler](msg);
						if (handled) break;
					}
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
				for (var i = 0; i < parent_list.length; i++)
					parent_list[i].obj.$THIS = val;
			},
			get: function () 
			{
				return real_obj;			
			}
		});
	}

	function buildProtectedThisReferenceObject(object, protected_this_reference) {

		for (var k in object) {
			if (!object.hasOwnProperty(k)) continue;
			if (typeof object[k] != "function")
				makeReference(protected_this_reference, k, object, k);
			else
				(function(k){
					Object.defineProperty(protected_this_reference, k, 
					{
						enumerable : true,
						configurable : true,
						set: function (val) 
						{
							protected_this_reference.$THIS[k] = val;
						},
						get: function () 
						{
							return protected_this_reference.$THIS[k];
						}
					});
				})(k);
		}

		makeReference(protected_this_reference, '$THIS', object, '$THIS');
		makeReference(protected_this_reference, '$PARENT', object, '$PARENT');
		makeReference(protected_this_reference, '$DISPATCH_MESSAGE', object, '$DISPATCH_MESSAGE');

		protected_this_reference.$SELFOBJ = object;
	}

	function construct(object_info, args) {

		object_info.constructor_list =
			object_info.constructor_list || [];

		for (var i = 0; i < object_info.constructor_list.length; i++)
			object_info.constructor_list[i].apply(global, args);
	}


	function dealWithStatic(list) {
		for (var k in list) {
			var v = list[k];
			makeProperty(this, k, v, typeof v != 'function');
		}
	}

	

	function addClass(name, object) {
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

		makeProperty(c, name.last(), object, false);
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

	function profile_new_object(name) {
		var hash = global.$OBJPROFILE = global.$OBJPROFILE || {};
		if (!(name in hash))
			hash[name] = 0;
		hash[name]++;
	}

})(window);

