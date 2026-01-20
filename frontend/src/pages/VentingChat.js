import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send, Plus, MessageCircle, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VentingChat = () => {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/chat/sessions`);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSessionHistory = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/chat/history/${sessionId}`);
      setMessages(response.data.messages || []);
      setCurrentSession(sessionId);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setDisclaimer('');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Add user message immediately
    const tempUserMsg = {
      id: Date.now(),
      user_message: userMessage,
      ai_response: null,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await axios.post(`${API}/chat/message`, {
        message: userMessage,
        session_id: currentSession
      });

      const { response: aiResponse, session_id, disclaimer: disc } = response.data;

      if (!currentSession) {
        setCurrentSession(session_id);
        fetchSessions();
      }

      setDisclaimer(disc);

      // Update the last message with AI response
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          ai_response: aiResponse
        };
        return updated;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temp message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6" data-testid="venting-chat-page">
      {/* Sessions Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Card className="card-soft h-full">
          <CardContent className="p-4 h-full flex flex-col">
            <Button
              onClick={startNewChat}
              className="w-full btn-secondary mb-4 flex items-center gap-2"
              data-testid="new-chat-btn"
            >
              <Plus className="w-4 h-4" />
              {t('newChat')}
            </Button>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.session_id}
                    onClick={() => fetchSessionHistory(session.session_id)}
                    className={`w-full p-3 rounded-xl text-start transition-colors ${
                      currentSession === session.session_id
                        ? 'bg-[#E0F2FE] text-[#0F4C81]'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    data-testid={`session-${session.session_id}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm truncate">
                        {new Date(session.last_message).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US'
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {session.message_count} {language === 'ar' ? 'رسائل' : 'messages'}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="card-soft flex-1 flex flex-col">
          {/* Disclaimer */}
          <div className="p-4 border-b border-slate-100 bg-amber-50 rounded-t-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {disclaimer || t('chatDisclaimer')}
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-[#0F4C81]" />
                  </div>
                  <p className="text-slate-500">
                    {t('startConversation')}
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-[#0F4C81] text-white p-4 rounded-2xl rounded-br-md">
                        <p className="whitespace-pre-wrap">{msg.user_message}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    {msg.ai_response && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-bl-md">
                          <p className="whitespace-pre-wrap">{msg.ai_response}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {!msg.ai_response && loading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('typeMessage')}
                className="flex-1 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#89CFF0]"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="btn-primary h-12 px-6"
                data-testid="chat-send-btn"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VentingChat;
