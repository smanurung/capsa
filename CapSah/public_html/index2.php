<?php
    session_start();
    include_once 'kaskus.php';

    $loggedin = 0;
    $token = "";

    // check if user already use our apps then set loggedin as 1
    if(isset($_GET['userid'])) {
        $userid = $_GET['userid'];
        $_SESSION['userid'] = $userid;
    } else if(isset($_SESSION['userid'])) {
        $userid = $_SESSION['userid'];
    }

    if(file_exists('data/access_token'.$userid.'.txt')) {
        $content = file_get_contents('data/access_token'.$userid.'.txt');
        $loggedin = 1;
        $token = unserialize($content);
    }

    // if user not logged in, then redirect to kaskus for authorization
    if($loggedin == 0) {
        $kaskus_oauth = new kaskus_oauth ();
        $callbackURL = 'http://127.0.0.1/nicnacnoe/auth.php';
        $token = $kaskus_oauth->getRequestToken ( array (),  $callbackURL);
        file_put_contents('data/req_token'.$userid, serialize( $token ));
        $url = $kaskus_oauth->getAuthorizeURL ( $token );
        header('Location: '.$url);
    }

    if($loggedin==1) {
        $kaskus_oauth = new kaskus_oauth();
        $kaskus_oauth->setToken($token['oauth_token'], $token['oauth_token_secret']);
        $resp = $kaskus_oauth->requestPage ( __KASKUS_API_URL__ . 'user', array ('output' => 'json' ) );
        $resp = json_decode($resp);
        if($resp->error) {
            unlink('data/access_token'.$userid.'.txt');
            header('Location: index.php');
        } else {
        	$_SESSION['userdata'] = $resp;

?>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" type="text/css" media="screen" href="css/bootstrap.min.css" />
<link rel="stylesheet" type="text/css" media="screen" href="css/style.css" />

<script lang="javscript" type="text/javascript" src="js/jquery.js"></script>
<script lang="javscript" type="text/javascript" src="js/bootstrap.min.js"></script>
<script lang="javscript" type="text/javascript" src="js/socket.io.js"></script>
<script lang="javscript" type="text/javascript" src="js/levenshtein.js"></script>
<script lang="javscript" type="text/javascript" src="js/main.js"></script>
<script lang="javscript" type="text/javascript">
  <?php echo "var userName = \"" . $resp->username . "\";\n"; ?>
  <?php echo "var userData = " . json_encode($resp) . ";\n"; ?>
  $(document).ready(function() {
  });
</script>
</head>
<body>

	<div class="mainContainer">
		<div id="alertMessage" class="alert" style="text-align: center; font-weight: bold;">Connecting to server..</div>
		<div class="pictureContainer" >
			<div id="loadingDiv" style="width: 100%; height: 100%; background: url('./img/ajax-loader.gif'); background-repeat: no-repeat; background-position: center;"></div>
		</div>

	</div>
</body>
<html>
<?php
    	}
    }
?>