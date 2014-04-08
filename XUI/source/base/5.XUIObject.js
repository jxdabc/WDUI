;

$CLASS('XUIObject', function(me){

	$PUBLIC({
		'toString' : toString,
		'getClassName' : getClassName,
		'instanceOf' : instanceOf
	});

	$CONSTRUCTOR(function(){
	});

	function toString() {
		return 'XUIObject: ' + me.classobj.classname;
	}

	function getClassName() {
		return me.classobj.classname;
	}

	function instanceOf(cls) {
		if (typeof cls == "string") {
			try {
				cls = eval(cls);
			} catch(e) {
			}
		}
		if (typeof cls != "function")
			return false;

		var c = me.classobj;

		return isCls1DerivedClassOfCls2(c, cls);		
	}

	function isCls1DerivedClassOfCls2(cls1, cls2) {
		if (cls1 == cls2) return true;
		for (var i = 0; i < cls1.parent_classes.length; i++) {
			if (isCls1DerivedClassOfCls2(cls1.parent_classes[i], cls2)) return true;
		}
		return false;
	}

});



// $CLASS('TestClass', function() {
// 	$PARENT_CONSTRUCTOR(function(info, arg0, arg1, arg2){
// 		info['XUIObject'] = [arg0, arg1, arg2];
// 	});
// });


// $CLASS('TestClass2', 
// $EXTENDS(TestClass), 
// function() {
// 	$PARENT_CONSTRUCTOR(function(info, arg0, arg1, arg2){
// 		info['TestClass'] = [arg0, arg1, arg2];
// 	});
// });

// $CLASS('TestClass3', 
// $EXTENDS(TestClass),
// function() {

// });

// $CLASS('TestClass4', 
// $EXTENDS(TestClass2, TestClass3),
// function() {

// 	$PARENT_CONSTRUCTOR(function(info, arg0, arg1, arg2){
// 		info['TestClass2'] = [arg0, arg1, arg2];
// 	});


// });

// $CLASS('XUIObject.innerClass', 
// function() {


// });

// $CLASS('XUIObject.innerClass.INNER', 
// function() {


// });
