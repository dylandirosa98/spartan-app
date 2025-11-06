import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tasks?companyId=xxx&leadId=xxx&canvassLead=true
 * Fetch tasks from Twenty CRM
 * - If leadId provided: fetch tasks for that specific lead
 * - If canvassLead=true: fetch all tasks with canvassLead=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const leadId = searchParams.get('leadId');
    const canvassLead = searchParams.get('canvassLead');

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

    let data;

    if (canvassLead === 'true') {
      // Fetch all tasks with canvassLead=true
      const query = `
        query GetCanvassLeadTasks {
          tasks(filter: { canvassLead: { eq: true } }, orderBy: { createdAt: DescNullsLast }) {
            edges {
              node {
                id
                title
                bodyV2 {
                  markdown
                }
                status
                dueAt
                canvassLead
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      data = await (twentyClient as any).request(query);

      // Transform and return tasks with their lead IDs from taskTargets
      const tasksWithLeads = await Promise.all(
        (data.tasks?.edges || []).map(async (edge: any) => {
          const task = edge.node;

          // Fetch taskTargets to get the leadId
          const targetQuery = `
            query GetTaskTargets($taskId: UUID!) {
              taskTargets(filter: { taskId: { eq: $taskId } }) {
                edges {
                  node {
                    leadId
                  }
                }
              }
            }
          `;

          const targetData = await (twentyClient as any).request(targetQuery, { taskId: task.id });
          const leadId = targetData.taskTargets?.edges?.[0]?.node?.leadId || null;

          return {
            ...task,
            body: task.bodyV2?.markdown || null,
            leadId,
          };
        })
      );

      return NextResponse.json({ tasks: tasksWithLeads });
    } else if (leadId) {
      // Query tasks associated with a specific lead
      const query = `
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
                  createdAt
                  updatedAt
                  assignee {
                    id
                    name {
                      firstName
                      lastName
                    }
                  }
                  createdBy {
                    source
                    name
                  }
                }
              }
            }
          }
        }
      `;

      data = await (twentyClient as any).request(query, { leadId });
    } else {
      return NextResponse.json(
        { error: 'Either leadId or canvassLead parameter is required' },
        { status: 400 }
      );
    }

    console.log('[Tasks API] Fetched tasks for lead:', leadId);

    return NextResponse.json({
      tasks: data.taskTargets?.edges?.map((edge: any) => ({
        ...edge.node.task,
        body: edge.node.task.bodyV2?.markdown || null,
      })) || [],
    });
  } catch (error) {
    console.error('[Tasks API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task in Twenty CRM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, leadId, title, body: taskBody, status, dueAt, canvassLead } = body;

    if (!companyId || !leadId || !title) {
      return NextResponse.json(
        { error: 'companyId, leadId, and title are required' },
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

    // Create task mutation - similar to how notes are created
    const mutation = `
      mutation CreateTask($taskData: TaskCreateInput!) {
        createTask(data: $taskData) {
          id
          title
          bodyV2 {
            markdown
          }
          status
          dueAt
          createdAt
          updatedAt
        }
      }
    `;

    const taskData: any = {
      title,
    };

    if (taskBody) {
      taskData.bodyV2 = {
        markdown: taskBody + '\n',
        blocknote: `[{"type":"paragraph","content":[{"type":"text","text":"${taskBody.replace(/"/g, '\\"')}"}]}]`,
      };
    }
    if (status) taskData.status = status;
    if (dueAt) taskData.dueAt = dueAt;
    if (canvassLead !== undefined) taskData.canvassLead = canvassLead;

    const data = await (twentyClient as any).request(mutation, {
      taskData: taskData,
    });

    console.log('[Tasks API] Created task:', data.createTask);

    // Now create taskTarget to link task to lead
    const taskTargetMutation = `
      mutation CreateTaskTarget($data: TaskTargetCreateInput!) {
        createTaskTarget(data: $data) {
          id
          taskId
          leadId
        }
      }
    `;

    await (twentyClient as any).request(taskTargetMutation, {
      data: {
        taskId: data.createTask.id,
        leadId: leadId,
      },
    });

    console.log('[Tasks API] Task linked to lead successfully');

    return NextResponse.json({
      success: true,
      task: data.createTask,
    });
  } catch (error) {
    console.error('[Tasks API] Error creating task:', error);
    return NextResponse.json(
      {
        error: 'Failed to create task in Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
