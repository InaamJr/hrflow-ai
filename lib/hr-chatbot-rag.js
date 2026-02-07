/**
 * HRFlow AI - HR Chatbot with RAG (Retrieval Augmented Generation)
 * 
 * Intelligent Q&A system using:
 * - Vector embeddings for semantic search
 * - GPT-4 for natural language understanding
 * - Employee context for personalized answers
 * 
 * Usage: POST /api/chat/message
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// ============================================================================
// RAG CONFIGURATION
// ============================================================================

const RAG_CONFIG = {
  embeddingModel: 'text-embedding-3-small',
  chatModel: 'gpt-4-turbo-preview',
  similarityThreshold: 0.5, // Min similarity score for relevant policies
  maxPolicies: 3, // Max number of policies to include in context
  maxTokens: 1000,
  temperature: 0.3 // Low temp for consistent, factual answers
};

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const SYSTEM_PROMPTS = {
  hr_assistant: `You are HRFlow AI's intelligent HR assistant. You help employees with HR-related questions using company policies and their personal employment data.

CRITICAL RULES:
1. Base answers ONLY on provided policies and employee data
2. Be specific and cite policy sections when relevant
3. Personalize answers using employee's country, role, and tenure
4. If information isn't in provided context, say "I don't have that information in our current policies"
5. For sensitive topics (termination, legal issues), suggest contacting HR directly
6. Be friendly, professional, and concise
7. Use the employee's name when appropriate
8. Always consider country-specific regulations

RESPONSE FORMAT:
- Direct answer first
- Supporting policy details if needed
- Action items if applicable
- Keep it conversational, not robotic`,

  policy_search: `You are analyzing an employee's question to extract key search terms for finding relevant HR policies.

Extract:
1. Main topic (leave, benefits, salary, compliance, etc.)
2. Specific keywords
3. Any country/location mentions
4. Any role-specific aspects

Return ONLY the search query, nothing else.`
};

// ============================================================================
// MAIN RAG FUNCTIONS
// ============================================================================

/**
 * Process employee question and generate answer using RAG
 */
