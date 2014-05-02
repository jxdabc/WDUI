;

$CLASS('UI.IXDraw', function(me){

	$PUBLIC_FUN({
		'draw'       : $ABSTRACT,
		'setAlpha'   : $ABSTRACT,
		'setDstRect' : $ABSTRACT 
	});

});


$CLASS('UI.IXText', 
$EXTENDS(UI.IXDraw),
function(me){
	$PUBLIC_FUN({
		'getText' : $ABSTRACT,
		'measure' : $ABSTRACT
	});
})
.$STATIC({
	'UNLIMITED' : Number.POSITIVE_INFINITY
});


$CLASS('UI.IXImage',
$EXTENDS(UI.IXDraw),
function(me){
	$PUBLIC_FUN({
		'setSrcRect'     : $ABSTRACT,
		'setDrawType'    : $ABSTRACT,
		'setPartRect'    : $ABSTRACT,
		'getImageHeight' : $ABSTRACT,
		'getImageWidth'  : $ABSTRACT,
		'onImageLoaded'	 : $ABSTRACT
	});
});

$ENUM('UI.IXImage.DrawType',
[
	'DIT_UNKNOW',
	'DIT_NORMAL',
	'DIT_STRETCH',
	'DIT_9PART',
	'DIT_3PARTH',
	'DIT_3PARTV',
	'DIT_CENTER'
]);


