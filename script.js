import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("solarCanvas"),
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.zoomSpeed = 1;
controls.enablePan = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
const pointLight = new THREE.PointLight(0xffffff, 1.5);
scene.add(ambientLight, pointLight);

const textureLoader = new THREE.TextureLoader();

function createPlanet(name, size, distance, textureFile, speed) {
  const texture = textureLoader.load(`assets/textures/${textureFile}`);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMinMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;

  const geometry = new THREE.SphereGeometry(size, 128, 128);
  const material = new THREE.MeshStandardMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = distance;
  scene.add(mesh);

  return { name, mesh, angle: 0, speed, distance };
}

const planets = [
  createPlanet("Mercury", 0.3, 2, "mercury_texture.jpg", 0.04),
  createPlanet("Venus", 0.6, 5, "venus_texture.jpg", 0.03),
  createPlanet("Earth", 0.65, 7, "earth_texture.jpg", 0.02),
  createPlanet("Mars", 0.5, 9, "mars_texture.jpg", 0.018),
  createPlanet("Jupiter", 1.2, 12, "jupiter_texture.jpg", 0.01),
  createPlanet("Saturn", 1.1, 15, "saturn_texture.jpg", 0.008),
  createPlanet("Uranus", 0.9, 18, "uranus_texture.jpg", 0.006),
  createPlanet("Neptune", 0.85, 21, "uranus_texture.jpg", 0.005),
];

const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load("assets/textures/sun_texture.jpg"),
});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

function animate() {
  requestAnimationFrame(animate);
  planets.forEach((planet) => {
    planet.angle += planet.speed;
    planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
    planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
    planet.mesh.rotation.y += 0.01; //Rotate the planet
  });

  controls.update();
  renderer.render(scene, camera);
}

camera.position.z = 30;
animate();

const controlPanel = document.getElementById("controls");
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
  controlPanel.appendChild(label);
  controlPanel.appendChild(input);
  controlPanel.appendChild(document.createElement("br"));
});
