;

(function(){

	$CLASS('UI.XDock', 
	$EXTENDS(UI.XFrame),
	function(me, SELF){

		$PUBLIC_FUN([

			'create',
			'destroy',

			'onMeasureWidth',
			'onMeasureHeight',
			'onLayout',
		]);

		var m_dock_type = SELF.DockType.DOCK_LEFT2RIGHT;
		var m_align = SELF.DockType.ALIGN_LOW;

		$PUBLIC_FUN_IMPL('create', function(parent, dock_type, align, layout_param, 
			visibility/* = SELF.Visibility.VISIBILITY_NONE*/) {

			me.$PARENT(UI.XFrame).create(parent, layout_param, visibility);

			m_dock_type = dock_type;
			m_align = align;
		});

		$PUBLIC_FUN_IMPL('destroy', function(){
			me.$PARENT(UI.XFrame).destroy();
			m_dock_type = SELF.DockType.DOCK_LEFT2RIGHT;
			m_align = SELF.Align.ALIGN_LOW;
		});

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
			var measured = 0;
			if (m_dock_type == SELF.DockType.DOCK_TOP2BOTTOM ||
				m_dock_type == SELF.DockType.DOCK_BOTTOM2TOP) {
				measured = onMeasureAlignDirection(param, 
					'measureWidth', 'getMeasuredWidth',
					'margin_left', 'margin_right', 'width');
			} else {
				measured = onMeasureLayoutDirection(param, 
					'measureWidth', 'getMeasuredWidth',
					'margin_left', 'margin_right', 'width');
			}
			me.setMeasuredWidth(measured);
		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
			var measured = 0;
			if (m_dock_type == SELF.DockType.DOCK_LEFT2RIGHT ||
				m_dock_type == SELF.DockType.DOCK_RIGHT2LEFT) {
				measured = onMeasureAlignDirection(param, 
					'measureHeight', 'getMeasuredHeight',
					'margin_top', 'margin_bottom', 'height');
			} else {
				measured = onMeasureLayoutDirection(param, 
					'measureHeight', 'getMeasuredHeight',
					'margin_top', 'margin_bottom', 'height');
			}
			me.setMeasuredHeight(measured);
		});

		$PUBLIC_FUN_IMPL('onLayout', function(rc) {

			var direction = 0;
			var current_pos = 0;
			var layout_direction_start = null,
				layout_direction_end = null,
				layout_direction_margin_start = null,
				layout_direction_margin_end = null,
				align_direction_low = null,
				align_direction_high = null,
				get_layout_direction_size_proc = null,
				get_align_direction_size_proc = null,
				align_direction_margin_start = null,
				align_direction_margin_end = null;

			var align_direction_size = 0;

			switch(m_dock_type) {
				case SELF.DockType.DOCK_LEFT2RIGHT:
					direction = 1;
					current_pos = 0;
					layout_direction_start = 'left';
					layout_direction_end = 'right';
					layout_direction_margin_start = 'margin_left';
					layout_direction_margin_end = 'margin_right';
					align_direction_margin_start = 'margin_top';
					align_direction_margin_end = 'margin_bottom';
					align_direction_low = 'top';
					align_direction_high = 'bottom';
					get_layout_direction_size_proc = 'getMeasuredWidth';
					get_align_direction_size_proc = 'getMeasuredHeight';
					align_direction_size = rc.height();
					break;
				case SELF.DockType.DOCK_RIGHT2LEFT:
					direction = -1;
					current_pos = rc.width();
					layout_direction_start = 'right';
					layout_direction_end = 'left';
					layout_direction_margin_start = 'margin_right';
					layout_direction_margin_end = 'margin_left';
					align_direction_margin_start = 'margin_top';
					align_direction_margin_end = 'margin_bottom';
					align_direction_low = 'top';
					align_direction_high = 'bottom';
					get_layout_direction_size_proc = 'getMeasuredWidth';
					get_align_direction_size_proc = 'getMeasuredHeight';
					align_direction_size = rc.height();
					break;
				case SELF.DockType.DOCK_TOP2BOTTOM:
					direction = 1;
					current_pos = 0;
					layout_direction_start = 'top';
					layout_direction_end = 'bottom';
					layout_direction_margin_start = 'margin_top';
					layout_direction_margin_end = 'margin_bottom';
					align_direction_margin_start = 'margin_left';
					align_direction_margin_end = 'margin_right';
					align_direction_low = 'left';
					align_direction_high = 'right';
					get_layout_direction_size_proc = 'getMeasuredHeight';
					get_align_direction_size_proc = 'getMeasuredWidth';
					align_direction_size = rc.width();
					break;
				case SELF.DockType.DOCK_BOTTOM2TOP:
					direction = -1;
					current_pos = rc.height();
					layout_direction_start = 'bottom';
					layout_direction_end = 'top';
					layout_direction_margin_start = 'margin_bottom';
					layout_direction_margin_end = 'margin_top';
					align_direction_margin_start = 'margin_left';
					align_direction_margin_end = 'margin_right';
					align_direction_low = 'left';
					align_direction_high = 'right';
					get_layout_direction_size_proc = 'getMeasuredHeight';
					get_align_direction_size_proc = 'getMeasuredWidth';
					align_direction_size = rc.width();
					break;
			}

			var frame_count = me.getFrameCount();
			for (var i = 0; i < frame_count; i++) {
				var cur = me.getFrameByIndex(i);
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();

				var layout_rect = new UI.Rect();
				var start = layout_rect[layout_direction_start] = 
					current_pos + direction * layout_param[layout_direction_margin_start];
				var end = layout_rect[layout_direction_end] = 
					start + direction * cur[get_layout_direction_size_proc]();
				current_pos = end + direction * layout_param[layout_direction_margin_end]; 

				switch (m_align) {
					case SELF.Align.ALIGN_LOW:
						var low = 
							layout_rect[align_direction_low] = layout_param[align_direction_margin_start];
						layout_rect[align_direction_high] = low + cur[get_align_direction_size_proc]();
						break;
					case SELF.Align.ALIGN_MIDDLE:
						var size = cur[get_align_direction_size_proc]();
						var size_with_margin = size + 
							layout_param[align_direction_margin_start] +
							layout_param[align_direction_margin_end];
						var low = layout_rect[align_direction_low] = Math.floor((align_direction_size - size_with_margin) / 2)
							+ layout_param[align_direction_margin_start];
						layout_rect[align_direction_high] = low + size;
						break;
					case SELF.Align.ALIGN_HIGH:
						var high = layout_rect[align_direction_high] = align_direction_size - 
							layout_param[align_direction_margin_end];
						layout_rect[align_direction_low] = high - cur[get_align_direction_size_proc]();
						break;
				}

				cur.layout(layout_rect);
			}
		});

		function onMeasureAlignDirection(param, 
			child_measure_proc, child_get_measure_proc,
			layout_margin_low, layout_margin_high, layout_param_size) {

			var measured_size = 0;
			var max_size = 0;

			var frame_count = me.getFrameCount();
			for (var i = 0; i < frame_count; i++) {
				var cur = me.getFrameByIndex(i);
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();

				if (layout_param[layout_param_size] ==
					SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT)
					continue;

				var param_for_measure = new SELF.MeasureParam();

				switch (layout_param[layout_param_size]) {
					case SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT:
						if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST ||
							param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT) {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_ATMOST;
							param_for_measure.num = Math.max(0, param.num - 
								layout_param[layout_margin_low] - layout_param[layout_margin_high]);
						} else {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED;
							param_for_measure.num = 0;
						}
						break;
					default:
						param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
						param_for_measure.num = Math.max(0, layout_param[layout_param_size]);
						break;
				}

				cur[child_measure_proc](param_for_measure);

				max_size = Math.max(max_size,
					cur[child_get_measure_proc]() +
					layout_param[layout_margin_low] +
					layout_param[layout_margin_high]);
			}

			switch (param.spec) {
				case SELF.MeasureParam.Spec.MEASURE_EXACT:
					measured_size = param.num;
					break;
				default:
					measured_size = max_size;
					if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
						measured_size = Math.min(measured_size, param.num);
					break;
			}

			for (var i = 0; i < frame_count; i++) {
				var cur = me.getFrameByIndex(i);
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();

				if (layout_param[layout_param_size] !=
					SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT)
					continue;

				var param_for_measure = new SELF.MeasureParam();
				param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
				param_for_measure.num = Math.max(
					0, measured_size 
					- layout_param[layout_margin_low]
					- layout_param[layout_margin_high]); 

				cur[child_measure_proc](param_for_measure);
			}

			return measured_size;
		}

		function onMeasureLayoutDirection(param, 
			child_measure_proc, child_get_measure_proc,
			layout_margin_low, layout_margin_high, layout_param_size) {

			var measured_size = 0;
			var current_pos = 0;

			var frame_count = me.getFrameCount();
			for (var i = 0; i < frame_count; i++) {
				var cur = me.getFrameByIndex(i);
				if (!cur.needLayout())
					continue;
				var layout_param = cur.getLayoutParam();


				var param_for_measure = new SELF.MeasureParam();

				switch (layout_param[layout_param_size]) {
					case SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT:
						if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST ||
							param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT) {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_ATMOST;
							param_for_measure.num = Math.max(0, param.num - current_pos -
								layout_param[layout_margin_low] - layout_param[layout_margin_high]);
						} else {
							param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_UNRESTRICTED;
							param_for_measure.num = 0;
						}
						break;
					case SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT:
						param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
						if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT) {
							param_for_measure.num = max(0, param.num - current_pos -
								layout_param[layout_margin_low] - layout_param[layout_margin_high]);
						} else {
							param_for_measure.num = 0;
						}
						break;
					default:
						param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
						param_for_measure.num = Math.max(0, layout_param[layout_param_size]);
						break;
				}

				cur[child_measure_proc](param_for_measure);

				current_pos = current_pos + cur[child_get_measure_proc]() +
					layout_param[layout_margin_low] + layout_param[layout_margin_high];
			}

			switch (param.spec) {
				case SELF.MeasureParam.Spec.MEASURE_EXACT:
					measured_size = param.num;
					break;
				default:
					measured_size = current_pos;
					if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
						measured_size = Math.min(measured_size, param.num);
					break;
			}

			return measured_size;
		}
	})
	.$STATIC({
		'buildFromXML' : buildFromXML,
	});


	$ENUM('UI.XDock.DockType', [
		'DOCK_LEFT2RIGHT',
		'DOCK_TOP2BOTTOM',
		'DOCK_RIGHT2LEFT',
		'DOCK_BOTTOM2TOP',
	]);

	$ENUM('UI.XDock.Align', [
		'ALIGN_LOW',
		'ALIGN_MIDDLE',
		'ALIGN_HIGH',
	]);


	function buildFromXML(xml_node, parent) {
		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var dock_type = this.DockType.DOCK_LEFT2RIGHT;
		var align_type = this.Align.ALIGN_LOW;

		var dock_type_attr = xml_node.getAttribute('dock_type') || '';
		dock_type_attr = dock_type_attr.toLowerCase();
		if (dock_type_attr == 'left2right')
			dock_type = this.DockType.DOCK_LEFT2RIGHT;
		else if (dock_type_attr == 'right2left')
			dock_type = this.DockType.DOCK_RIGHT2LEFT;
		else if (dock_type_attr == 'top2bottom')
			dock_type = this.DockType.DOCK_TOP2BOTTOM;
		else if (dock_type_attr == 'bottom2top')
			dock_type = this.DockType.DOCK_BOTTOM2TOP;

		var align_type_attr = xml_node.getAttribute('align_type') || '';
		align_type_attr = align_type_attr.toLowerCase();
		if (align_type_attr == 'low')
			align_type = this.Align.ALIGN_LOW;
		else if (align_type_attr == 'middle')
			align_type = this.Align.ALIGN_MIDDLE;
		else if (align_type_attr == 'high')
			align_type = this.Align.ALIGN_HIGH;

		var frame = new this();
		frame.create(parent, dock_type, align_type, layout_param, 
			this.Visibility.VISIBILITY_NONE);

		return frame;
	}

})();

