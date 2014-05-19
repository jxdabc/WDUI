;

(function(){

	$CLASS('UI.XLine', function(me, SELF){})
	.$STATIC({
		'draw' : draw,
	});


	var DOTTED_LEN = 5;
	function draw(ctx, start, end, width, r,g,b, dotted) {
		
		if (start.equals(end)) return;

		ctx.save();

		ctx.strokeStyle = '#' + r.toString(16) + g.toString(16) + b.toString(16);
		ctx.lineWidth = width;

		if (dotted) {
			if (start.x > end.x) {var t = start; start = end; end = t;}
			var k = (end.y - start.y) / (end.x - start.x);
			
			// parameter equation
			// x = mt + start.x (m = 1 / sqrt(k^2 + 1) )
			// y = nt + start.y (n = k / sqrt(k^2 + 1) )
			// t is the length of the segment start from (start.x, start.y)

			var m,n;
			m = 1 / Math.sqrt(k * k + 1);
			if (Number.isFinite(k))
				n = k / Math.sqrt(k * k + 1);
			else
				n = k > 0 ? 1 : -1;

			var delta_x = end.x - start.x;
			var delta_y = end.y - start.y;

			var ops = ['lineTo', 'moveTo'];
			var op = 0, current_end = DOTTED_LEN;
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);

			do {
				var current_end_x = m * current_end + start.x;
				var cureent_end_y = n * current_end + start.y;

				if (current_end_x > end.x ||
					(n > 0 && cureent_end_y > end.y) ||
					(n < 0 && cureent_end_y < end.y)) {
					current_end_x = end.x;
					cureent_end_y = end.y;
				}

				ctx[ops[op]](current_end_x, cureent_end_y);

				current_end += DOTTED_LEN;
				op = 1 - op;
					
			} while(current_end_x != end.x || 
				cureent_end_y != end.y);

			ctx.stroke();


		} else {
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}

	
		ctx.restore();
	}


})();

