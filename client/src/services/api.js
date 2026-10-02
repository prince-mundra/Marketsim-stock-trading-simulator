import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || (error.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Unable to reach the simulator. Check your connection and try again.');
    return Promise.reject(Object.assign(new Error(message), {
      status: error.response?.status,
      details: error.response?.data,
    }));
  },
);

const inFlightGets = new Map();

export function getApi(url, config = {}) {
  const params = Object.entries(config.params || {})
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right));
  const query = new URLSearchParams(params.map(([key, value]) => [key, String(value)])).toString();
  const key = `${url}${query ? `?${query}` : ''}`;
  const existing = inFlightGets.get(key);
  if (existing) return existing;

  const request = api.get(url, config);
  inFlightGets.set(key, request);
  const clear = () => {
    if (inFlightGets.get(key) === request) inFlightGets.delete(key);
  };
  request.then(clear, clear);
  return request;
}

export default api;
