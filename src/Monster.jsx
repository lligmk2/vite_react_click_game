export default function Monster({ hp, maxHp, isDead, onAttack }) {
    return (
      <div className="monster-area">
        <div className="hp-bar-bg">
          <div 
            className="hp-bar-fill" 
            style={{ width: `${(hp / maxHp) * 100}%`, backgroundColor: hp < 30 ? 'red' : '#ff4757' }}
          ></div>
        </div>
        <button 
          className={`monster ${isDead ? 'dead' : ''}`} 
          onClick={onAttack}
        >
          {isDead ? "💀" : "👾"}
        </button>
      </div>
    );
  }