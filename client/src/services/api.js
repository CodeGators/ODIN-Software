import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // URL do seu servidor back-end
});

export const getCollections = () => {
  return apiClient.get('/collections');
};

export const searchStac = (payload) => {
  return apiClient.post('/stac-search', payload);
};

export const getItemDetails = (collection, itemId) => {
  return apiClient.get(`/stac-item-details?collection=${collection}&itemId=${itemId}`);
};

// FUNÇÃO ADICIONADA
export const getTimeseries = (params) => {
  // params: { coverage, latitude, longitude, attributes, startDate, endDate }
  return apiClient.get('/wtss-timeseries', { params });
};