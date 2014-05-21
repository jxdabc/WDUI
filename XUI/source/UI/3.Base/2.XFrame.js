;

(function(){
	$CLASS('UI.XFrame', 
	$EXTENDS(UI.XEasyNotificationListener, UI.XEasyNotificationThrower),
	function(me, SELF){

		$PUBLIC_FUN([
			'setName',
			'getName',
			'getFrameByName',
			'getFramesByName',

			'create',
			'configFrameByXML',
			'handleXMLChildNode',

			'setVisibility',
			'getVisibility',

			'setBackground',
			'getBackground',
			'onBackgroundLoaded',
			'setMouseOverLayer',
			'onMouseOverLayerLoaded',
			'setMouseDownLayer',
			'onMouseDownLayerLoaded',
			'setSelectedLayer',
			'onSelectedLayerLoaded',
			
			'setTouchable',
			'setSelectable',
			'setSelectWhenMouseClick',
			'setUnselectWhenMouseClick',
			'setSelectedState',


			'invalidateRect',
			'invalidateAfterLayout',

			'getVCenter',
			'getRect',
			'setRect',


			'setScrollX',
			'setScrollY',
			'getScrollX',
			'getScrollY',

			'generateLayoutParam',
			'beginUpdateLayoutParam',
			'endUpdateLayoutParam',
			'getLayoutParam',
			'isLayouting',
			'invalidateLayout',

			'needLayout',
			'measureWidth',
			'measureHeight',
			'getMeasuredWidth',
			'getMeasuredHeight',
			'setMeasuredWidth',
			'setMeasuredHeight',
			'layout',

			'onMeasureWidth',
			'onMeasureHeight',
			'onLayout',

			'addFrame',
			'insertFrame',
			'removeFrame',
			'getFrameCount',
			'getFrameByIndex',
			'setParent',
			'getParent',
			'onDetachedFromParent',
			'onAttachedToParent',

			'getFocus',

			'paintUI',
			'paintBackground',
			'paintForeground',

			'getTopFrameFromPoint',

			'getEventManager',
			'needPrepareMsg',

			'childToParent',
			'parentToChild',
			'otherFrameToThisFrame',
			'toContainer',

			'getContainer',
			'setCursor',

			'destroy',
			'isFrameActive',

			'onNotification',
		]);

		$MESSAGE_MAP('EVENT', 
		[
			$MAP(UI.XFrame.EVENT_ID.EVENT_X_DELAY_UDPATE_LAYOUT, 'onDelayupdateLayout'),
			$MAP('mousedown', 'onMouseDown'),
			$MAP('mouseup', 'onMouseUp'),
			$MAP('mouseleave', 'onMouseLeave'),
			$MAP('mouseenter', 'onMouseEnter'),
		]);

		var m_layout_invalid = true;
		var m_layout_param 			= null;
		var m_delay_layout_param 	= null;
		var m_delay_update_layout_param_scheduled = false;
		var m_need_invalidate_after_layout = false;
		var m_last_measure_width_param = new SELF.MeasureParam();
		var m_last_measure_height_param = new SELF.MeasureParam();
		var m_measured_width = 0;
		var m_measured_height = 0;
		var m_rect = new UI.Rect();
		
		var m_name = null;

		var m_parent = null;
		var m_child_frames = [];

		var m_visibility = SELF.Visibility.VISIBILITY_NONE;

		var m_background = null;
		var m_mouseover_layer = null;
		var m_mousedown_layer = null;
		var m_selected_layer = null;

		var m_touchable = false;
		var m_selectable = false;
		var m_select_when_mouse_click = false;
		var m_unselected_when_mouse_click = false;
		var m_selected_state = false;
		var m_mouse_over = false;
		var m_mouse_down = false;

		var m_active = false;

		var m_scrollX = 0;
		var m_scrollY = 0;


		$PUBLIC_FUN_IMPL('setName', function(name){
			m_name = name;
		});

		$PUBLIC_FUN_IMPL('getName', function(){
			return m_name;
		});

		$PUBLIC_FUN_IMPL('getFrameByName', function(name){
			if (m_name == name) return me;

			for (var i = 0; i < m_child_frames.length; i++) {
				var rst = m_child_frames[i].getFrameByName(name);
				if (rst) return rst;
			}

			return null;
		});

		$PUBLIC_FUN_IMPL('getFramesByName', function(){
			var rst = [];

			if (m_name == name) rst.push(me);
			$.each(m_child_frames, function(i,v){
				var f = v.getFramesByName(name);
				if (f.length) rst = rst.concat(f); 
			});

			return rst;
		});

		$PUBLIC_FUN_IMPL('create', function(parent, layout, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/) {

			visibility = visibility || SELF.Visibility.VISIBILITY_NONE;

			me.beginUpdateLayoutParam(layout);
			me.endUpdateLayoutParam();

			me.setParent(parent);

			me.setVisibility(visibility);

			m_active = true;
		});

		$PUBLIC_FUN_IMPL('configFrameByXML', function(xml_node){

			var background = UI.XFrameXMLFactory.buildImage(xml_node, 'bg', 'bg_type', 'stretch', 'bg_part_');
			if (background) me.setBackground(background);

			var touchable = xml_node.getAttribute('touchable') || '';
			if (touchable.toLowerCase() == 'true') me.setTouchable(true);
			var mouse_over_layer = 
				UI.XFrameXMLFactory.buildImage(xml_node, 'mouse_over_layer', 'mouse_over_layer_type', 'stretch', 'mouse_over_layer_part_');
			if (mouse_over_layer) me.setMouseOverLayer(mouse_over_layer);
			var mouse_down_layer =
				UI.XFrameXMLFactory.buildImage(xml_node, 'mouse_down_layer', 'mouse_down_layer_type', 'stretch', 'mouse_down_layer_part_');
			if (mouse_down_layer) me.setMouseDownLayer(mouse_down_layer);

			var selectable = xml_node.getAttribute('selectable') || '';
			if (selectable.toLowerCase() == 'true') me.setSelectable(true);
			var mouse_click_select = xml_node.getAttribute('mouse_click_select') || '';
			if (mouse_click_select.toLowerCase() == 'true') me.setSelectWhenMouseClick(true);
			var mouse_click_unselect = xml_node.getAttribute('mouse_click_unselect') || '';
			if (mouse_click_unselect.toLowerCase() == 'true') me.setUnselectWhenMouseClick(true);
			var selected = xml_node.getAttribute('selected') || '';
			if (selected.toLowerCase() == 'true') me.setSelectedState(true);
			var selected_layer = 
				UI.XFrameXMLFactory.buildImage(xml_node, 'selected_layer', 'selected_layer_type', 'stretch', 'selected_layer_part_');
			if (selected_layer) me.setSelectedLayer(selected_layer);

			me.setName(xml_node.getAttribute('name') || '');

			me.handleXMLChildNode(xml_node);

			var visible = xml_node.getAttribute('visible') || '';
			visible = visible.toLowerCase();
			if (!visible || visible == 'show')
				me.setVisibility(SELF.Visibility.VISIBILITY_SHOW);
			else if (visible == 'hide')
				me.setVisibility(SELF.Visibility.VISIBILITY_HIDE);
			else if (visible == 'none')
				me.setVisibility(SELF.Visibility.VISIBILITY_NONE);
			else
				me.setVisibility(SELF.Visibility.VISIBILITY_SHOW);

		});

		$PUBLIC_FUN_IMPL('handleXMLChildNode', function(xml_node){
			for (var i = 0; i < xml_node.childNodes.length; i++) {
				var c = xml_node.childNodes[i];
				// node element. 
				if (c.nodeType != 1) continue; 
				UI.XFrameXMLFactory.instance().buildFrame(c, me.$THIS);
			}
		});

		$PUBLIC_FUN_IMPL('beginUpdateLayoutParam', function(layout_param){

			// overload beginUpdateLayoutParam()

			if (typeof layout_param != 'undefined' && !layout_param)
				throw new Exception('XUIClass::NLP', 
					'UI.XFrame::beginUpdateLayoutParam: called with null layout_param. ');

			if (typeof layout_param == 'undefined' && !m_layout_param)
				throw new Exception('XUIClass::LPNI', 
					'UI.XFrame::beginUpdateLayoutParam: layout parameter not initialized. ');

			if (me.isLayouting()) {
				if (typeof layout_param == 'undefined') {
					if (m_delay_layout_param)
						return m_delay_layout_param;
					if (m_parent)
						m_delay_layout_param = 
							m_parent.generateLayoutParam(m_layout_param);
					else
						m_delay_layout_param = 
							new UI.XFrame.LayoutParam(m_layout_param);
					return m_delay_layout_param;
				} else {
					if (m_delay_layout_param != layout_param)
						m_delay_layout_param = layout_param;
				}

			} else {

				if (typeof layout_param == 'undefined') {
					if (m_delay_layout_param) {
						if (m_delay_layout_param != m_layout_param)
							m_layout_param = m_delay_layout_param;
						m_delay_layout_param = null;
					}
					return m_layout_param;
				} else {
					if (m_delay_layout_param == m_layout_param)
						m_delay_layout_param = null;

					m_delay_layout_param = null;

					if (m_layout_param != layout_param)
						m_layout_param = layout_param;
				}
			}
		});

		$PUBLIC_FUN_IMPL('endUpdateLayoutParam', function() {
			if (m_delay_layout_param) {
				if (m_delay_update_layout_param_scheduled)
					return 'delayed';

				m_delay_update_layout_param_scheduled = true;

				UI.XEventService.instance().
					postFrameEvent(me.$THIS, {'id' :UI.XFrame.EVENT_ID.EVENT_X_DELAY_UDPATE_LAYOUT});

				return 'delayed';
			}

			if (m_parent) m_parent.invalidateLayout();
		});

		$PUBLIC_FUN_IMPL('isLayouting', function() {
			if (m_parent) return m_parent.isLayouting();
			return false;
		});

		$PUBLIC_FUN_IMPL('invalidateLayout', function(){
			m_layout_invalid = true;
			if (m_parent) m_parent.invalidateLayout();
		});

		$PUBLIC_FUN_IMPL('generateLayoutParam', function(copy_from_or_xml_or_null){
				return new SELF.LayoutParam(copy_from_or_xml_or_null);
		});

		$PUBLIC_FUN_IMPL('getVCenter', function(){
			return Math.floor(me.getRect().height() / 2);
		});

		$PUBLIC_FUN_IMPL('getRect', function(){
			return m_rect;
		});

		$PUBLIC_FUN_IMPL('setRect', function(new_rect) {

			if (m_rect.equals(new_rect)) return;

			var old_rect = new UI.Rect(m_rect);
			m_rect = new_rect;

			var rect_draw_area = new UI.Rect(0, 0, new_rect.width(), new_rect.height());

			if (m_background) m_background.setDstRect(rect_draw_area);
			if (m_mouseover_layer) m_mouseover_layer.setDstRect(rect_draw_area);
			if (m_mousedown_layer) m_mousedown_layer.setDstRect(rect_draw_area);
			if (m_selected_layer) m_selected_layer.setDstRect(rect_draw_area);

			if (m_visibility == SELF.Visibility.VISIBILITY_SHOW) {
				if (m_parent) {
					m_parent.invalidateRect(old_rect);
					m_parent.invalidateRect(new_rect);
				} else {
					if (old_rect.width() != new_rect.width() ||
						old_rect.height() != new_rect.height())
						me.invalidateRect();
				}
			}

			me.throwNotification(
				{
					'id' : SELF.NOTIFICATION.NOTIFICAITON_FRAME_RECT_CHANGED,
					'new' : new_rect,
					'old' : old_rect,
				});
		});

		$PUBLIC_FUN_IMPL('setScrollX', function(x){

			if (m_scrollX == x)
				return;

			updateScroll(x - m_scrollX, 0);

			m_scrollX = x;
		});

		$PUBLIC_FUN_IMPL('setScrollY', function(y){
			if (m_scrollY == y)
				return;

			updateScroll(0, y - m_scrollY);

			m_scrollY = y;
		});

		$PUBLIC_FUN_IMPL('getScrollX', function(){
			return m_scrollX;
		});

		$PUBLIC_FUN_IMPL('getScrollY', function(){
			return m_scrollY;
		});

		$PUBLIC_FUN_IMPL('setBackground', function(background){
			if (m_background == background)
				return null;

			var old = m_background;

			m_background = background;

			if (m_background) {
				m_background.setDstRect(
					new UI.Rect(0,0,m_rect.width(), m_rect.height()));
				m_background.onImageLoaded(me.onBackgroundLoaded);
			}

			if (m_visibility == SELF.Visibility.VISIBILITY_SHOW)
				me.invalidateRect();

			if (old)
				old.offImageLoaded(me.onBackgroundLoaded);

			return old;
		});

		$PUBLIC_FUN_IMPL('getBackground', function(){
			return m_background;
		})

		$PUBLIC_FUN_IMPL('onBackgroundLoaded', function(){
			me.invalidateRect();
			return;
		});

		$PUBLIC_FUN_IMPL('setMouseOverLayer', function(layer){
			var old = m_mouseover_layer;

			m_mouseover_layer = layer;

			if (m_mouseover_layer) {
				m_mouseover_layer.setDstRect(new UI.Rect(0,0,m_rect.width(),m_rect.height()));
				m_mouseover_layer.onImageLoaded(me.onMouseOverLayerLoaded);
			}

			if (old)
				old.offImageLoaded(me.onMouseOverLayerLoaded);

			return old;
		});

		$PUBLIC_FUN_IMPL('onMouseOverLayerLoaded', function(){
			me.invalidateRect();
			return;
		});	

		$PUBLIC_FUN_IMPL('setMouseDownLayer', function(layer){
			
			var old = m_mousedown_layer;

			m_mousedown_layer = layer;

			if (m_mousedown_layer) {
				m_mousedown_layer.setDstRect(new UI.Rect(0,0,m_rect.width(),m_rect.height()));
				m_mousedown_layer.onImageLoaded(me.onMouseDownLayerLoaded);
			}

			if (old)
				old.offImageLoaded(me.onMouseDownLayerLoaded);

			return old;
		});

		$PUBLIC_FUN_IMPL('onMouseDownLayerLoaded', function(){
			me.invalidateRect();
			return;
		});

		$PUBLIC_FUN_IMPL('setSelectedLayer', function(layer){
			
			var old = m_selected_layer;

			m_selected_layer = layer;

			if (m_selected_layer) {
				m_selected_layer.setDstRect(new UI.Rect(0,0,m_rect.width(), m_rect.height()));
				m_selected_layer.onImageLoaded(me.onSelectedLayerLoaded);
			}

			if (old)
				old.offImageLoaded(me.onSelectedLayerLoaded);

			return old;
		});

		$PUBLIC_FUN_IMPL('onSelectedLayerLoaded', function(){
			me.invalidateRect();
			return;
		});

		$PUBLIC_FUN_IMPL('setTouchable', function(b){
			if ((m_touchable && b) || (!m_touchable && !b))
				return;

			m_touchable = b;

			me.invalidateRect();
		});


		$PUBLIC_FUN_IMPL('setSelectable', function(b){
			if ((m_selectable && b) || (!m_selectable && !b))
				return;

			m_selectable = b;

			m_selected_state = false;

			me.invalidateRect();
		});


		$PUBLIC_FUN_IMPL('setSelectWhenMouseClick', function(b){
			m_select_when_mouse_click = b;
		});



		$PUBLIC_FUN_IMPL('setUnselectWhenMouseClick', function(b){
			m_unselected_when_mouse_click = b;
		});

		$PUBLIC_FUN_IMPL('setSelectedState', function(b){
			if (!m_selectable) return;
			if ((m_selected_state && b) || (!m_selected_state && !b))
				return;

			m_selected_state = b;

			me.invalidateRect();
		});

		$PUBLIC_FUN_IMPL('setVisibility', function(visibility){
			
			if (m_visibility == visibility) return;

			var old_visibility = m_visibility;
			m_visibility = visibility;

			switch (visibility) {
				case SELF.Visibility.VISIBILITY_SHOW:
					if (old_visibility == SELF.Visibility.VISIBILITY_NONE
						&& m_parent) {
						m_parent.invalidateLayout();
						me.invalidateAfterLayout();
					} else me.invalidateRect();
					break;
				case SELF.Visibility.VISIBILITY_HIDE:
					if (old_visibility == SELF.Visibility.VISIBILITY_NONE) {
						if (m_parent) m_parent.invalidateLayout();
					}
					else {
						if (m_parent) m_parent.invalidateRect(m_rect);
					}
					break;
				case SELF.Visibility.VISIBILITY_NONE:
					if (old_visibility == SELF.Visibility.VISIBILITY_SHOW)
						if (m_parent) m_parent.invalidateRect(m_rect);
					if (m_parent) m_parent.invalidateLayout();
					break;
			}

			me.throwNotification(
				{
					'id' : SELF.NOTIFICATION.NOTIFICATION_FRAME_VISIBILITY_CHANGED,
				 	'new' : visibility,
				 	'old' : old_visibility,
				});

		});

		$PUBLIC_FUN_IMPL('getVisibility', function(){
			return m_visibility;
		});

		$PUBLIC_FUN_IMPL('invalidateRect', function(rc){

			// overload invalidateRect(). 
			if (typeof rc == 'undefined') {
				rc = new UI.Rect(0, 0, m_rect.width(), m_rect.height());
				me.invalidateRect(rc);
				return;
			}

			if (m_visibility != SELF.Visibility.VISIBILITY_SHOW) return;

			if (rc.isEmpty()) return;

			var rect_real = rc.intersect(new UI.Rect(0, 0, m_rect.width(), m_rect.height()));
			if (rect_real.isEmpty()) return;

			if (!m_parent) return;
			
			m_parent.invalidateRect(me.childToParent(rc));
		});

		$PUBLIC_FUN_IMPL('invalidateAfterLayout', function(){
			m_need_invalidate_after_layout = true;
		});


		$PUBLIC_FUN_IMPL('addFrame', function(frame){
			return me.insertFrame(frame, m_child_frames.length);
		});

		$PUBLIC_FUN_IMPL('insertFrame', function(frame, index) {
			if (m_child_frames.indexOf(frame) != -1) return;

			if (index < 0) index = 0;
			if (index > m_child_frames.length) index = m_child_frames.length;

			m_child_frames.splice(index, 0, frame);
			frame.onAttachedToParent(me.$THIS);

			switch (frame.getVisibility()) {
				case SELF.Visibility.VISIBILITY_HIDE:
					me.invalidateLayout();
					break;
				case SELF.Visibility.VISIBILITY_SHOW:
					me.invalidateLayout();
					frame.invalidateAfterLayout();
					break;
			}
		});

		$PUBLIC_FUN_IMPL('removeFrame', function (index_or_frame){
			if (typeof index_or_frame != "number") {
				var frame = index_or_frame;
				var index = m_child_frames.indexOf(frame);
				if (index == -1) return null;
				return me.removeFrame(index);
			}

			var index = index_or_frame;
			if (index >= m_child_frames.length) return null;

			var frame = m_child_frames[index];

			m_child_frames.splice(index, 1);
			frame.onDetachedFromParent();

			switch(frame.getVisibility()) {
				case SELF.Visibility.VISIBILITY_SHOW:
					me.invalidateRect(frame.getRect());
					'nobreak';
				case SELF.Visibility.VISIBILITY_HIDE:
					me.invalidateLayout();
			}

			return frame;
		});

		$PUBLIC_FUN_IMPL('getFrameByIndex', function(i){
			if (i < 0 || i >= m_child_frames.length)
				return null;

			return m_child_frames[i];
		});

		$PUBLIC_FUN_IMPL('getFrameCount', function(){
			return m_child_frames.length;
		});

		$PUBLIC_FUN_IMPL('setParent', function (parent){
			if (m_parent == parent) return;
			if (m_parent) m_parent.removeFrame(me.$THIS);
			if (parent) parent.addFrame(me.$THIS);
		});

		$PUBLIC_FUN_IMPL('getParent', function(){
			return m_parent;
		});

		$PUBLIC_FUN_IMPL('onAttachedToParent', function(parent){
			if (m_parent) setParent(NULL);
			m_parent = parent;
			me.throwNotification(
				{
					'id' : SELF.NOTIFICATION.NOTIFICATION_FRAME_ATTACHED_TO_PARENT,
					'parent' : parent
				});
		});

		$PUBLIC_FUN_IMPL('getFocus', function(){
			me.getEventManager().getFocus(me.$THIS);
		});

		$PUBLIC_FUN_IMPL('paintUI', function(ctx, rect){
			if (m_visibility != SELF.Visibility.VISIBILITY_SHOW)
				return;

			me.paintBackground(ctx, rect);
			me.paintForeground(ctx, rect);

		});

		$PUBLIC_FUN_IMPL('paintBackground', function(ctx, rect){
			if (m_background)
				m_background.draw(ctx, rect);
		});

		$PUBLIC_FUN_IMPL('paintForeground', function(ctx, rect) {
			if (m_selectable && m_selected_state) {
				fillSelectedLayer();
				m_selected_layer.draw(ctx, rect);
			}

			if (m_touchable && m_mouse_over) {
				if (m_mouse_down) {
					fillMouseDownLayer();
					m_mousedown_layer.draw(ctx, rect);
				} else {
					fillMouseOverLayer();
					m_mouseover_layer.draw(ctx, rect);
				}
			}

			for (var i = 0; i < m_child_frames.length; i++) {
				var c = m_child_frames[i];
				if (c.getVisibility() != SELF.Visibility.VISIBILITY_SHOW)
					continue;

				var frame_rect = c.getRect();

				var rect_paint = frame_rect.intersect(rect);
				if (rect_paint.isEmpty()) continue;

				ctx.save();

				ctx.beginPath();

				ctx.rect(rect_paint.left, rect_paint.top,
					rect_paint.width(), rect_paint.height());
				ctx.clip();

				ctx.translate(frame_rect.left, frame_rect.top);

				c.paintUI(ctx, c.parentToChild(rect_paint));

				ctx.restore();
			}
		});

		$PUBLIC_FUN_IMPL('onDetachedFromParent', function(){
			var parent = m_parent;
			m_parent = null;
			me.throwNotification({
				'id' : SELF.NOTIFICATION.NOTIFICATION_FRAME_DETACHED_FROM_PARENT,
				'parent' : parent
			});
		});
		

		$PUBLIC_FUN_IMPL('onNotification', function(notification){
			me.$THIS.$DISPATCH_MESSAGE('NOTIFICATION', notification);
		});

		$PUBLIC_FUN_IMPL('destroy', function(){

			me.setVisibility(SELF.Visibility.VISIBILITY_NONE);

			me.setParent(null);

			while (m_child_frames.length) {
				var frame = m_child_frames.last();
				frame.destroy();
			}

			m_last_measure_width_param.reset();
			m_last_measure_height_param.reset();

			me.setRect(new UI.Rect(0, 0, 0, 0));

			me.setBackground(null);

			me.setTouchable(false);
			me.setMouseOverLayer(null);
			me.setMouseDownLayer(null);

			me.setSelectable(false);
			me.setSelectWhenMouseClick(false);
			me.setUnselectWhenMouseClick(false);
			me.setSelectedState(false);
			me.setSelectedLayer(null);

			m_layout_param = null;
			m_delay_layout_param = null;
			m_delay_update_layout_param_scheduled = false;

			m_measured_width = m_measured_height = 0;

			m_layout_invalid = true;

			m_mouse_over = false;
			m_mouse_down = false;

			me.clearNotificationListener();
			me.$PARENT(UI.XEasyNotificationListener).destroy();

			m_active = false;
		});

		$PUBLIC_FUN_IMPL('isFrameActive', function(){
			return m_active;
		});

		$PUBLIC_FUN_IMPL('getTopFrameFromPoint', function(pt) {
			if (m_visibility != SELF.Visibility.VISIBILITY_SHOW) return null;
			if (!pt.inRect(new UI.Rect(0, 0, m_rect.width(), m_rect.height())))
				return null;

			var frame = me.$THIS;

			for (var i = m_child_frames.length - 1; i >=0; i--) {
				var c = m_child_frames[i];
				var frame_child = c.getTopFrameFromPoint(c.parentToChild(pt));
				if (frame_child) {
					frame = frame_child;
					break;
				}
			}

			return frame;
		});

		$PUBLIC_FUN_IMPL('needPrepareMsg', function(){
			return true;
		})

		$PUBLIC_FUN_IMPL('getEventManager', function(){
			if (m_parent) return m_parent.getEventManager();
			return null;
		});


		$PUBLIC_FUN_IMPL('childToParent', function(pt_or_rect){

			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Pt)) {
				var pt = pt_or_rect;
				return new UI.Pt(pt.x + m_rect.left, pt.y + m_rect.top);
			}

			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Rect)) {
				var rc = pt_or_rect;
				var new_rect = new UI.Rect(rc);
				new_rect.offset(m_rect.leftTop());
				return new_rect;
			}
		});

		$PUBLIC_FUN_IMPL('parentToChild', function(pt_or_rect){

			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Pt)) {
				var pt = pt_or_rect;
				return new UI.Pt(pt.x - m_rect.left, pt.y - m_rect.top);
			}

			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Rect)) {
				var rc = pt_or_rect;
				var new_rect = new UI.Rect(rc);
				new_rect.offset(-m_rect.left, -m_rect.top);
				return new_rect;
			}
		});

		$PUBLIC_FUN_IMPL('otherFrameToThisFrame', function (other, pt_or_rect){
			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Rect)) {
				var rc = pt_or_rect;
				var left_top = me.otherFrameToThisFrame(rc.leftTop());
				var right_bottpm = me.otherFrameToThisFrame(rc.rightBottom());
				return new UI.Rect(left_top, right_bottpm);
			}

			var pt = pt_or_rect;

			var this_frame_root = me;
			var other_frame_root = other;

			var this_org_pt = new UI.Pt(0,0);
			var target_pt = new UI.Pt(pt);

			while (this_frame_root.getParent()) {
				this_org_pt = this_frame_root.childToParent(this_org_pt);
				this_frame_root = this_frame_root.getParent();
			}

			while (other_frame_root.getParent()) {
				target_pt = other_frame_root.childToParent(target_pt);
				other_frame_root = other_frame_root.getParent();
			}

			if (this_frame_root != other_frame_root)
				return new UI.Pt(0,0);

			return new UI.Pt(target_pt.x - this_org_pt.x,
				target_pt.y - this_org_pt.y);
		});

		$PUBLIC_FUN_IMPL('toContainer', function(pt_or_rect){
			if (pt_or_rect.instanceOf && pt_or_rect.instanceOf(UI.Rect)) {
				var rc = pt_or_rect;
				var left_top = me.toContainer(rc.leftTop());
				var right_bottpm = me.toContainer(rc.rightBottom());
				return new UI.Rect(left_top, right_bottpm);
			}

			var pt = pt_or_rect;

			if (m_parent) return m_parent.toContainer(me.childToParent(pt));

			return pt;
		});

		$PUBLIC_FUN_IMPL('getContainer', function(){
			if (m_parent) return m_parent.getContainer();
			return null;
		});

		$PUBLIC_FUN_IMPL('setCursor', function(cursor){
			if (m_parent) m_parent.setCursor(cursor);
		});

		$PUBLIC_FUN_IMPL('needLayout', function(){
			return m_visibility != SELF.Visibility.VISIBILITY_NONE;
		});

		$PUBLIC_FUN_IMPL('measureWidth', function(param){
			if (param.equals(m_last_measure_width_param) && !m_layout_invalid)
				return;
			me.onMeasureWidth(param);
		})

		$PUBLIC_FUN_IMPL('measureHeight', function(param){
			if (param.equals(m_last_measure_height_param) && !m_layout_invalid)
				return;
			me.onMeasureHeight(param);
		});

		$PUBLIC_FUN_IMPL('getMeasuredWidth', function(){
			return m_measured_width;
		});

		$PUBLIC_FUN_IMPL('getMeasuredHeight', function(){
			return m_measured_height;
		});

		$PUBLIC_FUN_IMPL('setMeasuredWidth', function(v){
			m_measured_width = v;
		});
		
		$PUBLIC_FUN_IMPL('setMeasuredHeight', function(v){
			m_measured_height = v;
		});

		$PUBLIC_FUN_IMPL('layout', function(rc){

			if (m_parent) {
				rc = new UI.Rect(rc);
				rc.offset(-m_parent.getScrollX(), -m_parent.getScrollY());
			}	

			if (!m_rect.equals(rc) || m_layout_invalid) {
				m_layout_invalid = false;
				me.onLayout(rc);
				me.setRect(rc);
			}

			if (m_need_invalidate_after_layout) {
				m_need_invalidate_after_layout = false;
				me.invalidateRect();
			}
		});

		$PUBLIC_FUN_IMPL('getLayoutParam', function(){
			return m_layout_param;
		});
		

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
			m_measured_width = 
				onMeasureLayoutDirection(param, 
					'measureWidth', 'getMeasuredWidth', 'x', 'width', 'margin_right');
		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
			m_measured_height =
				onMeasureLayoutDirection(param,
					'measureHeight', 'getMeasuredHeight', 'y', 'height', 'margin_bottom');
		});

		$PUBLIC_FUN_IMPL('onLayout', function(rc) {
			for (var i = 0; i < m_child_frames.length; i++) {
				var cur = m_child_frames[i];
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();

				var rect = new UI.Rect(layout_param.x, layout_param.y,
					layout_param.x + cur.getMeasuredWidth(),
					layout_param.y + cur.getMeasuredHeight());

				cur.layout(rect);
			}
		});

		$MESSAGE_HANDLER('onDelayupdateLayout', function(){
			if (!m_delay_update_layout_param_scheduled)
				return;

			m_delay_update_layout_param_scheduled = false;

			if (!m_delay_layout_param) return;

			if (m_layout_param != m_delay_layout_param)
				m_layout_param = m_delay_layout_param;

			m_delay_layout_param = null;

			me.endUpdateLayoutParam();
		});

		$MESSAGE_HANDLER('onMouseDown', function(){
			if (!m_touchable && !m_select_when_mouse_click && !m_unselected_when_mouse_click)
				return;

			m_mouse_down = true;

			me.getEventManager().captureMouse(me.$THIS);

			me.invalidateRect();
		});

		$MESSAGE_HANDLER('onMouseUp', function(e){
			
			if (!m_mouse_down) return;
			
			m_mouse_down = false;

			me.getEventManager().releaseCaptureMouse(me.$THIS);

			if (m_touchable) me.invalidateRect();

			if (!e.UI_pt.inRect(me.parentToChild(m_rect)))
				return 0;

			if (m_selectable)
				if (m_selected_state) {
					if (m_unselected_when_mouse_click) me.setSelectedState(false);
				} else {
					if (m_select_when_mouse_click) me.setSelectedState(true);
				}
		});

		$MESSAGE_HANDLER('onMouseLeave', function(){
			m_mouse_over = false;

			if (!m_touchable) return;

			me.invalidateRect();
		});

		$MESSAGE_HANDLER('onMouseEnter', function(){
			m_mouse_over = true;

			if (!m_touchable) return;

			me.invalidateRect();
		});


		function onMeasureLayoutDirection(param, child_measure_proc, child_get_measured_proc,
			layout_param_pos, layout_param_size, layout_margin_end) {

			var measured_size = 0;

			var max_end = 0;

			for (var i = 0; i < m_child_frames.length; i++) {
				var cur = m_child_frames[i];
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam(); 

				if (layout_param[layout_param_size] == 
					SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT)
					continue;

				var param_for_measure = new SELF.MeasureParam();

				switch (layout_param[layout_param_size]) {
					case SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT:
						if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST ||
							param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT) {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_ATMOST;
							param_for_measure.num = Math.max(0, param.num - layout_param[layout_param_pos]);
						} else {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED;
							param_for_measure.num = 0;
						}
						break;
					default:
						param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
						param_for_measure.num = Math.max(0, layout_param[layout_param_size]);
						break;
				}

				cur[child_measure_proc](param_for_measure);

				max_end = Math.max(max_end, 
					layout_param[layout_param_pos]
					+ cur[child_get_measured_proc]()
					+ layout_param[layout_margin_end]);
			}

			switch (param.spec) {
				case SELF.MeasureParam.Spec.MEASURE_EXACT:
					measured_size = param.num;
					break;
				default:
					measured_size = max_end;
					if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
						measured_size = Math.min(measured_size, param.num);
					break;
			}

			for (var i = 0; i < m_child_frames.length; i++) {
				var cur = m_child_frames[i];
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();

				if (layout_param[layout_param_size] != 
					SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT)
					continue;

				var param_for_measure = new SELF.MeasureParam();
				param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
				param_for_measure.num = Math.max(
					0, measured_size - layout_param[layout_param_pos]
					- layout_param[layout_margin_end]); 

				cur[child_measure_proc](param_for_measure);
			}


			return measured_size;
		}

		function fillMouseOverLayer() {
			if (m_mouseover_layer) return;
			me.setMouseOverLayer(UI.XResourceMgr.getImage('img/layer/mouse_over.9.png'));
		}

		function fillMouseDownLayer() {
			if (m_mousedown_layer) return;
			me.setMouseDownLayer(UI.XResourceMgr.getImage('img/layer/mouse_down.9.png'));
		}

		function fillSelectedLayer() {
			if (m_selected_layer) return;
			me.setSelectedLayer(UI.XResourceMgr.getImage('img/layer/selected.9.png'));
		}

		function updateScroll(offset_x, offset_y) {
			for (var i = 0; i < m_child_frames.length; i++) {
				var c = m_child_frames[i];
				var frame_rect = new UI.Rect(c.getRect());
				frame_rect.offset(-offset_x, -offset_y);
				c.setRect(frame_rect);
			}
		}

	}).
	$STATIC({
		'buildFromXML' : buildFromXML,
	});

	$ENUM('UI.XFrame.NOTIFICATION',
	[
		'NOTIFICATION_FRAME_VISIBILITY_CHANGED',
		'NOTIFICAITON_FRAME_RECT_CHANGED',
		'NOTIFICATION_FRAME_ATTACHED_TO_PARENT',
		'NOTIFICATION_FRAME_DETACHED_FROM_PARENT',
	]);

	$ENUM('UI.XFrame.EVENT_ID',
	[
		'EVENT_X_DELAY_UDPATE_LAYOUT',
	]);


	$ENUM('UI.XFrame.Visibility', 
	[
		'VISIBILITY_NONE',
		'VISIBILITY_HIDE',
		'VISIBILITY_SHOW'
	]);


	$CLASS('UI.XFrame.LayoutParam', function(me, SELF){

		var public_var_list = {
			'x' 		: 0,
			'y' 		: 0,
			'width' 	: 0,
			'height'	: 0,
		
			'margin_left'		: 0,
			'margin_top'		: 0,
			'margin_right'		: 0,
			'margin_bottom'		: 0
		};

		$PUBLIC_VAR(public_var_list);


		$CONSTRUCTOR(function(xml_node_or_layout_param_or_null){

			if (!xml_node_or_layout_param_or_null) return;

			if (xml_node_or_layout_param_or_null.instanceOf &&
				xml_node_or_layout_param_or_null.instanceOf(SELF)) {

				var other = xml_node_or_layout_param_or_null;
				if (other.classobj != SELF)
					other = other.parent(SELF);

				$.each(public_var_list, function(i,v){
					me[i] = other[i];
				});

				return;
			}	

			if (xml_node_or_layout_param_or_null.nodeName) {
				var xml_node = xml_node_or_layout_param_or_null;

				$.each(['margin_right', 'margin_top', 'margin_right', 'margin_bottom'],
					function(k,v){
						me[v] = xml_node.getAttribute(v) - 0 || 0;
					});

				me.x = xml_node.getAttribute('left') - 0 || 0;
				me.y = xml_node.getAttribute('top') - 0 || 0;
				me.width = getSpecialMetrics(xml_node.getAttribute('width'));
				me.height = getSpecialMetrics(xml_node.getAttribute('height'));
			}
		});

		function getSpecialMetrics(v) {
			if (v.toLowerCase() == 'reach_parent')
				return SELF.SpecialMetrics.METRIC_REACH_PARENT;
			if (v.toLowerCase() == 'wrap_content')
				return SELF.SpecialMetrics.METRIC_WRAP_CONTENT;

			return v - 0 || 0;
		}
	});

	$ENUM('UI.XFrame.LayoutParam.SpecialMetrics', 
	[
		'METRIC_REACH_PARENT',
		'METRIC_WRAP_CONTENT'
	]);

	$STRUCT('UI.XFrame.MeasureParam', function(SELF){

		$PUBLIC_VAR({
			'spec' 	: null,
			'num'	: 0
		});

		$CONSTRUCTOR(function(){
			this.spec = SELF.Spec.MEASURE_UNRESTRICTED;
		});

		$PUBLIC_FUN([
			'reset',
			'equals',
			'notequals'
		]);

		$PUBLIC_FUN_IMPL('reset', function(){
			this.spec =  SELF.Spec.MEASURE_UNRESTRICTED,
			this.num = 0;
		});

		$PUBLIC_FUN_IMPL('equals', function(other){
			return this.spec == other.spec &&
				this.num == other.num;
		});

		$PUBLIC_FUN_IMPL('notequals', function(other){
			return !this.equals(other);
		});
	});

	$ENUM('UI.XFrame.MeasureParam.Spec',[
		'MEASURE_UNRESTRICTED', 
		'MEASURE_ATMOST',
		'MEASURE_EXACT'
	]);

	function buildFromXML(xml_node, parent) {
		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var frame = new this();
		frame.create(parent, layout_param, 
			UI.XFrame.Visibility.VISIBILITY_NONE);

		return frame;
	}

})();








