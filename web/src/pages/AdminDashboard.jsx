import { useEffect, useState } from "react";
import "../App.css";
import { fetchAdminStats } from "../api";
import { useToast } from "../contexts/ToastContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBicycle,
  faTriangleExclamation,
  faUsers,
  faClock,
  faChartLine,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("sr-Latn-RS", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State for rentals chart
  const [rentalsMonthOffset, setRentalsMonthOffset] = useState(0);
  const [rentalsMonthData, setRentalsMonthData] = useState(null);

  // Helper function to load month-specific data
  const loadMonthData = async (monthOffset) => {
    try {
      const data = await fetchAdminStats(monthOffset);
      return data;
    } catch (err) {
      console.error("Error loading month data:", err);
      return null;
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      // Load stats without month offset - backend returns all needed data
      const data = await fetchAdminStats(0);
      setStats(data);
    } catch (err) {
      const msg = err.message || "Greška pri učitavanju statistika";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadStats();
      // Load initial month data for rentals chart
      const monthData = await loadMonthData(0);
      if (monthData) {
        setRentalsMonthData(monthData);
      }
    };
    initializeData();
  }, []);

  // Load month data when monthOffset changes for rentals
  useEffect(() => {
    let cancelled = false;
    loadMonthData(rentalsMonthOffset).then((data) => {
      if (!cancelled && data) {
        setRentalsMonthData(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [rentalsMonthOffset]);


  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="table-empty-spinner"></div>
        <p>Učitavanje statistika...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-error">
        <p>{error || "Greška pri učitavanju podataka"}</p>
      </div>
    );
  }

  // Prepare chart data
  const bikesByTypeData = {
    labels: (stats.charts.bikesByType || []).map((item) => item._id || "Nepoznat"),
    datasets: [
      {
        label: "Broj bicikala",
        data: (stats.charts.bikesByType || []).map((item) => item.count),
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336", "#00BCD4"],
      },
    ],
  };

  const bikesByStatusData = {
    labels: (stats.charts.bikesByStatus || []).map((item) => {
      const statusMap = {
        available: "Dostupno",
        in_use: "U upotrebi",
        maintenance: "Održavanje",
        inactive: "Neaktivno",
      };
      return statusMap[item._id] || item._id;
    }),
    datasets: [
      {
        label: "Broj bicikala",
        data: (stats.charts.bikesByStatus || []).map((item) => item.count),
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#757575"],
      },
    ],
  };

  const rentalsByDurationData = {
    labels: (stats.charts.rentalsByDuration || []).map((item) => item._id || "Nepoznat"),
    datasets: [
      {
        label: "Broj iznajmljivanja",
        data: (stats.charts.rentalsByDuration || []).map((item) => item.count),
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"],
      },
    ],
  };

  // Prepare rentals chart data
  const rentalsData = rentalsMonthData && rentalsMonthData.charts && rentalsMonthData.charts.rentalsCurrentMonth
    ? {
        labels: rentalsMonthData.charts.rentalsCurrentMonth.map((item) => {
          const [year, month, day] = item._id.split("-");
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return date.toLocaleDateString("sr-Latn-RS", { day: "numeric" });
        }),
        datasets: [
          {
            label: "Iznajmljivanja",
            data: rentalsMonthData.charts.rentalsCurrentMonth.map((item) => item.count || 0),
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            tension: 0.4,
          },
        ],
      }
    : { labels: [], datasets: [{ label: "Iznajmljivanja", data: [], borderColor: "#4CAF50", backgroundColor: "rgba(76, 175, 80, 0.1)", tension: 0.4 }] };


  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };


  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <div style={{ fontSize: 14, color: "var(--text-light)" }}>
            Pregled statistika i aktivnosti sistema
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
            <FontAwesomeIcon icon={faBicycle} size={24} color="#4CAF50" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{stats.counts.bikes}</div>
            <div className="dashboard-stat-label">Bicikala</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#FFE0B2" }}>
            <FontAwesomeIcon icon={faTriangleExclamation} size={24} color="#FF9800" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{stats.counts.problems}</div>
            <div className="dashboard-stat-label">Prijavljeni problemi</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
            <FontAwesomeIcon icon={faUsers} size={24} color="#2196F3" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{stats.counts.users}</div>
            <div className="dashboard-stat-label">Registrovani korisnici</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#FFF3E0" }}>
            <FontAwesomeIcon icon={faClock} size={24} color="#FF9800" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{stats.counts.activeRentals}</div>
            <div className="dashboard-stat-label">Aktivna iznajmljivanja</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="dashboard-stats-grid" style={{ marginTop: 20 }}>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#E8F5E9" }}>
            <FontAwesomeIcon icon={faDollarSign} size={24} color="#4CAF50" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{formatCurrency(stats.stats?.totalRevenue || 0)}</div>
            <div className="dashboard-stat-label">Ukupan prihod</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ backgroundColor: "#E3F2FD" }}>
            <FontAwesomeIcon icon={faChartLine} size={24} color="#2196F3" />
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-value">{stats.stats?.avgRentalDurationMinutes || 0} min</div>
            <div className="dashboard-stat-label">Prosečno trajanje</div>
          </div>
        </div>
      </div>

      {/* Recent Rentals */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Nedavna iznajmljivanja</h3>
        <div className="table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Korisnik</th>
                  <th>Bicikl</th>
                  <th>Status</th>
                  <th>Datum</th>
                  <th>Cena</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRentals.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                      Nema iznajmljivanja
                    </td>
                  </tr>
                ) : (
                  stats.recentRentals.map((rental) => {
                    const statusMap = {
                      active: { label: "Aktivno", color: "#2196F3", bgColor: "#E3F2FD" },
                      completed: { label: "Završeno", color: "#4CAF50", bgColor: "#E8F5E9" },
                      cancelled: { label: "Otkazano", color: "#FF9800", bgColor: "#FFF3E0" },
                    };
                    const statusInfo = statusMap[rental.status] || statusMap.active;
                    const userName = rental.user
                      ? `${rental.user.firstName} ${rental.user.lastName}`.trim() || rental.user.email
                      : "Nepoznat korisnik";

                    return (
                      <tr key={rental._id}>
                        <td>{userName}</td>
                        <td>{rental.bike?.name || "Nepoznat bicikl"}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>{formatDate(rental.createdAt)}</td>
                        <td>
                          {rental.totalCost ? formatCurrency(rental.totalCost) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts-grid">
        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">Tipovi bicikala</h3>
          <div className="dashboard-chart-container">
            <Doughnut data={bikesByTypeData} options={doughnutOptions} />
          </div>
        </div>

        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">Bicikli po statusu</h3>
          <div className="dashboard-chart-container">
            <Doughnut data={bikesByStatusData} options={doughnutOptions} />
          </div>
        </div>

        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">Iznajmljivanja po trajanju</h3>
          <div className="dashboard-chart-container">
            <Doughnut data={rentalsByDurationData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="dashboard-section">
        <div className="dashboard-chart-card dashboard-chart-card-full">
          <div className="dashboard-chart-header">
            <h3 className="dashboard-chart-title">
              Broj iznajmljivanja po danima
            </h3>
            <div className="dashboard-chart-controls">
              <select
                value={rentalsMonthOffset}
                onChange={(e) => {
                  setRentalsMonthOffset(parseInt(e.target.value));
                }}
                className="dashboard-select"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - offset);
                  return (
                    <option key={offset} value={offset}>
                      {date.toLocaleDateString("sr-Latn-RS", { month: "long", year: "numeric" })}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="dashboard-chart-container">
            {rentalsData.labels.length > 0 ? (
              <Line data={rentalsData} options={lineChartOptions} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <p style={{ color: "var(--text-light)" }}>Učitavanje podataka...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
