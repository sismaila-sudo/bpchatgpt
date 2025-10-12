const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('BP DOSSIER FONGIP 2025 VF.pdf');

pdf(dataBuffer).then(function(data) {
  const text = data.text;

  fs.writeFileSync('bp-fongip-content.txt', text, 'utf8');

  console.log('✅ Contenu FONGIP extrait dans bp-fongip-content.txt');
  console.log('\n📄 APERÇU (premiers 3000 caractères):\n');
  console.log(text.substring(0, 3000));
  console.log('\n...\n');
  console.log('📊 LONGUEUR TOTALE:', text.length, 'caractères');
  console.log('📄 NOMBRE DE PAGES:', data.numpages);
}).catch(err => {
  console.error('❌ Erreur:', err);
});
