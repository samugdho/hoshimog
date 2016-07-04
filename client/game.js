//to do

//phone stuff--later
//wasted


game = {};
game.start = function(){
	
var stats, scene, renderer, caster, camera, mouse, canvas, socket, userId, FPS = 60, gravity = 0.1, HUD = {},
	serverFPS, player, chatText, chatInput, hex, controls, laser = {}, relMouse, isMouseLock = false, phoneControls,
	box, camdist, clientUpdate, jump, testLight, sideLights, isPhoneControl = false,
	buttons = [], PLAYERS_LIST = {}, floor, playerStats = {}
	isUpdate = false, isPause = false, gameover = false, isFocus = true,
	keyState = new Array(100).fill(false), 
	keys = {w : 87, s : 83, a : 65, d : 68, q : 81, e : 69, space : 32, l : 76};

function init(){
	
	socket = io();
	//setting
	
	mouse = new THREE.Vector2(0,0);
	relMouse = new THREE.Vector2(0,0);
	caster = new THREE.Raycaster();
	
	scene = new THREE.Scene();

	width = window.innerWidth, height = window.innerHeight;
	canvas = document.getElementById('canvas');
	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			/*antialias		: true,*/
			canvas : canvas
		});
	}else{
		Detector.addGetWebGLMessage();
		return true;
	}
	renderer.setSize( width, height );
	renderer.autoClear = false;
	renderer.setClearColor(0xcccccc);
	document.getElementById('container').appendChild(renderer.domElement);
	
	jump = {power : {now : 0, max : 0.5, add: 0.01}, build : false, ready : true};
	
	//chat
	chatText = document.getElementById('chat-text');
	chatInput = document.getElementById('chat-input');
	var passform = document.getElementById('pass-form');
	var chatForm = document.getElementById('chat-form');
	
	chatText.style.width = Math.min(500, window.innerWidth).toString() + 'px';
	chatInput.style.width = Math.min(500, window.innerWidth).toString() + 'px';
	
	
	
	
	document.getElementById('chat-items').style.display = 'none';
	
	
	camera = new THREE.PerspectiveCamera(55, width / height, 1, 10000 );
	camera.position.set(0, 5, 5);
	
	
	phoneControls = new THREE.DeviceOrientationControls(camera);
	
	//HUD
	HUD.top = height/2;
	HUD.left = -width/2;
	HUD.scene = new THREE.Scene();
	
	HUD.camera = new THREE.OrthographicCamera( width /  - 2, width / 2, height / 2, height / - 2, 1, 100 );
	
	HUD.camera.lookAt(HUD.scene.position);
	HUD.healthBar = new THREE.Mesh(
		new THREE.BoxGeometry(width/3,5,5),
		new THREE.MeshLambertMaterial({color : 0x000000, emissive: 0xee0000})
	);
	HUD.healthBar.visible = false;
	HUD.setPosition(HUD.healthBar, 0.5, 0.05);
	HUD.scene.add(HUD.healthBar);
	
	HUD.cursor = new THREE.Mesh(
		new THREE.PlaneGeometry(10,10),
		new THREE.MeshLambertMaterial({color : 0x000000, emissive: 0xffffff, transparent : true, opacity : 0.5})
	);
	HUD.setPosition(HUD.cursor, 0.5, 0.5);
	HUD.scene.add(HUD.cursor);	
	
	
	//password
	passInput = document.getElementById('pass-input').focus();
	
	//listeners
	
	//
	
	window.addEventListener('keydown', keydownhandle);
	window.addEventListener('keyup', keyuphandle);
	window.addEventListener('resize', windowresizehandle);
	canvas.addEventListener('mousedown', mousedownhandle);
	canvas.addEventListener('mouseup', mouseuphandle);
	canvas.addEventListener('mouseleave', mouseleavehandle);
	canvas.addEventListener('mouseenter', mouseenterhandle);
	window.addEventListener('dblclick', dblclickhandle);
	document.addEventListener('pointerlockchange', lockmousechangehandle, false);
	document.addEventListener('mozpointerlockchange', lockmousechangehandle, false);
	document.addEventListener('webkitpointerlockchange', lockmousechangehandle, false);
	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
	chatForm.onsubmit = function(e){
		e.preventDefault();
		if (chatInput.value){
			socket.emit('sendMsgToServer', chatInput.value);
			chatInput.value = '';
		}
		
	}
	passform.onsubmit = function(e){
		e.preventDefault();
		passInput = document.getElementById('pass-input');
		if (passInput.value){
			socket.emit('passwordInput', passInput.value);
			passInput.value = '';
		}
		
	}
	//object creation
		//batch creation
	
		//single creation
	var grid = new THREE.GridHelper(10, .5);
	
	
	
	
	
	//console.log(UI.objects.healthBar.position);
	
	
	//stats
	playerStats.hp = {now : 100, max : 100};
	
	//weapon
	laser.object = new THREE.Object3D()
	laser.beam = new THREE.Mesh(
		new THREE.CylinderGeometry( 0.05, 0.05, 1 ),
		new THREE.MeshBasicMaterial( {color: 0xffff00, transparent : true, opacity : 0.8} )
	);
	laser.beam.rotation.x = Math.PI/2;
	laser.beam.position.z = 0.5;
	laser.beam.visible = false;
	laser.object.add(laser.beam);
	
	//scene.add(laser.object);
	
	floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshPhongMaterial({color : 0x111111})).rotateX(-Math.PI/2);
	scene.add(floor);
	
		//filming
	camera.up = new THREE.Vector3(0,1,0);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//camdist = box.position.clone().sub(camera.position);
		//lighting
	var ambientlLight = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambientlLight);
	
	var pointLightPositions = [[-10,10,-10],
							   [10, 10, -10], [-10, 10, 10],
							   [10,10,10]];
	sideLights = new THREE.Object3D();
	for (var i = 0; i < pointLightPositions.length; i++){
		var pointLight = new THREE.PointLight(0xffffff, 1.5, 30);
		pointLight.position.set(pointLightPositions[i][0],
								pointLightPositions[i][1],
								pointLightPositions[i][2]);
		
		sideLights.add(pointLight);
	}
	scene.add(sideLights);
	
	
	//THIS is for use later if needed//
	
	/* var manager = new THREE.LoadingManager();
	manager.onLoad = function () {
		console.log( 'all loaded =>' );
		
	}; */
	
	
	//web
	socket.on('init', function(playerinit){
		if (playerinit.status){
			userId = playerinit.id;
			serverFPS = playerinit.fps;
			createPlayer(playerinit);
			player = PLAYERS_LIST[userId];
			player.add(camera);
			player.add(laser.object);
			hex = player.material.color.getHex();
			
			
			//scene.add(grid);
			
			document.getElementById('password').style.display = 'none';
			document.getElementById('chat-items').style.display = '';
			
			HUD.healthBar.visible = true;
			
			// JUST LOCK MY SHIT UP FAM
			//pointerLock();
			
			canvas.addEventListener('mousemove', mousemovehandle);
		
			socket.on('recieveDamage', recieveDamage);
			socket.on('serverInfo', handlePlayerInfo);
			socket.on('deleteinfo', deletePlayer);
			socket.on('clearChat', clearChat);
			socket.on('addToChat', function(data){
					chatText.innerHTML += '<div>' + data.words + '</div>';
					chatText.lastChild.scrollIntoView();
			});
			
			isUpdate = true;
			isFocus = true;
			
			socket.emit('mouseLockCheck', null);
			
			
			
		}else{
			document.getElementById('pass-status').innerHTML = ' INCORRECT';
		}
		
	});
	
	
}

