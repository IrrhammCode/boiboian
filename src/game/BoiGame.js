import * as THREE from 'three';
import { createRig } from '../lib/rig.js';
import { ASSET_FACTORY, bakeStatic } from '../lib/assetlib.js';
import { sfx, unlockAudio } from '../lib/sfx.js';
import { createJuice } from './juice.js';

import courtFactory from '../assets/court_ground.js';
import ballFactory from '../assets/ball_playground.js';
import shardA from '../assets/genting_shard_a.js';
import shardB from '../assets/genting_shard_b.js';
import shardC from '../assets/genting_shard_c.js';
import athleteTeal from '../assets/kid_home.js';
import athleteMango from '../assets/kid_away.js';
import lampFactory from '../assets/court_lamp.js';
import fenceFactory from '../assets/fence_bay.js';
import tankFactory from '../assets/water_tank.js';
import benchFactory from '../assets/bench_timber.js';

const HALF = 7.6;
const THROW_Z = -5;
const REBUILD_R = 1.8;
const TAG_R = 0.28;
const PICK_R = 0.35;
const HOLD_MAX = 1.8;
const PLACE_T = 0.35;
const ROUND_T = 100;
const SHARD_N = 12;

const COURSES = [
  // y offsets + radial slots for 4 / 3 / 3 / 2 layout ≈ 12
  { y: 0.02, slots: [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]] },
  { y: 0.12, slots: [[0, -0.14], [-0.14, 0.08], [0.14, 0.08]] },
  { y: 0.22, slots: [[0, -0.06], [-0.1, 0.08], [0.1, 0.08]] },
  { y: 0.32, slots: [[-0.05, 0], [0.05, 0]] },
];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function len2(x, z) { return Math.hypot(x, z); }

