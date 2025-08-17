from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    page = ctx.new_page()
    page.goto('http://127.0.0.1:5000')
    time.sleep(0.3)
    page.set_input_files('#fileInput','test_sample.csv')
    time.sleep(0.3)
    page.click('#analyzeBtn')
    page.wait_for_selector('#resultsSection:not(.d-none)', timeout=10000)
    time.sleep(0.5)
    last = page.evaluate('() => window.lastAnalysis')
    print('lastAnalysis keys:', list(last.keys()) if last else None)
    if last:
        for k,v in last['results'].items():
            print(k, 'has chart?', bool(v.get('chart')))
    b.close()
