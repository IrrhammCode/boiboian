function shard(THREE, w, h, d, tip = 0) {
  const g = new THREE.Group();
  const BODY = new THREE.MeshStandardMaterial({ color: 0xc45a38, roughness: 0.55, metalness: 0.05 });
  BODY.name = 'tile';
  const LIP = new THREE.MeshStandardMaterial({ color: 0x8a3424, roughness: 0.75, metalness: 0 });
  LIP.name = 'tile';
  const GLAZE = new THREE.MeshStandardMaterial({ color: 0xe87850, roughness: 0.35, metalness: 0.08 });
  GLAZE.name = 'tile';

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2 - tip, d / 2);
  shape.lineTo(-w / 2 + tip * 0.5, d / 2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(geo, BODY);
  g.add(body);

  const glaze = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, h * 0.35, d * 0.55), GLAZE);
  glaze.position.set(0, h * 0.55, -d * 0.05);
  g.add(glaze);

  const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, h * 0.55, 0.012), LIP);
  lip.position.set(0, h * 0.25, d / 2 - 0.01);
  g.add(lip);

  // ground
  const box = new THREE.Box3().setFromObject(g);
  g.children.forEach((o) => {
    o.position.y -= box.min.y;
    o.position.x -= (box.min.x + box.max.x) / 2;
    o.position.z -= (box.min.z + box.max.z) / 2;
  });
  return g;
}

export default function (THREE) {
  return shard(THREE, 0.18, 0.022, 0.12, 0.03);
}
