---
title: "La logique ternaire expliquée par un jeu de hacking"
published: false
description: "Trits, ternaire équilibré, NEG, MIN, MAX et addition modulo 3 : un tutoriel accessible sur la logique ternaire, à travers les puzzles de Vesper Protocol."
tags: gamedev, tutorial, beginners, computerscience
canonical_url: https://flexarion-studio.github.io/devlog/logique-ternaire-jeu-hacking/
cover_image: https://flexarion-studio.github.io/assets/img/og-flexarion.png
---

Dans Vesper Protocol, les machines aliens ne pensent pas en 0 et en 1, mais en −1, 0 et +1. Ce tutoriel explique la logique ternaire à partir des puzzles du jeu : comment compter avec trois états, comment fonctionnent les portes logiques ternaires, et pourquoi elles piègent même les développeurs aguerris.

## Pourquoi trois états plutôt que deux ?

Un ordinateur classique manipule des **bits** : chaque case mémoire vaut 0 ou 1. C'est un choix d'ingénierie, pas une loi de la nature. Rien n'empêche de construire une machine dont chaque case peut prendre trois valeurs. On parle alors de **trit** (pour *trinary digit*).

Un trit transporte plus d'information qu'un bit : environ 1,58 bit (c'est log₂ 3). Avec 6 trits, on code 3⁶ = 729 valeurs différentes, contre 64 avec 6 bits. Ce n'est pas qu'une curiosité : en 1958, l'université d'État de Moscou a construit **Setun**, un véritable ordinateur ternaire, produit à une cinquantaine d'exemplaires.

Pour Vesper Protocol, nous cherchions une informatique qui paraisse étrangère tout en restant logique. Le ternaire était parfait : le joueur connaît déjà le binaire, ou en a entendu parler, et doit le « désapprendre » pour comprendre les machines de la Vesper.

## Le ternaire équilibré : compter avec −1, 0 et +1

Il existe deux façons d'écrire des nombres en base 3. La plus intuitive utilise les chiffres 0, 1 et 2. Celle de la Vesper utilise −1, 0 et +1 : c'est le **ternaire équilibré**. Dans la console du jeu, on les note `−`, `0` et `+`.

Le principe reste celui d'une numération de position : chaque trit est multiplié par une puissance de 3, en partant de la droite (1, 3, 9, 27…).

```text
+0−  =  (+1 × 9) + (0 × 3) + (−1 × 1)  =  9 + 0 − 1  =  8
−++  =  (−1 × 9) + (+1 × 3) + (+1 × 1)  = −9 + 3 + 1  = −5
```

Deux propriétés rendent ce système très élégant (le mathématicien Donald Knuth le décrivait comme l'un des plus jolis systèmes de numération) :

- **Pas de signe à part** : les nombres négatifs s'écrivent naturellement, sans bit de signe ni complément à deux.
- **Changer de signe = inverser chaque trit** : `+0−` vaut 8, donc `−0+` vaut −8. Aucun calcul.

Avec deux trits, on couvre toutes les valeurs de −4 à +4 ; avec trois, de −13 à +13. Ce détail compte dans le jeu : un registre de la Vesper ne déborde pas au même endroit qu'un registre binaire.

## Les portes logiques ternaires

En logique, on peut lire les trois états comme *faux* (−1), *inconnu* (0) et *vrai* (+1). C'est la logique à trois valeurs décrite par le logicien Stephen Kleene. Les opérations du binaire ont alors des équivalents directs.

### NEG : l'inverseur

NEG échange −1 et +1 et laisse 0 intact. Un « inconnu » inversé reste inconnu.

| x | NEG x |
| --- | --- |
| −1 | +1 |
| 0 | 0 |
| +1 | −1 |

### MIN et MAX : le ET et le OU à trois états

En binaire, ET vaut 1 seulement si les deux entrées valent 1 : c'est le minimum des deux. OU vaut 1 si l'une des deux vaut 1 : c'est le maximum. Le ternaire garde exactement cette idée.

| MIN (x, y) | y = −1 | y = 0 | y = +1 |
| --- | --- | --- | --- |
| x = −1 | −1 | −1 | −1 |
| x = 0 | −1 | 0 | 0 |
| x = +1 | −1 | 0 | +1 |

MAX se lit de la même façon, en prenant la plus grande valeur : MAX(−1, 0) = 0, MAX(0, +1) = +1. Un ET n'est donc vrai que si tout est vrai, et un seul « faux » suffit à le rendre faux.

### ADD : l'addition modulo 3

Additionner deux trits peut dépasser l'intervalle : +1 + +1 = 2. En ternaire équilibré, 2 s'écrit `+−` (3 − 1) : on garde le trit −1 et on reporte une retenue de +1. La machine virtuelle de la Vesper ne garde que le trit de droite, sans la retenue :

```text
ADD(+1, +1) = −1      ADD(−1, −1) = +1      ADD(+1, −1) = 0
```

C'est contre-intuitif, et c'est voulu : beaucoup de puzzles reposent sur ce « tour du cadran ».

## Comment ça devient un puzzle dans Vesper Protocol

Dans le jeu, chaque porte ou machine lit un registre. Le joueur branche sa console, observe les valeurs et écrit une courte routine avec les instructions disponibles. Voici un puzzle typique du premier secteur :

```text
// Porte 12-A : s'ouvre si R0 = +1
// Instructions autorisées : NEG, MAX
R0 = 0
R1 = −1

NEG R1        // R1 = +1
MAX R0, R1    // R0 = max(0, +1) = +1  → porte ouverte
```

La difficulté vient des contraintes : une machine n'accepte qu'un jeu réduit d'instructions, et certaines coûtent de la chaleur à la combinaison. Le joueur cherche donc la routine la plus courte.

### Le piège classique : penser en binaire

Lors de nos tests, les joueurs qui programment déjà tombaient tous dans les mêmes pièges :

- **Croire que NEG change toujours la valeur** : NEG(0) = 0. Un registre neutre ne se laisse pas inverser.
- **Lire MIN(0, +1) comme « vrai »** : le résultat est 0. Un ET avec un inconnu reste inconnu.
- **Oublier le tour du cadran** : ADD(+1, +1) ne donne pas +1 mais −1.

Ces erreurs sont la meilleure partie du jeu : le joueur comprend qu'il ne peut pas plaquer ses habitudes sur une machine qu'il ne connaît pas. C'est exactement l'état d'esprit d'un auditeur de sécurité face à un firmware inconnu.

## Exercices : à vous de jouer

Trois petits exercices pour vérifier que tout est clair. Cliquez pour afficher la réponse.

1. Que vaut `+−0` en décimal ? — *Réponse :* 9 − 3 + 0 = **6**.
2. Que vaut MAX(NEG(+1), 0) ? — *Réponse :* NEG(+1) = −1, puis MAX(−1, 0) = **0**.
3. Comment écrire 5 en ternaire équilibré, sur trois trits ? — *Réponse :* `+−−` : 9 − 3 − 1 = **5**.

## Pour aller plus loin

La logique ternaire est au cœur de [Vesper Protocol](https://flexarion-studio.github.io/vesper-protocol/), notre jeu de hacking spatial. Les Gardiens qui surveillent la Vesper utilisent eux aussi ces routines pour corriger vos failles : leur conception est racontée dans [le devlog sur l'IA des Gardiens](https://flexarion-studio.github.io/devlog/ia-gardiens-aliens/). Côté rendu, notre [tutoriel sur le raymarching d'une nébuleuse](https://flexarion-studio.github.io/devlog/raymarching-nebuleuse-shader/) explique comment nous dessinons le ciel de Tau-Héliade. Tous les articles sont dans le [devlog Flexarion](https://flexarion-studio.github.io/devlog/).

---

*Cet article a été publié à l'origine sur le [devlog Flexarion](https://flexarion-studio.github.io/devlog/logique-ternaire-jeu-hacking/). Flexarion est un studio de jeux vidéo fictif, imaginé pour un projet pédagogique du BUT Informatique. Texte sous licence CC BY-NC 4.0.*
