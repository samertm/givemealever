"use strict";

import * as PIXI from 'pixi.js';
import { strict } from 'assert';


import('@dimforge/rapier2d').then(RAPIER => {
  window.RAPIER = RAPIER;
  window.RAPIER_GRAVITY = new RAPIER.Vector2(0.0, 0.0);//-9.81);
  window.RAPIER_WORLD = new RAPIER.World(window.RAPIER_GRAVITY);

  app.loader
   .add("assets/bunny.png")
   .load(setup);
})

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const width = 800;
const height = 800;
const app = new PIXI.Application({width: width, height: height, antialias: true});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

class Bunny {
  constructor(x, y) {
    this.bunny = new PIXI.Sprite(app.loader.resources["assets/bunny.png"].texture);
    this.rigidBodyDesc = new window.RAPIER.RigidBodyDesc(window.RAPIER.BodyStatus.Dynamic)
      .setTranslation(new window.RAPIER.Vector2(x, y));
    this.rigidBody = window.RAPIER_WORLD.createRigidBody(this.rigidBodyDesc);
    this.colliderDesc = window.RAPIER.ColliderDesc.cuboid(12.5, 12.5)
      .setDensity(2.0);
    this.collider = window.RAPIER_WORLD.createCollider(this.colliderDesc, this.rigidBody.handle);
    let impulse = new window.RAPIER.Vector2(15000, 15000);
    this.rigidBody.applyImpulse(impulse, true);
    app.stage.addChild(this.bunny);
    window.has_gravity.push(this);
  }

  physics_update() {
    let bunny_position = this.rigidBody.translation();
    this.bunny.x = bunny_position.x;
    this.bunny.y = bunny_position.y;
  }

  position() {
    return this.rigidBody.translation();
  }

  receive_gravity(force) {
    this.rigidBody.applyForce(force, true);
  }
}

class Sun {
  constructor() {
    this.sun = new PIXI.Sprite(app.loader.resources["assets/bunny.png"].texture);
    this.rigidBodyDesc = new window.RAPIER.RigidBodyDesc(window.RAPIER.BodyStatus.Static)
      .setTranslation(new window.RAPIER.Vector2(height / 2, width / 2));
    this.sun.x = height / 2;
    this.sun.y = width / 2;
    this.rigidBody = window.RAPIER_WORLD.createRigidBody(this.rigidBodyDesc);
    this.colliderDesc = window.RAPIER.ColliderDesc.cuboid(12.5, 12.5)
      .setDensity(1000.0);
    this.collider = window.RAPIER_WORLD.createCollider(this.colliderDesc, this.rigidBody.handle);
    this.gravity = -90000000.8;
    app.stage.addChild(this.sun);
  }

  position() {
    return this.rigidBody.translation();
  }

  apply_gravity() {
    const sun_pos = this.position();
    for (const gravity_obj of window.has_gravity) {
      const obj_pos = gravity_obj.position();

      const dist_x = obj_pos.x - sun_pos.x;
      const dist_y = obj_pos.y - sun_pos.y;
      const dist_magnitude_squared = (dist_x * dist_x) + (dist_y * dist_y);

      const magnitude = Math.sqrt(dist_magnitude_squared);
      const inv_mag = 1 / dist_magnitude_squared;

      const direction_to_sun_x = dist_x / magnitude;
      const direction_to_sun_y = dist_y / magnitude;

      const force = new window.RAPIER.Vector2(direction_to_sun_x * this.gravity * inv_mag,
                                              direction_to_sun_y * this.gravity * inv_mag);
      gravity_obj.receive_gravity(force);
    }
  }
}

function setup() {
  console.log(app.loader.resources);
  window.has_gravity = [];
  
  console.log(window.has_gravity);
  const bunny1 = new Bunny(200,600);
  const bunny2 = new Bunny(500,250);
  console.log(window.has_gravity);
  const sun = new Sun();

  app.ticker.add((delta) => {
    window.RAPIER_WORLD.step();

    sun.apply_gravity();
    for (const gravity_obj of window.has_gravity) {
      gravity_obj.physics_update();
    }
  });
}

// load the texture we need
// app.loader.add('bunny', 'assets/bunny.png').load((loader, resources) => {
//     // This creates a texture from a 'bunny.png' image
//     const bunny = new PIXI.Sprite(resources.bunny.texture);

//     // Setup the position of the bunny
//     bunny.x = app.renderer.width / 2;
//     bunny.y = app.renderer.height / 2;

//     // Rotate around the center
//     bunny.anchor.x = 0.5;
//     bunny.anchor.y = 0.5;

//     // Add the bunny to the scene we are building
//     app.stage.addChild(bunny);

//     // Listen for frame updates
//     app.ticker.add(() => {
//          // each frame we spin the bunny around a bit
//         bunny.rotation += 0.01;
//     });
// });
