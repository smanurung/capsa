#!/usr/bin/env node

"use strict"

var http=require('http');

var SUCCESS = '2000';
var WARNING_ROOM_FULL='Warning. Jumlah pemain sudah penuh\n';
var WARNING_ROOM_NOT_FULL='Warning. Jumlah pemain belum cukup\n';
var ROOM_CAPACITY=4;

var i=0;
var server=http.createServer(function(request,response){
	if (i++<ROOM.CAPACITY) {
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
		var sorted = c.sort(Comparator);
		
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
		
//		buat samaran by value (not by reference)
		var samaran = JSON.stringify(c);
		var newCard = JSON.parse(samaran);
		
//		potong awal atau akhir
		if (newCard[0][0] !== newCard[1][0]) newCard.splice(0,1);
		else newCard.splice(4,1);
		
		return isAngkaSama(newCard);
	} else return false;
}

function getCardConfig(c){
	if (typeof c !== 'undefined' && c.length >0) {
		if(c.length === 1) return 1;
		else if (isDouble(c)) return 2;
		else if (isStraight(c) && isFlush(c)) return 7;
		else if (isStraight(c)) {
			console.log('kartu termasuk STRAIGHT');
			return 3;
		}
		else if (isFlush(c)) return 4;
		else if (isFullHouse(c)) return 5;
		else if (isBomb(c)) {
			console.log('kartu termasuk BOMB');
			return 6;
		}
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

Player.prototype.removeCard = function(card){
	var foo = this.getCardList();
	for(var c in foo){
		if (isSameCard(foo[c],card)) {
			this.cardList.splice(parseInt(c),1);
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

function Comparator(a,b){
	if(a[0]<b[0]) return -1;
	if(a[0]>b[0]) return 1;
	return 0;
}

function getMax(c){
	c.sort(Comparator);
	return JSON.stringify(c[c.length-1]);
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
			var sem=[JSON.parse(getMax(c)),JSON.parse(getMax(d))];
			
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
					var maxC = JSON.parse(getMax(c));
					var maxD = JSON.parse(getMax(d));
					
					if(maxC[1]>maxD[1]) {
						return true;
					} else if (maxC[1]===maxC[1]) return (maxC[0]>maxD[0]);
					else return false;
				} else if (getCardConfig(c)===7){
//					perbandingan bomb
					if(c[0][0]!==c[1][0]) var maxC = c[1];
					if(d[0][0]!==d[1][0]) var maxD = d[1];
					return (maxC[0]>maxD[0]); //nilai kartu tidak mungkin sama
				}
				return compareOneCard(getMax(c),getMax(d));
			}
			else return false;
		}
	} else return false; //konfigurasi kartu tdk sama
}

//true jika c = d
function isSameCard(c,d){
	return ((c[0]===d[0])&&(c[1]===d[1]));
}

function isRoomExist(roomL,str){
	for(var r in roomL){
		if(roomL[r].getID() === str) return true;
	}
	return false;
}

//PseudoClass Room
function Room(id){
	this.id=id;
	this.playerList=new Array();
	this.turn='';
	this.currentCard=new Array();
	this.skipList=new Array();
	this.isReady=false;
	this.isFirstTurn=true;
	this.tigaWajik=false;
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

Room.prototype.getIsFirstTurn = function(){
	return this.isFirstTurn;
}

Room.prototype.setIsFirstTurn = function(t){
	this.isFirstTurn = t;
}

Room.prototype.getTigaWajik = function(){
	return this.tigaWajik;
}

Room.prototype.setTigaWajik = function(p){
	this.tigaWajik = p;
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
		if(this.getSkipList().indexOf(pList[idx].getUsername()) !== -1) {
//			var tempList = this.getPlayerList();
			return this.getNextPlayer(pList[idx]);
		} else {
//			var tempList = this.getPlayerList();
			return pList[idx];
		}
	} else return {};
}

Room.prototype.getPlayerIndex = function(p){
	var pList=this.getPlayerList();
	for(var q in pList) {
		if (pList[q].getUsername() === p.getUsername()) return parseInt(q);
	}
	return -1;
}

Room.prototype.isPlayerExist = function(n){
	var pList = this.getPlayerList();
	for(var p in pList){
		if(pList[p].getUsername() === n) return true;
	}
	return false;
}


//global variable

var roomList=new Array();
var clientList=new Array();

function getRoom(roomL,roomid){
	for (var r in roomL){
		if(roomL[r].id===roomid) return roomL[r];
	}
	return {};
}

function getClient(list,ws){
	for(var c in list){
		if(list[c].getWebSocket()===ws) return list[c];
	}
}

function removeClient(list,uname){
	for(var c in list){
		if(list[c].getUsername()===uname) list.splice(parseInt(c),1);
	}
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
		console.log(message.utf8Data);
//		message array
		var mArr=new Array();
		var flag = true;
		
		if(message.type === 'utf8'){

//			kode pesan
			mArr=message.utf8Data.split('-');
			
//			mencari room sesuai
			var room=getRoom(roomList,mArr[1]);
			
			if(mArr[0] === '00') {				
				if (room.isFull()){
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

//					giliran (pertama)
					var firstCard=[3,1];
					var nowturn = room.getPlayer(room.findCard(firstCard));
					room.setTurn(nowturn.getUsername());
				
//					kirim ke client
					for (var p in pList) {
						var car = new Array();
						car.push('12');
						car.push(pList[p].getCardList().sort());
						pList[p].getWebSocket().send(JSON.stringify(car));
						
//						beritahu giliran pertama
						var gil = new Array();
						gil.push('04');
						gil.push(room.getPlayerIndex(nowturn));
						pList[p].getWebSocket().send(JSON.stringify(gil));
					}
					
					var res = new Array();
					res.push('2000');
					res.push('00');
					
					this.send(JSON.stringify(res));
					console.log('giliran pertama: '+nowturn.getUsername());
				} else {
					var res = new Array();
					res.push('11');
					this.send(JSON.stringify(res));
					
					console.log('warning. room '+room.getID()+' belum penuh');
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
						
//						uji apakah giliran pertama mengandung 3 wajik
						if(room.getIsFirstTurn()){
							for(var c in temp) {
								if((temp[c][0]===3)&&(temp[c][1]===1)){
									room.setTigaWajik(true);
									break;
								}
							}
						}
						
						var retval = compareCard(temp,room.getCurrentCard());
						if (retval && ((!room.getIsFirstTurn())||(room.getIsFirstTurn()&&room.getTigaWajik()))) {
//							current card diganti
							room.setCurrentCard(temp);
							
//							hapus kartu player terakhir
							var foo = room.getCurrentCard();
							for(var x in foo){
								room.getPlayer(room.getTurn()).removeCard(foo[x]);
							}
							
//							uji penghapusan skiplist
							if(room.getSkipList().length === room.getPlayerList().length-1){
								room.emptySkipList();
								console.log('Skip List berhasil dihapus');
							}
							
//							cek kondisi menang
							if(room.getPlayer(room.getTurn()).getCardList().length===0){
								console.log('Masuk kondisi menang');
//								kondisi akhir
								var pList = room.getPlayerList();
								
								var res = new Array();
								res.push('99');
								res.push(room.getTurn());
								
								for(p in pList) pList[p].getWebSocket().send(JSON.stringify(res));
								
								console.log('---Permainan Berakhir---');
								console.log('Pemenang	:'+room.getTurn());
							} else {
//								pesan giliran berikutnya
								room.setTurn(room.getNextPlayer(room.getPlayer(room.getTurn())).getUsername());							
								console.log('giliran berikutnya: '+room.getTurn());
							}
							
//							set variabel isFirstTurn room
							room.setIsFirstTurn(false);
							
							var res = new Array();
							res.push('2000');
							res.push('01');
							res.push(room.getPlayerIndex(room.getPlayer(room.getTurn())));
								
							this.send(JSON.stringify(res));
						} else {
							this.send('07'); //kartu tdk sesuai dgn permainan / kartu lebih rendah dari yg sharusnya
							console.log('warning. kartu lebih kecil atau konfigurasi tidak sesuai');
							console.log('masih giliran: '+room.getTurn());
							
							flag = false;
						}
					} else {
						this.send('06'); //susunan kartu salah
						console.log('warning. susunan kartu tidak valid');
						console.log('masih giliran: '+room.getTurn());
						
						flag = false;
					}
				} else {
					this.send('05'); //invalid turn
					console.log('warning. invalid turn');
					console.log('masih giliran: '+room.getTurn());
					
					flag = false;
				}
			} else if ((mArr[0] === '02')&&(room.getIsReady())){
				console.log('isi pesan	: '+room.getTurn()+' skip');
				if(room.getIsFirstTurn() || room.getSkipList().length===(room.getPlayerList().length-1)){
					var res = new Array();
					res.push('16');
					
					this.send(JSON.stringify(res));
					
					console.log('warning. Anda sudah tidak bisa skip');
				} else {
					room.addSkipList(room.getTurn());
				
//					cek jumlah player yang skip
					if(room.getSkipList().length===(room.getPlayerList().length-1)) {
//						cari pemain yg blm skip
						var pList = room.getPlayerList();
						for(var p in pList){
							if((room.getSkipList().indexOf(room.getPlayerList()[p].getUsername()))===-1) {
								console.log('menambahkan skiplist baru');
//								kosongkan current card
								room.setCurrentCard(new Array());
							
//								kosongkan skiplist
//								room.emptySkipList();
//								console.log('skip list berhasil dihapus');

//								ganti giliran player
								room.setTurn(pList[p].getUsername());							
							
								console.log('giliran berikutnya: '+pList[p].getUsername());
								break;
							}
						}
						
//						broadcast message 13
						var res = new Array();
						res.push('13');
						for(p in pList) pList[p].getWebSocket().send(JSON.stringify(res));
					} else{
//						pesan giliran berikutnya
						room.setTurn(room.getNextPlayer(room.getPlayer(room.getTurn())).getUsername());
						console.log('giliran berikutnya: '+room.getTurn());
					}
				
					var res = new Array();
					res.push('2000');
					res.push('02');
					res.push(room.getPlayerIndex(room.getPlayer(room.getTurn())));
					this.send(JSON.stringify(res));
				}
			} else if(mArr[0] === '03'){
//				kirim list room

				var res = new Array();
				res.push('2000');
				res.push('03');

				if (roomList.length!==0){
					for(var r in roomList){
						res.push(roomList[r].getID());
					}
				}
				this.send(JSON.stringify(res));
				res.splice(0,2);
				console.log('room tersedia: '+res);
			} else if (mArr[0]==='08'){
//				create room
				if(!isRoomExist(roomList,mArr[1])){
					var room = new Room(mArr[1]);
					roomList.push(room);
				
//					automatic join room
					var dummy=getClient(clientList,this);
//					var player=new Player(dummy,this);
					room.addPlayer(dummy);
					
//					hapus player dari client list
					removeClient(clientList,dummy.getUsername());
				
					var res = new Array();
					res.push('2000');
					res.push('08');
				
//					beritahu room
					res.push(room.getID());

//					beritahu nama pemain yang sudah ada
					var pList = room.getPlayerList();
					for(p in pList){
						res.push(pList[p].getUsername());
						mArr.push(pList[p].getUsername());
					}
				
					this.send(JSON.stringify(res));
					console.log('User '+dummy.getUsername()+' berhasil membentuk room \''+mArr[1]+'\'');
				} else{
					var res = new Array();
					res.push('14');
					this.send(JSON.stringify(res));
					
					console.log('warning. ID room '+mArr[1]+' sudah ada');
				}
			}else if(mArr[0]==='09'){
				if (!room.isFull()){	
					var res = new Array();
				
//					join room
					var dummy=getClient(clientList,this);
					console.log('tipe data dummy = '+typeof dummy);
					if (!room.isPlayerExist(dummy.getUsername())){
						res.push('2000');
						
						res.push('09');
					
//						var player=new Player(dummy,this);
						room.addPlayer(dummy);
						
//						hapus element dalam client list
						removeClient(clientList, dummy.getUsername());

//						beritahu room
						res.push(room.getID());
					
//						beritahu nama pemain yang sudah ada
						var pList = room.getPlayerList();
						for(p in pList){
							res.push(pList[p].getUsername());
							mArr.push(pList[p].getUsername());
						}
					
						this.send(JSON.stringify(res));
						console.log('User '+dummy.getUsername()+' berhasil masuk ke room \''+room.id+'\'');
					} else {
						res.push('15');
						this.send(JSON.stringify(res));
						
						console.log('warning. user dengan ID '+dummy+' sudah ada');
					}
				}else{
					var res = new Array();
					res.push('10');
					this.send(JSON.stringify(res));
					console.log('warning. room '+room.getID()+' sudah penuh');
					
					flag = false;
				}
			} else if(mArr[0]==='17'){
				console.log('nama pemain: '+mArr[1]);
				/*var pList = room.getPlayerList();
				for(var p in pList){
					if(pList[p].getWebSocket()===this) pList[p].setUsername(mArr[1]);
				}*/
				
//				membentuk objek player
				var p = new Player(mArr[1],this);
				
//				memasukan player baru ke client list
				clientList.push(p);
				
//				membentuk request message
				var m = new Array();
				m.push('2000');
				m.push('17');
				this.send(JSON.stringify(m));
				
				console.log('pemain dengan nama '+mArr[1]+' telah berhasil diperbaharui');
			}
			
//			broadcast
			if (flag && (room.hasOwnProperty('playerList'))) {
				var pList = room.getPlayerList();
				
				if(mArr[0]==='01') {
					mArr[2] = mArr[2].split(';');
					for(var m in mArr[2]){
						mArr[2][m] = mArr[2][m].split('/');
					}
				}
				
				if ((mArr[0]==='01') || (mArr[0]==='02')){
					mArr.push(room.getPlayerIndex(room.getPlayer(room.getTurn())));
				}
				
				mArr.splice(1,0,'');
				for (var p in pList){
					if (pList[p].getWebSocket() !== this) {
						pList[p].getWebSocket().send(JSON.stringify(mArr));
					}
				}
			}
			
		} else {
			console.log('warning. pesan bukan dalam format utf-8');
			this.send('warning. pesan bukan dalam format utf-8');
		}
	});
	
	websocket.on('close',function(reasonCode,description){
		console.log('WebSocket Connection dari '+request.remoteAddress+'/'+this.socket._peername.port+' ditutup');
	});
});
