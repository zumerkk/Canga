#!/usr/bin/env node
/**
 * 🔍 MongoDB Atlas Connection Test
 * 
 * Mevcut connection string'i test eder
 * 
 * Kullanım: server klasöründen çalıştırın: node test-mongodb-connection.js
 */

// Server klasöründen çalıştırılıyorsa mongoose'u require et
const mongoose = require('./node_modules/mongoose') || require('mongoose');

const MONGODB_URI = 'mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga';

console.log('\n🔍 MONGODB ATLAS CONNECTION TEST\n');
console.log('Testing connection string...');

// Connection testi
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
})
.then(async () => {
  console.log('✅ MongoDB Atlas bağlantısı BAŞARILI!');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  console.log(`🌐 Host: ${mongoose.connection.host}`);
  console.log(`📡 ReadyState: ${mongoose.connection.readyState}`);
  
  // Collection listesi
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`, collections.map(c => c.name).join(', '));
  } catch (error) {
    console.log('⚠️ Collections listelenemedi:', error.message);
  }
  
  console.log('\n🚀 Render deployment için hazır!');
  process.exit(0);
})
.catch(error => {
  console.error('❌ MongoDB bağlantı HATASI:', error.message);
  
  if (error.message.includes('bad auth')) {
    console.log('\n🔑 Kimlik doğrulama hatası çözümleri:');
    console.log('1. Username/password kontrolü');
    console.log('2. MongoDB Atlas Database Access kontrol');
    console.log('3. Connection string format kontrol');
  }
  
  if (error.message.includes('IP')) {
    console.log('\n🌐 Network erişim hatası çözümleri:');
    console.log('1. MongoDB Atlas Network Access');
    console.log('2. IP whitelist: 0.0.0.0/0 ekle');
  }
  
  process.exit(1);
});
