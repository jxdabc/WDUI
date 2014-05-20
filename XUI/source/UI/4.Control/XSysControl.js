;

$CLASS('UI.XSysControl', 
$EXTENDS(UI.XFrame),
function(me, SELF) {


	$PUBLIC_FUN([
		'create',
		'destroy',

		'setHTML',

		'setRect',
		'setVisibility',

		'insertFrame',
		'removeFrame',

		'setBackground',

		'invalidateRect',
		'paintUI',

		'onDetachedFromParent',
		'onAttachedToParent',

		'handleXMLChildNode',
	]);

	$MESSAGE_MAP('NOTIFICATION', 
	[
		$MAP(UI.XFrame.NOTIFICATION.NOTIFICAITON_FRAME_RECT_CHANGED, 'onAncestorRectChanged'),
		$MAP(UI.XFrame.NOTIFICATION.NOTIFICATION_FRAME_ATTACHED_TO_PARENT, 'onOneAncestorAttachedToParent'),
		$MAP(UI.XFrame.NOTIFICATION.NOTIFICATION_FRAME_DETACHED_FROM_PARENT, 'onOneAncestorDetachedFromParent'),
		$MAP(UI.XFrame.NOTIFICATION.NOTIFICATION_FRAME_VISIBILITY_CHANGED, 'onAncestorShowHide'),
		$CHAIN(UI.XFrame),
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(SELF.EVENT_ID.EVENT_UPDATE_POSITION, 'onUpdatePosition'),
		$CHAIN(UI.XFrame),
	]);


	var m_$container = null;
	var m_update_position_scheduled = false;


	$PUBLIC_FUN_IMPL('create', 
		function(parent, layout, visibility/* = SELF.Visibility.VISIBILITY_NONE*/){

		m_$container = $('<div />');
		m_$container.css({
			'position' 	: 'absolute',
			'z-index' 	: '1024',
			'overflow' 	: 'hidden',
			'width' 	: '0',
			'height' 	: '0',

//			'border' 	: '1px solid red',
		});

		me.$PARENT(UI.XFrame).create(parent, layout, visibility);
	});

	$PUBLIC_FUN_IMPL('destroy', function(){

		me.$PARENT(UI.XFrame).destroy();

		m_$container.remove();
		m_$container = null;
	});

	$PUBLIC_FUN_IMPL('setHTML', function(html){
		m_$container.html(html);
	});


	$PUBLIC_FUN_IMPL('setRect', function(rc) {

		if (me.getRect().equals(rc)) return;

		me.$PARENT(UI.XFrame).setRect(rc);

		if (!m_update_position_scheduled) {
			UI.XEventService.instance().
				postFrameEvent(me.$THIS, 
					{'id' : SELF.EVENT_ID.EVENT_UPDATE_POSITION});
			m_update_position_scheduled = true;
		}

	});


	$PUBLIC_FUN_IMPL('removeFrame', function(index_or_frame){
		if (typeof index_or_frame != 'number') {
			var frame = index_or_frame;
			me.$PARENT(UI.XFrame).removeFrame(frame);
			return;
		}

		return;
	});

	$PUBLIC_FUN_IMPL('insertFrame', function(frame, index){
		return;
	});

	$PUBLIC_FUN_IMPL('setVisibility', function(visibility) {

		if (me.getVisibility() == visibility)
			return;

		me.$PARENT(UI.XFrame).setVisibility(visibility);

		updateShowState();
	});

	$PUBLIC_FUN_IMPL('setBackground', function(bg){
		return bg;
	});

	$PUBLIC_FUN_IMPL('invalidateRect', function(rc){
		if (typeof rc == 'undefined') {
			me.$PARENT(UI.XFrame).invalidateRect(rc);
			return;
		}

		return;
	});

	$PUBLIC_FUN_IMPL('paintUI', function(rc){
		return;
	});

	$PUBLIC_FUN_IMPL('onAttachedToParent', function(parent){
		me.$PARENT(UI.XFrame).onAttachedToParent(parent);

		while (parent) {
			parent.addNotificationListener(me.$THIS);
			parent = parent.getParent();
		}

		var container = me.getContainer();
		if (container)
			m_$container.appendTo($(container));

		updateSysControlPosition();

		updateShowState();
	});

	$PUBLIC_FUN_IMPL('onDetachedFromParent', function(){
		var current_parent = me.getParent();

		while (current_parent) {
			current_parent.removeNofiticationListener(me.$THIS);
			current_parent = current_parent.getParent();
		}

		me.$PARENT(UI.XFrame).onDetachedFromParent();

		m_$container.detach();

		updateSysControlPosition();

		updateShowState();
	});

	$PUBLIC_FUN_IMPL('handleXMLChildNode', function(xml_node){
		m_$container.append(xml_node.textContent);
	});

	$MESSAGE_HANDLER('onOneAncestorAttachedToParent', function(n){
		if (!isAncestor(n.src))
			return;

		var parent_attached_to = n.parent;

		while (parent_attached_to) {
			parent_attached_to.addNotificationListener(me.$THIS);
			parent_attached_to = parent_attached_to.getParent();
		}

		var container = me.getContainer();
		if (container)
			m_$container.appendTo($(container));

		updateSysControlPosition();

		updateShowState();
	});

	$MESSAGE_HANDLER('onOneAncestorDetachedFromParent', function(n){
		if (!isAncestor(n.src))
			return;

		var parent_detached_from = n.parent;

		while (parent_detached_from) {
			parent_detached_from.removeNofiticationListener(me.$THIS);
			parent_detached_from = parent_detached_from.getParent();
		}

		m_$container.detach();

		updateSysControlPosition();

		updateShowState();
	});

	$MESSAGE_HANDLER('onAncestorShowHide', function(n){
		if (!isAncestor(n.src))
			return;

		if (n.new != SELF.Visibility.VISIBILITY_SHOW)
			m_$container.hide();
		else
			updateShowState();
	});

	$MESSAGE_HANDLER('onAncestorRectChanged', function(n){
		if (!isAncestor(n.src))
			return;

		if (!m_update_position_scheduled) {
			UI.XEventService.instance().
				postFrameEvent(me.$THIS, 
					{'id' : SELF.EVENT_ID.EVENT_UPDATE_POSITION});
			m_update_position_scheduled = true;
		}

	});

	$MESSAGE_HANDLER('onUpdatePosition', function(e){
		if (!m_update_position_scheduled)
			return;
		m_update_position_scheduled = false;
		updateSysControlPosition();
	});


	function updateSysControlPosition() {

		var rc = me.getRect();
		rc = me.toContainer(me.parentToChild(rc));

		m_$container.css({
			'left' 		: rc.left + 'px',
			'top' 		: rc.top + 'px',
			'width' 	: rc.width() + 'px',
			'height' 	: rc.height() + 'px',
		});
	}

	function updateShowState() {

		var parent_frame_show = false;
		var p = me.getParent();

		if (p && p.getContainer()) {
			parent_frame_show = 
				p.getVisibility() == SELF.Visibility.VISIBILITY_SHOW;
			p = p.getParent();
		}

		while (parent_frame_show && p) {
			if (p.getVisibility() != SELF.Visibility.VISIBILITY_SHOW)
				parent_frame_show = false;
			p = p.getParent();
		}

		var show = parent_frame_show && 
			me.getVisibility() == SELF.Visibility.VISIBILITY_SHOW;

		m_$container[show ? 'show' : 'hide']();
	}

	function isAncestor(frame) {
		var p = me.getParent();
		while (p) {
			if (p == frame)
				return true;
			p = p.getParent();
		}

		return false;
	}



});

$ENUM('UI.XSysControl.EVENT_ID', [
	'EVENT_UPDATE_POSITION',
]);