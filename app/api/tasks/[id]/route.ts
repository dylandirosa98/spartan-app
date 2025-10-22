import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/tasks/[id]
 * Update a task in Twenty CRM
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { companyId, updates } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required' },
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

    // Transform updates to match Twenty CRM schema
    const transformedUpdates: Record<string, any> = { ...updates };

    // Handle body field - convert to bodyV2
    if ('body' in updates) {
      const bodyText = updates.body || '';
      transformedUpdates.bodyV2 = {
        markdown: bodyText + '\n',
        blocknote: `[{"type":"paragraph","content":[{"type":"text","text":"${bodyText.replace(/"/g, '\\"')}"}]}]`,
      };
      delete transformedUpdates.body;
    }

    // Update task mutation
    const mutation = `
      mutation UpdateTask($taskId: UUID!, $data: TaskUpdateInput!) {
        updateTask(id: $taskId, data: $data) {
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

    const data = await (twentyClient as any).request(mutation, {
      taskId,
      data: transformedUpdates,
    });

    console.log('[Tasks API] Updated task:', data.updateTask);

    return NextResponse.json({
      success: true,
      task: data.updateTask,
    });
  } catch (error) {
    console.error('[Tasks API] Error updating task:', error);
    return NextResponse.json(
      {
        error: 'Failed to update task in Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task in Twenty CRM
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

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

    // Delete task mutation
    const mutation = `
      mutation DeleteTask($taskId: UUID!) {
        deleteTask(id: $taskId) {
          id
        }
      }
    `;

    const data = await (twentyClient as any).request(mutation, {
      taskId,
    });

    console.log('[Tasks API] Deleted task:', taskId);

    return NextResponse.json({
      success: true,
      deletedId: data.deleteTask.id,
    });
  } catch (error) {
    console.error('[Tasks API] Error deleting task:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete task in Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
