// What a diorama is made of. A scene is data (pieces, steps, palettes) plus a few hooks for its living details.
import type * as THREE from 'three';
import type { SkyPalette } from '../core/paint';
import type { BaseDef } from '../kit/base';
import type { Foldable } from '../kit/kit';
import type { Fx } from '../game/fx';
import type { Layer } from '../audio/audio';

export interface PieceDef {
  name: string;
  pos: [number, number, number];
  rotY?: number;
  /** Builds a fresh instance (assembled). Foldables expose userData.setFold, living pieces userData.tick(t, evening). */
  build: () => Foldable;
  /** Ambient sound layer this piece adds once placed. */
  sound?: Layer;
}
export interface StepDef { name: string; jp: string; pieces: string[] }

export interface LightKey {
  sky: string; ground: string; hemi: number;
  sun: string; sunI: number; sunPos: [number, number, number];
  bloom: number;
}

/** What a scene's hooks can touch. */
export interface SceneCtx {
  scene: THREE.Scene;
  fx: Fx;
  placed: Map<string, THREE.Object3D>;
  /** 0 = day, 1 = evening (smoothed). */
  evening: number;
  /** true after the last piece (the scene is alive). */
  done: boolean;
  /** Switch an ambient layer (0..1). */
  sound(layer: Layer, level: number): void;
}
export interface SceneHooks {
  update?(dt: number, t: number, ctx: SceneCtx): void;
  placed?(id: string, ctx: SceneCtx): void;
  /** The last piece just landed. */
  finale?(ctx: SceneCtx): void;
  /** Opened an already finished scene (no animation, just the living state). */
  alive?(ctx: SceneCtx): void;
}

export interface SceneDef {
  id: string;
  title: string;      // Polish
  jp: string;         // decorative
  season: string;     // shown on the box
  blurb: string;      // one line on the box
  box: [string, string]; // box art gradient
  seed: number;
  base: BaseDef;
  sky: { day: SkyPalette; evening: SkyPalette };
  light: { day: LightKey; evening: LightKey };
  steps: StepDef[];
  pieces: Record<string, PieceDef>;
  camTarget?: number;
  /** Hidden after the finale; tapping it counts as found. */
  secret: { name: string; build: () => Foldable; pos: [number, number, number]; rotY?: number };
  /** Ambient layers that play from the start. */
  sounds?: Layer[];
  setup(ctx: SceneCtx): SceneHooks;
}
