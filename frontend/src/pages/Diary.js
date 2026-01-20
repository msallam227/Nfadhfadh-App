import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { BookOpen, Calendar, ChevronDown, RefreshCw, Plus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Diary = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [reflectiveAnswer, setReflectiveAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    fetchEntries();
    fetchQuestions();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API}/diary/entries`);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/diary/questions`);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error(language === 'ar' ? 'يرجى كتابة شيء' : 'Please write something');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/diary/entry`, {
        content: content,
        reflective_question: selectedQuestion,
        reflective_answer: reflectiveAnswer
      });

      toast.success(t('entrySaved'));
      setContent('');
      setSelectedQuestion(null);
      setReflectiveAnswer('');
      fetchEntries();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getRandomQuestion = () => {
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      setSelectedQuestion(questions[randomIndex]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up" data-testid="diary-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('diary')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ar' ? 'سجل أفكارك ومشاعرك' : 'Record your thoughts and feelings'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="rounded-xl"
          data-testid="toggle-new-entry-btn"
        >
          <Plus className="w-4 h-4 me-2" />
          {language === 'ar' ? 'إدخال جديد' : 'New Entry'}
        </Button>
      </div>

      {/* New Entry Form */}
      {showNewEntry && (
        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0F4C81]" />
              {language === 'ar' ? 'إدخال جديد' : 'New Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Content */}
            <div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('writeYourThoughts')}
                className="min-h-[150px] rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0] resize-none"
                data-testid="diary-content-input"
              />
            </div>

            {/* Reflective Question Section */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-700">{t('reflectiveQuestion')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getRandomQuestion}
                  className="text-[#0F4C81] hover:bg-[#E0F2FE]"
                  data-testid="random-question-btn"
                >
                  <RefreshCw className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'سؤال جديد' : 'New Question'}
                </Button>
              </div>

              {selectedQuestion ? (
                <div className="space-y-3">
                  <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    {selectedQuestion}
                  </p>
                  <Textarea
                    value={reflectiveAnswer}
                    onChange={(e) => setReflectiveAnswer(e.target.value)}
                    placeholder={language === 'ar' ? 'إجابتك...' : 'Your answer...'}
                    className="min-h-[100px] rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0] resize-none"
                    data-testid="reflective-answer-input"
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  {language === 'ar' ? 'اضغط على "سؤال جديد" للحصول على سؤال تأملي' : 'Click "New Question" to get a reflective prompt'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className="btn-primary"
                data-testid="diary-submit-btn"
              >
                {loading ? t('loading') : t('save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Entries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">
          {language === 'ar' ? 'الإدخالات السابقة' : 'Previous Entries'}
        </h2>
        
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card 
                key={entry.id} 
                className="card-soft cursor-pointer"
                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                data-testid={`diary-entry-${entry.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.created_at).toLocaleDateString(
                        language === 'ar' ? 'ar-EG' : 'en-US',
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedEntry === entry.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  
                  <p className={`mt-3 text-slate-700 ${
                    expandedEntry === entry.id ? '' : 'line-clamp-3'
                  }`}>
                    {entry.content}
                  </p>
                  
                  {expandedEntry === entry.id && entry.reflective_question && (
                    <div className="mt-4 bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-slate-600">{entry.reflective_question}</p>
                      {entry.reflective_answer && (
                        <p className="text-slate-700">{entry.reflective_answer}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-soft">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {language === 'ar' ? 'لا توجد إدخالات بعد' : 'No entries yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Diary;
