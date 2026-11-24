// ============================================================
// PATCHNOTES — à compléter à chaque nouvelle version (la plus récente EN PREMIER).
// Format : { v: 'X.Y.Z', name: 'Titre', date: 'AAAA-MM-JJ', gift: 'texte du cadeau (facultatif)',
//            sections: [ { t: 'Titre de section', items: ['**Mot clé** : texte', ...] } ] }
// `**gras**` est pris en charge. Le patchnote de PATCHNOTES[0] s'affiche une fois à chaque joueur (après connexion), puis reste consultable via Menu › Patchnote.
// Changer PATCHNOTES[0].v suffit à le réafficher à tout le monde (penser à aligner CURRENT_VERSION de script.js et CACHE_NAME de sw.js).
// ============================================================
const PATCHNOTES = [
  {
    v: '2.a3.10', name: 'La Taxe revue', date: '2026-11-25',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '⚖ Équilibrage', items: [
        '**Taxe d’adaptation** : elle ne se déclenche plus que si tu **retires vraiment** un sort. Remplir un emplacement vide ou déplacer un sort est gratuit, comme changer plus de 45 s après ton dernier effort (demi-tarif entre 15 et 45 s).',
        'Le prix dépend du **rang** des sorts changés. Tu vois ce que tu retires et ce que tu ajoutes, et tu paies en **Éther et Sagesse** ou en **attendant** (sorts actifs bloqués).'
      ] }
    ]
  },
  {
    v: '2.a3.9', name: 'Banc d’essai', date: '2026-11-25',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🛠 Coulisses', items: [
        '**Version de test** : outils de démonstration pour les examens (réservés aux essais).'
      ] }
    ]
  },
  {
    v: '2.a3.8', name: 'Le Diplôme', date: '2026-11-25',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Diplôme de l’Académie** : réussir un examen te remet un vrai diplôme (parchemin qui se déroule, confettis, sceau qui s’abat). Tu le **paraphes** à la plume, puis l’Amphithéâtre s’ouvre sur le nouveau rang. « Revoir mon diplôme » reste disponible dans l’examen validé.',
        '**Sons et vibrations** : un grondement monte quand tu scelles ta spécialité, la révélation et l’examen ont leurs sons, et le téléphone vibre (si les vibrations sont activées dans les Options).'
      ] }
    ]
  },
  {
    v: '2.a3.7', name: 'La Spécialité', date: '2026-11-25',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Spécialité d’école** : choisis une école de magie (appui maintenu pour sceller). Ses cours coûtent 25 % de moins et durent 25 % de moins, et **chacun de ses 4 sorts est renforcé** (le détail est dans l’écran de choix et dans la fiche de chaque sort). Le choix est définitif, et il devient la dernière condition de l’examen 1. Si tu as déjà réussi cet examen, l’Académie te propose de choisir à ton retour.',
        '**Dernier recours** : sous la grille de l’Amphithéâtre, tu peux remettre ton apprentissage à zéro pour changer d’école (sans remboursement ; bâtiments, Éther, Sagesse et inventaire conservés).'
      ] },
      { t: '⚖ Équilibrage', items: [
        '**Météore de l’Académie** ne se cumule plus avec lui-même (il rafraîchit sa durée).',
        '**Alchimie Mineure** et **Vision du Passé** agissent maintenant aussi hors ligne (Éther compris). **Squelette Scribe** suit tes pages/s. **Bouclier d’Éther** relève aussi la limite du Grimoire.'
      ] }
    ]
  },
  {
    v: '2.a3.6', name: 'Les Examens de l’Académie', date: '2026-11-24',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Rangs et examens** : les sorts s’ouvrent désormais par rang. Apprends les 8 sorts d’un rang, remplis les conditions, passe l’examen de l’Académie : le rang suivant s’ouvre, avec un emplacement de plus au Voile et au Grimoire. Les examens 1 à 3 sont disponibles (le 4 arrive avec les sorts de rang 5).',
        '**Nouvel Amphithéâtre** : une grille des 8 écoles par rang, des sorts « ternes » qui s’illuminent pendant leur cours, et une fenêtre d’examen avec ses conditions (touche le « i » pour comprendre chacune).',
        '**Pli de l’Académie** : un examen terminé, même pendant ton absence, t’attend à ton retour avec sa petite cérémonie.'
      ] },
      { t: '⚠ Important', items: [
        '**Apprentissage remis à zéro** : tous les sorts sont à réapprendre, avec de nouveaux prix. **Ta Sagesse, ton Éther, tes bâtiments, tes fragments et ton inventaire du Coffre sont conservés.**'
      ] }
    ]
  },
  {
    v: '2.a3.5', name: 'Le Lexique de l’Académie', date: '2026-11-24',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Lexique** : le bouton « ? » du Clicker a maintenant un onglet « Lexique » qui explique les mots du jeu (clic, impulsion, effort, Taxe, surchauffe…).',
        '**Nombres complets** : touche (ou survole) un compteur d’Éther ou de Sagesse pour voir la valeur exacte dans une bulle.'
      ] },
      { t: '🛠 Améliorations', items: [
        '**Grands nombres en français** : K (mille), M (million), Md (milliard), Bn (billion), Bi (billiard), T (trillion).',
        '**La Taxe** : l’ancienne « Adaptation en plein farm » s’appelle désormais la Taxe d’adaptation (même règle, textes plus clairs).',
        '**Vocabulaire** : « impulsion » pour les clics automatiques, « Recharge » pour le temps d’attente des sorts. Le sort « Drain d’Éther » devient **Encre Cramoisie** (il agit sur la Page Nécrotique).'
      ] }
    ]
  },
  {
    v: '2.a3.4', name: 'Le Carnet de l’Académie', date: '2026-11-24',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '📜 En coulisses', items: [
        '**Statistiques de jeu** : le Clicker note désormais, dans ton compte, tes totaux (Éther et Sagesse gagnés, clics, sorts lancés, temps de jeu), tes records et les dates de tes grandes étapes. Rien n’est affiché pour l’instant : c’est la base des futurs défis et quêtes, et de l’équilibrage des sorts.',
        '**Confidentialité** : ces données ne servent qu’au jeu, jamais à de la publicité (voir « Confidentialité & Cookies »).'
      ] }
    ]
  },
  {
    v: '2.a3.0', name: 'Confort & Fluidité', date: '2026-11-23',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Bouton retour (◁)** : sur mobile, il ferme simplement la fenêtre ouverte (inventaire, menu, decks, classement…) au lieu de quitter l’application.',
        '**Installer l’application** : une invitation après la connexion, et l’option reste dans le menu (« Installer »).',
        '**Compteurs collants** : dans le Clicker, ton Éther et ta Sagesse te suivent quand tu fais défiler la page.',
        '**Classement** : le Top 10, et un bouton pour voir tout le classement.'
      ] },
      { t: '🛠 Améliorations', items: [
        '**Effort** : chaque appui dans le Clicker (achats, sorts, decks…) compte pour tes fragments de clé, plus seulement le Voile et le Grimoire.',
        '**Moins de chauffe sur mobile** : animations allégées, plus de saccades quand on enchaîne les clics.'
      ] }
    ]
  },
  {
    v: '2.2.0', name: 'L’Éveil du Grimoire', date: '2026-11-18',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Le Clicker** (bouton ⚡ GRIMOIRE) : le Voile d’Éther et le Grimoire aux Pages Infinies. Frappe, lis, recrute des serviteurs et rends-toi à l’Amphithéâtre. Le reste, à toi de le découvrir !',
        '**Fragments de clé** : le Clicker en produit, par ton effort comme tout seul avec le temps. Ils deviennent des clés pour le Coffre, avec une animation quand la clé arrive.',
        '**Notifications** : sois prévenu quand tes clés sont rechargées ou qu’une clé est prête dans le Clicker. Activées par défaut, modifiables dans Menu › Options.',
        '**Options** (Menu) : coupe les sons et les vibrations.',
        '**Correctifs** : de nombreux bugs ont été répertoriés grâce aux alpha-testeurs. Merci à eux !',
        '**Soutien participatif** : si tu veux soutenir le projet, rends-toi sur le bouton « Soutenir le projet » ou dans le nouveau menu aux diverses fonctionnalités.',
        '**Patchnote** : retrouve les nouveautés ici à tout moment.'
      ] },
      { t: '🛠 Améliorations', items: [
        '**Recyclage plus juste** : un doublon rapporte 1 fragment (commun), 2 (peu commun), 3 (rare), 4 (très rare) ou 5 (légendaire).',
        '**Lancement plus rapide** : plus d’écran de connexion à chaque retour.',
        '**Sauvegarde améliorée** : ta collection est protégée si tu joues sur plusieurs appareils ou hors-ligne, avec des copies de secours automatiques.',
        '**Classement** plus léger et plus rapide.',
        '**Anti-autoclic** : le Voile et le Grimoire réagiront.',
        '**Visuels** : de nombreux ajouts et ajustements visuels effectués.'
      ] },
      { t: '🐛 Corrections', items: [
        'Les objets « peu commun » sont à nouveau classés comme tels.',
        'L’installation de l’appli sur l’écran d’accueil est fiabilisée.'
      ] }
    ]
  },
  {
    v: '2.0', name: 'Le Compte des Mages', date: '',
    sections: [
      { t: 'Au programme', items: [
        'Connexion avec Google : ta progression est sauvegardée en ligne et te suit sur tous tes appareils.',
        'Un pseudo public et le classement des mages 🏆.',
        'Profil, collection avec pourcentage de complétion, recyclage des doublons en fragments, code promo.',
        'Installation possible sur l’écran d’accueil.'
      ] }
    ]
  },
  {
    v: '1.0', name: 'Le Coffre', date: '',
    sections: [
      { t: 'Au programme', items: [
        'Ouvre des coffres et découvre plus de 460 objets magiques, de Commun à Artéfact.',
        'Des clés qui se rechargent avec le temps.',
        'Un inventaire pour garder ta collection.',
        'Sauvegarde locale uniquement, sur ton appareil.'
      ] }
    ]
  }
];
