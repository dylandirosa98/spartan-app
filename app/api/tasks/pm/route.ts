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

    // Query all taskTargets - we'll filter by projectManager in JavaScript
    const query = `
      query GetPMTasks {
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
                install
                pmTask
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
                projectManager
                adress
                city
              }
            }
          }
        }
      }
    `;

    console.log('[PM Tasks API] Fetching tasks for project manager:', projectManager);

    const data = await (twentyClient as any).request(query);

    // Transform the data and filter for install or pmTask
    // Filter out taskTargets without tasks (orphaned records)
    let tasks = data.taskTargets?.edges
      ?.filter((edge: any) => edge.node.task != null)
      ?.map((edge: any) => ({
        ...edge.node.task,
        body: edge.node.task.bodyV2?.markdown || null,
        leadId: edge.node.lead?.id || null,
        leadName: edge.node.lead?.name || null,
        leadProjectManager: edge.node.lead?.projectManager || null,
        leadAddress: edge.node.lead?.adress || null,
        leadCity: edge.node.lead?.city || null,
      })) || [];

    console.log(`[PM Tasks API] Total tasks fetched: ${tasks.length}`);
    console.log(`[PM Tasks API] Unique lead project managers:`, [...new Set(tasks.map((t: any) => t.leadProjectManager))]);

    // Filter by project manager (case-insensitive)
    tasks = tasks.filter((task: any) => {
      if (!task.leadProjectManager) {
        console.log(`[PM Tasks API] Task ${task.id} has no leadProjectManager, skipping`);
        return false;
      }
      const matches = task.leadProjectManager.toLowerCase() === projectManager.toLowerCase();
      if (!matches) {
        console.log(`[PM Tasks API] Task ${task.id} leadProjectManager "${task.leadProjectManager}" doesn't match "${projectManager}"`);
      }
      return matches;
    });

    console.log(`[PM Tasks API] Found ${tasks.length} tasks for project manager: ${projectManager} before install/pmTask filter`);

    // Filter to only show tasks where install='YES' OR pmTask='YES'
    tasks = tasks.filter((task: any) => {
      const hasInstall = task.install === 'YES';
      const hasPmTask = task.pmTask === 'YES';
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
