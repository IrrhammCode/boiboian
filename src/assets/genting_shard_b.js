export default function (THREE) {
  const g = new THREE.Group();
  const BODY = new THREE.MeshStandardMaterial({ color: 0xc45a38, roughness: 0.55, metalness: 0.05 });
  BODY.name = 'tile';
  const LIP = new THREE.MeshStandardMaterial({ color: 0x8a3424, roughness: 0.75, metalness: 0 });
  LIP.name = 'tile';
  const GLAZE = new THREE.MeshStandardMaterial({ color: 0xe87850, roughness: 0.35, metalness: 0.08 });
  GLAZE.name = 'tile';

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.10), BODY);
  body.position.y = 0.009;
  g.add(body);
  const glaze = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.06), GLAZE);
  glaze.position.set(0.01, 0.016, -0.01);
  g.add(glaze);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.012), LIP);
  lip.position.set(0, 0.008, 0.045);
  g.add(lip);
  return g;
}
