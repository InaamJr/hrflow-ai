'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Loader2,
  Bot,
  User,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  ShieldCheck,
  CornerDownLeft
} from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI HR assistant. Ask me anything about company policies, benefits, leave, or career development. I'll provide answers based on our actual policies and your employee data.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeSet, setEmployeeSet] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickQuestions = [
    "How much annual leave do I have?",
    "What are my benefits?",
    "How do I request a promotion?",
    "What's the remote work policy?",
  ];

  // --- Logic remains unchanged ---
  const handleSetEmployee = async () => {
    if (!employeeId.trim()) {
      alert('Please enter an employee ID');
      return;
    }
    setEmployeeSet(true);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `Great! I've loaded your employee profile. Now you can ask me questions about your leave, benefits, or any HR policies.`,
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async (question = input) => {
    if (!question.trim()) return;
    if (!employeeSet) {
      alert('Please set your employee ID first');
      return;
    }

    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          question
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.answer,
          metadata: {
            policies_used: data.context.policies_used,
            policies: data.context.policies,
            response_time_ms: data.metadata.response_time_ms,
            conversation_id: data.conversation_id
          },
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your question. Please try again or contact HR directly.",
          error: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageIndex, helpful) => {
    const message = messages[messageIndex];
    if (!message.metadata?.conversation_id) return;

    try {
      await fetch('/api/chat/message', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.metadata.conversation_id,
          helpful
        }),
      });

      setMessages(prev => prev.map((msg, i) => 
        i === messageIndex 
          ? { ...msg, feedback: helpful }
          : msg
      ));
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };
  // -----------------------------

  return (
    <div className="flex flex-col h-screen bg-[#030712] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.05] backdrop-blur-xl bg-black/40 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  HR Neural Assistant
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-gray-300 font-normal border border-white/5">v2.0</span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium">Online • RAG Active</p>
                </div>
              </div>
            </div>
          </div>

          {employeeSet && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-gray-300">Secure Session</span>
             </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        
        {/* State 1: Employee Setup (Login) */}
        {!employeeSet && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <User className="w-10 h-10 text-white relative z-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Identify Yourself</h2>
                <p className="text-gray-400 text-sm">Access your personalized HR portal securely</p>
              </div>

              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Employee UUID</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSetEmployee()}
                      placeholder="e.g. 4c732329-..."
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-all font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSetEmployee}
                    className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg shadow-white/5 active:scale-[0.98]"
                  >
                    Authenticate
                  </button>
                </div>
                
                <div className="mt-6 pt-5 border-t border-white/5">
                  <div className="flex items-start gap-3 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                    <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      <span className="font-semibold text-blue-100">Demo Mode:</span> Use any ID or try: <code className="bg-black/30 px-1.5 py-0.5 rounded border border-blue-500/30 select-all">4c732329-2cb5-481d-9ddd-f08b3de2328e</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Chat Interface */}
        {employeeSet && (
          <>
            {/* Scrollable Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-8 min-h-full pb-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 animate-in slide-in-from-bottom-2 duration-500 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.role === 'assistant' 
                        ? 'bg-[#1a1a1a] border border-white/10' 
                        : 'bg-gradient-to-br from-purple-500 to-blue-600'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-purple-400" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      <div className={`relative px-6 py-4 rounded-2xl shadow-sm ${
                        message.role === 'assistant'
                          ? 'bg-white/[0.03] border border-white/[0.08] rounded-tl-none text-gray-100'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none shadow-purple-900/20'
                      }`}>
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* RAG Metadata (Citations) */}
                        {message.metadata && message.metadata.policies_used > 0 && (
                          <div className="mt-5 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Sources</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {message.metadata.policies.map((policy, j) => (
                                <div key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-default group">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:animate-pulse" />
                                  <span className="text-xs text-purple-100 font-medium truncate max-w-[200px]">{policy.title}</span>
                                  <span className="text-[10px] text-purple-300 opacity-60 ml-1 border-l border-purple-500/30 pl-2">
                                    {Math.round(policy.similarity * 100)}% match
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
                               <div className="flex gap-3">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(message.metadata.response_time_ms / 1000).toFixed(2)}s</span>
                                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> GPT-4o</span>
                               </div>
                               
                               {/* Feedback Buttons */}
                               {!message.feedback && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleFeedback(i, true)} className="p-1 hover:text-green-400 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                                  <button onClick={() => handleFeedback(i, false)} className="p-1 hover:text-red-400 transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                                </div>
                               )}
                               {message.feedback !== undefined && (
                                  <span className={message.feedback ? "text-green-500" : "text-red-500"}>
                                    {message.feedback ? "Feedback: Helpful" : "Feedback: Not Helpful"}
                                  </span>
                               )}
                            </div>
                          </div>
                        )}
                        
                        {/* Error State */}
                        {message.error && (
                           <div className="mt-3 text-xs text-red-300 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                             System Error
                           </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 mt-2 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl rounded-tl-none px-6 py-4 flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-sm text-gray-400 font-medium">Analyzing company policies...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Input Dock */}
            <div className="relative z-20 pb-6 pt-2 px-4 bg-gradient-to-t from-[#030712] via-[#030712] to-transparent">
              <div className="max-w-3xl mx-auto">
                {/* Quick Prompts */}
                {messages.length === 1 && !isLoading && (
                  <div className="grid grid-cols-2 gap-2 mb-4 animate-in slide-in-from-bottom-4 duration-700">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 text-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                  <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 p-2 rounded-2xl shadow-2xl">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything about HR..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 min-h-[50px] max-h-[150px] focus:outline-none text-sm resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-3 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CornerDownLeft className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-gray-600 mt-3">
                    AI can make mistakes. Please check important info.
                  </p>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}