import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const twentyClient = new TwentyCRMClient(
      company.twenty_api_url,
      decrypt(company.twenty_api_key)
    );

    // First, let's see what types exist
    const schemaQuery = `
      query GetSchema {
        __schema {
          types {
            name
            kind
          }
        }
      }
    `;

    const schemaData = await (twentyClient as any).request(schemaQuery);

    // Filter for types that might be task-related
    const taskTypes = schemaData.__schema.types.filter((type: any) =>
      type.name.toLowerCase().includes('task') ||
      type.name.toLowerCase().includes('activity')
    );

    console.log('[Introspect Task] Found task-related types:', taskTypes);

    // Now introspect the Task type if it exists
    const taskType = taskTypes.find((t: any) => t.name === 'Task');

    let taskFields = null;
    if (taskType) {
      const taskFieldsQuery = `
        query GetTaskFields {
          __type(name: "Task") {
            name
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      `;

      const fieldsData = await (twentyClient as any).request(taskFieldsQuery);
      taskFields = fieldsData.__type?.fields;
      console.log('[Introspect Task] Task fields:', taskFields);
    }

    return NextResponse.json({
      taskRelatedTypes: taskTypes,
      taskFields: taskFields,
    });
  } catch (error) {
    console.error('[Introspect Task] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to introspect',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
