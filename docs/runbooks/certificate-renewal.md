# Runbook: TLS Certificate Renewal

| First Seen | Owner | Mitigation Steps |
|------------|-------|------------------|
| Expiring certificate alert | DevOps | 1. Validate domain ownership<br>2. Run certbot renew<br>3. Reload Nginx<br>4. Verify with SSL Labs |

## Automation
- Cloudflare AutoSSL covers CDN edge.
- LetsEncrypt cronjob handles origin certs.
