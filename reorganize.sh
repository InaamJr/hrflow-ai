#!/bin/bash

# ============================================================================
# HRFlow AI - Project Reorganization Script
# ============================================================================
# This script automatically reorganizes your project into a clean structure
# 
# Usage: chmod +x reorganize.sh && ./reorganize.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 HRFlow AI - Project Reorganization"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Step 1: Create Directory Structure
# ============================================================================

echo "${YELLOW}Step 1: Creating directory structure...${NC}"

mkdir -p app/api/contracts/generate
mkdir -p app/api/contracts/\[id\]
mkdir -p app/api/chat/message
mkdir -p app/api/compliance/alerts

mkdir -p lib
mkdir -p scripts/data-generation
mkdir -p scripts/database
mkdir -p scripts/testing

mkdir -p data/hr-data-export
mkdir -p data/generated-contracts

mkdir -p database
mkdir -p docs
mkdir -p components/ui
mkdir -p components/features

echo "${GREEN}✅ Directories created${NC}"
echo ""

# ============================================================================
# Step 2: Move Files
# ============================================================================

echo "${YELLOW}Step 2: Moving files to new locations...${NC}"

# Move API routes
if [ -f "route.js" ]; then
    mv route.js app/api/contracts/generate/route.js
    echo "  ✅ Moved route.js"
fi

# Move library files
if [ -f "contract-generator.js" ]; then
    mv contract-generator.js lib/
    echo "  ✅ Moved contract-generator.js"
fi

# Move data generation scripts
if [ -f "generate-hr-data.js" ]; then
    mv generate-hr-data.js scripts/data-generation/
    echo "  ✅ Moved generate-hr-data.js"
fi

if [ -f "verify-data.js" ]; then
    mv verify-data.js scripts/data-generation/
    echo "  ✅ Moved verify-data.js"
fi

# Move database scripts
if [ -f "import-to-supabase.js" ]; then
    mv import-to-supabase.js scripts/database/
    echo "  ✅ Moved import-to-supabase.js"
fi

if [ -f "reset-database.js" ]; then
    mv reset-database.js scripts/database/
    echo "  ✅ Moved reset-database.js"
fi

if [ -f "generate-embeddings.js" ]; then
    mv generate-embeddings.js scripts/database/
    echo "  ✅ Moved generate-embeddings.js"
fi

# Move testing scripts
if [ -f "test-contract-generation.js" ]; then
    mv test-contract-generation.js scripts/testing/
    echo "  ✅ Moved test-contract-generation.js"
fi

