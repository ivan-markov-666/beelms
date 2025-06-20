# Runbook: Backup & Restore

| First Seen | Owner | Mitigation Steps |
|------------|-------|------------------|
| Service outage / data loss | DBA on-call | 1. Identify affected DB<br>2. Verify latest backup in S3<br>3. Initiate restore via `pg_restore`<br>4. Run integrity checks<br>5. Notify stakeholders |

## Objective
Ensure we can recover the PostgreSQL and Redis datasets within the defined RPO/RTO.

## Preconditions
- Access to S3 bucket
- Kubernetes secrets for DB credentials

## Procedure
1. Scale down writers to 0 replicas
2. Restore database dump from <backup-name>
3. Re-run migrations if required
4. Scale writers back up

## Verification
- Application smoke tests pass
- Error rate < 0.5 % for 10 min

## Rollback / Mitigation
If restore fails, reinstate snapshot `<timestamp-1>`.
