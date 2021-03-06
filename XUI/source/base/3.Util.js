;

Array.prototype.first = function() { return this[0]; }
Array.prototype.last = function() { return this[this.length - 1]; }


function Exception(err, des) {
	this.err = err;
	this.des = des;
}

String.prototype.format = function()
{
	var args = arguments;
	var count = 0;
	return this.replace(/%/g,				
		function(){
			return args[count++];
		});
}

String.prototype.upperFirst = function()
{
	return this.substring(0, 1).toUpperCase() + this.substring(1);
	
}

Math.realFloor = function(num) {
	var n = Math.floor(Math.abs(num));
	if (num < 0)
		n = -n;
	return n;
}

if (!Number.isFinite) {
	Number.isFinite = function(n) {
		return n != Number.NEGATIVE_INFINITY && n != Number.POSITIVE_INFINITY;
	}
}