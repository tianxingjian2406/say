$claudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$flagFile = Join-Path $claudeDir ".say-active"
if (Test-Path $flagFile) {
    $mode = (Get-Content $flagFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($mode -and $mode -ne "off") {
        Write-Output "[SAY:$mode%]"
    }
}