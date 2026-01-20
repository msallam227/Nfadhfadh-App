import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Smile, BookOpen, MessageCircle, TrendingUp, Calendar, Flame, Award, Clock, Bell, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const feelingColors = {
  happiness: '#10B981', sadness: '#6366F1', anger: '#EF4444', fear: '#8B5CF6',
  anxiety: '#F59E0B', stress: '#EC4899', calm: '#14B8A6', love: '#F43F5E',
  loneliness: '#6B7280', hope: '#22D3EE', disappointment: '#A855F7', frustration: '#FB923C',
  guilt: '#78716C', shame: '#9CA3AF', pride: '#EAB308', jealousy: '#84CC16',
  thankful: '#0EA5E9', excitement: '#F472B6', boredom: '#94A3B8', confusion: '#A78BFA'
};

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moodData, setMoodData] = useState([]);
  const [moodSummary, setMoodSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [diaryCount, setDiaryCount] = useState(0);
  const [questionOfDay, setQuestionOfDay] = useState('');
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [checkinsRes, summaryRes, diaryRes, streakRes, questionRes, notifRes] = await Promise.all([
        axios.get(`${API}/mood/checkins`),
        axios.get(`${API}/mood/summary`),
        axios.get(`${API}/diary/entries`),
        axios.get(`${API}/mood/streak`),
        axios.get(`${API}/mood/question-of-day`),
        axios.get(`${API}/notifications/settings`)
      ]);
      
      setMoodData(checkinsRes.data.checkins || []);
      setMoodSummary(summaryRes.data);
      setDiaryCount(diaryRes.data.entries?.length || 0);
      setStreak(streakRes.data);
      setQuestionOfDay(questionRes.data.question);
      setNotificationSettings(notifRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get(`${API}/mood/weekly-report`);
      setWeeklyReport(response.data);
      setShowWeeklyReport(true);
    } catch (error) {
      console.error('Error fetching weekly report:', error);
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
    <div className="space-y-6 animate-fade-in-up" data-testid="user-dashboard">
      {/* Welcome Section with Streak */}
      <div className="bg-gradient-to-br from-[#0F4C81] to-[#1E6CB5] rounded-3xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{greeting}</h1>
            <p className="text-white/80">
              {language === 'ar' ? 'كيف حالك النهاردة؟' : 'How are you feeling today?'}
            </p>
          </div>
          
          {/* Streak Display */}
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className={`w-6 h-6 ${streak?.current_streak > 0 ? 'text-orange-400' : 'text-white/50'}`} />
                <span className="text-3xl font-bold">{streak?.current_streak || 0}</span>
              </div>
              <p className="text-sm text-white/80">
                {language === 'ar' ? 'أيام متتالية' : 'Day Streak'}
              </p>
            </div>
            
            {streak?.weekly_badge && (
              <div className="bg-yellow-400/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-white/80">
                  {language === 'ar' ? 'شارة الأسبوع!' : 'Weekly Badge!'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Don't Break the Chain Message */}
        {!streak?.checked_in_today && streak?.current_streak > 0 && (
          <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm">
              {language === 'ar' 
                ? `🔥 لا تكسر السلسلة! لديك ${streak.current_streak} أيام متتالية` 
                : `🔥 Don't break the chain! You have a ${streak.current_streak}-day streak`}
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate('/mood-checkin')}
              className="bg-white text-[#0F4C81] hover:bg-white/90 rounded-full"
              data-testid="checkin-now-btn"
            >
              {language === 'ar' ? 'سجل الآن' : 'Check in now'}
            </Button>
          </div>
        )}
      </div>

      {/* Question of the Day */}
      <Card className="card-soft border-2 border-[#89CFF0]/30 bg-gradient-to-r from-[#F0F9FF] to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C81] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#0F4C81] font-medium mb-1">
                {language === 'ar' ? 'سؤال اليوم' : 'Question of the Day'}
              </p>
              <p className="text-lg text-slate-800 font-medium">{questionOfDay}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/diary')}
              className="text-[#0F4C81]"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-soft p-4" data-testid="stat-checkins">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
              <Smile className="w-5 h-5 text-[#0F4C81]" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{language === 'ar' ? 'التسجيلات' : 'Check-ins'}</p>
              <p className="text-xl font-bold text-slate-900">{moodSummary?.total_checkins || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-4" data-testid="stat-diary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('diary')}</p>
              <p className="text-xl font-bold text-slate-900">{diaryCount}</p>
            </div>
          </div>
        </Card>

        <Card className="card-soft p-4" data-testid="stat-longest-streak">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{language === 'ar' ? 'أطول سلسلة' : 'Best Streak'}</p>
              <p className="text-xl font-bold text-slate-900">{streak?.longest_streak || 0}</p>
            </div>
          </div>
        </Card>

        <Card 
          className="card-soft p-4 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={fetchWeeklyReport}
          data-testid="weekly-report-btn"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{language === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Report'}</p>
              <p className="text-sm font-medium text-[#10B981]">{language === 'ar' ? 'عرض' : 'View'} →</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification Reminder Card */}
      <Card className="card-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  {language === 'ar' ? 'تذكير يومي' : 'Daily Reminder'}
                </h3>
                <p className="text-sm text-slate-500">
                  {notificationSettings?.enabled 
                    ? (language === 'ar' ? `مفعل - ${notificationSettings.reminder_time}` : `Enabled - ${notificationSettings.reminder_time}`)
                    : (language === 'ar' ? 'غير مفعل' : 'Disabled')}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="rounded-xl"
            >
              <Clock className="w-4 h-4 me-2" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div className="h-56">
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
                                {t(payload[0].payload.feeling) || payload[0].payload.feeling}
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
              <div className="h-56 flex items-center justify-center text-slate-400">
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
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400">
                {language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Report Modal */}
      <Dialog open={showWeeklyReport} onOpenChange={setShowWeeklyReport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
              {language === 'ar' ? 'التقرير العاطفي الأسبوعي' : 'Weekly Emotional Report'}
            </DialogTitle>
          </DialogHeader>

          {weeklyReport && (
            <div className="space-y-6 mt-4">
              {/* Trend Message */}
              <div className={`p-4 rounded-xl ${
                weeklyReport.mood_trend === 'positive' ? 'bg-green-50 border border-green-200' :
                weeklyReport.mood_trend === 'negative' ? 'bg-amber-50 border border-amber-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`font-medium ${
                  weeklyReport.mood_trend === 'positive' ? 'text-green-800' :
                  weeklyReport.mood_trend === 'negative' ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  {weeklyReport.trend_message}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-[#0F4C81]">{weeklyReport.total_checkins}</p>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'تسجيلات' : 'Check-ins'}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{weeklyReport.positive_count}</p>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'إيجابي' : 'Positive'}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{weeklyReport.negative_count}</p>
                  <p className="text-sm text-slate-500">{language === 'ar' ? 'سلبي' : 'Challenging'}</p>
                </div>
              </div>

              {/* Dominant Mood */}
              {weeklyReport.dominant_mood && (
                <div className="p-4 bg-[#E0F2FE] rounded-xl">
                  <p className="text-sm text-[#0F4C81] mb-1">
                    {language === 'ar' ? 'المزاج السائد' : 'Dominant Mood'}
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    {t(weeklyReport.dominant_mood) || weeklyReport.dominant_mood}
                  </p>
                </div>
              )}

              {/* Feeling Distribution Bar Chart */}
              {weeklyReport.feeling_distribution && Object.keys(weeklyReport.feeling_distribution).length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-800 mb-3">
                    {language === 'ar' ? 'توزيع المشاعر' : 'Feeling Breakdown'}
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(weeklyReport.feeling_distribution).map(([name, value]) => ({
                        name: t(name) || name,
                        value,
                        fill: feelingColors[name] || '#94A3B8'
                      }))}>
                        <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={60} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {Object.entries(weeklyReport.feeling_distribution).map(([name], index) => (
                            <Cell key={`cell-${index}`} fill={feelingColors[name] || '#94A3B8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Streak Info */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="font-medium text-slate-800">
                      {language === 'ar' ? 'السلسلة الحالية' : 'Current Streak'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {weeklyReport.insights?.consistency}
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-orange-600">
                  {weeklyReport.streak?.current_streak || 0}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
