-- ============================================================================
-- HRFlow AI - Complete Supabase Database Schema
-- ============================================================================
-- This script creates all tables, relationships, indexes, and configurations
-- needed for the AI-powered HR operations platform
-- 
-- Run this in Supabase SQL Editor BEFORE importing data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Employees Table
-- Central table containing all employee information
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  country TEXT NOT NULL, -- SG, UK, US, IN, UAE
  department TEXT NOT NULL,
  
  -- Compensation
  salary_usd INTEGER NOT NULL,
  salary_local INTEGER NOT NULL,
  currency TEXT NOT NULL,
  equity_shares INTEGER DEFAULT 0,
  
  -- Employment details
  employment_type TEXT DEFAULT 'full_time', -- full_time, contractor
  start_date DATE NOT NULL,
  probation_end_date DATE,
  notice_period_months NUMERIC(3,1),
  
  -- Leave management
  leave_balance_days INTEGER DEFAULT 0,
  leave_accrued_days INTEGER DEFAULT 0,
  last_leave_date DATE,
  
  -- Compliance
  work_permit_expiry DATE,
  
  -- Reporting structure
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Contact information
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Financial
  bank_account TEXT,
  tax_id TEXT,
  
  -- Internal tracking
  compliance_scenario TEXT, -- For testing: expiring_soon, training_overdue, no_leave_6months, compliant
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Templates Table
-- Stores legal document templates for each country and contract type
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  contract_type TEXT NOT NULL, -- employment, nda, equity, contractor_agreement
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL, -- Markdown template with {{variable}} placeholders
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique templates per country/type combination
  UNIQUE(country, contract_type)
);

-- Generated Contracts Table
-- Tracks all AI-generated contracts for employees
CREATE TABLE IF NOT EXISTS generated_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_type TEXT NOT NULL,
  
  -- Contract content
  generated_content TEXT NOT NULL, -- Final generated contract (markdown or docx content)
  file_url TEXT, -- URL to stored .docx file if uploaded to storage
  
  -- Workflow status
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, signed, rejected
  
  -- Approval tracking
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  generation_duration_ms INTEGER, -- How long AI took to generate
  ai_model_used TEXT DEFAULT 'gpt-4', -- Track which model generated it
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies Table
-- Company policies for RAG (Retrieval Augmented Generation)
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- leave, expense, remote_work, benefits, compliance, career
  country TEXT, -- NULL means applies to all countries
  content TEXT NOT NULL, -- Full policy document in markdown
  
  -- Vector embeddings for semantic search
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small produces 1536 dimensions
  
  -- Metadata
  version INTEGER DEFAULT 1,
  effective_date DATE DEFAULT CURRENT_DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Items Table
-- Tracks all compliance-related items that need monitoring
CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Item details
  item_type TEXT NOT NULL, -- work_permit, training_certification, equipment_loan, background_check
  item_name TEXT NOT NULL,
  description TEXT,
  
  -- Expiration tracking
  expiry_date DATE,
  status TEXT DEFAULT 'active', -- active, expiring_soon, urgent, overdue, renewed, returned
  
  -- Notification tracking
  notified_at TIMESTAMPTZ, -- When we last sent a reminder
  notification_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
-- Stores conversations between employees and the HR chatbot
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Conversation
  message TEXT NOT NULL, -- Employee's question
  response TEXT, -- AI's answer
  
  -- Context tracking
  context_used JSONB, -- Which policies, employee data, etc. were used to generate response
  
  -- RAG metadata
  policies_referenced UUID[], -- Array of policy IDs used
  similarity_scores NUMERIC[], -- Similarity scores for policies used
  
  -- Performance tracking
  response_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'gpt-4',
  
  -- Feedback
  helpful BOOLEAN, -- User feedback: was this response helpful?
  feedback_comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Logs Table
-- Records all automated actions performed by the system
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  trigger_event TEXT NOT NULL, -- new_hire, expiry_detected, policy_question, etc.
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Actions taken (stored as JSON array)
  actions_taken JSONB NOT NULL, -- [{action: "contract_generated", timestamp: "...", duration_ms: 2300}, ...]
  
  -- Performance metrics
  total_duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample Conversations Table
-- Pre-loaded Q&A pairs for training/testing the chatbot
CREATE TABLE IF NOT EXISTS sample_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer_template TEXT NOT NULL, -- Template with {{placeholders}} for personalization
  category TEXT NOT NULL, -- leave, expense, career, benefits, etc.
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_compliance ON employees(compliance_scenario);

