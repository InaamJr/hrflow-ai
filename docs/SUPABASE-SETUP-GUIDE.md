# 🗄️ Supabase Setup Guide - HRFlow AI

Complete guide to setting up your Supabase database and importing all HR data.

## 📋 Prerequisites

1. **Supabase Account** (free tier is fine)
   - Sign up at: https://supabase.com
   - Create a new project

2. **Node.js Packages**
   ```bash
   npm install @supabase/supabase-js openai
   ```

3. **API Keys**
   - Supabase URL and Anon Key (from project settings)
   - OpenAI API Key (from https://platform.openai.com/api-keys)

## 🚀 Quick Start (3 Steps)

### Step 1: Create Database Schema

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste and click **Run**

**Expected result:** 
```
✅ Tables created
✅ Views created
✅ Functions created
✅ Indexes created
```

### Step 2: Import Data

1. Set environment variables:
   ```bash
   export SUPABASE_URL="https://your-project-id.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key-here"
   ```

2. Run import script:
   ```bash
   node import-to-supabase.js
   ```

3. Wait ~30-60 seconds for import to complete

**Expected result:**
```
✅ 1,200 employees imported
✅ 15 contract templates imported
✅ 7 policies imported
✅ ~8,000 compliance items imported
✅ 10 sample conversations imported
✅ 200 automation logs imported
```

### Step 3: Generate Embeddings (for AI Chatbot)

1. Add OpenAI API key:
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   ```

2. Run embedding generation:
   ```bash
   node generate-embeddings.js
   ```

3. Wait ~5-10 seconds (7 policies)

**Expected result:**
```
✅ 7 embeddings generated
✅ Semantic search tested and working
💰 Cost: ~$0.0001
```

## 📁 Files Overview

```
supabase-schema.sql          → Database structure (run in Supabase SQL Editor)
import-to-supabase.js        → Data import script (run locally)
generate-embeddings.js       → RAG embeddings generator (run locally)
SUPABASE-SETUP-GUIDE.md      → This file
```

## 🔍 Detailed Walkthrough

### A. Getting Your Supabase Credentials

1. **Navigate to Project Settings**
   - Open your Supabase project
   - Click ⚙️ **Settings** (bottom left)
   - Click **API** tab

2. **Copy Your Credentials**
   ```
   Project URL:  https://xxxxx.supabase.co
   Anon key:     eyJhbGc...very-long-key...
   ```

3. **Set Environment Variables**
   
   **Mac/Linux:**
   ```bash
   export SUPABASE_URL="https://xxxxx.supabase.co"
   export SUPABASE_ANON_KEY="eyJhbGc..."
   export OPENAI_API_KEY="sk-..."
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set SUPABASE_URL=https://xxxxx.supabase.co
   set SUPABASE_ANON_KEY=eyJhbGc...
   set OPENAI_API_KEY=sk-...
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:SUPABASE_URL="https://xxxxx.supabase.co"
   $env:SUPABASE_ANON_KEY="eyJhbGc..."
   $env:OPENAI_API_KEY="sk-..."
   ```

### B. Creating the Database Schema

The `supabase-schema.sql` file creates:

**Tables:**
- `employees` - Core employee data
- `contract_templates` - Legal document templates
- `generated_contracts` - AI-generated contracts
- `policies` - Company policies with vector embeddings
- `compliance_items` - Work permits, training, equipment
- `chat_messages` - Chatbot conversation history
- `automation_logs` - Audit trail of AI actions
- `sample_conversations` - Pre-loaded Q&A pairs
- `system_config` - Application settings

**Views** (for easy data access):
- `urgent_compliance_alerts` - Items needing attention
- `employee_dashboard_summary` - Per-employee metrics
- `contract_generation_stats` - AI performance analytics
- `automation_roi_metrics` - Time/cost savings

**Functions:**
- `match_policies()` - Semantic search for RAG
- `update_compliance_statuses()` - Auto-update alerts
- `calculate_leave_balance()` - Dynamic leave calculation

**Why run in SQL Editor, not locally?**
- Creates extensions (uuid-ossp, vector)
- Sets up advanced features (triggers, views, functions)
- One-time setup, no need for migration management

### C. Importing the Data

The import script (`import-to-supabase.js`):

1. **Validates** your Supabase credentials
2. **Tests** database connection
3. **Loads** JSON files from `hr-data-export/`
4. **Inserts** data in batches (500 records at a time)
5. **Respects** foreign key dependencies (employees before compliance items)
6. **Verifies** successful import with sample queries

**Import Order (Important!):**
```
1. employees           (no dependencies)
2. contract_templates  (no dependencies)
3. policies            (no dependencies)
4. compliance_items    (needs employees)
5. sample_conversations (no dependencies)
6. automation_logs     (needs employees)
```

**Troubleshooting Import Errors:**

**Error: "Connection failed"**
- Check SUPABASE_URL and SUPABASE_ANON_KEY
- Ensure you're using the anon key, not service role key for initial testing

**Error: "foreign key violation"**
- Schema wasn't created properly
- Re-run `supabase-schema.sql`

**Error: "table does not exist"**
- Schema not created yet
- Run `supabase-schema.sql` first

**Error: "duplicate key value violates unique constraint"**
- Data already imported
- Use `node import-to-supabase.js --clear` to wipe and re-import

### D. Generating Embeddings

The embedding script (`generate-embeddings.js`):

1. **Fetches** all policies from database
2. **Calls** OpenAI API to generate vector embeddings
3. **Updates** each policy with its embedding
4. **Tests** semantic search functionality

**Why embeddings?**
- Enable semantic search (understanding intent, not just keywords)
- Power the RAG (Retrieval Augmented Generation) chatbot
- Example: "How much vacation?" matches "Annual Leave Policy"

**Cost Estimate:**
- 7 policies × ~500 tokens each = ~3,500 tokens
- text-embedding-3-small = $0.02 per 1M tokens
- **Total cost: $0.0001** (basically free)

**Troubleshooting Embedding Errors:**

**Error: "Invalid API key"**
- Check OPENAI_API_KEY is set correctly
- Verify key at https://platform.openai.com/api-keys

**Error: "Rate limit exceeded"**
- Free tier has limits (3 requests/min)
- Script auto-waits if rate limited
- Or upgrade OpenAI account

**Error: "match_policies function does not exist"**
- Schema wasn't created properly
- Re-run `supabase-schema.sql`

## 🧪 Verifying Everything Works

### 1. Check Table Counts

Run in Supabase SQL Editor:

```sql
SELECT 
  'employees' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'compliance_items', COUNT(*) FROM compliance_items
UNION ALL
SELECT 'policies', COUNT(*) FROM policies
UNION ALL
SELECT 'contract_templates', COUNT(*) FROM contract_templates;
```

**Expected:**
```
employees:          1,200
compliance_items:   ~8,000
policies:           7
contract_templates: 15
```

### 2. Test Urgent Compliance View

```sql
SELECT * FROM urgent_compliance_alerts
ORDER BY days_remaining ASC
LIMIT 10;
```

**Expected:** 10 items with expiring work permits, training, etc.

### 3. Test Semantic Search

```sql
SELECT * FROM match_policies(
  (SELECT embedding FROM policies WHERE title LIKE '%Leave%' LIMIT 1),
  0.7,
  3
);
```

**Expected:** 3 policies related to leave, with similarity scores

### 4. Test Employee Dashboard

```sql
SELECT * FROM employee_dashboard_summary
WHERE urgent_compliance_items > 0
LIMIT 5;
```

**Expected:** 5 employees with compliance alerts

## 📊 What You Now Have

**Complete HR dataset:**
- ✅ 1,200 realistic employees across 5 countries
- ✅ Multi-jurisdiction contract templates
- ✅ RAG-enabled policy search
- ✅ ~8,000 compliance tracking items
- ✅ 60+ urgent alerts for demo
- ✅ Historical automation logs

**Ready-to-use database features:**
- ✅ Vector search for AI chatbot
- ✅ Pre-built analytics views
- ✅ Automated compliance tracking
- ✅ Performance-optimized indexes

## 🎯 Next Steps

Now that your database is ready:

### 1. Build Your API (Next.js)
```javascript
// Example: Get urgent compliance alerts
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const { data } = await supabase
    .from('urgent_compliance_alerts')
    .select('*')
    .order('days_remaining', { ascending: true });
  
  return Response.json(data);
}
```

### 2. Implement RAG Chatbot
```javascript
// Example: Semantic policy search
const { data: policies } = await supabase.rpc('match_policies', {
  query_embedding: questionEmbedding,
  match_threshold: 0.7,
  match_count: 3
});
```

### 3. Build Contract Generation
```javascript
// Example: Get contract template
const { data: template } = await supabase
  .from('contract_templates')
  .select('*')
  .eq('country', 'SG')
  .eq('contract_type', 'employment')
  .single();
