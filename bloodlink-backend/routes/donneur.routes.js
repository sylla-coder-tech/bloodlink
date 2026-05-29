const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, requireDonneurValide } = require('../middleware/auth');
const {
  getProfile, getDemandesCompatibles, updateDisponibilite,
  updateProfil, getMesReponses, getNotifications, marquerNotificationsLues
} = require('../controllers/donneurController');
const { repondreDemande } = require('../controllers/demandeController');

router.use(authMiddleware, requireRole('donneur'));

// Routes accessibles même sans validation (profil, notifications)
router.get('/profile',                     getProfile);
router.get('/notifications',               getNotifications);
router.put('/notifications/lues',          marquerNotificationsLues);
router.put('/profil',                      updateProfil);

// Routes bloquées si compte non validé par CNTS
router.get('/demandes',                    requireDonneurValide, getDemandesCompatibles);
router.get('/reponses',                    requireDonneurValide, getMesReponses);
router.put('/disponibilite',               requireDonneurValide, updateDisponibilite);
router.post('/demandes/:id/repondre',      requireDonneurValide, repondreDemande);

module.exports = router;
