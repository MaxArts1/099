from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:8000/index.html", wait_until="networkidle")
    pg.wait_for_timeout(3200)
    print("apBtn:", pg.evaluate("!!document.getElementById('apBtn')"))
    pg.screenshot(path="/workspace/shots/01b-hero-hud.png")
    # click autoplay, snap through story
    pg.click("#apBtn")
    pg.wait_for_timeout(7000)
    pg.screenshot(path="/workspace/shots/15-autoplay-mid.png")
    pos1 = pg.evaluate("window.scrollY")
    pg.keyboard.press("End")  # user interrupt test
    pg.wait_for_timeout(1200)
    pos2 = pg.evaluate("window.scrollY")
    print("autoplay scrolled:", pos1>0, "| interrupted to bottom:", pos2>pos1)
    # form validation + success
    pg.evaluate("document.getElementById('final').scrollIntoView()")
    pg.fill("#f-name","Тест"); pg.fill("#f-tel","+7 900 000-00-00"); pg.select_option("#f-svc", index=0)
    pg.click("#form button[type=submit]")
    pg.wait_for_timeout(900)
    print("success:", pg.evaluate("!!document.querySelector('.ok,[class*=succ],[id*=succ]') || document.body.innerText.includes('ЗАЯВКА УШЛА')"))
    pg.screenshot(path="/workspace/shots/16-form-success.png")
    b.close()
