#!/usr/bin/env node
/**
 * 🚀 Canga Vardiya Sistemi - Quick Render Deployment Helper
 * 
 * Bu script deployment öncesi kontrolleri yapar ve rehberlik sağlar
 * 
 * Kullanım: node deploy-to-render.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 CANGA VARDİYA SİSTEMİ - RENDER DEPLOYMENT HELPER\n');

// Deployment checklist
const checks = [
  {
    name: 'package.json files exist',
    check: () => {
      const serverPackage = fs.existsSync('./server/package.json');
      const clientPackage = fs.existsSync('./client/package.json');
      return serverPackage && clientPackage;
    },
    fix: 'package.json dosyaları eksik! Projenin doğru klasörde olduğundan emin olun.'
  },
  {
    name: 'render.yaml exists',
    check: () => fs.existsSync('./render.yaml'),
    fix: 'render.yaml dosyası bulunamadı! Bu dosya deployment için gerekli.'
  },
  {
    name: 'server/index.js exists',
    check: () => fs.existsSync('./server/index.js'),
    fix: 'server/index.js dosyası bulunamadı! Backend entry point eksik.'
  },
  {
    name: 'Git repository initialized',
    check: () => {
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'Git repository başlatılmamış! `git init` çalıştırın.'
  },
  {
    name: 'Changes committed to Git',
    check: () => {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        return status.trim() === '';
      } catch {
        return true; // Git yoksa pass
      }
    },
    fix: 'Değişiklikler commit edilmemiş! `git add . && git commit -m "Deploy to render"` çalıştırın.'
  }
];

console.log('📋 PRE-DEPLOYMENT CHECKLIST:');
console.log('=' .repeat(50));

let allPassed = true;
checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n📊 PROJECT ANALYSIS:');
console.log('=' .repeat(50));

// Dependencies analysis
try {
  const serverPackage = JSON.parse(fs.readFileSync('./server/package.json'));
  const clientPackage = JSON.parse(fs.readFileSync('./client/package.json'));
  
  console.log(`📦 Backend dependencies: ${Object.keys(serverPackage.dependencies || {}).length}`);
  console.log(`📦 Frontend dependencies: ${Object.keys(clientPackage.dependencies || {}).length}`);
  
  // Key dependencies check
  const keyDeps = ['express', 'mongoose', 'cors', 'jsonwebtoken'];
  const missingDeps = keyDeps.filter(dep => !serverPackage.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ All key backend dependencies present');
  } else {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Could not analyze dependencies');
  allPassed = false;
}

console.log('\n🔧 DEPLOYMENT CONFIGURATION:');
console.log('=' .repeat(50));

// Render.yaml analysis
try {
  const renderConfig = fs.readFileSync('./render.yaml', 'utf8');
  console.log('✅ render.yaml configuration found');
  
  if (renderConfig.includes('canga-api') && renderConfig.includes('canga-frontend')) {
    console.log('✅ Both backend and frontend services configured');
  } else {
    console.log('⚠️  Service configuration might be incomplete');
  }
} catch {
  console.log('❌ render.yaml not found or not readable');
  allPassed = false;
}

console.log('\n🌐 NEXT STEPS FOR RENDER.COM DEPLOYMENT:');
console.log('=' .repeat(50));

if (allPassed) {
  console.log('✅ Your project is ready for deployment!');
  console.log('');
  console.log('1. 🔑 Generate secrets:');
  console.log('   node generate-env-secrets.js');
  console.log('');
  console.log('2. 🗄️  Setup MongoDB Atlas:');
  console.log('   - Create free cluster at https://cloud.mongodb.com');
  console.log('   - Get connection string');
  console.log('   - Add IP whitelist: 0.0.0.0/0');
  console.log('');
  console.log('3. 🚀 Deploy to Render:');
  console.log('   - Go to https://render.com');
  console.log('   - Connect your GitHub repo');
  console.log('   - Use the render.yaml file for automatic setup');
  console.log('');
  console.log('4. 🔐 Set Environment Variables:');
  console.log('   - Add MONGODB_URI from step 2');
  console.log('   - Add JWT_SECRET from step 1');
  console.log('   - Configure other optional variables');
  console.log('');
  console.log('📖 Full documentation: ./RENDER_DEPLOYMENT_STEP_BY_STEP.md');
  console.log('');
} else {
  console.log('❌ Please fix the issues above before deployment.');
  console.log('');
}

// Environment variables summary
console.log('🔐 REQUIRED ENVIRONMENT VARIABLES:');
console.log('=' .repeat(50));
const requiredEnvVars = [
  'MONGODB_URI - MongoDB Atlas connection string',
  'JWT_SECRET - Generated secret key (32+ characters)',
  'NODE_ENV - production',
  'PORT - 5000 (Render will override this)'
];

requiredEnvVars.forEach(envVar => {
  console.log(`• ${envVar}`);
});

console.log('\n💡 TIP: Run `node generate-env-secrets.js` to generate secure keys automatically!');
console.log('\n🎉 Happy deployment! Your Canga Vardiya Sistemi will be live soon!\n');
