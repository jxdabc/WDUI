$CLASS('UI.IXNotificationLister', function(me,SELF){

	$PUBLIC_FUN({
		'onNotification' 	: $ABSTRACT,
		'genRemoteRef'		: $ABSTRACT,
		'recycleRemoteRef' 	: $ABSTRACT,
		'destroy' 			: $ABSTRACT
	});

});