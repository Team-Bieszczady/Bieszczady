#!/bin/bash
# Runs automatically on first container creation (docker-entrypoint-initdb.d).
#
# Prisma Migrate creates a temporary "shadow database" to detect schema drift,
# so the application user needs permission to create databases.
#
# This wide grant is acceptable ONLY for a local, throwaway container.
# Production must use narrowly scoped permissions.
set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
  GRANT ALL PRIVILEGES ON *.* TO '$MYSQL_USER'@'%';
  FLUSH PRIVILEGES;
EOSQL

echo "Granted database privileges to '$MYSQL_USER'."
