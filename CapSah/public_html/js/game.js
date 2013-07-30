/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

$(window).load(function() {
    game.init();
});

var game = {
    arr: new Array(),
    state: new Array(),
    left: 13,
    top: 13,
    right: 13,
    turn: 0, // current turn
    myturn: 0,
    myname: '',
    currentroom: '',
    istarted: false,
    players: new Array(),
    init: function() {

        mouse.init();
        // Hide all game layers and display the start screen
        $('.gamelayer').hide();
        $('#turnscreen .turn').hide();
        $('#homescreen').show();

        //Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');

        game.drawcanvas();

        $('#startup').click(function() {
            roomlist();
        });

    },
    drawcanvas: function() {
        gameroom.refreshtable();
        gameroom.drawplayercard();
        gameroom.drawtopcard();
        gameroom.drawleftcard();
        gameroom.drawrightcard();
        gameroom.drawok();
        gameroom.drawpass();
    },
    move: function(nextturn) {
        if (game.turn == game.myturn) {
            var selected = new Array();
            var i = 0;
            var prevlength = game.state.length;
            while (i < game.state.length)
            {
                if (game.state[i] == true) {
                    selected.push(game.arr[i]);
                    game.arr.splice(i, 1);
                    game.state.splice(i, 1);
                    i--;
                }
                i++;
            }
            if (prevlength != game.state.length) {
                gameroom.refreshtable();
                gameroom.drawplayercard();
                gameroom.drawmovecard(selected);
            }
        }
        game.turn = nextturn;
    },
    movenonplayer: function(arr, nextturn) {
        gameroom.refreshtable();
        if (game.turn != game.myturn) {
            switch (game.myturn) {
                case 0:
                    switch (game.turn) {
                        case 0:
                            break;
                        case 1:
                            game.left -= arr.length;
                            gameroom.drawleftcard();
                            break;
                        case 2:
                            game.top -= arr.length;
                            gameroom.drawtopcard();
                            break;
                        case 3:
                            game.right -= arr.length;
                            gameroom.drawrightcard();
                    }
                    break;
                case 1:
                    switch (game.turn) {
                        case 0:
                            game.right -= arr.length;
                            gameroom.drawrightcard();
                            break;
                        case 1:
                            break;
                        case 2:
                            game.left -= arr.length;
                            gameroom.drawleftcard();
                            break;
                        case 3:
                            game.top -= arr.length;
                            gameroom.drawtopcard();
                            break;
                    }
                    break;
                case 2:
                    switch (game.turn) {
                        case 0:
                            game.top -= arr.length;
                            gameroom.drawtopcard();
                            break;
                        case 1:
                            game.right -= arr.length;
                            gameroom.drawrightcard();
                            break;
                        case 2:
                            break;
                        case 3:
                            game.left -= arr.length;
                            gameroom.drawleftcard();
                            break;
                    }
                    break;
                case 3:
                    switch (game.turn) {
                        case 0:
                            game.left -= arr.length;
                            gameroom.drawleftcard();
                            break;
                        case 1:
                            game.top -= arr.length;
                            gameroom.drawtopcard();
                            break;
                        case 2:
                            game.right -= arr.length;
                            gameroom.drawrightcard();
                            break;
                        case 3:
                            break;
                    }
                    break;
            }

            gameroom.drawmovecard(arr);

            game.turn = nextturn;
        }
    },
    resetgame: function() {
        game.left = 13;
        game.top = 13;
        game.right = 13;
        game.turn = 0;
        //game.myturn = 0;
        $('#winner').html('');
        game.arr = new Array();
        game.state = [false, false, false, false, false, false, false, false,false, false,false, false, false];
    },
    showgamescreen: function() {
        $('.gamelayer').hide();
        $('#turnscreen').show();
        $('#gamescreen').show();
        game.drawcanvas();
        gameroom.drawnextturn();
        $('#gamecanvas').show();
    },
    showcreatescreen: function() {
        $('.gamelayer').hide();
        $('#createscreen').show();
    },
    showlobbyscreen: function() {
        $('.gamelayer').hide();
        $('#lobbyscreen').show();
    },
    showroomscreen: function() {
        gameroom.init();
        $('.gamelayer').hide();
        $('#gamescreen').show();
        $('#roomscreen').show();
    },
    showwinner: function(winner){
        $('#winner').html(winner + ' win!');
        gameroom.clearok();
        gameroom.clearpass();
        $('#winnerscreen').show();
        $('#okbutton').click(function(){
            gameroom.returnevent();
        });
    }
}

