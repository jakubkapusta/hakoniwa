// Renderer, camera, painted sky, sun and bloom. One Stage for the whole app; scenes swap the THREE.Scene contents.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { paintSky, setAniso, type SkyPalette } from '../core/paint';
import { InkPass } from './inkpass';
import { lerp, smooth } from '../core/util';
import type { LightKey } from '../scenes/types';

const V3 = THREE.Vector3;
const SKY_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_FS = `uniform sampler2D tDay, tEve; uniform float mixK, aspect; varying vec2 vUv;
void main(){
  // background-size: cover, anchored a little below the middle
  vec2 uv = vUv; if (aspect > 1.0) uv.y = (uv.y - 0.4) / aspect + 0.4; else uv.x = (uv.x - 0.5) * aspect + 0.5;
  vec3 c = mix(texture2D(tDay, uv).rgb, texture2D(tEve, uv).rgb, mixK);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  controls: OrbitControls;
  hemi = new THREE.HemisphereLight('#e3f0ff', '#9c8a62', 1.15);
  sun = new THREE.DirectionalLight('#fff1d6', 2.6);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private ink: InkPass;
  private sky: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private keys?: { day: LightKey; evening: LightKey };
  userMoved = false;
  camTarget = 1;
  /** 1 = full quality; drops when frames are slow. */
  quality = 1;
  private slow = 0;
  private fast = 0;

  constructor(public canvas: HTMLCanvasElement) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NeutralToneMapping;
    r.localClippingEnabled = true;
    setAniso(r.capabilities.getMaxAnisotropy());

    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, enablePan: false, maxPolarAngle: 1.42, minPolarAngle: 0.25, autoRotateSpeed: 0.5 });
    this.controls.addEventListener('start', () => { this.userMoved = true; });

    const s = this.sun;
    s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
    Object.assign(s.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02;

    this.sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      vertexShader: SKY_VS, fragmentShader: SKY_FS, depthWrite: false, depthTest: false,
      uniforms: { tDay: { value: null }, tEve: { value: null }, mixK: { value: 0 }, aspect: { value: 1 } },
    }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false;
    this.camera.add(this.sky);

    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    rt.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ink = new InkPass(this.camera);
    this.composer.addPass(this.ink);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.55, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.reset();
    addEventListener('resize', () => this.fit());
    this.fit();
  }

  /** Empty the scene and put back the stage furniture (camera with sky, lights). */
  reset() {
    this.scene.clear();
    this.scene.add(this.camera, this.hemi, this.sun, this.sun.target);
  }

  setSky(day: SkyPalette, evening: SkyPalette, seed = 77) {
    const old = this.sky.material.uniforms;
    (old.tDay.value as THREE.Texture | null)?.dispose(); (old.tEve.value as THREE.Texture | null)?.dispose();
    const tex = (p: SkyPalette) => { const t = new THREE.CanvasTexture(paintSky(p, seed)); t.colorSpace = THREE.SRGBColorSpace; return t; };
    old.tDay.value = tex(day); old.tEve.value = tex(evening);
  }
  setLights(keys: { day: LightKey; evening: LightKey }) { this.keys = keys; this.setEvening(0); }

  setEvening(k: number) {
    if (!this.keys) return;
    const e = smooth(k), a = this.keys.day, b = this.keys.evening;
    this.sky.material.uniforms.mixK.value = e;
    this.hemi.color.set(a.sky).lerp(new THREE.Color(b.sky), e);
    this.hemi.groundColor.set(a.ground).lerp(new THREE.Color(b.ground), e);
    this.hemi.intensity = lerp(a.hemi, b.hemi, e);
    this.sun.color.set(a.sun).lerp(new THREE.Color(b.sun), e);
    this.sun.intensity = lerp(a.sunI, b.sunI, e);
    this.sun.position.lerpVectors(new V3(...a.sunPos), new V3(...b.sunPos), e);
    this.bloom.strength = lerp(a.bloom, b.bloom, e) * (this.quality < 0.6 ? 0 : 1);
  }

  /** Frame the diorama (unless the player has moved the camera). */
  fit(force = false) {
    const w = innerWidth, h = innerHeight, a = w / h;
    this.renderer.setSize(w, h, false);
    this.ink.lineScale = this.renderer.getPixelRatio() * 1.1;
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.camera.aspect = a; this.camera.updateProjectionMatrix();
    // the sky plane fills the frustum far away
    const dist = 300, hh = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    this.sky.position.set(0, 0, -dist); this.sky.scale.set(hh * a * 1.02, hh * 1.02, 1);
    this.sky.material.uniforms.aspect.value = a;
    const D = Math.max(12.5, (a < 1 ? 7.9 : 8.4) / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * a));
    this.controls.minDistance = D * 0.4; this.controls.maxDistance = D * 1.5;
    if (!this.userMoved || force) {
      const t = new V3(0, a < 1 ? this.camTarget + 0.1 : this.camTarget, 0);
      this.controls.target.copy(t);
      this.camera.position.copy(t).addScaledVector(new V3(0.5, 0.44, 1).normalize(), D);
      this.userMoved = false;
    }
  }

  render(dt: number) {
    this.controls.update();
    this.composer.render(dt);
    this.adapt(dt);
  }

  /** Lower the pixel ratio (and then bloom) when frames are slow; never go back up within a session. */
  private adapt(dt: number) {
    if (document.hidden || dt <= 0 || dt > 0.25) return;
    if (dt > 1 / 40) { this.slow += dt; this.fast = 0; } else { this.fast += dt; this.slow = Math.max(0, this.slow - dt * 0.5); }
    if (this.slow > 2.5 && this.quality > 0.4) {
      this.slow = 0; this.quality -= 0.25;
      const pr = Math.max(1, Math.min(devicePixelRatio, 2) * this.quality);
      this.renderer.setPixelRatio(pr); this.fit();
      if (this.quality < 0.6) { this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    }
  }
}

/** Offscreen renderer for card thumbnails and box art (its own small context, kept for the session). */
export class Snapshot {
  private r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, 0.01, 200);
  constructor() {
    this.r.setPixelRatio(1); this.r.toneMapping = THREE.NeutralToneMapping;
    this.r.shadowMap.enabled = true;
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b9a888', 1.5));
    const dl = new THREE.DirectionalLight('#fff4e0', 2.2); dl.position.set(3, 6, 4); dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
    this.scene.add(dl);
  }
  /** Fit `o` in a w×h image looking along `dir`. */
  shoot(o: THREE.Object3D, w: number, h: number, dir: THREE.Vector3, fill = 1.02, type = 'image/png'): string {
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.scene.add(o);
    const sph = new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());
    const fov = THREE.MathUtils.degToRad(15) * Math.min(1, w / h);
    this.cam.position.copy(sph.center).addScaledVector(dir.clone().normalize(), (sph.radius / Math.sin(fov)) * fill);
    this.cam.lookAt(sph.center);
    this.r.render(this.scene, this.cam);
    this.scene.remove(o);
    return this.r.domElement.toDataURL(type);
  }
}
