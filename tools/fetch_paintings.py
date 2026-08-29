#!/usr/bin/env python3
"""
world-famous-paintings-puzzle-game 图片库下载器
================================================
从公开开放数据 API 下载世界名画（仅 CC0 / Public Domain），输出到 assets/paintings/，
并生成 manifest.csv 元数据清单。

数据源（全部 CC0 / 公共领域，官方开放 API）：
  1. The Metropolitan Museum of Art  (Met)      —— 精确标题匹配，isPublicDomain 标记
  2. Art Institute of Chicago       (Chicago)   —— is_public_domain 标记 + IIIF 高清
  3. Cleveland Museum of Art        (Cleveland) —— cc0 许可 + IIIF 高清
  4. Wikimedia Commons              (Commons)   —— 兜底，search+候选，只收 PD/CC0，降频

策略：优先官方馆藏开放 API（干净、不触发限流）；Commons 仅作最后兜底且降频，
     只收录明确为公共领域 / CC0 的图片，绝不收录未授权网站截图。

用户约定：只存中分辨率缩略图（控体积、保清晰、避免触发 GitHub 100MB/单文件限制）。
"""
import csv, io, json, os, re, time, urllib.error, urllib.parse, urllib.request, shutil, socket

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets", "paintings")
MANIFEST = os.path.join(ASSETS, "manifest.csv")
CURATED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "curated_list.json")
UA = "world-famous-paintings-puzzle-game/1.0 (hermes tiffany) +https://github.com/foreverdesmond/world-famous-paintings-puzzle-game"

LONG_SIDE = 1600  # 中分辨率缩略图长边（清晰且体积可控）
os.makedirs(ASSETS, exist_ok=True)


def _urlopen(url, timeout):
    """urlopen with a strict wall-clock watchdog so a stalled socket can't hang the job."""
    deadline = time.time() + timeout + 5  # hard cap
    socket.setdefaulttimeout(timeout)  # set BEFORE connect so TLS/headers are also capped
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            chunks = []
            while True:
                remaining = deadline - time.time()
                if remaining <= 0:
                    raise TimeoutError("hard watchdog exceeded")
                socket.setdefaulttimeout(min(remaining, timeout))
                c = r.read(65536)
                if not c:
                    break
                chunks.append(c)
            return b"".join(chunks)
    finally:
        socket.setdefaulttimeout(None)


def http_json(url, *, timeout=35, retries=3, delay=1.5):
    for attempt in range(retries):
        try:
            return json.loads(_urlopen(url, timeout))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = delay * (2 ** attempt)
                print(f"  [rate-limit] sleep {wait:.0f}s"); time.sleep(wait); continue
            if e.code in (404, 403):
                return None
            raise
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(delay * (attempt + 1))
    return None


def http_bin(url, *, dest, retries=3, delay=1.0):
    for attempt in range(retries):
        try:
            deadline = time.time() + 60 + 5
            socket.setdefaulttimeout(30)  # set BEFORE connect
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
                while True:
                    if time.time() > deadline:
                        raise TimeoutError("hard watchdog exceeded")
                    c = r.read(65536)
                    if not c:
                        break
                    f.write(c)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(delay * (2 ** attempt)); continue
            return False
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(delay * (attempt + 1))
    return False


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def art_tokens(name):
    return [t for t in re.split(r"[\s,.-]+", (name or "").lower()) if len(t) > 1]


def surname(artist):
    toks = art_tokens(artist)
    return toks[-1] if toks else None


def slugify(title, artist):
    base = re.sub(r"[^A-Za-z0-9]+", "-", title).strip("-").lower()[:45]
    art = re.sub(r"[^A-Za-z0-9]+", "-", artist).strip("-").lower()[:25]
    return f"{base}__{art}" if base else art


# ---------------- Met ----------------
MET_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1/search"
MET_OBJ = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{}"

