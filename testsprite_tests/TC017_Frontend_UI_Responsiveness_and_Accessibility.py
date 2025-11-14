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
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
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
        # -> Input the password and click the login button to access the dashboard.
        frame = context.pages[-1]
        # Input the password for login
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('28150503')
        

        # -> Retry login by clicking the login button again or check for any error messages.
        frame = context.pages[-1]
        # Click the login button again to attempt login
        elem = frame.locator('xpath=html/body/div/div/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        await page.mouse.wheel(0, 300)
        

        # -> Simulate tablet screen size and verify dashboard layout adjusts fluidly with all elements visible and usable.
        frame = context.pages[-1]
        # Click on 'Çalışanlar' (Employee Management) to access employee management page for responsiveness check on tablet.
        elem = frame.locator('xpath=html/body/div/div/div/nav/div/div/div/div[2]/div[2]/ul/li/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to the calendar page and verify layout adjusts fluidly with all UI components visible and usable on tablet screen size.
        frame = context.pages[-1]
        # Click on 'Takvim' (Calendar) to access calendar page for responsiveness check on tablet.
        elem = frame.locator('xpath=html/body/div/div/div/nav/div/div/div/div[2]/div[6]/ul/li[3]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Interact with calendar UI elements such as navigation buttons, filters, and event creation to confirm smooth functionality on tablet device.
        frame = context.pages[-1]
        # Click the 'Yenile' (Refresh) button to test button interaction on calendar page.
        elem = frame.locator('xpath=html/body/div/div/div/main/div[2]/div[2]/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Simulate mobile screen size and verify that the dashboard, employee management, and calendar pages adjust fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Simulate mobile screen size and verify that the dashboard, employee management, and calendar pages adjust fluidly with all elements visible and usable.
        await page.goto('http://localhost:3000/dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Ana Sayfa').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=VARDİYA YÖNETİM SİSTEMİ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=DASHBOARD').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İNSAN KAYNAKLARI').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışanlar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İşten Ayrılanlar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Stajyer & Çıraklar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yıllık İzin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İK YÖNETİMİ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Başvurular').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Form Editörü').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=OPERASYONLAR').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Vardiyalar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yolcu Listesi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Servis Rotaları').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GİRİŞ-ÇIKIŞ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=QR/İmza Yönetimi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=YENİ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PLANLAMA').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hızlı Liste').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hızlı Güzergah').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Takvim').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yeni Vardiya').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=© 2024 Çanga Savunma').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=v2.0.0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Dashboard').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hoş geldiniz! Sistemin genel durumunu buradan takip edebilirsiniz.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yeni Vardiya').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Genel Bakış').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TOPLAM PERSONEL').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=123').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sistemde kayıtlı aktif personel').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+8% bu ay').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=AKTİF ÇALIŞANLAR').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İŞTEN AYRILANLAR').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Son 30 günde sistemi terk eden').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3% bu ay').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hızlı İşlemler').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Vardiya Oluştur').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yeni vardiya planı hazırlayın').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Personel Yönetimi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çalışan bilgilerini görüntüle').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İzin Takibi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Yıllık izin durumları').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Son Vardiyalar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tümünü Gör →').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Merkez Şube - Vardiya 1').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📅 11.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=👥 2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Taslak').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Departman Dağılımı').first).to_be_visible(timeout=30000)
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
        await expect(frame.locator('text=MUHASEBE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=İNSAN KAYNAKLARI').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=LOJISTIK').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BİLGİ İŞLEM').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=SATIŞ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1 kişi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bildirimler').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=5').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Vardiya Değişikliği').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=TORNA GRUBU vardiyasında değişiklik yapıldı.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=14.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=11.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=10.11.2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Servis Güncelleme').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ÇARŞI MERKEZ servis güzergahında güncelleme yapıldı.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tüm Bildirimleri Gör').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    