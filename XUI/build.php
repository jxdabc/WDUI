<?php
	/*
		authors: 
			milestone.jxd@gmail.com
	*/

	// make sure we are working here. 
	$PWD = dirname(__FILE__);
	chdir($PWD);

	// release path here.
	$release = 'release';

	// build list
	$build_list = 
		array(
			array('source' => 'source/base', 'in_order' => true),
			array('source' => 'source/UI', 'in_order' => true)
		);
		
	// build XUI.js. 
	echo "\n";
	echo "Build XUI.js \n";
	echo "==============================\n";

	$JS_INTERMEDIA = PATH('source/_build.intermedia.js');

	$js_release_path_root = PATH("$release");
	if (PHP_OS == 'WINNT') echo `rmdir /S /Q $js_release_path_root`;
	else echo `rm -r $js_release_path_root`;
	echo `mkdir $js_release_path_root`;

	if (PHP_OS == 'WINNT') echo `del $JS_INTERMEDIA`;
	else echo `rm $JS_INTERMEDIA`;

	foreach ($build_list as $build_item) 
		catAllFile($build_item['source'], $JS_INTERMEDIA, $build_item['in_order']);

	$js_release_file_name = PATH("$js_release_path_root/XUI.js");
	$js_release_file_name_compressed = PATH("$js_release_path_root/XUI.min.js");

	if (PHP_OS == 'WINNT') echo `copy $JS_INTERMEDIA $js_release_file_name`;
	else echo `cp $JS_INTERMEDIA $js_release_file_name`;

	`uglifyjs --comments -- $js_release_file_name > $js_release_file_name_compressed`;
	echo "\n";

	echo "\n";
	$date = date(DATE_RFC822);
	echo "DONE.\n";
	echo "$date.\n";

	// Utils. 

	function catAllFile($directory, $target, $in_order)
	{
		$directory_last = $directory[strlen($directory) - 1];
		if ($directory_last == '\\' || $directory_last == '/')
			$directory .= '*';
		else
			$directory .= '\\*';
		$directory = PATH($directory);

		$files = glob($directory);
		if ($in_order)
			usort($files, 'CMP_FILE');
		foreach ($files as $file) 
		{
			if (is_file($file))
				cat($file, $target, "\r\n");
			else
				catAllFile($file , $target, $in_order);
		}
	}

	function cat($src, $dst, $delimiter = NULL)
	{
		if (PHP_OS == 'WINNT')
			`type $src >> $dst`;
		else
			`cat $src >> $dst`;

		if ($delimiter) 
		{
			$f = fopen($dst, 'ab');
			fwrite($f, $delimiter);
			fclose($f);
		}
	}

	function PATH($path)
	{
		if (PHP_OS == 'WINNT')
			return str_replace('/', '\\', $path);
		else
			return str_replace('\\', '/', $path);
	}

	function CMP_FILE($l, $r)
	{
		$l = pathinfo($l, PATHINFO_FILENAME);
		$r = pathinfo($r, PATHINFO_FILENAME);
		$l = explode('.', $l); $l = $l[0];
		$r = explode('.', $r); $r = $r[0];

		if ((string)(int)$l == $l) $l = (int)$l;
		else $l = PHP_INT_MAX;
		if ((string)(int)$r == $r) $r = (int)$r;
		else $r = PHP_INT_MAX;

		return $l - $r;
	}
?>