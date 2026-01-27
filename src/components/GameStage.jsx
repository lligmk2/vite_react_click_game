import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  // [수정] 기본 시간 15초 + 업그레이드당 5초 (요청사항 반영)
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

  // 초기화
  useEffect(() => {
    // 초기 스폰 (기본 5개 + 리젠스킬*2)
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
      const div = document.createElement('div');
      div.id = `ore-${id}`;
      div.className = 'ore-instance-dynamic';
      div.style.backgroundColor = selected.color;
      div.style.clipPath = selected.shape || 'circle(50%)';
      div.style.width = '60px';
      div.style.height = '60px';
      
      // HP바
      const hpBg = document.createElement('div');
      hpBg.className = 'ore-hp-bg';
      const hpFill = document.createElement('div');
      hpFill.className = 'ore-hp-fill';
      hpFill.id = `hp-${id}`;
      hpBg.appendChild(hpFill);
      div.appendChild(hpBg);

      containerRef.current.appendChild(div);

      oresRef.current.push({
        id, 
        element: div, 
        hpElement: hpFill,
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

      if (ore.element) {
        const scale = ore.hitTime > 0 ? ore.scale * 1.2 : ore.scale;
        ore.element.style.transform = `translate(${ore.x}px, ${ore.y}px) scale(${scale})`;
        
        if (ore.hitTime > 0) {
          ore.element.style.filter = 'brightness(2)';
          ore.hitTime--;
        } else {
          ore.element.style.filter = 'none';
        }
      }
    });

    // [핵심] 오토 드릴 로직
    // skills.autoClick이 0이면 작동 안함 (1회성 구매 전)
    // skills.autoClick이 1 이상이면 작동 (구매 후)
    if (pointerRef.current.isDown && skills.autoClick > 0) {
      // 속도 공식: Lv1=600ms(느림) ~ Lv10=60ms(빠름)
      const cooldown = Math.max(60, 600 - (skills.autoClick * 60));
      if (time - lastAutoMineTime.current > cooldown) {
        checkCollision(pointerRef.current.x, pointerRef.current.y, false); 
        lastAutoMineTime.current = time;
      }
    }

    if (scannerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = pointerRef.current.x - rect.left;
      const localY = pointerRef.current.y - rect.top;
      scannerRef.current.style.transform = `translate(${localX}px, ${localY}px)`;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const checkCollision = (globalX, globalY, isClick) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = globalX - rect.left;
    const localY = globalY - rect.top;

    const radius = 5 + (skills.radius * 20);
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
      
      const maxOres = 5 + (skills.regen * 2);
      const needed = maxOres - oresRef.current.length;
      if (needed > 0) spawnOres(needed);

      playSound('break');
    }
    
    // [중요 수정] 드래그든 클릭이든 맞추면 무조건 'mine' 사운드 재생
    if (hitCount > 0) {
        playSound('click'); 
    }
  };

  const applyDamage = (ore, idx, deadIndices) => {
    if (ore.currentHp <= 0) return;

    const critChance = Math.min(0.5, skills.critical * 0.05);
    const isCrit = Math.random() < critChance;
    const dmg = Math.floor(skills.power * (isCrit ? (2 + skills.critical * 0.3) : 1));

    ore.currentHp -= dmg;
    ore.hitTime = 10; 

    if (ore.hpElement) {
      const pct = Math.max(0, (ore.currentHp / ore.maxHp) * 100);
      ore.hpElement.style.width = `${pct}%`;
      ore.hpElement.style.backgroundColor = pct < 30 ? 'red' : '#00f3ff';
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

  // 입력 핸들러
  const handleDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    // 다운 시엔 무조건 1회 타격 (스킬 여부 상관 없음 - 기본 기능)
    checkCollision(e.clientX, e.clientY, true);
  };
  
  const handleMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
    // Move 시엔 gameLoop 안에서 autoClick 레벨 체크 후 자동 채굴
  };

  const handleUp = () => pointerRef.current.isDown = false;

  const scannerSize = (15 + skills.radius * 20) * 2; // 범위 시각화도 수정

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