const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nddimpfyofoopjnroswf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZGltcGZ5b2Zvb3BqbnJvc3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzOTc2NywiZXhwIjoyMDczNjE1NzY3fQ.SF6tlQBLdtHUFZhPBri5Ha4bwOC7zDO51iJpKZprGPU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPhantomProjections() {
  const projectId = 'c3d9bc6c-7ad8-4d62-8aa3-094a5b8061da';

  console.log('🔍 ANALYSE DES PROJECTIONS FANTÔMES');
  console.log('=====================================');

  try {
    // 1. Récupérer tous les produits actuels
    const { data: products } = await supabase
      .from('products_services')
      .select('*')
      .eq('project_id', projectId);

    console.log('\n📦 PRODUITS ACTUELS:');
    products.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id}) - ${p.unit_price} F CFA/${p.unit}`);
    });

    // 2. Récupérer TOUTES les projections
    const { data: allProjections } = await supabase
      .from('sales_projections')
      .select('*')
      .eq('project_id', projectId)
      .order('year, month');

    console.log(`\n📊 TOTAL PROJECTIONS: ${allProjections.length}`);

    // 3. Analyser les projections par produit
    const projectionsByProduct = {};
    const phantomProjections = [];

    allProjections.forEach(proj => {
      const product = products.find(p => p.id === proj.product_id);

      if (!product) {
        phantomProjections.push(proj);
        console.log(`👻 PROJECTION FANTÔME: product_id=${proj.product_id}, volume=${proj.volume}, ${proj.year}-${proj.month}`);
      } else {
        if (!projectionsByProduct[product.name]) {
          projectionsByProduct[product.name] = [];
        }
        projectionsByProduct[product.name].push(proj);
      }
    });

    console.log('\n📈 PROJECTIONS PAR PRODUIT:');
    for (const [productName, projections] of Object.entries(projectionsByProduct)) {
      console.log(`- ${productName}: ${projections.length} projections`);

      // Calculer le total pour ce produit
      const productTotal = projections.reduce((sum, proj) => {
        const product = products.find(p => p.name === productName);
        return sum + (proj.volume * product.unit_price);
      }, 0);

      console.log(`  Total: ${productTotal.toLocaleString()} F CFA`);
    }

    // 4. Calculer le total des projections fantômes
    if (phantomProjections.length > 0) {
      console.log(`\n👻 PROJECTIONS FANTÔMES TROUVÉES: ${phantomProjections.length}`);

      let phantomRevenue = 0;
      phantomProjections.forEach(proj => {
        // Essayer de trouver un produit avec un nom similaire (cas de produits supprimés/recréés)
        console.log(`- ID fantôme: ${proj.product_id}, Volume: ${proj.volume}, Période: ${proj.year}-${proj.month}`);

        // Si volume > 0, cela contribue potentiellement au problème
        if (proj.volume > 0) {
          console.log(`  ⚠️  Volume non-nul détecté: ${proj.volume}`);
        }
      });

      // 5. Supprimer les projections fantômes
      console.log('\n🧹 SUPPRESSION DES PROJECTIONS FANTÔMES...');

      for (const phantom of phantomProjections) {
        const { error } = await supabase
          .from('sales_projections')
          .delete()
          .eq('id', phantom.id);

        if (error) {
          console.error(`Erreur suppression projection ${phantom.id}:`, error);
        } else {
          console.log(`✅ Supprimé projection fantôme ID ${phantom.id}`);
        }
      }
    }

    // 6. Vérifier les doublons potentiels
    console.log('\n🔍 RECHERCHE DE DOUBLONS...');
    const duplicateCheck = {};

    allProjections.forEach(proj => {
      const product = products.find(p => p.id === proj.product_id);
      if (product) {
        const key = `${product.name}-${proj.year}-${proj.month}`;
        if (!duplicateCheck[key]) {
          duplicateCheck[key] = [];
        }
        duplicateCheck[key].push(proj);
      }
    });

    for (const [key, projections] of Object.entries(duplicateCheck)) {
      if (projections.length > 1) {
        console.log(`🔄 DOUBLON DÉTECTÉ pour ${key}: ${projections.length} entrées`);
        projections.forEach((proj, index) => {
          console.log(`  ${index + 1}. ID: ${proj.id}, Volume: ${proj.volume}`);
        });

        // Garder seulement la première entrée, supprimer les autres
        for (let i = 1; i < projections.length; i++) {
          const { error } = await supabase
            .from('sales_projections')
            .delete()
            .eq('id', projections[i].id);

          if (error) {
            console.error(`Erreur suppression doublon ${projections[i].id}:`, error);
          } else {
            console.log(`✅ Supprimé doublon ID ${projections[i].id}`);
          }
        }
      }
    }

    // 7. Recalculer après nettoyage
    console.log('\n🔄 RECALCUL APRÈS NETTOYAGE...');

    const { data: cleanProjections } = await supabase
      .from('sales_projections')
      .select('*')
      .eq('project_id', projectId)
      .order('year, month');

    console.log(`Projections restantes: ${cleanProjections.length}`);

    let totalCleanRevenue = 0;
    cleanProjections.forEach(proj => {
      const product = products.find(p => p.id === proj.product_id);
      if (product && proj.volume > 0) {
        const revenue = proj.volume * product.unit_price;
        totalCleanRevenue += revenue;
        console.log(`${product.name} ${proj.year}-${proj.month}: ${proj.volume} x ${product.unit_price} = ${revenue.toLocaleString()}`);
      }
    });

    console.log(`\n✅ TOTAL REVENUE APRÈS NETTOYAGE: ${totalCleanRevenue.toLocaleString()} F CFA`);

    // 8. Déclencher un nouveau calcul via l'API
    console.log('\n🚀 DÉCLENCHEMENT NOUVEAU CALCUL...');

    const response = await fetch('http://localhost:3001/api/simple/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId
      })
    });

    const result = await response.json();
    console.log('Résultat API:', result);

    if (result.success) {
      console.log(`\n🎯 CALCUL FINAL TERMINÉ:`);
      console.log(`CA Total: ${result.summary.total_revenue.toLocaleString()} F CFA`);
      console.log(`Résultat Net: ${result.summary.total_net_income.toLocaleString()} F CFA`);
      console.log(`Marge: ${result.summary.margin_percent.toFixed(1)}%`);
      console.log(`Périodes: ${result.summary.periods_calculated}`);
    }

    console.log('\n✅ NETTOYAGE TERMINÉ !');
    console.log('🔄 Rechargez http://localhost:3001 pour voir les données corrigées');

  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

cleanupPhantomProjections().catch(console.error);