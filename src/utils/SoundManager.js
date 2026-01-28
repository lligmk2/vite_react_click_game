// utils/SoundManager.js

// 오디오 컨텍스트 초기화
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// BGM 설정 (HTML5 Audio Element)
const bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
bgm.loop = true;
bgm.volume = 0.5;

// 페이드 아웃용 타이머 변수
let fadeInterval = null;

export const playSound = (name) => {
  // 모바일 브라우저 정책상 사용자 제스처 이후 resume 필수
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.log(e));
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  // [중요] 모바일 레이턴시 고려: 현재 시간보다 아주 살짝 뒤로 설정하여 '과거 시점 재생' 오류 방지
  const now = audioCtx.currentTime + 0.01;

  switch (name) {
    case 'mine': // 띠딕!
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.11);
      break;

    case 'critical': // 피융~!
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.31);
      break;

    case 'click': // 찰진 타격음
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'break': 
      // [수정됨] 모바일 대응 버전
      osc.type = 'square';
      
      // 1. 주파수 상향: 40Hz는 폰 스피커에서 안들림 -> 100Hz까지만 떨어뜨림
      // 2. LinearRamp 사용: 아주 짧은 시간(0.08초)에는 Exponential보다 Linear가 안정적
      osc.frequency.setValueAtTime(200, now); 
      osc.frequency.linearRampToValueAtTime(60, now + 0.1); // 40 -> 60Hz로 상향

      gain.gain.setValueAtTime(0.2, now); // 볼륨 살짝 키움 (0.15 -> 0.2)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1); // Exponential -> Linear 변경

      osc.start(now);
      osc.stop(now + 0.11);
      break;

    case 'upgrade': // 뾰로롱
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.41);
      break;

    case 'result': // 종료음
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.2); // setValue 체인 대신 램프로 부드럽게
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      
      osc.start(now);
      osc.stop(now + 0.51);
      break;
      
    default:
      break;
  }
};

export const setBgm = (play) => {
  // 기존 페이드 아웃 진행 중이면 취소
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (play) {
    bgm.volume = 0.2; // 초기 볼륨 설정
    bgm.currentTime = 0; // 처음부터 재생
    const playPromise = bgm.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Auto-play prevented:", error);
      });
    }
  } else {
    // [핵심 수정] 틱 소리 방지를 위한 수동 페이드 아웃
    // 0.05초마다 볼륨을 깎아서 0이 되면 정지
    const fadeOutStep = 0.02; // 깎는 양
    
    fadeInterval = setInterval(() => {
      if (bgm.volume > fadeOutStep) {
        bgm.volume -= fadeOutStep;
      } else {
        // 볼륨이 거의 0이 되면 정지
        bgm.volume = 0;
        bgm.pause();
        bgm.currentTime = 0;
        clearInterval(fadeInterval);
        fadeInterval = null;
      }
    }, 50); // 50ms 마다 실행 (약 0.5초 동안 페이드 아웃)
  }
};

export const stopSound = () => {
   // Oscillator는 자동 stop되므로 비워둠
};