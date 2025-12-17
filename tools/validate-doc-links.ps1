param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$DocsRoot = "docs"
)

$ErrorActionPreference = "Stop"

$docsFull = Join-Path $RepoRoot $DocsRoot

if (-not (Test-Path -LiteralPath $docsFull)) {
  Write-Output "ERROR: Docs root not found: $docsFull"
  exit 2
}

$scanFiles = Get-ChildItem -LiteralPath $docsFull -Recurse -File | Where-Object {
  $_.Extension -in ".md", ".yaml", ".yml"
}

$broken = New-Object System.Collections.Generic.List[object]

function Add-Broken {
  param(
    [string]$Source,
    [string]$Target,
    [string]$Resolved,
    [string]$Kind
  )

  $broken.Add([pscustomobject]@{
    Source   = $Source
    Target   = $Target
    Resolved = $Resolved
    Kind     = $Kind
  })
}

function Resolve-DocTarget {
  param(
    [string]$SourceDir,
    [string]$Target
  )

  $t = $Target.Trim()

  if ($t.StartsWith("<") -and $t.EndsWith(">")) {
    $t = $t.Substring(1, $t.Length - 2)
  }

  if ($t -match "\\s") {
    $t = ($t -split "\\s+")[0]
  }

  $t = $t.Trim('"')
  $t = $t.Trim("'")

  $filePart = ($t -split "#")[0]
  $filePart = ($filePart -split "\?")[0]

  if ([string]::IsNullOrWhiteSpace($filePart)) {
    return [pscustomobject]@{ Status = "skip"; Resolved = $null; Error = $null }
  }

  $filePart = $filePart -replace "\\\\", "/"

  if ($filePart.StartsWith("/")) {
    $cand = Join-Path $RepoRoot $filePart.TrimStart("/")
  }
  elseif ($filePart.StartsWith("docs/")) {
    $cand = Join-Path $RepoRoot $filePart
  }
  elseif ($filePart.StartsWith("./") -or $filePart.StartsWith("../")) {
    $cand = Join-Path $SourceDir $filePart
  }
  elseif ($filePart.Contains("/")) {
    $candInSource = Join-Path $SourceDir $filePart
    $candInRoot = Join-Path $RepoRoot $filePart

    if (Test-Path -LiteralPath $candInSource) {
      $cand = $candInSource
    }
    elseif (Test-Path -LiteralPath $candInRoot) {
      $cand = $candInRoot
    }
    else {
      $cand = $candInSource
    }
  }
  else {
    $candInSource = Join-Path $SourceDir $filePart
    $candInRoot = Join-Path $RepoRoot $filePart

    if (Test-Path -LiteralPath $candInSource) {
      $cand = $candInSource
    }
    elseif (Test-Path -LiteralPath $candInRoot) {
      $cand = $candInRoot
    }
    else {
      $cand = $candInSource
    }
  }

  try {
    $full = [IO.Path]::GetFullPath($cand)
    return [pscustomobject]@{ Status = "ok"; Resolved = $full; Error = $null }
  }
  catch {
    return [pscustomobject]@{ Status = "invalid"; Resolved = $cand; Error = $_.Exception.Message }
  }
}

foreach ($f in $scanFiles) {
  $sourceRel = $f.FullName.Substring($RepoRoot.Length + 1)
  $sourceDir = Split-Path -Parent $f.FullName

  $text = Get-Content -Raw -LiteralPath $f.FullName

  foreach ($m in [regex]::Matches($text, "\[[^\]]*\]\(([^)]+)\)")) {
    $raw = $m.Groups[1].Value.Trim()

    if ($raw -match "^(https?://|mailto:)" -or $raw.StartsWith("#")) {
      continue
    }

    if ($raw.StartsWith("/") -and -not $raw.StartsWith("/docs/")) {
      continue
    }

    $res = Resolve-DocTarget -SourceDir $sourceDir -Target $raw

    if ($null -eq $res -or $res.Status -eq "skip") {
      continue
    }

    if ($res.Status -eq "invalid") {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "md-link-invalid"
      continue
    }

    if (-not (Test-Path -LiteralPath $res.Resolved)) {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "md-link"
    }
  }

  foreach ($m in [regex]::Matches($text, '`([^`]+?\.(md|yaml|yml))`')) {
    $raw = $m.Groups[1].Value.Trim()

    if ($raw -match "^(https?://)") {
      continue
    }

    $res = Resolve-DocTarget -SourceDir $sourceDir -Target $raw

    if ($null -eq $res -or $res.Status -eq "skip") {
      continue
    }

    if ($res.Status -eq "invalid") {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "code-ref-invalid"
      continue
    }

    if (-not (Test-Path -LiteralPath $res.Resolved)) {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "code-ref"
    }
  }

  foreach ($m in [regex]::Matches($text, "(?<![A-Za-z0-9_./-])(docs/[A-Za-z0-9_.\-/]+\.(md|yaml|yml))")) {
    $raw = $m.Groups[1].Value.Trim()

    $res = Resolve-DocTarget -SourceDir $sourceDir -Target $raw

    if ($null -eq $res -or $res.Status -eq "skip") {
      continue
    }

    if ($res.Status -eq "invalid") {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "docs-path-invalid"
      continue
    }

    if (-not (Test-Path -LiteralPath $res.Resolved)) {
      Add-Broken -Source $sourceRel -Target $raw -Resolved $res.Resolved -Kind "docs-path"
    }
  }
}

$uniqueBroken = $broken | Sort-Object Source, Kind, Target, Resolved -Unique

if ($uniqueBroken.Count -eq 0) {
  Write-Output "OK: no broken local file references in docs/"
  exit 0
}

Write-Output "BROKEN_REFERENCES:"
foreach ($b in $uniqueBroken) {
  Write-Output ("- {0} | {1} | {2} | {3}" -f $b.Kind, $b.Source, $b.Target, $b.Resolved)
}
Write-Output ("Broken: {0}" -f $uniqueBroken.Count)

exit 1
