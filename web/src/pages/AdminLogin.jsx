import { useState } from "react";
import "../App.css";
import { adminLogin, setAdminToken } from "../api";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { PasswordField } from "../components/PasswordField.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export function AdminLogin() {
  const toast = useToast();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      setAdminToken(result.token);
      toast.success("Uspešno ste se prijavili");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Greška pri prijavi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="Bikely" />
        </div>
        <h1 className="login-title">Bikely Admin</h1>
        <p className="login-subtitle">Prijavite se da upravljate biciklima, iznajmljivanjima i prijavama.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <PasswordField
            id="password"
            label="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="login-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Prijavljivanje..." : "Prijavi se"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

