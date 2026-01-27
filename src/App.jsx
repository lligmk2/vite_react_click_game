import { useState, useEffect } from 'react';
import GameStage from './components/GameStage';
import SkillTree from './components/SkillTree';
import { ORES, INITIAL_SKILLS } from './constants';
// [수정됨] 실제 사운드 매니저 연결 (더미 코드 삭제함)
import { playSound, setBgm } from './utils/SoundManager'; 

import './App.css';

function App() {
  const [status, setStatus] = useState('lobby'); // lobby, playing, shop, result
  const [gold, setGold] = useState(0);
  const [lastEarned, setLastEarned] = useState(0);
  const [unlockedIndex, setUnlockedIndex] = useState(0); // 0 = 철광석만
  const [skills, setSkills] = useState(INITIAL_SKILLS);

  // SoundManager 내부에서 volume을 0.2로 설정하고 있으므로, 
  // 별도의 DOM 조작 없이 SoundManager 설정을 따릅니다.

  const handleStartGame = () => {
    // 사용자 인터랙션 시점에 사운드 컨텍스트 활성화 및 BGM 재생
    playSound('click');
    setBgm(true); 
    setStatus('playing');
  };

  const handleOpenShop = () => {
    playSound('click');
    setStatus('shop');
  };

  const handleTimeUp = (earnedGold) => {
    setBgm(false); // 게임 종료 시 BGM 끄기
    playSound('result');
    setLastEarned(earnedGold);
    setGold(prev => prev + earnedGold);
    setStatus('result');
  };

  const handleConfirmResult = () => {
    playSound('click');
    setStatus('lobby');
  };

  return (
    <div className="app-container">
      {/* 1. 로비 */}
      {status === 'lobby' && (
        <div className="main-title-screen">
          <h1 className="glitch-title">MACHINE MINING</h1>
          <div className="lobby-buttons">
            <button className="btn-start" onClick={handleStartGame}>채굴 시작</button>
            <button className="btn-shop" onClick={handleOpenShop}>기술 연구소</button>
          </div>
          <div style={{ marginTop: 20, color: '#ffd700', fontWeight: 'bold' }}>
            보유 자산: {gold.toLocaleString()}G
          </div>
        </div>
      )}

      {/* 2. 게임 스테이지 */}
      {status === 'playing' && (
        <GameStage 
          skills={skills} 
          currentOreIndex={unlockedIndex} 
          onTimeUp={handleTimeUp}
        />
      )}

      {/* 3. 상점 (SkillTree) */}
      {status === 'shop' && (
        <SkillTree 
          gold={gold} 
          setGold={setGold}
          skills={skills} 
          setSkills={setSkills}
          nextOre={ORES[unlockedIndex + 1]}
          onUnlockSuccess={() => setUnlockedIndex(prev => prev + 1)}
          onClose={() => setStatus('lobby')}
          onStartNow={handleStartGame} // 상점에서 바로 시작
        />
      )}

      {/* 4. 결과 화면 */}
      {status === 'result' && (
        <div className="result-overlay">
          <div className="result-card">
            <h2 className="result-title">채굴 종료</h2>
            <div className="result-score">+{lastEarned.toLocaleString()}G</div>
            <button className="btn-start" onClick={handleConfirmResult}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;