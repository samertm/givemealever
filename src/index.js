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

  var circle_verts = [];
  var colors = [];
  const NUM_VERTS = 64;
  for (var i = 0; i < NUM_VERTS; ++i ) {
    let percent_of_circle = i / NUM_VERTS;
    let y = Math.sin(percent_of_circle * Math.PI * 2) * 100;
    let x = Math.cos(percent_of_circle * Math.PI * 2) * 100;
    console.log(x, y);
    circle_verts.push(x);
    circle_verts.push(y);
    colors.push(1 * (i / NUM_VERTS));
    colors.push(0);
    colors.push(1 - 1 * (i / NUM_VERTS));
  }
  circle_verts.reverse();

  console.assert(colors.length / 3 == circle_verts.length / 2 && circle_verts.length / 2 == NUM_VERTS);

 const geometry = new PIXI.Geometry()
  .addAttribute('aVertexPosition', // the attribute name
  circle_verts, 2) // x y

  .addAttribute('aColor', // the attribute name
  colors, 3); // r g b

      const shader = PIXI.Shader.from(`

      precision mediump float;
      attribute vec2 aVertexPosition;
      attribute vec3 aColor;
  
      uniform mat3 translationMatrix;
      uniform mat3 projectionMatrix;
  
      varying vec3 vColor;
  
      void main() {
  
          vColor = aColor;
          gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  
      }`,
  
  `precision mediump float;
  
      varying vec3 vColor;
  
      void main() {
          gl_FragColor = vec4(vColor, 1.0);
      }
  
  `);
  



function setup() {
  console.log(app.loader.resources);
  const bunny = new PIXI.Sprite(app.loader.resources["assets/bunny.png"].texture);
  app.stage.addChild(bunny);

const triangle = new PIXI.Mesh(geometry, shader, PIXI.State.for2d, PIXI.DRAW_MODES.TRIANGLE_FAN);

triangle.position.set(100, 200);
triangle.scale.set(1);

app.stage.addChild(triangle);

  app.ticker.add((delta) => {
    console.log(delta);
    bunny.x += 1 + delta;
    triangle.rotation += 0.01;
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
