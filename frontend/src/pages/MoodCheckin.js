import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Check, Smile, Frown, Angry, Meh, Heart, Cloud, Sun, Moon, Star, Zap, ThumbsUp, PenLine } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const feelingIcons = {
  happiness: Sun,
  sadness: Cloud,
  anger: Zap,
  fear: Moon,
  anxiety: Meh,
  stress: Zap,
  calm: Star,
  love: Heart,
  loneliness: Cloud,
  hope: Sun,
  disappointment: Frown,
  frustration: Angry,
  guilt: Meh,
  shame: Frown,
  pride: ThumbsUp,
  jealousy: Meh,
  thankful: Heart,
  excitement: Star,
  boredom: Meh,
  confusion: Meh,
  custom: PenLine
};

const feelingColors = {
  happiness: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  sadness: { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' },
  anger: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  fear: { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
  anxiety: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  stress: { bg: '#FCE7F3', text: '#9D174D', border: '#EC4899' },
  calm: { bg: '#CCFBF1', text: '#115E59', border: '#14B8A6' },
  love: { bg: '#FFE4E6', text: '#9F1239', border: '#F43F5E' },
  loneliness: { bg: '#F3F4F6', text: '#374151', border: '#6B7280' },
  hope: { bg: '#CFFAFE', text: '#155E75', border: '#22D3EE' },
  disappointment: { bg: '#F3E8FF', text: '#6B21A8', border: '#A855F7' },
  frustration: { bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' },
  guilt: { bg: '#F5F5F4', text: '#44403C', border: '#78716C' },
  shame: { bg: '#F3F4F6', text: '#4B5563', border: '#9CA3AF' },
  pride: { bg: '#FEF9C3', text: '#854D0E', border: '#EAB308' },
  jealousy: { bg: '#ECFCCB', text: '#3F6212', border: '#84CC16' },
  thankful: { bg: '#E0F2FE', text: '#075985', border: '#0EA5E9' },
  excitement: { bg: '#FECDD3', text: '#9F1239', border: '#F472B6' },
  boredom: { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' },
  confusion: { bg: '#EDE9FE', text: '#6D28D9', border: '#A78BFA' },
  custom: { bg: '#E0F2FE', text: '#0F4C81', border: '#0F4C81' }
};

const MoodCheckin = () => {
  const { t, language } = useLanguage();
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [customFeeling, setCustomFeeling] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const feelings = [
    'happiness', 'sadness', 'anger', 'fear', 'anxiety', 'stress', 'calm', 'love',
    'loneliness', 'hope', 'disappointment', 'frustration', 'guilt', 'shame',
    'pride', 'jealousy', 'thankful', 'excitement', 'boredom', 'confusion'
  ];

  const handleFeelingSelect = (feeling) => {
    if (feeling === 'custom') {
      setShowCustomInput(true);
      setSelectedFeeling(null);
    } else {
      setShowCustomInput(false);
      setCustomFeeling('');
      setSelectedFeeling(feeling);
    }
  };

  const handleCustomFeelingSubmit = () => {
    if (customFeeling.trim().length >= 2) {
      setSelectedFeeling(`custom:${customFeeling.trim()}`);
      setShowCustomInput(false);
    } else {
      toast.error(language === 'ar' ? 'يرجى كتابة شعورك' : 'Please write your feeling');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFeeling) {
      toast.error(language === 'ar' ? 'يرجى اختيار شعور' : 'Please select a feeling');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/mood/checkin`, {
        feeling: selectedFeeling,
        note: note
      });
      
      setSuccess(true);
      toast.success(t('checkinSuccess'));
      
      setTimeout(() => {
        setSelectedFeeling(null);
        setCustomFeeling('');
        setShowCustomInput(false);
        setNote('');
        setSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayFeeling = () => {
    if (!selectedFeeling) return '';
    if (selectedFeeling.startsWith('custom:')) {
      return selectedFeeling.replace('custom:', '');
    }
    return t(selectedFeeling);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up" data-testid="checkin-success">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('checkinSuccess')}</h2>
          <p className="text-slate-500">
            {language === 'ar' ? 'شكراً لمشاركتك معنا' : 'Thank you for sharing with us'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up" data-testid="mood-checkin-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          {t('howAreYouFeeling')}
        </h1>
        <p className="text-slate-500 text-lg">
          {language === 'ar' ? 'اختر الشعور اللي بيوصف حالتك دلوقتي' : 'Select the feeling that describes how you feel right now'}
        </p>
      </div>

      {/* Feelings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {feelings.map((feeling) => {
          const Icon = feelingIcons[feeling] || Smile;
          const colors = feelingColors[feeling];
          const isSelected = selectedFeeling === feeling;
          
          return (
            <button
              key={feeling}
              onClick={() => handleFeelingSelect(feeling)}
              className={`feeling-card p-4 rounded-2xl border-2 transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-offset-2 ring-[#0F4C81] scale-105' 
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: colors.bg,
                borderColor: isSelected ? colors.border : 'transparent'
              }}
              data-testid={`feeling-${feeling}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="w-8 h-8" style={{ color: colors.text }} />
                <span className="text-sm font-medium text-center" style={{ color: colors.text }}>
                  {t(feeling)}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Feeling Option */}
        <button
          onClick={() => handleFeelingSelect('custom')}
          className={`feeling-card p-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${
            showCustomInput || selectedFeeling?.startsWith('custom:')
              ? 'ring-2 ring-offset-2 ring-[#0F4C81] scale-105 border-[#0F4C81] bg-[#E0F2FE]' 
              : 'border-slate-300 hover:border-[#0F4C81] hover:bg-[#F0F9FF] hover:scale-105'
          }`}
          data-testid="feeling-custom"
        >
          <div className="flex flex-col items-center gap-2">
            <PenLine className="w-8 h-8 text-[#0F4C81]" />
            <span className="text-sm font-medium text-center text-[#0F4C81]">
              {language === 'ar' ? 'شعور آخر' : 'Other Feeling'}
            </span>
          </div>
        </button>
      </div>

      {/* Custom Feeling Input */}
      {showCustomInput && (
        <Card className="card-soft animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <PenLine className="w-5 h-5 text-[#0F4C81]" />
              {language === 'ar' ? 'اكتب شعورك' : 'Write Your Feeling'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-600">
                {language === 'ar' ? 'ما هو شعورك الآن؟' : 'What are you feeling right now?'}
              </Label>
              <Input
                value={customFeeling}
                onChange={(e) => setCustomFeeling(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: مرتبك، متفائل، قلق...' : 'e.g., overwhelmed, hopeful, anxious...'}
                className="mt-2 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0]"
                data-testid="custom-feeling-input"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomFeelingSubmit()}
              />
            </div>
            <Button
              onClick={handleCustomFeelingSubmit}
              className="btn-secondary"
              disabled={customFeeling.trim().length < 2}
              data-testid="custom-feeling-submit"
            >
              {language === 'ar' ? 'تأكيد الشعور' : 'Confirm Feeling'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Custom Feeling Display */}
      {selectedFeeling?.startsWith('custom:') && (
        <div className="text-center p-4 bg-[#E0F2FE] rounded-2xl">
          <p className="text-[#0F4C81] font-medium">
            {language === 'ar' ? 'شعورك المختار: ' : 'Your feeling: '}
            <span className="font-bold">{getDisplayFeeling()}</span>
          </p>
        </div>
      )}

      {/* Note Section */}
      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">{t('addNote')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب أفكارك هنا...' : 'Write your thoughts here...'}
            className="min-h-[120px] rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0] resize-none"
            data-testid="mood-note-input"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedFeeling}
          className="btn-primary px-12 py-6 text-lg"
          data-testid="mood-submit-btn"
        >
          {loading ? t('loading') : t('save')}
        </Button>
      </div>
    </div>
  );
};

export default MoodCheckin;
