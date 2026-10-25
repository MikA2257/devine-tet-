# Devine Tête 🤔

Webapp du jeu « devine tête », optimisée pour iPhone (plein écran, hors-ligne, encoches gérées).

## Deux modes, en binômes

L'appli tire les binômes au hasard. Dans un binôme, un joueur devine en posant des questions, l'autre répond par oui, non, peut-être ou je ne sais pas.
Les binômes jouent à tour de rôle (30 / 45 / 60 / 90 s par tour) ; le temps s'additionne jusqu'à ce que le binôme ait trouvé ses mots.
**Le plus petit temps total gagne.** Le gagnant est annoncé à la fin du tour complet, pour que les binômes qui jouent après aient eu autant de temps ;
ensuite les autres peuvent continuer pour le classement, abandonner, ou arrêter la partie.

Nombre impair : le dernier groupe est un trio, mais à chaque tour un seul joueur devine et un seul répond, donc mêmes conditions qu'un binôme.

**📱 Téléphone sur le front** : course à 3, 5 ou 10 mots par binôme. Le téléphone, à l'horizontale sur le front, fait défiler les mots :
penche la tête **en avant** = trouvé, **en arrière** = passer. Les rôles s'inversent à chaque tour.
Les règles **Classique** (un max de mots en une manche chronométrée) restent disponibles. Option « Boutons » si les capteurs ne sont pas disponibles.

**🟨 Post-it** : un mot à la fois. Avec « 2 mots », quand le binôme trouve, les rôles s'inversent avec un nouveau mot ; il a fini quand chacun a trouvé le sien.
- *Vrais post-it* : l'appli montre le mot au coéquipier, qui l'écrit.
- *Sur l'écran* : le téléphone sur le front affiche le mot et le chrono.

10 catégories (~600 mots) + une catégorie **Mes mots** personnalisable.

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

Sur ordinateur, les flèches ↓ / ↑ simulent « trouvé » / « passer ».
Après modification des fichiers, incrémenter `VERSION` dans `sw.js`.
