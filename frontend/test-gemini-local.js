// Test Gemini AI dans le contexte du frontend
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Clé API depuis .env.local
const GEMINI_API_KEY = 'AIzaSyDo8UorLKcMXR_NOXyasdG4K1j8zjteNj8'

async function testGeminiLocal() {
  console.log('🤖 Test Gemini AI local...')
  console.log('🔑 Clé API configurée:', GEMINI_API_KEY ? 'OUI' : 'NON')

  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.log('❌ Aucune clé API Gemini trouvée')
    return
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    console.log('📡 Envoi de la requête test...')
    const result = await model.generateContent('Réponds juste "TEST OK" pour confirmer la connexion')
    const response = await result.response
    const text = response.text()

    console.log('✅ Réponse Gemini:', text.trim())
    console.log('🎉 Gemini AI fonctionne parfaitement !')

    // Test avec un prompt business
    console.log('\n🏢 Test avec un prompt business...')
    const businessResult = await model.generateContent(`
      Tu es un expert en business plan.
      Rédige un résumé de 50 mots maximum pour un projet de commerce de produits électroniques
      avec un CA prévu de 50 millions XOF et une marge de 30%.
    `)
    const businessResponse = await businessResult.response
    const businessText = businessResponse.text()

    console.log('📊 Réponse business:', businessText.trim())

  } catch (error) {
    console.error('❌ Erreur lors du test Gemini:', error.message)

    if (error.message.includes('API_KEY_INVALID')) {
      console.log('🔑 La clé API semble invalide ou expirée')
    } else if (error.message.includes('quota')) {
      console.log('📊 Quota API dépassé')
    } else {
      console.log('🌐 Problème de connexion réseau ou autre')
    }
  }
}

testGeminiLocal()