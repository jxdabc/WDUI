;

$CLASS('UI.XTextCanvasText', 
$EXTENDS(UI.IXText),
function(me, SELF){

	$PUBLIC_FUN([
		'draw',

		'setAlpha',
		'setDstRect',

		'getText',
		'measure',

		'setText',
		'setFont',
		'setColor',
		'setAlignment'
	]);

	var m_alpha = 255;
	var m_dst_rect = new UI.Rect();
	var m_text = '';
	var m_face = 'Verdana, Arial, 微软雅黑, 宋体';
	var m_size = 12;
	var m_style = SELF.Style.STYLE_NORMAL;
	var m_color = '#000';
	var m_halign = SELF.Align.ALIGN_START;
	var m_valign = SELF.Align.ALIGN_START;

	var m_buffer = null;

	$PUBLIC_FUN_IMPL('draw', function (ctx, rect_to_draw) {
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
	});

	$PUBLIC_FUN_IMPL('setAlpha', function (alpha) {
		m_alpha = alpha;
	});

	$PUBLIC_FUN_IMPL('setDstRect', function (rc) {
		if (rc.equals(m_dst_rect)) return;

		releaseBuffer();
		m_dst_rect  = rc;
	});

	$PUBLIC_FUN_IMPL('getText', function () {
		return m_text;
	});

	$PUBLIC_FUN_IMPL('measure', function () {

	});

	$PUBLIC_FUN_IMPL('setText', function (text) {
		
		if (text == m_text) return;

		releaseBuffer();
		m_text = text;
	});

	$PUBLIC_FUN_IMPL('setFont', function (face, size, style) {
		if (m_face == face &&
			m_size == size &&
			m_style == style)
			return;

		releaseBuffer();
		m_face = face;
		m_size = size;
		m_style = style;
	});

	$PUBLIC_FUN_IMPL('setColor', function (color) {
		m_color = color;
	});

	$PUBLIC_FUN_IMPL('setAlignment', function (halign, valign) {
		if (m_halign == halign
			&& m_valign == valign)
			return;

		releaseBuffer();
		m_halign = halign;
		m_valign = valign;
	});

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
			!!(m_style & SELF.Style.STYLE_BOLD)
		);
		canvas_text.setItalic(
			!!(m_style & SELF.Style.STYLE_ITARIC)
		);

		canvas_text.draw(m_buffer.getContext('2d'),
			m_text, 
			new UI.Rect(new UI.Pt(0, 0), new UI.Size(m_dst_rect.width(), m_dst_rect.height())),
			convertAlignment(m_halign),
			convertAlignment(m_valign)
		);
	}


	function convertAlignment(this_align) {
		switch (this_align) {
			case SELF.Align.ALIGN_START:
				return UI.XCanvasText.Align.ALIGN_START;
			case SELF.Align.ALIGN_MIDDLE:
				return UI.XCanvasText.Align.ALIGN_MIDDLE;
			case SELF.Align.ALIGN_END:
				return UI.XCanvasText.Align.ALIGN_END;
		}
	}


});

$ENUM('UI.XTextCanvasText.Align', 
[
	'ALIGN_START',
	'ALIGN_MIDDLE',
	'ALIGN_END'
]);

$ENUM('UI.XTextCanvasText.Style', 
{
	'STYLE_NORMAL'		: 0x0,
	'STYLE_ITARIC' 		: 0x1,
	'STYLE_BOLD'		: 0x2,
	'STYLE_ITARIC_BOLD' : 0x3
});