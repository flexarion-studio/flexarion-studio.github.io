# Passage à un domaine personnalisé — checklist

> **Rien n'est appliqué pour l'instant.** Le site reste sur son adresse GitHub Pages actuelle tant que
> le script n'a pas été lancé avec `-Appliquer` et que le fichier `CNAME` n'a pas été poussé.
> Attention : pousser un fichier `CNAME` suffit à activer le domaine sur GitHub Pages.

Dans cette checklist, `www.exemple.fr` désigne le futur domaine, et `<compte>.github.io` l'adresse GitHub
Pages actuelle (le compte est `flexarion-studio`).

## 1. Acheter et choisir le domaine

- [ ] Acheter le domaine chez un registrar (OVHcloud, Gandi, Infomaniak…).
- [ ] Choisir la forme principale. Recommandé : `www.exemple.fr` (le domaine nu `exemple.fr` redirigera vers lui).

## 2. Protéger le domaine dans GitHub (avant le DNS)

- [ ] GitHub > organisation `flexarion-studio` > **Settings > Pages > Add a domain**.
- [ ] Saisir `exemple.fr`, puis créer chez le registrar l'enregistrement **TXT** indiqué
      (`_github-pages-challenge-flexarion-studio.exemple.fr`).
- [ ] Cliquer sur **Verify**. Cela empêche quelqu'un d'autre d'utiliser le domaine avec un autre dépôt.

## 3. Configurer le DNS chez le registrar

Supprimer d'abord les enregistrements A/AAAA « parking » créés par défaut, et ne pas utiliser de joker (`*`).

| Type | Nom | Valeur |
| --- | --- | --- |
| CNAME | `www` | `<compte>.github.io.` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

- [ ] Vérifier la propagation (quelques minutes à 48 h) :

```bash
nslookup www.exemple.fr
nslookup exemple.fr
```

## 4. Mettre à jour le dépôt (script)

Le script remplace l'ancien domaine partout (canonical, Open Graph, Twitter, JSON-LD, sitemap, robots.txt,
flux RSS, llms.txt, security.txt, humans.txt, versions dev.to, workflow IndexNow) et crée le fichier `CNAME`.

- [ ] Simulation (n'écrit rien) :

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\outils\domaine-custom\changer-domaine.ps1 -NouveauDomaine "www.exemple.fr"
```

- [ ] Application, relecture puis commit (sans push tout de suite si le DNS n'est pas prêt) :

```powershell
.\outils\domaine-custom\changer-domaine.ps1 -NouveauDomaine "www.exemple.fr" -Appliquer
git diff --stat
git add -A
git commit -m "Passage au domaine www.exemple.fr"
```

Sous Linux / macOS : `bash outils/domaine-custom/changer-domaine.sh www.exemple.fr` puis `--appliquer`.

- [ ] `git push` une fois le DNS en place.

> L'ancien script `changer-url.ps1` (dossier parent, hors dépôt) vise une adresse obsolète : ne plus l'utiliser.

## 5. Activer HTTPS dans GitHub Pages

- [ ] Dépôt > **Settings > Pages > Custom domain** : le domaine doit apparaître (lu depuis `CNAME`).
      Ne pas le retaper si le champ est déjà rempli (GitHub recréerait un commit `CNAME`).
- [ ] Attendre **« DNS check successful »**, puis la génération du certificat (souvent moins d'une heure, jusqu'à 24 h).
- [ ] Cocher **Enforce HTTPS**.

## 6. Vérifications en ligne

- [ ] `https://www.exemple.fr/` s'affiche avec le cadenas.
- [ ] `https://exemple.fr/` et l'ancienne adresse `<compte>.github.io` redirigent (301) vers `https://www.exemple.fr/`.
- [ ] Code source de l'accueil : `canonical`, `og:url`, `og:image` et JSON-LD sur le nouveau domaine.
- [ ] `/robots.txt`, `/sitemap.xml`, `/feed.xml`, `/llms.txt`, `/.well-known/security.txt` répondent.
- [ ] Le fichier de clé IndexNow répond à la racine du nouveau domaine, puis le workflow **IndexNow** passe au vert (onglet Actions).
- [ ] Test des résultats enrichis Google sur l'accueil, la page du jeu, un article et le presskit.

## 7. Moteurs de recherche

- [ ] **Google Search Console** : ajouter une propriété *Domaine* pour `exemple.fr` (enregistrement TXT), soumettre `sitemap.xml`.
- [ ] Dans l'ancienne propriété, utiliser **Paramètres > Changement d'adresse** vers le nouveau domaine.
      La balise `google-site-verification` reste dans l'accueil : ne pas la supprimer.
- [ ] **Bing Webmaster Tools** : ajouter le site, soumettre le sitemap, utiliser l'outil **Site Move**.

## 8. En dehors du site

- [ ] Liens à mettre à jour : bio Instagram et TikTok, site web de l'organisation GitHub, page itch.io, plan de communication.
- [ ] Articles déjà publiés sur dev.to / Hashnode : modifier leur URL canonique.
- [ ] Formspree : si le formulaire est restreint à un domaine, ajouter le nouveau.

## Retour arrière

Supprimer le fichier `CNAME`, annuler le commit de remplacement (`git revert <commit>`), pousser, puis retirer
le domaine dans **Settings > Pages**.
