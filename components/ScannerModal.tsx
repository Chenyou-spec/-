import React, { useEffect, useState } from 'react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'config' | 'initializing' | 'qr_ready' | 'scanning' | 'syncing' | 'complete'>('config');
  const [progress, setProgress] = useState(0);
  
  // Date State
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isOpen) {
        setStep('config');
        setProgress(0);
        return;
    }
  }, [isOpen]);

  // Handle transition from Initializing to QR Ready
  useEffect(() => {
    if (step === 'initializing') {
        const timer = setTimeout(() => setStep('qr_ready'), 1500);
        return () => clearTimeout(timer);
    }
  }, [step]);

  const handleStartConfig = () => {
      setStep('initializing');
  };

  const handleSimulateScan = () => {
    setStep('scanning');
    // Simulate Playwright detecting scan and starting extraction
    setTimeout(() => {
        setStep('syncing');
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStep('complete');
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 1000);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sync WeChat Data</h2>
          <p className="text-sm text-slate-500 mb-6">Connect to the backend scraper to update orders.</p>

          <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4">
            
            {step === 'config' && (
                <div className="w-full space-y-4">
                    <div className="text-center mb-4">
                        <span className="text-sm font-medium text-slate-700">Select Date Range</span>
                        <p className="text-xs text-slate-400">Specify which orders to scrape.</p>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleStartConfig}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Initialize Scraper</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                </div>
            )}

            {step === 'initializing' && (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-sm font-medium text-slate-600">Initializing Playwright...</span>
                <span className="text-xs text-slate-400 mt-1">Applying filters: {startDate} to {endDate}</span>
              </div>
            )}

            {step === 'qr_ready' && (
              <div className="flex flex-col items-center text-center">
                 <img 
                    src="https://picsum.photos/200/200?grayscale" 
                    alt="Mock QR Code" 
                    className="w-48 h-48 rounded-lg mb-4 mix-blend-multiply border border-slate-200"
                />
                <p className="text-sm font-medium text-slate-700 mb-4">Scan using WeChat App</p>
                <button 
                    onClick={handleSimulateScan}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium text-sm transition-colors"
                >
                    Simulate "Scan Success"
                </button>
              </div>
            )}

            {step === 'scanning' && (
              <div className="flex flex-col items-center">
                <div className="text-green-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-slate-800 font-medium">Scan Verified</p>
                <p className="text-slate-500 text-sm">Navigating to Order Center...</p>
              </div>
            )}

            {step === 'syncing' && (
              <div className="w-full px-8">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Downloading Orders...</span>
                    <span className="text-sm text-slate-500">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
              </div>
            )}

            {step === 'complete' && (
               <div className="flex flex-col items-center">
                <span className="text-indigo-600 font-bold text-lg">Sync Complete!</span>
               </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;