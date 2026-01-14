import React, { useEffect, useState, useRef } from 'react';
import { Order } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOrders: Order[]) => void;
}

// Backend API URL
const API_BASE = 'http://localhost:8000';

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'config' | 'initializing' | 'qr_ready' | 'scanning' | 'syncing' | 'complete' | 'error'>('config');
  const [progress, setProgress] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Date State
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Polling ref
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setStep('config');
        setProgress(0);
        setQrCode(null);
        setErrorMessage('');
        stopPolling();
    }
    return () => stopPolling();
  }, [isOpen]);

  const stopPolling = () => {
      if (pollTimer.current) {
          clearInterval(pollTimer.current);
          pollTimer.current = null;
      }
  };

  const startPolling = () => {
      stopPolling();
      pollTimer.current = setInterval(checkStatus, 2000);
  };

  const checkStatus = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/scrape/status`);
          const data = await res.json();
          
          if (data.status === 'INITIALIZING') setStep('initializing');
          
          if (data.status === 'QR_READY') {
              setStep('qr_ready');
              if (data.qr_code) setQrCode(data.qr_code);
          }
          
          if (data.status === 'SCANNING') {
              setStep('scanning');
          }
          
          if (data.status === 'COMPLETED') {
              stopPolling();
              setStep('complete');
              fetchResults();
          }
          
          if (data.status === 'ERROR') {
              stopPolling();
              setStep('error');
              setErrorMessage(data.error || 'Unknown error occurred');
          }

      } catch (err) {
          console.error("Polling failed", err);
      }
  };

  const fetchResults = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/scrape/results`);
          const orders = await res.json();
          // Transform simple JSON to Order type if needed, or assume backend matches
          const mappedOrders: Order[] = orders.map((o: any) => ({
             ...o,
             amount: Number(o.amount)
          }));
          
          setTimeout(() => {
              onSuccess(mappedOrders);
              onClose();
          }, 1500);
      } catch (err) {
          setErrorMessage("Failed to fetch results");
      }
  };

  const handleStartConfig = async () => {
      try {
          setStep('initializing');
          await fetch(`${API_BASE}/api/scrape/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ start_date: startDate, end_date: endDate })
          });
          startPolling();
      } catch (err) {
          setStep('error');
          setErrorMessage("Failed to start backend server. Is 'backend.py' running?");
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sync WeChat Data</h2>
          <p className="text-sm text-slate-500 mb-6">Connect to the backend scraper to update orders.</p>

          <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 relative">
            
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
                        <span>Start Scraper</span>
                    </button>
                </div>
            )}

            {step === 'initializing' && (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-sm font-medium text-slate-600">Launching Browser...</span>
                <span className="text-xs text-slate-400 mt-1">Please wait for the backend</span>
              </div>
            )}

            {step === 'qr_ready' && (
              <div className="flex flex-col items-center text-center w-full">
                 {qrCode ? (
                     <img 
                        src={qrCode} 
                        alt="WeChat QR Code" 
                        className="w-48 h-48 rounded-lg mb-4 border border-slate-200 object-contain"
                    />
                 ) : (
                    <div className="w-48 h-48 bg-slate-200 rounded-lg mb-4 animate-pulse"></div>
                 )}
                <p className="text-sm font-bold text-slate-800 mb-1">Scan to Login</p>
                <p className="text-xs text-slate-500">Open WeChat App > Discover > Scan</p>
              </div>
            )}

            {step === 'scanning' && (
              <div className="flex flex-col items-center">
                <div className="text-green-600 mb-3 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-slate-800 font-medium">Login Verified!</p>
                <p className="text-slate-500 text-sm mt-1">Extracting order data...</p>
              </div>
            )}

            {step === 'complete' && (
               <div className="flex flex-col items-center">
                <span className="text-indigo-600 font-bold text-lg">Sync Complete!</span>
                <p className="text-sm text-slate-500">Updating dashboard...</p>
               </div>
            )}

            {step === 'error' && (
               <div className="flex flex-col items-center text-center p-4">
                <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <span className="text-slate-800 font-bold">Error</span>
                <p className="text-xs text-red-600 mt-2 break-all">{errorMessage}</p>
                <button 
                    onClick={() => setStep('config')}
                    className="mt-4 text-indigo-600 text-sm hover:underline"
                >
                    Try Again
                </button>
               </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;