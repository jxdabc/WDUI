;

$CLASS('UI.IXDraw', function(){

	$PUBLIC({
		'draw'       : $ABSTRACT,
		'setAlpha'   : $ABSTRACT,
		'setDstRect' : $ABSTRACT 
	});

});


$CLASS('UI.IXText', 
$EXTENDS(UI.IXDraw),
function(){
	$PUBLIC({
		'getText' : $ABSTRACT,
		'measure' : $ABSTRACT
	});
})
.$STATIC({
	'UNLIMITED' : -1
});


$CLASS('UI.IXImage',
$EXTENDS(UI.IXDraw),
function(){
	$PUBLIC({
		'setSrcRect'     : $ABSTRACT,
		'setDrawType'    : $ABSTRACT,
		'setPartRect'    : $ABSTRACT,
		'getImageHeight' : $ABSTRACT,
		'getImageWidth'  : $ABSTRACT,
		'onLoad'		 : $ABSTRACT
	});
});

$CLASS('UI.IXImage.DrawType', function(){})
.$STATIC({
	'DIT_UNKNOW' : new UI.IXImage.DrawType(),
	'DIT_NORMAL' : new UI.IXImage.DrawType(),
	'DIT_STRETCH' : new UI.IXImage.DrawType(),
	'DIT_9PART' : new UI.IXImage.DrawType(),
	'DIT_3PARTH' : new UI.IXImage.DrawType(),
	'DIT_3PARTV' : new UI.IXImage.DrawType(),
	'DIT_CENTER' : new UI.IXImage.DrawType()
});


