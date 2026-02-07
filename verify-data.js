/**
 * Verify Data Quality - Check for duplicates
 * 
 * Run this after generating data to ensure no duplicates exist
 * Usage: node verify-data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = './hr-data-export';

console.log('🔍 HRFlow AI - Data Quality Verification\n');

function checkDuplicates(filename, uniqueField) {
  const filepath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}\n`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const seen = new Set();
  const duplicates = [];
  
  data.forEach((record, index) => {
    const value = record[uniqueField];
    if (seen.has(value)) {
      duplicates.push({ index, value, record });
    } else {
      seen.add(value);
    }
  });
  
  console.log(`📄 ${filename}:`);
  console.log(`   Total records: ${data.length}`);
  console.log(`   Unique ${uniqueField}: ${seen.size}`);
  
  if (duplicates.length > 0) {
    console.log(`   ❌ DUPLICATES FOUND: ${duplicates.length}`);
    console.log(`   First few duplicates:`);
    duplicates.slice(0, 5).forEach(dup => {
      console.log(`      - ${dup.value} (at index ${dup.index})`);
    });
  } else {
    console.log(`   ✅ No duplicates`);
  }
  console.log('');
  
  return duplicates.length === 0;
}

// Check all files
let allGood = true;

allGood = checkDuplicates('employees.json', 'email') && allGood;
allGood = checkDuplicates('employees.json', 'id') && allGood;
allGood = checkDuplicates('contract_templates.json', 'id') && allGood;
allGood = checkDuplicates('policies.json', 'id') && allGood;
allGood = checkDuplicates('compliance_items.json', 'id') && allGood;
allGood = checkDuplicates('sample_conversations.json', 'id') && allGood;
allGood = checkDuplicates('automation_logs.json', 'id') && allGood;

console.log('═══════════════════════════════════════════════════════');
if (allGood) {
  console.log('✅ ALL CHECKS PASSED - Data is ready to import!\n');
} else {
  console.log('❌ DUPLICATES FOUND - Regenerate data before importing!\n');
  console.log('Run: npm run generate\n');
  process.exit(1);
}