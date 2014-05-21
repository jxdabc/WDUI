;

(function(){


	$CLASS('UI.XScrollFrame',
	$EXTENDS(UI.XFrame),
	function(me, SELF){

		$PUBLIC_FUN([
			'create',
			'destroy',

			'addContentFrame',
			'getContentFrameCount',
			'removeContentFrame',

			'onMeasureWidth',
			'onMeasureHeight',

			'onLayout',

			'handleXMLChildNode',
		]);

		$MESSAGE_MAP('NOTIFICATION', 
		[
			$MAP(UI.XFrame.NOTIFICATION.NOTIFICAITON_FRAME_RECT_CHANGED, 'onViewRectChanged'),
			$MAP(UI.XScrollView.NOTIFICATION.NOTIFICAITON_BOUND_CHANGED, 'onContentRectChanged'),
			$MAP(UI.XScrollBar.NOTIFICATION.NOTIFICATION_SCROLLCHANGED, 'onScrollChanged'),
			$CHAIN(UI.XFrame),
		]);

		$MESSAGE_MAP('EVENT', 
		[
			$MAP('mouseup', 'onMouseUp'),
			$CHAIN(UI.XFrame),
		]);

		var m_scroll_bar;
		var m_scroll_bar_h = null;
		var m_scroll_bar_v = null;
		var m_view = null;

		var m_scroll_h_height = 15;
		var m_scroll_v_width = 15;

		$CONSTRUCTOR(function(scroll_bar){
			m_scroll_bar = scroll_bar;
		});

		$PUBLIC_FUN_IMPL('create', function(
			parent, layout, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/,
			bg_h /* = null*/, fg_h /* = null*/, bg_v /* = null*/, fg_v /* = null */){

			me.$PARENT(UI.XFrame).create(parent, layout, visibility);

			if ((m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_H) && !m_scroll_bar_h) {
				m_scroll_bar_h = new UI.XScrollBar();
				m_scroll_bar_h.create(me.$THIS, UI.XScrollBar.ScrollType.SCROLL_H,
					me.generateLayoutParam(), SELF.Visibility.VISIBILITY_SHOW, bg_h, fg_h);
				m_scroll_bar_h.addNotificationListener(me.$THIS);
			}

			if ((m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_V) && !m_scroll_bar_v) {
				m_scroll_bar_v = new UI.XScrollBar();
				m_scroll_bar_v.create(me.$THIS, UI.XScrollBar.ScrollType.SCROLL_V,
					me.generateLayoutParam(), SELF.Visibility.VISIBILITY_SHOW, bg_v, fg_v);
				m_scroll_bar_v.addNotificationListener(me.$THIS);
			}

			if (!m_view) {
				m_view = new UI.XScrollView();
				m_view.create(me.$THIS, me.generateLayoutParam(), SELF.Visibility.VISIBILITY_SHOW);
				m_view.addNotificationListener(me.$THIS);
			}
		});

		$PUBLIC_FUN_IMPL('destroy', function(){
			m_view = m_scroll_bar_h = m_scroll_bar_v = null;
			me.$PARENT(UI.XFrame).destroy();
		});

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
			var measured = 0;
			if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT)
				measured = param.num;

			var param_for_measure = new SELF.MeasureParam();
			param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;

			if (m_view) {
				param_for_measure.num = measured;
				if (m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_V)
					param_for_measure.num = Math.max(0, 
						param_for_measure.num - m_scroll_v_width);
				m_view.measureWidth(param_for_measure);
			}

			if (m_scroll_bar_v) {
				param_for_measure.num = m_scroll_v_width;
				m_scroll_bar_v.measureWidth(param_for_measure);
			}

			if (m_scroll_bar_h) {
				param_for_measure.num = measured;
				if (m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_V)
					param_for_measure.num = Math.max(0, 
						param_for_measure.num - m_scroll_v_width);
				m_scroll_bar_h.measureWidth(param_for_measure);
			}

			me.setMeasuredWidth(measured);

		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
			var measured = 0;
			if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT)
				measured = param.num;

			var param_for_measure = new SELF.MeasureParam();
			param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;

			if (m_view) {
				param_for_measure.num = measured;
				if (m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_H)
					param_for_measure.num = Math.max(0, 
						param_for_measure.num - m_scroll_h_height);
				m_view.measureHeight(param_for_measure);
			}

			if (m_scroll_bar_v) {

				param_for_measure.num = measured;
				if (m_scroll_bar & SELF.ScrollBar.SCROLL_BAR_H)
					param_for_measure.num = Math.max(0, 
						param_for_measure.num - m_scroll_h_height);
				m_scroll_bar_v.measureHeight(param_for_measure);
			}

			if (m_scroll_bar_h) {
				param_for_measure.num = m_scroll_h_height;
				m_scroll_bar_h.measureHeight(param_for_measure);
			}

			me.setMeasuredHeight(measured);
		});

		$PUBLIC_FUN_IMPL('onLayout', function(rc){

			var width = rc.width();
			var height = rc.height();

			if (m_view)
				m_view.layout(new UI.Rect(0, 0, 
					m_view.getMeasuredWidth(), m_view.getMeasuredHeight()));
			if (m_scroll_bar_v)
				m_scroll_bar_v.layout(new UI.Rect(
					width - m_scroll_bar_v.getMeasuredWidth(), 0,
					width, m_scroll_bar_v.getMeasuredHeight()));
			if (m_scroll_bar_h)
				m_scroll_bar_h.layout(new UI.Rect(
					0, height - m_scroll_bar_h.getMeasuredHeight(),
					m_scroll_bar_h.getMeasuredWidth(), height));

		});

		$PUBLIC_FUN_IMPL('addContentFrame', function(frame){
			m_view.addFrame(frame);
		});

		$PUBLIC_FUN_IMPL('getContentFrameCount', function(){
			return m_view.getFrameCount();
		});

		$PUBLIC_FUN_IMPL('removeContentFrame', function(index){
			return m_view.removeFrame(index);
		});

		$PUBLIC_FUN_IMPL('handleXMLChildNode', function(xml_node) {
			for (var i = 0; i < xml_node.childNodes.length; i++) {
				var c = xml_node.childNodes[i];
				// node element. 
				if (c.nodeType != 1) continue; 
				UI.XFrameXMLFactory.instance().buildFrame(c, m_view);
			}
		});

		$MESSAGE_HANDLER('onViewRectChanged', function(n){
			if (n.src != m_view) return;
			onViewOrContentChanged('setViewLen', n.new.width(), n.new.height(),
				n.old.width(), n.old.height());
		});

		$MESSAGE_HANDLER('onContentRectChanged', function(n){
			if (n.src != m_view) return;
			onViewOrContentChanged('setContentLen', n.new.max_x, n.new.max_y,
				n.old.max_x, n.old.max_y);
		});

		$MESSAGE_HANDLER('onScrollChanged', function(n){
			if (n.src == m_scroll_bar_h) {
				m_view.setScrollX(n.pos);
			}

			if (n.src == m_scroll_bar_v) {
				m_view.setScrollY(n.pos);
			}

		});

		$MESSAGE_HANDLER('onMouseUp', function(e){
			if (m_scroll_bar_v && 
				m_scroll_bar_v.getVisibility() == SELF.Visibility.VISIBILITY_SHOW)
				m_scroll_bar_v.getFocus();
			else if (m_scroll_bar_h && 
				m_scroll_bar_h.getVisibility() == SELF.Visibility.VISIBILITY_SHOW)
				m_scroll_bar_h.getFocus();
		});

		function onViewOrContentChanged(fn, w, h, old_w, old_h) {
			if (m_scroll_bar_v && old_h != h)
				m_scroll_bar_v[fn](h);
			if (m_scroll_bar_h && old_w != w)
				m_scroll_bar_h[fn](w);
		}

	
	})
	.$STATIC({
		'buildFromXML' : buildFromXML,
	});

	$ENUM('UI.XScrollFrame.ScrollBar', {
		'SCROLL_BAR_H' : 1,
		'SCROLL_BAR_V' : 2,
	});

	function buildFromXML(xml_node, parent) {

		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var scroll_bar = 0;
		var bar_bg_h = null;
		var bar_fg_h = null;
		var bar_bg_v = null;
		var bar_fg_v = null;

		if ((xml_node.getAttribute('h_scroll') || '').toLowerCase() == 'true')
			scroll_bar |= this.ScrollBar.SCROLL_BAR_H;
		if ((xml_node.getAttribute('v_scroll') || '').toLowerCase() == 'true')
			scroll_bar |= this.ScrollBar.SCROLL_BAR_V;

		if (!scroll_bar) {
			UI.XFrameXMLFactory
				.reportError('WARNING: No scroll bar specified for the scroll frame. Create the scroll frame failed. ');
			return null;
		}

		if (scroll_bar & this.ScrollBar.SCROLL_BAR_H) {
			bar_bg_h = UI.XFrameXMLFactory.buildImage(xml_node, "scroll_bar_h_face_bg", null, "3partH", "scroll_bar_h_bg_part_");
			bar_fg_h = UI.XFrameXMLFactory.buildImage(xml_node, "scroll_bar_h_face_fg", null, "3partH", "scroll_bar_h_fg_part_");
		}
		if (scroll_bar & this.ScrollBar.SCROLL_BAR_V) {
			bar_bg_v = UI.XFrameXMLFactory.buildImage(xml_node, "scroll_bar_v_face_bg", null, "3partV", "scroll_bar_v_bg_part_");
			bar_fg_v = UI.XFrameXMLFactory.buildImage(xml_node, "scroll_bar_v_face_fg", null, "3partV", "scroll_bar_v_fg_part_");
		}

		var frame = new this(scroll_bar);
		frame.create(parent, layout_param, 
			UI.XFrame.Visibility.VISIBILITY_NONE,
			bar_bg_h, bar_fg_h, bar_bg_v, bar_fg_v);

		return frame;

	}



})();