def met_resolve(title, artist):
    q = f"{title}"
    # build search url manually
    url = MET_SEARCH + "?" + urllib.parse.urlencode({"q": q, "hasImages": True})
    d = http_json(url)
    nt, sur = norm(title), surname(artist)
    for oid in (d or {}).get("objectIDs") or []:
        obj = http_json(MET_OBJ.format(oid))
        if not obj or not (obj.get("isPublicDomain") and obj.get("primaryImage")):
            continue
        tm = norm(obj.get("title"))
        am = norm(obj.get("artistDisplayName"))
        if nt not in tm and tm not in nt:
            continue  # strict title
        if sur and sur not in art_tokens(obj.get("artistDisplayName")):
            continue
        return {
            "title": obj.get("title"), "artist": obj.get("artistDisplayName"),
            "institution": "The Metropolitan Museum of Art",
            "licence": "CC0 (Met Open Access)", "id": oid,
            "page": obj.get("objectURL"), "img_small": obj.get("primaryImageSmall"),
            "img_full": obj.get("primaryImage"),
        }
    return None

# ---------------- Chicago ----------------
CHI_SEARCH = "https://api.artic.edu/api/v1/artworks/search"
CHI_IIIF = "https://www.artic.edu/iiif/2/{}/full/{},/0/default.jpg"

def chi_resolve(title, artist):
    d = http_json(CHI_SEARCH + "?" + urllib.parse.urlencode({"q": title, "limit": 12}))
    nt, sur = norm(title), surname(artist)
    for it in (d or {}).get("data") or []:
        if not it.get("is_public_domain") or not it.get("image_id"):
            continue
        tm, am = norm(it.get("title")), norm(it.get("artist_title"))
        if nt not in tm and tm not in nt:
            continue
        if sur and sur not in art_tokens(it.get("artist_title")):
            continue
        return {
            "title": it.get("title"), "artist": it.get("artist_title"),
            "institution": "Art Institute of Chicago",
            "licence": "CC0 (artic.edu Open Access)", "id": it["id"],
            "page": f"https://www.artic.edu/artworks/{it['id']}",
            "img_small": CHI_IIIF.format(it["image_id"], LONG_SIDE),
            "img_full": CHI_IIIF.format(it["image_id"], 4000),
        }
    return None

# ---------------- Cleveland ----------------
CLEV_OBJ = "https://openaccess-api.clevelandart.org/api/artworks"

def clev_resolve(title, artist):
    d = http_json(CLEV_OBJ + "?" + urllib.parse.urlencode({"limit": 3, "title": title}))
    for it in (d or {}).get("data") or []:
        lic = (it.get("share_license_status") or "").lower()
        if it.get("copyright") or not (lic and ("cc0" in lic or "public domain" in lic)):
            continue
        imgs = it.get("images") or {}
        web = imgs.get("web") or {}
        if not web.get("url"):
            continue
        sur = surname(artist)
        creators = it.get("creators")
        if isinstance(creators, list):
            names = [c["name"] for c in creators if isinstance(c, dict) and c.get("name")]
            creators_str = ", ".join(names)
        else:
            creators_str = str(creators or "")
        if sur and sur not in art_tokens(creators_str):
            continue
        return {
            "title": it.get("title"), "artist": creators_str.strip(),
            "institution": "Cleveland Museum of Art", "licence": lic,
            "id": it.get("accession_number"), "page": it.get("url"),
            "img_small": web["url"],
            "img_full": (imgs.get("print", {}) or {}).get("url") or web["url"],
        }
    return None

# ---------------- Wikimedia Commons (兜底, 搜索+候选, 降频) ----------------
CM_API = "https://commons.wikimedia.org/w/api.php"

def _cm_query(params):
    url = CM_API + "?" + urllib.parse.urlencode(params)
    return http_json(url, timeout=30)

