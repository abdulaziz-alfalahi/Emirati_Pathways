
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auditLogger, AuditLogEntry } from '@/services/blockchain/auditLogger';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Search, Filter, ExternalLink, Shield, Download, Share2, Award } from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<AuditLogEntry[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType, filterResult]);

  const loadTransactions = async () => {
    try {
      const data = await auditLogger.getUserActivity(user!.id, 100);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.operation_details.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.credential_id && tx.credential_id.includes(searchTerm))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.operation_type === filterType);
    }

    // Result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(tx => tx.operation_details.result === filterResult);
    }

    setFilteredTransactions(filtered);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'issue': return <Award className="h-4 w-4" />;
      case 'verify': return <Shield className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'share': return <Share2 className="h-4 w-4" />;
      case 'revoke': return <ExternalLink className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'issue': return 'bg-green-600';
      case 'verify': return 'bg-blue-600';
      case 'download': return 'bg-purple-600';
      case 'share': return 'bg-orange-600';
      case 'revoke': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="me-2 h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Complete audit trail of your blockchain credential activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="verify">Verify</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="share">Share</SelectItem>
                <SelectItem value="revoke">Revoke</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">
                {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${getOperationColor(transaction.operation_type)}`}>
                          {getOperationIcon(transaction.operation_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getOperationColor(transaction.operation_type)}>
                            {transaction.operation_type.toUpperCase()}
                          </Badge>
                          {transaction.operation_details.result && (
                            <span className={`text-sm font-medium ${getResultColor(transaction.operation_details.result)}`}>
                              {transaction.operation_details.result.toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {transaction.operation_details.action}
                        </p>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center">
                            <Calendar className="me-1 h-3 w-3" />
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                          
                          {transaction.credential_id && (
                            <p>Credential: {transaction.credential_id.substring(0, 8)}...</p>
                          )}
                          
                          {transaction.transaction_hash && (
                            <p className="flex items-center">
                              <ExternalLink className="me-1 h-3 w-3" />
                              Tx: {transaction.transaction_hash.substring(0, 10)}...
                            </p>
                          )}
                          
                          {transaction.block_number && (
                            <p>Block: #{transaction.block_number}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.operation_details.metadata && (
                      <div className="flex-shrink-0 ms-4">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                            Details
                          </summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 max-w-sm">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(transaction.operation_details.metadata, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
