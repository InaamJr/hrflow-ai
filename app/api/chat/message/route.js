/**
 * Next.js API Route: HR Chatbot
 * 
 * POST /api/chat/message
 * 
 * Body:
 * {
 *   employeeId: "uuid",
 *   question: "How much annual leave do I have?"
 * }
 * 
 * Returns: AI-generated answer with context and metadata
 */

const { processHRQuestion, getConversationHistory, provideFeedback } = require('../../../../lib/hr-chatbot-rag');

export const maxDuration = 30; // Allow up to 30 seconds for processing

// ============================================================================
// POST: Ask Question
// ============================================================================

export async function POST(request) {
  try {
    const { employeeId, question } = await request.json();
    
    // Validation
    if (!employeeId) {
      return Response.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    if (!question || question.trim().length === 0) {
      return Response.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    if (question.length > 500) {
      return Response.json(
        { error: 'Question too long (max 500 characters)' },
        { status: 400 }
      );
    }
    
    console.log(`💬 Chat request from employee ${employeeId}`);
    console.log(`   Question: "${question}"`);
    
    // Process question with RAG
    const result = await processHRQuestion(employeeId, question, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    
    if (!result.success) {
      return Response.json(
        {
          error: 'Failed to process question',
          details: result.error,
          trace: process.env.NODE_ENV === 'development' ? result.trace : undefined
        },
        { status: 500 }
      );
    }
    
    // Return response
    return Response.json({
      success: true,
      conversation_id: result.metadata.conversation_id,
      question: result.question,
      answer: result.answer,
      employee: result.employee,
      context: {
        policies_used: result.context.policies_used,
        policies: result.context.policies
      },
      metadata: {
        response_time_ms: result.metadata.response_time_ms,
        model: result.metadata.model,
        tokens_used: result.metadata.tokens_used,
        cost_estimate: result.metadata.cost_estimate
      }
    });
    
  } catch (error) {
    console.error('❌ Chat API error:', error);
    return Response.json(
      {
        error: error.message || 'Chat processing failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: Conversation History
// ============================================================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!employeeId) {
      return Response.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    const history = await getConversationHistory(employeeId, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      limit
    });
    
    return Response.json({
      success: true,
      employee_id: employeeId,
      conversations: history.map(msg => ({
        id: msg.id,
        question: msg.message,
        answer: msg.response,
        timestamp: msg.created_at,
        response_time_ms: msg.response_time_ms,
        helpful: msg.helpful,
        policies_used: msg.policies_referenced?.length || 0
      })),
      count: history.length
    });
    
  } catch (error) {
    console.error('❌ History API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT: Provide Feedback
// ============================================================================

export async function PUT(request) {
  try {
    const { messageId, helpful, comment } = await request.json();
    
    if (!messageId) {
      return Response.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    if (typeof helpful !== 'boolean') {
      return Response.json(
        { error: 'Helpful must be true or false' },
        { status: 400 }
      );
    }
    
    await provideFeedback(messageId, helpful, comment, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY
    });
    
    return Response.json({
      success: true,
      message: 'Feedback saved'
    });
    
  } catch (error) {
    console.error('❌ Feedback API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
