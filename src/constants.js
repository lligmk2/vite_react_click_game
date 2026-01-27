export const ORES = [
  { name: "철광석", hp: 10, value: 5, color: "#a1a1a1", shape: "50%", scale: 0.8, weight: 100, unlockCost: 0 },
  { name: "구리", hp: 25, value: 12, color: "#d98850", shape: "50%", scale: 0.9, weight: 60, unlockCost: 500 },
  { name: "청동", hp: 50, value: 30, color: "#cd7f32", shape: "10% 20% 40% 20%", scale: 1.0, weight: 40, unlockCost: 1500 },
  { name: "은", hp: 100, value: 60, color: "#e0e0e0", shape: "50%", scale: 1.1, weight: 25, unlockCost: 4000 },
  { name: "금", hp: 250, value: 150, color: "#ffd700", shape: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", scale: 1.2, weight: 15, unlockCost: 10000 },
  { name: "백금", hp: 500, value: 350, color: "#e5e4e2", shape: "50%", scale: 1.3, weight: 10, unlockCost: 25000 },
  { name: "티타늄", hp: 1000, value: 800, color: "#757575", shape: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)", scale: 1.4, weight: 5, unlockCost: 60000 },
  { name: "다이아몬드", hp: 3000, value: 2500, color: "#b9f2ff", shape: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", scale: 0.9, weight: 2, unlockCost: 120000 },
  { name: "옵시디언", hp: 8000, value: 6000, color: "#222", shape: "polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)", scale: 1.5, weight: 1, unlockCost: 500000 },
];

// 스킬 정보 및 비용
export const SKILL_INFO = {
  power: { name: "채굴력 강화", maxLevel: 50, baseCost: 50, desc: "클릭 당 데미지가 증가합니다." },
  autoClick: { name: "오토 드릴", maxLevel: 10, baseCost: 500, desc: "드래그만 해도 자동으로 채굴합니다. (레벨업 시 속도 증가)" },
  radius: { name: "채굴 반경", maxLevel: 5, baseCost: 1000, desc: "한 번에 더 넓은 범위의 광물을 캡니다." },
  critical: { name: "정밀 타격", maxLevel: 10, baseCost: 300, desc: "크리티컬 확률(최대 50%)과 배율이 증가합니다." },
  missile: { name: "유도 미사일", maxLevel: 5, baseCost: 2000, desc: "채굴 시 주변 광물을 공격하는 미사일을 발사합니다." },
  duration: { name: "시간 연장", maxLevel: 5, baseCost: 1000, desc: "제한 시간이 5초씩 늘어납니다." },
};

export const INITIAL_SKILLS = {
  power: 1,       // 기본 데미지
  autoClick: 0,   // 0이면 드래그 불가, 1부터 가능
  radius: 0,      // 0이면 점 클릭, 레벨당 반경 증가
  critical: 0,    // 레벨당 5% 확률
  missile: 0,     // 레벨당 발동 확률 및 데미지 증가
  duration: 0     // 레벨당 시간 증가
};