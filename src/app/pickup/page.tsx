"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Destination } from "@/frontend/store";
import type { Landmark, PickupLandmarkResponse } from "@/shared/location-types";

// ── 카카오맵 JS SDK 로드 (로드뷰 표시용 — JavaScript 키만 사용) ──

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

let sdkPromise: Promise<void> | null = null;
function loadKakaoSdk(): Promise<void> {
  if (!KAKAO_JS_KEY) {
    return Promise.reject(new Error("카카오 JavaScript 키가 없습니다"));
  }
  sdkPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// 파노라마 촬영 지점 → 건물 좌표의 방위각(도). 로드뷰가 건물을 바라보게 한다
function bearingDeg(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── 로드뷰: 랜드마크를 바라보는 장면 1컷 (조작 잠금 — 정책상 캡처·저장 금지, 라이브 뷰어만) ──

function LandmarkRoadview({
  landmark,
  onUnavailable,
}: {
  landmark: Landmark;
  onUnavailable: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadKakaoSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const kakao = window.kakao;
        const pos = new kakao.maps.LatLng(landmark.lat, landmark.lng);
        const client = new kakao.maps.RoadviewClient();
        // 건물 좌표 반경 80m 안에서 가장 가까운 로드뷰 촬영 지점을 찾는다
        client.getNearestPanoId(pos, 80, (panoId: number | null) => {
          if (cancelled) return;
          if (!panoId || !containerRef.current) {
            onUnavailable();
            return;
          }
          const roadview = new kakao.maps.Roadview(containerRef.current);
          kakao.maps.event.addListener(roadview, "init", () => {
            const p = roadview.getPosition();
            const pan = bearingDeg(
              { lat: p.getLat(), lng: p.getLng() },
              landmark
            );
            roadview.setViewpoint({ pan, tilt: 0, zoom: 0 });
          });
          roadview.setPanoId(panoId, pos);
        });
      })
      .catch(() => {
        if (!cancelled) onUnavailable();
      });
    return () => {
      cancelled = true;
    };
  }, [landmark, onUnavailable]);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-md border-4 relative"
      style={{ borderColor: "var(--primary)" }}
    >
      <div ref={containerRef} className="w-full h-[280px]" />
      {/* 어르신이 실수로 화면을 돌리지 않도록 조작만 잠근다 (카카오 로고·저작권 표시는 그대로 노출됨) */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }} />
    </div>
  );
}

// ── 출발지 확인 화면 ──

type Phase = "locating" | "ready" | "gps-error" | "address-only";

