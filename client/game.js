//to do

//phone stuff--later
//wasted

Hoshi = {};
game = {};
game.start = function(){
	
var stats, scene, renderer, caster, camera, mouse, canvas, socket, userId, FPS = 60, gravity = 0.1, HUD = {}, world = { globe : null, radius : 500},playerRot,
	serverFPS, player, chatText, chatInput, hex, controls, laser = {}, relMouse, isMouseLock = false, phoneControls, DPS, attackTarget,
	box, camdist, clientUpdate, jump, testLight, sideLights, isPhoneControl = false,
	buttons = [], PLAYERS_LIST = {}, floor, playerStats = {}
	isUpdate = false, isPause = false, gameover = false, isFocus = true,
	keyState = new Array(100).fill(false), 
	keys = {w : 87, s : 83, a : 65, d : 68, q : 81, e : 69, space : 32, l : 76};

function init(){
	
	socket = io();
	//setting
	
	
	
	mouse = new THREE.Vector2(0,0);
	mouse.isDown = false;
	relMouse = new THREE.Vector2(0,0);
	caster = new THREE.Raycaster();
	
	scene = new THREE.Scene();
	//var mapHeight = new THREE.TextureLoader().load( "client/bumps2.png" );
	var globeMaterial = new THREE.MeshPhongMaterial({color : 0x777777, emissive : 0x777777, emissiveIntensity : 0.1,/*wireframe : true, /*bumpMap : mapHeight ,displacementMap : mapHeight, displacementScale : 5*/ });
	world.globe = new THREE.Mesh(
		new THREE.SphereGeometry(world.radius,64,64),
		globeMaterial
	);
	scene.add(world.globe);
	
	
	var sun = new THREE.Mesh(
		new THREE.SphereGeometry(50,8,8),
		new THREE.MeshBasicMaterial({color : 0xffffcc})
	);
	scene.add(sun);
	sun.position.set(1000,1000,1000);
	
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
	directionalLight.position.set( 600, 600,600 );
	scene.add( directionalLight );
	var dblue = new THREE.DirectionalLight( 0xffffff, 0.2 );
	dblue.position.set( -600, -600, -600 );
	scene.add( dblue );
	
	
	
	
	
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
	renderer.setClearColor(0xaaaaaa);
	renderer.shadowMap.enabled = true;
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
	HUD.northBar = new THREE.Object3D();
	HUD.northBlock = new THREE.Mesh(
		new THREE.BoxGeometry(10,100,10),
		new THREE.MeshLambertMaterial({color : 0xee0000, emissive: 0xee0000})
	);
	HUD.northBlock.position.z -= 5;
	HUD.scene.add(HUD.northBlock);
	//HUD.scene.add(HUD.northBar);
	
	
	
	HUD.cursor = new THREE.Mesh(
		new THREE.PlaneGeometry(10,10),
		new THREE.MeshLambertMaterial({color : 0x000000, emissive: 0xffffff, transparent : true, opacity : 0.5})
	);
	HUD.setPosition(HUD.cursor, 0.5, 0.5);
	HUD.scene.add(HUD.cursor);	
	//HUD.cursor.visible = false;
	
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
	canvas.addEventListener('mousemove', mousemovehandle);
	
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
	var nSphere = new THREE.Mesh(
		new THREE.BoxGeometry(15,10005,15),
		new THREE.MeshLambertMaterial({color : 0x770000, emissive : 0x777777, emissiveIntensity : 0.5, transparent : true, opacity : 1})
	);
	nSphere.position.set(0,4501,0);
	scene.add(nSphere);	
		
		
	var grid = new THREE.GridHelper(10, .5);
	
	
	
	
	
	//console.log(UI.objects.healthBar.position);
	
	
	//stats
	playerStats.hp = {now : 100, max : 100};
	playerStats.turn = {now : 0, to : 0};
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
	
	
	
		//filming
	camera.up = new THREE.Vector3(0,1,0);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//camdist = box.position.clone().sub(camera.position);
		//lighting
	var ambientlLight = new THREE.AmbientLight(0xffffff, 0.1);
	scene.add(ambientlLight);
	
	/* var pointLightPositions = [[-10,10,-10],
							   [10, 10, -10], [-10, 10, 10],
							   [10,10,10]]; */
	/* sideLights = new THREE.Object3D();
	for (var i = 0; i < pointLightPositions.length; i++){
		var pointLight = new THREE.PointLight(0xffffff, 1.5, 30);
		pointLight.position.set(pointLightPositions[i][0],
								pointLightPositions[i][1],
								pointLightPositions[i][2]);
		
		sideLights.add(pointLight);
	}
	scene.add(sideLights); */
	
	
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
			playerRot = PLAYERS_LIST[userId];
			playerRot.rotation.set(Math.random(),Math.random(),Math.random());
			player = playerRot.children[0];
			player.add(camera);
			player.add(laser.object);
			hex = player.material.color.getHex();
			
			
			//scene.add(grid);
			
			document.getElementById('password').style.display = 'none';
			document.getElementById('chat-items').style.display = '';
			
			HUD.healthBar.visible = true;
			
			// JUST LOCK MY SHIT UP FAM
			//pointerLock();
			
			
		
			socket.on('recieveDamage', recieveDamage);
			socket.on('serverInfo', handlePlayerInfo);
			socket.on('deleteinfo', deletePlayer);
			socket.on('clearChat', clearChat);
			socket.on('addToChat', function(data){
					chatText.innerHTML += '<div>' + data.words + '</div>';
					chatText.lastChild.scrollIntoView();
			});
			
			socket.on('spawnFireball', handleFireballSpawn);
			
			isUpdate = true;
			isFocus = true;
			
			socket.emit('mouseLockCheck', null);
			
			
			
		}else{
			document.getElementById('pass-status').innerHTML = ' INCORRECT';
		}
		
	});
	
	
}

