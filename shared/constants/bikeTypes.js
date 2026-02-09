/**
 * Tipovi bicikala - univerzalne konstante za web i mobilnu aplikaciju
 */

export const BIKE_TYPES = {
  gradski: {
    value: "gradski",
    label: "Gradski",
    color: "#4CAF50", // primary green
    bgColor: "#e8f5e9",
  },
  planinski: {
    value: "planinski",
    label: "Planinski",
    color: "#8b4513", // saddle brown
    bgColor: "#f4e4d7",
  },
  bmx: {
    value: "bmx",
    label: "BMX",
    color: "#ff5722", // deep orange
    bgColor: "#ffe0d6",
  },
  elektricni: {
    value: "elektricni",
    label: "Električni",
    color: "#2196f3", // blue
    bgColor: "#e3f2fd",
  },
  hibridni: {
    value: "hibridni",
    label: "Hibridni",
    color: "#9c27b0", // purple
    bgColor: "#f3e5f5",
  },
  cargo: {
    value: "cargo",
    label: "Cargo",
    color: "#607d8b", // blue grey
    bgColor: "#eceff1",
  },
};

/**
 * Vraća tip bicikla po vrednosti
 */
export function getBikeType(type) {
  return BIKE_TYPES[type] || {
    value: type,
    label: type,
    color: "#757575",
    bgColor: "#f5f5f5",
  };
}

/**
 * Vraća label za tip bicikla
 */
export function getBikeTypeLabel(type) {
  return getBikeType(type).label;
}

/**
 * Vraća listu svih tipova kao array
 */
export function getBikeTypeOptions() {
  return Object.values(BIKE_TYPES);
}

/**
 * Default tip bicikla
 */
export const DEFAULT_BIKE_TYPE = "gradski";
