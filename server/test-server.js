// Minimal test server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔧 Test server başlatılıyor...');

app.get('/', (req, res) => {
  res.json({
    message: 'Test server çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`
🚀 Test Server çalışıyor!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
`);
});

module.exports = app;