#!/usr/bin/env node
var http=require('http');

const WARNING_ROOM_FULL='Warning. Jumlah pemain sudah penuh\n';
const WARNING_ROOM_NOT_FULL='Warning. Jumlah pemain belum cukup\n';
const DEFAULT_TURN=0;

var i=0;
var server=http.createServer(function(request,response){
	if (i++<4) {
		response.writeHead(200, {'content-type':'text/plain'});
		response.write('halo klien ke-'+i+'\n');
	}
});

server.listen(8080, function(){
	console.log('server telah menyala di port 8080');
});

var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
	httpServer:server,
	autoAcceptConnections: false
});

function connectionIsAllowed(request){
	return connectedClientsCount<4;
}

function isAngkaSama(c){
	if (typeof c !== 'undefined' && c.length >0) {
		var angka = c[0][0];
		for (t in c) {
			if (c[t][0] !== angka) return false;
		}
		return true;
	} else return false;
}

function isDouble(c) {
	return (c.length === 2) && (isAngkaSama(c));
}

function isStraight(c){
	if (c.length === 5) {
		var sorted = c.sort();
		
//		kasus as tersebar
		if ((c[0][0] === '1') && (c[4][0] === '13')) c[0][0] = String(parseInt(c[0][0])+8);
		
//		var urut = true;
//		console.log(sorted);
		for (i=1; i<5; i++) {
			if (parseInt(c[i][0]) !== parseInt(c[i-1][0]) + 1) return false;
		}
		return true;
	} else return false;
}

function isFlush(c){
	if (typeof c !== 'undefined' && c.length>0) {
		var jenis = c[0][1];
		for (j in c) if (c[j][1] !== jenis) return false;
		return true;
	} else return false;
}

function isFullHouse(c){
	if ((typeof c !== 'undefined') && (c.length === 5)){
		var counter = {};
		for (i in c) {
			if (c[i][0] in counter) {
//				console.log('sama');
				counter[c[i][0]] += 1;
			} else {
				counter[c[i][0]] = 1;
			}
		}
		console.log(counter);
//		console.log(Object.keys(counter).length);
		
		if (Object.keys(counter).length === 2) {
			for (i in counter) {
//				console.log('counter 1: '+counter[i]+typeof counter[i]);
				if((counter[i] === 3) || (counter[i] === 2)) {}
				else return false;
			}
			return true;
		} else return false;
	} else return false;
}

function isBomb(c){
	if (typeof c !== 'undefined' && c.length === 5){
		c.sort();
		
//		potong awal atau akhir
		if (c[0][0] !== c[1][0]) c.splice(0,1);
		else c.splice(4,1);
		
		return isAngkaSama(c);
	} else return false;
}

function getCardConfig(c){
	if (typeof c !== 'undefined' && c.length >0) {
		if(c.length === 1) return 1;
		else if (isDouble(c)) return 2;
		else if (isStraight(c) && isFlush(c)) return 7;
		else if (isStraight(c)) return 3;
		else if (isFlush(c)) return 4;
		else if (isFullHouse(c)) return 5;
		else if (isBomb(c)) return 6;
		else return -1;
	} else return -1;
}

function Player(username, port, sum, cards){
	this.username=username;
	this.port=port;
	this.sum=sum;
	this.cards=cards;
}

function getCardArr(){
	var allcard=[];
//	masukan kartu ke array
	for(angka=1;angka<14;angka++){
		for(jenis=1;jenis<5;jenis++){
			var temp=[];
			temp.push(angka);temp.push(jenis);
//			console.log(temp);
			allcard.push(temp);
		}
	}
//	console.log(allcard);
	return allcard;
}

