;


$CLASS('UI.XCanvasText', function(me, SELF){

	$PUBLIC_FUN([
		'draw',

		'setFontFace',
		'setFontSize', 	// Number, measured by pixel. 
		'setLineHeight',
		'setFontColor',

		'setBold',
		'setItalic',

		'measureText',
	]);

	var m_line_height_mutiplier = 1.2;

	var m_font_face = 'Arial, \'Microsoft YaHei\'';
	var m_font_size = 14;
	var m_font_color = '#000';

	var m_bold = false;
	var m_italic = false;

	var m_line_height = Math.round(13 * m_line_height_mutiplier);

	var m_measure_canvas = null;

	$PUBLIC_FUN_IMPL('draw', function(ctx, string_or_lines, rect, halign, valign) {

		if (rect.isEmpty()) return;

		ctx.save();

		ctx.beginPath();
		ctx.rect(rect.left, rect.top, rect.width(), rect.height());
		ctx.clip();

		prepareCtxFont(ctx);		

		ctx.fillStyle = m_font_color;
		ctx.textBaseline = 'top';

		var string, lines;

		if (typeof string_or_lines == 'string') string = string_or_lines;
		else lines = string_or_lines;

		if (!lines)
			lines = stringToLines(string, rect.width(), ctx);

		adaptLinesToBorder(ctx, lines, rect.width(), rect.height());

		// TODO: When centering texts vertically, canvas will put the texts a little higher, 
		// so we'll handle vertically centering ourselves by detecting each pixel on the
		// text that is rendered.
		if (valign == SELF.Align.ALIGN_MIDDLE) {
			handleCenterValignText(ctx, lines, rect, halign);
			ctx.restore();
			return;
		}


		var y_start = getYStart(valign, lines.length, rect.height());
		var y_current = y_start + Math.floor((m_line_height - m_font_size) / 2);
		for (var i = 0; i < lines.length; i++) {
			var c = lines[i];
			var x_current = getXStart(halign, c.width, rect.width());

			ctx.fillText(c.text, rect.left + x_current, rect.top + y_current);

			y_current += m_line_height;
		}

		ctx.restore();
	});

	$PUBLIC_FUN_IMPL('setFontFace', function (face) {
		face = normalFontFace(face);
		m_font_face = face;

		m_measure_canvas = null;
	});
	$PUBLIC_FUN_IMPL('setFontSize', function (size) {
		m_font_size = size - 0;
		m_line_height = Math.round(size * m_line_height_mutiplier);

		m_measure_canvas = null;
	});

	$PUBLIC_FUN_IMPL('setLineHeight', function (size) {
		m_line_height = size - 0;

		m_measure_canvas = null;
	});
	$PUBLIC_FUN_IMPL('setFontColor', function (color) {
		m_font_color = color;

		m_measure_canvas = null;
	});
	$PUBLIC_FUN_IMPL('setBold', function (b) {
		m_bold = b;

		m_measure_canvas = null;
	});
	$PUBLIC_FUN_IMPL('setItalic', function (b) {
		m_italic = b;

		m_measure_canvas = null;
	});	

	function getYStart(valign, line_count, height) {
		
		if (valign == SELF.Align.ALIGN_MIDDLE)
			return (height - line_count * m_line_height) / 2;

		if (valign == SELF.Align.ALIGN_END)
			return height - line_count * m_line_height;

		return 0;
	}

	function getXStart(halign, line_width, width) {

		if (halign == SELF.Align.ALIGN_MIDDLE)
			return (width - line_width) / 2;

		if (halign == SELF.Align.ALIGN_END)
			return width - line_width;

		return 0;
	}

	function stringToLines(string, max_width, ctx) {

		var lines = [];

		if (max_width == Number.POSITIVE_INFINITY)
			return [{'text' : string, 'width' : ctx.measureText(string).width}];

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

	$PUBLIC_FUN_IMPL('measureText', function(text, width_limit){
		
		var ctx = null;
		if (!m_measure_canvas) {
			m_measure_canvas = document.createElement('canvas');
			ctx = m_measure_canvas.getContext('2d');
			prepareCtxFont(ctx);
		} else ctx = m_measure_canvas.getContext('2d');
			
		var lines = stringToLines(text, width_limit, ctx);

		var max_x = 0, max_y = 0;

		$.each(lines, function(i,v){
			max_x = Math.max(max_x, v.width);
		});
		max_y = lines.length * m_line_height;

		return new UI.Size(max_x, max_y);
	});

	function stringToWordArray(string) {
		var rst = [];
		var en_split = string.split(/\b/);
		$.each(en_split, function(i,v){
			rst = rst.concat(v.split(/(?![a-zA-Z_0-9])/));
		});

		return rst;
	}

	function prepareCtxFont(ctx) {
		var font = '';
		if (m_italic) font += 'italic ';
		if (m_bold) font += 'bold ';
		font += m_font_size + 'px' + ' ';
		font += m_font_face + ' ';
		ctx.font = font;
	}

	function handleCenterValignText(ctx, lines, rect, halign){

		var max_x = 0, max_y = 0;

		max_x = rect.width();
		max_y = lines.length * m_line_height;

		var temp_canvas = document.createElement('canvas');
		temp_canvas.width = max_x;
		temp_canvas.height = max_y;

		var temp_ctx = temp_canvas.getContext('2d');
		me.draw(temp_ctx, lines, new UI.Rect(0,0,max_x,max_y), halign, SELF.Align.ALIGN_START);

		var data = temp_ctx.getImageData(0,0,max_x,max_y);
		data = data.data;

		var rect_bound = new UI.Rect(0,0,max_x,max_y);
		var top_found = false, bottom_found = false;
		for (var line = 0; line < max_y; line++) {
			for (var col = 0; col < max_x; col++) {

				if (!bottom_found && UI.ImageUtil.getImageDataRGBA(data, col, line, max_x) != 0x000000) {
					bottom_found = true;
					rect_bound.top += line;
				}

				if (!top_found && UI.ImageUtil.getImageDataRGBA(data, col, max_y - line - 1, max_x) != 0x000000) {
					top_found = true;
					rect_bound.bottom -= line;
				}

				if (top_found && bottom_found) break;
			}

			if (top_found && bottom_found) break;
		}

		ctx.drawImage(temp_canvas, 
			rect.left, rect.top - rect_bound.top + Math.floor((rect.height() - rect_bound.height()) / 2));
	}

	function normalFontFace (face) {
		var face = face.split(/,/);
		$.each(face, function(i,v){
			var normal_value = $.trim(v);
			if (normal_value.indexOf(' ') != -1 && normal_value.substr(0,1) != '\'')
				normal_value = '\'' + normal_value + '\'';
			face[i] = normal_value;
		});
		face = face.join(',');
		return face;
	}

	function adaptLinesToBorder(ctx, lines, max_x, max_y) {

		var max_line_num = Math.floor(max_y / m_line_height) || 1;
		if (max_line_num >= lines.length)
			return;

		lines.length = max_line_num;

		var last_line_words = stringToWordArray(lines.last().text);
		last_line_words.push('...');

		var last_line_width;
		while (last_line_words.length > 1 
			&& (last_line_width = ctx.measureText(last_line_words.join('')).width) > max_x) {
			last_line_words.length = last_line_words.length - 2;
			last_line_words.push('...');
		}

		lines[lines.length - 1].text = last_line_words.join('');
		lines[lines.length - 1].width = last_line_width;
	}	
});

$ENUM('UI.XCanvasText.Align',
[
	'ALIGN_START',
	'ALIGN_MIDDLE',
	'ALIGN_END'
]);
