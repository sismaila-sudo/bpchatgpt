// Test simple de l'API Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai')

const GEMINI_API_KEY = 'AIzaSyDo8UorLKcMXR_NOXyasdG4K1j8zjteNj8'
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

async function testGemini() {
  try {
    console.log('🤖 Test de connexion à Gemini AI...')

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent('Dis juste "CONNEXION OK" pour tester')
    const response = await result.response
    const text = response.text()

    console.log('✅ Réponse Gemini:', text)
    console.log('🎉 Test réussi ! Gemini AI fonctionne.')

  } catch (error) {
    console.error('❌ Erreur Gemini:', error.message)
  }
}

testGemini()