import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { getAdminToken, setAdminToken } from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBicycle,
  faChartLine,
  faTriangleExclamation,
  faRightFromBracket,
  faUserShield,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { to: "/admin/bikes", label: "Bicikli", icon: faBicycle },
  { to: "/admin/parking", label: "Parking mesta", icon: faMapMarkerAlt },
  { to: "/admin/rentals", label: "Iznajmljivanja", icon: faChartLine },
  { to: "/admin/issues", label: "Prijave problema", icon: faTriangleExclamation },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAdminToken();

  if (!token) {
    navigate("/admin/login");
  }

  const handleLogout = () => {
    setAdminToken(null);
    navigate("/admin/login");
  };

  const currentNav = navItems.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Bikely" className="sidebar-logo" />
          <div className="sidebar-title">
            <div className="sidebar-title-badge">Admin</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                ["nav-link", isActive ? "active" : ""].filter(Boolean).join(" ")
              }
            >
              <span className="nav-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="nav-icon">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </span>
            <span>Odjavi se</span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="app-header-title">
            {currentNav ? currentNav.label : "Kontrolna tabla"}
          </div>
          <div className="app-header-user">
            <div className="app-header-avatar">
              <FontAwesomeIcon icon={faUserShield} />
            </div>
            <span>Admin</span>
            <button className="btn-secondary" onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Odjava</span>
            </button>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

