;

$CLASS('UI.Pt', function(me){

	$PUBLIC({
		'x' : 0,
		'y' : 0
	});


	$CONSTRUCTOR(function(x, y){
		if (typeof x != 'undefined' &&
			typeof y != 'undefined')
		{
			me.x = x;
			me.y = y;
		}
	});


});