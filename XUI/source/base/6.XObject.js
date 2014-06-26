;

$CLASS('XObject', function(me){

	$PUBLIC_FUN([
		'toString',
		'getClassName',
		'instanceOf'
	]);

	$CONSTRUCTOR(function(){
	});

	$PUBLIC_FUN_IMPL('toString', function(){
		return 'XObject: ' + me.$THIS.classobj.classname;
	});

	$PUBLIC_FUN_IMPL('getClassName', function(){
		return me.$THIS.classobj.classname;
	});

	$PUBLIC_FUN_IMPL('instanceOf', function(cls){
		if (typeof cls == "string") {
			try {
				cls = eval(cls);
			} catch(e) {
			}
		}
		if (typeof cls != "function")
			return false;

		var c = me.$THIS.classobj;

		return isCls1DerivedClassOfCls2(c, cls);	
	});

	function isCls1DerivedClassOfCls2(cls1, cls2) {
		if (cls1 == cls2) return true;
		for (var i = 0; i < cls1.parent_classes.length; i++) {
			if (isCls1DerivedClassOfCls2(cls1.parent_classes[i], cls2)) return true;
		}
		return false;
	}

});