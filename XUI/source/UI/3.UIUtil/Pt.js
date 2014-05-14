;

$STRUCT('UI.Pt', function(SELF){

	$PUBLIC_VAR({
		'x' : 0,
		'y' : 0
	});

	$PUBLIC_FUN([
		'inRect',
		'toString',
		'equals',
	]);


	$CONSTRUCTOR(function(x, y){

		// overload function()
		// 			function(pt)

		if (typeof x == 'undefined')
			return;

		if (x.instanceOf && x.instanceOf(UI.Pt)) {
			var pt = x;
			this.x = pt.x;
			this.y = pt.y;
			return;
		}

		this.x = x;
		this.y = y;
	});

	$PUBLIC_FUN_IMPL('equals', function(other) {
		return this.x == other.x && this.y == other.y;
	});

	$PUBLIC_FUN_IMPL('inRect', function(rc){
		return this.x >= rc.left &&
			this.x < rc.right &&
			this.y >= rc.top &&
			this.y < rc.bottom;
	});

	$PUBLIC_FUN_IMPL('toString', function(){
		return 'x:%, y:%'.format(this.x, this.y);
	});

});