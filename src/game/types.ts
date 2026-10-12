export type FacilityType = 'habitat' | 'power' | 'mine' | 'lab' | 'launch';
export interface Resources { money: number; materials: number; staff: number }
export interface Nation {
  name: string;
  res: Resources;
  grid: (FacilityType | null)[]; // GRID_SIZE*GRID_SIZE
  population: number;
  techPoints: number;
}
export interface GameState {
  turn: number; // 1..MAX_TURNS
  actionsLeft: number;
  player: Nation;
  rival: Nation;
  log: string[];
  finished: boolean;
  seed: number;
}
