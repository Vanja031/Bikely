/**
 * Statusi bicikala - univerzalne konstante za web i mobilnu aplikaciju
 */

export const BIKE_STATUSES = {
  available: {
    value: "available",
    label: "Dostupan",
    labelShort: "Dostupan",
    color: "#4CAF50", // success green
    bgColor: "#e8f5e9",
  },
  in_use: {
    value: "in_use",
    label: "U upotrebi",
    labelShort: "U upotrebi",
    color: "#2196f3", // blue
    bgColor: "#e3f2fd",
  },
  maintenance: {
    value: "maintenance",
    label: "Servis",
    labelShort: "Servis",
    color: "#ff9800", // orange
    bgColor: "#fff3e0",
  },
  inactive: {
    value: "inactive",
    label: "Neaktivan",
    labelShort: "Neaktivan",
    color: "#757575", // grey
    bgColor: "#eeeeee",
  },
};

/**
 * Vraća status bicikla po vrednosti
 */
export function getBikeStatus(status) {
  return BIKE_STATUSES[status] || {
    value: status,
    label: status,
    labelShort: status,
    color: "#757575",
    bgColor: "#f5f5f5",
  };
}

/**
 * Vraća label za status bicikla
 */
export function getBikeStatusLabel(status) {
  return getBikeStatus(status).label;
}

/**
 * Vraća kratki label za status bicikla
 */
export function getBikeStatusLabelShort(status) {
  return getBikeStatus(status).labelShort;
}

/**
 * Vraća listu svih statusa kao array
 */
export function getBikeStatusOptions() {
  return Object.values(BIKE_STATUSES);
}

/**
 * Default status bicikla
 */
export const DEFAULT_BIKE_STATUS = "available";