var rooms = {
    roomlist: new Array(),
    init: function() {
        var html = "<div id='roomcontainer'><img id='createbutton' src='images/button/createroom.png' alt='Create'>";
        for (var i = 0; i < rooms.roomlist.length; i++) {
            //html += '<div class="room"><div class="roominfo" id="' + rooms.roomlist[i] + '">' + rooms.roomlist[i] + '<br></div></div>';
            html += '<div class="room">' + rooms.roomlist[i] + '</div>';
        }
        html += "</div>"
        $('#lobbyscreen').html(html);

        $('.room').click(function() {
            join($(this).html());
            //game.showroomscreen();
        });

        $('#createbutton').click(function() {
            game.showcreatescreen();
        });
    }
}

var gameroom = {
    init: function() {
        $('#readyleft').hide();
        $('#readytop').hide();
        $('#readyright').hide();

        $('#startbutton').click(function() {
            startgame();
        });

        $('#exitbutton').click(function() {
            //game.showlobbyscreen();
        });
    },
    drawtopcard: function() {
        game.backcardV = new Image();
        game.backcardV.src = 'images/card/backsidecardV.png';
        game.backcardV.onload = function() {
            game.context.clearRect(200, 20, 240, 116);
            for (var i = 0; i < game.top; i++) {
                game.context.drawImage(game.backcardV, (368 - (14 * i)), 20);
            }
        }
    },
    drawleftcard: function() {
        game.backcardHL = new Image();
        game.backcardHL.src = 'images/card/backsidecardH.png';
        game.backcardHL.onload = function() {
            game.context.clearRect(20, 120, 116, 240);
            for (var i = 0; i < game.left; i++) {
                game.context.drawImage(game.backcardHL, 20, (120 + (14 * i)));
            }
        }
    },
    drawmovecard: function(arr) {
        game.cards = new Image();
        game.cards.src = 'images/card/cards.png';
        game.cards.onload = function() {
            //game.context.clearRect(200, 344, 240, 116);
            for (var i = 0; i < arr.length; i++) {
                game.context.drawImage(game.cards, 1 + (73 * (arr[i][0] - 1)), 1 + (98 * (arr[i][1] - 1)), 72, 96, 250 + (i * 14), 194, 72, 96);
            }
        }
    },
    drawnextturn: function() {
        $('#turnscreen .turn').hide();
        switch (game.myturn) {
            case 0:
                switch (game.turn) {
                    case 0:
                        $('#turnscreen #playerturn').show();
                        break;
                    case 1:
                        $('#turnscreen #leftturn').show();
                        break;
                    case 2:
                        $('#turnscreen #topturn').show();
                        break;
                    case 3:
                        $('#turnscreen #rightturn').show();
                        break;
                }
                break;
            case 1:
                switch (game.turn) {
                    case 0:
                        $('#turnscreen #rightturn').show();
                        break;
                    case 1:
                        $('#turnscreen #playerturn').show();
                        break;
                    case 2:
                        $('#turnscreen #leftturn').show();
                        break;
                    case 3:
                        $('#turnscreen #topturn').show();
                        break;
                }
                break;
            case 2:
                switch (game.turn) {
                    case 0:
                        $('#turnscreen #topturn').show();
                        break;
                    case 1:
                        $('#turnscreen #rightturn').show();
                        break;
                    case 2:
                        $('#turnscreen #playerturn').show();
                        break;
                    case 3:
                        $('#turnscreen #leftturn').show();
                        break;
                }
                break;
            case 3:
                switch (game.turn) {
                    case 0:
                        $('#turnscreen #leftturn').show();
                        break;
                    case 1:
                        $('#turnscreen #topturn').show();
                        break;
                    case 2:
                        $('#turnscreen #rightturn').show();
                        break;
                    case 3:
                        $('#turnscreen #playerturn').show();
                        break;
                }
                break;
        }
    },
    drawrightcard: function() {
        game.backcardHR = new Image();
        game.backcardHR.src = 'images/card/backsidecardH.png';
        game.backcardHR.onload = function() {
            game.context.clearRect(524, 120, 116, 240);
            for (var i = 0; i < game.right; i++) {
                game.context.drawImage(game.backcardHR, 524, (288 - (14 * i)));
            }
        }
    },
    drawplayercard: function() {
        game.cards = new Image();
        game.cards.src = 'images/card/cards.png';
        game.cards.onload = function() {
            game.context.clearRect(200, 344, 240, 116);
            for (var i = 0; i < game.arr.length; i++) {
                if (game.state[i] == true) {
                    game.context.drawImage(game.cards, 1 + (73 * (game.arr[i][0] - 1)), 1 + (98 * (game.arr[i][1] - 1)), 72, 96, 200 + (i * 14), 364 - 10, 72, 96);
                } else {
                    game.context.drawImage(game.cards, 1 + (73 * (game.arr[i][0] - 1)), 1 + (98 * (game.arr[i][1] - 1)), 72, 96, 200 + (i * 14), 364, 72, 96);
                }
            }
        }
    },
    clearok:function(){
        game.context.clearRect(475, 390, 80, 40);
    },        
    clearpass:function(){
        game.context.clearRect(85, 390, 80, 40);
    },             
    drawok: function() {
        game.ok = new Image();
        game.ok.src = 'images/button/ok.png';
        game.ok.onload = function() {
            game.context.drawImage(game.ok, 475, 390);
        }
    },
    drawpass: function() {
        game.pass = new Image();
        game.pass.src = 'images/button/pass.png';
        game.pass.onload = function() {
            game.context.drawImage(game.pass, 85, 390);
        }
    },
    okevent: function() {
        if (game.turn == game.myturn) {
            playermove();
            //game.move();
        } else {
            //var arr = [[2, 2], [3, 2]];
            //game.movenonplayer(arr);
        }
    },
    passevent: function() {
        pass();
    },
    refreshplayer: function() {
        // search
        for (var i = 0; i < game.players.length; i++) {
            if (game.players[i] == game.myname) {
                game.myturn = i;
                
                break;
            }
        }
        idx2 = 0 - game.myturn;
        idx = 0;
        if (idx2 < 0) {
            for (var i = 0; i > idx2; i--) {
                if (idx == 0) {
                    idx = 3;
                } else {
                    idx--;
                }
            }
        }

        for (var i = 0; i < game.players.length; i++) {
            var locationname = '#' + idx;
            $(locationname).html(game.players[i]);

            if (idx < 3) {
                idx++;
            } else {
                idx = 0;
            }
        }
    },
    refreshtable: function() {
        game.context.clearRect(190, 130, 260, 210);
    },
    returnevent: function(){
        game.showroomscreen();
    }
}

