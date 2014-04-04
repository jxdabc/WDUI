;


$CLASS('UI.Size', function(){

	$PUBLIC({
		'w' : 0,
		'h' : 0
	});


	$CONSTRUCTOR(function(w, h){
		if (typeof w != 'undefined' &&
			typeof h != 'undefined')
		{
			this.w = w;
			this.h = h;
		}
	});


});