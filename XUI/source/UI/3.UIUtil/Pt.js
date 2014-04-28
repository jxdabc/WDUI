;

$CLASS('UI.Pt', function(me){

	$PUBLIC_VAR({
		'x' : 0,
		'y' : 0
	});

	$PUBLIC_FUN([
		'inRect',
		'toString',
	]);


	$CONSTRUCTOR(function(x, y){

		// overload function()
		// 			function(pt)

		if (typeof x == 'undefined')
			return;

		if (x.instanceOf && x.instanceOf(UI.Pt)) {
			var pt = x;
			me.x = pt.x;
			me.y = pt.y;
			return;
		}

		me.x = x;
		me.y = y;
	});

	$PUBLIC_FUN_IMPL('inRect', function(rc){
		return me.x >= rc.left &&
			me.x < rc.right &&
			me.y >= rc.top &&
			me.y < rc.bottom;
	});

	$PUBLIC_FUN_IMPL('toString', function(){
		return 'x:%, y:%'.format(me.x, me.y);
	});

});