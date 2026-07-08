import {
  CATEGORY_WEIGHT,
  LANDMARK_CATEGORY_CODES,
  coordToAddress,
  searchPlacesByCategory,
  type KakaoPlace,
} from "@/backend/kakao-local";
import type { Landmark, PickupLandmarkResponse } from "@/shared/location-types";

// 출발지 AI ③ 기준 건물 선정: GPS 좌표 → 주변 후보 검색 → 점수화 → 상위 후보 반환
// (계획서 §2.2 — 초기엔 규칙 기반 점수, 이후 "모르는 곳이에요" 응답으로 가중치 개선)

const SEARCH_RADIUS_M = 300;
const MAX_CANDIDATES = 3;

// 건물이 아니어서 랜드마크가 될 수 없는 것들 (ATM 기기, 365코너 등)
function isNotBuilding(place: KakaoPlace): boolean {
  return /ATM|365코너|무인|자동화/i.test(place.place_name);
}

// 빌딩 안 입주 사무실(OO청 한국사무소 등)은 밖에서 간판이 안 보임
function isOfficeInBuilding(place: KakaoPlace): boolean {
  return /사무소|출장소|\d+층/.test(place.place_name);
}

// HP8(병원)은 동네 의원·치과까지 포함하므로, 어르신이 아는 큰 병원만 높게 친다
function hospitalWeight(place: KakaoPlace): number {
  if (/종합병원|대학병원/.test(place.category_name)) return 90;
  return 25; // 개인 의원·치과·한의원 등 — 랜드마크로 부적합
}

// 카테고리 인지도 + 가까움 + 주소/이름 품질로 점수화
function scorePlace(place: KakaoPlace): number {
  const distance = Number(place.distance || 9999);
  const categoryScore =
    place.category_group_code === "HP8"
      ? hospitalWeight(place)
      : CATEGORY_WEIGHT[place.category_group_code] ?? 10;
  const distancePenalty = distance / 5; // 5m당 1점 감점 → 300m면 -60점
  const roadAddressBonus = place.road_address_name ? 10 : 0;
  const simpleNameBonus = place.place_name.length <= 15 ? 5 : 0; // 긴 상호는 어르신이 읽기 어려움
  const officePenalty = isOfficeInBuilding(place) ? 60 : 0;
  return categoryScore + roadAddressBonus + simpleNameBonus - distancePenalty - officePenalty;
}

function toLandmark(place: KakaoPlace): Landmark {
  return {
    name: place.place_name,
    category: place.category_group_name,
    address: place.address_name,
    roadAddress: place.road_address_name || undefined,
    lat: Number(place.y),
    lng: Number(place.x),
    distanceMeters: Number(place.distance),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat, lng가 필요합니다" }, { status: 400 });
  }

  let results: KakaoPlace[][];
  let address: string | undefined;
  try {
    [results, address] = await Promise.all([
      Promise.all(
        LANDMARK_CATEGORY_CODES.map((code) =>
          searchPlacesByCategory(code, lat, lng, SEARCH_RADIUS_M)
        )
      ),
      coordToAddress(lat, lng),
    ]);
  } catch (e) {
    console.error("랜드마크 검색 실패:", e);
    return Response.json(
      { error: "주변 건물 정보를 찾지 못했습니다" },
      { status: 502 }
    );
  }

  // 같은 장소가 여러 카테고리에 걸리는 경우 제거 후 점수순 정렬
  const seen = new Set<string>();
  const candidates = results
    .flat()
    .filter((p) => !isNotBuilding(p))
    .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
    .sort((a, b) => scorePlace(b) - scorePlace(a))
    .slice(0, MAX_CANDIDATES);

  const landmarks = candidates.map(toLandmark);
  const best = landmarks[0];

  const body: PickupLandmarkResponse = {
    pickup: { lat, lng, address },
    landmarks,
    guideText: best
      ? `${best.name} 앞에서 기다려주세요`
      : "현재 위치 근처에서 기다려주세요",
  };
  return Response.json(body);
}
