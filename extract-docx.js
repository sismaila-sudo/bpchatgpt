const mammoth = require('mammoth');
const fs = require('fs');

mammoth.extractRawText({path: "BUSINESS PLAN FAISE.docx"})
  .then(result => {
    const text = result.value;
    fs.writeFileSync('business-plan-faise-content.txt', text, 'utf8');
    console.log('✅ Contenu extrait dans business-plan-faise-content.txt');
    console.log('\n📄 APERÇU (premiers 2000 caractères):\n');
    console.log(text.substring(0, 2000));
    console.log('\n...\n');
    console.log('📊 LONGUEUR TOTALE:', text.length, 'caractères');
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
  });
