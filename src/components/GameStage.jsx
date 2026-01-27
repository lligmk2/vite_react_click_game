import { useState, useEffect, useRef } from 'react';
import { ORES } from '../constants';
import { playSound } from '../utils/SoundManager'; 

export default function GameStage({ skills, currentOreIndex, onTimeUp }) {
  // 리액트 상태는 UI 표시용(점수, 시간)으로만 최소화
  const [timeLeft, setTimeLeft] = useState(15 + (skills.duration * 5)); // 기본 15초로 단축 (지루함 방지)
  const [score, setScore] = useState(0);
  
  // 게임 로직은 전부 Ref로 처리 (성능 최적화 & INP 해결 핵심)
  const containerRef = useRef(null);
  const canvasRef = useRef(null); // 광물 렌더링을 위한 캔버스 아님, 좌표 계산용 컨테이너
  const requestRef = useRef(null);
  const oresRef = useRef([]); // 광물 데이터 {x, y, vx, vy, ...}
  const pointerRef = useRef({ x: 0, y: 0, isDown: false });
  const scannerRef = useRef(null); // 범위 표시기
  
  // 파티클/이펙트 관리
  const [effects, setEffects] = useState([]); 

  // 1. 초기 세팅 & 게임 루프 시작
  useEffect(() => {
    // 초기 광물 대량 스폰 (15~20개)
    spawnOres(20);
    
    // 게임 루프 시작
    requestRef.current = requestAnimationFrame(gameLoop);

    // 타이머
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

  // 종료 처리
  useEffect(() => {
    if (timeLeft === 0) {
      handleStop();
    }
  }, [timeLeft]);

  // [기능 복구] 그만하기 / 종료 버튼
  const handleStop = () => {
    onTimeUp(score); // 현재까지 모은 점수 들고 나감
  };

  // 2. 광물 스폰 로직 (확률 적용 + 랜덤 속도 부여)
  const spawnOres = (count) => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    
    for (let i = 0; i < count; i++) {
      // 확률 로직: 해금된 것 중 랜덤
      const availableOres = ORES.slice(0, currentOreIndex + 1);
      // 가중치 계산 (하위 광물이 더 잘 나옴)
      let selected = availableOres[0];
      const rand = Math.random() * 100;
      
      // 간단한 가중치 예시 (상위 광물일수록 확률 낮아짐)
      let cum = 0;
      const totalWeight = availableOres.reduce((a, b) => a + b.weight, 0);
      let r = Math.random() * totalWeight;
      
      for(let ore of availableOres) {
        if (r < ore.weight) {
          selected = ore;
          break;
        }
        r -= ore.weight;
      }

      oresRef.current.push({
        id: Date.now() + Math.random(),
        ...selected,
        // 화면 안쪽 랜덤 위치
        x: Math.random() * (w - 100) + 50,
        y: Math.random() * (h - 100) + 50,
        // [중요] 둥둥 떠다니는 움직임 복구 (속도 벡터)
        vx: (Math.random() - 0.5) * (selected.speed || 2) * 2, 
        vy: (Math.random() - 0.5) * (selected.speed || 2) * 2,
        currentHp: selected.hp,
        maxHp: selected.hp,
        scale: selected.scale || 1,
        isHit: false // 피격 상태
      });
    }
  };

  // 3. 게임 루프 (초당 60회 실행 - 여기서 움직임과 충돌 처리)
  const gameLoop = () => {
    if (!containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;

    // A. 광물 이동 처리
    oresRef.current.forEach(ore => {
      ore.x += ore.vx;
      ore.y += ore.vy;

      // 벽 튀기기
      if (ore.x <= 0 || ore.x >= w - 60) ore.vx *= -1;
      if (ore.y <= 0 || ore.y >= h - 60) ore.vy *= -1;

      // 화면 밖 나가는 것 방지 (보정)
      ore.x = Math.max(0, Math.min(ore.x, w - 60));
      ore.y = Math.max(0, Math.min(ore.y, h - 60));

      // DOM 직접 업데이트 (리액트 렌더링 X -> 렉 없음)
      const el = document.getElementById(`ore-${ore.id}`);
      if (el) {
        el.style.transform = `translate(${ore.x}px, ${ore.y}px) scale(${ore.scale})`;
        // 피격 시 빨개짐/떨림 처리
        if (ore.isHit) {
             el.style.filter = "brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)";
             ore.isHit = false; // 프레임 지나면 복구
        } else {
             el.style.filter = "none";
        }
      }
    });

    // B. 드래그 채굴 (오토 마우스) & 범위 공격
    if (pointerRef.current.isDown) {
      checkCollision(pointerRef.current.x, pointerRef.current.y);
    }

    // C. 스캐너(범위) 이동
    if (scannerRef.current) {
      // 마우스 위치에서 캔버스 오프셋을 고려해야 함 (이건 CSS absolute라 그대로 둠)
      // 다만 PointerEvent 좌표는 Global이므로 컨테이너 기준 보정 필요할 수 있음.
      // 여기선 간단히 pointerRef 좌표 사용
      const rect = containerRef.current.getBoundingClientRect();
      const localX = pointerRef.current.x - rect.left;
      const localY = pointerRef.current.y - rect.top;
      
      scannerRef.current.style.transform = `translate(${localX}px, ${localY}px)`;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // 4. 충돌 및 데미지 로직 (최적화됨)
  const checkCollision = (globalX, globalY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = globalX - rect.left;
    const localY = globalY - rect.top;

    // 판정 범위
    const baseRadius = 40; 
    const skillRadius = skills.radius * 25; 
    const totalRadius = baseRadius + skillRadius;

    // 쿨타임 체크 (너무 빨리 달면 순삭되므로 프레임 단위 조절 필요하지만, 일단 타격감 우선)
    // 드래그 시 매 프레임 때리면 너무 세니 확률적 혹은 타이머로 제한 가능.
    // 여기선 "드래그 채굴"이므로 매 프레임 체크하되, 오토클릭 스킬 없으면 드래그 작동 X 로직 추가
    
    // **조건**: 클릭(Tap)은 무조건 발동, 드래그(Move)는 오토스킬 있어야 발동
    // 하지만 "터치하고 드래그해도 캐지게" 해달라 하셨으니, 기본적으로 드래그 채굴 허용하되 
    // 연타 속도 제한을 두는 게 좋음. (여기선 간단히 매 프레임 체크하되 데미지를 낮추거나 함)

    let hitOccurred = false;

    oresRef.current = oresRef.current.filter(ore => {
      // 거리 계산 (광물 중심점 + 30px)
      const dx = localX - (ore.x + 30);
      const dy = localY - (ore.y + 30);
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < totalRadius) {
        // 충돌!
        
        // 데미지 계산
        const critChance = Math.min(0.5, skills.critical * 0.05);
        const isCrit = Math.random() < critChance;
        const dmg = Math.floor(skills.power * (isCrit ? (1.5 + skills.critical * 0.2) : 1));

        ore.currentHp -= dmg;
        ore.isHit = true; // 시각 효과 플래그
        hitOccurred = true;

        // 이펙트 띄우기 (너무 많으면 렉걸리니 크리티컬만 띄우거나 확률적으로)
        if (isCrit || Math.random() > 0.7) {
            showDamageEffect(ore.x, ore.y, dmg, isCrit);
        }

        if (ore.currentHp <= 0) {
          // 파괴됨
          setScore(prev => prev + ore.value);
          playSound('break');
          return false; // 리스트에서 제거
        }
      }
      return true; // 생존
    });

    if (hitOccurred) {
        // 소리는 너무 자주 나면 시끄러우니 쓰로틀링 필요하지만 일단 둠
       // playSound('hit'); 
    }

    // 리스폰 (개수 유지)
    if (oresRef.current.length < 15) {
      spawnOres(1);
    }
  };

  // 데미지 텍스트 (State 사용하되 개수 제한)
  const showDamageEffect = (x, y, val, isCrit) => {
    const id = Date.now() + Math.random();
    setEffects(prev => {
        const next = [...prev, { id, x, y, val, isCrit }];
        if (next.length > 10) next.shift(); // 최대 10개만 유지
        return next;
    });
    setTimeout(() => {
        setEffects(prev => prev.filter(e => e.id !== id));
    }, 800);
  };

  // 입력 핸들러
  const handleDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: true };
    // 클릭 즉시 피드백
    checkCollision(e.clientX, e.clientY);
    playSound('hit');
  };
  
  const handleMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, isDown: pointerRef.current.isDown };
  };

  const handleUp = () => {
    pointerRef.current.isDown = false;
  };

  // 스캐너 크기
  const scannerSize = (40 + skills.radius * 25) * 2;

  return (
    <div 
      className="stage-container" 
      ref={containerRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      {/* HUD */}
      <div className="stage-hud">
        <span className="hud-gold">💎 {score.toLocaleString()}</span>
        <div style={{display:'flex', gap: '10px', alignItems:'center'}}>
            <span className="hud-timer" style={{color: timeLeft < 5 ? 'red' : 'white'}}>
                {timeLeft}s
            </span>
            <button className="stop-btn" onClick={handleStop}>그만하기</button>
        </div>
      </div>

      {/* 광물 (DOM Ref로 제어되므로 리렌더링 없음) */}
      {/* 리액트가 그리는 건 초기 생성시 뿐, 위치는 gameLoop가 바꿈 */}
      {oresRef.current.map(ore => (
        <div 
          key={ore.id}
          id={`ore-${ore.id}`}
          className="ore-instance-dynamic" 
          style={{
            position: 'absolute',
            left: 0, top: 0, // transform으로 이동하므로 0,0 고정
            width: 60, height: 60,
            backgroundColor: ore.color,
            clipPath: ore.shape || 'circle(50%)',
            zIndex: 10,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            willChange: 'transform' // GPU 가속 힌트
          }}
        >
             {/* 체력바만 간단 표시 */}
             {/* (실시간 체력바가 필요하다면 이것도 Ref로 해야하지만, 
                 단순화를 위해 여기선 HP는 시각적으로 안줄어들고 파괴만 되거나,
                 필요시 key를 바꿔 강제 리렌더링 해야함. 
                 성능상 HP바 제거 혹은 간단한 색변화 추천하지만 일단 둠) */}
        </div>
      ))}

      {/* 데미지 텍스트 */}
      {effects.map(ef => (
        <div key={ef.id} className={`damage-text ${ef.isCrit ? 'crit' : ''}`} style={{ left: ef.x, top: ef.y }}>
          {ef.val}
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