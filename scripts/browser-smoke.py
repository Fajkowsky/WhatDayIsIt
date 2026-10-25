#!/usr/bin/env python3
"""Run a real Chromium unpacked-extension smoke check and refresh store screenshots."""

import argparse
import asyncio
import json
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from struct import unpack

from playwright.async_api import async_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "assets" / "store"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


def png_dimensions(path):
    with path.open("rb") as image:
        header = image.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"Not a PNG screenshot: {path}")
    return list(unpack(">II", header[16:24]))


async def run(chrome_path):
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f"http://127.0.0.1:{server.server_port}"
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)

    try:
        with tempfile.TemporaryDirectory(prefix="whatdayisit-browser-smoke-") as profile:
            async with async_playwright() as playwright:
                context = await playwright.chromium.launch_persistent_context(
                    profile,
                    executable_path=chrome_path,
                    headless=True,
                    viewport={"width": 1280, "height": 800},
                    args=[
                        f"--disable-extensions-except={ROOT}",
                        f"--load-extension={ROOT}",
                    ],
                )
                context.set_default_timeout(7000)
                worker = (
                    context.service_workers[0]
                    if context.service_workers
                    else await context.wait_for_event("serviceworker", timeout=10000)
                )
                extension_id = worker.url.split("/")[2]

                english_page = await context.new_page()
                await english_page.goto(f"{base_url}/tests/store-preview.html?locale=en")
                await english_page.wait_for_selector(".date-hl")
                english_count = await english_page.locator(".date-hl, .date-hl-no-bg").count()
                english_tab_id = await worker.evaluate(
                    "async () => (await chrome.tabs.query({active: true, lastFocusedWindow: true}))[0]?.id"
                )
                await english_page.locator(".date-hl-icon").first.hover()
                await english_page.wait_for_selector(".date-hl-tooltip")
                await english_page.screenshot(path=str(SCREENSHOTS / "hero-store.png"))
                await english_page.set_viewport_size({"width": 2560, "height": 1600})
                await english_page.screenshot(path=str(SCREENSHOTS / "hero.png"))
                await english_page.set_viewport_size({"width": 1280, "height": 800})

                polish_page = await context.new_page()
                await polish_page.goto(f"{base_url}/tests/test-page.html?locale=pl")
                await polish_page.wait_for_selector(".date-hl")
                polish_count = await polish_page.locator(".date-hl, .date-hl-no-bg").count()
                polish_tab_id = await worker.evaluate(
                    "async () => (await chrome.tabs.query({active: true, lastFocusedWindow: true}))[0]?.id"
                )
                tab_badges = await worker.evaluate(
                    "async ids => Promise.all(ids.map(id => new Promise(resolve => "
                    "chrome.action.getBadgeText({tabId: id}, text => resolve([id, text])))))",
                    [english_tab_id, polish_tab_id],
                )
                expected_badges = {str(english_count), str(polish_count)}
                if {badge for _, badge in tab_badges} != expected_badges:
                    raise AssertionError(f"Expected isolated tab badge counts; got {tab_badges}")

                async def wait_for_badge(expected):
                    for _ in range(30):
                        current = await worker.evaluate(
                            "id => new Promise(resolve => chrome.action.getBadgeText({tabId: id}, resolve))",
                            english_tab_id,
                        )
                        if current == str(expected):
                            return
                        await english_page.wait_for_timeout(100)
                    raise AssertionError(f"Expected tab badge {expected}, got {current!r}")

                before = await english_page.locator(".date-hl, .date-hl-no-bg").count()
                await english_page.evaluate(
                    "document.body.insertAdjacentHTML('beforeend', '<p id=dynamic>2024-02-29</p>')"
                )
                await english_page.wait_for_function(
                    "document.querySelector('#dynamic .date-hl') !== null"
                )
                inserted = await english_page.locator(".date-hl, .date-hl-no-bg").count()
                await wait_for_badge(english_count + 1)
                await english_page.evaluate("document.querySelector('#dynamic').remove()")
                await english_page.wait_for_function(
                    "document.querySelector('#dynamic') === null"
                )
                await english_page.wait_for_timeout(400)
                removed = await english_page.locator(".date-hl, .date-hl-no-bg").count()
                await wait_for_badge(english_count)
                if [before, inserted, removed] != [english_count, english_count + 1, english_count]:
                    raise AssertionError(f"Dynamic page count mismatch: {[before, inserted, removed]}")

                popup = await context.new_page()
                await popup.set_viewport_size({"width": 440, "height": 280})
                await popup.goto(f"chrome-extension://{extension_id}/popup.html")
                await popup.screenshot(path=str(SCREENSHOTS / "hero-small.png"))
                await popup.locator("label[for=globalToggle] .toggle-slider").click()
                for page in (english_page, polish_page):
                    await page.wait_for_function(
                        "document.querySelectorAll('.date-hl, .date-hl-no-bg').length === 0"
                    )
                disabled_counts = [
                    await page.locator(".date-hl, .date-hl-no-bg").count()
                    for page in (english_page, polish_page)
                ]
                cleared_badges = await worker.evaluate(
                    "async ids => Promise.all(ids.map(id => new Promise(resolve => "
                    "chrome.action.getBadgeText({tabId: id}, resolve))))",
                    [english_tab_id, polish_tab_id],
                )
                if disabled_counts != [0, 0] or any(cleared_badges):
                    raise AssertionError(
                        f"Disable did not clear every tab: counts={disabled_counts}, badges={cleared_badges}"
                    )

                result = {
                    "evidence": "installed unpacked extension in Chrome for Testing",
                    "extension_id": extension_id,
                    "manifest_version": await worker.evaluate("chrome.runtime.getManifest().version"),
                    "english_date_count": english_count,
                    "polish_date_count": polish_count,
                    "tab_badges": tab_badges,
                    "dynamic_counts": [before, inserted, removed],
                    "disabled_counts": disabled_counts,
                    "disabled_badges": cleared_badges,
                    "screenshots": {
                        name: png_dimensions(SCREENSHOTS / name)
                        for name in ("hero.png", "hero-store.png", "hero-small.png")
                    },
                }
                print(json.dumps(result, indent=2))
                await context.close()
    finally:
        server.shutdown()
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--chrome",
        required=True,
        help="path to a Chromium or Chrome for Testing executable with extension sideloading support",
    )
    args = parser.parse_args()
    asyncio.run(run(Path(args.chrome).expanduser().resolve()))


if __name__ == "__main__":
    main()
