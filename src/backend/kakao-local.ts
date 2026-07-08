// 카카오 로컬 REST API 호출 모음 — 서버 전용 (REST 키는 절대 프론트에 노출 금지)
// 정책 준수: 검색 결과는 호출 1건 안내용으로만 일시 사용, 누적 저장 금지
// (docs/프로젝트계획서_출발지AI.md §4 체크리스트)

const KAKAO_LOCAL_BASE = "https://dapi.kakao.com/v2/local";

function restKey(): string {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("KAKAO_REST_API_KEY가 설정되지 않았습니다");
  return key;
}

async function kakaoGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${KAKAO_LOCAL_BASE}${path}?${qs}`, {
    headers: { Authorization: `KakaoAK ${restKey()}` },
  });
  if (!res.ok) {
    throw new Error(`카카오 로컬 API 오류 (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── 카테고리 장소 검색 ──────────────────────────────────

// 카카오 카테고리 그룹 코드 → 어르신 인지도 가중치.
// 순서/점수 근거: 계획서 §2.2 ③ — 어르신이 아는 프랜차이즈/랜드마크 우선
export const CATEGORY_WEIGHT: Record<string, number> = {
  SW8: 95, // 지하철역
  HP8: 90, // 병원
  MT1: 85, // 대형마트
  PO3: 80, // 공공기관
  BK9: 75, // 은행
  SC4: 70, // 학교
  CT1: 65, // 문화시설
  AT4: 60, // 관광명소
  PM9: 55, // 약국
  CS2: 50, // 편의점
  OL7: 45, // 주유소
};

export const LANDMARK_CATEGORY_CODES = Object.keys(CATEGORY_WEIGHT);

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string; // 상세 분류 경로 (예: "의료,건강 > 병원 > 치과")
  category_group_code: string;
  category_group_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도
  y: string; // 위도
  distance: string; // 검색 기준 좌표로부터의 거리(m)
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
}

export async function searchPlacesByCategory(
  code: string,
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<KakaoPlace[]> {
  const data = await kakaoGet<KakaoSearchResponse>("/search/category.json", {
    category_group_code: code,
    x: String(lng),
    y: String(lat),
    radius: String(radiusMeters),
    sort: "distance",
    size: "5",
  });
  return data.documents;
}

// ── 좌표 → 주소 변환 ──────────────────────────────────

interface KakaoCoord2AddressResponse {
  documents: Array<{
    road_address: { address_name: string } | null;
    address: { address_name: string } | null;
  }>;
}

// 도로명주소 우선, 없으면 지번주소, 둘 다 없으면 undefined
export async function coordToAddress(
  lat: number,
  lng: number
): Promise<string | undefined> {
  const data = await kakaoGet<KakaoCoord2AddressResponse>(
    "/geo/coord2address.json",
    { x: String(lng), y: String(lat) }
  );
  const doc = data.documents[0];
  return doc?.road_address?.address_name ?? doc?.address?.address_name ?? undefined;
}
