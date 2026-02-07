# 🗄️ HRFlow AI - Database Setup

Complete Supabase database setup with 10,000+ realistic HR records ready for your hackathon demo.

## 📦 What's Included

### Scripts
- `generate-hr-data.js` - Generate 1,200+ employees with full HR data
- `import-to-supabase.js` - Import all data to Supabase
- `generate-embeddings.js` - Create vector embeddings for RAG chatbot
- `supabase-schema.sql` - Complete database schema

### Documentation
- `SUPABASE-SETUP-GUIDE.md` - Detailed setup instructions
- `README-DATA-GENERATION.md` - Data generation documentation
- `QUICKSTART.md` - Quick reference guide

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Data
```bash
npm run generate
```
**Output:** 6 JSON files in `hr-data-export/` with 10,000+ records

### 3. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

### 4. Create Database Schema
- Open Supabase SQL Editor
- Copy/paste contents of `supabase-schema.sql`
- Run the script

### 5. Import Data
```bash
npm run import
```
**Duration:** ~30-60 seconds

### 6. Generate Embeddings (for AI Chatbot)
```bash
npm run embeddings
```
**Duration:** ~10 seconds | **Cost:** ~$0.0001

## ✅ Done!

Your database now has:
- ✅ 1,200 employees across 5 countries
- ✅ 15 contract templates (multi-jurisdiction)
- ✅ 7 AI-searchable policies
- ✅ ~8,000 compliance tracking items
- ✅ 60+ urgent alerts for demo
- ✅ 200 automation event logs

## 📊 Available NPM Scripts

```bash
# Data Generation
npm run generate              # Generate HR dataset

# Database Import
npm run import                # Import data to Supabase
npm run import:clear          # Clear existing data and re-import

# Embeddings (for RAG)
npm run embeddings            # Generate embeddings for new policies
npm run embeddings:regenerate # Regenerate all embeddings
```

## 🗂️ Database Structure

### Tables Created
```
employees              1,200 records   Core employee data
contract_templates        15 records   Legal templates
policies                   7 records   Company policies (with vector embeddings)
compliance_items      ~8,000 records   Work permits, training, equipment
sample_conversations      10 records   Pre-loaded Q&A pairs
automation_logs          200 records   Historical AI actions
generated_contracts        0 records   (will grow as you generate contracts)
chat_messages              0 records   (will grow as employees chat)
system_config              4 records   Application settings
```

### Views Available
```
urgent_compliance_alerts     → Items expiring soon
employee_dashboard_summary   → Per-employee metrics
contract_generation_stats    → AI performance
automation_roi_metrics       → Time/cost savings
```

### Functions Available
```
match_policies()             → Semantic search for RAG
update_compliance_statuses() → Auto-update alert status
calculate_leave_balance()    → Dynamic leave calculation
```

## 🎯 Demo-Ready Features

### Built-In Scenarios
Your dataset includes strategic scenarios perfect for demo:

**Compliance Dashboard:**
- 60 work permits expiring in 30-60 days
- 60 employees with overdue training
- 96 employees haven't taken leave in 6+ months
- 84 equipment loans overdue

**Multi-Jurisdiction:**
- Singapore (40% of employees)
- United Kingdom (25%)
- United States (20%)
- India (10%)
- UAE (5%)

**Realistic Data:**
- Manager hierarchies
- Salary ranges by role/country
- Leave balances calculated
- Compliance expirations time-aware

## 🔍 Verify Setup

### Check Data Import
```bash
# In Supabase SQL Editor:
SELECT 
  'employees' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'compliance_items', COUNT(*) FROM compliance_items
UNION ALL  
SELECT 'policies', COUNT(*) FROM policies;
```

**Expected:**
```
employees:        1,200
compliance_items: ~8,000
policies:         7
```

### Test Semantic Search
```bash
# In Supabase SQL Editor:
SELECT title, similarity 
FROM match_policies(
  (SELECT embedding FROM policies WHERE title LIKE '%Leave%' LIMIT 1),
  0.7,
  3
);
```

**Expected:** 3 policies with similarity scores

### Check Urgent Alerts
```bash
# In Supabase SQL Editor:
SELECT COUNT(*) FROM urgent_compliance_alerts;
```

**Expected:** 60-80 urgent items

## 📁 Project Structure

