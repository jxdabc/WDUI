;

$CLASS('UI.XFrame', 
$EXTENDS(UI.IXNotificationLister),
function(me, SELF){

	$PUBLIC_FUN([
		'setName',
		'getName',
		'getFrameByName',
		'getFramesByName',

		'create',

		'setVisibility',
		'getVisibility',

		'setBackground',
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

		'getRect',
		'setRect',

		'generateLayoutParam',
		'beginUpdateLayoutParam',
		'endUpdateLayoutParam',
		'getLayoutParam',
		'isLayouting',
		'invalidateLayout',

		'measureWidth',
		'measureHeight',
		'getMeasuredWidth',
		'getMeasuredHeight',
		'layout',

		'onMeasureWidth',
		'onMeasureHeight',
		'onLayout',

		'addFrame',
		'insertFrame',
		'removeFrame',
		'getFrameByIndex',
		'setParent',
		'onDetachedFromParent',
		'onAttachedToParent',

		'addNotificationListener',
		'removeNofiticationListener',
		'throwNotification',

		'childToParent',

		'onNotification',
		'genRemoteRef',
		'recycleRemoteRef',
		'destroy',
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(UI.XFrame.EVENT_ID.EVENT_X_DELAY_UDPATE_LAYOUT, 'onDelayupdateLayout')
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


	var m_notification_listener = [];
	var m_remote_ref = [];


	$PUBLIC_FUN_IMPL('setName', function(name){
		m_name = name;
	});

	$PUBLIC_FUN_IMPL('getName', function(){
		return m_name;
	});

	$PUBLIC_FUN_IMPL('getFrameByName', function(){
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
	});

	$PUBLIC_FUN_IMPL('beginUpdateLayoutParam', function(layout_param){

		// overload beginUpdateLayoutParam()

		if (me.isLayouting()) {
			if (!m_delay_layout_param)
				m_delay_layout_param = layout_param || me.generateLayoutParam(m_layout_param);
			return m_delay_layout_param;
		} else {
			if (!m_layout_param)
				m_layout_param = layout_param || me.generateLayoutParam();
			return m_layout_param;
		}
	});

	$PUBLIC_FUN_IMPL('endUpdateLayoutParam', function() {
		if (m_delay_layout_param) {
			if (m_delay_update_layout_param_scheduled)
				return 'delayed';

			m_delay_update_layout_param_scheduled = true;

			UI.XMessageService.instance().
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

	$PUBLIC_FUN_IMPL('setBackground', function(background){
		if (m_background == background)
			return null;

		var old = m_background;

		m_background = background;

		if (m_background) {
			m_background.setDstRect(
				new UI.Rect(0,0,m_rect.width(), m_rect.height));
			m_background.onImageLoaded(me.onBackgroundLoaded);
		}

		if (m_visibility == SELF.Visibility.VISIBILITY_SHOW)
			me.invalidateRect();

		if (old)
			old.offImageLoaded(me.onBackgroundLoaded);

		return old;
	});

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

		invalidateRect();
	});


	$PUBLIC_FUN_IMPL('setSelectable', function(b){
		if ((m_selectable && b) || (!m_selectable && !b))
			return;

		m_selectable = b;

		m_selected_state = false;

		invalidateRect();
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

		invalidateRect();
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
				if (old_visibility == SELF.Visibility.VISIBILITY_NONE) 
					if (m_parent) m_parent.invalidateLayout();
				else
					if (m_parent) m_parent.invalidateRect(m_rect);
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
			me.invalidateRect(new UI.Rect(0, 0, m_rect.width(), m_rect.height()));
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
			me.removeFrame(index);
			return;
		}

		var index = index_or_frame;
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

	$PUBLIC_FUN_IMPL('setParent', function (parent){
		if (m_parent == parent) return;
		if (m_parent) m_parent.removeFrame(me.$THIS);
		if (parent) parent.addFrame(me.$THIS);
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

	$PUBLIC_FUN_IMPL('onDetachedFromParent', function(){
		var parent = m_parent;
		m_parent = NULL;
		me.throwNotification({
			'id' : SELF.NOTIFICATION.NOTIFICATION_FRAME_DETACHED_FROM_PARENT,
			'parent' : parent
		});
	});

	$PUBLIC_FUN_IMPL('addNotificationListener', function(listener){
		m_notification_listener.push(listener.genRemoteRef());
	});

	$PUBLIC_FUN_IMPL('removeNofiticationListener', function(listener){
		for (var i = 0; i < m_notification_listener.length; i++) {
			if (m_notification_listener[i].obj == listener) {
				listener.recycleRemoteRef(m_notification_listener[i]);
				m_notification_listener.splice(i,1);
				break;
			}
		}
	});

	$PUBLIC_FUN_IMPL('throwNotification', function(notification) {
		for (var i = 0; i < m_notification_listener.length; /*no i++*/) {
			var r = m_notification_listener[i];
			if (r.obj) {r.obj.onNotification(notification); i++;}
			else m_notification_listener.splice(i,1);
		}
	});

	$PUBLIC_FUN_IMPL('onNotification', function(notification){
		me.$THIS.$DISPATCH_MESSAGE('NOTIFICATION', notification);
	});

	$PUBLIC_FUN_IMPL('genRemoteRef', function(){
		var ref = {'obj' : me.$THIS};
		m_remote_ref.push(ref);
	});

	$PUBLIC_FUN_IMPL('recycleRemoteRef', function(ref){
		var index = m_remote_ref.indexOf(ref);
		m_remote_ref.splice(index, 1);
	});

	$PUBLIC_FUN_IMPL('destroy', function(){

		me.setVisibility(SELE.VISIBILITY.VISIBILITY_NONE);

		setParent(null);

		while (m_child_frames.length) {
			var frame = m_child_frames.last();
			frame.destroy();
		}

		m_last_measure_width_param.reset();
		m_last_measure_height_param.reset();

		setRect(new UI.Rect(0, 0, 0, 0));

		me.setBackground(NULL);

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

		m_notification_listener = [];

		$.each(m_remote_ref, function(i,v){
			v.obj = null;
		});
		m_remote_ref = [];
	});




	$PUBLIC_FUN_IMPL('childToParent', function(pt_or_rc){
		if (pt_or_rc.instanceOf && pt_or_rc.instanceOf(UI.Pt)) {
			var pt = pt_or_rc;
			return new UI.Pt(pt.x + m_rect.left, pt.y + m_rect.top);
		}

		if (pt_or_rc.instanceOf && pt_or_rc.instanceOf(UI.Rect)) {
			var rc = pt_or_rc;
			var new_rect = new UI.Rect(rc);
			new_rect.offset(m_rect.leftTop());
			return new_rect;
		}
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

	$PUBLIC_FUN_IMPL('layout', function(rc){

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
			onMeasureLayoutDirect(param, 
				'measureWidth', 'getMeasuredWidth', 'x', 'width', 'margin_right');
	});

	$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
		m_measured_height =
			onMeasureLayoutDirect(param,
				'measureHeight', 'getMeasuredHeight', 'y', 'height', 'margin_bottom');
	});

	$PUBLIC_FUN_IMPL('onLayout', function(rc) {
		for (var i = 0; i < m_child_frames.length; i++) {
			var cur = m_child_frames[i];
			var layout_param = cur.getLayoutParam();

			if (cur.getVisibility() == SELF.Visibility.VISIBILITY_NONE)
				continue;

			var rect = new UI.Rect(layout_param.x, layout_param.y,
				layout_param.x + cur.getMeasuredWidth(),
				layout_param.y + cur.getMeasuredHeight());

			cur.layout(rect);
		}
	});

	$MESSAGE_HANDLER('onDelayupdateLayout', function(){
		if (!m_delay_update_layout_param_schedule || !m_delay_layout_param)
			return;

		m_delay_update_layout_param_schedule = false;

		m_layout_param = m_delay_layout_param;
		m_delay_layout_param = null;

		me.endUpdateLayoutParam();
	});


	function onMeasureLayoutDirect(param, child_measure_proc, child_get_measured_proc,
		layout_param_pos, layout_param_size, layout_margin_end) {

		var measured_size = 0;

		var max_end = 0;

		for (var i = 0; i < m_child_frames.length; i++) {
			var cur = m_child_frames[i];
			var layout_param = cur.getLayoutParam(); 
			if (cur.getVisibility == SELF.Visibility.VISIBILITY_NONE)
				continue;

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
						param.spec = SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED;
						param.num = 0;
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
			var layout_param = cur.getLayoutParam();

			if (cur.getVisibility() == SELF.Visibility.VISIBILITY_NONE)
				continue;

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


	$CONSTRUCTOR(function(xml_or_layout_param){

		if (!xml_or_layout_param) return;

		if (xml_or_layout_param.instanceOf &&
			xml_or_layout_param.instanceOf(SELF)) {

			var other = xml_or_layout_param;
			if (other.classobj != SELF)
				other = other.parent(SELF);

			$.each(public_var_list, function(i,v){
				me[i] = other[i];
			});
		}	

		// TODO: XML part
	});

});

$ENUM('UI.XFrame.LayoutParam.SpecialMetrics', 
[
	'METRIC_REACH_PARENT',
	'METRIC_WRAP_CONTENT'
]);

$CLASS('UI.XFrame.MeasureParam', function(me, SELF){

	$PUBLIC_VAR({
		'spec' 	: SELF.Spec.MEASURE_UNRESTRICTED,
		'num'	: 0
	});

	$PUBLIC_FUN([
		'reset',
		'equals',
		'notequals'
	]);

	$PUBLIC_FUN_IMPL('reset', function(){
		me.spec =  SELF.Spec.MEASURE_UNRESTRICTED,
		me.num = 0;
	});

	$PUBLIC_FUN_IMPL('equals', function(other){
		return me.spec == other.spec &&
			me.num == other.num;
	});

	$PUBLIC_FUN_IMPL('notequals', function(other){
		return !me.equals(other);
	});
});

$ENUM('UI.XFrame.MeasureParam.Spec',[
	'MEASURE_UNRESTRICTED', 
	'MEASURE_ATMOST',
	'MEASURE_EXACT'
]);






