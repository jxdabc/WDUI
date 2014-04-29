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

			frame_class.buildFromXML(xml_node, parent);

			frame.configFrameByXML(xml_node);

			return frame;
		});

	})
	.$STATIC({
		'instance' : frameXMLFactoryInstance,
		'reportError' : reportError,
		'buildImage' : buildImage,
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

	function buildImage(xml_node, path_name, type_name /* =null */, default_type /* =null*/, part_rect_prefix /* =null*/) {
		var path = xml_node.getAttribute(path_name);
		if (!path) return null;

		var image = new UI.XImageCanvasImage();
		image.load(path);

		var type;
		if (!type_name || !(type = xml_node.getAttribute(type_name)))
			if (!image.isFormattedImage())
				type = default_type || 'normal';

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
			if (xml_node.hasAttribute(attr_name)) { part_rect.left = xml_node.getAttribute(attr_name) - 0 || 0; has_attr = true; }
			attr_name = part_rect_prefix + 'top';
			if (xml_node.hasAttribute(attr_name)) { part_rect.top = xml_node.getAttribute(attr_name) - 0 || 0; has_attr = true;  }
			
			attr_name = part_rect_prefix + 'width';
			if (xml_node.hasAttribute(attr_name)) 
				{ part_rect.right = xml_node.getAttribute(attr_name) - 0 || 0; part_rect.right += part_rect.left; has_attr = true; }
			attr_name = part_rect_prefix + 'height';
			if (xml_node.hasAttribute(attr_name))
				{ part_rect.bottom = xml_node.getAttribute(attr_name) - 0 || 0; part_rect.bottom += part_rect.top; has_attr = true;}

			if (has_attr)
				image.setPartRect(part_rect);
		}

		return image;
	}

})();

