// 클라이언트/서버가 공유하는 호출(배차) 타입 — fs 등 서버 전용 모듈 import 금지
export type RideStatus =
  | "requested" // 어르신이 호출함 → 운영자가 콜택시에 전화 거는 중
  | "matched" // 운영자가 택시를 잡아 배차 정보를 입력함
  | "riding" // 어르신이 탑승함
  | "arrived" // 도착 완료
  | "cancelled"; // 취소됨 (어르신 취소 또는 배차 실패)

export interface Ride {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RideStatus;
  destinationLabel: string;
  destinationAddress: string;
  pickupAddress: string;
  riderName?: string;
  riderPhone?: string;
  taxiNumber?: string;
  driverName?: string;
  etaMinutes?: number;
  cancelReason?: string;
}
