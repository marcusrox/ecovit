param(
  [ValidateSet('dev','dev:test','typecheck','lint','test','test:api','test:e2e','test:e2e:edge','test:e2e:full','test:e2e:interface','test:e2e:flows','test:e2e:load','test:env','test:env:check','test:env:stop','build','api:dev','api:start','db:migrate','data:cleanup')][string]$Task = 'dev',
  [string[]]$TestArguments = @()
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if ($nodeCommand) { $nodeExecutable = $nodeCommand.Source }
elseif (Test-Path -LiteralPath $bundledNode) { $nodeExecutable = $bundledNode }
else { throw 'Instale Node.js 24.18 com npm para executar o aplicativo.' }
$env:PATH = (Split-Path -Parent $nodeExecutable) + ';' + $env:PATH
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$localNpm = Join-Path $PSScriptRoot '.tools\package\bin\npm-cli.js'
$npmCandidates = @((Join-Path (Split-Path -Parent $nodeExecutable) 'node_modules\npm\bin\npm-cli.js'), $localNpm)
if ($npmCommand) { $npmCandidates += Join-Path (Split-Path -Parent $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js' }
$npmCli = $npmCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $npmCli) { throw 'Instale npm com Node.js e execute npm ci antes de iniciar.' }
# Invoke Node directly so regex metacharacters are not interpreted by npm.cmd.
& $nodeExecutable $npmCli run $Task -- @TestArguments
exit $LASTEXITCODE
