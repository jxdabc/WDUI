;

$CLASS('UI.Pt', function(){

	$PUBLIC({
		'x' : 0,
		'y' : 0
	});


	$CONSTRUCTOR(function(x, y){
		if (typeof x != 'undefined' &&
			typeof y != 'undefined')
		{
			this.x = x;
			this.y = y;
		}
	});


});