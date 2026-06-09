# UAOS Final Domain + Deploy Report

## Official Repository
https://github.com/aeplatform-app/universal-arranger-os-clean.git

## Primary Domain Target
aeplatform.app

## WWW Domain Target
www.aeplatform.app

## Production Hosting
Vercel production deploy attempted.

## Remaining Manual Domain Tasks

1. Open Vercel:
https://vercel.com/dashboard

2. Go to:
Project → Settings → Domains

3. Add:
aeplatform.app
www.aeplatform.app

4. Copy DNS records from Vercel.

5. Open your domain provider where you bought the domain.

6. Set DNS:

For root domain:
Type: A
Name: @
Value: 76.76.21.21

For www:
Type: CNAME
Name: www
Value: cname.vercel-dns.com

7. Wait 5–60 minutes.

8. Test:
https://aeplatform.app
https://www.aeplatform.app

## Verified Commands

Frontend build:
npm run build --prefix frontend

Backend:
npm start --prefix backend

Desktop:
npm run desktop:start

Deploy:
vercel deploy --prod --yes

## Product Missions Already Scaffolded

- Feel Sampler Engine
- Oriental Expansion
- .uaos-pack
- KORG/Yamaha/Roland/Ketron runtime direction
- Keyboard Runtime concept
- Vercel production config

## Final Launch Tasks

[ ] Add domain in Vercel
[ ] Update DNS at domain provider
[ ] Wait for SSL certificate
[ ] Test website on mobile
[ ] Test PayPal links
[ ] Test downloads/media pages
[ ] Publish WhatsApp status
[ ] Publish TikTok/YouTube/X announcement
