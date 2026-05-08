const API = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('solpay_token');
}

export function setToken(t) {
  if (t) localStorage.setItem('solpay_token', t);
  else localStorage.removeItem('solpay_token');
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  resolveUser: (username) =>
    request(`/api/users/resolve?username=${encodeURIComponent(username)}`),
  searchUsers: (query) => request(`/api/users/search?q=${encodeURIComponent(query)}`),
  userProfile: (id) => request(`/api/users/${encodeURIComponent(id)}`),
  updateUserProfile: (id, body) =>
    request(`/api/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  contacts: () => request('/api/contacts'),
  myTransfers: () => request('/api/transfers/mine'),
  transfersWith: (userId) => request(`/api/transfers/with/${userId}`),
  recordTransfer: (body) => request('/api/transfers', { method: 'POST', body: JSON.stringify(body) }),
  messagesWith: (userId) => request(`/api/messages/with/${userId}`),
  sendMessage: (body) => request('/api/messages', { method: 'POST', body: JSON.stringify(body) }),
  balances: (address) => request(`/api/wallet/balances/${encodeURIComponent(address)}`),
  walletLookup: (address) => request(`/api/wallet/lookup/${encodeURIComponent(address)}`),
  cloakConfig: () => request('/api/wallet/cloak-config'),
};
