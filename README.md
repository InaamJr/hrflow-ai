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
