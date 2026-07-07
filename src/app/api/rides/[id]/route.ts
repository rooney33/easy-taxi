import type { NextRequest } from "next/server";
import { getRide, updateRide, type UpdateRideInput } from "@/backend/rides";
import { isRideStatus, type RideStatus } from "@/shared/ride-types";
import { isOperator } from "../../operator-auth";

// 어르신 앱이 배차 상태를 폴링
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/rides/[id]">
) {
  const { id } = await ctx.params;
  const ride = await getRide(id);
  if (!ride) {
    return Response.json({ error: "호출을 찾을 수 없습니다" }, { status: 404 });
  }
  return Response.json(ride);
}

// 어르신 본인이 바꿀 수 있는 상태 전이 (그 외는 운영자 키 필요)
const RIDER_TRANSITIONS: Record<string, RideStatus[]> = {
  cancelled: ["requested", "matched"],
  riding: ["matched"],
  arrived: ["riding"],
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/rides/[id]">
) {
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const ride = await getRide(id);
  if (!ride) {
    return Response.json({ error: "호출을 찾을 수 없습니다" }, { status: 404 });
  }

  if (body.status !== undefined && !isRideStatus(body.status)) {
    return Response.json({ error: "잘못된 상태값입니다" }, { status: 400 });
  }
  const status = body.status as RideStatus | undefined;

  if (isOperator(request)) {
    const patch: UpdateRideInput = {};
    if (status) patch.status = status;
    if (body.taxiNumber !== undefined) patch.taxiNumber = String(body.taxiNumber).trim();
    if (body.driverName !== undefined) patch.driverName = String(body.driverName).trim();
    if (body.etaMinutes !== undefined) {
      const eta = Number(body.etaMinutes);
      if (!Number.isInteger(eta) || eta < 0 || eta > 24 * 60) {
        return Response.json({ error: "잘못된 도착 예정 시간입니다" }, { status: 400 });
      }
      patch.etaMinutes = eta;
    }
    if (body.cancelReason !== undefined) patch.cancelReason = String(body.cancelReason).trim();
    return Response.json(await updateRide(id, patch));
  }

  // 어르신 앱: 상태 전이만 허용
  if (!status || !RIDER_TRANSITIONS[status]?.includes(ride.status)) {
    return Response.json(
      { error: "허용되지 않는 상태 변경입니다" },
      { status: 403 }
    );
  }
  return Response.json(await updateRide(id, { status }));
}
