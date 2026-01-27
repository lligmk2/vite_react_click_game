import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(15 + ((skills.duration || 0) * 5));
  const [score, setScore] = useState(0);
  const [damageTexts, setDamageTexts] = useState([]); 

  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const oresRef = useRef([]); 
  const pointerRef = useRef({ x: 0, y: 0, isDown: false });
  const scannerRef = useRef(null);
  const lastAutoMineTime = useRef(0); 
  const scoreRef = useRef(0); 

  useEffect(() => {
    const initialCount = 15 + (skills.regen * 2);
    spawnOres(initialCount);

    requestRef.current = requestAnimationFrame(gameLoop);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(requestRef.current);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) handleStop();
  }, [timeLeft]);

  const handleStop = () => {
    onTimeUp(scoreRef.current);
  };

  const spawnOres = (count) => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    
    const availableOres = ORES.slice(0, currentOreIndex + 1);
    const totalWeight = availableOres.reduce((a, b) => a + (b.weight || 10), 0);

    for (let i = 0; i < count; i++) {
      let r = Math.random() * totalWeight;
      let selected = availableOres[0];
      
      for(let ore of availableOres) {
        if (r < (ore.weight || 10)) {
          selected = ore;
          break;
        }
        r -= (ore.weight || 10);
      }

      const id = Date.now() + Math.random();
      
      // 1. 컨테이너 (이동 담당, 모양 없음)
      const container = document.createElement('div');
      container.id = `ore-${id}`;
      container.className = 'ore-container-dynamic'; // 클래스명 변경
      container.style.width = '60px';
      container.style.height = '60px';

      // 2. 비주얼 (모양 및 색상 담당, 여기에 clip-path 적용)
      const visual = document.createElement('div');
      visual.className = 'ore-visual';
      visual.style.backgroundColor = selected.color;
      visual.style.clipPath = selected.shape || 'circle(50%)';
      container.appendChild(visual);
      
      // 3. HP바 (컨테이너 내부에 있지만 visual 밖, 절대 위치)
      const hpBg = document.createElement('div');
      hpBg.className = 'ore-hp-bg';
      const hpFill = document.createElement('div');
      hpFill.className = 'ore-hp-fill';
      hpFill.id = `hp-${id}`;
      hpBg.appendChild(hpFill);
      container.appendChild(hpBg);

      containerRef.current.appendChild(container);

      oresRef.current.push({
        id, 
        element: container,   // 이동용
        visualElement: visual,// 피격 효과용
        hpElement: hpFill,    // 체력바용
        ...selected,
        x: Math.random() * (w - 60),
        y: Math.random() * (h - 60),
        vx: (Math.random() - 0.5) * (selected.speed || 2) * 2,
        vy: (Math.random() - 0.5) * (selected.speed || 2) * 2,
        currentHp: selected.hp,
        maxHp: selected.hp,
        scale: selected.scale || 1,
        hitTime: 0 
      });
    }
  };

  const gameLoop = (time) => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;

    oresRef.current.forEach((ore) => {
      ore.x += ore.vx;
      ore.y += ore.vy;

      if (ore.x <= 0 || ore.x >= w - 60) ore.vx *= -1;
      if (ore.y <= 0 || ore.y >= h - 60) ore.vy *= -1;
      ore.x = Math.max(0, Math.min(ore.x, w - 60));
      ore.y = Math.max(0, Math.min(ore.y, h - 60));

      // 이동 업데이트 (컨테이너)
      if (ore.element) {
        // 스케일은 전체에 적용 (커지면 HP바도 같이 커짐)
        const scale = ore.hitTime > 0 ? ore.scale * 1.1 : ore.scale;
        ore.element.style.transform = `translate(${ore.x}px, ${ore.y}px) scale(${scale})`;
      }

      // 피격 효과 업데이트 (비주얼만 깜빡임)
      if (ore.visualElement) {
        if (ore.hitTime > 0) {
          ore.visualElement.style.filter = 'brightness(2) sepia(1)'; // 반짝임 강화
          ore.hitTime--;
        } else {
          ore.visualElement.style.filter = 'none';
        }
      }
    });

    if (pointerRef.current.isDown && skills.autoClick > 0) {
      const cooldown = Math.max(60, 600 - (skills.autoClick * 60));
      if (time - lastAutoMineTime.current > cooldown) {
        checkCollision(pointerRef.current.x, pointerRef.current.y, false); 
        lastAutoMineTime.current = time;
      }
    }

    if (scannerRef.current) {
      if (pointerRef.current.isDown) {
        // 클릭/드래그 중일 때만 표시하고 위치 업데이트
        scannerRef.current.style.opacity = "1";
        
        const rect = containerRef.current.getBoundingClientRect();
        const localX = pointerRef.current.x - rect.left;
        const localY = pointerRef.current.y - rect.top;
        
        // JS로 이동만 담당 (회전은 CSS ::after가 함)
        scannerRef.current.style.transform = `translate(${localX}px, ${localY}px)`;
      } else {
        // 떼면 숨김
        scannerRef.current.style.opacity = "0";
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const checkCollision = (globalX, globalY, isClick) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = globalX - rect.left;
    const localY = globalY - rect.top;

    const radius = 15 + (skills.radius * 20);
    let hitCount = 0;
    const deadIndices = [];

    oresRef.current.forEach((ore, idx) => {
      const cx = ore.x + 30;
      const cy = ore.y + 30;
      const dist = Math.sqrt((localX - cx)**2 + (localY - cy)**2);
      
      if (dist < 30 * ore.scale + radius) {
        applyDamage(ore, idx, deadIndices);
        hitCount++;
      }
    });

    if (hitCount > 0 && skills.missile > 0) {
      const targets = skills.missile; 
      let fired = 0;
      const aliveOres = oresRef.current.filter((_, i) => !deadIndices.includes(i));
      
      while(fired < targets && aliveOres.length > 0) {
        const rndIdx = Math.floor(Math.random() * aliveOres.length);
        const target = aliveOres[rndIdx];
        if(target.currentHp > 0) {
           applyDamage(target, -1, deadIndices);
           fired++;
           aliveOres.splice(rndIdx, 1);
        }
      }
    }

    if (deadIndices.length > 0) {
      deadIndices.sort((a,b) => b-a).forEach(idx => {
        if(idx !== -1) {
            const ore = oresRef.current[idx];
            if(ore && ore.element) ore.element.remove(); 
            oresRef.current.splice(idx, 1);
        }
      });
      
      const maxOres = 15 + (skills.regen * 2); 
      const needed = maxOres - oresRef.current.length;
      if (needed > 0) spawnOres(needed);

      playSound('break');
    }
    
    if (hitCount > 0) {
        playSound('mine'); 
    }
  };

  const applyDamage = (ore, idx, deadIndices) => {
    if (ore.currentHp <= 0) return;

    const critChance = Math.min(0.5, skills.critical * 0.05);
    const isCrit = Math.random() < critChance;
    const dmg = Math.floor(skills.power * (isCrit ? (2 + skills.critical * 0.3) : 1));

    ore.currentHp -= dmg;
    ore.hitTime = 10; 

    // HP바 업데이트
    if (ore.hpElement) {
      const pct = Math.max(0, (ore.currentHp / ore.maxHp) * 100);
      ore.hpElement.style.width = `${pct}%`;
      // 색상 변경: 30% 미만 빨강, 그 외 형광파랑
      ore.hpElement.style.backgroundColor = pct < 30 ? '#ff3e3e' : '#00f3ff';
    }

    showDamageText(ore.x, ore.y, dmg, isCrit);

    if (ore.currentHp <= 0) {
      scoreRef.current += ore.value;
      setScore(scoreRef.current);
      if (idx !== -1) deadIndices.push(idx);
    }
  };

  const showDamageText = (x, y, val, isCrit) => {
    const id = Date.now() + Math.random();
    setDamageTexts(prev => [...prev.slice(-10), { id, x, y, val, isCrit }]);
    setTimeout(() => {
      setDamageTexts(prev => prev.filter(t => t.id !== id));
    }, 800);
    if(isCrit) playSound('critical');
  };

  const handleDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    checkCollision(e.clientX, e.clientY, true);
  };
  
  const handleMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
  };

  const handleUp = () => pointerRef.current.isDown = false;

  const scannerSize = (15 + skills.radius * 20) * 2; 

  return (
    <div 
      className="stage-container" 
      ref={containerRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <div className="stage-hud">
        <span className="hud-gold">💎 {score.toLocaleString()}</span>
        <div style={{display:'flex', gap: '10px', alignItems:'center'}}>
          <span className="hud-timer">⏰ {timeLeft}s</span>
          <button className="stop-btn" onClick={handleStop}>그만하기</button>
        </div>
      </div>

      {damageTexts.map(t => (
        <div 
          key={t.id} 
          className={`damage-text ${t.isCrit ? 'crit' : ''}`}
          style={{ left: t.x + 20, top: t.y }}
        >
          {t.isCrit ? `CRIT! ${t.val}` : t.val}
        </div>
      ))}

      <div 
        ref={scannerRef}
        className="mining-scanner"
        style={{
          width: scannerSize, height: scannerSize,
          marginLeft: -scannerSize/2, marginTop: -scannerSize/2
        }}
      />
    </div>
  );
}