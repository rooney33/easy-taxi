"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Destination } from "@/frontend/store";

export default function PickupPage() {
  const router = useRouter();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [locating, setLocating] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("selected-destination");
    if (saved) setDestination(JSON.parse(saved));

    const timer = setTimeout(() => {
      setPickupAddress("서울시 강남구 역삼로 234 앞");
      setLocating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function handleConfirmPickup() {
    sessionStorage.setItem(
      "ride-request",
      JSON.stringify({ destination, pickupAddress })
    );
    // 새 호출이므로 이전 호출 ID는 버린다
    sessionStorage.removeItem("ride-id");
    router.push("/call");
  }

  if (!destination) return null;

  return (
    <div className="flex flex-col min-h-screen p-5">
      <button
        onClick={() => router.back()}
        className="self-start text-[20px] mb-4"
        style={{ color: "var(--gray-dark)" }}
      >
        ← 뒤로
      </button>

      {locating ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <span className="text-[50px] animate-pulse mb-4">📡</span>
          <h1 className="text-[26px] font-bold mb-2">
            위치를 찾고 있어요
          </h1>
          <p className="text-[18px]" style={{ color: "var(--gray)" }}>
            잠시만 기다려주세요...
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-[26px] font-bold mb-2">
            이 건물 앞에서 기다려주세요
          </h1>
          <p className="text-[18px] mb-4" style={{ color: "var(--gray-dark)" }}>
            택시가 이 건물 앞으로 갑니다
          </p>

          {/* 서 있어야 할 건물 1개를 크게 보여줌 - 실제로는 카카오 로드뷰 사진 */}
          <div className="w-full rounded-2xl overflow-hidden mb-4 shadow-md border-4" style={{ borderColor: "var(--primary)" }}>
            <div
              className="w-full h-[260px] relative"
              style={{
                background: "linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #E0E0E0 30%, #E0E0E0 100%)",
              }}
            >
              {/* 건물 1개만 크게 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[180px] bg-[#CD853F] rounded-t-lg relative">
                {/* 간판 */}
                <div className="absolute top-3 left-3 right-3 bg-[#1B5E20] rounded-md py-2 px-3">
                  <p className="text-center text-[18px] font-bold text-white">
                    CU 편의점
                  </p>
                </div>
                {/* 창문 */}
                <div className="absolute top-[60px] left-3 right-3 grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-full h-[18px] bg-[#FFE4B5] rounded-sm" />
                  ))}
                </div>
                {/* 출입문 */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[60px] bg-[#87CEEB] rounded-t-lg border-2 border-[#8B4513]">
                  <div className="absolute top-1/2 right-2 w-[4px] h-[10px] bg-[#8B4513] rounded-full" />
                </div>
              </div>
              {/* 화살표: 여기! */}
              <div className="absolute bottom-[185px] left-1/2 -translate-x-1/2 z-10">
                <div className="bg-red-500 text-white text-[16px] px-4 py-2 rounded-full font-bold whitespace-nowrap shadow-lg">
                  👇 여기 앞에서 기다려주세요
                </div>
              </div>
            </div>
          </div>

          {/* 주소 보조 정보 */}
          <p className="text-[16px] text-center mb-4" style={{ color: "var(--gray)" }}>
            {pickupAddress}
          </p>

          {/* 도착지 */}
          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-[16px]" style={{ color: "var(--gray)" }}>
              도착지
            </p>
            <p className="text-[22px] font-bold">
              {destination.icon} {destination.label}
            </p>
          </div>

          {/* 맞아요 / 아니에요 버튼 */}
          <button
            onClick={handleConfirmPickup}
            className="w-full py-5 rounded-2xl text-white text-[24px] font-bold shadow-lg mb-3"
            style={{ backgroundColor: "var(--primary)" }}
          >
            네, 맞아요!
          </button>

          <button
            onClick={() => {
              setLocating(true);
              setTimeout(() => setLocating(false), 1500);
            }}
            className="w-full py-4 rounded-2xl border-3 text-[20px] font-bold mb-3"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            아니에요, 다시 찾아주세요
          </button>

          <button
            onClick={() => setShowMap(true)}
            className="w-full py-3 rounded-2xl text-[18px]"
            style={{ color: "var(--secondary)" }}
          >
            📌 지도에서 직접 설정하기
          </button>

          {showMap && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="bg-white w-full max-w-[500px] mx-auto rounded-t-3xl p-5 pb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[22px] font-bold">출발지 직접 설정</h2>
                  <button
                    onClick={() => setShowMap(false)}
                    className="text-[24px]"
                    style={{ color: "var(--gray-dark)" }}
                  >
                    ✕
                  </button>
                </div>

                {/* 지도 영역 (프로토타입) */}
                <div className="w-full h-[300px] rounded-2xl bg-gray-200 relative mb-4 overflow-hidden">
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 30%, #F5F5DC 60%, #E0E0E0 100%)",
                    }}
                  >
                    {/* 도로 */}
                    <div className="absolute top-1/2 left-0 right-0 h-[20px] bg-[#9E9E9E] -translate-y-1/2" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-[20px] bg-[#9E9E9E] -translate-x-1/2" />
                    {/* 핀 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
                      <div className="text-[40px]">📍</div>
                    </div>
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center text-[14px] font-bold" style={{ color: "var(--gray-dark)" }}>
                    지도를 움직여 위치를 설정하세요
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowMap(false);
                    handleConfirmPickup();
                  }}
                  className="w-full py-5 rounded-2xl text-white text-[22px] font-bold shadow-lg"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  이 위치에서 출발하기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
