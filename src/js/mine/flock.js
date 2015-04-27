define(function(){

  /**
   * @module Flock is the structure that "holds" the boids
   * */

  /**
  The current collection of boids is the flock
  @constructor*/
  var Flock = function()
  {
    this.boids=[];
  };

  /** @description only propagates message to boids to start moving */
  Flock.prototype.run = function() {
    for (var i = 0; i < this.boids.length; i++) {
      this.boids[i].run(this.boids);  // Passing the entire list of
      // boids to each boid individually as they all need to get affected
      // by their siblings
    }
  };

  return Flock;
});
