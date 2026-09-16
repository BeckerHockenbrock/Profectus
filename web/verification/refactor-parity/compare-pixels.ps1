param(
  [string]$OutputRoot = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$drawingAssembly = [System.Drawing.Bitmap].Assembly.Location

Add-Type -ReferencedAssemblies $drawingAssembly -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class RefactorPixelDiff {
  public static double[] Compare(string leftPath, string rightPath) {
    using (var left = new Bitmap(leftPath))
    using (var right = new Bitmap(rightPath)) {
      if (left.Width != right.Width || left.Height != right.Height) {
        return new double[] { left.Width, left.Height, right.Width, right.Height, -1, -1, -1, -1, -1 };
      }

      var rect = new Rectangle(0, 0, left.Width, left.Height);
      var leftData = left.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      var rightData = right.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      try {
        var byteCount = Math.Abs(leftData.Stride) * left.Height;
        var leftBytes = new byte[byteCount];
        var rightBytes = new byte[byteCount];
        Marshal.Copy(leftData.Scan0, leftBytes, 0, byteCount);
        Marshal.Copy(rightData.Scan0, rightBytes, 0, byteCount);

        long exactDifferenceCount = 0;
        long thresholdDifferenceCount = 0;
        long totalAbsoluteDifference = 0;
        var maxChannelDifference = 0;
        var stride = Math.Abs(leftData.Stride);

        for (var y = 0; y < left.Height; y++) {
          var row = y * stride;
          for (var x = 0; x < left.Width; x++) {
            var offset = row + (x * 4);
            var pixelDifference = 0;
            var exactDifference = false;
            for (var channel = 0; channel < 4; channel++) {
              var difference = Math.Abs(leftBytes[offset + channel] - rightBytes[offset + channel]);
              totalAbsoluteDifference += difference;
              if (difference > 0) exactDifference = true;
              if (difference > pixelDifference) pixelDifference = difference;
            }
            if (exactDifference) exactDifferenceCount++;
            if (pixelDifference > 8) thresholdDifferenceCount++;
            if (pixelDifference > maxChannelDifference) maxChannelDifference = pixelDifference;
          }
        }

        var pixelCount = (long)left.Width * left.Height;
        var meanAbsoluteDifference = totalAbsoluteDifference / (double)(pixelCount * 4);
        return new double[] {
          left.Width, left.Height, right.Width, right.Height, pixelCount,
          exactDifferenceCount, thresholdDifferenceCount, maxChannelDifference, meanAbsoluteDifference
        };
      } finally {
        left.UnlockBits(leftData);
        right.UnlockBits(rightData);
      }
    }
  }
}
'@

function Get-PixelComparison([string]$LeftPath, [string]$RightPath) {
  $data = [RefactorPixelDiff]::Compare($LeftPath, $RightPath)
  if ($data[4] -lt 0) {
    return [ordered]@{
      dimensionsMatch = $false
      leftSize = "$($data[0])x$($data[1])"
      rightSize = "$($data[2])x$($data[3])"
      exactDifferentPixels = $null
      exactDifferentPercent = $null
      thresholdDifferentPixels = $null
      thresholdDifferentPercent = $null
      maxChannelDifference = $null
      meanAbsoluteChannelDifference = $null
    }
  }

  return [ordered]@{
    dimensionsMatch = $true
    leftSize = "$($data[0])x$($data[1])"
    rightSize = "$($data[2])x$($data[3])"
    exactDifferentPixels = [int64]$data[5]
    exactDifferentPercent = [math]::Round(($data[5] / $data[4]) * 100, 4)
    thresholdDifferentPixels = [int64]$data[6]
    thresholdDifferentPercent = [math]::Round(($data[6] / $data[4]) * 100, 4)
    maxChannelDifference = [int]$data[7]
    meanAbsoluteChannelDifference = [math]::Round($data[8], 4)
  }
}

$capturePath = Join-Path $OutputRoot 'capture-results.json'
$capture = Get-Content -LiteralPath $capturePath -Raw | ConvertFrom-Json
$baselineRoot = 'C:\Users\Bhock\.gemini\antigravity\brain\36bcd627-e1be-4e4b-b042-81163774bc57\baselines'
$postRoot = Join-Path $OutputRoot 'post-refactor'
$legacyRoot = Join-Path $OutputRoot 'legacy-reference'

$entries = foreach ($captureEntry in $capture.results) {
  $postPath = Join-Path $postRoot $captureEntry.postFilename
  $baselinePath = Join-Path $baselineRoot $captureEntry.filename
  $legacyPath = Join-Path $legacyRoot $captureEntry.legacyFilename

  [ordered]@{
    filename = $captureEntry.filename
    description = $captureEntry.description
    viewport = $captureEntry.viewport
    viewportSize = $captureEntry.viewportSize
    baselineRecaptured = $captureEntry.baselineRecaptured
    domMatch = $captureEntry.domMatch
    consoleErrorCount = $captureEntry.consoleErrorCount
    consoleErrors = @($captureEntry.consoleErrors)
    archivedBaseline = Get-PixelComparison $baselinePath $postPath
    pairedLegacyReference = Get-PixelComparison $legacyPath $postPath
  }
}

$result = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  deterministicConditions = [ordered]@{
    timezone = $capture.timezone
    fixedClock = $capture.fixedClock
    firebase = $capture.firebaseMode
    identity = $capture.testIdentity
    questDataset = $capture.questDataset
    schoolDataset = $capture.schoolDataset
    browser = $capture.chromeVersion
  }
  summary = [ordered]@{
    states = @($entries).Count
    domMatches = @($entries | Where-Object { $_.domMatch }).Count
    consoleErrorStates = @($entries | Where-Object { $_.consoleErrorCount -gt 0 }).Count
    archivedBaselineThresholdDifferentPixels = [int64](($entries | ForEach-Object { $_.archivedBaseline.thresholdDifferentPixels } | Measure-Object -Sum).Sum)
    pairedLegacyThresholdDifferentPixels = [int64](($entries | ForEach-Object { $_.pairedLegacyReference.thresholdDifferentPixels } | Measure-Object -Sum).Sum)
  }
  states = @($entries)
}

