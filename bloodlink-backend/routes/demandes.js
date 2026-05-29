// routes/demandes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/demandesController');
const { authMiddleware, requireRole, requireStructureValidee } = require('../middleware/auth');

// ── Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Lister les demandes (donneur = demandes compatibles, structure = ses demandes)
router.get('/',    ctrl.listerDemandes);

// Détail d'une demande
router.get('/:id', ctrl.detailDemande);

// Résultats du matching IA (structure seulement)
router.get('/:id/matching', requireRole('structure', 'admin'), ctrl.getMatching);

// Créer une demande (structure validée seulement)
router.post('/', requireRole('structure'), requireStructureValidee, ctrl.creerDemande);

// Changer le statut (structure ou admin)
router.put('/:id/statut', requireRole('structure', 'admin'), ctrl.changerStatut);

// Répondre à une demande (donneur seulement)
router.post('/:id/repondre', requireRole('donneur'), ctrl.repondreDemande);

module.exports = router;