-- Compliance items indexes
CREATE INDEX IF NOT EXISTS idx_compliance_employee ON compliance_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_items(item_type);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_compliance_expiry ON compliance_items(expiry_date) 
  WHERE status != 'expired' AND status != 'returned' AND status != 'renewed';

-- Contract indexes
CREATE INDEX IF NOT EXISTS idx_contracts_employee ON generated_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON generated_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON generated_contracts(contract_type);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_employee ON chat_messages(employee_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

-- Automation logs indexes
CREATE INDEX IF NOT EXISTS idx_automation_event ON automation_logs(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_employee ON automation_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_automation_created ON automation_logs(created_at DESC);

-- Policy indexes
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_country ON policies(country);

-- Vector similarity search index for policies (using IVFFlat)
-- This enables fast semantic search for RAG
CREATE INDEX IF NOT EXISTS idx_policies_embedding ON policies 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Urgent Compliance Alerts
-- Shows all items that need immediate attention
CREATE OR REPLACE VIEW urgent_compliance_alerts AS
SELECT 
  ci.id,
  ci.employee_id,
  e.full_name,
  e.email,
  e.country,
  e.role,
  ci.item_type,
  ci.item_name,
  ci.expiry_date,
  ci.status,
  CASE 
    WHEN ci.expiry_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN ci.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'URGENT'
    WHEN ci.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'WARNING'
    ELSE 'OK'
  END AS urgency_level,
  (ci.expiry_date - CURRENT_DATE) AS days_remaining
FROM compliance_items ci
JOIN employees e ON ci.employee_id = e.id
WHERE ci.status IN ('expiring_soon', 'urgent', 'overdue')
  AND ci.expiry_date IS NOT NULL
ORDER BY ci.expiry_date ASC;

-- View: Employee Dashboard Summary
-- Quick overview of each employee's key metrics
CREATE OR REPLACE VIEW employee_dashboard_summary AS
SELECT 
  e.id,
  e.full_name,
  e.email,
  e.role,
  e.country,
  e.department,
  e.leave_balance_days,
  e.last_leave_date,
  (CURRENT_DATE - e.last_leave_date) AS days_since_last_leave,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status IN ('urgent', 'expiring_soon', 'overdue')) AS urgent_compliance_items,
  COUNT(DISTINCT gc.id) FILTER (WHERE gc.status = 'pending_approval') AS pending_contracts
FROM employees e
LEFT JOIN compliance_items ci ON e.id = ci.employee_id
LEFT JOIN generated_contracts gc ON e.id = gc.employee_id
GROUP BY e.id;

-- View: Contract Generation Stats
-- Analytics on AI contract generation performance
CREATE OR REPLACE VIEW contract_generation_stats AS
SELECT 
  contract_type,
  COUNT(*) AS total_generated,
  AVG(generation_duration_ms) AS avg_generation_time_ms,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count
FROM generated_contracts
GROUP BY contract_type;

-- View: Automation ROI Metrics
-- Track time saved by automation
CREATE OR REPLACE VIEW automation_roi_metrics AS
SELECT 
  trigger_event,
  COUNT(*) AS event_count,
  AVG(total_duration_ms) AS avg_automation_time_ms,
  SUM(total_duration_ms) AS total_automation_time_ms,
  -- Assuming manual process would take 4 hours (14,400,000 ms) per new hire
  CASE 
    WHEN trigger_event = 'new_hire_onboarding' THEN 
      COUNT(*) * 14400000 - SUM(total_duration_ms)
    ELSE 0
  END AS estimated_time_saved_ms
FROM automation_logs
WHERE success = true
GROUP BY trigger_event
ORDER BY event_count DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Match policies using vector similarity (for RAG)
-- This enables semantic search of policies based on employee questions
CREATE OR REPLACE FUNCTION match_policies(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  country TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.category,
    p.country,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM policies p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Update compliance status automatically
-- Runs daily to update status based on expiry dates
CREATE OR REPLACE FUNCTION update_compliance_statuses()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update to URGENT if expiring in < 30 days
  UPDATE compliance_items
  SET status = 'urgent'
  WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND expiry_date > CURRENT_DATE
    AND status = 'active';
  
  -- Update to EXPIRING_SOON if expiring in 30-60 days
  UPDATE compliance_items
  SET status = 'expiring_soon'
  WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days'
    AND expiry_date > CURRENT_DATE + INTERVAL '30 days'
    AND status = 'active';
  
  -- Update to OVERDUE if past expiry
  UPDATE compliance_items
  SET status = 'overdue'
  WHERE expiry_date < CURRENT_DATE
    AND status != 'overdue';
END;
$$;

-- Function: Calculate leave balance for an employee
CREATE OR REPLACE FUNCTION calculate_leave_balance(
  employee_uuid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  annual_leave INTEGER;
  months_employed INTEGER;
  leave_accrued NUMERIC;
  leave_used INTEGER;
  balance INTEGER;
  emp_country TEXT;
BEGIN
  -- Get employee country
  SELECT country INTO emp_country FROM employees WHERE id = employee_uuid;
  
  -- Get annual leave entitlement based on country
  annual_leave := CASE emp_country
    WHEN 'SG' THEN 14
    WHEN 'UK' THEN 28
    WHEN 'US' THEN 15
    WHEN 'IN' THEN 18
    WHEN 'UAE' THEN 30
    ELSE 15
  END;
  
  -- Calculate months employed
  SELECT 
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date)) * 12 +
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date))
  INTO months_employed
  FROM employees
  WHERE id = employee_uuid;
  
  -- Calculate accrued leave (max = annual entitlement)
  leave_accrued := LEAST(annual_leave, (months_employed::NUMERIC / 12) * annual_leave);
  
  -- For demo purposes, assume some leave used (you'd track this in a separate table in production)
  -- For now, just return the balance from the employees table
  SELECT leave_balance_days INTO balance FROM employees WHERE id = employee_uuid;
  
  RETURN COALESCE(balance, 0);
END;
$$;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at on employees
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on policies
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on compliance_items
CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on generated_contracts
CREATE TRIGGER update_generated_contracts_updated_at
  BEFORE UPDATE ON generated_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on tables (uncomment if you want to enable security)
-- For hackathon demo, you can leave these commented out for easier development

-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_contracts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

-- Example RLS policy: Employees can only see their own data
-- CREATE POLICY "Employees can view own data"
--   ON employees
--   FOR SELECT
--   USING (auth.uid()::text = id::text);

-- Example RLS policy: HR admins can see everything
-- CREATE POLICY "HR admins full access"
--   ON employees
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM employees
--       WHERE id::text = auth.uid()::text
--       AND role IN ('Executive', 'Director')
--       AND department = 'HR'
--     )
--   );

