# Devine Tête 🤔

Webapp du jeu « devine tête », optimisée pour iPhone (plein écran, hors-ligne, encoches gérées).

## Deux modes, en binômes

L'appli tire les binômes au hasard. Dans un binôme, un joueur devine en posant des questions, l'autre répond par oui, non, peut-être ou je ne sais pas.
Les binômes jouent à tour de rôle (30 / 45 / 60 / 90 s par tour) ; le temps s'additionne jusqu'à ce que le binôme ait trouvé ses mots.
**Le plus petit temps total gagne.** Le gagnant est annoncé à la fin du tour complet, pour que les binômes qui jouent après aient eu autant de temps ;
ensuite les autres peuvent continuer pour le classement, abandonner, ou arrêter la partie.
Avec « 2 mots par binôme », quand le binôme trouve, les rôles s'inversent avec un nouveau mot ; il a fini quand chacun a trouvé le sien.

**Mode fun à 2 ou 3 joueurs** : une seule équipe, sans classement ; on enchaîne les mots (rôles qui tournent à chaque mot trouvé ou abandonné) et un bilan s'affiche à la fin.

Nombre impair : le dernier groupe est un trio, mais à chaque tour un seul joueur devine et un seul répond, donc mêmes conditions qu'un binôme.

**📱 Téléphone sur le front** : mêmes règles que le post-it. Le téléphone, à l'horizontale sur le front de celui qui devine, affiche son mot et le chrono.
Le compte à rebours, le mot et le chrono ne démarrent que téléphone à l'horizontale sur le front (l'affichage pivote aussi si la rotation de l'iPhone est verrouillée).
Dès qu'on retire le téléphone du front, le chrono se met en pause et l'appli demande (mot caché) : trouvé, on reprend, ou abandon (possible seulement si une autre équipe a déjà fini).
Option « Boutons » : un bouton Pause remplace la détection.

**🟨 Post-it** : un mot à la fois (comme le mode front). Avec « 2 mots », quand le binôme trouve, les rôles s'inversent avec un nouveau mot ; il a fini quand chacun a trouvé le sien.
- *Vrais post-it* : l'appli montre le mot au coéquipier, qui l'écrit.
- *Sur l'écran* : le téléphone sur le front affiche le mot et le chrono.

**Joker « changer de mot »** (0, 1 ou 2 fois, réglable) : avant le premier tour avec un nouveau mot, celui qui fait deviner le découvre seul et peut le changer s'il ne connaît pas la personne.

**Mots** : uniquement des personnes réelles ou fictives, en 11 catégories au choix (footballeurs, sportifs, acteurs & actrices,
chanteurs & musiciens, personnalités & influenceurs, personnages historiques, super-héros & méchants, dessins animés,
films & séries, contes/livres & BD, jeux vidéo), plus une catégorie **Mes mots** personnalisable.

**📡 Plusieurs téléphones** : dans les réglages, « Inviter d'autres téléphones » affiche un code (et un lien à envoyer).
Les autres joueurs touchent « Rejoindre une partie » sur l'accueil et entrent le code : leur téléphone affiche le chrono,
les équipes et le mot en cours (caché pour celui qui devine). Le téléphone de celui qui répond affiche en plus
les boutons **Trouvé** et **Pause / Reprendre** ; le reste de la partie se pilote depuis le téléphone hôte.
Mise en relation via le service public gratuit PeerJS, puis connexion directe entre téléphones ; Internet nécessaire.

## Installer sur iPhone

L'inclinaison nécessite **HTTPS**. Le plus simple : GitHub Pages
(*Settings → Pages → Deploy from a branch → `main` / root*).

Puis sur l'iPhone, ouvrir l'URL dans **Safari → Partager → Sur l'écran d'accueil**.
Au premier lancement du mode front, iOS demande l'autorisation d'accéder aux mouvements : accepter.

## Développement

Aucun build : HTML/CSS/JS statiques.

```sh
python3 -m http.server 8000
```

Sur ordinateur, la barre d'espace met le chrono en pause en mode front.
À chaque mise à jour, changer le numéro et le petit nom dans `version.js` (affichés sur l'écran titre, ils renouvellent aussi le cache hors-ligne).
