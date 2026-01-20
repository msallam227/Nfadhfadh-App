import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Smile, BookOpen, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const feelingColors = {
  happiness: '#10B981',
  sadness: '#6366F1',
  anger: '#EF4444',
  fear: '#8B5CF6',
  anxiety: '#F59E0B',
  stress: '#EC4899',
  calm: '#14B8A6',
  love: '#F43F5E',
  loneliness: '#6B7280',
  hope: '#22D3EE',
  disappointment: '#A855F7',
  frustration: '#FB923C',
  guilt: '#78716C',
  shame: '#9CA3AF',
  pride: '#EAB308',
  jealousy: '#84CC16',
  thankful: '#0EA5E9',
  excitement: '#F472B6',
  boredom: '#94A3B8',
  confusion: '#A78BFA'
};

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [moodData, setMoodData] = useState([]);
  const [moodSummary, setMoodSummary] = useState(null);
  const [diaryCount, setDiaryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [checkinsRes, summaryRes, diaryRes] = await Promise.all([
        axios.get(`${API}/mood/checkins`),
        axios.get(`${API}/mood/summary`),
        axios.get(`${API}/diary/entries`)
      ]);
      
      setMoodData(checkinsRes.data.checkins || []);
      setMoodSummary(summaryRes.data);
      setDiaryCount(diaryRes.data.entries?.length || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = moodData.slice(0, 7).reverse().map((item, index) => ({
    name: new Date(item.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }),
    feeling: item.feeling,
    value: index + 1
  }));

  const pieData = moodSummary?.feeling_distribution 
    ? Object.entries(moodSummary.feeling_distribution).map(([name, value]) => ({
        name: t(name) || name,
        value,
        color: feelingColors[name] || '#94A3B8'
      }))
    : [];

  const greeting = language === 'ar' 
    ? `أهلاً ${user?.username || ''}` 
    : `Hello, ${user?.username || ''}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-soft text-[#0F4C81] text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up" data-testid="user-dashboard">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#0F4C81] to-[#1E6CB5] rounded-3xl p-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{greeting}</h1>
        <p className="text-white/80 text-lg">
          {language === 'ar' ? 'كيف حالك النهاردة؟' : 'How are you feeling today?'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-soft p-6" data-testid="stat-checkins">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
              <Smile className="w-6 h-6 text-[#0F4C81]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('moodCheckin')}</p>
              <p className="text-2xl font-bold text-slate-900">{moodSummary?.total_checkins || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-6" data-testid="stat-diary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('diary')}</p>
              <p className="text-2xl font-bold text-slate-900">{diaryCount}</p>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-6" data-testid="stat-common-mood">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'ar' ? 'المزاج الأكثر شيوعاً' : 'Most Common'}</p>
              <p className="text-lg font-bold text-slate-900">
                {moodSummary?.most_common ? t(moodSummary.most_common) : '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-6" data-testid="stat-subscription">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#EC4899]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('subscription')}</p>
              <p className={`text-lg font-bold ${user?.subscription_status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                {user?.subscription_status === 'active' ? t('active') : t('inactive')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trend */}
        <Card className="card-soft" data-testid="mood-trend-chart">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">
              {language === 'ar' ? 'تتبع المزاج الأسبوعي' : 'Weekly Mood Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                    <YAxis hide />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                              <p className="text-sm font-medium text-slate-900">
                                {t(payload[0].payload.feeling)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0F4C81" 
                      strokeWidth={3}
                      dot={{ fill: '#0F4C81', strokeWidth: 2, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                {language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card className="card-soft" data-testid="mood-distribution-chart">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">
              {language === 'ar' ? 'توزيع المشاعر' : 'Mood Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                              <p className="text-sm font-medium text-slate-900">
                                {payload[0].payload.name}: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                {language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-ins */}
      <Card className="card-soft" data-testid="recent-checkins">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            {language === 'ar' ? 'آخر تسجيلات المزاج' : 'Recent Check-ins'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moodData.length > 0 ? (
            <div className="space-y-3">
              {moodData.slice(0, 5).map((checkin) => (
                <div 
                  key={checkin.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: feelingColors[checkin.feeling] || '#94A3B8' }}
                    />
                    <span className="font-medium text-slate-800">{t(checkin.feeling)}</span>
                    {checkin.note && (
                      <span className="text-sm text-slate-500 truncate max-w-[200px]">
                        - {checkin.note}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(checkin.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              {language === 'ar' ? 'لا توجد تسجيلات بعد' : 'No check-ins yet'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
