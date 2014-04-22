$CLASS('UI.XWindow', 
$EXTENDS(UI.XFrame),
function (me, SELF) {

	$PUBLIC_FUN([
		'create',

		'endUpdateLayoutParam',
		'invalidateLayout',
		'isLayouting',

		'setRect',

		'setVisibility',

		'invalidateRect',

		'destroy',
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(SELF.EVENT_ID.EVENT_X_LAYOUT, 'onXLayout'),
		$MAP(SELF.EVENT_ID.EVENT_X_UPDATE, 'onXUpdate'),
	]);

	var $window = $(window);

	var m_$window_container = null;
	var m_$window_canvas = null;

	var m_layout_scheduled = false;
	var m_is_layouting = false;

	var m_update_scheduled = false;
	var m_invalidated_rects = [];

	$PUBLIC_FUN_IMPL('create', function(container, layout_param, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/){

		visibility = visibility || SELF.Visibility.VISIBILITY_NONE;

		m_$window_container = $(container);
		m_$window_container.css('position', 'relative');

		m_$window_canvas = $('<canvas></canvas>');
		m_$window_canvas.css('z-index', SELF.Z_CANVAS_LAYER + '');
		m_$window_canvas.css('position', 'absolute');
		m_$window_canvas.prop('width', 0).prop('height', 0);
		m_$window_canvas.css('display', 'none');
		m_$window_canvas.appendTo(m_$window_container);

		me.$PARENT(UI.XFrame).create(null, layout_param, visibility);
	});


	$PUBLIC_FUN_IMPL('setRect', function(new_rect){
		var old = me.getRect();

		if (old.equals(new_rect))
			return;

		m_$window_canvas.css({
			'left' 		: new_rect.left,
			'top'		: new_rect.top,
		});

		me.$PARENT(UI.XFrame).setRect(new_rect);
	});

	$PUBLIC_FUN_IMPL('endUpdateLayoutParam', function(){

		var delayed = 
			me.$PARENT(UI.XFrame).endUpdateLayoutParam();

		if (!delayed) {
			schedule_layout();
		}

		return delayed;
	});

	$PUBLIC_FUN_IMPL('invalidateLayout', function() {

		me.$PARENT(UI.XFrame).invalidateLayout();

		schedule_layout();
	});

	$PUBLIC_FUN_IMPL('isLayouting', function(){
		return m_is_layouting;
	});

	$PUBLIC_FUN_IMPL('setVisibility', function(visibility) {

		if (visibility == me.getVisibility())
			return;

		switch (visibility) {
			case SELF.Visibility.VISIBILITY_NONE:
				m_$window_canvas.css('display', 'none');
				break;
			case SELF.Visibility.VISIBILITY_HIDE:
				m_$window_canvas.css('display', 'block');
				m_$window_canvas.css('visibility', 'hidden');
				break;
			case SELF.Visibility.VISIBILITY_SHOW:
				m_$window_canvas.css('display', 'block');
				m_$window_canvas.css('visibility', 'visible');
				break;
		}
		
		me.$PARENT(UI.XFrame).setVisibility(visibility);
	});

	$PUBLIC_FUN_IMPL('invalidateRect', function(rect) {

		if (typeof rect == 'undefined') {
			me.$PARENT(UI.XFrame).invalidateRect();
			return;
		}

		var rect_frame = me.getRect();

		var rect_real = rect.intersect(
			new UI.Rect(0, 0, rect_frame.width(), rect_frame.height()));
		if (rect_real.isEmpty())
			return;

		m_invalidated_rects.push(rect_real);

		if (m_update_scheduled)
			return;

		m_update_scheduled = true;

		UI.XEventService.instance().postFrameEvent(me.$THIS, 
		{
			'id' : SELF.EVENT_ID.EVENT_X_UPDATE,
		});

	});

	$PUBLIC_FUN_IMPL('destroy', function(){

		me.$PARENT(UI.XFrame).destroy();
		
		m_layout_scheduled = false;
		m_is_layouting = false;
		m_update_scheduled = false;	
		m_invalidated_rects = [];

		m_$window_container = null;
		m_$window_canvas.remove();
		m_$window_canvas = null;

		releaseBuffer();
	});

	$MESSAGE_HANDLER('onXLayout', function(){
		if (!m_layout_scheduled) return;

		m_layout_scheduled = false;

		m_is_layouting = true;

		var layout_param = me.getLayoutParam();

		var map_pos = {
			'width' : 'x',
			'height' : 'y'
		};

		var map_margin = {
			'width' : 'margin_right',
			'height' : 'margin_bottom'
		};

		var listen_page_resize = 
			(layout_param.width.instanceOf && layout_param.width.instanceOf(UI.XFrame.LayoutParam.SpecialMetrics)) ||
			(layout_param.height.instanceOf && layout_param.height.instanceOf(UI.XFrame.LayoutParam.SpecialMetrics));

		if (listen_page_resize) $window.on('resize', onPageResize);
		else $window.off('resize', onPageResize);

		$.each(['width', 'height'], function(i,v){

			var param_for_measure = new SELF.MeasureParam();

			switch(layout_param[v]) {
			case SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT:
				param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_ATMOST;
				param_for_measure.num = m_$window_container[v]();
			default: 
				param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
				param_for_measure.num = 
					layout_param[v] ==
						SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT ?
							m_$window_container[v]() - layout_param[map_pos[v]] - layout_param[map_margin[v]] : 
							layout_param[v];
				break;
			}

			me['measure' + v.upperFirst()](param_for_measure);
		});

		me.layout(
			new UI.Rect(
				new UI.Pt(layout_param.x, layout_param.y),
				new UI.Size(me.getMeasuredWidth(), me.getMeasuredHeight())
			)
		);

		m_is_layouting = false;
	});
	
	$MESSAGE_HANDLER('onXUpdate', function(){
		if (!m_update_scheduled) return;

		var event_service = UI.XEventService.instance();


		if (m_layout_scheduled || 
			event_service.hasPendingEvent(UI.XFrame.EVENT_ID.EVENT_X_DELAY_UDPATE_LAYOUT))
			event_service.postFrameEvent(me.$THIS, 
			{
				'id' : SELF.EVENT_ID.EVENT_X_UPDATE,
			});


		m_update_scheduled = false;

		var area_sum = 0;
		var area_bound = 0;

		if (!m_invalidated_rects.length)
			return;

		var rect_bound = new UI.Rect(m_invalidated_rects[0]);

		for (var i = 0; i < m_invalidated_rects.length; i++) {

			var c = m_invalidated_rects[i];

			if (i != 0) {
				rect_bound.left = Math.min(rect_bound.left, c.left);
				rect_bound.top = Math.min(rect_bound.top, c.top);
				rect_bound.right = Math.max(rect_bound.right, c.right);
				rect_bound.bottom = Math.max(rect_bound.bottom, c.bottom);
			}

			area_sum += c.area();

			console.log('============');
			console.log(c.toString());
		}

		if (!area_sum) {
			m_invalidated_rects = [];
			return;
		}

		var frame_rect = me.getRect();

		var ctx = prepareCanvas();

		ctx.save();
		ctx.beginPath();
		for (var i = 0; i < m_invalidated_rects.length; i++) {
			var c = m_invalidated_rects[i];
			ctx.rect(c.left, c.top, c.width(), c.height());
		}
		ctx.clip();
		if (area_sum < rect_bound.area())
			for (var i = 0; i < m_invalidated_rects.length; i++) {
				var c = m_invalidated_rects[i];
				ctx.clearRect(c.left, c.top, c.width(), c.height());
				me.paintUI(ctx, c);
			}
		else {
			ctx.clearRect(rect_bound.left, rect_bound.top, rect_bound.width(), rect_bound.height());
			me.paintUI(ctx, rect_bound);
		}
		ctx.restore();

		m_invalidated_rects = [];

	});

	function schedule_layout() {
		
		if (m_layout_scheduled) return;

		m_layout_scheduled = true;

		UI.XEventService.instance().postFrameEvent(
			me.$THIS, 
			{
				'id' : SELF.EVENT_ID.EVENT_X_LAYOUT
			});
	}

	function onPageResize() {
		schedule_layout();
	}

	function prepareCanvas() {
		var frame_rect = me.getRect();

		var frame_width = frame_rect.width();
		var frame_height = frame_rect.height();

		if (m_$window_canvas.prop('width') != frame_width)
			m_$window_canvas.prop('width', frame_width);
		if (m_$window_canvas.prop('height') != frame_height)
			m_$window_canvas.prop('height', frame_height);

		return m_$window_canvas[0].getContext('2d');
	}

})
.$STATIC({
	'Z_CANVAS_LAYER' : 100,
});

$ENUM('UI.XWindow.EVENT_ID',
[
	'EVENT_X_LAYOUT',
	'EVENT_X_UPDATE',
]);