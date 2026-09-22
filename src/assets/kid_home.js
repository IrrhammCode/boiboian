/* Scale athletes from 1.25 → ~1.55 m vinyl street proportions */
const S = 1.55 / 1.25;

export default function (THREE) {
  const g = new THREE.Group();
  const SKIN = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.88, metalness: 0 });
  SKIN.name = 'fabric';
  const HAIR = new THREE.MeshStandardMaterial({ color: 0x1e1814, roughness: 0.95, metalness: 0 });
  HAIR.name = 'fabric';
  const SHIRT = new THREE.MeshStandardMaterial({ color: 0x1a9b8e, roughness: 0.9, metalness: 0 });
  SHIRT.name = 'fabric';
  const SHORTS = new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.92, metalness: 0 });
  SHORTS.name = 'fabric';
  const joints = {};

  const limb = (parent, name, x, y, z, geo, mat, offY = 0) => {
    const j = new THREE.Group();
    j.name = name;
    j.position.set(x * S, y * S, z * S);
    parent.add(j);
    joints[name] = j;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = offY * S;
    j.add(mesh);
    return j;
  };

  const hips = new THREE.Group();
  hips.name = 'hips';
  hips.position.set(0, 0.58 * S, 0);
  g.add(hips);
  joints.hips = hips;

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.24 * S, 0.13 * S, 0.15 * S), SHORTS);
  pelvis.position.y = 0.02 * S;
  hips.add(pelvis);

  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.09 * S, 0);
  hips.add(spine);
  joints.spine = spine;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34 * S, 0.4 * S, 0.18 * S), SHIRT);
  torso.position.y = 0.24 * S;
  spine.add(torso);
  for (const sx of [-0.18, 0.18]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.06 * S, 8, 6), SHIRT);
    pad.position.set(sx * S, 0.4 * S, 0);
    spine.add(pad);
  }

  const head = limb(spine, 'head', 0, 0.48, 0, new THREE.SphereGeometry(0.11 * S, 12, 10), SKIN, 0.08);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.115 * S, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    HAIR,
  );
  hair.position.y = 0.08 * S;
  head.add(hair);

  const EYE = new THREE.MeshStandardMaterial({ color: 0x1e1814, roughness: 0.8 });
  EYE.name = 'fabric';
  for (const x of [-0.038, 0.038]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016 * S, 6, 5), EYE);
    eye.position.set(x * S, 0.09 * S, 0.1 * S);
    head.add(eye);
  }

  const uaG = new THREE.CapsuleGeometry(0.045 * S, 0.16 * S, 3, 6);
  const laG = new THREE.CapsuleGeometry(0.038 * S, 0.14 * S, 3, 6);
  const ulG = new THREE.CapsuleGeometry(0.055 * S, 0.22 * S, 3, 6);
  const llG = new THREE.CapsuleGeometry(0.042 * S, 0.2 * S, 3, 6);

  for (const side of [-1, 1]) {
    const tag = side < 0 ? 'left' : 'right';
    const ua = limb(spine, `${tag}UpperArm`, side * 0.19, 0.42, 0, uaG, SKIN, -0.13);
    limb(ua, `${tag}LowerArm`, 0, -0.24, 0, laG, SKIN, -0.11);
  }
  for (const side of [-1, 1]) {
    const tag = side < 0 ? 'left' : 'right';
    const ul = limb(hips, `${tag}UpperLeg`, side * 0.08, -0.04, 0, ulG, SHORTS, -0.16);
    const ll = limb(ul, `${tag}LowerLeg`, 0, -0.32, 0, llG, SKIN, -0.13);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09 * S, 0.05 * S, 0.16 * S), SHORTS);
    foot.position.set(0, -0.24 * S, 0.03 * S);
    ll.add(foot);
  }

  g.userData.joints = joints;
  g.userData.team = 'home';
  return g;
}
