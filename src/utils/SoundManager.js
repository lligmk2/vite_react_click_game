// utils/SoundManager.js

// 오디오 컨텍스트 초기화 (브라우저 엔진)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// BGM은 외부 안정적인 스트리밍 주소 사용 (SoundHelix는 테스트용으로 개방됨)
const bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
bgm.loop = true;
bgm.volume = 0.8;

export const playSound = (name) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (name) {
    case 'mine': // 띠딕! (짧고 높은 음)
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'critical': // 피융~! (미사일 레이저 소리)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'click': // 딸깍 (중간 음)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'upgrade': // 뾰로롱 (상승하는 음)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'result': // 빰빠밤~ (종료음)
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(400, now + 0.1);
      osc.frequency.setValueAtTime(500, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
      
    default:
      break;
  }
};

export const setBgm = (play) => {
  if (play) {
    bgm.play().catch(() => console.log("BGM 대기 중..."));
  } else {
    bgm.pause();
    bgm.currentTime = 0;
  }
};

export const stopSound = () => {}; // 신시사이저 방식은 자동으로 정지됨