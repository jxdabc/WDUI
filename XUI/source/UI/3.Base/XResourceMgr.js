;

(function(){

	$CLASS('UI.XResourceMgr', function(me){

		$PUBLIC_FUN([
			'addSearchPath',
			'getResourcePath'
		]);

		var m_search_path = [];

		$CONSTRUCTOR(function(){
			me.addSearchPath('default_skin_package');
		});
	
		$PUBLIC_FUN_IMPL('addSearchPath', function(path) {
			path = trimLastSlash(path);
			for (var i = 0; i < m_search_path.length; i++)
				if (m_search_path[i] == path)
					return;
			m_search_path.push(path);
		});

		$PUBLIC_FUN_IMPL('getResourcePath', function(path, callback) {
			// callback(path)
			var requests = [];
			for (var i = 0; i < m_search_path.length; i++) {
				var info = {};
				info.file = m_search_path[i] + '/' + path;
				info.XHR = $.ajax({
					'url' : info.file,
					'method' : 'HEAD'
				})
				.done(function(p,q,XHR){ onRequestDone(XHR.index, true) })
				.fail(function(XHR){ onRequestDone(XHR.index, false) });
				info.XHR.index = requests.length;
				requests.push(info);
			}

			function onRequestDone(index, is_found) {

				if (index === null) return;

				var info = requests[index];
				info.done = true;
				info.found = is_found;
				for (var i = 0; i < requests.length; i++)
					if (!requests[i].done || requests[i].found)
						break;
				if (i >= requests.length)
					callback('');
				else if (requests[i].done) {
					callback(requests[i].file);
					for (var i = 0; i < requests.length; i++) {
						var XHR = requests[i].XHR;
						XHR.index = null;
						XHR.abort();
					}		
				}
			}
		});

		function trimLastSlash(path) {
			if (path.substr(path.length - 1) == '/')
				return path.substr(0, path.length -1);
			return path;
		}

	})
	.$STATIC({
		'instance' : resourceMgrInstance,
		'getImage' : getImage
	});


	var resource_mgr_instance;
	function resourceMgrInstance() {
		if (!resource_mgr_instance)
			resource_mgr_instance = new UI.XResourceMgr();

		return resource_mgr_instance;
	}

	function getImage(relative_path) {
		var img = new UI.XImageCanvasImage();
		img.load('@' + relative_path);
		return img;
	}

})();



