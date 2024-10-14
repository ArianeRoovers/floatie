import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// GUI Setup
const gui = new GUI({ width: 300, title: "Debug", closeFolders: true });
gui.hide();
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    gui.domElement.style.display =
      gui.domElement.style.display === "none" ? "block" : "none";
  }
});

const modelTweaks = gui.addFolder("Models");
const cameraTweaks = gui.addFolder("Camera");
const lightsTweaks = gui.addFolder("Lights");
const helpersTweaks = gui.addFolder("Helpers");

// Scene Setup
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

// Set the background color to blue
scene.background = new THREE.Color(0x87ceeb);

// skybox did not work
/*
const loader = new THREE.CubeTextureLoader();
const skyboxTextures = loader.load(
  [
    "src/assets/skybox/meadow_rt.jpg",
    "src/assets/skybox/meadow_lf.jpg",
    "src/assets/skybox/meadow_up.jpg",
    "src/assets/skybox/meadow_dn.jpg",
    "src/assets/skybox/meadow_ft.jpg",
    "src/assets/skybox/meadow_bk.jpg",
  ],
  undefined,
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
  (error) => console.error("Error loading skybox textures:", error)
);
scene.background = skyboxTextures;
*/

// Load Models
const gltfLoader = new GLTFLoader();
let waterMesh = null;

function loadModel(url, position, scale, rotation) {
  gltfLoader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.position.copy(position);
      model.scale.copy(scale);
      if (rotation) model.rotation.y = rotation;
      scene.add(model);
      modelTweaks.add(model, "visible").name("Inflatable Pool");

      model.traverse((child) => {
        if (child.isMesh && child.name === "Water") {
          waterMesh = child;
          waterMesh.position.set(0, 1.4, 0);
          waterMesh.geometry.attributes.position.needsUpdate = true;
        }
      });
    },
    undefined,
    (error) =>
      console.error("An error occurred while loading the model:", error)
  );
}

loadModel(
  "/models/Zwembad/glTF/pool.gltf",
  new THREE.Vector3(0, -3.5, 0),
  new THREE.Vector3(1.5, 1.5, 1.5),
  0
);

// Ground Plane
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x006400,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.set(0, -3.5, 0);
scene.add(plane);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

lightsTweaks.add(directionalLight, "intensity").min(0).max(2).step(0.01);
lightsTweaks.add(directionalLight.position, "x").min(-10).max(10).step(0.01);
lightsTweaks.add(directionalLight.position, "y").min(-10).max(10).step(0.01);
lightsTweaks.add(directionalLight.position, "z").min(-10).max(10).step(0.01);

// Helper Setup
const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
helpersTweaks
  .add({ "Directional Light Helper": false }, "Directional Light Helper")
  .onChange((value) => {
    if (value) scene.add(lightHelper);
    else scene.remove(lightHelper);
  });

const gridHelper = new THREE.GridHelper(10, 10);
helpersTweaks.add({ "Grid Helper": false }, "Grid Helper").onChange((value) => {
  if (value) scene.add(gridHelper);
  else scene.remove(gridHelper);
});

const axesHelper = new THREE.AxesHelper(7);
helpersTweaks.add({ "Axes Helper": false }, "Axes Helper").onChange((value) => {
  if (value) scene.add(axesHelper);
  else scene.remove(axesHelper);
});

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 1, 15);
scene.add(camera);

cameraTweaks.add(camera.position, "x").min(-10).max(10).step(0.01);
cameraTweaks.add(camera.position, "y").min(-10).max(10).step(0.01);
cameraTweaks.add(camera.position, "z").min(-10).max(10).step(0.01);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, -0.5, 0);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xeeeeee, 0);

// Animation Loop
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  controls.update();

  // Animate water ripples
  if (waterMesh) {
    const waterGeometry = waterMesh.geometry;
    const positions = waterGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] =
        Math.sin(Math.sqrt(x * x + z * z) * 3 + elapsedTime * 0.5) * 0.05;
    }

    waterGeometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
