import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  const [ores, setOres] = useState([]);
  const [effects, setEffects] = useState([]); 
  const [timeLeft, setTimeLeft] = useState(30 + (skills.duration * 5));
  
  // 게임 로직용 Refs
  const containerRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, isDown: false });
  const autoClickTimer = useRef(null);
  
  // [추가] 스캐너(범위 표시) DOM 직접 제어용 Ref
  const scannerRef = useRef(null);
  const sessionGold = useRef(0); 

  // 1. 초기화 및 타이머 (기존과 동일)
  useEffect(() => {
    spawnOres(5);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) onTimeUp(sessionGold.current);
  }, [timeLeft]);

  // 2. 광물 스폰 (기존과 동일)
  const spawnOres = (count) => {
    const newOres = [];
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    for (let i = 0; i < count; i++) {
      const availableOres = ORES.slice(0, currentOreIndex + 1);
      const totalWeight = availableOres.reduce((sum, ore) => sum + ore.weight, 0);
      let randomVal = Math.random() * totalWeight;
      let selectedOre = availableOres[0];

      for (const ore of availableOres) {
        if (randomVal < ore.weight) {
          selectedOre = ore;
          break;
        }
        randomVal -= ore.weight;
      }

      newOres.push({
        id: Date.now() + Math.random(),
        ...selectedOre,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        currentHp: selectedOre.hp,
        maxHp: selectedOre.hp,
        hitEffect: false
      });
    }
    setOres(prev => [...prev, ...newOres]);
  };

  // 3. 데미지 로직 (기존과 동일)
  const applyDamage = (oreId, dmg, isCrit, x, y) => {
    setEffects(prev => [...prev, { id: Date.now(), x, y, value: dmg, isCrit }]);
    setTimeout(() => setEffects(prev => prev.filter(e => Date.now() - e.id < 800)), 800);
    playSound(isCrit ? 'critical' : 'hit');

    setOres(prev => {
      const nextOres = prev.map(ore => {
        if (ore.id !== oreId) return ore;
        const nextHp = ore.currentHp - dmg;
        if (nextHp <= 0) {
          sessionGold.current += ore.value;
          playSound('break');
          return null; 
        }
        return { ...ore, currentHp: nextHp, hitEffect: true };
      }).filter(Boolean);

      if (nextOres.length < prev.length) {
        setTimeout(() => spawnOres(prev.length - nextOres.length), 200);
      }
      setTimeout(() => {
        setOres(curr => curr.map(o => ({...o, hitEffect: false})));
      }, 100);
      return nextOres;
    });

    if (skills.missile > 0 && Math.random() < 0.3) {
      fireMissile(x, y, oreId);
    }
  };

  const fireMissile = (startX, startY, ignoreId) => {
    setOres(currentOres => {
      const targets = currentOres.filter(o => o.id !== ignoreId);
      if (targets.length === 0) return currentOres;
      const target = targets[Math.floor(Math.random() * targets.length)];
      setTimeout(() => {
        const dmg = skills.power * (skills.missile * 0.5); 
        applyDamage(target.id, Math.floor(dmg), false, target.x, target.y);
      }, 300);
      return currentOres;
    });
  };

  // 4. [수정됨] 마우스/터치 핸들러 (스캐너 이동 로직 추가)
  const updateScannerPosition = (x, y) => {
    if (scannerRef.current) {
      // transform을 직접 수정하여 리렌더링 없이 부드럽게 이동
      scannerRef.current.style.transform = `translate(${x}px, ${y}px)`;
      scannerRef.current.style.display = 'block'; // 움직일 때 보임
    }
  };

  const handlePointerDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    updateScannerPosition(e.clientX, e.clientY);
    checkCollision(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
    
    // 마우스만 움직여도 범위가 보이게 하여 조준을 도움
    updateScannerPosition(e.clientX, e.clientY); 
    
    // 드래그 기능은 오토클릭 타이머에서 처리하거나 여기서 처리
  };

  const handlePointerUp = () => {
    pointerRef.current.isDown = false;
  };

  // 5. 충돌 체크 및 오토 루프
  useEffect(() => {
    if (skills.autoClick === 0) return; 
    const intervalTime = Math.max(50, 500 - (skills.autoClick * 45)); 
    
    autoClickTimer.current = setInterval(() => {
      if (pointerRef.current.isDown) {
        checkCollision(pointerRef.current.x, pointerRef.current.y);
      }
    }, intervalTime);
    return () => clearInterval(autoClickTimer.current);
  }, [skills.autoClick, ores]);

  const checkCollision = (px, py) => {
    const baseRadius = 30; 
    const skillRadius = skills.radius * 20; 
    const totalRadius = baseRadius + skillRadius;

    ores.forEach(ore => {
      const dx = px - ore.x;
      const dy = py - ore.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const oreHitBox = 40 * ore.scale; 

      if (dist < totalRadius + oreHitBox) {
        const critChance = Math.min(0.5, skills.critical * 0.05); 
        const isCrit = Math.random() < critChance;
        const critMult = isCrit ? (1.5 + skills.critical * 0.2) : 1;
        const finalDmg = Math.floor(skills.power * critMult);
        applyDamage(ore.id, finalDmg, isCrit, ore.x, ore.y);
      }
    });
  };

  // [추가] 스캐너 크기 계산
  const scannerSize = (30 + skills.radius * 20) * 2; // 반지름 * 2 = 지름

  return (
    <div 
      className="stage-container" 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: 'none' }} /* 기본 커서 숨기기 (선택사항) */
    >
      <div className="stage-hud">
        <span className="hud-gold">💰 {sessionGold.current.toLocaleString()}</span>
        <span className="hud-timer">⏰ {timeLeft.toFixed(1)}s</span>
      </div>

      {/* 광물들 */}
      {ores.map(ore => (
        <div 
          key={ore.id}
          className={`ore-instance ${ore.hitEffect ? 'ore-hit' : ''}`}
          style={{
            left: ore.x, top: ore.y,
            width: 80, height: 80,
            marginLeft: -40, marginTop: -40,
            backgroundColor: ore.color,
            clipPath: ore.shape,
            transform: `scale(${ore.scale})`,
            zIndex: 10
          }}
        >
          <div style={{
            position: 'absolute', bottom: -10, left: 0, width: '100%', height: 5,
            background: '#333', borderRadius: 2, overflow: 'hidden'
          }}>
            <div style={{
              width: `${(ore.currentHp / ore.maxHp) * 100}%`,
              height: '100%', background: '#00f3ff'
            }} />
          </div>
        </div>
      ))}

      {/* 데미지 텍스트 */}
      {effects.map(ef => (
        <div 
          key={ef.id} 
          className={`damage-text ${ef.isCrit ? 'crit' : ''}`}
          style={{ left: ef.x, top: ef.y }}
        >
          {ef.value} {ef.isCrit && "!"}
        </div>
      ))}
      
      {/* [수정됨] 성능 최적화된 범위 스캐너 */}
      {/* skills.radius가 0이라도 기본 타격 범위 표시는 해주는게 좋습니다 */}
      <div 
        ref={scannerRef}
        className="mining-scanner"
        style={{
          width: scannerSize,
          height: scannerSize,
          // 초기 위치는 화면 밖으로
          left: 0, top: 0, 
          // 실제 위치 제어는 transform으로 함 (margin으로 중심점 보정)
          marginLeft: -scannerSize / 2,
          marginTop: -scannerSize / 2,
        }}
      />
    </div>
  );
}