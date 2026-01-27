import { useState } from 'react';
import GameStage from './components/GameStage';
import SkillTree from './components/SkillTree';
import ResultScreen from './components/ResultScreen';
import { ORES, INITIAL_SKILLS } from './constants';
// 사운드 매니저 임포트 (파일 경로는 환경에 맞게 조정하세요)
import { playSound, setBgm, stopSound } from './utils/SoundManager'; 
import './App.css';

function App() {
  const [status, setStatus] = useState('lobby');
  const [gold, setGold] = useState(0);
  const [lastEarned, setLastEarned] = useState(0);
  const [unlockedIndex, setUnlockedIndex] = useState(0);
  const [skills, setSkills] = useState(INITIAL_SKILLS);

  // 게임 시작 핸들러
  const handleStartGame = () => {
    playSound('click');
    setBgm(true); // 채굴 시작 시 BGM ON
    setStatus('playing');
  };

  // 기술 연구소 진입 핸들러
  const handleOpenShop = () => {
    playSound('click');
    setStatus('shop');
  };

  // 게임 종료 핸들러 (TimeUp)
  const handleTimeUp = (earned) => {
    // 1. 즉시 BGM 종료
    setBgm(false); 
    
    // 2. 상태 업데이트를 한 박자 늦게 실행하여 렌더링 충돌 방지
    setTimeout(() => {
      setLastEarned(earned);
      setGold(prev => prev + earned);
      setStatus('result');
    }, 0); 
  };

  // 결과 확인 후 로비 이동
  const handleConfirmResult = () => {
    playSound('click');
    stopSound('result'); // 결과 브금 강제 종료
    setStatus('lobby');
  };

  return (
    <div className="app-container">
      {/* 1. 로비 화면 */}
      {status === 'lobby' && (
        <div className="main-title-screen">
          <h1 className="glitch-title">MACHINE MINING</h1>
          <div className="lobby-buttons">
            <button className="btn-start" onClick={handleStartGame}>채굴 시작</button>
            <button className="btn-shop" onClick={handleOpenShop}>기술 연구소</button>
          </div>
          <div className="global-gold">전체 자산: {gold.toLocaleString()}G</div>
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

      {/* 3. 결과 화면 */}
      {status === 'result' && (
        <ResultScreen 
          earnedGold={lastEarned} 
          onConfirm={handleConfirmResult} 
        />
      )}

      {/* 4. 기술 연구소 (SkillTree) */}
      {status === 'shop' && (
        <SkillTree 
          gold={gold} 
          setGold={setGold}
          skills={skills} 
          setSkills={setSkills}
          nextOre={ORES[unlockedIndex + 1]}
          onUnlockSuccess={() => {
            playSound('upgrade'); // 해금 성공 사운드
            setUnlockedIndex(prev => prev + 1);
          }}
          onClose={() => {
            playSound('click');
            setStatus('lobby');
          }}
        />
      )}
    </div>
  );
}

export default App;