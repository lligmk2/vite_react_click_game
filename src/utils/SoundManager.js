// utils/SoundManager.js

// 오디오 컨텍스트 싱글톤
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// BGM 설정 (HTML5 Audio)
const bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
bgm.loop = true;
bgm.volume = 0.5;

let fadeInterval = null;

export const playSound = (name) => {
  // 모바일: 터치 인터랙션 시 Context가 suspended 상태면 풀어줘야 함
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  // [중요] 레이턴시 방지용 미래 시점
  const now = audioCtx.currentTime;

  switch (name) {
    case 'mine': // 채굴 (타격감)
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      // 볼륨 엔벨로프 (틱 소리 방지: 끝에 0으로 확실히 떨어뜨림)
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      gain.gain.linearRampToValueAtTime(0, now + 0.1); // 0.001 -> 0 완전 소거
      
      osc.start(now);
      osc.stop(now + 0.11); // 소리가 완전히 0이 된 후 정지
      break;

    case 'break': 
      // [수정 핵심] 모바일 전용 파괴음
      // 1. 파형 변경: square(먹먹함) -> sawtooth(날카로움, 폰에서 잘 들림)
      // 2. 주파수 대폭 상향: 200Hz(안들림) -> 600~800Hz 시작
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(800, now); 
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      gain.gain.linearRampToValueAtTime(0, now + 0.14); // 틱 방지

      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'critical': // 크리티컬
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      gain.gain.linearRampToValueAtTime(0, now + 0.29);

      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'click': // UI 클릭
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05); // 짧은 소리는 linear가 안전
      
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'result': // 결과 화면 진입
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4); 
      
      osc.start(now);
      osc.stop(now + 0.41);
      break;

    default:
      break;
  }
};

export const setBgm = (play) => {
  // 기존 페이드 작업 취소
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (play) {
    // 켜기: 볼륨을 0에서 목표치(0.2)로 부드럽게 올림 (틱 방지)
    bgm.volume = 0; 
    bgm.currentTime = 0;
    
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 재생 성공 시 페이드 인
          let vol = 0;
          fadeInterval = setInterval(() => {
            if (vol < 0.2) {
              vol += 0.02;
              bgm.volume = Math.min(vol, 0.2); // 최대 0.2 제한
            } else {
              clearInterval(fadeInterval);
            }
          }, 50);
        })
        .catch(error => console.log("BGM Error:", error));
    }
  } else {
    // 끄기: 페이드 아웃 (틱 방지 핵심)
    let vol = bgm.volume;
    fadeInterval = setInterval(() => {
      if (vol > 0.01) {
        vol -= 0.02; // 서서히 줄임
        bgm.volume = Math.max(0, vol);
      } else {
        // 볼륨이 거의 0이 되었을 때 정지
        bgm.volume = 0;
        bgm.pause();
        bgm.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 30); // 0.03초마다 실행 (빠르게 감소)
  }
};

export const stopSound = () => {
  // Web Audio Oscillator는 자동 stop되므로 처리 불필요
};