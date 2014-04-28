
;

$CLASS('UI.XFrameEventMgr', function(me, SELF){

	var m_root_frame = null;
	var m_$position_canvas = null;

	var m_Event_handle_map = null;
	var m_$default_handle_on = null;

	var m_capture_mouse_frame = null;
	var m_focus_frame = null;

	var m_mouse_in_frame_stack = [];

	var m_mouse_enter_message = { id : 'mouseenter'};
	var m_mouse_leave_message = { id : 'mouseleave'};

	$CONSTRUCTOR(function(root_frame, $position_canvas){
		m_root_frame = root_frame;
		m_$position_canvas = $position_canvas;
		fillEventHandleMapAndDefautHandleElement();
		init();
	});

	$PUBLIC_FUN([
		'captureMouse',
		'releaseCaptureMouse',
		'getFocus',
//		'killFocus',
	]);

	$PUBLIC_FUN_IMPL('captureMouse', function(frame){
		if (!frame) return;
		m_capture_mouse_frame = frame;
	});

	$PUBLIC_FUN_IMPL('releaseCaptureMouse', function(frame){
		if (!frame) return;
		if (m_capture_mouse_frame != frame)
			return;

		m_capture_mouse_frame = null;

		// Because we have no way to obtain the mouse position
		// without an event, we think the mouse is out of the screen
		// whenever we release a mouse capture. 
		updateMouseIn(null);
	});

	$PUBLIC_FUN_IMPL('getFocus', function(frame){
		if (!frame) return;
		if (m_focus_frame == frame) return;
		if (m_focus_frame) me.killFocus(m_focus_frame);

		m_focus_frame = frame;

	});


	function init() {

		var type_hash = {};

		$.each(m_Event_handle_map, function(i,v){
			if (type_hash[v.event]) return;
			type_hash[v.event] = true;

			var $capture_on = m_$default_handle_on;
			if (v.$capture_on) $capture_on = v.$capture_on;
			$capture_on.on(v.event + '.XUI', onEvent);
		});
	}

	function fillEventHandleMapAndDefautHandleElement() {
		
		m_Event_handle_map = 
			[
				{'event' : 'mousemove', 'proc' : handleHoverLeaveEvent, 'handle' : false},
				{'event' : 'mousedown', 'proc' : handleHoverLeaveEvent, 'handle' : false},
				{'event' : 'mouseleave', 'proc' : handleHoverLeaveEvent, 'handle' : false},

				{'event' : 'mousedown', 'handle' : false},
				{'event' : 'mouseup', 'handle' : false},
				{'event' : 'dblclick', 'handle' : false},
				{'event' : 'mousemove', 'handle' : false},
				{'event' : 'mousewheel', 'handle' : false},
				{'event' : 'keydown', 'handle' : false},
				{'event' : 'focus', '$capture_on' : $(window), 'handle' : false},
				{'event' : 'blur', '$capture_on' : $(window), 'handle' : false},
			];

		m_$default_handle_on = $(document);
	}

	function onEvent(e) {

		var offset_frame = m_$position_canvas.offset();
		if (typeof e.pageX != 'undefined' &&
			typeof e.pageY != 'undefined')
			e.UI_pt = new UI.Pt(
				e.pageX - offset_frame.left,
				e.pageY - offset_frame.top);

		var type = e.type;
		var handled = false;

		for (var i = 0; i < m_Event_handle_map.length; i++) {
			var c = m_Event_handle_map[i];
			if (c.event != type) continue;

			if (c.proc) {
				var continue_find_handler = c.proc(e);
				handled = e.handled;
				handled = handled || c.handled;
				if (!continue_find_handler || handled)
					break;
			} else {
				handled = c.handle;
				var target = getEventTarget(e);
				if (!target) break;
				handled = handled || dispatchEvent(target, e);
				break;
			}
		};

		if (handled) {
			e.preventDefault();
			e.cancelBubble();
		}
	}

	function handleHoverLeaveEvent(e) {
		switch (e.type)
		{
			case 'mouseleave':
				updateMouseIn(null);
				return false;
			case 'mousedown':
			case 'mousemove':
				var frame_mouse_in = m_capture_mouse_frame || 
					m_root_frame.getTopFrameFromPoint(e.UI_pt);
				updateMouseIn(frame_mouse_in);
				return true;
		}

		return true;
	}

	function getEventTarget(e) {
		var target = null;

		switch (e.type) {
			case 'mousedown':
			case 'mouseup':
			case 'dblclick':
			case 'mousemove':
				if (m_capture_mouse_frame)
					return m_capture_mouse_frame;
				else
					return m_root_frame.getTopFrameFromPoint(e.UI_pt);
				break;

			default:
			break;
		}

		return m_focus_frame;
	}

	function dispatchEvent(target, e) {
		while (target) {
			var msg4frame = prepareMessageForFrame(target, e);
			if (target.$DISPATCH_MESSAGE('EVENT', msg4frame))
				return true;
			if (msg4frame.bubbleCanceled) break;
			target = target.getParent();
		}

		return false;
	}

	function prepareMessageForFrame(target, e) {
		var msg4frame = 
		{
			'id' : e.type,
			'extra' : e,
			'bubbleCanceled' : false,
			'cancelBubble' : function(){this.bubbleCanceled = true}
		};
		if (e.UI_pt) msg4frame.UI_pt = e.UI_pt;

		if (!target.needPrepareMsg()) return msg4frame;
		switch (msg4frame.id) {
			case 'mousedown':
			case 'mouseup':
			case 'dblclick':
			case 'mousemove':
				msg4frame.UI_pt = 
					target.otherFrameToThisFrame(m_root_frame, msg4frame.UI_pt);
				break;

			default:
				break;
		}

		return msg4frame;
	}

	function updateMouseIn(frame) {


		var mouse_in_message = {
			id : 'mousein',
			info : {},

		}

		if (!frame)
			while (m_mouse_in_frame_stack.length) {
				var f = m_mouse_in_frame_stack.pop();
				f.$DISPATCH_MESSAGE('EVENT', m_mouse_leave_message);
			}
		else {
			var current_path = [];
			while (frame) {
				current_path.unshift(frame);
				frame = frame.getParent();
			}

			var  i = 0;
			for (; i < current_path.length && i < m_mouse_in_frame_stack.length; i++) {
				if (current_path[i] != m_mouse_in_frame_stack[i])
					break;
			}

			while (i < m_mouse_in_frame_stack.length) {
				var f = m_mouse_in_frame_stack.pop();
				f.$DISPATCH_MESSAGE('EVENT', m_mouse_leave_message);
			}

			while (i < current_path.length) {
				var f = current_path[i];
				f.$DISPATCH_MESSAGE('EVENT', m_mouse_enter_message);
				m_mouse_in_frame_stack.push(f);
				i++;
			}
		}


	}

});