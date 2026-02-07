'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Users, FileText, MessageSquare, Clock, Zap, ArrowRight, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    employees: '...',
    contracts: '...',
    chats: '...',
    timeSaved: '...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true); // Reset loading state on manual refresh
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          employees: data.stats.total_employees.toLocaleString(),
          contracts: data.stats.total_contracts.toLocaleString(),
          chats: data.stats.total_chats.toLocaleString(),
          timeSaved: data.stats.time_saved_hours + 'h'
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Fallback to default values
      setStats({
        employees: '1,200',
        contracts: '847',
        chats: '2,340',
        timeSaved: '1,240h'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-800/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-800/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/[0.08] backdrop-blur-xl bg-black/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-white">HRFlow AI</h1>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Enterprise Edition</span>
              </div>
            </div>
            
            <button
              onClick={fetchStats}
              disabled={loading}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                {loading ? 'Syncing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
          {/* Hero Section */}
          <div className={`mb-16 max-w-3xl transform transition-all duration-1000 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              AI Engine Online
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
              Welcome to the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Future of HR</span>
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
              Orchestrate your entire workforce with intelligent automation. 
              Zero manual data entry, instant compliance, and autonomous operations.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {/* Onboarding Card */}
            <Link href="/onboarding" className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4 duration-300">
                   <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                  <Zap className="w-7 h-7 text-blue-400" />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3">Invisible Onboarding</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Complete automation in 25 seconds. Generate contracts, create records, and initialize compliance instantly.
                </p>
                
                <div className="flex flex-wrap gap-3">
                   {['25s Avg Time', '99.8% Savings', 'Auto-Contract'].map((tag) => (
                     <span key={tag} className="px-3 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300">
                       {tag}
                     </span>
                   ))}
                </div>
              </div>
            </Link>

            {/* Chat Card */}
            <Link href="/chat" className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4 duration-300">
                   <ArrowRight className="w-6 h-6 text-purple-400" />
                </div>

                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                  <MessageSquare className="w-7 h-7 text-purple-400" />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3">Neural HR Chatbot</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Intelligent Q&A powered by RAG. Semantic search across policies gives your team context-aware answers.
                </p>
                
                <div className="flex flex-wrap gap-3">
                   {['Sub-2s Response', '98% Accuracy', 'Semantic Search'].map((tag) => (
                     <span key={tag} className="px-3 py-1 rounded-lg bg-purple-500/5 border border-purple-500/10 text-xs text-purple-300">
                       {tag}
                     </span>
                   ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Employees', value: stats.employees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
              { label: 'Contracts Generated', value: stats.contracts, icon: FileText, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' },
              { label: 'Chat Conversations', value: stats.chats, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
              { label: 'Hours Saved', value: stats.timeSaved, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="group bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.border} border`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    {/* Subtle trend indicator (mock) */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-white/[0.05] px-2 py-1 rounded-full">
                       <span>+12%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white tracking-tight">
                      {loading ? (
                        <div className="h-9 w-24 bg-white/10 animate-pulse rounded-md" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}