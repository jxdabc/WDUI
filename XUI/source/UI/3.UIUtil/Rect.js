;


$STRUCT('UI.Rect', function(SELF){

	$PUBLIC_FUN([
		'width',
		'height',
		'leftTop',
		'rightBottom',
		'size',
		'area',
		'isEmpty',

		'equals',

		'intersect',

		'offset',

		'toString',
	]);

	$PUBLIC_VAR({
		'left' : 0,
		'top' : 0,
		'right' : 0,
		'bottom' : 0
	});

	$CONSTRUCTOR(function(left, top, right, bottom){

		// overload function()
		// 			function(left_top, size)
		//			function(left_top, right_bottom)
		//			function(rect)

		if (typeof left == "undefined")
			return;

		if (left.instanceOf && left.instanceOf(UI.Pt))
		{
			var left_top = left;
			this.left = left_top.x;
			this.top = left_top.y;

			if (top.instanceOf && top.instanceOf(UI.Size)) {
				var size = top;
				this.right = this.left + size.w;
				this.bottom = this.top + size.h;
				return;
			}
			
			if (top.instanceOf && top.instanceOf(UI.Pt)) {
				var right_bottom = top;
				this.right = right_bottom.x;
				this.bottom = right_bottom.y;
				return;
			}
			
			return;
		}

		if (left.instanceOf && left.instanceOf(UI.Rect))
		{
			var rc = left;
			this.left = rc.left;
			this.top = rc.top;
			this.right = rc.right;
			this.bottom = rc.bottom;

			return;
		}

		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;	
	});

	$PUBLIC_FUN_IMPL('width', function  () { return this.right - this.left; });
	$PUBLIC_FUN_IMPL('height',function  () { return this.bottom - this.top; } );
	
	$PUBLIC_FUN_IMPL('leftTop', function () {
		return new UI.Pt(this.left, this.top);
	});

	$PUBLIC_FUN_IMPL('rightBottom', function () {
		return new UI.Pt(this.right, this.bottom);
	});

	$PUBLIC_FUN_IMPL('area', function  () {
		return (this.bottom - this.top) * (this.right - this.left);
	});

	$PUBLIC_FUN_IMPL('size', function () {
		return new UI.Size(this.width(), this.height());
	})

	$PUBLIC_FUN_IMPL('isEmpty', function () {
		return this.bottom <= this.top || this.right <= this.left;
	});

	$PUBLIC_FUN_IMPL('equals', function (rc) {
		return this.top == rc.top &&
			this.bottom == rc.bottom &&
			this.left == rc.left &&
			this.right == rc.right;
	});

	$PUBLIC_FUN_IMPL('intersect', function (rc) {
		var new_rect = new UI.Rect();
		do 
		{
			new_rect.top = Math.max(this.top, rc.top);
			new_rect.bottom = Math.min(this.bottom, rc.bottom);
			if (new_rect.top > new_rect.bottom) break;

			new_rect.left = Math.max(this.left, rc.left);
			new_rect.right = Math.min(this.right, rc.right);
			if (new_rect.left > new_rect.right) break;

			return new_rect;

		} while (false);

		return new UI.Rect();	
	});

	$PUBLIC_FUN_IMPL('offset', function (x, y) {

		if (x.instanceOf && x.instanceOf(UI.Pt)) {
			var pt = x;
			x = pt.x;
			y = pt.y;
		}

		this.left += x;
		this.top += y;
		this.right += x;
		this.bottom += y;
	});

	$PUBLIC_FUN_IMPL('toString', function () {
		return "left:%, top:%, right:%, bottom:%"
			.format(this.left, this.top, this.right, this.bottom);
	});
});