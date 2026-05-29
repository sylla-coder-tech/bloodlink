// routes/admin.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware, requireRole('admin'));

router.get('/dashboard',              ctrl.getDashboard);
router.get('/structures',             ctrl.listerStructures);
router.put('/structures/:id/valider', ctrl.validerStructure);
router.get('/donneurs',               ctrl.listerDonneurs);
router.put('/donneurs/:id/statut',    ctrl.changerStatutDonneur);
router.get('/demandes',               ctrl.listerToutesDemandes);

module.exports = router;
