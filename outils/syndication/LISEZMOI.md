# Syndication des devlogs (dev.to / Hashnode)

Ces fichiers sont les versions Markdown des tutoriels du devlog, prêtes à republier.
Le dossier `/outils/` est exclu de l'exploration dans `robots.txt` : il ne crée pas de contenu dupliqué.

| Fichier | Article original (URL canonique) |
| --- | --- |
| `logique-ternaire-jeu-hacking.devto.md` | https://flexarion-studio.github.io/devlog/logique-ternaire-jeu-hacking/ |
| `raymarching-nebuleuse-shader.devto.md` | https://flexarion-studio.github.io/devlog/raymarching-nebuleuse-shader/ |

## dev.to

1. Connecte-toi sur https://dev.to, clique sur **Create Post**.
2. Passe en éditeur Markdown basique (Settings > Customization > Editor : *Basic markdown*), sinon l'en-tête n'est pas lu.
3. Colle **tout** le fichier `.devto.md`, en-tête `---` compris. Le champ `canonical_url` indique à Google que l'original est sur le site Flexarion.
4. Vérifie l'aperçu, puis remplace `published: false` par `published: true` (ou clique sur **Publish**).

## Hashnode

1. Sur ton blog Hashnode, clique sur **Write**.
2. Colle le contenu **sans** l'en-tête `---` (Hashnode ne le lit pas à la saisie).
3. Titre : celui du champ `title`. Image de couverture : celle de `cover_image`.
4. Dans le panneau de publication, active **« Are you republishing? »** et colle l'URL canonique du tableau ci-dessus dans **Original article URL**.
5. Publie.

## Après publication

- Vérifie dans le code source de la page dev.to / Hashnode que `<link rel="canonical">` pointe bien vers flexarion-studio.github.io.
- Ajoute les liens dev.to / Hashnode dans le plan de communication (netlinking).
- Si le domaine change (voir `outils/domaine-custom/`), le script de remplacement met aussi ces fichiers à jour ; pense à modifier l'URL canonique des articles déjà publiés.
