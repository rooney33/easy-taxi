"use client";

// 운영자(수동 배차) 데스크 — 시범운영 단계에서 사람이 배차망 역할을 한다.
// 어르신 호출이 뜨면: ① 콜택시 회사에 전화 → ② 잡힌 택시 정보 입력 → ③ [배차 완료 보내기]

import { useState, useEffect, useRef, useCallback } from "react";
import type { Ride, RideStatus } from "@/shared/ride-types";

const POLL_MS = 3000;

const STATUS_LABEL: Record<RideStatus, { text: string; color: string }> = {
  requested: { text: "호출 대기", color: "#DC2626" },
  matched: { text: "배차 완료", color: "#2563EB" },
  riding: { text: "이동 중", color: "#16A34A" },
  arrived: { text: "도착", color: "#6B7280" },
  cancelled: { text: "취소", color: "#9CA3AF" },
};

function timeOf(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // 소리 재생 실패는 무시
  }
}

function MatchForm({
  ride,
  onSubmit,
  onCancel,
}: {
  ride: Ride;
  onSubmit: (fields: { taxiNumber: string; driverName: string; etaMinutes?: number }) => void;
  onCancel: (reason: string) => void;
}) {
  const [taxiNumber, setTaxiNumber] = useState(ride.taxiNumber ?? "");
  const [driverName, setDriverName] = useState(ride.driverName ?? "");
  const [eta, setEta] = useState(ride.etaMinutes?.toString() ?? "");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  if (cancelling) {
    return (
      <div className="mt-3 border-t pt-3">
        <input
          type="text"
          placeholder="취소 사유 (어르신 화면에 표시됨)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 text-[15px] mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setCancelling(false)}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-[14px]"
          >
            돌아가기
          </button>
          <button
            onClick={() => onCancel(reason)}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-[14px] font-bold"
          >
            호출 취소 확정
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t pt-3">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input
          type="text"
          placeholder="차량번호 *"
          value={taxiNumber}
          onChange={(e) => setTaxiNumber(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 text-[15px] col-span-2"
        />
        <input
          type="number"
          placeholder="도착(분)"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 text-[15px]"
        />
      </div>
      <input
        type="text"
        placeholder="기사님 성함 (선택)"
        value={driverName}
        onChange={(e) => setDriverName(e.target.value)}
        className="w-full p-2 rounded-lg border border-gray-300 text-[15px] mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setCancelling(true)}
          className="py-2 px-4 rounded-lg border border-red-300 text-red-600 text-[14px]"
        >
          배차 실패
        </button>
        <button
          onClick={() =>
            taxiNumber.trim() &&
            onSubmit({
              taxiNumber: taxiNumber.trim(),
              driverName: driverName.trim(),
              etaMinutes: eta ? Number(eta) : undefined,
            })
          }
          disabled={!taxiNumber.trim()}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-[15px] font-bold disabled:opacity-40"
        >
          배차 완료 보내기 →
        </button>
      </div>
    </div>
  );
}

export default function OperatorPage() {
  const [key, setKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [authError, setAuthError] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>("");
  const prevRequestedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setKey(localStorage.getItem("operator-key"));
  }, []);

  const fetchRides = useCallback(async () => {
    if (!key) return;
    try {
      const res = await fetch("/api/rides", {
        headers: { "x-operator-key": key },
      });
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as Ride[];

      // 새 호출이 들어오면 소리로 알림
      const requestedIds = new Set(
        data.filter((r) => r.status === "requested").map((r) => r.id)
      );
      const hasNew = [...requestedIds].some((id) => !prevRequestedIds.current.has(id));
      if (hasNew && prevRequestedIds.current.size >= 0 && lastFetch) beep();
      prevRequestedIds.current = requestedIds;

      setRides(data);
      setAuthError(false);
      setLastFetch(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      // 다음 폴링에서 재시도
    }
  }, [key, lastFetch]);

  useEffect(() => {
    if (!key) return;
    fetchRides();
    const timer = setInterval(fetchRides, POLL_MS);
    return () => clearInterval(timer);
  }, [key, fetchRides]);

  async function patchRide(id: string, body: Record<string, unknown>) {
    if (!key) return;
    await fetch(`/api/rides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-operator-key": key },
      body: JSON.stringify(body),
    });
    fetchRides();
  }

  if (key === null || authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-gray-50">
        <h1 className="text-[24px] font-bold mb-2">🚕 운영자 데스크</h1>
        {authError && (
          <p className="text-[15px] text-red-600 mb-3">키가 올바르지 않습니다</p>
        )}
        <input
          type="password"
          placeholder="운영자 키"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          className="w-full max-w-[300px] p-3 rounded-xl border border-gray-300 text-[16px] mb-3"
        />
        <button
          onClick={() => {
            localStorage.setItem("operator-key", keyInput);
            setAuthError(false);
            setKey(keyInput);
          }}
          className="w-full max-w-[300px] py-3 rounded-xl bg-blue-600 text-white text-[16px] font-bold"
        >
          입장
        </button>
      </div>
    );
  }

  const active = rides.filter((r) =>
    ["requested", "matched", "riding"].includes(r.status)
  );
  const finished = rides
    .filter((r) => ["arrived", "cancelled"].includes(r.status))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-bold">🚕 운영자 데스크</h1>
        <button onClick={fetchRides} className="text-[14px] text-blue-600 font-bold">
          새로고침
        </button>
      </div>
      <p className="text-[13px] text-gray-500 mb-5">
        어르신 호출이 뜨면 콜택시에 전화해 택시를 잡고, 차량 정보를 입력해 보내세요.
        {lastFetch && ` · 마지막 확인 ${lastFetch}`}
      </p>

      {active.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-[16px] mb-6">
          대기 중인 호출이 없습니다
        </div>
      )}

      {active.map((ride) => {
        const badge = STATUS_LABEL[ride.status];
        return (
          <div
            key={ride.id}
            className="bg-white rounded-xl p-4 shadow-sm mb-3 border-l-4"
            style={{ borderLeftColor: badge.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[13px] font-bold px-2 py-1 rounded-md text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.text}
              </span>
              <span className="text-[13px] text-gray-400">{timeOf(ride.createdAt)} 호출</span>
            </div>

            <p className="text-[18px] font-bold mb-1">
              {ride.destinationLabel}
              <span className="text-[14px] font-normal text-gray-500 ml-2">
                {ride.destinationAddress}
              </span>
            </p>
            <p className="text-[14px] text-gray-600 mb-1">출발: {ride.pickupAddress}</p>
            <p className="text-[14px] text-gray-600">
              승객: {ride.riderName || "이름 미입력"}
              {ride.riderPhone && (
                <a href={`tel:${ride.riderPhone}`} className="text-blue-600 font-bold ml-2">
                  📞 {ride.riderPhone}
                </a>
              )}
            </p>

            {ride.status === "requested" && (
              <MatchForm
                ride={ride}
                onSubmit={(fields) => patchRide(ride.id, { status: "matched", ...fields })}
                onCancel={(reason) =>
                  patchRide(ride.id, { status: "cancelled", cancelReason: reason })
                }
              />
            )}

            {ride.status === "matched" && (
              <div className="mt-2 pt-2 border-t text-[14px] text-gray-700">
                🚕 {ride.taxiNumber}
                {ride.driverName && ` · ${ride.driverName} 기사님`}
                {ride.etaMinutes != null && ` · 약 ${ride.etaMinutes}분 후 도착`}
                <button
                  onClick={() =>
                    patchRide(ride.id, {
                      status: "cancelled",
                      cancelReason: "택시 사정으로 취소되었어요. 다시 불러주세요",
                    })
                  }
                  className="ml-3 text-red-500 underline"
                >
                  배차 취소
                </button>
              </div>
            )}

            {ride.status === "riding" && (
              <p className="mt-2 pt-2 border-t text-[14px] text-green-700 font-bold">
                🚕 {ride.taxiNumber} 탑승 · {ride.destinationLabel}(으)로 이동 중
              </p>
            )}
          </div>
        );
      })}

      {finished.length > 0 && (
        <>
          <h2 className="text-[16px] font-bold text-gray-500 mt-8 mb-3">완료된 호출</h2>
          {finished.map((ride) => (
            <div key={ride.id} className="bg-white rounded-xl p-3 mb-2 opacity-70">
              <div className="flex items-center justify-between">
                <p className="text-[14px]">
                  <span
                    className="font-bold mr-2"
                    style={{ color: STATUS_LABEL[ride.status].color }}
                  >
                    [{STATUS_LABEL[ride.status].text}]
                  </span>
                  {ride.destinationLabel}
                  {ride.taxiNumber && ` · ${ride.taxiNumber}`}
                </p>
                <span className="text-[13px] text-gray-400">{timeOf(ride.createdAt)}</span>
              </div>
              {ride.cancelReason && (
                <p className="text-[13px] text-gray-400 mt-1">사유: {ride.cancelReason}</p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
