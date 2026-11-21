#!/usr/bin/env bash
# Synthetic integration tests only. Never connects to any database.
set -Eeuo pipefail
script="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backup-production-encrypted.sh"
bash -n "$script"
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
mkdir -m 700 "$tmp/gnupg" "$tmp/bin" "$tmp/out"
export GNUPGHOME="$tmp/gnupg"
gpg --batch --pinentry-mode loopback --passphrase '' --quick-generate-key   'BIMARIS synthetic CI test <synthetic@example.invalid>' rsa2048 encr 0 >/dev/null 2>&1
fingerprint="$(gpg --batch --with-colons --list-keys 2>/dev/null | awk -F: '$1=="fpr"{print $10;exit}')"
[[ "$fingerprint" =~ ^[a-fA-F0-9]{40}$ ]]
cat > "$tmp/bin/pg_dump" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
[[ "$*" == *"--format=custom"* ]] || exit 9
[[ "$*" == *"--dbname=service=synthetic_local"* ]] || exit 10
printf 'PGDMPsynthetic-fixture-no-user-data'
SH
chmod +x "$tmp/bin/pg_dump"
export PATH="$tmp/bin:$PATH" PGSERVICE="synthetic_local"
export BIMARIS_BACKUP_DIR="$tmp/out"
export BIMARIS_GPG_RECIPIENT="$fingerprint"
export BIMARIS_BACKUP_CONFIRMATION="BACKUP_ONLY_NO_RESTORE"
bash "$script" >/dev/null
archive="$(find "$tmp/out" -maxdepth 1 -type f -name '*.pgcustom.gpg' -print -quit)"
[[ -n "$archive" && -s "$archive" ]]
[[ "$(stat -c %a "$archive")" == "600" ]]
[[ "$(gpg --batch --decrypt "$archive" 2>/dev/null)" == "PGDMPsynthetic-fixture-no-user-data" ]]
[[ "$(find "$tmp/out" -maxdepth 1 -type f | wc -l)" -eq 1 ]]
rm -- "$archive"
cat > "$tmp/bin/pg_dump" <<'SH'
#!/usr/bin/env bash
printf 'PGDMPincomplete'
exit 21
SH
chmod +x "$tmp/bin/pg_dump"
set +e
bash "$script" >/dev/null 2>&1
status="$?"
set -e
[[ "$status" -ne 0 ]]
[[ "$(find "$tmp/out" -maxdepth 1 -type f | wc -l)" -eq 0 ]]
echo 'PASS: syntax, synthetic encrypt/decrypt, no plaintext, permissions, partial-export cleanup'
