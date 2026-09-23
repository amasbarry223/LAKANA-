import subprocess
import os
import sys

env = os.environ.copy()
env["PGPASSWORD"] = "daouda"

# 1. Vérifier si lakana_db existe
check_cmd = [
    "psql", "-U", "postgres", "-h", "localhost", "-p", "5432", "-w", "-d", "postgres",
    "-tAc", "SELECT 1 FROM pg_database WHERE datname='lakana_db'"
]
res = subprocess.run(check_cmd, capture_output=True, text=True, env=env)

if "1" not in res.stdout:
    print("Création de la base lakana_db dans PostgreSQL...")
    create_cmd = [
        "psql", "-U", "postgres", "-h", "localhost", "-p", "5432", "-w", "-d", "postgres",
        "-c", "CREATE DATABASE lakana_db;"
    ]
    c_res = subprocess.run(create_cmd, capture_output=True, text=True, env=env)
    print(c_res.stdout.strip() or c_res.stderr.strip())
else:
    print("La base lakana_db existe déjà dans PostgreSQL.")

# 2. Vérification de la connexion à lakana_db
test_cmd = [
    "psql", "-U", "postgres", "-h", "localhost", "-p", "5432", "-w", "-d", "lakana_db",
    "-c", "SELECT current_database();"
]
t_res = subprocess.run(test_cmd, capture_output=True, text=True, env=env)
print("Connexion à lakana_db confirmée :")
print(t_res.stdout.strip())