```

## 💡 Pro Tips

1. **Use Views for Complex Queries**
   - Views are pre-computed and optimized
   - Easier than writing complex joins

2. **Leverage Indexes**
   - All foreign keys are indexed
   - Country, role, status fields are indexed
   - Your queries will be fast!

3. **Test Locally First**
   - Use Supabase local development
   - `npx supabase init` → `npx supabase start`

4. **Monitor Performance**
   - Check Supabase Dashboard → Database → Query Performance
   - Look for slow queries

5. **Use Realtime for Live Updates**
   ```javascript
   supabase
     .channel('compliance-alerts')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'compliance_items' },
       (payload) => console.log('Change!', payload)
     )
     .subscribe();
   ```

## 🆘 Troubleshooting

### "Too many requests" during import
- Reduce BATCH_SIZE in import script (line 14)
- Add delays between batches

### Embeddings taking too long
- Normal for free tier OpenAI accounts
- Consider upgrading to paid tier
- Or use smaller batch sizes

### Foreign key errors
- Ensure schema created first
- Check that employee IDs match in compliance items

### Vector search not working
- Verify embeddings were generated
- Check `SELECT COUNT(*) FROM policies WHERE embedding IS NOT NULL`
- Re-run generate-embeddings.js

## 📞 Need Help?

**Common Issues & Solutions:**

1. **Can't connect to Supabase**
   - Verify project is active (not paused)
   - Check URL includes `https://`
   - Ensure using correct anon key

2. **Import fails halfway**
   - Use `--clear` flag to reset and try again
   - Check Supabase logs for specific errors

3. **Embeddings cost too much**
   - 7 policies = $0.0001 (negligible)
   - If worried, test with 1-2 policies first

---

## ✅ Success Checklist

Before moving to frontend development, verify:

- [ ] All tables created in Supabase
- [ ] 1,200+ employees imported
- [ ] 7 policies have embeddings
- [ ] `urgent_compliance_alerts` view returns data
- [ ] `match_policies()` function works
- [ ] Can query employees by country/role
- [ ] Compliance items linked to employees

**Once all checked:** You're ready to build! 🚀

---

**Total Setup Time:** ~10 minutes  
**Data Ready:** Yes ✅  
**RAG Enabled:** Yes ✅  
**Demo Ready:** Yes ✅