-- ============================================================================
-- INITIAL CONFIGURATION
-- ============================================================================

-- Create a simple configuration table for system settings
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
  ('ai_models', '{"contract_generation": "gpt-4", "chatbot": "gpt-4", "embeddings": "text-embedding-3-small"}', 'AI models used for different features'),
  ('compliance_thresholds', '{"urgent_days": 30, "warning_days": 60}', 'Days before expiry to trigger alerts'),
  ('automation_enabled', '{"onboarding": true, "compliance_alerts": true, "leave_reminders": true}', 'Feature flags for automation'),
  ('country_settings', '{"SG": {"leave_days": 14}, "UK": {"leave_days": 28}, "US": {"leave_days": 15}, "IN": {"leave_days": 18}, "UAE": {"leave_days": 30}}', 'Country-specific configurations')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ HRFlow AI Database Schema Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ employees';
  RAISE NOTICE '  ✓ contract_templates';
  RAISE NOTICE '  ✓ generated_contracts';
  RAISE NOTICE '  ✓ policies';
  RAISE NOTICE '  ✓ compliance_items';
  RAISE NOTICE '  ✓ chat_messages';
  RAISE NOTICE '  ✓ automation_logs';
  RAISE NOTICE '  ✓ sample_conversations';
  RAISE NOTICE '  ✓ system_config';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  ✓ urgent_compliance_alerts';
  RAISE NOTICE '  ✓ employee_dashboard_summary';
  RAISE NOTICE '  ✓ contract_generation_stats';
  RAISE NOTICE '  ✓ automation_roi_metrics';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  ✓ match_policies() - Vector similarity search for RAG';
  RAISE NOTICE '  ✓ update_compliance_statuses() - Auto-update compliance';
  RAISE NOTICE '  ✓ calculate_leave_balance() - Dynamic leave calculation';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Step: Import your generated data using the import scripts!';
END $$;