def _licence_ok(meta):
    lic = (meta.get("LicenseShortName", {}).get("value", "") or "").lower()
    return ("cc0" in lic) or ("public domain" in lic) or lic.startswith("pd") or lic == "pd"


def commons_resolve(title, artist):
    """Commons search; pick first file whose licence is CC0/PD."""
    queries = [f"{title} {artist}", title]
    seen = set()
    for q in queries:
        d = _cm_query({
            "action": "query", "list": "search", "srsearch": q,
            "srnamespace": 6, "srlimit": 12, "format": "json",
        })
        time.sleep(1.2)  # 降频，防 Commons 限流/封锁
        hits = ((d or {}).get("query", {}) or {}).get("search", []) or []
        for h in hits:
            fname = h.get("title")
            if not fname or fname in seen:
                continue
            seen.add(fname)
            info = _cm_query({
                "action": "query", "titles": fname, "prop": "imageinfo",
                "iiprop": "url|size|extmetadata", "iiurlwidth": LONG_SIDE, "format": "json",
            })
            p = next(iter((((info or {}).get("query", {}) or {}).get("pages", {}) or {}).values()), {})
            ii = (p.get("imageinfo") or [None])[0]
            if not ii:
                continue
            meta = ii.get("extmetadata") or {}
            if not _licence_ok(meta):
                lic = (meta.get("LicenseShortName", {}).get("value", "") or "").lower()
                print(f"  (cm skip {fname}: licence={lic})")
                continue
            return {
                "title": title, "artist": artist, "institution": "Wikimedia Commons",
                "licence": (meta.get("LicenseShortName", {}).get("value", "") or ""),
                "id": p.get("pageid"), "page": ii.get("descriptionurl"),
                "img_small": ii.get("thumburl") or ii.get("url"),
                "img_full": ii.get("url"),
            }
    return None


# ---------------- extras to reach 100 ----------------
EXTRAS = [
    ("The Dance Class", "Edgar Degas"), ("Little Dancer of Fourteen Years", "Edgar Degas"),
    ("The Large Bathers", "Paul Cezanne"), ("The Card Players", "Paul Cezanne"),
    ("The Bodmer Oak, Fontainebleau Forest", "Gustave Courbet"),
    ("La Grande Odalisque", "Jean-Auguste-Dominique Ingres"),
    ("The Turkish Bath", "Jean-Auguste-Dominique Ingres"),
    ("Christ in the Storm on the Sea of Galilee", "Rembrandt"),
    ("Girl Reading a Letter at an Open Window", "Johannes Vermeer"),
    ("View of Delft", "Johannes Vermeer"), ("The Swing", "Jean-Honore Fragonard"),
    ("The Garden of Love", "Peter Paul Rubens"),
    ("The Garden of the Tuileries", "Claude Monet"),
    ("Wheat Field with Cypresses", "Vincent van Gogh"),
    ("Bathers at Asnieres", "Georges Seurat"),
    ("Portrait of Adele Bloch-Bauer I", "Gustav Klimt"),
    ("Water Lilies", "Claude Monet"), ("L'Atelier du peintre", "Gustave Courbet"),
    ("The Third-Class Carriage", "Honore Daumier"),
    ("The Meeting", "Jean-Honore Fragonard"),
    ("Basket of Apples", "Paul Cezanne"), ("Still Life with Apples", "Paul Cezanne"),
    ("Reading the Letter", "Pieter de Hooch"),
    ("The Music Party", "Pieter de Hooch"),
    ("The Alley in Middelharnis", "Meindert Hobbema"),
    ("The Grand Canal, Venice", "J.M.W. Turner"),
]


