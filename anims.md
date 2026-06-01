//This is zoom and rotate anim 
const angle = p * Math.PI * 2;

camera.position.set(
   Math.sin(angle) * (5 - p * 2),
   1 + p * 0.5,
   Math.cos(angle) * (5 - p * 2)
);





//floating and rotating//==========================================================

//inside center+scale//
// inside your GLTFLoader callback, after scene.add(model)
stateRef.current.model = model;

//
if (s.ready) {
  s.mixers.forEach((mx) => mx.setTime(p * MAX_DUR));

  const time = clock.getElapsedTime();

  // ── floating (independent of scroll) ──────────
  s.model.position.y = Math.sin(time * 0.8) * 0.08;
  s.model.rotation.z = Math.sin(time * 0.6) * 0.03;
  // ──────────────────────────────────────────────

  // camera orbit
  const RADIUS    = 5;
  const HEIGHT    = 1.0;
  const SPINS     = 1;
  const DIRECTION = 1;
  const angle = DIRECTION * p * Math.PI * 2 * SPINS;
  camera.position.set(Math.sin(angle) * RADIUS, HEIGHT, Math.cos(angle) * RADIUS);
  camera.lookAt(0, 0, 0);
}

//
const scene = new THREE.Scene();
const clock = new THREE.Clock(); // ← add this