import { createRide, listRides } from "@/backend/rides";
import { isOperator } from "../operator-auth";

// 어르신 앱: 호출 생성
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const destinationLabel = String(body.destinationLabel ?? "").trim();
  const destinationAddress = String(body.destinationAddress ?? "").trim();
  const pickupAddress = String(body.pickupAddress ?? "").trim();
  if (!destinationLabel || !pickupAddress) {
    return Response.json(
      { error: "목적지와 출발지가 필요합니다" },
      { status: 400 }
    );
  }

  const ride = await createRide({
    destinationLabel,
    destinationAddress,
    pickupAddress,
    riderName: body.riderName ? String(body.riderName).trim() : undefined,
    riderPhone: body.riderPhone ? String(body.riderPhone).trim() : undefined,
  });
  return Response.json(ride, { status: 201 });
}

// 운영자 대시보드: 호출 목록
export async function GET(request: Request) {
  if (!isOperator(request)) {
    return Response.json({ error: "운영자 인증이 필요합니다" }, { status: 401 });
  }
  return Response.json(await listRides());
}
