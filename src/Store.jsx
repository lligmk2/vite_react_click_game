export default function Store({ money, onBuyPower }) {
    return (
      <div className="store-container">
        <h3>🛒 강화 상점</h3>
        <p>보유 골드: {money}G</p>
        <button 
          className="buy-btn"
          onClick={onBuyPower}
          disabled={money < 50} // 50원 없으면 비활성화
        >
          공격력 강화 (+5) - 50G
        </button>
      </div>
    );
  }