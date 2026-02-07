'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Globe, 
  DollarSign, 
  Calendar,
  Zap,
  CheckCircle2,
  Loader2,
  FileText,
  Download,
  ShieldCheck,
  Cpu,
  Terminal,
  ChevronRight
} from 'lucide-react';

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    department: '',
    country: 'SG',
    salaryUSD: '',
    equityShares: '',
    startDate: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Generating Employment Contracts',
    'Creating Employee Record in HRIS',
    'Encrypting & Saving to Database',
    'Initializing Tax & Compliance',
    'Dispatching Welcome Email',
    'Provisioning SSO & Access',
    'Finalizing Onboarding Sequence'
  ];

  const countries = [
    { code: 'SG', name: 'Singapore', emoji: '🇸🇬' },
    { code: 'UK', name: 'United Kingdom', emoji: '🇬🇧' },
    { code: 'US', name: 'United States', emoji: '🇺🇸' },
    { code: 'IN', name: 'India', emoji: '🇮🇳' },
    { code: 'UAE', name: 'United Arab Emirates', emoji: '🇦🇪' },
  ];

  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance'];
  
  const roles = [
    'Software Engineer',
    'Senior Software Engineer',
    'Product Manager',
    'Engineering Manager',
    'Designer',
    'Data Scientist',
    'DevOps Engineer'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      // Simulation of progress for UI effect
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(stepInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      const response = await fetch('/api/automation/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salaryUSD: parseInt(formData.salaryUSD),
          equityShares: parseInt(formData.equityShares || '0'),
        }),
      });

      const data = await response.json();
      
      clearInterval(stepInterval);
      setCurrentStep(steps.length);
      
      if (data.success) {
        // Add a small delay to let the user see the final step completion
        setTimeout(() => setResult(data), 500);
      } else {
        alert('Onboarding failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process onboarding');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadContract = (contract) => {
    const byteCharacters = atob(contract.download.buffer);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contract.download.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contract.download.filename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
       {/* Ambient Background Glows */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/[0.05] backdrop-blur-xl bg-black/40 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/"
                className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/[0.05]"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-white/[0.1]" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur opacity-40 animate-pulse" />
                  <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center border border-white/10">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-wide">Invisible Onboarding™</h1>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-gray-400 font-mono uppercase">System Ready</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-300 font-medium">Encrypted Pipeline</span>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center">
          
          {/* STATE 1: FORM */}
          {!result && !isProcessing && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Who are we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">onboarding</span> today?
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Enter the details below. Our AI will handle contracts, system access, and compliance in ~25 seconds.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                {/* Form Background Card */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent rounded-3xl blur-sm pointer-events-none" />
                <div className="relative bg-[#0a0a0a]/50 backdrop-blur-md rounded-3xl p-8 border border-white/[0.08] shadow-2xl">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <User className="w-4 h-4" /> Identity
                      </div>
                      
                      <div className="group relative">
                        <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                          placeholder="Sarah Chen"
                        />
                      </div>

                      <div className="group relative">
                        <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Work Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                          placeholder="sarah.chen@company.com"
                        />
                      </div>

                      <div className="group relative">
                         <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Location</label>
                         <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                              required
                              value={formData.country}
                              onChange={(e) => setFormData({...formData, country: e.target.value})}
                              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-blue-500/50 outline-none appearance-none cursor-pointer"
                            >
                              {countries.map(country => (
                                <option key={country.code} value={country.code} className="bg-gray-900">
                                  {country.emoji} {country.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronRight className="w-4 h-4 text-gray-600 rotate-90" />
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Role Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <Briefcase className="w-4 h-4" /> Position & Compensation
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group relative">
                           <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Department</label>
                           <select
                              required
                              value={formData.department}
                              onChange={(e) => setFormData({...formData, department: e.target.value})}
                              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-purple-500/50 outline-none appearance-none"
                           >
                              <option value="" className="bg-gray-900">Select...</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept} className="bg-gray-900">{dept}</option>
                              ))}
                           </select>
                        </div>
                        <div className="group relative">
                           <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Role Title</label>
                           <select
                              required
                              value={formData.role}
                              onChange={(e) => setFormData({...formData, role: e.target.value})}
                              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-purple-500/50 outline-none appearance-none"
                           >
                              <option value="" className="bg-gray-900">Select...</option>
                              {roles.map(role => (
                                <option key={role} value={role} className="bg-gray-900">{role}</option>
                              ))}
                           </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="group relative">
                            <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Annual Salary (USD)</label>
                            <div className="relative">
                               <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                               <input
                                  type="number"
                                  required
                                  value={formData.salaryUSD}
                                  onChange={(e) => setFormData({...formData, salaryUSD: e.target.value})}
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-purple-500/50 outline-none"
                                  placeholder="120,000"
                               />
                            </div>
                         </div>
                         <div className="group relative">
                            <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Equity (Optional)</label>
                            <div className="relative">
                               <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                               <input
                                  type="number"
                                  value={formData.equityShares}
                                  onChange={(e) => setFormData({...formData, equityShares: e.target.value})}
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-purple-500/50 outline-none"
                                  placeholder="Shares"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="group relative">
                        <label className="text-xs text-gray-400 ml-1 mb-1.5 block">Start Date</label>
                        <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                           <input
                              type="date"
                              required
                              value={formData.startDate}
                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:bg-white/[0.05] focus:border-purple-500/50 outline-none"
                           />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/[0.08] flex items-center justify-between">
                     <p className="text-xs text-gray-500">
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        Data is end-to-end encrypted
                     </p>
                     <button
                        type="submit"
                        className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-sm hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <span className="flex items-center gap-2">
                           <Zap className="w-4 h-4 fill-black" />
                           Initiate Onboarding
                        </span>
                     </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STATE 2: PROCESSING */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in zoom-in-95 duration-500">
               {/* Pulsing Core */}
               <div className="relative w-24 h-24 mb-12">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl animate-pulse opacity-50" />
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl animate-pulse delay-75 opacity-30" />
                  <div className="relative w-full h-full bg-black rounded-full border border-white/10 flex items-center justify-center z-10">
                     <Cpu className="w-10 h-10 text-white animate-spin-slow" />
                  </div>
               </div>

               <div className="w-full bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 overflow-hidden relative font-mono text-sm">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-loading-bar" />
                  
                  <div className="flex items-center gap-2 text-gray-500 mb-6 border-b border-white/5 pb-2">
                     <Terminal className="w-4 h-4" />
                     <span>System Log</span>
                  </div>

                  <div className="space-y-4">
                     {steps.map((step, i) => (
                        <div 
                           key={i}
                           className={`flex items-center gap-4 transition-all duration-300 ${
                              i === currentStep 
                                 ? 'opacity-100 translate-x-0' 
                                 : i < currentStep 
                                    ? 'opacity-40 translate-x-0'
                                    : 'opacity-0 -translate-x-4'
                           }`}
                        >
                           <div className={`w-2 h-2 rounded-full ${
                              i === currentStep ? 'bg-blue-400 animate-ping' : 
                              i < currentStep ? 'bg-green-500' : 'bg-gray-700'
                           }`} />
                           <span className={i === currentStep ? 'text-blue-300' : i < currentStep ? 'text-green-400' : 'text-gray-500'}>
                              {step}...
                           </span>
                           {i < currentStep && <span className="text-xs text-gray-600 ml-auto">Done</span>}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* STATE 3: SUCCESS RESULT */}
          {result && (
            <div className="animate-in slide-in-from-bottom-8 duration-700">
               <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                     <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-2">Onboarding Complete</h2>
                  <p className="text-green-400/80">Employee successfully provisioned in {result.automation.total_duration_seconds}s</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Digital ID Card */}
                  <div className="lg:col-span-1">
                     <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                           <Building2 className="w-24 h-24 text-white rotate-12" />
                        </div>
                        <div className="relative z-10">
                           <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center mb-4 text-2xl font-bold text-white shadow-lg">
                              {result.employee.name.charAt(0)}
                           </div>
                           <h3 className="text-xl font-bold text-white">{result.employee.name}</h3>
                           <p className="text-sm text-gray-300 mb-6">{result.employee.role}</p>
                           
                           <div className="space-y-2 text-xs text-gray-400 font-mono">
                              <div className="flex justify-between border-b border-white/10 pb-1">
                                 <span>ID</span>
                                 <span className="text-white">EMP-{Math.floor(Math.random() * 10000)}</span>
                              </div>
                              <div className="flex justify-between border-b border-white/10 pb-1">
                                 <span>Dept</span>
                                 <span className="text-white">{result.employee.department}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span>Email</span>
                                 <span className="text-white truncate max-w-[150px]">{result.employee.email}</span>
                              </div>
                           </div>
                        </div>
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                     </div>

                     {/* Stats */}
                     <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10 text-center">
                           <p className="text-2xl font-bold text-white">{result.contracts.length}</p>
                           <p className="text-[10px] text-gray-500 uppercase">Documents</p>
                        </div>
                        <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/10 text-center">
                           <p className="text-2xl font-bold text-green-400">100%</p>
                           <p className="text-[10px] text-gray-500 uppercase">Compliance</p>
                        </div>
                     </div>
                  </div>

                  {/* Documents List */}
                  <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
                     <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Generated Assets
                     </h3>
                     <div className="space-y-3">
                        {result.contracts.map((contract, i) => (
                           <div 
                              key={i}
                              className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10 transition-all"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-medium text-white capitalize">{contract.type} Contract</p>
                                    <p className="text-xs text-gray-500">PDF • {contract.file_size_kb} KB • Auto-signed</p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => downloadContract(contract)}
                                 className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors flex items-center gap-2"
                              >
                                 <Download className="w-3 h-3" />
                                 Download
                              </button>
                           </div>
                        ))}
                     </div>

                     <div className="mt-8 flex gap-4">
                        <button
                           onClick={() => {
                              setResult(null);
                              setFormData({
                                 fullName: '',
                                 email: '',
                                 role: '',
                                 department: '',
                                 country: 'SG',
                                 salaryUSD: '',
                                 equityShares: '',
                                 startDate: '',
                              });
                           }}
                           className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Process Next Employee
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
      
      {/* CSS for custom animations */}
      <style jsx global>{`
         @keyframes shimmer {
            100% { transform: translateX(100%); }
         }
         @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
         }
         .animate-shimmer {
            animation: shimmer 2s infinite;
         }
         .animate-loading-bar {
            animation: loading-bar 2s linear infinite;
         }
         .animate-spin-slow {
            animation: spin 3s linear infinite;
         }
      `}</style>
    </div>
  );
}