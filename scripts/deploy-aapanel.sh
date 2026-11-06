#!/usr/bin/env bash
set -euo pipefail

request=${1:-}
if [[ ! "$request" =~ ^([0-9a-f]{40})(-([0-9]+-[0-9]+))?$ ]]; then
  echo 'O webhook deve receber SHA completo, com ID e tentativa para deploy pelo GitHub.' >&2
  exit 1
fi
revision=${BASH_REMATCH[1]}
run_key=${BASH_REMATCH[3]:-}

app_dir=${ECOVIT_APP_DIR:-/www/wwwroot/ecovit/ecovit/ecovit}
npm_cache=${ECOVIT_NPM_CACHE:-/www/wwwroot/ecovit/npm-cache}
node_bin=${ECOVIT_NODE_BIN:-}
pm2_user=${ECOVIT_PM2_USER:-www}
pm2_bin=/usr/bin/pm2
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
if [[ -n "$node_bin" ]]; then
  export PATH="$node_bin:$PATH"
  pm2_bin=pm2
fi

exec 9>/run/lock/ecovit-deploy.lock
flock -n 9 || { echo 'Já há uma implantação do Ecovit em execução.' >&2; exit 1; }

pm2_command() {
  runuser -u "$pm2_user" -- "$pm2_bin" "$@"
}

runuser -u "$pm2_user" -- /bin/sh -c 'test -S "${PM2_HOME:-$HOME/.pm2}/rpc.sock"' ||
  { echo 'Daemon PM2 do aaPanel indisponível.' >&2; exit 1; }
pid=$(pm2_command pid ecovit | awk '/^[[:space:]]*[1-9][0-9]*[[:space:]]*$/ { print $1 }')
app_dir=$(realpath -e "$app_dir")
if [[ ! "$pid" =~ ^[1-9][0-9]*$ ]] || [[ "$(readlink -e "/proc/$pid/cwd")" != "$app_dir" ]]; then
  echo 'O processo ecovit do aaPanel precisa estar ativo no diretório configurado.' >&2
  exit 1
fi
if [[ -z "$node_bin" ]]; then
  node_executable=$(readlink -e "/proc/$pid/exe")
  node_bin=$(dirname "$node_executable")
fi
if [[ ! -x "$node_bin/node" || ! -x "$node_bin/npm" ]]; then
  echo 'Node e npm precisam estar disponíveis no diretório bin usado pelo Ecovit.' >&2
  exit 1
fi

runuser -u www -- env PATH="$node_bin:$PATH" GIT_TERMINAL_PROMPT=0 bash -se -- "$app_dir" "$revision" "$npm_cache" <<'BUILD'
cd "$1"
revision=$2
npm_cache=$3
test -r .env
if [[ ! -d "$npm_cache" || ! -w "$npm_cache" ]]; then
  echo 'Crie o diretório de cache npm do Ecovit com permissão de escrita para www.' >&2
  exit 1
fi
case "$(git remote get-url origin)" in
  https://github.com/marcusrox/ecovit|https://github.com/marcusrox/ecovit.git|git@github.com:marcusrox/ecovit.git) ;;
  *) echo 'O checkout aponta para outro repositório.' >&2; exit 1 ;;
esac
changes=$(git status --porcelain)
if [[ -n "$changes" ]]; then
  echo 'O checkout contém alterações locais.' >&2
  exit 1
fi
git fetch --no-tags origin refs/heads/main
if [[ "$(git rev-parse FETCH_HEAD)" != "$revision" ]]; then
  echo 'A main avançou desde esta execução do CI. Aguarde a execução da nova revisão.' >&2
  exit 1
fi
branch=$(git branch --show-current)
if [[ -n "$branch" && "$branch" != main ]]; then
  echo 'O checkout deve estar em main ou em um commit destacado.' >&2
  exit 1
fi
git merge --ff-only "$revision"
if [[ "$(git rev-parse HEAD)" != "$revision" ]]; then
  echo 'O checkout não está na revisão validada pelo CI.' >&2
  exit 1
fi
npm ci --include=dev --cache "$npm_cache"
npm run typecheck
npm exec -- vite build --no-emptyOutDir
node scripts/build-server.mjs
BUILD

pm2_command restart ecovit
for attempt in {1..15}; do
  if health=$(curl --fail --silent --max-time 3 http://127.0.0.1:3001/api/health) && [[ "$health" == '{"ok":true}' ]]; then
    if [[ -n "$run_key" ]]; then
      runuser -u www -- bash -se -- "$app_dir/dist" "$revision" "$run_key" <<'RECEIPT'
cd "$1"
index_hash=$(sha256sum < index.html)
receipt=$(mktemp .ecovit-deploy.XXXXXX)
trap 'rm -f -- "$receipt"' EXIT
printf '%s %s %s\n' "$2" "$3" "${index_hash%% *}" > "$receipt"
chmod 0644 "$receipt"
mv -fT -- "$receipt" ecovit-deploy.txt
RECEIPT
    fi
    printf 'ECOVIT_DEPLOY_OK=%s\n' "$revision"
    exit 0
  fi
  sleep 2
done
echo 'A API do Ecovit não passou na verificação de saúde após o reinício.' >&2
exit 1
