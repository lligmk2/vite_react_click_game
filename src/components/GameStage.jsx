import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  // UI 표시용 State (최소화)
  const [timeLeft, setTimeLeft] = useState(30); // 시간은 건드리지 않음
  const [score, setScore] = useState(0);
  const [damageTexts, setDamageTexts] = useState([]); // 크리티컬 텍스트용

  // 게임 로직용 Ref (렌더링 없이 값 관리)
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const oresRef = useRef([]); 
  const pointerRef = useRef({ x: 0, y: 0, isDown: false });
  const scannerRef = useRef(null);
  const lastAutoMineTime = useRef(0); // 오토마우스 쿨타임 체크용
  const scoreRef = useRef(0); // 실시간 점수 추적

  // 초기화
  useEffect(() => {
    // 1. 초기 스폰 (스킬에 따라 개수 결정: 기본 5개 + 스킬당 2개)
    const initialCount = 5 + (skills.regen * 2);
    spawnOres(initialCount);

    // 2. 게임 루프 시작
    requestRef.current = requestAnimationFrame(gameLoop);

    // 3. 타이머
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

  // 종료 감지
  useEffect(() => {
    if (timeLeft === 0) handleStop();
  }, [timeLeft]);

  const handleStop = () => {
    onTimeUp(scoreRef.current);
  };

  // 🎯 광물 스폰 로직 (가중치 적용)
  const spawnOres = (count) => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    
    // 해금된 광물 목록
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

      // DOM 요소 생성 (React State 아님)
      const id = Date.now() + Math.random();
      const div = document.createElement('div');
      div.id = `ore-${id}`;
      div.className = 'ore-instance-dynamic';
      // 스타일 직접 주입
      div.style.backgroundColor = selected.color;
      div.style.clipPath = selected.shape || 'circle(50%)';
      div.style.width = '60px';
      div.style.height = '60px';
      
      // HP바 컨테이너 생성
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
        element: div, // DOM 참조 저장
        hpElement: hpFill,
        ...selected,
        x: Math.random() * (w - 60),
        y: Math.random() * (h - 60),
        vx: (Math.random() - 0.5) * (selected.speed || 2) * 2,
        vy: (Math.random() - 0.5) * (selected.speed || 2) * 2,
        currentHp: selected.hp,
        maxHp: selected.hp,
        scale: selected.scale || 1,
        hitTime: 0 // 피격 효과용
      });
    }
  };

  // 🔄 게임 루프 (60FPS)
  const gameLoop = (time) => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;

    // 1. 광물 이동 및 렌더링
    oresRef.current.forEach((ore, index) => {
      // 물리 이동
      ore.x += ore.vx;
      ore.y += ore.vy;

      // 벽 튀기기
      if (ore.x <= 0 || ore.x >= w - 60) ore.vx *= -1;
      if (ore.y <= 0 || ore.y >= h - 60) ore.vy *= -1;
      ore.x = Math.max(0, Math.min(ore.x, w - 60));
      ore.y = Math.max(0, Math.min(ore.y, h - 60));

      // DOM 업데이트 (transform)
      if (ore.element) {
        // 피격 효과 (크기 변화 및 필터)
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

    // 2. 드래그 오토 채굴 (스킬 필요)
    if (pointerRef.current.isDown && skills.autoClick > 0) {
      // 속도 조절: 기본 500ms -> 레벨당 50ms 감소 (최소 50ms)
      const cooldown = Math.max(50, 500 - (skills.autoClick * 45));
      if (time - lastAutoMineTime.current > cooldown) {
        checkCollision(pointerRef.current.x, pointerRef.current.y, false); // false = 드래그 공격
        lastAutoMineTime.current = time;
      }
    }

    // 3. 스캐너 이동
    if (scannerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = pointerRef.current.x - rect.left;
      const localY = pointerRef.current.y - rect.top;
      scannerRef.current.style.transform = `translate(${localX}px, ${localY}px)`;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // 💥 충돌 및 데미지 로직
  const checkCollision = (globalX, globalY, isClick) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = globalX - rect.left;
    const localY = globalY - rect.top;

    // 범위: 기본 10px(점) + 스킬 레벨당 15px
    const radius = 10 + (skills.radius * 15);
    let hitCount = 0;

    // 죽은 광물 인덱스 목록
    const deadIndices = [];

    oresRef.current.forEach((ore, idx) => {
      // 광물 중심
      const cx = ore.x + 30;
      const cy = ore.y + 30;
      const dist = Math.sqrt((localX - cx)**2 + (localY - cy)**2);
      
      // 타격 판정 (광물 크기 30px + 범위)
      if (dist < 30 * ore.scale + radius) {
        applyDamage(ore, idx, deadIndices);
        hitCount++;
      }
    });

    // 멀티 록온 (미사일): 타격 성공 시, 스킬 레벨만큼 추가 랜덤 타격
    if (hitCount > 0 && skills.missile > 0) {
      const targets = skills.missile; // 레벨 당 1개 추가 타격
      let fired = 0;
      // 화면 내 무작위 광물 타격
      const aliveOres = oresRef.current.filter((_, i) => !deadIndices.includes(i));
      
      while(fired < targets && aliveOres.length > 0) {
        const rndIdx = Math.floor(Math.random() * aliveOres.length);
        const target = aliveOres[rndIdx];
        // 이미 죽을 예정인 애는 패스
        if(target.currentHp > 0) {
           applyDamage(target, -1, deadIndices); // -1은 인덱스 무시용
           fired++;
           aliveOres.splice(rndIdx, 1);
        }
      }
    }

    // 죽은 광물 정리 및 리스폰
    if (deadIndices.length > 0) {
      // 뒤에서부터 삭제해야 인덱스 안꼬임
      deadIndices.sort((a,b) => b-a).forEach(idx => {
        if(idx !== -1) {
            const ore = oresRef.current[idx];
            if(ore && ore.element) ore.element.remove(); // DOM 제거
            oresRef.current.splice(idx, 1);
        }
      });
      
      // 부족한 만큼 리스폰 (현재 최대 개수 = 기본 5 + 스킬*2)
      const maxOres = 5 + (skills.regen * 2);
      const needed = maxOres - oresRef.current.length;
      if (needed > 0) spawnOres(needed);

      playSound('break');
    }
    
    if (hitCount > 0) playSound(isClick ? 'mine' : 'click');
  };

  // 데미지 적용 함수
  const applyDamage = (ore, idx, deadIndices) => {
    if (ore.currentHp <= 0) return;

    // 크리티컬 계산
    const critChance = Math.min(0.5, skills.critical * 0.05);
    const isCrit = Math.random() < critChance;
    const dmg = Math.floor(skills.power * (isCrit ? (2 + skills.critical * 0.3) : 1));

    ore.currentHp -= dmg;
    ore.hitTime = 10; // 10프레임 동안 피격효과

    // HP바 업데이트 (직접 조작)
    if (ore.hpElement) {
      const pct = Math.max(0, (ore.currentHp / ore.maxHp) * 100);
      ore.hpElement.style.width = `${pct}%`;
      ore.hpElement.style.backgroundColor = pct < 30 ? 'red' : '#00f3ff';
    }

    // 데미지 텍스트 띄우기 (React State 사용 - 성능 위해 최대 개수 제한)
    showDamageText(ore.x, ore.y, dmg, isCrit);

    if (ore.currentHp <= 0) {
      scoreRef.current += ore.value;
      setScore(scoreRef.current);
      if (idx !== -1) deadIndices.push(idx);
    }
  };

  const showDamageText = (x, y, val, isCrit) => {
    const id = Date.now() + Math.random();
    setDamageTexts(prev => [...prev.slice(-10), { id, x, y, val, isCrit }]); // 최대 10개 유지
    setTimeout(() => {
      setDamageTexts(prev => prev.filter(t => t.id !== id));
    }, 800);
    if(isCrit) playSound('critical');
  };

  // 입력 핸들러
  const handleDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    // 클릭(탭)은 무조건 공격 (스킬 없어도 됨)
    checkCollision(e.clientX, e.clientY, true);
  };
  
  const handleMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
  };

  const handleUp = () => pointerRef.current.isDown = false;

  // 스캐너 크기 (지름)
  const scannerSize = (10 + skills.radius * 15) * 2;

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

      {/* 데미지 텍스트 레이어 */}
      {damageTexts.map(t => (
        <div 
          key={t.id} 
          className={`damage-text ${t.isCrit ? 'crit' : ''}`}
          style={{ left: t.x + 20, top: t.y }}
        >
          {t.isCrit ? `CRIT! ${t.val}` : t.val}
        </div>
      ))}

      {/* 범위 스캐너 */}
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