//web
function clearChat(option){
	var myNode = document.getElementById("chat-text");
	while (myNode.lastChild && myNode.lastChild.id != '') {
		myNode.removeChild(myNode.lastChild);
	}
}
function getClientUpdateData(){
	return { 
		position : { 
			x : player.position.x,
			y : player.position.y,
			z : player.position.z 
		},
		hex : hex
	}
}
function deletePlayer(delInfo){
	scene.remove(PLAYERS_LIST[delInfo.id]);
	delete PLAYERS_LIST[delInfo.id];
	console.log(delInfo.id, 'disconnected');
	updatePlayerCount();
}

function handlePlayerInfo(PLAYERS_LISTdata){
	
	for (var i in PLAYERS_LISTdata){
		var p = PLAYERS_LISTdata[i];
		if (!PLAYERS_LIST[i]) {
			createPlayer(p);
		}
		if (p.id != userId){
			PLAYERS_LIST[i].position.set(p.position.x, 
										p.position.y, 
										p.position.z);
			PLAYERS_LIST[i].material.color.setHex(p.hex);
		}
			
	}
	socket.emit('clientInfo', getClientUpdateData() );
	
	
}

//changers
HUD.setPosition = function(obj, x,y,z){
	var xx = x || 0.5,
		yy = y || 0.5,
		zz = z || -5;
	obj.position.set(HUD.left + xx * -HUD.left*2,
					 HUD.top + yy * -HUD.top*2,
					 zz);
}

HUD.updateCursor = function(){
	HUD.cursor.position.setY(HUD.top + HUD.top * -2 * (-mouse.y + 1)/2  );
}


