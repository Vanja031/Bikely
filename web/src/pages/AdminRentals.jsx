import { useEffect, useState } from "react";
import "../App.css";
import { fetchAdminRentals, fetchAdminRentalDetails } from "../api";
import { useToast } from "../contexts/ToastContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faSearch,
  faFilterCircleXmark,
  faUser,
  faBicycle,
  faClock,
  faCheckCircle,
  faEye,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FilterSelect } from "../components/FilterSelect.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const RENTAL_STATUS = {
  active: { label: "Aktivna", color: "#2196F3", bgColor: "#E3F2FD" },
  completed: { label: "Završena", color: "#4CAF50", bgColor: "#E8F5E9" },
  cancelled: { label: "Otkazana", color: "#757575", bgColor: "#EEEEEE" },
};

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("sr-RS", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCost(value) {
  if (value == null || value === "") return "—";
  return `${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} RSD`;
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "—";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRentalStatus(status) {
  return RENTAL_STATUS[status] || { label: status, color: "#757575", bgColor: "#f5f5f5" };
}

export function AdminRentals() {
  const toast = useToast();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadRentals = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminRentals();
      setRentals(data);
    } catch (err) {
      const errorMsg = err.message || "Greška pri učitavanju iznajmljivanja";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const filteredRentals = rentals.filter((r) => {
    const userLabel = r.user
      ? [r.user.email, r.user.firstName, r.user.lastName].filter(Boolean).join(" ")
      : "";
    const bikeName = r.bike?.name || "";
    const matchesSearch =
      searchQuery === "" ||
      userLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bikeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = searchQuery !== "" || filterStatus !== "all";
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
  };

  const handleViewDetails = async (rentalId) => {
    setLoadingDetails(true);
    setModalOpen(true);
    try {
      const details = await fetchAdminRentalDetails(rentalId);
      setSelectedRental(details);
    } catch (err) {
      toast.error(err.message || "Greška pri učitavanju detalja");
      setModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const total = rentals.length;
  const activeCount = rentals.filter((r) => r.status === "active").length;
  const completedCount = rentals.filter((r) => r.status === "completed").length;

  return (
    <div>
      <div className="bikes-header">
        <div>
          <div style={{ fontSize: 14, color: "var(--text-light)" }}>
            Pregled svih iznajmljivanja sa mobilne aplikacije.
          </div>
        </div>
      </div>

      {error && (
        <div className="error-text" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="rentals-stats">
        <div className="rentals-stat-card">
          <div className="rentals-stat-icon" style={{ backgroundColor: "#E3F2FD", color: "#2196F3" }}>
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="rentals-stat-content">
            <span className="rentals-stat-label">Ukupno</span>
            <span className="rentals-stat-value">{total}</span>
          </div>
        </div>
        <div className="rentals-stat-card">
          <div className="rentals-stat-icon" style={{ backgroundColor: "#E3F2FD", color: "#2196F3" }}>
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="rentals-stat-content">
            <span className="rentals-stat-label">Aktivna</span>
            <span className="rentals-stat-value">{activeCount}</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <FontAwesomeIcon icon={faSearch} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Pretraži po korisniku ili biciklu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "all", label: "Svi statusi", color: "#757575", bgColor: "#f5f5f5" },
            { value: "active", label: "Aktivna", color: "#2196F3", bgColor: "#E3F2FD" },
            { value: "completed", label: "Završena", color: "#4CAF50", bgColor: "#E8F5E9" },
          ]}
          getOptionStyle={(option) => {
            if (option.value === "all") {
              return { backgroundColor: "#f5f5f5", color: "#757575" };
            }
            const s = getRentalStatus(option.value);
            return { backgroundColor: s.bgColor, color: s.color };
          }}
        />
        <button
          className="filter-clear-btn"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          title="Očisti filtere"
        >
          <FontAwesomeIcon icon={faFilterCircleXmark} />
          <span>Očisti</span>
        </button>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>Bicikl</th>
                <th>Početak</th>
                <th>Završetak</th>
                <th style={{ textAlign: "right" }}>Cena</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-state">
                      <div className="table-empty-spinner"></div>
                      <p>Učitavanje...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-state">
                      <div className="table-empty-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <h3>
                        {rentals.length === 0
                          ? "Još nema iznajmljivanja"
                          : "Nema rezultata pretrage"}
                      </h3>
                      <p>
                        {rentals.length === 0
                          ? "Iznajmljivanja sa mobilne aplikacije će se ovde prikazivati."
                          : "Pokušajte sa drugim filterima ili pretragom."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRentals.map((r) => {
                  const statusInfo = getRentalStatus(r.status);
                  const userLabel = r.user
                    ? [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.email
                    : "—";
                  const bikeLabel = r.bike?.name ?? "—";
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <FontAwesomeIcon
                              icon={faUser}
                              style={{ color: "var(--text-light)", fontSize: 14 }}
                            />
                            <span>{userLabel}</span>
                          </div>
                          {r.user?.email && (
                            <span style={{ fontSize: 12, color: "var(--text-light)", marginLeft: 20 }}>
                              {r.user.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FontAwesomeIcon
                            icon={faBicycle}
                            style={{ color: "var(--primary-color)", fontSize: 14 }}
                          />
                          {bikeLabel}
                        </div>
                      </td>
                      <td>{formatDate(r.startTime)}</td>
                      <td>{formatDate(r.endTime)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {formatCost(r.totalCost)}
                      </td>
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
                      <td>
                        <button
                          className="btn-secondary btn-secondary-small"
                          onClick={() => handleViewDetails(r._id)}
                          title="Pregled detalja"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>Pregled</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal za detalje iznajmljivanja */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal rental-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000 }}>
            <div className="modal-header">
              <div className="modal-title">
                Detalji iznajmljivanja
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div className="table-empty-spinner"></div>
                  <p>Učitavanje...</p>
                </div>
              ) : selectedRental ? (
                <div className="rental-details-content">
                  {/* Informacije o korisniku */}
                  <div className="rental-details-section">
                    <h3 className="rental-section-title">Informacije o korisniku</h3>
                    <div className="rental-details-grid">
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Ime i prezime:</span>
                        <span className="rental-detail-value">
                          {selectedRental.user?.firstName && selectedRental.user?.lastName
                            ? `${selectedRental.user.firstName} ${selectedRental.user.lastName}`
                            : selectedRental.user?.email || "—"}
                        </span>
                      </div>
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Email:</span>
                        <span className="rental-detail-value">{selectedRental.user?.email || "—"}</span>
                      </div>
                      {selectedRental.user?.phone && (
                        <div className="rental-detail-item">
                          <span className="rental-detail-label">Telefon:</span>
                          <span className="rental-detail-value">{selectedRental.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informacije o iznajmljivanju */}
                  <div className="rental-details-section">
                    <h3 className="rental-section-title">Informacije o iznajmljivanju</h3>
                    <div className="rental-details-grid">
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Bicikl:</span>
                        <span className="rental-detail-value">
                          {selectedRental.bike?._id ? `#${selectedRental.bike._id.slice(-2)} - ` : ""}
                          {selectedRental.bike?.name || "—"}
                        </span>
                      </div>
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Početak:</span>
                        <span className="rental-detail-value">{formatDate(selectedRental.startTime)}</span>
                      </div>
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Završetak:</span>
                        <span className="rental-detail-value">{formatDate(selectedRental.endTime)}</span>
                      </div>
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Trajanje:</span>
                        <span className="rental-detail-value">
                          {formatDuration(selectedRental.startTime, selectedRental.endTime)}
                        </span>
                      </div>
                      <div className="rental-detail-item">
                        <span className="rental-detail-label">Ukupna cena:</span>
                        <span className="rental-detail-value rental-price-highlight">
                          {formatCost(selectedRental.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fotografije bicikla */}
                  {selectedRental.endPhoto && (
                    <div className="rental-details-section">
                      <h3 className="rental-section-title">Fotografije bicikla</h3>
                      <div className="rental-photos-grid">
                        <div className="rental-photo-wrapper">
                          <img
                            src={`${API_BASE_URL}/static/${selectedRental.endPhoto}`}
                            alt="Bicikl"
                            className="rental-photo"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
