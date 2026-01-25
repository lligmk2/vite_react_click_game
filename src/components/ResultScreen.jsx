import React from 'react';

export default function ResultScreen({ earnedGold, onConfirm }) {
  return (
    <div className="overlay-screen">
      <div className="result-card shadow-animation">
        <h2 className="result-title">💰 채굴 정산 보고서</h2>
        <div className="result-content">
          <p>이번 탐사에서 획득한 자산</p>
          <span className="earned-gold">+{earnedGold.toLocaleString()} G</span>
        </div>
        <button className="confirm-btn" onClick={onConfirm}>기지로 복귀</button>
      </div>
    </div>
  );
}