import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { CreditCard, Check, Loader2, Sparkles } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Subscription = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sid, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error(language === 'ar' ? 'فشل التحقق من حالة الدفع' : 'Payment status check timed out');
      return;
    }

    setCheckingPayment(true);

    try {
      const response = await axios.get(`${API}/payments/status/${sid}`);
      
      if (response.data.payment_status === 'paid') {
        toast.success(language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment successful!');
        navigate('/subscription', { replace: true });
        window.location.reload();
        return;
      } else if (response.data.status === 'expired') {
        toast.error(language === 'ar' ? 'انتهت صلاحية جلسة الدفع' : 'Payment session expired');
        return;
      }

      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } finally {
      if (attempts === 0) setCheckingPayment(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/payments/create-checkout`, {
        origin_url: window.location.origin
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ في إنشاء جلسة الدفع' : 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const isActive = user?.subscription_status === 'active';
  const price = user?.subscription_price || 15;
  const tier = user?.subscription_tier || 'premium';

  const features = [
    language === 'ar' ? 'تسجيل مزاج غير محدود' : 'Unlimited mood check-ins',
    language === 'ar' ? 'دردشة تنفيس مع الذكاء الاصطناعي' : 'AI venting chat',
    language === 'ar' ? 'يوميات مع أسئلة تأملية' : 'Diary with reflective prompts',
    language === 'ar' ? 'استراتيجيات تحسين المزاج' : 'Mood improvement strategies',
    language === 'ar' ? 'مقالات حصرية' : 'Exclusive articles',
    language === 'ar' ? 'تحليلات متقدمة' : 'Advanced analytics'
  ];

  if (checkingPayment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="payment-checking">
        <Card className="card-soft p-8 text-center">
          <Loader2 className="w-12 h-12 text-[#0F4C81] mx-auto mb-4 animate-spin" />
          <p className="text-lg text-slate-600">
            {language === 'ar' ? 'جاري التحقق من حالة الدفع...' : 'Verifying payment status...'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up" data-testid="subscription-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t('subscription')}
        </h1>
        <p className="text-slate-500 text-lg">
          {t('subscriptionDescription')}
        </p>
      </div>

      {/* Current Status */}
      {isActive && (
        <Card className="card-soft border-2 border-green-500 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {language === 'ar' ? 'الاشتراك نشط' : 'Subscription Active'}
                </h3>
                <p className="text-green-600">
                  {language === 'ar' ? 'لديك وصول كامل لجميع الميزات' : 'You have full access to all features'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Card */}
      <Card className="card-soft overflow-hidden">
        <div className="bg-gradient-to-br from-[#0F4C81] to-[#1E6CB5] p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm uppercase tracking-wide opacity-80">
              {tier === 'standard' 
                ? (language === 'ar' ? 'الباقة الأساسية' : 'Standard Plan')
                : (language === 'ar' ? 'الباقة المميزة' : 'Premium Plan')
              }
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">${price.toFixed(0)}</span>
            <span className="text-xl opacity-80">{t('perMonth')}</span>
          </div>
        </div>

        <CardContent className="p-8">
          <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          {!isActive && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full btn-primary h-14 text-lg"
              data-testid="subscribe-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 me-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 me-2" />
                  {t('subscribe')}
                </>
              )}
            </Button>
          )}

          <p className="text-center text-sm text-slate-400 mt-4">
            {language === 'ar' 
              ? 'الدفع الآمن عبر Stripe' 
              : 'Secure payment via Stripe'}
          </p>
        </CardContent>
      </Card>

      {/* Pricing Note */}
      <Card className="card-soft bg-[#F8FAFC]">
        <CardContent className="p-6">
          <p className="text-sm text-slate-500 text-center">
            {language === 'ar' 
              ? 'الأسعار تختلف حسب بلدك: $5/شهر لسوريا والأردن ومصر والمغرب والعراق، $15/شهر لدول الخليج'
              : 'Pricing varies by country: $5/month for Syria, Jordan, Egypt, Morocco, Iraq. $15/month for Gulf countries.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
