;

(function(){

	$CLASS('UI.ResourceMgr', function(){

	
		$PUBLIC({
			'addSearchPath' : addSearchPath,
			'getResourcePath' : getResourcePath
		});

		$CONSTRUCTOR(function(){
			addSearchPath('default_skin');
		});

		var search_path = [];

		function addSearchPath(path) {
			path = trimLastSlash(path);
			for (var i = 0; i < search_path.length; i++)
				if (search_path[i] == path)
					return;
			search_path.push(path);
		}

		function getResourcePath(path, callback) {

			var requests = [];
			for (var i = 0; i < search_path.length; i++) {
				var info = {};
				info.file = search_path[i] + '/' + path;
				info.XHR = $.ajax({
					'url' : info.file;
					'method'
				});

			}

		}

		function trimLastSlash(path) {
			if (path.substr(path.length - 1) == '/')
				return path.substr(0, path.length -1);
			return path;
		}

	})
	.$STATIC({
		'instance' : resourceMgrInstance
	});


	var resource_mgr_instance;
	function resourceMgrInstance() {
		if (!resource_mgr_instance)
			resource_mgr_instance = new UI.ResourceMgr();

		return resource_mgr_instance;
	}

})();



