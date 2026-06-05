# UAOS Domain Setup

Current production website:
https://frontend-aeplatform-apps-projects.vercel.app

Planned domain:
uaos.app

To connect domain on Vercel:

1. Open Vercel project settings.
2. Go to Domains.
3. Add:
   - uaos.app
   - www.uaos.app
4. Configure DNS:

For apex:
A record:
@ -> 76.76.21.21

For www:
CNAME:
www -> cname.vercel-dns.com

5. Wait for HTTPS provisioning.
6. Update launch-links.json after domain is active.
