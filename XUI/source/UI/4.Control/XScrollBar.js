;

$CLASS('UI.XScrollBar',
$EXTENDS(UI.XFrame),
function(me, SELF){

	$PUBLIC_FUN([
		'create',
		'destroy',

		'setContentLen',
		'setViewLen',
		'setScrollPos',
		'getScrollPos',

		'setBarImage',

		'setVisibility',
		'setRect',
		'paintForeground',
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP('mousedown', 'onMouseDown'),
		$MAP('mouseup', 'onMouseUp'),
		$MAP('mousemove', 'onMouseMove'),
		$MAP('wheel', 'onMouseWheel'),
		$CHAIN(UI.XFrame),
	]);

	var m_type;

	var m_bar_image = null;
	
	var m_content_len = 0;
	var m_view_len = 0;

	var m_pos = 0;
	var m_bar_rect = new UI.Rect();
	var m_visible_state = false;
	var m_mouse_down = false;
	var m_mouse_down_pt = new UI.Pt();
	var m_mouse_down_scroll_pos = 0;


	$PUBLIC_FUN_IMPL('create', function(parent, scroll_type, layout_param, 
		visibility /* = SELF.Visibility.VISIBILITY_NONE */,
		bar_background /* = null */, bar_image /* = null */){

		me.$PARENT(UI.XFrame).create(parent, layout_param, visibility);
		m_type = scroll_type;

		if (!bar_background)
			if (scroll_type == SELF.ScrollType.SCROLL_H)
				bar_background = UI.XResourceMgr.getImage('img/ctrl/scroll_bkgH.9.png');
			else
				bar_background = UI.XResourceMgr.getImage('img/ctrl/scroll_bkg.9.png');

		if (!bar_image)
			if (scroll_type == SELF.ScrollType.SCROLL_H)
				bar_image = UI.XResourceMgr.getImage('img/ctrl/scrollH.9.png');
			else
				bar_image = UI.XResourceMgr.getImage('img/ctrl/scroll.9.png');

		me.setBarImage(bar_image);
		me.setBackground(bar_background);
	});

	$PUBLIC_FUN_IMPL('destroy', function(){

		me.setBarImage(null);

		m_content_len = 0;
		m_view_len = 0;

		m_pos = 0;
		m_bar_rect = new UI.Rect();
		m_visible_state = false;
		m_mouse_down = false;
		m_mouse_down_pt = new UI.Pt();
		m_mouse_down_scroll_pos = 0;

		me.$PARENT(UI.XFrame).destroy();
	});

	$PUBLIC_FUN_IMPL('setBarImage', function(image){
		if (m_bar_image == image) return;
		
		var old = m_bar_image;
		m_bar_image = image;

		if (m_bar_image) {
			m_bar_image.onImageLoaded(onBarImageLoaded);
			m_bar_image.setDstRect(m_bar_rect);
		}
		
		me.invalidateRect(m_bar_rect);

		if (old)
			old.offImageLoaded(onBarImageLoaded);
		
		return old;
	});


	$PUBLIC_FUN_IMPL('setContentLen', function(len){
		if (m_content_len == len) return;

		m_content_len = len;
		updateScrollBar();

	});

	$PUBLIC_FUN_IMPL('setViewLen', function(len){
		if (m_view_len == len) return;

		m_view_len = len;
		updateScrollBar();
	});

	$PUBLIC_FUN_IMPL('setScrollPos', function(pos){

		pos = adjustScrollPos(pos);

		if (m_pos == pos)
			return;

		m_pos = pos;
		updateScrollBar();

		notifyScrollChange();
	});

	$PUBLIC_FUN_IMPL('getScrollPos', function(){
		return m_pos;
	});

	$PUBLIC_FUN_IMPL('paintForeground', function(ctx, rect){
		if (m_bar_image)
			m_bar_image.draw(ctx, rect);

		me.$PARENT(UI.XFrame).paintForeground(ctx, rect);
	});

	$PUBLIC_FUN_IMPL('setVisibility', function(visibility){

		if ((m_visible_state && visibility == SELF.Visibility.VISIBILITY_SHOW) ||
			(!m_visible_state && visibility != SELF.Visibility.VISIBILITY_SHOW))
			return;

		m_visible_state = visibility == SELF.Visibility.VISIBILITY_SHOW;

		updateScrollBar();
	});

	$PUBLIC_FUN_IMPL('setRect', function(rect){
		if (me.getRect().equals(rect))
			return;

		me.$PARENT(UI.XFrame).setRect(rect);

		updateScrollBar();
	});

	$MESSAGE_HANDLER('onMouseDown', function(e){

		var event_manager = me.getEventManager();
		event_manager.captureMouse(me.$THIS);

		var pt = e.UI_pt;

		if (pt.inRect(m_bar_rect)) {
			m_mouse_down_pt = pt;
			m_mouse_down_scroll_pos = m_pos;
			m_mouse_down = true;
		} else {
			var direction = -1;
			if (m_type == SELF.ScrollType.SCROLL_H && 
				pt.x >= m_bar_rect.right)
				direction = 1;
			else if (m_type == SELF.ScrollType.SCROLL_V &&
				pt.y >= m_bar_rect.bottom)
				direction = 1;
			me.setScrollPos(m_pos + direction * m_view_len);
		}

		return true;
	});

	$MESSAGE_HANDLER('onMouseUp', function(){

		var event_manager = me.getEventManager();
		event_manager.releaseCaptureMouse(me.$THIS);

		if (m_mouse_down) m_mouse_down = false;
		event_manager.getFocus(me.$THIS);

		return true;
	});

	$MESSAGE_HANDLER('onMouseMove', function(e){
		if (!m_mouse_down) return;
		var offset = 0;
		var pt = e.UI_pt;
		if (m_type == SELF.ScrollType.SCROLL_H)
			offset = pt.x - m_mouse_down_pt.x;
		else
			offset = pt.y - m_mouse_down_pt.y;

		if (offset != 0) {
			if (m_type == SELF.ScrollType.SCROLL_H)
				me.setScrollPos(m_mouse_down_scroll_pos + 
					Math.floor(offset * m_content_len / me.getRect().width()));
			else
				me.setScrollPos(m_mouse_down_scroll_pos + 
					Math.floor(offset * m_content_len / me.getRect().height()));
		}

	});

	$MESSAGE_HANDLER('onMouseWheel', function(e){
		
		if (m_type == SELF.ScrollType.SCROLL_H) {
			me.setScrollPos(m_pos + e.UI_delta * 10);
		} else {
			me.setScrollPos(m_pos + e.UI_delta * 10);
		}

		return true;
	});

	function notifyScrollChange() {
		me.throwNotification(
				{
					'id' : SELF.NOTIFICATION.NOTIFICATION_SCROLLCHANGED,
				 	'pos' : m_pos,
				});
	}

	function updateScrollBar() {
		var adjust_scroll_pos = adjustScrollPos(m_pos);
		if (adjust_scroll_pos != m_pos) {
			me.setScrollPos(adjust_scroll_pos);
			return;
		}

		if (!m_visible_state) {
			me.$PARENT(UI.XFrame).setVisibility(SELF.Visibility.VISIBILITY_HIDE);
			return;
		}

		if (m_view_len == 0) {
			me.$PARENT(UI.XFrame).setVisibility(SELF.Visibility.VISIBILITY_HIDE);
			return;
		}

		if (m_view_len >= m_content_len) {
			me.$PARENT(UI.XFrame).setVisibility(SELF.Visibility.VISIBILITY_HIDE);
			return;
		}

		var box_size = me.getRect().size();
		var bar_size = new UI.Size(
			m_type == SELF.ScrollType.SCROLL_H ? 
				Math.floor(box_size.w * m_view_len / m_content_len) : box_size.w,
			m_type == SELF.ScrollType.SCROLL_V ?
				Math.floor(box_size.h * m_view_len / m_content_len) : box_size.h);

		var old_bar_rect = new UI.Rect(m_bar_rect);

		if (m_type == SELF.ScrollType.SCROLL_H) {
			m_bar_rect.top = 0;
			m_bar_rect.bottom = bar_size.h;
			m_bar_rect.left = Math.floor(m_pos * box_size.w / m_content_len);
			m_bar_rect.right = m_bar_rect.left + bar_size.w;
		} else {
			m_bar_rect.left = 0;
			m_bar_rect.right = bar_size.w;
			m_bar_rect.top = Math.floor(m_pos * box_size.h / m_content_len);
			m_bar_rect.bottom = m_bar_rect.top + bar_size.h;
		}

		if (m_bar_image) m_bar_image.setDstRect(new UI.Rect(m_bar_rect));

		if (me.getVisibility() == SELF.Visibility.VISIBILITY_SHOW) {
			me.invalidateRect(old_bar_rect);
			me.invalidateRect(m_bar_rect);
		} else {
			me.$PARENT(UI.XFrame).setVisibility(SELF.Visibility.VISIBILITY_SHOW);
		}
	}

	function onBarImageLoaded() {
		me.invalidateRect(m_bar_rect);
	}

	function adjustScrollPos(pos) {
		if (pos > m_content_len - m_view_len)
			pos = m_content_len - m_view_len;
		if (pos < 0)
			pos = 0;

		return pos;
	}

});


$ENUM('UI.XScrollBar.ScrollType',
[
	'SCROLL_H',
	'SCROLL_V',
]);

$ENUM('UI.XScrollBar.NOTIFICATION', 
[
	'NOTIFICATION_SCROLLCHANGED',
]);

