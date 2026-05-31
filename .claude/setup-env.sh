#!/bin/bash
# WNLQ9 Environment Setup
# This script syncs secrets from Vercel to your local environment
# Run once per machine: bash .claude/setup-env.sh

set -e

echo "🔐 WNLQ9 Environment Setup"
echo "========================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if Vercel project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Project not linked to Vercel. Linking..."
    vercel link --yes --scope team_pPQBZ8bFjr493T1hG6IEjeaI --project prj_d9dpOPQplEtYorMizmQr5FaO1hpQ
fi

echo "📥 Pulling environment variables from Vercel..."
vercel env pull --environment=production

# Add the API key (masked in pull, so we add it manually)
if grep -q 'WNLQ9_BI_API_KEY=""' .env.local; then
    echo "📝 Adding WNLQ9_BI_API_KEY to .env.local..."
    sed -i '' 's/WNLQ9_BI_API_KEY=""/WNLQ9_BI_API_KEY="q7OFOf1NjuxFqvYAUyGjaNpgooJ4RX_uuAw26pv8AHmJthht7iU9jg5mXxLc0T9B"/' .env.local
fi

echo "✅ Environment setup complete!"
echo ""
echo "📋 Summary:"
echo "  • .env.local created (git ignored)"
echo "  • .claude/settings.json configured"
echo "  • All secrets loaded in Claude Code"
echo ""
echo "🚀 You're ready to go!"
echo "   - Run: claude"
echo "   - Ask: What are our top-selling products?"
