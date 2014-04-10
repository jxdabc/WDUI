;


$CLASS('UI.XCanvasText', function(me){

	$PUBLIC({
		'draw' : draw,

		'setFontFace'	: setFontFace,
		'setFontSize'	: setFontSize,     // Number. Measured by px.
		'setLineHeight' : setLineHeight, 
		'setFontColor'	: setFontColor,

		'setBold' 		: setBold,
		'setItalic' 	: setItalic
	});

	
	var m_font_face = 'Verdana, Arial, 微软雅黑, 宋体';
	var m_font_size = 12;
	var m_font_color = '#000';

	var m_bold = false;
	var m_italic = false;

	var m_line_height = 12 * 1.5;

	var $body = $('BODY');


	function draw(ctx, string, rect, halign, valign) {

		ctx.save();

		ctx.beginPath();
		ctx.rect(rect.left, rect.top, rect.width(), rect.height());
		ctx.clip();

		var font = '';
		if (m_italic) font += 'italic ';
		if (m_bold) font += 'bold ';
		font += m_font_size + 'px' + ' ';
		font += m_font_face + ' ';

		ctx.font = font;
		ctx.fillStyle = m_font_color;
		ctx.textBaseline = 'top';

		var lines = stringToLines(string, rect.width(), ctx);

		var y_start = getYStart(valign, lines.length, rect.height());
		var y_current = y_start;
		for (var i = 0; i < lines.length; i++) {

			var c = lines[i];
			var x_current = getXStart(halign, c.width, rect.width());

			ctx.fillText(c.text, rect.left + x_current, rect.top + y_current);

			y_current += m_line_height;
		}

		ctx.restore();
	}

	function getYStart(valign, line_count, height) {
		
		if (valign == UI.XCanvasText.Align.ALIGN_MIDDLE)
			return (height - line_count * m_line_height) / 2;

		if (valign == UI.XCanvasText.Align.ALIGN_END)
			return height - line_count * m_line_height;

		return 0;
	}

	function getXStart(halign, line_width, width) {

		if (halign == UI.XCanvasText.Align.ALIGN_MIDDLE)
			return (width - line_width) / 2;

		if (halign == UI.XCanvasText.Align.ALIGN_END)
			return width - line_width;

		return 0;
	}

	function stringToLines(string, max_width, ctx) {

		var lines = [];
		var words = stringToWordArray(string);

		var line = null;
		var width = 0;
		for (var i = 0; i < words.length;) {
			if (!line) {
				line = words[i];
				width = ctx.measureText(line).width;
				i++;
				continue;
			}

			var new_line = line + words[i];
			var new_width = ctx.measureText(new_line).width;
			if (new_width > max_width) {
				lines.push({'text' : line, 'width' : width});
				line = null;
				width = 0;
				continue;
			}

			line = new_line;
			width = new_width;
			i++;
		}

		if (line) lines.push({'text' : line, 'width' : width});

		return lines;
	}

	function stringToWordArray(string) {
		var rst = [];
		var en_split = string.split(/\b/);
		$.each(en_split, function(i,v){
			rst = rst.concat(v.split(/(?![a-zA-Z_0-9])/));
		});

		return rst;
	}

	function measureText(string) {
	}

	function setBold(b) {
		m_bold = b;
	}

	function setItalic(b) {
		m_italic = b;
	}

	function setFontFace(face) {
		m_font_face = face;
	}

	function setFontSize(size) {
		m_font_size = size - 0;
		m_line_height = size * 1.5;
	}

	function setLineHeight(size) {
		m_line_height = size - 0;
	}

	function setFontColor(color) {
		m_font_color = color;
	}
	


});

$CLASS('UI.XCanvasText.Align', function(me){
})
.$STATIC({
	'ALIGN_START' 	: new UI.XCanvasText.Align(),
	'ALIGN_MIDDLE' 	: new UI.XCanvasText.Align(),
	'ALIGN_END' 	: new UI.XCanvasText.Align()
});