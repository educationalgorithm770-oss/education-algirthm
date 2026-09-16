#!/usr/bin/env python3
import sqlite3
import sys
import json

FORBIDDEN = (
    "ATTACH", "DETACH", "PRAGMA", "LOAD_EXTENSION",
    "READFILE", "WRITEFILE", "SYSTEM", "EXEC"
)

if len(sys.argv) != 2:
    print("SQL Error: invalid runner arguments.")
    sys.exit(2)

try:
    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        sql = fh.read().strip()
except Exception:
    print("SQL Error: unable to read query.")
    sys.exit(2)

if not sql:
    print("SQL Error: query is empty.")
    sys.exit(2)

if any(token in sql.upper() for token in FORBIDDEN):
    print("Security Error: restricted SQL command.")
    sys.exit(3)

db = None
try:
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    cur = db.cursor()
    cur.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            role TEXT,
            salary INTEGER
        );
        INSERT INTO users VALUES
            (1, 'Alice Chen', 'alice@company.com', 'Engineer', 95000),
            (2, 'Bob Vance', 'bob@company.com', 'Manager', 120000),
            (3, 'Diana Prince', 'diana@company.com', 'Lead Engineer', 140000);
    """)

    # Exactly one student statement per execution.
    cur.execute(sql)

    if cur.description:
        rows = [dict(row) for row in cur.fetchall()]
        print(json.dumps(rows, indent=2, ensure_ascii=False))
    else:
        db.commit()
        print("Query executed successfully (0 rows).")

    sys.exit(0)
except Exception:
    print("SQL Error: query failed.")
    sys.exit(1)
finally:
    if db is not None:
        db.close()
