---
title: "Raymarching d'une nébuleuse : les bases, avec un exemple de shader"
published: false
description: "Rayon, densité, loi de Beer-Lambert et accumulation : un tutoriel GLSL pas à pas pour coder une nébuleuse volumétrique, avec un shader complet à copier."
tags: gamedev, glsl, shaders, tutorial
canonical_url: https://flexarion.eu/devlog/raymarching-nebuleuse-shader/
cover_image: https://flexarion.eu/assets/img/og-flexarion.png
---

Dans le devlog #2, nous avons raconté comment optimiser la nébuleuse de Vesper Protocol. Plusieurs lecteurs nous ont demandé de reprendre depuis le début. Voici donc les bases du raymarching volumétrique, étape par étape, avec un shader GLSL complet que vous pouvez coller dans Shadertoy.

## Le principe : avancer pas à pas dans un volume

Un moteur de jeu classique dessine des triangles : il projette leurs sommets à l'écran et colorie les pixels qu'ils recouvrent. Ça fonctionne très bien pour un vaisseau ou un mur. Mais une nébuleuse n'a pas de surface : c'est un nuage de gaz plus ou moins dense, que la lumière traverse en partie.

Le **raymarching** inverse le problème. Pour chaque pixel, on lance un rayon depuis la caméra et on avance le long de ce rayon par petits pas. À chaque pas, on se demande : « quelle est la densité du gaz ici ? » On accumule ce qu'on voit jusqu'à sortir du volume ou jusqu'à ce que le gaz devienne opaque.

Tout se passe dans un *fragment shader*, le programme que la carte graphique exécute pour chaque pixel. Sur Shadertoy, ce programme s'appelle `mainImage` et reçoit la position du pixel.

## Étape 1 : construire le rayon

Un rayon, c'est une origine (la caméra, `ro`) et une direction (`rd`). On commence par centrer les coordonnées du pixel et corriger le rapport largeur/hauteur de l'écran :

```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
vec3 ro = vec3(0.0, 0.0, -3.5);          // caméra reculée sur l'axe z
vec3 rd = normalize(vec3(uv, 1.5));      // 1.5 = distance focale
```

Le point situé à une distance `t` le long du rayon vaut simplement `ro + rd * t`. Augmenter la distance focale resserre le champ de vision, comme un zoom.

## Étape 2 : une densité à partir de bruit

Il nous faut une fonction `density(p)` qui renvoie la quantité de gaz au point `p`. Pour obtenir des volutes naturelles, on utilise du **bruit de valeur** : des nombres pseudo-aléatoires placés sur une grille 3D, interpolés en douceur. En additionnant plusieurs couches de bruit de plus en plus fines (des *octaves*), on obtient un **fBm** (*fractional Brownian motion*), la base de presque tous les nuages procéduraux.

```glsl
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.02 + vec3(1.7, 9.2, 3.1);  // on décale chaque octave
        a *= 0.5;                             // chaque octave pèse moitié moins
    }
    return v;
}
```

Pour casser l'aspect trop régulier, on **déforme** les coordonnées avec un premier fBm avant d'en calculer un second (*domain warping*) : les volutes s'étirent comme du gaz. On enferme ensuite ce bruit dans une sphère floue, sinon il remplirait tout l'espace, et on retire un seuil pour creuser des trous entre les nuages.

## Étape 3 : absorber et émettre la lumière

Quand la lumière traverse un gaz, une partie est absorbée. La **loi de Beer-Lambert** dit que la fraction qui passe, la *transmittance*, décroît de façon exponentielle avec la densité traversée :

```text
T = exp(-absorption × densité × longueur_du_pas)
```

Notre nébuleuse est aussi **émissive** : le gaz chauffé par l'étoile brille. À chaque pas, on ajoute donc à la couleur du pixel la lumière émise à cet endroit, atténuée par tout le gaz déjà traversé (la transmittance courante). C'est la composition « d'avant en arrière » :

```text
col += T * emission * d * STEP;   // lumière émise, vue à travers le gaz
T   *= exp(-d * STEP);            // le gaz devant devient plus opaque
```

L'ordre compte : on ajoute la lumière avec l'ancienne transmittance, puis on la met à jour.

## Étape 4 : le shader complet

