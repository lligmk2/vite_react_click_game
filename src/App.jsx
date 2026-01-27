import { useState, useEffect } from 'react';
import GameStage from './components/GameStage';
import SkillTree from './components/SkillTree';
import ResultScreen from './components/ResultScreen';
import { ORES, INITIAL_SKILLS } from './constants';
// 사운드 매니저는 파일이 있다면 사용, 없다면 아래처럼 더미 함수 사용
 import { playSound, setBgm } from './utils/SoundManager';
// 더미 구현 (에러 방지용)
const playSound = (type) => { /* console.log('Sound:', type); */ };
const setBgm = (isPlaying) => { /* console.log('BGM:', isPlaying); */ };

import './App.css';

function App() {
  const [status, setStatus] = useState('lobby'); // lobby, playing, shop, result
  const [gold, setGold] = useState(0);
  const [lastEarned, setLastEarned] = useState(0);
  const [unlockedIndex, setUnlockedIndex] = useState(0); // 0 = 철광석만
  const [skills, setSkills] = useState(INITIAL_SKILLS);

  // BGM 볼륨 조절용 (실제 구현 시 SoundManager에서 처리 권장)
  useEffect(() => {
    const audio = document.querySelector('audio'); // 만약 index.html에 audio 태그가 있다면
    if(audio) audio.volume = 0.3; // 배경음 줄이기
  }, []);

  const handleStartGame = () => {
    playSound('click');
    setStatus('playing');
    setBgm(true);
  };

  const handleOpenShop = () => {
    playSound('click');
    setStatus('shop');
  };

  const handleTimeUp = (earnedGold) => {
    setBgm(false);
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
        // ResultScreen 컴포넌트가 없다면 아래와 같이 인라인으로 대체 가능
        // 만약 파일이 있다면 import해서 사용하세요.
        <div className="result-overlay">
          <div className="result-box">
            <h2 className="result-title">채굴 종료</h2>
            <div className="result-amount">+{lastEarned.toLocaleString()}G</div>
            <button className="btn-start" onClick={handleConfirmResult}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;