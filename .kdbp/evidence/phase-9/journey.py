"""Phase 9 runtime journey evidence: browser smoke test of the analysis UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright

DIR = Path(__file__).parent
SHOT = lambda name: str(DIR / f"{name}.png")
URL = "http://127.0.0.1:15179"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # 1. Login screen
        page.goto(URL)
        page.wait_for_timeout(600)
        page.screenshot(path=SHOT("01-login"), full_page=True)
        print("ok 01-login")

        # 2. Open debug panel and go to case setup
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="case").click()
        page.wait_for_timeout(400)
        page.screenshot(path=SHOT("02-case-setup"), full_page=True)
        print("ok 02-case-setup")

        # 3. Navigate to upload via debug panel
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="upload").click()
        page.wait_for_timeout(400)
        page.screenshot(path=SHOT("03-upload"), full_page=True)
        print("ok 03-upload")

        # 4. Navigate to findings (AnalysisResults screen)
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="findings").click()
        page.wait_for_timeout(600)
        page.screenshot(path=SHOT("04-findings-screen"), full_page=True)
        print("ok 04-findings-screen")

        # 5. Check UI states
        if page.locator("text=No hay caso seleccionado").count() > 0:
            print("   -> No case selected (expected: no caseId in nav state)")
        elif page.locator("text=No hay analisis previos").count() > 0:
            print("   -> No analysis runs (expected: no backend)")

        # 6. Navigate to coach (prototype findings comparison)
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="coach").click()
        page.wait_for_timeout(500)
        page.screenshot(path=SHOT("05-coach-prototype"), full_page=True)
        print("ok 05-coach-prototype")

        # 7. Navigate to email
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="email").click()
        page.wait_for_timeout(500)
        page.screenshot(path=SHOT("06-email"), full_page=True)
        print("ok 06-email")

        # 8. Back to findings to verify the screen renders consistently
        page.locator("div[style*='fixed'] button").first.click()
        page.wait_for_timeout(200)
        page.locator("button", has_text="findings").click()
        page.wait_for_timeout(500)
        page.screenshot(path=SHOT("07-findings-revisit"), full_page=True)
        print("ok 07-findings-revisit")

        browser.close()
        print("\nAll screenshots saved to .kdbp/evidence/phase-9/")


if __name__ == "__main__":
    run()
