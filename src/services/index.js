import apiClient from './apiClient'

export const AuthService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (data) => {
    const payload = {
      type: data.role,
      email: data.email,
      password: data.password,
      telephone: data.phone,
      commune: data.commune,
      structure_type: data.structureType
    }

    if (data.role === 'structure') {
      payload.nom = data.structureName
      payload.responsable = data.responsable
    } else {
      payload.prenom = data.firstName
      payload.nom = data.lastName
      payload.groupe_sanguin = data.bloodType
      payload.sexe = data.sexe
    }

    if (data.quartier) payload.quartier = data.quartier

    return apiClient.post('/auth/register', payload)
  },
  
  logout: () => apiClient.post('/auth/logout')
}

export const DemandService = {
  getAll: (filters) =>
    apiClient.get('/demandes', { params: filters }),
  
  getById: (id) =>
    apiClient.get(`/demandes/${id}`),
  
  create: (data) =>
    apiClient.post('/demandes', data),
  
  update: (id, data) =>
    apiClient.put(`/demandes/${id}`, data),
  
  delete: (id) =>
    apiClient.delete(`/demandes/${id}`)
}

export const DonneurService = {
  getProfile: () =>
    apiClient.get('/donneur/profile'),
  
  updateProfile: (data) =>
    apiClient.put('/donneur/profil', data),

  // Convocations CNTS (remplace les demandes)
  getConvocations: () =>
    apiClient.get('/stock/convocations'),

  repondreConvocation: (id, statut) =>
    apiClient.put(`/stock/convocations/${id}`, { statut })
}

export const StructureService = {
  getProfile: () =>
    apiClient.get('/structure/profile'),
  
  updateProfile: (data) =>
    apiClient.put('/structure/profile', data),
  
  getDemands: () =>
    apiClient.get('/structure/demandes'),
  
  createDemand: (data) =>
    apiClient.post('/structure/demandes', data),
  
  closeDemand: (id) =>
    apiClient.put(`/structure/demandes/${id}/cloturer`)
}

export const AdminService = {
  getStats: () =>
    apiClient.get('/admin/dashboard'),

  getUsers: () =>
    apiClient.get('/admin/donneurs'),

  getStructures: (statut) =>
    apiClient.get('/admin/structures', { params: statut ? { statut } : {} }),

  validerStructure: (id, decision, motif_refus) =>
    apiClient.put(`/admin/structures/${id}/valider`, { decision, motif_refus }),

  blockUser: (userId) =>
    apiClient.post(`/admin/users/${userId}/block`),

  unblockUser: (userId) =>
    apiClient.post(`/admin/users/${userId}/unblock`)
}

export const IAService = {
  chat: (message, historique = []) =>
    apiClient.post('/ia/chatbot', { message, historique })
}

export const NotificationService = {
  getAll: () => apiClient.get('/donneur/notifications'),
  marquerLues: () => apiClient.put('/donneur/notifications/lues'),
  getStructureNotifications: () => apiClient.get('/structure/notifications'),
  marquerStructureLues: () => apiClient.put('/structure/notifications/lues')
}

// Messagerie CNTS uniquement (admin↔donneur, admin↔structure)
export const MessageService = {
  // Envoyer un message au CNTS ou depuis le CNTS
  sendMessage: (data) => apiClient.post('/messages', data),

  // Récupérer les messages d'une conversation avec un interlocuteur
  getMessages: (interlocuteurId) => apiClient.get(`/messages/${interlocuteurId}`),

  // Liste des conversations
  getConversations: () => apiClient.get('/messages/conversations'),

  // CNTS broadcast à tous les donneurs d'un groupe sanguin
  broadcast: (groupe_sanguin, contenu) =>
    apiClient.post('/messages/broadcast', { groupe_sanguin, contenu })
}