# Move data directory contents
if [ -d "hr-data-export" ]; then
    mv hr-data-export/* data/hr-data-export/ 2>/dev/null || true
    rmdir hr-data-export 2>/dev/null || true
    echo "  ✅ Moved hr-data-export contents"
fi

# Move individual JSON files
for file in employees.json contract_templates.json policies.json compliance_items.json sample_conversations.json automation_logs.json dataset_summary.json; do
    if [ -f "$file" ]; then
        mv "$file" data/hr-data-export/
        echo "  ✅ Moved $file"
    fi
done

# Move database schemas
if [ -f "supabase-schema.sql" ]; then
    mv supabase-schema.sql database/
    echo "  ✅ Moved supabase-schema.sql"
fi

if [ -f "RESET-DATABASE.sql" ]; then
    mv RESET-DATABASE.sql database/reset-database.sql
    echo "  ✅ Moved RESET-DATABASE.sql"
fi

if [ -f "clear-database.sql" ]; then
    mv clear-database.sql database/
    echo "  ✅ Moved clear-database.sql"
fi

# Move documentation
for doc in CONTRACT-GENERATION.md SUPABASE-SETUP-GUIDE.md README-DATABASE-SETUP.md README-DATA-GENERATION.md QUICKSTART.md; do
    if [ -f "$doc" ]; then
        mv "$doc" docs/
        echo "  ✅ Moved $doc"
    fi
done

echo "${GREEN}✅ Files moved${NC}"
echo ""

# ============================================================================
# Step 3: Update package.json Scripts
# ============================================================================

echo "${YELLOW}Step 3: Updating package.json scripts...${NC}"

cat > package.json.tmp << 'EOF'
{
  "name": "hrflow-ai",
  "version": "1.0.0",
  "description": "AI-powered HR operations platform",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "generate": "node scripts/data-generation/generate-hr-data.js",
    "verify": "node scripts/data-generation/verify-data.js",
    "reset": "node scripts/database/reset-database.js",
    "import": "node scripts/database/import-to-supabase.js",
    "embeddings": "node scripts/database/generate-embeddings.js",
    "test:contracts": "node scripts/testing/test-contract-generation.js"
  },
  "dependencies": {
    "@faker-js/faker": "^8.4.0",
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.24.0",
    "docx": "^8.5.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {},
  "author": "HRFlow AI Team",
  "license": "MIT"
}
EOF

mv package.json.tmp package.json
echo "${GREEN}✅ package.json updated${NC}"
echo ""

# ============================================================================
# Step 4: Update File Paths in Scripts
# ============================================================================

echo "${YELLOW}Step 4: Updating file paths in scripts...${NC}"

# Update generate-hr-data.js
if [ -f "scripts/data-generation/generate-hr-data.js" ]; then
    sed -i.bak "s|const outputDir = './hr-data-export'|const outputDir = './data/hr-data-export'|g" scripts/data-generation/generate-hr-data.js
    rm scripts/data-generation/generate-hr-data.js.bak 2>/dev/null || true
    echo "  ✅ Updated generate-hr-data.js"
fi

# Update import-to-supabase.js
if [ -f "scripts/database/import-to-supabase.js" ]; then
    sed -i.bak "s|const DATA_DIR = './hr-data-export'|const DATA_DIR = './data/hr-data-export'|g" scripts/database/import-to-supabase.js
    rm scripts/database/import-to-supabase.js.bak 2>/dev/null || true
    echo "  ✅ Updated import-to-supabase.js"
fi

# Update test-contract-generation.js
if [ -f "scripts/testing/test-contract-generation.js" ]; then
    sed -i.bak "s|const { generateContract|const { generateContract|g" scripts/testing/test-contract-generation.js
    sed -i.bak "s|require('./lib/contract-generator')|require('../../lib/contract-generator')|g" scripts/testing/test-contract-generation.js
    sed -i.bak "s|const OUTPUT_DIR = './generated-contracts'|const OUTPUT_DIR = './data/generated-contracts'|g" scripts/testing/test-contract-generation.js
    rm scripts/testing/test-contract-generation.js.bak 2>/dev/null || true
    echo "  ✅ Updated test-contract-generation.js"
fi

echo "${GREEN}✅ File paths updated${NC}"
echo ""

# ============================================================================
# Step 5: Create/Update .gitignore
# ============================================================================

echo "${YELLOW}Step 5: Updating .gitignore...${NC}"

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Next.js
.next/
out/
build/
dist/

# Generated data (exclude from git)
data/hr-data-export/
data/generated-contracts/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/
EOF

echo "${GREEN}✅ .gitignore updated${NC}"
echo ""

# ============================================================================
# Step 6: Create Main README
# ============================================================================

echo "${YELLOW}Step 6: Creating main README.md...${NC}"

cat > README.md << 'EOF'
# 🚀 HRFlow AI - AI-Powered HR Operations Platform

Automate HR operations with AI-powered contract generation, intelligent chatbots, and proactive compliance tracking.

## 🎯 Features

- ✅ **AI Contract Generation** - Generate legal contracts in seconds (SG, UK, US, IN, UAE)
- ✅ **HR Chatbot (RAG)** - Intelligent policy Q&A with semantic search
- ✅ **Proactive Compliance** - Automated expiry tracking and alerts
- ✅ **Invisible Onboarding** - Complete automation from offer to first day

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# 3. Setup database (run schema in Supabase SQL Editor)
# Copy contents of database/supabase-schema.sql

# 4. Generate sample data
npm run generate

# 5. Import to Supabase
npm run import

# 6. Generate embeddings for RAG
npm run embeddings

# 7. Test contract generation
npm run test:contracts
```

## 📚 Documentation

- [📝 Contract Generation](docs/CONTRACT-GENERATION.md)
- [🗄️ Database Setup](docs/SUPABASE-SETUP-GUIDE.md)
- [📊 Data Generation](docs/README-DATA-GENERATION.md)
- [⚡ Quick Reference](docs/QUICKSTART.md)

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** OpenAI GPT-4, text-embedding-3-small
- **Documents:** docx-js

## 📊 Available Scripts

```bash
npm run generate      # Generate 1,200 employee dataset
npm run verify        # Verify data quality
npm run import        # Import data to Supabase
npm run embeddings    # Generate embeddings for RAG
npm run test:contracts # Test contract generation
npm run reset         # Reset database

npm run dev           # Start Next.js dev server
npm run build         # Build for production
```

## 📁 Project Structure

```
hrflow-ai/
├── app/              # Next.js app (API routes, pages)
├── lib/              # Core business logic
├── scripts/          # Utility scripts
├── data/             # Generated data (gitignored)
├── database/         # SQL schemas
├── docs/             # Documentation
└── components/       # React components
```

## 🎬 Demo Features

1. **Contract Generation** - 3-4 hours → 20 seconds
2. **Multi-Jurisdiction** - Automatic legal compliance
3. **Proactive Alerts** - 60+ compliance items tracked
4. **ROI Calculator** - $200 saved per hire

## 📝 License

MIT

---

Built for Derive AI Hackathon 2025
EOF

echo "${GREEN}✅ README.md created${NC}"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "======================================"
echo "${GREEN}✨ Reorganization Complete!${NC}"
echo "======================================"
echo ""
echo "📁 New Structure:"
echo "  ✅ app/              - Next.js application"
echo "  ✅ lib/              - Core logic"
echo "  ✅ scripts/          - Utility scripts"
echo "  ✅ data/             - Generated data"
echo "  ✅ database/         - SQL schemas"
echo "  ✅ docs/             - Documentation"
echo ""
echo "🧪 Test Your Setup:"
echo "  npm run generate"
echo "  npm run verify"
echo "  npm run import"
echo "  npm run test:contracts"
echo ""
echo "${GREEN}🎉 Your project is now professionally organized!${NC}"
