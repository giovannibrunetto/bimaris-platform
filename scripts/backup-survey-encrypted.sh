#!/usr/bin/env bash
# BIMARIS V6 — encrypted logical database backup, manual/offline operation.
# Designed for Supabase Free without new cloud services. No automatic activation.
# Operate from a secured workstation with PostgreSQL client tools and GnuPG.
# Required: PGSERVICE (libpq service with credentials held in a protected PGPASSFILE),
# BIMARIS_BACKUP_DIR (absolute directory outside repo), BIMARIS_GPG_RECIPIENT
# (verified 40- or 64-character public-key fingerprint).
#
# Backup covers survey_private including test data, table data, SQL objects.
# It does NOT cover all public-schema RPCs, auth, storage, pg_cron schedules,
# Vercel settings, or other schemas. GitHub migrations and infra config must
# be preserved separately for a full platform restoration.
#
# No plaintext database dump is ever written to disk by this script.
# Encrypted files MUST be copied off-site to a controlled EU location,
# access restricted, and deleted after the approved 7-day backup retention.
# Restore using the secret key ONLY in a separate, validated local database.

set -Eeuo pipefail
umask 077

: "${PGSERVICE:?Set PGSERVICE to the approved read-only-capable backup connection}"
: "${BIMARIS_BACKUP_DIR:?Set absolute controlled backup directory}"
: "${BIMARIS_GPG_RECIPIENT:?Set verified public key fingerprint}"
[[ "${BIMARIS_BACKUP_DIR}" = /* ]] || { echo "Backup directory must be absolute" >&2; exit 2; }
[[ "${BIMARIS_GPG_RECIPIENT}" =~ ^([[:xdigit:]]{40}|[[:xdigit:]]{64})$ ]] || {
  echo "Recipient must be a verified 40/64-character GPG fingerprint" >&2; exit 2;
}
for program in pg_dump gpg mktemp date; do
  command -v "$program" >/dev/null || { echo "Missing required command: $program" >&2; exit 2; }
done
gpg --batch --list-keys "$BIMARIS_GPG_RECIPIENT" >/dev/null 2>&1 || {
  echo "Trusted public key is not installed" >&2; exit 2;
}
mkdir -p -- "$BIMARIS_BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BIMARIS_BACKUP_DIR/bimaris-survey-${timestamp}.pgcustom.gpg"
[[ ! -e "$target" ]] || { echo "Backup already exists" >&2; exit 2; }
temporary="$(mktemp "$BIMARIS_BACKUP_DIR/.bimaris-survey.XXXXXXXX")"
cleanup() { rm -f -- "$temporary"; }
trap cleanup EXIT HUP INT TERM

# pg_dump reads all connection details from the approved libpq service.
# The encrypted archive never passes through a persistent plaintext file.
pg_dump --format=custom --no-owner --no-acl --schema=survey_private |
  gpg --batch --encrypt --recipient "$BIMARIS_GPG_RECIPIENT" --output "$temporary"
[[ -s "$temporary" ]] || { echo "Empty encrypted backup" >&2; exit 1; }
chmod 600 "$temporary"
mv -- "$temporary" "$target"
trap - EXIT HUP INT TERM

echo "Encrypted backup created: $target"
echo "NOT VERIFIED BY RESTORE. Copy off-site and restore-test on isolated synthetic/local environment before any Production authorization."
