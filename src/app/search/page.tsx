"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RECENT_SEARCHES = [
  { name: "삼성서울병원", address: "서울시 강남구 일원동 81" },
  { name: "코엑스", address: "서울시 강남구 영동대로 513" },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSelect(name: string, address: string) {
    const dest = {
      id: Date.now().toString(),
      label: name,
      address,
      lat: 37.5,
      lng: 127.0,
      icon: "📍",
      color: "#FF6B00",
    };
    sessionStorage.setItem("selected-destination", JSON.stringify(dest));
    router.push("/pickup");
  }

  return (
    <div className="flex flex-col min-h-screen p-5">
      <button
        onClick={() => router.back()}
        className="self-start text-[24px] mb-4"
        style={{ color: "var(--gray-dark)" }}
      >
        ← 뒤로
      </button>

      <h1 className="text-[30px] font-bold mb-4">어디로 가시나요?</h1>

      <input
        type="text"
        placeholder="장소나 주소를 입력하세요"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        className="w-full p-5 rounded-2xl border-3 text-[24px] mb-6"
        style={{ borderColor: "var(--primary)" }}
      />

      {query.length > 0 ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleSelect(query, query)}
            className="w-full bg-white rounded-2xl p-5 shadow-md text-left"
          >
            <p className="text-[24px] font-bold">{query}</p>
            <p className="text-[18px]" style={{ color: "var(--gray)" }}>
              검색 결과 (프로토타입)
            </p>
          </button>
        </div>
      ) : (
        <>
          <p className="text-[22px] font-bold mb-3" style={{ color: "var(--gray-dark)" }}>
            최근 검색
          </p>
          <div className="flex flex-col gap-3">
            {RECENT_SEARCHES.map((item) => (
              <button
                key={item.name}
                onClick={() => handleSelect(item.name, item.address)}
                className="w-full bg-white rounded-2xl p-5 shadow-md text-left"
              >
                <p className="text-[24px] font-bold">{item.name}</p>
                <p className="text-[18px]" style={{ color: "var(--gray)" }}>
                  {item.address}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
