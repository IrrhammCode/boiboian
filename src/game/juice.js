/**
 * Lightweight juice helpers — dust, sparks, pass ribbon.
 */
import * as THREE from 'three';

export function createJuice(world) {
  const dust = [];
  const sparks = [];
  const trail = [];

  const dustGeo = new THREE.SphereGeometry(0.08, 5, 4);
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({
      color: 0x4a5562, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.visible = false;
    world.add(m);
    dust.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
  }
  const sparkGeo = new THREE.SphereGeometry(0.04, 4, 4);
  for (let i = 0; i < 20; i++) {
    const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({
      color: 0x5ef0d8, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.visible = false;
    world.add(m);
    sparks.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
  }
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0x5ef0d8, transparent: true, opacity: 0, depthWrite: false }),
    );
    m.visible = false;
    world.add(m);
    trail.push({ mesh: m, life: 0 });
  }

  function burst(pool, x, y, z, n, speed, life) {
    let used = 0;
    for (const p of pool) {
      if (p.life > 0) continue;
      p.life = life * (0.6 + Math.random() * 0.4);
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      p.vel.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.6, (Math.random() - 0.5) * speed);
      p.mesh.material.opacity = 0.7;
      if (++used >= n) break;
    }
  }

  return {
    dustAt(x, y, z, n = 8) { burst(dust, x, y, z, n, 2.2, 0.55); },
    sparksAt(x, y, z, n = 10) { burst(sparks, x, y, z, n, 4.5, 0.35); },
    trailAt(x, y, z) {
      for (const p of trail) {
        if (p.life > 0) continue;
        p.life = 0.35;
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        p.mesh.material.opacity = 0.65;
        break;
      }
    },
    update(dt) {
      for (const p of dust) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.vel.y -= 4 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.material.opacity = Math.max(0, p.life * 1.2);
        if (p.life <= 0) p.mesh.visible = false;
      }
      for (const p of sparks) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.material.opacity = Math.max(0, p.life * 2);
        if (p.life <= 0) p.mesh.visible = false;
      }
      for (const p of trail) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.mesh.material.opacity = Math.max(0, p.life * 1.8);
        p.mesh.scale.setScalar(0.7 + p.life);
        if (p.life <= 0) p.mesh.visible = false;
      }
    },
  };
}
