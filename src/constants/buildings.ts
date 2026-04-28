import type { Building, Gender } from '../types';

interface BuildingMeta {
  id: Building;
  gender: Gender;
  roomType: '2인실' | '4인실';
  floors: number[];
  roomsPerFloor: number;
}

export const BUILDINGS: Record<Building, BuildingMeta> = {
  A: { id: 'A', gender: 'male',   roomType: '2인실', floors: [2,3,4,5,6,7,8,9], roomsPerFloor: 16 },
  B: { id: 'B', gender: 'female', roomType: '2인실', floors: [2,3,4,5,6,7,8],   roomsPerFloor: 16 },
  C: { id: 'C', gender: 'female', roomType: '2인실', floors: [2,3,4,5,6,7,8],   roomsPerFloor: 16 },
  D: { id: 'D', gender: 'female', roomType: '4인실', floors: [2,3,4,5,6,7,8],   roomsPerFloor: 12 },
  E: { id: 'E', gender: 'male',   roomType: '4인실', floors: [2,3,4,5,6,7,8],   roomsPerFloor: 12 },
};

export const BUILDING_IDS = Object.keys(BUILDINGS) as Building[];

export const MALE_BUILDINGS   = BUILDING_IDS.filter(b => BUILDINGS[b].gender === 'male');
export const FEMALE_BUILDINGS = BUILDING_IDS.filter(b => BUILDINGS[b].gender === 'female');

/** 동·층 선택 시 호수 목록 생성 (예: 3층 → 301, 302 … 316) */
export function getRoomNumbers(building: Building, floor: number): string[] {
  const count = BUILDINGS[building].roomsPerFloor;
  return Array.from({ length: count }, (_, i) =>
    `${floor}${String(i + 1).padStart(2, '0')}`,
  );
}
