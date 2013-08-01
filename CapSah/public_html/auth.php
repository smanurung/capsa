<?php
	session_start();
	include_once 'kaskus.php';

	$kaskus_oauth = new kaskus_oauth();

	if(isset($_SESSION['userid'])) {
		$userid = $_SESSION['userid'];
	}

	$token = unserialize(file_get_contents('data/req_token'.$userid));
	$arrayResp = $kaskus_oauth->getAccessToken($token['oauth_token'], $token['oauth_token_secret']);

	file_put_contents('data/access_token'.$userid.'.txt', serialize($arrayResp));
	header('Location: index.php');
?>