export default function PickupPage() {
  const router = useRouter();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [phase, setPhase] = useState<Phase>("locating");
  const [pickup, setPickup] = useState<PickupLandmarkResponse["pickup"] | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [idx, setIdx] = useState(0); // "모르는 곳이에요" 시 다음 후보로
  const [roadviewFailed, setRoadviewFailed] = useState(false);

  const locate = useCallback(() => {
    setPhase("locating");
    setIdx(0);
    setRoadviewFailed(false);

    if (!navigator.geolocation) {
      setPhase("gps-error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/location/landmark?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) throw new Error();
          const data = (await res.json()) as PickupLandmarkResponse;
          setPickup(data.pickup);
          setLandmarks(data.landmarks);
          setPhase(data.landmarks.length > 0 ? "ready" : "address-only");
        } catch {
          setPhase("gps-error");
        }
      },
      () => setPhase("gps-error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("selected-destination");
    if (saved) setDestination(JSON.parse(saved));
    locate();
  }, [locate]);

  const landmark: Landmark | undefined = landmarks[idx];

  function confirmPickup(pickupAddress: string) {
    sessionStorage.setItem(
      "ride-request",
      JSON.stringify({ destination, pickupAddress })
    );
    // 새 호출이므로 이전 호출 ID는 버린다
    sessionStorage.removeItem("ride-id");
    router.push("/call");
  }

  function handleKnown() {
    if (!landmark) return;
    const addr = landmark.roadAddress || landmark.address;
    confirmPickup(`${landmark.name} 앞 (${addr})`);
  }

  function handleUnknown() {
    if (idx + 1 < landmarks.length) {
      setIdx(idx + 1);
      setRoadviewFailed(false);
    } else {
      setPhase("address-only"); // 후보 소진 → 주소 기반 안내로 폴백
    }
  }

  const handleRoadviewUnavailable = useCallback(() => {
    setRoadviewFailed(true);
  }, []);

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

      {phase === "locating" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <h1 className="text-[26px] font-bold mb-2 animate-pulse">
            위치를 찾고 있어요
          </h1>
          <p className="text-[18px]" style={{ color: "var(--gray)" }}>
            잠시만 기다려주세요...
          </p>
          <p className="text-[15px] mt-4 text-center" style={{ color: "var(--gray)" }}>
            현재 위치는 택시 출발지를 안내하기 위해서만 사용됩니다
          </p>
        </div>
      )}

      {phase === "gps-error" && (
        <div className="flex flex-col items-center justify-center flex-1">
          <h1 className="text-[26px] font-bold mb-3 text-center">
            위치를 찾지 못했어요
          </h1>
          <p className="text-[20px] mb-8 text-center" style={{ color: "var(--gray-dark)" }}>
            휴대폰의 위치 허용을 눌러주시거나
            <br />
            다시 한번 시도해주세요
          </p>
          <button
            onClick={locate}
            className="py-5 px-12 rounded-2xl text-white text-[24px] font-bold shadow-lg"
            style={{ backgroundColor: "var(--primary)" }}
          >
            다시 찾기
          </button>
        </div>
      )}

      {phase === "ready" && landmark && (
        <>
          <h1 className="text-[26px] font-bold mb-1">
            {landmark.name} 앞에서
            <br />
            기다려주세요
          </h1>
          <p className="text-[18px] mb-4" style={{ color: "var(--gray-dark)" }}>
            택시가 이 건물 앞으로 갑니다
          </p>

          {!roadviewFailed ? (
            <LandmarkRoadview
              key={`${landmark.lat},${landmark.lng}`}
              landmark={landmark}
              onUnavailable={handleRoadviewUnavailable}
            />
          ) : (
            /* 로드뷰가 없는 지점 — 건물명과 주소로만 안내 */
            <div
              className="w-full rounded-2xl p-8 shadow-md border-4 text-center"
              style={{ borderColor: "var(--primary)", backgroundColor: "white" }}
            >
              <p className="text-[30px] font-bold mb-2">{landmark.name}</p>
              <p className="text-[20px]" style={{ color: "var(--gray-dark)" }}>
                {landmark.category} · 약 {landmark.distanceMeters}m
              </p>
            </div>
          )}

          <p className="text-[16px] text-center mt-3 mb-4" style={{ color: "var(--gray)" }}>
            {landmark.roadAddress || landmark.address}
          </p>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-[16px]" style={{ color: "var(--gray)" }}>
              도착지
            </p>
            <p className="text-[22px] font-bold">{destination.label}</p>
          </div>

          <button
            onClick={handleKnown}
            className="w-full py-5 rounded-2xl text-white text-[24px] font-bold shadow-lg mb-3"
            style={{ backgroundColor: "var(--primary)" }}
          >
            여기 알아요
          </button>

          <button
            onClick={handleUnknown}
            className="w-full py-4 rounded-2xl border-3 text-[20px] font-bold mb-3"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            모르는 곳이에요
          </button>
        </>
      )}

      {phase === "address-only" && (
        <>
          <h1 className="text-[26px] font-bold mb-2">
            지금 계신 곳으로
            <br />
            택시를 부를게요
          </h1>
          <div className="bg-white rounded-2xl p-6 shadow-md mb-4 mt-4">
            <p className="text-[16px] mb-1" style={{ color: "var(--gray)" }}>
              현재 위치
            </p>
            <p className="text-[24px] font-bold">
              {pickup?.address || "주소를 확인하지 못했어요"}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-[16px]" style={{ color: "var(--gray)" }}>
              도착지
            </p>
            <p className="text-[22px] font-bold">{destination.label}</p>
          </div>

          <button
            onClick={() => confirmPickup(pickup?.address ? `${pickup.address} 앞` : "현재 위치")}
            className="w-full py-5 rounded-2xl text-white text-[24px] font-bold shadow-lg mb-3"
            style={{ backgroundColor: "var(--primary)" }}
          >
            네, 여기서 탈게요
          </button>

          <button
            onClick={locate}
            className="w-full py-4 rounded-2xl border-3 text-[20px] font-bold"
            style={{ borderColor: "var(--gray)", color: "var(--gray-dark)" }}
          >
            위치 다시 찾기
          </button>
        </>
      )}
    </div>
  );
}
