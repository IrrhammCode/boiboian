export default function (THREE) {
  const g = new THREE.Group();
  const METAL = new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.55, metalness: 0.4 });
  METAL.name = 'metal';
  const WARM = new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.45, metalness: 0.35 });
  WARM.name = 'metal';
  const GLOW = new THREE.MeshStandardMaterial({
    color: 0xffe0a0, roughness: 0.4, metalness: 0, emissive: 0xffaa55, emissiveIntensity: 0.85,
  });
  GLOW.name = 'metal';

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), METAL);
  post.position.y = 1.6;
  g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), METAL);
  arm.position.set(0.35, 3.05, 0);
  g.add(arm);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.2), WARM);
  housing.position.set(0.65, 3.0, 0);
  g.add(housing);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), GLOW);
  bulb.position.set(0.65, 2.9, 0);
  g.add(bulb);
  return g;
}