function shuffle(){
	var allcard=[];
	var playerCardList=[[],[],[],[]];
	var rand;
	
	allcard=getCardArr();
//	console.log(allcard);
	
//	console.log('bil random: '+rand);
//	console.log('allcard: '+typeof allcard);
	for(i=0;i<(52/playerList.length);i++){
		for(j=0;j<playerList.length;j++){
			rand=Math.floor(Math.random()*allcard.length);
			playerCardList[j].push(allcard[rand]);
			allcard.splice(rand,1);
		}
	}
//	console.log(playerCardList);
	return playerCardList;
}


function getWebsocket(portnum){
	for(p in connectedClients){
		if (connectedClients[p].socket._peername.port === portnum) return connectedClients[p];
	}
	return 0;
}

function isMember(arr,c){
//	console.log(arr);
	if(arr.length===0) return false;
	else {
		for(a in arr){
			if((arr[a][0]===c[0])&&(arr[a][1]===c[1])){
//				console.log('kartu: '+arr[a][0]+'&'+arr[a][1]);
				return true;
			}
		}
		return false;
	}
}

// return player who owns c card
function findCard(c){
	for(i in playerList){
		if (isMember(playerList[i].cards,c)) {
			return playerList[i];
		}
	}
}

function getUsername(port){
	for(p in playerList){
		if(playerList[p].port === port) return playerList[p].username;
	} return '';
}

function isTurn(portnum){
	if (getUsername(portnum) !== '') return (getUsername(portnum)===turn.username);
	else return false;
}

function cardToInteger(c){
	for(i in c){
		for (x in c[i]){
			c[i][x] = parseInt(c[i][x]);
		}
	}
	return c;
}

function getMax(c){
	c.sort();
	return c[c.length-1];
}

//return true jika c>d
//return false jika c<d
//c tidak sama dengan d
//c dan d pasti valid card
function compareCard(c,d){
//	d/current card msh kosong
	if (d.length === 0) return true;
	else if (getCardConfig(c)===getCardConfig(d)) {
//		jika konfigurasi kartu sama
		if ((getCardConfig(c) === 1) || (getCardConfig(c) === 2)){
//			perbandingan single double
			var sem=[getMax(c),getMax(d)];
			
//			console.log('kartu untuk dibandingkan');
//			console.log(sem);
			for (i in sem) {
				if ((sem[i][0] === 1) || (sem[i][0] === 2)) sem[i][0] += 13;
			}
			if (sem[0][0] === sem[1][0]) return (sem[0][1]>sem[1][1]);
			else return (sem[0][0]>sem[1][0]);
		} else if ((getCardConfig(c)>2)&&(getCardConfig(c)<8)){
//			perbandingan lima kartu
		}
	} else return false; //konfigurasi kartu tdk sama
}

function getPlayerIndex(p){
	for(q in playerList) {
		if (playerList[q].username === p.username) return parseInt(q);
	}
	return -1;
}

// player after p
function getNextPlayer(p){
	var idx = getPlayerIndex(p);
	if (idx !== -1) {
		if (idx === (playerList.length -1)) idx -= playerList.length;
		idx += 1;
		return playerList[idx];
	} else return {};
}

//true jika c = d
function isSameCard(c,d){
	console.log('banding');console.log(c);console.log(d);
	return ((c[0]===d[0])&&(c[1]===d[1]));
}

function removeCard(player, card){
	for (d in card){
		for(c in player.cards){
			if (isSameCard(player.cards[c],card[d])) {
				console.log('potong satu');
				player.cards = player.cards.splice(parseInt(c),1);
			}
		}
	}
}

//global variable
var connectedClientsCount=0;
var connectedClients=[];	//list of client websocket
var playerList=[];
var ready=false;			//readiness to play
var mArr;					//message array
var turn;					
var currentCard=[];			//kartu terbesar terakhir
var isFinish=false;			//kondisi berhenti

