import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Configuration ─────────────────────────────────────────────────────────────
// Physical device (Expo Go) — your laptop's WiFi IP
export const API_BASE_URL = 'http://172.16.85.106:5000';
// Android emulator: use 'http://10.0.2.2:5000' instead

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor: attach token ─────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh token on 401 ─────────────────────────
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
        return Promise.reject(error);
      }
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/api/v1/auth/refresh-token`, { refreshToken })
            .then(async (r) => {
              const { accessToken } = r.data;
              await SecureStore.setItemAsync('accessToken', accessToken);
              refreshPromise = null;
              return accessToken;
            });
        }
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (e) {
        refreshPromise = null;
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data, file) => {
    const formData = new FormData();
    Object.keys(data).forEach((k) => formData.append(k, data[k]));
    if (file) formData.append('idProof', { uri: file.uri, name: file.name || 'id.jpg', type: file.type || 'image/jpeg' });
    return api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

// ── User ───────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/update', data),
  updateLocation: (data) => api.put('/users/update-location', data),
  updateFarmInfo: (data) => api.put('/users/update-farm-info', data),
  changePassword: (data) => api.put('/users/change-password', data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', { uri: file.uri, name: 'photo.jpg', type: 'image/jpeg' });
    return api.post('/users/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePhoto: () => api.delete('/users/delete-photo'),
};

// ── Crops ──────────────────────────────────────────────────────────────────────
export const cropAPI = {
  getCrops: () => api.get('/crops'),
  addCrop: (data) => api.post('/crops', data),
  deleteCrop: (id) => api.delete(`/crops/${id}`),
  getCropsByFarmer: (farmerId) => api.get(`/crops/farmer/${farmerId}`),
};

// ── Disease Reports ────────────────────────────────────────────────────────────
export const diseaseReportAPI = {
  getReports: () => api.get('/disease-reports'),
  createReport: (data, files) => {
    const formData = new FormData();
    Object.keys(data).forEach((k) => formData.append(k, data[k]));
    files.forEach((f) => formData.append('images', { uri: f.uri, name: f.name || 'crop.jpg', type: f.type || 'image/jpeg' }));
    return api.post('/disease-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  detectDisease: (cropName, file) => {
    const formData = new FormData();
    formData.append('cropName', cropName);
    formData.append('file', { uri: file.uri, name: file.name || 'crop.jpg', type: file.type || 'image/jpeg' });
    return api.post('/disease-reports/detect', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  identifyCrop: (file) => {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: 'crop.jpg', type: 'image/jpeg' });
    return api.post('/disease-reports/identify-crop', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  markTreated: (id) => api.put(`/disease-reports/${id}/mark-treated`),
  deleteReport: (id) => api.delete(`/disease-reports/${id}`),
};

// ── Agronomist ─────────────────────────────────────────────────────────────────
export const agronomistAPI = {
  getProfile: () => api.get('/agronomists/me'),
  updateProfile: (data) => api.put('/agronomists/me', data),
  verifyAgronomist: (id, status = 'verified') => api.put(`/agronomists/${id}/verify`, { status }),
  findLocalExperts: () => api.get('/agronomists/local'),
  findLocalFarmers: () => api.get('/agronomists/farmers'),
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  // Users / Approval
  getStats: () => api.get('/admin/stats'),
  getPendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.delete(`/admin/users/${id}`),
  // Farmers
  getAllFarmers: () => api.get('/admin/farmers'),
  listFarmers: () => api.get('/admin/farmers'),
  deleteFarmer: (id) => api.delete(`/admin/farmers/${id}`),
  // Agronomists
  getAllAgronomists: () => api.get('/admin/agronomists'),
  listAgronomists: () => api.get('/admin/agronomists'),
  deleteAgronomist: (id) => api.delete(`/admin/agronomists/${id}`),
  // Seeds
  getAllSeeds: () => api.get('/admin/seeds'),
  listSeeds: () => api.get('/admin/seeds'),
  addSeed: (data) => api.post('/admin/seeds', data),
  updateSeed: (id, data) => api.patch(`/admin/seeds/${id}`, data),
  deleteSeed: (id) => api.delete(`/admin/seeds/${id}`),
  // Fertilizers
  getAllFertilizers: () => api.get('/admin/fertilizers'),
  listFertilizers: () => api.get('/admin/fertilizers'),
  addFertilizer: (data) => api.post('/admin/fertilizers', data),
  updateFertilizer: (id, data) => api.patch(`/admin/fertilizers/${id}`, data),
  deleteFertilizer: (id) => api.delete(`/admin/fertilizers/${id}`),
  // Facilities
  getAllFacilities: () => api.get('/admin/facilities'),
  listFacilities: () => api.get('/admin/facilities'),
  addFacility: (data) => api.post('/admin/facilities', data),
  updateFacility: (id, data) => api.patch(`/admin/facilities/${id}`, data),
  deleteFacility: (id) => api.delete(`/admin/facilities/${id}`),
  // Alerts
  getOutbreakAlerts: () => api.get('/admin/outbreak-alerts'),
};

// ── Weather ────────────────────────────────────────────────────────────────────
export const weatherAPI = {
  getWeather: () => api.get('/weather'),
};

// ── Market ─────────────────────────────────────────────────────────────────────
export const marketAPI = {
  searchPrices: (params) => api.get('/market/search', { params }),
  getLatestPrices: (commodity, state) => api.get('/market/latest', { params: { commodity, state } }),
  getPriceHistory: (commodity, params) => api.get(`/market/history/${encodeURIComponent(commodity)}`, { params }),
  getPricePrediction: (commodity, district) => api.get(`/market/predict/${encodeURIComponent(commodity)}`, { params: { district } }),
  getMyCropPrices: () => api.get('/market/my-crops'),
  getFilters: () => api.get('/market/filters'),
  getStats: () => api.get('/market/stats'),
  triggerScrape: () => api.post('/market/scrape'),
};

// ── AI / Gemini ────────────────────────────────────────────────────────────────
export const geminiAPI = {
  getCropDiseaseInfo: (cropName, diseaseName, language = 'en') =>
    api.post('/disease-info/crop-info', { cropName, diseaseName, language }),
  chat: (messages, context = '', language = 'en') =>
    api.post('/disease-info/chat', { messages, context, language }),
  getCropManagementInfo: (cropName, area, areaUnit = 'acres', language = 'en') =>
    api.post('/disease-info/crop-management', { cropName, area, areaUnit, language }),
  getWeatherCropImpact: (cropName, currentWeather, dailyForecast, language = 'en') =>
    api.post('/disease-info/weather-crop-impact', { cropName, currentWeather, dailyForecast, language }),
  getSeedAdvice: (farmInfo, language = 'en') =>
    api.post('/disease-info/seed-advice', { farmInfo, language }),
};

// ── Supply Chain ───────────────────────────────────────────────────────────────
export const supplyChainAPI = {
  createListing: (data) => api.post('/supply-chain/listings', data),
  getNearbyListings: (lat, lon, distance) =>
    api.get('/supply-chain/listings/nearby', { params: { latitude: lat, longitude: lon, distance } }),
  deleteListing: (id) => api.delete(`/supply-chain/listings/${id}`),
  sendRequest: (data) => api.post('/supply-chain/collaboration/request', data),
  updateRequestStatus: (data) => api.patch('/supply-chain/collaboration/status', data),
  getMyCollaborations: () => api.get('/supply-chain/collaboration/my-stats'),
  getConnectedListings: () => api.get('/supply-chain/collaboration/connected-listings'),
};

// ── Schemes ────────────────────────────────────────────────────────────────────
export const schemeAPI = {
  getRecommendations: (lang) => api.get('/schemes/recommendations', { params: { lang } }),
};

// ── Expert Chat ────────────────────────────────────────────────────────────────
export const expertChatAPI = {
  initChat: (otherUserId, category = 'expert') => api.post('/expert-chat/init', { otherUserId, category }),
  getMyChats: (category) => api.get('/expert-chat/my-chats', { params: { category } }),
  getChatHistory: (chatId) => api.get(`/expert-chat/${chatId}`),
  sendMessage: (chatId, text) => api.post(`/expert-chat/${chatId}/message`, { text }),
};

// ── Equipment ──────────────────────────────────────────────────────────────────
export const equipmentAPI = {
  getNearby: (radius = 50, type = '') => api.get('/equipment/nearby', { params: { radius, type } }),
  getMyListings: () => api.get('/equipment/my-listings'),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.patch(`/equipment/${id}`, data),
};

// ── ML Server ──────────────────────────────────────────────────────────────────
export const mlServerAPI = {
  getStatus: () => api.get('/ml-server/status'),
};

export default api;
