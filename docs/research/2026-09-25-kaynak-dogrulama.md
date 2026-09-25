# Kaynak doğrulama notları (2026-09-25, ham, İngilizce)

> 7 araştırma grubu + şüpheci ikinci kontrol. Özet kararlar `docs/DECISIONS.md`, uygulanacak kurallar `docs/spec/` altındadır. Bu dosya yalnızca başvuru içindir; spec ile çelişirse spec geçerlidir.


######## GROUP adsblol

### A1 [partially_true/high]
CLAIM: adsb.lol public API is keyless/free (00-ortak-baglam: 'Anahtarsiz'); the worker sends an identifying User-Agent built from APP_NAME, DOMAIN and CONTACT_EMAIL.
FACT: Still keyless on 2026-09-25. Live GETs to /v2/point, /v2/hex and /v2/callsign returned 200 with no key. The OpenAPI spec has no securitySchemes, and the source (adsblol/api HEAD 3c969c8, 2026-06-03) has no key check. A key is still only a future plan: the live /api/openapi.json and the repo README both say 'In the future, you will require an API key which you can get by feeding to adsb.lol'. There is no key-issuing mechanism or header yet, so no key can be obtained today; feeding adsb.lol is the only route they state. A User-Agent is now ENFORCED at the edge. An empty UA and the UA 'node' both got HTTP 403 with the body 'User-Agent too generic; include valid contact info.' (tested live 2026-09-25). 'node' is exactly what Node's built-in fetch sends by default (checked on Node v24.16.0). curl/x, Mozilla/5.0 and 'app/0.1 (+url; email)' got 200. Third-party reports show this since at least 2026-08-25. The live OpenAPI description (the deployed build is older than repo HEAD) says: 'If you want to use the API for production purposes, please contact me so I do not break your application by accident.' The contact address is info@adsb.lol. /v2 responses carry NO CORS header. adsblol/api PR #63 would have added Access-Control-Allow-Origin to /v2; maintainer iakat closed it unmerged and locked it on 2026-09-25. So the browser and the mobile app cannot call adsb.lol directly: all calls must go through our backend. Cloudflare Workers egress gets 429 on the very first request. adsblol/website#272 asked about this and was closed as not planned on 2026-09-25, with no allowlist or early key offered.
CHANGE: In 00-ortak-baglam, replace 'Anahtarsiz' with: 'Anahtarsiz (2026-09 itibariyla); ileride besleyici (feeder) API anahtari zorunlu olacak - ADSBLOL_API_KEY env ve header icin yer ayir, anahtar gelince tek noktadan etkinlestir. Uretim oncesi info@adsb.lol ile iletisime gec.' In the 01 adsbLol adapter: make the User-Agent MANDATORY and set it explicitly on every fetch, because Node's default 'node' gets 403. Use a form like '<APP_NAME>/<version> (+https://<DOMAIN>; <CONTACT_EMAIL>)'. Fail startup if CONTACT_EMAIL or DOMAIN is empty. Treat 403 as a configuration error: alert and do not retry in a loop. State that web and mobile clients must NEVER call adsb.lol directly (no CORS, per-IP limits); only the worker does. Do not host ingest on Cloudflare Workers or other serverless egress.
VERIFY: finding_upheld :: Upheld, with small refinements. I re-tested live on 2026-09-25 (14:21-14:40Z) from a residential Turkish IP.

Key status:
- The API is still keyless. The live /api/openapi.json has components.schemas only: no securitySchemes and no security block.
- The spec and the README say only 'In the future, you will require an API key which you can get/obtain by feeding'. The README line dates from 2026-02-21 (commit 91f54d0). Repo HEAD is 3c969c8 (2026-06-03).
- There is no key-issuing route or header today.
- The ToS text in the spec says 'You can use the API for free' and 'If you want to use the API for production purposes, please contact me so I do not break your application by accident'. The privacy page gives the contact as info[at]adsb.lol.

User-Agent filter:
- An empty UA and the UA 'node' get nginx HTTP 403 (text/html) with 'User-Agent too generic; include valid contact info.'
- 'node' is exactly what Node v24.16.0's built-in fetch/undici sends. I confirmed this with a local echo server.
- Refinement: the check is a narrow blocklist, not real contact-info validation. 'Mozilla/5.0', 'curl/8.9.1', 'axios/1.7.7', 'python-requests/2.32.3' and even 'myapp/1.0' all got 200.
- The prompt's identifying UA (APP_NAME + DOMAIN + CONTACT_EMAIL) is still correct and courteous. It must be set explicitly in the worker, because Node's default UA is rejected.
- The earliest third-party report I found is NIKX-Tech/karshipta PR #202 (merged 2026-08-25).

CORS:
- /v2 responses carry no Access-Control-Allow-Origin header, even when an Origin header is sent. OPTIONS on /v2 returns 405.
- adsblol/api PR #63 ('Allow cross-origin reads of public v2 responses', by vasilyevstan) was closed WITHOUT merge by iakat on 2026-09-25 and then locked. The page shows 'Closed ... wants to merge 1 commit'. (A WebFetch summary wrongly said 'merged'; the raw HTML shows Closed.)
- So browser and mobile clients cannot call /v2 directly; everything must go through our backend.

Cloudflare Workers issue (adsblol/website#272):
- Opened 2026-09-24T05:50Z.
- Closed as NOT_PLANNED by iakat at 2026-09-25T01:45:09Z.
- Locked by the adsblol org 10 s later with lockReason 'SPAM'.
- It asked for an allowlist, a quota or early API-key access; none was granted.
- The claim that Workers get 429 on the first request is the reporter's own claim; the maintainer never confirmed it.

### A2 [partially_true/high]
CLAIM: adsb.lol data is ODbL and therefore usable for a public, later paid (commercial) app; attribution reads 'adsb.lol katkicilari (ODbL)'; track history is stored for 7 or 30 days (01, section 3).
FACT: License: ODbL 1.0 covers the API and all data ADSB.lol makes public. This is stated in the OpenAPI info.license, the API description and the website pages (docs/open-data/api, re-api, historical). Feeders waive their rights to adsb.lol under CC0 (privacy-license page). Commercial use: ODbL section 3 grants rights that 'explicitly include commercial use'. No adsb.lol page, README or spec forbids commercial or paid use. Equally, none grants anything beyond ODbL. There is no separate ToS beyond 'You can use the API for free' plus the as-is, no-warranty and indemnification text. Obligations: (a) Produced Works (map, flight pages, push notifications, screenshots) only need a notice that makes people aware the content came from ADSB.lol and is available under ODbL, ideally linked (s.4.3). Share-alike does NOT apply to Produced Works (s.4.5b). (b) The stored track-history and positions DB is a Derivative Database, because it extracts substantial contents and adds derived fields. If it is Publicly Used, including serving Produced Works from it to the public, it must be licensed under ODbL (s.4.4). You must also offer recipients a machine-readable copy of the whole derivative DB, or a file of the alterations or the method used, free online or at reasonable cost (s.4.6). (c) Do not apply technological measures (DRM) to the DB unless you also offer an unrestricted copy (s.4.7). (d) Independent databases kept separate, such as users, alert subscriptions and billing, can form a Collective Database and are not affected (s.4.5a). Charging for the app or service is allowed. Two hazards: ADSB.lol calls itself an 'unfiltered' tracker, so LADD and PIA aircraft are present. The privacy page also requires users to indemnify ADSB.lol against third-party claims arising from non-conforming use.
CHANGE: Attribution text: 'Canli ucus verisi: ADSB.lol (https://adsb.lol) - ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/)', shown on the map, on flight pages and in ATTRIBUTION.md; attribute ADSB.lol, not 'katkicilar'. Add an ODbL compliance section to 00-ortak-baglam: the position and track tables are a Derivative Database under ODbL. Provide a public, free /open-data page offering a daily ODbL dump (or the documented derivation method) of stored positions and tracks derived from adsb.lol. Keep users, subscriptions and billing in separate schemas and never merge them into the ODbL dump. Monetise features, not data exclusivity. Add a docs/DECISIONS entry: 'ODbL s.4.4/4.6 obligations accepted'. In the providers registry, keep commercialUse: true and add attribution: required, shareAlike: derivativeDB.
VERIFY: finding_upheld :: Upheld, with one extension.

Licence sources:
- The live OpenAPI info.license is 'Open Data Commons Open Database License (ODbL) v1.0'. The description says ODbL covers 'the API as well as all data ADSB.lol makes public'.
- The docs pages /docs/open-data/api, /docs/open-data/historical and /docs/feeders-only/re-api each state 'License: ODbL 1.0'.
- Feeders waive their rights under CC0 (privacy-license page).
- The homepage calls ADSB.lol 'an unfiltered flight tracker with a focus on open data', so LADD and PIA aircraft appear. /v2/ladd and /v2/pia exist; dbFlags 8 = LADD and 4 = PIA.
- The privacy page disclaims warranty of 'accuracy, timeliness, completeness, reliability, or availability'. It also requires users to indemnify ADSB.lol against third-party claims arising from use 'in a manner not in conformance with the above notice'.
- No adsb.lol page restricts commercial use, and ODbL s.3 rights 'explicitly include commercial use'. A paid app is therefore allowed.

What ODbL requires here (checked against the licence text):
- s.4.3: a public Produced Work (map, screens, notifications) needs a notice that makes people aware the content came from the Database and is available under ODbL. The model notice is 'Contains information from DATABASE NAME, which is made available here under the Open Database License (ODbL)', with hyperlinks to the database and the licence. The prompt's 'adsb.lol katkıcıları (ODbL)' is acceptable only if 'adsb.lol' links to https://adsb.lol and 'ODbL' links to the licence text.
- s.4.4b/c: storing tracks (7- or 30-day retention) extracts a substantial part into a new database, which makes it a Derivative Database. The licence sets no limit on retention.
- s.4.4c: that derivative database counts as Publicly Used if any public Produced Work is made from it. Then it must stay under ODbL.
- s.4.6: we must offer recipients, free over the internet, either the whole derivative database or a file or method (for example an algorithm) describing the alterations.
- s.4.5a: user, subscription and billing tables kept separate form a Collective Database and are not affected.
- s.4.5b: Produced Works themselves are not share-alike.

Extension to the researcher's point (c): s.4.7a forbids imposing 'any terms or any technological measures' that restrict ODbL rights. It covers terms as well as DRM. So the paid app's ToS must not forbid users from reusing the ADS-B-derived data, unless an unrestricted parallel copy is offered (s.4.7b).

### A3 [wrong/high]
CLAIM: Rate limit is dynamic; honour 429 and Retry-After; adaptive token bucket starting at 1 req/s by default; P0 station circles of 60 NM refreshed every 2-5 s (01, section 6).
FACT: No numeric limit is documented. The README since 2026-02-21 says: 'Rate limits are dynamic based on the environment load. If you get 4xx errors, you are doing something wrong.' On 2026-08-25 a user asked for the exact limit after getting 429 at 7 requests in 40 s; maintainer iakat replied only 'dynamic'. Live tests from one residential Turkish IP on 2026-09-25: the 429 comes from nginx with a text/html body, NO Retry-After and no RateLimit-* headers. A 15-request burst got 429 from about the 5th request. At 1 req/s and 2 req/s, about 90% of requests got 429. After a 60 s cooldown, 1 request every 5 s gave 200, 200, 200 and then three 429s. 1 request every 2 s gave five 200s, then a 429. One transient HTTP 420 with an empty body was also seen. Cloudflare Workers egress gets 429 immediately (website#272). The sustainable budget per IP looks well under 1 request per 5 s and varies. The prompt set's 1 req/s default, 2-5 s P0 refresh and 'obey Retry-After' rule cannot work as written.
CHANGE: Rewrite 01 section 6 for adsb.lol: (1) Default start rate ADSBLOL_RPS=0.1 (1 request per 10 s), hard ceiling 0.2 rps, one global token bucket per egress IP shared by all job priorities. (2) On 429: Retry-After is usually ABSENT, so use exponential backoff with full jitter (15 s, 30 s, 60 s ... capped at 300 s), and use Retry-After only if present. Halve the rate (AIMD) and recover slowly, for example +10% per 10 clean minutes. (3) Treat 403 as a configuration or UA error, not throttling: stop and alert. Treat 420 like 429. (4) Replace per-station P0 polling at 2-5 s with ONE merged circle or multi-hex query per cycle. Target freshness is 10-20 s. Record realised freshness and show degradation in the UI. (5) The 10 km approach and touchdown alerts need sub-10 s data near a station. Make the event engine tolerate 10-30 s gaps (interpolate or predict, and use lastPosition) and document that alerts may be late. (6) Strongly recommend the user runs a feeder near the main station (LOCAL_RECEIVER_URL). That gives real-time local data, and as an adsb.lol feeder, re-api access from that IP and the future API key. (7) Fix the 'yapay 429 testi' acceptance criterion so it asserts backoff without Retry-After.
VERIFY: finding_upheld :: Upheld. The prompt is right that the limit is 'dynamic'. Its 1 req/s default, its 2-5 s P0 refresh per station and its 'obey Retry-After' rule do not match reality.

Documentation:
- The README section added in PR #57 (merged 2026-02-21) says 'Rate limits are dynamic based on the environment load. If you get 4xx errors, you are doing something wrong.'
- On 2026-08-25 user ovidiu90 reported a 429 after 7 requests in 40 s and asked for the limit. Maintainer iakat replied only 'dynamic'.
- No numeric limit is published anywhere.

My live tests on 2026-09-25, all with a valid identifying UA:
- The 429 is an nginx text/html page ('429 Too Many Requests ... nginx'). It carries NO Retry-After header and no RateLimit-* headers, so 'obey Retry-After' can never fire. Backoff must be computed by the client.
- 8 sequential requests: all 200 (slow responses, 1.7-5.6 s).
- An immediate 20-request burst: 429 from the 2nd request, with one stray 200.
- After a 90 s cooldown, 1 request every 5 s: 9 of 12 were 200, with 429s interleaved.
- 1 request every 10 s: 8 of 12 were 200, and 429s still appeared.
- Caveat: other agents in this workflow may share the same egress IP, so absolute numbers are noisy.
- I could not reproduce the researcher's transient HTTP 420; that detail is unverified.

Conclusion: the sustainable budget per IP is on the order of one request every 10 s or slower, and it varies. Several 60 NM P0 circles each refreshed every 2-5 s are not feasible. Use one or a few larger circle queries (max 250 NM) covering all stations, filter distances locally, and add jittered exponential backoff that does not depend on Retry-After.

### A4 [confirmed/high]
CLAIM: Verify v2 endpoints and parameters from /docs; use bulk multi-hex queries if supported; the response is readsb / ADSBx v2; sampleTime = now - seen_pos, where now may be s or ms (01, section 5); P2 coverage circles are up to 250 NM.
FACT: Swagger at https://api.adsb.lol/docs loads the spec from /api/openapi.json; /openapi.json returns 404. Documented GET endpoints: /v2/point/{lat}/{lon}/{radius} and its alias /v2/lat/{lat}/lon/{lon}/dist/{radius}; /v2/closest/{lat}/{lon}/{radius}, which returns a single aircraft; /v2/hex/{hex} and alias /v2/icao/{hex}; /v2/callsign/{cs}; /v2/reg/{reg} and alias /v2/registration/{reg}; /v2/type/{icaoType}; /v2/sqk/{squawk} and alias /v2/squawk/{squawk}; /v2/mil, /v2/ladd and /v2/pia, which are worldwide lists; /api/0/airport/{icao}, backed by VRS standing data; POST /api/0/routeset; /0/me and /0/my. /v2/all is not in the spec and returned 503. Radius is in NAUTICAL MILES: it maps to readsb circle=lat,lon,nmi, and the spec says integer 0-250. The live deployment accepted radius 300, returning aircraft up to about 299 NM away, and accepted a float radius such as 5.4. Repo HEAD clamps the radius to 250, so treat 250 NM as the maximum. Multi-value queries WORK: comma-separated path values are passed to readsb find_hex, find_callsign and find_reg. Verified live: 5 hexes, 144 hexes (URL about 1 kB, 143 matches) and 4 callsigns, each in one request. readsb caps find_hex at 1000 values, and find_callsign and find_reg at 1000 values or 8000 characters. adsb.lol only allows the characters a-zA-Z0-9 , = _ . - in values. Format: readsb with the jv2 flag, which is compatible with ADSBx v2; the README calls it a drop-in replacement for the ADSBx Rapid API. Top-level keys: ac[], msg, now, total, ctime, ptime. 'now' is epoch MILLISECONDS, e.g. 1790344795501 at 2026-09-25 13:59:55Z, and readsb documents jv2 now as milliseconds. A local readsb aircraft.json uses epoch SECONDS. seen_pos is the number of SECONDS before now that the position was last updated; seen is the same for the last message. So for adsb.lol, sampleTime = now - seen_pos*1000; for a local receiver, sampleTime = (now - seen_pos)*1000. When the position is more than 60 s old, lat/lon are dropped and a lastPosition object {lat, lon, nic, rc, seen_pos} appears. rr_lat/rr_lon are rough receiver-based estimates. flight is padded with spaces to 8 characters. alt_baro can be the string 'ground'. The type field gives the position source: adsb_icao, mlat, tisb_*, adsr, mode_s or other. Circle and closest queries add dst (distance in NM) and dir (bearing in degrees). dbFlags: 1 military, 2 interesting, 4 PIA, 8 LADD (readsb README-json).
CHANGE: In 01 section 5, replace 'now'in birimi ... dogrula' with fixed rules: adsb.lol v2 now is ms, so sampleTime = now - round(seen_pos*1000); readsb aircraft.json now is seconds (float), so sampleTime = round((now - seen_pos)*1000). Discard rr_lat/rr_lon. Use lastPosition only for display of stale aircraft, never for event detection. Trim flight. State that the radius is in NM with a maximum of 250, and that 10 km = 5.4 NM. Name the endpoints explicitly: /v2/point, /v2/hex, /v2/callsign, /v2/reg, /v2/type, /v2/sqk, /v2/mil, /v2/ladd, /v2/pia. For the watch-list bulk query, use /v2/hex/{h1,h2,...} with at most about 500 hexes per call and keep the URL under about 4 kB. Do not poll /v2/type or /v2/mil/ladd/pia on a schedule, because they are worldwide lists. Mark the dbFlags bits as verified: 1 mil, 2 interesting, 4 PIA, 8 LADD.
VERIFY: finding_upheld :: Upheld, with one minor correction.

Spec and endpoints:
- https://api.adsb.lol/docs loads url '/api/openapi.json'; /openapi.json returns 404.
- The spec lists: /v2/point/{lat}/{lon}/{radius} and its alias /v2/lat/{lat}/lon/{lon}/dist/{radius}; /v2/closest; /v2/hex and /v2/icao; /v2/callsign; /v2/reg and /v2/registration; /v2/type; /v2/sqk and /v2/squawk; /v2/mil, /v2/ladd and /v2/pia; /api/0/airport/{icao}; POST /api/0/routeset; /0/me and /0/my.
- Radius is an integer 0-250 in the spec. HEAD source clamps it: circle = min(int(radius), 250).
- /v2/all is not in the spec; live it returns nginx 503.

Radius behaviour live:
- The live deployment returned 173 aircraft for radius 300 around LTFM, with max dst 299.37 NM. It also accepted radius 5.4 (max dst 4.58 NM). So the deployed build differs from HEAD; treat 250 NM as the maximum.

Multi-value queries:
- A multi-hex query /v2/hex/a,b,c,d,e works live.
- In reapi.py, values are validated against ^[a-zA-Z0-9,=_\.-]+$ and 'jv2' is appended.
- readsb caps find_hex at 1000 values, and find_callsign and find_reg at 1000 values or 8000 characters.

Response format:
- Top-level keys are ac, msg, now, total, ctime and ptime.
- 'now' is epoch milliseconds, e.g. 1790346663655. readsb documents that jv2 'now' is in ms, while aircraft.json and plain API 'now' are in seconds.
- seen_pos and seen are in seconds. So sampleTime = now - seen_pos*1000 for adsb.lol, and (now - seen_pos)*1000 for a local aircraft.json.
- When lat/lon are older than 60 s, lastPosition {lat, lon, nic, rc, seen_pos} appears instead.
- flight is space-padded to 8 characters (168 of 168 in my sample).
- alt_baro can be 'ground' (5 of 173).
- Circle queries add dst (NM) and dir (degrees).
- dbFlags: 1 military, 2 interesting, 4 PIA, 8 LADD.

Correction: the 'type' list is incomplete. readsb also emits adsb_icao_nt (seen live, 5 of 173), adsr_icao, tisb_icao, tisb_trackfile, adsc, adsb_other, adsr_other and tisb_other.

### A5 [outdated/high]
CLAIM: Route estimate source = adsb.lol routeset; bulk query by callsign + position; verify the schema from /docs; show the result as 'tahmini' (02, section 2).
FACT: Endpoint: POST https://api.adsb.lol/api/0/routeset. The body is {planes: [{callsign, lat, lng}]} with 1-100 planes; the field is lng, not lon. Anything else returns 400 in the source. The spec documents the response only as a string. The real response is a JSON array of objects with: callsign, number, airline_code, airport_codes (e.g. LTFM-EDDV, or 'unknown'), _airport_codes_iata (e.g. IST-HAJ), _airports[] (name, icao, iata, location, countryiso2, lat, lon, alt_feet, alt_meters) and plausible (bool). plausible is true when the position is within max(50 NM, 20% of the route length) of the great-circle leg. The cache TTL is 1200 s when plausible and 60 s otherwise. BLOCKER, found live on 2026-09-25: routeset only returns data when the request carries Referer https://adsb.lol/ or https://globe.adsb.lol/. With no Referer, or any other Referer (including a lookalike adsb.lol domain), it returns HTTP 201 with Content-Length 0 and text/html, even for an invalid body. This edge behaviour is not in the source code and is undocumented. In practice routeset is reserved for adsb.lol's own map. Third-party server use would need Referer spoofing, which should not be done. GET /api/0/route/{callsign}/{lat}/{lng} works without a Referer, but it is hidden from the schema (include_in_schema=False), so it is unofficial. Data origin: routes and airports come from vradarserver/standing-data, the crowd-sourced VRS SDM database. Its top contributor is dirkhh (adsb.im), and its last data commit was 2026-09-20. adsb.lol loads https://vrs-standing-data.adsb.lol/routes.csv.gz and airports.csv.gz hourly. That mirror is about 4.5 MB, sits behind Cloudflare with CORS *, and also serves per-callsign JSON at /routes/{first2}/{callsign}.json. The standing-data repo LICENSE is CC0 1.0 Universal, so commercial use is allowed and no attribution is required, though crediting VRS SDM and its contributors is courteous. Route CSV columns (routes/schema-01): Callsign, Code, Number, AirlineCode, AirportCodes; AirportCodes is a hyphen-separated ICAO list that may include stops.
CHANGE: Replace 'Kaynak: adsb.lol routeset' in 02 section 2 and in 00-ortak-baglam with: 'Kaynak: vradarserver/standing-data (CC0 1.0) routes + airports CSV. Import them daily into Postgres, from GitHub or from the vrs-standing-data.adsb.lol/routes.csv.gz mirror, using ETag/If-Modified-Since. Compute plausibility locally: the position must be within max(50 NM, 20% of leg length) of the great-circle leg, as in adsb.lol plausible.py. For multi-stop AirportCodes, check the cross-track distance to every leg. Label the result tahmini.' Forbid our servers from calling api.adsb.lol/api/0/routeset or /api/0/route, since they are Referer-gated and hidden. Add 'VRS Standing Data (CC0)' to ATTRIBUTION.md. Keep the negative cache, but refresh it on each daily import instead of using a 6 h TTL.
VERIFY: finding_upheld :: Upheld that the prompt's 'use adsb.lol routeset' is not viable. Two corrections to the researcher's details follow the list.

routes.py (last changed 2026-03-13, commit dfdd419):
- POST /api/0/routeset takes {planes: [{callsign, lat, lng}]}. The model is PlaneInstance(callsign: str, lat: float, lng: float).
- An empty list or more than 100 planes returns 400.
- Responses are cached in Redis for 1200 s when plausible and 60 s when not.
- Routes and airports are loaded hourly from https://vrs-standing-data.adsb.lol/routes.csv.gz and airports.csv.gz.

Live on 2026-09-25:
- With no Referer, both a valid and an invalid body return HTTP 201, Content-Length 0, text/html.
- One verification request with Referer https://adsb.lol/ returned 200 application/json with the route array.
- So routeset is gated by Referer at the edge. Third-party use would require spoofing a Referer, which should not be done.

Correction 1: the hidden GET /api/0/route/{callsign}/{lat}/{lng} (include_in_schema=False) does NOT reliably work.
- It returned 200 only for a callsign already in the route cache (THY9VA).
- Four uncached callsigns (DLH400, BAW117, UAE4, KLM1395) returned HTTP 500 'Internal Server Error', including DLH400 at a plausible position.
- The cached answer ignores the supplied position: THY9VA queried at Sydney still returned plausible:true.
- GET /api/0/route/{callsign} sleeps 5 s, then 302-redirects to vrs-standing-data.adsb.lol/routes/{xx}/{cs}.json#deprecated.

Correction 2: do not trust 'plausible'.
- In HEAD, plausible() returns a (bool, float) tuple, and calc_plausible tests it with a bare 'if await plausible(...)'.
- A non-empty tuple is always truthy, so any route with at least 2 airports comes back plausible:true. The intended rule, max(50 NM, 20% of leg length), is not actually enforced.

Recommended source:
- Use VRS standing-data directly. The repo LICENSE is CC0 1.0 Universal; the last commit was 2026-09-20.
- The adsb.lol mirror behind Cloudflare has CORS *. routes.csv.gz is 4,500,164 bytes and airports.csv.gz 1,013,398 bytes, both last-modified 2026-09-20. Per-callsign JSON is at /routes/{first2}/{callsign}.json.
- The schema-01 callsign normalisation is documented.
- Do the plausibility check ourselves and label the result 'tahmini' (estimated).

### A6 [partially_true/high]
CLAIM: (Implicit) adsb.lol is reliable enough to be the sole primary live source for a public paid product, and polling several circles is an acceptable usage pattern.
FACT: There is no SLA. The privacy-license page says the service is provided by @iakat 'as is'. It disclaims any warranty of accuracy, timeliness, completeness, reliability or availability, and requires users to indemnify ADSB.lol. The status page is https://status.adsb.lol (Upptime, repo adsblol/status). On 2026-09-25 the api.adsb.lol monitor showed 99.95% uptime over 1 year and 96.80% all-time. That monitor hits /metrics, not /v2, so it does not measure v2 availability. Official usage guidance is sparse: 'If you get 4xx errors, you are doing something wrong'; production users should contact the operator (live spec); keys will require feeding. Feeders get the re-api (https://re-api.adsb.lol), the unfiltered readsb API of the whole network. It is reachable only from the feeding station's IP, so remote use needs a VPN or proxy. Feeders also get BEAST/MLAT raw outputs. /v2/all, the whole-world dump, is disabled (503). On 2026-09-25 the maintainer declined CORS and did not grant a Cloudflare allowlist. API behaviour changed during 2026: dynamic limits from 2026-02, and the UA 403 by 2026-08. Treat the API as best-effort and subject to change without notice. Context: airplanes.live started answering non-feeders with 403 around 2026-08; that source is already banned in the prompt set.
CHANGE: Add a 'Kaynak riski' paragraph to 00-ortak-baglam: adsb.lol is best-effort, with no SLA, dynamic per-IP limits and keys coming. The product must degrade gracefully: stale-data banner, alerts marked 'gecikmeli olabilir', and a circuit breaker. Promote LOCAL_RECEIVER_URL (the user's own readsb feeder near LTFM/LTBA or other key stations) from optional to recommended. Document in docs/ACTIVATION.md how to feed adsb.lol from that receiver, which unlocks re-api from the receiver's IP and the future API key. Add a pre-launch task: email info@adsb.lol describing the app, the request budget, the UA string and the ODbL compliance plan. Keep the provider abstraction so a paid, commercially licensed feed can be added later without refactoring. Do not rely on the /v2/all whole-world dump.
VERIFY: finding_upheld :: Upheld. adsb.lol is a best-effort service run by one person, not something a paid product can use as its only live source.

Terms:
- The privacy page says 'This service is provided by myself @iakat and it is intended to use as is'. It disclaims warranty of accuracy, timeliness, completeness, reliability and availability, and requires indemnification.
- There is no SLA.

Status monitoring:
- The status page is Upptime at https://status.adsb.lol (repo adsblol/status).
- The api.adsb.lol monitor probes https://api.adsb.lol/metrics with UA 'ADSB.lol Status Page', not /v2. Its badges on 2026-09-25: all-time 96.79%, 1y 99.95%, 30d/7d/24h 100%.
- On the same day the feed.adsb.lol:1337/1338 monitors were down and the README header showed 'Partial outage'.

Feeder-only access and closed options:
- Feeders get re-api at https://re-api.adsb.lol: the readsb API of the whole network, 'unfiltered and unmodified', ODbL.
- It is 'only accessible by your station's IP address', so remote use needs a VPN or proxy. Feeders also get BEAST/MLAT out.
- /v2/all returns 503.
- CORS PR #63 was closed unmerged and the Workers allowlist request #272 was closed as not planned, both on 2026-09-25.

Behaviour changes in 2026:
- Dynamic limits documented from 2026-02-21.
- UA 403 by 2026-08-25.
- Routeset Referer-gating observed 2026-09-25.

airplanes.live: teddywagner/overhead PR #3 (merged 2026-09-23) reports it returning 403 to non-feeders 'since ~August 2026' and moves to adsb.lol.

Practical conclusion: the only realistic route to a robust feed is to run your own ADS-B receiver(s), feed adsb.lol and use re-api and/or your own local readsb. Also contact info[at]adsb.lol before production use, and keep a pluggable second provider.

EXTRA: 1) The deployed api.adsb.lol is older than GitHub HEAD. The live spec text differs from the 2026-03-07 repo commit, and the live point endpoint accepts a radius over 250 and a float radius. Pin behaviour to what is observed live and re-verify periodically. 2) adsb.lol calls itself 'unfiltered': it serves LADD and PIA aircraft, and /v2/ladd and /v2/pia exist. The prompt set hides only military by default. For a public paid app in TR, also consider hiding or anonymising LADD (dbFlags&8) and PIA (dbFlags&4) aircraft by default. 3) Error bodies for 429 and 403 are text/html or plain text, not JSON, so the parser must check the status before JSON.parse. routeset's 201 with an empty body must not be treated as success. 4) /api/0/airport/{icao} (VRS standing data) exists, but OurAirports is still the better runway source. 5) Hostinger VPS egress was NOT tested. Datacenter IP ranges may be throttled harder than residential IPs, as happened to Cloudflare Workers. Run a 24 h soak test from the VPS at 0.1 rps before relying on it. 6) The adsblol/infra repo is stale (2023), so the edge rate-limit config is not public. 7) All live tests ran from a single residential IP on 2026-09-25 between 13:59 and 14:12 UTC; the results are indicative, not a published quota. Temporary clones were deleted after use.


######## GROUP refdata

### R1 [confirmed/medium]
CLAIM: aviationweather.gov Data API is used for METAR (every 10 min) and TAF (every 60 min) for active stations; rules: max 100 requests/minute and a custom User-Agent is mandatory. Fields to parse: QNH, wind, visibility, ceiling, raw text.
FACT: Base URL is https://aviationweather.gov/api/data. METAR is GET /api/data/metar and TAF is GET /api/data/taf, with format=json. Other formats: METAR takes raw|decoded|json|geojson|xml|iwxxm; TAF takes raw|json|geojson|xml|iwxxm. You must send either ids or bbox. ids takes one ICAO code, a comma-separated list (KMCI,KORD,KBOS) or @STATE. bbox is lat0,lon0,lat1,lon1. Other parameters: METAR has hours (default 1.5), date and taf=true (includes the TAF in the same response); TAF has metar, time=valid|issue and date. The docs page quotes the limit as 'All requests are rate limited to 100 requests per minute' and warns that exceeding it gets you blocked. Most endpoints return at most 400 entries. The docs say to 'Set a custom user agent to prevent automated filtering inadvertently blocking valid traffic'; that is a strong recommendation, not an enforced error. No API key is needed. For bulk data there are gzipped cache files: /data/cache/metars.cache.csv.gz and .xml.gz, updated every minute, and /data/cache/tafs.cache.xml.gz, updated every 10 min. API responses carry Cache-Control max-age=60. Live check on 2026-09-25: ids=LTFM,LTBA,LTAI&format=json returned objects with icaoId, obsTime (epoch s), reportTime, temp, dewp, wdir, wspd, visib ('6+'), altim, clouds[{cover,base}], cover, fltCat, rawOb, lat, lon, elev and name. altim is always in hPa: KJFK 'A3010' came back as altim=1019.4, so no inHg conversion is needed. The TAF JSON has rawTAF, issueTime, validTimeFrom/To and a fcsts[] array. One bbox query covering Turkey (36,26,42,45) returned 63 METARs. RECENT CHANGE: the Data API was redeveloped and replaced the old services on about 3-5 September 2025. The /cgi-bin/ paths were removed (use /api/data). Undocumented parameters were dropped: recent, order, vfr, output, filter and fields on METAR; recent, order, vfr, output and filter on TAF. HTML output was removed, TAF CSV was removed, metar_id was removed from METAR JSON, and fltCat plus the clouds/cover fields were added. The OpenAPI spec is labeled v4.0 and the site footer shows v4.31. The upcoming-changes feed was empty on 2026-09-25, so no further Data API change is announced (the only 2026 item found is a WIFS schema change around 8 Sep 2026, which does not affect METAR/TAF).
CHANGE: In 02-parca-2 section 3, replace the rules with: base URL https://aviationweather.gov/api/data; GET /metar?ids=<comma list>&format=json and GET /taf?ids=<comma list>&format=json. Batch all active stations into one request (up to 400 results each) or use bbox; do not make one request per station. Set a descriptive User-Agent with a contact address. Keep the whole service under 100 req/min with a token bucket, and respect Cache-Control max-age=60. If you later go global, download /data/cache/metars.cache.csv.gz (every minute) and /data/cache/tafs.cache.xml.gz (every 10 min) instead of API calls. JSON QNH is the 'altim' field and is already in hPa. Ceiling comes from clouds[] (lowest BKN/OVC/OVX base, with OVX meaning vertical visibility). Do not use /cgi-bin paths or the removed parameters (recent, order, vfr, output, filter, fields); they were dropped in the September 2025 overhaul.

### R2 [confirmed/medium]
CLAIM: Import OurAirports airports.csv and runways.csv on first start and then daily; OurAirports data is public domain. The engine uses runway threshold positions (distance to ARP and runway thresholds).
FACT: Download URLs are https://davidmegginson.github.io/ourairports-data/airports.csv and https://davidmegginson.github.io/ourairports-data/runways.csv. Files have lived on GitHub since 3 Nov 2021 and are regenerated nightly; Last-Modified was 2026-09-25 01:54 GMT. License: 'All data is released to the Public Domain, and comes with no guarantee of accuracy or fitness for use.' The GitHub repo carries the Unlicense. runways.csv columns: id, airport_ref, airport_ident, length_ft, width_ft, surface, lighted, closed, le_ident, le_latitude_deg, le_longitude_deg, le_elevation_ft, le_heading_degT, le_displaced_threshold_ft, he_ident, he_latitude_deg, he_longitude_deg, he_elevation_ft, he_heading_degT, he_displaced_threshold_ft. Units are feet and degrees true. The le_/he_ lat/lon is the centre of each runway end, not necessarily the displaced threshold; displacement is given separately in feet. airports.csv columns: id, ident, type, name, latitude_deg, longitude_deg, elevation_ft, continent, iso_country, iso_region, municipality, scheduled_service, icao_code, iata_code, gps_code, local_code, home_link, wikipedia_link, keywords. COVERAGE, measured on 2026-09-25: 48,267 runways, but only 15,696 (33%) have le_ coordinates and 3,069 have a displaced threshold value. Both endpoints are present for 1,842 of 1,942 large_airport runways (95%), 4,921 of 5,608 medium_airport runways (88%) and 4,718 of 5,727 runways at scheduled-service airports (82%). Turkish (LT*) runways: 105 of 118 have coordinates. There are 86,135 airports, 9,054 of them with an IATA code.
CHANGE: Keep OurAirports, with a precise description (public domain / Unlicense, attribution appreciated but not required). In 01-parca-1 or 02-parca-2, add these steps. (1) Filter by type in (large_airport, medium_airport) or scheduled_service=yes, and use icao_code, falling back to gps_code/ident. (2) Build the runway threshold as le_/he_ lat/lon moved along le_heading_degT by displaced_threshold_ft x 0.3048 m. (3) If the endpoint coordinates are missing (about 5-18% of relevant runways), fall back to the airport ARP (latitude_deg/longitude_deg) with a wider touchdown tolerance, and record the fallback in the event data. (4) Skip rows with closed=1. (5) Treat le_elevation_ft or elevation_ft as field elevation for the AGL calculation. (6) Download with If-Modified-Since/ETag so the daily cron is cheap. (7) Add an admin override table for runways, as already planned for airlines.

### R3 [outdated/high]
CLAIM: Airline IATA-to-ICAO code and callsign-prefix mapping comes from OpenFlights airlines data (ODbL; give attribution).
FACT: LICENSE: the openflights.org data page says 'The OpenFlights Airport, Airline, Plane and Route Databases are made available under the Open Database License. Any rights in individual contents of the database are licensed under the Database Contents License.' That is ODbL for the database and DbCL for the contents; the GitHub repo code is AGPL-3.0. ODbL permits commercial use but requires attribution. Any adapted database you make public must stay under ODbL (share-alike), which reaches beyond a UI credit if you expose an enriched airline table through a public API. OpenFlights also sells separate commercial licenses ('flat fee of US$100' for simple cases). STALENESS: the page says 'As of January 2012 ... 5888 airlines'. The GitHub copy of data/airlines.dat was last changed on 2017-02-02 ('Update data exports'); earlier updates were 2014. The page calls the GitHub copy 'only a sporadically updated static snapshot'. The file (about 6,162 lines) has no AJet (ICAO TKJ / IATA VF, launched 2024); the only 'Ajet' in it is a defunct Cypriot carrier, AJY. Pegasus PGT/PC/SUNTURK is present, and active flags are unreliable. BETTER FREE ALTERNATIVES: (a) Virtual Radar Server standing-data, airlines/schema-01/airlines.csv. License CC0-1.0, about 5,964 rows, columns Code, Name, ICAO, IATA, PositioningFlightPattern, CharterFlightPattern. It is actively maintained (airlines last committed 2026-07-27) and includes TKJ AJet VF and THY Turkish Airlines TK. It has no telephony callsign column. The same repo also has CC0 routes (callsign to route, updated 2026-09-20), aircraft, model-type, code-blocks and registration-prefixes. (b) Wikidata, CC0 ('All structured data ... is released into the public domain under Creative Commons Zero'). Properties: P230 ICAO airline designator, P229 IATA airline designator, P432 callsign of airline. A live SPARQL query found 3,627 entities with P230, 2,756 of them with P432 (e.g. THY/TK/TURKISH, PGT/PC/SUNTURK, TKJ/VF/AJET). Quality caveat: AJet also carries historical THY/TK values, so filter on preferred rank and end-time qualifiers. (c) FAA Order JO 7340.2P 'Contractions', Chapter 3 (ICAO Aircraft Company / Telephony / Three-Letter Designator). It is a US Government work (public domain in the US), is the authoritative telephony list, and is current. It was issued 2025-08-01 per search results, Chg 2 is dated 3/19/26 and a consolidated PDF with Chg 1-3 is dated 7-9-26. It is distributed only as PDF/HTML, so it must be parsed, and faa.gov returned 403 to automated fetch. (d) Wikipedia 'List of airline codes' is CC BY-SA 4.0 (share-alike text), so it is not preferred. (e) The npm 'airline-codes' package (npow) is just OpenFlights data with no license; avoid it. ICAO Doc 8585 and the IATA Airline Coding Directory are authoritative but paid.
CHANGE: In 00-ortak-baglam line 60 and 02-parca-2 section 1, replace 'OpenFlights airlines verisi (ODbL; atıf ver)' with: 'Birincil: VRS standing-data airlines/schema-01/airlines.csv (CC0; ICAO, IATA, ad; haftalık çek). Telsiz çağrı adı (telephony) için: Wikidata SPARQL P230/P229/P432 (CC0; sadece preferred rank ve bitiş tarihi olmayan değerler). İsteğe bağlı doğrulama: FAA JO 7340.2 Bölüm 3 (ABD kamu malı). OpenFlights kullanılmaz (2017 sonrası güncellenmiyor, ODbL share-alike).' Keep the admin override table. Note that IATA codes are not unique (VRS says so explicitly), so for TK1985 to THY1985 prefer the ICAO code of the carrier that is currently active and flying, and resolve ambiguous IATA codes with the override table or live callsign evidence. Update the attribution list in 00-ortak-baglam lines 74-77: remove OpenFlights, and credit VRS standing data and Wikidata as a courtesy (CC0 needs no attribution). Optionally note that the VRS routes/ folder (CC0) can cross-check the adsb.lol routeset.
VERIFY: finding_upheld :: UPHELD with corrections. The prompt's plan to rely on OpenFlights for airline IATA/ICAO/callsign mapping is outdated, and ODbL obligations go further than the prompt suggests.

(1) LICENSE, verified. openflights.org/data.php says the Airport, Airline, Plane and Route databases are under the Open Database License, with individual contents under the Database Contents License. The repo's data/LICENSE is the ODbL text and the repo code is AGPL-3.0. Commercial licenses are 'available on request', and simple cases are 'a flat fee of US$100'.

(2) SHARE-ALIKE CORRECTION. The researcher implies share-alike bites only if you expose an enriched table through an API. It reaches further. The ODbL summary says: 'If you publicly use any adapted version of this database, or works produced from an adapted database, you must also offer that adapted database under the ODbL.' Section 4.6 requires offering either the full derivative database or a file of the alterations. So if you patch or merge OpenFlights rows (for example, adding AJet) and only show the result in a public web or mobile UI, you still owe the adapted DB or an alterations file. Only unmodified use as part of a 'Collective Database' avoids this.

(3) STALENESS, verified. The page says 'As of January 2012 ... 5888 airlines' and calls the GitHub copy 'only a sporadically updated static snapshot'. data/airlines.dat was last committed 2017-02-02 ('Update data exports'); before that, 2014-09-27, 2014-08-06 and 2014-01-16. The file has 6,162 lines. It has no AJet TKJ/VF; the only 'Ajet' is a defunct Cypriot carrier, AJY/AYJET, marked N. Pegasus is PGT/PC/SUNTURK. More staleness: Turkish Airlines' callsign in OpenFlights is 'TURKAIR', but the FAA JO 7340.2P telephony is 'TURKISH'.

(4) VRS standing-data, verified. It is CC0-1.0. airlines/schema-01/airlines.csv has 5,964 data rows and the columns Code, Name, ICAO, IATA, PositioningFlightPattern and CharterFlightPattern, with no telephony column. It contains TKJ AJet VF, THY Turkish Airlines TK, PGT Pegasus PC and SXS SunExpress XQ. The airlines file was last committed 2026-07-27. Routes get near-daily commits; the latest seen is 2026-09-20. The repo also has aircraft, airports, code-blocks, countries, model-type and registration-prefixes. The data is a dump of user-contributed SDM data, and corrections go through the SDM site, not PRs.

(5) WIKIDATA, verified, with a quality correction. It is CC0 ('All structured data ... is released into the public domain under Creative Commons Zero'). P230 is ICAO airline designator, P229 IATA airline designator and P432 callsign of airline. A live SPARQL query gave 3,627 entities with P230, 2,756 of them also with P432. However, the researcher's example 'TKJ/VF/AJET' is itself a data error. The FAA JO 7340.2P chapter 3 HTML lists 'AJET HAVA TASIMACILIGI ANONIM SIRKETI / TURKEY / ANATOLIA / TKJ', and Wikipedia also gives callsign ANATOLIA. Also, all of AJet's P229/P230/P432 statements are Normal rank, so a 'preferred rank' filter does nothing here. You must filter on end-time (P582) and start-time (P580) qualifiers: THY/TK end 2024-01-01, TKJ/VF start 2024-01-01. Cross-check callsigns against the FAA list.

(6) FAA JO 7340.2P, verified, with refinements. The FAA orders page shows 'Date issued 2025-08-01' (search snippets give effective 2025-08-07). Chg 1 is dated 11/27/25, Chg 2 3/19/26 and Chg 3 7/9/26; the HTML edition shows 'Effective: 7/9/2026, Change 3'. Between changes, FAA issues JO 7340.9xx notices that amend 3-letter designators and callsigns, which a parser should also track. Chapter 3 is 'ICAO Aircraft Company Three-Letter Identifier and/or Telephony Designator Assignments'. Its HTML tables (chap3_section_1..4.html) parse easily, and faa.gov returns 403 only to some automated fetchers: plain curl with a browser User-Agent got HTTP 200. It is a US Government work (public domain in the US).

(7) The npm 'airline-codes' package (npow): the claim that it has 'no license' is imprecise. package.json declares ISC, but the repo has no LICENSE file. It is actively republished (v1.1.6 on 2026-09-08) and syncs weekly from the stale OpenFlights GitHub snapshot, and an ISC label cannot relicense ODbL data. The advice to avoid it stands.

(8) Wikipedia is CC BY-SA 4.0. ICAO Doc 8585 and the IATA coding directory are paid. Not re-verified in depth; no contradicting evidence found.

AJet context: it got its own AOC in January 2024 and has operated as AJet (VF/TKJ) since 2024-04-01.

RECOMMENDATION: use VRS standing-data (CC0) for the ICAO/IATA mapping, FAA JO 7340.2P chapter 3 for telephony callsigns, and Wikidata only as a supplement, filtered by qualifiers. Drop OpenFlights, or keep it unmodified as a collective database with attribution.

### R4 [confirmed/medium]
CLAIM: The map style comes from the MAP_STYLE_URL env, defaulting to OpenFreeMap; OpenStreetMap / OpenMapTiles / OpenFreeMap are credited.
FACT: OpenFreeMap public instance: 'Using our public instance is completely free: there are no limits on the number of map views or requests.' There is 'no registration, no user database, no API keys, and no cookies'. The FAQ answers 'Is commercial usage allowed?' with 'Yes'. There is no SLA ('I don't offer SLA guarantees or personalized support'). The ToS was updated 2026-09-09 and says the site is provided as-is, 'may discontinue it at any time without notice', and prohibits automated data collection without permission, i.e. no bulk scraping or offline tile harvesting. Required attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap'. The OpenFreeMap part is optional but appreciated; the OpenMapTiles and OSM parts are required. The MapLibre default attribution control shows it from the style. Style URLs (all HTTP 200 on 2026-09-25): https://tiles.openfreemap.org/styles/liberty, /bright, /positron, /dark (background rgb(12,12,12); a true dark style exists) and /fiord (dark blue-grey, #45516E). All use vector source https://tiles.openfreemap.org/planet (OpenMapTiles schema) plus Natural Earth raster at z<=6. The site lists a '3D' option, but /styles/3d returns 404; it appears to be Liberty with 3D buildings, not a separate URL (unverified). Tiles are regenerated weekly; the code is MIT and self-hostable (Ubuntu 24.04 with Btrfs, full planet images). RECENT CHANGE: after the wplace.live surge on 8-9 Aug 2025 (100k req/s, 3B requests per day), the author said he would add per-Referer bandwidth limits 'like 100 million requests per 24 hours' and advised heavy users to self-host. The current published terms state no numeric limit. Alternatives: MapTiler Cloud's Free plan is 'Suitable for testing, PoC, prototyping, personal, or non-commercial use' (5k map sessions/month, logo required, service pauses when exceeded), so it is NOT usable commercially for free. Flex is $30/month for 25k sessions plus $2.50 per 1k extra. MapTiler's OpenMapTiles planet downloads for self-hosting are a separate commercial product. Protomaps self-host: daily v4 planet PMTiles builds at maps.protomaps.com/builds (about 120 GB, z0-15), served as one static file from the VPS or object storage, or cut to a regional extract with the pmtiles CLI. Licenses: BSD for code/styles; the tiles are an ODbL Produced Work that needs OSM attribution. @protomaps/basemaps flavors: light, dark, white, grayscale, black. The hosted Protomaps API needs a key and 'is free for non-commercial use'; commercial use requires GitHub sponsorship.
CHANGE: In 00-ortak-baglam line 28, make it explicit: 'MAP_STYLE_URL varsayılan https://tiles.openfreemap.org/styles/liberty (açık tema); koyu tema için MAP_STYLE_URL_DARK=https://tiles.openfreemap.org/styles/dark (alternatif: fiord). Atıf metni haritada her zaman görünür: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap". SLA yoktur; production/ücretli sürümde Protomaps planet PMTiles (BSD + ODbL, OSM atfı) ile Dokploy üzerinde self-host veya OpenFreeMap self-host yedek planı olarak tanımlanır. MapTiler Free ticari kullanıma kapalıdır; kullanılacaksa Flex ($30/ay) gerekir.' Add a feature flag or env var so the web and Expo apps can switch the style without a code release. Do not pre-cache or scrape OpenFreeMap tiles for offline use (ToS). For the mobile app, note that native MapLibre requests may carry no Referer header, so any future per-referer limiting is untested there; keep the self-host fallback ready.

EXTRA: 1. Hostinger KVM 2 and Protomaps self-hosting: the full planet PMTiles file is about 120 GB, which probably will not fit comfortably next to Postgres/PostGIS on a KVM 2 disk (about 100 GB NVMe). Either cut a regional extract with the pmtiles CLI (Turkey/Europe) and fall back to OpenFreeMap elsewhere, or put the planet file on cheap object storage (Cloudflare R2 or Hetzner) behind a CDN. I did not verify current Hostinger disk sizes.
2. aviationweather.gov: the METAR endpoint takes taf=true, which returns both products in one call; the TAF endpoint takes metar=true. The prompt's 10-min METAR / 60-min TAF schedule is well within limits if stations are batched: one bbox call covering Turkey returned 63 stations. /api/data/airport and /api/data/stationinfo also exist, but OurAirports is the better runway source. ICAO/WMO METAR/TAF data is generally public, but AWC offers no SLA, so cache the last good METAR and show its age in the UI.
3. VRS standing-data (CC0) also has routes/ (callsign to route, updated 2026-09-20), aircraft/, model-type/ and code-blocks/ folders. It is a free, commercially usable complement or fallback to the adsb.lol routeset used in 02-parca-2 section 2 and to aircraft-type lookups. I did not verify the routes schema.
4. Wikidata airline data has quality issues (AJet also lists the historical THY/TK values). Query with preferred rank or exclude statements that have an end time (P582), and keep the admin correction table.
5. The FAA JO 7340.2P pages at faa.gov returned HTTP 403 to automated fetch; its version and dates come from search-result titles and URLs (7340.2P_Chg_2_dtd_3_19_26.pdf and 7340.2P_Bsc_w_Chg_1_2_and_3_dtd_7-9-26_Final.pdf).
6. OpenFreeMap may add per-referer limits (announced as a plan in August 2025). I could not confirm whether they are implemented yet; the current ToS (2026-09-09) states no numeric limit.


######## GROUP readsb_and_banned

### B1 [confirmed/low]
CLAIM: readsb dbFlags bits: 1 military, 2 interesting, 4 PIA, 8 LADD (00-ortak-baglam line 79)
FACT: The readsb README-json.md (dev branch, last touched 2026-04-26) says verbatim: "dbFlags: bitfield for certain database flags, below & must be a bitwise and ... military = dbFlags & 1; interesting = dbFlags & 2; PIA = dbFlags & 4; LADD = dbFlags & 8;". The same page says the field is only present when readsb runs with --db-file, using the tar1090-db aircraft.csv.gz. In live adsb.lol data (2026-09-25) the key is left out when it would be 0: normal THY and Pegasus aircraft had no dbFlags key, while /v2/mil returned dbFlags 1 (360 aircraft) and 3 (1 aircraft). The airplanes.live OpenAPI also documents "Bitfield: 1=military, 2=interesting, 4=PIA, 8=LADD."
CHANGE: Keep the bit values. Add to the normalizer spec: treat a missing dbFlags as 0 (the key is left out when 0), and test with bitwise AND, e.g. (dbFlags & 8) !== 0 for LADD. Do not use equality checks, because a single aircraft can have several bits set (value 3 = military + interesting was seen live).

### B2 [partially_true/medium]
CLAIM: sampleTime = now - seen_pos; the unit of 'now' may be seconds or ms depending on the source (01-parca-1 line 68). The parser should handle alt_baro 'ground', missing fields and seen_pos.
FACT: The claim is directionally right, but the unit can be pinned down; it does not need to be left open. (a) readsb aircraft.json: 'now' is "in seconds since Jan 1 1970 00:00:00 GMT (the Unix epoch)", a float. (b) readsb --net-api-port output: 'now' is "the time the api data was cached" in seconds. With &jv2 ("compatible with adsbexchange v2 API output") it is "same as normal BUT in milliseconds", and the response also carries total, ctime and ptime (ms). (c) adsb.lol /v2/* returns this ADSBx-v2 envelope: a live call returned {msg:'No error', now:1790344805501, total:16, ctime:1790344805501, ptime:0}, so now is an integer in ms (= 2026-09-25 14:00:05.501 UTC). The airplanes.live OpenAPI likewise says now is "Cache time, milliseconds since the Unix epoch." The same envelope is documented for ADSB One/api-archive (example now 1675633671226). (d) seen_pos: "how long ago (in seconds before \"now\") the position was last updated" (float, e.g. 1.222). seen: "how long ago (in seconds before \"now\") a message was last received". So for v2 APIs, sampleTime_ms = now - seen_pos*1000. (e) alt_baro: "the aircraft barometric altitude in feet as a number OR \"ground\" as a string". This was seen live: 21 aircraft in /v2/mil had alt_baro 'ground', with no track/alt_geom/baro_rate and with gs + true_heading instead. (f) Other field definitions: alt_geom in ft, referenced to the WGS84 ellipsoid. gs: ground speed in knots. track: true track over ground, 0-359 deg. baro_rate / geom_rate: ft/min. nav_qnh: "altimeter setting (QFE or QNH/QNE), hPa". category: "values A0 - D7". emergency: none|general|lifeguard|minfuel|nordo|unlawful|downed|reserved, a superset of the 7x00 squawks. squawk: "encoded as 4 octal digits" (a string, e.g. "5325"). r: registration from the DB. t: ICAO type from the DB. desc is optional (long type name). "Keys will be omitted if data is not available." (g) lastPosition {lat,lon,nic,rc,seen_pos} appears when lat/lon are older than 60 s. hex can start with '~' (a non-ICAO address, e.g. from TIS-B). flight is padded to 8 characters with trailing spaces.
CHANGE: In 01-parca-1 line 68, replace the 'saniye ya da milisaniye olabilir' hedge with: "adsb.lol / ADSBx-v2 uyumlu API'lerde `now` milisaniye (int); readsb aircraft.json'da saniye (float). `seen_pos` ve `seen` her zaman saniye (float). sampleTime_ms = now_ms − round(seen_pos×1000). Yine de birim sezgisel kontrolü (now > 1e12 ⇒ ms) ekle." Also add to the parser spec: alt_baro === 'ground' ⇒ on_ground=true, alt_baro=null. Keys can be missing, so every field must be optional in the Zod schema. Trim the flight value. Treat a hex starting with '~' as non-ICAO. Fall back to lastPosition when lat/lon are absent. On the ground, use true_heading when track is absent. Keep squawk as a string.
VERIFY: finding_upheld :: The researcher's refinement holds. The prompt line in 01-parca-1 (line 68) is also correct as written: the unit of `now` really does depend on the source, and it can be pinned down per source. (a) readsb aircraft.json, the format of the optional LOCAL_RECEIVER_URL: `now` is "the time this file was generated, in seconds since Jan 1 1970 00:00:00 GMT (the Unix epoch)". It is a float in seconds. (b) readsb --net-api-port with default syntax: `now` is "the time the api data was cached", in seconds, and the count field is `resultCount`, not `total`. With `&jv2` ("compatible with adsbexchange v2 API output") it becomes "now: same as normal BUT in milliseconds", with `total` and `ptime` (ms). The readsb README does not document `ctime`, but it does appear in hosted v2 responses. (c) adsb.lol /v2/*: I re-ran the calls live on 2026-09-25. /v2/point/41.26/28.74/25 returned {msg:'No error', now:1790345264001, total:18, ctime:1790345264001, ptime:0}, and 1790345264 s = Fri 2026-09-25 14:07:44 UTC. /v2/mil returned now:1790345297501, a Python int. So on the v2 APIs `now` is an integer in milliseconds. The airplanes.live OpenAPI (openapi 3.1.0, info.version 2.0.0, server https://api.airplanes.live) says `now`: "Cache time, milliseconds since the Unix epoch." and `ctime`: "Cache time, milliseconds." The ADSB One / api-archive README example has now:1675633671226. (d) `seen_pos` = "how long ago (in seconds before \"now\") the position was last updated". It is a float in seconds even when `now` is in ms. `seen` means the same for the last message. So the correct formula is: sampleTime_ms = now_ms - round(seen_pos*1000) for v2 APIs, and round((now_s - seen_pos)*1000) for aircraft.json. A safe normaliser: if now > 1e12, treat it as ms, otherwise as seconds. (e) alt_baro is "the aircraft barometric altitude in feet as a number OR \"ground\" as a string". I confirmed this live: 13 of 353 /v2/mil aircraft had alt_baro 'ground' at my fetch time (the researcher saw 21; the count is live and varies). None of those 13 had track, alt_geom or baro_rate. Correction to the researcher: gs and true_heading are NOT reliably present on ground aircraft. Only 6 of 13 had gs and only 4 of 13 had true_heading, so treat both as optional. The trace format also notes that when altitude is "ground" the track slot holds true heading. (f) The field definitions match the README verbatim: alt_geom is in ft, referenced to the WGS84 ellipsoid; gs is in knots; track is 0-359 deg true; baro_rate and geom_rate are in ft/min; nav_qnh is "altimeter setting (QFE or QNH/QNE), hPa"; category takes "values A0 - D7"; emergency is one of none, general, lifeguard, minfuel, nordo, unlawful, downed, reserved; squawk is "encoded as 4 octal digits" and is a string on the wire (e.g. '3676'). r and t come from the DB, and desc is optional (--db-file-lt). The README states "Keys will be omitted if data is not available." (g) lastPosition {lat, lon, nic, rc, seen_pos} appears when lat/lon are older than 60 s. I saw 16 such aircraft live, one with seen_pos 748.241, so the parser must read seen_pos from inside lastPosition in that case. hex "may start with '~'" (non-ICAO, e.g. TIS-B). flight is 8 characters, space-padded, and can be all spaces ('        ') live, so after trimming, an empty string must become null. Also treat r, t, squawk, lat/lon and seen_pos as possibly absent.

### B3 [partially_true/high]
CLAIM: airplanes.live, adsb.fi and the OpenSky free tier carry non-commercial terms and are prohibited as data sources (00-ortak-baglam line 63)
FACT: All three do restrict commercial use today, but OpenSky's restriction is wider than 'free tier' and should be restated. (1) adsb.fi open data README (last commit 2026-05-17): "adsb.fi open data is for personal, non-commercial use only. You may not license, sell, rent, or lease any part of the data or the service." It also says "You must cite adsb.fi and include a link to our home page." Limits: public endpoints 1 req/s, feeder /v2/snapshot 1 req/30 s. The README adds: "Please contact us if you have commercial or higher request rate requirements." (2) airplanes.live Terms (AirDG LLC, last updated August 10, 2025) license content "for your personal, non-commercial use or internal business purpose only". They also say "The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us", and they forbid systematically retrieving data to build a database without written permission. The old API guide (archived Jan 2026) had banners reading "No SLA / No Uptime Guarantee / Non-Commercial Use" and "rate limited to 1 request per second". The site was redesigned in 2026. The API is now documented at airplanes.live/api-docs (OpenAPI 2.0.0, server api.airplanes.live, /v2/hex, /v2/callsign, /v2/point..., plus /rest/v1/ref/*) and no longer shows the banner, but the Terms still apply. Its 'Commercial Use' page (archived 2026-07-19) said 'Commercial Use Access' via email and "Airplanes.live RapidAPI coming soon". That page now returns 404, so there is no public commercial price. (3) OpenSky Network General Terms of Use & Data License Agreement: the license is "solely for the purpose of non-profit research and non-profit education". "Any use by a for-profit or commercial entity requires written permission and a license", and "Operational use of the REST API in any live product, service, or automated system also requires a written license, regardless of the entity's non-profit status." Clause 3(vi) reads: "The REST API is provided for non-profit research and educational use only." This covers every tier, including paid-free registered and feeder accounts, not only the free tier. The API docs say: "If you want to retrieve live flight information for commercial purposes, please contact us at contact [at] opensky-network.org". The REST API now accepts only OAuth2 client credentials ("Basic authentication with username and password is no longer accepted"). Daily credit quotas are: anonymous 400, standard 4,000, active feeder 8,000, and 'Licensed user' 14,400 hourly. So a licensed tier exists, but its price is not published. (4) For comparison, ADS-B Exchange sells a 'Community API' at $10/month for 10,000 requests via RapidAPI, marked "Non-commercial use". Commercial use needs its Enterprise API, where the price is on request.
CHANGE: In 00-ortak-baglam line 63, replace 'OpenSky'nin ücretsiz katmanı' with 'OpenSky REST API (hangi katman olursa olsun; canlı üründe/otomatik sistemde kullanım ve kâr amaçlı her kullanım yazılı lisans gerektirir)'. Keep airplanes.live and adsb.fi on the prohibited list, and note that both invite commercial inquiries by email (contact@airplanes.live; adsb.fi 'contact us'), so they are possible later licensed sources. Add a 'later / paid options' note: OpenSky licensed tier (price on request), ADS-B Exchange Enterprise API (price on request; the $10 Community API is non-commercial, so do not use it), airplanes.live commercial (announced, RapidAPI 'coming soon', not live). Because adsb.fi requires citation, this matters only if adsb.fi is licensed later.
VERIFY: finding_upheld :: All three sources restrict commercial use today, and OpenSky's restriction is wider than 'free tier'. The ban in the prompt should read: 'OpenSky REST API in any tier without a written commercial license'. (1) adsb.fi: the README in github.com/adsbfi/opendata says, verbatim, "adsb.fi open data is for personal, non-commercial use only. You may not license, sell, rent, or lease any part of the data or the service." It also requires "You must cite adsb.fi and include a link to our home page." Rate limits: public endpoints 1 req/s, feeder endpoint (/v2/snapshot) 1 req every 30 s. "Please contact us if you have commercial or higher request rate requirements." The latest commit is dated 2026-05-17 (committedDate 2026-05-17T19:36:36+03:00). (2) airplanes.live: the Terms (Termly-hosted, rendered on airplanes.live/terms-of-use) are from AirDG LLC dba Airplanes.live, Wyoming, "Last updated August 10, 2025". Content is licensed "for your personal, non-commercial use or internal business purpose only". "The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us", and users may not "Systematically retrieve data ... to create or compile ... a database ... without written permission". The archived /api-guide/ (Wayback 2026-01-12) had the banners "No SLA / No Uptime Guarantee / Non-Commercial Use" and said "rate limited to 1 request per second". /api-guide/ and /commercial-use/ both now return HTTP 404. The archived /commercial-use/ (2026-07-19) said "Commercial Use Access [email]" and "Airplanes.live RapidAPI coming soon", so no public commercial price exists. The new /api-docs/ (Stoplight, spec v2.0.0, server api.airplanes.live) shows no non-commercial banner or rate limit. One caveat to add: the OpenAPI `info.license` is "Apache-2.0", but that covers the spec document, not the data. The Terms still govern data use, so do not read Apache-2.0 as permission for commercial use. (3) OpenSky: the General Terms of Use & Data License Agreement grant a license "solely for the purpose of non-profit research and non-profit education". It continues: "Any use by a for-profit or commercial entity requires written permission and a license", and "Operational use of the REST API in any live product, service, or automated system also requires a written license, regardless of the entity's non-profit status." Clause 3(vi) reads: "The REST API is provided for non-profit research and educational use only." This covers every tier, not only anonymous or free. The API docs say to contact contact[at]opensky-network.org for live data used commercially. Authentication: "OpenSky exclusively supports the OAuth2 client credentials flow. Basic authentication with username and password is no longer accepted." Per-endpoint credit quotas: Anonymous 400/day, Standard 4,000/day, Active feeder (>=30% uptime) 8,000/day, Licensed user 14,400/hour. The price of the licensed tier is not published. (4) ADS-B Exchange Developer Hub: the "Community API (formerly API Lite) is built for non-commercial use" and costs $10/mo for 10,000 requests via RapidAPI ("Personal Use Aircraft Data API"). For commercial use: "If you ... need commercial use, we have Enterprise options". No enterprise price is shown on the page. Net result: the prompt's ban on these sources is correct and should stay. Only the OpenSky wording needs to widen from 'free tier' to 'any tier, unless there is a written commercial/operational license'.

### B4 [confirmed/high]
CLAIM: Scraping Flightradar24 / FlightAware is prohibited (00-ortak-baglam line 64)
FACT: Both ToS explicitly forbid it. Flightradar24 Terms of Service (last updated June 23rd 2026), clause 2.3: "With the exception of the FR24 API, you may only access the Services via a human-operated web browser or mobile application, and not with any program, collection agent, or 'robot' for any purpose, including the purpose of automated retrieval, display of content or 'scraping' of data or information." Clause 10.3 also bans reverse engineering and "'scraping' of the Services". Clause 2.1 limits the basic right to "personal, non-commercial use". Even the paid FR24 API (Explorer/Essential/Advanced), clause 6.3, prohibits "Developing competing services or products based on the information or insights gathered from our data" and "Using the FR24 API to supplement or backfill any other near-time or real-time flight data sourced from an alternative data provider". It also forbids persistent local copies beyond the documented caching windows. So FR24's paid API is also unusable for a competing tracker. FlightAware Terms of Use (last updated July 16, 2026) say: "With the exception of FlightAware data feeds and APIs, you may only access the Website with a human-operated interactive web browser and not with any program, collection agent, or 'robot' for any purpose, including the purpose of automated retrieval, display of content, or 'scraping' of data or information." They also say: "All no-charge, web-based FlightAware products, APIs, and data are licensed solely for personal use". Paid AeroAPI/Firehose data is governed by separate license terms.
CHANGE: Keep the prohibition. Expand line 64 to: 'Flightradar24 / FlightAware sitelerinden veri kazımak (ToS md. 2.3 / FA ToS açıkça yasaklar) ve FR24 API'yi bu projede kullanmak (FR24 API şartları rakip ürün geliştirmeyi ve başka kaynağı doldurmayı yasaklar). FlightAware AeroAPI/Firehose ancak ayrı ticari lisansla, rakip ürün kısıtları incelendikten sonra değerlendirilebilir.' Also add to CLAUDE.md that the agent must never add FR24/FA endpoints, unofficial libraries (e.g., unofficial FR24 Python/JS wrappers) or their tile/feed URLs to the codebase.

EXTRA: 1) adsb.lol, the primary source, states its terms inside its own OpenAPI spec (https://api.adsb.lol/api/openapi.json, info.description): \"You can use the API for free. In the future, you will require an API key which you can get by feeding to adsb.lol. If you want to use the API for production purposes, please contact me so I do not break your application by accident.\" The license is ODbL v1.0 for the API and all data. The prompt set should (a) plan for a future API-key requirement (config + header plumbing), (b) tell the user to contact the adsb.lol maintainer before going public/paid, and (c) keep the ODbL attribution and share-alike obligations in mind for any derived public database, such as track history exports. Routeset lives at /api/0/routeset and airport data at /api/0/airport/{icao}. The live /v2/point responses also include non-readsb fields dst (distance in NM) and dir (bearing). 2) readsb README also documents rr_lat/rr_lon, rough positions from receiver location that are not usable for the 10 km proximity rule, and 'type' values such as mlat, tisb_*, adsc and other. The event engine should consider down-weighting or ignoring mlat/other/rr positions for touchdown detection. 3) The airplanes.live site was redesigned in 2026: the old /api-guide/ and /commercial-use/ URLs now return 404, and the API docs moved to /api-docs/ (Stoplight, backed by /openapi.yaml). Any prompt text linking to old airplanes.live URLs is stale. 4) The OpenSky docs contain a note addressed to LLMs asking them not to request whitelisting. It is informational only and no action was taken on it. 5) FR24's 2026 terms also forbid using its paid API in 'flight-critical' decision systems and forbid backfilling other feeds. This rules out a hybrid 'adsb.lol + FR24 API' design, even under a paid license. 6) Verification was done 2026-09-25 with live API calls to adsb.lol (/v2/point and /v2/mil, one call each) and by reading the pages cited. I did not call the airplanes.live or adsb.fi APIs, out of respect for their terms. Scratch copies of the fetched docs are in the session scratchpad. They are not needed by the caller.


######## GROUP commercial_providers

### C1 [partially_true/high]
CLAIM: Prompt set implicitly treats Flightradar24 only as a scraping target to avoid (00-ortak-baglam 'Yasak: Flightradar24/FlightAware gibi sitelerden veri kazımak') and puts 'Ticari veri sağlayıcı entegrasyonu' out of scope; developer asks whether FR24's official API could feed the platform.
FACT: FR24 has an official API at fr24api.flightradar24.com (base https://fr24api.flightradar24.com/api, Bearer token, header Accept-Version: v1). Plans (docs/credit-overview): Explorer $9/mo, 30,000 credits, 10 req/min, 30 days history; Essential $90/mo, 333,000 credits, 30 req/min, 2 years history; Advanced $900/mo, 4,050,000 credits, unlimited history (docs say 90 req/min; the subscriptions page says 200/min). Max results per response: Explorer 20, Essential 300, Advanced unlimited. PROMO: credits doubled (60k/666k/8.1M) for billing cycles starting on or before 2026-12-31 23:59 UTC. Credit cost per returned flight: live positions light 6, full 8; flight summary light 1 (live)/2/3; full 2/3/6; flight tracks 40; historic positions 6/8; airports full 50; /count endpoints cost 15% of the full endpoint; an empty response costs 1. Top-ups cost about $0.0003 per credit. Data: live positions (with orig/dest and eta), flight summary (actual takeoff/landing times, runways, diverted destination, from 2022-06-01), historic positions/events, tracks, airports and airlines. It has NO scheduled times, gates or delays. Sandbox: free, static responses. Terms (ToS updated 2026-06-23, clause 6.3): commercial use is allowed at every plan level, but you may not (a) use FR24 API data to 'supplement or backfill' near-real-time data from another provider, (b) develop 'competing services or products' based on FR24 data, (c) store raw data beyond the documented limit (docs/storage-rules: 30 days for all endpoints), or (d) redistribute raw data. Enriched data is allowed only if 'the data itself not being the main selling point' (6.3.2). Public products must credit Flightradar24 (8.2). Cost check: one national snapshot of ~300 aircraft with light positions costs 1,800 credits, so Essential covers roughly 185 snapshots a month. That rules it out as a live-map feed.
CHANGE: Add to 00-ortak-baglam 'Yasak olanlar': 'Flightradar24 resmi API'si de kullanılmaz: FR24 ToS 6.3.1 rakip hizmet geliştirmeyi ve başka bir gerçek zamanlı sağlayıcının verisini tamamlamayı (adsb.lol ile karıştırmayı) yasaklar; ham veri 30 günden fazla tutulamaz.' In docs/DECISIONS.md, record FR24 API as evaluated and rejected, with the ToS date 2026-06-23.
VERIFY: finding_upheld :: Upheld, with small corrections. Checked against the embedded page data of the FR24 API portal on 2026-09-25. The API uses base https://fr24api.flightradar24.com/api, Bearer auth and the header Accept-Version: v1.

Plans (docs/credit-overview):
- Explorer: $9/mo, 30,000 credits, 10 queries/min, 30 days of history.
- Essential: $90/mo, 333,000 credits, 30 queries/min, 2 years (730 days) of history.
- Advanced: $900/mo, 4,050,000 credits, 90 queries/min in the docs but 200/min in the subscriptions-page feature matrix, with unlimited history.
- Response limit per request: 20 (Explorer), 300 (Essential), unlimited (Advanced).
- Every plan carries commercial=1.
- Not mentioned by the researcher: the /count endpoints and Airports full are NOT available on Explorer.

Promo 'CREDITS PROMO 2026' (runs 2026-06-01 to 2026-12-31 23:59 UTC): monthly subscription credits are doubled for billing cycles starting on or before that date.

Credit costs:
- Live positions: light 6, full 8.
- Flight summary: light 1 (live), 2 (≤30 days), 3 (older); full 2, 3, 6.
- Historic positions: 6 (light), 8 (full).
- Historic events: light 2/3, full 3/4.
- Flight tracks: 40.
- Airports: light 1, full 50.
- /count endpoints: 15% of the matching full endpoint, rounded up.
- An empty response costs 1 credit.

Top-up price: $0.0003 per credit is the MAXIMUM. Larger packages cost less, e.g. $300 for 1,210,000 credits ($0.000248).

Flight summary data starts at 2022-06-01.

Data coverage, a precision fix: there are no scheduled times and no delays. The researcher's 'no gates' is too strong. Historic flight-events include gate_departure and gate_arrival events with gate_ident, gate_lat and gate_lon, all nullable and derived from ADS-B. Live positions full includes orig/dest and eta. These are not published gate assignments.

Sandbox: free of credits, static responses, query parameters ignored. It needs an account and its own sandbox key.

Storage (docs/storage-rules): all endpoints are limited to 30 days, after which data must be deleted.

ToS (last updated 23 June 2026), clause 6.3.1: commercial use is permitted at each subscription level, but the following are prohibited:
- reselling, redistributing or manipulating raw data;
- 'Using the FR24 API to supplement or backfill any other near-time or real-time flight data sourced from an alternative data provider';
- 'Developing competing services or products based on the information or insights gathered from our data';
- storage beyond the documented limits.

Clause 6.3.2 allows enrichment and derivative datasets if the user adds 'significant value to the data and/or the data itself not being the main selling point'. It is 'and/or', not only the second condition.

Clause 8.2 requires commercial or public products to 'clearly reference and credit Flightradar24'.

Cost check confirmed: 300 aircraft × 6 = 1,800 credits, so 333,000 credits give about 185 national snapshots a month (about 370 under the promo). That is still useless for a live map.

### C2 [partially_true/high]
CLAIM: Prompt set bans FlightAware only as a scraping target and excludes commercial providers. The question is whether FlightAware AeroAPI is a viable licensed source for schedule data (STA/ETA, gates, delays, flight-number mapping) for a public, paid B2C app.
FACT: AeroAPI v4 (REST, header x-apikey, base https://aeroapi.flightaware.com/aeroapi/) has three tiers. Personal: no minimum, first $5/mo of usage free ($10 for ADS-B feeders), 10 result sets/min, 'personal or academic purposes only', no history and no alerts. Standard: $100/mo minimum usage fee, 5 result sets/sec, history, Alerts, B2C commercialization allowed, B2B not. Premium: $1,000/mo minimum, 100 result sets/sec, B2B allowed, Foresight predictions, Aireon space-based ADS-B, 99.5% SLA. Billing is per result set (1 set = 15 records). Examples: GET /flights/{ident} $0.005; /flights/{id}/position $0.010; /flights/{id}/track $0.012; /flights/search $0.05; /airports/{id}/flights/scheduled_arrivals and /arrivals $0.005; /airports/{id}/flights $0.02; /history/flights/{ident} $0.02; push alert delivery $0.02. Volume discounts start above $1,000/mo. Data includes scheduled_on/estimated_on/actual_on (and off/out/in), gate_origin/gate_destination, terminals, delays, filed route, tracks, and history back to 2011. This is the schedule layer ADS-B lacks. License terms (Standard License, Jan 2025): item 7 allows embedding in 'a flight tracking application sold on an application store'. BUT 'Shall Not' #10 bars using AeroAPI data 'in conjunction with or as a backfill to data sourced from any other real-time or near-realtime flight data provider without the prior written permission of FlightAware' (this covers adsb.lol). #9 limits raw data storage to 30 days (derivative works may be kept indefinitely). #6 bars removing FlightAware notices; brand guide applies. The Personal tier cannot legally power a public app.
CHANGE: Keep AeroAPI out of v1 code, but in 04 RUNBOOK 'yeni sağlayıcı ekleme' and DECISIONS add: 'AeroAPI Standard ($100/ay minimum, B2C izinli) tarife/kapı/gecikme için birinci aday; ancak lisans madde 10 gereği adsb.lol verisiyle birlikte kullanmak için FlightAware'den YAZILI İZİN alınmadan entegre edilmez; ham veri ≤30 gün saklanır; Personal katmanı üretimde yasak.' Extend the providers license registry with fields mixingWithOtherRealtimeAllowed, maxRawStorageDays and b2cDisplayAllowed.
VERIFY: finding_upheld :: Upheld. The AeroAPI OpenAPI spec (version 4.17.1) gives server https://aeroapi.flightaware.com/aeroapi and header x-apikey.

Tiers (aeroapi page):
- Personal: no minimum; up to $5/mo free ($10 for ADS-B feeders); 10 result sets/min; 'personal or academic purposes only'; no history, no alerts.
- Standard: $100/mo minimum; 5 result sets/sec; history (capped at 500,000 history result sets/month, a detail the researcher omitted); alerts; B2C commercialization Yes, B2B No; email support.
- Premium: $1,000/mo minimum; 100 result sets/sec; B2B; Foresight and Aireon space-based ADS-B (contact to enable); 99.5% uptime.

Billing: one result set = 15 records.

Prices per result set:
- /flights/{ident} $0.005
- /flights/{id}/position $0.010
- /flights/{id}/track $0.012
- /flights/search $0.050
- /airports/{id}/flights $0.020
- /airports/{id}/flights/arrivals and /scheduled_arrivals $0.005 each
- /history/flights/{ident} $0.020
- Push alert delivery $0.020

Volume discounts start above $1,000/mo (30% for $1–2K, rising to 94% above $64K).

The schema includes scheduled/estimated/actual on/off/out/in times, gate_origin/gate_destination, terminals, and departure_delay/arrival_delay. History goes back to January 1, 2011.

Standard License (Jan 2025, the newest found):
- May #7: 'a flight tracking application sold on an application store usable by any individual consumer'. Note that May #9 (third-party provision) says 'without additional fee or charge to such third-parties', so a paid app relies on #7.
- Shall Not #10: no use 'in conjunction with or as a backfill to data sourced from any other real-time or near-real-time flight data provider without the prior written permission of FlightAware'.
- Shall Not #9: raw data may be kept at most 30 days; derivative works may be stored in perpetuity.
- Shall Not #6: FlightAware notices may not be removed.
- Also Shall Not #8, which the researcher did not flag: no use of AeroAPI Data 'for commercial aircraft situational displays'. This most likely means operational or cockpit displays, but it is worth confirming with FlightAware.

The Personal tier cannot power a public app.

### C3 [partially_true/medium]
CLAIM: Prompt set builds its own approach (10 km) and touchdown (ALDT) detection from ADS-B (Parça 2 olay motoru). Question: can FlightAware AeroAPI alerts serve as a push-style shortcut for 'landed/arrived' notifications?
FACT: AeroAPI Alerts are available on Standard and Premium, not Personal. Setup: first PUT /alerts/endpoint (account-wide webhook URL), then POST /alerts with ident/origin/destination/aircraft_type/start/end, optional per-alert target_url, and an events object with boolean flags filed, departure, off, out, on ('touches down on runway'), in ('enters arrival gate'), arrival (bundled), diverted and cancelled. There is also 'eta' (minutes before ETA; only after the flight has been airborne for 15 minutes). Deliveries arrive as POSTs with event_code in {filed, departure, arrival, out, off, on, in, diverted, cancelled, minutes_out, change, ...}. Alert CRUD is free; each delivered alert costs $0.020. max_weekly defaults to 1,000 (Standard) or 4,000 (Premium) estimated triggers per alert config, so an airport-wide arrival alert for IST (~700 arrivals/day) would exceed the default. Limits for our use: there is NO distance-based (10 km) trigger, only time-before-ETA. Delivery goes to your server, not to user devices, so you still need FCM/APNs/Web Push. License #10 (no mixing with other real-time providers without written permission) still applies. Rough cost: ~3 deliveries (eta, on, in) per followed flight is about $0.06, so 1,000 followed flights/month is about $60, inside the $100 Standard minimum.
CHANGE: In Parça 2, add an optional 'AlertProvider' port (disabled unless an env var is set, as ACTIVATION requires) that can take AeroAPI 'on'/'in'/'eta' webhooks as a confirmation or fallback when ADS-B coverage is lost at low altitude, and record them as a separate source with confidence. Keep the 10 km approach event ADS-B-derived (AeroAPI cannot trigger on distance). Do not enable this before FlightAware's written permission to combine with adsb.lol.
VERIFY: finding_upheld :: Upheld, per the AeroAPI OpenAPI v4.17.1.

Setup: PUT /alerts/endpoint sets the account-wide callback and must be done before POST /alerts, otherwise the API returns 400. POST /alerts takes ident, origin, destination, aircraft_type, start and end dates (in the departure airport's timezone), an optional per-alert target_url, eta, and an events object. The events object has required booleans: arrival, cancelled, departure, diverted, filed, out, off, on ('when aircraft touches down on runway') and in ('when aircraft enters arrival gate').

eta = minutes before ETA; 'Alerts will only be delivered after the flight has been in the air for at least 15 minutes'.

The delivery callback's event_code enum is: filed, departure, arrival, out, off, on, in, diverted, cancelled, position_only_arrival, position_only_departure, fru_arrival, nonairport_arrival, nonairport_departure, nonairport_filed, minutes_out, power_on, change.

Pricing: alert CRUD and endpoint calls cost $0.000; each push delivery costs $0.020 per result set.

max_weekly default: 1,000 (Standard) or 4,000 (Premium). The researcher did not note that this is only a check at creation or modification time. It 'does not prevent alerts from being delivered', and it can be set explicitly to a higher value. So an airport-wide IST arrival alert (about 700 arrivals a day, roughly 4,900 a week) would be rejected under the default but can be allowed by raising max_weekly.

There is no distance or geofence trigger. Delivery goes to your server, so FCM/APNs/Web Push are still needed. Alerts are Standard/Premium only, and license clause #10 on mixing with other real-time providers still applies.

The cost estimate (about 3 deliveries per followed flight, about $60 for 1,000 flights, inside the $100 Standard minimum) is arithmetically sound. I could not load the FlightAware support article (403); the facts rest on the OpenAPI spec and the pricing page.

### C4 [confirmed/medium]
CLAIM: Prompt set bans non-commercial ADS-B aggregators (airplanes.live, adsb.fi, OpenSky free tier). ADS-B Exchange is not mentioned. Question: is ADSBx usable commercially?
FACT: The ADS-B Exchange Community API (via RapidAPI, adsbexchange-com1) costs $10/mo for 10,000 requests, plus $0.0015 per extra request and a bandwidth platform fee over 10,240 MB. It is explicitly 'for personal and non-commercial use', so it is forbidden under DATA_USAGE_MODE=commercial. For commercial use there are Enterprise products: Live Positions ('every 250 milliseconds', API or gRPC streaming), Live Operations (departure/arrival context, localized ≤50 nm), Daily Positions and Daily Operations (CSV/JSON), with historical backfill up to 10 years. They are sold as 'subscription services with minimum annual commitments'. Pricing is not public (contact sales). The data is ADS-B only: no airline schedules, gates or delays.
CHANGE: Add 'ADS-B Exchange Community/RapidAPI API (ticari olmayan)' to 00 'Yasak olanlar'. In the RUNBOOK list ADSBx Enterprise Live Positions as a quote-only commercial upgrade path for positions (same readsb/v2 JSON family).

### C5 [partially_true/medium]
CLAIM: Prompt set has no schedule source (arrival board shows only ADS-B-derived ETA and 'tahmini kalkış meydanı'). Aviationstack is a candidate for cheap commercial schedule/status data.
FACT: Aviationstack (APILayer/Idera) plans: Free $0, 100 requests/mo, non-commercial. Basic $49.99/mo ($44.99 annual), 10,000 requests. Professional $149.99 ($131.99 annual), 50,000. Business $499.99 ($424.99 annual), 250,000. Enterprise custom. Commercial use is allowed on all paid plans. Overage runs $0.019996 down to $0.00799984 per call depending on plan. Endpoints (docs last modified 2026-07-16): /v1/flights (real-time, all plans), plus historical via flight_date, /v1/flight_schedules and /v1/flightsFuture (Basic+), /v1/routes (Basic+), and airports/airlines/airplanes/aircraft_types/cities/countries/taxes. Flight objects carry departure/arrival scheduled/estimated/actual times, terminal, gate and delay, and a 'live' object (latitude, longitude, altitude, speed). Status is 'updated within 30–60 seconds'. The live positions are not an ADS-B map feed. There are no webhooks or alerts. Redistribution: no API-specific clause. The linked Idera Terms of Use (2019) are generic site terms. Commercial display in your own app is marketed as allowed.
CHANGE: In RUNBOOK/DECISIONS, list Aviationstack as a low-cost schedule/board option: about Professional $149.99/mo to poll arrivals for 5 stations every ~5 min. Get written confirmation from APILayer that public B2C display is allowed, since the ToU are generic.
VERIFY: finding_upheld :: Upheld, with one correction on the governing terms.

Pricing (aviationstack.com/pricing):
- Free: $0, 100 requests/mo, commercial use No.
- Basic: $49.99/mo ($44.99 billed annually), 10,000 requests, overage $0.019996.
- Professional: $149.99 ($131.99), 50,000 requests, overage $0.0119992.
- Business: $499.99 ($424.99), 250,000 requests, overage $0.00799984.
- Enterprise: custom.
- Commercial use: Yes on all paid plans.

Docs (contentUpdatedAt Thu, 16 Jul 2026):
- /v1/flights (real-time or historical): All Plans.
- flight_date historical, /v1/flight_schedules, /v1/flightsFuture and /v1/routes: Basic and above. The OpenAPI names the schedule path /v1/timetable.
- Airports, airlines, airplanes, aircraft_types, cities, countries, taxes: All Plans.
- Marketing text: 'updated within 30–60 seconds from the source'.

The flight schema has departure and arrival blocks with terminal, gate, delay, scheduled/estimated/actual, estimated_runway/actual_runway and baggage. It also has a per-flight live object: updated, latitude, longitude, altitude, direction, speed_horizontal, speed_vertical, is_ground. There is no bbox map feed, and the docs mention no webhooks.

Correction on terms: the pricing and FAQ pages link to ideracorp.com/legal/APILayer. That page hosts the APILayer 'Master Software as a Service Subscription Agreement' (Ver. 082523, i.e. Aug 2023), which is the operative subscription contract, not only the generic Idera Terms of Use (updated Nov 1, 2019). The SaaS agreement has no explicit display or redistribution clause. It does state that APILayer and its licensors own the Licensed Material 'and all derivatives thereof', and that the licence is a limited right to use. The FAQ markets the API as suitable for commercial applications.

### C6 [partially_true/medium]
CLAIM: Same gap (schedules/gates/delays not in ADS-B). AirLabs is a candidate low-cost commercial provider.
FACT: AirLabs (Data Products Ltd) homepage pricing: Free $0 for 1,000 queries, 'Personal Use', limited data. Developer $49/mo for 25,000 queries (0.2¢ each), Commercial Use. Business $99/mo for 100,000 (0.1¢), Commercial Use. Enterprise $499/mo for 1,000,000 (0.05¢), Commercial Use. Endpoints: Real-Time Flights (lat/lng/alt/dir/speed/v_speed/squawk/status/updated, bbox and zoom filtering; some fields not in Free), Live Schedules (airport departures/arrivals with estimated times, gates, terminals, delays), Flight Information, Routes, Fleets, Airlines/Airports, Nearby, Suggest. Flight Alert API (beta, paid plans only) sends webhooks when gate/terminal/ETA/status/delay/baggage fields change; each webhook counts against quota. Its typical lag is '1-10 minutes' versus airport displays. The upstream data source is not disclosed. ToS (last updated 2021-07-20) has no explicit redistribution or display clause.
CHANGE: List AirLabs Business ($99/mo, 100k queries) as the cheapest commercial schedule/board option in RUNBOOK. Require written confirmation of B2C display rights and data provenance before use. Do not use its real-time positions for 10 km or touchdown events (provenance and latency unknown).
VERIFY: finding_upheld :: Upheld, with two corrections. Pricing comes from AirLabs' live pricing endpoint (airlabs.co/api/v9/pricing, which the homepage loads).

Plans:
- Free: $0, 1,000 queries, 'Personal Use'. It includes Real-Time Flights and Live Schedules; 'Limited Data'.
- Developer: $49/mo ($45/mo annual), 25,000 queries, 0.2¢ each, Commercial Use.
- Business: $99/mo ($75/mo annual), 100,000 queries, 0.1¢ each, Commercial Use.
- Enterprise: $499/mo ($475/mo annual), 1,000,000 queries, 0.05¢ each, Commercial Use.

The flights endpoint is branded 'Flight Tracker API (also known as Live ADS-B Data API)'. It supports bbox and zoom (0–11). Fields include lat, lng, alt, dir, speed, v_speed, squawk, dep/arr, status and updated; some fields are marked 'Available in the Free plan'. The upstream ADS-B provider is still not named.

Flight Alert API (Beta): 'Early access to the beta is only available for paid plans'. It sends webhooks when fields change: dep_terminal, dep_gate, dep_estimated, arr_terminal, arr_gate, arr_baggage, arr_estimated, status, duration, dep_delayed, arr_delayed, arr_iata, arr_icao. Each webhook is 'subtracted from your account's total request quota'. The docs note delays of 'usually 1-10 minutes' compared with airport displays.

ToS (Data Products Ltd, 'Updated 07/20/2021') has no API redistribution or display clause. Correction 1: every API response carries a 'terms' string: 'Reselling data 'As Is' without AirLabs.Co permission is strictly prohibited.' Correction 2: the ToS has a generic ban on robots and on copying 'material on Service'.

### C7 [partially_true/low]
CLAIM: Same gap. Aviation Edge is a candidate commercial provider.
FACT: Aviation Edge (Clearsky Ltd): Developer $299/mo, 30,000 calls. Business $599/mo, 100,000 calls. Business Gold $1,499/mo, 500,000 calls. Unlimited: contact sales. The first month is discounted ($7/$15/$39), then it auto-renews at full price. Free API keys have been discontinued ('Due to abuse of our Free API keys'). APIs: Flight Tracker, Real-time/Historical/Future Schedules, Routes, Nearby, Autocomplete and others. Tracker positions update 'within short intervals of just a few minutes' and are partly synthesized: 'use of flight schedules to anticipate the location and fill in the gaps'. That makes them unsuitable for proximity or touchdown detection. Terms (updated 2025-06-30) §4.2 allow use 'within your own applications' but forbid distributing the data and building a product 'substantially similar to or replicates the Services'. Attribution is only 'appreciated' (§4.5).
CHANGE: none. If mentioned at all, list it as poor value ($299/mo minimum) and do not use its tracker for events.
VERIFY: finding_upheld :: Upheld. Aviation Edge is run by Clearsky Ltd.

Pricing (premium-api page):
- Developer: $299/mo, 30,000 calls.
- Business: $599/mo, 100,000 calls.
- Business Gold: $1,499/mo, 500,000 calls.
- Unlimited: contact sales.
- The first month is $7/$15/$39, then it auto-renews at full price.
- Inconsistency: the free-api-key page instead quotes $15/$29/$79 for the first month.

Free keys are discontinued: 'Due to abuse of our Free API keys, we have decided to no longer offer this feature.'

The tracker updates 'within short intervals of just a few minutes'. Its data is 'collected through ADS-B systems as well as the use of flight schedules to anticipate the location and fill in the gaps where needed'. That makes it unsuitable for 10 km proximity or touchdown detection.

Terms (Effective Date 30 June 2025), §4.2: use 'for internal commercial purposes or within your own applications or systems'. Prohibited items include: 'Resell, sublicense, lease, lend, or distribute the data'; 'Scrape, crawl, or build derivative databases using our data' (the researcher omitted this one); and building a product that 'functions substantially similar to or replicates the Services'. Under §4.5, attribution is only 'appreciated'.

### C8 [partially_true/low]
CLAIM: Enterprise providers (Cirium) are implicitly out of reach. Question: do they offer a small-startup path?
FACT: Cirium (FlightStats Flex / Cirium Sky APIs) offers a free Evaluation plan: 30 days, max 20,000 total requests. By-airport, FIDS and Flights Near are capped at 1,000 each, Flight Alerts at 500, Historical at 100 returned flights. After that there are two options. The Commercial plan is self-serve with a credit card and volume-based pay-per-use, but covers only standard APIs: Flight Status/Track by Flight, Flights Near, Scheduled Flights by Flight, reference, Delay Index, Ratings, Weather. The Contract plan is required for Premium APIs: Flight Status by Airport/Route, Scheduled Flights by Airport, Flight Track by Airport, Flight Alerts, Batch Alerts, FIDS, Historical, Flight Status Data Feed. Per-query prices are not public (shown only after login). This matters here because airport arrival boards and push alerts are contract-only.
CHANGE: none for v1. In RUNBOOK note: 'Cirium: havalimanı panosu ve alert API'leri yalnızca sözleşmeli (Premium) plan; fiyat teklif ile.'
VERIFY: finding_upheld :: Upheld, from the Cirium Developer Studio evaluation page and the plan-table data in its JS bundle.

Evaluation plan: 'Valid for only 30 days', 'Maximum of 20,000 total requests'. The following are 'limited to 1.000 requests each': Flight Status by Airport, Flight Track by Airport, Flights Near, Scheduled Flights by Airport, FIDS and Flight Features API. Other caps: Connections API 500, Historical Flight Status 100 flights returned, Flight Alerts 500. It includes both standard and premium APIs.

Commercial plan: self-serve by credit card, 'volume-based pricing (you pay for what you use)', billed monthly. Standard APIs only: Flight Status by Flight, Flight Track by Flight, Flights Near, Scheduled Flights by Flight, Reference, Delay Index, Ratings, Weather.

Contract plan ('Priced per contract') is required for Premium APIs: Flight Status by Airport, Flight Status by Route, Historical Status, Scheduled Flights by Airport, Scheduled Flights by Route, Connections, Flight Track by Airport, Flight Alerts, FIDS, Batch Alerts, Flight Status Data Feed. The researcher left out Scheduled Flights by Route and Connections.

Converting from evaluation to the commercial plan immediately disables trial access to premium APIs. The developer.flightstats.com pricing page requires sign-in, so per-query prices are not public.

New nuance: Cirium's API catalog describes Flight Track by Airport, Flight Track by Flight and Flights Near as 'Powered by FlightRadar24'.

### C9 [partially_true/low]
CLAIM: Enterprise providers (OAG) are implicitly out of reach. Question: do they offer a small-startup path and push alerts?
FACT: OAG Developer Portal (rebuilt in 2026) offers Flight Info (schedules from 900+ airlines 'updated every 15 minutes', real-time status, gates, delays, seats), Schedules, Master Data and Connections. Flight Info Alerts push schedule and status changes via HTTP push or Azure Event Hubs, with a free 28-day trial. Trial subscriptions are auto-confirmed. Full subscriptions need OAG approval (1-2 business days). Charging is 'a fixed fee based on your usage tier, with a charge per hit above your usage limit'. Prices are not published (quote-based). No live aircraft position/ADS-B product is listed in the developer API catalog. The old RapidAPI listing now returns 'User not found'.
CHANGE: none for v1. In RUNBOOK list OAG Flight Info + Alerts as an enterprise, quote-based schedule/alert source (no positions).
VERIFY: finding_upheld :: Mostly upheld, but the finding misses the 2026 free tier and contains one unverified claim.

The OAG Developer Portal (developers.oag.com, © 2026) lists these APIs: Flight Info API (v2), Flight Info Alerts (v1), Connections API (v1), plus reference data (Locations, Carriers, Equipment). What's New entries date from 12 Mar, 16 Apr and 10 Jun 2026. On 12 Mar 2026 Flight Info Alerts added 'HTTP Push as an alternative delivery method alongside Azure Event Hub'. Alerts push schedule and status updates, including schedule changes up to two years ahead. No live aircraft position or ADS-B product is listed.

oag.com/flight-info-api says schedules from 900+ airlines are 'updated every 15 minutes', with gate, delay and cancellation data.

Charging (KB, updated 2024-09-23): 'a fixed fee based on your usage tier, with a charge per hit above your usage limit'. No public prices.

Corrections:
1. The portal now states: 'OAG offers a free tier that lets you explore our aviation APIs with a limited number of API calls per month. No credit card required.' The KB article 'Flight Info API – Requesting a Trial' (updated 2026-09-07) says the free tier's limits are per API and reset every 30 days. Access is provisioned after clicking subscribe in the portal.
2. The 'trial auto-confirmed / full subscription activated in 1–2 business days' process comes from an older KB article (updated 2024-09-13). It may still apply to paid tiers.
3. The '28-day free trial' for Flight Info Alerts could NOT be verified on any OAG page I could load.
4. I did not verify the 'portal rebuilt in 2026' or the RapidAPI 'User not found' claims.

### C10 [partially_true/medium]
CLAIM: Prompt set (00 'Bilinçli olarak kapsam dışı: Ticari veri sağlayıcı entegrasyonu'; 03 board columns: sefer/çağrı kodu, tescil, tip, tahmini kalkış meydanı, mesafe, ETA, durum; 02 flight lookup by 'sefer no' via callsign derivation and adsb.lol routeset marked 'tahmini') delivers FR24-premium-like features with ADS-B data only.
FACT: This is consistent with licensing: nothing in the ADS-B-only design needs schedule data, and the board columns avoid STA, gates and delays. The consequence is that FR24-premium-parity items (scheduled vs actual times, delay minutes, gate/terminal, reliable flight-number to aircraft mapping before departure, 'next flight' for a flight number) cannot be delivered from adsb.lol alone. Every verified commercial source with schedule data either costs $49-$150+/mo (AirLabs, Aviationstack), has a $100/mo minimum (AeroAPI Standard), or is quote-only (Cirium, OAG, ADSBx Enterprise). The two most feature-rich ones (FR24 API, AeroAPI) contractually restrict mixing with other real-time feeds: FR24 prohibits it outright, and AeroAPI requires written permission. The 02 prompt's 'belirli bir tarih ya da bir sonraki uçuş' follow-by-flight-number feature has no schedule source, so it can only resolve once a matching callsign is airborne or transmitting.
CHANGE: In 02 §'Uçuş takibi', state that a flight-number follow for a future date stays 'bekliyor' until a matching callsign appears in ADS-B, and that the UI says so. In 00 add a DECISIONS item: 'Tarife/kapı/gecikme verisi v1'de yok; ScheduleProvider arayüzü packages/providers'ta tanımlı ama kapalı; adaylar: AirLabs, Aviationstack, AeroAPI Standard (yazılı karıştırma izni şartıyla).' Extend the license registry schema with mixingAllowed, maxRawStorageDays and b2cDisplay.
VERIFY: finding_upheld :: Upheld in substance. The prompt set (00 lines 56, 62–64, 108–111; 03 line 89; 02 line 122) uses only ADS-B/adsb.lol, with routes marked 'tahmini'. The board columns avoid STA, gates and delays. The follow-by-flight-number feature ('belirli bir tarih ya da bir sonraki uçuş') has no schedule source, so it can only resolve once a matching callsign is transmitting.

Corrections to the cost and access summary:
- ADSBx Enterprise is NOT a schedule source. It is positional/operational ADS-B data sold as subscriptions 'with minimum annual commitments' through contact-sales.
- OAG is not purely quote-only. Since 2026 its portal offers a free exploration tier (limited calls per month, no card); paid tiers are unpriced (fixed tier fee plus per-hit overage).
- Cirium's Commercial plan is self-serve by credit card, but its prices are shown only after login and it lacks airport schedules, FIDS and alerts, which are contract-only.
- The free tiers that do include schedules are personal or non-commercial only: AirLabs Free ('Personal Use'), Aviationstack Free (commercial No, 100 requests/mo), AeroAPI Personal ($5/mo credit, personal or academic).
- The cheapest commercial schedule sources are AirLabs Developer $49/mo and Aviationstack Basic $49.99/mo, then AeroAPI Standard with a $100/mo minimum. Aviation Edge starts at $299/mo and its terms bar distributing the data.

Mixing restrictions:
- FR24 ToS (23 Jun 2026) prohibits using the FR24 API 'to supplement or backfill any other near-time or real-time flight data sourced from an alternative data provider'. FR24 also has no schedule data at all.
- AeroAPI Standard License #10 requires FlightAware's prior written permission for use 'in conjunction with or as a backfill to' other real-time providers.
- Cirium's track and Flights Near APIs are 'Powered by FlightRadar24', so upstream terms may matter there too.
- AirLabs API responses state 'Reselling data 'As Is' without AirLabs.Co permission is strictly prohibited.'

EXTRA: COMPARISON (verified 2026-09-25; list prices in USD)

| Provider | Positions | Schedules/boards/gates/delays | History | Push alerts | Cheapest commercial-OK entry | Free tier | Public B2C display / mixing with adsb.lol |
|---|---|---|---|---|---|---|---|
| FR24 API | Yes (credits: 6-8 per flight) | No schedules/gates; actual takeoff/landing + runways only | 30d / 2y / all | No (polling example only) | Explorer $9 (30k credits, 20 results/resp, 10 rpm); Essential $90 (333k); Advanced $900 (4.05M). Credits doubled until 2026-12-31 | Sandbox (static) | Commercial allowed, BUT competing services and supplementing other real-time data are prohibited; 30-day storage; must credit FR24. Effectively unusable for this product. |
| FlightAware AeroAPI | Yes (per-flight position/track; no bulk map feed at sane cost) | YES: scheduled/estimated/actual out/off/on/in, gates, terminals, delays, airport scheduled_arrivals | Back to 2011 (Standard+) | YES: webhooks for on/in/arrival/eta-minutes/diverted/cancelled; $0.02 per delivery; Standard+ | Standard: $100/mo minimum usage, 5 result sets/s, B2C allowed | Personal: $5/mo free usage, personal/academic only | B2C app allowed (Standard); raw storage ≤30 days; mixing with other real-time providers needs FlightAware WRITTEN permission |
| ADS-B Exchange | Yes (Enterprise 250 ms, gRPC) | No (Live Operations gives dep/arr context ≤50 nm) | Up to 10 y backfill (subscribers) | No | Enterprise only; minimum annual commitment; price not public | Community API $10/mo, non-commercial only | Community: forbidden. Enterprise: licensed. |
| Aviationstack | 'live' lat/lon/alt/speed on flights (status 30-60 s) | YES: sched/est/actual, gate, terminal, delay; schedules/future (Basic+) | Yes (Basic+) | No | Basic $49.99 (10k req); Professional $149.99 (50k) | 100 req/mo, non-commercial | Commercial on paid plans; no explicit redistribution clause (generic Idera ToU 2019) |
| AirLabs | Yes (ADS-B, bbox; provenance undisclosed) | YES: Live Schedules with gates/delays | Limited | Beta webhook on field changes (paid; counts as queries; 1-10 min lag) | Developer $49 (25k); Business $99 (100k) | 1,000 queries, personal use | 'Commercial Use' on paid plans; ToS (2021) silent on redistribution |
| Aviation Edge | Partly schedule-extrapolated, few-minute updates | Yes (real-time/historical/future schedules) | Yes | No | Developer $299 (30k); $7 first month | None (discontinued) | Own-app use OK; no data distribution; no replicating the service |
| Cirium (FlightStats Flex/Sky) | Track by flight; Flights Near | Yes, but by-airport/FIDS = Premium (contract) | Premium | Flight Alerts = Premium (contract) | Commercial plan: credit card, pay-per-use, standard APIs only; prices after login | 30-day eval, 20k requests | By contract |
| OAG | No live positions in catalog | Yes (schedules updated every 15 min, status, gates) | Yes | Flight Info Alerts (HTTP push / Azure Event Hubs) | Quote-based tiers + per-hit overage | Trial; Alerts trial 28 days | By contract |

Rough monthly cost for this project (5 TR stations, ~1,800 arrivals/day, a few hundred followed flights):
- AirLabs Business: ~$99.
- Aviationstack Professional: ~$150.
- AeroAPI Standard: $100 minimum. At list price, a daily schedule pull plus per-flight lookups plus alerts (~$0.06 per followed flight) is likely $100-300. Airport-board polling every 5 min would cost ~$800+.
- FR24 API: not applicable (ToS).
- Cirium, OAG and ADSBx Enterprise: quote-based, realistically four figures per month or annual commitments (unverifiable; not published).

Extra discoveries:
1. AeroDataBox (not in the prompt list) is the cheapest verified B2C-friendly schedule/FIDS source. It costs from $7.50/mo on API.market or $8 on RapidAPI (free 7-day trial, 400 units), and Direct plans start at $19/mo. Its pricing page explicitly says a B2C mobile app showing flight number, time, status and gate needs no derived-work license. Lower tiers allow 7-day caching, and it has a separate Flight Alert credit balance. Source: https://aerodatabox.com/pricing. Check its full terms before use.
2. Both big commercial APIs (FR24, AeroAPI) carry anti-mixing clauses. The planned hybrid of 'adsb.lol positions + commercial enrichment' is therefore only safe with FlightAware's written permission, or with schedule-only vendors whose terms are silent or permissive (AirLabs, Aviationstack, AeroDataBox). Get written confirmation in all cases.
3. FR24's own pages disagree on Advanced's rate limit: docs/credit-overview says 90/min, the subscriptions page says 200/min.
4. The live FR24 ToS is dated 2026-06-23. The AeroAPI Standard License version is January 2025. The Aviation Edge terms were updated 2025-06-30.
5. The AeroAPI OpenAPI yml at /commercial/aeroapi/resources/aeroapi-openapi.yml reports version 4.17.1, while FlightAware announced 4.26 in July 2025. Treat field names as current but confirm against the live portal.
6. A shared browser pane was being navigated by other agents during this run. All facts above were re-read from my own tab and URLs.


######## GROUP dokploy_ops

### D1 [partially_true/medium]
CLAIM: Part 1 §2 says to set up routing by following Dokploy's Docker Compose domain docs, and to follow those docs on networks and Traefik labels instead of guessing. CLAUDE.md says: Hostinger KVM 2 + Dokploy (Traefik, Let's Encrypt). DEPLOY_DOKPLOY step 5 routes DOMAIN to web and api.DOMAIN to api, with WS included, over HTTPS. The set does not name a Dokploy version.
FACT: The latest Dokploy is v0.30.7, released 2026-09-18. v0.30.0 (2026-08-14) is the big recent change. It adds per-service network management and marks Isolated Deployment as deprecated. The option is still in Compose → Advanced, but the docs pages still describe it as current. v0.30.0 also adds Cloudflare/Route53 DNS-provider integration, vault-backed env secrets and one build queue per server. It adds a domain enable/disable toggle, moves Traefik from v3.6.7 to v3.6.25, and fixes a command-injection bug through the compose domain serviceName.

Compose domains, Method 1, is the recommended path. You add domains in the Domains tab. At deploy time Dokploy injects the Traefik labels, and the Preview Compose button shows the final file. For each service that has a domain, the source code does four things. It adds `traefik.enable=true` and `traefik.docker.network=dokploy-network`. It adds router and service labels, including `loadbalancer.server.port=<Container Port>`. It attaches that service to BOTH the external `dokploy-network` and the compose `default` network. It declares dokploy-network as external at the root.

Services with no domain stay only on `default`, so web and api can still reach postgres and redis by service name. These are postgres, redis and worker. When HTTPS is on and the certificate is Let's Encrypt, Dokploy creates two routers. The `web` router uses the `redirect-to-https@file` middleware. The `websecure` router uses `tls.certresolver=letsencrypt`. The resolver uses the HTTP-01 challenge on entrypoint web, so port 80 must be open and the A records must already point to the VPS.

The Let's Encrypt email defaults to test@localhost.com in the generated traefik.yml. You set it through the Let's Encrypt email field in Web Server settings. Compose domain changes need a redeploy because there is no hot reload. The docs recommend `expose` instead of `ports`.

Traefik supports WebSocket and WSS out of the box, so api.DOMAIN needs no extra labels for WS. Dokploy issue #4202 (Apr 2026, closed as not planned) reports WS failures over HTTP/2. It affects Dokploy's own UI log sockets, not user apps, but WSS should still be tested end to end.

There is a risk on a VPS shared with other projects. Every domain-bearing service from every project joins the same `dokploy-network`. Generic names like `web` or `api` can therefore collide in Docker DNS with another project's containers.
CHANGE: Replace the vague 'follow the docs' line in Part 1 §2 with explicit rules:
(1) Production docker-compose.yml has NO Traefik labels and does NOT declare dokploy-network. Add domains only in Dokploy UI → Domains: service `ft-web` on port 3000, and service `ft-api` on API_PORT. Turn HTTPS on and set Certificate to Let's Encrypt.
(2) Leave Isolated Deployments off, since v0.30.0 deprecates it.
(3) Give services project-unique names, for example ft-web, ft-api, ft-worker, ft-postgres, ft-redis. This avoids DNS collisions on the shared dokploy-network.
(4) postgres and redis get no ports and no domain.
(5) Redeploy after any domain change.
(6) WS needs no extra labels. Keep the client ping/heartbeat at about 25–30 s with exponential reconnect.
In DEPLOY_DOKPLOY, add these steps before step 5: create DNS A records for DOMAIN and api.DOMAIN, set the Let's Encrypt email in Web Server settings, then enable HTTPS. Add a verification line: `wscat -c wss://api.DOMAIN/v1/ws`. Also require Dokploy ≥ v0.30.7.
VERIFY: finding_upheld :: Upheld; checked against source at tag v0.30.7. Latest release: v0.30.7 (2026-09-18T09:12Z), and GitHub's releases/latest redirects there. v0.30.0 came out 2026-08-14. Its notes confirm each item the researcher listed: per-service network attach/detach with Isolated Deployment deprecated but still in Compose → Advanced, Cloudflare/Route53 DNS providers, vault-backed env secrets, a build queue per server, the domain enable/disable toggle, Traefik v3.6.7 → v3.6.25 (TRAEFIK_VERSION now defaults to 3.6.25), and the command-injection fix for the compose domain serviceName (#4872).

What domain.ts does for each enabled domain:
- It prepends `traefik.enable=true` and `traefik.docker.network=dokploy-network`.
- It adds router rule, entrypoints and service labels, plus `loadbalancer.server.port=<port>`.
- It attaches the service to BOTH `dokploy-network` and `default`.
- It declares `dokploy-network: {external: true}` at the root.

With HTTPS on, the `-web` router gets `redirect-to-https@file`. The `-websecure` router gets `tls.certresolver=letsencrypt`. traefik-setup.ts sets the ACME email to `test@localhost.com` and uses httpChallenge.entryPoint `web`. The email is stored in the webServerSettings.letsEncryptEmail field.

Nuance: attaching `default` to domain services was added in v0.27.0, Feb 2026 (issues #3525/#3562). Before that, domain services lost their compose-internal DNS. The docs page for Compose domains is now stale: it still says you must add dokploy-network to the other services to keep connectivity. The code makes that unnecessary, because non-domain services (postgres, redis, worker) stay on `default`.

The docs confirm that Compose domain changes need a redeploy ('No Hot Reload'), and they recommend `expose` over `ports`. The Utilities docs page still presents Isolated Deployments without any deprecation note. It also documents the name-collision problem on the shared dokploy-network ('Docker doesn't allow services with identical names in the same network'), which supports the DNS-collision risk. Mitigations: give domain services unique names or aliases, or detach them from shared networks.

Issue #4202 is CLOSED as NOT_PLANNED. It was filed against v0.28.8 in April 2026 and concerns the Dokploy UI's own log WebSockets over HTTP/2. Traefik docs say WS/WSS work out of the box. The unversioned Traefik WS URL now redirects; the versioned page is doc.traefik.io/traefik/v3.5/user-guides/websocket/.

### D2 [partially_true/high]
CLAIM: The deploy workflow calls the Dokploy API to deploy the Compose service: POST /api/compose.deploy, header x-api-key, body {composeId}. Secrets are DOKPLOY_URL, DOKPLOY_API_TOKEN and DOKPLOY_COMPOSE_ID. The set also says: 'Deploy başarısız olursa workflow kırmızıya döner' (if the deploy fails, the workflow turns red).
FACT: The endpoint and header are correct. The call is `POST {DOKPLOY_URL}/api/compose.deploy` with headers `x-api-key: <token>` and `Content-Type: application/json`. The body schema (apiDeployCompose) is `{composeId: string (required), title?: string, description?: string, freshVolumes?: boolean}`.

`POST /api/compose.redeploy` takes the same body, but it skips the git clone and rebuilds from the files already checked out ('Rebuild deployment'). New commits need compose.deploy.

`freshVolumes: true` runs `docker compose -p <app> down --volumes` before deploying. That would wipe the Postgres and Redis volumes, so it must never be used.

The call is ASYNCHRONOUS. On self-hosted Dokploy it only enqueues a BullMQ job and returns `{success:true, message:'Deployment queued', composeId}` right away. An HTTP 200 therefore does not mean the deploy worked. To turn the workflow red on a real failure, CI has to poll. `GET /api/deployment.allByCompose?composeId=...` returns deployments newest first, with status running, done, error or cancelled, plus title and errorMessage. The deployment row is created when the job starts, using the title you sent. `GET /api/compose.one?composeId=...` also returns composeStatus (idle, running, done or error).

To create a token, go to Settings → Profile (/dashboard/settings/profile) → API/CLI section → generate. The form has name, expiration (Never, 1 day, 7 days, 30 days, 90 days or 1 year), organization and an optional rate limit. The user needs the 'Access to API/CLI' permission. The hardening guide advises one token per integration, always with an expiry.

The composeId is in the service URL: /dashboard/project/<projectId>/environment/<environmentId>/services/compose/<composeId>. You can also get it from `GET /api/project.all`. Swagger is at /swagger.

The API deploy works even when Autodeploy is OFF. Only the webhook endpoints check that toggle.

The Going Production page shows `uses: dokploy/dokploy-action@v1`, but github.com/Dokploy/dokploy-action returns 404, so use plain curl.
CHANGE: In Part 1 §10 deploy.yml, replace the 'verify endpoint' line with this exact contract. Call POST $DOKPLOY_URL/api/compose.deploy with headers x-api-key and Content-Type: application/json. Send body {"composeId":"$DOKPLOY_COMPOSE_ID","title":"gh-<sha7>-<run_id>"}. Never send freshVolumes. Do not use compose.redeploy for new commits.

Then poll GET $DOKPLOY_URL/api/deployment.allByCompose?composeId=$DOKPLOY_COMPOSE_ID every 10 s, for up to about 15 min. Pick the entry whose title equals the one sent. Exit 0 on 'done'. Exit 1 on 'error' or 'cancelled', or on timeout, and print errorMessage.

DOKPLOY_URL must be the HTTPS panel domain, not http://IP:3000. DEPLOY_DOKPLOY step 6 should say: Settings → Profile → API/CLI → create a token named 'github-actions' with an expiry (for example 90 days). Read the composeId from the service URL.
VERIFY: finding_upheld :: Upheld, with three corrections.

Confirmed:
- Call: `POST {DOKPLOY_URL}/api/compose.deploy` with header `x-api-key` (the OpenAPI securityScheme apiKey in header x-api-key) and a JSON body. In v0.30.7 code, apiDeployCompose is `{composeId (min 1, required), title?, description?, freshVolumes?}`. The openapi.json committed at the tag omits freshVolumes, so it is stale.
- compose.redeploy skips the git clone and only re-applies patches. Its default title is 'Rebuild deployment'.
- freshVolumes=true runs `docker compose -p <app> down --volumes` first. Never use it.
- The API path does not check autoDeploy. Only the webhooks do: compose webhook → 400 when autoDeploy is off.
- The token form has name, prefix, expiration (Never, 1 day, 7 days, 30 days, 90 days, 1 year), organization (required) and optional rate limiting.
- The hardening guide says: one token per integration, always set an expiry, and restrict 'Access to API/CLI'.
- Swagger is at /swagger.
- composeId appears in /dashboard/project/<projectId>/environment/<environmentId>/services/compose/<composeId>.
- github.com/Dokploy/dokploy-action returns 404, yet the Going Production page still shows `dokploy/dokploy-action@v1`.

Corrections:
(1) Since v0.30.0 (2026-08-14), self-hosted Dokploy no longer uses BullMQ/Redis. queueSetup.ts is an in-memory, per-server FIFO queue ('chore: remove leftover Redis infrastructure code' #4930). The call is still asynchronous and returns `{success:true, message:'Deployment queued', composeId}`. Dokploy Cloud with a remote server returns plain `true`. Until the job starts, no deployment row exists, so CI must allow for a queued period and time out.
(2) The deployment row starts with the title you sent, default 'Manual deployment', and status defaults to 'running'. For git sources, the `finally` block of deployCompose then OVERWRITES title with the commit message and description with `Commit: <full %H sha>`. CI should therefore match on description == `Commit: $GITHUB_SHA` or on createdAt, not on title. Also, Dokploy deploys whatever is branch HEAD at clone time, which may be newer than the CI-tested SHA.
(3) `errorMessage` is populated only when creating the deployment row fails. For build failures it is usually null. Rely on status == 'error' (enum: running, done, error, cancelled) and the logs.

deployment.allByCompose (GET, query composeId) is ordered by createdAt desc, and Dokploy keeps the last 10. compose.one returns composeStatus (idle, running, done, error).

### D3 [partially_true/high]
CLAIM: DEPLOY_DOKPLOY sets up a GitHub provider and a Compose service (repo, main, ./docker-compose.yml) with Autodeploy OFF, and Actions triggers the deploy. Part 1 §2 has multi-stage Dockerfiles per app. The set implies Dokploy builds the images on the VPS during compose deploy. It does not decide where images are built.
FACT: Auto-deploy options:
(1) GitHub App provider. For a Compose service, autoDeploy defaults to TRUE in the schema. Dokploy deploys on every push to the selected branch. It also supports watch paths and a trigger type of push or tag.
(2) A per-service webhook URL, shown in the Deployments tab. The compose route is `https://<dokploy>/api/deploy/compose/<refreshToken>` and works for GitHub, GitLab, Bitbucket and Gitea.
(3) The API.

The GitHub webhook handler accepts only `push` and `pull_request` events. The compose webhook returns 400 when autoDeploy is off. Dokploy has NO built-in 'deploy only after CI passes' gate: it never looks at check_suite or workflow_run. So 'Autodeploy OFF plus an API call from Actions after CI' is the right gating pattern. It has to be switched off explicitly because the default is on.

Dokploy's 'Going Production' page says building on the server 'can lead to timeout on your server or even freezing your server'. It calls building and publishing in a CI/CD pipeline '(Recommended)', with Dokploy only deploying the pre-built image. Remote 'build servers' are a paid-infra alternative.

The compose deploy command runs `git clone`, then `docker compose -p <app> --env-file <dir>/.env -f <path> up -d --build --remove-orphans`. It appends `--pull always` only when the 'pull images' option is enabled. That option came from PR #3541 and shipped in v0.27.0 in Feb 2026, with pullImages defaulting to false. Without it, or without `pull_policy: always`, a moving tag like :main is NOT re-pulled.

For private GHCR, add a Registry in Dokploy. Dokploy runs `docker login` on the host, so compose pulls work. GitHub states GHCR 'only supports authentication using a personal access token (classic)'. `read:packages` is enough to pull, although Dokploy's doc says write:packages. GHCR image storage and bandwidth are currently free. Actions minutes: 2,000 per month free for private repos on the Free plan, and free for public repos.

Dokploy's zero-downtime and rollback features apply to Applications on Swarm, not to Compose. For Compose, a rollback means redeploying with an older image tag.

Recommendation for a KVM 2 (2 vCPU, 8 GB) shared with other projects: option (b), CI builds and Dokploy only pulls. Building the pnpm/Turborepo Next.js monorepo on the VPS would take CPU, RAM and disk (build cache) from the live ingest/worker/Postgres. That puts the p95 < 3 s notification target and the other projects at risk.
CHANGE: Make option (b) explicit in Part 1 §2 and §10.

In production docker-compose.yml, ft-web, ft-api and ft-worker use `image: ghcr.io/<owner>/<repo>-{web|api|worker}:${IMAGE_TAG:-main}` with `pull_policy: always` and NO `build:`. Local image builds go in docker-compose.dev.yml or a separate docker-compose.build.yml.

The deploy job, for main pushes that passed CI, does four things. It logs in to ghcr.io with GITHUB_TOKEN (`permissions: packages: write`). It builds and pushes the 3 images with docker/build-push-action, using tags `sha-<7>` and `main` and `cache-from/to: type=gha`. It calls compose.deploy and polls, as in D2.

Add these DEPLOY_DOKPLOY steps: 'Registry → ghcr.io + classic PAT (read:packages)'. 'Compose → General: Autodeploy switch explicitly OFF (default is ON)'. Optionally 'Advanced: Pull images ON'. For rollback, set IMAGE_TAG=sha-xxxxxxx in the Environment tab and deploy.
VERIFY: finding_refuted :: Partly refuted: two sub-claims are wrong. The overall recommendation still holds: CI builds and pushes images, Autodeploy is OFF, and the deploy is triggered through the API after CI passes.

WRONG 1, the 'pull images' option: PR #3541 (merged to canary 2026-02-09) shipped in v0.27.0 (2026-02-10). That release had an UNCONDITIONAL `--pull always`, not a toggle. v0.27.1 (2026-02-18) removed it again. Every release from v0.27.1 to the current v0.30.7 runs `docker compose -p <app> [--project-directory ...] [--env-file <dir>/.env] -f <path> up -d --build --remove-orphans` with no pull flag. The `pullImages` toggle ('feat(compose): add pull latest images on deploy toggle', default false) was committed to canary on 2026-09-01 and is NOT in any release as of 2026-09-25. On v0.30.7 you must add `pull_policy: always` to each service that uses a CI-built image, or pin an immutable tag, or override the command in Compose → Advanced → Command with a full custom command that adds `--pull always`.

WRONG 2, build servers: Dokploy docs say build servers are 'only available for Applications' and not supported for Docker Compose. They are no alternative for this Compose setup.

Confirmed:
- The compose schema has autoDeploy `$defaultFn(() => true)`, triggerType push|tag and watchPaths.
- The GitHub webhook accepts only push, pull_request and ping.
- The compose webhook `/api/deploy/compose/<refreshToken>` returns 400 when autoDeploy is off.
- There is no check_suite or workflow_run gate.
- The Going Production page warns that building on the server can time out or freeze it, and labels building in CI '(Recommended)'.
- Adding a Registry runs `docker login` on the host, and the env file sets DOCKER_CONFIG=/root/.docker.
- GHCR: 'only supports authentication using a personal access token (classic)'; read:packages is enough to pull, though Dokploy's guide says write:packages.
- GHCR storage and bandwidth are 'currently free'.
- Actions: 2,000 min/month on Free for private repos; free for public repos.
- Zero-downtime and rollbacks are documented only under Applications (Swarm health checks or registry-based).

### D4 [confirmed/low]
CLAIM: The server is a Hostinger KVM 2 VPS with Dokploy. Part 4 says to tune memory limits for KVM 2 based on measurements. Default limits are postgres 1 GB, redis 512 MB, web 512 MB, api 512 MB and worker 768 MB, about 3.3 GB in total.
FACT: hostinger.com on 2026-09-25 (USD, prices exclude VAT, 24-month promo term):
- KVM 1: 1 vCPU, 4 GB RAM, 50 GB NVMe, 4 TB bandwidth. $6.49/mo, renews at $11.99.
- KVM 2 (marked 'most popular'): 2 vCPU, 8 GB, 100 GB NVMe, 8 TB. $8.99/mo, renews at $14.99.
- KVM 4: 4 vCPU, 16 GB, 200 GB NVMe, 16 TB. $12.99/mo, renews at $28.99.
- KVM 8: 8 vCPU, 32 GB, 400 GB NVMe, 32 TB. $25.99/mo, renews at $49.99.

The Turkish page (TL, 'Fiyatlara KDV dahil değildir' (VAT not included), 24 months):
- KVM 1: 276,99₺, renews at 552,99₺.
- KVM 2: 405,99₺, renews at 718,99₺.
- KVM 4: 552,99₺, renews at 1.381,99₺.
- KVM 8: 1.105,99₺, renews at 2.394,99₺.

The pages list AMD EPYC CPUs, NVMe and free weekly backups. Hostinger has an 'Ubuntu 24.04 with Dokploy' template under OS with Panel, with the panel at http://<ip>:3000. Dokploy needs at least 2 GB RAM and 30 GB disk, and ports 80, 443 and 3000. Prices are regional and promotional and change often.
CHANGE: Add a sizing note to CLAUDE.md or DECISIONS. KVM 2 (2 vCPU, 8 GB) is the minimum. The app's default limits (about 3.3 GB), Dokploy itself (dokploy, dokploy-postgres, Traefik; measure it, roughly 0.5–1 GB) and the other projects must all fit in 8 GB with headroom. If `docker stats` shows the other projects using more than about 2.5 GB, move to KVM 4. KVM 4 costs only $4 more per month on the promo price, but its renewal is about double. After install, bind the Dokploy panel to a domain with HTTPS and close port 3000.

### D5 [partially_true/medium]
CLAIM: Part 1 wants Postgres and Redis on persistent volumes, with env-driven memory limits and env validation. Part 4 adds a custom `backup` service that runs a daily pg_dump to S3-compatible storage, keeps 7 daily and 4 weekly copies, and has a local-volume fallback and scripts/restore.sh. Observability means /metrics, Sentry and an admin health page. The set does not mention how Dokploy injects env vars.
FACT: Environment: Compose → Environment writes a `.env` file next to docker-compose.yml. createEnvFile defaults to true, and Dokploy passes `--env-file`. The docs warn that these variables are 'not automatically injected into containers'. Each service must use `env_file: [.env]` or `${VAR}`. Shared references work: `${{project.VAR}}`, `${{environment.VAR}}`, and since v0.30.0 `${{vault.<env>.<key>}}` resolved at deploy time.

Volumes: use named volumes for databases, because Volume Backups only works with named volumes. Bind mounts must use `../files/...`, since absolute host paths get cleaned. Files mounted from the repo are wiped by the git clone on each deploy, so use Advanced → File Mounts instead.

Backups: since v0.22.0 (2025-05-05), a Compose service has a Backups tab for databases INSIDE the compose file: PostgreSQL, MariaDB, MySQL and MongoDB. You choose the service name, DB type, DB name and credentials, an S3 destination, a cron schedule and a keep-latest count, and restore from the UI. Under the hood it runs `docker exec <ctr> bash -c 'pg_dump -Fc ... | gzip'` and uploads with rclone to any S3-compatible store. It needs bash in the DB container: Debian-based postgis/postgis works, while *-alpine variants would fail. There is also a separate Volume Backups feature for named volumes to S3, optionally stopping the container. Web Server → Backups covers Dokploy's own DB plus /etc/dokploy. Hostinger adds free weekly VPS backups.

Monitoring: self-hosted Dokploy shows live per-container CPU, memory, I/O and network in the Monitoring tab. Historical metrics and threshold alerts are documented as Cloud-only. Notifications go to Slack, Telegram, Discord, Email, Resend, ntfy, Pushover, Gotify, Teams, Mattermost, Lark or a webhook. Events are app deploy, build error, DB backup, volume backup, Docker cleanup and Dokploy restart.
CHANGE: Part 1 §2 changes:
- Each app service declares `env_file: [.env]`, or explicit `${VAR}` entries, because Dokploy's .env is not auto-injected.
- Use named volumes `ft_pgdata` and `ft_redisdata`.
- Use a Debian-based `postgis/postgis:<pg>-<postgis>` image, not -alpine, so Dokploy backups work.
- No repo-relative bind mounts in production.

Part 4 'Yedekleme' changes:
- Prefer the native Dokploy Compose Backups: service ft-postgres, type postgres, daily cron, keepLatest ≥ 7, an S3 destination such as Cloudflare R2 or Backblaze B2. Keep the custom `backup` service only for weekly tiering (4 weekly copies) or if S3 is absent. Do not run both.
- Keep scripts/restore.sh and the CI restore test. Make them accept Dokploy's `pg_dump -Fc | gzip` format.

DEPLOY_DOKPLOY and observability changes:
- Add 'Notifications → Telegram/Email for Build Error and DB Backup'.
- Add an external uptime check (/health), since self-hosted Dokploy has no historical metrics or alerts.
VERIFY: finding_upheld :: Mostly upheld, with three corrections.

Confirmed:
- Compose → Environment writes `.env` next to the compose file, and the docs say those variables are 'not automatically injected into containers'. Use `env_file: [.env]` or `${VAR}`.
- createEnvFile defaults to true. A Compose toggle was added in v0.30.0 (#5008). In v0.30.7 `--env-file` is passed when the toggle is on.
- `${{project.X}}` and `${{environment.X}}` work as described.
- Named volumes are required for Volume Backups. Avoid absolute host paths ('cleaned up during deployments'); use `../files/...`.
- Repo files mounted by bind are lost on re-clone, so use Advanced → Mounts (File Mounts).
- Compose DB backups arrived in v0.22.0 (release 2025-05-05) for PostgreSQL, MariaDB, MySQL and MongoDB, with restore.
- backups.ts has serviceName, schedule and keepLatestCount.
- The Postgres backup runs `docker exec ... bash -c 'set -o pipefail; pg_dump -Fc --no-acl --no-owner ... | gzip'` and uploads with `rclone rcat` to S3-compatible storage.
- Web Server → Backups covers dokploy-postgres plus /etc/dokploy, zipped to S3.
- Hostinger VPS includes free weekly backups; daily backups are paid.
- The per-service Monitoring tab on self-hosted is the 'free' container monitoring: CPU, memory, block I/O, network, disk. The server monitoring page with retention and CPU/memory threshold alerts says 'only available on Cloud Version', and the hardening guide calls built-in Monitoring Cloud-only.
- Notification providers: slack, telegram, discord, email, resend, gotify, ntfy, mattermost, pushover, custom(webhook), lark, teams.

Corrections:
(1) The claim that '*-alpine variants would fail' is wrong for official images. The postgres alpine Dockerfile installs `bash` as a runtime dependency, because docker-entrypoint.sh is a bash script. postgis/postgis alpine images are built FROM postgres:*-alpine, so they have bash too. Only custom images without bash would fail.
(2) The vault syntax is `${{vault.<provider-name>.<ref>}}`, where <ref> depends on the provider, e.g. Vault `path:field`. It is not `${{vault.<env>.<key>}}`. It is available from v0.30.0.
(3) Notification events also include dokployBackup and serverThreshold, alongside appDeploy, appBuildError, databaseBackup, volumeBackup, dockerCleanup and dokployRestart.

### D6 [partially_true/medium]
CLAIM: Part 1 §10 has ci.yml running on PRs and main pushes, and a separate deploy.yml. deploy.yml triggers the Dokploy deploy when CI succeeds on main. It skips the deploy if changes are only under apps/mobile/** or docs/**.
FACT: Option A is two files joined by `workflow_run`. It is workable but has sharp edges:
- It fires only if deploy.yml exists on the default branch.
- Its only filters are branches and branches-ignore, with no path filters.
- You must check `github.event.workflow_run.conclusion == 'success'`, and also `workflow_run.event == 'push'`, because PR runs fire it too.
- GITHUB_SHA is the latest default-branch commit, so you must check out `github.event.workflow_run.head_sha`.
- Chains are limited to 3 levels.

Option B is simpler and more robust. Use one workflow with `needs`, or keep deploy.yml as a reusable workflow (`on: workflow_call`) called from ci.yml. The deploy job then gets `needs: [changes, ci]` and `if: github.event_name=='push' && github.ref=='refs/heads/main' && needs.changes.outputs.deploy=='true'`.

Path skipping: use dorny/paths-filter@v4 (latest v4.0.3, 2026-08-05; v4 moved to Node 24). Set `predicate-quantifier: 'every'` and a filter `deploy: ['**', '!apps/mobile/**', '!docs/**']`. The output is 'true' only if some changed file lies outside mobile and docs. The action also has a newer 'some-with-excludes' mode.

Do not use workflow-level `paths-ignore` on a workflow whose checks are required. A workflow skipped by path filtering leaves its checks 'Pending' and blocks PR merges, while a job skipped by an `if` reports 'Success'.

Node 20 was removed from GitHub-hosted runners on 2026-09-23, so use current node24 majors:
- actions/checkout v7.0.1
- actions/setup-node v7.0.0
- pnpm/action-setup v6.1.0
- docker/setup-buildx-action v4.4.1
- docker/login-action v4.6.0
- docker/metadata-action v6.2.0
- docker/build-push-action v7.4.0

Dokploy's docs example uses checkout@v3, login-action@v2 and build-push-action@v4, which are outdated.
CHANGE: Reword Part 1 §10. ci.yml runs on pull_request and push to main. It has a first job `changes` using dorny/paths-filter@v4 with predicate-quantifier 'every' and deploy: ['**','!apps/mobile/**','!docs/**']. Next come the lint, typecheck, test, integration, build and e2e jobs.

The final job, `deploy`, is `uses: ./.github/workflows/deploy.yml` with `secrets: inherit`, and needs: [changes, <all CI jobs>]. Its condition is `if: github.event_name=='push' && github.ref=='refs/heads/main' && needs.changes.outputs.deploy=='true'`.

deploy.yml has `on: workflow_call`, `permissions: {contents: read, packages: write}`, `concurrency: {group: deploy-prod, cancel-in-progress: false}` and `environment: production`. It builds and pushes the GHCR images, calls compose.deploy and polls, as in D2.

Do not use workflow_run, and do not use workflow-level paths-ignore. Pin the node24-era action majors listed above.
VERIFY: finding_upheld :: Upheld.

GitHub docs on workflow_run:
- It fires only if the workflow file exists on the default branch.
- GITHUB_SHA is the last commit on the default branch and GITHUB_REF is the default branch.
- It supports only `branches` and `branches-ignore`.
- You cannot chain more than three levels.
- The docs show gating with `github.event.workflow_run.conclusion == 'success'`.

The required-status-checks docs say workflows skipped by path or branch filtering or by commit message leave checks 'Pending' and block merging, while a job skipped by a conditional reports 'Success'.

dorny/paths-filter:
- Latest is v4.0.3 (2026-08-05). v4.0.0 (2026-03-12) moved the runtime to node24.
- `predicate-quantifier` accepts 'some' (default), 'every' and the newer 'some-with-excludes'.
- With 'every', the filter `['**','!apps/mobile/**','!docs/**']` is 'true' only if some changed file lies outside mobile and docs.

Node 20 is gone: the GitHub changelog of 2026-09-23 says Node 20 is no longer available on runners and the ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION opt-out is gone.

The latest releases, via releases/latest redirects, all have `using: node24` in action.yml:
- actions/checkout v7.0.1
- actions/setup-node v7.0.0
- pnpm/action-setup v6.1.0
- docker/setup-buildx-action v4.4.1
- docker/login-action v4.6.0
- docker/metadata-action v6.2.0
- docker/build-push-action v7.4.0

docker/setup-qemu-action is at v4.4.0 if it is needed. Dokploy's Going Production example still uses checkout@v3, login-action@v2 and build-push-action@v4.

EXTRA: 1. Dokploy security: v0.29.13 (2026-07-21) fixed about 16 command-injection and cross-org IDOR bugs. v0.30.0 fixed a command injection through the compose domain serviceName, and an SSRF. A Hostinger template install may ship an older Dokploy (I could not confirm which version it ships). The developer should upgrade to ≥ v0.30.7 before exposing anything. Source: https://github.com/Dokploy/dokploy/releases/tag/v0.30.0.

2. Dokploy's docs trail its releases. docs/core/docker-compose/domains and /utilities still present Isolated Deployments as recommended, although v0.30.0 deprecates it. The Going Production page shows a non-existent `dokploy/dokploy-action@v1` and pre-Node-24 action versions. Prompts that tell Claude Code to 'follow the Dokploy docs' should pin the specific rules from D1–D3.

3. Compose deploys on Dokploy are not zero-downtime. `docker compose up -d` recreates the changed containers, so expect a few seconds of 502s and dropped WebSockets on each deploy. Client auto-reconnect with backoff (already in Part 4) is essential. Zero-downtime and Swarm rollback are Application-only features.

4. There is a race in compose.deploy. It git-clones main HEAD at job time, which may be newer than the commit whose images were just built. Using `IMAGE_TAG=main` plus `pull_policy: always` and a deploy concurrency group keeps the two consistent.

5. The API returns 'Deployment queued' and the deployment row appears only when the worker starts. Poll by a unique title rather than taking the newest row.

6. Hardening from Dokploy's guide:
- ufw allows only 22, 80 and 443, plus `ufw-docker`, because Docker bypasses UFW.
- Keep port 3000 private: give the panel a domain with HTTPS, or put it behind Tailscale.
- Never publish the DB or Redis ports.
- Set the Let's Encrypt email: the default in traefik.yml is test@localhost.com.

7. If Cloudflare proxies the domain, the Dokploy Cloudflare doc requires SSL mode Full (Strict), with Let's Encrypt or an Origin CA certificate. With Cloudflare's orange cloud, WebSockets need Cloudflare's WS support, which is on by default.

8. Disk: a CI-built image flow pulls a new sha tag on each deploy. Rely on Dokploy's automatic Docker cleanup (the deployment-options table says 'Automatic storage cleanup: Yes' for the Dokploy server) and watch the 100 GB NVMe.

9. GHCR requires a PAT (classic); fine-grained tokens are not supported. Dokploy's GHCR doc asks for write:packages, but read:packages is enough to pull, which is least privilege.

10. Dokploy v0.30.0 adds vault references (`${{vault...}}`) with Infisical, Doppler, HashiCorp Vault/OpenBao, AWS Secrets Manager and Scaleway. This is optional, but useful later for push/APNs/FCM keys.


######## GROUP mobile

### M1 [confirmed/medium]
CLAIM: Part 4 says 'use the current stable Expo SDK, Expo Router and TypeScript' without pinning a version. Part 0 lists Expo Router and a development build.
FACT: As of 2026-09-25 the latest stable Expo SDK is SDK 57. It was released 2026-06-30. npm dist-tag latest is expo@57.0.25. SDK 57 ships React Native 0.86 and React 19.2.3, supports iOS 16.4+ and Android 7+ (compileSdk 36), and needs Xcode 26.4+. SDK 58 has been in beta since 2026-09-15 with React Native 0.88 RC (npm tag next = expo@58.0.0-preview.7). It goes stable 'shortly after' RN 0.88 ships, so it will likely land within weeks. On versioning: since SDK 55, every Expo SDK package shares the SDK major version, so Expo Router for SDK 57 is expo-router@57.x (latest 57.0.23) instead of the old v4/v5/v6 numbers. Expo Router v56 (blog post dated 2026-05-28) forked React Navigation and no longer depends on it: imports must come from 'expo-router/react-navigation', not '@react-navigation/*'. On the New Architecture: it became the default in SDK 52. SDK 55 (2026-02-25, RN 0.83) removed the Legacy Architecture completely, so it cannot be turned off, and newArchEnabled was removed from app.json and is ignored. SDK 56 (2026-05-21, RN 0.85) made Hermes v1 the default and raised the minimum iOS to 16.4. Known issue: Hermes v1 had a memory regression with react-native-reanimated/worklets, fixed in expo@57.0.9. A dev-startup regression was fixed in 57.0.17. The SDK 58 beta shows foreground notifications by default unless setNotificationHandler says otherwise.
CHANGE: In Part 4 §1 (and in CLAUDE.md's stack line), pin the version explicitly: 'Expo SDK 57 (RN 0.86, React 19.2, expo-router 57.x). Use npx expo install to align versions. If SDK 58 is stable when you start, upgrade and write it in DECISIONS.' Add: 'New Architecture is mandatory (SDK 55+). Do not add newArchEnabled. Import navigation primitives from expo-router/react-navigation, never @react-navigation/*. Minimum iOS 16.4, Xcode 26.4+. Use expo >= 57.0.17.'

### M2 [confirmed/medium]
CLAIM: Part 4 says 'Verify that the @maplibre/maplibre-react-native version is compatible with the chosen SDK and the New Architecture' and relies on a development build because MapLibre is a native module.
FACT: @maplibre/maplibre-react-native latest is 11.4.0 (2026-09-19). It wraps MapLibre Native Android 13.6.1 and iOS 6.31.0. v11.0.0 (2026-04-17) was 'the first release to only support the new architecture' and matches SDK 55+. Peer dependencies: react-native >=0.80, react >=19.1, expo >=54 (optional). The Expo config plugin is added as plugins: ['@maplibre/maplibre-react-native']. It is required on iOS, where it adds $MLRN.post_install to the Podfile; on Android it only applies customizations. The package cannot be used in Expo Go. v11 is a breaking API redesign that follows MapLibre GL JS: MapView became Map, ShapeSource became GeoJSONSource, and FillLayer/LineLayer/CircleLayer/SymbolLayer etc. merged into one <Layer type=...> with style-spec paint/layout props (kebab-case). The old style prop is deprecated and will be removed in v12. Camera defaultSettings became initialViewState, and setCamera became setStop. Open issues relevant to this app: #1650, the iOS post_install adds the MapLibre SPM dependency to every target, which crashes App Extensions such as a Notification Service Extension or widgets; #1647, Android SIGSEGV on removeFromMap after a style reload, which matters for light/dark style switching; #1618, Android Marker onPress still bubbles to Map onPress; #1491, the Feature State API is not supported; #1697, an Android location-module crash after a JS reload.
CHANGE: Replace the 'verify compatibility' line with: 'Use @maplibre/maplibre-react-native ^11.4 (New Architecture only, Expo >= 54). Add the config plugin. Write code against the v11 API (Map, GeoJSONSource, a single Layer with style-spec paint/layout), not v10 examples (MapView/ShapeSource/SymbolLayer). Share layer paint/layout JSON between web (MapLibre GL JS) and mobile in packages/shared. Do not rely on feature-state for highlighting selection; use data-driven expressions. If you add an iOS Notification Service Extension or widget later, test for issue #1650 first. When switching light/dark styles on Android, rebuild the Map instead of hot-swapping mapStyle until #1647 is fixed.'

### M3 [confirmed/high]
CLAIM: Part 2 §7: send in chunks with expo-server-sdk, run a ticket/receipt job, clean up DeviceNotRegistered, support EXPO_ACCESS_TOKEN, use Android channelId flight-alerts, and 'check the current Expo push API docs for interruptionLevel support; if it is not supported, implement a direct APNs (.p8) path'.
FACT: The Expo Push API supports interruptionLevel today. It is iOS-only, with allowed values 'active' | 'critical' | 'passive' | 'time-sensitive' (hyphenated), mapped to UNNotificationInterruptionLevel / aps.interruption-level. The client-side expo-notifications API for local notifications uses camelCase 'timeSensitive' instead, so do not mix the two. channelId is Android-only. If the channel does not exist on the device, the notification is NOT displayed. If channelId is omitted, Expo creates a user-facing 'Default' channel. priority defaults to 'normal' on Android and 'high' on iOS. Android normal priority can be delayed in Doze, so landing alerts need priority:'high'. Newer fields: collapseId (Android and iOS), tag (Android, replaces a notification already shown), threadId (iOS grouping), relevanceScore, filterCriteria, and targetContentId. Limits: 100 messages per request, 600 notifications/s per project (TOO_MANY_REQUESTS), and 1000 receipt IDs per getReceipts request. Receipts: check about 15 minutes after sending (the SDK README says to allow up to 30 minutes under load); they are cleared after 24 hours. DeviceNotRegistered can appear in tickets or receipts and means stop sending to that token. Enhanced security: turn on 'require access token' in the EAS dashboard, then send Authorization: Bearer <token> or pass new Expo({ accessToken }). Without the token, requests fail with UNAUTHORIZED. expo-server-sdk latest is 7.2.0 (2026-08-24). Breaking changes: v5 (2026-02) removed useFcmV1 and switched to undici; v6 (2026-02-19) is ESM-only; v7 (2026-07-30) needs Node >=22.12. chunkPushNotifications makes chunks of 100 and chunkPushNotificationReceiptIds makes chunks of 300. Default concurrency is 6 requests, with built-in retry/backoff.
CHANGE: Remove the conditional in Part 2 §7 and make the direct-APNs fallback optional or drop it. Write instead: 'Expo push supports interruptionLevel. For approach/landing alerts send { priority: "high", sound: "default", channelId: "flight-alerts" (Android), interruptionLevel: "time-sensitive" (iOS, only if the user preference is on), threadId: <flightId>, tag: <flightId>-<event> }. Use expo-server-sdk ^7.2 (ESM, Node >= 22.12, so the worker image must be Node 22.12+ or 24). Poll receipts after 15 min, and no later than 24 h. Delete the token on DeviceNotRegistered from either tickets or receipts. Turn on enhanced push security and pass accessToken. Respect 600/s.' Also make the mobile app create the flight-alerts channel before registering the token, because otherwise Android alerts are silently dropped.

### M4 [partially_true/low]
CLAIM: Part 4 says 'iOS: time-sensitive notification entitlement and user preference', and ACTIVATION.md lists 'time-sensitive notification entitlement' under the external Apple steps, which implies a manual request.
FACT: The entitlement key is com.apple.developer.usernotifications.time-sensitive (Boolean true). In Expo, set it in app config: ios.entitlements: { 'com.apple.developer.usernotifications.time-sensitive': true }. EAS Build capability syncing supports 'Time Sensitive Notifications' and turns it on for the App ID automatically, so there is no manual portal step when EAS manages credentials. 'Time Sensitive Notifications' is a self-service capability in Apple's supported-capabilities list, with no request form. Critical Alerts, by contrast, need an Apple request/approval. Apple deprecated the UNAuthorizationOptions.timeSensitive runtime option with the message 'Use time-sensitive entitlement'. No extra permission prompt exists, but users can turn time-sensitive off, and iOS periodically asks them to re-evaluate it. App Store review: Apple does not publish a formal justification requirement or form for time-sensitive. HIG says to use it only for events 'happening now or will happen within an hour' and never for marketing. Guideline 4.5.4 says push must not be required for the app to work and must not be used for promotions without opt-in. The App Review Guidelines were last updated 2026-06-08. Approach-within-10-km and touchdown alerts fit Apple's definition.
CHANGE: In Part 4 app.config.ts, add ios.entitlements { 'com.apple.developer.usernotifications.time-sensitive': true } (plus aps-environment, which expo-notifications adds). In ACTIVATION.md, change the Apple item to: 'No request needed. EAS capability sync turns on Time Sensitive Notifications. Only check it in the App ID if you manage credentials manually.' Say explicitly: do not use 'critical', because it needs an Apple-approved entitlement. Add an App Review note (TR/EN): time-sensitive is used only for user-configured approach and touchdown alerts, never for marketing. Keep the in-app preference toggle that sends 'active' instead of 'time-sensitive'.
VERIFY: finding_upheld :: The researcher's 'partially_true' rating holds. The prompt text is quoted correctly: Part 4 line 41 reads 'iOS: zamana duyarli bildirim yetkisi (entitlement) ve kullanici tercihi', and the ACTIVATION list under Apple, around line 147, includes 'zamana duyarli bildirim yetkisi'. The entitlement is real and needed. Treating it as something to request from Apple is the wrong part. Checked on 2026-09-25:

(1) Key. The entitlement is com.apple.developer.usernotifications.time-sensitive, a Boolean set to true. Three sources confirm it: the Expo capabilities table (page updated 2026-07-28), the eas-cli source capabilityList.ts (CapabilityType.USER_NOTIFICATIONS_TIME_SENSITIVE, boolean sync), and Microsoft Learn. Apple's Bundle Resources Entitlements reference has no page for this key: the URL returns 404 and the index lists only critical-alerts and filtering. So Apple's own citation for it is the capability list, not an entitlement page. In Expo, set it with ios.entitlements in app config.

(2) Self-service. Apple's supported-capabilities list shows 'Time Sensitive Notifications' as available for ADP, ADEP and the free Apple Developer membership. Critical Alerts, by contrast, is a managed entitlement. Apple's entitlement page says 'To request this entitlement for your app' and links to developer.apple.com/contact/request/notifications-critical-alerts-entitlement/. The HIG also says of Critical notifications that 'you must get an entitlement to send one'. No request or approval form exists for Time Sensitive.

(3) EAS sync. This part needs a precise caveat. EAS syncs capabilities only when eas-cli has an Apple auth context. In SetUpTargetBuildCredentials, bestEffortAppStoreAuthenticateAsync() runs, and ensureBundleIdExistsAsync, which syncs capabilities, is called only 'if (ctx.appStore.authCtx)'. bestEffortAppStoreAuthenticateAsync returns early in --non-interactive mode, such as GitHub Actions CI. It also skips an individual App Store Connect API key that has no issuer ID. Local credentials (credentialsSource: local) never reach this path, and EXPO_NO_CAPABILITY_SYNC=1 turns syncing off. So 'no manual portal step when EAS manages credentials' is true only if at least one interactive `eas build -p ios` runs with Apple login after the entitlement is added. Otherwise, tick the capability in Certificates, Identifiers & Profiles and regenerate the provisioning profiles. ACTIVATION.md should keep a step for this, worded as 'enable the capability (interactive eas build or portal checkbox)' rather than 'request'.

(4) Runtime. UNAuthorizationOptions.timeSensitive has been deprecated since iOS 15.0, the same version that introduced it. The deprecation message is 'Use time-sensitive entitlement'. No separate permission prompt exists. UNNotificationInterruptionLevel.timeSensitive says 'The user can turn off the ability for time sensitive notification interruptions', and UNNotificationSettings.timeSensitiveSetting (iOS 15+) lets the app read the user's setting.

(5) HIG wording, verified. Use Time Sensitive only for an event 'happening now or will happen within an hour'. Never use it for marketing. On first delivery, the system explains how such notifications work and offers a way to turn them off, and 'periodically' lets people re-evaluate. Time Sensitive breaks through Focus and scheduled delivery but not the Ring/Silent switch.

(6) App Review. The Guidelines are dated 'Last Updated: June 8, 2026'. Guideline 4.5.4 says push must not be required for the app to function and must not be used for promotions without explicit in-app opt-in plus an opt-out. The Guidelines don't mention time-sensitive at all, so no formal justification is published. Approach-within-10-km and touchdown alerts fit Apple's definition.

(7) Related fact for Part 2. The Expo Push API officially supports interruptionLevel 'active' | 'critical' | 'passive' | 'time-sensitive' (iOS only). The prompt's fallback of sending directly to APNs with a .p8 key is therefore not needed for time-sensitive delivery.

### M5 [confirmed/medium]
CLAIM: Part 4 §2 covers: runtimeVersion policy fingerprint; EAS Update channels with production OTA only when native code is unchanged; uploading the FCM v1 service account to EAS; eas build/eas submit; and that Expo Go is not targeted (development build).
FACT: The 'fingerprint' runtimeVersion policy exists and is documented: it computes the runtime hash with @expo/fingerprint, handles SDK upgrades and native changes automatically, and supports .fingerprintignore / fingerprint.config.js. Other policies are 'appVersion' and 'nativeVersion'. Channels are set per build profile in eas.json ('channel': 'production' / 'preview'). A channel links to the branch of the same name by default, and the channel baked into a build cannot be changed later. Since SDK 54, 'channel surfing' lets a build request updates from another channel at runtime. Publish with: eas update --channel <name> --message '...' --environment <env>. --environment is REQUIRED in SDK 55+. FCM v1 upload: run eas credentials, then Android > production > Google Service Account > 'Manage your Google Service Account Key for Push Notifications (FCM V1)' > upload JSON, or use Dashboard > Credentials > Service Credentials > FCM V1 service account key. google-services.json goes in android.googleServicesFile. The server SDK removed the useFcmV1 option in v5. eas submit: iOS needs a paid ADP account, an App Store Connect API key (set up by EAS or ascApiKeyPath/IssuerId/Id), and ascAppId. It runs in CI with EXPO_TOKEN. Android needs a Google Service Account key uploaded to EAS. Change: since the docs restructure of 2026-07-17, the first Android submission works through eas submit (to the internal track, app stays in draft). Earlier docs required the first upload by hand. --auto-submit is available. Expo Go: remote push via expo-notifications has been unavailable in Expo Go on Android since SDK 53 and throws an error since SDK 55, so a development build is required (it is required anyway for MapLibre). Since 2026-09-03, Expo Go projects require login.
CHANGE: Add to Part 4 §2: 'In .github/workflows/mobile.yml, pass eas update --channel <c> --message <m> --environment <production|preview>, which is required on SDK 55+. Give the production/preview build profiles channel: production/preview. Use runtimeVersion { policy: "fingerprint" } and add a .fingerprintignore for monorepo noise. For CI, store EXPO_TOKEN, the ASC API key and the Play service-account JSON as GitHub secrets.' In MOBILE_RELEASE.md, note that the first Android release can go through eas submit to the internal track. Keep 'Expo Go is not targeted'.

### M6 [confirmed/low]
CLAIM: Part 3 §4 says 'iPhone: show an Add to Home Screen prompt for web push' (PWA + Web Push using VAPID).
FACT: This is still true. On iOS/iPadOS, Web Push works only for web apps added to the Home Screen (since iOS 16.4, Feb/Mar 2023). A Safari tab does not get PushManager. Permission must be requested in response to a direct user interaction such as a Subscribe button. Declarative Web Push (announced 2025-03-27) shipped in iOS/iPadOS 18.4 'for web apps added to the Home Screen', and the WebKit blog also lists the macOS 15.5 beta. It removes the need for a service worker (window.pushManager plus a JSON payload with top-level "web_push": 8030, notification.title, and a required notification.navigate URL, optional app_badge), and the same payload stays compatible with service-worker browsers. It does NOT remove the Home Screen requirement. iOS 26 changed Home Screen behavior: every site added to the Home Screen opens as a web app by default, with no manifest needed, so the flow is simpler but installing is still required. Safari 26.4, 26.5 and 26.6, and Safari 27.0 (released 2026-09-17) add nothing that brings Web Push to Safari tabs on iOS. Web Push does not require Apple Developer Program membership. Allow *.push.apple.com endpoints.
CHANGE: Keep the Add to Home Screen guidance and make it more specific: 'On iOS, show the push toggle only when running in standalone mode (display-mode: standalone / navigator.standalone). Otherwise show step-by-step Add to Home Screen instructions. Request permission only from a button tap. Send web push payloads in the Declarative Web Push format ({"web_push":8030,"notification":{title, body, navigate:"/flight/<id>", ...}}) and keep a service worker push handler that parses the same JSON for Chrome/Firefox/Android. Clean up subscriptions on 404/410. Allow outbound traffic to *.push.apple.com.'

### M7 [confirmed/medium]
CLAIM: Part 4 has an in-app 'download my data' and 'delete account' flow (store requirement), and Part 3 has account deletion on the web.
FACT: Apple: since 2022-06-30, apps that support account creation must let users start account deletion inside the app (Guideline 5.1.1(v), guidelines last updated 2026-06-08). Deletion must remove the whole account record and associated personal data; only deactivating is not enough. If deletion finishes on the web, the app must link directly to that page. Non-regulated apps must not require a phone call or email. Re-authentication or a confirmation code is allowed. Users must be told if deletion takes time. Apps using Sign in with Apple must revoke tokens through the SIWA REST API. 5.1.1(v) also says: if the app has no significant account-based features, let people use it without logging in. Guideline 4.8: if you add Google or other social login, you must also offer an equivalent privacy-preserving login such as Sign in with Apple. Google Play: apps that allow account creation must provide (1) an in-app path to delete the account and its data and (2) a web link resource where users can request account and data deletion without reinstalling the app. The page must work, feature the deletion path prominently, and name the app or developer. The URL is entered in the Data safety form's data deletion questions. Enforcement deadlines passed (2023-12-07, extended to 2024-05-31), and non-compliant apps risk removal.
CHANGE: Add to Part 3/4: 'Publish a public, no-login-required page at /account/delete (TR/EN) that names the app, explains what is deleted and what is kept, and lets users request deletion by email verification. Put this URL in the Play Data safety form and in MOBILE_RELEASE.md. In-app deletion must hard-delete or anonymize the user, devices, push tokens, follow rules and notifications (with a documented retention period for backups) and confirm by email code. Keep the map, search and flight detail usable without login, and require an account only for follows and alerts (Apple 5.1.1(v)). If social login is added, add Sign in with Apple (4.8) and SIWA token revocation.'

EXTRA: 1) Solo-developer Play Store gate, which the prompt set does not mention: personal Google Play developer accounts created after 2023-11-13 must run a closed test with at least 12 testers opted in continuously for at least 14 days before applying for production access. Review usually takes 7 days or less. Source: https://support.google.com/googleplay/android-developer/answer/14151465. This belongs in ACTIVATION.md and in the timeline, because it blocks the Android public launch by about 3 weeks.
2) pnpm monorepo: Expo supports pnpm isolated installs since SDK 54. The docs recommend nodeLinker: hoisted in pnpm-workspace.yaml if a React Native library breaks under isolated installs (https://docs.expo.dev/guides/monorepos/). Worth adding to CLAUDE.md as a fallback.
3) expo-server-sdk v6+ is ESM-only and v7+ needs Node >=22.12. The worker/API Docker images must use Node 22.12+ (Node 24 LTS preferred) and ESM or dynamic import.
4) The Android push default priority is 'normal', which can be delayed in Doze. Every alert push must set priority:'high'. Otherwise the p95 < 3 s latency target in Part 2 will not hold on Android.
5) Android channelId: if flight-alerts has not been created on the device, the notification is silently not shown. Create the channels at app start, before getExpoPushTokenAsync (the Expo docs require a channel before token retrieval on Android 13+).
6) The iOS push payload uses 'time-sensitive' (hyphen) while the expo-notifications local API uses 'timeSensitive' (camelCase). Tell the coding agent explicitly.
7) Useful new push fields for this app: tag (Android) and collapseId/threadId (iOS), so an 'approaching' alert can be replaced or grouped with the 'touchdown' alert for the same flight.
8) SDK 58 (RN 0.88) will probably go stable in Oct 2026. If Part 4 starts after that, the agent should target SDK 58 and re-check MapLibre RN peer compatibility (currently RN >= 0.80, expo >= 54).
9) Expo Go for SDK 57 was still awaiting store approval per the SDK 57 changelog. This does not matter because the project uses development builds only.
10) Web Push on iOS does not need Apple Developer Program membership. Mobile time-sensitive push does need the paid ADP (99 USD/year).


######## GROUP webstack

### W1 [partially_true/high]
CLAIM: Stack as written in 00/01: Node.js 'aktif LTS', pnpm workspaces + Turborepo, Next.js App Router with `standalone` output, React, Fastify REST+WS with permessage-deflate on, Drizzle + drizzle-kit (PostGIS installed via migration, daily-partitioned track_points), MapLibre GL JS, BullMQ on Redis with 'maxmemory-policy noeviction (BullMQ requires it)', Redis (password, AOF), PostgreSQL+PostGIS docker, Vitest, Playwright. No versions are pinned.
FACT: The stack still works, and the specific technical claims check out. But since the prompts were written, several major releases in 2025-2026 changed the details. Checked 2026-09-25:
- Node.js: v24 'Krypton' is Active LTS (24.21.0) until 2026-10-20, then goes to Maintenance. v26 (26.10.0, Current) becomes LTS on 2026-10-28. v22 is Maintenance LTS until 2027-04-30. From Node 27 the release cycle is annual and every major becomes LTS. Node 25+ does not ship Corepack, so v26 has none.
- pnpm: the npm 'latest' tag is 12.6.0 (2026-09-22). 12.7.0 is on 'next'. The 11.x line is still maintained (11.28.0).
  - pnpm 11.0 (2026-04-28): needs Node 22+ when installed through npm. pnpm-specific settings must move to pnpm-workspace.yaml (the package.json 'pnpm' field is ignored). `allowBuilds` replaces onlyBuiltDependencies and the other build-script options. minimumReleaseAge defaults to 1440 min and blockExoticSubdeps to true.
  - pnpm 12.0 (2026-08-26): unknown workspace settings are reported, and fail install when the pnpm version is pinned. `--frozen-lockfile false` was removed.
- Turborepo: 2.11.4 (2026-09-24).
- Next.js: 16.3.6 (2026-09-22), needs Node >= 20.9. `output:'standalone'` is still supported (docs for 16.3.6):
  - public/ and .next/static are not copied; copy them yourself.
  - In a monorepo, set `outputFileTracingRoot` to the repo root.
  - Other Next 16 changes: Turbopack is the default for dev and build; middleware was renamed to proxy; `next lint` was removed; serverRuntimeConfig and publicRuntimeConfig were removed.
- React: 19.3.0 (2026-09-09).
- Fastify: 5.12.5 (2026-09-16). v6 is only at 6.0.0-alpha.4.
- @fastify/websocket: 11.3.1 (2026-09-18, MIT, depends on ws ^8.16).
  - Settings in the plugin's `options` key go straight to ws, and `perMessageDeflate` is supported.
  - ws turns permessage-deflate off by default on the server, so it must be enabled explicitly.
  - ws warns that concurrent zlib use on Linux can cause severe memory fragmentation. Tune threshold/concurrencyLimit and load-test.
- Drizzle: the stable releases are drizzle-orm 0.45.3 and drizzle-kit 0.31.11 (2026-09-21). v1.0 is still a release candidate (1.0.0-rc.4 on the 'rc' tag), yet the docs site already shows some v1-only material, such as codecs.
  - PostGIS: there is a built-in `geometry(name,{type:'point', mode:'xy'|'tuple', srid})` column. Other geometry types need `customType`. GIST indexes go through the normal index API. Use `extensionsFilters:['postgis']` so push/pull ignore PostGIS's own tables.
  - Partitioning: not supported. Issue #6235 (opened 2026-09-04) is open.
  - Issue #6093 (open): `drizzle-kit pull` drops partitioned parent tables (relkind 'p').
  - `tablesFilter` applies only to push and pull.
- MapLibre GL JS: 6.11.2 (2026-09-24). v6.0.0 (2026-07-22) broke compatibility:
  - ESM-only; the UMD and CSP bundles were removed.
  - WebGL2 is required.
  - The build target is ES2022.
  - `map.transform` was removed.
  - `GeoJSONSource.setData` lost its second parameter (`waitForCompletion`) and its return value changed.
  - `styleimagemissing` is now notify-only.
- BullMQ: 6.3.8 (2026-09-18). v6.0.0 (2026-07-30) broke compatibility:
  - Legacy repeatable jobs were removed: the repeat option, the Repeat class, getRepeatableJobs and removeRepeatable*. Use Job Schedulers instead.
  - ioredis is now an optional peer dependency and must be installed explicitly.
  - The Connection parameter was replaced by a BackendFactory.
  - There is a new PostgreSQL backend, about 1.5–2x lower throughput than Redis.
  - The production guide still says `maxmemory-policy noeviction` is 'the only setting that guarantees the correct behavior'. It recommends AOF, and `maxRetriesPerRequest: null` for ioredis Workers.
  - bullmq.io lists Valkey as supported.
- Redis:
  - Licensing: 8.0+ is tri-licensed (RSALv2 / SSPLv1 / AGPLv3). Redis states that users running unmodified code are not affected; only modified code offered as a network server must publish its source. Self-hosting is fine.
  - Latest version: 8.10.2 (2026-09-17).
  - Defaults: maxmemory is 0 (unlimited) on 64-bit, and the default policy is noeviction. Keys with a TTL still expire under noeviction.
  - Valkey 9.1.x (BSD-3-Clause) is a drop-in alternative.
- PostgreSQL: 18.6 is the newest stable version. PG19 is only at Beta 4 (2026-09-24).
- PostGIS image: use `postgis/postgis:18-3.6` (PostGIS 3.6.4, Debian trixie). `latest` has the same digest as `17-3.5`, so it is not PG18. The images are amd64-only, and PostGIS 3.7 is still a release candidate.
- Vitest: 5.0.2 (5.0.0 released 2026-09-03). Needs Node ^22.12, ^24 or >=26, and Vite >= 6.4. clearMocks now defaults to true, and unawaited async assertions fail the test.
- Playwright: 1.63.0 (2026-09-04), needs Node >= 20.
CHANGE: In 00-ortak-baglam-CLAUDE.md, add a 'Sürüm pinleri (doğrulama: 2026-09-25)' block with these items:
- Node 24 LTS: `.nvmrc`=24 and Docker `node:24-*-slim`. Note that Node 26 becomes LTS on 2026-10-28 and the move is planned after that date.
- `"packageManager": "pnpm@12.6.0"`. The Dockerfile must not rely on corepack (Node ≥25 does not ship it); use `npm i -g pnpm@12.6.0` or the standalone installer.
- pnpm settings (`allowBuilds`, and `minimumReleaseAge` if needed) belong in pnpm-workspace.yaml.
- turbo 2.11.x, next 16.3.x, react 19.3.x, fastify 5.x (not 6-alpha), @fastify/websocket 11.x, drizzle-orm 0.45.x / drizzle-kit 0.31.x (1.0-RC API'lerini kullanma), maplibre-gl 6.x, bullmq 6.x plus an explicit `ioredis` dependency, vitest 5.x, @playwright/test 1.63.x, `postgis/postgis:18-3.6` (latest değil), redis 8.x or valkey 9.x.

In 01, section 2 (Docker):
- Next standalone + `outputFileTracingRoot` pointing at the repo root.
- Copy `public` and `.next/static` into the image.
- Runtime config is read on the server (no `publicRuntimeConfig`).

In 01, section Redis, add:
- `maxmemory` below the container limit (e.g., 400mb for 512 MB).
- Trim streams with XADD MAXLEN ~.
- BullMQ Workers use `maxRetriesPerRequest: null`.

In 01/02, every periodic job (METAR 10 dk, TAF 60 dk, partition bakımı, receipt kontrolü) uses `queue.upsertJobScheduler()`. Do not use `repeat` (removed in BullMQ v6).

In 01 WS: 'permessage-deflate açık' → enable it explicitly (`options.perMessageDeflate`, threshold ≈1024 B, concurrencyLimit) and measure memory in a load test.

MapLibre v6 notes:
- ESM-only and WebGL2 required.
- Load it only in a client component.
- `setData` has no second argument.
VERIFY: finding_upheld :: I re-checked every claim against the primary sources on 2026-09-25. The researcher's 'partially_true' verdict stands: the stack still works, but no versions are pinned and several majors moved in 2025-2026. Small corrections are marked (correction).

Node.js
- v24 'Krypton' is Active LTS at 24.21.0 (2026-09-07) and goes to Maintenance on 2026-10-20.
- v26.10.0 (2026-09-21) is Current and becomes LTS on 2026-10-28.
- v22.23.3 is Maintenance LTS until 2027-04-30. v20 reached end of life on 2026-04-30.
- nodejs.org: 'Starting with Node.js 27, the release cycle will be annual and every major version will move to LTS.'
- The TSC voted on 2025-03-19 to stop shipping Corepack from Node 25 onward.

pnpm
- The npm 'latest' tag is 12.6.0 (2026-09-22). 12.7.0 is on 'next'.
- (correction) 'latest-11' is 11.27.1 (2026-09-20). 11.28.0 was published today on the 'next-11' tag.
- pnpm 11.0.0 (2026-04-28):
  - Drops Node 18-21 (engines >=22.13).
  - Ignores the package.json 'pnpm' field.
  - Reads only auth and registry settings from .npmrc; everything else goes in pnpm-workspace.yaml.
  - allowBuilds replaces onlyBuiltDependencies, onlyBuiltDependenciesFile, neverBuiltDependencies, ignoredBuiltDependencies and ignoreDepScripts.
  - minimumReleaseAge now defaults to 1440 and blockExoticSubdeps to true.
- pnpm 12.0.0 (2026-08-26):
  - Returns ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS when the pinned version is satisfied (otherwise it warns).
  - `--frozen-lockfile false` was removed; use `--no-frozen-lockfile`.
  - It is a native executable. Installed via npm, the docs say it needs Node 22.13+, even though package.json says >=18.

Web framework
- Turbo 2.11.4 was released 2026-09-24.
- Next.js 16.3.6 (2026-09-22) needs Node >=20.9.0.
- The output docs (v16.3.6) confirm three points about standalone:
  - The standalone server.js does not copy public/ or .next/static.
  - In a monorepo, set outputFileTracingRoot.
  - Turbopack is the default for dev and build.
- `next lint` was removed, and serverRuntimeConfig/publicRuntimeConfig were removed.
- (correction) The `middleware` file convention is deprecated and renamed to `proxy`, not removed. It still works and is needed if you want the edge runtime.
- React 19.3.0 was released 2026-09-09.

Fastify and WebSocket
- Fastify 5.12.5 was released 2026-09-16. Its 'next' tag is 6.0.0-alpha.4.
- @fastify/websocket 11.3.1 (2026-09-18) is MIT and depends on ws ^8.16.0. Its README lists `perMessageDeflate` among the options passed to ws.
- The ws README says the extension 'is disabled by default on the server'. It warns of 'catastrophic memory fragmentation' under concurrency on Linux, and that concurrencyLimit (10) and threshold (1024) can be tuned.

Drizzle
- The stable releases are drizzle-orm 0.45.3 and drizzle-kit 0.31.11 (2026-09-21). The 'rc' tag is 1.0.0-rc.4 (2026-06-27).
- The docs site has a Codecs page. The 0.45.3 tarball has no codec files, while the rc.4 tarball does, which supports the 'v1-only docs' point.
- PostGIS:
  - The built-in `geometry(name, {type, mode:'tuple'|'xy', srid})` is typed as `type?: 'point' | string`.
  - (correction) The docs say you can put any string in `type`, but the built-in mapper always decodes to [x,y] or {x,y}. In practice, non-point geometries still need customType.
  - GIST indexes use `index().using('gist', ...)`.
  - extensionsFilters and tablesFilter apply only to push and pull.
- Partitioning: issue #6235 ('Postgres Table Partition Support') is open and was opened 2026-09-04. Issue #6093 is open: pull filters on relkind IN ('r','v','m'), so partitioned parents are dropped.

MapLibre GL JS
- 6.11.2 was released 2026-09-24. v6.0.0 (2026-07-22) broke the following:
  - It is ESM-only. The UMD and CSP bundles were removed, and `import maplibregl from` must change to `import * as`.
  - WebGL2 is required.
  - The TypeScript target is ES2022.
  - `map.transform` was removed.
  - `setData` lost its waitForCompletion parameter and no longer returns `this`.
  - `styleimagemissing` is notify-only; use setMissingStyleImageResolver instead.

BullMQ
- 6.3.8 was released 2026-09-18. The v6.0.0 changelog (2026-07-30) confirms:
  - Legacy repeatable jobs were removed; use Job Schedulers.
  - ioredis is an optional peer and must be installed explicitly.
  - The optional Connection constructor parameter was replaced by a BackendFactory. (clarification) Queue#client and similar accessors were also removed.
  - There is a PostgreSQL backend with '~1.5–2× fewer jobs/s'.
- The production guide still says noeviction is the only safe policy. It recommends AOF and maxRetriesPerRequest: null for Workers.
- bullmq.io lists Valkey.

Redis
- Redis 8+ is tri-licensed (RSALv2 / SSPLv1 / AGPLv3). Its FAQ says there is no impact for as-is use.
- 8.10.2 was released 2026-09-17.
- redis.conf defaults to 'maxmemory-policy noeviction'. maxmemory 0 means unlimited on 64-bit.
- Valkey 9.1.2 was released 2026-08-31.

PostgreSQL and PostGIS
- PostgreSQL 18.6 is the current stable release. PG19 is at Beta 4 (2026-09-24), with RC and GA expected in October.
- postgis/postgis:18-3.6 is Debian trixie with PostGIS 3.6.4 and is amd64-only.
- The 'latest' tag has the same digest as 17-3.5.
- PostGIS 3.7.0 is at rc2 (2026-09-08).

Testing
- Vitest 5.0.0 was released 2026-09-03, and 5.0.2 today:
  - It needs Node ^22.12 || ^24 || >=26 and Vite ^6.4 || ^7 || ^8.
  - clearMocks now defaults to true.
  - Unawaited resolves/rejects now fail the test.
- Playwright 1.63.0 was released 2026-09-04 and needs Node >=20.

### W2 [partially_true/medium]
CLAIM: 03: 'Veri için aday: B612 (Airbus kokpit ekranları için tasarlanmış, açık lisanslı)'. Font families must fully support ğ ş ı İ ç ö ü, use tabular figures, and the UI font should be a signage-style sans.
FACT: Some of the B612 claims are true. It was made by Airbus, ENAC and Université de Toulouse for cockpit screens. The font is licensed OFL 1.1 (the repo is also EPL-2.0/EDL-1.0).

It fails the Turkish requirement:
- Google Fonts lists B612 and B612 Mono only in the 'latin' subset (no latin-ext). The served unicode-range is U+0000-00FF + U+0131.
- I parsed the cmap of the actual TTF (v1.008, identical in google/fonts and polarsys/b612). It lacks ğ Ğ ş Ş ı İ (U+011E/011F/015E/015F/0130/0131). It has ç Ç ö Ö ü Ü â î û.
- It has no GSUB table at all, so there is no 'tnum' or 'locl'. All ten digits share one advance width (1300 units), so the figures are effectively tabular by default. B612 Mono is monospaced.

Font alternatives, all OFL on Google Fonts, all verified by cmap to contain the full Turkish set:
- Overpass v4.000: inspired by Highway Gothic (road-sign typeface), which fits the signage style. It has tnum, locl and case features; digits are proportional by default. Overpass Mono has the same Turkish coverage.
- Public Sans v2.001 (USWDS): tnum and locl.
- Atkinson Hyperlegible Next v2.001 (Braille Institute, added 2025): tnum and locl. Atkinson Hyperlegible Mono also has Turkish coverage.
- IBM Plex Sans v3.201: digits are tabular by default (600 units each) and there is no tnum toggle. IBM Plex Mono also has Turkish coverage.
CHANGE: In 03, replace the Tipografi lines with:
- 'Veri: B612 Türkçe glifleri (ğ Ğ ş Ş ı İ) içermez; yalnızca rakam/ASCII için kullanılabilir. Tercih: Atkinson Hyperlegible Mono veya IBM Plex Mono (Türkçe tam, OFL).'
- 'Arayüz: Overpass (Highway Gothic esinli levha karakteri, OFL; `font-variant-numeric: tabular-nums` ile tnum) — alternatif Atkinson Hyperlegible Next.'

Also add these rules:
- Self-host the fonts with next/font or @fontsource, including the latin-ext subset.
- Set `<html lang="tr">` so the locl feature gives correct İ/ı casing under text-transform.
- Write this decision into DECISIONS.
VERIFY: finding_upheld :: Confirmed. B612 fails the prompt's own requirement in 03 that font families 'Türkçe karakterleri (ğ ş ı İ ç ö ü) eksiksiz desteklemeli'.

B612 checks
- Google Fonts METADATA.pb for b612 and b612mono lists only subsets 'latin' and 'menu', with license OFL.
- The served CSS unicode-range is the generic latin range: U+0000-00FF, U+0131, ...
- I parsed the cmap of B612-Regular.ttf, B612-Bold.ttf and B612Mono-Regular.ttf myself (all 'Version 1.008'). The google/fonts file and polarsys/b612 master fonts/ttf/B612-Regular.ttf are byte-identical (sha1 9b73b9f6...).
- Ğ ğ Ş ş İ ı (U+011E/011F/015E/015F/0130/0131) are missing. ç Ç ö Ö ü Ü â î û are present.
- All ten digits have a 1300/2000 advance, so they are de facto tabular.
- (minor correction) B612 Regular does contain a GSUB table, but it is an empty 16-byte stub with 0 features and 0 lookups. B612 Mono has no GSUB table at all. The practical result is the same: no tnum or locl.
- The polarsys README confirms the rest:
  - It came from a 2010 Airbus research collaboration with ENAC and Université de Toulouse III.
  - The glyphs were designed by Intactile DESIGN.
  - It was made for aircraft cockpit screens.
  - It is licensed EPL-2.0 + EDL-1.0 + OFL-1.1.

Alternatives (cmap-verified: full Turkish set present in every file)
- Overpass v4.000:
  - Delve Fonts, sponsored by Red Hat.
  - Google describes it as 'an interpretation of the well-known Highway Gothic letterforms', suited to signage.
  - GSUB has tnum, pnum, locl and case. Default digits are proportional.
- Overpass Mono v4.000: digits are 1232 wide.
- Public Sans v2.001 (USWDS): tnum and locl; proportional by default.
- Atkinson Hyperlegible Next v2.001:
  - Added to Google Fonts 2025-01-07.
  - tnum, pnum and locl; proportional by default.
- Atkinson Hyperlegible Mono v2.001: added 2024-11-20.
- IBM Plex Sans v3.201:
  - All digits are 600 wide (tabular by default).
  - No tnum/pnum feature; it has lnum, onum and locl.
- IBM Plex Mono v2.3: Turkish coverage is complete.
- All of these are licensed OFL.

### W3 [confirmed/medium]
CLAIM: 02: when there is no QNH, height above field = alt_geom − the station's EGM96 geoid undulation, computed once per station.
FACT: The npm package egm96-universal exists: v1.1.1 (published 2024-10-10), MIT license, about 36k downloads per week. It exposes `meanSeaLevel(lat, lon)` (geoid undulation in meters), `ellipsoidToEgm96(lat, lon, alt)` and `egm96ToEllipsoid(...)`. It uses the NGA EGM96 data file with bilinear interpolation, runs in Node and the browser, and ships TypeScript types. The package is about 5.5 MB unpacked because it embeds the grid, so keep it in the worker/engine and out of the web bundle. The repo has had no commits since 2024-10, which is fine because EGM96 is static.

The ADS-B `alt_geom` field (readsb/adsb.lol) is in feet above the WGS84 ellipsoid, so the correction is: MSL = alt_geom − N.

Sanity values from GeographicLib GeoidEval (EGM96):
- LTFM (41.2753, 28.7519): N = +37.05 m (≈121.5 ft)
- LTFJ/SAW (40.8986, 29.3092): +37.61 m
- LTAI/AYT (36.8987, 30.8005): +27.36 m

So '~+37 m around Istanbul' is correct. Getting the sign wrong gives a ≈240 ft error.
CHANGE: In 02, name the method explicitly:
- 'egm96-universal@1.1.1 (MIT) `meanSeaLevel(lat, lon)` ile N (m) hesapla, `stations.geoid_undulation_m` kolonunda sakla.'
- 'alan_üstü_ft = alt_geom_ft − N_m×3.28084 − field_elev_ft'.

Also add unit tests: LTFM ≈ 37.05 m, SAW ≈ 37.61 m, AYT ≈ 27.36 m (tolerance ±0.5 m). Keep the package in packages/engine or worker only.

### W4 [partially_true/high]
CLAIM: 01: `track_points` is daily partitioned. A partition job opens future partitions and drops expired ones. Migrations use Drizzle + drizzle-kit. Retention: general track 30 s sampling for 7 days; aircraft inside a station radius at full resolution for 30 days.
FACT: PostgreSQL 18 native declarative RANGE partitioning by day works well for this:
- `CREATE TABLE ... PARTITION OF ... FOR VALUES FROM (...) TO (...)` creates each day's partition.
- A primary key or unique constraint must include the partition key (ts).
- `DETACH PARTITION ... CONCURRENTLY` needs only a SHARE UPDATE EXCLUSIVE lock.
- Indexes on the parent propagate to partitions.

Drizzle cannot model partitions. Issue #6235 is open, and drizzle-kit pull drops partitioned parents (#6093). The parent DDL must therefore be SQL you write or edit yourself: `drizzle-kit generate --custom --name=...` creates an empty migration. `tablesFilter` affects only push and pull, not generate.

pg_partman is not in the postgis/postgis image, which ships only the PostGIS extensions.
- It can be added with a small custom image: FROM postgis/postgis:18-3.6 (Debian trixie) + apt `postgresql-18-partman`. PGDG has 5.5.0 for pgdg13 (trixie).
- pg_partman 5.5.0 (2026-07-22) uses the PostgreSQL License and supports only native declarative partitioning.
- Its optional background worker needs shared_preload_libraries. Otherwise call run_maintenance_proc from a scheduled job.

TimescaleDB 2.30.1 (2026-09-17) is an alternative; the company is now 'TigerData'.
- Hypertables and drop_chunks are Apache-2.
- Retention policies, columnstore compression, continuous aggregates and jobs are Community/TSL. They are free to self-host but may not be sold as a DBaaS.
- The timescale/timescaledb-ha image includes PostGIS.

Design flaw in the prompt: one daily-partitioned table cannot give per-row retention of 7 days (general) and 30 days (station/watchlist). Dropping a whole partition removes both classes at once.
CHANGE: Rewrite section 3 of 01 as follows.

(1) Use two partitioned tables:
- `track_points` (30 sn örnekleme, 7 gün)
- `track_points_hr` (tam çözünürlük, 30 gün)

Both use `PARTITION BY RANGE (ts)` with daily partitions and a PK of `(flight_id, ts)`.

(2) Keep the columns in the Drizzle schema for typing, but write the parent tables with `drizzle-kit generate --custom` or by editing the generated migration by hand. Record this in DECISIONS.

(3) Partition job: a BullMQ `upsertJobScheduler` job runs daily and does two things:
- `CREATE TABLE IF NOT EXISTS <t>_YYYYMMDD PARTITION OF <t> FOR VALUES FROM ... TO ...` for the next 3 days.
- `DETACH PARTITION ... CONCURRENTLY` + `DROP TABLE` for expired partitions.

Add an integration test for the job. Optionally, use pg_partman 5.5 through a custom image `FROM postgis/postgis:18-3.6` + `apt-get install postgresql-18-partman`.

(4) Add the note: 'TimescaleDB (timescaledb-ha, PostGIS dahil) alternatiftir; retention/compression TSL özellikleridir (self-host ücretsiz) — MVP'de native partition yeterli.'
VERIFY: finding_upheld :: Confirmed. Prompt 01 (lines 43-50) defines one `track_points` table with 'günlük partition'lı' and a maintenance job that 'saklama süresi dolanları düşürür'. It also sets two retention classes: 30 s sampling for 7 days, and full resolution for 30 days for aircraft in a station radius or on a watchlist. Dropping a daily partition removes both classes together, so the design is inconsistent as written. The fix is either separate tables (or LIST-by-class then RANGE-by-day sub-partitioning), or keeping 30 days of partitions and DELETE-ing general rows older than 7 days.

PostgreSQL 18.6 partitioning docs
- A PK or unique constraint 'must include all of the partition key columns'.
- `DETACH PARTITION ... CONCURRENTLY` needs only a SHARE UPDATE EXCLUSIVE lock on the parent.
- An index created on the parent 'automatically creates a matching index on each partition', including ones attached later.
- `DROP TABLE` on a partition is the recommended way to apply retention.

Drizzle
- There is no partition support: issue #6235 is open (opened 2026-09-04), and #6093 is open (pull filters relkind IN ('r','v','m'), dropping partitioned parents).
- The docs give `drizzle-kit generate --custom --name=...` for 'DDL alternations currently not supported by Drizzle Kit'.
- tablesFilter and extensionsFilters apply only to push and pull, not generate or migrate.

pg_partman
- 5.5.0 was released 2026-07-22 (release feed). Its control file has default_version 5.5.0 and superuser=false.
- It is under the PostgreSQL License, and 'only built-in, declarative partitioning is supported'.
- The BGW requires shared_preload_libraries = 'pg_partman_bgw'.
- (addition) 5.5.0 has breaking security changes:
  - The default `pg_partman_bgw.role` is now 'partman_maintainer'.
  - The retention-schema ownership rule changed (CVE-2026-61821).
- PGDG trixie (pgdg13) ships postgresql-18-partman_5.5.0-1.pgdg13+1 for amd64 and arm64.
- postgis/postgis images do not include pg_partman. The README lists only the PostGIS-family extensions (postgis, topology, fuzzystrmatch, tiger_geocoder <3.7).
- postgis/postgis:18-3.6 is FROM postgres:18-trixie, so a custom image with `apt-get install postgresql-18-partman` works.

TimescaleDB
- 2.30.1 was released 2026-09-17 (2.30.0 on 2026-09-08). Docs are now at tigerdata.com.
- Hypertables and drop_chunks are in both editions.
- add_retention_policy, columnstore/compression, continuous aggregates and jobs are Community (TSL) only.
- The TSL forbids selling it as a service: 'You cannot sell TimescaleDB Community Edition as a service'.
- The timescaledb-ha image includes PostGIS.

### W5 [confirmed/low]
CLAIM: 02: optional Cloudflare Turnstile at registration (`TURNSTILE_*`). Web Push with VAPID keys (`pnpm vapid:generate`) and subscription cleanup on 404/410.
FACT: Turnstile is still free.
- The Free plan costs nothing: unlimited verification requests, up to 20 widgets per account, 10 hostnames per widget, 7-day analytics.
- Enterprise is 'Contact Sales'.
- It works on any site without proxying traffic through Cloudflare.
- Server check: POST https://challenges.cloudflare.com/turnstile/v0/siteverify with `secret` and `response` (optional idempotency_key). A token is valid for 300 s and single-use (a replay returns timeout-or-duplicate).

The 'web-push' npm library is widely used and its repo is active, but releases are stale.
- Latest npm version is 3.6.7, published 2024-01-16 (no release in ~2.7 years). MPL-2.0 license, Node >= 16, about 6.7M downloads per week.
- The GitHub repo is not archived. It had commits through 2026-09-11, including human commits: Firefox CI tests (2026-07-23) and a docs warning against localhost VAPID subjects (2026-09-11).
- The Web Push protocol has not changed, so the library is usable.
- On iOS/iPadOS (16.4+), web push works only for web apps added to the Home Screen, and the permission request must come from a user gesture.
CHANGE: In 02:
- Pin 'web-push@3.6.7 (MPL-2.0)'.
- Add the rule 'VAPID subject `mailto:` veya https URL olmalı, localhost olamaz'.
- Turnstile: 'yalnızca sunucuda siteverify, token 300 sn ve tek kullanımlık, idempotency_key kullan'.

In 03 (PWA): 'iOS'ta web push yalnızca Ana Ekrana eklenmiş PWA'da (iOS 16.4+) ve kullanıcı etkileşimiyle izin istenerek çalışır; aksi halde kullanıcıyı mobil uygulamaya yönlendir.'

EXTRA: Other issues found during research that the prompt set does not cover:

1. **Redis memory.** Redis's default maxmemory is 0 (unlimited). With a 512 MB container limit and no `maxmemory` set, a spike gets the container OOM-killed rather than returning clean write errors.
   - Set maxmemory to about 80% of the container limit.
   - Streams such as `ac:updates` have no per-entry TTL, so trim them with XADD MAXLEN ~ or XTRIM.
   - TTL expiry still works under noeviction; only eviction is disabled.

2. **Next.js 16 runtime config.** publicRuntimeConfig was removed. NEXT_PUBLIC_* values are inlined at build time. The prompt's 'runtime config read from the server' must be done in Server Components or route handlers, calling `connection()` before reading process.env, or through a /config endpoint.

3. **Docker images.**
   - postgis/postgis images are amd64-only. Hostinger KVM (x86) is fine; ARM machines need emulation.
   - The `latest` tag is PG17/PostGIS 3.5. Pin `18-3.6`.
   - PG19 GA is imminent (Beta 4 on 2026-09-24). Don't use the 19beta tags.

4. **Node timing.** Node 24 moves to Maintenance on 2026-10-20 and Node 26 becomes LTS on 2026-10-28, so the 'aktif LTS' rule changes meaning within five weeks. Pin explicitly.
   - Node 26 ships no Corepack, so `corepack enable` in Dockerfiles fails.

5. **pnpm supply-chain defaults.** pnpm 11+ defaults minimumReleaseAge to 24h. This can block installing a same-day hotfix, and CI may behave differently from local if versions differ.
   - Native deps (esbuild, sharp, etc.) must be allowed via `allowBuilds` in pnpm-workspace.yaml.

6. **Drizzle docs vs installed version.** orm.drizzle.team already shows some v1.0 material (e.g., codecs) while the npm `latest` is 0.45.3. An agent may write v1-only APIs.
   - Tell the agent to use 0.45 APIs, or to adopt 1.0.0-rc deliberately.

7. **BullMQ v6 options.** v6 also offers a PostgreSQL backend (1.5–2x lower throughput). It could remove Redis for queues on a small VPS, but Redis is still needed for the live state, GEO and pub/sub, so keep Redis.

8. **Altitude caveat (not verified here).** Some transponders reportedly give GNSS height referenced to MSL rather than HAE. Treat the geoid-corrected alt_geom path as tertiary with tolerances, as the prompt already does.

9. **Method note.** Font glyph checks were done by parsing the TTF cmap/GSUB/hmtx tables in memory from the google/fonts GitHub repo. No files were saved or executed.

Files reviewed:
- C:\Users\ThePrinceTR\AppData\Roaming\Claude\scratch-workspaces\28854f8b-3656-4abe-b6ea-5b478af7994d\c278ab2f-9190-48f7-90b0-e1606de2f917\scratch-2026-09-25-ceba8e\source-prompts\00-ortak-baglam-CLAUDE.md
- ...\01-parca-1-altyapi-yayin-canli-veri.md
- ...\02-parca-2-olay-motoru-hesap-bildirim.md
- ...\03-parca-3-web-uygulamasi.md
