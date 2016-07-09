//heroku info
/*
hidden-coast-14446
https://hidden-coast-14446.herokuapp.com/
https://git.heroku.com/hidden-coast-14446.git
*/

var password = 'shrek';
var adminPassword = 'donkey';
var serverFPS = 25;
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
	res.sendFile (__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('server started');

var SOCKET_LIST = {}, PLAYER_LIST = {};
var io = require('socket.io')(serv, {});


io.sockets.on('connection', function(socket){
	socket.id = makeId();
	socket.verified = false
	socket.on('passwordInput', function(pass){
		if (pass == password){
			var player = Player(socket.id);
			socket.on('mouseLockCheck', function(nulldata){
				socket.verified = true;
				SOCKET_LIST[socket.id] = socket;
				PLAYER_LIST[socket.id] = player;
				socket.on('sendMsgToServer', function (msg){
					var isCommand = commands(socket, msg);
					var name = PLAYER_LIST[socket.id].name || socket.id;
					if (!isCommand){
						sendToAll('addToChat', {words : '<b>' + name + '</b>' + ': ' + msg});
					}	
				});
				socket.on('clientInfo', function(client){
					PLAYER_LIST[socket.id].rotation = client.rotation;
					PLAYER_LIST[socket.id].hex = client.hex;
				}); 
				socket.on('attack', function(data){
					SOCKET_LIST[data.id].emit('recieveDamage', {source : socket.id, DPS : data.DPS});
				});
				
				socket.on('gotWasted', function(data){ disconnect(socket, data);});
				sendToAll('addToChat', {words : '<i> '+ socket.id +' has connected</i>'});
				console.log(socket.id, 'connected');
			});
			
			socket.emit('init', {
				status : true,
				rotation : [player.rotation.x,
							player.rotation.y,
							player.rotation.z,
							player.rotation.w], 
				id : socket.id,
				fps : serverFPS
			});
			
		}else{
			socket.emit('init',{status : false});
		}
		
	});
	socket.on('disconnect', function(data){ disconnect(socket, data);});
	
});

setInterval( update, 1000/serverFPS);

var Player = function(id){
	var self = {
		rotation : {
			x : 0, 
			y : 0, 
			z : 0,
			w : 1
			
		},
		id : id
	};
	return self;
}
function disconnect(socket, data){
	var id = socket.id;
	var data = data || {};
	if (socket.verified){
		var type = data.type || 'has disconnected';
		if (data.type){socket.verified = false;}
		var name = PLAYER_LIST[socket.id].name;
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
		sendToAll('deleteinfo', {id : id});
		sendToAll('addToChat', {words : '<i> '+(name || id)+' '+ type +'</i>'});
	}
	console.log(id, 'disconnected');
}
function makeId(){
	var id = Math.random().toString().slice(-7,-1);
	while (SOCKET_LIST[id]) id = Math.random().toString().slice(-7,-1);
	return id;
}
function update(){
	for (var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('serverInfo', PLAYER_LIST);
	}
}
function sendToAll(infoType, data){
	for (var i in SOCKET_LIST){
		SOCKET_LIST[i].emit(infoType , data);
	}
}
function commands(socket, c){
	var com = c.split(' ');
	if (com[0][0] == '\\'){
		if (com.length == 1){ // 1 word commands
			switch (com[0]){
				case '\\clear':
					socket.emit('clearChat', null);
					break;
				case '\\help':
				case '\\h':
					socket.emit('addToChat', 
					{words : 'Command list: </br>\
					 \\name a_name </br>\
					     \t- change your name </br>\
					 \\clear </br> \
					\t- clear the chat log'}
					
					);
					break;
			}
		}
		else if (com.length == 2){ // 2 word commands
			switch (com[0]){
				case '\\name':
					PLAYER_LIST[socket.id].name = com[1];
					sendToAll('addToChat',{words : '<i>' +socket.id +' changed their name to ' + com[1] +'</i>'} );
					break;
				case '\\link':
					sendToAll('addToChat', {id : socket.id, isLink: true, linkStr : com[1]});
					break;
			}
		}
		return true;
		
	}else {return false;}
}