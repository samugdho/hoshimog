
Hoshi.projectiles = {};

Hoshi.Fireball = function(scene, origin, options){
	/* info
	options can have:
		position, vec3
		direction, vec3, normalised
		speed, number
		radius, number
		life, millisecconds
	*/
	var options = options || {};
	var self = {};
	self.damage = 5;
	self.origin = origin;
	self.radius = options.radius || 0.5;
	self.direction = options.direction || new THREE.Vector3(0,0,0);
	self.speed = self.direction.clone().multiplyScalar(options.speed || 0.5);
	//console.log(self.direction);
	self.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(self.radius, self.radius, self.radius),
		new THREE.MeshBasicMaterial({color : 0xffffcc})
	);
	self.mesh.position.copy(options.position || new THREE.Vector3(0,0,0));
	
	self.id = options.id || self.mesh.id;
	self.checkCollision = options.checkCollision || true;
	self.timeout = setTimeout(function(){
		scene.remove(self.mesh);
		delete Hoshi.projectiles[self.id];
	}, options.life || 3000);
	
	scene.add(self.mesh);
	Hoshi.projectiles[self.id] = self;
	return self;
}




Hoshi.updateProjectiles = function(vars){
	//vars NEEDS scene, playerList, caster, socket
	for (var p in Hoshi.projectiles){
		var self = Hoshi.projectiles[p];
		self.mesh.position.add(self.speed);
		
		vars.caster.set(self.mesh.position, self.direction)
		var collisions = vars.caster.intersectObjects(vars.OBSTACLE_LIST);
		if (collisions.length > 0 && collisions[0].distance < self.radius){
			Hoshi.deleteProjectile(self.timeout, vars.scene, self.mesh, self.id)
		}
		
		var collisions = vars.caster.intersectObjects(vars.PLAYERS_LIST);
		
		if (collisions.length > 0 && collisions[0].distance < self.radius){
			Hoshi.deleteProjectile(self.timeout, vars.scene, self.mesh, self.id)
			if (self.checkCollision){
				console.log('hit');
				vars.socket.emit('attack', {
					id : collisions[0].object.socketId, 
					DPS : self.damage
				});
			}	
		}
	}
}

Hoshi.deleteProjectile = function(timeout, scene, mesh, id){
	clearTimeout(timeout);
	scene.remove(mesh);
	delete Hoshi.projectiles[id];
}