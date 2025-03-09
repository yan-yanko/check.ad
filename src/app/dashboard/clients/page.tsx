'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, AlertCircle, Maximize2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  logo?: string;
  accounts: AdAccount[];
  issues: ClientIssue[];
}

interface AdAccount {
  id: string;
  name: string;
  platform: string;
  campaigns: Campaign[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spend: number;
}

interface ClientIssue {
  type: string;
  severity: string;
  description: string;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('שגיאה בטעינת לקוחות:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchClients();
    }
  }, [session]);

  const getClientStatusIcon = (client: Client) => {
    const hasError = client.issues.some(issue => issue.severity === 'high');
    const hasWarning = client.issues.some(issue => issue.severity === 'medium');

    if (hasError) {
      return <AlertCircle className="absolute -top-1 -right-1 text-red-500 w-5 h-5" />;
    }
    if (hasWarning) {
      return <AlertTriangle className="absolute -top-1 -right-1 text-yellow-500 w-5 h-5" />;
    }
    return null;
  };

  const getPlatformLogo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google':
        return '/images/google-ads-logo.png';
      case 'facebook':
        return '/images/meta-ads-logo.png';
      case 'linkedin':
        return '/images/linkedin-ads-logo.png';
      default:
        return '/images/default-platform.png';
    }
  };

  if (loading) {
    return <div className="p-6">טוען לקוחות...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">לקוחות</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          לקוח חדש
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <motion.div
            key={client.id}
            className="bg-white rounded-lg shadow-lg p-6 relative"
            layoutId={client.id}
            onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {client.logo ? (
                    <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{client.name[0]}</span>
                  )}
                </div>
                {getClientStatusIcon(client)}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{client.name}</h2>
                <p className="text-gray-500">{client.accounts.length} חשבונות מחוברים</p>
              </div>
              <button 
                className="ml-auto p-2 hover:bg-gray-100 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  // פתיחת חלון הסקירה
                }}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence>
              {expandedClient === client.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap gap-4">
                    {client.accounts.map((account) => (
                      <div key={account.id} className="relative">
                        <motion.div
                          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer relative"
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAccount(expandedAccount === account.id ? null : account.id);
                          }}
                        >
                          <img
                            src={getPlatformLogo(account.platform)}
                            alt={account.platform}
                            className="w-8 h-8"
                          />
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {account.campaigns.length}
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {expandedAccount === account.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-10 min-w-[200px]"
                            >
                              <h3 className="font-semibold mb-2">{account.name}</h3>
                              <div className="space-y-2">
                                {account.campaigns.map((campaign) => (
                                  <div
                                    key={campaign.id}
                                    className="p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                  >
                                    <div className="font-medium">{campaign.name}</div>
                                    <div className="text-sm text-gray-500">
                                      תקציב: ₪{campaign.budget.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 