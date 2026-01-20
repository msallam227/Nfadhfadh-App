import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Lightbulb, Heart, Zap, Cloud, Sun, Moon, Star } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const feelingIcons = {
  anxiety: Cloud,
  stress: Zap,
  sadness: Moon,
  anger: Zap,
  loneliness: Cloud,
  fear: Moon
};

const feelingColors = {
  anxiety: { bg: '#FEF3C7', icon: '#F59E0B' },
  stress: { bg: '#FCE7F3', icon: '#EC4899' },
  sadness: { bg: '#E0E7FF', icon: '#6366F1' },
  anger: { bg: '#FEE2E2', icon: '#EF4444' },
  loneliness: { bg: '#F3F4F6', icon: '#6B7280' },
  fear: { bg: '#EDE9FE', icon: '#8B5CF6' }
};

const Strategies = () => {
  const { t, language } = useLanguage();
  const [strategies, setStrategies] = useState({});
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [loading, setLoading] = useState(true);

  const availableFeelings = ['anxiety', 'stress', 'sadness', 'anger', 'loneliness', 'fear'];

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await axios.get(`${API}/strategies`);
      setStrategies(response.data.strategies || {});
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-soft text-[#0F4C81] text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up" data-testid="strategies-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t('strategies')}
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'استراتيجيات بسيطة لمساعدتك على تحسين مزاجك' 
            : 'Simple strategies to help you shift your mood'}
        </p>
      </div>

      {/* Filter */}
      <div className="flex justify-center">
        <Select value={selectedFeeling || 'all'} onValueChange={(v) => setSelectedFeeling(v === 'all' ? null : v)}>
          <SelectTrigger className="w-64 h-12 rounded-xl" data-testid="feeling-filter">
            <SelectValue placeholder={language === 'ar' ? 'اختر شعوراً' : 'Select a feeling'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'كل المشاعر' : 'All Feelings'}</SelectItem>
            {availableFeelings.map((feeling) => (
              <SelectItem key={feeling} value={feeling}>{t(feeling)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Strategies Grid */}
      <div className="grid gap-6">
        {(selectedFeeling ? [selectedFeeling] : availableFeelings).map((feeling) => {
          const Icon = feelingIcons[feeling] || Lightbulb;
          const colors = feelingColors[feeling] || { bg: '#E0F2FE', icon: '#0F4C81' };
          const feelingStrategies = strategies[feeling] || [];

          return (
            <Card key={feeling} className="card-soft overflow-hidden" data-testid={`strategy-card-${feeling}`}>
              <CardHeader className="pb-4" style={{ backgroundColor: colors.bg }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: colors.icon }} />
                  </div>
                  <CardTitle className="text-xl text-slate-800">{t(feeling)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {feelingStrategies.map((strategy, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#0F4C81]">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 pt-1">{strategy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tip Section */}
      <Card className="card-soft bg-gradient-to-br from-[#0F4C81] to-[#1E6CB5] text-white">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'ar' ? 'نصيحة سريعة' : 'Quick Tip'}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {language === 'ar' 
                  ? 'جرب استراتيجية واحدة في كل مرة. لا تضغط على نفسك - الخطوات الصغيرة تؤدي إلى تغييرات كبيرة.'
                  : "Try one strategy at a time. Don't pressure yourself - small steps lead to big changes."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Strategies;
