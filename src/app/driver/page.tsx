"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 기사님 등급 정의 (노인 공경 운행 누적 기준)
const TIERS = [
  { name: "브론즈", min: 0, color: "#CD7F32", benefit: "기본 배차" },
  { name: "실버", min: 30, color: "#9CA3AF", benefit: "어르신 콜 우선 배차 +5%" },
  { name: "골드", min: 100, color: "#CA8A04", benefit: "우선 배차 +10% · 월 10만원 장려금" },
  { name: "디지털 효(孝) 명예기사", min: 300, color: "#FF6B00", benefit: "표창장 · 보험료 할인 · 전용 라운지" },
];

// 보유 배지 (캠페인 상징)
const BADGES = [
  { icon: "🥇", label: "어르신 100명 안심 운행", earned: true },
  { icon: "🗺️", label: "도착지 재확인 100% 달성", earned: true },
  { icon: "⭐", label: "어르신 별점 4.9 이상", earned: true },
  { icon: "🌙", label: "심야 안심 귀가 50회", earned: false },
];

export default function DriverPage() {
  const router = useRouter();
  // 데모: 배차 알림 → 운행 → 대시보드
  const [view, setView] = useState<"alert" | "confirm" | "dashboard">("alert");
  const seniorRides = 128; // 누적 어르신 운행
  const currentTier = TIERS.filter((t) => seniorRides >= t.min).at(-1)!;
  const nextTier = TIERS.find((t) => t.min > seniorRides);

  return (
    <div className="flex flex-col min-h-screen p-5">
      {/* 상단 토글 (데모용) */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("alert")}
          className="flex-1 py-2 rounded-lg text-[15px] font-bold"
          style={{ backgroundColor: view === "alert" ? "var(--primary)" : "var(--gray-light)", color: view === "alert" ? "#fff" : "var(--gray-dark)" }}
        >
          배차 알림
        </button>
        <button
          onClick={() => setView("dashboard")}
          className="flex-1 py-2 rounded-lg text-[15px] font-bold"
          style={{ backgroundColor: view === "dashboard" ? "var(--primary)" : "var(--gray-light)", color: view === "dashboard" ? "#fff" : "var(--gray-dark)" }}
        >
          내 배지·혜택
        </button>
      </div>

      {/* 1. 어르신 승객 배차 알림 */}
      {view === "alert" && (
        <div className="flex flex-col flex-1">
          <div className="rounded-2xl p-5 mb-4 border-2" style={{ backgroundColor: "#FFF7ED", borderColor: "var(--primary)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[28px]">👴</span>
              <span className="text-[24px] font-bold" style={{ color: "var(--primary)" }}>어르신 승객 호출</span>
            </div>
            <p className="text-[18px]" style={{ color: "var(--gray-dark)" }}>
              디지털 사용이 어려운 어르신입니다. 도착지를 한 번 더 확인해 주세요.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <span className="text-[18px]" style={{ color: "var(--gray)" }}>출발지</span>
              <span className="text-[20px] font-bold">강남구 역삼로 234 (CU 편의점 앞)</span>
            </div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <span className="text-[18px]" style={{ color: "var(--gray)" }}>도착지</span>
              <span className="text-[22px] font-bold" style={{ color: "var(--danger)" }}>삼성서울병원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[18px]" style={{ color: "var(--gray)" }}>예상 요금</span>
              <span className="text-[22px] font-bold">8,500원</span>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#EFF6FF" }}>
            <p className="text-[16px]" style={{ color: "var(--secondary)" }}>
              💡 이 운행을 완료하면 <b>어르신 운행 +1</b> · 골드 등급까지 <b>{nextTier ? nextTier.min - seniorRides : 0}건</b> 남았어요
            </p>
          </div>

          <button
            onClick={() => setView("confirm")}
            className="w-full py-6 rounded-2xl text-white text-[26px] font-bold shadow-lg mt-auto"
            style={{ backgroundColor: "var(--success)" }}
          >
            배차 수락하기
          </button>
        </div>
      )}

      {/* 2. 도착지 재확인 */}
      {view === "confirm" && (
        <div className="flex flex-col flex-1">
          <h1 className="text-[26px] font-bold mb-4 text-center">도착지를 한 번 더<br />확인해 주세요</h1>
          <div className="bg-white rounded-2xl p-6 shadow-md mb-4 text-center">
            <p className="text-[18px] mb-1" style={{ color: "var(--gray)" }}>어르신이 가시려는 곳</p>
            <p className="text-[34px] font-bold mb-2" style={{ color: "var(--danger)" }}>삼성서울병원</p>
            <p className="text-[16px]" style={{ color: "var(--gray-dark)" }}>서울시 강남구 일원동 81</p>
          </div>
          <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: "#FFFBEB", borderColor: "#FACC15" }}>
            <p className="text-[17px] text-center font-bold" style={{ color: "#A16207" }}>
              승차 후 어르신께 목적지를 직접 여쭤보고<br />출발해 주세요 🙏
            </p>
          </div>
          <button
            onClick={() => setView("dashboard")}
            className="w-full py-6 rounded-2xl text-white text-[24px] font-bold shadow-lg mt-auto"
            style={{ backgroundColor: "var(--primary)" }}
          >
            확인했어요, 운행 시작
          </button>
        </div>
      )}

      {/* 3. 배지·등급·혜택 대시보드 */}
      {view === "dashboard" && (
        <div className="flex flex-col flex-1">
          {/* 등급 카드 */}
          <div className="rounded-2xl p-6 shadow-md mb-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${currentTier.color}, #1A1A1A)` }}>
            <p className="text-[18px] opacity-90 mb-1">노인 공경 기사 등급</p>
            <p className="text-[40px] font-bold mb-2">{currentTier.name} 기사</p>
            <p className="text-[22px]">누적 어르신 운행 <b>{seniorRides}회</b></p>
            {nextTier && (
              <div className="mt-4">
                <div className="w-full bg-white/30 rounded-full h-3">
                  <div className="h-3 rounded-full bg-white" style={{ width: `${(seniorRides / nextTier.min) * 100}%` }} />
                </div>
                <p className="text-[15px] mt-2 opacity-90">{nextTier.name}까지 {nextTier.min - seniorRides}회</p>
              </div>
            )}
          </div>

          {/* 표창장 */}
          <div className="rounded-2xl p-5 mb-4 border-4 text-center" style={{ borderColor: "var(--primary)", backgroundColor: "#FFFDF7" }}>
            <p className="text-[16px]" style={{ color: "var(--gray)" }}>카카오모빌리티 표창</p>
            <p className="text-[24px] font-bold my-1" style={{ color: "var(--primary)" }}>🏆 디지털 효(孝) 운행 감사장</p>
            <p className="text-[15px]" style={{ color: "var(--gray-dark)" }}>어르신의 안전한 이동에 기여하신 김기사님께 드립니다</p>
          </div>

          {/* 배지 그리드 */}
          <p className="text-[20px] font-bold mb-3">획득한 배지</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {BADGES.map((b) => (
              <div key={b.label} className="rounded-2xl p-4 text-center shadow-sm" style={{ backgroundColor: b.earned ? "#fff" : "var(--gray-light)", opacity: b.earned ? 1 : 0.5 }}>
                <div className="text-[36px] mb-1" style={{ filter: b.earned ? "none" : "grayscale(1)" }}>{b.icon}</div>
                <p className="text-[14px] font-bold leading-tight">{b.label}</p>
              </div>
            ))}
          </div>

          {/* 현재 혜택 */}
          <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
            <p className="text-[18px] font-bold mb-2">현재 받는 혜택</p>
            <p className="text-[20px]" style={{ color: "var(--success)" }}>✓ {currentTier.benefit}</p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-4 rounded-2xl border-3 text-[18px] font-bold"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            어르신용 화면 보기
          </button>
        </div>
      )}
    </div>
  );
}
