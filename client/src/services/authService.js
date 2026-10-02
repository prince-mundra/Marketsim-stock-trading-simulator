import api, { getApi } from './api.js';

export const authService = {
  async register(payload) {
    return (await api.post('/auth/register', payload)).data.user;
  },
  async login(payload) {
    return (await api.post('/auth/login', payload)).data.user;
  },
  async me() {
    return (await getApi('/auth/me')).data.user;
  },
  async logout() {
    return (await api.post('/auth/logout')).data;
  },
};
