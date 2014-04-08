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