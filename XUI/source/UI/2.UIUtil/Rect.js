;

$CLASS('UI.Rect', function(){

	$PUBLIC({
		'left' : 0,
		'top' : 0,
		'right' : 0,
		'bottom' : 0,

		'width' : width,
		'height' : height,
		'area' : area,

		'equal' : equal,

		'intersect' : intersect,

		'offset' : offset
	});

	$CONSTRUCTOR(function(left, top, right, bottom){

		if (typeof left == "undefined")
			return;

		if (left.instanceOf && left.instanceOf(UI.Pt))
		{
			var pt = left;
			var size = top;

			this.left = pt.x;
			this.top = pt.y;
			this.right = this.left + size.w;
			this.bottom = this.top + size.h;

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

	function width () { return this.right - this.left; }
	function height () { return this.bottom - this.top; }
	function equal (rc) {
		return this.top == rc.top &&
			this.bottom == rc.bottom &&
			this.left == rc.left &&
			this.right == rc.right;
	}
	function intersect (rc) {
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
	}
	function area () {
		return (this.bottom - this.top) * (this.right - this.left);
	}
	function isEmpty() {
		return this.bottom <= this.top || this.right <= this.left;
	}

	function offset(x, y) {
		this.left += x;
		this.top += y;
		this.right += x;
		this.bottom += y;
	}

});