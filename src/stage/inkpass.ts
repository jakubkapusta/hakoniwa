// Post pass between the scene render and bloom:
//  1. scrubs NaN/Inf (mobile GPUs produce them, e.g. a light sitting exactly on a surface; bloom would smear them over the screen),
//  2. draws anime-style ink lines where depth jumps (silhouettes against the sky and against things behind).
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `
uniform sampler2D tDiffuse, tDepth;
uniform vec2 texel;
uniform float near, far, strength;
uniform vec3 ink;
varying vec2 vUv;
float lin(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  float z = d * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}
bool bad(float x) { return isnan(x) || isinf(x); }
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  if (bad(c.r) || bad(c.g) || bad(c.b)) c = vec4(0.0, 0.0, 0.0, 1.0);
  c.rgb = clamp(c.rgb, 0.0, 24.0);
  float z = lin(vUv);
  float e = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 o = i == 0 ? vec2(texel.x, 0.0) : i == 1 ? vec2(-texel.x, 0.0) : i == 2 ? vec2(0.0, texel.y) : vec2(0.0, -texel.y);
    float zn = lin(vUv + o);
    // a neighbour clearly farther away → we sit on an outline (relative, so distant things get lines too)
    e = max(e, smoothstep(0.012, 0.03, (zn - z) / z));
  }
  e *= step(z, far * 0.6); // the sky plane gets no line of its own
  c.rgb = mix(c.rgb, ink * c.rgb * 0.6 + ink * 0.25, e * strength);
  gl_FragColor = c;
}`;

export class InkPass extends Pass {
  private quad: FullScreenQuad;
  private mat: THREE.ShaderMaterial;
  constructor(private camera: THREE.PerspectiveCamera) {
    super();
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS,
      uniforms: {
        tDiffuse: { value: null }, tDepth: { value: null }, texel: { value: new THREE.Vector2() },
        near: { value: 0.1 }, far: { value: 400 }, strength: { value: 0.85 }, ink: { value: new THREE.Color('#4a3428') },
      },
      depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.mat);
  }
  /** Line width in device pixels follows the pixel ratio so lines look the same on every screen. */
  lineScale = 1;
  setSize(w: number, h: number) { this.mat.uniforms.texel.value.set(this.lineScale / w, this.lineScale / h); }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    const u = this.mat.uniforms;
    u.tDiffuse.value = readBuffer.texture; u.tDepth.value = readBuffer.depthTexture;
    u.near.value = this.camera.near; u.far.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.mat.dispose(); this.quad.dispose(); }
}
