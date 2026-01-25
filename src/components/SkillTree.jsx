import React from 'react';

export default function SkillTree({ gold, setGold, skills, setSkills, nextOre, onUnlockSuccess, onClose }) {
  const upgradeSkill = (key, cost) => {
    if (gold >= cost) {
      setGold(prev => prev - cost);
      setSkills(prev => ({ ...prev, [key]: prev[key] + 1 }));
    } else {
      alert("자금이 부족합니다!");
    }
  };

  return (
    <div className="overlay-screen shop-overlay">
      <div className="shop-card shadow-animation">
        <button className="close-x" onClick={onClose}>X</button>
        <h2 className="shop-title">🔬 테크놀로지 연구소</h2>
        <div className="current-funds">보유 자금: <span>{gold.toLocaleString()}G</span></div>

        <div className="skill-list">
          {/* 드릴 강화 */}
          <div className="skill-card">
            <div className="skill-info">
              <span className="skill-name">드릴 출력 강화 (Lv.{skills.power})</span>
              <span className="skill-desc">클릭 당 파워가 상승합니다.</span>
            </div>
            <button 
              className={`buy-btn ${gold < (skills.power * 1000) ? 'disabled' : ''}`}
              onClick={() => upgradeSkill('power', skills.power * 1000)}
            >
              {(skills.power * 1000).toLocaleString()}G
            </button>
          </div>

          {/* 배터리 확장 */}
          <div className="skill-card">
            <div className="skill-info">
              <span className="skill-name">배터리 용량 확장 (Lv.{skills.duration})</span>
              <span className="skill-desc">채굴 제한 시간이 2초 증가합니다.</span>
            </div>
            <button 
              className={`buy-btn ${gold < (skills.duration + 1) * 500 ? 'disabled' : ''}`}
              onClick={() => upgradeSkill('duration', (skills.duration + 1) * 500)}
            >
              {((skills.duration + 1) * 500).toLocaleString()}G
            </button>
          </div>
            {/* 미사일 확률 강화 */}
            <div className="skill-card">
            <div className="skill-info">
                <span className="skill-name">미사일 시스템 (Lv.{skills.missile || 0})</span>
                <span className="skill-desc">{skills.missile * 5}% 확률로 10배 데미지 발사!</span>
            </div>
            <button 
                className={`buy-btn ${gold < (skills.missile + 1) * 1000 ? 'disabled' : ''}`}
                onClick={() => upgradeSkill('missile', (skills.missile + 1) * 1000)}
            >
                {((skills.missile + 1) * 1000).toLocaleString()}G
            </button>
            </div>
          {/* 광물 해금 (다음 단계가 있을 때만 표시) */}
          {nextOre && (
            <div className="unlock-card">
              <h3>🚀 차세대 탐사 구역</h3>
              <p>{nextOre.name} 매장지 발견</p>
              <button 
                className={`unlock-main-btn ${gold < nextOre.unlockCost ? 'disabled' : ''}`}
                onClick={() => {
                  if (gold >= nextOre.unlockCost) {
                    setGold(prev => prev - nextOre.unlockCost);
                    onUnlockSuccess();
                  }
                }}
              >
                {nextOre.unlockCost.toLocaleString()}G 지불하고 해금
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}