async function processHRQuestion(employeeId, question, options = {}) {
  const {
    supabaseUrl = process.env.SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_ANON_KEY,
    openaiApiKey = process.env.OPENAI_API_KEY
  } = options;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  
  const startTime = Date.now();
  const trace = []; // Detailed execution trace
  
  try {
    console.log(`\n💬 Processing question from employee ${employeeId}`);
    console.log(`   Question: "${question}"\n`);
    
    // ========================================================================
    // STEP 1: Fetch Employee Context
    // ========================================================================
    
    const stepStart = Date.now();
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    
    if (employeeError || !employee) {
      throw new Error('Employee not found');
    }
    
    trace.push({
      step: 'fetch_employee',
      duration_ms: Date.now() - stepStart,
      employee: {
        id: employee.id,
        name: employee.full_name,
        role: employee.role,
        country: employee.country
      }
    });
    
    console.log(`✅ Employee context loaded: ${employee.full_name} (${employee.role}, ${employee.country})`);
    
    // ========================================================================
    // STEP 2: Generate Question Embedding
    // ========================================================================
    
    const embeddingStart = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: RAG_CONFIG.embeddingModel,
      input: question
    });
    
    const questionEmbedding = embeddingResponse.data[0].embedding;
    
    trace.push({
      step: 'generate_embedding',
      duration_ms: Date.now() - embeddingStart,
      model: RAG_CONFIG.embeddingModel,
      dimensions: questionEmbedding.length
    });
    
    console.log(`✅ Question embedding generated (${questionEmbedding.length} dimensions)`);
    
    // ========================================================================
    // STEP 3: Semantic Search for Relevant Policies
    // ========================================================================
    
    const searchStart = Date.now();
    const { data: relevantPolicies, error: searchError } = await supabase
      .rpc('match_policies', {
        query_embedding: questionEmbedding,
        match_threshold: RAG_CONFIG.similarityThreshold,
        match_count: RAG_CONFIG.maxPolicies
      });
    
    if (searchError) {
      console.error('Policy search error:', searchError);
      // Continue with empty policies rather than failing
    }
    
    trace.push({
      step: 'semantic_search',
      duration_ms: Date.now() - searchStart,
      policies_found: relevantPolicies?.length || 0,
      similarity_scores: relevantPolicies?.map(p => p.similarity) || []
    });
    
    console.log(`✅ Found ${relevantPolicies?.length || 0} relevant policies`);
    if (relevantPolicies && relevantPolicies.length > 0) {
      relevantPolicies.forEach((policy, i) => {
        console.log(`   ${i + 1}. ${policy.title} (${(policy.similarity * 100).toFixed(1)}% match)`);
      });
    }
    
    // ========================================================================
    // STEP 4: Build Context for GPT-4
    // ========================================================================
    
    const context = buildEmployeeContext(employee, relevantPolicies);
    
    console.log(`\n📋 Context prepared for GPT-4`);
    
    // ========================================================================
    // STEP 5: Generate Answer with GPT-4
    // ========================================================================
    
    const gptStart = Date.now();
    const completion = await openai.chat.completions.create({
      model: RAG_CONFIG.chatModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.hr_assistant },
        { role: 'user', content: `${context}\n\nEmployee Question: ${question}` }
      ],
      temperature: RAG_CONFIG.temperature,
      max_tokens: RAG_CONFIG.maxTokens
    });
    
    const answer = completion.choices[0].message.content;
    
    trace.push({
      step: 'generate_answer',
      duration_ms: Date.now() - gptStart,
      model: RAG_CONFIG.chatModel,
      tokens_used: completion.usage.total_tokens,
      prompt_tokens: completion.usage.prompt_tokens,
      completion_tokens: completion.usage.completion_tokens
    });
    
    console.log(`✅ Answer generated (${completion.usage.total_tokens} tokens)`);
    
    // ========================================================================
    // STEP 6: Save Conversation to Database
    // ========================================================================
    
    const saveStart = Date.now();
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        employee_id: employeeId,
        message: question,
        response: answer,
        context_used: {
          employee_data: {
            id: employee.id,
            name: employee.full_name,
            role: employee.role,
            country: employee.country,
            department: employee.department
          },
          policies: relevantPolicies?.map(p => ({
            id: p.id,
            title: p.title,
            similarity: p.similarity
          })) || []
        },
        policies_referenced: relevantPolicies?.map(p => p.id) || [],
        similarity_scores: relevantPolicies?.map(p => p.similarity) || [],
        response_time_ms: Date.now() - startTime,
        ai_model_used: RAG_CONFIG.chatModel
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Failed to save conversation:', saveError);
    }
    
    trace.push({
      step: 'save_conversation',
      duration_ms: Date.now() - saveStart,
      saved: !saveError
    });
    
    console.log(`✅ Conversation saved to database`);
    
    // ========================================================================
    // FINAL RESULT
    // ========================================================================
    
    const totalDuration = Date.now() - startTime;
    
    console.log(`\n⚡ Total response time: ${totalDuration}ms`);
    console.log(`📝 Answer preview: ${answer.substring(0, 100)}...\n`);
    
    return {
      success: true,
      question,
      answer,
      employee: {
        id: employee.id,
        name: employee.full_name,
        role: employee.role,
        country: employee.country
      },
      context: {
        policies_used: relevantPolicies?.length || 0,
        policies: relevantPolicies?.map(p => ({
          title: p.title,
          category: p.category,
          similarity: (p.similarity * 100).toFixed(1) + '%'
        })) || []
      },
      metadata: {
        conversation_id: savedMessage?.id,
        response_time_ms: totalDuration,
        model: RAG_CONFIG.chatModel,
        tokens_used: completion.usage.total_tokens,
        cost_estimate: estimateCost(completion.usage)
      },
      trace
    };
    
  } catch (error) {
    console.error('\n❌ Chat processing failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      trace
    };
  }
}

/**
 * Build rich context for GPT-4 using employee data and policies
 */