def main():
    curated = json.load(open(CURATED, encoding="utf-8"))
    targets = list(curated)
    seen = {t["title"].lower() for t in curated}
    for ti, ta in EXTRAS:
        if ti.lower() not in seen:
            targets.append({"title": ti, "artist": ta})

    resolvers = (met_resolve, chi_resolve, clev_resolve, commons_resolve)

    # Phase 1: 快扫——已存在文件直接 KEEP；元数据仅从官方三馆解析（快、可靠），
    #          找不到即标注通用公共领域（不碰 Commons 解析，避免卡顿）
    rows, skipped, missing = [], 0, []
    official = (met_resolve, chi_resolve, clev_resolve)
    for i, t in enumerate(targets, 1):
        title, artist = t["title"], t["artist"]
        slug = slugify(title, artist)
        path = os.path.join(ASSETS, slug + ".jpg")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            header = open(path, "rb").read(2)
            if header == b"\xff\xd8":
                md = None
                for fn in official:
                    md = fn(title, artist)
                    if md:
                        break
                rows.append({
                    "title": title, "artist": artist,
                    "institution": (md or {}).get("institution", "Public domain source"),
                    "licence": (md or {}).get("licence", "Public domain / CC0"),
                    "page_url": (md or {}).get("page"), "image_url": (md or {}).get("img_small"),
                    "file": f"assets/paintings/{slug}.jpg",
                    "jpeg_bytes": os.path.getsize(path),
                })
                skipped += 1
                print(f"[{i}/{len(targets)}] KEEP {title} (已存在)" + (f" <- {md['institution']}" if md else " (官方馆未存，通用标)"))
                continue
        missing.append({**t, "slug": slug, "path": path})

    # Phase 2: 只对缺失项解析+下载
    ok, failed = 0, []
    for j, t in enumerate(missing, 1):
        title, artist, slug = t["title"], t["artist"], t["slug"]
        path = t["path"]
        rec = None
        for fn in resolvers:
            rec = fn(title, artist)
            if rec:
                break
        if not (rec and rec.get("img_small")):
            failed.append(title)
            print(f"[f{j}/{len(missing)}] --  {title} ({artist}) 未匹配到公共领域图")
            continue
        # re-slug with actual metadata for correct file name
        slug2 = slugify(rec["title"] or title, rec["artist"] or artist)
        path = os.path.join(ASSETS, slug2 + ".jpg")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            rows.append({
                "title": title, "artist": artist, "institution": rec["institution"],
                "licence": rec["licence"], "page_url": rec.get("page"), "image_url": rec["img_small"],
                "file": f"assets/paintings/{slug2}.jpg", "jpeg_bytes": os.path.getsize(path),
            })
            ok += 1
            print(f"[f{j}/{len(missing)}] OK(frommeta) {title}")
            continue
        if not http_bin(rec["img_small"], dest=path):
            failed.append(title)
            print(f"[f{j}/{len(missing)}] !! {title} 下载失败")
            continue
        size = os.path.getsize(path)
        with open(path, "rb") as f:
            head = f.read(3)
        if head != b"\xff\xd8\xff":
            os.remove(path); failed.append(title)
            print(f"[f{j}/{len(missing)}] !! {title} 非JPEG，删除")
            continue
        rows.append({
            "title": title, "artist": artist, "institution": rec["institution"],
            "licence": rec["licence"], "page_url": rec.get("page"), "image_url": rec["img_small"],
            "file": f"assets/paintings/{slug2}.jpg", "jpeg_bytes": size,
        })
        ok += 1
        print(f"[f{j}/{len(missing)}] OK  {title} ({artist}) <- {rec['institution']}")
        time.sleep(0.3)

    with open(MANIFEST, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["title","artist","institution","licence","page_url","image_url","file","jpeg_bytes"])
        w.writeheader(); w.writerows(rows)

    tot = sum(r["jpeg_bytes"] for r in rows)
    print(f"\n==== 完成: 新增 {ok} / 保留 {skipped} / 失败 {len(failed)}，共 {len(rows)} 张  清单={MANIFEST}  总大小={tot/1024/1024:.1f}MB")
    if failed:
        print(f"未匹配/失败: {failed}")

if __name__ == "__main__":
    main()