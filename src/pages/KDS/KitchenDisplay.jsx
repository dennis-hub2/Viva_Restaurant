import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  BarChart3, 
  Settings, 
  Search, 
  Printer, 
  Flame,
  Check,
  X,
  ChevronRight,
  Maximize2,
  FileText
} from 'lucide-react';

function OrderCard({ order, onAction, currentTime }) {
  const isNew = order.status === 'new';
  const isDineIn = order.type?.toLowerCase() === 'dine in';
  const items = order.items || [];

  const formatElapsedTime = (start) => {
    if (!start) return "00:00";
    const startDate = start instanceof Timestamp ? start.toDate() : new Date(start);
    const diff = Math.floor((currentTime - startDate) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimeInStage = (start) => {
    if (!start) return "0m";
    const startDate = start instanceof Timestamp ? start.toDate() : new Date(start);
    const diff = Math.floor((currentTime - startDate) / 60000);
    return `${diff}m`;
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'new': return { label: 'NEW', color: 'bg-[#0e2b1a] text-[#2ecc71]' };
      case 'progress': return { label: 'PREPPING', color: 'bg-[#0a1f3a] text-[#4fa8ff]' };
      case 'completed': return { label: 'COMPLETED', color: 'bg-[#1a1a1a] text-white' };
      default: return { label: 'ORDER', color: 'bg-[#1a1a1a] text-[#555]' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const stageStartTime = order.statusUpdatedAt || order.createdAt || order.time;

  return (
    <div 
      onClick={() => onAction(order)}
      className={`group relative bg-[#161616] rounded-xl border border-[#222] p-4 cursor-pointer transition-all hover:bg-[#1c1c1c] hover:border-[#333] flex flex-col justify-between shadow-lg ${
        order.status === 'progress' ? 'border-t-2 border-t-[#4fa8ff]' : 
        (order.type?.toLowerCase() === 'dine in' ? 'border-l-2 border-l-[#2ecc71]' : 'border-l-2 border-l-[#f5a623]')
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-lg font-bold text-white leading-none">#{order.id.slice(-4).toUpperCase()}</span>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col justify-center py-2 space-y-1">
        {items.length > 0 ? (
          items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="font-mono text-[10px] text-[#555] font-bold">{item.qty}x</span>
              <span className="text-sm font-bold text-[#bbb] leading-tight truncate uppercase">{item.name}</span>
            </div>
          ))
        ) : (
          <p className="text-xs font-bold text-red-900/50 uppercase italic tracking-widest">No items found</p>
        )}
        {items.length > 3 && (
          <p className="text-[10px] font-black text-[#333] uppercase tracking-widest pl-5">
            + {items.length - 3} more
          </p>
        )}
      </div>

      <div className="flex justify-between items-end shrink-0 pt-2 border-t border-white/5 mt-1">
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#444]">
          <Clock size={10} />
          {getTimeInStage(stageStartTime)}
        </div>
        {order.status === 'progress' && (
          <div className="text-[#4fa8ff] flex items-center gap-1 animate-pulse">
            <Flame size={12} />
            <span className="font-mono text-xs font-bold">
              {formatElapsedTime(stageStartTime)}
            </span>
          </div>
        )}
      </div>
      
      <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 size={16} className="text-[#2ecc71]" />
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveTab] = useState('ORDERS');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("status", "in", ["new", "progress"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      liveOrders.sort((a, b) => {
        const priority = { 'new': 1, 'progress': 2 };
        const statusA = priority[a.status] || 99;
        const statusB = priority[b.status] || 99;
        if (statusA !== statusB) return statusA - statusB;
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      });
      setOrders(liveOrders);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("status", "==", "completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allCompleted = snapshot.docs.map(doc => {
        const data = doc.data();
        const compDate = data.completedAt instanceof Timestamp ? data.completedAt.toDate() : new Date(data.completedAt || Date.now());
        return {
          id: doc.id,
          ...data,
          completedAtRaw: data.completedAt,
          displayTime: compDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        };
      });
      allCompleted.sort((a, b) => (b.completedAtRaw?.seconds || 0) - (a.completedAtRaw?.seconds || 0));
      setCompletedList(allCompleted.slice(0, 50));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      const updateData = { status: newStatus, statusUpdatedAt: Timestamp.now() };
      if (newStatus === 'progress') updateData.cookStartedAt = Timestamp.now();
      if (newStatus === 'completed') updateData.completedAt = Timestamp.now();
      await updateDoc(orderRef, updateData);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const filteredOrders = orders.filter(o => o.id.includes(searchQuery));

  const renderMainContent = () => {
    let displayOrders = [];
    let emptyLabel = "IDLE";

    switch(activeNav) {
      case 'ORDERS':
        displayOrders = filteredOrders;
        emptyLabel = "NO ACTIVE ORDERS";
        break;
      case 'PREP':
        displayOrders = filteredOrders.filter(o => o.status === 'progress');
        emptyLabel = "NOTHING IN PREP";
        break;
      case 'HISTORY':
        const filteredCompleted = completedList.filter(o => o.id.includes(searchQuery));
        return (
          <div className="flex-1 p-3 grid grid-cols-2 lg:grid-cols-4 grid-rows-3 gap-3 overflow-hidden bg-[#0c0c0c]">
            {filteredCompleted.slice(0, 12).map(order => (
              <OrderCard key={order.id} order={order} onAction={() => setSelectedOrder(order)} currentTime={currentTime} />
            ))}
            {Array.from({ length: Math.max(0, 12 - filteredCompleted.length) }).map((_, i) => (
              <div key={`empty-hist-${i}`} className="rounded-xl border border-[#1a1a1a] border-dashed flex items-center justify-center opacity-10">
                <span className="text-[8px] font-black tracking-[3px] text-[#333]">VACANT</span>
              </div>
            ))}
          </div>
        );
      case 'RECEIPTS':
        return (
          <div className="flex-1 p-6 bg-[#0c0c0c] overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="grid grid-cols-5 px-4 py-2 text-[10px] font-black text-[#444] uppercase tracking-widest border-b border-[#1a1a1a]">
                <span>Order Ref</span>
                <span>Time</span>
                <span>Type</span>
                <span>Items</span>
                <span className="text-right">Status</span>
              </div>
              {[...orders, ...completedList].filter(o => o.id.includes(searchQuery)).slice(0, 50).map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrder(o)}
                  className="grid grid-cols-5 px-4 py-4 bg-[#161616] border border-[#222] rounded-xl items-center cursor-pointer hover:bg-[#1c1c1c] transition-colors"
                >
                  <span className="font-mono text-sm font-bold text-white">#{o.id.slice(-4).toUpperCase()}</span>
                  <span className="text-xs text-[#666]">{o.displayTime || o.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'RECENT'}</span>
                  <span className="text-[10px] font-black text-[#888] uppercase">{o.type || 'ORDER'}</span>
                  <span className="text-xs text-[#aaa] truncate pr-4">{o.items?.[0]?.name || '...'}</span>
                  <div className="text-right">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      o.status === 'completed' ? 'bg-white/5 text-white' : 
                      o.status === 'progress' ? 'bg-[#0a1f3a] text-[#4fa8ff]' : 'bg-[#0e2b1a] text-[#2ecc71]'
                    }`}>
                      {o.status?.toUpperCase() || 'SERVED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }

    return (
      <div className="flex-1 p-3 grid grid-cols-2 lg:grid-cols-4 grid-rows-3 gap-3 overflow-hidden bg-[#0c0c0c]">
        {displayOrders.slice(0, 12).map(order => (
          <OrderCard key={order.id} order={order} onAction={() => setSelectedOrder(order)} currentTime={currentTime} />
        ))}
        {Array.from({ length: Math.max(0, 12 - displayOrders.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="rounded-xl border border-[#1a1a1a] border-dashed flex items-center justify-center opacity-10">
            <span className="text-[8px] font-black tracking-[3px] text-[#333]">{emptyLabel}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-[#2ecc71] font-black animate-pulse text-2xl tracking-[0.4em] uppercase">SYSTEM READY</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0e0e0e] text-[#e8e8e8] flex flex-col font-sans overflow-hidden select-none">
      {/* TOPBAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e1e] bg-[#111] shrink-0">
        <div className="text-[12px] font-bold tracking-[3px] text-white">
          <span className="text-[#2ecc71]">VIVA</span> | KDS TERMINAL
        </div>
        <div className="font-mono text-xl font-semibold text-white tracking-tighter tabular-nums">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0e2b1a] border border-[#2ecc71]/30 text-[#2ecc71] text-[10px] px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse"></div>
            ONLINE
          </div>
          <Settings size={16} className="text-[#444] cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[100px] bg-[#111] border-r border-[#1e1e1e] flex flex-col py-4 shrink-0">
          {[
            { id: 'ORDERS', icon: <LayoutDashboard size={18} /> },
            { id: 'PREP', icon: <Clock size={18} /> },
            { id: 'HISTORY', icon: <CheckCircle2 size={18} /> },
            { id: 'RECEIPTS', icon: <FileText size={18} /> },
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer text-[8px] font-bold tracking-widest transition-all ${
                activeNav === item.id ? 'text-[#2ecc71] bg-[#0e2b1a]' : 'text-[#444] hover:text-[#888]'
              }`}
            >
              {item.icon}
              {item.id}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        {renderMainContent()}

        {/* RECENT PANEL */}
        <div className="w-[160px] bg-[#111] border-l border-[#1e1e1e] flex flex-col shrink-0 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-[#1e1e1e]">
            <span className="text-[9px] font-bold tracking-widest text-[#555]">RECENT</span>
            <span className="bg-[#2b1e0a] text-[#f5a623] text-[9px] font-bold px-2 py-0.5 rounded-full">
              {completedList.length}
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar p-2">
            {completedList.slice(0, 15).map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedOrder(item)}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 animate-in slide-in-from-right-2 cursor-pointer hover:bg-white/10"
              >
                <span className="font-mono text-[10px] text-[#aaa]">#{item.id.slice(-4).toUpperCase()}</span>
                <span className="text-[8px] text-[#444] font-bold">{item.displayTime}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowAllHistory(true)}
            className="w-full p-3 bg-[#1a1a1a] border-t border-[#333] text-[#aaa] rounded-none text-[10px] tracking-widest font-black uppercase hover:text-[#2ecc71] transition-colors"
          >
            VIEW ALL
          </button>
        </div>
      </div>

      {/* FULL HISTORY MODAL */}
      {showAllHistory && (
        <div 
          onClick={() => setShowAllHistory(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-12 bg-black/90 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0e0e0e] w-full max-w-4xl h-full max-h-[80vh] rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden cursor-default animate-in zoom-in-95"
          >
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#111]">
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-[#555] mb-1 uppercase">Kitchen Archive</p>
                <h2 className="text-4xl font-black text-white tracking-tighter italic">SERVED ORDERS</h2>
              </div>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={24} className="text-[#666]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {completedList.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedOrder(item)}
                    className="bg-[#161616] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 shadow-xl cursor-pointer hover:bg-[#1c1c1c] hover:border-[#333] transition-all group"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0e2b1a] border border-[#2ecc71] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Check size={16} className="text-[#2ecc71]" strokeWidth={4} />
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-2xl font-black text-white mb-1">#{item.id.slice(-4).toUpperCase()}</p>
                      <p className="text-[10px] font-black text-[#444] uppercase tracking-widest">{item.displayTime}</p>
                    </div>
                  </div>
                ))}
              </div>
              {completedList.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <span className="text-9xl mb-4">🗄️</span>
                  <p className="text-2xl font-black uppercase tracking-widest">No history yet</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-[#111] border-t border-white/10 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="text-left">
                  <p className="text-[8px] font-black text-[#555] uppercase tracking-widest">Total Served</p>
                  <p className="text-2xl font-black text-[#2ecc71] tabular-nums">{completedList.length}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="px-10 py-4 bg-white text-black font-black rounded-2xl text-xs tracking-widest uppercase hover:bg-[#2ecc71] transition-all shadow-lg active:scale-95"
              >
                Return to Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center gap-6 px-6 py-2 border-t border-[#1a1a1a] bg-[#111] shrink-0">
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-1.5">
          <Search size={14} className="text-[#444]" />
          <input 
            placeholder="ORDER ID" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] text-[#888] w-24 font-bold tracking-widest"
          />
        </div>
        <div className="flex gap-8">
          <StatItem label="WAITING" value={orders.filter(o => o.status === 'new').length} color="text-[#2ecc71]" />
          <StatItem label="PREPPING" value={orders.filter(o => o.status === 'progress').length} color="text-[#4fa8ff]" />
          <StatItem label="AVG TIME" value="12:45" color="text-[#a78bfa]" />
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-[#444]">
          <div className="w-2 h-2 rounded-full bg-[#2ecc71] shadow-[0_0_8px_rgba(46,204,113,0.4)]"></div>
          PRINTER STATUS: READY
        </div>
      </div>

      {/* ORDER DETAIL POPUP */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] w-full max-w-lg rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className={`p-6 flex justify-between items-start ${
              selectedOrder.type?.toLowerCase() === 'dine in' ? 'bg-[#2ecc71]/10' : 'bg-[#f5a623]/10'
            }`}>
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-[#555] mb-1 uppercase">Order Details</p>
                <h2 className="text-4xl font-black text-white tracking-tighter">#{selectedOrder.id.slice(-4).toUpperCase()}</h2>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-[#666]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${
                  selectedOrder.type?.toLowerCase() === 'dine in' ? 'bg-[#0e2b1a] text-[#2ecc71] border-[#2ecc71]/20' : 'bg-[#2b1e0a] text-[#f5a623] border-[#f5a623]/20'
                }`}>
                  {selectedOrder.type?.toUpperCase() || 'ORDER'}
                </span>
                <span className="text-xs font-bold text-[#444] uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> 
                  Stage Time: {Math.floor((currentTime - ((selectedOrder.statusUpdatedAt || selectedOrder.createdAt) instanceof Timestamp ? (selectedOrder.statusUpdatedAt || selectedOrder.createdAt).toDate() : new Date((selectedOrder.statusUpdatedAt || selectedOrder.createdAt) || Date.now()))) / 60000)}m
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-black text-2xl text-white shrink-0 shadow-lg border border-white/5">
                        {item.qty}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-xl font-black text-white leading-tight uppercase tracking-tight">{item.name}</p>
                        
                        {/* Support multiple modifier field names */}
                        {(item.note || item.mod || item.sub || item.modifier) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(item.note || item.mod || item.modifier) && (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                <Flame size={12} /> MOD: {item.note || item.mod || item.modifier}
                              </div>
                            )}
                            {item.sub && (
                              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-[#555] uppercase tracking-widest">
                                OPT: {item.sub}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                    <Utensils size={48} className="mx-auto mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">No Items in Order</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-8 pt-0 grid grid-cols-1 gap-3">
              {selectedOrder.status === 'new' ? (
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'progress')}
                  className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-black font-black py-5 rounded-2xl text-sm tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  START PREPARATION <ChevronRight size={18} strokeWidth={3} />
                </button>
              ) : selectedOrder.status === 'progress' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'new')}
                    className="bg-[#1a1a1a] hover:bg-[#222] text-[#666] font-bold py-5 rounded-2xl text-xs tracking-widest transition-all"
                  >
                    RESET TO NEW
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    className="bg-[#4fa8ff] hover:bg-[#3d91eb] text-black font-black py-5 rounded-2xl text-sm tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                    MARK SERVED <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black tracking-[0.2em] text-[#444] mb-0.5">{label}</span>
      <span className={`font-mono text-lg font-black leading-none tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
