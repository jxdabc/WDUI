;

$CLASS('XFrame', function(me){


	$PUBLIC({
		'setName' 			: setName,
		'getName' 			: getName,
		'getFrameByName'	: getFrameByName,
		'getFrmaesByName'	: getFramesByName
	});


	var m_name = null;
	var m_child_frames = [];

	function setName(name) {
		m_name = name; 
	}

	function getName(name) {
		return m_name;
	}

	function getFrameByName(name) {
		if (m_name == name) return me;

		for (var i = 0; i < m_child_frames.length; i++) {
			var rst = m_child_frames[i].getFrameByName(name);
			if (rst) return rst;
		}

		return null;
	}

	function getFramesByName(name) {
		
		var rst = [];

		if (m_name == name) rst.push(me);
		$.each(m_child_frames, function(i,v){
			var f = v.getFramesByName(name);
			if (f.length) rst = rst.concat(f); 
		});

		return rst;
	}



});