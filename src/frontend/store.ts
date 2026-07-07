export interface Destination {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  color: string;
}

export interface FamilyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

// 호출 직전 화면 간 전달용 (서버 Ride 생성의 재료)
export interface RideRequest {
  destination: Destination;
  pickupAddress: string;
}

// 어르신 본인 정보 — 운영자가 콜택시 회사에 전화할 때 필요
export interface Profile {
  name: string;
  phone: string;
}

const DEFAULT_DESTINATIONS: Destination[] = [
  {
    id: "home",
    label: "우리 집",
    address: "서울시 강남구 역삼동 123-45",
    lat: 37.5013,
    lng: 127.0396,
    icon: "🏠",
    color: "#FF6B00",
  },
  {
    id: "hospital",
    label: "병원",
    address: "서울시 강남구 일원동 삼성서울병원",
    lat: 37.488,
    lng: 127.0857,
    icon: "🏥",
    color: "#DC2626",
  },
  {
    id: "senior-center",
    label: "경로당",
    address: "서울시 강남구 대치동 경로당",
    lat: 37.5025,
    lng: 127.0578,
    icon: "🏛️",
    color: "#2563EB",
  },
  {
    id: "market",
    label: "시장",
    address: "서울시 강남구 대치시장",
    lat: 37.4988,
    lng: 127.0632,
    icon: "🛒",
    color: "#16A34A",
  },
];

const DEFAULT_FAMILY: FamilyContact[] = [
  { id: "1", name: "큰아들", phone: "010-1234-5678", relation: "아들" },
  { id: "2", name: "딸", phone: "010-9876-5432", relation: "딸" },
];

// localStorage 값이 손상되어 있어도 화면이 죽지 않도록 기본값으로 복구
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function getDestinations(): Destination[] {
  return load("family-taxi-destinations", DEFAULT_DESTINATIONS);
}

export function saveDestinations(destinations: Destination[]) {
  localStorage.setItem("family-taxi-destinations", JSON.stringify(destinations));
}

export function getFamilyContacts(): FamilyContact[] {
  return load("family-taxi-family", DEFAULT_FAMILY);
}

export function saveFamilyContacts(contacts: FamilyContact[]) {
  localStorage.setItem("family-taxi-family", JSON.stringify(contacts));
}

export function getProfile(): Profile {
  return load("family-taxi-profile", { name: "", phone: "" });
}

export function saveProfile(profile: Profile) {
  localStorage.setItem("family-taxi-profile", JSON.stringify(profile));
}
