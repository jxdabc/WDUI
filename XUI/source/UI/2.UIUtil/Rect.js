;

$CLASS('UI.Rect', function(){

	$PUBLIC({
		'left' : 0,
		'top' : 0,
		'right' : 0,
		'bottom' : 0
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

		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
	});


});