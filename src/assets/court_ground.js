export default function (THREE) {
  const g = new THREE.Group();
  const ASP = new THREE.MeshStandardMaterial({ color: 0x3a4450, roughness: 1, metalness: 0 });
  ASP.name = 'ground';
  const LINE = new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.95, metalness: 0 });
  LINE.name = 'ground';
  const WARM = new THREE.MeshStandardMaterial({ color: 0x4a5562, roughness: 1, metalness: 0 });
  WARM.name = 'ground';

  const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.06, 16), ASP);
  slab.position.y = 0.03;
  g.add(slab);

  // worn center lane
  const lane = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 14), WARM);
  lane.position.y = 0.055;
  g.add(lane);

  // throw stripe at z = -5
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.025, 0.18), LINE);
  stripe.position.set(0, 0.06, -5);
  g.add(stripe);

  // soft edge bevels
  for (const [x, z, w, d] of [
    [0, 7.9, 16, 0.2], [0, -7.9, 16, 0.2], [7.9, 0, 0.2, 16], [-7.9, 0, 0.2, 16],
  ]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), LINE);
    e.position.set(x, 0.04, z);
    g.add(e);
  }

  // court center disc under pyramid
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 0.03, 24), WARM);
  disc.position.y = 0.06;
  g.add(disc);

  return g;
}
