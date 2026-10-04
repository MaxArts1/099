from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    # preloader mid-state (no #clean so HUD visible)
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:8000/index.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(600)
    pg.screenshot(path="/workspace/shots/00-preload.png")
    pg.wait_for_timeout(3000)
    pg.screenshot(path="/workspace/shots/01b-hero-hud.png")
    # autoplay button present?
    btn = pg.evaluate("!!document.querySelector('#autoplay,[id*=auto],[class*=auto]')")
    print("autoplay btn:", btn)
    # mobile
    m = b.new_page(viewport={"width":390,"height":844})
    m.goto("http://localhost:8000/index.html#clean", wait_until="networkidle")
    m.wait_for_timeout(2600)
    m.screenshot(path="/workspace/shots/13-mobile-hero.png")
    m.evaluate("document.getElementById('final').scrollIntoView()")
    m.wait_for_timeout(700)
    m.screenshot(path="/workspace/shots/14-mobile-final.png")
    b.close()
