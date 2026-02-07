/**
 * Test Contract Generation
 * 
 * Demonstrates generating contracts for employees from Supabase
 * 
 * Usage: node test-contract-generation.js
 */

const { createClient } = require('@supabase/supabase-js');
const { generateContract, generateContractsForEmployee } = require('../../lib/contract-generator');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
  console.error('❌ ERROR: Please set environment variables');
  console.error('   SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create output directory
const OUTPUT_DIR = './data/generated-contracts';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testSingleContract() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 1: Generate Single Employment Contract');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Fetch a random employee
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .limit(1);
  
  if (error || !employees || employees.length === 0) {
    console.error('❌ Failed to fetch employee:', error);
    return;
  }
  
  const employee = employees[0];
  
  console.log(`📋 Employee: ${employee.full_name}`);
  console.log(`   Role: ${employee.role}`);
  console.log(`   Country: ${employee.country}`);
  console.log(`   Salary: $${employee.salary_usd.toLocaleString()}`);
  console.log('');
  
  const employeeData = {
    id: employee.id,
    fullName: employee.full_name,
    role: employee.role,
    department: employee.department,
    country: employee.country,
    salaryUSD: employee.salary_usd,
    equityShares: employee.equity_shares,
    startDate: employee.start_date
  };
  
  // Generate contract
  const filename = path.join(OUTPUT_DIR, `${employee.full_name.replace(/\s+/g, '_')}_employment.docx`);
  
  const result = await generateContract(employeeData, 'employment', {
    openaiApiKey: OPENAI_API_KEY,
    outputPath: filename
  });
  
  console.log('\n📊 Results:');
  console.log(`   ✅ Generation time: ${result.metadata.generationTimeMs}ms`);
  console.log(`   ✅ File size: ${(result.metadata.fileSize / 1024).toFixed(1)} KB`);
  console.log(`   ✅ Saved to: ${filename}`);
  console.log('');
  
  // Show preview of content
  console.log('📄 Content Preview (first 500 chars):');
  console.log('─'.repeat(60));
  console.log(result.content.substring(0, 500) + '...');
  console.log('─'.repeat(60));
  console.log('');
  
  return result;
}

async function testMultiJurisdiction() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST 2: Multi-Jurisdiction Contract Generation');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Fetch one employee from each country
  const countries = ['SG', 'UK', 'US', 'IN', 'UAE'];
  const results = [];
  
  for (const country of countries) {
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('country', country)
      .limit(1);
    
    if (employees && employees.length > 0) {
      const employee = employees[0];
      
      console.log(`🌍 ${country}: ${employee.full_name} (${employee.role})`);
      
      const employeeData = {
        id: employee.id,
        fullName: employee.full_name,
        role: employee.role,
        department: employee.department,
        country: employee.country,
        salaryUSD: employee.salary_usd,
        equityShares: employee.equity_shares,
        startDate: employee.start_date
      };
      
      const filename = path.join(OUTPUT_DIR, `${country}_${employee.full_name.replace(/\s+/g, '_')}_employment.docx`);
      
      const result = await generateContract(employeeData, 'employment', {
        openaiApiKey: OPENAI_API_KEY,
        outputPath: filename
      });
      
      console.log(`   Generated in ${result.metadata.generationTimeMs}ms\n`);
      results.push(result);
    }
  }
  
  console.log('📊 Summary:');
  console.log(`   Total contracts: ${results.length}`);
  console.log(`   Avg generation time: ${Math.round(results.reduce((sum, r) => sum + r.metadata.generationTimeMs, 0) / results.length)}ms`);
  console.log(`   Total size: ${(results.reduce((sum, r) => sum + r.metadata.fileSize, 0) / 1024).toFixed(1)} KB`);
  console.log('');
  
  return results;
}

async function testFullOnboarding() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST 3: Complete Onboarding Package (All Contracts)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Fetch an employee with equity
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .gt('equity_shares', 0)
    .limit(1);
  
  if (!employees || employees.length === 0) {
    console.log('⚠️  No employees with equity found');
    return;
  }
  
  const employee = employees[0];
  
  console.log(`👤 New Hire: ${employee.full_name}`);
  console.log(`   Role: ${employee.role}`);
  console.log(`   Equity: ${employee.equity_shares.toLocaleString()} shares`);
  console.log('');
  
  const employeeData = {
    id: employee.id,
    fullName: employee.full_name,
    role: employee.role,
    department: employee.department,
    country: employee.country,
    salaryUSD: employee.salary_usd,
    equityShares: employee.equity_shares,
    startDate: employee.start_date
  };
  
  const startTime = Date.now();
  const result = await generateContractsForEmployee(employeeData, {
    openaiApiKey: OPENAI_API_KEY
  });
  const totalTime = Date.now() - startTime;
  
  // Save all contracts
  for (const contract of result.contracts) {
    const filename = path.join(
      OUTPUT_DIR,
      `${employee.full_name.replace(/\s+/g, '_')}_${contract.contractType}.docx`
    );
    fs.writeFileSync(filename, contract.buffer);
    console.log(`   ✅ ${contract.contractType} contract → ${filename}`);
  }
  
  console.log('');
  console.log('📊 Onboarding Package Complete:');
  console.log(`   Contracts generated: ${result.contracts.length}`);
  console.log(`   Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
  console.log(`   Time savings vs manual: ~3.5 hours`);
  console.log('');
  
  return result;
}

async function testSaveToDatabase() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TEST 4: Generate & Save to Supabase');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .limit(1);
  
  const employee = employees[0];
  
  const employeeData = {
    id: employee.id,
    fullName: employee.full_name,
    role: employee.role,
    department: employee.department,
    country: employee.country,
    salaryUSD: employee.salary_usd,
    equityShares: employee.equity_shares,
    startDate: employee.start_date
  };
  
  console.log(`📝 Generating contract for ${employee.full_name}...`);
  
  const result = await generateContract(employeeData, 'employment', {
    openaiApiKey: OPENAI_API_KEY
  });
  
  // Save to database
  const { data: savedContract, error } = await supabase
    .from('generated_contracts')
    .insert({
      employee_id: employee.id,
      contract_type: 'employment',
      generated_content: result.content,
      status: 'draft',
      generation_duration_ms: result.metadata.generationTimeMs,
      ai_model_used: result.metadata.model
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to save:', error);
  } else {
    console.log('✅ Saved to database');
    console.log(`   Contract ID: ${savedContract.id}`);
    console.log(`   Status: ${savedContract.status}`);
    console.log('');
  }
  
  return savedContract;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 HRFlow AI - Contract Generation Test Suite\n');
  
  try {
    // Run all tests
    await testSingleContract();
    await testMultiJurisdiction();
    await testFullOnboarding();
    await testSaveToDatabase();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ ALL TESTS COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`📁 Generated contracts saved to: ${OUTPUT_DIR}/`);
    console.log('\n🎯 Ready for your hackathon demo!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
