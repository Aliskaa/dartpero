# Hook PostToolUse (Edit|Write) : formate et lint le fichier tout juste modifié.
# Seulement src/ et tests/ (.ts, .tsx, .css) — jamais le dépôt entier (rules/biome.md).
# Code 2 = les erreurs restantes sont renvoyées à Claude.
$ErrorActionPreference = 'Stop'
try {
  $entree = [Console]::In.ReadToEnd() | ConvertFrom-Json
  $fichier = $entree.tool_input.file_path
} catch { exit 0 }
if (-not $fichier) { exit 0 }
$racine = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$relatif = ($fichier -replace '\\', '/')
$prefixe = ($racine -replace '\\', '/').TrimEnd('/') + '/'
if (-not $relatif.StartsWith($prefixe, [StringComparison]::OrdinalIgnoreCase)) { exit 0 }
$relatif = $relatif.Substring($prefixe.Length)
if ($relatif -notmatch '^(src|tests)/.+\.(ts|tsx|css)$') { exit 0 }
$biome = Join-Path $racine 'node_modules\.bin\biome.cmd'
if (-not (Test-Path $biome)) { exit 0 }
$ErrorActionPreference = 'Continue' # PS 5.1 : stderr natif + Stop = exception
$sortie = & $biome check --write $fichier 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { [Console]::Error.WriteLine($sortie); exit 2 }
exit 0
