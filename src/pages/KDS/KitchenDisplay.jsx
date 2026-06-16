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
      case 'new': return { label: 'NEW', color: 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' };
      case 'progress': return { label: 'PREPPING', color: 'bg-blue-50 text-blue-600 border-2 border-blue-100' };
      case 'ready': return { label: 'DISPATCHED', color: 'bg-orange-50 text-orange-600 border-2 border-orange-100' };
      case 'completed': return { label: 'COMPLETED', color: 'bg-gray-100 text-gray-900 border-2 border-gray-200' };
      default: return { label: 'ORDER', color: 'bg-gray-50 text-gray-400 border-2 border-gray-100' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const stageStartTime = order.statusUpdatedAt || order.createdAt || order.time;

  return (
    <div 
      onClick={() => onAction(order)}
      className={`group relative bg-white rounded-[40px] border-4 border-gray-200 p-8 cursor-pointer transition-all hover:border-gray-900 flex flex-col justify-between shadow-xl transform active:scale-[0.98] ${
        order.status === 'progress' ? 'border-t-[12px] border-t-blue-600' : 
        order.status === 'ready' ? 'border-t-[12px] border-t-orange-600' :
        (order.type?.toLowerCase() === 'dine in' ? 'border-l-[12px] border-l-emerald-500' : 'border-l-[12px] border-l-orange-500')
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-3xl font-black text-gray-900 tracking-tighter italic">#{order.id.slice(-4).toUpperCase()}</span>
          {order.table && <span className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Table {order.table}</span>}
        </div>
        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col justify-center py-6 space-y-3">
        {items.length > 0 ? (
          items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex gap-4 items-center">
              <span className="text-sm font-black text-gray-900 bg-gray-100 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-gray-200">{item.qty}x</span>
              <span className="text-lg font-bold text-gray-700 leading-tight truncate uppercase tracking-tight">{item.name}</span>
            </div>
          ))
        ) : (
          <p className="text-xs font-bold text-red-500/50 uppercase italic tracking-widest">No items found</p>
        )}
      </div>

      <div className="flex justify-between items-end shrink-0 pt-6 border-t-2 border-gray-100 mt-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Clock size={14} className="text-gray-900" />
            {getTimeInStage(stageStartTime)}
          </div>
          {order.assignedRobot && (
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border-2 border-blue-100 uppercase tracking-widest w-fit shadow-sm">
              Robot: {order.assignedRobot.toUpperCase()}
            </div>
          )}
        </div>
        {order.status === 'progress' && (
          <div className="text-blue-600 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
            <span className="font-black text-lg tracking-tighter tabular-nums text-gray-900">
              {formatElapsedTime(stageStartTime)}
            </span>
          </div>
        )}
      </div>
      
      <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
          <Maximize2 size={24} className="text-white" />
        </div>
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
    const q = query(ordersRef, where("status", "in", ["new", "progress", "ready"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      liveOrders.sort((a, b) => {
        const priority = { 'new': 1, 'progress': 2, 'ready': 3 };
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
      if (newStatus === 'ready') updateData.readyAt = Timestamp.now();
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
          <div className="flex-1 p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 overflow-y-auto custom-scrollbar bg-gray-100 min-h-0">
            {filteredCompleted.map(order => (
              <OrderCard key={order.id} order={order} onAction={() => setSelectedOrder(order)} currentTime={currentTime} />
            ))}
          </div>
        );
      case 'RECEIPTS':
        return (
          <div className="flex-1 p-10 bg-white border-4 border-gray-200 rounded-[48px] m-8 overflow-y-auto custom-scrollbar shadow-2xl min-h-0">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="grid grid-cols-5 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-gray-100">
                <span>Reference</span>
                <span>Timestamp</span>
                <span>Type</span>
                <span>Primary Items</span>
                <span className="text-right">Live Status</span>
              </div>
              {[...orders, ...completedList].filter(o => o.id.includes(searchQuery)).slice(0, 50).map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrder(o)}
                  className="grid grid-cols-5 px-8 py-6 bg-white border-2 border-gray-100 rounded-[32px] items-center cursor-pointer hover:border-gray-900 transition-all shadow-sm group"
                >
                  <span className="text-sm font-black text-gray-900 italic">#{o.id.slice(-4).toUpperCase()}</span>
                  <span className="text-xs text-gray-500 font-bold">{o.displayTime || o.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'RECENT'}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{o.type || 'ORDER'}</span>
                  <span className="text-xs text-gray-700 font-bold truncate pr-6">{o.items?.[0]?.name || '...'}</span>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      o.status === 'completed' ? 'bg-gray-100 text-gray-900' : 
                      o.status === 'progress' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
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
      <div className="flex-1 p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 overflow-y-auto custom-scrollbar bg-gray-100 min-h-0">
        {displayOrders.map(order => (
          <OrderCard key={order.id} order={order} onAction={() => setSelectedOrder(order)} currentTime={currentTime} />
        ))}
        {displayOrders.length === 0 && (
          <div className="col-span-full h-full flex flex-col items-center justify-center opacity-30 gap-6">
            <div className="w-24 h-24 border-4 border-dashed border-gray-300 rounded-[40px] flex items-center justify-center">
               <Utensils size={40} className="text-gray-300" />
            </div>
            <span className="text-xs font-black tracking-[0.5em] text-gray-400 uppercase italic">{emptyLabel}</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 font-black animate-pulse text-2xl tracking-[0.4em] uppercase italic">System Ready</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-100 text-gray-900 flex flex-col font-sans overflow-hidden select-none">
      {/* TOPBAR */}
      <div className="flex items-center justify-between px-10 py-6 border-b-4 border-gray-200 bg-white shrink-0 shadow-sm z-10">
        <div className="text-[12px] font-black tracking-[0.4em] text-gray-900 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-lg text-white shadow-xl italic font-black">V</div>
          <span>KDS TERMINAL</span>
        </div>
        <div className="font-mono text-3xl font-black text-gray-900 tracking-tighter tabular-nums flex items-center gap-6">
          <span className="text-gray-200">/</span>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-[10px] font-black px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
            SYSTEM ONLINE
          </div>
          <button className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all border-2 border-gray-200 shadow-sm">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[140px] bg-white border-r-4 border-gray-200 flex flex-col py-8 shrink-0 gap-3 overflow-y-auto custom-scrollbar">
          {[
            { id: 'ORDERS', icon: <LayoutDashboard size={24} />, label: 'Queue' },
            { id: 'PREP', icon: <Clock size={24} />, label: 'Cooking' },
            { id: 'HISTORY', icon: <CheckCircle2 size={24} />, label: 'Archive' },
            { id: 'RECEIPTS', icon: <FileText size={24} />, label: 'Logs' },
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-2.5 py-6 mx-4 rounded-[28px] cursor-pointer transition-all border-2 ${
                activeNav === item.id 
                ? 'text-white bg-gray-900 border-gray-900 shadow-xl' 
                : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50 hover:border-gray-100'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col min-h-0">
          {renderMainContent()}
        </div>

        {/* RECENT PANEL */}
        <div className="w-[240px] bg-white border-l-4 border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-8 border-b-2 border-gray-100">
            <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Latest Activity</span>
            <span className="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
              {completedList.length}
            </span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-6">
            {completedList.slice(0, 15).map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedOrder(item)}
                className="flex items-center justify-between p-5 rounded-[24px] bg-gray-50 border-2 border-gray-100 animate-in slide-in-from-right-4 cursor-pointer hover:border-gray-900 transition-all shadow-sm group"
              >
                <span className="font-mono text-sm font-black text-gray-500 group-hover:text-gray-900 italic">#{item.id.slice(-4).toUpperCase()}</span>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{item.displayTime}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setShowAllHistory(true)}
            className="m-6 p-5 bg-white border-2 border-gray-200 text-gray-900 rounded-[24px] text-[10px] tracking-[0.2em] font-black uppercase hover:bg-gray-900 hover:text-white transition-all shadow-lg active:scale-95"
          >
            VIEW HISTORY
          </button>
        </div>
      </div>

      {/* FULL HISTORY MODAL */}
      {showAllHistory && (
        <div 
          onClick={() => setShowAllHistory(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-12 bg-gray-900/40 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-6xl h-full max-h-[85vh] rounded-[48px] border-4 border-gray-200 shadow-[0_40px_100px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden cursor-default animate-in zoom-in-95"
          >
            <div className="p-10 border-b-4 border-gray-100 flex justify-between items-center bg-white">
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2 uppercase">Order Intelligence</p>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">Kitchen <span className="text-gray-400">Archive</span></h2>
              </div>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="w-20 h-20 bg-gray-100 border-4 border-gray-200 rounded-[28px] flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all shadow-xl"
              >
                <X size={32} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {completedList.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedOrder(item)}
                    className="bg-white border-4 border-gray-200 rounded-[36px] p-10 flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 shadow-xl cursor-pointer hover:border-gray-900 transition-all group relative overflow-hidden"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="w-16 h-16 rounded-[24px] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-inner">
                      <Check size={28} strokeWidth={4} />
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-900 mb-1 tracking-tighter italic">#{item.id.slice(-4).toUpperCase()}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.displayTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-12 bg-white border-t-4 border-gray-100 flex justify-between items-center shadow-2xl">
              <div className="flex gap-10">
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">{completedList.length}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="px-16 py-6 bg-gray-900 text-white font-black rounded-3xl text-xs tracking-[0.3em] uppercase hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
              >
                BACK TO TERMINAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center gap-12 px-10 py-4 border-t-4 border-gray-200 bg-white shrink-0 shadow-inner">
        <div className="flex items-center gap-4 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-3 group focus-within:border-gray-900 transition-all shadow-inner">
          <Search size={18} className="text-gray-400 group-focus-within:text-gray-900" />
          <input 
            placeholder="ORDER ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-gray-900 font-black tracking-widest w-40 placeholder:text-gray-300 uppercase"
          />
        </div>
        <div className="flex gap-16">
          <StatItem label="PENDING" value={orders.filter(o => o.status === 'new').length} color="text-emerald-600" />
          <StatItem label="PREPPING" value={orders.filter(o => o.status === 'progress').length} color="text-blue-600" />
          <StatItem label="AVG TIME" value="12:45" color="text-gray-900" />
        </div>
        <div className="ml-auto flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
          HARDWARE READY
        </div>
      </div>

      {/* ORDER DETAIL POPUP */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-[64px] border-4 border-gray-200 shadow-[0_40px_120px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Modal Header */}
            <div className={`p-10 flex justify-between items-start ${
              selectedOrder.type?.toLowerCase() === 'dine in' ? 'bg-emerald-50' : 'bg-orange-50'
            }`}>
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-gray-400 mb-2 uppercase">Ticket Intelligence</p>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic">#{selectedOrder.id.slice(-4).toUpperCase()}</h2>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center hover:bg-gray-100 transition-all shadow-lg border-2 border-gray-100"
              >
                <X size={28} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-12 space-y-10 overflow-y-auto custom-scrollbar bg-white">
              <div className="flex items-center gap-8">
                <span className={`px-6 py-2.5 rounded-2xl text-[11px] font-black tracking-[0.2em] border-2 ${
                  selectedOrder.type?.toLowerCase() === 'dine in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  {selectedOrder.type?.toUpperCase() || 'ORDER'}
                </span>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                  <Clock size={20} className="text-gray-900" /> 
                  Time Elapsed: {Math.floor((currentTime - ((selectedOrder.statusUpdatedAt || selectedOrder.createdAt) instanceof Timestamp ? (selectedOrder.statusUpdatedAt || selectedOrder.createdAt).toDate() : new Date((selectedOrder.statusUpdatedAt || selectedOrder.createdAt) || Date.now()))) / 60000)}m
                </span>
              </div>

              <div className="space-y-6">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-8 bg-gray-50 p-8 rounded-[40px] border-2 border-gray-100 shadow-sm group transition-all hover:border-gray-900">
                      <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-3xl flex items-center justify-center font-black text-4xl text-gray-900 shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        {item.qty}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tight italic">{item.name}</p>
                        
                        {(item.note || item.mod || item.sub || item.modifier) && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {(item.note || item.mod || item.modifier) && (
                              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border-2 border-gray-200 rounded-2xl text-[11px] font-black text-gray-900 uppercase tracking-widest shadow-sm">
                                <Flame size={16} className="text-orange-500" /> {item.note || item.mod || item.modifier}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center border-4 border-dashed border-gray-100 rounded-[64px] opacity-30">
                    <Utensils size={80} className="mx-auto mb-8 text-gray-200" />
                    <p className="text-2xl font-black uppercase tracking-[0.3em] text-gray-300">Ticket Empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-12 bg-white border-t-4 border-gray-100 grid grid-cols-1 gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
              {selectedOrder.status === 'new' ? (
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'progress')}
                  className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-7 rounded-[32px] text-sm tracking-[0.5em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
                >
                  Start Prep <ChevronRight size={24} strokeWidth={4} />
                </button>
              ) : selectedOrder.status === 'progress' ? (
                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'new')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-black py-7 rounded-[32px] text-xs tracking-[0.2em] transition-all border-2 border-gray-200 uppercase"
                  >
                    Reset Ticket
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                    className="bg-orange-500 hover:bg-gray-900 text-white font-black py-7 rounded-[32px] text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
                  >
                    Mark Ready <Flame size={24} strokeWidth={4} />
                  </button>
                </div>
              ) : selectedOrder.status === 'ready' ? (
                <div className="flex flex-col gap-8">
                  <div className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[40px] text-center shadow-inner">
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.5em] mb-3">Unit Deployment</p>
                    <p className="text-gray-900 font-black text-2xl tracking-tighter italic">
                      {selectedOrder.assignedRobot ? `Robot ${selectedOrder.assignedRobot.toUpperCase()} is En Route` : "Waiting for Available Unit..."}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-black py-7 rounded-[32px] text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 uppercase"
                  >
                    Confirm Delivery <Check size={24} strokeWidth={4} />
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
