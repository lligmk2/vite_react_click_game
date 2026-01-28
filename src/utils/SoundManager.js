// utils/SoundManager.js

// 오디오 컨텍스트 초기화
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// BGM 설정
const bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
bgm.loop = true;
bgm.volume = 0.5; // 기본 볼륨

export const playSound = (name) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (name) {
    case 'mine': // 띠딕!
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // 0.001까지 부드럽게 감소
      
      osc.start(now);
      osc.stop(now + 0.11); // 볼륨이 줄어든 뒤 종료 (틱 소리 방지)
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

    case 'click': // 찰진 타격음 (사인파)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.06); // 여유 시간
      break;

    case 'break': // 파괴음 (노이즈 느낌 대신 낮은 주파수 쿵)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.21);
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

    case 'result': // 종료음 (빰빠밤~) - 틱 소리의 주범!
      osc.type = 'sine';
      // 멜로디 효과를 위해 주파수 변경
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(400, now + 0.1);
      osc.frequency.setValueAtTime(500, now + 0.2);
      
      gain.gain.setValueAtTime(0.2, now);
      // [핵심] 0.5초에 걸쳐 볼륨을 0.001로 줄이고
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      
      osc.start(now);
      // [핵심] 0.51초에 멈춤 (볼륨이 0이 된 후 멈춰야 틱 소리가 안 남)
      osc.stop(now + 0.51);
      break;
      
    default:
      break;
  }
};

export const setBgm = (play) => {
  if (play) {
    bgm.volume = 0.2; // 볼륨 초기화
    bgm.play().catch(() => console.log("BGM 대기 중..."));
  } else {
    // BGM을 갑자기 끄면 틱 소리가 날 수 있으므로 페이드 아웃 처리 (간단 버전)
    // 여기서는 즉시 멈추되, 오디오 태그 특성상 pause는 틱 소리가 덜함.
    // 만약 여전히 틱 소리가 난다면 volume을 서서히 줄이는 로직이 필요함.
    bgm.pause();
    bgm.currentTime = 0;
  }
};

export const stopSound = () => {
    // Web Audio API 오실레이터는 start/stop으로 자동 관리되므로 별도 처리 불필요
};