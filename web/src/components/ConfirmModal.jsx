import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";
import "../App.css";

export function ConfirmModal({
  title,
  message,
  confirmText = "Potvrdi",
  cancelText = "Otkaži",
  confirmColor = "primary",
  cancelColor = "cancel",
  onConfirm,
  onCancel,
}) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Ne zatvaraj modal ako se klikne na backdrop
      return;
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-modal">
        <button className="confirm-modal-close" onClick={onCancel}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon">
            <FontAwesomeIcon icon={faCircleQuestion} />
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button
            className={`btn-confirm btn-confirm-${cancelColor}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-confirm btn-confirm-${confirmColor}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
