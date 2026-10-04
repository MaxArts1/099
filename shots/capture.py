from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1440,"height":900})
    errors=[]
    pg.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    # preload state
    pg.goto("http://localhost:8000/index.html#clean", wait_until="networkidle")
    pg.wait_for_timeout(2600)  # let preloader shutter finish
    pg.screenshot(path="/workspace/shots/01-hero.png")
    # scroll through sections
    secs=["manifest","index","board","d1","d2","d3","ac","d5","d6","revs","final"]
    for i,s in enumerate(secs):
        pg.evaluate(f"document.getElementById('{s}').scrollIntoView({{behavior:'instant'}})")
        pg.wait_for_timeout(700)
        pg.screenshot(path=f"/workspace/shots/{i+2:02d}-{s}.png")
    print("ERRORS:", errors[:10] if errors else "none")
    b.close()
