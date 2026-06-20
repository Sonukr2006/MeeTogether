# Deployment Rollback Procedures

## When to Rollback
- Error rate > 10% after deployment
- Critical functionality broken (login, signup, project creation)
- Data corruption detected
- Security vulnerability introduced

## Application Rollback

### If using container/platform deployments:
1. Identify the last known good deployment version
2. Redeploy the previous version through your platform (Railway, Render, AWS, etc.)
3. Verify health endpoint returns healthy
4. Monitor error rate and functionality

### If using git-based deployments:
```bash
git revert HEAD
git push origin main
# Wait for CI/CD to redeploy
```

## Database Migration Rollback

### Prisma does NOT have built-in down migrations. Options:

1. **If migration was additive-only** (new columns, new indexes): No rollback needed — old code ignores new fields.

2. **If migration was destructive** (dropped columns, renamed tables):
   - Restore from pre-deployment backup
   - Apply only migrations up to the previous version
   ```bash
   pg_restore --clean --if-exists -d $DATABASE_URL pre-deployment-backup.dump
   npx prisma migrate deploy
   ```

3. **If migration added constraints that break old code**:
   - Write a manual SQL script to remove the constraint
   - Apply with: `psql $DATABASE_URL -f rollback-script.sql`

## Post-Rollback
- [ ] Confirm health checks pass
- [ ] Test critical flows (login, create project, post message)
- [ ] Document what went wrong
- [ ] Plan fix before next deployment attempt