```
.
├── generate-hr-data.js           # Data generator
├── import-to-supabase.js         # Data importer
├── generate-embeddings.js        # Embedding generator
├── supabase-schema.sql           # Database schema
├── package.json                  # Dependencies
├── .env.example                  # Environment template
│
├── SUPABASE-SETUP-GUIDE.md      # Detailed setup guide
├── README-DATA-GENERATION.md     # Data generation docs
├── QUICKSTART.md                 # Quick reference
└── README.md                     # This file
```

## 🛠️ Troubleshooting

### Import Fails
**Issue:** Connection error or "table does not exist"  
**Fix:** Run `supabase-schema.sql` in Supabase SQL Editor first

### Embeddings Fail
**Issue:** "Invalid API key"  
**Fix:** Check OPENAI_API_KEY in .env file

### No Urgent Alerts
**Issue:** urgent_compliance_alerts view is empty  
**Fix:** Run `SELECT update_compliance_statuses();` in SQL Editor

### Foreign Key Errors
**Issue:** "violates foreign key constraint"  
**Fix:** Use `npm run import:clear` to reset and re-import

## 💡 Pro Tips

1. **Test Queries in SQL Editor First**
   - Faster iteration
   - See results immediately
   - No need to rebuild frontend

2. **Use Views for Complex Data**
   - Pre-computed and optimized
   - Easier than writing joins in your API

3. **Enable Row Level Security (RLS) Later**
   - For hackathon, RLS is disabled for easier development
   - Enable it before production deployment

4. **Monitor API Usage**
   - Supabase Dashboard → API → Usage
   - Check you're not hitting rate limits

5. **Use Realtime Subscriptions**
   ```javascript
   supabase
     .channel('compliance')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'compliance_items' },
       (payload) => console.log(payload)
     )
     .subscribe();
   ```

## 📚 Next Steps

Once your database is setup:

1. **Build Your Next.js API Routes**
   - Use examples in SUPABASE-SETUP-GUIDE.md
   - Connect to Supabase client

2. **Implement Contract Generation**
   - Use contract templates
   - Generate with GPT-4
   - Store in generated_contracts table

3. **Build HR Chatbot**
   - Use match_policies() for RAG
   - Store conversations in chat_messages

4. **Create Dashboard**
   - Query urgent_compliance_alerts view
   - Show employee_dashboard_summary
   - Display automation_roi_metrics

## 🎓 Understanding the Data

### Employee Distribution
```
By Country:
  Singapore (SG):  480 (40%)
  UK:              300 (25%)
  US:              240 (20%)
  India (IN):      120 (10%)
  UAE:              60 (5%)

By Role:
  Engineers:       696 (58%)
  Product Managers: 96 (8%)
  Designers:       120 (10%)
  Data Analysts:    84 (7%)
  Others:          204 (17%)
```

### Compliance Scenarios
```
Compliant:              900 (75%)
Work permit expiring:    60 (5%)
Training overdue:        60 (5%)
No leave 6+ months:      96 (8%)
Equipment unreturned:    84 (7%)
```

### Country-Specific Data
Each country has realistic:
- Leave entitlements (14-30 days)
- Notice periods (0-3 months)
- Salary conversions (local currency)
- Legal requirements (CPF, pension, 401k)

## 💰 Cost Estimate

### Data Generation
- **Free** - runs locally

### Supabase (Free Tier)
- 500 MB database (you'll use ~50 MB)
- 2 GB bandwidth (more than enough)
- 50,000 monthly active users

### OpenAI Embeddings
- 7 policies × ~500 tokens = ~3,500 tokens
- text-embedding-3-small = $0.02 / 1M tokens
- **Total: ~$0.0001** (negligible)

### Total Setup Cost
**$0.00** (using free tiers) ✅

## 🏆 Why This Setup Wins

1. **Production-Quality Data**
   - Realistic distributions
   - Proper relationships
   - Edge cases included

2. **AI-Ready Infrastructure**
   - Vector search configured
   - RAG functions ready
   - Optimized indexes

3. **Demo-Optimized**
   - Built-in urgent scenarios
   - Analytics views ready
   - Historical logs for storytelling

4. **Scalable Architecture**
   - Efficient queries
   - Batch operations
   - Real-time capable

## 📞 Support

For detailed help:
- **Setup Issues:** See SUPABASE-SETUP-GUIDE.md
- **Data Questions:** See README-DATA-GENERATION.md
- **Quick Reference:** See QUICKSTART.md

## ✨ You're Ready!

Your database is production-ready with:
- ✅ Realistic, complex data
- ✅ AI-powered search (RAG)
- ✅ Performance-optimized
- ✅ Demo scenarios built-in
- ✅ Analytics ready

**Time to build your hackathon-winning application!** 🚀
