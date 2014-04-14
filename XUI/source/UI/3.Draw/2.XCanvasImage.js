;

$CLASS('UI.XCanvasImage', function(me){

	
	$PUBLIC_FUN([
		'getWidth',
		'getHeight',
		
		'clip',
		
		'draw',
		'getCanvas',
		'getImageData'
	]);

	$PUBLIC_VAR({		
		'src' : ''
	});

	var m_canvas;

	$CONSTRUCTOR(function(img_src, sx, sy, sw, sh){

		// overload function(img_src)

		var width = sw || img_src.width;
		var height = sh || img_src.height;

		m_canvas = document.createElement('canvas');
		m_canvas.width = width;
		m_canvas.height = height;

		var ctx = m_canvas.getContext('2d');

		if (typeof sx != 'undefined') 
			ctx.drawImage(img_src, sx, sy, sw, sh, 0, 0, sw, sh);
		else ctx.drawImage(img_src, 0, 0);

		me.src = img_src.src;
	});

	$PUBLIC_FUN_IMPL('getWidth', function () {return m_canvas.width;});
	$PUBLIC_FUN_IMPL('getHeight', function () {return m_canvas.height;});

	$PUBLIC_FUN_IMPL('clip', function (x, y, width, height) {
		
		var new_canvas = document.createElement('canvas');
		new_canvas.width = width;
		new_canvas.height = height;

		var ctx = new_canvas.getContext('2d');
		ctx.drawImage(m_canvas, x, y, width, height,
			0, 0, width, height);
		m_canvas = new_canvas;
	});

	$PUBLIC_FUN_IMPL('draw', function draw(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
		if (sx.instanceOf && sx.instanceOf(UI.Rect)) {
			var src = sx, drc = sy;
			draw(ctx, 
				src.left, src.top, src.width(), src.height(),
				drc.left, drc.top, drc.width(), drc.height());
		}
		else {

			if ((sw != dw || sh != dh) && (m_canvas.width != sw || m_canvas.height != sh)) {
				// BUGFIX: Canvas (IE11 & Chrome33) will do scaling interpolation
				// beyond the sx,sy,sw,sh boundary. So we have to clip the image first.
				var clipped_img = new UI.XCanvasImage(m_canvas, sx, sy, sw, sh);
				clipped_img.draw(ctx, 0, 0, sw, sh, dx, dy, dw, dh);
			} 
			else
				ctx.drawImage(m_canvas, sx, sy, sw, sh, dx, dy, dw, dh);
		}
			
	});

	$PUBLIC_FUN_IMPL('getCanvas', function () {
		return m_canvas;
	});

	$PUBLIC_FUN_IMPL('getImageData', function () {
		return m_canvas
			.getContext('2d')
			.getImageData(0, 0, m_canvas.width, m_canvas.height);
	});

});