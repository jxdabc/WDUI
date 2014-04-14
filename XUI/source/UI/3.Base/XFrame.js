;

$CLASS('UI.XFrame', function(me, SELF){


	$PUBLIC_FUN([
		'setName',
		'getName',
		'getFrameByName',
		'getFramesByName',

		'create',

		'generateLayoutParam',
		'beginUpdateLayoutParam',
		'endUpdateLayoutParam',
		'isLayouting',
		'invalidateLayout'
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(UI.EVENT_ID.EVENT_DELAY_UDPATE_LAYOUT, 'onDelayupdateLayout')
	]);

	var m_parent = null;

	var m_layout_param 			= null;
	var m_delay_layout_param 	= null;

	var m_delay_update_layout_param_scheduled = false;

	var m_layout_invalid = false;

	var m_name = null;
	var m_child_frames = [];

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

		visibility = visibility || UI.XFrame.Visibility.VISIBILITY_NONE;

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

		return;
	});

	$PUBLIC_FUN_IMPL('isLayouting', function() {
		if (m_parent) return m_parent.isLayouting();
		return false;
	});

	$PUBLIC_FUN('invalidateLayout', function(){

	});

	$MESSAGE_HANDLER('onDelayupdateLayout', function(){
		if (!m_delay_update_layout_param_schedule || !m_delay_layout_param)
			return;

		m_delay_update_layout_param_schedule = false;

		m_layout_param = m_delay_layout_param;
		m_delay_layout_param = null;

		me.endUpdateLayoutParam();
	});


	// function invalidateLayout() {

	// }


	// function generateLayoutParam(copy_from_or_xml_or_null) {
		
	// 	if (!copy_from_or_xml_or_null)
	// 		return new SELF.LayoutParam();

	// 	if (copy_from_or_xml_or_null.instanceOf &&
	// 		copy_from_or_xml_or_null.instanceOf(SELF.LayoutParam)) {
	// 		var copy_from = copy_from_or_xml_or_null;
	// 		return new SELF.LayoutParam(copy_from);			
	// 	}	

	// 	// TODO : XML part
	// }

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