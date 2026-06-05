UAOS PUBLIC SITE FIX REQUIRED

1) Vercel Deployment Protection
Open:
Vercel Dashboard -> frontend project -> Settings -> Deployment Protection

Disable:
- Vercel Authentication
- Password Protection
- Trusted IPs

Test:
Invoke-WebRequest https://frontend-aeplatform-apps-projects.vercel.app -UseBasicParsing


2) DNS for aeplatform.app

Add these DNS records at your domain provider:

A Record:
Name: @
Value: 76.76.21.21

CNAME:
Name: www
Value: cname.vercel-dns.com


3) Add domains in Vercel

Project frontend -> Settings -> Domains

Add:
aeplatform.app
www.aeplatform.app


4) Verify

nslookup aeplatform.app
nslookup www.aeplatform.app

Invoke-WebRequest https://aeplatform.app -UseBasicParsing
Invoke-WebRequest https://www.aeplatform.app -UseBasicParsing
