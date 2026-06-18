# Backup and Restore Procedures

## Backup Configuration

### Daily Automated Backups
- Schedule: Daily at 02:00 UTC
- Retention: 30 days minimum
- Provider: Use PostgreSQL provider's built-in backup (e.g., Supabase daily backups, AWS RDS automated backups, or Railway snapshots)

### Manual Backup
```bash
pg_dump $DATABASE_URL --format=custom --file=meetogether-backup-$(date +%Y%m%d).dump
```

## Restore Procedure

### Pre-Restore Checklist
- [ ] Confirm backup file integrity
- [ ] Notify team of maintenance window
- [ ] Stop application traffic (maintenance mode)
- [ ] Take a fresh backup before restore (safety net)

### Restore Steps
```bash
# 1. Stop the application
# 2. Restore from backup
pg_restore --clean --if-exists -d $DATABASE_URL meetogether-backup-YYYYMMDD.dump

# 3. Run pending migrations (if restoring to a newer schema)
npx prisma migrate deploy

# 4. Restart application
# 5. Verify health endpoint
curl https://your-domain/api/v1/health
```

### Post-Restore Verification
- [ ] `/api/v1/health` returns healthy
- [ ] Login works (test with known account)
- [ ] Recent data is present (check latest posts/projects)
- [ ] No orphaned references in foreign keys
