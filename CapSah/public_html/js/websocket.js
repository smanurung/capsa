/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var websocket;
var serverUrl = "ws://localhost:8080/";
function displayMessage(message) {
    document.getElementById("displaydiv").innerHTML += message + "<br>";
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
            document.getElementById("sendmessage").disabled = false;
        };
        websocket.onclose = function() {
            displayMessage("WebSocket Connection Closed");
            document.getElementById("sendmessage").disabled = true;
        };
        websocket.onerror = function() {
            displayMessage("Connection Error Occured");
        };
        websocket.onmessage = function(message) {
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