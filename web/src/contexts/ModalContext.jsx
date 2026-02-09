import { createContext, useContext, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setModal({
        message,
        title: options.title || "Potvrda",
        confirmText: options.confirmText || "Potvrdi",
        cancelText: options.cancelText || "Otkaži",
        confirmColor: options.confirmColor || "primary",
        cancelColor: options.cancelColor || "cancel",
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          confirmColor={modal.confirmColor}
          cancelColor={modal.cancelColor}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
