;

$CLASS('UI.XEdit',
$EXTENDS(UI.XFrame),
function(me, SELF) {

	$PUBLIC_FUN([
		'create',
		'destory',

		'paintBackground',
		'paintForeground',

		'onAttachedToParent',
		'onDetachedFromParent',
	]);

	$MESSAGE_MAP('NOTIFICATION', 
	[
		$MAP(UI.XTextService.NOTIFICATION.NOTIFICATION_TEXT_CHANGED, 'onTextChanged'),
		$MAP(UI.XTextService.NOTIFICATION.NOTIFICATION_CURSOR_POS_CHANGED, 'onCursorPosChanged'),
		$MAP(UI.XTextService.NOTIFICATION.NOTIFICATION_SELECTION_CHANGED, 'onSelectionChanged'),
		$MAP(UI.XTextService.NOTIFICATION.NOTIFICATION_ACTIVATED, 'onServiceActivated'),
		$MAP(UI.XTextService.NOTIFICATION.NOTIFICATION_DEACTIVATED, 'onServiceDeactived'),
		$CHAIN(UI.XFrame),
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(UI.EVENT_ID.EVENT_TIMER, 'onTimer'),
		$MAP('mousedown', 'onMouseDown'),
		$MAP('mouseup', 'onMouseUp'),
		$MAP('mousemove', 'onMouseMove'),
		$MAP('mouseleave', 'onMouseLeave'),
		$MAP('mouseenter', 'onMouseEnter'),
		$CHAIN(UI.XFrame),
	]);

	var m_text_service = null;

	var m_cursor_pos = 0;
	var m_cursor_visible = true;
	var m_cursor_timer = null;

	var m_auto_scroll_timer = null;
	var m_auto_scroll_last_time = null;
	var m_auto_scroll_accumulated_dis = 0;

	var m_selection_start = 0;
	var m_selection_end = 0;

	var m_scroll = 0;

	var m_text = null;
	var m_text_reversed = null;
	var m_text_width_array = [];

	var m_active = false;

	var m_mousedown = false;
	var m_mouse_down_pos = 0;
	var m_mouse_move_pt = 0;

	var CURSOR_WIDTH = 1;
	var CURSOR_BLINK_INTERVAL = 500;
	var AUTO_SCROLL_CHECK_INTERVAL = 10;
	var AUTO_SCROLL_RATE = 1 / 500; // step/ms

	$PUBLIC_FUN_IMPL('create', function(parent, layout, 
		visibility /* = SELF.Visibility.VISIBILITY_NONE*/) {

		m_text_service = new UI.XTextService(me.getContainer);
		m_text_service.addNotificationListener(me.$THIS);
		m_text = new UI.XTextCanvasText();
		m_text.setAlignment(UI.XTextCanvasText.Align.ALIGN_START, UI.XTextCanvasText.Align.ALIGN_MIDDLE);
		m_text_reversed = new UI.XTextCanvasText();
		m_text_reversed.setAlignment(UI.XTextCanvasText.Align.ALIGN_START, UI.XTextCanvasText.Align.ALIGN_MIDDLE);
		m_text_reversed.setColor('#FFF');

		me.$PARENT(UI.XFrame).create(parent, layout, visibility);
	});


	$PUBLIC_FUN_IMPL('destory', function(){
		me.$PARENT(UI.XFrame).destory();

		m_text_service.removeNofiticationListener(me.$THIS);
		m_text_service = null;
		m_text = null;
		m_text_reversed = null;

		if (m_cursor_timer !== null) {
			UI.XEventService.instance().killTimer(m_cursor_timer);
			m_cursor_timer = null;
		}

		if (m_auto_scroll_timer !== null) {
			UI.XEventService.instance().killTimer(m_auto_scroll_timer);
			m_auto_scroll_timer = null;
		}
	});

	$PUBLIC_FUN_IMPL('paintBackground', function(ctx, rect){

		ctx.save();

		ctx.fillStyle = '#FFF';
		ctx.fillRect(rect.left, rect.top, rect.width(), rect.height());


		ctx.restore();
	});

	$PUBLIC_FUN_IMPL('paintForeground', function(ctx, rc){

		var rect = new UI.Rect(rc);

		ctx.save();

		ctx.translate(-m_scroll, 0);
		rect.offset(m_scroll, 0);

		m_text.draw(ctx, rect);

		if (m_selection_end - m_selection_start) {
			var selection_rect = new UI.Rect(getWidthFromPos(m_selection_start), 0,
				getWidthFromPos(m_selection_end), me.getRect().height());
			var selection_rect_real
				= rect.intersect(selection_rect);
			if (!selection_rect_real.isEmpty()) {
				
				ctx.fillStyle = m_active ? 'rgb(50, 142, 253)' : 'rgb(199, 199, 199)';
				var text_drawer =  m_active ? m_text_reversed : m_text;

				ctx.fillRect(selection_rect_real.left, selection_rect_real.top,
					selection_rect_real.width(), selection_rect_real.height());
				text_drawer.draw(ctx, selection_rect_real);
			}
		}

		if (m_active && m_cursor_visible) {
			var cursor_rect_real 
				= rect.intersect(getCursorRect());
			if (!cursor_rect_real.isEmpty()) {
				ctx.fillStyle = '#000';
				ctx.fillRect(cursor_rect_real.left, cursor_rect_real.top,
						cursor_rect_real.width(), cursor_rect_real.height());
			}
		}

		ctx.restore();

		me.$PARENT(UI.XFrame).paintForeground();

	});



	$PUBLIC_FUN_IMPL('onAttachedToParent', function(parent){
		me.$PARENT(UI.XFrame).onAttachedToParent(parent);
		m_text_service.setPositiveDiv(me.getContainer());
	});

	$PUBLIC_FUN_IMPL('onDetachedFromParent', function(){
		me.$PARENT(UI.XFrame).onDetachedFromParent();
		m_text_service.setPositiveDiv(null);
	});

	$MESSAGE_HANDLER('onServiceActivated', function(n){
		if (n.src != m_text_service) return;

		updateServicePostion();

		m_cursor_timer = 
			UI.XEventService.instance().setTimer(me.$THIS, CURSOR_BLINK_INTERVAL);

		m_active = true;

		return true;
	});

	$MESSAGE_HANDLER('onServiceDeactived', function(n){
		if (n.src != m_text_service) return;

		m_active = false;

		UI.XEventService.instance().killTimer(m_cursor_timer);
		m_cursor_timer = null;

		// me.invalidateRect(getCursorRenderRect());

		// optimise here. 
		me.invalidateRect();

		return true;
	});

	

	$MESSAGE_HANDLER('onMouseDown', function(e){

		m_text_service.activate();

		var x = e.UI_pt.x + m_scroll;
		var pos = getPosFromWidth(x);
		m_mouse_down_pos = pos;

		if (pos != m_cursor_pos)
			m_text_service.setOperationSection(pos);

		m_auto_scroll_timer = 
			UI.XEventService.instance().setTimer(me.$THIS, AUTO_SCROLL_CHECK_INTERVAL);

		me.getEventManager().captureMouse(me.$THIS);
		m_mousedown = true;

		return true;
	});

	$MESSAGE_HANDLER('onMouseUp', function(e) {

		m_mouse_down_pos = 0;

		UI.XEventService.instance().killTimer(m_auto_scroll_timer);
		m_auto_scroll_timer = null;
		m_auto_scroll_last_time = null;
		m_auto_scroll_accumulated_dis = 0;

		me.getEventManager().releaseCaptureMouse(me.$THIS);
		m_mousedown = false;

		return true;
	});

	$MESSAGE_HANDLER('onMouseMove', function(e){

		if (!m_mousedown) return;
		
		m_mouse_move_pt = e.UI_pt;

		updateOperationSection();
	});

	$MESSAGE_HANDLER('onMouseLeave', function(e){
		me.setCursor('auto');
	});

	$MESSAGE_HANDLER('onMouseEnter', function(e){
		me.setCursor('text');
	});

	$MESSAGE_HANDLER('onTimer', function(e){

		if (e.timer_id == m_cursor_timer)
			return onCursorTimer();
		if (e.timer_id == m_auto_scroll_timer)
			return onAutoScrollTimer();

		return false;
	
	});

	$MESSAGE_HANDLER('onTextChanged', function(n){

		var old_text = m_text.getText();
		var old_text_width_arr = m_text_width_array;

		var new_text = n.text;
		m_text.setText(new_text);
		m_text_reversed.setText(new_text);
		m_text_width_array = [];
		for (var i = 0; i < old_text.length && i < new_text.length; i++)
			if (old_text[i] == new_text[i]) m_text_width_array[i] = old_text_width_arr[i];
			else break;
		
		m_text.setDstRect(new UI.Rect(0, 0, 
			getWidthFromPos(new_text.length), me.getRect().height()));
		m_text_reversed.setDstRect(new UI.Rect(0, 0, 
			getWidthFromPos(new_text.length), me.getRect().height()));


		updateScroll();

		// TODO: optimise here. 
		me.invalidateRect();
	});

	$MESSAGE_HANDLER('onCursorPosChanged', function(n){
		updateCursor(n.pos);
	});

	$MESSAGE_HANDLER('onSelectionChanged', function(n){
		m_selection_start = n.start;
		m_selection_end = n.end;

		// TODO: optimise here.
		me.invalidateRect();
	});

	function onCursorTimer() {
		m_cursor_visible = !m_cursor_visible;
		me.invalidateRect(getCursorRenderRect());
		return true;
	}

	function onAutoScrollTimer() {

		if (m_auto_scroll_last_time == null) {
			m_auto_scroll_last_time = new Date().getTime();
			return;
		}

		var self_width = me.getRect().width();

		var now = new Date().getTime();
		var esc = now - m_auto_scroll_last_time;
		var step = 0;

		if (m_mouse_move_pt.x >= self_width)
			step = m_mouse_move_pt.x - self_width + 1;
		else if (m_mouse_move_pt.x < 0)
			step = m_mouse_move_pt.x;

		m_auto_scroll_accumulated_dis 
			+= AUTO_SCROLL_RATE * esc * step;

		var integer_dis = Math.realFloor(m_auto_scroll_accumulated_dis);
		if (integer_dis) {
			scrollBy(integer_dis);
			m_auto_scroll_accumulated_dis -= integer_dis;
		}
			
		m_auto_scroll_last_time = now;

		return true;
	}

	function scrollBy(dis) {

		var self_width = me.getRect().width();
		var text_width_with_cursor = 
			getWidthFromPos(m_text.getText().length) + CURSOR_WIDTH;

		if (m_scroll + dis < 0) dis = -m_scroll;
		else if (text_width_with_cursor - (m_scroll + dis) < self_width) 
			dis = -m_scroll + Math.max(text_width_with_cursor - self_width, 0);

		if (!dis) return;

		m_scroll += dis;
		me.invalidateRect();

		updateOperationSection();
	}

	function updateCursor(cursor_pos) {

		if (m_cursor_pos == cursor_pos) return;

		var old_cursor_rect = getCursorRenderRect();

		m_cursor_pos = cursor_pos;

		me.invalidateRect(old_cursor_rect);
		me.invalidateRect(getCursorRenderRect());

		updateServicePostion();

		updateScroll();		
	}

	function updateScroll() {

		var self_width = me.getRect().width();
		var text_width_with_cursor = 
			getWidthFromPos(m_text.getText().length) + CURSOR_WIDTH;

		var cursor_render_pos = getWidthFromPos(m_cursor_pos) - m_scroll;
		if (cursor_render_pos < 0)
			m_scroll += cursor_render_pos;
		else if (cursor_render_pos >= self_width)
			m_scroll += cursor_render_pos - self_width + 1;
		else if (text_width_with_cursor - m_scroll < self_width)
			m_scroll = Math.max(text_width_with_cursor - self_width, 0);
		else
			return;

		me.invalidateRect();
		updateServicePostion();
	}

	function updateServicePostion() {
		var pt = me.toContainer(new UI.Pt(0, me.getRect().height()));
		m_text_service.position(pt.x + getWidthFromPos(m_cursor_pos) - m_scroll, pt.y);
	}

	function updateOperationSection() {

		var self_width = me.getRect().width();

		var mouse_move_x = m_mouse_move_pt.x;
		if (mouse_move_x >= self_width)
			mouse_move_x = self_width - 1;
		else if (mouse_move_x < 0)
			mouse_move_x = 0;

		var mouse_move_pos = 
			getPosFromWidth(mouse_move_x + m_scroll);

		var start = Math.min(m_mouse_down_pos, mouse_move_pos);
		var end = Math.max(m_mouse_down_pos, mouse_move_pos);
		var direction = m_mouse_down_pos <= mouse_move_pos ? 'forward' : 'backward';

		m_text_service.setOperationSection(start, end, direction);
	}

	function getCursorRect() {
		var pos_width = getWidthFromPos(m_cursor_pos);
		return new UI.Rect(pos_width, 0, 
			pos_width + CURSOR_WIDTH, me.getRect().height());
	}

	function getCursorRenderRect() {
		return getCursorRect().offset(-m_scroll, 0);
	}

	function getWidthFromPos(pos) {

		var text = m_text.getText();

		if (pos > text.length) pos = text.length;
		else if (pos < 0) pos = 0;
		if (typeof m_text_width_array[pos] != 'undefined')
			return m_text_width_array[pos];

		return m_text_width_array[pos] = m_text
			.measure(UI.XTextCanvasText.UNLIMITED, 0, pos).w;
	}

	function getPosFromWidth(width) {
		
		var text = m_text.getText();

		var l = 0;
		var r = text.length + 1;

		while (l <= r) {

			var m = Math.floor((l + r) / 2);

			var lb,rb;			
			if (m - 1 < 0) lb = Number.NEGATIVE_INFINITY;
			else lb = getWidthFromPos(m - 1);
			if (m > text.length) rb = Number.POSITIVE_INFINITY;
			else rb = getWidthFromPos(m);

			if (width >= lb && width < rb) {
				if (Math.abs(width - lb) > Math.abs(width - rb))
					return m;
				return m - 1;
			}

			if (width < lb) {
				r = m - 1;
			} else {
				l = m + 1;
			}
		}

	}

});