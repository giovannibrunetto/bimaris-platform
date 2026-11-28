#!/usr/bin/env python3
"""Synthetic-only regression for Windows-compatible streaming encrypted backup."""
import os
import pathlib
import subprocess
import sys
import tempfile

script = pathlib.Path(__file__).resolve().parents[1] / "backup-production-windows.py"
with tempfile.TemporaryDirectory() as td:
    root = pathlib.Path(td)
    (root / "gnupg").mkdir(mode=0o700)
    (root / "bin").mkdir()
    (root / "out").mkdir()
    env = os.environ.copy()
    env["GNUPGHOME"] = str(root / "gnupg")
    subprocess.run(["gpg", "--batch", "--pinentry-mode", "loopback", "--passphrase", "",
                    "--quick-generate-key", "BIMARIS synthetic <synthetic@example.invalid>",
                    "rsa2048", "encr", "0"], env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    keys = subprocess.run(["gpg", "--batch", "--with-colons", "--list-keys"],
                          env=env, stdout=subprocess.PIPE, text=True, check=True).stdout
    fingerprint = next(line.split(":")[9] for line in keys.splitlines() if line.startswith("fpr:"))
    env.update(PGSERVICE="synthetic", PGPASSFILE=str(root / "pgpass.fake"),
               BIMARIS_BACKUP_DIR=str(root / "out"),
               BIMARIS_GPG_RECIPIENT=fingerprint,
               BIMARIS_BACKUP_CONFIRMATION="BACKUP_ONLY_NO_RESTORE")
    env["PATH"] = str(root / "bin") + os.pathsep + env["PATH"]
    (root / "bin" / "pg_dump").write_text('#!/bin/sh\nprintf "PGDMPsynthetic-fixture"\n')
    (root / "bin" / "pg_restore").write_text('#!/bin/sh\ncat >/dev/null\nprintf "42; 1259 1000 TABLE public synthetic postgres\\n"\n')
    for p in (root / "bin" / "pg_dump", root / "bin" / "pg_restore"):
        p.chmod(0o755)
    ok = subprocess.run([sys.executable, str(script)], env=env, capture_output=True, text=True)
    assert ok.returncode == 0, ok.stderr
    archives = list((root / "out").glob("*.pgcustom.gpg"))
    assert len(archives) == 1
    assert not list((root / "out").glob(".*"))
    decoded = subprocess.run(["gpg", "--batch", "--decrypt", str(archives[0])],
                             env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.DEVNULL, check=True).stdout
    assert decoded == b"PGDMPsynthetic-fixture"
    archives[0].unlink()
    (root / "bin" / "pg_dump").write_text('#!/bin/sh\nprintf "PGDMPincomplete"\nexit 21\n')
    (root / "bin" / "pg_dump").chmod(0o755)
    failed = subprocess.run([sys.executable, str(script)], env=env,
                            capture_output=True, text=True)
    assert failed.returncode != 0
    assert not list((root / "out").iterdir())
    print("PASS: synthetic encryption/decryption, archive inspection and failed-pipeline cleanup")
