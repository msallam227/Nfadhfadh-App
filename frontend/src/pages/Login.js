import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, Eye, EyeOff, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(username, password);
    
    if (result.success) {
      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

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
            <CardTitle className="text-2xl font-bold text-[#0F4C81]">{t('appName')}</CardTitle>
            <CardDescription className="text-slate-500">{t('tagline')}</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700">{t('username')}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="ps-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0]"
                    placeholder={t('username')}
                    required
                    data-testid="login-username-input"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ps-10 pe-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0]"
                    placeholder={t('password')}
                    required
                    data-testid="login-password-input"
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

              <Button
                type="submit"
                className="w-full btn-primary h-12 text-base"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? t('loading') : t('login')}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-slate-500">
                {t('dontHaveAccount')}{' '}
                <Link to="/signup" className="text-[#0F4C81] hover:underline font-medium" data-testid="signup-link">
                  {t('signup')}
                </Link>
              </p>
              <Link to="/admin/login" className="text-sm text-slate-400 hover:text-[#0F4C81]" data-testid="admin-login-link">
                {t('adminLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
