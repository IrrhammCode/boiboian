export default function (THREE) {
  const g = new THREE.Group();
  const BODY = new THREE.MeshStandardMaterial({ color: 0xc45a38, roughness: 0.55, metalness: 0.05 });
  BODY.name = 'tile';
  const LIP = new THREE.MeshStandardMaterial({ color: 0x8a3424, roughness: 0.78, metalness: 0 });
  LIP.name = 'tile';
  const GLAZE = new THREE.MeshStandardMaterial({ color: 0xe87850, roughness: 0.32, metalness: 0.1 });
  GLAZE.name = 'tile';

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.025, 5), BODY);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.012;
  g.add(body);
  const glaze = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.05), GLAZE);
  glaze.position.set(0, 0.02, 0);
  g.add(glaze);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.014, 0.014), LIP);
  lip.position.set(0.02, 0.01, 0.03);
  g.add(lip);
  return g;
}
