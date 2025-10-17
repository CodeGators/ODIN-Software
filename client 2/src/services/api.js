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