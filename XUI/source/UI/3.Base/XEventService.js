;

(function(){


	$CLASS('UI.XEventService', function(me, SELF){

		$PUBLIC_FUN([
			'postFrameEvent',
			'hasPendingEvent',
			'setTimer',
			'killTimer'
		]);

		var event_to_post = [];

		$PUBLIC_FUN_IMPL('postFrameEvent', function(frame, event){
			event_to_post.push({'frame' : frame, 'event' : event});
			schedulePostEvent();
		});

		$PUBLIC_FUN_IMPL('hasPendingEvent', function(id){
			for (var i = 0; i < event_to_post.length; i++) {
				if (event_to_post[i].event.id == id)
					return true;
			}
			return false;
		});

		$PUBLIC_FUN_IMPL('setTimer', function(frame, elapse) {
			return setInterval(function(){
				frame.$DISPATCH_MESSAGE('EVENT', {'id' : UI.EVENT_ID.EVENT_TIMER});
			}, elapse);
		});

		$PUBLIC_FUN_IMPL('killTimer', function(id) {
			clearInterval(id);
		});

		function schedulePostEvent() {
			setTimeout(function(){
				$.each(event_to_post, function(i,v){
					var frame = v.frame;
					var event = v.event;
					frame.$DISPATCH_MESSAGE('EVENT', event);
				});
				event_to_post = [];
			}, 0);
		}

	})
	.$STATIC({
		'instance' : eventServiceInstance			
	});

	var event_service_instance;
	function eventServiceInstance() {
		if (!event_service_instance)
			event_service_instance = new UI.XEventService();
		return event_service_instance;
	}

})();