export class BoiGame {
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.running = false;
    this.paused = false;
    this.lang = 'en';
    this.phase = 'boot';
    this.playerSide = 'teal'; // teal rebuild first after knock flip — player picks role
    this.score = { teal: 0, mango: 0 };
    this.round = 0;
    this.knockTeam = 'teal';
    this.rebuildTeam = 'teal';
    this.tagTeam = 'mango';
    this.knockLeft = 3;
    this.timer = ROUND_T;
    this.holdT = 0;
    this.placeT = 0;
    this.passChain = 0;
    this.freezeT = 0;
    this.shakeT = 0;
    this.shakeDir = new THREE.Vector3();
    this.toast = '';
    this.toastT = 0;
    this.dutyLabel = '';
    this.input = {
      mx: 0, mz: 0, aimx: 0, aimz: -1,
      charge: false, chargeT: 0,
      pass: false, action: false, swap: false, boi: false,
      pointerAim: false,
    };
    this.keys = new Set();
    this._last = 0;
    this._fps = 60;
    this._acc = 0;
    this._frames = 0;
    this.athletes = [];
    this.shards = [];
    this.ghosts = [];
    this.placed = 0;
    this.ball = {
      mesh: null, state: 'free', holder: null,
      pos: new THREE.Vector3(0, 0.09, THROW_Z),
      vel: new THREE.Vector3(),
      trail: [],
    };
    this.player = null;
    this.traj = null;
    this.world = null;
    this.juice = null;
    this._trailAcc = 0;
    this.coached = { pass: false, rebuild: false };
  }

  async init() {
    const { canvas } = this;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, canvas.clientWidth / canvas.clientHeight, 0.05, 90);
    this.rig = createRig(THREE, this.renderer, this.scene, {
      hour: 18.2, azimuth: 240, camera: this.camera, tier: 'phone', post: false,
      exposure: 0.92, fogStart: 28, fogDensity: 0.012,
    });

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.juice = createJuice(this.world);

    const court = await ASSET_FACTORY(courtFactory, { cacheKey: 'court', surfaces: true });
    this.world.add(court);

    const dress = new THREE.Group();
    for (const [x, z, ry] of [[-7.2, -7.2, 0], [7.2, -7.2, 0], [-7.2, 7.2, 0], [7.2, 7.2, 0]]) {
      const lamp = await ASSET_FACTORY(lampFactory, { cacheKey: 'lamp', surfaces: true });
      lamp.position.set(x, 0, z);
      dress.add(lamp);
      const pl = new THREE.PointLight(0xffb060, 1.1, 14, 2);
      pl.position.set(x, 2.9, z);
      dress.add(pl);
    }
    for (let i = 0; i < 8; i++) {
      const fence = await ASSET_FACTORY(fenceFactory, { cacheKey: 'fence', surfaces: true });
      const t = (i / 8) * Math.PI * 2;
      fence.position.set(Math.cos(t) * 7.5, 0, Math.sin(t) * 7.5);
      fence.rotation.y = -t + Math.PI / 2;
      dress.add(fence);
    }
    for (const [x, z] of [[-5.5, 5.8], [5.8, 5.2]]) {
      const tank = await ASSET_FACTORY(tankFactory, { cacheKey: 'tank', surfaces: true });
      tank.position.set(x, 0, z);
      dress.add(tank);
    }
    const bench = await ASSET_FACTORY(benchFactory, { cacheKey: 'bench', surfaces: true });
    bench.position.set(0, 0, 7.1);
    dress.add(bench);
    this.world.add(bakeStatic(dress));

    this.ball.mesh = await ASSET_FACTORY(ballFactory, { cacheKey: 'ball', surfaces: true });
    this.world.add(this.ball.mesh);

    const factories = [shardA, shardB, shardC];
    let si = 0;
    for (const course of COURSES) {
      for (const [sx, sz] of course.slots) {
        const fac = factories[si % 3];
        const mesh = await ASSET_FACTORY(fac, { cacheKey: `shard${si % 3}`, surfaces: true });
        const ghost = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.02, 0.1),
          new THREE.MeshStandardMaterial({
            color: 0x5ef0d8, transparent: true, opacity: 0.22, roughness: 1, depthWrite: false,
          }),
        );
        ghost.position.set(sx, course.y, sz);
        this.world.add(ghost);
        this.ghosts.push({ mesh: ghost, x: sx, y: course.y, z: sz, course: COURSES.indexOf(course), filled: false });
        this.shards.push({
          mesh, loose: false, carriedBy: null, placed: true,
          slot: this.ghosts.length - 1,
          home: new THREE.Vector3(sx, course.y, sz),
        });
        mesh.position.copy(this.shards[this.shards.length - 1].home);
        this.world.add(mesh);
        si++;
      }
    }
    this.placed = SHARD_N;

    for (let i = 0; i < 5; i++) {
      const mesh = await ASSET_FACTORY(athleteTeal, { cacheKey: 'teal', keepHierarchy: true, surfaces: true });
      this.world.add(mesh);
      this.athletes.push(this._makeAthlete(mesh, 'teal', i));
    }
    for (let i = 0; i < 5; i++) {
      const mesh = await ASSET_FACTORY(athleteMango, { cacheKey: 'mango', keepHierarchy: true, surfaces: true });
      this.world.add(mesh);
      this.athletes.push(this._makeAthlete(mesh, 'mango', i));
    }

    // trajectory ribbon
    const trajMat = new THREE.MeshBasicMaterial({ color: 0x5ef0d8, transparent: true, opacity: 0.55 });
    this.traj = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), trajMat);
    this.traj.visible = false;
    this.world.add(this.traj);
    this.trajDots = [];
    for (let i = 0; i < 10; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), trajMat.clone());
      d.visible = false;
      this.world.add(d);
      this.trajDots.push(d);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(REBUILD_R - 0.04, REBUILD_R, 48),
      new THREE.MeshBasicMaterial({ color: 0x5ef0d8, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07;
    ring.visible = false;
    this.world.add(ring);
    this.zoneRing = ring;

    this._bindInput();
    this._emitHud();
    window.__READY__ = true;
    window.__START__ = () => {
      this.startMatch('teal');
      this.hooks.onStart?.();
    };
    window.__GAME__ = {
      pos: [0, 0], fps: 60, speed: 0, score: 0, over: false, draws: 0, tris: 0,
    };
    this.hooks.onReady?.();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _makeAthlete(mesh, team, idx) {
    return {
      mesh, team, idx, alive: true, out: false,
      pos: new THREE.Vector3((idx - 2) * 1.2, 0, team === 'teal' ? 3.5 : -3.5),
      vel: new THREE.Vector3(),
      yaw: team === 'teal' ? Math.PI : 0,
      holding: false, carrying: null, placeSlot: -1,
      aiT: 0, animT: Math.random() * 10,
      speed: 4.2,
      celebrate: 0,
    };
  }

  startMatch(side = 'teal') {
    unlockAudio();
    sfx.ui_confirm();
    // Rebuild pick = you knock first (then rebuild). Tag pick = you wait, then hunt.
    if (side === 'teal') {
      this.playerSide = 'teal';
      this.knockTeam = 'teal';
    } else {
      this.playerSide = 'mango';
      this.knockTeam = 'teal';
    }
    this.score = { teal: 0, mango: 0 };
    this.round = 0;
    this.running = true;
    this.paused = false;
    this._beginRound();
    this.hooks.onPhase?.(this.phase);
  }

  _beginRound() {
    this.round += 1;
    this.knockLeft = 3;
    this.timer = ROUND_T;
    this.passChain = 0;
    this.holdT = 0;
    this.placeT = 0;
    this.rebuildTeam = this.knockTeam === 'mango' ? 'mango' : 'teal';
    // traditional: after knock, knockers rebuild — waiters tag.
    // At line-up, knock team has ball; after collapse flip.
    this.phase = 'countdown';
    this._count = 3;
    this._countAcc = 0;
    this._resetAthletes();
    this._rebuildPyramid(true);
    this._giveBallToKnock();
    this.player = this.athletes.find((a) => a.team === this.playerSide && a.alive) || this.athletes[0];
    this.toast = this.lang === 'id' ? '3…' : '3…';
    this.toastT = 0.9;
    sfx.count_beep();
    this._emitHud();
  }

  _resetAthletes() {
    for (const a of this.athletes) {
      a.alive = true;
      a.out = false;
      a.holding = false;
      a.carrying = null;
      a.placeSlot = -1;
      a.vel.set(0, 0, 0);
      const row = a.team === this.knockTeam ? THROW_Z - 1.2 : 2.8;
      a.pos.set((a.idx - 2) * 1.35, 0, row + (a.team === this.knockTeam ? 0 : 0.4));
      a.mesh.visible = true;
      a.mesh.position.copy(a.pos);
    }
  }

  _rebuildPyramid(assembled) {
    this.placed = assembled ? SHARD_N : 0;
    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i];
      const g = this.ghosts[i];
      s.carriedBy = null;
      s.loose = !assembled;
      s.placed = assembled;
      s.slot = i;
      g.filled = assembled;
      g.mesh.visible = !assembled;
      if (assembled) {
        s.mesh.position.copy(s.home);
        s.mesh.rotation.set(0, 0, 0);
        s.mesh.visible = true;
      }
    }
  }

  _giveBallToKnock() {
    const holder = this.athletes.find((a) => a.team === this.knockTeam && a.alive);
    this._attachBall(holder);
  }

  _attachBall(ath) {
    if (!ath) {
      this.ball.state = 'free';
      this.ball.holder = null;
      return;
    }
    for (const a of this.athletes) a.holding = false;
    ath.holding = true;
    this.ball.state = 'held';
    this.ball.holder = ath;
    this.ball.vel.set(0, 0, 0);
    this.holdT = 0;
  }

  _scatter(pity = false) {
    sfx.pyramid_collapse();
    this.freezeT = 0.14;
    this.shakeT = 0.28;
    this.juice?.dustAt(0, 0.2, 0, 14);
    this.juice?.sparksAt(0, 0.35, 0, 12);
    this.placed = 0;
    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i];
      const g = this.ghosts[i];
      s.placed = false;
      s.loose = true;
      s.carriedBy = null;
      g.filled = false;
      g.mesh.visible = true;
      const ang = Math.random() * Math.PI * 2;
      const r = 0.35 + Math.random() * 0.85;
      s.mesh.position.set(Math.cos(ang) * r, 0.02, Math.sin(ang) * r);
      s.mesh.rotation.set(Math.random(), Math.random(), Math.random());
    }
    // duty flip
    this.rebuildTeam = this.knockTeam;
    this.tagTeam = this.knockTeam === 'teal' ? 'mango' : 'teal';
    this.phase = 'live';
    this.timer = ROUND_T;
    if (this.zoneRing) this.zoneRing.visible = true;
    this.toast = this.playerSide === this.rebuildTeam
      ? (this.lang === 'id' ? 'Susun di bawah tembakan!' : 'Rebuild under fire!')
      : (this.lang === 'id' ? 'Oper — jangan lari bawa bola!' : 'Pass — don’t run with the ball!');
    this.toastT = 2.2;
    // ball to tag team
    const tagger = this.athletes.find((a) => a.team === this.tagTeam && a.alive);
    this._attachBall(tagger);
    if (pity) this.toast = this.lang === 'id' ? 'Susunan ambruk' : 'Stack slips';
    this._emitHud();
  }

  _bindInput() {
    const onKey = (e, down) => {
      const k = e.key.toLowerCase();
      if (down) this.keys.add(k); else this.keys.delete(k);
      if (down && k === ' ') this.input.boi = true;
      if (down && (k === 'tab' || k === 'f')) { e.preventDefault(); this.input.swap = true; }
      if (down && k === 'e') this.input.action = true;
      if (down && k === 'q') this.input.pass = true;
    };
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());

    const setAimFromClient = (cx, cy) => {
      const rect = this.canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((cx - rect.left) / rect.width) * 2 - 1,
        -(((cy - rect.top) / rect.height) * 2 - 1),
      );
      this._ray = this._ray || new THREE.Raycaster();
      this._plane = this._plane || new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      this._hit = this._hit || new THREE.Vector3();
      this._ray.setFromCamera(ndc, this.camera);
      if (this._ray.ray.intersectPlane(this._plane, this._hit) && this.player) {
        const dx = this._hit.x - this.player.pos.x;
        const dz = this._hit.z - this.player.pos.z;
        const L = Math.hypot(dx, dz) || 1;
        this.input.aimx = dx / L;
        this.input.aimz = dz / L;
        this.input.pointerAim = true;
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.input.charge = true;
      if (e.button === 2) this.input.pass = true;
      setAimFromClient(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('pointermove', (e) => setAimFromClient(e.clientX, e.clientY));
    this.canvas.addEventListener('pointerup', (e) => {
      if (e.button === 0) this.input.charge = false;
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this._resize());
  }

  setMove(x, z) {
    const L = Math.hypot(x, z);
    if (L > 1) { x /= L; z /= L; }
    this.input.mx = x;
    this.input.mz = z;
  }

  setTouchCharge(on) { this.input.charge = on; }
  tapPass() { this.input.pass = true; }
  tapAction() { this.input.action = true; }
  tapSwap() { this.input.swap = true; }
  tapBoi() { this.input.boi = true; }
  setPaused(v) { this.paused = !!v; this._emitHud(); }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.rig.resize?.(w, h);
  }

  _loop(t) {
    const dt = Math.min(0.05, (t - this._last) / 1000 || 0.016);
    this._last = t;
    this._acc += dt;
    this._frames++;
    if (this._acc >= 0.5) {
      this._fps = this._frames / this._acc;
      this._frames = 0;
      this._acc = 0;
    }
    if (!this.paused) this._update(dt);
    this._render(dt);
    this._report();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    if (this.toastT > 0) this.toastT -= dt;
    this.juice?.update(dt);
    if (this.freezeT > 0) { this.freezeT -= dt; return; }
    if (this.shakeT > 0) this.shakeT -= dt;

    if (this.phase === 'countdown') {
      this._countAcc += dt;
      if (this._countAcc > 0.7) {
        this._countAcc = 0;
        this._count -= 1;
        if (this._count <= 0) {
          this.phase = 'knock';
          this.toast = this.lang === 'id' ? 'Robohkan susunan!' : 'Knock it down!';
          this.toastT = 1.5;
          sfx.whistle_go();
        } else {
          this.toast = String(this._count);
          this.toastT = 0.7;
          sfx.count_beep();
        }
        this._emitHud();
      }
      this._syncAthletes(dt);
      this._camera(dt);
      return;
    }

    if (this.phase === 'knock' || this.phase === 'live') {
      this._readKeys(dt);
      this._updatePlayer(dt);
      this._updateAI(dt);
      this._updateBall(dt);
      this._syncAthletes(dt);
      this._camera(dt);
        if (this.phase === 'live') {
          this.timer -= dt;
          if (this.timer <= 0) this._resolveTimer();
          if (this.placed >= SHARD_N && this.player?.team === this.rebuildTeam
              && len2(this.player.pos.x, this.player.pos.z) < REBUILD_R) {
            this._boiArm = (this._boiArm || 0) + dt;
            if (this._boiArm > 0.5) this._endRound('boi');
          } else this._boiArm = 0;
          const rebuildAlive = this.athletes.filter((a) => a.team === this.rebuildTeam && a.alive).length;
          if (rebuildAlive === 0) this._endRound('wipe');
        }
    }

    if (this.phase === 'resolve') {
      this._resolveAcc = (this._resolveAcc || 0) + dt;
      if (this._resolveAcc > 2.2) {
        this._resolveAcc = 0;
        if (this.score.teal >= 2 || this.score.mango >= 2) {
          this.phase = 'matchover';
          this.running = false;
          this.hooks.onMatchOver?.(this.score);
        } else {
          this.knockTeam = this.knockTeam === 'mango' ? 'teal' : 'mango';
          this._beginRound();
        }
        this._emitHud();
      }
    }
  }

  _readKeys(dt = 0.016) {
    let x = 0; let z = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) z -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) z += 1;
    if (!this.input.mx && !this.input.mz && (x || z)) this.setMove(x, z);
    else if (x || z) this.setMove(x, z);

    if (this.keys.has(' ')) { /* boi edged via keydown */ }
    if (this.input.charge && this.player?.holding) this.input.chargeT = Math.min(0.7, this.input.chargeT + dt);
    else if (this.input.chargeT > 0.08 && this.player?.holding) {
      this._throw(this.input.chargeT);
      this.input.chargeT = 0;
    } else if (!this.input.charge) this.input.chargeT = 0;

    if (this.input.pass) { this._pass(); this.input.pass = false; }
    if (this.input.action) { this._action(); this.input.action = false; }
    if (this.input.swap) { this._swap(); this.input.swap = false; }
    if (this.input.boi) { this._tryBoi(); this.input.boi = false; }
  }

  _updatePlayer(dt) {
    const p = this.player;
    if (!p || !p.alive) return;
    const holdingBall = p.holding && this.ball.holder === p;
    const rooted = holdingBall && this.phase === 'live';
    const spd = rooted ? 0 : p.speed * (p.carrying ? 0.88 : 1);
    p.vel.x = this.input.mx * spd;
    p.vel.z = this.input.mz * spd;
    p.pos.x = clamp(p.pos.x + p.vel.x * dt, -HALF, HALF);
    p.pos.z = clamp(p.pos.z + p.vel.z * dt, -HALF, HALF);
    if (this.input.pointerAim) {
      p.yaw = Math.atan2(this.input.aimx, this.input.aimz);
    } else if (len2(p.vel.x, p.vel.z) > 0.1) {
      p.yaw = Math.atan2(p.vel.x, p.vel.z);
      this.input.aimx = Math.sin(p.yaw);
      this.input.aimz = Math.cos(p.yaw);
    }
    if (holdingBall && this.phase === 'live') {
      this.holdT += dt;
      if (this.holdT > HOLD_MAX) {
        this._dropBall();
        this.toast = this.lang === 'id' ? 'Oper sekarang!' : 'Pass now!';
        this.toastT = 1.2;
      }
    }
    if (p.carrying != null && p.placeSlot >= 0) {
      this.placeT += dt;
      if (this.placeT >= PLACE_T) this._finishPlace(p);
    }
    this._updateTraj(holdingBall || (this.phase === 'knock' && holdingBall));
  }

  _updateTraj(show) {
    const charging = this.input.charge && this.player?.holding;
    for (const d of this.trajDots) d.visible = false;
    if (!charging || !this.player) return;
    const power = 8 + this.input.chargeT * 14;
    let px = this.player.pos.x;
    let py = 1.1;
    let pz = this.player.pos.z;
    let vx = this.input.aimx * power;
    let vy = 3.5 + this.input.chargeT * 2;
    let vz = this.input.aimz * power;
    for (let i = 0; i < this.trajDots.length; i++) {
      const step = 0.08;
      vx *= 0.995; vz *= 0.995; vy -= 18 * step;
      px += vx * step; py += vy * step; pz += vz * step;
      if (py < 0.09) { py = 0.09; vy *= -0.35; }
      const d = this.trajDots[i];
      d.visible = true;
      d.position.set(px, py, pz);
    }
  }

  _throw(charge) {
    const p = this.player;
    if (!p?.holding) return;
    if (this.phase === 'knock' && p.team !== this.knockTeam) return;
    if (this.phase === 'live' && p.team !== this.tagTeam) return;
    let aimx = this.input.aimx;
    let aimz = this.input.aimz;
    // soft aim assist
    if (this.phase === 'knock') {
      const dx = 0 - p.pos.x; const dz = 0 - p.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 6) {
        const tx = dx / dist; const tz = dz / dist;
        const dot = aimx * tx + aimz * tz;
        const ang = Math.acos(clamp(dot, -1, 1));
        if (ang < (12 * Math.PI) / 180) { aimx = tx; aimz = tz; }
      }
    } else {
      let best = null; let bestD = 4;
      for (const a of this.athletes) {
        if (a.team === p.team || !a.alive) continue;
        const dx = a.pos.x - p.pos.x; const dz = a.pos.z - p.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < bestD) {
          const tx = dx / dist; const tz = dz / dist;
          const ang = Math.acos(clamp(aimx * tx + aimz * tz, -1, 1));
          if (ang < (15 * Math.PI) / 180) { best = a; bestD = dist; aimx = tx; aimz = tz; }
        }
      }
    }
    const chain = 1 + [0, 0.08, 0.15, 0.22][Math.min(3, this.passChain)];
    const power = (8 + charge * 14) * chain;
    this.ball.state = 'fly';
    this.ball.holder = null;
    p.holding = false;
    this.ball.pos.set(p.pos.x, 1.15, p.pos.z);
    this.ball.vel.set(aimx * power, 3.2 + charge * 2.5, aimz * power);
    this.ball.thrower = p;
    this.ball.tagThrow = this.phase === 'live';
    this.holdT = 0;
    sfx.ball_throw();
  }

  _pass() {
    const p = this.player;
    if (!p?.holding || this.phase !== 'live') return;
    let best = null; let bestScore = -1e9;
    for (const a of this.athletes) {
      if (a === p || a.team !== p.team || !a.alive) continue;
      const dx = a.pos.x - p.pos.x; const dz = a.pos.z - p.pos.z;
      const dist = Math.hypot(dx, dz);
      const dir = Math.atan2(dx, dz);
      const facing = 1 - Math.abs(Math.atan2(Math.sin(dir - p.yaw), Math.cos(dir - p.yaw))) / Math.PI;
      const score = facing * 2 - dist * 0.15;
      if (score > bestScore) { bestScore = score; best = a; }
    }
    if (!best) { this._dropBall(); return; }
    const dx = best.pos.x - p.pos.x; const dz = best.pos.z - p.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const spd = 12;
    this.ball.state = 'pass';
    this.ball.holder = null;
    p.holding = false;
    this.ball.pos.set(p.pos.x, 1.1, p.pos.z);
    this.ball.vel.set((dx / dist) * spd, 1.2, (dz / dist) * spd);
    this.ball.passTarget = best;
    this.passChain = Math.min(3, this.passChain + 1);
    this.holdT = 0;
    sfx.ball_pass();
  }

  _dropBall() {
    const p = this.ball.holder || this.player;
    this.ball.state = 'free';
    this.ball.holder = null;
    if (p) p.holding = false;
    this.ball.pos.set(p?.pos.x || 0, 0.09, p?.pos.z || 0);
    this.ball.vel.set(0, 0, 0);
    this.passChain = 0;
    sfx.ball_drop();
  }

  _action() {
    const p = this.player;
    if (!p || this.phase !== 'live') return;
    if (p.team !== this.rebuildTeam) return;
    if (p.carrying == null) {
      // pick nearest shard
      let best = -1; let bestD = PICK_R;
      for (let i = 0; i < this.shards.length; i++) {
        const s = this.shards[i];
        if (!s.loose || s.carriedBy || s.placed) continue;
        const d = len2(s.mesh.position.x - p.pos.x, s.mesh.position.z - p.pos.z);
        if (d < bestD) { bestD = d; best = i; }
      }
      const carriers = this.athletes.filter((a) => a.team === this.rebuildTeam && a.carrying != null).length;
      if (best >= 0 && carriers < 2) {
        this.shards[best].carriedBy = p;
        this.shards[best].loose = false;
        p.carrying = best;
        sfx.shard_pick();
      }
    } else {
      // start place if in zone near empty valid slot
      if (len2(p.pos.x, p.pos.z) > REBUILD_R) return;
      const slot = this._nextValidSlot();
      if (slot < 0) { sfx.shard_reject(); return; }
      p.placeSlot = slot;
      this.placeT = 0;
    }
  }

  _nextValidSlot() {
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      if (g.filled) continue;
      if (g.course === 0) return i;
      // need any support in previous course roughly under
      const prev = this.ghosts.filter((x) => x.course === g.course - 1 && x.filled);
      if (prev.length > 0) return i;
    }
    return -1;
  }

  _finishPlace(p) {
    const si = p.carrying;
    const slot = p.placeSlot;
    if (si == null || slot < 0) return;
    const s = this.shards[si];
    const g = this.ghosts[slot];
    s.placed = true;
    s.loose = false;
    s.carriedBy = null;
    s.mesh.position.set(g.x, g.y, g.z);
    s.mesh.rotation.set(0, 0, 0);
    g.filled = true;
    g.mesh.visible = false;
    p.carrying = null;
    p.placeSlot = -1;
    this.placeT = 0;
    this.placed += 1;
    sfx.shard_place();
    this.juice?.sparksAt(g.x, g.y + 0.1, g.z, 6);
    if (this.placed >= 10) {
      this.toast = this.lang === 'id' ? 'Hampir Boi!' : 'Almost Boi!';
      this.toastT = 1.5;
    }
    this._emitHud();
  }

  _tryBoi() {
    if (this.phase !== 'live') return;
    if (this.player?.team !== this.rebuildTeam) return;
    if (this.placed < SHARD_N) return;
    if (len2(this.player.pos.x, this.player.pos.z) > REBUILD_R + 0.4) return;
    this._endRound('boi');
  }

  _swap() {
    const side = this.player?.team || this.playerSide;
    const alive = this.athletes.filter((a) => a.team === side && a.alive && a !== this.player);
    if (!alive.length) return;
    // prefer useful body
    alive.sort((a, b) => {
      const score = (x) => {
        if (this.phase === 'live' && side === this.rebuildTeam) {
          return -len2(x.pos.x, x.pos.z);
        }
        return x.holding ? 10 : 0;
      };
      return score(b) - score(a);
    });
    this.player = alive[0];
    sfx.ui_tap();
  }

  _updateBall(dt) {
    const b = this.ball;
    if (b.state === 'held' && b.holder) {
      b.pos.set(b.holder.pos.x + Math.sin(b.holder.yaw) * 0.25, 1.05, b.holder.pos.z + Math.cos(b.holder.yaw) * 0.25);
      b.mesh.position.copy(b.pos);
      return;
    }
    if (b.state === 'fly' || b.state === 'pass' || b.state === 'free') {
      if (b.state !== 'free') {
        b.vel.y -= 18 * dt;
        b.pos.addScaledVector(b.vel, dt);
        this._trailAcc = (this._trailAcc || 0) + dt;
        if (this._trailAcc > 0.04) { this._trailAcc = 0; this.juice?.trailAt(b.pos.x, b.pos.y, b.pos.z); }
        if (b.pos.y < 0.09) {
          b.pos.y = 0.09;
          b.vel.y *= -0.4;
          b.vel.x *= 0.7;
          b.vel.z *= 0.7;
          sfx.ball_bounce();
          if (Math.hypot(b.vel.x, b.vel.z) < 1.2 && Math.abs(b.vel.y) < 1) {
            if (b.state === 'fly' && this.phase === 'knock') {
              // miss knock
              this.knockLeft -= 1;
              if (this._pyramidHit()) {
                this._scatter(false);
              } else if (this.knockLeft <= 0) {
                this._scatter(true);
              } else {
                this.toast = `${this.knockLeft}`;
                this.toastT = 1;
                this._giveBallToKnock();
              }
            } else {
              b.state = 'free';
              this.passChain = 0;
            }
          }
        }
        // knock hit test while flying
        if (b.state === 'fly' && this.phase === 'knock' && this._pyramidHit()) {
          this._scatter(false);
        }
        // tag hit
        if (b.state === 'fly' && b.tagThrow && this.phase === 'live') {
          for (const a of this.athletes) {
            if (!a.alive || a.team === b.thrower?.team) continue;
            const d = len2(a.pos.x - b.pos.x, a.pos.z - b.pos.z);
            if (d < TAG_R && b.pos.y < 1.5) {
              this._tag(a);
              b.state = 'free';
              b.vel.multiplyScalar(0.2);
              break;
            } else if (d < 0.5 && b.pos.y < 1.6) {
              sfx.near_miss();
            }
          }
        }
        if (b.state === 'pass' && b.passTarget?.alive) {
          const t = b.passTarget;
          if (len2(t.pos.x - b.pos.x, t.pos.z - b.pos.z) < 0.45) {
            this._attachBall(t);
            sfx.ball_catch();
          }
        }
      }
      // pickup
      if (b.state === 'free') {
        for (const a of this.athletes) {
          if (!a.alive || a.carrying != null) continue;
          if (len2(a.pos.x - b.pos.x, a.pos.z - b.pos.z) < PICK_R) {
            this._attachBall(a);
            sfx.ball_catch();
            break;
          }
        }
      }
      b.pos.x = clamp(b.pos.x, -HALF, HALF);
      b.pos.z = clamp(b.pos.z, -HALF, HALF);
      b.mesh.position.copy(b.pos);
    }
  }

  _pyramidHit() {
    if (this.phase !== 'knock' || this.placed < SHARD_N) return false;
    const b = this.ball.pos;
    return len2(b.x, b.z) < 0.55 && b.y < 0.85;
  }

  _tag(a) {
    a.alive = false;
    a.out = true;
    if (a.carrying != null) {
      const s = this.shards[a.carrying];
      s.carriedBy = null;
      s.loose = true;
      s.mesh.position.set(a.pos.x, 0.02, a.pos.z);
      a.carrying = null;
      a.placeSlot = -1;
    }
    if (a.holding) this._dropBall();
    this.shakeT = 0.15;
    this.freezeT = 0.08;
    this.juice?.sparksAt(a.pos.x, 1, a.pos.z, 10);
    sfx.tag_hit();
    sfx.kid_out();
    if (this.player === a) this._swap();
    this._emitHud();
  }

  _updateAI(dt) {
    for (const a of this.athletes) {
      if (!a.alive || a === this.player) continue;
      a.aiT -= dt;
      if (a.aiT > 0) {
        a.pos.x = clamp(a.pos.x + a.vel.x * dt, -HALF, HALF);
        a.pos.z = clamp(a.pos.z + a.vel.z * dt, -HALF, HALF);
        continue;
      }
      a.aiT = 0.2 + Math.random() * 0.2;
      if (this.phase === 'knock') {
        if (a.team === this.knockTeam) {
          // idle near throw line
          a.vel.set((Math.random() - 0.5) * 0.5, 0, 0);
          if (a.holding) {
            // AI knock attempt
            const charge = 0.35 + Math.random() * 0.25;
            const err = (Math.random() - 0.5) * 0.25;
            this.ball.state = 'fly';
            this.ball.holder = null;
            a.holding = false;
            this.ball.pos.set(a.pos.x, 1.15, a.pos.z);
            this.ball.vel.set(err * 4, 4, 11 + charge * 6);
            this.ball.thrower = a;
            this.ball.tagThrow = false;
            sfx.ball_throw();
          }
        } else {
          a.vel.set((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 0.8);
        }
      } else if (this.phase === 'live') {
        if (a.team === this.rebuildTeam) {
          this._aiRebuild(a);
        } else {
          this._aiTag(a);
        }
      }
      a.pos.x = clamp(a.pos.x + a.vel.x * dt, -HALF, HALF);
      a.pos.z = clamp(a.pos.z + a.vel.z * dt, -HALF, HALF);
      if (len2(a.vel.x, a.vel.z) > 0.1) a.yaw = Math.atan2(a.vel.x, a.vel.z);
    }
  }

  _aiRebuild(a) {
    const carriers = this.athletes.filter((x) => x.team === this.rebuildTeam && x.carrying != null).length;
    if (a.carrying != null) {
      // go to center and place
      const dx = -a.pos.x; const dz = -a.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      a.vel.set((dx / d) * a.speed * 0.9, 0, (dz / d) * a.speed * 0.9);
      if (d < REBUILD_R * 0.7) {
        const slot = this._nextValidSlot();
        if (slot >= 0) {
          a.placeSlot = slot;
          this.placeT = PLACE_T; // AI places instantly-ish
          this._finishPlace(a);
        }
      }
      return;
    }
    if (carriers >= 2) {
      // bait — run away from ball
      const bx = this.ball.pos.x; const bz = this.ball.pos.z;
      const dx = a.pos.x - bx; const dz = a.pos.z - bz;
      const d = Math.hypot(dx, dz) || 1;
      a.vel.set((dx / d) * a.speed, 0, (dz / d) * a.speed);
      return;
    }
    // seek loose shard
    let best = null; let bestD = 99;
    for (const s of this.shards) {
      if (!s.loose || s.carriedBy) continue;
      const d = len2(s.mesh.position.x - a.pos.x, s.mesh.position.z - a.pos.z);
      if (d < bestD) { bestD = d; best = s; }
    }
    if (best) {
      const dx = best.mesh.position.x - a.pos.x;
      const dz = best.mesh.position.z - a.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      a.vel.set((dx / d) * a.speed, 0, (dz / d) * a.speed);
      if (d < PICK_R) {
        const idx = this.shards.indexOf(best);
        best.carriedBy = a;
        best.loose = false;
        a.carrying = idx;
        sfx.shard_pick();
      }
    }
  }

  _aiTag(a) {
    if (a.holding) {
      // root — look for pass or throw
      a.vel.set(0, 0, 0);
      this.holdT += 0.05;
      const targets = this.athletes.filter((x) => x.team === this.rebuildTeam && x.alive);
      const near = targets.filter((x) => len2(x.pos.x, x.pos.z) < REBUILD_R + 0.5);
      if (near.length && Math.random() > 0.4) {
        const t = near[Math.floor(Math.random() * near.length)];
        const dx = t.pos.x - a.pos.x; const dz = t.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz) || 1;
        this.ball.state = 'fly';
        this.ball.holder = null;
        a.holding = false;
        this.ball.pos.set(a.pos.x, 1.15, a.pos.z);
        this.ball.vel.set((dx / d) * 12, 2.5, (dz / d) * 12);
        this.ball.thrower = a;
        this.ball.tagThrow = true;
        sfx.ball_throw();
      } else {
        // pass to outlet
        const mates = this.athletes.filter((x) => x.team === a.team && x !== a && x.alive);
        if (mates.length) {
          const m = mates[Math.floor(Math.random() * mates.length)];
          const dx = m.pos.x - a.pos.x; const dz = m.pos.z - a.pos.z;
          const d = Math.hypot(dx, dz) || 1;
          this.ball.state = 'pass';
          this.ball.holder = null;
          a.holding = false;
          this.ball.pos.set(a.pos.x, 1.1, a.pos.z);
          this.ball.vel.set((dx / d) * 11, 1, (dz / d) * 11);
          this.ball.passTarget = m;
          this.passChain = Math.min(3, this.passChain + 1);
          sfx.ball_pass();
        }
      }
      return;
    }
    // move toward ball or zone
    const campers = this.athletes.filter((x) => x.team === a.team && len2(x.pos.x, x.pos.z) < REBUILD_R).length;
    let tx = this.ball.pos.x; let tz = this.ball.pos.z;
    if (campers >= 2 && len2(a.pos.x, a.pos.z) < REBUILD_R + 1) {
      tx = a.pos.x * 1.2; tz = a.pos.z * 1.2;
    }
    const dx = tx - a.pos.x; const dz = tz - a.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    a.vel.set((dx / d) * a.speed, 0, (dz / d) * a.speed);
  }

  _syncAthletes(dt) {
    for (const a of this.athletes) {
      a.animT += dt;
      if (a.celebrate > 0) a.celebrate -= dt;
      a.mesh.position.x = a.pos.x;
      a.mesh.position.z = a.pos.z;
      a.mesh.position.y = a.out ? 0 : 0;
      a.mesh.rotation.y = a.yaw;
      // simple procedural run
      const j = a.mesh.userData.joints;
      if (!j) continue;
      const spd = len2(a.vel.x, a.vel.z);
      const run = spd > 0.4 && a.alive && !a.holding;
      const swing = run ? Math.sin(a.animT * 10) * 0.55 : Math.sin(a.animT * 2) * 0.05;
      if (j.leftUpperLeg) j.leftUpperLeg.rotation.x = swing;
      if (j.rightUpperLeg) j.rightUpperLeg.rotation.x = -swing;
      if (j.leftUpperArm) j.leftUpperArm.rotation.x = -swing * 0.8;
      if (j.rightUpperArm) j.rightUpperArm.rotation.x = swing * 0.8;
      if (a.celebrate > 0 && j.leftUpperArm) {
        j.leftUpperArm.rotation.x = -2.2;
        j.rightUpperArm.rotation.x = -2.2;
        a.mesh.position.y = Math.abs(Math.sin(a.animT * 12)) * 0.25;
      } else if (a.out) {
        a.mesh.rotation.x = -1.1;
        a.mesh.position.y = 0.15;
      } else {
        a.mesh.rotation.x = 0;
        a.mesh.position.y = 0;
      }
      if (a.carrying != null) {
        const s = this.shards[a.carrying];
        s.mesh.position.set(a.pos.x, 0.95, a.pos.z);
      }
    }
  }

  _camera(dt) {
    const p = this.player || this.athletes[0];
    if (!p) return;
    const focus = new THREE.Vector3(p.pos.x, 0.9, p.pos.z);
    // bias toward ball / pyramid
    focus.x = focus.x * 0.7 + this.ball.pos.x * 0.15;
    focus.z = focus.z * 0.7 + this.ball.pos.z * 0.15;
    const back = 5.2;
    const height = 3.4;
    const desired = new THREE.Vector3(
      focus.x - Math.sin(p.yaw) * back * 0.15,
      height,
      focus.z + back,
    );
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    if (this.shakeT > 0) {
      this.camera.position.x += (Math.random() - 0.5) * 0.08;
      this.camera.position.y += (Math.random() - 0.5) * 0.05;
    }
    this.camera.lookAt(focus);
  }

  _resolveTimer() {
    if (this.placed >= 8) this._endRound('boi');
    else this._endRound('wipe');
  }

  _endRound(kind) {
    if (this.phase === 'resolve' || this.phase === 'matchover') return;
    this.phase = 'resolve';
    this._resolveAcc = 0;
    if (kind === 'boi') {
      this.score[this.rebuildTeam] += 1;
      this.freezeT = 0.55;
      for (const a of this.athletes) { if (a.team === this.rebuildTeam && a.alive) a.celebrate = 1.2; }
      if (this.zoneRing) this.zoneRing.visible = false;
      sfx.boi();
      this.toast = 'BOI!';
      this.toastT = 2;
      this.hooks.onFlash?.(0.55);
    } else {
      this.score[this.tagTeam] += 1;
      sfx.wipe();
      this.toast = this.lang === 'id' ? 'Wipe!' : 'Wiped out!';
      this.toastT = 2;
    }
    this._emitHud();
  }

  _render() {
    this.rig.render(this.camera, 0.016);
  }

  _report() {
    const p = this.player;
    window.__GAME__ = {
      pos: [p?.pos.x || 0, p?.pos.z || 0],
      fps: this._fps,
      speed: p ? len2(p.vel.x, p.vel.z) : 0,
      score: this.score.teal + this.score.mango,
      over: this.phase === 'matchover',
      draws: this.renderer.info.render.calls,
      tris: this.renderer.info.render.triangles,
      phase: this.phase,
    };
  }

  _emitHud() {
    this.hooks.onHud?.({
      phase: this.phase,
      score: { ...this.score },
      round: this.round,
      timer: Math.ceil(this.timer),
      placed: this.placed,
      toast: this.toastT > 0 ? this.toast : '',
      duty: this.phase === 'live'
        ? (this.playerSide === this.rebuildTeam ? 'rebuild' : 'tag')
        : this.phase === 'knock' ? 'knock' : this.phase,
      knockLeft: this.knockLeft,
      holdWarn: this.holdT > HOLD_MAX * 0.7,
      chain: this.passChain,
      lang: this.lang,
      paused: this.paused,
    });
  }

  setLang(lang) { this.lang = lang; this._emitHud(); }
}
