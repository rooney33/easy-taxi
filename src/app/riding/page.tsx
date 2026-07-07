"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFamilyContacts, type FamilyContact } from "@/frontend/store";
import type { Ride } from "@/shared/ride-types";

const POLL_MS = 5000;

export default function RidingPage() {
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([]);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setFamilyContacts(getFamilyContacts());
    const poll = async () => {
      const id = sessionStorage.getItem("ride-id");
      if (!id) {
        router.replace("/");
        return;
      }
      try {
        const res = await fetch(`/api/rides/${id}`);
        if (res.ok) setRide((await res.json()) as Ride);
      } catch {
        // 다음 폴링에서 재시도
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    if (!ride) return;
    const timer = setTimeout(() => setNotified(true), 1500);
    return () => clearTimeout(timer);
  }, [ride]);

  async function handleArrived() {
    const id = sessionStorage.getItem("ride-id");
    if (id) {
      try {
        await fetch(`/api/rides/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "arrived" }),
        });
      } catch {
        // 통신 실패해도 도착 화면은 보여준다
      }
    }
    setRide((prev) => (prev ? { ...prev, status: "arrived" } : prev));
  }

  function handleGoHome() {
    sessionStorage.removeItem("ride-id");
    sessionStorage.removeItem("ride-request");
    sessionStorage.removeItem("selected-destination");
    router.push("/");
  }

  if (!ride) return null;

  const arrived = ride.status === "arrived";

  return (
    <div className="flex flex-col min-h-screen p-5">
      {!arrived ? (
        <>
          <div className="text-center mb-6">
            <h1 className="text-[34px] font-bold" style={{ color: "var(--primary)" }}>
              이동 중이에요
            </h1>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[22px]" style={{ color: "var(--gray)" }}>차량번호</span>
              <span className="text-[28px] font-bold">{ride.taxiNumber || "-"}</span>
            </div>
            {ride.driverName && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-[22px]" style={{ color: "var(--gray)" }}>기사님</span>
                <span className="text-[28px] font-bold">{ride.driverName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[22px]" style={{ color: "var(--gray)" }}>목적지</span>
              <span className="text-[28px] font-bold">{ride.destinationLabel}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
            <p className="text-[24px] font-bold mb-1 text-center">
              요금은 내리실 때
            </p>
            <p className="text-[22px] text-center" style={{ color: "var(--gray-dark)" }}>
              기사님께 직접 내시면 돼요<br />(현금 또는 카드)
            </p>
          </div>

          <div
            className="rounded-2xl p-5 mb-4 border-2"
            style={{
              backgroundColor: notified ? "#F0FDF4" : "#FEFCE8",
              borderColor: notified ? "var(--success)" : "#FACC15",
            }}
          >
            {notified ? (
              <>
                <p className="text-[24px] font-bold mb-2" style={{ color: "var(--success)" }}>
                  가족에게 알림을 보냈어요
                </p>
                {familyContacts.map((c) => (
                  <p key={c.id} className="text-[20px]" style={{ color: "var(--gray-dark)" }}>
                    {c.name}({c.relation})에게 전송 완료
                  </p>
                ))}
                <p className="text-[18px] mt-2" style={{ color: "var(--gray)" }}>
                  &quot;{ride.taxiNumber || "택시"} 택시를 타고 {ride.destinationLabel}(으)로 이동 중입니다&quot;
                </p>
              </>
            ) : (
              <p className="text-[24px] font-bold" style={{ color: "#CA8A04" }}>
                가족에게 알림 보내는 중...
              </p>
            )}
          </div>

          <button
            onClick={handleArrived}
            className="w-full py-6 rounded-2xl text-white text-[28px] font-bold shadow-lg mt-auto"
            style={{ backgroundColor: "var(--success)" }}
          >
            도착했어요!
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1">
          <h1 className="text-[36px] font-bold mb-3">안전하게 도착했어요!</h1>
          <p className="text-[26px] mb-6" style={{ color: "var(--gray-dark)" }}>
            {ride.destinationLabel}
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-md w-full mb-6">
            <p className="text-[24px] font-bold text-center mb-1">
              요금은 기사님께
            </p>
            <p className="text-[22px] text-center" style={{ color: "var(--gray-dark)" }}>
              직접 결제해주세요<br />(현금 또는 카드)
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 w-full mb-8 border-2" style={{ borderColor: "var(--success)" }}>
            <p className="text-[22px] text-center font-bold" style={{ color: "var(--success)" }}>
              가족에게 도착 알림을 보냈어요
            </p>
          </div>

          <button
            onClick={handleGoHome}
            className="w-full py-6 rounded-2xl text-white text-[28px] font-bold shadow-lg"
            style={{ backgroundColor: "var(--primary)" }}
          >
            홈으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
