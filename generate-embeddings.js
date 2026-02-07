/**
 * HRFlow AI - Generate Embeddings for Policies
 * 
 * Generates vector embeddings for all policy documents using OpenAI API
 * This enables semantic search for the RAG-powered chatbot
 * 
 * Run AFTER importing data to Supabase
 * 
 * Usage: node generate-embeddings.js
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

// Embedding model
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, cost-effective
const BATCH_SIZE = 100; // Process in batches to avoid rate limits

// ============================================================================
// VALIDATION
// ============================================================================

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ ERROR: Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
  console.error('❌ ERROR: Please set OPENAI_API_KEY environment variable');
  console.error('');
  console.error('Get your API key from: https://platform.openai.com/api-keys');
  console.error('Then set it: export OPENAI_API_KEY="sk-..."');
  process.exit(1);
}

// ============================================================================
// INITIALIZE CLIENTS
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

console.log('🚀 HRFlow AI - Embedding Generation\n');
console.log(`📡 Supabase: ${SUPABASE_URL}`);
console.log(`🤖 OpenAI Model: ${EMBEDDING_MODEL}\n`);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding: ${error.message}`);
    throw error;
  }
}

function prepareTextForEmbedding(policy) {
  // Combine title and content for better semantic search
  // This gives the embedding model more context
  return `${policy.title}\n\nCategory: ${policy.category}\n\n${policy.content}`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN PROCESS
// ============================================================================

async function generateAllEmbeddings() {
  const startTime = Date.now();
  
  try {
    // ========================================================================
    // STEP 1: Fetch all policies without embeddings
    // ========================================================================
    
    console.log('📥 Fetching policies from database...');
    
    const { data: policies, error: fetchError } = await supabase
      .from('policies')
      .select('*')
      .is('embedding', null); // Only get policies without embeddings
    
    if (fetchError) {
      throw new Error(`Failed to fetch policies: ${fetchError.message}`);
    }
    
    if (!policies || policies.length === 0) {
      console.log('✅ All policies already have embeddings!\n');
      
      // Show some stats
      const { data: allPolicies } = await supabase
        .from('policies')
        .select('*');
      
      console.log(`📊 Total policies in database: ${allPolicies?.length || 0}`);
      console.log('   All have embeddings generated.\n');
      return;
    }
    
    console.log(`✅ Found ${policies.length} policies needing embeddings\n`);
    
    // ========================================================================
    // STEP 2: Generate embeddings
    // ========================================================================
    
    console.log('🔄 Generating embeddings...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let totalTokens = 0;
    
    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const policyNum = i + 1;
      
      process.stdout.write(`  [${policyNum}/${policies.length}] ${policy.title}... `);
      
      try {
        // Prepare text
        const text = prepareTextForEmbedding(policy);
        
        // Generate embedding
        const embedding = await generateEmbedding(text);
        
        // Update database
        const { error: updateError } = await supabase
          .from('policies')
          .update({ embedding })
          .eq('id', policy.id);
        
        if (updateError) {
          throw new Error(updateError.message);
        }
        
        console.log('✅');
        successCount++;
        
        // Estimate tokens (rough estimate: 1 token ≈ 4 characters)
        totalTokens += Math.ceil(text.length / 4);
        
        // Rate limiting: OpenAI has limits on requests per minute
        // Add small delay between requests
        if (i < policies.length - 1) {
          await sleep(200); // 200ms delay = max 5 requests/second
        }
        
      } catch (error) {
        console.log('❌');
        console.error(`    Error: ${error.message}`);
        errorCount++;
        
        // If rate limited, wait longer
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log('    ⏳ Rate limited. Waiting 60 seconds...');
          await sleep(60000);
        }
      }
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ EMBEDDING GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`  Total tokens (estimated): ${totalTokens.toLocaleString()}`);
    console.log(`  Time taken: ${duration} seconds\n`);
    
    // Cost estimation (text-embedding-3-small: $0.02 per 1M tokens)
    const estimatedCost = (totalTokens / 1000000) * 0.02;
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}\n`);
    
    // ========================================================================
    // VERIFICATION
    // ========================================================================
    
    console.log('🔍 Verifying embeddings...\n');
    
    const { data: verifyPolicies, error: verifyError } = await supabase
      .from('policies')
      .select('id, title, embedding')
      .not('embedding', 'is', null)
      .limit(3);
    
    if (verifyError) {
      console.error(`⚠️  Verification failed: ${verifyError.message}\n`);
    } else {
      console.log(`✅ Verified ${verifyPolicies.length} sample embeddings:`);
      verifyPolicies.forEach(policy => {
        const embeddingLength = policy.embedding?.length || 0;
        console.log(`  - ${policy.title}: ${embeddingLength} dimensions`);
      });
      console.log('');
    }
    
    // ========================================================================
    // TEST SEMANTIC SEARCH
    // ========================================================================
    
    console.log('🧪 Testing semantic search...\n');
    
    try {
      // Generate embedding for a test query
      const testQuery = "How much annual leave do I have?";
      console.log(`  Query: "${testQuery}"`);
      
      const queryEmbedding = await generateEmbedding(testQuery);
      
      // Use the match_policies function
      const { data: matches, error: matchError } = await supabase
        .rpc('match_policies', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 3
        });
      
      if (matchError) {
        console.error(`  ⚠️  Search failed: ${matchError.message}\n`);
      } else if (matches && matches.length > 0) {
        console.log(`  ✅ Found ${matches.length} relevant policies:\n`);
        matches.forEach((match, i) => {
          console.log(`    ${i + 1}. ${match.title} (similarity: ${(match.similarity * 100).toFixed(1)}%)`);
          console.log(`       Category: ${match.category}`);
        });
        console.log('');
      } else {
        console.log('  ℹ️  No matches found (this might indicate an issue)\n');
      }
      
    } catch (error) {
      console.error(`  ⚠️  Test failed: ${error.message}\n`);
    }
    
    console.log('✅ All done! Your RAG system is ready.\n');
    console.log('🎯 Next steps:');
    console.log('  1. Build your HR chatbot API');
    console.log('  2. Use match_policies() function for semantic search');
    console.log('  3. Test with various employee questions\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// REGENERATE ALL EMBEDDINGS (use with caution)
// ============================================================================

async function regenerateAllEmbeddings() {
  console.log('⚠️  This will regenerate embeddings for ALL policies.\n');
  
  // Clear existing embeddings
  console.log('🗑️  Clearing existing embeddings...');
  const { error: clearError } = await supabase
    .from('policies')
    .update({ embedding: null })
    .not('id', 'is', null);
  
  if (clearError) {
    console.error(`❌ Failed to clear embeddings: ${clearError.message}`);
    process.exit(1);
  }
  
  console.log('✅ Cleared. Starting generation...\n');
  await generateAllEmbeddings();
}

// ============================================================================
// RUN
// ============================================================================

const args = process.argv.slice(2);

if (args.includes('--regenerate')) {
  regenerateAllEmbeddings();
} else {
  generateAllEmbeddings();
}
