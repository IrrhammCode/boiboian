export default function (THREE) {
  const g = new THREE.Group();
  const METAL = new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.6, metalness: 0.35 });
  METAL.name = 'metal';
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.4, 6), METAL);
  post.position.y = 0.7;
  g.add(post);
  for (const y of [0.45, 0.85, 1.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.035, 0.035), METAL);
    rail.position.y = y;
    g.add(rail);
  }
  const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.4, 6), METAL);
  post2.position.set(0.75, 0.7, 0);
  g.add(post2);
  // recenter
  g.children.forEach((c) => { c.position.x -= 0.375; });
  return g;
}
