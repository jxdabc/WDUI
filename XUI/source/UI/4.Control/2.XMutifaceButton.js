;

(function(){

	$CLASS('UI.XMultifaceButton', 
	$EXTENDS(UI.XButton),
	function(me, SELF){

		$PUBLIC_FUN([
			'create',
			'destroy',

			'changeButtonFaceTo',
		]);

		var m_faces = [];
		var m_current_face = 0;

		$PUBLIC_FUN_IMPL('create', function(parent, faces, layout, 
			visibility /* = UI.XFrame.Visibility.VISIBILITY_NONE*/,
			start_face /* =0 */,
			disabled /* = false */) {

			m_faces = faces;

			var background = faces[0] || null;
			start_face = start_face || 0;		
			if (start_face < faces.length) {
				m_current_face = start_face;
				background = faces[start_face];
			}

			me.$PARENT(UI.XButton).create(parent, layout, visibility, disabled, background);
		});

		$PUBLIC_FUN_IMPL('destroy', function(){

			me.setBackground(null);

			m_faces = [];
			m_current_face = 0;

			me.$PARENT(UI.XButton).destroy();
		});

		$PUBLIC_FUN_IMPL('changeButtonFaceTo', function(index){
			if (index >= m_faces.length) return;
			if (m_current_face == index) return;

			m_current_face = index;

			me.setBackground(m_faces[index]);
		});

	}).
	$STATIC({
		buildFromXML : buildFromXML,
	});

	function buildFromXML(xml_node, parent) {
		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		xml_node.removeAttribute('bg');
		
		var faces = 
			UI.XFrameXMLFactory.buildImageList(xml_node, 'faces',
				'face_types', 'stretch', 'face_parts_');
		if (!faces.length)
			UI.XFrameXMLFactory.reportError('WARNING: No face specified for the multi-face button, will use default button face. ');


		var disabled = false;
		var disabled_attr = xml_node.getAttribute('disabled') || '';
		disabled_attr = disabled_attr.toLowerCase();
		if (disabled_attr == 'true')
			disabled = true;

		var start_face = xml_node.getAttribute('start_face') || 0;

		var frame = new this();
		frame.create(parent, faces, layout_param, this.Visibility.VISIBILITY_NONE,
			start_face, disabled);

		return frame;

	}


})();