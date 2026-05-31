import React, { useState } from 'react';
import { Coffee, ShoppingCart, CheckCircle, Trash2 } from 'lucide-react';

const icons = {
  hotDrink: (
    <svg viewBox="0 0 100 100" width="40" height="40" className="svg-hot-drink">
      <path d="M20,40 Q20,80 30,90 L70,90 Q80,80 80,40 Z" fill="#E6B3FF" />
      <path d="M80,50 Q95,50 90,70 Q80,70 80,60" fill="none" stroke="#E6B3FF" strokeWidth="6" />
      <path className="steam steam-1" d="M40,30 Q30,15 45,0" fill="none" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
      <path className="steam steam-2" d="M60,35 Q50,20 65,5" fill="none" stroke="#ccc" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  icedDrink: (
    <svg viewBox="0 0 100 100" width="40" height="40" className="svg-iced-drink">
      <path d="M25,20 L35,90 L65,90 L75,20 Z" fill="rgba(186, 225, 255, 0.5)" stroke="#BAE1FF" strokeWidth="4" />
      <rect className="ice-cube ice-1" x="40" y="60" width="15" height="15" fill="#fff" opacity="0.8" />
      <rect className="ice-cube ice-2" x="50" y="40" width="15" height="15" fill="#fff" opacity="0.8" />
      <path d="M50,20 L50,5" stroke="#FFB3BA" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  pastry: (
    <svg viewBox="0 0 100 100" width="40" height="40" className="svg-pastry">
      <path d="M20,70 Q50,30 80,70 Z" fill="#FFDFBA" />
      <path d="M20,70 Q50,90 80,70" fill="#FFB3BA" />
      <circle cx="50" cy="55" r="3" fill="#8c5a2b" />
      <circle cx="40" cy="65" r="3" fill="#8c5a2b" />
      <circle cx="60" cy="65" r="3" fill="#8c5a2b" />
    </svg>
  )
};

const menuItems = [
  { id: 'matcha', name: 'Matcha Latte', time: 25, type: 'drink', icon: icons.hotDrink },
  { id: 'caramel', name: 'Caramel Macchiato', time: 30, type: 'drink', icon: icons.hotDrink },
  { id: 'americano', name: 'Iced Americano', time: 15, type: 'drink', icon: icons.icedDrink },
  { id: 'strawberry', name: 'Strawberry Milk', time: 20, type: 'drink', icon: icons.icedDrink },
  { id: 'croissant', name: 'Butter Croissant', time: 45, type: 'pastry', icon: icons.pastry },
  { id: 'muffin', name: 'Blueberry Muffin', time: 50, type: 'pastry', icon: icons.pastry },
  { id: 'cake', name: 'Cheesecake Slice', time: 60, type: 'pastry', icon: icons.pastry },
  { id: 'cookie', name: 'Choc Chip Cookie', time: 10, type: 'pastry', icon: icons.pastry },
];

const CafeMenu = ({ onOrder }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(i => i.cartId !== cartId));
  };

  const totalTime = cart.reduce((sum, item) => sum + item.time, 0);

  const handlePlaceOrder = () => {
    if (cart.length > 0) {
      onOrder(totalTime, cart.map(i => i.name).join(', '));
      setCart([]);
    }
  };

  return (
    <div className="cafe-menu-container" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      <div className="menu-items glass-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Coffee /> Study Cafe Menu
        </h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Add items to your tray. The total preparation time will become your study timer!
        </p>

        <div className="menu-section">
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Drinks</h3>
          <div className="menu-grid">
            {menuItems.filter(i => i.type === 'drink').map(item => (
              <button key={item.id} className="menu-item animated-item" onClick={() => addToCart(item)}>
                <span className="menu-icon-svg">{item.icon}</span>
                <span className="menu-name">{item.name}</span>
                <span className="menu-time">+{item.time} mins</span>
              </button>
            ))}
          </div>
        </div>

        <div className="menu-section" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Pastries</h3>
          <div className="menu-grid">
            {menuItems.filter(i => i.type === 'pastry').map(item => (
              <button key={item.id} className="menu-item animated-item" onClick={() => addToCart(item)}>
                <span className="menu-icon-svg">{item.icon}</span>
                <span className="menu-name">{item.name}</span>
                <span className="menu-time">+{item.time} mins</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cart-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <ShoppingCart /> Your Tray
        </h3>
        
        <div className="cart-items" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>Your tray is empty.</div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.8rem', borderRadius: '12px', boxShadow: 'var(--shadow-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px' }}>{item.icon}</div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{item.time}m</span>
                  <button onClick={() => removeFromCart(item.cartId)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.2rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold' }}>
            <span>Total Study Time:</span>
            <span style={{ color: 'var(--primary)' }}>{totalTime} mins</span>
          </div>
          <button 
            className="btn" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: cart.length === 0 ? 0.5 : 1 }}
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
          >
            <CheckCircle size={20} /> Place Order & Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeMenu;
