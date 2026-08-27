import asyncio, json, os, urllib.request
from playwright.async_api import async_playwright

SESSION_FILE = "/root/.cache/lovable-auth/session.json"
BASE = "http://localhost:8080"

def load_session():
    with open(SESSION_FILE) as f:
        return json.load(f)

async def main():
    sess = load_session()
    storage_key = sess.get("storage_key") or f"sb-{os.environ['VITE_SUPABASE_PROJECT_ID']}-auth-token"
    session_obj = sess.get("session") or sess
    access_token = session_obj.get("access_token")
    results = {}

    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width":1280,"height":1800})
        page = await ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # 1) tela de login pública renderiza o botão do provedor (módulo auth-provider)
        await page.goto(f"{BASE}/auth/aluno", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        results["botao_google_visivel"] = await page.get_by_role("button", name="Entrar com Google").is_visible()

        # 2) restaura a sessão e confirma acesso autenticado
        await page.evaluate(
            "([k,v]) => localStorage.setItem(k, v)",
            [storage_key, json.dumps(session_obj)],
        )
        await page.goto(f"{BASE}/", wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        body = await page.inner_text("body")
        results["url_pos_login"] = page.url
        results["sessao_ativa"] = "Entrar" not in body[:400] and "VetBalance" in body
        await page.screenshot(path="/tmp/browser/smoke/logado.png")
        results["console_errors"] = errors[:5]
        await b.close()

    # 3) chamada simples de IA via edge function (usa _shared/ai-gateway.ts)
    url = f"{os.environ['VITE_SUPABASE_URL']}/functions/v1/generate-differential-diagnosis"
    payload = json.dumps({
        "caseName": "Smoke Test",
        "species": "canino",
        "condition": "Acidose metabólica",
        "parameters": "pH 7.20; PaCO2 32; HCO3 12; Lactato 4.0",
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "apikey": os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"],
    })
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read())
            results["ia_status"] = r.status
            results["ia_diagnostico_correto"] = data.get("correctDiagnosis")
            results["ia_qtd_diferenciais"] = len(data.get("differentialDiagnoses", []))
    except Exception as e:
        results["ia_erro"] = f"{type(e).__name__}: {e}"

    print(json.dumps(results, ensure_ascii=False, indent=2))

asyncio.run(main())
