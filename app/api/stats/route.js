/**
 * Dashboard Stats API
 */

const { createClient } = require('@supabase/supabase-js');

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Fetch total employees
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    // Fetch total contracts
    const { count: contractCount } = await supabase
      .from('generated_contracts')
      .select('*', { count: 'exact', head: true });

    // Fetch total chat messages
    const { count: chatCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    // Calculate time saved (4 hours per employee onboarded)
    const timeSavedHours = Math.round(employeeCount * 4);

    return Response.json({
      success: true,
      stats: {
        total_employees: employeeCount || 0,
        total_contracts: contractCount || 0,
        total_chats: chatCount || 0,
        time_saved_hours: timeSavedHours || 0
      }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        stats: {
          total_employees: 0,
          total_contracts: 0,
          total_chats: 0,
          time_saved_hours: 0
        }
      },
      { status: 500 }
    );
  }
}
