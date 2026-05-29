// services/iaService.js
// IA BloodLink — Matching intelligent + Chatbot
// Utilise Groq API (gratuit) avec le modele llama-3.3-70b-versatile

const Groq = require("groq-sdk");
const { supabaseAdmin } = require("../config/supabase");

// Initialisation du client Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Modele utilise — llama-3.3-70b-versatile : tres capable, gratuit, comprend le francais
const MODELE = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────────────────────────────────────
//  FONCTION UTILITAIRE — appel Groq avec gestion d'erreur
// ─────────────────────────────────────────────────────────────────────────────
async function appelGroq(systemPrompt, userMessage, maxTokens = 1500) {
  const response = await groq.chat.completions.create({
    model: MODELE,
    max_tokens: maxTokens,
    temperature: 0.3, // Basse temperature = reponses plus coherentes et precises
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage  }
    ]
  });
  return response.choices[0].message.content.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  MATCHING IA — Score 0-100 et explication pour chaque donneur compatible
// ─────────────────────────────────────────────────────────────────────────────
async function matchingIA(demande) {
  const debut = Date.now();

  try {
    // 1. Recuperer les donneurs potentiellement compatibles depuis Supabase
    const { data: donneurs, error } = await supabaseAdmin
      .from("donneurs")
      .select("id, prenom, nom, telephone, groupe_sanguin, commune, quartier, disponibilite, nb_dons, dernier_don")
      .eq("groupe_sanguin", demande.groupe_sanguin)
      .eq("disponibilite", true)
      .neq("statut", "suspendu");

    if (error) throw error;

    if (!donneurs || donneurs.length === 0) {
      return {
        donneurs: [],
        ia_analyse: "Aucun donneur compatible et disponible n'a ete trouve pour ce groupe sanguin a Conakry.",
        total: 0
      };
    }

    // 2. Construire le prompt pour Groq
    const systemPrompt = `Tu es le systeme de matching intelligent de BloodLink, une plateforme medicale de don de sang a Conakry, Guinee.
Tu analyses des demandes urgentes de sang et tu evalues la compatibilite de chaque donneur.
Tu reponds UNIQUEMENT en JSON valide, sans aucun texte avant ou apres le JSON.
Tu ecris en francais.`;

    const userMessage = `DEMANDE URGENTE DE SANG :
- Groupe sanguin requis : ${demande.groupe_sanguin}
- Quantite : ${demande.quantite} poche(s)
- Commune : ${demande.commune}
- Niveau d'urgence : ${demande.urgence}
- Date limite : ${demande.date_limite}
- Notes medicales : ${demande.notes || "Aucune"}

DONNEURS DISPONIBLES (groupe sanguin deja filtre = ${demande.groupe_sanguin}) :
${JSON.stringify(donneurs.map(d => ({
  id: d.id,
  nom: d.prenom + " " + d.nom,
  commune: d.commune,
  quartier: d.quartier || "Non precise",
  nb_dons_anterieurs: d.nb_dons || 0,
  dernier_don: d.dernier_don || "Jamais donne"
})), null, 2)}

CRITERES DE SCORING (total = 100 points) :
- Proximite geographique (40 pts) : meme commune = 40 pts, commune adjacente = 20 pts, autre commune = 5 pts
- Experience en dons (30 pts) : 5+ dons = 30 pts, 3-4 dons = 20 pts, 1-2 dons = 10 pts, 0 don = 5 pts
- Delai depuis dernier don (30 pts) : plus de 56 jours ou jamais donne = 30 pts, moins de 56 jours = 0 pts

Reponds avec ce JSON exact :
{
  "donneurs": [
    {
      "id": "uuid-exact-du-donneur",
      "score": 85,
      "explication": "Une phrase expliquant le score de ce donneur"
    }
  ],
  "analyse_globale": "2-3 phrases analysant la situation pour le responsable medical."
}`;

    // 3. Appel Groq
    const rawText = await appelGroq(systemPrompt, userMessage, 2000);

    // 4. Parser le JSON (robuste meme si Groq ajoute du texte autour)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Reponse IA non parseable : " + rawText.substring(0, 200));

    const iaResult = JSON.parse(jsonMatch[0]);

    // 5. Fusionner scores IA avec donnees donneurs et trier par score
    const donneursAvecScores = donneurs
      .map(d => {
        const iaData = iaResult.donneurs.find(x => x.id === d.id);
        return {
          ...d,
          ia_score:       iaData ? iaData.score        : 0,
          ia_explication: iaData ? iaData.explication  : "Non evalue"
        };
      })
      .sort((a, b) => b.ia_score - a.ia_score);

    // 6. Sauvegarder dans ia_historique pour le rapport
    try {
      await supabaseAdmin.from("ia_historique").insert({
        type:         "matching",
        input_data:   { demande_id: demande.id, nb_donneurs: donneurs.length, groupe: demande.groupe_sanguin },
        output_data:  { nb_scores: iaResult.donneurs.length, analyse: iaResult.analyse_globale },
        tokens_used:  null,
        duree_ms:     Date.now() - debut
      });
    } catch(histErr) { console.error("historique erreur:", histErr.message); }

    return {
      donneurs:   donneursAvecScores,
      ia_analyse: iaResult.analyse_globale,
      total:      donneursAvecScores.length
    };

  } catch (err) {
    console.error("matchingIA erreur:", err.message);

    // FALLBACK — si l'IA echoue, on fait un tri simple par commune + nb_dons
    const { data: donneursFallback } = await supabaseAdmin
      .from("donneurs")
      .select("id, prenom, nom, telephone, groupe_sanguin, commune, quartier, disponibilite, nb_dons")
      .eq("groupe_sanguin", demande.groupe_sanguin)
      .eq("disponibilite", true);

    const fallback = (donneursFallback || [])
      .map(d => ({
        ...d,
        ia_score: (d.commune === demande.commune ? 50 : 10) + Math.min((d.nb_dons || 0) * 5, 30),
        ia_explication: "Score calcule automatiquement (IA temporairement indisponible)"
      }))
      .sort((a, b) => b.ia_score - a.ia_score);

    return {
      donneurs:   fallback,
      ia_analyse: "Matching automatique utilise (IA momentanement indisponible). Resultats bases sur la localisation et l'experience.",
      total:      fallback.length
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHATBOT IA — Assistant pour donneurs et structures de sante
// ─────────────────────────────────────────────────────────────────────────────
async function chatbotIA(message, role, userContext = {}, historique = []) {
  const debut = Date.now();

  const systemPrompts = {
    donneur: `Tu es l'assistant virtuel de BloodLink, plateforme officielle de don de sang du CNTS (Centre National de Transfusion Sanguine) de Conakry, Guinée.
Tu aides exclusivement les donneurs de sang bénévoles inscrits sur la plateforme.
Tu réponds UNIQUEMENT en français, de façon claire et rassurante, en 2-4 phrases maximum.
Tu ne réponds qu'aux sujets liés au don de sang, à la santé du donneur, et à l'utilisation de BloodLink.

CONTEXTE DU DONNEUR CONNECTÉ :
- Groupe sanguin : ${userContext.groupe_sanguin || 'non renseigné'}
- Commune : ${userContext.commune || 'non renseignée'}

RÈGLES MÉDICALES QUE TU CONNAIS :
- Délai minimum entre deux dons : 56 jours (8 semaines)
- Âge requis : 18 à 65 ans, poids minimum 50 kg
- Ne pas donner si : fièvre, rhume, sous antibiotiques, grossesse, tension artérielle anormale
- Après un don : boire beaucoup d'eau, éviter l'alcool 24h, pas de sport intense le jour même
- O- = donneur universel, AB+ = receveur universel

FONCTIONNALITÉS BLOODLINK QUE TU PEUX EXPLIQUER :
- Voir les demandes de sang compatibles dans "Convocations"
- Répondre à une convocation du CNTS
- Mettre à jour sa disponibilité dans le profil
- Contacter le CNTS via la messagerie

IMPORTANT : Pour toute urgence médicale, oriente vers le CNTS de Conakry ou un médecin. Ne pose jamais de diagnostic.
Si la question n'est pas liée au don de sang ou à BloodLink, réponds poliment que tu ne peux aider que sur ces sujets.`,

    structure: `Tu es l'assistant virtuel de BloodLink pour les structures de santé partenaires du CNTS de Conakry, Guinée.
Tu aides les responsables médicaux à utiliser la plateforme BloodLink.
Tu réponds UNIQUEMENT en français, de façon professionnelle et concise, en 2-4 phrases maximum.
Tu ne réponds qu'aux sujets liés à la gestion des demandes de sang et à l'utilisation de BloodLink.

FONCTIONNALITÉS QUE TU PEUX EXPLIQUER :
- Créer une demande de sang urgente (groupe, quantité, commune, urgence, date limite)
- Suivre le statut de ses demandes (ouverte → clôturée)
- Voir les donneurs disponibles filtrés par groupe sanguin
- Contacter le CNTS via la messagerie
- Voir le matching IA des donneurs compatibles pour une demande

Si la question n'est pas liée à BloodLink ou aux demandes de sang, réponds poliment que tu ne peux aider que sur ces sujets.`,

    admin: `Tu es l'assistant de l'administrateur du CNTS sur BloodLink.
Tu réponds en français, de façon concise et professionnelle, en 2-4 phrases maximum.
Tu aides sur : validation des donneurs/structures, gestion du stock sanguin, convocations, messagerie, statistiques du dashboard.
Si la question sort du cadre de BloodLink, réponds poliment que tu ne peux aider que sur ces sujets.`
  };

  const systemPrompt = systemPrompts[role] || systemPrompts.donneur;

  // Construire l'historique de conversation pour Groq
  const messagesGroq = [
    { role: 'system', content: systemPrompt },
    // Inclure les N derniers échanges pour le contexte (max 6 pour limiter les tokens)
    ...historique.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    })),
    { role: 'user', content: message }
  ];

  try {
    const response = await groq.chat.completions.create({
      model: MODELE,
      max_tokens: 600,
      temperature: 0.4,
      messages: messagesGroq
    });
    const reponse = response.choices[0].message.content.trim();

    try {
      await supabaseAdmin.from('ia_historique').insert({
        type: 'chatbot',
        input_data: { role, message: message.substring(0, 300) },
        output_data: { reponse: reponse.substring(0, 500) },
        duree_ms: Date.now() - debut
      });
    } catch { /* silencieux */ }

    return { success: true, reponse };

  } catch (err) {
    console.error('chatbotIA erreur:', err.message);
    return {
      success: false,
      reponse: "L'assistant est momentanément indisponible. Contactez directement le CNTS de Conakry pour toute urgence."
    };
  }
}

module.exports = { matchingIA, chatbotIA };
