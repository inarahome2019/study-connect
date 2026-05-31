import React from 'react';
import { Coffee, Croissant } from 'lucide-react';

const menuItems = [
  { id: 'matcha', name: 'Matcha Latte', time: 25, type: 'drink', icon: '🍵' },
  { id: 'caramel', name: 'Caramel Macchiato', time: 30, type: 'drink', icon: '☕' },
  { id: 'americano', name: 'Iced Americano', time: 15, type: 'drink', icon: '🧊' },
  { id: 'strawberry', name: 'Strawberry Milk', time: 20, type: 'drink', icon: '🍓' },
  { id: 'croissant', name: 'Butter Croissant', time: 45, type: 'pastry', icon: '🥐' },
  { id: 'muffin', name: 'Blueberry Muffin', time: 50, type: 'pastry', icon: '🧁' },
  { id: 'cake', name: 'Cheesecake Slice', time: 60, type: 'pastry', icon: '🍰' },
  { id: 'cookie', name: 'Choc Chip Cookie', time: 10, type: 'pastry', icon: '🍪' },
];

const CafeMenu = ({ onOrder }) => {
  return (
    <div className="cafe-menu glass-panel" style={{ marginTop: '1rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Coffee /> Study Cafe Menu
      </h2>
      <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Order an item to start studying. The timer will automatically start based on the preparation time. You can take a break once your order is served!
      </p>

      <div className="menu-section">
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Drinks</h3>
        <div className="menu-grid">
          {menuItems.filter(i => i.type === 'drink').map(item => (
            <button key={item.id} className="menu-item" onClick={() => onOrder(item.time, item.name)}>
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-name">{item.name}</span>
              <span className="menu-time">{item.time} mins</span>
            </button>
          ))}
        </div>
      </div>

      <div className="menu-section" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Pastries</h3>
        <div className="menu-grid">
          {menuItems.filter(i => i.type === 'pastry').map(item => (
            <button key={item.id} className="menu-item" onClick={() => onOrder(item.time, item.name)}>
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-name">{item.name}</span>
              <span className="menu-time">{item.time} mins</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CafeMenu;
