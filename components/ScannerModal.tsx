import React, { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOrders: Order[]) => void;
}

// Backend API URL
const API_BASE = 'http://localhost:8000';

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'config' | 'check_backend' | 'backend_error' | 'initializing' | 'qr_ready' | 'scanning' | 'syncing' | 'complete' | 'error'>('config');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Date State
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Polling ref
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setStep('config');
        setQrCode(null);
        setErrorMessage('');
        setIsDemoMode(false);
        setStatusMessage('');
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
      if (isDemoMode) return; // Demo mode handled separately

      try {
          const res = await fetch(`${API_BASE}/api/scrape/status`);
          if (!res.ok) throw new Error("Network response was not ok");
          
          const data = await res.json();
          
          if (data.status === 'INITIALIZING') setStep('initializing');
          
          if (data.status === 'QR_READY') {
              setStep('qr_ready');
              if (data.qr_code) setQrCode(data.qr_code);
          }
          
          if (data.status === 'SCANNING') {
              setStep('scanning');
              if (data.message) setStatusMessage(data.message);
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
          console.error("Polling connection lost", err);
          stopPolling();
          setStep('error');
          setErrorMessage("Connection to backend lost. Please ensure backend.py is running.");
      }
  };

  const fetchResults = async () => {
      try {
          const res = await fetch(`${API_BASE}/api/scrape/results`);
          const orders = await res.json();
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

  // --- DEMO MODE LOGIC ---
  const startDemoMode = () => {
      setIsDemoMode(true);
      setStep('initializing');
      
      setTimeout(() => {
          setStep('qr_ready');
          setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WeChatShopDemoLogin");
      }, 1500); 
  };

  const handleDemoSimulateScan = () => {
      setStep('scanning');
      setTimeout(() => {
          setStep('complete');
          const mockScrapedOrders: Order[] = Array.from({ length: 5 }).map((_, i) => ({
              id: `SCRAPED-${Date.now()}-${i}`,
              orderNumber: `WX-${Date.now()}-${i}`,
              customerName: `WeChat User ${Math.floor(Math.random() * 100)}`,
              productName: "Live Scraped Item (Demo)",
              amount: parseFloat((Math.random() * 500).toFixed(2)),
              status: OrderStatus.PAID,
              date: new Date().toISOString(),
              province: ["Shanghai", "Beijing", "Guangdong"][Math.floor(Math.random() * 3)]
          }));
          setTimeout(() => {
              onSuccess(mockScrapedOrders);
              onClose();
          }, 1500);
      }, 2000);
  };
  // -----------------------

  const handleStartProcess = async () => {
      if (isDemoMode) {
          startDemoMode();
          return;
      }

      setStep('check_backend');
      try {
          // Check backend health/start
          await fetch(`${API_BASE}/api/scrape/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ start_date: startDate, end_date: endDate })
          });
          setStep('initializing');
          startPolling();
      } catch (err) {
          setStep('backend_error');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-slate-900">Sync WeChat Data</h2>
            {isDemoMode && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Demo Mode</span>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 relative">
            
            {step === 'config' && (
                <div className="w-full space-y-4">
                    <div className="text-center mb-4">
                        <span className="text-sm font-medium text-slate-700">Select Date Range</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="demoToggle"
                                checked={isDemoMode}
                                onChange={(e) => setIsDemoMode(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="demoToggle" className="text-xs text-slate-600">Use Demo Mode (No backend required)</label>
                        </div>
                        <button 
                            onClick={handleStartProcess}
                            className={`w-full font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white ${isDemoMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            <span>{isDemoMode ? 'Start Demo Simulation' : 'Start Real Scraper'}</span>
                        </button>
                    </div>
                </div>
            )}

            {step === 'check_backend' && (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-sm text-slate-600">Connecting to local backend...</span>
                </div>
            )}

            {step === 'backend_error' && (
                <div className="text-center">
                    <div className="text-red-500 mb-2 flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">Backend Not Found</h3>
                    <p className="text-xs text-slate-500 mb-4 px-4">
                        Could not connect to <code>http://localhost:8000</code>. <br/>
                        Please ensure the Python backend is running.
                    </p>
                    <div className="bg-slate-800 text-slate-200 text-[10px] p-2 rounded text-left font-mono mb-4 mx-2">
                        pip install -r requirements.txt<br/>
                        uvicorn backend:app --reload
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => setStep('config')} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">Back</button>
                        <button onClick={handleStartProcess} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">Retry</button>
                    </div>
                </div>
            )}

            {step === 'initializing' && (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-sm font-medium text-slate-600">Launching Browser...</span>
                <span className="text-xs text-slate-400 mt-1">{isDemoMode ? 'Simulating...' : 'Please wait'}</span>
              </div>
            )}

            {step === 'qr_ready' && (
              <div className="flex flex-col items-center text-center w-full">
                 {qrCode ? (
                     <img 
                        src={qrCode} 
                        alt="WeChat QR Code" 
                        className="w-48 h-48 rounded-lg mb-4 border border-slate-200 object-contain bg-white"
                    />
                 ) : (
                    <div className="w-48 h-48 bg-slate-200 rounded-lg mb-4 animate-pulse"></div>
                 )}
                
                {isDemoMode ? (
                    <div className="mt-2">
                        <p className="text-sm font-bold text-slate-800 mb-2">Demo QR Code</p>
                        <button onClick={handleDemoSimulateScan} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-full font-medium transition-colors">
                            Click to Simulate Scan Success
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-bold text-slate-800 mb-1">Scan with WeChat</p>
                        <p className="text-xs text-slate-500">Video Accounts Shop Assistant</p>
                    </>
                )}
              </div>
            )}

            {step === 'scanning' && (
              <div className="flex flex-col items-center">
                <div className="text-green-600 mb-3 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p className="text-slate-800 font-medium">Login Verified!</p>
                <p className="text-slate-500 text-sm mt-1">{statusMessage || "Extracting order data..."}</p>
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
                <button onClick={() => setStep('config')} className="mt-4 text-indigo-600 text-sm hover:underline">Try Again</button>
               </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;