;

$CLASS('UI.Rect', function(me){

	$PUBLIC_FUN([
		'width',
		'height',
		'leftTop',
		'rightBottom',
		'area',
		'isEmpty',

		'equals',

		'intersect',

		'offset',

		'toString'
	]);

	$PUBLIC_VAR({
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

			me.left = pt.x;
			me.top = pt.y;
			me.right = me.left + size.w;
			me.bottom = me.top + size.h;

			return;
		}

		if (left.instanceOf && left.instanceOf(UI.Rect))
		{
			var rc = left;
			me.left = rc.left;
			me.top = rc.top;
			me.right = rc.right;
			me.bottom = rc.bottom;

			return;
		}

		me.left = left;
		me.top = top;
		me.right = right;
		me.bottom = bottom;
	});

	$PUBLIC_FUN_IMPL('width', function  () { return me.right - me.left; });
	$PUBLIC_FUN_IMPL('height',function  () { return me.bottom - me.top; } );
	
	$PUBLIC_FUN_IMPL('leftTop', function () {
		return new UI.Pt(me.left, me.top);
	});

	$PUBLIC_FUN_IMPL('rightBottom', function () {
		return new UI.Pt(me.right, me.bottom);
	});

	$PUBLIC_FUN_IMPL('area', function  () {
		return (me.bottom - me.top) * (me.right - me.left);
	});

	$PUBLIC_FUN_IMPL('isEmpty', function () {
		return me.bottom <= me.top || me.right <= me.left;
	});

	$PUBLIC_FUN_IMPL('equals', function (rc) {
		return me.top == rc.top &&
			me.bottom == rc.bottom &&
			me.left == rc.left &&
			me.right == rc.right;
	});

	$PUBLIC_FUN_IMPL('intersect', function (rc) {
		var new_rect = new UI.Rect();
		do 
		{
			new_rect.top = Math.max(me.top, rc.top);
			new_rect.bottom = Math.min(me.bottom, rc.bottom);
			if (new_rect.top > new_rect.bottom) break;

			new_rect.left = Math.max(me.left, rc.left);
			new_rect.right = Math.min(me.right, rc.right);
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

		me.left += x;
		me.top += y;
		me.right += x;
		me.bottom += y;
	});

	$PUBLIC_FUN_IMPL('toString', function () {
		return "left:%, top:%, right:%, bottom:%"
			.format(me.left, me.top, me.right, me.bottom);
	});
});