Voici le shader entier, prêt à copier dans Shadertoy. Il ajoute deux détails : un léger décalage aléatoire du point de départ de chaque rayon, et une sortie anticipée quand le gaz devient opaque.

```glsl
// Nébuleuse volumétrique : exemple pédagogique (Flexarion, devlog #4)
// Licence CC BY-NC 4.0 : flexarion.eu

float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.02 + vec3(1.7, 9.2, 3.1);
        a *= 0.5;
    }
    return v;
}

float density(vec3 p) {
    vec3 q = p * 1.6 + vec3(0.0, 0.0, iTime * 0.06);   // le nuage dérive lentement
    float n = fbm(q + 1.5 * fbm(q));                   // bruit déformé par du bruit
    float sphere = 1.0 - smoothstep(0.0, 2.3, length(p));
    return max(n * sphere - 0.36, 0.0) * 8.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(uv, 1.5));

    const float STEP = 0.08;
    float jitter = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);
    float t = 1.0 + jitter * STEP;
    vec3 col = vec3(0.0);
    float T = 1.0;                        // transmittance

    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = density(p);
        if (d > 0.001) {
            vec3 emission = mix(vec3(0.3, 0.02, 0.02), vec3(1.0, 0.32, 0.08), clamp(d, 0.0, 1.0));
            col += T * emission * d * STEP;
            T *= exp(-d * STEP);           // Beer-Lambert
            if (T < 0.02) break;          // sortie anticipée
        }
        t += STEP;
    }

    // Étoile rouge en arrière-plan, vue à travers le gaz restant
    float star = 0.012 / (length(uv - vec2(0.55, 0.22)) + 0.02);
    col += T * (vec3(0.012, 0.01, 0.025) + vec3(1.0, 0.35, 0.12) * star);
    fragColor = vec4(pow(col, vec3(0.4545)), 1.0);   // correction gamma
}
```

## Les réglages qui changent tout

- **La taille du pas** (`STEP`) : un pas plus petit donne un volume plus fin, mais coûte plus de calculs.
- **Le nombre de pas** : 64 pas de 0,08 couvrent environ 5 unités, juste assez pour traverser la sphère.
- **Le décalage aléatoire** (`jitter`) : sans lui, des bandes régulières apparaissent dans le nuage ; avec lui, elles deviennent un grain fin.
- **La sortie anticipée** : inutile de continuer quand moins de 2 % de la lumière passe encore.
- **La correction gamma** : sans elle, les zones sombres paraissent bouchées.

Ce shader est volontairement simple : il recalcule tout le bruit à chaque pas, en pleine résolution. Dans le jeu, nous le précalculons dans une texture 3D et le rendons à demi-résolution. C'est tout le sujet du [devlog #2 sur l'optimisation du shader de nébuleuse](https://flexarion.eu/devlog/optimisation-shaders-nebuleuse/), qui explique comment passer de 9 ms à 2,1 ms par image.

## Tester le shader

Le rendu ci-dessous exécute exactement le code de l'étape 4 dans votre navigateur, avec WebGL.

*Aperçu en direct du shader : [sur le devlog Flexarion](https://flexarion.eu/devlog/raymarching-nebuleuse-shader/#shadertoy).*

Pour le modifier, ouvrez un [nouveau shader sur Shadertoy](https://www.shadertoy.com/new), remplacez le code par défaut par celui de l'étape 4, puis appuyez sur Alt + Entrée. Essayez de changer `STEP`, les couleurs d'émission ou le coefficient d'absorption pour voir l'effet de chaque paramètre.

## Pour aller plus loin

Cette nébuleuse entoure Tau-Héliade, l'étoile mourante de [Vesper Protocol](https://flexarion.eu/vesper-protocol/). Si vous préférez la logique au rendu, lisez notre [tutoriel sur la logique ternaire](https://flexarion.eu/devlog/logique-ternaire-jeu-hacking/), ou découvrez comment nous avons conçu [l'IA des Gardiens](https://flexarion.eu/devlog/ia-gardiens-aliens/). Tous les articles sont dans le [devlog Flexarion](https://flexarion.eu/devlog/).

---

*Cet article a été publié à l'origine sur le [devlog Flexarion](https://flexarion.eu/devlog/raymarching-nebuleuse-shader/). Flexarion est un studio de jeux vidéo fictif, imaginé pour un projet pédagogique du BUT Informatique. Texte sous licence CC BY-NC 4.0.*
