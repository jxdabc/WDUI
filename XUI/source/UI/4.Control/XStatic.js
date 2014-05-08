;

(function() {

	$CLASS('UI.XStatic', 
	$EXTENDS(UI.XFrame),
	function(me, SELF){

		$PUBLIC_FUN([
			'create',
			'destroy',

			'setRect',
			'paintForeground',
			
			'onMeasureWidth',
			'onMeasureHeight',

			'setText',
			'getText',
		]);

		var m_text = null;
		var m_measured_height = 0;


		$PUBLIC_FUN_IMPL('create', function(parent, layout, visibility/* = UI.XFrame.Visibility.VISIBILITY_NONE*/, 
			text) {
			me.$PARENT(UI.XFrame).create(parent, layout, visibility);
			me.setText(text);
		});

		$PUBLIC_FUN_IMPL('destroy', function(){
			me.setText(null);
			m_measured_height = -1;
			me.$PARENT(UI.XFrame).destroy();
		});

		$PUBLIC_FUN_IMPL('setRect', function(new_rect){
			if (me.getRect().equals(new_rect)) return;
			if (m_text)
				m_text.setDstRect(new UI.Rect(0,0,new_rect.width(), new_rect.height()));
			me.$PARENT(UI.XFrame).setRect(new_rect);
		});

		$PUBLIC_FUN_IMPL('paintForeground', function(ctx, rect){
			if (m_text) m_text.draw(ctx, rect);
			me.$PARENT(UI.XFrame).paintForeground(ctx, rect);
		});

		$PUBLIC_FUN_IMPL('onMeasureWidth', function(param){
			me.$PARENT(UI.XFrame).onMeasureWidth(param);

			if (!m_text) return;

			var measured = me.getMeasuredWidth();
			var text_metric;

			if (param.spec != SELF.MeasureParam.Spec.MEASURE_EXACT) {
				if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
					text_metric = m_text.measure(param.num);
				else
					text_metric = m_text.measure(UI.IXText.UNLIMITED);

				var new_measured = Math.max(measured, text_metric.w);
				if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
					new_measured = Math.min(new_measured, param.num);

				me.setMeasuredWidth(new_measured);

			} else
				text_metric = m_text.measure(measured);

			m_measured_height = text_metric.h;
		});

		$PUBLIC_FUN_IMPL('onMeasureHeight', function(param){
			me.$PARENT(UI.XFrame).onMeasureHeight(param);

			if (!m_text) return;

			if (param.spec != SELF.MeasureParam.Spec.MEASURE_EXACT) {
				var measured = me.getMeasuredHeight();
				var new_measured = Math.max(measured, m_measured_height);

				if (param.spec == SELF.MeasureParam.Spec.MEASURE_ATMOST)
					new_measured = Math.min(param.num, new_measured);

				me.setMeasuredHeight(new_measured);
			}

			m_measured_height = 0;

		});

		$PUBLIC_FUN_IMPL('setText', function(text){
			
			if (m_text == text) return null;

			var old = m_text;
			m_text = text;

			if (m_text) {
				var frame_rect = me.getRect();
				m_text.setDstRect(new UI.Rect(0,0,frame_rect.width(), frame_rect.height()));
			}

			me.invalidateLayout();
			me.invalidateAfterLayout();

			return old;
		});

		$PUBLIC_FUN_IMPL('getText', function(){
			if (!m_text) return '';
			return m_text.getText();
		});

	})
	.$STATIC({
		'buildFromXML' : buildFromXML,
	});

	function buildFromXML(xml_node, parent) {
		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var text = UI.XFrameXMLFactory.buildText(xml_node);

		var frame = new this();
		frame.create(parent, layout_param, 
			this.Visibility.VISIBILITY_NONE, text);

		return frame;
	}

})();