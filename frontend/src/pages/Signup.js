import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Globe, Eye, EyeOff, User, Lock, Calendar, MapPin, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const countries = [
  { value: 'syria', labelEn: 'Syria', labelAr: 'سوريا' },
  { value: 'jordan', labelEn: 'Jordan', labelAr: 'الأردن' },
  { value: 'egypt', labelEn: 'Egypt', labelAr: 'مصر' },
  { value: 'morocco', labelEn: 'Morocco', labelAr: 'المغرب' },
  { value: 'iraq', labelEn: 'Iraq', labelAr: 'العراق' },
  { value: 'saudi arabia', labelEn: 'Saudi Arabia', labelAr: 'السعودية' },
  { value: 'uae', labelEn: 'UAE', labelAr: 'الإمارات' },
  { value: 'qatar', labelEn: 'Qatar', labelAr: 'قطر' },
  { value: 'kuwait', labelEn: 'Kuwait', labelAr: 'الكويت' },
  { value: 'bahrain', labelEn: 'Bahrain', labelAr: 'البحرين' },
  { value: 'oman', labelEn: 'Oman', labelAr: 'عمان' },
];

const Signup = () => {
  const { t, language, toggleLanguage, changeLanguage } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    country: '',
    city: '',
    occupation: '',
    gender: '',
    language: 'en'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'language') {
      changeLanguage(value);
    }
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.birthdate || !formData.country || !formData.city || !formData.occupation || !formData.gender) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;
  const NextIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-slate-600 hover:text-[#0F4C81]"
            data-testid="language-toggle"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>

        <Card className="glass-card border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-[#0F4C81] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">ن</span>
            </div>
            <CardTitle className="text-2xl font-bold text-[#0F4C81]">{t('signup')}</CardTitle>
            <CardDescription className="text-slate-500">
              {language === 'ar' ? `الخطوة ${step} من 2` : `Step ${step} of 2`}
            </CardDescription>
            
            {/* Progress bar */}
            <div className="flex gap-2 mt-4">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#0F4C81]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#0F4C81]' : 'bg-slate-200'}`} />
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <>
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">{t('selectLanguage')}</Label>
                    <Select value={formData.language} onValueChange={(v) => handleChange('language', v)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="signup-language-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-700">{t('username')}</Label>
                    <div className="relative">
                      <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        className="ps-10 h-12 rounded-xl border-slate-200"
                        placeholder={t('username')}
                        required
                        data-testid="signup-username-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="ps-10 pe-10 h-12 rounded-xl border-slate-200"
                        placeholder={t('password')}
                        required
                        data-testid="signup-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className="ps-10 h-12 rounded-xl border-slate-200"
                        placeholder={t('confirmPassword')}
                        required
                        data-testid="signup-confirm-password-input"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full btn-primary h-12 text-base flex items-center justify-center gap-2"
                    data-testid="signup-next-btn"
                  >
                    {t('next')}
                    <NextIcon className="w-5 h-5" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="text-slate-700">{t('birthdate')}</Label>
                    <div className="relative">
                      <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="birthdate"
                        type="date"
                        value={formData.birthdate}
                        onChange={(e) => handleChange('birthdate', e.target.value)}
                        className="ps-10 h-12 rounded-xl border-slate-200"
                        required
                        data-testid="signup-birthdate-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">{t('country')}</Label>
                    <Select value={formData.country} onValueChange={(v) => handleChange('country', v)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="signup-country-select">
                        <SelectValue placeholder={t('country')} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {language === 'ar' ? c.labelAr : c.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-700">{t('city')}</Label>
                    <div className="relative">
                      <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="ps-10 h-12 rounded-xl border-slate-200"
                        placeholder={t('city')}
                        required
                        data-testid="signup-city-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation" className="text-slate-700">{t('occupation')}</Label>
                    <div className="relative">
                      <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="occupation"
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        className="ps-10 h-12 rounded-xl border-slate-200"
                        placeholder={t('occupation')}
                        required
                        data-testid="signup-occupation-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">{t('gender')}</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="signup-gender-select">
                        <SelectValue placeholder={t('gender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('male')}</SelectItem>
                        <SelectItem value="female">{t('female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2"
                      data-testid="signup-back-btn"
                    >
                      <BackIcon className="w-5 h-5" />
                      {t('back')}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 btn-primary h-12"
                      disabled={loading}
                      data-testid="signup-submit-btn"
                    >
                      {loading ? t('loading') : t('signup')}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500">
                {t('alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-[#0F4C81] hover:underline font-medium" data-testid="login-link">
                  {t('login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
