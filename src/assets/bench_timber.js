export default function (THREE) {
  const g = new THREE.Group();
  const WOOD = new THREE.MeshStandardMaterial({ color: 0x8a5a38, roughness: 0.85, metalness: 0 });
  WOOD.name = 'timber';
  const DARK = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9, metalness: 0 });
  DARK.name = 'timber';
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.38), WOOD);
  seat.position.y = 0.42;
  g.add(seat);
  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), DARK);
      leg.position.set(x, 0.2, z);
      g.add(leg);
    }
  }
  return g;
}