//web

function handleFireballSpawn(data){
	if (!Hoshi.projectiles[data.id]){
		var f = Hoshi.Fireball(scene, data.socketId, {
			position : new THREE.Vector3().fromArray(data.position), 
			direction : new THREE.Vector3().fromArray(data.direction) , 
			speed : data.speed, 
			life : data.life,
			id : data.id,
			checkCollision : false
		});
	}
	
	
}

function clearChat(option){
	var myNode = document.getElementById("chat-text");
	while (myNode.lastChild && myNode.lastChild.id != '') {
		myNode.removeChild(myNode.lastChild);
	}
}
function getClientUpdateData(){
	return { 
		rotation : playerRot.quaternion.toArray(),
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
			PLAYERS_LIST[i].quaternion.fromArray(p.rotation);
			PLAYERS_LIST[i].children[0].material.color.setHex(p.hex);
		}
			
	}
	socket.emit('clientInfo', getClientUpdateData() );
	
	
}

//changers

HUD.pointNorth = function(){
	var position = player.getWorldPosition(),
		normal = position.negate().normalize(),
		constant = - position.length(),
		plane = new THREE.Plane(normal, constant),
		np = plane.projectPoint(new THREE.Vector3(0,500,0)).setLength(5),
		npwp = player.worldToLocal( np.add( player.getWorldPosition() ) ) ;
		npwp.y = HUD.top - 150;
		npwp.x *= -HUD.left/5;
		npwp.z -= 5;
		HUD.northBlock.position.copy( npwp ) ;

}


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
			HUD.setPosition(HUD.cursor, 0.5, 0.5);
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
	playerStats.hp.now = clamp(playerStats.hp.now - data.DPS , 0.001, playerStats.hp.max);
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
	playerStats.turn.to = -Math.PI * mouse.x;
	var tempNow = playerStats.turn.now;
	playerStats.turn.now = transition(playerStats.turn.now, playerStats.turn.to);
	playerRot.rotateY(playerStats.turn.now - tempNow);
	camera.rotation.x = transition(camera.rotation.x, Math.PI/2 * mouse.y/6 - 0.5);
}
function lockLook(){
	var amt = 150;
	playerRot.rotateY( - relMouse.x/ amt );
	camera.rotation.x = clamp(camera.rotation.x - relMouse.y / (amt*10), -Math.PI/5, Math.PI/2) ;
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

function shoot(){
	var v = isMouseLock ? new THREE.Vector2(0,0) : new THREE.Vector2(0,mouse.y);
	caster.setFromCamera(v , camera); 
	var collisions = caster.intersectObjects(getArray(PLAYERS_LIST));
	if (collisions.length > 0 ){
		var position = player.localToWorld(new THREE.Vector3(0,0,-1)),
			difference = collisions[0].point.sub(position),
			distance = difference.length();
			direction = difference.normalize(),
			speed = .5;
			life = distance/(speed*60)*1000 + 100 ;
		//console.log(distance, speed, direction.clone().multiplyScalar(speed).length() );
		var f = Hoshi.Fireball(scene, userId, {position : position, direction : direction , speed : speed, life : life});
		socket.emit('spawnFireball', {
			position : position.toArray(),
			direction : direction.toArray(),
			speed : 0.5,
			id : f.id,
			life : life
		});
	}
	
	
	
}


function createPlayer(p){
	var boxGeom	= new THREE.BoxGeometry( 1,1,1 );
	var boxMat = new THREE.MeshLambertMaterial( { color: p.hex || randomColor({ hue : 'random',  luminosity : 'bright'}) } );
	var oPlayer = new THREE.Object3D();
	var obox = new THREE.Mesh(boxGeom, boxMat );
	obox.position.y = world.radius + 0.5;
	
	//oPlayer.quaternion.fromArray(p.rotation);
	
	obox.socketId = p.id;
	PLAYERS_LIST[p.id] = oPlayer;
	console.log(p.id, 'connected');
	updatePlayerCount();
	oPlayer.add(obox);
	scene.add(oPlayer);
	
}
function getArray(listObj){
	var arr = new Array();
	for (var i in listObj){
		arr.push(listObj[i].children[0]);
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
		playerRot.rotateX(-amt);
	}else if (keyState[keys.s]){
		playerRot.rotateX(amt);
	}
	if (keyState[keys.a]){
		playerRot.rotateZ(amt);
	}else if (keyState[keys.d]){
		playerRot.rotateZ(-amt);
	}
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
	
	//mouseMoveInAttack();
	
	
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
	if(!keyState[keys.l]){
		isMouseLock = false;
	}
	if (isMouseLock){
		console.log('mouse is locked'); 
		
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
	
	//mouseMoveInAttack();

}


function mouseMoveInAttack(){
	if (mouse.isDown){
		var v = isMouseLock ? new THREE.Vector2(0,0) : new THREE.Vector2(0,mouse.y);
		caster.setFromCamera(v , camera);
		var collisions = caster.intersectObjects(getArray(PLAYERS_LIST));
		if (collisions.length > 0 ){
			laser.beam.visible = true;
			player.worldToLocal(collisions[0].point);
			laser.object.scale.z = collisions[0].point.length();
			laser.object.lookAt(collisions[0].point);
			if (!attackTarget){
				socket.emit('attack', {id : collisions[0].object.socketId, DPS : 10});
				attackTarget = collisions[0].object.socketId;
			} else if (attackTarget != collisions[0].object.socketId){
				socket.emit('attack', {id : collisions[0].object.socketId, DPS : 10});
				socket.emit('attack', {id : attackTarget, DPS : -10});
				attackTarget = collisions[0].object.socketId;
			}
			
			//lookAt_byParent(laser.object, player, collisions[0].point);
		}else{
			if (attackTarget){
				socket.emit('attack', {id : attackTarget, DPS : -10});
				attackTarget = null;
			}
		}
	}
	
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
	shoot();
	mouse.isDown = true;
	
	/* if (isFocus){
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
			socket.emit('attack', {id : collisions[0].object.socketId, DPS : 10});
			attackTarget = collisions[0].object.socketId;
			//lookAt_byParent(laser.object, player, collisions[0].point);
		}
		
	} */
}
function mouseuphandle(e){
	mouse.isDown = true;
	/* if (isFocus){
		laser.beam.visible = false;
		if (attackTarget){
			socket.emit('attack', {id : attackTarget, DPS : -10});
			attackTarget = null;
		}
		
		
	} */
}
	//obj event



function update() {

	if (isFocus){
		playerMove(0.001);
		
		//playerClamp();
		if (!isMouseLock && !isPhoneControl) {
			look();
			HUD.updateCursor();
		}
		if (isPhoneControl){
			//phoneControls.update();
		}
		
		HUD.pointNorth();
		
	}
	Hoshi.updateProjectiles({
		scene : scene,
		PLAYERS_LIST : getArray(PLAYERS_LIST),
		caster : caster,
		socket : socket
	});
	//console.log(playerRot.quaternion);
	//jumper(keyState[keys.space]);
	//console.log(playerRot.quaternion);
	
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

