import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

export function FilterSelect({ label, value, onChange, options, getOptionStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="filter-select-wrapper" ref={dropdownRef}>
        <button
          type="button"
          className="filter-select-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className="filter-select-badge"
            style={getOptionStyle ? getOptionStyle(selectedOption) : {}}
          >
            {selectedOption.label}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`filter-select-chevron ${isOpen ? "open" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="filter-select-dropdown">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`filter-select-option ${value === option.value ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span
                  className="filter-select-badge"
                  style={getOptionStyle ? getOptionStyle(option) : {}}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
