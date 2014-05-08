;


(function(){

	$CLASS('UI.XButton', 
	$EXTENDS(UI.XFrame),
	function(me, SELF){

		$PUBLIC_FUN([
			'create',
			'destroy',

			'onBackgroundLoaded',
			
			'onMeasureWidth',
			'onMeasureHeight',

			'setBackground',
		]);

		$MESSAGE_MAP('EVENT', 
		[
			$MAP('mousedown', 'onMouseDown'),
			$MAP('mouseup', 'onMouseUp'),
			$MAP('mouseleave', 'onMouseLeave'),
			$MAP('mouseenter', 'onMouseEnter'),
			$CHAIN(UI.XFrame),
		]);

		var m_disabled = false;
		var m_mouse_in = false;
		var m_mouse_down = false;

		$PUBLIC_FUN_IMPL('create', function(parent, layout, visibility /* = UI.XFrame.Visibility.VISIBILITY_NONE*/,
			disabled /* = false */, background /* = null */) {

			me.$PARENT(UI.XFrame).create(parent, layout, visibility);

			disabled = disabled || false;
			m_disabled = disabled;

			if (!background)
				background = UI.XResourceMgr.getImage('img/ctrl/button.9.png');
			me.setBackground(background);

	//		refreshButtonFace();
		});

		$PUBLIC_FUN_IMPL('setBackground', function(background){
			var img = me.$PARENT(UI.XFrame).setBackground(background);

			me.invalidateLayout();
			refreshButtonFace();

			return img;
		});

		$PUBLIC_FUN_IMPL('onBackgroundLoaded', function(){
			// me.$PARENT(UI.XFrame).onBackgroundLoaded();
			me.invalidateLayout();
			refreshButtonFace();
		});

		$PUBLIC_FUN_IMPL('destroy', function(){
			m_disabled = false;
			m_mouse_in = false;
			m_mouse_down = false;
			me.$PARENT(UI.XFrame).destroy();
		});

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
			if (param.spec != SELF.MeasureParam.Spec.MEASURE_ATMOST &&
				param.spec != SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED) {
				me.$PARENT(UI.XFrame).onMeasureWidth(param);
				return;
			}

			var wrap_size = 0;
			var background = me.getBackground();
			if (background && background.isImageLoaded())
				wrap_size = background.getImageWidth() / 4;

			if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
				wrap_size = Math.min(wrap_size, param.num);

			var wrap_measure_param = new SELF.MeasureParam();
			wrap_measure_param.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
			wrap_measure_param.num = wrap_size;

			me.$PARENT(UI.XFrame).onMeasureWidth(wrap_measure_param);

		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
			if (param.spec != SELF.MeasureParam.Spec.MEASURE_ATMOST &&
				param.spec != SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED) {
				me.$PARENT(UI.XFrame).onMeasureHeight(param);
				return;
			}

			var wrap_size = 0;
			var background = me.getBackground();
			if (background && background.isImageLoaded())
				wrap_size = background.getImageHeight();

			if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
				wrap_size = Math.min(wrap_size, param.num);

			var wrap_measure_param = new SELF.MeasureParam();
			wrap_measure_param.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
			wrap_measure_param.num = wrap_size;

			me.$PARENT(UI.XFrame).onMeasureHeight(wrap_measure_param);
		});

		$MESSAGE_HANDLER('onMouseDown', function(){

			if (m_disabled) return true;

			m_mouse_down = true;

			refreshButtonFace();

			me.getEventManager().captureMouse(me.$THIS);

			return true;
		});

		$MESSAGE_HANDLER('onMouseUp', function(e){

			if (!m_mouse_down) return true;
			m_mouse_down = false;
			me.getEventManager().releaseCaptureMouse(me.$THIS);

			if (m_disabled) return true;

			refreshButtonFace();

			if (e.UI_pt.inRect(me.parentToChild(me.getRect())))
				me.throwNotification(
					{
						'id' : SELF.NOTIFICATION.NOTIFICATION_BUTTON_CLICKED,
					});

			return true;
		});

		$MESSAGE_HANDLER('onMouseLeave', function(){
			m_mouse_in = false;
			if (m_disabled) return;
			refreshButtonFace();
		});

		$MESSAGE_HANDLER('onMouseEnter', function(){
			m_mouse_in = true;
			if (m_disabled) return;
			refreshButtonFace();
		});

		function refreshButtonFace() {
			var background = me.getBackground();
			if (!background.isImageLoaded()) return;

			var state = m_disabled ? 
				SELF.BtnState.BTN_DISABLED : SELF.BtnState.BTN_NORMAL;

			if (!m_disabled && m_mouse_in)
				state = m_mouse_down ? SELF.BtnState.BTN_DOWN : SELF.BtnState.BTN_HOVER;

			background.setSrcRect(new UI.Rect(
				new UI.Pt(state * background.getImageWidth() / 4, 0),
				new UI.Size(background.getImageWidth() / 4, background.getImageHeight())));

			me.invalidateRect();
		}

	}).
	$STATIC({
		'buildFromXML' : buildFromXML,
	});

	function buildFromXML(xml_node, parent) {
		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		xml_node.removeAttribute('bg');
		var face = 
			UI.XFrameXMLFactory.buildImage(xml_node, 'face',
				'face_type', 'stretch', 'face_part_');

		var disabled = false;
		var disabled_attr = 
			xml_node.getAttribute('disabled') || '';
		disabled_attr = disabled_attr.toLowerCase();
		if (disabled_attr == 'true')
			disabled = true;

		var frame = new this();
		frame.create(parent, layout_param, this.Visibility.VISIBILITY_NONE,
			disabled, face);

		return frame;
	}

	$ENUM('UI.XButton.BtnState', {
		'BTN_NORMAL' 	: 0,
		'BTN_HOVER'  	: 1,
		'BTN_DOWN'	 	: 2,
		'BTN_DISABLED' 	: 3,
	});

	$ENUM('UI.XButton.NOTIFICATION', [
		'NOTIFICATION_BUTTON_CLICKED',
	]);

})();

