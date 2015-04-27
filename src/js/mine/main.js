/*
@todo add leader functional
@todo improve dashb : 0-vals, touch, bool, box-/world-size, fog
@todo add switch to simple birdlike struct in dashboard (like a flapping book)
@todo fix the issue with shimmed modules being undefined (THREE.Orbitcont)-happends like half of the time-timing issue?
@todo add tests (try qUnit?)
*/


/** @name Main */
require.config({
    baseUrl: 'src/js/theirs',
    paths: {
        jquery: 'jquery-1.11.2'
    },
    shim: {
        three: {
            exports: 'THREE'
        },
        Detector: {
          exports: "Detector"
        },
        Stats: {
          exports: "Stats"
        },
        OrbitControls: {
          deps: ["THREE"],
          exports: "THREE.OrbitControls"
        }
    }
});

require(
  ["jquery",
  "Stats",
  "three",
  "Detector",
  "../mine/settings",
  "../mine/boid",
  "../mine/flock",
  "OrbitControls",
  "jquery-ui"],
  function(
    $,
    Stats,
    THREE,
    Detector,
    Settings,
    Boid,
    Flock
  ){
  'use strict';

  /**
 * Main module.
 * @module Main: Boids
 is an artificial life program, developed by Craig Reynolds in 1986, which simulates the flocking behaviour of birds.
 His paper on this topic was published in 1987 in the proceedings of the ACM SIGGRAPH conference.
 The name "boid" corresponds to a shortened version of "bird-oid object", which refers to a bird-like object.
 Its pronunciation evokes that of "bird" in a stereotypical New York accent.
 */

  // these are used by msany methods, fro required modules,
  // hence like this ("semi global") not passed around
  var scene, flock, runningRAF, renderer, camera, stats;


  /**
   *  The dashboard is the panel with sliders that control setting.
   * It goes through the settings object and creates controls
   */
  var setupDashboard = function()
  {
    $("#settings_div").draggable();

    var aRow = $("#settings_div");
    var aDiv;
    var aSlider;
    var aSpan;
    var anotherSpan;
    var settingPropNames = Object.getOwnPropertyNames(Settings);
    var aVal; // temp

    var changeVal = function(event, ui){
      this.parentElement.children[1].innerHTML = ui.value;
      Settings[this.settingName] = ui.value;
    };

    for (var i = 0; i < settingPropNames.length; i++) {
      aVal = Settings[settingPropNames[i]];
      if(typeof aVal === "number")
      {
        aDiv = document.createElement("div");
        aSpan = document.createElement("span");
        aSpan.innerHTML = settingPropNames[i];
        aDiv.appendChild(aSpan);
        anotherSpan = document.createElement("span");
        anotherSpan.innerHTML = aVal;
        anotherSpan.className = "val-span";

        aDiv.appendChild(anotherSpan);
        aSlider = document.createElement("div");
        aSlider.settingName = settingPropNames[i];

        $(aSlider).slider(
          {
            value:aVal,
            min: 0,
            max:(  aVal===0?1.0:(aVal*2.0) ),
            step:aVal/10.0,
            change:changeVal
          });
        aDiv.appendChild(aSlider);
        aRow[0].appendChild(aDiv);
      }
    }

    $("#addBoidsbutton").click(
      function(){
        addSomeBoids();
    });

    $("#clearBoidsbutton").click(function(){
      flock.boids=[];
      scene.children = scene.children.filter(function(element){
        return element.type!=="Mesh";
      }); // filters out all meshes, only leaving the grid as child of stage
    });
  };


  /**
   * Used for FPS calc and visualization
   */
  var setupStats = function()
  {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );
  };


  /**
   * Main setup, calls other setups and inits THREE objects
   *
   */
  var setup = function()
  {
    setupDashboard();

    setupStats();

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement ); // adds a canvas

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      Settings.camera_fov,
      window.innerWidth / window.innerHeight,
      Settings.camera_near_distance,
      Settings.camera_far_distance
    );


    flock = new Flock();

    /** @TODO: test some lighting */
    // light = new THREE.DirectionalLight( 0xffffff );
    // light.position.set( 1, 1, 1 );
    // scene.add( light );

    // light = new THREE.DirectionalLight( 0x002288 );
    // light.position.set( -1, -1, -1 );
    // scene.add( light );

    // light = new THREE.AmbientLight( 0x222222 );
    // scene.add( light );


    /** @TODO: test fog... */
    // scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );


    if(Settings.grid_add)
    {
      var grid = new THREE.GridHelper(Settings.grid_side_length, Settings.grid_spacing);
      scene.add(grid);
    }


    // intersection cube is used for mapping out the points in 3d space where
    // the user add boids (when using mouse right click)
    // it's done by projection from the camera (I guess it's kind of like
    // ray tracing)
    var intersectionCube = getCube(400, 200, 0.1);
    intersectionCube.position.z=-40;
    intersectionCube.visible = Settings.debug.intersection_cube_visible;
    scene.add(intersectionCube);

    /** @todo fix: sometimes OrbitControls is undefined, why?
     * I tried
     *  reuiring it seperately when undefined- no dice...
     *  decoupling (having a method get called in top require)
     *    even added a timeout in this call
     *  ..didn't work either
     * it still feels like a timing issue though, since it works like half
     * of the times
     * */
    /** The orbit controls allows for moving around and zooming using the mouse */
    var controls = new THREE.OrbitControls( camera , renderer.domElement);
    controls.noPan = true; // right mouse only adds objects


    // set starting position and zoom
    camera.rotation.x = Settings.camera_rotation_x;
    camera.position.x = Settings.camera_position_x;
    camera.position.y = Settings.camera_position_y;
    camera.position.z = Settings.camera_position_z;



    // catch right click (user places boid)
    $("body").on("mouseup", function(event){

      if(event.which===3)
      {
        prepIntersectionCube(intersectionCube); // it needs and init/reset
        // unprojected points are the intersectpoints
        var unprojected = getIntersectWorldCoordinates (
          event,
          (Settings.grid_add && Settings.grid_intersect_with)?
            [intersectionCube,grid]
            :
            [intersectionCube]
        );
        if(unprojected) // checks if any
        {
          addBoid(
            new Boid(
              getPyramid(unprojected.point.x,unprojected.point.y, unprojected.point.z),
              Settings.maxSpeed,
              Settings.maxForce
            )
          );
        }
        event.preventDefault(); //otherwise bubble and control will pick up
      }

    });
  };

  /** extensions */
  THREE.Vector3.prototype.limit = function(max) {
    if (this.length() > max) {
      this.normalize();
      this.multiplyScalar(max);
    }
    return this;
  };

  var render = function () {

      // if already running cancel
      if (runningRAF) {
         window.cancelAnimationFrame(runningRAF);
         runningRAF = undefined;
      }

      runningRAF = requestAnimationFrame( render );////

      flock.run(); // start force computations and movement

      renderer.render(scene, camera);
      stats.update(); // to get FPS
    };

  /**
   * @function prepIntersectionCube
   * init/ resets cube at a z distance from camera
  */
  var prepIntersectionCube = function(intersectionCube)
  {
    intersectionCube.position.set(camera.position.x, camera.position.y, camera.position.z);
    intersectionCube.rotation.setFromQuaternion(camera.getWorldQuaternion());

    /** @todo move these to settings */
    intersectionCube.scale.x = 10;
    intersectionCube.scale.y = 10;
    intersectionCube.translateZ(-20);
  };


  /**
  @param event is mouseevent
  @param intersectionObjects is array of objects to check for ray colissions
  */
  var getIntersectWorldCoordinates = function(event, intersectionObjects)
  {

    var vector = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();


    /*if ( camera instanceof THREE.OrthographicCamera ) {
        vector.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, - 1 ); // z = - 1 important!
        vector.unproject( camera );
        dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
        raycaster.set( vector, dir );
    } else*/ if ( camera instanceof THREE.PerspectiveCamera ) {
        vector.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5); // z = 0.5 important!
        vector.unproject( camera );
        raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
    }

    var intersects = raycaster.intersectObjects ( intersectionObjects, true);
    if(intersects && intersects.length>0)
    {
      return intersects[0]; // if it would to intersect with more objects in its
      // path (the rays path) then we're only interrested in the first one
    }
    else
    {
      return null;
    }
  };

  /**
   * Used for the intersection, could probably have been a plane, dunno
   */
  var getCube = function(w,h,d)
  {
    // width — Width of the sides on the X axis.
    // height — Height of the sides on the Y axis.
    // depth — Depth of the sides on the Z axis
    var geometry = new THREE.BoxGeometry( w,h,d );
    var material = new THREE.MeshBasicMaterial( { color: 0x000088, opacity:0.2 } );
    return new THREE.Mesh( geometry, material );
  };


  /** @function addSomeBoids adds Settings.addsomeboids_count number of boids
   * at random location within bounding box
   */
  var addSomeBoids = function(amount)
  {
    Settings.addSomeBoidsCounter = 0;
    // I dont want all to get added at once, hence the setInterval
    Settings.addSomeBoidsIntervalId = setInterval(
      function()
      {
        if(Settings.addSomeBoidsCounter >= (amount || Settings.addsomeboids_count))
        {
          clearInterval(Settings.addSomeBoidsIntervalId);
        }
        else
        {
          addBoid();
          Settings.addSomeBoidsCounter++;
        }
      },
      Settings.addsomeboids_interval
    );
  };

  /** Needed to nullify rotation offsets */
  var resetRotation = function(geometry)
  {
    geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( Math.PI / 2, Math.PI, 0 ) ) );
  };


  /**
   * @returns a pyramid (a whole THREE.Mesh(geometry AND material)) that is
   * rotation nullified
   *
   * */
  var getPyramid = function(x, y, z)
  {
    var geometry = new THREE.Geometry();

    geometry.vertices.push(new THREE.Vector3(-1*Settings.pyramid_scale_multiplier, 0, 1*Settings.pyramid_scale_multiplier)); //   0   FL
    geometry.vertices.push(new THREE.Vector3(1*Settings.pyramid_scale_multiplier, 0, 1*Settings.pyramid_scale_multiplier)); //    1   FR
    geometry.vertices.push(new THREE.Vector3(1*Settings.pyramid_scale_multiplier, 0, -1*Settings.pyramid_scale_multiplier)); //   2   NL
    geometry.vertices.push(new THREE.Vector3(-1*Settings.pyramid_scale_multiplier, 0, -1*Settings.pyramid_scale_multiplier)); //  3   NR
    geometry.vertices.push(new THREE.Vector3(0, 4*Settings.pyramid_scale_multiplier, 0)); //    4   C

    var bottom1 = new THREE.Face3(0,1,2);
    var bottom2 = new THREE.Face3(0,2,3);
    // bottom.vertices.push(new THREE.Vertex(FL));
    // bottom.vertices.push(new THREE.Vertex(FR));
    // bottom.vertices.push(new THREE.Vertex(NL));
    // bottom.vertices.push(new THREE.Vertex(NR));

    var left = new THREE.Face3(0,2,4);
    var far = new THREE.Face3(0,1,4);
    var right = new THREE.Face3(1,3,4);
    var near = new THREE.Face3(2,3,4);

    geometry.faces.push(bottom1);
    geometry.faces.push(bottom2);
    geometry.faces.push(left);
    geometry.faces.push(far);
    geometry.faces.push(right);
    geometry.faces.push(near);

    resetRotation(geometry);

    var material = Settings.pyramid_material;
    var pyramid = new THREE.Mesh( geometry, material );
    pyramid.position.x = x;
    pyramid.position.y = y;
    pyramid.position.z = z;
    return pyramid;
  };

  /** @description gets a random val thats within the bounding box
    to be used as a x,y,z val for placing a boid
    */
  var getRandomWithinBounds = function()
  {
    return Math.ceil
    (
      (Math.random()*Settings.ok_distance_from_origo*2)-
      Settings.ok_distance_from_origo
    );
  };


  /** @description adds a boid to the flock */
  var addBoid = function(b)
  {
    if(!b) b = new Boid(
      getPyramid(getRandomWithinBounds(),getRandomWithinBounds(), getRandomWithinBounds())
    );
    flock.boids.push(b);
    scene.add(b.mesh);
  };


  // using jq onload to start (setup and render)
  $(function(){
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    setup();
    render();
  });

});
