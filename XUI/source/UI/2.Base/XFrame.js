;

$CLASS('UI.XFrame', function(me, SELF){


	$PUBLIC_FUN([
		'setName',
		'getName',
		'getFrameByName',
		'getFrmaesByName',

		'create',

		'generateLayoutParam',
		'beginUpdateLayoutParam',
		'endUpdateLayoutParam',
		'isLayouting',
		'invalidateLayout'
	]);

	var m_parent = null;

	var m_layout_param 			= null;
	var m_delay_layout_param 	= null;


	var m_name = null;
	var m_child_frames = [];

	$PUBLIC_FUN_IMPLE('setName', function(){
		return m_name;
	});

	$PUBLIC_FUN_IMPLE('getFrameByName', function(){
		if (m_name == name) return me;

		for (var i = 0; i < m_child_frames.length; i++) {
			var rst = m_child_frames[i].getFrameByName(name);
			if (rst) return rst;
		}

		return null;
	});

	$PUBLIC_FUN_IMPLE('getFramesByName', function(){
		var rst = [];

		if (m_name == name) rst.push(me);
		$.each(m_child_frames, function(i,v){
			var f = v.getFramesByName(name);
			if (f.length) rst = rst.concat(f); 
		});

		return rst;
	});


	function create(parent, layout, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/) {
		visibility = visibility || UI.XFrame.Visibility.VISIBILITY_NONE;

		beginUpdateLayoutParam(layout);
		endUpdateLayoutParam();

		setParent(parent);

		setVisibility(visibility);
	}

	function beginUpdateLayoutParam() {
		if (isLayouting()) {
			if (!m_delay_layout_param)
				m_delay_layout_param = me.generateLayoutParam(m_layout_param);
			return m_delay_layout_param;
		} else {
			if (!m_layout_param)
				m_layout_param = me.generateLayoutParam();
			return m_layout_param;
		}
	}

	function endUpdateLayoutParam() {
		// TODO: delay layout part. 

		if (m_parent) m_parent.invalidateLayout();
	}

	function isLayouting() {
		if (m_parent)
			return m_parent.isLayouting();

		return false;
	}

	function invalidateLayout() {

	}


	function generateLayoutParam(copy_from_or_xml_or_null) {
		
		if (!copy_from_or_xml_or_null)
			return new SELF.LayoutParam();

		if (copy_from_or_xml_or_null.instanceOf &&
			copy_from_or_xml_or_null.instanceOf(SELF.LayoutParam)) {
			var copy_from = copy_from_or_xml_or_null;
			return new SELF.LayoutParam(copy_from);			
		}	

		// TODO : XML part
	}

});

$ENUM('UI.XFrame.Visibility', 
[
	'VISIBILITY_NONE',
	'VISIBILITY_HIDE',
	'VISIBILITY_SHOW'
]);

$CLASS('UI.XFrame.LayoutParam', function(me, SELF){


	var public_list = {
		'x' 		: 0,
		'y' 		: 0,
		'width' 	: 0,
		'height'	: 0,
	
		'margin_left'		: 0,
		'margin_top'		: 0,
		'margin_right'		: 0,
		'margin_bottom'		: 0
	};

	$PUBLIC(public_list);


	$CONSTRUCTOR(function(xml_or_layout_param){

		if (!xml_or_layout_param) return;

		if (xml_or_layout_param.instanceOf &&
			xml_or_layout_param.instanceOf(SELF)) {

			var other = xml_or_layout_param;
			if (other.classobj != SELF)
				other = other.$PARENT(SELF.classname);

			$.each(public_list, function(i,v){
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