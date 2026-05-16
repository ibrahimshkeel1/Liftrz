import { clearSession, getSession } from './session';

const API_URL = '/api';

async function request(path: string, options: RequestInit = {}) {
  const session = getSession();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
    }
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getSettings: () => request('/settings'),
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  validateReferral: (code: string) => request(`/auth/referral/${code}`),

  getTrainers: (includePending = false) => request(`/trainers${includePending ? '?includePending=true' : ''}`),
  getFeaturedTrainers: () => request('/featured-trainers'),
  getTrainer: (id: string) => request(`/trainers/${id}`),
  createTrainer: (data: any) => request('/trainers', { method: 'POST', body: JSON.stringify(data) }),
  updateTrainerProfile: (id: string, data: any) => request(`/trainers/${id}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  requestFeaturedPlacement: (id: string, data: any) => request(`/trainers/${id}/featured-request`, { method: 'POST', body: JSON.stringify(data) }),
  updateTrainerStatus: (id: string, data: any) => request(`/admin/trainers/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateTrainerCommission: (id: string, data: any) => request(`/admin/trainers/${id}/commission`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateTrainerFeatured: (id: string, data: any) => request(`/admin/trainers/${id}/featured`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTrainerStats: (id: string) => request(`/trainers/${id}/stats`),

  getReviews: (trainerId: string) => request(`/trainers/${trainerId}/reviews`),
  createReview: (data: any) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  getProtocols: (trainerId: string) => request(`/trainers/${trainerId}/protocols`),
  createProtocol: (data: any) => request('/protocols', { method: 'POST', body: JSON.stringify(data) }),
  deleteProtocol: (id: string) => request(`/protocols/${id}`, { method: 'DELETE' }),

  getLeads: (trainerId: string) => request(`/trainers/${trainerId}/leads`),
  getAllLeads: () => request('/leads'),
  createLead: (data: any) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  createMatchRequest: (data: any) => request('/match-requests', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadStatus: (id: string, data: any) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  trackEvent: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  createContactMessage: (data: any) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),

  uploadFile: (data: any) => request('/uploads', { method: 'POST', body: JSON.stringify(data) }),

  createBooking: (data: any) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: () => request('/bookings'),
  getBookingMessages: (id: string) => request(`/bookings/${id}/messages`),
  sendBookingMessage: (id: string, data: any) => request(`/bookings/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getTrainerBookings: (trainerId: string) => request(`/trainer/${trainerId}/bookings`),
  getTrainerPayouts: (trainerId: string) => request(`/trainer/${trainerId}/payouts`),
  getClientBookings: (clientId: string) => request(`/client/${clientId}/bookings`),
  getClientProgress: (clientId: string) => request(`/client/${clientId}/progress`),
  addProgressEntry: (clientId: string, data: any) => request(`/client/${clientId}/progress`, { method: 'POST', body: JSON.stringify(data) }),

  requestPasswordReset: (data: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  confirmPasswordReset: (token: string, data: any) => request(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify(data) }),

  getAdminStats: () => request('/admin/stats'),
  getAdminNotifications: () => request('/admin/notifications'),
  getAdminChats: () => request('/admin/chats'),
  getAdminTrainers: () => request('/admin/trainers'),
  updateTrainerProfileReview: (id: string, data: any) => request(`/admin/trainers/${id}/profile-review`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminProtocols: () => request('/admin/protocols'),
  updateAdminProtocol: (id: string, data: any) => request(`/admin/protocols/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminPayments: () => request('/admin/payments'),
  verifyPayment: (id: string, data: any = { status: 'verified' }) => request(`/admin/payments/${id}/verify`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminPayouts: () => request('/admin/payouts'),
  updatePayout: (id: string, data: any) => request(`/admin/payouts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminDisputes: () => request('/admin/disputes'),
  updateDispute: (id: string, data: any) => request(`/admin/disputes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
};
