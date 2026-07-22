#!/bin/bash
set -e
npm install
# IMPORTANT: Do NOT run `npm run db:push` here.
# The Drizzle schema file does not describe all live tables in this project,
# so a push would DROP live data (302 shows, homepage categories, banners, sessions).
# Apply schema changes with explicit psql DDL instead (CREATE TABLE IF NOT EXISTS / ALTER TABLE).