function togglePointerLock(){
	var havePointerLock = 	'pointerLockElement' in document ||
							'mozPointerLockElement' in document ||
							'webkitPointerLockElement' in document;
	if (havePointerLock){
		if(!isMouseLock){
			isMouseLock = true;
			var element = document.body;
			element.requestPointerLock = element.requestPointerLock ||
											 element.mozRequestPointerLock ||
											 element.webkitRequestPointerLock;
			element.requestPointerLock();
			
		}else{
			isMouseLock = false;
			document.exitPointerLock = document.exitPointerLock ||
						   document.mozExitPointerLock ||
						   document.webkitExitPointerLock;
			document.exitPointerLock();
			
		}
	}
	
}

function pointerLock(){
	var havePointerLock = 	'pointerLockElement' in document ||
							'mozPointerLockElement' in document ||
							'webkitPointerLockElement' in document;
	if (havePointerLock){
		
		canvas.addEventListener('click', mouseclicklock);
		//canvas.click();
		//canvas.addEventListener('mousemove', mousemovehandle);
		
		
	}else{
		canvas.addEventListener('mousemove', mousemovehandle);
		
		socket.on('recieveDamage', recieveDamage);
		socket.on('serverInfo', handlePlayerInfo);
		socket.on('deleteinfo', deletePlayer);
		socket.on('clearChat', clearChat);
		socket.on('addToChat', function(data){
				chatText.innerHTML += '<div>' + data.words + '</div>';
				chatText.lastChild.scrollIntoView();
		});
		
		isUpdate = true;
		isFocus = true;
		
		socket.emit('mouseLockCheck', null);
	}
}


function wasted(){
	socket.removeAllListeners('recieveDamage');
	socket.removeAllListeners('serverInfo');
	socket.removeAllListeners('deleteinfo');
	socket.removeAllListeners('clearChat');
	socket.removeAllListeners('addToChat');
	socket.emit('gotWasted', {type : 'has died'});
	location.reload();
	
}

function recieveDamage(data){
	var weaponDamage = data.weaponDamage || 0;
	playerStats.hp.now = clamp(playerStats.hp.now - data.weaponDamage, 0.001, playerStats.hp.max);
	HUD.healthBar.scale.x = playerStats.hp.now/playerStats.hp.max;
	if (playerStats.hp.now < 0.002){
		wasted();
	}
}
function updatePlayerCount(){
	var count  = Object.keys(PLAYERS_LIST).length;
	document.getElementById('player-count').innerHTML = 'player count: '+count;
}
function look(){
	player.rotation.y = transition(player.rotation.y, -Math.PI * mouse.x);
	camera.rotation.x = transition(camera.rotation.x, Math.PI/2 * mouse.y/6 - 0.5);
}
function lockLook(){
	var speed = 100;
	player.rotation.y = transition(player.rotation.y, player.rotation.y - relMouse.x/ speed );
	camera.rotation.x = clamp(camera.rotation.x - relMouse.y / (speed*10), -Math.PI/5, -Math.PI/10) ;
}


function transition(now, after, options){
	
	var options = options || {},
		min = options.min || 0.005,
		step = options.step || 10;
	if (Math.abs(now -after) > min){
		return now - (now - after)/step;
	}else {return after;}
}
	


//makers
function createPlayer(p){
	var boxGeom	= new THREE.BoxGeometry( 1,1,1 );
	var boxMat = new THREE.MeshLambertMaterial( { color: p.hex || randomColor({ hue : 'random',  luminosity : 'bright'}) } );
	var obox = new THREE.Mesh(boxGeom, boxMat );
	obox.socketId = p.id;
	obox.position.set(p.position.x, p.position.y, p.position.z);
	PLAYERS_LIST[p.id] = obox;
	console.log(p.id, 'connected');
	updatePlayerCount();
	scene.add(obox);
}
function getArray(listObj){
	var arr = new Array();
	for (var i in listObj){
		arr.push(listObj[i]);
	}
	return arr;
}
//movers




function jumper(keydown){
	
	if (jump.ready && keydown && jump.power.now < jump.power.max && isFocus){
		jump.power.now += jump.power.add;
		var percent = (jump.power.now / jump.power.max);
		//player.scale.y = 0.75 + 0.25 - 0.25 * percent;
		//player.position.y = 0.5 - 0.125*percent;
	}else if (!keydown && jump.ready && isFocus){
		jump.ready = false;
		//player.scale.y = 1;
		//player.position.y = 0.5;
	}else if (!isFocus && jump.ready){
		jump.power.now = 0;
		//player.scale.y = 1;
		//player.position.y = 0.5;
	}else if (!jump.ready){
		player.position.y += (jump.power.now - gravity);
		jump.power.now -= jump.power.add;
		if (player.position.y < 0.5){
			player.position.y = 0.5;
			jump.ready = true;
			jump.power.now = 0;
		}
	}
	
}

