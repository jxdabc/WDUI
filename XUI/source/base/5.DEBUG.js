;

(function(global){

	var obj_profile_snapshot = {};

	global.snapObjProfile = function () {
		obj_profile_snapshot = {};
		for (var k in global.$OBJPROFILE)
			obj_profile_snapshot[k] = global.$OBJPROFILE[k];
	}

	global.compareObjProfile = function() {

		var diff = {};

		for (var k in global.$OBJPROFILE) {
			var delta = global.$OBJPROFILE[k] 
				- (obj_profile_snapshot[k] || 0);
			if (delta) 
				diff[k] = delta;
		}

		return diff;
	}


})(window);