$resultPath = Join-Path $OutputRoot 'verification-results.json'
$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $resultPath -Encoding utf8

$tableRows = foreach ($entry in $entries) {
  "| $($entry.filename) | $($entry.archivedBaseline.thresholdDifferentPercent)% | $($entry.pairedLegacyReference.thresholdDifferentPercent)% | $($entry.domMatch) | $($entry.consoleErrorCount) |"
}

$report = @(
  '# Behavior-preserving refactor parity report',
  '',
  "Generated: $($result.generatedAt)",
  '',
  '## Deterministic capture conditions',
  '',
  "- Browser: $($capture.chromeVersion)",
  "- Time zone: $($capture.timezone)",
  "- Fixed starting clock: $($capture.fixedClock)",
  "- Firebase: $($capture.firebaseMode)",
  "- Identity: $($capture.testIdentity.email)",
  "- Quest data: $($capture.questDataset)",
  "- School data: $($capture.schoolDataset)",
  '',
  'Threshold pixel difference treats a pixel as different when any ARGB channel differs by more than 8. Archived baseline diffs compare against the original baseline set; paired legacy diffs compare the refactor and legacy screenshots captured in the same deterministic run.',
  '',
  '## Summary',
  '',
  "- States: $($result.summary.states)",
  "- DOM matches: $($result.summary.domMatches)",
  "- Console-error states: $($result.summary.consoleErrorStates)",
  "- Archived baseline threshold-different pixels: $($result.summary.archivedBaselineThresholdDifferentPixels)",
  "- Paired legacy/reference threshold-different pixels: $($result.summary.pairedLegacyThresholdDifferentPixels)",
  '',
  '## Per-state results',
  '',
  '| Baseline | Archived diff | Paired legacy diff | DOM | Console errors |',
  '| --- | ---: | ---: | --- | ---: |'
) + $tableRows

$reportPath = Join-Path $OutputRoot 'verification-report.md'
$report | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "Wrote $resultPath and $reportPath"
