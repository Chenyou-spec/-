import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ShoppingBag, Sparkles, RefreshCw, Settings } from './components/Icons';
import StatCard from './components/StatCard';
import { RevenueTrendChart, TopProductsChart, GeoDistChart } from './components/SalesCharts';
import ScannerModal from './components/ScannerModal';
import { generateMockOrders, processStats } from './services/mockData';
import { analyzeSalesData } from './services/geminiService';
import { Order, OrderStatus, AppView } from './types';
import Markdown from 'react-markdown';

function App() {
  // State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [scriptTab, setScriptTab] = useState<'scraper' | 'analyzer'>('scraper');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Initial Load
  useEffect(() => {
    // Load some initial mock data
    const initialData = generateMockOrders(50); // Start with 50 orders
    setOrders(initialData);
    setLastSync(new Date());
  }, []);

  // Derived Statistics
  const stats = useMemo(() => processStats(orders), [orders]);
  
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;

  // Handlers
  const handleSyncSuccess = () => {
    // Simulate adding new orders after "Scraping"
    const newOrders = generateMockOrders(15);
    setOrders(prev => [...newOrders, ...prev]);
    setLastSync(new Date());
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSalesData(stats.salesTrend, stats.topProducts, stats.geoStats, aiPrompt);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const scraperCode = `import random
import time
import csv
import os
from playwright.sync_api import sync_playwright

# FILE: scraper.py
# ----------------
class WeChatShopScraper:
    def __init__(self):
        self.base_url = "https://channels.weixin.qq.com/"
        self.state_file = "auth_state.json"
        
    def run(self, start_date=None, end_date=None):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(storage_state=self.state_file) if os.path.exists(self.state_file) else browser.new_context()
            page = context.new_page()
            
            # Login Logic & QR Scan ...
            
            # Apply Date Filter if provided
            if start_date and end_date:
                print(f"Filtering orders from {start_date} to {end_date}")
                # Example: Fill date inputs on the order page
                # page.fill('input[name="startTime"]', start_date)
                # page.fill('input[name="endTime"]', end_date)
                # page.click('button:has-text("Search")')
            
            # Navigate to Orders ...
            # Extract Data Loop ...
            
            # Save to CSV
            with open('orders.csv', 'w') as f:
                writer = csv.writer(f)
                writer.writerow(['order_id', 'product_name', 'price', 'status', 'order_time', 'address'])
                # writer.writerows(data)
`;

  const analyzerCode = `import pandas as pd
import json

# FILE: analyzer.py
# -----------------
class ShopAnalyzer:
    def __init__(self, csv_file='orders.csv'):
        self.csv_file = csv_file
        self.df = None

    def load_and_clean_data(self):
        self.df = pd.read_csv(self.csv_file)
        
        # 1. Clean Price
        self.df['price'] = pd.to_numeric(self.df['price'].astype(str).str.replace(r'[¥,]', '', regex=True), errors='coerce').fillna(0)
        
        # 2. Clean Date
        self.df['order_time'] = pd.to_datetime(self.df['order_time'])
        
        # 3. Extract Province
        self.df['province'] = self.df['address'].apply(lambda x: x[:3] if isinstance(x, str) else 'Unknown')

    def generate_report(self):
        # Stats
        total_sales = self.df['price'].sum()
        
        # Trends
        daily = self.df.groupby(self.df['order_time'].dt.date)['price'].sum().reset_index()
        
        return {
            "summary": { "total_sales": total_sales },
            "trends": daily.to_dict('records')
        }
`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10 transition-all duration-300">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>ShopData AI</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.DASHBOARD ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentView(AppView.ORDERS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.ORDERS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Orders</span>
          </button>

          <button 
            onClick={() => setCurrentView(AppView.AI_INSIGHTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.AI_INSIGHTS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span>AI Insights</span>
          </button>
          
           <button 
            onClick={() => setCurrentView(AppView.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === AppView.SETTINGS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Scraper Status</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-white">Ready</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {currentView === AppView.DASHBOARD && 'Dashboard Overview'}
                    {currentView === AppView.ORDERS && 'Order Management'}
                    {currentView === AppView.AI_INSIGHTS && 'AI Data Analyst'}
                    {currentView === AppView.SETTINGS && 'System Settings'}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Last synced: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                </p>
            </div>
            
            <button 
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                <RefreshCw className="w-4 h-4" />
                <span>Sync Data</span>
            </button>
        </header>

        {/* DASHBOARD VIEW */}
        {currentView === AppView.DASHBOARD && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Revenue" value={`¥${totalRevenue.toLocaleString()}`} trend="12.5%" trendUp={true} />
                    <StatCard title="Total Orders" value={orders.length} trend="8.2%" trendUp={true} />
                    <StatCard title="Pending Orders" value={pendingOrders} trend="2.1%" trendUp={false} />
                    <StatCard title="Avg. Order Value" value={`¥${(totalRevenue / orders.length || 0).toFixed(0)}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <RevenueTrendChart data={stats.salesTrend} />
                    </div>
                    <div>
                        <GeoDistChart data={stats.geoStats} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopProductsChart data={stats.topProducts} />
                    
                    {/* Mini AI Summary Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <h3 className="font-bold text-lg">AI Quick Insight</h3>
                            </div>
                            <p className="text-indigo-100 leading-relaxed">
                                Based on your current trajectory, your top performer <strong>{stats.topProducts[0]?.name}</strong> accounts for 
                                a significant portion of revenue. Consider restocking immediately.
                            </p>
                        </div>
                        <button 
                            onClick={() => setCurrentView(AppView.AI_INSIGHTS)}
                            className="mt-6 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors w-max"
                        >
                            Ask for detailed report →
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ORDERS VIEW */}
        {currentView === AppView.ORDERS && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-xs">{order.orderNumber}</td>
                                    <td className="p-4">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-800">{order.productName}</td>
                                    <td className="p-4">{order.customerName}</td>
                                    <td className="p-4">¥{order.amount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${order.status === OrderStatus.PAID ? 'bg-green-100 text-green-700' : 
                                              order.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-700' :
                                              order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* AI INSIGHTS VIEW */}
        {currentView === AppView.AI_INSIGHTS && (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Ask Gemini about your shop</h2>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="E.g., What is the trend for Silk Dresses this weekend?"
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button 
                            onClick={handleAIAnalysis}
                            disabled={isAnalyzing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Analyze
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {aiAnalysis && (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
                        <div className="prose prose-indigo max-w-none">
                            <Markdown>{aiAnalysis}</Markdown>
                        </div>
                    </div>
                )}
                
                {!aiAnalysis && (
                    <div className="text-center py-12 text-slate-400">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Enter a query above to generate an analysis based on your {orders.length} orders.</p>
                    </div>
                )}
            </div>
        )}
        
        {/* SETTINGS VIEW */}
        {currentView === AppView.SETTINGS && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">System Configuration</h2>
                    
                    <div className="mb-6 flex space-x-2 border-b border-slate-100 pb-1">
                        <button 
                            onClick={() => setScriptTab('scraper')}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${scriptTab === 'scraper' ? 'bg-slate-100 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            1. Data Scraper (Playwright)
                        </button>
                        <button 
                             onClick={() => setScriptTab('analyzer')}
                             className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${scriptTab === 'analyzer' ? 'bg-slate-100 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            2. Data Analyzer (Pandas)
                        </button>
                    </div>

                    <div className="space-y-6">
                        {scriptTab === 'scraper' ? (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-indigo-700 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Step 1: Scrape Orders
                                </h3>
                                <p className="text-sm text-slate-600 mt-2 mb-4">
                                    Run this script to auto-login to WeChat Shop and save the order list to <code>orders.csv</code>.
                                </p>
                                <div className="relative">
                                    <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs overflow-x-auto font-mono h-64">
                                        {scraperCode}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-indigo-700 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Step 2: Analyze Data
                                </h3>
                                <p className="text-sm text-slate-600 mt-2 mb-4">
                                    Run this script to process <code>orders.csv</code> using Pandas and generate a JSON report.
                                </p>
                                <div className="relative">
                                    <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-xs overflow-x-auto font-mono h-64">
                                        {analyzerCode}
                                    </pre>
                                </div>
                            </div>
                        )}
                        
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                            <strong>Note:</strong> These scripts must be run in your local Python environment. The web dashboard currently uses mock data for demonstration.
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* Scraper Modal */}
      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleSyncSuccess}
      />
    </div>
  );
}

export default App;