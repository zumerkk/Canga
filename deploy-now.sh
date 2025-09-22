#!/bin/bash

# 🚀 Canga Vardiya Sistemi - Quick Deploy Script

echo "🚀 CANGA VARDİYA SİSTEMİ - RENDER DEPLOYMENT"
echo "============================================"

# 1. Git durumunu kontrol et
echo "📋 Git durumu kontrol ediliyor..."
git status

# 2. Secrets oluştur
echo ""
echo "🔐 JWT Secret oluşturuluyor..."
node generate-env-secrets.js > deployment-secrets.txt
echo "✅ Secrets 'deployment-secrets.txt' dosyasına kaydedildi"

# 3. MongoDB test
echo ""
echo "🗄️  MongoDB Atlas bağlantısı test ediliyor..."
cd server && node test-mongodb-connection.js

# 4. Deployment checklist
echo ""
echo "📋 Deployment checklist..."
cd ..
node deploy-to-render.js

echo ""
echo "🎯 SONRAKİ ADIMLAR:"
echo "1. 🔗 https://render.com'a git"
echo "2. 📁 GitHub repo'nu bağla"
echo "3. 🔐 Environment variables'ı ekle (deployment-secrets.txt'den)"
echo "4. 🚀 Deploy!"
echo ""
echo "📖 Detaylı rehber: RENDER_DEPLOYMENT_STEP_BY_STEP.md"
echo "⚡ Hızlı rehber: QUICK_START_RENDER.md"
