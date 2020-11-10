import * as PIXI from 'pixi.js';

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const width = 256;
const height = 256;
const app = new PIXI.Application({width: width, height: height, antialias: true});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

app.loader
  .add("assets/bunny.png")
  .load(setup);

function setup() {
  console.log(app.loader.resources);
  const bunny = new PIXI.Sprite(app.loader.resources["assets/bunny.png"].texture);
  app.stage.addChild(bunny);

  app.ticker.add((delta) => {
    bunny.x += 1 + delta;
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
