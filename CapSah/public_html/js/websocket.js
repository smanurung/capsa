/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var websocket;
var serverUrl = "ws://10.175.213.115:8080/";
//var serverUrl = "ws://localhost:8080/";
function displayMessage(message) {
    console.log(message);
}
// Initialize the WebSocket object and setup Event Handlers
function initWebSocket() {
// Check if browser has an implementation of WebSocket (older Mozilla browsers used MozWebSocket)
    var WebSocketObject = window.WebSocket || window.MozWebSocket;
    if (WebSocketObject) {
        // Create the WebSocket object
        websocket = new WebSocketObject(serverUrl);

        // Setup the event handlers
        websocket.onopen = function() {
            displayMessage("WebSocket Connection Opened");
			registerusername(userName);
            //document.getElementById("sendmessage").disabled = false;
        };

        websocket.onclose = function() {
            displayMessage("WebSocket Connection Closed");
            //document.getElementById("sendmessage").disabled = true;
        };

        websocket.onerror = function() {
            displayMessage("Connection Error Occured");
        };

        websocket.onmessage = function(message) {
            var msg = JSON.parse(message.data);
            if (msg[0] == '2000') { // message success plus action
                switch (msg[1]) {
                    case '00':  // ready
                        game.showgamescreen();
                        break;
                    case '01':	// submit current player move card
                        game.move(msg[2]);
                        gameroom.drawnextturn();
                        break;
                    case '02':	// skip message
                        game.turn = msg[2];
                        gameroom.drawnextturn();
                        break;
                    case '03':	// get room list
                        rooms.roomlist = msg.slice(2, msg.length);
                        rooms.init();
                        game.showlobbyscreen();
                        break;
                    case '08': // create room
                        game.showroomscreen();
                        game.currentroom = msg[2];
                        game.players = msg.slice(3, msg.length);
                        game.myname = game.players[game.players.length - 1];
                        gameroom.refreshplayer();
                        break;
                    case '09': // join room
                        game.showroomscreen();
                        game.currentroom = msg[2];
                        game.players = msg.slice(3, msg.length);
                        game.myname = game.players[game.players.length - 1];
                        gameroom.refreshplayer();
                        break;
                    case '00':	// ready
                        istarted = true;
                        break;
                    case '17':	// message received when user is registered to the game server
                        break;			
					case '18':	// exit from room that is not started yet
						game.currentroom = '';
						game.players = new Array();
						break;
                }

            } else {
                switch (msg[0]) {
                    case '00':	// ready
                        break;				
                    case '01':	// submit current player move card
                        game.movenonplayer(msg[3],msg[4]);
                        gameroom.drawnextturn();
                        break;
                    case '02':	// skip message
                        game.turn = msg[3];
                        gameroom.drawnextturn();
                        break;
                    case '04':	// first turn
                        game.turn = msg[1];
                        game.showgamescreen();
                        break;
                    case '05':	// invalid turn
                        break;
                    case '06':	// invalid card config
                        break;
                    case '07':	// card config is not match/lower
                        break;
					case '08':	// create room
						rooms.roomlist.push(msg.slice(2, msg.length));
                        rooms.init();	
						break;
                    case '09':	// join room
                        game.players = msg.slice(3, msg.length);
                        gameroom.refreshplayer();
                        break;
                    case '10':	// full room
                        alert("room is full");
                        break;
                    case '11': 	// room is not full yet
                        alert("room is not full yet");
                        break;
                    case '12':	// give initial 13 cards
                        game.resetgame();
                        game.arr = msg[1].slice(0);
                        break;
                    case '13':  // new game turn
                        gameroom.refreshtable();
                        break;
					case '18':	// exit from room that is not started yet
						for (var i = 0; i < game.players.length; i++){
							if (game.players[i] == msg[3]){
								game.players.splice(i,1);
							}
						}
						gameroom.refreshplayer();
						break;
					case '19':	// delete room
						for (var i = 0; i < rooms.roomlist.length; i++){
							if (rooms.roomlist[i] == msg[1]){
								rooms.roomlist.splice(i,1);
							}
						}						
						rooms.init();
						break;						
                    case '99':  // show the winner
                        game.showwinner(msg[1]);
                        break;
                }
            }
            displayMessage("Received Message: <i>" + message.data + "</i>");
        };
    } else {
        displayMessage("Your Browser does not support WebSockets");
    }
}
// Send a message to the server using the WebSocket
function sendMessage() {
// readyState can be CONNECTING,OPEN,CLOSING,CLOSED
    if (websocket.readyState = websocket.OPEN) {
        var message = document.getElementById("message").value;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function createRoomMsg() {
    if (websocket.readyState = websocket.OPEN) {
		if (document.getElementById("RoomName").value != ''){
			var message = '08-' + document.getElementById("RoomName").value;
			displayMessage("Sending Message: <i>" + message + "</i>");
			websocket.send(message);
		} else {
			alert ('please fill room name');
		}
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function roomlist() {
    if (websocket.readyState = websocket.OPEN) {
        var message = '03';
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function join(roomid) {
    if (websocket.readyState = websocket.OPEN) {
        var message = '09-' + roomid;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function startgame() {
    if (websocket.readyState = websocket.OPEN) {
        var message = '00-' + game.currentroom;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function playermove() {

    var selected = new Array();
    var i = 0;
    var prevlength = game.state.length;
    arr = game.arr.slice(0);
    state = game.state.slice(0);
    while (i < state.length)
    {
        if (state[i] == true) {
            selected.push(arr[i]);
            arr.splice(i, 1);
            state.splice(i, 1);
            i--;
        }
        i++;
    }
    if (prevlength != state.length) {
        if (websocket.readyState = websocket.OPEN) {
            var message = '01-' + game.currentroom + '-';
            for (var i = 0; i < selected.length; i++) {
                message += '' + selected[i][0] + '/' + selected[i][1];
                if (i != (selected.length - 1)) {
                    message += ';';
                }
            }
            displayMessage("Sending Message: <i>" + message + "</i>");
            websocket.send(message);
        } else {
            displayMessage("Cannot send message. The WebSocket connection isn't open");
        }
    }
}

function pass() {
    if (websocket.readyState = websocket.OPEN) {
        var message = '02-' + game.currentroom;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function registerusername(username){
    if (websocket.readyState = websocket.OPEN) {
        var message = '17-' + username;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function exitroom(username) {
    if (websocket.readyState = websocket.OPEN) {
        var message = '18-' + game.currentroom + '-'+ username;
        displayMessage("Sending Message: <i>" + message + "</i>");
        websocket.send(message);
    } else {
        displayMessage("Cannot send message. The WebSocket connection isn't open");
    }
}

function backtolobby(){
	game.showlobbyscreen();
}