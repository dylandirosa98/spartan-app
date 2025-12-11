import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tasks/pm?companyId=xxx&projectManager=xxx
 * Fetch tasks for a project manager
 * Only returns tasks for leads assigned to the specified project manager
 * Filters to only show tasks where install='YES' OR pmTask='YES'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const projectManager = searchParams.get('projectManager');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!projectManager) {
      return NextResponse.json(
        { error: 'projectManager is required' },
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

    // Step 1: Query ALL leads (no filter support for projectManager in GraphQL)
    const leadsQuery = `
      query GetAllLeads {
        leads {
          edges {
            node {
              id
              name
              city
              adress
              salesRep
              canvasser
              officeManager
              projectManager
            }
          }
        }
      }
    `;

    console.log('[PM Tasks API] Fetching all leads...');

    const leadsData = await (twentyClient as any).request(leadsQuery);

    // Filter leads by projectManager in JavaScript (case-insensitive)
    const allLeads = leadsData.leads?.edges?.map((edge: any) => edge.node) || [];
    const leads = allLeads.filter((lead: any) =>
      lead.projectManager?.toLowerCase() === projectManager.toLowerCase()
    );

    console.log(`[PM Tasks API] Total leads: ${allLeads.length}, Matching PM "${projectManager}": ${leads.length}`);

    if (leads.length === 0) {
      console.log('[PM Tasks API] No leads found for this project manager');
      return NextResponse.json({ tasks: [] });
    }

    // Step 2: For each lead, fetch its tasks via taskTargets
    const tasksQuery = `
      query GetTasksForLead($leadId: UUID!) {
        taskTargets(filter: { leadId: { eq: $leadId } }, orderBy: { createdAt: DescNullsLast }) {
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
                install
                pmTask
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;

    console.log('[PM Tasks API] Fetching tasks for each lead...');

    // Fetch tasks for all leads in parallel
    const taskPromises = leads.map(async (lead: any) => {
      const tasksData = await (twentyClient as any).request(tasksQuery, { leadId: lead.id });

      // Transform tasks and attach lead info
      return (tasksData.taskTargets?.edges || [])
        .filter((edge: any) => edge.node.task != null)
        .map((edge: any) => ({
          ...edge.node.task,
          body: edge.node.task.bodyV2?.markdown || null,
          leadId: lead.id,
          leadName: lead.name || 'Unknown',
          leadProjectManager: lead.projectManager,
          leadAddress: lead.adress || null,  // Note: "adress" is a typo in Twenty CRM
          leadCity: lead.city || null,
        }));
    });

    const allTasksArrays = await Promise.all(taskPromises);
    let tasks = allTasksArrays.flat();

    console.log(`[PM Tasks API] Total tasks fetched: ${tasks.length}`);

    // Filter to only show tasks where install=true OR pmTask=true
    tasks = tasks.filter((task: any) => {
      const hasInstall = task.install === true || task.install === 'YES';
      const hasPmTask = task.pmTask === true || task.pmTask === 'YES';
      const shouldShow = hasInstall || hasPmTask;

      if (!shouldShow) {
        console.log(`[PM Tasks API] Task ${task.id} filtered out - install: ${task.install}, pmTask: ${task.pmTask}`);
      }

      return shouldShow;
    });

    console.log(`[PM Tasks API] Found ${tasks.length} PM tasks after install/pmTask filter`);

    return NextResponse.json({
      tasks: tasks,
    });
  } catch (error) {
    console.error('[PM Tasks API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PM tasks from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
