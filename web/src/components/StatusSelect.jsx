import { useState, useRef, useEffect } from "react";
import "../App.css";
import { getBikeStatusOptions } from "../../../shared/constants/bikeStatus.js";

export function StatusSelect({ value, onChange, required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = getBikeStatusOptions();
  const selectedOption = statusOptions.find((opt) => opt.value === value) || statusOptions[0];

  return (
    <div className="custom-select-wrapper" ref={dropdownRef}>
      <div
        className={`custom-select ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className="custom-select-badge"
          style={{
            backgroundColor: selectedOption.bgColor,
            color: selectedOption.color,
          }}
        >
          {selectedOption.label}
        </span>
        <span className="custom-select-arrow">▼</span>
      </div>
      {isOpen && (
        <div className="custom-select-dropdown">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className={`custom-select-option ${value === option.value ? "selected" : ""}`}
              onClick={() => {
                onChange({ target: { value: option.value } });
                setIsOpen(false);
              }}
            >
              <span
                className="custom-select-badge"
                style={{
                  backgroundColor: option.bgColor,
                  color: option.color,
                }}
              >
                {option.label}
              </span>
            </div>
          ))}
        </div>
      )}
      {required && !value && (
        <input
          type="text"
          required
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0 }}
          tabIndex={-1}
        />
      )}
    </div>
  );
}
