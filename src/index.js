"use strict";

import * as PIXI from 'pixi.js';

import('@dimforge/rapier2d').then(RAPIER => {
  window.RAPIER = RAPIER;
  window.RAPIER_GRAVITY = new RAPIER.Vector2(0.0, 0.0);//-9.81);
  window.RAPIER_WORLD = new RAPIER.World(window.RAPIER_GRAVITY);

  app.loader
    .add([
      "assets/bunny.png",
      "assets/player.png",
      "assets/player-stick.png",
    ])
    .load(setup);
})

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const width = 800;
const height = 800;
const app = new PIXI.Application({width: width, height: height, antialias: true});
var stepSliderControl = null;
var stepSliderLabel = null;

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

// TODO: Get by id instead.
const canvas = document.getElementsByTagName("canvas")[0];

// mousePos is created the first time the user moves their mouse over
// the canvas.
var mousePos;

canvas.addEventListener('mousemove', function(evt) {
  var rect = canvas.getBoundingClientRect();
  if (!mousePos) {
    mousePos = { x: 0, y: 0 };
  }
  mousePos.x = evt.clientX - rect.left;
  mousePos.y = evt.clientY - rect.top;
});

class Sprite {
  constructor(assetPath) {
    this.sprite = new PIXI.Sprite(app.loader.resources[assetPath].texture);
    app.stage.addChild(this.sprite);
  }

  delete() {
    app.stage.removeChild(this.sprite);
    this.sprite = null;
  }
}

class Player {
  constructor() {
    this._player = new Sprite("assets/player.png");
    this._stick = new Sprite("assets/player-stick.png");
    this._stick_y_offset = 2;
    this._player.sprite.x = 100;
    this._player.sprite.y = 100;
    this.setStick();
  }

  setStick() {
    this._stick.sprite.x = this._player.sprite.x + this._player.sprite.width / 2;
    this._stick.sprite.y = this._player.sprite.y + this._stick_y_offset;
  }

  rotateStickTo(x, y) {
    const rads = Math.atan2(
      y - this._stick.sprite.y,
      x - this._stick.sprite.x);

    this._stick.sprite.rotation = rads;
  }

  delete() {
    this._player.delete();
    this._stick.delete();
  }
}

class Bunny {
  constructor(x, y) {
    this.bunny = new Sprite("assets/bunny.png");
    this.rigidBodyDesc = new window.RAPIER.RigidBodyDesc(window.RAPIER.BodyStatus.Dynamic)
      .setTranslation(new window.RAPIER.Vector2(x, y));
    this.rigidBody = window.RAPIER_WORLD.createRigidBody(this.rigidBodyDesc);
    this.colliderDesc = window.RAPIER.ColliderDesc.cuboid(12.5, 12.5)
      .setDensity(2.0);
    this.collider = window.RAPIER_WORLD.createCollider(this.colliderDesc, this.rigidBody.handle);
    let impulse = new window.RAPIER.Vector2(35000, 17000);
    this.rigidBody.applyImpulse(impulse, true);
    window.has_gravity.push(this);
    // bunnies are not generally a source of gravity, feel free to turn it on if you want to experiment though
    //window.gravity_source.push(this);
    //this.gravity = -5000000;
    window.has_collision.push(this);
  }

  physics_update() {
    let bunny_position = this.rigidBody.translation();
    this.bunny.sprite.x = bunny_position.x;
    this.bunny.sprite.y = bunny_position.y;
  }

  position() {
    return this.rigidBody.translation();
  }

  get_collider() {
    return this.collider;
  }

  receive_gravity(force) {
    this.rigidBody.applyForce(force, true);
  }

  // experimental code, feel free to delete
  apply_gravity() {
    const sun_pos = this.position();
    for (const gravity_obj of window.has_gravity) {
      if (gravity_obj === this) {
        continue;
      }
      const obj_pos = gravity_obj.position();

      const dist_x = obj_pos.x - sun_pos.x;
      const dist_y = obj_pos.y - sun_pos.y;
      const dist_magnitude_squared = (dist_x * dist_x) + (dist_y * dist_y);

      const magnitude = dist_magnitude_squared;
      const inv_mag = 1 / dist_magnitude_squared;

      const direction_to_sun_x = dist_x / magnitude;
      const direction_to_sun_y = dist_y / magnitude;

      const force = new window.RAPIER.Vector2(direction_to_sun_x * this.gravity * inv_mag,
                                              direction_to_sun_y * this.gravity * inv_mag);
      gravity_obj.receive_gravity(force);
    }
  }
  delete() {
    window.RAPIER_WORLD.removeCollider(this.collider);
    this.collider = null;
    window.RAPIER_WORLD.removeRigidBody(this.rigidBody);
    this.rigidBody = null;
    this.rigidBodyDesc = null;
    this.colliderDesc = null;
    // TODO: REMOVE FROM `has_gravity` and other component arrays!!
    this.bunny.delete();
    this.bunny = null;
  }
}

