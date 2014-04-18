$CLASS('UI.XWindow', 
$EXTENDS(UI.XFrame),
function (me, SELF) {

	$PUBLIC_FUN([
		'create',

		'endUpdateLayoutParam',
		'invalidateLayout',
		'isLayouting',

		'setRect',

		'setVisibility'
	]);

	$MESSAGE_MAP('EVENT', 
	[
		$MAP(SELF.EVENT_ID.EVENT_X_LAYOUT, 'onXLayout'),
	]);

	var $window = $(window);

	var $window_container = null;
	var $window_canvas = null;

	var m_layout_scheduled = false;
	var m_is_layouting = false;

	$PUBLIC_FUN_IMPL('create', function(container, layout_param, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/){

		visibility = visibility || SELF.Visibility.VISIBILITY_NONE;

		$window_container = $(container);
		$window_container.css('position', 'relative');

		$window_canvas = $('<canvas></canvas>');
		$window_canvas.css('z-index', SELF.Z_CANVAS_LAYER + '');
		$window_canvas.css('position', 'absolute');
		$window_canvas.css({'width' : '0', 'height' : '0'});
		$window_canvas.css('display', 'none');
		$window_canvas.appendTo($window_container);

		me.$PARENT(UI.XFrame).create(null, layout_param, visibility);
	});


	$PUBLIC_FUN_IMPL('setRect', function(new_rect){
		var old = me.getRect();

		if (me.getRect().equals(new_rect))
			return;

		$window_canvas.css({
			'left' 		: new_rect.left,
			'top'		: new_rect.top,
			'width'  	: new_rect.width(),
			'height' 	: new_rect.height()
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
				$window_canvas.css('display', 'none');
				break;
			case SELF.Visibility.VISIBILITY_HIDE:
				$window_canvas.css('display', 'block');
				$window_canvas.css('visibility', 'hidden');
				break;
			case SELF.Visibility.VISIBILITY_SHOW:
				$window_canvas.css('display', 'block');
				$window_canvas.css('visibility', 'visible');
				break;
		}
		
		me.$PARENT(UI.XFrame).setVisibility(visibility);
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
				param_for_measure.num = $window_container[v]();
			default: 
				param_for_measure.spec = SELF.MeasureParam.Spec.MEASURE_EXACT;
				param_for_measure.num = 
					layout_param[v] ==
						SELF.LayoutParam.SpecialMetrics.METRIC_REACH_PARENT ?
							$window_container[v]() - layout_param[map_pos[v]] - layout_param[map_margin[v]] : 
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

})
.$STATIC({
	'Z_CANVAS_LAYER' : 100,
});

$ENUM('UI.XWindow.EVENT_ID',
[
	'EVENT_X_LAYOUT',
]);