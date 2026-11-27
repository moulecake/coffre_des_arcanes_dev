// ============================================================
// PATCHNOTES — à compléter à chaque nouvelle version (la plus récente EN PREMIER).
// Format : { v: 'X.Y.Z', name: 'Titre', date: 'AAAA-MM-JJ', gift: 'texte du cadeau (facultatif)',
//            sections: [ { t: 'Titre de section', items: ['**Mot clé** : texte', ...] } ] }
// `**gras**` est pris en charge. Le patchnote de PATCHNOTES[0] s'affiche une fois à chaque joueur (après connexion), puis reste consultable via Menu › Patchnote.
// Changer PATCHNOTES[0].v suffit à le réafficher à tout le monde (penser à aligner CURRENT_VERSION de script.js et CACHE_NAME de sw.js).
// ============================================================
const PATCHNOTES = [
  {
    v: '2.a3.34', name: 'L’Académie des Arcanes', date: '2026-11-27',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '!!**Remise à zéro du Grimoire** : ta progression du Clicker (Éther, Sagesse, bâtiments, sorts) repart de zéro pour faire place à une nouvelle version corrigée, améliorée et rééquilibrée. Ton inventaire du Coffre, tes clés et tes fragments sont conservés.!!',
        '**L’Académie des Arcanes** : 8 écoles de magie, des examens du rang I au rang V, une spécialité puis une seconde école, un diplôme pour chaque réussite.',
        '**40 sorts** : passifs et actifs, jusqu’à 5 emplacements par panneau, decks nommés avec résumé et carte détaillée de chaque sort, recherche et filtres.',
        '**Barre de sorts** : rang discret sur chaque case ; un toucher rapide affiche le nom et l’effet du sort. Appui long : verrouiller l’emplacement.',
        '**Hors ligne** : bilan détaillé à ton retour, préparation des sorts avant de partir, plafond de 12 heures.',
        '**Lexique** et **Taxe d’adaptation** : touche un mot souligné pour sa définition ; changer ses sorts juste après un effort a un prix.',
        '**Personnalisation** (Profil) : sceau, couleur et halo du coffre, fond et skins de coffre aux couleurs de ton école, à débloquer à l’Académie.',
        '**Coffre de l’Artefact** : recycle un artefact en double pour obtenir un coffre spécial et sa clé, ouvert en priorité : 30 % de chance d’un Artefact, sinon un Légendaire et 1 à 5 fragments de clé.',
        '**Recommencer à zéro** : depuis la fenêtre de spécialité, repars de zéro dans le Clicker si tu veux changer d’école.',
        '**Classement** : l’école de chaque mage s’affiche à côté de son pseudo.',
        '**Support** : un bouton du menu ouvre le serveur Discord du Coffre.'
      ] },
      { t: '🛠 Améliorations', items: [
        '**Confort** : bouton retour (◁) natif, installation de l’application, compteurs collants, Top 10 du classement.',
        '**Surchauffe** revue, raccourcis clavier des sorts (1-5 / 6-9, 0), effets visuels plus lisibles.',
        '**Mobile** : bulles d’examens qui ne débordent plus, clés rangées sur plusieurs lignes quand tu en as beaucoup, ascenseurs aux couleurs du jeu.',
        '**Mentions légales** accessibles depuis le Clicker.',
        '**Nouvelle icône sur iPhone** : l’iPhone garde l’ancienne icône. Pour voir la nouvelle, supprime l’application de ton écran d’accueil puis réinstalle-la depuis le site (Partager › Sur l’écran d’accueil) : ta progression est conservée.'
      ] }
    ]
  },
  {
    v: '2.2.0', name: 'L’Éveil du Grimoire', date: '2026-11-18',
    gift: 'Cadeau de mise à jour : 3 clés offertes !',
    sections: [
      { t: '🎁 Nouveautés', items: [
        '**Le Clicker** (bouton ⚡ GRIMOIRE) : le Voile d’Éther et le Grimoire aux Pages Infinies. Frappe, lis, recrute des serviteurs et rends-toi à l’Académie. Le reste, à toi de le découvrir !',
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
