import { SKILL_INFO } from '../constants';

export default function SkillTree({ gold, setGold, skills, setSkills, nextOre, onUnlockSuccess, onClose, onStartNow }) {
  
  const handleUpgrade = (key) => {
    const info = SKILL_INFO[key];
    const currentLv = skills[key];
    
    // 비용 계산 공식: 기본비용 * (1.5 ^ 레벨)
    const cost = Math.floor(info.baseCost * Math.pow(1.5, currentLv));

    if (currentLv >= info.maxLevel) return; // 만렙
    if (gold < cost) return; // 돈 부족

    setGold(prev => prev - cost);
    setSkills(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const getCost = (key) => {
    const info = SKILL_INFO[key];
    return Math.floor(info.baseCost * Math.pow(1.5, skills[key]));
  };

  // 광물 해금 (확률이 아닌 확정 해금 -> 게임 내 등장 확률은 spawn 로직에서 처리)
  const canUnlockOre = nextOre && gold >= nextOre.unlockCost;

  return (
    <div className="shop-overlay">
      <div className="shop-header">
        <h2>🛠️ 기술 연구소</h2>
        <span className="shop-gold">보유 자산: {gold.toLocaleString()}G</span>
      </div>

      <div className="skill-list">
        {Object.keys(SKILL_INFO).map(key => {
          const info = SKILL_INFO[key];
          const level = skills[key];
          const cost = getCost(key);
          const isMax = level >= info.maxLevel;

          return (
            <div key={key} className="skill-item">
              <div className="skill-info">
                <h4>{info.name}</h4>
                <p>{info.desc}</p>
                <div className="skill-level">Lv. {level} / {info.maxLevel}</div>
              </div>
              <button 
                className={`btn-buy ${isMax ? 'maxed' : ''}`}
                disabled={isMax || gold < cost}
                onClick={() => handleUpgrade(key)}
              >
                {isMax ? "MAX" : `${cost.toLocaleString()}G`}
              </button>
            </div>
          );
        })}

        {/* 광물 해금 카드 */}
        {nextOre && (
          <div className="skill-item" style={{ borderColor: '#ffd700', background: '#222' }}>
            <div className="skill-info">
              <h4 style={{ color: nextOre.color }}>신규 광물: {nextOre.name} 발견</h4>
              <p>더 비싼 광물이 등장할 확률이 생깁니다.</p>
            </div>
            <button 
              className="btn-buy"
              style={{ background: '#ffd700', color: '#000', borderColor: '#ffd700' }}
              disabled={!canUnlockOre}
              onClick={() => {
                setGold(prev => prev - nextOre.unlockCost);
                onUnlockSuccess();
              }}
            >
              해금 {nextOre.unlockCost.toLocaleString()}G
            </button>
          </div>
        )}
      </div>

      <div className="shop-footer">
        <button className="btn-close" onClick={onClose}>로비로 나가기</button>
        <button className="btn-play-now" onClick={onStartNow}>바로 채굴 시작</button>
      </div>
    </div>
  );
}