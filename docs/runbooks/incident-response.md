# Runbook: Incident Response

| First Seen | Owner | Mitigation Steps |
|------------|-------|------------------|
| Elevated 5xx rate | Backend on-call | 1. Acknowledge PagerDuty alert<br>2. Check error logs in Loki<br>3. Rollback last deployment if needed |
| Auth latency spike | SRE | 1. Check Redis status<br>2. Scale auth pods +1<br>3. Review Redis slowlog |

## Escalation Contacts
- Slack: `#lms-incident`
- PagerDuty: `backend-high`

## General Procedure
1. Triage severity (Sev-1..3)
2. Assign Incident Commander
3. Mitigate → Resolve → RCA → Post-mortem (incident-template)
