const fs = require('fs');
const csv = require('csv-parser');

const employees = [];

fs.createReadStream('/Users/zumerkekillioglu/Desktop/Canga/İŞTEN AYRILANLAR-Tablo 1.csv')
  .pipe(csv({ separator: ';', headers: false }))
  .on('data', (row) => {
    // İlk satır header, boş satırları atla
    if (row[0] && row[0] !== '' && !isNaN(row[0]) && row[2] && row[2].trim() !== '') {
      employees.push({
        tc: row[3],
        name: row[2]
      });
    }
  })
  .on('end', () => {
    console.log('CSV toplam kayıt:', employees.length);
    console.log('İlk 5 TC:', employees.slice(0,5).map(e => e.tc));
    console.log('Son 5 TC:', employees.slice(-5).map(e => e.tc));
  });