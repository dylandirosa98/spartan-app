import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tasks/all?companyId=xxx&salesRep=xxx
 * Fetch all tasks for a company (for calendar view)
 * If salesRep is provided, only returns tasks for leads assigned to that sales rep
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const salesRep = searchParams.get('salesRep');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get company configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Decrypt API key
    const decryptedApiKey = decrypt(company.twenty_api_key);

    // Create Twenty CRM client
    const twentyClient = new TwentyCRMClient(
      company.twenty_api_url,
      decryptedApiKey
    );

    // Query all taskTargets with their associated tasks and leads
    const query = `
      query GetAllTasks {
        taskTargets(orderBy: { createdAt: DescNullsLast }) {
          edges {
            node {
              id
              task {
                id
                title
                bodyV2 {
                  markdown
                }
                status
                dueAt
                createdAt
                updatedAt
                assignee {
                  id
                  name {
                    firstName
                    lastName
                  }
                }
              }
              lead {
                id
                name
                salesRep
              }
            }
          }
        }
      }
    `;

    const data = await (twentyClient as any).request(query);

    console.log('[Tasks All API] Fetched all tasks');

    // Transform the data to include lead information
    let tasks = data.taskTargets?.edges?.map((edge: any) => ({
      ...edge.node.task,
      body: edge.node.task.bodyV2?.markdown || null,
      leadId: edge.node.lead?.id || null,
      leadName: edge.node.lead?.name || null,
      leadSalesRep: edge.node.lead?.salesRep || null,
    })) || [];

    // Filter by sales rep if provided
    if (salesRep) {
      tasks = tasks.filter((task: any) => task.leadSalesRep === salesRep);
      console.log(`[Tasks All API] Filtered to ${tasks.length} tasks for sales rep: ${salesRep}`);
    }

    return NextResponse.json({
      tasks: tasks,
    });
  } catch (error) {
    console.error('[Tasks All API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
