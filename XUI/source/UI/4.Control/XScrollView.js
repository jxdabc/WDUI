;

$CLASS('UI.XScrollView',
$EXTENDS(UI.XFrame),
function(me, SELF) {

	$PUBLIC_FUN([
		'onMeasureWidth',
		'onMeasureHeight',

		'onLayout',

		'destroy', 
	]);

	var m_max_x = 0;
	var m_max_y = 0;

	$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
		var measured_width = 
			onMeasureLayoutDirection(param, 
				'measureWidth', 'getMeasuredWidth', 'x', 'width', 'margin_right');
		me.setMeasuredWidth(measured_width);
	});

	$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
		var measured_height =
			onMeasureLayoutDirection(param,
				'measureHeight', 'getMeasuredHeight', 'y', 'height', 'margin_bottom');
		me.setMeasuredHeight(measured_height);
	});

	$PUBLIC_FUN_IMPL('onLayout', function(param){

		var max_x = 0, max_y = 0;

		var frame_count = me.getFrameCount();
		for (var i = 0; i < frame_count; i++) {
			var cur = me.getFrameByIndex(i);
			var layout_param = cur.getLayoutParam();
			if (cur.getVisibility() == 
				SELF.Visibility.VISIBILITY_NONE)
				continue;

			var rect = new UI.Rect(layout_param.x, layout_param.y,
				layout_param.x + cur.getMeasuredWidth(),
				layout_param.y + cur.getMeasuredHeight());

			max_x = Math.max(max_x, rect.right);
			max_y = Math.max(max_y, rect.bottom);

			cur.layout(rect);
		}

		handleMaxXY(max_x, max_y);
	});

	$PUBLIC_FUN_IMPL('destroy', function(){
		me.$PARENT(UI.XFrame).destroy();
		m_max_x = m_max_y = 0;
	});

	function onMeasureLayoutDirection(param, child_measure_proc, child_get_measured_proc,
			layout_param_pos, layout_param_size, layout_margin_end) {

		var measured = 0;
		if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT)
			measured = param.num;

		var frame_count = me.getFrameCount();
		for (var i = 0; i < frame_count; i++) {
			var cur = me.getFrameByIndex(i);

			var layout_param = cur.getLayoutParam();

			if (cur.getVisibility() == 
				SELF.Visibility.VISIBILITY_NONE)
				continue;

			var param_for_measure = new SELF.MeasureParam();

			switch (layout_param[layout_param_size]) {
				case SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT:
					param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED;
					param_for_measure.num = 0;
					break;
				case SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT:
					param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
					param_for_measure.num = max(0, 
						measured - layout_param[layout_param_pos] - layout_param[layout_margin_end]);
					break;
				default:
					param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
					param_for_measure.num = Math.max(0, layout_param[layout_param_size]);
					break;
			}

			cur[child_measure_proc](param_for_measure);
		}

		return measured;
	}

	function handleMaxXY(max_x, max_y) {
		if (m_max_x == max_x &&
			m_max_y == max_y)
			return;

		var old = {max_x: m_max_x, max_y: m_max_y};
		m_max_x = max_x;
		m_max_y = max_y;

		me.throwNotification(
			{
				'id' : SELF.NOTIFICATION.NOTIFICAITON_BOUND_CHANGED,
				new : {
					'max_x' : m_max_x,
					'max_y' : m_max_y,
				},
				old : old
			});
	}
});

$ENUM('UI.XScrollView.NOTIFICATION', [
	'NOTIFICAITON_BOUND_CHANGED',
]);