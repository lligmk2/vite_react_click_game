import { useState, useEffect, useRef } from 'react';
import Ore from './Ore';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager';

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(10 + (skills.duration || 0) * 2);
  const [sessionGold, setSessionGold] = useState(0);
  const [ores, setOres] = useState([]);
  const [effects, setEffects] = useState([]);
  const pointerPos = useRef({ x: -100, y: -100 });
  const isHovering = useRef(false);

  // 광물 생성 로직
  const createOre = (id) => {
    const rand = Math.random();
    let tier = currentOreIndex || 0;
    if (rand > 0.98) tier += 2;
    else if (rand > 0.85) tier += 1;
    const safeTier = Math.min(tier, ORES.length - 1);
    const targetOre = ORES[safeTier];

    return {
      id: id || `${Date.now()}-${Math.random()}`,
      oreData: targetOre,
      x: Math.random() * 85,
      y: 15 + Math.random() * 70,
      dx: (Math.random() - 0.5) * targetOre.speed,
      dy: (Math.random() - 0.5) * targetOre.speed,
      size: 60 + Math.random() * 20
    };
  };

  // 초기 광물 세팅
  useEffect(() => {
    setOres(Array.from({ length: 20 }).map((_, i) => createOre(`init-${i}`)));
  }, [currentOreIndex]);

  // 채굴 처리 로직
  const processMining = () => {
    if (!isHovering.current) return;

    let hitOccurred = false;

    setOres(prevOres => {
      let earnedInTick = 0;
      const nextOres = prevOres.map(ore => {
        const oreElement = document.getElementById(`ore-${ore.id}`);
        if (!oreElement) return ore;

        const rect = oreElement.getBoundingClientRect();
        const px = pointerPos.current.x;
        const py = pointerPos.current.y;

        if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
          hitOccurred = true;
          const missileChance = (skills.missile || 0) * 0.05;
          const isCrit = Math.random() < missileChance;
          const dmg = isCrit ? (skills.power * 5) * 10 : (skills.power * 5);

          if (isCrit) {
            addEffect(px, py);
            playSound('critical'); 
          }

          const currentHp = ore.currentHp ?? ore.oreData.hp;
          const newHp = currentHp - dmg;

          if (newHp <= 0) {
            earnedInTick += ore.oreData.value * (skills.valueBoost || 1);
            return createOre();
          }
          return { ...ore, currentHp: newHp };
        }
        return ore;
      });

      if (hitOccurred) playSound('mine'); 
      if (earnedInTick > 0) setSessionGold(g => g + earnedInTick);
      return nextOres;
    });
  };

  const addEffect = (x, y) => {
    const id = Date.now() + Math.random();
    setEffects(prev => [...prev, { id, x, y }]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 800);
  };

  // 게임 루프: 이동 및 채굴 계산 (세션 골드 의존성 제거하여 안정화)
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(gameLoop);
          return 0;
        }
        return t - 0.1;
      });

      setOres(prev => prev.map(ore => {
        let { x, y, dx, dy } = ore;
        if (x + dx > 90 || x < 0) dx *= -1;
        if (y + dy > 90 || y < 10) dy *= -1;
        return { ...ore, x: x + dx, y: y + dy, dx, dy };
      }));

      processMining();
    }, 100);

    return () => clearInterval(gameLoop);
  }, [skills]); // 의존성을 최소화하여 무한 루프 방지

  // 종료 감지專用 Effect: 에러 방지의 핵심
  useEffect(() => {
    if (timeLeft === 0) {
      playSound('result');
      onTimeUp(sessionGold);
    }
  }, [timeLeft, sessionGold, onTimeUp]);

  const handlePointerMove = (e) => {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    pointerPos.current = { x, y };
    isHovering.current = true;
  };

  return (
    <div className="stage-container" 
         onPointerMove={handlePointerMove}
         onPointerEnter={() => isHovering.current = true}
         onPointerLeave={() => { isHovering.current = false; }}>
      
      <div className="stage-hud">
        <div className="timer-box">⏱️ {timeLeft.toFixed(1)}s</div>
        <div className="gold-box">🪙 {Math.floor(sessionGold).toLocaleString()}</div>
        <button className="stop-btn" onClick={() => {
          playSound('click');
          onTimeUp(sessionGold);
        }}>그만하기</button>
      </div>

      <div className="space-canvas">
        {ores.map(ore => <Ore key={ore.id} ore={ore} />)}
        {effects.map(eff => (
          <div key={eff.id} className="crit-effect" style={{ left: eff.x, top: eff.y }}>
            CRITICAL!
          </div>
        ))}
      </div>
    </div>
  );
}