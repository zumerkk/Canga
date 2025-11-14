/**
 * 📋 Çalışan İmport Verileri
 * Hard-coded veriler buraya taşındı - kod temizliği için
 */

const activeEmployeesData = [
  // Excel'den tüm aktif personel
  { name: "Ali GÜRBÜZ", tcNo: "64542249499", phone: "532 377 99 22", birthDate: "22.05.1969", hireDate: "23.04.2019", position: "CNC TORNA OPERATÖRÜ", serviceRoute: "DİSPANSER SERVİS GÜZERGAHI", serviceStop: "ŞADIRVAN (PERŞEMBE PAZARI)" },
  { name: "Ali SAVAŞ", tcNo: "17012815250", phone: "505 088 86 25", birthDate: "30.06.1964", hireDate: "4.09.2019", position: "TORNACI", serviceRoute: "DİSPANSER SERVİS GÜZERGAHI", serviceStop: "NOKTA A-101/DOĞTAŞ" },
  { name: "Ahmet ŞAHİN", tcNo: "27159952240", phone: "505 998 55 15", birthDate: "25.06.2004", hireDate: "24.06.2024", position: "MAL İŞÇİSİ", serviceRoute: "ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "SAAT KULESİ" },
  { name: "Ahmet ÖZTÜRK", tcNo: "14782917040", phone: "545 968 29 29", birthDate: "18.07.2006", hireDate: "8.04.2024", position: "MAL İŞÇİSİ", serviceRoute: "SANAYİ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "BAĞDAT KÖPRÜ VE BENZİNLİK" },
  { name: "Ahmet İLGİN", tcNo: "18385959042", phone: "544 999 64 76", birthDate: "20.03.1971", hireDate: "14.03.2023", position: "KAYNAKÇI", serviceRoute: "DİSPANSER SERVİS GÜZERGAHI", serviceStop: "KURUBAŞ" },
  { name: "Ahmet ÖZTAŞ", tcNo: "28872685678", phone: "537 037 23 23", birthDate: "26.02.1978", hireDate: "7.01.2020", position: "MAL İŞÇİSİ", serviceRoute: "ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "ADAYI (KARŞI) SÜTLÜCE" },
  { name: "Ali GÜDÜKLÜ", tcNo: "31954564608", phone: "506 380 11 39", birthDate: "23.05.1985", hireDate: "8.11.2019", position: "AutoForm Editörü", serviceRoute: "DİSPANSER SERVİS GÜZERGAHI", serviceStop: "ŞADIRVAN" },
  { name: "Ali GÜNER", tcNo: "17047757832", phone: "554 014 41 41", birthDate: "6.07.2005", hireDate: "26.04.2024", position: "MAL İŞÇİSİ", serviceRoute: "ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "VALTAÇLIK" },
  { name: "Ali KÜÇÜKALP", tcNo: "47069969644", phone: "533 942172 04", birthDate: "12.08.1956", hireDate: "31.07.2024", position: "MAL İŞÇİSİ", serviceRoute: "SANAYİ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "KALETEPİN" },
  { name: "Ali SAVAŞ", tcNo: "20644978244", phone: "507 521 45 57", birthDate: "6.01.1992", hireDate: "7.04.2021", position: "MAL İŞÇİSİ", serviceRoute: "DİSPANSER SERVİS GÜZERGAHI", serviceStop: "KALETEPİN" },
  // Daha fazlası eklenebilir...
];

const missingEmployeesData = [
  // SANAYİ MAHALLESİ (Eksikler)
  { name: "Ali Sıh YORULMAZ", tcNo: "13119496173", phone: "537 536 14 56", birthDate: "22.06.1952", hireDate: "9.04.2021", position: "SERİGRAFİ ANE ANA MEKİNİSTİ", serviceRoute: "SANAYİ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "ÇORBACI ALİ DAYI" },
  { name: "Ahmet Duran TUNA", tcNo: "49413466398", phone: "534 506 74 79", birthDate: "4.04.1993", hireDate: "7.04.2021", position: "BİL İŞLEM", serviceRoute: "SANAYİ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "NOKTA A-101/DOĞTAŞ" },
  { name: "Fatih BALOĞLU", tcNo: "19421519474", phone: "545 645 17 39", birthDate: "20.03.1967", hireDate: "17.09.2021", position: "İKİ - GÜDE SORUMLUSU", serviceRoute: "SANAYİ MAHALLESİ SERVİS GÜZERGAHI", serviceStop: "ÇORBACI ALİ DAYI" },
  // Daha fazlası eklenebilir...
];

module.exports = {
  activeEmployeesData,
  missingEmployeesData
};

