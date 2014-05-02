;

(function(){
	$CLASS('UI.ImageUtil', function(me,SELF){

	}).
	$STATIC({
		getImageDataRGBA : getImageDataRGBA,
	});

	function getImageDataRGBA(data, x, y, img_width, debug){
		var r,g,b,a;
		var base = (y * img_width + x) * 4;
		r = data[base], g = data[base + 1], b = data[base + 2], a = data[base + 3];
		if (debug) console.log('x == x: '  + base);
		return r << 24 | g << 16 | b << 8 | a;
	}

})();

