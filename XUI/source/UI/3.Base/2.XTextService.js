;

$CLASS('UI.XTextService', 
$EXTENDS(UI.XEasyNotificationThrower),
function(me, SELF){

	$PUBLIC_FUN([
		'activate',
		'deactivate',
		'position',

		'setOperationSection',

		'setPositiveDiv',
	]);

	$CONSTRUCTOR(function(){
		m_$input = $('<input type="text">');

		m_$input.css({
			'opacity' 	: '0',
			'position' 	: 'absolute',
			'z-index' 	: '-8',
			'width' 	: '1px',
		});

		m_$input.on('keydown', checkUpdate);
		m_$input.on('keyup', checkUpdate);
		m_$input.on('focus', onFocus);
		m_$input.on('blur', onBlur);
	});

	var m_$input;

	$PUBLIC_FUN_IMPL('activate', function(){
		m_$input[0].focus();
	});

	$PUBLIC_FUN_IMPL('deactivate', function(){
		m_$input[0].blur();
	});

	$PUBLIC_FUN_IMPL('position', function(x,y){
		m_$input.css({
			'left'  : x + 'px',
			'top'   : y + 'px',
		});	
	});

	$PUBLIC_FUN_IMPL('setOperationSection', function(start, end, direction) {

		if (typeof end == 'undefined') end = start;
		direction = direction || 'forward';

		var input = m_$input[0];

		if (input.selectionStart == start &&
			input.selectionEnd == end &&
			input.selectionDirection == direction)
			return;

		input.selectionStart = start;
		input.selectionEnd = end;
		input.selectionDirection = direction;
		
		checkUpdate();
	});

	$PUBLIC_FUN_IMPL('setPositiveDiv', function (position_div){
		if (position_div) m_$input.appendTo($(position_div));
		else m_$input.detach();
	});

	var m_text = '';
	var m_cursor_pos = 0;
	var m_selection_start = 0;
	var m_selection_end = 0;

	function checkUpdate(e) {
		checkTextUpdate();
		checkCursorPosUpdate();
		checkSelectionUpdate();
	}

	function checkTextUpdate() {
		var text = m_$input.val();
		if (text != m_text) {
			m_text = text;
			me.throwNotification(
			{
				'id' : SELF.NOTIFICATION.NOTIFICATION_TEXT_CHANGED,
				'text' : text,
			});
		}
	}

	function checkCursorPosUpdate() {
		var input = m_$input[0];
		var pos = input.selectionDirection == 'forward' ?
			input.selectionEnd : input.selectionStart;
		if (pos != m_cursor_pos) {
			m_cursor_pos = pos;
			me.throwNotification(
			{
				'id' : SELF.NOTIFICATION.NOTIFICATION_CURSOR_POS_CHANGED,
				'pos' : pos,
			});
		}

	}

	function checkSelectionUpdate() {
		var input = m_$input[0];
		var selection_start = input.selectionStart;
		var selection_end = input.selectionEnd;
		if (selection_end - selection_start == 0)
			selection_start = selection_end = 0;

		if (selection_start != m_selection_start ||
			selection_end != m_selection_end) {
			m_selection_start = selection_start;
			m_selection_end = selection_end;
			me.throwNotification(
			{
				'id' : SELF.NOTIFICATION.NOTIFICATION_SELECTION_CHANGED,
				'start' : m_selection_start,
				'end' : m_selection_end,
			});
		}
	}

	function onFocus() {
		console.log('activated');
		me.throwNotification(
		{
			'id' : SELF.NOTIFICATION.NOTIFICATION_ACTIVATED,
			'start' : m_selection_start,
			'end' : m_selection_end,
		});
	}

	function onBlur() {
		console.log('deactivated');
		me.throwNotification(
		{
			'id' : SELF.NOTIFICATION.NOTIFICATION_DEACTIVATED,
			'start' : m_selection_start,
			'end' : m_selection_end,
		});
	}

});


$ENUM('UI.XTextService.NOTIFICATION', [
	'NOTIFICATION_TEXT_CHANGED',
	'NOTIFICATION_CURSOR_POS_CHANGED',
	'NOTIFICATION_SELECTION_CHANGED',
	'NOTIFICATION_ACTIVATED',
	'NOTIFICATION_DEACTIVATED',
]);