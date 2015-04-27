define(["three"],function (THREE) {

  var setting = {};

  setting.placedFirst = false;
  setting.grid_add = true;
  setting.grid_side_length = 100;
  setting.grid_spacing = 10;
  setting.grid_intersect_with = false;

  setting.camera_position_x = 0;
  setting.camera_position_y = 140;
  setting.camera_position_z = 200;
  setting.camera_rotation_x = -0.2*Math.PI;
  setting.camera_fov = 60;
  setting.camera_near_distance = 1;
  setting.camera_far_distance = 1000;

  setting.intersection_cube_distance_divider = 10;
  setting.pyramid_material = new THREE.MeshBasicMaterial( { color: 0x00ff00 , wireframe: true} );
  // To create a pyramid, we use THREE.CylinderGeometry. By its five parameters, we are
    // able to create the geometry of the pyramid (subtype of a cylinder).
    // Parameter 1 'radiusTop': Controls the radius of the upper end of the cylinder. If we
    //                          set to to '0', we have a cone.
    // Parameter 2 'radiusBottom': Controls the radius of the lower end.
    // Parameter 3 'height': Sets the height of the cylinder.
    // Parameter 4 'segments': Number of segments, forming the cylindrical shell. To create
    //                         a pyramid, we choose '4'.
    // Parameter 5 'openEnded': Allows to have open ends ('true') or closed ends ('false')
    //                          of the cylindern. Since the pyramid shall have a bottom
    //                          face, we set it to 'false'.
  //setting.pyramid_geometry = new THREE.CylinderGeometry(0, 8, 24, 3, false); // new THREE.CylinderGeometry(0, 1, 3, 3, false);
  setting.pyramid_scale_multiplier = 2;
  setting.maxForce = 16; // 0.05
  setting.ok_distance_from_origo = 60;

  setting.mesh_rotation_x = 0;//0.01;
  setting.mesh_rotation_y = 0;//0.1;
  setting.mesh_rotation_z = 0;//0.01;
  setting.desiredSeparation = 40.0;
  setting.boid_overcome_distance = 100.0;
  setting.separation_weighting = 5.0;
  setting.cohesion_weighting = 0.8;
  setting.alignment_weighting = 0.2;
  setting.alignment_neighbordist = 60.0;
  setting.addsomeboids_interval = 100; //ms
  setting.addsomeboids_count = 1;//20;
  setting.rotate_offset_pi_rads_x = 2;
  setting.rotate_offset_pi_rads_y = 2;
  setting.rotate_offset_pi_rads_z = 2;
  setting.speedMultiplier = 1;
  setting.cohesion_deccellerate = true; //slows down as it approaches the target
  setting.rubberband_effect_multiplier = 0.2;
  setting.chaos_probability = 0.001;

  setting.debug = {};
  setting.debug.intersection_cube_visible = false;
  setting.debug.no_movement = false;
  setting.debug.force_vector_material = new THREE.LineBasicMaterial( { color: 0xff0000, lineWidth: 1 } );

  return setting;

});
