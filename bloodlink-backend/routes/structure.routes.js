const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole, requireStructureValidee } = require('../middleware/auth');
const {
  getProfile, updateProfile, createDemande, getMesDemandes, cloturerDemande, getMatching, getDonneurs, getNotifications, marquerNotificationsLues
} = require('../controllers/demandeController');

router.use(authMiddleware, requireRole('structure'));

// Routes accessibles même sans validation
router.get('/profile',                getProfile);
router.put('/profile',                updateProfile);
router.get('/notifications',          getNotifications);
router.put('/notifications/lues',     marquerNotificationsLues);

// Routes bloquées si structure non validée
router.get('/donneurs',               requireStructureValidee, getDonneurs);
router.post('/demandes',              requireStructureValidee, createDemande);
router.get('/demandes',               requireStructureValidee, getMesDemandes);
router.get('/demandes/:id/matching',  requireStructureValidee, getMatching);
router.put('/demandes/:id/cloturer',  requireStructureValidee, cloturerDemande);

module.exports = router;
