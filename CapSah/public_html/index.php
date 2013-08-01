<!--
To change this template, choose Tools | Templates
and open the template in the editor.
-->
<!DOCTYPE html>
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
        $callbackURL = 'http://127.0.0.1/capsa/auth.php';
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
        <title> Cap Sah GDP </title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="js/jquery-1.10.2.min.js" type="text/javascript" charset="utf-8"></script>
        <script src="js/game.js" type="text/javascript" charset="utf-8"></script>
        <script src="js/websocket.js" type="text/javascript" charset="utf-8"></script>
        <link rel="stylesheet" href="css/game.css" type="text/css" media="screen" charset="utf-8">
		<script lang="javscript" type="text/javascript">
		<?php echo "var userName = \"" . $resp->username . "\";\n"; ?>
		<?php echo "var userData = " . json_encode($resp) . ";\n"; ?>
		$(document).ready(function() {

		});
			//registerusername(userName);
		</script>
    </head>
    <body onload="initWebSocket(); registerusername(userName);">
		<script>
		
		</script>
        <div id="gamecontainer">

            <div id="homescreen" class="gamelayer">
                <img id="imgtitle" src="images/CAPSAH!.png" alt="Title Game"><br>
                <img id="startup" src="images/button/StartUp.png" alt="Start Button">
            </div>
			
            <div id="lobbyscreen" class="gamelayer"></div>
            <div id="createscreen" class="gamelayer">
                <div id="formcreate">
                    Room name: <input id="RoomName" type="text" name="RoomName" value=""><br>
                    <button id="inputroom" value="Create" onclick="createRoomMsg()">Create</button>
                </div>
            </div>
            <div id="gamescreen" class="gamelayer">
                <!--
                <div id="okbutton"><img src="images/button/ok.png" alt="Ok"></div>
                <div id="passbutton"><img src="images/button/pass.png" alt="Pass"></div>
                -->
                <p class="left" id="1"></p>
                <p class="top" id="2"></p>
                <p class="right" id="3"></p>
                <p class="player" id="0"></p>
                
            </div>            
            <div id="roomscreen" class="gamelayer">
                <div id="readyleft"><img src="images/checks.png" alt="Check"></div>
                <div id="readytop"><img src="images/checks.png" alt="Check"></div>
                <div id="readyright"><img src="images/checks.png" alt="Check"></div>
                <div id="exitbutton"><img src="images/button/exit.png" alt="Exit"></div>
                <div id="startbutton"><img src="images/button/ready.png" alt="Ready"></div>
                <!--                <p class="left">left</p>
                                <p class="top">top</p>
                                <p class="right">right</p>
                                <p class="player">player</p>-->
            </div>
            <div id="turnscreen" class="gamelayer">
                <img id="leftturn" class="turn" src="images/cardspotturnV.png" alt="leftturn">
                <img id="rightturn" class="turn" src="images/cardspotturnV.png" alt="rightturn">
                <img id="topturn" class="turn" src="images/cardspotturnH.png" alt="topturn">
                <img id="playerturn" class="turn" src="images/cardspotturnH.png" alt="playerturn">
            </div>
            <canvas id="gamecanvas" width="640" height="480" class="gamelayer">                
            </canvas>
            <div id="loadingscreen"></div>
            <div id="winnerscreen" class="gamelayer"><br><br><br><br><br><br><br><br><br><br><br><div id="winner"></div><br><div id="okbutton"><img src="images/button/ok.png" alt="ok"></div></div>
        </div>
    </body>
</html>
<?php
    	}
    }
?>