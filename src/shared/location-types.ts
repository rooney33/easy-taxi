// 출발지 AI — 클라이언트/서버가 공유하는 위치·랜드마크 타입 (서버 전용 모듈 import 금지)

// 어르신이 알아보기 쉬운 기준 건물 후보 1곳
export interface Landmark {
  name: string; // 예: "국민은행 역삼점"
  category: string; // 예: "은행"
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  distanceMeters: number; // 어르신 현재 위치로부터의 거리
}

export interface PickupLandmarkResponse {
  pickup: {
    lat: number;
    lng: number;
    address?: string; // coord2address 결과 (도로명 우선)
  };
  // 점수순 상위 후보들 — 첫 번째를 보여주고, "모르는 곳이에요" 시 다음 후보 제시
  landmarks: Landmark[];
  guideText: string; // 예: "국민은행 역삼점 앞에서 기다려주세요"
}
