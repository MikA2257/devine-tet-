# Devine Tête 🤔

Webapp du jeu « devine tête », optimisée pour iPhone (plein écran, hors-ligne, encoches gérées).

## Deux modes

**📱 Téléphone sur le front** : le téléphone, à l'horizontale sur le front, affiche un mot aux autres joueurs qui le font deviner.
- Penche la tête **en avant** (écran vers le sol) → **Trouvé** ✓
- Penche la tête **en arrière** (écran vers le plafond) → **Passer**
- Manches de 30 s à 2 min, sons, score et récapitulatif à la fin.
- Option « Boutons » si les capteurs ne sont pas disponibles (ou pour qu'un ami tienne le téléphone).

**🟨 Post-it** : le « Qui suis-je ? » classique, chacun son tour avec des questions oui / non.
- *Vrais post-it* : l'appli distribue les mots un par un, quelqu'un les écrit sur les post-it sans que le joueur concerné ne voie.
- *Sur l'écran* : pas de papier, à son tour le joueur pose le téléphone sur son front et l'écran affiche son post-it.
- Suivi des tours, abandon possible, classement final.

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
