;

$CLASS('UI.XImageCanvasImage', 
$EXTENDS(UI.IXImage),
function(){

	var m_img;
	var m_buffer;

	var m_draw_type = 
		UI.XImageCanvasImage.$S('DrawType').$S('DIT_NORMAL');
	var m_formatted_img;
	var m_alpha = 255;

	var m_src_rect = new UI.Rect();
	var m_dst_rect = new UI.Rect();
	var m_part_rect = new UI.Rect();

	var m_unloaded_part_rect = null;
	var m_unloaded_src_rect = null;

	var m_loaded = false;


	$PUBLIC({
		'load' : load,

		'setSrcRect'  : setSrcRect,
		'setDstRect'  : setDstRect,
		'setDrawType' : setDrawType,
		'setPartRect' : setPartRect,
		'setAlpha' : setAlpha,

		'getImageWidth' : getImageWidth,
		'getImageHeight' : getImageHeight,

		'draw' : draw
	});

	function load(path) {

		m_unloaded_src_rect = m_unloaded_part_rect = null;

		if (path.substr(0, 1) == '@')
			loadAsResource(path.substr(1));
		else 
			loadImageObject(path);
	}

	function loadAsResource(path) { 
		var mgr = new UI.ResourceMgr.$S('instance')();
		mgr.getResourcePath(path, function(real_path){
			load(real_path); 
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

		if (m_unloaded_part_rect) m_part_rect = m_unloaded_part_rect;
		else loadFormattedImageInfo();

		if (m_unloaded_src_rect) m_src_rect = m_unloaded_src_rect;
		else initSrcRect();
	}


	function releaseBuffer() {
		m_buffer = null;
	}

	function refreshBuffer() {
		releaseBuffer();

		m_buffer = document.createElement('canvas');
		m_buffer.width = m_dst_rect.width;
		m_buffer.height = m_dst_rect.height;

		switch (m_draw_type)
		{
			case UI.XImageCanvasImage.$S('DrawType').$S('DIT_NORMAL'): 
				drawNormal(m_buffer.getContext('2d')); 
				break;
			case UI.XImageCanvasImage.$S('DrawType').$S('DIT_STRETCH'):  
				drawStretch(m_buffer.getContext('2d')); 
				break;
			case UI.XImageCanvasImage.$S('DrawType').$S('DIT_9PART'): 
				draw9Part(m_buffer.getContext('2d')); 
				break;
			case UI.XImageCanvasImage.$S('DrawType').$S('DIT_3PARTH'): 
				draw3PartH(m_buffer.getContext('2d')); 
				break;
			case UI.XImageCanvasImage.$S('DrawType').$S('DIT_3PARTV'): 
				draw3PartV(m_buffer.getContext('2d')); 
				break;
		}
	}

	function loadFormattedImageInfo() {
		m_formatted_img = true;
		if (m_img.src.toLowerCase().indexOf('.normal.') != -1)
			m_draw_type = UI.XImageCanvasImage.$S('DrawType').$S('DIT_NORMAL');
		else if (m_img.src.toLowerCase().indexOf('.stretch.') != -1)
			m_draw_type = UI.XImageCanvasImage.$S('DrawType').$S('DIT_STRETCH');
		else if (m_img.src.toLowerCase().indexOf('.9.') != -1) {
			m_draw_type = UI.XImageCanvasImage.$S('DrawType').$S('DIT_9PART');
			loadFormattedImagePartInfo();
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

	function getImageWidth() {
		return m_img.getWidth();
	}

	function getImageHeight() {
		return m_img.getHeight();
	}

	function setSrcRect(rc) {

		if (!m_loaded) {
			m_unloaded_src_rect = rc;
			return;
		}

		if (m_src_rect.equal(rc))
			return;

		releaseBuffer();
		m_src_rect = rc;
	}

	function setDstRect(rc) {
		if (m_dst_rect.equal(rc))
			return;

		releaseBuffer();
		m_dst_rect = rc;
	}

	function setDrawType(type) {

		if (m_draw_type == type)
			return;

		releaseBuffer();
		m_draw_type = type;
	} 

	function setPartRect(rc) {

		if (!m_loaded) {
			m_unloaded_part_rect = rc;
			return;
		}

		if (m_part_rect.equal(rc))
			return;

		releaseBuffer();
		m_part_rect = rc;
	}

	function setAlpha(alpha) {
		m_alpha = alpha;
	}

	function draw(ctx, rect_to_draw) {
		
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
		m_img.draw(ctx, src_to_draw_real, dst_to_draw_real);
		ctx.restore();
	}

});
