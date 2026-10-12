import type { FacilityType, Resources } from './types';
export const MAX_TURNS = 36;
export const GRID_SIZE = 6;
export const ACTIONS_PER_TURN = 2;
export const BASE_INCOME: Resources = { money: 40, materials: 5, staff: 1 };
export const RESEARCH_COST = { money: 30, materials: 0, staff: 1 };
export const RESEARCH_POINTS = 6;
export const TECH_POINTS_PER_LEVEL = 20;
export const START_RES: Resources = { money: 120, materials: 60, staff: 6 };

export interface FacilityDef {
  name: string; icon: string; cost: Resources; power: number; score: number; desc: string;
}
// power: positive = 供給, negative = 消費
export const FACILITIES: Record<FacilityType, FacilityDef> = {
  habitat: { name: '居住区', icon: '🏠', cost: { money: 40, materials: 30, staff: 2 }, power: -2, score: 10, desc: '人口上限+5' },
  power: { name: '発電所', icon: '⚡', cost: { money: 30, materials: 20, staff: 1 }, power: 6, score: 5, desc: '電力+6' },
  mine: { name: '採掘場', icon: '⛏️', cost: { money: 25, materials: 10, staff: 2 }, power: -1, score: 5, desc: '資材+8/月' },
  lab: { name: '研究所', icon: '🔬', cost: { money: 50, materials: 25, staff: 3 }, power: -2, score: 8, desc: '技術+4/月' },
  launch: { name: 'ロケット発射場', icon: '🚀', cost: { money: 60, materials: 40, staff: 3 }, power: -1, score: 12, desc: '人材+2/月・移住+2人/月・資金+10/月' },
};
export const FACILITY_TYPES = Object.keys(FACILITIES) as FacilityType[];
export const HABITAT_CAPACITY = 5;
export const SCORE_PER_POP = 3;
export const SCORE_PER_TECH_LEVEL = 15;
