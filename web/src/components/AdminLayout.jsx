import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../App.css";
import { getAdminToken, setAdminToken, fetchAdminUnresolvedIssueCount } from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBicycle,
  faChartLine,
  faTriangleExclamation,
  faRightFromBracket,
  faUserShield,
  faMapMarkerAlt,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: faHome },
  { to: "/admin/bikes", label: "Bicikli", icon: faBicycle },
  { to: "/admin/parking", label: "Parking mesta", icon: faMapMarkerAlt },
  { to: "/admin/rentals", label: "Iznajmljivanja", icon: faChartLine },
  { to: "/admin/issues", label: "Prijave problema", icon: faTriangleExclamation },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAdminToken();

  const [unresolvedIssues, setUnresolvedIssues] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        const data = await fetchAdminUnresolvedIssueCount();
        if (!cancelled) {
          setUnresolvedIssues(data?.count ?? 0);
        }
      } catch {
        if (!cancelled) {
          setUnresolvedIssues(0);
        }
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 30000);
    
    // Listen for issue status updates
    const handleIssueStatusUpdate = () => {
      loadCount();
    };
    window.addEventListener("issueStatusUpdated", handleIssueStatusUpdate);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("issueStatusUpdated", handleIssueStatusUpdate);
    };
  }, []);

  if (!token) {
    navigate("/admin/login");
  }

  const handleLogout = () => {
    setAdminToken(null);
    navigate("/admin/login");
  };

  // Determine current page title
  const getCurrentPageTitle = () => {
    // Exact match for dashboard
    if (location.pathname === "/admin") {
      return "Dashboard";
    }
    // Find matching nav item for other routes
    const matchedNav = navItems.find((item) => {
      if (item.to === "/admin") {
        return false; // Skip dashboard for other routes
      }
      return location.pathname.startsWith(item.to);
    });
    return matchedNav ? matchedNav.label : "Kontrolna tabla";
  };

  const currentPageTitle = getCurrentPageTitle();

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
          {navItems.map((item) => {
            const showIssuesBadge = item.to === "/admin/issues" && unresolvedIssues > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => {
                  // For dashboard, only active if exactly on /admin
                  if (item.to === "/admin") {
                    const isDashboardActive = location.pathname === "/admin";
                    return ["nav-link", isDashboardActive ? "active" : ""].filter(Boolean).join(" ");
                  }
                  // For other routes, use default isActive behavior
                  return ["nav-link", isActive ? "active" : ""].filter(Boolean).join(" ");
                }}
              >
                <span className="nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {showIssuesBadge && (
                  <span className="nav-badge">
                    {unresolvedIssues > 99 ? "99+" : unresolvedIssues}
                  </span>
                )}
              </NavLink>
            );
          })}
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
            {currentPageTitle}
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

