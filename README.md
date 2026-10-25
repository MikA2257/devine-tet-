# Devine Tête 🤔

Webapp du jeu « devine tête », optimisée pour iPhone (plein écran, hors-ligne, encoches gérées).

## Deux modes

**📱 Téléphone sur le front** : le téléphone, à l'horizontale sur le front, affiche un mot aux autres joueurs qui le font deviner.
- Penche la tête **en avant** (écran vers le sol) → **Trouvé** ✓
- Penche la tête **en arrière** (écran vers le plafond) → **Passer**
- Manches de 30 s à 2 min, sons, score et récapitulatif à la fin.
- Option « Boutons » si les capteurs ne sont pas disponibles (ou pour qu'un ami tienne le téléphone).

**🟨 Post-it en binômes** : l'appli tire les binômes au hasard ; dans chaque binôme, un joueur a le mot sur le front et pose des questions, l'autre répond par oui, non, peut-être ou je ne sais pas.
- Chaque binôme a 45 s par tour (réglable : 30 / 45 / 60 / 90 s), puis on passe au binôme suivant, chacun avec son propre mot.
- Le temps s'additionne tour après tour jusqu'à ce que le binôme trouve : le plus petit temps total gagne.
- Le gagnant est annoncé à la fin du tour complet, pour que les binômes qui jouent après aient eu autant de temps.
- Ensuite les autres peuvent continuer pour le classement, abandonner, ou arrêter la partie.
- Nombre impair : le dernier groupe est un trio avec un seul joueur qui devine ; ses deux coéquipiers répondent en alternance (un par tour), donc mêmes conditions qu'un binôme.
- *Vrais post-it* (le coéquipier écrit le mot) ou *Sur l'écran* (le téléphone sur le front affiche le mot et le chrono).

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
