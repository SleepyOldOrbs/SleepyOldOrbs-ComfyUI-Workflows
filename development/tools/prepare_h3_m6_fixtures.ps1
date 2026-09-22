[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ComfyUIPath
)

$ErrorActionPreference = 'Stop'

$resolvedComfy = (Resolve-Path -LiteralPath $ComfyUIPath).Path
$outputRoot = (Resolve-Path -LiteralPath (Join-Path $resolvedComfy 'output')).Path
$fixtureRoot = Join-Path $outputRoot 'H3_M6_Fixtures'
$resolvedOutput = [IO.Path]::GetFullPath($outputRoot)
$resolvedFixture = [IO.Path]::GetFullPath($fixtureRoot)
if (-not $resolvedFixture.StartsWith($resolvedOutput + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to create M6 fixtures outside the ComfyUI output directory: $resolvedFixture"
}

$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
New-Item -ItemType Directory -Path $resolvedFixture -Force | Out-Null

$fixtures = @(
    @{ Name = 'match_a.mp4'; Color = 'red'; Size = '64x48' },
    @{ Name = 'match_b.mp4'; Color = 'blue'; Size = '64x48' },
    @{ Name = 'mismatch_dimensions.mp4'; Color = 'green'; Size = '48x32' }
)

$records = foreach ($fixture in $fixtures) {
    $target = Join-Path $resolvedFixture $fixture.Name
    & $ffmpeg -y -v error `
        -f lavfi -i "color=c=$($fixture.Color):s=$($fixture.Size):r=24:d=0.5" `
        -f lavfi -i 'anullsrc=r=32000:cl=stereo:d=0.5' `
        -shortest -map_metadata -1 `
        -c:v libx264 -pix_fmt yuv420p `
        -c:a aac -b:a 96k -movflags +faststart `
        $target
    if ($LASTEXITCODE -ne 0) {
        throw "FFmpeg failed to create M6 fixture: $target"
    }
    [pscustomobject]@{
        path = $target
        sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash
        size_bytes = (Get-Item -LiteralPath $target).Length
    }
}

$records | ConvertTo-Json -Depth 4
