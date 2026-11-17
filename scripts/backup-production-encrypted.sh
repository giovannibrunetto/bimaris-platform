#!/usr/bin/env bash
# BIMARIS DT16: manual encrypted logical backup of the ENTIRE accessible database.
# PRE-MIGRATION ONLY. This does not modify the source database or schedule work.
# Operate on a trusted workstation; configure PGSERVICE/PGPASSFILE outside Git.
# A successful archive is NOT equivalent to a restore-tested backup.
set -Eeuo pipefail
umask 077

: "${PGSERVICE:?Configure production libpq service externally (no credentials in this file)}"
: "${BIMARIS_BACKUP_DIR:?Set an absolute off-repository restricted directory}"
: "${BIMARIS_GPG_RECIPIENT:?Set the VERIFIED recipient 40/64-character public-key fingerprint}"
: "${BIMARIS_BACKUP_CONFIRMATION:?Set BIMARIS_BACKUP_CONFIRMATION to BACKUP_ONLY_NO_RESTORE}"
[[ "$BIMARIS_BACKUP_CONFIRMATION" == "BACKUP_ONLY_NO_RESTORE" ]] || { echo 'Backup-only confirmation required' >&2; exit 2; }
[[ "$BIMARIS_BACKUP_DIR" = /* ]] || { echo 'Backup directory must be absolute' >&2; exit 2; }
[[ "$BIMARIS_GPG_RECIPIENT" =~ ^([[:xdigit:]]{40}|[[:xdigit:]]{64})$ ]] || { echo 'Invalid recipient fingerprint' >&2; exit 2; }
case "$BIMARIS_BACKUP_DIR" in */.git|*/.git/*|*/bimaris-platform|*/bimaris-platform/*) echo 'Backup directory must be outside repository' >&2; exit 2;; esac
for command in pg_dump gpg mktemp date; do command -v "$command" >/dev/null || { echo "Missing executable: $command" >&2; exit 2; }; done
gpg --batch --list-keys "$BIMARIS_GPG_RECIPIENT" >/dev/null 2>&1 || { echo 'Verified public key not installed' >&2; exit 2; }
mkdir -p -- "$BIMARIS_BACKUP_DIR"
[[ ! -L "$BIMARIS_BACKUP_DIR" ]] || { echo 'Backup directory cannot be a symbolic link' >&2; exit 2; }
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$BIMARIS_BACKUP_DIR/bimaris-production-full-${timestamp}.pgcustom.gpg"
[[ ! -e "$archive" ]] || { echo 'Backup destination already exists' >&2; exit 2; }
temporary="$(mktemp "$BIMARIS_BACKUP_DIR/.bimaris-production.XXXXXXXX")"
cleanup() { rm -f -- "$temporary"; }
trap cleanup EXIT HUP INT TERM

# No --schema restriction: include all PostgreSQL objects that the configured
# backup role can access, including business/auth schemas. Encrypted in-flight;
# no plaintext dump is persisted. Ownership and ACLs are included where visible.
# Roles/globals and Storage objects need separate backup/inventory.
# The pipeline fails if pg_dump or gpg fails.
pg_dump --format=custom --dbname="service=$PGSERVICE" |
  gpg --batch --yes --trust-model always --encrypt --recipient "$BIMARIS_GPG_RECIPIENT" --output "$temporary"
[[ -s "$temporary" ]] || { echo 'Encrypted archive is empty' >&2; exit 1; }
chmod 600 "$temporary"
mv -- "$temporary" "$archive"
trap - EXIT HUP INT TERM
printf 'Encrypted backup written: %s\n' "$archive"
printf '%s\n' 'NOT RESTORE-TESTED. Verify actual schema/data coverage, then restore to an isolated database with equivalent extensions/roles before Production DDL.'
printf '%s\n' 'Handle archive, recipient key, retention, off-site copy, and any personal data per the approved privacy procedure.'
