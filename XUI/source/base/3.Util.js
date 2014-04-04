;

Array.prototype.first = function() { return this[0]; }
Array.prototype.last = function() { return this[this.length - 1]; }


function Exception(err, des) {
	this.err = err;
	this.des = des;
}