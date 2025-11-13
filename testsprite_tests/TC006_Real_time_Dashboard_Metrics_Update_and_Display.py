import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000/qr-imza-yonetimi", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input password and click login button to access dashboard
        frame = context.pages[-1]
        # Input the password to login
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Click the login button to enter the system and access the dashboard
        frame = context.pages[-1]
        # Click the login button to enter the system
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Perform multiple operations altering employee statuses, shifts, and notifications to test real-time updates
        frame = context.pages[-1]
        # Click 'QR Kod Oluştur' button to navigate to QR code creation page for testing changes
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an employee and create a QR code to simulate a status change and observe dashboard updates
        frame = context.pages[-1]
        # Select an employee from the list to create a QR code and simulate status change
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/div/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an employee from the list to create a QR code and simulate a status change, then observe dashboard updates
        frame = context.pages[-1]
        # Select employee Abbas Can ÖNGER to create QR code and simulate status change
        elem = frame.locator('xpath=html/body/div[3]/div/ul/li').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Create a single QR code for Abbas Can ÖNGER to simulate a status change and observe if dashboard metrics and notifications update in real-time
        frame = context.pages[-1]
        # Click 'Tekli QR Kod Oluştur' button to create a single QR code for Abbas Can ÖNGER and simulate status change
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Observe dashboard metrics, graphs, KPIs, and notifications for real-time updates reflecting the QR code creation and status change
        frame = context.pages[-1]
        # Click 'Ana Sayfa' to return to the main dashboard and observe real-time updates in metrics and notifications
        elem = frame.locator('xpath=html/body/div/div/div/nav/div/div/div/div[2]/div/ul/li/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Trigger a system notification to verify that dashboard notification count and details update dynamically
        frame = context.pages[-1]
        # Click 'Tüm Bildirimleri Gör' button to view all notifications and prepare to trigger a new notification
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[3]/div[2]/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Trigger a test notification to verify that notification count and priority update dynamically on the dashboard
        frame = context.pages[-1]
        # Click 'Test Bildirimleri' button to trigger test notifications and observe updates
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Ana Sayfa' to return to dashboard and verify notification count updates
        elem = frame.locator('xpath=html/body/div/div/div/nav/div/div/div/div[2]/div/ul/li/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Hoş geldiniz! Sistemin genel durumunu buradan takip edebilirsiniz.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=123').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sistemde kayıtlı aktif personel').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+8% bu ay').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=123').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Aktif çalışan sayısı').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Son 30 günde sistemi terk eden').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3% bu ay').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Henüz vardiya oluşturulmamış').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İlk Vardiyayı Oluştur').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ÜRETİM').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=91 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=74%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GENEL').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=11 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=9%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=KALITE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=9 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=7%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=AR-GE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=LOJISTIK').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BİLGİ İŞLEM').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=MUHASEBE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İNSAN KAYNAKLARI').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=SATIŞ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Vardiya Değişikliği').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TORNA GRUBU vardiyasında değişiklik yapıldı.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=11.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TORNA GRUBU vardiyasında değişiklik yapıldı.').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=10.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Servis Güncelleme').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ÇARŞI MERKEZ servis güzergahında güncelleme yapıldı.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=11.11.2025').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ÇARŞI MERKEZ servis güzergahında güncelleme yapıldı.').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=10.11.2025').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sistem Bakımı').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sistem bakımı 23:00-01:00 saatleri arasında yapılacaktır.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=11.11.2025').nth(2)).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    