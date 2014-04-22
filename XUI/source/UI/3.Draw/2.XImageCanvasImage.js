;

$CLASS('UI.XImageCanvasImage', 
$EXTENDS(UI.IXImage),
function(me, SELF){

	$PUBLIC_FUN([
		'load',

		'setSrcRect',
		'setDstRect',
		'setDrawType',
		'setPartRect',
		'setAlpha',

		'getImageWidth',
		'getImageHeight',

		'draw',

		'onImageLoaded',
		'offImageLoaded'
	]);


	var m_img;
	var m_buffer;

	var m_draw_type = 
		SELF.DrawType.DIT_NORMAL;
	var m_formatted_img;
	var m_alpha = 255;

	var m_src_rect = new UI.Rect();
	var m_dst_rect = new UI.Rect();
	var m_part_rect = new UI.Rect();

	var m_unloaded_part_rect = null;
	var m_unloaded_src_rect = null;
	var m_unloaded_draw_type = null;

	var m_loaded = false;
	var m_image_loaded_listener = [];


	$PUBLIC_FUN_IMPL('load', function (path) {

		m_unloaded_src_rect = 
		m_unloaded_part_rect = 
		m_unloaded_draw_type =
		null;

		if (path.substr(0, 1) == '@')
			loadAsResource(path.substr(1));
		else 
			loadImageObject(path);
	});

	$PUBLIC_FUN_IMPL('setSrcRect', function (rc) {

		if (!m_loaded) {
			m_unloaded_src_rect = rc;
			return;
		}

		if (m_src_rect.equals(rc))
			return;

		releaseBuffer();
		m_src_rect = rc;
	});

	$PUBLIC_FUN_IMPL('setDstRect', function (rc) {
		if (m_dst_rect.equals(rc))
			return;

		releaseBuffer();
		m_dst_rect = rc;
	});

	$PUBLIC_FUN_IMPL('setDrawType',	function (type) {

		if (!m_loaded) {
			m_unloaded_draw_type = type;
			return;
		}

		if (m_draw_type == type)
			return;

		releaseBuffer();
		m_draw_type = type;
	});

	$PUBLIC_FUN_IMPL('setPartRect', function (rc) {

		if (!m_loaded) {
			m_unloaded_part_rect = rc;
			return;
		}

		if (m_part_rect.equals(rc))
			return;

		releaseBuffer();
		m_part_rect = rc;
	});

	$PUBLIC_FUN_IMPL('setAlpha', function (alpha) {
		m_alpha = alpha;
	});

	$PUBLIC_FUN_IMPL('getImageWidth', function () {
		if (!m_loaded) return 0;
		return m_img.getWidth();
	});
	$PUBLIC_FUN_IMPL('getImageHeight', function () {
		if (!m_loaded) return 0;
		return m_img.getHeight();
	});

	$PUBLIC_FUN_IMPL('draw', function (ctx, rect_to_draw) {
		
		if (!m_loaded) return;

		if (!m_buffer) refreshBuffer();

		var dst_to_draw_real =
			rect_to_draw.intersect(m_dst_rect);

		if (dst_to_draw_real.isEmpty()) return;

		var src_to_draw_real = 
			new UI.Rect(dst_to_draw_real);
		src_to_draw_real.offset(- m_dst_rect.left, - m_dst_rect.top);

		ctx.save();
		ctx.globalAlpha = m_alpha;
		//m_img.draw(ctx, src_to_draw_real, dst_to_draw_real);
		ctx.drawImage(m_buffer, 
			src_to_draw_real.left, src_to_draw_real.top, src_to_draw_real.width(), src_to_draw_real.height(),
			dst_to_draw_real.left, dst_to_draw_real.top, dst_to_draw_real.width(), dst_to_draw_real.height());
		ctx.restore();
	});

	$PUBLIC_FUN_IMPL('onImageLoaded', function (fn) {
		m_image_loaded_listener.push(fn);
	});

	$PUBLIC_FUN_IMPL('offImageLoaded', function (fn) {
		var index = m_image_loaded_listener.indexOf(fn);
		if (index == -1) return;
		m_image_loaded_listener.splice(index, 1);
	});




	function loadAsResource(path) { 
		var mgr = UI.XResourceMgr.instance();
		mgr.getResourcePath(path, function(real_path){
			loadImageObject(real_path); 
		});
	}
	
	function loadImageObject(path) {

		m_loaded = false;

		m_img = new Image();
		$(m_img).on('load', onImgLoaded);
		
		m_img.src = path;
	}

	function onImgLoaded() {
		m_loaded = true;

		m_img = new UI.XCanvasImage(m_img);

		releaseBuffer();

		loadFormattedImageInfo();
		m_draw_type = m_unloaded_draw_type || m_draw_type;
		m_part_rect = m_unloaded_part_rect || m_part_rect;

		if (m_unloaded_src_rect) m_src_rect = m_unloaded_src_rect;
		else initSrcRect();

		$.each(m_image_loaded_listener, function(i,v){
			v.call(me.$THIS);
		});
	}


	function releaseBuffer() {
		m_buffer = null;
	}

	function refreshBuffer() {
		releaseBuffer();

		m_buffer = document.createElement('canvas');
		m_buffer.width = m_dst_rect.width();
		m_buffer.height = m_dst_rect.height();

		switch (m_draw_type)
		{
			case SELF.DrawType.DIT_NORMAL: 
				drawNormal(m_buffer.getContext('2d')); 
				break;
			case SELF.DrawType.DIT_STRETCH:  
				drawStretch(m_buffer.getContext('2d')); 
				break;
			case SELF.DrawType.DIT_9PART: 
				draw9Part(m_buffer.getContext('2d')); 
				break;
			case SELF.DrawType.DIT_3PARTH: 
				draw3PartH(m_buffer.getContext('2d')); 
				break;
			case SELF.DrawType.DIT_3PARTV: 
				draw3PartV(m_buffer.getContext('2d')); 
				break;
		}
	}

	function drawNormal(ctx) {

		var width = m_src_rect.width();
		var height = m_src_rect.height();

		m_img.draw(ctx, 
		new UI.Rect(m_src_rect.left, m_src_rect.top, width, height),
		new UI.Rect(0, 0, width, height));
	}

	function drawStretch(ctx) {
		m_img.draw(ctx, 
		new UI.Rect(m_src_rect.left, m_src_rect.top, m_src_rect.width(), m_src_rect.height()),
		new UI.Rect(0, 0, m_dst_rect.width(), m_dst_rect.height()));
	}

	function draw9Part(ctx) {
		var rect_part_raw = new UI.Rect(m_part_rect);
		rect_part_raw.offset(m_src_rect.leftTop());	
		var rect_part = rect_part_raw.intersect(m_src_rect);
		if (rect_part.isEmpty()) 
			rect_part = new UI.Rect();

		var src_rect_array = 
		[
			new UI.Rect(new UI.Pt(m_src_rect.left, m_src_rect.top), new UI.Size(rect_part.left - m_src_rect.left, rect_part.top - m_src_rect.top)),
			new UI.Rect(new UI.Pt(rect_part.left, m_src_rect.top), new UI.Size(rect_part.width(), rect_part.top - m_src_rect.top)),
			new UI.Rect(new UI.Pt(rect_part.right, m_src_rect.top), new UI.Size(m_src_rect.right - rect_part.right, rect_part.top - m_src_rect.top)),
			new UI.Rect(new UI.Pt(m_src_rect.left, rect_part.top), new UI.Size(rect_part.left - m_src_rect.left, rect_part.height())),
			new UI.Rect(new UI.Pt(rect_part.left, rect_part.top), new UI.Size(rect_part.width(), rect_part.height())),
			new UI.Rect(new UI.Pt(rect_part.right, rect_part.top), new UI.Size(m_src_rect.right - rect_part.right, rect_part.height())),
			new UI.Rect(new UI.Pt(m_src_rect.left, rect_part.bottom), new UI.Size(rect_part.left - m_src_rect.left, m_src_rect.bottom - rect_part.bottom)),
			new UI.Rect(new UI.Pt(rect_part.left, rect_part.bottom), new UI.Size(rect_part.width(), m_src_rect.bottom - rect_part.bottom)),
			new UI.Rect(new UI.Pt(rect_part.right, rect_part.bottom), new UI.Size(m_src_rect.right - rect_part.right, m_src_rect.bottom - rect_part.bottom))
		];

		var rect_dst_part = new UI.Rect(rect_part.left - m_src_rect.left, rect_part.top - m_src_rect.top, 
						m_dst_rect.right - (m_src_rect.right - rect_part.right) - m_dst_rect.left, 
						m_dst_rect.bottom - (m_src_rect.bottom - rect_part.bottom) - m_dst_rect.top);

		var dst_rect_array = 
		[
			new UI.Rect(new UI.Pt(0, 0), new UI.Size(rect_dst_part.left, rect_dst_part.top)),
			new UI.Rect(new UI.Pt(rect_dst_part.left, 0), new UI.Size(rect_dst_part.width(), rect_dst_part.top)),
			new UI.Rect(new UI.Pt(rect_dst_part.right, 0), new UI.Size(m_dst_rect.right - m_dst_rect.left - rect_dst_part.right, rect_dst_part.top)),
			new UI.Rect(new UI.Pt(0, rect_dst_part.top), new UI.Size(rect_dst_part.left, rect_dst_part.height())),
			new UI.Rect(new UI.Pt(rect_dst_part.left, rect_dst_part.top), new UI.Size(rect_dst_part.width(), rect_dst_part.height())),
			new UI.Rect(new UI.Pt(rect_dst_part.right, rect_dst_part.top), new UI.Size(m_dst_rect.right - m_dst_rect.left - rect_dst_part.right, rect_dst_part.height())),
			new UI.Rect(new UI.Pt(0, rect_dst_part.bottom), new UI.Size(rect_dst_part.left, m_dst_rect.bottom - m_dst_rect.top - rect_dst_part.bottom)),
			new UI.Rect(new UI.Pt(rect_dst_part.left, rect_dst_part.bottom), new UI.Size(rect_dst_part.width(), m_dst_rect.bottom - m_dst_rect.top - rect_dst_part.bottom)),
			new UI.Rect(new UI.Pt(rect_dst_part.right, rect_dst_part.bottom), new UI.Size(m_dst_rect.right - m_dst_rect.left - rect_dst_part.right, m_dst_rect.bottom - m_dst_rect.top - rect_dst_part.bottom))	
		]


		$.each(src_rect_array, function(i,v){
			var src = v;
			var dst = dst_rect_array[i];

			if (src.isEmpty() || dst.isEmpty()) return;

			m_img.draw(ctx, src, dst);
		});
	}

	function draw3PartH(ctx) {

		if (m_part_rect.top != 0 || m_part_rect.bottom != m_img.getHeight())
			throw new Exception('UI.XImageCanvasImage::D3PHPW', 
				'UI.XImageCanvasImage: Drawing 3 part horizontally with a wrong part rect. ');
		draw9Part(ctx);
	}

	function draw3PartV(ctx) {
		if (m_part_rect.left != 0 || m_part_rect.right != m_img.getWidth())
			throw new Exception('UI.XImageCanvasImage::D3PVPW', 
				'UI.XImageCanvasImage: Drawing 3 part vertically with a wrong part rect. ');
		draw9Part(ctx);
	}


	function loadFormattedImageInfo() {
		m_formatted_img = true;
		if (m_img.src.toLowerCase().indexOf('.normal.') != -1)
			m_draw_type = SELF.DrawType.DIT_NORMAL;
		else if (m_img.src.toLowerCase().indexOf('.stretch.') != -1)
			m_draw_type = SELF.DrawType.DIT_STRETCH;
		else if (m_img.src.toLowerCase().indexOf('.9.') != -1) {
			m_draw_type = SELF.DrawType.DIT_9PART;
			if (m_unloaded_part_rect) m_part_rect = m_unloaded_part_rect;
			else loadFormattedImagePartInfo();
			m_img.clip(1, 1, m_img.getWidth() - 2, m_img.getHeight() - 2);
		}
		else
			m_formatted_img = false;
	}

	function loadFormattedImagePartInfo() {
		var data = m_img.getImageData();
		data = data.data;

		// 9-part images have 1-pixel borders on each side.
		var img_real_width = m_img.getWidth() - 2;
		var img_real_height = m_img.getHeight() - 2;

		// X
		for (var i = 0; i < img_real_width; i++)
			if (getRGBA(data, i + 1, 0, m_img.getWidth()) == 0x000000FF) {
				m_part_rect.left = i;
				break;
			}
		if (i >= img_real_width) {
			m_part_rect.left = 0;
			m_part_rect.right = img_real_width;
		} else {
			for (i++; i < img_real_width; i++)
				if (getRGBA(data, i + 1, 0, m_img.getWidth()) != 0x000000FF) {
					m_part_rect.right = i;
					break;
				}

			if (i >= img_real_width)
				m_part_rect.right = img_real_width;
		}

		// Y
		for (var j = 0; j < img_real_height; j++)
		{
			if (getRGBA(data, 0, j + 1, m_img.getWidth()) == 0x000000FF) {
				m_part_rect.top = j;
				break;
			}
		}
		if (j >= img_real_height) {
			m_part_rect.top = 0;
			m_part_rect.bottom = img_real_height;
		} else {
			for (j++; j < img_real_height; j++)
				if (getRGBA(data, 0, j + 1, m_img.getWidth()) != 0x000000FF) {
					m_part_rect.bottom = j;
					break;
				}

			if (j >= img_real_height)
				m_part_rect.bottom = img_real_height;
		}
	}

	function initSrcRect() {
		m_src_rect.left = m_src_rect.top = 0;
		m_src_rect.right = m_img.getWidth();
		m_src_rect.bottom = m_img.getHeight();
	}

	function getRGBA(data, x, y, img_width)
	{
		var r,g,b,a;
		var base = (y * img_width + x) * 4;
		r = data[base], g = data[base + 1], b = data[base + 2], a = data[base + 3];
		return r << 24 | g << 16 | b << 8 | a;
	}



	
	

});
