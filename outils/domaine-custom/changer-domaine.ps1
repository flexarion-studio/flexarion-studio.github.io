# Remplace le domaine du site dans tous les fichiers texte du dépôt et crée le fichier CNAME.
#
# Par défaut, le script ne modifie RIEN : il affiche seulement ce qu'il changerait.
# Ajoute -Appliquer pour écrire les changements.
#
# Usage (PowerShell, depuis n'importe quel dossier) :
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\outils\domaine-custom\changer-domaine.ps1 -NouveauDomaine "www.flexarion.fr"             # simulation
#   .\outils\domaine-custom\changer-domaine.ps1 -NouveauDomaine "www.flexarion.fr" -Appliquer  # écriture
#
# Le domaine s'écrit SANS https:// et SANS / final.
param(
    [Parameter(Mandatory = $true)][string]$NouveauDomaine,
    [string]$AncienDomaine = "flexarion-studio.github.io",
    [switch]$Appliquer
)

$NouveauDomaine = $NouveauDomaine.Trim().ToLower() -replace '^https?://', '' -replace '/+$', ''
$AncienDomaine = $AncienDomaine.Trim().ToLower() -replace '^https?://', '' -replace '/+$', ''
if ($NouveauDomaine -notmatch '^[a-z0-9.-]+\.[a-z]{2,}$') { throw "Domaine invalide : '$NouveauDomaine'" }
if ($NouveauDomaine -eq $AncienDomaine) { throw "Le nouveau domaine est identique à l'ancien." }

$racine = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$extensions = @('.html', '.xml', '.txt', '.md', '.yml', '.yaml', '.json', '.js', '.css', '.webmanifest')

$total = 0
Get-ChildItem $racine -Recurse -File |
    Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' -and $extensions -contains $_.Extension.ToLower() } |
    Where-Object { $_.FullName -ne $PSCommandPath } |
    ForEach-Object {
        $texte = [System.IO.File]::ReadAllText($_.FullName, $utf8)
        $n = ([regex]::Matches($texte, [regex]::Escape($AncienDomaine))).Count
        if ($n -gt 0) {
            $relatif = $_.FullName.Substring($racine.Length + 1)
            Write-Host ("{0,4} occurrence(s)  {1}" -f $n, $relatif)
            $total += $n
            if ($Appliquer) {
                [System.IO.File]::WriteAllText($_.FullName, $texte.Replace($AncienDomaine, $NouveauDomaine), $utf8)
            }
        }
    }

$cname = Join-Path $racine "CNAME"
if ($Appliquer) {
    [System.IO.File]::WriteAllText($cname, "$NouveauDomaine`n", $utf8)
    Write-Host ""
    Write-Host "$total remplacement(s) : $AncienDomaine -> $NouveauDomaine"
    Write-Host "Fichier CNAME écrit : $NouveauDomaine"
    Write-Host "Vérifie avec 'git diff', puis commit et push (voir CHECKLIST.md)."
} else {
    Write-Host ""
    Write-Host "SIMULATION : $total remplacement(s) prévus, aucun fichier modifié."
    Write-Host "Le fichier CNAME serait créé avec : $NouveauDomaine"
    Write-Host "Relance avec -Appliquer pour écrire les changements."
}
