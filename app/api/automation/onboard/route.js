/**
 * Next.js API Route: Invisible Onboarding
 * 
 * POST /api/automation/onboard
 * 
 * Body:
 * {
 *   fullName: "Sarah Chen",
 *   email: "sarah.chen@example.com",
 *   role: "Senior Software Engineer",
 *   department: "Engineering",
 *   country: "SG",
 *   salaryUSD: 120000,
 *   equityShares: 15000,
 *   startDate: "2025-03-01",
 *   managerId: "uuid" (optional)
 * }
 * 
 * Returns: Complete onboarding results with timeline and deliverables
 */

import { executeInvisibleOnboarding } from '../../../../lib/invisible-onboarding';

export const maxDuration = 60; // Allow up to 60 seconds for onboarding

export async function POST(request) {
  try {
    const candidateData = await request.json();
    
    // Validation
    const requiredFields = ['fullName', 'email', 'role', 'department', 'country', 'salaryUSD', 'startDate'];
    const missingFields = requiredFields.filter(field => !candidateData[field]);
    
    if (missingFields.length > 0) {
      return Response.json(
        {
          error: 'Missing required fields',
          missing: missingFields
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateData.email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate country
    const validCountries = ['SG', 'UK', 'US', 'IN', 'UAE'];
    if (!validCountries.includes(candidateData.country)) {
      return Response.json(
        {
          error: 'Invalid country',
          valid_countries: validCountries
        },
        { status: 400 }
      );
    }
    
    // Execute invisible onboarding
    console.log('🚀 Starting invisible onboarding...');
    
    const result = await executeInvisibleOnboarding(candidateData, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      sendEmails: process.env.NODE_ENV === 'production', // Only in production
      createCalendarEvents: process.env.NODE_ENV === 'production',
      provisionAccess: process.env.NODE_ENV === 'production'
    });
    
    if (!result.success) {
      return Response.json(
        {
          error: 'Onboarding failed',
          details: result.error,
          timeline: result.timeline,
          errors: result.errors
        },
        { status: 500 }
      );
    }
    
    // Prepare response with contracts as base64
    const response = {
      success: true,
      message: `Onboarding completed for ${candidateData.fullName} in ${result.automation.total_duration_seconds}s`,
      employee: result.employee,
      automation: {
        total_duration_ms: result.automation.total_duration_ms,
        total_duration_seconds: result.automation.total_duration_seconds,
        steps_completed: result.automation.steps_completed,
        timeline: result.automation.timeline.map(step => ({
          step: step.step,
          duration_ms: step.duration_ms,
          timestamp: step.timestamp,
          details: step.details || step.contracts_count || step.events_count
        }))
      },
      contracts: result.deliverables.contracts.map(contract => ({
        type: contract.type,
        file_size_kb: contract.file_size_kb,
        download: {
          buffer: contract.buffer.toString('base64'),
          filename: `${candidateData.fullName.replace(/\s+/g, '_')}_${contract.type}.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      })),
      compliance: {
        items_count: result.deliverables.compliance_items.length,
        items: result.deliverables.compliance_items.map(item => ({
          type: item.item_type,
          name: item.item_name,
          expiry_date: item.expiry_date
        }))
      },
      calendar: {
        events_count: result.deliverables.calendar_events.length,
        events: result.deliverables.calendar_events
      },
      metrics: result.metrics,
      errors: result.errors
    };
    
    return Response.json(response);
    
  } catch (error) {
    console.error('❌ Onboarding API error:', error);
    return Response.json(
      {
        error: error.message || 'Onboarding failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request) {
  return Response.json({
    service: 'invisible-onboarding',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      POST: '/api/automation/onboard'
    },
    required_env: [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ]
  });
}
