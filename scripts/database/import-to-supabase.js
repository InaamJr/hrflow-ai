/**
 * HRFlow AI - Supabase Data Import Script
 * 
 * Imports all generated JSON data into Supabase tables
 * Run AFTER creating the schema with supabase-schema.sql
 * 
 * Usage: node import-to-supabase.js
 */

require('dotenv').config();


const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Data directory
const DATA_DIR = './data/hr-data-export';

// Batch size for inserts (Supabase handles up to 1000 rows well)
const BATCH_SIZE = 500;

// ============================================================================
// VALIDATION
// ============================================================================

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ ERROR: Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  console.error('');
  console.error('Set them in your terminal:');
  console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('  export SUPABASE_ANON_KEY="your-anon-key"');
  console.error('');
  console.error('Or create a .env file with these values');
  process.exit(1);
}

// ============================================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 HRFlow AI - Supabase Data Import\n');
console.log(`📡 Connecting to: ${SUPABASE_URL}\n`);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  const data = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(data);
}

async function insertInBatches(tableName, data, batchSize = BATCH_SIZE) {
  console.log(`📥 Importing ${data.length} records into ${tableName}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Split into batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(data.length / batchSize);
    
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} records)... `);
    
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.log('❌ ERROR');
        console.error(`  Error details: ${error.message}`);
        errorCount += batch.length;
        
        // Try inserting one by one to identify problematic records
        if (batch.length > 1) {
          console.log(`  Attempting individual inserts...`);
          for (const record of batch) {
            const { error: singleError } = await supabase
              .from(tableName)
              .insert([record]);
            
            if (singleError) {
              console.error(`  Failed record: ${JSON.stringify(record).substring(0, 100)}...`);
              console.error(`  Error: ${singleError.message}`);
            } else {
              successCount++;
            }
          }
        }
      } else {
        console.log('✅');
        successCount += batch.length;
      }
    } catch (err) {
      console.log('❌ EXCEPTION');
      console.error(`  Exception: ${err.message}`);
      errorCount += batch.length;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ ${tableName}: ${successCount} successful, ${errorCount} failed\n`);
  return { successCount, errorCount };
}

async function clearTable(tableName) {
  console.log(`🗑️  Clearing ${tableName}...`);
  
  // First, get count of existing records
  const { count: existingCount } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  if (existingCount === 0) {
    console.log(`   ✅ Already empty\n`);
    return;
  }
  
  console.log(`   Found ${existingCount} records to delete`);
  
  try {
    // Fetch all IDs first
    const { data: records, error: fetchError } = await supabase
      .from(tableName)
      .select('id');
    
    if (fetchError) {
      console.log(`   ⚠️  Could not fetch records: ${fetchError.message}\n`);
      return;
    }
    
    if (!records || records.length === 0) {
      console.log(`   ✅ Already empty\n`);
      return;
    }
    
    // Delete in batches to avoid timeouts
    const batchSize = 500;
    let deleted = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const ids = batch.map(r => r.id);
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      
      if (!deleteError) {
        deleted += ids.length;
      }
      
      process.stdout.write(`   Deleting... ${deleted}/${records.length}\r`);
      await sleep(50); // Small delay to avoid rate limits
    }
    
    console.log(`   ✅ Deleted ${deleted} records\n`);
    
  } catch (err) {
    console.log(`   ⚠️  Exception: ${err.message}\n`);
  }
}

// ============================================================================
// MAIN IMPORT PROCESS
// ============================================================================

async function importData() {
  const startTime = Date.now();
  const results = {};
  
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('employees').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log('✅ Database connection successful\n');
    
    // ========================================================================
    // CLEAR EXISTING DATA (to avoid duplicate key errors)
    // ========================================================================
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('CLEARING EXISTING DATA');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Clear in reverse dependency order
    await clearTable('chat_messages');
    await clearTable('automation_logs');
    await clearTable('generated_contracts');
    await clearTable('compliance_items');
    await clearTable('sample_conversations');
    await clearTable('policies');
    await clearTable('contract_templates');
    await clearTable('employees');
    
    // ========================================================================
    // IMPORT ORDER (respects foreign key dependencies)
    // ========================================================================
    
    // 1. Employees (special handling for self-referencing manager_id)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 1: Importing Employees');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const employees = loadJSON('employees.json');
    
    // FIRST PASS: Insert employees WITHOUT manager_id to avoid foreign key issues
    console.log('📝 Pass 1: Inserting employees without manager references...\n');
    const employeesWithoutManagers = employees.map(emp => {
      const { manager_id, ...rest } = emp;
      return rest;
    });
    
    const insertResult = await insertInBatches('employees', employeesWithoutManagers);
    
    // SECOND PASS: Update manager_id for employees who have managers
    console.log('\n📝 Pass 2: Setting up manager relationships...\n');
    const employeesWithManagers = employees.filter(emp => emp.manager_id);
    
    console.log(`  Updating ${employeesWithManagers.length} employees with manager relationships...`);
    
    let managerUpdateSuccess = 0;
    let managerUpdateFailed = 0;
    
    // Update in batches
    for (let i = 0; i < employeesWithManagers.length; i += BATCH_SIZE) {
      const batch = employeesWithManagers.slice(i, i + BATCH_SIZE);
      
      for (const emp of batch) {
        const { error } = await supabase
          .from('employees')
          .update({ manager_id: emp.manager_id })
          .eq('id', emp.id);
        
        if (error) {
          managerUpdateFailed++;
        } else {
          managerUpdateSuccess++;
        }
      }
      
      // Progress indicator
      if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= employeesWithManagers.length) {
        process.stdout.write(`  Updated ${Math.min(i + BATCH_SIZE, employeesWithManagers.length)}/${employeesWithManagers.length}...\r`);
      }
    }
    
    console.log(`\n  ✅ Manager relationships: ${managerUpdateSuccess} updated, ${managerUpdateFailed} failed\n`);
    
    results.employees = {
      successCount: insertResult.successCount,
      errorCount: insertResult.errorCount,
      managerUpdates: managerUpdateSuccess
    };
    
    // 2. Contract Templates (no dependencies)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 2: Importing Contract Templates');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const templates = loadJSON('contract_templates.json');
    results.contract_templates = await insertInBatches('contract_templates', templates);
    
    // 3. Policies (no dependencies)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 3: Importing Policies');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const policies = loadJSON('policies.json');
    // Note: Embeddings will be generated separately via API
    results.policies = await insertInBatches('policies', policies);
    
    // 4. Compliance Items (depends on employees)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 4: Importing Compliance Items');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const complianceItems = loadJSON('compliance_items.json');
    results.compliance_items = await insertInBatches('compliance_items', complianceItems);
    
    // 5. Sample Conversations (no dependencies)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 5: Importing Sample Conversations');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const conversations = loadJSON('sample_conversations.json');
    results.sample_conversations = await insertInBatches('sample_conversations', conversations);
    
    // 6. Automation Logs (depends on employees)
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 6: Importing Automation Logs');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const automationLogs = loadJSON('automation_logs.json');
    results.automation_logs = await insertInBatches('automation_logs', automationLogs);
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ IMPORT COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    let totalSuccess = 0;
    let totalFailed = 0;
    
    Object.entries(results).forEach(([table, result]) => {
      if (table === 'employees') {
        console.log(`  ${table}: ${result.successCount} imported, ${result.errorCount} failed, ${result.managerUpdates} manager links`);
      } else {
        console.log(`  ${table}: ${result.successCount} imported, ${result.errorCount} failed`);
      }
      totalSuccess += result.successCount;
      totalFailed += result.errorCount;
    });
    
    console.log('');
    console.log(`Total: ${totalSuccess} records imported successfully`);
    if (totalFailed > 0) {
      console.log(`⚠️  ${totalFailed} records failed to import`);
    }
    console.log(`⏱️  Time taken: ${duration} seconds\n`);
    
    // ========================================================================
    // POST-IMPORT TASKS
    // ========================================================================
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('POST-IMPORT TASKS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 Recommended next steps:');
    console.log('  1. Generate embeddings for policies (see generate-embeddings.js)');
    console.log('  2. Verify data integrity with sample queries');
    console.log('  3. Test the urgent_compliance_alerts view');
    console.log('  4. Run update_compliance_statuses() function');
    console.log('');
    
    // ========================================================================
    // VERIFICATION QUERIES
    // ========================================================================
    
    console.log('🔍 Running verification queries...\n');
    
    // Count records
    const tables = ['employees', 'contract_templates', 'policies', 'compliance_items', 'sample_conversations', 'automation_logs'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ${table}: ${count} records`);
      }
    }
    
    console.log('');
    
    // Check urgent compliance alerts
    console.log('⚠️  Checking urgent compliance alerts...');
    const { data: urgentAlerts, error: alertError } = await supabase
      .from('urgent_compliance_alerts')
      .select('*')
      .limit(5);
    
    if (!alertError && urgentAlerts) {
      console.log(`  Found ${urgentAlerts.length} urgent alerts (showing first 5)`);
      urgentAlerts.forEach(alert => {
        console.log(`    - ${alert.full_name}: ${alert.item_name} (${alert.days_remaining} days)`);
      });
    }
    
    console.log('\n✅ All done! Your database is ready for development.\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// ALTERNATIVE: Clear all data before import (use with caution!)
// ============================================================================

async function clearAllData() {
  console.log('⚠️  WARNING: This will delete ALL existing data!\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Type "DELETE ALL DATA" to confirm: ', async (answer) => {
    readline.close();
    
    if (answer === 'DELETE ALL DATA') {
      console.log('\n🗑️  Clearing all tables...\n');
      
      // Clear in reverse dependency order
      await clearTable('automation_logs');
      await clearTable('chat_messages');
      await clearTable('generated_contracts');
      await clearTable('compliance_items');
      await clearTable('sample_conversations');
      await clearTable('policies');
      await clearTable('contract_templates');
      await clearTable('employees');
      
      console.log('✅ All data cleared. Running import...\n');
      await importData();
    } else {
      console.log('\n❌ Cancelled. No data was deleted.\n');
      await importData();
    }
  });
}

// ============================================================================
// RUN IMPORT
// ============================================================================

// Check command line argument
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearAllData();
} else {
  importData();
}