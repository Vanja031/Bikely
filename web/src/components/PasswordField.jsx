import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export function PasswordField({
  id = "password",
  label = "Lozinka",
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="form-input-wrapper">
        <span className="form-input-icon">
          <FontAwesomeIcon icon={faLock} />
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="form-input form-input-with-toggle"
          style={{ paddingLeft: "44px" }}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="form-input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sakrij lozinku" : "Prikaži lozinku"}
        >
          <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
        </button>
      </div>
    </div>
  );
}