function playerMove(amt){
	if (keyState[keys.w]){
		player.translateZ(-amt);
	}if (keyState[keys.s]){
		player.translateZ(amt);
	}if (keyState[keys.a]){
		player.translateX(-amt);
	}if (keyState[keys.d]){
		player.translateX(amt);
	}
}
function updateCamera(){
	camera.position.set(player.position.x ,
						player.position.y + 5,
						player.position.z + 5);
}
	//clamps
function playerClamp(){
	player.position.x = clamp(player.position.x, -10, 10);
	player.position.z = clamp(player.position.z, -10, 10);
}
function clamp(now, min, max){
	if (now > max){
		return max;
	}else if (now < min){
		return min;
	}else return now;
}
	//collisions


//event handlers
function pointerlockerror(){
	console.log('pointer lock error');
	canvas.addEventListener('mousemove', mousemovehandle);
}
function lockmousemovehandle(e){
	relMouse.x = e.movementX ||
				  e.mozMovementX  ||
				  e.webkitMovementX ||
				  0,
	relMouse.y = e.movementY ||
			  e.mozMovementY ||
			  e.webkitMovementY||
			  0;
	lockLook();
	
	
}
function keyuphandle(e){
	keyState[e.keyCode] = false;
}
function keydownhandle(e){
	keyState[e.keyCode] = true;
	if (e.keyCode == keys.l){
		togglePointerLock();
	}
	
}
function lockmousechangehandle(){
	if (isMouseLock){
		console.log('mouse is locked'); //kind of counterintuitive see: mouseclicklock()
		
		
		//window.addEventListener('click', mouseclickhandle);
		document.addEventListener('mousemove', lockmousemovehandle);
		document.addEventListener('mousedown', mousedownhandle);
		document.addEventListener('mouseup', mouseuphandle);
	}else{
		console.log('mouse is not locked');
		isMouseLock = false;
		document.removeEventListener('mousemove', lockmousemovehandle);
		document.removeEventListener('mousedown', mousedownhandle);
		document.removeEventListener('mouseup', mouseuphandle);
		canvas.addEventListener('mousemove', mousemovehandle);
		
	}
}
function mousemovehandle(e){
	//normalize mouse
	mouse.x = (e.clientX / width) * 2 -1;
    mouse.y = -(e.clientY / height) * 2 + 1;	
}
function mouseleavehandle(e){}
function mouseenterhandle(e){}
function dblclickhandle(e){
	e.preventDefault();
}
function mouseclicklock(e){
	var element = document.body;
	element.requestPointerLock = element.requestPointerLock ||
									 element.mozRequestPointerLock ||
									 element.webkitRequestPointerLock;
	element.requestPointerLock();
	
	
	
	
}
function mouseclickhandle(e){
	if (e.target == canvas){
		isFocus = true;
	}else {isFocus = false};
}
function windowresizehandle(){
	width = window.innerWidth, height = window.innerHeight;
	renderer.setSize(window.innerWidth , window.innerHeight)
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	chatText.style.width = Math.min(500, window.innerWidth).toString() + 'px';
	chatInput.style.width = Math.min(500, window.innerWidth).toString() + 'px';
	
}	
function mousedownhandle(e){
	if (isFocus){
		//laser.object.lookAt()
		var v = isMouseLock ? new THREE.Vector2(0,0) : new THREE.Vector2(0,mouse.y);
		caster.setFromCamera(v , camera); 
		//caster.setFromCamera(mouse, camera); 
		var collisions = caster.intersectObjects(getArray(PLAYERS_LIST));
		if (collisions.length > 0 ){
			//console.log(collisions[0].distance);
			//laser.object.position.copy(player.position);
			laser.beam.visible = true;
			player.worldToLocal(collisions[0].point);
			laser.object.scale.z = collisions[0].point.length();
			laser.object.lookAt(collisions[0].point);
			socket.emit('doDamage', {id : collisions[0].object.socketId});
			//lookAt_byParent(laser.object, player, collisions[0].point);
		}
		
	}
}
function mouseuphandle(e){
	if (isFocus){
		laser.beam.visible = false;
		
	}
}
	//obj event



function update() {
	if (isFocus){
		playerMove(0.1);
		playerClamp();
		if (!isMouseLock && !isPhoneControl) {
			look();
		}
		if (isPhoneControl){
			phoneControls.update();
		}
		HUD.updateCursor();
		
	}
	jumper(keyState[keys.space]);
	
	//UI.objects.healthBar.rotateX(0.05);
	//updateCamera();
	//laser.object.lookAt(player.position);
	
	/* for (var i in PLAYERS_LIST){
		p = PLAYERS_LIST[i];
		p.rotation.y += 0.01;
	} */
}
function animate() {
	if (isUpdate &&  !gameover && !isPause) update();
	renderer.clear();
	renderer.render( scene, camera);
	renderer.clearDepth();
	renderer.render(HUD.scene, HUD.camera);
	requestAnimationFrame(animate);
}	
init();
animate();
}

