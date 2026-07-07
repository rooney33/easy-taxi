"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDestinations,
  saveDestinations,
  getFamilyContacts,
  saveFamilyContacts,
  getProfile,
  saveProfile,
  type Destination,
  type FamilyContact,
} from "@/frontend/store";

const ICONS = ["🏠", "🏥", "🏛️", "🛒", "⛪", "🏫", "🏢", "🌳", "💈", "🍽️"];
const COLORS = [
  "#FF6B00",
  "#DC2626",
  "#2563EB",
  "#16A34A",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#CA8A04",
];

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"places" | "family" | "profile">("places");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [family, setFamily] = useState<FamilyContact[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIcon, setNewIcon] = useState("🏠");
  const [newColor, setNewColor] = useState("#FF6B00");
  const [addingFamily, setAddingFamily] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");

  useEffect(() => {
    setDestinations(getDestinations());
    setFamily(getFamilyContacts());
    const profile = getProfile();
    setProfileName(profile.name);
    setProfilePhone(profile.phone);
  }, []);

  function handleSaveProfile() {
    saveProfile({ name: profileName.trim(), phone: profilePhone.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function handleAddPlace() {
    if (!newLabel || !newAddress) return;
    const updated = [
      ...destinations,
      {
        id: Date.now().toString(),
        label: newLabel,
        address: newAddress,
        lat: 37.5,
        lng: 127.0,
        icon: newIcon,
        color: newColor,
      },
    ];
    setDestinations(updated);
    saveDestinations(updated);
    setAdding(false);
    setNewLabel("");
    setNewAddress("");
  }

  function handleDeletePlace(id: string) {
    const updated = destinations.filter((d) => d.id !== id);
    setDestinations(updated);
    saveDestinations(updated);
  }

  function handleAddFamily() {
    if (!newName || !newPhone) return;
    const updated = [
      ...family,
      {
        id: Date.now().toString(),
        name: newName,
        phone: newPhone,
        relation: newRelation || "가족",
      },
    ];
    setFamily(updated);
    saveFamilyContacts(updated);
    setAddingFamily(false);
    setNewName("");
    setNewPhone("");
    setNewRelation("");
  }

  function handleDeleteFamily(id: string) {
    const updated = family.filter((f) => f.id !== id);
    setFamily(updated);
    saveFamilyContacts(updated);
  }

  return (
    <div className="flex flex-col min-h-screen p-5 pb-24">
      <button
        onClick={() => router.back()}
        className="self-start text-[20px] text-gray-dark mb-4"
      >
        ← 뒤로
      </button>

      <h1 className="text-[28px] font-bold mb-6">⚙️ 설정</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("places")}
          className={`flex-1 py-3 rounded-xl text-[20px] font-bold ${
            tab === "places"
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-dark"
          }`}
        >
          자주 가는 곳
        </button>
        <button
          onClick={() => setTab("family")}
          className={`flex-1 py-3 rounded-xl text-[20px] font-bold ${
            tab === "family"
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-dark"
          }`}
        >
          가족 연락처
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 py-3 rounded-xl text-[20px] font-bold ${
            tab === "profile"
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-dark"
          }`}
        >
          내 정보
        </button>
      </div>

      {/* 자주 가는 곳 */}
      {tab === "places" && (
        <>
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-2xl p-4 shadow-md mb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-[30px]">{dest.icon}</span>
                <div>
                  <p className="text-[20px] font-bold">{dest.label}</p>
                  <p className="text-[14px] text-gray">{dest.address}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeletePlace(dest.id)}
                className="text-[16px] text-danger px-3 py-2"
              >
                삭제
              </button>
            </div>
          ))}

          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-4 rounded-2xl border-3 border-dashed border-gray text-gray-dark text-[20px] font-bold mt-2"
            >
              + 장소 추가하기
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-md mt-2">
              <p className="text-[20px] font-bold mb-3">새 장소 추가</p>

              <div className="mb-3">
                <p className="text-[16px] text-gray mb-1">아이콘</p>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setNewIcon(ic)}
                      className={`text-[28px] p-2 rounded-lg ${
                        newIcon === ic ? "bg-primary/20" : ""
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-[16px] text-gray mb-1">색상</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: c,
                        borderColor: newColor === c ? "#000" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="이름 (예: 교회)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[20px] mb-3"
              />
              <input
                type="text"
                placeholder="주소"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[20px] mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray text-[18px]"
                >
                  취소
                </button>
                <button
                  onClick={handleAddPlace}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-[18px] font-bold"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 가족 연락처 */}
      {tab === "family" && (
        <>
          <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border-2 border-yellow-400">
            <p className="text-[16px] text-yellow-700">
              💡 택시 탑승 시 아래 가족에게 자동으로 알림이 갑니다
            </p>
          </div>

          {family.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-4 shadow-md mb-3 flex items-center justify-between"
            >
              <div>
                <p className="text-[20px] font-bold">
                  {f.name} ({f.relation})
                </p>
                <p className="text-[16px] text-gray">{f.phone}</p>
              </div>
              <button
                onClick={() => handleDeleteFamily(f.id)}
                className="text-[16px] text-danger px-3 py-2"
              >
                삭제
              </button>
            </div>
          ))}

          {!addingFamily ? (
            <button
              onClick={() => setAddingFamily(true)}
              className="w-full py-4 rounded-2xl border-3 border-dashed border-gray text-gray-dark text-[20px] font-bold mt-2"
            >
              + 가족 추가하기
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-md mt-2">
              <p className="text-[20px] font-bold mb-3">가족 추가</p>
              <input
                type="text"
                placeholder="이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[20px] mb-3"
              />
              <input
                type="tel"
                placeholder="전화번호"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[20px] mb-3"
              />
              <input
                type="text"
                placeholder="관계 (예: 아들, 딸)"
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[20px] mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setAddingFamily(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray text-[18px]"
                >
                  취소
                </button>
                <button
                  onClick={handleAddFamily}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-[18px] font-bold"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 내 정보 */}
      {tab === "profile" && (
        <>
          <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border-2 border-yellow-400">
            <p className="text-[16px] text-yellow-700">
              💡 택시를 부를 때 기사님이 연락드릴 수 있도록 이름과 전화번호를
              입력해주세요
            </p>
          </div>

          <p className="text-[18px] font-bold mb-2">이름</p>
          <input
            type="text"
            placeholder="예: 김순자"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 text-[22px] mb-4"
          />

          <p className="text-[18px] font-bold mb-2">전화번호</p>
          <input
            type="tel"
            placeholder="예: 010-1234-5678"
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 text-[22px] mb-6"
          />

          <button
            onClick={handleSaveProfile}
            className="w-full py-4 rounded-2xl bg-primary text-white text-[22px] font-bold"
          >
            {profileSaved ? "저장했어요 ✓" : "저장하기"}
          </button>
        </>
      )}
    </div>
  );
}
