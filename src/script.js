import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

/**
 * Debug
 */
const gui = new GUI({
  width: 300,
  title: "Debug",
  closeFolders: true,
});
gui.hide();

document.addEventListener("keydown", (event) => {
  if (event.key === "d" || event.key === "D") {
    if (gui.domElement.style.display === "none") {
      gui.domElement.style.display = "block";
    } else {
      gui.domElement.style.display = "none";
    }
  }
});

const modelTweaks = gui.addFolder("Models");
const animationTweaks = gui.addFolder("Animation");
const cameraTweaks = gui.addFolder("Camera");
const lightsTweaks = gui.addFolder("Lights");
const helpersTweaks = gui.addFolder("Helpers");

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Models
 */
const animations = {
  donut: null,
  beer: null,
};

const gltfLoader = new GLTFLoader();
function loadModel(url, position, scale, rotation, callbacks) {
  gltfLoader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.position.copy(position);
      model.scale.copy(scale);
      if (rotation) model.rotation.y = rotation;
      scene.add(model);

      if (callbacks && typeof callbacks === "function") {
        callbacks(gltf);
      }
    },
    undefined,
    (error) => {
      console.error("An error occurred while loading the model:", error);
    }
  );
}

const donutPosition = new THREE.Vector3(3, -3.5, 0);
const donutScale = new THREE.Vector3(6.5, 6.5, 6.5);

const beerPosition = new THREE.Vector3(-3, -3.5, 0);
const beerScale = new THREE.Vector3(1.5, 1.5, 1.5);
const beerRotation = THREE.MathUtils.degToRad(60);

loadModel(
  "/models/Donut/glTF/donut.gltf",
  donutPosition,
  donutScale,
  null,
  (gltf) => {
    const donutModel = gltf.scene;
    modelTweaks.add(donutModel, "visible").name("Donut");

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    tl.to(
      donutModel.rotation,
      {
        y: "+=" + Math.PI,
        duration: 4,
        ease: "power1.inOut",
      },
      "0"
    )
      .to(
        donutModel.position,
        {
          y: "+=2",
          duration: 4,
          ease: "power1.inOut",
        },
        "0"
      )
      .to(donutModel.rotation, {
        y: "+=" + Math.PI,
        duration: 4,
        ease: "power1.inOut",
      })
      .to(
        donutModel.position,
        {
          y: "-=2",
          duration: 4,
          ease: "power1.inOut",
        },
        "-=2"
      );
    animations.donut = tl;
  }
);

loadModel(
  "/models/DuffBeer/glTF/blikje.gltf",
  beerPosition,
  beerScale,
  beerRotation,
  (gltf) => {
    const beerModel = gltf.scene;
    modelTweaks.add(beerModel, "visible").name("DuffBeer");

    const tab = gltf.scene.getObjectByName("Tab");
    if (tab) {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(
        tab.position,
        {
          y: "-=0.5",
          duration: 2,
          ease: "power1.inOut",
        },
        "0"
      ).to(
        tab.rotation,
        {
          z: "-=" + Math.PI / 2,
          duration: 2,
          ease: "power1.inOut",
        },
        "0"
      );
      animations.beer = tl;
    }
  }
);

// Animation Debug

function playAnimations() {
  if (animations.donut) animations.donut.play();
  if (animations.beer) animations.beer.play();
}

function pauseAnimations() {
  if (animations.donut) animations.donut.pause();
  if (animations.beer) animations.beer.pause();
}

function killAnimations() {
  if (animations.donut) animations.donut.kill();
  if (animations.beer) animations.beer.kill();
}

function restartAnimations() {
  if (animations.donut) animations.donut.restart();
  if (animations.beer) animations.beer.restart();
}

animationTweaks.add({ resume: playAnimations }, "resume").name("Resume");
animationTweaks.add({ pause: pauseAnimations }, "pause").name("Pause");
animationTweaks.add({ remove: killAnimations }, "remove").name("Remove");
animationTweaks.add({ add: restartAnimations }, "add").name("Refresh");

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Light debug

lightsTweaks.add(directionalLight, "intensity").min(0).max(2).step(0.01);

lightsTweaks.add(directionalLight.position, "x").min(-10).max(10).step(0.01);
lightsTweaks.add(directionalLight.position, "y").min(-10).max(10).step(0.01);
lightsTweaks.add(directionalLight.position, "z").min(-10).max(10).step(0.01);

//Helper debug

const lightHelper = new THREE.DirectionalLightHelper(directionalLight);

helpersTweaks
  .add(
    {
      "Directional Light Helper": false,
    },
    "Directional Light Helper"
  )
  .onChange((value) => {
    if (value) {
      scene.add(lightHelper);
    } else {
      scene.remove(lightHelper);
    }
  });

const gridHelper = new THREE.GridHelper(10, 10);

helpersTweaks
  .add(
    {
      "Grid Helper": false,
    },
    "Grid Helper"
  )
  .onChange((value) => {
    if (value) {
      scene.add(gridHelper);
    } else {
      scene.remove(gridHelper);
    }
  });

const axesHelper = new THREE.AxesHelper(7);

helpersTweaks
  .add(
    {
      "Axes Helper": false,
    },
    "Axes Helper"
  )
  .onChange((value) => {
    if (value) {
      scene.add(axesHelper);
    } else {
      scene.remove(axesHelper);
    }
  });

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 1, 15);
scene.add(camera);

// Camera debug
cameraTweaks.add(camera.position, "x").min(-10).max(10).step(0.01);
cameraTweaks.add(camera.position, "y").min(-10).max(10).step(0.01);
cameraTweaks.add(camera.position, "z").min(-10).max(10).step(0.01);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, -0.5, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xeeeeee, 0);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
