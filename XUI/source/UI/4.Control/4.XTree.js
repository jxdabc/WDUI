;


(function(){

	$CLASS('UI.XTree', 
	$EXTENDS(UI.XDock),
	function(me, SELF){

		$PUBLIC_FUN([
			'create',
			'destroy',

			'setUnfold',
			'isUnfolded',
			'setChildItemIndent',

			'setRootItemFrame',
			'insertChildItemFrame',
			'addChildItemFrame',
			'getChildItemFrameCount',
			'removeChildItemFrame',

			'handleXMLChildNode',

			'paintForeground',

			'onLayout',

			'getVCenter',
		]);

		$MESSAGE_MAP('NOTIFICATION', 
		[
			$MAP(UI.XFrame.NOTIFICATION.NOTIFICAITON_FRAME_RECT_CHANGED, 'onRootFrameOrFoldUnflodButtonRectChanged'),
			$MAP(UI.XButton.NOTIFICATION.NOTIFICATION_BUTTON_CLICKED, 'onFoldUnfoldButtonClicked'),
			$CHAIN(UI.XDock),
		]);

		var m_root_item_frame_container = null;
		var m_child_item_frame_container = null;
		var m_fold_unfold_button = null;
		var m_child_indent = 0;

		var FOLD_UNFOLD_BUTTION_MARGIN_RIGHT = 10;
		var TREE_LINE_GRAY_DEEP = 0x99;

		$PUBLIC_FUN_IMPL('create', function(parent, layout, visibility /* = SELF.Visibility.VISIBILITY_NONE */, 
			unfolded /* = true */, child_item_indent /* = 20*/, folded_button_face /* = null */, unfolded_button_face /* =null */) {

			me.$PARENT(UI.XDock)
				.create(parent, UI.XDock.DockType.DOCK_TOP2BOTTOM, UI.XDock.Align.ALIGN_LOW, layout, visibility);

			var root_item_frame_container_layout = me.generateLayoutParam();
			root_item_frame_container_layout.width = root_item_frame_container_layout.height =
				SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT;

			var child_item_frame_container_layout = me.generateLayoutParam();
			child_item_frame_container_layout.width = child_item_frame_container_layout.height = 
				SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT;

			var fold_unfold_button_layout = me.generateLayoutParam();
			fold_unfold_button_layout.width = fold_unfold_button_layout.height =
				SELF.LayoutParam.SpecialMetrics.METRIC_WRAP_CONTENT;
			fold_unfold_button_layout.margin_right = FOLD_UNFOLD_BUTTION_MARGIN_RIGHT;


			m_root_item_frame_container = new UI.XDock();
			m_root_item_frame_container.create(me.$THIS, UI.XDock.DockType.DOCK_LEFT2RIGHT,
				UI.XDock.Align.ALIGN_MIDDLE, root_item_frame_container_layout, SELF.Visibility.VISIBILITY_SHOW);

			m_child_item_frame_container = new UI.XDock();
			m_child_item_frame_container.create(me.$THIS, UI.XDock.DockType.DOCK_TOP2BOTTOM,
				UI.XDock.Align.ALIGN_LOW, child_item_frame_container_layout, SELF.Visibility.VISIBILITY_SHOW);

			if (!folded_button_face)
				folded_button_face = UI.XResourceMgr.getImage('img/ctrl/folded_button.png');
			if (!unfolded_button_face)
				unfolded_button_face = UI.XResourceMgr.getImage('img/ctrl/unfolded_button.png');

			var button_faces = [folded_button_face, unfolded_button_face];
			m_fold_unfold_button = new UI.XMultifaceButton();
			m_fold_unfold_button.create(m_root_item_frame_container, button_faces,
				fold_unfold_button_layout, SELF.Visibility.VISIBILITY_SHOW,
				unfolded ? 1 : 0, false);

			m_fold_unfold_button.addNotificationListener(me.$THIS);

			me.setUnfold(unfolded);
			me.setChildItemIndent(child_item_indent);
		});

		$PUBLIC_FUN_IMPL('setUnfold', function(unfold){

			if (unfold && m_child_item_frame_container.getVisibility() ==
				SELF.Visibility.VISIBILITY_SHOW)
				return;
			if (!unfold && m_child_item_frame_container.getVisibility() ==
				SELF.Visibility.VISIBILITY_NONE)
				return;

			m_child_item_frame_container.setVisibility(unfold ?
				SELF.Visibility.VISIBILITY_SHOW : SELF.Visibility.VISIBILITY_NONE);

			m_fold_unfold_button.changeButtonFaceTo(unfold ? 1 : 0);
		});

		$PUBLIC_FUN_IMPL('isUnfolded', function(){

			return m_child_item_frame_container.getVisibility() ==
				SELF.Visibility.VISIBILITY_SHOW;

		});

		$PUBLIC_FUN_IMPL('setChildItemIndent', function(intent){

			if (m_child_indent == intent)
				return;

			m_child_indent = intent;

			UpdateLeftMarginOfChildItemContainer();

		});
		
		$PUBLIC_FUN_IMPL('destroy', function(){
			m_root_item_frame_container = m_child_item_frame_container = null;
			m_child_indent = 0;
			me.$PARENT(UI.XDock).destroy();
		});

		$PUBLIC_FUN_IMPL('setRootItemFrame', function(frame){
			var old = m_root_item_frame_container.removeFrame(1);
			if (frame)
				m_root_item_frame_container.addFrame(frame);
			return old;
		});

		$PUBLIC_FUN_IMPL('insertChildItemFrame', function(frame, index){
			m_child_item_frame_container.insertFrame(frame, index);
		});

		$PUBLIC_FUN_IMPL('removeChildItemFrame', function(index){
			m_child_item_frame_container.removeFrame(index);
		});

		$PUBLIC_FUN_IMPL('getChildItemFrameCount', function(){
			return m_child_item_frame_container.getFrameCount();
		});

		$PUBLIC_FUN_IMPL('addChildItemFrame', function(frame){
			me.insertChildItemFrame(frame, getChildItemFrameCount());
		});

		$PUBLIC_FUN_IMPL('handleXMLChildNode', function(xml_node){

			var first_child = true;

			for (var i = 0; i < xml_node.childNodes.length; i++) {
				var c = xml_node.childNodes[i];
				// node element. 
				if (c.nodeType != 1) continue; 

				if (first_child) {
					me.setRootItemFrame(null);
					var child = UI.XFrameXMLFactory.instance().buildFrame(c, m_root_item_frame_container);
					first_child = false;
				} else {
					UI.XFrameXMLFactory.instance().buildFrame(c, m_child_item_frame_container);
				}
			}
		});

		$PUBLIC_FUN_IMPL('paintForeground', function(ctx, update_rect){

			if (me.isUnfolded() && 
				m_child_item_frame_container.getFrameCount()) {

				var fold_unfold_button_rect = m_fold_unfold_button.getRect();
				var child_item_frame_container_top = m_child_item_frame_container.getRect().top;
				var lines_x_start = fold_unfold_button_rect.left + 
					Math.floor(fold_unfold_button_rect.width() / 2) +
					m_root_item_frame_container.getRect().left;
				var lines_x_end = m_child_item_frame_container.getRect().left;
				var v_line_y_start = m_root_item_frame_container.getRect().bottom;

				if (!(lines_x_end - lines_x_start <= 0 || 
					lines_x_start >= update_rect.right || lines_x_end <= update_rect.left)) {

					var frame_count = m_child_item_frame_container.getFrameCount();
					for (var i = 0; i < frame_count; i++) {
						var current_frame = m_child_item_frame_container.getFrameByIndex(i);
						if (current_frame.getVisibility() != SELF.Visibility.VISIBILITY_SHOW)
							continue;

						var h_line_y = current_frame.getRect().top + Math.max(0, current_frame.getVCenter())
							+ child_item_frame_container_top;

						var v_line_y_start = Math.max(v_line_y_start, update_rect.top);
						var v_line_y_end = Math.min(h_line_y + 1, update_rect.bottom);

						if (lines_x_start >= update_rect.left &&
							lines_x_start < update_rect.right &&
							v_line_y_end - v_line_y_start > 0)
							UI.XLine.draw(ctx, new UI.Pt(lines_x_start, v_line_y_start),
								new UI.Pt(lines_x_start, v_line_y_end), 1,
								TREE_LINE_GRAY_DEEP, TREE_LINE_GRAY_DEEP, TREE_LINE_GRAY_DEEP,
								true);

						v_line_y_start = v_line_y_end;

						var h_line_x_start = Math.max(update_rect.left, lines_x_start);
						var h_line_x_end = Math.min(update_rect.right, lines_x_end);

						if (h_line_y >= update_rect.top &&
							h_line_y < update_rect.bottom &&
							h_line_x_end - h_line_x_start > 0)
							UI.XLine.draw(ctx, new UI.Pt(h_line_x_start, h_line_y),
								new UI.Pt(h_line_x_end, h_line_y), 1,
								TREE_LINE_GRAY_DEEP, TREE_LINE_GRAY_DEEP, TREE_LINE_GRAY_DEEP,
								true);

						if (h_line_y >= update_rect.bottom)
							break;
					}
				}

			}

			me.$PARENT(UI.XDock).paintForeground(ctx, update_rect);
		});

		$PUBLIC_FUN_IMPL('onLayout', function(rc){
			invalidateLines();
			me.$PARENT(UI.XDock).onLayout(rc);
			invalidateLines();
		});

		$PUBLIC_FUN_IMPL('getVCenter', function(){
			var fold_unfold_button_rect = m_fold_unfold_button.getRect();
			return fold_unfold_button_rect.top + 
				Math.floor(fold_unfold_button_rect.height() / 2) +
				m_root_item_frame_container.getRect().top;
		});

		$MESSAGE_HANDLER('onFoldUnfoldButtonClicked', function(n){
			if (n.src != m_fold_unfold_button)
				return;

			if (me.isUnfolded())
		 		me.setUnfold(false);
		 	else
		 		me.setUnfold(true);

		});

		$MESSAGE_HANDLER('onRootFrameOrFoldUnflodButtonRectChanged', function(n){

			if (n.src == m_root_item_frame_container) {
				if (n.new.left == n.old.left) return;
				UpdateLeftMarginOfChildItemContainer();
			} else if (n.src == m_fold_unfold_button) {
				if (n.new.right == n.old.right) return;
				UpdateLeftMarginOfChildItemContainer();
			}

		});


		function UpdateLeftMarginOfChildItemContainer() {

			var child_margin_left = m_child_indent;

			child_margin_left += m_root_item_frame_container.getRect().left;
			child_margin_left += m_fold_unfold_button.getRect().right +
				FOLD_UNFOLD_BUTTION_MARGIN_RIGHT;

			m_child_item_frame_container.beginUpdateLayoutParam().margin_left 
				= child_margin_left;
			m_child_item_frame_container.endUpdateLayoutParam();
		}

		function invalidateLines() {
			var invalid_rect = new UI.Rect(me.parentToChild(me.getRect()));
			invalid_rect.top = Math.max(invalid_rect.top, m_root_item_frame_container.getRect().top);

			var child_container_rect = m_child_item_frame_container.getRect();
			invalid_rect.right = Math.min(invalid_rect.right, child_container_rect.left);
			invalid_rect.bottom = Math.min(invalid_rect.bottom, child_container_rect.bottom);

			me.invalidateRect(invalid_rect);
		}

	})
	.$STATIC({
		'buildFromXML' : buildFromXML,
	});

	function buildFromXML(xml_node, parent) {

		var layout_param = parent ?
			parent.generateLayoutParam(xml_node) :
			new UI.XFrame.LayoutParam(xml_node);

		var unfolded = true;
		var child_item_indent = 20;
		var folded_button_face = null;
		var unfolded_button_face = null;

		var start_state_attr = xml_node.getAttribute('start_state') || '';
		if (start_state_attr.toLowerCase() == 'folded') unfolded = false;

		if (xml_node.hasAttribute('child_item_indent'))
			child_item_indent = 
				xml_node.getAttribute('child_item_indent') - 0 || 0;

		folded_button_face = UI.XFrameXMLFactory.buildImage(xml_node, 
			'folded_button', 'folded_button_type', 'normal', 'folded_button_part_');
		unfolded_button_face = UI.XFrameXMLFactory.buildImage(xml_node,
			'unfolded_button', 'unfolded_button_type', 'normal', 'unfolded_button_part_');

		var frame = new this();
		frame.create(parent, layout_param, this.Visibility.VISIBILITY_NONE,
			unfolded, child_item_indent, folded_button_face, unfolded_button_face);

		return frame;
	}



})();