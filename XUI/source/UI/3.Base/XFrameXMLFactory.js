;

(function(){

	$CLASS('UI.XFrameXMLFactory', function(me, SELF){

		$PUBLIC_FUN([
			'buildFrame',
		]);

		$PUBLIC_FUN_IMPL('buildFrame', function(xml_node, parent){
			var name = xml_node.nodeName;
			var frame_class = UI[name];
			if (!frame_class) {
				SELF.reportError(
					'WARNING: No frame named %. Skip this frame and its subframes. '
					.format(name));
				return null;
			}

			var frame = frame_class.buildFromXML(xml_node, parent);

			if (frame)
				frame.configFrameByXML(xml_node);

			return frame;
		});

	})
	.$STATIC({
		'instance' : frameXMLFactoryInstance,
		'reportError' : reportError,
		'buildImage' : buildImage,
		'buildImageList' : buildImageList,
		'buildRect' : buildRect,
		'buildText' : buildText,

		'SPLIT_REGEXP' : /\|/,
	});


	var frame_factory_instance = null;
	function frameXMLFactoryInstance() {
		if (!frame_factory_instance)
			frame_factory_instance = new UI.XFrameXMLFactory();
		return frame_factory_instance;
	}

	function reportError(err) {
		console.log('XFrameXMLFactory: ' + err);
	}

	function buildImage(xml_node, path_name, 
			type_name /* =null */, default_type /* =null*/, part_rect_prefix /* =null*/) {
		var path = xml_node.getAttribute(path_name);
		if (!path) return null;

		var image = new UI.XImageCanvasImage();
		image.load(path);

		var type;
		if (!type_name || !(type = xml_node.getAttribute(type_name)))
			if (!image.isFormattedImage())
				type = default_type || 'normal';
		type = type || '';

		switch(type.toLowerCase()) {
			case 'normal' 	: image.setDrawType(UI.IXImage.DrawType.DIT_NORMAL); break;
			case 'stretch' 	: image.setDrawType(UI.IXImage.DrawType.DIT_STRETCH); break;
			case 'center' 	: image.setDrawType(UI.IXImage.DrawType.DIT_CENTER); break;
			case '3parth' 	: image.setDrawType(UI.IXImage.DrawType.DIT_3PARTH); break;
			case '3partv' 	: image.setDrawType(UI.IXImage.DrawType.DIT_3PARTV); break;
			case '9part'	: image.setDrawType(UI.IXImage.DrawType.DIT_9PART); break;
		}

		if (part_rect_prefix) {
			var part_rect = new UI.Rect(0, 0, 
				UI.XImageCanvasImage.PART_RECT_FULL_LEN,
				UI.XImageCanvasImage.PART_RECT_FULL_LEN);

			var has_attr = false;
			var attr_name;

			attr_name = part_rect_prefix + 'left';
			if (xml_node.hasAttribute(attr_name)) { 
				part_rect.left = xml_node.getAttribute(attr_name) - 0 || 0; 
				has_attr = true; 
			}
			attr_name = part_rect_prefix + 'top';
			if (xml_node.hasAttribute(attr_name)) { 
				part_rect.top = xml_node.getAttribute(attr_name) - 0 || 0; 
				has_attr = true;  
			}
			attr_name = part_rect_prefix + 'width';
			if (xml_node.hasAttribute(attr_name)) { 
				part_rect.right = xml_node.getAttribute(attr_name) - 0 || 0; 
				part_rect.right += part_rect.left; 
				has_attr = true; 
			}
			attr_name = part_rect_prefix + 'height';
			if (xml_node.hasAttribute(attr_name)) { 
				part_rect.bottom = xml_node.getAttribute(attr_name) - 0 || 0; 
				part_rect.bottom += part_rect.top; 
				has_attr = true;
			}
			if (has_attr)
				image.setPartRect(part_rect);
		}

		return image;
	}

	function buildImageList(xml_node, path_list_name, 
		type_list_name /* = null*/, default_type /* = null*/, part_rect_list_prefix /* = null*/) {

		var path_list = xml_node.getAttribute(path_list_name);
		if (!path_list) return [];
		path_list = path_list.split(this.SPLIT_REGEXP);

		var attr;

		var type_list = [];
		if (type_list_name && (attr = xml_node.getAttribute(type_list_name)))
			type_list = attr.split(this.SPLIT_REGEXP);

		var part_left_list = [], part_top_list = [], 
			part_width_list = [], part_height_list = [];
		if (part_rect_list_prefix && (attr = xml_node.getAttribute(part_rect_list_prefix + 'left')))
			part_left_list = attr.split(this.SPLIT_REGEXP);
		if (part_rect_list_prefix && (attr = xml_node.getAttribute(part_rect_list_prefix + 'top')))
			part_top_list = attr.split(this.SPLIT_REGEXP);
		if (part_rect_list_prefix && (attr = xml_node.getAttribute(part_rect_list_prefix + 'width')))
			part_width_list = attr.split(this.SPLIT_REGEXP);
		if (part_rect_list_prefix && (attr = xml_node.getAttribute(part_rect_list_prefix + 'height')))
			part_height_list = attr.split(this.SPLIT_REGEXP);

		var rst = [];
		for (var i = 0; i < path_list.length; i++) {
			var c = path_list[i];

			var image = new UI.XImageCanvasImage();
			image.load(c);

			var type;
			if (i < type_list.length && type_list[i].length) type = type_list[i];
			else if (!image.isFormattedImage())
				type = default_type || 'normal';

			switch(type.toLowerCase()) {
				case 'normal' 	: image.setDrawType(UI.IXImage.DrawType.DIT_NORMAL); break;
				case 'stretch' 	: image.setDrawType(UI.IXImage.DrawType.DIT_STRETCH); break;
				case 'center' 	: image.setDrawType(UI.IXImage.DrawType.DIT_CENTER); break;
				case '3parth' 	: image.setDrawType(UI.IXImage.DrawType.DIT_3PARTH); break;
				case '3partv' 	: image.setDrawType(UI.IXImage.DrawType.DIT_3PARTV); break;
				case '9part'	: image.setDrawType(UI.IXImage.DrawType.DIT_9PART); break;
			}

			var part_rect = new UI.Rect(0, 0, 
				UI.XImageCanvasImage.PART_RECT_FULL_LEN,
				UI.XImageCanvasImage.PART_RECT_FULL_LEN);

			var has_attr = false;
			if (i < part_left_list.length && part_left_list[i]) { 
				part_rect.left = part_left_list[i] - 0 || 0; 
				has_attr = true; 
			}
			if (i < part_top_list.length && part_top_list[i]) { 
				part_rect.top = part_top_list[i] - 0 || 0; 
				has_attr = true;  
			}
			if (i < part_width_list.length && part_width_list[i]) { 
				part_rect.right = part_width_list[i] - 0 || 0; 
				part_rect.right += part_rect.left; 
				has_attr = true; 
			}
			if (i < part_height_list.length && part_height_list[i]) { 
				part_rect.bottom =part_height_list[i] - 0 || 0; 
				part_rect.bottom += part_rect.top; 
				has_attr = true;
			}
			if (has_attr)
				image.setPartRect(part_rect);

			rst.push(image);
		}

		return rst;
	}

	function buildRect(xml_node, rect_prefix /* = null*/) {
		var rect = new UI.Rect(0,0,0,0);
		rect_prefix = rect_prefix || '';
		rect.left =  xml_node.getAttribute(rect_prefix + 'left') - 0 || 0;
		rect.top = xml_node.getAttribute(rect_prefix + 'top') - 0 || 0;
		rect.right = xml_node.getAttribute(rect_prefix + 'width') - 0 || 0;
		rect.right += rect.left;
		rect.bottom = xml_node.getAttribute(rect_prefix + 'height') - 0 || 0;
		rect.bottom += rect.top;
		return rect;
	}

	function buildText(xml_node, text_prefix /* = null */) {
		var text = new UI.XTextCanvasText();

		text_prefix = text_prefix || '';
		text.setText(xml_node.getAttribute(text_prefix + 'text') || '');

		var font_face = 'Arial, \'Microsoft YaHei\'';
		var font_size = 12;
		var font_style = UI.XTextCanvasText.Style.STYLE_NORMAL;

		var attr_name;

		font_face = xml_node.getAttribute(text_prefix + 'font') || font_face;
		
		attr_name = text_prefix + 'font_size';
		if (xml_node.hasAttribute(attr_name))
			font_size = xml_node.getAttribute(attr_name) - 0 || 0;

		var font_style_attr = xml_node.getAttribute(text_prefix + 'font_style') || '';
		font_style_attr = font_style_attr.toLowerCase();
		if (font_style_attr.indexOf('bold') != -1) font_style |= UI.XTextCanvasText.Style.STYLE_BOLD;
		if (font_style_attr.indexOf('italic') != -1) font_style |= UI.XTextCanvasText.Style.STYLE_ITARIC;

		text.setFont(font_face, font_size, font_style);

		var align_h = UI.XTextCanvasText.Align.ALIGN_START;
		var align_v = UI.XTextCanvasText.Align.ALIGN_START;

		var align_h_attr = xml_node.getAttribute(text_prefix + 'text_align_h') || '';
		var align_v_attr = xml_node.getAttribute(text_prefix + 'text_align_v') || '';
		align_h_attr = align_h_attr.toLowerCase();
		align_v_attr = align_v_attr.toLowerCase();

		if (align_h_attr == 'center') align_h = UI.XTextCanvasText.Align.ALIGN_MIDDLE;
		else if (align_h_attr == 'right') align_h = UI.XTextCanvasText.Align.ALIGN_END;

		if (align_v_attr == 'middle') align_v = UI.XTextCanvasText.Align.ALIGN_MIDDLE;
		else if (align_v_attr == 'bottom') align_v = UI.XTextCanvasText.Align.ALIGN_END;

		text.setAlignment(align_h, align_v);

		attr_name = text_prefix + 'text_color';
		if (xml_node.hasAttribute(attr_name)) {
			var color = xml_node.getAttribute(attr_name);
			color = '#' + color;
			text.setColor(color);
		}

		return text;
	}

})();

