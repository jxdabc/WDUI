$CLASS('UI.XCanvasImage', function(){


	var canvas;

	$PUBLIC({
		'getWidth' : getWidth,
		'getHeight' : getHeight,
		
		'clip' : clip,
		
		'draw' : draw,
		'getCanvas' : getCanvas,
		'getImageData' : getImageData,
		
		'src' : ''
	});

	$CONSTRUCTOR(function(img_src){

		var width = img_src.width;
		var height = img_src.height;

		canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		var ctx = canvas.getContext('2d');
		ctx.drawImage(img_src, 0, 0);

		this.src = img_src.src;
	});

	function clip(x, y, width, height) {
		
		var new_canvas = document.createElement('canvas');
		new_canvas.width = width;
		new_canvas.height = height;

		var ctx = new_canvas.getContext('2d');
		ctx.drawImage(canvas, x, y, width, height,
			0, 0, width, height);
		canvas = new_canvas;
	}

	function getWidth() {return canvas.width;}
	function getHeight() {return canvas.height;}


	function getCanvas() {
		return canvas;
	}

	function getImageData() {
		return canvas
			.getContext('2d')
			.getImageData(0, 0, canvas.width, canvas.height);
	}

	function draw(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
		if (sx.instanceOf && sx.instanceOf(UI.Rect)) {
			var src = sx, drc = sy;
			draw(ctx, 
				src.left, src.top, src.width(), src.height(),
				drc.left, drc.top, drc.width(), drc.height());
		}
		else
			ctx.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
	}

});