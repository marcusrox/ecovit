param([ValidateSet('dev','typecheck','lint','test','test:e2e','build')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if ($nodeCommand) { $nodeExecutable = $nodeCommand.Source }
elseif (Test-Path -LiteralPath $bundledNode) { $nodeExecutable = $bundledNode }
else { throw 'Instale Node.js 22.12+ ou 24 LTS para executar o aplicativo.' }
$env:PATH = (Split-Path -Parent $nodeExecutable) + ';' + $env:PATH
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$localNpm = Join-Path $PSScriptRoot '.tools\package\bin\npm-cli.js'
if ($npmCommand) { & $npmCommand.Source run $Task }
elseif (Test-Path -LiteralPath $localNpm) { & $nodeExecutable $localNpm run $Task }
else { throw 'Instale npm com Node.js e execute npm ci antes de iniciar.' }
exit $LASTEXITCODE
