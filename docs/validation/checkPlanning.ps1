param([switch]$Bootstrap)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskErrors = New-Object 'System.Collections.Generic.List[string]'
function Assert-Planning([bool]$Condition, [string]$Message) {
  if (-not $Condition) { $taskErrors.Add($Message) }
}
$taskActive = @(Get-ChildItem (Join-Path $taskRoot 'docs') -Recurse -File -Filter '*.md' | Where-Object { $_.FullName -notmatch '[\\/]archive[\\/]' })
$taskActive += Get-Item (Join-Path $taskRoot 'AGENTS.md'), (Join-Path $taskRoot 'README.md')
$taskSkills = @(Get-ChildItem (Join-Path $taskRoot '.agents/skills') -Recurse -File -Filter 'SKILL.md')
$taskActive += $taskSkills
$taskLinkCount = 0
foreach ($taskFile in $taskActive) {
  $taskText = [IO.File]::ReadAllText($taskFile.FullName)
  foreach ($taskMatch in [regex]::Matches($taskText, '\[[^\]]+\]\(([^)]+)\)')) {
    $taskTarget = $taskMatch.Groups[1].Value.Trim('<', '>')
    if ($taskTarget -match '^(https?://|mailto:|#)') { continue }
    $taskTarget = [uri]::UnescapeDataString(($taskTarget -split '#')[0])
    if (-not $taskTarget) { continue }
    $taskPath = [IO.Path]::GetFullPath((Join-Path $taskFile.DirectoryName $taskTarget))
    Assert-Planning (Test-Path -LiteralPath $taskPath) "Broken link in $($taskFile.Name): $taskTarget"
    $taskLinkCount++
  }
}
$taskCardRoot = Join-Path $taskRoot 'docs/sessions'
$taskIndex = [IO.File]::ReadAllText((Join-Path $taskCardRoot 'README.md'))
$taskCards = @(Get-ChildItem $taskCardRoot -File -Filter 'session-*.md')
$taskOrder = @([regex]::Matches($taskIndex, '^\| \[([0-9]+\.[0-9]+|[PHA][0-9]+)\]\(session-[^)]+\.md\)', 'Multiline') | ForEach-Object { $_.Groups[1].Value })
Assert-Planning ($taskOrder.Count -eq $taskCards.Count) 'Index/card count mismatch'
Assert-Planning (@($taskOrder | Select-Object -Unique).Count -eq $taskOrder.Count) 'Duplicate session IDs'
$taskExternal = @('ui-ux-pro-max','playwright','security-best-practices','security-threat-model','openai-docs')
foreach ($taskCard in $taskCards) {
  $taskId = $taskCard.BaseName.Substring(8)
  $taskText = [IO.File]::ReadAllText($taskCard.FullName)
  Assert-Planning ($taskText.StartsWith("# Session $taskId ")) "Wrong title $taskId"
  foreach ($taskSection in @('Goal','Branch','Milestone','Depends on','Read first','Required skills','Review')) {
    Assert-Planning ($taskText.Contains('**' + $taskSection + ':**')) "Missing $taskSection in $taskId"
  }
  foreach ($taskSection in @('Files and interfaces','Build','Tests and verification','Done when','Out of scope','Handoff','Starter prompt')) {
    Assert-Planning ($taskText.Contains("## $taskSection")) "Missing section $taskSection in $taskId"
  }
  Assert-Planning ($taskText.Contains('push all session commits')) "Missing push instruction $taskId"
  $taskDepLine = [regex]::Match($taskText, '^\*\*Depends on:\*\* (.+)$', 'Multiline').Groups[1].Value
  foreach ($taskDepMatch in [regex]::Matches($taskDepLine, '\[([^\]]+)\]\(session-')) {
    $taskDep = $taskDepMatch.Groups[1].Value
    Assert-Planning ($taskOrder -contains $taskDep) "Unknown dependency $taskDep in $taskId"
    Assert-Planning ([array]::IndexOf($taskOrder,$taskDep) -lt [array]::IndexOf($taskOrder,$taskId)) "Dependency order: $taskDep -> $taskId"
  }
  $taskSkillLine = [regex]::Match($taskText, '^\*\*Required skills:\*\* (.+)$', 'Multiline').Groups[1].Value
  foreach ($taskSkillMatch in [regex]::Matches($taskSkillLine, '\$([a-z0-9-]+)')) {
    $taskSkill = $taskSkillMatch.Groups[1].Value
    Assert-Planning ((Test-Path (Join-Path $taskRoot ".agents/skills/$taskSkill/SKILL.md")) -or ($taskExternal -contains $taskSkill)) "Unknown skill $taskSkill"
  }
}
foreach ($taskSkillFile in $taskSkills) {
  $taskText = [IO.File]::ReadAllText($taskSkillFile.FullName)
  $taskFront = [regex]::Match($taskText, '\A---\r?\nname: ([a-z0-9-]+)\r?\ndescription: ([^\r\n]+)\r?\n---\r?\n')
  Assert-Planning $taskFront.Success "Unsupported skill frontmatter $($taskSkillFile.FullName)"
  Assert-Planning ($taskFront.Groups[1].Value -eq $taskSkillFile.Directory.Name) "Skill name mismatch $($taskSkillFile.FullName)"
  Assert-Planning (-not $taskText.Contains('TODO')) "Unfinished skill $($taskSkillFile.FullName)"
}
$taskAgents = @(Get-ChildItem (Join-Path $taskRoot '.codex/agents') -File -Filter '*.toml')
foreach ($taskAgentFile in $taskAgents) {
  $taskText = [IO.File]::ReadAllText($taskAgentFile.FullName).Replace([string][char]13, '')
  # Validate the small, explicit TOML subset used here; not an arbitrary TOML parser.
  $taskAgent = [regex]::Match($taskText, '\Aname = "([a-z_]+)"\ndescription = "([^"\r\n]+)"\ndeveloper_instructions = """\n([\s\S]*?)\n"""\n\z')
  Assert-Planning $taskAgent.Success "Invalid supported agent TOML $($taskAgentFile.Name)"
  Assert-Planning ($taskAgent.Groups[1].Value -eq $taskAgentFile.BaseName) "Agent name mismatch $($taskAgentFile.Name)"
  Assert-Planning (-not $taskAgent.Groups[3].Value.Contains('"""')) "Unescaped TOML delimiter $($taskAgentFile.Name)"
  Assert-Planning ($taskText.Contains('Do not edit')) "Missing no-edit instruction $($taskAgentFile.Name)"
}
$taskDomain = [IO.File]::ReadAllText((Join-Path $taskRoot 'docs/02-domain-and-rules.md'))
$taskPattern = '^\| ' + [char]96 + '([a-z-]+)' + [char]96 + ' \|'
$taskRules = @([regex]::Matches($taskDomain,$taskPattern,'Multiline'))
Assert-Planning ($taskRules.Count -eq 23) "Expected 23 rules, got $($taskRules.Count)"
Assert-Planning (@(Get-ChildItem $taskCardRoot -Filter 'phase-*.md').Count -eq 0) 'Old active phase cards'
foreach ($taskArchive in Get-ChildItem (Join-Path $taskRoot 'docs/archive/2026-11-06-sessions') -File -Filter '*.md') {
  Assert-Planning ([IO.File]::ReadAllText($taskArchive.FullName).StartsWith('> HISTORICAL ONLY')) "Unlabelled archive $($taskArchive.Name)"
}
Push-Location $taskRoot
try {
  if ($Bootstrap) {
    Assert-Planning (-not (Test-Path 'package.json')) 'Bootstrap contains application manifest'
    $taskChanged = @(& git diff --name-only main)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect Git diff' }
    $taskChanged += @(& git ls-files --others --exclude-standard)
    foreach ($taskChangedFile in $taskChanged) {
      Assert-Planning ($taskChangedFile -match '^(docs/|\.agents/skills/|\.codex/agents/|AGENTS\.md$|README\.md$)') "Non-planning change: $taskChangedFile"
    }
  }
  & git diff --check
  Assert-Planning ($LASTEXITCODE -eq 0) 'git diff --check failed'
} finally { Pop-Location }
if ($taskErrors.Count) { $taskErrors | ForEach-Object { Write-Output "FAIL: $_" }; exit 1 }
Write-Output "PASS: $($taskCards.Count) cards, ordered dependencies, $taskLinkCount local links, $($taskSkills.Count) skill frontmatters, $($taskAgents.Count) supported agent TOML files, $($taskRules.Count) rules, archives and whitespace."
if ($Bootstrap) { Write-Output 'PASS: documentation-only bootstrap; pnpm verify not applicable.' }
