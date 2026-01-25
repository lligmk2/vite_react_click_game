import { useState } from 'react';
import Monster from './Monster';
import Store from './Store';
import './App.css';

function App() {
  const [hp, setHp] = useState(100);
  const [money, setMoney] = useState(0);
  const [power, setPower] = useState(10); // 기본 공격력
  const [level, setLevel] = useState(1);

  const maxHp = 100 + (level - 1) * 50;
  const isDead = hp <= 0;

  // 공격 로직
  const handleAttack = () => {
    if (isDead) return;
    setHp(prev => Math.max(0, prev - power));
    if (hp - power <= 0) setMoney(prev => prev + 20); // 처치 시 20원 획득
  };

  // 강화 로직
  const buyPower = () => {
    setMoney(prev => prev - 50);
    setPower(prev => prev + 5);
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setHp(100 + level * 50);
  };

  return (
    <div className="game-container">
      <h1>⚔️ RPG 리액트 (Lv.{level})</h1>
      <p>내 공격력: {power}</p>
      
      <Monster hp={hp} maxHp={maxHp} isDead={isDead} onAttack={handleAttack} />
      
      {isDead ? (
        <button className="next-btn" onClick={nextLevel}>다음 몬스터 소환</button>
      ) : (
        <Store money={money} onBuyPower={buyPower} />
      )}
    </div>
  );
}

export default App;