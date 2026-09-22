[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ComfyUIPath
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot 'custom_nodes\ComfyUI-Codex-H3-Production'
$resolvedComfy = (Resolve-Path -LiteralPath $ComfyUIPath).Path
$customNodes = Join-Path $resolvedComfy 'custom_nodes'
$destination = Join-Path $customNodes 'ComfyUI-Codex-H3-Production'
$files = @('__init__.py', 'nodes.py', 'README.md')

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    throw "Source custom node package is missing: $source"
}
if (-not (Test-Path -LiteralPath $customNodes -PathType Container)) {
    throw "ComfyUI custom_nodes directory is missing: $customNodes"
}

$resolvedCustomNodes = (Resolve-Path -LiteralPath $customNodes).Path
if (-not $destination.StartsWith($resolvedCustomNodes + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to install outside the resolved custom_nodes directory: $destination"
}

New-Item -ItemType Directory -Path $destination -Force | Out-Null
foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination $destination -Force
}

[pscustomobject]@{
    source = $source
    destination = $destination
    files = $files
    restart_required = $true
} | ConvertTo-Json -Depth 4
