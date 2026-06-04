# Upload v1.0.1 installer + latest.yml ke GitHub Release
# Usage:  $env:GITHUB_TOKEN="ghp_xxx"; .\scripts\upload-release.ps1

param(
  [string]$Token = $env:GITHUB_TOKEN
)

if (-not $Token) { Write-Error "GITHUB_TOKEN tidak diset. Jalankan: `$env:GITHUB_TOKEN='ghp_xxx'"; exit 1 }

$ErrorActionPreference = "Stop"
$repo    = "Rianrev/SiManda"
$tag     = "v1.0.1"
$distDir = Join-Path $PSScriptRoot "..\dist"
$headers = @{ Authorization = "token $Token"; "User-Agent" = "SiManda-Uploader" }

# Ambil release
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers

# Hapus asset lama (latest.yml + installer) agar bisa upload ulang
foreach ($name in @("latest.yml", "SI-MANDA-Setup-1.0.1.exe")) {
  $old = $release.assets | Where-Object { $_.name -eq $name }
  if ($old) {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/assets/$($old.id)" -Method Delete -Headers $headers
    Write-Host "  - hapus asset lama: $name"
  }
}

# Upload installer + latest.yml baru
$uploads = @(
  @{ path = Join-Path $distDir "SI MANDA Setup 1.0.1.exe"; name = "SI-MANDA-Setup-1.0.1.exe"; type = "application/octet-stream" },
  @{ path = Join-Path $distDir "latest.yml";               name = "latest.yml";               type = "application/x-yaml" }
)
foreach ($u in $uploads) {
  $url = ($release.upload_url -replace '\{\?name,label\}', "?name=$($u.name)")
  $h = @{ Authorization = "token $Token"; "User-Agent" = "SiManda-Uploader"; "Content-Type" = $u.type }
  $r = Invoke-RestMethod -Uri $url -Method Post -Headers $h -InFile $u.path
  Write-Host "  + upload: $($r.name) ($([Math]::Round($r.size/1MB,2)) MB)"
}

Write-Host ""
Write-Host "Selesai. Release: https://github.com/$repo/releases/tag/$tag"
