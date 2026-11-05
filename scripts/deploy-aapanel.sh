#!/usr/bin/env bash
set -euo pipefail

revision=${1:-}
if [[ ! "$revision" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'O webhook deve receber o SHA completo da revisão validada.' >&2
  exit 1
fi

app_dir=${ECOVIT_APP_DIR:-/srv/ecovit/app}
node_bin=${ECOVIT_NODE_BIN:?Informe o diretório bin do Node usado pelo aaPanel}
pm2_user=${ECOVIT_PM2_USER:?Informe o usuário do daemon PM2 do aaPanel}
pm2_home=${PM2_HOME:?Informe o PM2_HOME usado pelo aaPanel}
export PATH="$node_bin:/usr/bin:/bin"

exec 9>/run/lock/ecovit-deploy.lock
flock -n 9 || { echo 'Já há uma implantação do Ecovit em execução.' >&2; exit 1; }

pm2_command() {
  runuser -u "$pm2_user" -- env PATH="$PATH" PM2_HOME="$pm2_home" pm2 "$@"
}

[[ -S "$pm2_home/rpc.sock" ]] || { echo 'Daemon PM2 do aaPanel indisponível.' >&2; exit 1; }
pid=$(pm2_command pid ecovit)
if [[ ! "$pid" =~ ^[1-9][0-9]*$ ]] || [[ "$(readlink -f "/proc/$pid/cwd")" != "$(realpath "$app_dir")" ]]; then
  echo 'O processo ecovit do aaPanel precisa estar ativo no diretório configurado.' >&2
  exit 1
fi

runuser -u ecovit -- env PATH="$PATH" bash -se -- "$app_dir" "$revision" <<'BUILD'
cd "$1"
revision=$2
test -r .env
case "$(git remote get-url origin)" in
  https://github.com/marcusrox/ecovit.git|git@github.com:marcusrox/ecovit.git) ;;
  *) echo 'O checkout aponta para outro repositório.' >&2; exit 1 ;;
esac
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'O checkout contém alterações locais.' >&2
  exit 1
fi
git fetch --no-tags origin refs/heads/main
if [[ "$(git rev-parse FETCH_HEAD)" != "$revision" ]]; then
  echo 'A main avançou desde esta execução do CI. Aguarde a execução da nova revisão.' >&2
  exit 1
fi
git switch --detach "$revision"
npm ci --include=dev
npm run build
BUILD

pm2_command restart ecovit
for attempt in {1..15}; do
  if health=$(curl --fail --silent --max-time 3 http://127.0.0.1:3001/api/health) && [[ "$health" == '{"ok":true}' ]]; then
    printf 'ECOVIT_DEPLOY_OK=%s\n' "$revision"
    exit 0
  fi
  sleep 2
done
echo 'A API do Ecovit não passou na verificação de saúde após o reinício.' >&2
exit 1
