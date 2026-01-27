export const ORES = [
  // weight: 높을수록 자주 등장 (하위 광물 위주, 상위 광물 희귀)
  { name: "철광석", hp: 10, value: 5, color: "#707070", speed: 1.5, unlockCost: 0, weight: 1000, scale: 0.8 },
  { name: "구리", hp: 20, value: 12, color: "#b87333", speed: 1.6, unlockCost: 500, weight: 800, scale: 0.9 },
  { name: "청동", hp: 40, value: 25, color: "#cd7f32", speed: 1.7, unlockCost: 1500, weight: 600, scale: 1.0 },
  { name: "은", hp: 80, value: 55, color: "#c0c0c0", speed: 1.8, unlockCost: 4000, weight: 400, scale: 1.1 },
  { name: "금", hp: 150, value: 120, color: "#ffd700", speed: 2.0, unlockCost: 10000, weight: 200, scale: 1.2, shape: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { name: "백금", hp: 300, value: 250, color: "#e5e4e2", speed: 2.1, unlockCost: 25000, weight: 100, scale: 1.3 },
  { name: "티타늄", hp: 500, value: 450, color: "#878681", speed: 1.9, unlockCost: 60000, weight: 80, scale: 1.4 },
  { name: "코발트", hp: 800, value: 800, color: "#0047ab", speed: 2.3, unlockCost: 120000, weight: 60, scale: 1.0 },
  { name: "미스릴", hp: 1300, value: 1400, color: "#00ffff", speed: 2.5, unlockCost: 250000, weight: 40, scale: 1.1 },
  { name: "오리할콘", hp: 2000, value: 2200, color: "#ff4500", speed: 2.7, unlockCost: 500000, weight: 30, scale: 1.5, shape: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)" },
  { name: "아다만티움", hp: 3500, value: 4000, color: "#1e1e1e", speed: 2.4, unlockCost: 1000000, weight: 20, scale: 1.2 },
  { name: "흑연", hp: 5500, value: 6500, color: "#3a3a3a", speed: 2.6, unlockCost: 2000000, weight: 15, scale: 0.9 },
  { name: "루비", hp: 8000, value: 10000, color: "#e0115f", speed: 2.8, unlockCost: 4000000, weight: 10, scale: 1.0, shape: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { name: "사파이어", hp: 12000, value: 16000, color: "#0f52ba", speed: 3.0, unlockCost: 8000000, weight: 8, scale: 1.1 },
  { name: "에메랄드", hp: 18000, value: 25000, color: "#50c878", speed: 3.2, unlockCost: 15000000, weight: 6, scale: 1.1 },
  { name: "다이아몬드", hp: 30000, value: 45000, color: "#b9f2ff", speed: 3.5, unlockCost: 30000000, weight: 5, scale: 0.8, shape: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { name: "옵시디언", hp: 50000, value: 80000, color: "#0b0b0b", speed: 3.1, unlockCost: 60000000, weight: 4, scale: 1.3 },
  { name: "중성자별 파편", hp: 85000, value: 150000, color: "#ffffff", speed: 4.0, unlockCost: 120000000, weight: 3, scale: 0.7 },
  { name: "암흑물질", hp: 150000, value: 300000, color: "#4b0082", speed: 4.5, unlockCost: 250000000, weight: 2, scale: 1.0 },
  { name: "공허의 결정", hp: 300000, value: 700000, color: "#000000", speed: 5.0, unlockCost: 500000000, weight: 1, scale: 1.2 }
];

export const SKILL_INFO = {
  power: { name: "드릴 파워", maxLevel: 50, baseCost: 50, desc: "클릭 당 데미지가 증가합니다." },
  // [수정] 오토 드릴: 0->1 레벨업이 '해금' 역할
  autoClick: { name: "오토 드릴 (해금)", maxLevel: 10, baseCost: 1000, desc: "[필수] Lv.1 달성 시 드래그 채굴이 가능해집니다. 이후 속도가 빨라집니다." },
  radius: { name: "채굴 범위", maxLevel: 10, baseCost: 500, desc: "한 번에 채굴할 수 있는 범위가 넓어집니다." },
  regen: { name: "탐지 센서", maxLevel: 10, baseCost: 800, desc: "화면에 동시에 등장하는 광물의 개수가 늘어납니다." },
  missile: { name: "멀티 록온", maxLevel: 5, baseCost: 2000, desc: "채굴 시 화면 내 다른 광물들도 동시에 타격합니다." },
  critical: { name: "정밀 타격", maxLevel: 10, baseCost: 300, desc: "크리티컬 확률(최대 50%)과 배율이 증가합니다." },
  duration: { name: "시간 연장", maxLevel: 5, baseCost: 1000, desc: "제한 시간이 5초씩 늘어납니다." } // 시간 연장 스킬도 유지
};

export const INITIAL_SKILLS = {
  power: 1,
  autoClick: 0,   // 0: 드래그 불가 (잠금 상태)
  radius: 0,      // 0: 점 타격
  regen: 0,       // 0: 기본 개수
  missile: 0,     // 0: 없음
  critical: 0,
  duration: 0
};