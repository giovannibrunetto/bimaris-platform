#!/usr/bin/env python3
"""Opt-in encrypted database dump for Windows/Python 3. No plaintext dump file.
The archive is NOT considered a tested restore. Never run DDL based on this alone.
"""
import datetime as dt
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

def fail(message):
    raise RuntimeError(message)

def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        fail(f"Missing {name}; configure locally, not in chat.")
    return value

def main():
    if required("BIMARIS_BACKUP_CONFIRMATION") != "BACKUP_ONLY_NO_RESTORE":
        fail("Backup-only confirmation is required.")
    service = required("PGSERVICE")
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", service):
        fail("Invalid libpq service name.")
    recipient = required("BIMARIS_GPG_RECIPIENT")
    if not re.fullmatch(r"(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})", recipient):
        fail("Expected verified recipient fingerprint.")
    location = Path(required("BIMARIS_BACKUP_DIR")).expanduser()
    if not location.is_absolute():
        fail("Backup path must be absolute.")
    location = location.resolve()
    repo = Path(__file__).resolve().parents[1]
    if location == repo or repo in location.parents:
        fail("Backup directory must be outside repository.")
    if not os.environ.get("PGPASSFILE"):
        fail("A locally protected PGPASSFILE must be configured.")
    for program in ("pg_dump", "pg_restore", "gpg"):
        if not shutil.which(program):
            fail(f"Missing {program} on PATH.")
    if subprocess.run(["gpg", "--batch", "--list-keys", recipient],
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        fail("Recipient public key not installed.")
    location.mkdir(parents=True, exist_ok=True)
    timestamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output = location / f"bimaris-production-{timestamp}.pgcustom.gpg"
    if output.exists():
        fail("Archive name already exists.")
    descriptor, name = tempfile.mkstemp(prefix=".bimaris-pgdump-", suffix=".gpg", dir=location)
    os.close(descriptor)
    temp = Path(name)
    try:
        # Native-to-native binary pipe: safe under Windows PowerShell 5 and 7.
        with subprocess.Popen(["pg_dump", "--format=custom", "--dbname", f"service={service}"],
                              stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as dump:
            with subprocess.Popen(["gpg", "--batch", "--yes", "--encrypt",
                                   "--recipient", recipient, "--output", str(temp)],
                                  stdin=dump.stdout, stdout=subprocess.DEVNULL,
                                  stderr=subprocess.DEVNULL) as gpg:
                dump.stdout.close()
                gpg_status = gpg.wait()
                dump_status = dump.wait()
        if dump_status or gpg_status or not temp.stat().st_size:
            fail(f"Backup failed (pg_dump={dump_status}, gpg={gpg_status}).")
        # Inspect the encrypted custom archive without saving plaintext.
        with subprocess.Popen(["gpg", "--batch", "--decrypt", str(temp)],
                              stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as decrypt:
            inspection = subprocess.run(["pg_restore", "--list"], stdin=decrypt.stdout,
                                        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            decrypt.stdout.close()
            decrypt_status = decrypt.wait()
        if decrypt_status or inspection.returncode:
            fail("Encrypted archive did not pass pg_restore list inspection.")
        toc = inspection.stdout.decode("utf-8", "replace")
        if not re.search(r"^\d+;\s+\d+\s+\d+\s+TABLE\s+public\s+", toc, re.M):
            fail("No public schema table in archive; verify backup scope.")
        os.replace(temp, output)
        print(f"ENCRYPTED BACKUP: {output}")
        print("Archive structure valid. Independent restore test still REQUIRED.")
    finally:
        if temp.exists():
            temp.unlink()

if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        sys.exit(1)
