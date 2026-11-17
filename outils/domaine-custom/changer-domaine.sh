#!/usr/bin/env bash
# Remplace le domaine du site dans tous les fichiers texte du dépôt et crée le fichier CNAME.
# Par défaut : simulation (aucun fichier modifié). Ajoute --appliquer pour écrire.
#
# Usage : outils/domaine-custom/changer-domaine.sh www.flexarion.fr [--appliquer]
#         ANCIEN=autre.domaine outils/domaine-custom/changer-domaine.sh www.flexarion.fr --appliquer
set -euo pipefail

NOUVEAU="${1:?Indique le nouveau domaine, ex. www.flexarion.fr}"
APPLIQUER="${2:-}"
ANCIEN="${ANCIEN:-flexarion-studio.github.io}"
NOUVEAU="$(printf '%s' "$NOUVEAU" | tr 'A-Z' 'a-z' | sed -E 's#^https?://##; s#/+$##')"

if ! printf '%s' "$NOUVEAU" | grep -Eq '^[a-z0-9.-]+\.[a-z]{2,}$'; then echo "Domaine invalide : $NOUVEAU" >&2; exit 1; fi
[ "$NOUVEAU" = "$ANCIEN" ] && { echo "Le nouveau domaine est identique à l'ancien." >&2; exit 1; }

RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
total=0
while IFS= read -r -d '' f; do
  [ "$f" = "$SELF" ] && continue
  n=$( (grep -o -F "$ANCIEN" "$f" || true) | wc -l | tr -d ' ')
  if [ "$n" -gt 0 ]; then
    printf '%4s occurrence(s)  %s\n' "$n" "${f#"$RACINE"/}"
    total=$((total + n))
    if [ "$APPLIQUER" = "--appliquer" ]; then
      ESC_A="$(printf '%s' "$ANCIEN" | sed 's/[.[\*^$/]/\\&/g')"
      sed -i.bak "s/$ESC_A/$NOUVEAU/g" "$f" && rm -f "$f.bak"
    fi
  fi
done < <(find "$RACINE" -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.md' -o -name '*.yml' -o -name '*.yaml' -o -name '*.json' -o -name '*.js' -o -name '*.css' \) -not -path '*/.git/*' -print0)

if [ "$APPLIQUER" = "--appliquer" ]; then
  printf '%s\n' "$NOUVEAU" > "$RACINE/CNAME"
  echo; echo "$total remplacement(s) : $ANCIEN -> $NOUVEAU"; echo "Fichier CNAME écrit : $NOUVEAU"
else
  echo; echo "SIMULATION : $total remplacement(s) prévus, aucun fichier modifié."
  echo "Le fichier CNAME serait créé avec : $NOUVEAU"; echo "Relance avec --appliquer pour écrire les changements."
fi
