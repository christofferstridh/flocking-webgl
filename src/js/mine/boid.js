define(["three","../mine/settings"],function (THREE, setting) {

  /**
  @module Boid is the thing that moves, gets affected by
  and affects other boids
  */

  /**
   * @constructor
   */
  var Boid = function (aMesh)
  {
      this.acc = new THREE.Vector3(0,0);
      this.vel = new THREE.Vector3(setting.speedMultiplier * (Math.random()*2-1) ,setting.speedMultiplier * (Math.random()*2-1),setting.speedMultiplier * (Math.random()*2-1));
      this.mesh = aMesh;
      this.maxSpeed = this.vel.length(); // Maximum speed, float
  };


  /**
   * @description get affected by and affect other boids */
  Boid.prototype.run = function(boids)
  {

    if(!setting.debug.no_movement)
    {
      this.flock(boids);
      this.update();
      this.borders();
    }
  };


  /** @description i'm not happy with how they move, they kind of death dance
   * lock each other, that's why I introduced "chaos" :), still not happy
   * hopefully the leader concept will yield better results*/
  Boid.prototype.chaos = function()
  {
    // @todo: make this depend on how aligned it all is ,
    // so a method is needed which calcs some cohesion value
    // (like all distances between each other / nbr of boids)

    if(Math.random()<setting.chaos_probability)
    {
      return new THREE.Vector3(
        setting.speedMultiplier * (Math.random()*2-1) ,
        setting.speedMultiplier * (Math.random()*2-1),
        setting.speedMultiplier * (Math.random()*2-1)
      );
    }
    else return new THREE.Vector3(0,0,0);

  };

    /** @description accumulate a new acceleration each time
     * based on four rules */
   Boid.prototype.flock = function(boids)
   {
      // all expressed as THREE.Vector3
      var sep = this.separate(boids);
      var ali = this.align(boids);
      var coh = this.cohesion(boids);
      var chaos = this.chaos(boids);

      // Arbitrarily weight these forces
      sep.multiplyScalar(setting.separation_weighting);
      ali.multiplyScalar(setting.alignment_weighting);
      coh.multiplyScalar(setting.cohesion_weighting);

      // Add the force vectors to acceleration
      this.acc.add(sep);
      this.acc.add(ali);
      this.acc.add(coh);
      this.acc.add(chaos);
    };



    /** @description updates boid location */
    Boid.prototype.update = function() {

      // Update velocity
      this.vel.add(this.acc);

      // Limit speed
      this.vel.limit(this.maxSpeed);

      var tempPosition =this.mesh.position.clone();
      tempPosition.add(this.vel);

      this.setRotationFromVectorSafe(tempPosition);
      this.mesh.position.set(tempPosition.x, tempPosition.y, tempPosition.z);

      // Reset accelertion to 0 each cycle
      this.acc.set(0,0,0);
    };

    /** @description debug method */
    Boid.prototype.drawAccVector = function() {
      if(this.acc.length()>0)
      {
        var addToScene = this.accVector?false:true;
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        geometry.vertices.push(this.acc.multiplyScalar(2));
        this.accVector = new THREE.Line(geometry, setting.debug.force_vector_material);
        if(addToScene)setting.scene.add(this.accVector);
        this.accVector.position.x = this.mesh.position.x;
        this.accVector.position.y = this.mesh.position.y;
        this.accVector.position.z = this.mesh.position.z;
      }
    };

    /** @description debug method */
    Boid.prototype.drawVelVector = function() {
      if(this.vel.length()>0)
      {
        var addToScene = this.velVector?false:true;
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        geometry.vertices.push(this.vel.multiplyScalar(2));
        this.velVector = new THREE.Line(geometry, setting.debug.force_vector_material);
        if(addToScene)setting.scene.add(this.velVector);
      }
    };

    // @param v is a vector, non normalized, safe, will use clone internally
    Boid.prototype.setRotationFromVectorSafe = function(v)
    {
      var vc = this.vel.clone();
      vc.normalize();

      this.mesh.lookAt(v);
    };

    // @description updates position to bounce of walls of bounding box
    Boid.prototype.borders = function() {
      if (this.mesh.position.x < -setting.ok_distance_from_origo || this.mesh.position.x > setting.ok_distance_from_origo) this.vel.x *= -1;
      if (this.mesh.position.y < -setting.ok_distance_from_origo || this.mesh.position.y > setting.ok_distance_from_origo) this.vel.y *= -1;
      if (this.mesh.position.z < -setting.ok_distance_from_origo || this.mesh.position.z > setting.ok_distance_from_origo) this.vel.z *= -1;
    };



    /** @description The separate function checks for nearby boids
     * and steers away */
    Boid.prototype.separate = function(boids) {

      var desiredseparation = setting.desiredSeparation;
      var sum = new THREE.Vector3(0,0,0);
      var count = 0;

      // For every boid in the system, check if it's too close
      for (var i = 0 ; i < boids.length; i++) {

        var other = boids[i];
        if(other!==this)
        {
          var d = this.mesh.getWorldPosition().distanceTo(other.mesh.getWorldPosition());


          if (d < desiredseparation) {
            // if it's too close then let it get affected by separation

            // Calculate vector pointing away from neighbor
            var diff = this.mesh.getWorldPosition().sub(other.mesh.getWorldPosition());
            diff.normalize(); // need normalized for THREE.Vector3.add
            diff.divideScalar(d); // Weight by distance
            sum.add(diff);
            count++;  // Keep track of how many got affect this boid
          }
        }
      }

      // get the average (which is the force we're interrested in)
      if (count > 0) {
        sum.divideScalar(count*1.0); //*1.0 to get float
      }
      return sum;
    };



    /** @function align
    * @description For every nearby boid in the system, calculate the average velocity
    */
    Boid.prototype.align = function(boids) {
      var sum = new THREE.Vector3(0,0,0);
      var count = 0;

      for (var i = 0 ; i < boids.length; i++) {
        var other = boids[i];
        if(other!==this)
        {
          var d = this.mesh.getWorldPosition().distanceTo(other.mesh.getWorldPosition());

          if ((d > 0) && (d < setting.alignment_neighbordist)) {
            sum.add(other.vel);
            count++;
          }
        }
      }

      if (count > 0) {
        sum.divideScalar(count);
        sum.limit(setting.maxForce);
      }
      return sum;
    };



    // @description for the average location (i.e. center) of all nearby boids,
    // calculate steering vector towards that location
    Boid.prototype.cohesion  = function(boids) {
      var sum = new THREE.Vector3(0,0,0);   // Start with empty vector
      // to accumulate all locations
      var count = 0;

      for (var i = 0 ; i < boids.length; i++) {
        var other = boids[i];
        if(other!==this && other.mesh.position.length()>0)
        {
          var d = this.mesh.getWorldPosition().distanceTo(other.mesh.getWorldPosition()); //loc.distance(loc,other.loc);

          if ((d > 0) && (d < setting.boid_overcome_distance)) {
            sum.add(other.mesh.getWorldPosition()); // Add location
            count++;
          }
        }
      }

      if (count > 0) {
        sum.divideScalar(count);
        // Steer towards the location
        return this.getSteeringVector(sum,setting.cohesion_deccellerate);
      }
      return sum;
    };



    /** @description  calculates a steering vector towards a target
    * Takes a second argument, if true, it slows down as it approaches the target
    * returns THREE.Vector3
    * @param target steer towards this point
    * @param alinear bool do we want a rubber band effect
    */
    Boid.prototype.getSteeringVector = function(target, alinear) {
      var steeringVector;

      // A vector pointing from the location to the target
      var desired = target.clone().sub(this.mesh.getWorldPosition());
      // Distance from the target is the magnitude of the vector, as float
      // - the same as the built in length function
      var d = desired.length();

      // If the distance is greater than 0, calc steeringVectoring (otherwise return zero vector)
      if (d > 0) {
        // Normalize desired
        desired.normalize();
        desired.multiplyScalar(this.maxSpeed);

        if (alinear)
        {
          var bellCurvyProduct = Math.sin((d/setting.boid_overcome_distance)*Math.PI);
          desired.multiplyScalar(bellCurvyProduct*setting.rubberband_effect_multiplier); // This damping is somewhat arbitrary
        }

        steeringVector = desired.limit(this.maxForce);  // Limit to maximum steeringVectoring force

      } else {
        steeringVector = new THREE.Vector3(0,0,0);
      }
      return steeringVector;
    };

    return Boid;
});
