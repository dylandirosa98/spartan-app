/**
 * Twenty CRM API Client
 * Integrates with Twenty CRM for lead management
 */

export interface TwentyLead {
  id: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  email?: string;
  phone?: string;
  address?: {
    addressStreet1?: string;
    addressCity?: string;
    addressState?: string;
    addressPostcode?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export class TwentyCRMClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request(query: string, variables?: any) {
    // Twenty CRM uses GraphQL, so we always POST to /graphql
    const url = `${this.apiUrl}/graphql`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twenty CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Fetch all leads (Leads object in Twenty CRM)
   */
  async getLeads(filters?: { limit?: number }): Promise<TwentyLead[]> {
    try {
      const limit = filters?.limit || 100;

      const query = `
        query GetLeads($limit: Int) {
          leads(first: $limit) {
            edges {
              node {
                id
                name
                email {
                  primaryEmail
                }
                phone {
                  primaryPhoneNumber
                }
                city
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const data = await this.request(query, { limit });
      console.log('[Twenty Client] GraphQL response:', JSON.stringify(data, null, 2));

      // Transform the data to match our interface
      const leads = data.leads?.edges?.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          name: node.name || 'Unknown',
          email: node.email?.primaryEmail || null,
          phone: node.phone?.primaryPhoneNumber || null,
          city: node.city || null,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        };
      }) || [];

      return leads;
    } catch (error) {
      console.error('[Twenty Client] Failed to fetch leads from Twenty:', error);
      return [];
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(id: string): Promise<TwentyLead | null> {
    try {
      const data = await this.request(`people/${id}`);
      return data.data || null;
    } catch (error) {
      console.error(`Failed to fetch lead ${id} from Twenty:`, error);
      return null;
    }
  }

  /**
   * Create a new lead in Twenty CRM
   */
  async createLead(lead: Partial<TwentyLead>): Promise<TwentyLead | null> {
    try {
      const data = await this.request('people', {
        method: 'POST',
        body: JSON.stringify(lead),
      });
      return data.data || null;
    } catch (error) {
      console.error('Failed to create lead in Twenty:', error);
      return null;
    }
  }

  /**
   * Update an existing lead (GraphQL mutation)
   */
  async updateLead(id: string, updates: Partial<TwentyLead>): Promise<TwentyLead | null> {
    try {
      // Build the update fields
      const updateFields: any = {};

      if (updates.name) {
        updateFields.name = updates.name;
      }

      if (updates.email !== undefined) {
        updateFields.email = {
          primaryEmail: updates.email
        };
      }

      if (updates.phone !== undefined) {
        updateFields.phone = {
          primaryPhoneNumber: updates.phone
        };
      }

      if (updates.address) {
        updateFields.city = updates.address.addressCity;
      }

      const mutation = `
        mutation UpdateLead($id: ID!, $data: LeadUpdateInput!) {
          updateLead(id: $id, data: $data) {
            id
            name
            email {
              primaryEmail
            }
            phone {
              primaryPhoneNumber
            }
            city
            updatedAt
          }
        }
      `;

      const data = await this.request(mutation, {
        id,
        data: updateFields
      });

      return data.updateLead || null;
    } catch (error) {
      console.error(`Failed to update lead ${id} in Twenty:`, error);
      return null;
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<boolean> {
    try {
      await this.request(`people/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete lead ${id} from Twenty:`, error);
      return false;
    }
  }

  /**
   * Get notes for a lead
   */
  async getNotesForLead(leadId: string): Promise<any[]> {
    try {
      // Query noteTargets to find notes linked to this lead
      const query = `
        query GetNotesForLead($leadId: UUID!) {
          noteTargets(filter: { leadId: { eq: $leadId } }) {
            edges {
              node {
                id
                note {
                  id
                  title
                  bodyV2 {
                    markdown
                    blocknote
                  }
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      `;

      const data = await this.request(query, { leadId });
      console.log('[Twenty Client] Notes response:', JSON.stringify(data, null, 2));

      const notes = data.noteTargets?.edges?.map((edge: any) => ({
        id: edge.node.note.id,
        title: edge.node.note.title || '',
        body: edge.node.note.bodyV2?.markdown || '',
        createdAt: edge.node.note.createdAt,
        updatedAt: edge.node.note.updatedAt,
        createdBy: null,
      })) || [];

      return notes;
    } catch (error) {
      console.error(`[Twenty Client] Failed to fetch notes for lead ${leadId}:`, error);
      return [];
    }
  }

  /**
   * Create a note for a lead (person)
   */
  async createNoteForLead(leadId: string, title: string, body: string): Promise<any | null> {
    try {
      // Convert plain text to BlockNote format
      const blocknoteContent = JSON.stringify([
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: body
            }
          ]
        }
      ]);

      // First create the note
      const createMutation = `
        mutation CreateNote($title: String, $bodyV2: RichTextV2CreateInput!) {
          createNote(data: { title: $title, bodyV2: $bodyV2 }) {
            id
            title
            bodyV2 {
              markdown
              blocknote
            }
            createdAt
            updatedAt
          }
        }
      `;

      const createData = await this.request(createMutation, {
        title: title || 'Note',
        bodyV2: {
          blocknote: blocknoteContent,
          markdown: null
        },
      });

      console.log('[Twenty Client] Note created:', JSON.stringify(createData, null, 2));

      const note = createData.createNote;
      if (!note) return null;

      // Link note to lead via noteTarget
      try {
        const linkMutation = `
          mutation CreateNoteTarget($noteId: ID!, $leadId: ID!) {
            createNoteTarget(data: {
              noteId: $noteId,
              leadId: $leadId
            }) {
              id
            }
          }
        `;

        await this.request(linkMutation, {
          noteId: note.id,
          leadId: leadId,
        });

        console.log('[Twenty Client] Note created and linked to lead successfully');
      } catch (linkError) {
        console.error('[Twenty Client] Failed to link note to lead:', linkError);
        // Don't throw - note was created successfully even if linking failed
      }

      return {
        id: note.id,
        title: note.title || '',
        body: note.bodyV2?.markdown || '',
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        createdBy: null,
      };
    } catch (error) {
      console.error(`[Twenty Client] Failed to create note for lead ${leadId}:`, error);
      throw error;
    }
  }
}

/**
 * Create a Twenty CRM client for a specific company
 */
export function createTwentyClient(apiUrl: string, apiKey: string): TwentyCRMClient {
  return new TwentyCRMClient(apiUrl, apiKey);
}