function buildEmployeeContext(employee, policies) {
  let context = `EMPLOYEE CONTEXT:\n`;
  context += `Name: ${employee.full_name}\n`;
  context += `Role: ${employee.role}\n`;
  context += `Department: ${employee.department}\n`;
  context += `Country: ${employee.country}\n`;
  context += `Start Date: ${employee.start_date}\n`;
  context += `Leave Balance: ${employee.leave_balance_days || 0} days\n`;
  
  if (employee.last_leave_date) {
    const daysSinceLeave = Math.floor((new Date() - new Date(employee.last_leave_date)) / (1000 * 60 * 60 * 24));
    context += `Last Leave: ${daysSinceLeave} days ago\n`;
  }
  
  if (employee.manager_id) {
    context += `Reports To: Manager (ID: ${employee.manager_id})\n`;
  }
  
  context += `\nRELEVANT COMPANY POLICIES:\n\n`;
  
  if (policies && policies.length > 0) {
    policies.forEach((policy, index) => {
      context += `${index + 1}. ${policy.title} (${policy.category})\n`;
      context += `${policy.content}\n\n`;
      context += `---\n\n`;
    });
  } else {
    context += `No specific policies found for this question. Use general HR knowledge and employee data to provide a helpful response.\n\n`;
  }
  
  return context;
}

/**
 * Estimate cost of API call
 */
function estimateCost(usage) {
  // GPT-4 Turbo pricing (as of Feb 2025)
  const inputCostPer1k = 0.01; // $0.01 per 1K input tokens
  const outputCostPer1k = 0.03; // $0.03 per 1K output tokens
  
  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1k;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1k;
  
  return (inputCost + outputCost).toFixed(4);
}

// ============================================================================
// CONVERSATION HISTORY
// ============================================================================

/**
 * Get conversation history for an employee
 */
async function getConversationHistory(employeeId, options = {}) {
  const {
    supabaseUrl = process.env.SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_ANON_KEY,
    limit = 10
  } = options;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
  
  return messages.reverse(); // Oldest first
}

/**
 * Provide feedback on a chat response
 */
async function provideFeedback(messageId, helpful, comment = null, options = {}) {
  const {
    supabaseUrl = process.env.SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_ANON_KEY
  } = options;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { error } = await supabase
    .from('chat_messages')
    .update({
      helpful,
      feedback_comment: comment
    })
    .eq('id', messageId);
  
  if (error) {
    throw new Error(`Failed to save feedback: ${error.message}`);
  }
  
  return { success: true };
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get chatbot analytics
 */
async function getChatAnalytics(options = {}) {
  const {
    supabaseUrl = process.env.SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_ANON_KEY,
    days = 30
  } = options;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get all messages in timeframe
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .gte('created_at', cutoffDate.toISOString());
  
  if (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
  
  // Calculate metrics
  const totalMessages = messages.length;
  const messagesWithFeedback = messages.filter(m => m.helpful !== null);
  const positiveMessages = messages.filter(m => m.helpful === true);
  
  const avgResponseTime = messages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / totalMessages;
  
  const topPolicies = {};
  messages.forEach(m => {
    if (m.policies_referenced) {
      m.policies_referenced.forEach(policyId => {
        topPolicies[policyId] = (topPolicies[policyId] || 0) + 1;
      });
    }
  });
  
  return {
    period_days: days,
    total_conversations: totalMessages,
    feedback: {
      total_with_feedback: messagesWithFeedback.length,
      helpful_count: positiveMessages.length,
      helpful_percentage: messagesWithFeedback.length > 0 
        ? ((positiveMessages.length / messagesWithFeedback.length) * 100).toFixed(1)
        : 0
    },
    performance: {
      avg_response_time_ms: Math.round(avgResponseTime),
      avg_response_time_seconds: (avgResponseTime / 1000).toFixed(2)
    },
    top_policies: Object.entries(topPolicies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ policy_id: id, references: count }))
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  processHRQuestion,
  getConversationHistory,
  provideFeedback,
  getChatAnalytics,
  RAG_CONFIG
};
