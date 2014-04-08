;


$CLASS('UI.Size', function(me){

	$PUBLIC({
		'w' : 0,
		'h' : 0
	});


	$CONSTRUCTOR(function(w, h){
		if (typeof w != 'undefined' &&
			typeof h != 'undefined')
		{
			me.w = w;
			me.h = h;
		}
	});


});