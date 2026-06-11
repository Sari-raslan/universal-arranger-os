# Fix Vercel 403 for uaos.app

The error means:
Vercel account/project is not authorized to use uaos.app yet.

Do this manually in Vercel:

1. Open:
https://vercel.com/sari-raslans-projects/keyboard-manager-clean/settings/domains
2. Add domain:
uaos.app
3. Add domain:
www.uaos.app
4. Vercel will show required DNS records.

Usually:
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com

If Vercel asks for TXT verification, add that TXT record at your domain provider.

5. Wait until Vercel says Valid Configuration.
6. Then run:
.\\scripts\\UAOS\_CONNECT\_DOMAIN\_NEXT.ps1

Temporary live URL:
https://keyboard-manager-clean-liard.vercel.app

