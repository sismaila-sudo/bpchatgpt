#!/bin/bash

# Script pour corriger automatiquement les erreurs ESLint simples

echo "🔧 Correction automatique des erreurs ESLint..."

# 1. Fixer formatage et certaines erreurs auto-fixables
npx eslint src --fix --ext .ts,.tsx

# 2. Rapport des erreurs restantes
echo ""
echo "📊 Erreurs restantes après auto-fix:"
npx eslint src --ext .ts,.tsx --format compact | head -50

echo ""
echo "✅ Auto-fix terminé. Vérifiez les erreurs restantes ci-dessus."
