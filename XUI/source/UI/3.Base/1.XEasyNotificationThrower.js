$CLASS('UI.XEasyNotificationThrower', 
function(me, SELF){
	
	$PUBLIC_FUN([
		'addNotificationListener',
		'removeNofiticationListener',
		'throwNotification',
		'clearNotificationListener',
	]);

	var m_notification_listener = [];

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

		notification.src = me.$THIS;

		for (var i = 0; i < m_notification_listener.length;/* no i++ */)
			if (!m_notification_listener[i].obj) m_notification_listener.splice(i,1);
			else i++;

		var notification_listeners = copyArray(m_notification_listener);
		for (var i = 0; i < notification_listeners.length; i++) {
			var r = notification_listeners[i];
			r.obj.onNotification(notification);
		}
	});

	$PUBLIC_FUN_IMPL('clearNotificationListener', function(){
		m_notification_listener = [];
	});

	function copyArray(arr) {
		var new_arr = [];
		for (var i = 0; i < arr.length; i++)
			new_arr.push(arr[i]);
		return new_arr;
	}

});