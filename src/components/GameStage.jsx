import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
// SoundManager는 실제 파일이 없으면 console.log로 대체하거나 주석 처리하세요.
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  const [ores, setOres] = useState([]);
  const [effects, setEffects] = useState([]); // 데미지 텍스트 등
  const [timeLeft, setTimeLeft] = useState(30 + (skills.duration * 5));
  const [missiles, setMissiles] = useState([]); // 미사일 배열
  
  const containerRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, isDown: false });
  const autoClickTimer = useRef(null);

  // 1. 초기 광물 생성 및 타이머
  useEffect(() => {
    spawnOres(5); // 시작 시 5개 스폰

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 남은 시간 0초일 때 부모에게 알림 (획득 골드 계산은 여기서 하지 않고 HUD나 상태에서 관리)
          // 여기서는 편의상 로컬 스코어 관리보다 즉시 종료 처리를 위해 0 전달 후 종료 로직
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 종료 처리
  useEffect(() => {
    if (timeLeft === 0) {
      // 현재까지 캔 골드? GameStage는 골드를 직접 관리하지 않고, 
      // App에서 전달받은 함수로 세션 종료만 알림. 
      // 이번 판 획득 골드는 App 레벨에서 관리하거나, 여기서 관리해서 넘겨줘야 함.
      // 구조상 App에서 totalGold를 관리하므로, 여기서는 "게임 끝" 신호와 "이번 판 점수"를 넘겨야 함.
      // 간단히 하기 위해 sessionGold ref를 사용.
      onTimeUp(sessionGold.current);
    }
  }, [timeLeft]);

  const sessionGold = useRef(0); // 이번 판 획득 골드

  // 2. 광물 스폰 (가중치 확률)
  const spawnOres = (count) => {
    const newOres = [];
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    for (let i = 0; i < count; i++) {
      // 해금된 인덱스까지의 광물 중 가중치 랜덤 선택
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

  // 3. 데미지 처리 코어 함수
  const applyDamage = (oreId, dmg, isCrit, x, y) => {
    // 1. 이펙트 추가
    setEffects(prev => [...prev, { id: Date.now(), x, y, value: dmg, isCrit }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => Date.now() - e.id < 800));
    }, 800);

    // 사운드
    playSound(isCrit ? 'critical' : 'hit');

    // 2. 광물 HP 차감
    setOres(prev => {
      const nextOres = prev.map(ore => {
        if (ore.id !== oreId) return ore;
        
        const nextHp = ore.currentHp - dmg;
        if (nextHp <= 0) {
          // 광물 파괴!
          sessionGold.current += ore.value;
          playSound('break');
          return null; // 삭제 표시
        }
        return { ...ore, currentHp: nextHp, hitEffect: true };
      }).filter(Boolean); // null 제거

      // 파괴된 만큼 리스폰
      if (nextOres.length < prev.length) {
        setTimeout(() => spawnOres(prev.length - nextOres.length), 200);
      }
      
      // 맞은 애니메이션 리셋
      setTimeout(() => {
        setOres(curr => curr.map(o => ({...o, hitEffect: false})));
      }, 100);

      return nextOres;
    });

    // 3. 미사일 발사 (유도탄 스킬)
    if (skills.missile > 0 && Math.random() < 0.3) { // 30% 확률 발사
      fireMissile(x, y, oreId);
    }
  };

  // 미사일 로직
  const fireMissile = (startX, startY, ignoreId) => {
    // 화면에 있는 다른 광물 타겟팅
    setOres(currentOres => {
      const targets = currentOres.filter(o => o.id !== ignoreId);
      if (targets.length === 0) return currentOres;
      
      const target = targets[Math.floor(Math.random() * targets.length)];
      const missileId = Date.now();
      
      // 미사일 상태 추가 (애니메이션용)
      // 실제 구현은 CSS animation이나 JS frame loop가 필요하지만 간략화하여
      // 즉시 데미지를 주는 대신 약간의 딜레이 후 데미지 함수 호출
      setTimeout(() => {
        const dmg = skills.power * (skills.missile * 0.5); // 미사일 데미지 공식
        applyDamage(target.id, Math.floor(dmg), false, target.x, target.y);
      }, 300); // 0.3초 후 타격

      return currentOres;
    });
  };

  // 4. 입력 핸들링 (클릭 & 드래그)
  const handlePointerDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    checkCollision(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
    // 오토 스킬 없으면 드래그 시 아무일도 안일어남 (기존 방식 유지)
  };

  const handlePointerUp = () => {
    pointerRef.current.isDown = false;
  };

  // 오토 마우스 & 반경 체크 루프
  useEffect(() => {
    if (skills.autoClick === 0) return; // 스킬 없으면 작동 안함

    // 레벨이 높을수록 주기가 빨라짐 (Lv1: 500ms -> Lv10: 50ms)
    const intervalTime = Math.max(50, 500 - (skills.autoClick * 45)); 
    
    autoClickTimer.current = setInterval(() => {
      if (pointerRef.current.isDown) {
        checkCollision(pointerRef.current.x, pointerRef.current.y);
      }
    }, intervalTime);

    return () => clearInterval(autoClickTimer.current);
  }, [skills.autoClick, ores]);

  // 충돌 감지 및 데미지 계산
  const checkCollision = (px, py) => {
    const baseRadius = 30; // 기본 터치 반경
    const skillRadius = skills.radius * 20; // 스킬로 늘어나는 반경
    const totalRadius = baseRadius + skillRadius;

    let hitCount = 0;

    // 현재 화면의 광물들과 거리 계산
    ores.forEach(ore => {
      const dx = px - ore.x;
      const dy = py - ore.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // 광물 크기도 고려 (scale)
      const oreHitBox = 40 * ore.scale; 

      if (dist < totalRadius + oreHitBox) {
        // 타격 성공!
        // 크리티컬 계산 (Max 50%)
        const critChance = Math.min(0.5, skills.critical * 0.05); 
        const isCrit = Math.random() < critChance;
        // 크리티컬 데미지 (기본 1.5배 + 스킬 레벨당 0.2배) -> 밸런스 조정
        const critMult = isCrit ? (1.5 + skills.critical * 0.2) : 1;
        
        const finalDmg = Math.floor(skills.power * critMult);
        applyDamage(ore.id, finalDmg, isCrit, ore.x, ore.y);
        hitCount++;
      }
    });

    // 허공을 클릭해도 이펙트는 나오게 할 수 있음 (선택 사항)
  };

  return (
    <div 
      className="stage-container" 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* HUD */}
      <div className="stage-hud">
        <span className="hud-gold">💰 {sessionGold.current.toLocaleString()}</span>
        <span className="hud-timer">⏰ {timeLeft.toFixed(1)}s</span>
      </div>

      {/* 광물 렌더링 */}
      {ores.map(ore => (
        <div 
          key={ore.id}
          className={`ore-instance ${ore.hitEffect ? 'ore-hit' : ''}`}
          style={{
            left: ore.x, top: ore.y,
            width: 80, height: 80,
            marginLeft: -40, marginTop: -40, // 중심점 보정
            backgroundColor: ore.color,
            clipPath: ore.shape, // 모양 적용
            transform: `scale(${ore.scale})`,
            zIndex: 10
          }}
        >
          {/* HP Bar (Simple) */}
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

      {/* 데미지 이펙트 */}
      {effects.map(ef => (
        <div 
          key={ef.id} 
          className={`damage-text ${ef.isCrit ? 'crit' : ''}`}
          style={{ left: ef.x, top: ef.y }}
        >
          {ef.value} {ef.isCrit && "!"}
        </div>
      ))}
      
      {/* 오토마우스/반경 피드백 (드래그 시 표시) */}
      {pointerRef.current.isDown && skills.radius > 0 && (
        <div 
          className="touch-radius"
          style={{
            left: pointerRef.current.x,
            top: pointerRef.current.y,
            width: (30 + skills.radius * 20) * 2,
            height: (30 + skills.radius * 20) * 2
          }}
        />
      )}
    </div>
  );
}