import { EKI } from './eki';
import { INARI } from './inari';
import { MATSURI } from './matsuri';
import { PRZYSTANEK } from './przystanek';
import { SENTO } from './sento';
import { YATAI } from './yatai';
import type { SceneDef } from './types';

export const SCENES: SceneDef[] = [YATAI, PRZYSTANEK, INARI, SENTO, MATSURI, EKI];
