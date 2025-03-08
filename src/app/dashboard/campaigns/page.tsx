'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { analyzeCampaign } from '@/lib/ai/campaign-analyzer';

interface CampaignMetrics {
  id: string;
  name: string;
  status: string;
  budget: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    costMicros: number;
    averageCpc: number;
    ctr: number;
    conversionRate: number;
  };
  targeting: any;
  adGroups: any[];
  startDate: string;
  endDate: string;
}

interface Issue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [issues, setIssues] = useState<{ [key: string]: Issue[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/campaigns/google');
        const data = await response.json();
        setCampaigns(data);
        
        // ניתוח כל הקמפיינים
        const allIssues: { [key: string]: Issue[] } = {};
        for (const campaign of data) {
          const campaignIssues = await analyzeCampaign({
            id: campaign.id,
            name: campaign.name,
            platform: 'google',
            budget: campaign.budget,
            spend: campaign.metrics.costMicros / 1000000,
            conversions: campaign.metrics.conversions,
            status: campaign.status
          });
          allIssues[campaign.id] = campaignIssues;
        }
        setIssues(allIssues);
      } catch (error) {
        console.error('שגיאה בטעינת נתוני קמפיינים:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchCampaigns();
    }
  }, [session]);

  if (loading) {
    return <div className="p-6">טוען נתונים ומבצע ניתוח...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ניתוח קמפיינים</h1>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{campaign.name}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  campaign.status === 'ENABLED' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {campaign.status === 'ENABLED' ? 'פעיל' :
                   campaign.status === 'PAUSED' ? 'מושהה' : 'מושבת'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">מדדי ביצוע</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>תקציב:</div>
                    <div>₪{campaign.budget.toLocaleString()}</div>
                    <div>הוצאה:</div>
                    <div>₪{(campaign.metrics.costMicros / 1000000).toLocaleString()}</div>
                    <div>חשיפות:</div>
                    <div>{campaign.metrics.impressions.toLocaleString()}</div>
                    <div>הקלקות:</div>
                    <div>{campaign.metrics.clicks.toLocaleString()}</div>
                    <div>המרות:</div>
                    <div>{campaign.metrics.conversions.toLocaleString()}</div>
                    <div>אחוז הקלקה:</div>
                    <div>{(campaign.metrics.ctr * 100).toFixed(2)}%</div>
                    <div>אחוז המרה:</div>
                    <div>{(campaign.metrics.conversionRate * 100).toFixed(2)}%</div>
                    <div>עלות להקלקה:</div>
                    <div>₪{(campaign.metrics.averageCpc / 1000000).toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">בעיות וסיכונים שזוהו</h3>
                  <div className="space-y-2">
                    {issues[campaign.id]?.map((issue, index) => (
                      <div key={index} className={`p-3 rounded ${
                        issue.severity === 'high' ? 'bg-red-50 border border-red-200' :
                        issue.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="font-semibold">{issue.type}</div>
                        <div className="text-sm mt-1">{issue.description}</div>
                        <div className="text-sm mt-2 font-medium">המלצה: {issue.suggestedFix}</div>
                      </div>
                    ))}
                    {(!issues[campaign.id] || issues[campaign.id].length === 0) && (
                      <div className="text-green-600">לא זוהו בעיות בקמפיין זה</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 