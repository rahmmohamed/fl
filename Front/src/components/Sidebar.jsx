import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '◆' },
  { to: '/customers', label: 'Customers', icon: '◉' },
  { to: '/products', label: 'Products', icon: '◈' },
  { to: '/deals', label: 'Deals', icon: '◇' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Pipeline<span>CRM</span>
      </div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            end={link.to === '/'}
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