class Sun {
  constructor() {
    this.sun = new Sprite("assets/bunny.png");
    this.rigidBodyDesc = new window.RAPIER.RigidBodyDesc(window.RAPIER.BodyStatus.Static)
      .setTranslation(new window.RAPIER.Vector2(height / 2, width / 2));

    // Position sun in the center of the screen
    this.sun.sprite.y = height / 2;
    this.sun.sprite.x = width / 2;

    // The sun is a Rapier rigid body
    this.rigidBody = window.RAPIER_WORLD.createRigidBody(this.rigidBodyDesc);
    // ... with cuboid collision geometry
    this.colliderDesc = window.RAPIER.ColliderDesc.cuboid(12.5, 12.5)

    // What is density for?
        .setDensity(1000.0);
    this.collider = window.RAPIER_WORLD.createCollider(this.colliderDesc, this.rigidBody.handle);
    this.gravity = -590000000.8;
    window.gravity_source.push(this);
    window.has_collision.push(this);
  }

  position() {
    return this.rigidBody.translation();
  }

  get_collider() {
    return this.collider;
  }

  apply_gravity() {
    const sun_pos = this.position();
    for (const gravity_obj of window.has_gravity) {
      if (gravity_obj === this) {
        continue;
      }
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

  delete() {
    window.RAPIER_WORLD.removeCollider(this.collider);
    this.collider = null;
    window.RAPIER_WORLD.removeRigidBody(this.rigidBody);
    this.rigidBody = null;
    this.rigidBodyDesc = null;
    this.colliderDesc = null;
    // TODO: REMOVE FROM component arrays if/when in them!!
    this.sun.delete();
  }
}

function rotate_stick(player) {
  if (!mousePos) {
    return;
  }
  player.rotateStickTo(mousePos.x, mousePos.y);
}

// Per-step physics logic adjusted by delta
// TODO: actually adjust by delta
function run_physics(delta) {
    var stepval = stepSliderControl.value;
    var i;
    for (i = 0; i < stepval; i++) {
        for (const gravity_src_obj of window.gravity_source) {
          gravity_src_obj.apply_gravity();
        }
        for (const gravity_obj of window.has_gravity) {
          gravity_obj.physics_update();
        }

        // TOOD: investigate if this should come at the start or end of this function...
        // likely to interact with user input
        window.RAPIER_WORLD.step();
    }
}

function draw_debug_collision() {
  // HACK: destroy everything and do it again...
  // because this is debug code, it's probably fine, if it's too slow to use, then we can figure out how to
  // manage the lifetimes of the `graphics` objects betterjj
  // TODO: fix this code (don't remove the hack, just make the hack actually work...)
  app.stage.removeChild(window.DEBUG_DISPLAY_COLLISION_CONTAINER);
  //window.DEBUG_DISPLAY_COLLISION_CONTAINER.destroy();
  window.DEBUG_DISPLAY_COLLISION = new PIXI.Container();
  app.stage.addChild(window.DEBUG_DISPLAY_COLLISION_CONTAINER);

  for (const collidable of window.has_collision) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFF3300);

    let collider = collidable.get_collider();
    let position = collider.translation()
    switch (collider.shapeType()) {
      case window.RAPIER.ShapeType.Cuboid:
        let extents = collider.halfExtents();
        let width = extents.x * 2;
        let height = extents.y * 2;
        let x = position.x;
        let y = position.y;
        graphics.drawRect(x, y, width, height);
        window.DEBUG_DISPLAY_COLLISION_CONTAINER.addChild(graphics);
        break;
      case window.RAPIER.ShapeType.Ball:
      case window.RAPIER.ShapeType.Capsule:
      case window.RAPIER.ShapeType.HeightField:
      case window.RAPIER.ShapeType.Polygon:
      case window.RAPIER.ShapeType.Triangle:
      case window.RAPIER.ShapeType.Trimesh:
        console.warn("Debug collision not implemented for this shape");
        break;
    }

    graphics.endFill();
  }
}

function setupUserControls() {
  stepSliderControl = document.getElementById("stepSlider");
  stepSliderLabel = document.getElementById("stepValue");
  stepSliderControl.oninput = function() {
      stepSliderLabel.innerHTML = stepSliderControl.value;
  }
}

function setup() {
  setup_debug_system();
  window.has_gravity = [];
  window.gravity_source = [];
  window.has_collision = [];

  setupUserControls();
  const bunny1 = new Bunny(200,600);
  const bunny2 = new Bunny(500,250);
  const bunny3 = new Bunny(100,550);
  const bunny4 = new Bunny(800,800);
  const bunny5 = new Bunny(-100,-200);

  // Create sun at the center of the screen
  const sun = new Sun();

  const player = new Player();

  // Main ticker
  app.ticker.add((delta) => {
    rotate_stick(player);
    run_physics(delta);
    if (window.DEBUG_DISPLAY_COLLISION) {
      draw_debug_collision();
    }
  });
}

// DEBUG COMMANDS:
// these are commands intended to be run from the JS console to debug the game

// Initialize variables needed for the debug system.
function setup_debug_system() {
  window.DEBUG_DISPLAY_COLLISION = false;
  window.DEBUG_DISPLAY_COLLISION_CONTAINER = new PIXI.Container();
}
