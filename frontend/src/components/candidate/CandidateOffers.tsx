import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { restClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  MapPin,
  Building,
  User,
  Gift,
  FileText,
  Send,
  AlertTriangle,
  PartyPopper,
  Coins
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface Offer {
  id: string;
  job_posting_id: string | null;
  job_title: string;
  company_name: string;
  job_location: string;
  status: string;
  salary_amount: number;
  salary_currency: string;
  salary_period: string;
  start_date: string | null;
  employment_type: string;
  probation_period_months: number | null;
  benefits: any;
  notes: string | null;
  expiry_date: string | null;
  recruiter_name: string;
  recruiter_email: string | null;
  created_at: string;
  updated_at: string | null;
}

interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}

export const CandidateOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats>({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseAction, setResponseAction] = useState<'accept' | 'decline' | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get candidate_id from localStorage or auth context
      const userData = localStorage.getItem('user');
      let candidateId = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          candidateId = user.id || user.user_id;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      const [offersRes, statsRes] = await Promise.allSettled([
        restClient.get(`/api/candidate/offers${candidateId ? `?candidate_id=${candidateId}` : ''}`),
        restClient.get(`/api/candidate/offers/stats${candidateId ? `?candidate_id=${candidateId}` : ''}`)
      ]);

      if (offersRes.status === 'fulfilled' && offersRes.value.data?.success) {
        setOffers(offersRes.value.data.data || []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.data);
      }
    } catch (err) {
      setError('Failed to load offers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowOfferDialog(true);
  };

  const handleRespondClick = (action: 'accept' | 'decline') => {
    setResponseAction(action);
    setResponseMessage('');
    setShowOfferDialog(false);
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedOffer || !responseAction) return;

    try {
      setProcessing(true);
      const res = await restClient.post(`/api/candidate/offers/${selectedOffer.id}/respond`, {
        action: responseAction,
        message: responseMessage
      });

      if (res.data?.success) {
        toast({
          title: responseAction === 'accept' ? 'Offer Accepted!' : 'Offer Declined',
          description: responseAction === 'accept'
            ? 'Congratulations! The recruiter will be notified.'
            : 'The recruiter will be notified of your decision.',
        });
        setShowResponseDialog(false);
        setSelectedOffer(null);
        setResponseAction(null);
        setResponseMessage('');
        fetchOffers();
      } else {
        throw new Error(res.data?.message || 'Failed to respond to offer');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to respond to offer',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };



  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      sent: { color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" />, label: 'Pending Response' },
      accepted: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" />, label: 'Declined' },
      negotiating: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Negotiating' }
    };
    const { color, icon, label } = config[status] || config.sent;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const formatBenefits = (benefits: any) => {
    if (!benefits || typeof benefits !== 'object') return null;

    const benefitsList: string[] = [];

    if (benefits.health_insurance) benefitsList.push('Health Insurance');
    if (benefits.housing_allowance) benefitsList.push(`Housing Allowance: ${benefits.housing_allowance} AED`);
    if (benefits.transportation_allowance) benefitsList.push(`Transportation: ${benefits.transportation_allowance} AED`);
    if (benefits.annual_leave_days) benefitsList.push(`${benefits.annual_leave_days} Days Annual Leave`);
    if (benefits.flight_tickets) benefitsList.push(`${benefits.flight_tickets} Flight Tickets/Year`);
    if (benefits.additional_benefits && Array.isArray(benefits.additional_benefits)) {
      benefitsList.push(...benefits.additional_benefits);
    }

    return benefitsList;
  };

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'pending') return offer.status === 'sent' || offer.status === 'negotiating';
    if (activeTab === 'accepted') return offer.status === 'accepted';
    if (activeTab === 'declined') return offer.status === 'declined';
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">Awaiting Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-sm text-gray-500">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
                <p className="text-sm text-gray-500">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-teal-600" />
            Job Offers
          </CardTitle>
          <CardDescription>
            Review and respond to job offers from recruiters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Accepted ({stats.accepted})
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Declined ({stats.declined})
              </TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">No offers yet</h3>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'pending'
                      ? 'You have no pending offers to review'
                      : activeTab === 'accepted'
                        ? 'You haven\'t accepted any offers yet'
                        : activeTab === 'declined'
                          ? 'You haven\'t declined any offers'
                          : 'Keep applying to jobs and offers will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{offer.job_title}</h3>
                              {getStatusBadge(offer.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {offer.company_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {offer.job_location}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-green-600 font-semibold">
                                <Coins className="h-4 w-4" />
                                {formatCurrency(offer.salary_amount, offer.salary_currency)}
                                <span className="text-gray-500 font-normal">/ {offer.salary_period}</span>
                              </span>
                              {offer.start_date && (
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  Start: {offer.start_date}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Received: {new Date(offer.created_at).toLocaleDateString()}
                              {offer.recruiter_name && ` • From: ${offer.recruiter_name}`}
                            </p>
                          </div>
                          <Button onClick={() => handleViewOffer(offer)}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Offer Details Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Job Offer Details
            </DialogTitle>
            <DialogDescription>
              Review the offer details carefully before responding
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Status Banner */}
                {selectedOffer.status === 'sent' && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      This offer is awaiting your response. Please review and accept or decline.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedOffer.status === 'accepted' && (
                  <Alert className="bg-green-50 border-green-200">
                    <PartyPopper className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Congratulations! You have accepted this offer.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Position & Company */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-teal-600" />
                    Position Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">Position</Label>
                      <p className="font-semibold text-lg">{selectedOffer.job_title}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Company</Label>
                      <p className="font-medium">{selectedOffer.company_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Location</Label>
                      <p className="font-medium">{selectedOffer.job_location}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Employment Type</Label>
                      <p className="font-medium capitalize">{selectedOffer.employment_type}</p>
                    </div>
                  </div>
                </div>

                {/* Compensation */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    Compensation Package
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">Salary</Label>
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(selectedOffer.salary_amount, selectedOffer.salary_currency)}
                      </p>
                      <p className="text-sm text-gray-500">{selectedOffer.salary_period}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Benefits</Label>
                      {selectedOffer.benefits && formatBenefits(selectedOffer.benefits) ? (
                        <ul className="mt-1 space-y-1">
                          {formatBenefits(selectedOffer.benefits)?.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-1 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No additional benefits specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedOffer.start_date && (
                      <div>
                        <Label className="text-gray-500 text-sm">Start Date</Label>
                        <p className="font-medium">{selectedOffer.start_date}</p>
                      </div>
                    )}
                    {selectedOffer.probation_period_months && (
                      <div>
                        <Label className="text-gray-500 text-sm">Probation Period</Label>
                        <p className="font-medium">{selectedOffer.probation_period_months} months</p>
                      </div>
                    )}
                    {selectedOffer.expiry_date && (
                      <div>
                        <Label className="text-gray-500 text-sm">Offer Valid Until</Label>
                        <p className="font-medium">{selectedOffer.expiry_date}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recruiter Info */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Contact Information
                  </h3>
                  <div>
                    <Label className="text-gray-500 text-sm">Recruiter</Label>
                    <p className="font-medium">{selectedOffer.recruiter_name}</p>
                    {selectedOffer.recruiter_email && (
                      <p className="text-sm text-gray-600">{selectedOffer.recruiter_email}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedOffer.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Additional Notes</h3>
                    <p className="text-gray-700">{selectedOffer.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
              Close
            </Button>
            {selectedOffer?.status === 'sent' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRespondClick('decline')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline Offer
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleRespondClick('accept')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept Offer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Confirmation Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accept' ? 'Accept Offer' : 'Decline Offer'}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'accept'
                ? 'Are you sure you want to accept this offer? The recruiter will be notified.'
                : 'Are you sure you want to decline this offer? You can optionally provide a reason.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="responseMessage">
                Message to Recruiter {responseAction === 'accept' ? '(Optional)' : '(Optional - reason for declining)'}
              </Label>
              <Textarea
                id="responseMessage"
                placeholder={responseAction === 'accept'
                  ? 'Thank you for this opportunity...'
                  : 'Thank you for the offer, but...'}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              className={responseAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={responseAction === 'decline' ? 'destructive' : 'default'}
              onClick={handleSubmitResponse}
              disabled={processing}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : responseAction === 'accept' ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              {responseAction === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateOffers;
