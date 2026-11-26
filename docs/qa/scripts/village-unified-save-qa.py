import base64, json, secrets, urllib.request, urllib.error, uuid
from pathlib import Path

cfg = json.loads(Path("local-status.json").read_text())
base = cfg["API_URL"]
assert base.startswith(("http://127.0.0.1:", "http://localhost:"))
service = cfg.get("SERVICE_ROLE_KEY") or cfg["SECRET_KEY"]
anon = cfg.get("ANON_KEY") or cfg["PUBLISHABLE_KEY"]
checks = 0

def check(label, condition):
    global checks
    assert condition, label
    checks += 1
    print("PASS", label, flush=True)

def req(path, method="GET", data=None, key=None, token=None, mime="application/json"):
    key = key or service
    body = data if isinstance(data, bytes) else None if data is None else json.dumps(data).encode()
    request = urllib.request.Request(base + path, data=body, method=method, headers={
        "apikey": key, "Authorization": "Bearer " + (token or key),
        "Content-Type": mime, "Prefer": "return=representation"
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw and "json" in response.headers.get("Content-Type", "") else raw
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            result = json.loads(raw)
        except ValueError:
            result = None
        return error.code, result

def rpc(name, args, **kwargs):
    return req("/rest/v1/rpc/" + name, "POST", args, **kwargs)

def ok(result, label):
    code, data = result
    check(label, 200 <= code < 300)
    return data

email = "village-qa-" + uuid.uuid4().hex[:10] + "@example.invalid"
password = secrets.token_urlsafe(32)
actor = ok(req("/auth/v1/admin/users", "POST", {"email": email, "password": password, "email_confirm": True}), "synthetic Auth user")["id"]
session = ok(req("/auth/v1/token?grant_type=password", "POST", {"email": email, "password": password}, key=anon), "real synthetic login")
token = session["access_token"]

def manage(model, action, workspace=None, version=0, payload=None):
    return rpc("manage_other_editorial", {"p_model": model, "p_action": action, "p_actor": actor, "p_workspace": workspace, "p_entry": None, "p_version": version, "p_data": payload or {}})

def read(workspace):
    code, data = req("/rest/v1/editorial_workspaces?id=eq." + workspace + "&select=*")
    assert code == 200 and len(data) == 1
    return data[0]

def audit(workspace):
    code, data = req("/rest/v1/editorial_activity?workspace_id=eq." + workspace + "&select=action,version&order=version")
    assert code == 200
    return data

def save(workspace, version, data, cover=None, **kwargs):
    return rpc("save_village_editorial", {"p_actor": actor, "p_workspace": workspace, "p_version": version, "p_data": data, "p_cover": cover}, **kwargs)

def publish(workspace, version):
    return rpc("publish_editorial_with_sources", {"p_model":"village","p_actor":actor,"p_workspace":workspace,"p_version":version,"p_data":{"slug":"synthetic-village-"+workspace[:8]}})

def live(workspace):
    entry = read(workspace)["entry_id"]
    code, rows = req("/rest/v1/villages?id=eq."+entry+"&select=*")
    assert code == 200 and len(rows) == 1
    return rows[0]

def rejected(label, workspace, version, data, cover=None, **kwargs):
    before = read(workspace), audit(workspace)
    code, _ = save(workspace, version, data, cover, **kwargs)
    check(label + " rejected", code >= 400)
    check(label + " no draft or audit mutation", (read(workspace), audit(workspace)) == before)

png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=")
def upload(label):
    obj = str(uuid.uuid4())
    ok(req("/storage/v1/object/editorial-media/"+obj,"POST",png,mime="image/png"),"local Storage upload "+label)
    code, content = req("/storage/v1/object/authenticated/editorial-media/"+obj)
    check("private Storage bytes "+label, code == 200 and content == png)
    return {"id":obj,"alt":"Synthetic "+label,"author":"Synthetic author","source":"https://example.invalid/"+label,"license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0/"}

w = ok(manage("village","create"), "create isolated village workspace")
data = {"title":"Synthetic village","body":"Initial body","excerpt":"Initial excerpt","location":{"address":"Synthetic address","latitude":38.1,"longitude":15.5},"sources":[{"label":"Synthetic source","url":"https://example.invalid/source","source_type":"web","note":""}]}
ok(save(w,0,data), "text-only atomic save")
check("text-only version and no cover", read(w)["version"] == 1 and read(w)["draft"]["photos"] == [])
old = upload("original")
ok(save(w,1,data,old), "initial text plus cover save")
check("two audited revisions and one pending cover", read(w)["version"] == 3 and read(w)["draft"]["photos"] == [old] and len(audit(w)) == 4)
ok(publish(w,3), "publish initial synthetic cover")
before_public = live(w)
check("initial published cover", before_public["image_url"] == "/api/editoriale/immagini/"+old["id"])
new = upload("new")
updated = dict(data, body="Revised body")
ok(save(w,4,updated,new), "atomic save with replacement cover")
check("public row unchanged before publication", live(w) == before_public)
check("new draft and body saved", read(w)["draft"]["photos"] == [new] and read(w)["draft"]["body"] == updated["body"])
replacement = upload("replacement")
ok(save(w,6,updated,replacement), "replace already pending cover")
check("single pending replacement", read(w)["draft"]["photos"] == [replacement])
credits = dict(replacement,author="Revised synthetic credit")
ok(save(w,8,updated,credits), "metadata-only cover revision")
check("metadata persists with same image id", read(w)["draft"]["photos"] == [credits])
rejected("stale version", w,8,dict(updated,body="Forbidden"),new)
rejected("missing object",w,10,updated,dict(new,id=str(uuid.uuid4())))
rejected("anonymous RPC",w,10,updated,new,key=anon)
rejected("authenticated RPC",w,10,updated,new,key=anon,token=token)
legend = ok(manage("legend","create"),"create isolated legend workspace")
rejected("wrong model",legend,0,updated,new)
check("live original still untouched", live(w) == before_public)
ok(publish(w,10),"publish updated synthetic village")
after = live(w)
check("published cover and credits updated", after["image_url"] == "/api/editoriale/immagini/"+credits["id"] and after["image_author"] == credits["author"] and after["image_source_url"] == credits["source"] and after["image_license_url"] == credits["licenseUrl"] and after["description"] == updated["body"])
check("pending photo cleared",read(w)["version"] == 11 and read(w)["draft"]["photos"] == [])
code, sources = req("/rest/v1/village_sources?village_id=eq."+after["id"]+"&select=label,url")
check("source published",code == 200 and sources == [{"label":"Synthetic source","url":"https://example.invalid/source"}])
ok(manage("village","archive",w,11),"archive synthetic workspace")
rejected("archived workspace",w,12,updated,new)
print("TOTAL",checks,"PASS — isolated synthetic database and Storage; no remote access")
