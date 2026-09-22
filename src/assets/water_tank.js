export default function (THREE) {
  const g = new THREE.Group();
  const METAL = new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.5, metalness: 0.45 });
  METAL.name = 'metal';
  const DARK = new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.7, metalness: 0.3 });
  DARK.name = 'metal';
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 1.1, 16), METAL);
  body.position.y = 0.55;
  g.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.03, 6, 20), DARK);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.08;
  g.add(rim);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16), DARK);
  lid.position.y = 1.12;
  g.add(lid);
  return g;
}