wsServer.on('request',function(request){
	if(!connectionIsAllowed(request)){
		request.reject();
		console.log('WebSocket Connection dari '+request.remoteAddress+' ditolak');
		return;
	}
	var websocket = request.accept();
	
//	menyimpan client yang terhubung
	connectedClientsCount++;
	connectedClients.push(websocket);
	
	console.log('WebSocket Connection dari '+request.remoteAddress+'/'+websocket.socket._peername.port+' diterima');
	websocket.send('halo. Anda sudah terhubung dengan WebSocket Server');
	
	websocket.on('message',function(message){
//		console.log(message);
//		websocket.send(message);
//		console.log(message.type);
		if((message.type === 'utf8')&&(connectedClientsCount === 2)){
//			console.log('pesan dari klien: '+message.utf8Data);

//			kode pesan
			mArr=message.utf8Data.split('-');
			console.log('kode pesan	: '+mArr[0]);
			
			if(mArr[0] === '00') {
				console.log('isi pesan	: state => ready');
				ready=true;
				
//				kocok kartu
				var playerCardList=[[],[],[],[]];
				playerCardList=shuffle();
//				console.log(playerCardList);
				
//				masukan ke playerList
				for (p in playerList){
					playerList[p].sum=playerCardList[p].length;
					playerList[p].cards=playerCardList[p];
				}
				
				var ws; //websocket sementara
//				kirim ke client
				for (p in playerList) {
					ws = getWebsocket(playerList[p].port);
					var mesg_json = JSON.stringify(playerList[p].cards);
					if (ws !== 0) ws.send(mesg_json);
				}
				
//				giliran (pertama)
				var lowestCard=[3,1]; turn = findCard(lowestCard);
				console.log('giliran sekarang: '+turn.username);

				ws = getWebsocket(turn.port);
				if (ws !== 0) ws.send('04');
				
			} else if ((mArr[0] === '01') && (ready)) {
//				Player move
				console.log('isi pesan	: pemain jalan');

//				proses & simpan kartu
				var temp=mArr[1].split(';');
//				var x = [[1,2],[3,4]];
//				console.log(x);
				for(c in temp) temp[c] = temp[c].split('/');
				temp=cardToInteger(temp);
//				console.log('temp: ');
//				console.log(temp);
	
//				uji giliran
				if (isTurn(this.socket._peername.port)) {
//					uji validitas kartu
//					console.log('pasti masuk sini');
					if (getCardConfig(temp) !== -1) {
//						console.log('pasti ngga masuk sini');
						var retval = compareCard(temp,currentCard);
						if (retval) {
//							current card diganti
							currentCard=temp;
							
//							hapus kartu player terakhir
							removeCard(turn,temp);
							console.log('jml kartu maunya 25');
							console.log(turn.cards.length);
							
//							giliran berikutnya
							turn = getNextPlayer(turn);
//							console.log('error turn');console.log(turn);
							console.log('giliran berikutnya: '+turn.username);
							
						} else this.send('07'); //kartu tdk sesuai dgn permainan / kartu lebih rendah dari yg sharusnya
					} else this.send('06'); //susunan kartu salah
				} else {
					console.log('warning. invalid turn');
					this.send('05'); //invalid turn
				}
			} else if ((mArr[0] === '02')&&(ready)){
				console.log('isi pesan	: pemain skip');
			} else if (mArr[0] === '03'){
//				register player name
				if (mArr[1] === '') mArr[1] = 'default';
				console.log('isi pesan	: username => '+mArr[1]);
//				console.log(this.socket._peername.port);
				playerList.push(new Player(mArr[1],this.socket._peername.port,0,[]));
				console.log(playerList);
			}			
//			broadcast
			for (var c in connectedClients){
				if (connectedClients[c].socket._peername.port !== this.socket._peername.port) connectedClients[c].send(message.utf8Data);
			}
		} else if (connectedClientsCount !== 4) this.send(WARNING_ROOM_NOT_FULL);
	});
	
	websocket.on('close',function(reasonCode,description){
		console.log('WebSocket Connection dari '+request.remoteAddress+'/'+this.socket._peername.port+' closed');
	});
});
