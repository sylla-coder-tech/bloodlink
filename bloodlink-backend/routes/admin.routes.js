const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  getDashboard, getStructures, validerStructure, getDonneurs, getAllDemandes, getReports,
  getAdminProfile, changePassword, validerDonneur, getAuditLogs, updateDemandeStatut, getConvocations, validerDon
} = require('../controllers/adminController');

router.use(authMiddleware, requireRole('admin'));

router.get('/dashboard',                    getDashboard);
router.get('/structures',                   getStructures);
router.put('/structures/:id/valider',       validerStructure);
router.get('/donneurs',                     getDonneurs);
router.put('/donneurs/:id/valider',         validerDonneur);
router.get('/demandes',                     getAllDemandes);
router.put('/demandes/:id/statut',          updateDemandeStatut);
router.get('/reports',                      getReports);
router.get('/audit',                        getAuditLogs);
router.get('/convocations',                 getConvocations);
router.post('/convocations/:id/valider-don', validerDon);
router.get('/me',                           getAdminProfile);
router.put('/password',                     changePassword);

module.exports = router;