var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function() {
        $('#gamecanvas').mousemove(mouse.mousemovehandler);
        $('#gamecanvas').mousedown(mouse.mousedownhandler);
        $('#gamecanvas').mouseup(mouse.mouseuphandler);
        $('#gamecanvas').mouseout(mouse.mouseuphandler);
    },
    mousemovehandler: function(ev) {
        var offset = $('#gamecanvas').offset();

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }

        var ok = [475, 390, 80, 40];
        var pass = [85, 390, 80, 40];
        if (((mouse.x >= ok[0]) && (mouse.x <= (ok[0] + ok[2])) && (mouse.y >= ok[1]) && (mouse.y <= (ok[1] + ok[3]))) || ((mouse.x >= pass[0]) && (mouse.x <= (pass[0] + pass[2])) && (mouse.y >= pass[1]) && (mouse.y <= (pass[1] + pass[3])))) {
            $(this).css("cursor", "pointer");
        } else {
            $(this).css("cursor", "default");
        }
//        game.context.clearRect(0, 0, 100, 50);
//        game.context.font = '18pt Calibri';
//        game.context.fillStyle = 'black';
//        game.context.fillText(mouse.x + ', ' + mouse.y, 10, 25);
    },
    mousedownhandler: function(ev) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;

        var ok = [475, 390, 80, 40];
        var pass = [85, 390, 80, 40];
        if (((mouse.downX >= ok[0]) && (mouse.downX <= (ok[0] + ok[2])) && (mouse.downY >= ok[1]) && (mouse.downY <= (ok[1] + ok[3])))) {
            gameroom.okevent();
        }

        if ((mouse.downX >= pass[0]) && (mouse.downX <= (pass[0] + pass[2])) && (mouse.downY >= pass[1]) && (mouse.downY <= (pass[1] + pass[3]))) {
            gameroom.passevent();
        }

        var board = [200, 364, 240, 96, 14];
        if (((mouse.downX >= board[0]) && (mouse.downX <= (board[0] + board[2])) && (mouse.downY >= board[1]) && (mouse.downY <= (board[1] + board[3])))) {
            var n = Math.floor((mouse.downX - board[0]) / board[4]);
            if ((n >= game.state.length) && (n <= game.state.length + 3)) {
                n = (game.state.length - 1);
            }
            if (n < game.state.length) {
                game.state[n] = !game.state[n];
                gameroom.drawplayercard();
            }
        }
        ev.originalEvent.preventDefault();
    },
    mouseuphandler: function(ev) {
        mouse.down = false;
        mouse.dragging = false;
    },
}