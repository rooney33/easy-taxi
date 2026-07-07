"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProfile, type RideRequest } from "@/frontend/store";
import type { Ride } from "@/shared/ride-types";

const POLL_MS = 3000;

export default function CallPage() {
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const creating = useRef(false);

  // 1) 호출 생성 (새로고침 시에는 기존 호출 ID 재사용)
  useEffect(() => {
    const existingId = sessionStorage.getItem("ride-id");
    if (existingId) return;

    const saved = sessionStorage.getItem("ride-request");
    if (!saved) {
      setError("no-request");
      return;
    }
    if (creating.current) return;
    creating.current = true;

    const request = JSON.parse(saved) as RideRequest;
    const profile = getProfile();

    fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationLabel: request.destination.label,
        destinationAddress: request.destination.address,
        pickupAddress: request.pickupAddress,
        riderName: profile.name || undefined,
        riderPhone: profile.phone || undefined,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const created = (await res.json()) as Ride;
        sessionStorage.setItem("ride-id", created.id);
        setRide(created);
      })
      .catch(() => {
        creating.current = false; // 재진입 시 다시 시도할 수 있게 잠금 해제
        setError("network");
      });
  }, []);

  // 2) 배차 상태 폴링
  useEffect(() => {
    const poll = async () => {
      const id = sessionStorage.getItem("ride-id");
      if (!id) return;
      try {
        const res = await fetch(`/api/rides/${id}`);
        if (res.ok) {
          setRide((await res.json()) as Ride);
          setError((prev) => (prev === "network" ? null : prev));
        }
      } catch {
        // 일시적 통신 오류는 조용히 넘기고 다음 폴링에서 재시도
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // 3) 기다린 시간 표시
  useEffect(() => {
    if (!ride || ride.status !== "requested") return;
    const started = new Date(ride.createdAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [ride]);

  // 이미 탑승 중이면 이동 화면으로
  useEffect(() => {
    if (ride?.status === "riding" || ride?.status === "arrived") {
      router.replace("/riding");
    }
  }, [ride?.status, router]);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("ride-id");
    sessionStorage.removeItem("ride-request");
    sessionStorage.removeItem("selected-destination");
  }, []);

  async function handleCancel() {
    const id = sessionStorage.getItem("ride-id");
    if (id) {
      try {
        await fetch(`/api/rides/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      } catch {
        // 취소 실패해도 화면은 홈으로 — 운영자가 상태를 정리한다
      }
    }
    clearSession();
    router.push("/");
  }

  // 서버 상태 변경이 성공했을 때만 다음 화면으로 — 실패 시 화면과 서버가 어긋나지 않게
  async function handleStartRide() {
    const id = sessionStorage.getItem("ride-id");
    if (!id) return;
    try {
      const res = await fetch(`/api/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "riding" }),
      });
      if (!res.ok) throw new Error();
      router.push("/riding");
    } catch {
      setActionFailed(true);
    }
  }

  function handleGoHome() {
    clearSession();
    router.push("/");
  }

  // 목적지 없이 직접 진입한 경우
  if (error === "no-request") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5">
        <h1 className="text-[30px] font-bold mb-4 text-center">
          먼저 가실 곳을<br />선택해주세요
        </h1>
        <button
          onClick={handleGoHome}
          className="py-5 px-12 rounded-2xl text-white text-[26px] font-bold shadow-lg"
          style={{ backgroundColor: "var(--primary)" }}
        >
          가실 곳 고르기
        </button>
      </div>
    );
  }

  if (error === "network" && !ride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5">
        <div className="text-[60px] mb-5">📞</div>
        <h1 className="text-[30px] font-bold mb-3 text-center">
          연결이 잘 안 돼요
        </h1>
        <p className="text-[24px] mb-8 text-center" style={{ color: "var(--gray-dark)" }}>
          잠시 후 다시 한번<br />눌러주세요
        </p>
        <button
          onClick={handleGoHome}
          className="py-5 px-12 rounded-2xl text-white text-[26px] font-bold shadow-lg"
          style={{ backgroundColor: "var(--primary)" }}
        >
          처음으로
        </button>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5">
        <div className="text-[70px] mb-6 animate-bounce">🚕</div>
        <h1 className="text-[34px] font-bold">택시를 부르고 있어요</h1>
      </div>
    );
  }

  const waitMin = Math.floor(elapsed / 60);
  const waitSec = elapsed % 60;

  return (
    <div className="flex flex-col min-h-screen p-5">
      {/* 배차 중: 운영 데스크가 콜택시를 잡는 동안 */}
      {ride.status === "requested" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-[70px] mb-6 animate-bounce">🚕</div>
          <h1 className="text-[34px] font-bold mb-3">택시를 부르고 있어요</h1>
          <p className="text-[26px] mb-2" style={{ color: "var(--gray-dark)" }}>
            {ride.destinationLabel}
          </p>

          <p className="text-[24px] mt-6 mb-2" style={{ color: "var(--gray-dark)" }}>
            기다린 시간{" "}
            <span className="font-bold" style={{ color: "var(--primary)" }}>
              {waitMin > 0 ? `${waitMin}분 ` : ""}{waitSec}초
            </span>
          </p>
          <p className="text-[22px] text-center" style={{ color: "var(--gray)" }}>
            보통 1~3분 정도 걸려요<br />
            잠시만 기다려주세요
          </p>

          <button
            onClick={handleCancel}
            className="mt-10 py-5 px-12 rounded-2xl border-3 text-[26px] font-bold"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
          >
            취소하기
          </button>
        </div>
      )}

      {/* 배차 완료: 운영 데스크가 입력한 실제 택시 정보 */}
      {ride.status === "matched" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <h1 className="text-[36px] font-bold mb-6" style={{ color: "var(--success)" }}>
            택시가 잡혔어요!
          </h1>

          <div className="bg-white rounded-2xl p-6 shadow-lg w-full mb-6">
            <div className="text-center mb-5">
              <p className="text-[20px] mb-1" style={{ color: "var(--gray)" }}>차량번호</p>
              <p className="text-[38px] font-bold tracking-wider">
                {ride.taxiNumber || "확인 중"}
              </p>
            </div>
            {ride.driverName && (
              <div className="text-center mb-5">
                <p className="text-[20px] mb-1" style={{ color: "var(--gray)" }}>기사님</p>
                <p className="text-[28px] font-bold">{ride.driverName} 님</p>
              </div>
            )}
            {ride.etaMinutes != null && (
              <div className="text-center">
                <p className="text-[20px] mb-1" style={{ color: "var(--gray)" }}>예상 도착</p>
                <p className="text-[28px] font-bold" style={{ color: "var(--primary)" }}>
                  약 {ride.etaMinutes}분
                </p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 rounded-2xl p-5 mb-6 w-full border-2 border-yellow-400">
            <p className="text-[22px] text-center font-bold">
              택시가 올 때까지<br />안전한 곳에서 기다려주세요
            </p>
          </div>

          {actionFailed && (
            <p className="text-[22px] font-bold text-center mb-3" style={{ color: "var(--danger)" }}>
              연결이 불안정해요<br />한 번 더 눌러주세요
            </p>
          )}

          <button
            onClick={handleStartRide}
            className="w-full py-6 rounded-2xl text-white text-[28px] font-bold shadow-lg mb-3"
            style={{ backgroundColor: "var(--success)" }}
          >
            택시 탑승 완료
          </button>

          <button
            onClick={handleCancel}
            className="w-full py-4 rounded-2xl border-3 text-[22px] font-bold"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            취소하기
          </button>
        </div>
      )}

      {/* 배차 실패/취소 */}
      {ride.status === "cancelled" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-[60px] mb-5">🙏</div>
          <h1 className="text-[32px] font-bold mb-4 text-center">
            지금은 택시를<br />잡지 못했어요
          </h1>
          <p className="text-[24px] mb-8 text-center" style={{ color: "var(--gray-dark)" }}>
            {ride.cancelReason || "잠시 후 다시 불러주세요"}
          </p>
          <button
            onClick={handleGoHome}
            className="w-full py-6 rounded-2xl text-white text-[28px] font-bold shadow-lg"
            style={{ backgroundColor: "var(--primary)" }}
          >
            처음으로
          </button>
        </div>
      )}
    </div>
  );
}
