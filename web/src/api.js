const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function getAdminToken() {
  return localStorage.getItem("bikely_admin_token");
}

export function setAdminToken(token) {
  if (!token) {
    localStorage.removeItem("bikely_admin_token");
  } else {
    localStorage.setItem("bikely_admin_token", token);
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMessage = data?.error || data?.message || "Network error";
    throw new Error(errorMessage);
  }

  return data;
}

export function adminLogin(email, password) {
  return request("/api/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// Admin problem reports
export function fetchAdminIssues({ status } = {}) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/api/admin/issues${query}`, { auth: true });
}

export function fetchAdminUnresolvedIssueCount() {
  return request("/api/admin/issues/unresolved-count", { auth: true });
}

export function updateAdminIssueStatus(id, action, resolutionNote) {
  return request(`/api/admin/issues/${id}/status`, {
    method: "PUT",
    body: { action, resolutionNote },
    auth: true,
  });
}

export function fetchBikes() {
  return request("/api/admin/bikes", { auth: true });
}

export function createBike(payload) {
  return request("/api/admin/bikes", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function updateBike(id, payload) {
  return request(`/api/admin/bikes/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function softDeleteBike(id) {
  return request(`/api/admin/bikes/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// Parking spots (admin)
export function fetchParkingSpots() {
  return request("/api/admin/parking", { auth: true });
}

export function createParkingSpot(payload) {
  return request("/api/admin/parking", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function deleteParkingSpot(id) {
  return request(`/api/admin/parking/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// Admin rentals
export function fetchAdminRentals() {
  return request("/api/admin/rentals", { auth: true });
}

export function fetchAdminRentalDetails(id) {
  return request(`/api/admin/rentals/${id}`, { auth: true });
}

// Admin dashboard statistics
export function fetchAdminStats(monthOffset = 0) {
  const query = monthOffset ? `?monthOffset=${monthOffset}` : "";
  return request(`/api/admin/stats${query}`, { auth: true });
}

