#!/bin/bash
# scripts/restore-mongodb.sh

# MongoDB Restore Script

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
DATABASE_NAME="${DATABASE_NAME:-portfolio}"

echo "Restoring MongoDB from backup: $BACKUP_FILE"

# Extract if tar.gz
if [[ $BACKUP_FILE == *.tar.gz ]]; then
  TEMP_DIR=$(mktemp -d)
  tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
  BACKUP_DIR="$TEMP_DIR/$(ls $TEMP_DIR)"
else
  BACKUP_DIR="$BACKUP_FILE"
fi

# Perform restore
mongorestore \
  --uri="$MONGODB_URI" \
  --db="$DATABASE_NAME" \
  --gzip \
  --drop \
  "$BACKUP_DIR/$DATABASE_NAME"

if [ $? -eq 0 ]; then
  echo "Restore completed successfully"
  
  # Cleanup
  if [[ $BACKUP_FILE == *.tar.gz ]]; then
    rm -rf "$TEMP_DIR"
  fi
else
  echo "Restore failed!"
  exit 1
fi