#!/usr/bin/env node

"use strict"

var http=require('http');

var SUCCESS = '2000';
var WARNING_ROOM_FULL='Warning. Jumlah pemain sudah penuh\n';
var WARNING_ROOM_NOT_FULL='Warning. Jumlah pemain belum cukup\n';
var ROOM_CAPACITY=4;

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
//	return connectedClientsCount<4;
	return true;
}

function isAngkaSama(c){
	if (typeof c !== 'undefined' && c.length >0) {
		var angka = c[0][0];
		for (var t in c) {
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
		
		for (var i=1; i<5; i++) {
			if (parseInt(c[i][0]) !== parseInt(c[i-1][0]) + 1) return false;
		}
		return true;
	} else return false;
}

function isFlush(c){
	if (typeof c !== 'undefined' && c.length>0) {
		var jenis = c[0][1];
		for (var j in c) if (c[j][1] !== jenis) return false;
		return true;
	} else return false;
}

function isFullHouse(c){
	if ((typeof c !== 'undefined') && (c.length === 5)){
		var counter = {};
		for (var i in c) {
			if (c[i][0] in counter) {
				counter[c[i][0]] += 1;
			} else {
				counter[c[i][0]] = 1;
			}
		}
		
		if (Object.keys(counter).length === 2) {
			for (var i in counter) {
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

//PseudoClass Player
function Player(uName,ws){
	this.username=uName;
	this.cardList=new Array();
	this.webSocket=ws;
}

Player.prototype.getUsername = function(){
	return this.username;
}

Player.prototype.getWebSocket = function(){
	return this.webSocket;
}

Player.prototype.getCardList = function(){
	return this.cardList;
}

Player.prototype.setCardList = function(cl){
	this.cardList = cl;
}

Player.prototype.contains = function(c){
	var cardList = this.getCardList();
	if(cardList.length===0) return false;
	else {
		for(var a in cardList){
			if((cardList[a][0]===c[0])&&(cardList[a][1]===c[1])){
				return true;
			}
		}
		return false;
	}
}

Player.prototype.removeCard = function(c){
	var foo = this.getCardList();
	for(var c in foo){
		if (isSameCard(foo[c],c)) {
			this.setCardList(this.getCardList().splice(parseInt(c),1));
			break;
		}
	}
}

function getCardArr(){
	var allcard=[];
//	masukan kartu ke array
	for(var angka=1;angka<14;angka++){
		for(var jenis=1;jenis<5;jenis++){
			var temp=[];
			temp.push(angka);temp.push(jenis);
			allcard.push(temp);
		}
	}
	return allcard;
}

function isTurn(portnum){
	if (getUsername(portnum) !== '') return (getUsername(portnum)===turn.username);
	else return false;
}

function cardToInteger(c){
	for(var i in c){
		for (var x in c[i]){
			c[i][x] = parseInt(c[i][x]);
		}
	}
	return c;
}

function getMax(c){
	c.sort();
	return c[c.length-1];
}

//return true if a > b
function compareOneCard(a,b){
	var sem = [a,b];
	for (var i in sem){
		if ((sem[i][0] === 1) || (sem[i][0] === 2)) sem[i][0] += 13;
	}
	if (sem[0][0] === sem[1][0]) return (sem[0][1]>sem[1][1]);
	else return (sem[0][0]>sem[1][0]);
}

//return true jika c>d
//return false jika c<d
//c tidak sama dengan d
//c dan d pasti valid card
function compareCard(c,d){
//	d/current card msh kosong
	if (d.length === 0) return true;
	else if ((getCardConfig(c)===getCardConfig(d)) || ((getCardConfig(c)>2)&&
	(getCardConfig(d)>2))) {
//		jika konfigurasi kartu sama atau berbeda-5-kartu
		if ((getCardConfig(c) === 1) || (getCardConfig(c) === 2)){
//			perbandingan single double
			var sem=[getMax(c),getMax(d)];
			
			for (var i in sem) {
				if ((sem[i][0] === 1) || (sem[i][0] === 2)) sem[i][0] += 13;
			}
			if (sem[0][0] === sem[1][0]) return (sem[0][1]>sem[1][1]);
			else return (sem[0][0]>sem[1][0]);
		} else if ((getCardConfig(c)>2)&&(getCardConfig(c)<8)){
//			perbandingan lima kartu
			if(getCardConfig(c)>getCardConfig(d)) return true;
			else if (getCardConfig(c)===getCardConfig(d)) {
//				jika konfigurasi kartu sama
				if(getCardConfig(c)===4){
//					perbandingan flush
					var maxC = getMax(c);
					var maxD = getMax(d);
					if(maxC[1]>maxD[1]) return true;
					else if (maxC[1]===maxC[1]) return (maxC[0]>maxD[0]);
					else return false;
				} else if (getCardConfig(c)===7){
//					perbandingan bomb
					if(c[0][0]!==c[1][0]) var maxC = c[1];
					if(d[0][0]!==d[1][0]) var maxD = d[1];
					return (maxC[0]>maxD[0]); //nilai kartu tidak mungkin sama
				}
				return compareOneCard(getMax(x),getMax(d));
			}
			else return false;
		}
	} else return false; //konfigurasi kartu tdk sama
}

//true jika c = d
function isSameCard(c,d){
	return ((c[0]===d[0])&&(c[1]===d[1]));
}

//PseudoClass Room
function Room(id){
	this.id=id;
	this.playerList=new Array();
	this.turn='';
	this.currentCard=new Array();
	this.skipList=new Array();
	this.isFinish=false;
	this.isReady=false;
}

Room.prototype.getID = function(){
	return this.id;
}

Room.prototype.addPlayer = function(p){
	this.playerList.push(p);
}

Room.prototype.getPlayerList = function(){
	return this.playerList;
}

Room.prototype.getCurrentCard = function(){
	return this.currentCard;
}

Room.prototype.setCurrentCard = function(cc){
	this.currentCard = cc;
}

Room.prototype.getSkipList = function(){
	return this.skipList;
}

Room.prototype.getPlayer = function(pName){
	var pList = this.getPlayerList();
	for(var p in pList){
		if(pList[p].getUsername() === pName) return pList[p];
	}
}

Room.prototype.getTurn = function(){
	return this.turn;
}

Room.prototype.setTurn = function(t){
	this.turn = t;
}

Room.prototype.getIsReady = function(){
	return this.isReady;
}

Room.prototype.setReady = function(readyV){
	this.isReady = readyV;
}

//p -> player username
Room.prototype.addSkipList = function(p){
	this.getSkipList().push(p);
}

Room.prototype.emptySkipList = function(){
	this.skipList.length = 0;
}

Room.prototype.isFull = function(){
	return (this.playerList.length === ROOM_CAPACITY);
}

Room.prototype.shuffle = function(){
	var allcard=[];
	var playerCardList=[[],[],[],[]];
	var rand;
	
	allcard=getCardArr();
	
	for(var i=0; i<(52/this.getPlayerList().length);i++){
		for(var j=0;j<this.getPlayerList().length;j++){
			rand=Math.floor(Math.random()*allcard.length);
			playerCardList[j].push(allcard[rand]);
			allcard.splice(rand,1);
		}
	}
	return playerCardList;
}

// return player who owns c card
Room.prototype.findCard = function(c) {
	var pList = this.getPlayerList();
	for(var i in pList){
		if (pList[i].contains(c)) {
			return pList[i].getUsername();
		}
	}
}

//input p player
Room.prototype.getNextPlayer = function(p){
	var idx = this.getPlayerIndex(p);
	if (idx !== -1) {
		if (idx === (this.getPlayerList().length -1)) idx -= this.getPlayerList().length;
		idx += 1;
//		mencari kembali jika next player termasuk dlm skipList
		var pList=this.getPlayerList();
		if(pList[idx].port in this.getSkipList()) return this.getNextPlayer(this.getPlayerList()[idx]);
		else return this.getPlayerList()[idx];
	} else return {};
}

Room.prototype.getPlayerIndex = function(p){
	var pList=this.getPlayerList();
	for(var q in pList) {
		if (pList[q].getUsername() === p.getUsername()) return parseInt(q);
	}
	return -1;
}


//global variable

var roomList=new Array();

function getRoom(roomL,roomid){
	for (var r in roomL){
		if(roomL[r].id===roomid) return roomL[r];
	}
	return {};
}

wsServer.on('request',function(request){
	if(!connectionIsAllowed(request)){
		request.reject();
		console.log('WebSocket Connection dari '+request.remoteAddress+' ditolak');
		return;
	}
	var websocket = request.accept();
	
	console.log('WebSocket Connection dari '+request.remoteAddress+'/'+websocket.socket._peername.port+' diterima');
	websocket.send('halo. Anda sudah terhubung dengan WebSocket Server');
	
	websocket.on('message',function(message){
//		message array
		var mArr=new Array();
		
		if(message.type === 'utf8'){

//			kode pesan
			mArr=message.utf8Data.split('-');
			
//			mencari room sesuai
			var room=getRoom(roomList,mArr[1]);
			
//			broadcast
			if (room.hasOwnProperty('playerList')) {
				var pList = room.getPlayerList();				
				if(mArr[0]==='01') mArr[2] = mArr[2].split('/');
				
				for (var p in pList){
					if (pList[p].getWebSocket() !== this) {
						pList[p].getWebSocket().send(JSON.stringify(mArr));
					}
				}
			}
			
			if(mArr[0] === '00') {				
				if (!room.isFull()){
//					prepare for gameplay
					room.setReady(true);
				
//					kocok kartu
					var randomList=[[],[],[],[]];
					randomList=room.shuffle();
				
//					masukan ke playerList
					var pList = room.getPlayerList();
					for (var p in pList){
						pList[p].setCardList(randomList[p]);
					}
				
//					kirim ke client
					for (var p in pList) {
						var mesg_json = JSON.stringify(pList[p].getCardList());
						pList[p].getWebSocket().send(mesg_json);
					}
				
//					giliran (pertama)
					var firstCard=[3,1];
					var nowturn = room.getPlayer(room.findCard(firstCard));
					room.setTurn(nowturn.getUsername());
					
					nowturn.getWebSocket().send('04');
					
					var res = new Array();
					res.push('2000');
					res.push('00');
					
					this.send(JSON.stringify(res));
					console.log('giliran pertama: '+nowturn.getUsername());
				} else {
					this.send('warning. room '+room.getID()+' sudah penuh');
					console.log('warning. room '+room.getID()+' sudah penuh');
				}
			} else if ((mArr[0] === '01') && (room.getIsReady())) {
//				player move
				console.log('isi pesan	: pemain jalan');

//				proses & simpan kartu
				var temp=mArr[2].split(';');
				for(var c in temp) temp[c] = temp[c].split('/');
				temp=cardToInteger(temp);
	
//				uji giliran
				if (room.getPlayer(room.getTurn()).getWebSocket() === this) {
//					uji validitas kartu
					if (getCardConfig(temp) !== -1) {
						console.log('konfigurasi kartu	: '+getCardConfig(temp));
						var retval = compareCard(temp,room.getCurrentCard());
						console.log('hasil compare card: '+retval);
						if (retval) {
//							current card diganti
							room.setCurrentCard(temp);
							
//							hapus kartu player terakhir
							var foo = room.getCurrentCard();
							for(var x in foo){
//								removeCard(turn,foo[x]);
								room.getPlayer(room.getTurn()).removeCard(foo[x]);
							}
							
//							cek kondisi menang
							if(room.getPlayer(room.getTurn()).getCardList().length===0){
//								kondisi akhir
								var pList = room.getPlayerList();
								for(p in pList){
									pList[p].getWebSocket().send('99-'+room.getTurn());
								}
								
								console.log('---Permainan Berakhir---');
								console.log('Pemenang	:'+room.getTurn());
							} else {
//								pesan giliran berikutnya
								room.setTurn(room.getNextPlayer(room.getPlayer(room.getTurn())).getUsername());

								room.getPlayer(room.getTurn()).getWebSocket().send('04');
								
								var res = new Array();
								res.push('2000');
								res.push('01');
								
								this.send(JSON.stringify(res));
								console.log('giliran berikutnya: '+room.getTurn());
							}
						} else {
							this.send('07'); //kartu tdk sesuai dgn permainan / kartu lebih rendah dari yg sharusnya
							console.log('warning. kartu lebih kecil atau konfigurasi tidak sesuai');
							console.log('masih giliran: '+room.getTurn());
						}
					} else {
						this.send('06'); //susunan kartu salah
						console.log('warning. susunan kartu tidak valid');
						console.log('masih giliran: '+room.getTurn());
					}
				} else {
					this.send('05'); //invalid turn
					console.log('warning. invalid turn');
					console.log('masih giliran: '+room.getTurn());
				}
			} else if ((mArr[0] === '02')&&(room.getIsReady())){
				console.log('isi pesan	: '+room.getTurn()+' skip');
				room.addSkipList(room.getTurn());
				
//				cek jumlah player yang skip
				if(room.getSkipList().length===(room.getPlayerList().length-1)) {
//					cari pemain yg blm skip
					var pList = room.getPlayerList();
					for(var p in pList){
						if((room.getSkipList().indexOf(room.getPlayerList()[p].getUsername()))===-1) {
//							kosongkan current card
							room.setCurrentCard(new Array());
							
//							kosongkan skiplist
							room.emptySkipList();
							console.log('skip list berhasil dihapus');

//							ganti giliran player
							room.setTurn(pList[p].getUsername());
														
							pList[p].getWebSocket().send('04');
							
							var res = new Array();
							res.push('2000');
							res.push('02');
							
							this.send(JSON.stringify(res));
							console.log('giliran berikutnya: '+pList[p].getUsername());
							
							break;
						}
					}
				} else{
//					pesan giliran berikutnya
					room.setTurn(room.getNextPlayer(room.getPlayer(room.getTurn())).getUsername());
					room.getPlayer(room.getTurn()).getWebSocket().send('04');
					console.log('giliran berikutnya: '+room.getTurn());
				}
			} else if(mArr[0] === '03'){
//				kirim list room
				var availroom='';

				var res = new Array();
				res.push('2000');
				res.push('03');

				if (roomList.length!==0){
					for(var r in roomList){
						res.push(roomList[r].getID());
					}
				}
				console.log('room tersedia: '+availroom);
				
				this.send(JSON.stringify(res));
			} else if (mArr[0]==='08'){
//				create room
				var room = new Room(mArr[1]);
				roomList.push(room);
				
//				automatic join room
				var dummy=String(this.socket._peername.port);
				var player=new Player(dummy,this);
				room.addPlayer(player);
				
				var res = new Array();
				res.push('2000');
				res.push('08');
				
				this.send(JSON.stringify(res));
				console.log('User '+player.username+' berhasil membentuk room \''+mArr[1]+'\'');
			}else if(mArr[0]==='09'){
//				join room
				var dummy=String(this.socket._peername.port);
				var player=new Player(dummy,this);
				room.addPlayer(player);
				
				var res = new Array();
				res.push('2000');
				res.push('09');
				
				this.send(JSON.stringify(res));
				console.log('User '+player.username+' berhasil masuk ke room \''+room.id+'\'');
			}
		} else{
			console.log('warning. pesan bukan dalam format utf-8');
			this.send('warning. pesan bukan dalam format utf-8');
		}
	});
	
	websocket.on('close',function(reasonCode,description){
		console.log('WebSocket Connection dari '+request.remoteAddress+'/'+this.socket._peername.port+' ditutup');
	});
});
