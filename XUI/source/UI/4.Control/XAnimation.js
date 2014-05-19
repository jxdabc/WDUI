;

(function(){

	$CLASS('UI.XAnimation', 
	$EXTENDS(UI.XFrame),
	function(me, SELF) {

		$PUBLIC_FUN([
			'create',
			'destroy',

			'setRect',
			'paintForeground',

			'onMeasureWidth',
			'onMeasureHeight',

			'setFrames',
			'setFrameSwitchInterval',
		]);

		$MESSAGE_MAP('EVENT', 
		[
			$MAP(UI.EVENT_ID.EVENT_TIMER, 'onTimer'),
			$CHAIN(UI.XFrame),
		]);

		var m_frames = null;
		var m_frame_count = 0;
		var m_current_frame = 0;
		var m_interval = 0;
		var m_timer_id = null;

		$PUBLIC_FUN_IMPL('create', function(parent, frames, frame_count, interval, 
			layout_param, visibility/* = SELF.Visibility.VISIBILITY_NONE*/) {

			me.$PARENT(UI.XFrame).create(parent, layout_param, visibility);

			me.setFrames(frames, frame_count);
			me.setFrameSwitchInterval(interval);
		});

		$PUBLIC_FUN_IMPL('destroy', function(){
			me.setFrames(null, 0);
			me.setFrameSwitchInterval(0);

			me.$PARENT(UI.XFrame).destroy();
		});

		$PUBLIC_FUN_IMPL('setRect', function(rect){
			if (rect.equals(me.getRect()))
				return;
			if (m_frames)
				m_frames.setDstRect(new UI.Rect(0,0,rect.width(),rect.height()));
			me.$PARENT(UI.XFrame).setRect(rect);
		});

		$PUBLIC_FUN_IMPL('paintForeground', function(ctx, rect){
			if (m_frames)
				m_frames.draw(ctx, rect);
			me.$PARENT(UI.XFrame).paintForeground(ctx, rect);
		});

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){

			me.$PARENT(UI.XFrame).onMeasureWidth(param);

			if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT ||
				!m_frames || !m_frames.isImageLoaded() || !m_frame_count)
				return;

			var measured = Math.max(me.getMeasuredWidth(), 
				Math.floor(m_frames.getImageWidth() / m_frame_count));
			if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
				measured = Math.min(measured, param.num);

			me.setMeasuredWidth(measured);
		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){

			me.$PARENT(UI.XFrame).onMeasureHeight(param);

			if (param.spec == SELF.MeasureParam.Spec.MEASURE_EXACT ||
				!m_frames || !m_frames.isImageLoaded() || !m_frame_count)
				return;

			var measured = 
				Math.max(me.getMeasuredHeight(), m_frames.getImageHeight());
			if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
				measured = Math.min(measured, param.num);

			me.setMeasuredHeight(measured);
		});

		$PUBLIC_FUN_IMPL('setFrames', function(frames, frame_count){
			if (m_frames == frames) return;

			if (m_frames)
				m_frames.offImageLoaded(onFrameLoaded);
			if (frames)
				frames.onImageLoaded(onFrameLoaded);

			m_frames = frames;
			m_frame_count = frame_count;

			if (m_frames) {
				var rc = me.getRect();
				m_frames.setDstRect(new UI.Rect(0,0,rc.width(),rc.height()));
			}

			m_current_frame = 0;

			if (m_frames && m_frames.isImageLoaded()) {
				me.invalidateLayout();
				switchFrame();
			}

		});

		$PUBLIC_FUN_IMPL('setFrameSwitchInterval', function(interval){
			if (m_interval == interval) return;

			if (m_timer_id !== null) {
				UI.XEventService.instance().killTimer(m_timer_id);
				m_timer_id = null;
			}

			m_interval = interval;

			if (interval)
				m_timer_id = 
					UI.XEventService.instance().setTimer(me.$THIS, interval);
		});

		$MESSAGE_HANDLER('onTimer', function(e){

			if (e.timer_id != m_timer_id)
				return false;

			if (!m_frames || !m_frames.isImageLoaded())
				return true;

			if (!m_frame_count)
				return true;

			m_current_frame = 
				(m_current_frame + 1) % m_frame_count;

			switchFrame();

			return true;
		});

		function switchFrame() {

			if (!m_frames || !m_frames.isImageLoaded())
				return;

			if (!m_frame_count)
				return;

			var frame_width = 
				Math.floor(m_frames.getImageWidth() / m_frame_count);
			var frame_left = frame_width * m_current_frame;
			m_frames.setSrcRect(new UI.Rect(frame_left, 0, 
				frame_left + frame_width, m_frames.getImageHeight()));

			me.invalidateRect();


		}

		function onFrameLoaded() {
			me.invalidateLayout();
			switchFrame();
		}




	}).
	$STATIC({
		'buildFromXML' : buildFromXML,
	});

	function buildFromXML(xml_node, parent) {

		var frames = null;
		var frame_count = 0;
		var interval = 0;

		frames = 
			UI.XFrameXMLFactory.buildImage(xml_node, 'frames', 'frames_type', 'stretch', 'frames_part_');
		if (!frames)
			UI.XFrameXMLFactory
				.reportError('WARNING: Load frames for the XAnimation failed, Create the XAnimation failed. ');

		frame_count = xml_node.getAttribute('frame_count') || 0;
		if (!frame_count)
			UI.XFrameXMLFactory
				.reportError('WARNING: Wrong frame count specified for the XAnimation, Create the XAnimation failed. ');

		interval = xml_node.getAttribute('switch_interval') || 0;
		if (!interval)
			UI.XFrameXMLFactory
				.reportError('WARNING: Wrong frame switch interval specified for the XAnimation, Create the XAnimation failed. ');


		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var frame = new this();
		frame.create(parent, frames, frame_count, interval, layout_param, 
			UI.XFrame.Visibility.VISIBILITY_NONE);

		return frame;
	}


})();

