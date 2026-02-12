import { useEffect, useState } from "react";
import "../App.css";
import { fetchAdminIssues, updateAdminIssueStatus } from "../api";
import { useToast } from "../contexts/ToastContext.jsx";
import { useModal } from "../contexts/ModalContext.jsx";
import { FilterSelect } from "../components/FilterSelect.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faBug,
  faBicycle,
  faMapMarkerAlt,
  faUser,
  faClock,
  faCheckCircle,
  faCircleNotch,
  faFilterCircleXmark,
  faTimes,
  faWrench,
  faBan,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const ISSUE_STATUS = {
  open: { label: "Otvorena", color: "#FF9800", bgColor: "#FFE0B2" },
  resolved: { label: "Rešena", color: "#4CAF50", bgColor: "#C8E6C9" },
};

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("sr-RS", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function AdminIssues() {
  const toast = useToast();
  const { confirm } = useModal();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const loadIssues = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminIssues({
        status: filterStatus === "all" ? undefined : filterStatus,
      });
      setIssues(data);
    } catch (err) {
      const msg = err.message || "Greška pri učitavanju prijava problema";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const filteredIssues = issues.filter((p) => {
    const userLabel = p.user
      ? [p.user.firstName, p.user.lastName, p.user.email]
          .filter(Boolean)
          .join(" ")
      : "";
    const bikeLabel = p.bike?.name || "";
    const address = p.address || "";
    const text =
      `${p.title} ${p.description} ${userLabel} ${bikeLabel} ${address}`.toLowerCase();
    const matchesSearch =
      searchQuery === "" || text.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const hasActiveFilters =
    searchQuery !== "" || filterStatus !== "open";

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("open");
  };

  const handleIssueAction = async (issue, action) => {
    let confirmMessage = "";
    let confirmTitle = "";
    let confirmText = "";
    let confirmColor = "primary";

    if (action === "resolve") {
      confirmTitle = "Označi problem kao rešen";
      confirmMessage = `Da li ste sigurni da želite da označite problem "${issue.title}" kao rešen? Bicikl će biti vraćen u upotrebu.`;
      confirmText = "Označi kao rešeno";
      confirmColor = "primary";
    } else if (action === "maintenance") {
      confirmTitle = "Pošalji bicikl na održavanje";
      confirmMessage = `Da li ste sigurni da želite da pošaljete bicikl "${issue.bike?.name || "Nepoznat"}" na održavanje?`;
      confirmText = "Pošalji na održavanje";
      confirmColor = "warning";
    } else if (action === "deactivate") {
      confirmTitle = "Isključi bicikl iz sistema";
      confirmMessage = `Da li ste sigurni da želite da isključite bicikl "${issue.bike?.name || "Nepoznat"}" iz sistema?`;
      confirmText = "Isključi iz sistema";
      confirmColor = "warning";
    }

    const confirmed = await confirm(confirmMessage, {
      title: confirmTitle,
      confirmText: confirmText,
      cancelText: "Otkaži",
      confirmColor: confirmColor,
    });

    if (!confirmed) {
      return;
    }

    setUpdatingId(issue._id);
    try {
      await updateAdminIssueStatus(issue._id, action);
      let message = "Akcija je uspešno izvršena.";
      if (action === "resolve") {
        message = "Problem je označen kao rešen, bicikl je vraćen u upotrebu.";
      } else if (action === "maintenance") {
        message = "Bicikl je poslat na održavanje.";
      } else if (action === "deactivate") {
        message = "Bicikl je isključen iz sistema.";
      }
      toast.success(message);
      await loadIssues();
      
      // Trigger event to update unresolved count in AdminLayout
      if (action === "resolve" || action === "maintenance" || action === "deactivate") {
        window.dispatchEvent(new CustomEvent("issueStatusUpdated"));
      }
    } catch (err) {
      toast.error(err.message || "Greška pri izvršavanju akcije");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-text" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-search">
          <FontAwesomeIcon icon={faBug} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Pretraži po nazivu, opisu, korisniku ili adresi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "all", label: "Sve prijave", color: "#757575", bgColor: "#f5f5f5" },
            { value: "open", label: "Otvorene", color: "#FF9800", bgColor: "#FFF3E0" },
            { value: "resolved", label: "Rešene", color: "#4CAF50", bgColor: "#E8F5E9" },
          ]}
          getOptionStyle={(option) => {
            if (option.value === "all") {
              return { backgroundColor: "#f5f5f5", color: "#757575" };
            }
            const s = ISSUE_STATUS[option.value];
            return s
              ? { backgroundColor: s.bgColor, color: s.color }
              : { backgroundColor: "#f5f5f5", color: "#757575" };
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

      {loading ? (
        <div className="problem-cards-empty">
          <div className="table-empty-state">
            <div className="table-empty-spinner"></div>
            <p>Učitavanje prijava...</p>
          </div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="problem-cards-empty">
          <div className="table-empty-state">
            <div className="table-empty-icon">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <h3>
              {issues.length === 0
                ? "Još uvek nema prijava problema"
                : "Nema rezultata za izabrane filtere"}
            </h3>
            <p>
              Prijave problema koje korisnici pošalju sa mobilne aplikacije pojaviće se ovde.
            </p>
          </div>
        </div>
      ) : (
        <div className="problem-cards-list">
          {filteredIssues.map((p) => {
            const statusInfo = ISSUE_STATUS[p.status] || ISSUE_STATUS.open;
            const userLabel = p.user
              ? [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") ||
                p.user.email
              : "Nepoznat korisnik";

            return (
              <div key={p._id} className="problem-card-full">
                <div 
                  className="problem-card-full-header"
                  style={{
                    backgroundColor: statusInfo.bgColor,
                  }}
                >
                  <div className="problem-card-full-title-section">
                    <h3 className="problem-title-text">{p.title}</h3>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="problem-card-full-meta">
                    {p.resolvedAt && (
                      <span className="problem-meta-item">
                        <FontAwesomeIcon icon={faClock} /> Rešeno: {formatDate(p.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="problem-card-full-content">
                  <div className="problem-card-full-info-grid">
                    <div className="problem-info-item">
                      {p.bike && (
                        <div className="problem-meta-item">
                          <FontAwesomeIcon icon={faBicycle} />
                          <span><strong>Bicikl:</strong> {p.bike.name}</span>
                        </div>
                      )}
                      <div className="problem-meta-item" style={{ marginTop: 4 }}>
                        <FontAwesomeIcon icon={faClock} />
                        <span><strong>Prijavljeno:</strong> {formatDate(p.createdAt)}</span>
                      </div>
                      {p.address && (
                        <div className="problem-meta-item" style={{ marginTop: 8 }}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <span><strong>Adresa:</strong> {p.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="problem-info-item">
                      <div className="problem-meta-item">
                        <FontAwesomeIcon icon={faUser} />
                        <span><strong>Korisnik:</strong> {userLabel}</span>
                      </div>
                      {p.user?.email && (
                        <div className="problem-meta-sub" style={{ marginLeft: 24, marginTop: 4 }}>
                          {p.user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="problem-card-full-divider"></div>

                  <div className="problem-card-full-description">
                    <div className="problem-description-label">Opis problema:</div>
                    <p className="problem-description">{p.description}</p>
                  </div>

                  {p.photos && p.photos.length > 0 && (
                    <div className="problem-photos-grid-full">
                      {p.photos.map((photoPath) => (
                        <div
                          key={photoPath}
                          className="problem-photo-wrapper"
                          onClick={() => setSelectedPhoto(`${API_BASE_URL}/static/${photoPath}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={`${API_BASE_URL}/static/${photoPath}`}
                            alt="Prijava problema"
                            className="problem-photo"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {p.status === "open" && (
                    <div className="problem-card-full-actions">
                      <button
                        type="button"
                        className="btn-action-full btn-action-maintenance-full"
                        disabled={updatingId === p._id}
                        onClick={() => handleIssueAction(p, "maintenance")}
                      >
                        {updatingId === p._id ? (
                          <FontAwesomeIcon icon={faCircleNotch} spin />
                        ) : (
                          <FontAwesomeIcon icon={faWrench} />
                        )}
                        <span>Pošalji na održavanje</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-full btn-action-deactivate-full"
                        disabled={updatingId === p._id}
                        onClick={() => handleIssueAction(p, "deactivate")}
                      >
                        {updatingId === p._id ? (
                          <FontAwesomeIcon icon={faCircleNotch} spin />
                        ) : (
                          <FontAwesomeIcon icon={faBan} />
                        )}
                        <span>Isključi iz sistema</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-full btn-action-activate-full"
                        disabled={updatingId === p._id}
                        onClick={() => handleIssueAction(p, "resolve")}
                      >
                        {updatingId === p._id ? (
                          <FontAwesomeIcon icon={faCircleNotch} spin />
                        ) : (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        )}
                        <span>Označi kao rešeno</span>
                      </button>
                    </div>
                  )}

                  {p.resolutionNote && (
                    <div className="problem-resolution-note">
                      <strong>Napomena administratora:</strong>
                      <div>{p.resolutionNote}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPhoto(null)}
          style={{ cursor: "pointer" }}
        >
          <div
            className="problem-photo-lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="problem-photo-lightbox-close"
              onClick={() => setSelectedPhoto(null)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img
              src={selectedPhoto}
              alt="Uvećana fotografija"
              className="problem-photo-lightbox-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}

