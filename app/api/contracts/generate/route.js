/**
 * Next.js API Route: Generate Employment Contract
 * 
 * POST /api/contracts/generate
 * 
 * Body:
 * {
 *   employeeId: "uuid",
 *   contractType: "employment" | "nda" | "equity"
 * }
 * 
 * Returns: Contract buffer for download or preview
 */

import { createClient } from '@supabase/supabase-js';
import { generateContract } from '@/lib/contract-generator';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { employeeId, contractType = 'employment' } = await request.json();
    
    if (!employeeId) {
      return Response.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch employee data from Supabase
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    
    if (fetchError || !employee) {
      return Response.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Prepare employee data for contract generation
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
    const result = await generateContract(employeeData, contractType, {
      openaiApiKey: process.env.OPENAI_API_KEY,
      returnBuffer: true
    });
    
    // Save to database
    const { data: savedContract, error: saveError } = await supabase
      .from('generated_contracts')
      .insert({
        employee_id: employeeId,
        contract_type: contractType,
        generated_content: result.content,
        status: 'draft',
        generation_duration_ms: result.metadata.generationTimeMs,
        ai_model_used: result.metadata.model
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Failed to save contract:', saveError);
      // Continue anyway - we can still return the contract
    }
    
    // Return contract metadata and download link
    return Response.json({
      success: true,
      contract: {
        id: savedContract?.id,
        type: contractType,
        employee: result.employee,
        generationTime: result.metadata.generationTimeMs,
        fileSize: result.metadata.fileSize,
        timestamp: result.metadata.timestamp
      },
      // Base64 encode buffer for download
      file: {
        buffer: result.buffer.toString('base64'),
        filename: `${employee.full_name.replace(/\s+/g, '_')}_${contractType}_contract.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });
    
  } catch (error) {
    console.error('Contract generation error:', error);
    return Response.json(
      { error: error.message || 'Contract generation failed' },
      { status: 500 }
    );
  }
}
