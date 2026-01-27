export default function ResultScreen({ earnedGold, onConfirm }) {
  return (
    <div className="result-overlay">
      <div className="result-box">
        <h2 className="result-title">OPERATIONS COMPLETE</h2>
        <span className="result-amount">+{earnedGold.toLocaleString()}G</span>
        <button className="btn-start" onClick={onConfirm} style={{width: '100%', marginTop: 20}}>
          복귀 (RETURN)
        </button>
      </div>
    </div>
  );
}