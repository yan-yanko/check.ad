'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface MarketingIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  platform: 'google' | 'facebook' | 'linkedin';
  suggestedFix: string;
}

const mockData = [
  {
    date: '2024-01',
    googleSpend: 4000,
    facebookSpend: 2400,
    linkedinSpend: 1800,
  },
  // ... more data points
];

const mockIssues: MarketingIssue[] = [
  {
    id: '1',
    type: 'Budget Leak',
    description: 'Campaign XYZ has spent $500 with 0 conversions in the last 7 days',
    severity: 'high',
    platform: 'google',
    suggestedFix: 'Consider pausing the campaign and reviewing targeting settings',
  },
  // ... more issues
];

export default function Dashboard() {
  const [issues] = useState<MarketingIssue[]>(mockIssues);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Marketing QA Dashboard</h1>
      
      {/* Performance Chart */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Ad Spend Overview</h2>
          <div className="w-full h-[300px]">
            <LineChart width={800} height={300} data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="googleSpend" stroke="#4285F4" />
              <Line type="monotone" dataKey="facebookSpend" stroke="#1877F2" />
              <Line type="monotone" dataKey="linkedinSpend" stroke="#0A66C2" />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className={`border-l-4 ${
            issue.severity === 'high' ? 'border-l-red-500' :
            issue.severity === 'medium' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{issue.type}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  issue.platform === 'google' ? 'bg-blue-100 text-blue-800' :
                  issue.platform === 'facebook' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-sky-100 text-sky-800'
                }`}>
                  {issue.platform}
                </span>
              </div>
              <p className="text-gray-600 mb-3">{issue.description}</p>
              <p className="text-sm text-gray-500 mb-3">הצעה לתיקון: {issue.suggestedFix}</p>
              <div className="flex gap-2">
                <Button variant="default">תקן בעיה</Button>
                <Button variant="outline">התעלם</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 