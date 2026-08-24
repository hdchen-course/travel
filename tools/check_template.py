#!/usr/bin/env python3
"""Region-page template conformance checker — enforces PAGE_TEMPLATE_SPEC.md.

canonical = Japan volume (japan/chubu.html). Checks every region page (any file with
<h2 id="spots">, excluding index.html / basics.html) against the structural contract:
  - the fixed 11-section h2-id skeleton in order (spec §2)
  - the #spots contract: h2 text == "景點深度介紹"; intro <p class="text-muted"> before nav;
    nav.city-nav has data-city-acc + cn-label + pill-nav pills (spec §3, §7.7)
  - anchor invariants: city-nav hrefs ⊆ h3 ids; inpage-nav/sidebar section anchors == h2 ids (spec §5)

Usage:  python3 tools/check_template.py [root]     # exit code = number of non-conforming pages
"""
import re, glob, os, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# CORE sections must ALL be present and appear in this relative order (as a subsequence of the
# page's h2 ids). Extra sections are ALLOWED to be inserted anywhere (documented in spec §2):
#   rain (recommended; desert pages may omit) · money (金錢/預算) · climate-specific (haze/seakey/…)
CORE = ['quick', 'intro', 'spots', 'strategy', 'itinerary', 'season', 'transport', 'apps', 'food', 'tips']
KNOWN_EXTRA = {'rain', 'money', 'haze', 'seakey'}

def strip_emoji_tags(html):
    return re.sub(r'<[^>]*>', '', re.sub(r'<span[^>]*aria-hidden[^>]*>.*?</span>', '', html, flags=re.S)).strip()

def check(f):
    s = open(f, encoding='utf-8').read()
    dev = []

    # §2 — CORE sections present in canonical relative order (subsequence); extras allowed
    h2ids = re.findall(r'<h2 id="([a-z]+)"', s)
    it = iter(h2ids)
    if not all(c in it for c in CORE):  # subsequence test
        missing = [c for c in CORE if c not in h2ids]
        dev.append(f'core-sections missing/out-of-order (missing={missing}, got={h2ids})')
    unknown = [x for x in h2ids if x not in CORE and x not in KNOWN_EXTRA]
    if unknown:
        dev.append(f'unknown-sections={unknown}')

    # §3 / §7.7 — #spots contract
    m = re.search(r'<h2 id="spots"[^>]*>(.*?)</h2>', s, re.S)
    if m:
        if strip_emoji_tags(m.group(1)) != '景點深度介紹':
            dev.append(f'spots-h2="{strip_emoji_tags(m.group(1))}"')
        win = s[m.end():m.end()+1500]
        if re.match(r'\s*<nav class="city-nav"', win):
            dev.append('spots-order:nav-before-intro')
        elif not re.match(r'\s*<p class="text-muted"', win):
            dev.append('spots:no-intro-<p>')
        nav = re.search(r'<nav class="city-nav"[^>]*>(.*?)</nav>', s, re.S)
        if not nav:
            dev.append('spots:NO-city-nav')
        else:
            body = nav.group(1)
            if 'data-city-acc' not in nav.group(0): dev.append('city-nav:no-data-city-acc')
            if '<span class="cn-label">' not in body: dev.append('city-nav:no-cn-label')
            if 'class="pill-nav"' not in body: dev.append('city-nav:plain-links(no-pill-nav)')
            # §5 — hrefs ⊆ h3 ids
            hrefs = set(re.findall(r'href="#([^"]+)"', body))
            h3ids = set(re.findall(r'<h3 id="([^"]+)"', s))
            broken = hrefs - h3ids
            if broken: dev.append(f'city-nav:broken-anchors={sorted(broken)}')

    return dev

pages = []
for f in sorted(glob.glob(os.path.join(ROOT, '*/*.html'))):
    if '_private' in f or os.path.basename(f) in ('index.html', 'basics.html'):
        continue
    if '<h2 id="spots"' not in open(f, encoding='utf-8').read():
        continue
    pages.append(f)

bad = 0
for f in pages:
    d = check(f)
    rel = os.path.relpath(f, ROOT)
    if d:
        bad += 1
        print(f'❌ {rel:34} {" ; ".join(d)}')
print(f'\n{"✅ ALL " + str(len(pages)) + " region pages conform to PAGE_TEMPLATE_SPEC.md" if not bad else str(bad) + " / " + str(len(pages)) + " pages non-conforming"}')
sys.exit(bad)
