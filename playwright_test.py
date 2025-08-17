import time
from playwright.sync_api import sync_playwright

url = 'http://127.0.0.1:5000'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    logs = []
    page.on('console', lambda msg: logs.append({'type': 'console', 'text': msg.text}))

    page.goto(url)
    time.sleep(0.5)

    # upload file
    page.set_input_files('#fileInput', 'test_sample.csv')
    time.sleep(0.5)
    # click analyze button (ensure preview visible first)
    page.click('#analyzeBtn')

    # wait for resultsSection to become visible
    page.wait_for_selector('#resultsSection:not(.d-none)', timeout=10000)
    time.sleep(0.5)

    # take screenshot
    page.screenshot(path='playwright_screenshot.png', full_page=True)

    # collect result JSON by evaluating the Analysis JSON in console (we logged it earlier)
    # But better: read chartsContainer innerHTML and extract img srcs
    html = page.query_selector('#chartsContainer').inner_html()

    imgs = page.query_selector_all('#chartsContainer img')
    img_srcs = [img.get_attribute('src')[:80] for img in imgs]

    # attempt to read the analysis object exposed by the page
    try:
        last_analysis = page.evaluate('() => window.lastAnalysis')
    except Exception:
        last_analysis = None

    print('console logs:')
    for l in logs:
        print(l)

    print('\nimgs count:', len(img_srcs))
    for s in img_srcs:
        print(s)

        print('\nwindow.lastAnalysis present?:', bool(last_analysis))
        if last_analysis:
            import json
            print('lastAnalysis keys:', list(last_analysis.keys()))

    print('\nchartsContainer HTML snippet:')
    print(html[:1000])

    browser.close()
