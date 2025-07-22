import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "./OrbitControls.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let focusedPlanet = null;
let selectedObject = null;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("solarCanvas"),
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 60;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = false;

const loader = new THREE.CubeTextureLoader();
const spaceCube = loader.load([
  "assets/space/px.jpg",
  "assets/space/nx.jpg",
  "assets/space/py.jpg",
  "assets/space/ny.jpg",
  "assets/space/pz.jpg",
  "assets/space/nz.jpg",
]);
scene.background = spaceCube;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(0, 0, 0);
scene.add(ambientLight, pointLight);

const textureLoader = new THREE.TextureLoader();

function createPlanet(name, size, distance, textureFile, speed) {
  const texture = textureLoader.load(`assets/textures/${textureFile}`);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(size, 24, 24);
  const material = new THREE.MeshStandardMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = distance;
  scene.add(mesh);

  return { name, mesh, angle: 0, speed, distance };
}

function createOrbit(distance) {
  const orbitGeo = new THREE.RingGeometry(distance - 0.01, distance + 0.01, 64);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);
}

const planets = [
  (() => {
    createOrbit(3);
    return createPlanet("Mercury", 0.3, 3, "mercury_texture.jpg", 0.0161);
  })(),
  (() => {
    createOrbit(5);
    return createPlanet("Venus", 0.6, 5, "venus_texture.jpg", 0.01176);
  })(),
  (() => {
    createOrbit(7);
    return createPlanet("Earth", 0.65, 7, "earth_texture.jpg", 0.01);
  })(),
  (() => {
    createOrbit(9);
    return createPlanet("Mars", 0.5, 9, "mars_texture.jpg", 0.00808);
  })(),
  (() => {
    createOrbit(12);
    return createPlanet("Jupiter", 1.2, 12, "jupiter_texture.jpg", 0.00438);
  })(),
  (() => {
    createOrbit(15);
    return createPlanet("Saturn", 1.1, 15, "saturn_texture.jpg", 0.00325);
  })(),
  (() => {
    createOrbit(18);
    return createPlanet("Uranus", 0.9, 18, "uranus_texture.jpg", 0.00229);
  })(),
  (() => {
    createOrbit(21);
    return createPlanet("Neptune", 0.85, 21, "neptune_texture.jpg", 0.00182);
  })(),
];

const saturnData = planets.find((p) => p.name === "Saturn");

const ringTexture = textureLoader.load(
  "assets/textures/saturnRing_texture.png"
);
ringTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const ringGeo = new THREE.RingGeometry(1.2, 2, 128);
const ringMat = new THREE.MeshStandardMaterial({
  map: ringTexture,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 1,
  depthWrite: false,
});

const ring = new THREE.Mesh(ringGeo, ringMat);

ring.rotation.x = Math.PI / 2;

saturnData.mesh.add(ring);

const moonOrbit = new THREE.Object3D();

const moonTexture = textureLoader.load("assets/textures/moon_texture.jpg");
moonTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const moonGeo = new THREE.SphereGeometry(0.15, 16, 16);
const moonMat = new THREE.MeshStandardMaterial({ map: moonTexture });
const moon = new THREE.Mesh(moonGeo, moonMat);

moon.position.set(1, 0, 0);
moonOrbit.add(moon);

const earthPlanet = planets.find((p) => p.name === "Earth");
earthPlanet.mesh.add(moonOrbit);

let moonAngle = 0;
const moonOrbitSpeed = 0.01;

const sunGeo = new THREE.SphereGeometry(1.5, 24, 24);
const sunMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load("assets/textures/sun_texture.jpg"),
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(0, 0, 0);
scene.add(sun);

const spriteMaterial = new THREE.SpriteMaterial({
  map: textureLoader.load("assets/textures/glow_texture.png"),
  color: 0xffffff,
  transparent: true,
  blending: THREE.AdditiveBlending,
});

const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(8, 8, 1);
sun.add(sprite);

let isAnimating = true;

function animate() {
  requestAnimationFrame(animate);

  if (isAnimating) {
    planets.forEach((planet) => {
      planet.angle -= planet.speed;
      planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
      planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
      planet.mesh.rotation.y += 0.01; //Rotate the planet
    });

    moonAngle -= moonOrbitSpeed;
    moonOrbit.rotation.y = moonAngle;
    sun.rotation.y += 0.003;
  }

  if (selectedObject) {
    const targetPos = selectedObject.position.clone();
    controls.target.lerp(targetPos, 0.1);
    controls.update();
  } else {
    controls.enabled = true;
  }

  controls.update();
  renderer.render(scene, camera);
}

camera.position.z = 30;
animate();

document.addEventListener("DOMContentLoaded", () => {
  const controlPanel = document.getElementById("controls");
  const toggleBtn = document.getElementById("toggleAnimation");
  toggleBtn.addEventListener("click", () => {
    isAnimating = !isAnimating;
    toggleBtn.innerText = isAnimating ? "Pause" : "Resume";
  });
  planets.forEach((planet) => {
    const input = document.createElement("input");
    input.type = "range";
    input.min = 0.001;
    input.max = 0.1;
    input.step = 0.001;
    input.value = planet.speed;
    input.addEventListener("input", (event) => {
      planet.speed = parseFloat(event.target.value);
    });

    const label = document.createElement("label");
    label.innerText = `${planet.name} Speed: `;
    label.style.display = "block";
    controlPanel.appendChild(label);
    controlPanel.appendChild(input);
    controlPanel.appendChild(document.createElement("br"));
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.getElementById("tooltip");

  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const planetMeshes = planets.map((p) => p.mesh);
    const extraObjects = [sun, moon];
    const allMeshes = [...planetMeshes, ...extraObjects];
    const intersects = raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;

      let label = "";
      const planet = planets.find((p) => p.mesh === clickedMesh);
      if (planet) {
        label = planet.name;
        focusedPlanet = planet;
        selectedObject = planet.mesh;
      } else if (clickedMesh === sun) {
        label = "Sun";
        focusedPlanet = null;
        selectedObject = sun;
      } else if (clickedMesh === moon) {
        label = "Moon";
        focusedPlanet = null;
      }

      if (label) {
        tooltip.style.display = "block";
        tooltip.innerText = label;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
      }
    } else {
      tooltip.style.display = "none";
    }
  });
});
