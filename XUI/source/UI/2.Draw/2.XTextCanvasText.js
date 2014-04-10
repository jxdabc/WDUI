;

$CLASS('UI.XTextCanvasText', function(me){

	$PUBLIC({
		'draw' : draw,

		'setAlpha' 		: setAlpha,
		'setDstRect' 	: setDstRect,

		'getText'		: getText,
		'measure'		: measure,

		'setText'		: setText,
		'setFont'		: setFont,
		'setColor'		: setColor,
		'setAlignment'	: setAlignment,
	});


	var m_alpha = 255;
	var m_dst_rect = new UI.Rect();
	var m_text = '';
	var m_face = 'Verdana, Arial, 微软雅黑, 宋体';
	var m_size = 12;
	var m_style = UI.XTextCanvasText.Style.STYLE_NORMAL;
	var m_color = '#000';
	var m_halign = UI.XTextCanvasText.Align.ALIGN_START;
	var m_valign = UI.XTextCanvasText.Align.ALIGN_START;

	var m_buffer = null;


	function setAlpha(alpha) {
		m_alpha = alpha;
	};

	function setDstRect(rc) {
		if (rc.equals(m_dst_rect)) return;

		releaseBuffer();
		m_dst_rect  = rc;
	}

	function setText(text) {
		
		if (text == m_text) return;

		releaseBuffer();
		m_text = text;
	}

	function getText() {
		return m_text;
	}

	function setFont(face, size, style) {
		if (m_face == face &&
			m_size == size &&
			m_style == style)
			return;

		releaseBuffer();
		m_face = face;
		m_size = size;
		m_style = style;
	}

	function setColor(color) {
		m_color = color;
	}

	function setAlignment(halign, valign) {
		if (m_halign == halign
			&& m_valign == valign)
			return;

		releaseBuffer();
		m_halign = halign;
		m_valign = valign;
	}


	function releaseBuffer() {
		m_buffer = null;		
	}

	function refreshBuffer() {
		releaseBuffer();

		m_buffer = document.createElement('canvas');
		m_buffer.width = m_dst_rect.width();
		m_buffer.height = m_dst_rect.height();

		var canvas_text = new UI.XCanvasText();
		canvas_text.setFontFace(m_face);
		canvas_text.setFontSize(m_size);
		canvas_text.setFontColor(m_color);

		canvas_text.setBold(
			!!(m_style & UI.XTextCanvasText.Style.STYLE_BOLD)
		);
		canvas_text.setItalic(
			!!(m_style & UI.XTextCanvasText.Style.STYLE_ITARIC)
		);

		canvas_text.draw(m_buffer.getContext('2d'),
			m_text, 
			new UI.Rect(new UI.Pt(0, 0), new UI.Size(m_dst_rect.width(), m_dst_rect.height())),
			convertAlignment(m_halign),
			convertAlignment(m_valign)
		);
	}

	function draw(ctx, rect_to_draw) {
		if (!m_buffer) refreshBuffer();

		var dst_to_draw_real =
			rect_to_draw.intersect(m_dst_rect);

		if (dst_to_draw_real.isEmpty()) return;

		var src_to_draw_real = 
			new UI.Rect(dst_to_draw_real);
		src_to_draw_real.offset(- m_dst_rect.left, - m_dst_rect.top);

		ctx.save();
		ctx.globalAlpha = m_alpha;
		ctx.drawImage(m_buffer, 
			src_to_draw_real.left, src_to_draw_real.top, src_to_draw_real.width(), src_to_draw_real.height(),
			dst_to_draw_real.left, dst_to_draw_real.top, dst_to_draw_real.width(), dst_to_draw_real.height());
		ctx.restore();
	}

	function measure() {

	}

	function convertAlignment(this_align) {
		switch (this_align) {
			case UI.XTextCanvasText.Align.ALIGN_START:
				return UI.XCanvasText.Align.ALIGN_START;
			case UI.XTextCanvasText.Align.ALIGN_MIDDLE:
				return UI.XCanvasText.Align.ALIGN_MIDDLE;
			case UI.XTextCanvasText.Align.ALIGN_END:
				return UI.XCanvasText.Align.ALIGN_END;
		}
	}


});


$CLASS('UI.XTextCanvasText.Align', function(me){})
.$STATIC({
	'ALIGN_START' 	: new UI.XTextCanvasText.Align(),
	'ALIGN_MIDDLE'	: new UI.XTextCanvasText.Align(),
	'ALIGN_END'		: new UI.XTextCanvasText.Align()
});

$CLASS('UI.XTextCanvasText.Style', function(me){})
.$STATIC({
	'STYLE_NORMAL'		: 0x0,
	'STYLE_ITARIC' 		: 0x1,
	'STYLE_BOLD'		: 0x2,
	'STYLE_ITARIC_BOLD' : 0x3
});