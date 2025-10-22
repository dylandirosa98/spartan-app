import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface EnumValue {
  value: string;
  label: string;
}

interface LeadEnums {
  status: EnumValue[];
  source: EnumValue[];
  medium: EnumValue[];
  salesRep: EnumValue[];
}

export function useLeadEnums() {
  const params = useParams();
  const companyId = params.company_id as string;
  const [enums, setEnums] = useState<LeadEnums | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnums();
  }, [companyId]);

  const fetchEnums = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/leads/enums?companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lead enums');
      }

      const data = await response.json();
      setEnums(data.enums);
    } catch (error) {
      console.error('[Lead Enums] Error fetching enums:', error);
      // Set default enums if fetch fails
      setEnums({
        status: [
          { value: 'NEW', label: 'New' },
          { value: 'CONTACTED', label: 'Contacted' },
          { value: 'QUALIFIED', label: 'Qualified' },
          { value: 'QUOTED', label: 'Quoted' },
          { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
          { value: 'WON', label: 'Won' },
          { value: 'LOST', label: 'Lost' },
        ],
        source: [
          { value: 'GOOGLE', label: 'Google' },
          { value: 'FACEBOOK', label: 'Facebook' },
          { value: 'REFERRAL', label: 'Referral' },
          { value: 'WEBSITE', label: 'Website' },
        ],
        medium: [
          { value: 'CPC', label: 'CPC' },
          { value: 'ORGANIC', label: 'Organic' },
        ],
        salesRep: [
          { value: 'UNASSIGNED', label: 'Unassigned' },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { enums, isLoading };
}
