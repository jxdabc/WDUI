;

$CLASS('UI.XFrame', function(me, SELF){


	$PUBLIC_FUN([
		'setName',
		'getName',
		'getFrameByName',
		'getFramesByName',

		'create',

		'setVisibility',
		'getVisibility',

		'invalidateRect',
		'invalidateAfterLayout',

		'getRect',
		'setRect',

		'generateLayoutParam',
		'beginUpdateLayoutParam',
		'endUpdateLayoutParam',
		'isLayouting',
		'invalidateLayout',

		'addFrame',
		'insertFrame',
		'removeFrame',
		'setParent',
		'onDetachedFromParent',
		'onAttachedToParent',

		'throwNotification',

		'childToParent',
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(UI.EVENT_ID.EVENT_DELAY_UDPATE_LAYOUT, 'onDelayupdateLayout')
	]);

	var m_layout_invalid = false;
	var m_layout_param 			= null;
	var m_delay_layout_param 	= null;
	var m_delay_update_layout_param_scheduled = false;
	var m_need_invalidate_after_layout = false;
	var m_rect = new UI.Rect();
	
	var m_name = null;

	var m_parent = null;
	var m_child_frames = [];

	var m_visibility = SELF.VISIBILITY.VISIBILITY_NONE;

	m_background = null;
	m_mouseover_layer = null;
	m_mousedown_layer = null;
	m_selected_layer = null;

	$PUBLIC_FUN_IMPL('setName', function(name){
		m_name = name;
	})

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

		beginUpdateLayoutParam(layout);
		endUpdateLayoutParam();

		setParent(parent);

		setVisibility(visibility);
	});

	$PUBLIC_FUN_IMPL('beginUpdateLayoutParam', function(){
		if (me.isLayouting()) {
			if (!m_delay_layout_param)
				m_delay_layout_param = me.generateLayoutParam(m_layout_param);
			return m_delay_layout_param;
		} else {
			if (!m_layout_param)
				m_layout_param = me.generateLayoutParam();
			return m_layout_param;
		}
	});

	$PUBLIC_FUN_IMPL('endUpdateLayoutParam', function() {
		if (m_delay_layout_param) {
			if (m_delay_update_layout_param_scheduled)
				return;

			m_delay_update_layout_param_scheduled = true;

			UI.XMessageService.instance().
				postFrameEvent(me.$THIS, {'id' :UI.EVENT_ID.EVENT_DELAY_UDPATE_LAYOUT});

			return;
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

		if (m_rect == new_rect) return;

		var old_rect = new UI.Rect(m_rect);
		m_rect = new_rect;

		var rect_draw_area = new UI.Rect(0, 0, new_rect.width(), new_rect.height());

		if (m_background) m_background.setDstRect(rect_draw_area);
		if (m_mouseover_layer) m_mouseover_layer.setDstRect(rect_draw_area);
		if (m_mousedown_layer) m_mousedown_layer.setDstRect(rect_draw_area);
		if (m_selected_layer) m_selected_layer.setDstRect(rect_draw_area);

		if (m_visibility == SELF.VISIBILITY.VISIBILITY_SHOW) {
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

	$PUBLIC_FUN_IMPL('setVisibility', function(visibility){
		
		if (m_visibility == visibility) return;

		var old_visibility = m_visibility;
		m_visibility = visibility;

		switch (visibility) {
			case SELF.VISIBILITY.VISIBILITY_SHOW:
				if (old_visibility == SELF.VISIBILITY.VISIBILITY_NONE
					&& m_parent) {
					m_parent.invalidateLayout();
					me.invalidateAfterLayout();
				} else me.invalidateRect();
				break;
			case SELF.VISIBILITY.VISIBILITY_HIDE:
				if (old_visibility == SELF.VISIBILITY.VISIBILITY_NONE) 
					if (m_parent) m_parent.invalidateLayout();
				else
					if (m_parent) m_parent.invalidateRect(m_rect);
				break;
			case SELF.VISIBILITY.VISIBILITY_NONE:
				if (old_visibility == SELF.VISIBILITY.VISIBILITY_SHOW)
					if (m_parent) m_parent.invalidateRect(m_rect);
				if (m_parent) m_parent.invalidateLayout();
				break;
		}

		me.throwNotification(
			{
				'id' : SELF.NOTIFICATION.NOTIFICATION_FRAME_VISIBILITY_CHANGED,
			 	'new' : visibility,
			 	'old' : old_visibility,
			};

	});

	$PUBLIC_FUN_IMPL('getVisibility', function(){
		return m_visibility;
	});

	$PUBLIC_FUN_IMPL('invalidateRect', function(rc){
		if (m_visibility != SELF.VISIBILITY.VISIBILITY_SHOW) return;
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
			case SELF.VISIBILITY.VISIBILITY_HIDE:
				me.invalidateLayout();
				break;
			case SELF.VISIBILITY.VISIBILITY_SHOW:
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
			case SELF.VISIBILITY.VISIBILITY_SHOW:
				me.invalidateRect(frame.getRect());
				'nobreak';
			case SELF.VISIBILITY.VISIBILITY_HIDE:
				me.invalidateLayout();
		}

		return frame;
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

	$MESSAGE_HANDLER('onDelayupdateLayout', function(){
		if (!m_delay_update_layout_param_schedule || !m_delay_layout_param)
			return;

		m_delay_update_layout_param_schedule = false;

		m_layout_param = m_delay_layout_param;
		m_delay_layout_param = null;

		me.endUpdateLayoutParam();
	});
});

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

$EUM('UI.XFrame.NOTIFICATION',
[
	'NOTIFICATION_FRAME_VISIBILITY_CHANGED',
	'NOTIFICAITON_FRAME_RECT_CHANGED',
	'NOTIFICATION_FRAME_ATTACHED_TO_PARENT',
	'NOTIFICATION_FRAME_DETACHED_FROM_PARENT',
])