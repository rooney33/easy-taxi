"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDestinations, saveDestinations, type Destination } from "@/frontend/store";

const COLORS = [
  "#FF6B00", "#DC2626", "#2563EB", "#16A34A",
  "#7C3AED", "#DB2777", "#0891B2", "#CA8A04",
];

export default function Home() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newColor, setNewColor] = useState("#7C3AED");

  useEffect(() => {
    setDestinations(getDestinations());
    const tick = () => {
      const now = new Date();
      const hour = now.getHours();
      const ampm = hour >= 12 ? "오후" : "오전";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      setCurrentTime(
        `${now.getMonth() + 1}월 ${now.getDate()}일 ${ampm} ${displayHour}시 ${String(now.getMinutes()).padStart(2, "0")}분`
      );
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  function handleDestinationClick(dest: Destination) {
    sessionStorage.setItem("selected-destination", JSON.stringify(dest));
    router.push("/pickup");
  }

  function handleAddPlace() {
    if (!newLabel) return;
    const updated = [
      ...destinations,
      {
        id: Date.now().toString(),
        label: newLabel,
        address: newAddress || newLabel,
        lat: 37.5,
        lng: 127.0,
        icon: "",
        color: newColor,
      },
    ];
    setDestinations(updated);
    saveDestinations(updated);
    setAdding(false);
    setNewLabel("");
    setNewAddress("");
  }

  return (
    <div className="flex flex-col min-h-screen p-5 pb-28">
      {/* 모드 선택 탭 */}
      <header className="mb-5">
        <div className="flex rounded-2xl overflow-hidden border-2 mb-3" style={{ borderColor: "var(--gray-light)" }}>
          <div
            className="flex-1 py-3 text-center text-[22px]"
            style={{ backgroundColor: "var(--gray-light)", color: "var(--gray)" }}
          >
            일반모드
          </div>
          <div
            className="flex-1 py-3 text-center text-[22px] font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            이지모드
          </div>
        </div>
        <p className="text-[22px] text-center" style={{ color: "var(--gray-dark)" }}>
          {currentTime}
        </p>
      </header>

      {/* 어디로 가시나요? */}
      <h2 className="text-[30px] font-bold mb-4">어디로 가시나요?</h2>

      <div className="flex flex-col gap-3 mb-5">
        {destinations.map((dest) => (
          <button
            key={dest.id}
            onClick={() => handleDestinationClick(dest)}
            className="w-full rounded-2xl py-5 px-6 shadow-md active:shadow-sm transition-all text-left flex items-center gap-4"
            style={{
              backgroundColor: "white",
              borderLeft: `6px solid ${dest.color}`,
            }}
          >
            <span className="text-[30px] font-bold flex-1" style={{ color: dest.color }}>
              {dest.label}
            </span>
            <span className="text-[28px]" style={{ color: "var(--gray)" }}>
              →
            </span>
          </button>
        ))}

        {/* 장소 추가 */}
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-2xl py-5 px-6 border-3 border-dashed text-[26px] font-bold"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            + 장소 추가
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <p className="text-[24px] font-bold mb-3">새 장소 추가</p>

            <div className="flex gap-2 flex-wrap mb-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="w-10 h-10 rounded-full border-3"
                  style={{
                    backgroundColor: c,
                    borderColor: newColor === c ? "#000" : "transparent",
                  }}
                />
              ))}
            </div>

            <input
              type="text"
              placeholder="이름 (예: 교회, 아들네 집)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-200 text-[22px] mb-3"
            />
            <input
              type="text"
              placeholder="주소 (선택)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-200 text-[22px] mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setAdding(false)}
                className="flex-1 py-4 rounded-xl border-2 text-[22px] font-bold"
                style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
              >
                취소
              </button>
              <button
                onClick={handleAddPlace}
                className="flex-1 py-4 rounded-xl text-white text-[22px] font-bold"
                style={{ backgroundColor: "var(--primary)" }}
              >
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 다른 방법으로 목적지 설정 */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => router.push("/call?voice=1")}
          className="flex-1 py-5 rounded-2xl text-white text-[22px] font-bold shadow-md"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          🎤 말로 하기
        </button>
        <button
          onClick={() => router.push("/search")}
          className="flex-1 py-5 rounded-2xl text-white text-[22px] font-bold shadow-md"
          style={{ backgroundColor: "var(--gray-dark)" }}
        >
          🔍 검색하기
        </button>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex max-w-[500px] mx-auto">
        <button className="flex-1 py-4 flex flex-col items-center" style={{ color: "var(--primary)" }}>
          <span className="text-[28px]">🏠</span>
          <span className="text-[18px] font-bold">홈</span>
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="flex-1 py-4 flex flex-col items-center"
          style={{ color: "var(--gray-dark)" }}
        >
          <span className="text-[28px]">⚙️</span>
          <span className="text-[18px]">설정</span>
        </button>
      </nav>
    </div>
  );
}
