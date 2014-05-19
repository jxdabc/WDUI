$CLASS('UI.XEasyNotificationListener', 
$EXTENDS(UI.IXNotificationListener),
function(me,SELF){

	$PUBLIC_FUN([
		'onNotification',
		'genRemoteRef',
		'recycleRemoteRef',
		'destroy',
	]);

	$CONSTRUCTOR(function(callback){
		m_callback = callback;
	});

	var m_callback = null;
	var m_remote_ref = [];
	
	$PUBLIC_FUN_IMPL('onNotification', function(n){
		m_callback(n);
	});

	$PUBLIC_FUN_IMPL('genRemoteRef', function(){
		var ref = {'obj' : me.$THIS};
		m_remote_ref.push(ref);
		return ref;
	});

	$PUBLIC_FUN_IMPL('recycleRemoteRef', function(ref){
		var index = m_remote_ref.indexOf(ref);
		m_remote_ref.splice(index, 1);
	});

	$PUBLIC_FUN_IMPL('destroy', function() {
		$.each(m_remote_ref, function(i,v){
			v.obj = null;
		});
		m_remote_ref = [];
	});
});