export default function (THREE) {
  const g = new THREE.Group();
  const RUBBER = new THREE.MeshStandardMaterial({
    color: 0xe83a2e, roughness: 0.42, metalness: 0.08,
  });
  RUBBER.name = 'fabric';
  const SEAM = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9, metalness: 0 });
  SEAM.name = 'fabric';
  const HILITE = new THREE.MeshStandardMaterial({
    color: 0xff6a55, roughness: 0.28, metalness: 0.12,
  });
  HILITE.name = 'fabric';

  const R = 0.09;
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 18), RUBBER);
  body.position.y = R;
  g.add(body);

  for (const s of [
    { rx: Math.PI / 2, ry: 0, rz: 0 },
    { rx: 0, ry: Math.PI / 2, rz: 0.12 },
    { rx: Math.PI / 2, ry: 0, rz: Math.PI / 2 },
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.995, 0.004, 6, 40), SEAM);
    ring.position.y = R;
    ring.rotation.set(s.rx, s.ry, s.rz);
    g.add(ring);
  }

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.32),
    HILITE,
  );
  cap.position.y = R;
  cap.scale.setScalar(0.99);
  g.add(cap);

  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.012, 8), SEAM);
  valve.position.set(R * 0.7, R * 1.05, R * 0.35);
  valve.rotation.z = 0.4;
  g.add(valve);

  return g;
}
