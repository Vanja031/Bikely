import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faXmarkCircle,
  faExclamationTriangle,
  faInfoCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";

export function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return faCheckCircle;
      case "error":
        return faXmarkCircle;
      case "warning":
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-icon">
        <FontAwesomeIcon icon={getIcon()} />
      </div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
