<?php
$project = '1488676';
$url = "https://gitlab.com/api/v3/projects/$project/issues";
//$filters = '?state=closed';
$filters = '';

$curl = curl_init();
curl_setopt_array($curl, array(
	CURLOPT_RETURNTRANSFER => 1,
	CURLOPT_URL => $url . $filters,
	CURLOPT_SSL_VERIFYHOST => 0,
	CURLOPT_SSL_VERIFYPEER => 0,
	CURLOPT_HTTPHEADER => array(
		'PRIVATE-TOKEN: SoiX9GLzP8ufAqkctCE6'
	)
));


$result = curl_exec($curl);

if ($result) {
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	header('Content-Type: application/json');
	http_response_code($code);
	echo $result;
} else {
	echo curl_error($curl);
}

curl_close($curl);
?>
