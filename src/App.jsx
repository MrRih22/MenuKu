import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  UtensilsCrossed, 
  Coffee, 
  Layers, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Receipt, 
  ChefHat, 
  Clock, 
  TrendingUp, 
  Users, 
  Edit3, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Printer, 
  SlidersHorizontal,
  ChevronUp,
  AlertCircle,
  Lock,
  LogOut, 
  Package,
  Layers3,
  Smartphone,
  Bell,
  Check,
  UserCheck,
  Download
} from 'lucide-react';

const CASHIERS_LIST = [
  { id: 'c-1', name: 'Archibald Ciba Arrasyid', pin: '1111', role: 'Staff' },
  { id: 'c-2', name: 'Shabha Khalisha Angky', pin: '2222', role: 'Staff' },
  { id: 'c-3', name: 'Chiko Agansyah', pin: '3333', role: 'Staff' },
  { id: 'c-4', name: 'Rasyid Ihtizzamul Hidayat', pin: '4444', role: 'Staff' },
  { id: 'c-5', name: 'Afshika Hunain Arbinta', pin: '5555', role: 'Staff' },
];

export default function App() {
  const [currentRole, setCurrentRole] = useState('customer');
  const [staffTab, setStaffTab] = useState('incoming');

  const [selectedCashierLogin, setSelectedCashierLogin] = useState(CASHIERS_LIST[0]);
  const [activeCashier, setActiveCashier] = useState(CASHIERS_LIST[0]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [customerName, setCustomerName] = useState('Pelanggan');
  const [selectedTable, setSelectedTable] = useState('Meja 04');
  const tableList = ['Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05', 'Meja 06', 'VIP Room', 'Bawa Pulang (Take Away)'];

  const [menuItems, setMenuItems] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isMenuFormModalOpen, setIsMenuFormModalOpen] = useState(false);
  const [isMergeTableModalOpen, setIsMergeTableModalOpen] = useState(false);
  const [isCustomerOrderDoneModalOpen, setIsCustomerOrderDoneModalOpen] = useState(false);
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState(false);

  const [splitMethod, setSplitMethod] = useState('equal');
  const [splitPersons, setSplitPersons] = useState(2);

  const [paymentType, setPaymentType] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [eWalletBrand, setEWalletBrand] = useState('GoPay');
  const [qrisTimer, setQrisTimer] = useState(180);
  const [lastProcessedOrder, setLastProcessedOrder] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'Makanan',
    price: '',
    stock: '',
    image: '',
    description: '',
    is_available: true
  });

  const [shiftData, setShiftData] = useState({
    isOpen: true,
    shiftName: 'Shift 1 (Jam 08:00 Pagi)',
    startTime: '08:00 WIB',
    endTime: '15:00 WIB',
    initialFloat: 250000,
    cashSales: 0,
    nonCashSales: 0,
    expectedCash: 250000,
    countedCash: '',
    shiftDiscrepancy: null
  });

  const [tempShiftForm, setTempShiftForm] = useState({
    shiftName: shiftData.shiftName,
    startTime: shiftData.startTime,
    endTime: shiftData.endTime,
    initialFloat: shiftData.initialFloat,
    expectedCash: shiftData.expectedCash
  });

  const handleSaveShiftConfig = (e) => {
    e.preventDefault();
    setShiftData((prev) => ({
      ...prev,
      shiftName: tempShiftForm.shiftName,
      startTime: tempShiftForm.startTime,
      endTime: tempShiftForm.endTime,
      initialFloat: Number(tempShiftForm.initialFloat),
      expectedCash: Number(tempShiftForm.expectedCash)
    }));
    setIsEditShiftModalOpen(false);
  };

  useEffect(() => {
    const checkSession = () => {
      const savedSession = localStorage.getItem('menuku_staff_session');
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          const currentTime = new Date().getTime();
          if (currentTime - sessionData.loginTime < 12 * 60 * 60 * 1000) {
            setActiveCashier(sessionData.cashier);
            setSelectedCashierLogin(sessionData.cashier);
            setCurrentRole('staff');
          } else {
            localStorage.removeItem('menuku_staff_session');
          }
        } catch (error) { console.error(error); }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const fetchMenus = async () => {
      const { data, error } = await supabase.from('menus').select('*').order('name');
      if (!error && data) setMenuItems(data);
      setIsLoading(false);
    };

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setLiveOrders(data);
    };

    fetchMenus();
    fetchOrders();

    const menuChannel = supabase
      .channel('realtime_menus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, () => {
        fetchMenus();
      })
      .subscribe();

    const orderChannel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLiveOrders((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLiveOrders((prev) =>
            prev.map((ord) => (ord.id === payload.new.id ? payload.new : ord))
          );
        } else if (payload.eventType === 'DELETE') {
          setLiveOrders((prev) => prev.filter((ord) => ord.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const serviceFee = useMemo(() => (subtotal > 0 ? 3000 : 0), [subtotal]);
  const grandTotal = useMemo(() => subtotal + taxAmount + serviceFee, [subtotal, taxAmount, serviceFee]);
  const totalCartCount = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);

  const cashChange = useMemo(() => {
    const given = Number(cashTendered) || 0;
    return Math.max(0, given - grandTotal);
  }, [cashTendered, grandTotal]);

  useEffect(() => {
    let interval;
    if (isPaymentModalOpen && paymentType === 'qris') {
      setQrisTimer(180);
      interval = setInterval(() => {
        setQrisTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaymentModalOpen, paymentType]);

  const filteredProducts = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleAddToCart = (item) => {
    if (!item.is_available || item.stock <= 0) return;
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prevCart;
        return prevCart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prevCart, { ...item, quantity: 1, note: '' }];
    });
  };

  const handleUpdateCartQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const product = menuItems.find((p) => p.id === id);
            const newQty = item.quantity + delta;
            if (product && newQty > product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleUpdateCartNote = (id, noteText) => {
    setCart((prevCart) =>
      prevCart.map((c) => (c.id === id ? { ...c, note: noteText } : c))
    );
  };

  const handleCheckoutSuccess = async (isCustomerOrder = false) => {
    if (cart.length === 0) return;

    const generatedOrderId = `MK-${Math.floor(10000 + Math.random() * 90000)}`;

    let finalPaymentLabel = 'Tunai';
    if (paymentType === 'qris') finalPaymentLabel = 'QRIS Digital';
    else if (paymentType === 'card') finalPaymentLabel = 'Kartu Debit/Kredit';
    else if (paymentType === 'ewallet') finalPaymentLabel = `E-Wallet (${eWalletBrand})`;
    else if (paymentType === 'pay_at_cashier') finalPaymentLabel = 'Bayar di Kasir';

    const orderPayload = {
      order_code: generatedOrderId,
      table_no: selectedTable,
      customer_name: customerName || 'Tamu',
      items: cart,
      subtotal,
      tax: taxAmount,
      service_fee: serviceFee,
      grand_total: grandTotal,
      payment_method: finalPaymentLabel,
      status: isCustomerOrder ? 'Menunggu Konfirmasi' : 'Selesai'
    };

    const { error } = await supabase.from('orders').insert([orderPayload]);

    if (error) {
      alert('Gagal memproses pesanan ke Supabase: ' + error.message);
      return;
    }

    if (!isCustomerOrder) {
      for (const cartItem of cart) {
        const prod = menuItems.find((p) => p.id === cartItem.id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - cartItem.quantity);
          await supabase
            .from('menus')
            .update({ stock: newStock, is_available: newStock > 0 })
            .eq('id', prod.id);
        }
      }

      if (paymentType === 'cash') {
        setShiftData((s) => ({
          ...s,
          cashSales: s.cashSales + grandTotal,
          expectedCash: s.expectedCash + grandTotal
        }));
      } else {
        setShiftData((s) => ({
          ...s,
          nonCashSales: s.nonCashSales + grandTotal
        }));
      }

      const receiptData = {
        orderId: generatedOrderId,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        table: selectedTable,
        customerName: customerName || 'Tamu',
        cashier: activeCashier.name,
        items: [...cart],
        subtotal,
        taxAmount,
        serviceFee,
        grandTotal,
        paymentMethod: finalPaymentLabel,
        cashGiven: paymentType === 'cash' ? Number(cashTendered) || grandTotal : null,
        cashChange: paymentType === 'cash' ? cashChange : 0
      };

      setLastProcessedOrder(receiptData);
      setIsReceiptModalOpen(true);
    } else {
      setIsCustomerOrderDoneModalOpen(true);
    }

    setCart([]);
    setIsPaymentModalOpen(false);
    setIsMobileCartOpen(false);
    setCashTendered('');
  };

  const handleUpdateOrderStatus = async (order, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      alert('Gagal update status: ' + error.message);
      return;
    }

    if (newStatus === 'Selesai') {
      for (const item of order.items) {
        const product = menuItems.find((p) => p.id === item.id);
        if (product) {
          const nextStock = Math.max(0, product.stock - item.quantity);
          await supabase
            .from('menus')
            .update({ stock: nextStock, is_available: nextStock > 0 })
            .eq('id', item.id);
        }
      }
    }
  };

  const handleStrictLogin = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === selectedCashierLogin.pin) {
      setActiveCashier(selectedCashierLogin);
      setCurrentRole('staff');
      setIsLoginModalOpen(false);
      setPinInput('');
      setPinError('');
      localStorage.setItem('menuku_staff_session', JSON.stringify({ 
        cashier: selectedCashierLogin, 
        loginTime: new Date().getTime() 
      }));
    } else {
      setPinError(`Otorisasi Gagal: PIN untuk ${selectedCashierLogin.name.split(' ')[0]} tidak valid!`);
      setPinInput(''); 
    }
  };

  const handleLogoutToCustomer = () => {
    setCurrentRole('customer');
    setStaffTab('pos');
    localStorage.removeItem('menuku_staff_session');
  };

  const handleOpenNewMenuModal = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      category: 'Makanan',
      price: '',
      stock: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: '',
      is_available: true
    });
    setIsMenuFormModalOpen(true);
  };

  const handleOpenEditMenuModal = (prod) => {
    setEditingProduct(prod);
    setProductFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price.toString(),
      stock: prod.stock.toString(),
      image: prod.image,
      description: prod.description || '',
      is_available: prod.is_available
    });
    setIsMenuFormModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price) return;

    const payload = {
      name: productFormData.name,
      category: productFormData.category,
      price: Number(productFormData.price),
      stock: Number(productFormData.stock) || 0,
      image: productFormData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: productFormData.description,
      is_available: Number(productFormData.stock) > 0 
    };

    if (editingProduct) {
      await supabase.from('menus').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('menus').insert([payload]);
    }
    setIsMenuFormModalOpen(false);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Hapus menu ini dari katalog?')) {
      await supabase.from('menus').delete().eq('id', id);
      setCart((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleToggleProductAvailability = async (prod) => {
    await supabase
      .from('menus')
      .update({ is_available: !prod.is_available })
      .eq('id', prod.id);
  };

  const handleExportCSV = () => {
    if (liveOrders.length === 0) {
      alert('Belum ada data laporan omzet yang bisa di-ekspor.');
      return;
    }

    const separator = ';';
    const headers = [
      'ID Order', 
      'Waktu Transaksi', 
      'Meja', 
      'Metode Bayar', 
      'Status Pesanan', 
      'Subtotal (Rp)', 
      'Pajak PB1 (Rp)', 
      'Layanan (Rp)', 
      'Grand Total (Rp)'
    ];

    const csvRows = [headers.join(separator)];

    liveOrders.forEach(order => {
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-';
      const rowData = [
        order.order_code,
        orderDate,
        order.table_no,
        order.customer_name || 'Tamu',
        order.payment_method,
        order.status,
        order.subtotal || 0,
        order.tax || 0,
        order.service_fee || 0,
        order.grand_total || 0
      ];
      const formattedRow = rowData.map(item => `"${item}"`).join(separator);
      csvRows.push(formattedRow);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Omzet_MenuKu_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Bar - Desain Elegan Mewah */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-3 py-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/10 font-black">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white font-serif">
                    Menu<span className="text-amber-500 font-sans font-black">Ku</span>
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                      currentRole === 'staff'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {currentRole === 'staff' ? `POS • ${activeCashier.name}` : 'Self-Order Tamu'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
                  {currentRole === 'staff'
                    ? 'Executive Point of Sales Management System'
                    : 'Exclusive Digital Dining Experience'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center bg-slate-900 rounded-xl px-3 py-1.5 border border-slate-800 shadow-inner">
                <Users className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                >
                  {tableList.map((tbl) => (
                    <option key={tbl} value={tbl} className="bg-slate-900 text-slate-200">{tbl}</option>
                  ))}
                </select>
              </div>

              {currentRole === 'staff' && staffTab === 'pos' && (
                <button
                  onClick={() => setIsMergeTableModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition shadow-sm"
                  title="Gabung Meja"
                >
                  <Layers3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gabung</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentRole === 'customer' ? (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Staff Login</span>
                  <span className="sm:hidden">Login</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    title="Ganti Kasir"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Ganti Kasir</span>
                  </button>
                  <button
                    onClick={handleLogoutToCustomer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 active:scale-95 transition"
                    title="Keluar ke Mode Pelanggan"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Sub-Navigation Bar */}
        {currentRole === 'staff' && (
          <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setStaffTab('incoming')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    staffTab === 'incoming' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Pesanan Masuk</span>
                  {liveOrders.filter((o) => o.status !== 'Selesai').length > 0 && (
                    <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {liveOrders.filter((o) => o.status !== 'Selesai').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStaffTab('pos')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    staffTab === 'pos' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  Kasir POS
                </button>

                <button
                  onClick={() => setStaffTab('inventory')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    staffTab === 'inventory' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Menu & Stok
                </button>

                <button
                  onClick={() => setStaffTab('shift')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    staffTab === 'shift' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Shift Kasir
                </button>

                <button
                  onClick={() => setStaffTab('reports')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    staffTab === 'reports' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Laporan Omzet
                </button>
              </div>

              <div className="hidden md:flex items-center text-[11px] text-slate-400 gap-2.5">
                <span>Operator: <strong className="text-amber-400 font-semibold">{activeCashier.name}</strong></span>
                <span className="text-slate-700">&bull;</span>
                <span>Sistem: <strong className="text-emerald-400 font-semibold">Online</strong></span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium tracking-wide">Memuat Sistem MenuKu...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: CUSTOMER VIEW OR STAFF POS WORKSTATION */}
            {(currentRole === 'customer' || (currentRole === 'staff' && staffTab === 'pos')) && (
              <div className="flex-1 flex flex-col lg:flex-row gap-6">
                {/* Catalog Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  {currentRole === 'customer' && (
                    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 flex items-center justify-between border border-amber-500/20">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold tracking-tight font-serif">Selamat Datang di MenuKu</h2>
                        <p className="text-xs sm:text-sm text-amber-100/90 mt-1 font-light">
                          Pemesanan meja <strong className="text-amber-300 font-semibold underline">{selectedTable}</strong>. Pesanan otomatis terkirim ke dapur
                        </p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">Layanan Meja</span>
                        <span className="text-xs font-medium text-slate-200">Pembayaran Digital & Pembayaran Kasir</span>
                      </div>
                    </div>
                  )}

                  {/* Filter & Search Controls */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-sm mb-5 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {['All', 'Makanan', 'Minuman'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                              selectedCategory === cat
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                          >
                            {cat === 'All' && <Layers className="w-3.5 h-3.5" />}
                            {cat === 'Makanan' && <UtensilsCrossed className="w-3.5 h-3.5" />}
                            {cat === 'Minuman' && <Coffee className="w-3.5 h-3.5" />}
                            <span>{cat}</span>
                            <span
                              className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                selectedCategory === cat ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {cat === 'All'
                                ? menuItems.length
                                : menuItems.filter((i) => i.category === cat).length}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari menu andalan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mb-3 border border-slate-800">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">Menu Tidak Ditemukan</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Tidak ada hidangan yang cocok dengan kata kunci "{searchQuery}".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-28 lg:pb-0">
                      {filteredProducts.map((item) => {
                        const cartItem = cart.find((c) => c.id === item.id);
                        const isSoldOut = !item.is_available || item.stock <= 0;

                        return (
                          <div
                            key={item.id}
                            className={`group bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md hover:border-slate-700 transition flex flex-col justify-between ${
                              isSoldOut ? 'opacity-60 bg-slate-900/40' : ''
                            }`}
                          >
                            <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                loading="lazy"
                              />
                              <span className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-slate-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                                {item.category === 'Makanan' ? <UtensilsCrossed className="w-3 h-3 text-amber-400" /> : <Coffee className="w-3 h-3 text-amber-400" />}
                                {item.category}
                              </span>
                              <span
                                className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                                  isSoldOut
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : item.stock <= 5
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {isSoldOut ? 'Habis' : `Stok: ${item.stock}`}
                              </span>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-amber-400 transition">
                                    {item.name}
                                  </h4>
                                  {currentRole === 'staff' && (
                                    <button
                                      onClick={() => handleOpenEditMenuModal(item)}
                                      className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-900 rounded"
                                      title="Edit Menu"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs line-clamp-2 mt-1.5 font-light">
                                  {item.description}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Harga</p>
                                  <p className="text-sm font-black text-slate-100">{formatRupiah(item.price)}</p>
                                </div>

                                {cartItem ? (
                                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                                    <button
                                      onClick={() => handleUpdateCartQty(item.id, -1)}
                                      className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-700 active:scale-95 transition"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-7 text-center font-extrabold text-xs text-amber-400">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      disabled={cartItem.quantity >= item.stock}
                                      onClick={() => handleUpdateCartQty(item.id, 1)}
                                      className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 active:scale-95 disabled:opacity-40 transition"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={isSoldOut}
                                    onClick={() => handleAddToCart(item)}
                                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 transition"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Pesan</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Panel Workstation */}
                <aside className="hidden lg:flex flex-col w-96 shrink-0">
                  <div className="sticky top-24 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[calc(100vh-8rem)]">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-100 text-sm">
                            {currentRole === 'staff' ? 'POS Workstation' : 'Keranjang Pesanan'}
                          </h3>
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {totalCartCount} Item
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {selectedTable} &bull; {currentRole === 'staff' ? `Kasir: ${activeCashier.name}` : 'Tamu'}
                        </p>
                      </div>

                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                          title="Hapus Semua"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <p className="font-semibold text-slate-300 text-xs">Belum Ada Pesanan</p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                            Pilih menu dari katalog di samping untuk memulai transaksi.
                          </p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h5 className="text-xs font-bold text-slate-200 leading-snug">{item.name}</h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {formatRupiah(item.price)} x {item.quantity}
                                </p>
                              </div>
                              <span className="text-xs font-black text-amber-400">
                                {formatRupiah(item.price * item.quantity)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                              <input
                                type="text"
                                placeholder="Catatan (cth: tidak pedas)..."
                                value={item.note || ''}
                                onChange={(e) => handleUpdateCartNote(item.id, e.target.value)}
                                className="text-[11px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex-1 text-slate-300 placeholder-slate-600 outline-none focus:border-amber-500"
                              />

                              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                                <button
                                  onClick={() => handleUpdateCartQty(item.id, -1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-900"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-slate-200">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateCartQty(item.id, 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-amber-400 hover:bg-slate-900"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {cart.length > 0 && (
                      <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3 rounded-b-2xl">
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-slate-200">{formatRupiah(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pajak (PB1 10%)</span>
                            <span className="font-semibold text-slate-200">{formatRupiah(taxAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Biaya Layanan</span>
                            <span className="font-semibold text-slate-200">{formatRupiah(serviceFee)}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                            <span className="text-sm font-bold text-slate-100">Total Tagihan</span>
                            <span className="text-base font-black text-amber-400">{formatRupiah(grandTotal)}</span>
                          </div>
                        </div>

                        {currentRole === 'staff' ? (
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <button
                              onClick={() => setIsSplitBillModalOpen(true)}
                              className="col-span-1 border border-slate-800 text-slate-300 hover:bg-slate-900 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                              Split
                            </button>
                            <button
                              onClick={() => setIsPaymentModalOpen(true)}
                              className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
                            >
                              <span>Bayar Kasir</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <button
                              onClick={() => {
                                setPaymentType('pay_at_cashier');
                                handleCheckoutSuccess(true);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <Banknote className="w-3.5 h-3.5 text-amber-400" />
                              <span>Pesan & Bayar di Kasir</span>
                            </button>
                            <button
                              onClick={() => {
                                setPaymentType('qris');
                                setIsPaymentModalOpen(true);
                              }}
                              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Bayar via QRIS Digital</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}

            {/* VIEW: ANTREAN PESANAN MASUK REALTIME */}
            {currentRole === 'staff' && staffTab === 'incoming' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-sm">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Antrean Pesanan Masuk</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kasir Aktif: <strong className="text-amber-400">{activeCashier.name}</strong>
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                {liveOrders.length === 0 ? (
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-16 text-center text-slate-500">
                    <Bell className="w-10 h-10 mx-auto mb-2.5 text-slate-700" />
                    <p className="font-semibold text-sm text-slate-300">Belum Ada Pesanan Masuk</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Pesanan dari pelanggan mandiri akan otomatis muncul secara instan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`bg-slate-950 rounded-2xl border p-4.5 shadow-sm flex flex-col justify-between ${
                          ord.status === 'Selesai'
                            ? 'border-slate-800 opacity-60'
                            : ord.status === 'Sedang Disiapkan'
                            ? 'border-blue-500/40 bg-blue-950/10'
                            : 'border-amber-500/40 bg-amber-950/10'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                            <div>
                              <span className="font-black text-slate-100 text-sm">{ord.order_code}</span>
                              <span className="block text-xs font-medium text-slate-400 mt-0.5">{ord.table_no} &bull; {ord.customer_name}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                                ord.status === 'Selesai'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : ord.status === 'Sedang Disiapkan'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>

                          <div className="py-3 space-y-1.5 text-xs text-slate-300">
                            {ord.items.map((i, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  <strong className="text-amber-400">{i.quantity}x</strong> {i.name}
                                  {i.note ? <span className="text-slate-500 italic"> ({i.note})</span> : ''}
                                </span>
                                <span className="text-slate-400">{formatRupiah(i.price * i.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 space-y-2.5">
                          <div className="flex justify-between items-baseline text-xs font-black">
                            <span className="text-slate-400">Total Transaksi:</span>
                            <span className="text-amber-400 text-sm">{formatRupiah(ord.grand_total)}</span>
                          </div>

                          {ord.status === 'Menunggu Konfirmasi' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord, 'Sedang Disiapkan')}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
                            >
                              Terima & Masak di Dapur
                            </button>
                          )}

                          {ord.status === 'Sedang Disiapkan' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord, 'Selesai')}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                            >
                              Tandai Selesai ({activeCashier.name})
                            </button>
                          )}

                          {ord.status === 'Selesai' && (
                            <div className="text-center text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                              ✓ Transaksi Selesai & Lunas
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: STAFF INVENTORY & MENU MANAGEMENT */}
            {currentRole === 'staff' && staffTab === 'inventory' && (
              <div className="space-y-5">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Manajemen Katalog & Stok Menu</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola daftar menu, ketersediaan porsi, dan harga secara real-time.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewMenuModal}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/15 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Menu Baru</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Menu</th>
                          <th className="p-3.5">Kategori</th>
                          <th className="p-3.5">Harga</th>
                          <th className="p-3.5">Stok Porsi</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {menuItems.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-900/50 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-slate-100 text-xs">{prod.name}</p>
                                  <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">{prod.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-md font-semibold text-[10px] border ${
                                  prod.category === 'Makanan' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}
                              >
                                {prod.category}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-200">{formatRupiah(prod.price)}</td>
                            <td className="p-3.5">
                              <span className={`font-black ${prod.stock <= 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                                {prod.stock} Porsi
                              </span>
                            </td>
                            <td className="p-3.5">
                              <button
                                onClick={() => handleToggleProductAvailability(prod)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                  prod.is_available && prod.stock > 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                              >
                                {prod.is_available && prod.stock > 0 ? 'Tersedia' : 'Habis'}
                              </button>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditMenuModal(prod)}
                                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition"
                                  title="Edit Menu"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                  title="Hapus Menu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: SHIFT MANAGEMENT */}
            {currentRole === 'staff' && staffTab === 'shift' && (
              <div className="max-w-2xl mx-auto w-full space-y-5">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100">Shift & Rekonsiliasi Kasir</h3>
                        <p className="text-xs text-slate-400">Pengelolaan shift jam kerja dan audit kas fisik laci.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTempShiftForm({
                          shiftName: shiftData.shiftName,
                          startTime: shiftData.startTime,
                          endTime: shiftData.endTime,
                          initialFloat: shiftData.initialFloat,
                          expectedCash: shiftData.expectedCash
                        });
                        setIsEditShiftModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-800 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Atur Shift & Kas</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Kasir Bertugas</span>
                      <span className="font-bold text-slate-200 text-sm mt-0.5 block">{activeCashier.name}</span>
                      <span className="text-[10px] text-amber-400 font-semibold">{activeCashier.role} POS</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Jadwal Shift</span>
                      <span className="font-bold text-slate-200 text-sm mt-0.5 block">{shiftData.shiftName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {shiftData.startTime} s.d. {shiftData.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-1 text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-400">Modal Kas Awal Laci (Float):</span>
                      <span className="font-bold text-slate-200">{formatRupiah(shiftData.initialFloat)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-400">Penerimaan Kas Tunai:</span>
                      <span className="font-bold text-emerald-400">+{formatRupiah(shiftData.cashSales)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-400">Total Transaksi Non-Tunai:</span>
                      <span className="font-bold text-blue-400">{formatRupiah(shiftData.nonCashSales)}</span>
                    </div>
                    <div className="flex justify-between py-3 font-black text-sm bg-amber-500/10 px-4 rounded-xl border border-amber-500/20">
                      <span className="text-amber-400">Target Ekspektasi Uang di Laci:</span>
                      <span className="text-amber-300">{formatRupiah(shiftData.expectedCash)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Hitung Fisik Uang di Laci Kasir ({activeCashier.name}):
                    </label>
                    <input
                      type="number"
                      placeholder="Masukkan total uang fisik di laci..."
                      value={shiftData.countedCash}
                      onChange={(e) => {
                        const val = e.target.value;
                        const diff = val ? Number(val) - shiftData.expectedCash : null;
                        setShiftData({ ...shiftData, countedCash: val, shiftDiscrepancy: diff });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  {shiftData.countedCash && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                        shiftData.shiftDiscrepancy === 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      <span className="font-semibold">Selisih Laci Kas:</span>
                      <span className="font-black text-sm">
                        {formatRupiah(shiftData.shiftDiscrepancy)}
                        {shiftData.shiftDiscrepancy === 0 ? ' (Sempurna / Pas)' : ' (Ada Selisih)'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      alert(`Shift untuk ${activeCashier.name} berhasil ditutup & diarsipkan!`);
                      setShiftData((s) => ({ ...s, countedCash: '', shiftDiscrepancy: null }));
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Tutup Shift & Arsipkan Laporan Kasir
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 4: REAL-TIME REVENUE & SALES REPORTS */}
            {currentRole === 'staff' && staffTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Omzet Lunas</span>
                    <p className="text-xl font-black text-slate-100 mt-1">
                      {formatRupiah(
                        liveOrders
                          .filter((o) => o.status === 'Selesai')
                          .reduce((s, o) => s + Number(o.grand_total), 0)
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Real-Time</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Transaksi Selesai</span>
                    <p className="text-xl font-black text-slate-100 mt-1">
                      {liveOrders.filter((o) => o.status === 'Selesai').length} Nota
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Pembayaran terverifikasi</p>
                  </div>

                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pesanan Dalam Proses</span>
                    <p className="text-xl font-black text-amber-400 mt-1">
                      {liveOrders.filter((o) => o.status !== 'Selesai').length} Pesanan
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Dapur / Menunggu Konfirmasi</p>
                  </div>

                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tim Kasir Terdaftar</span>
                    <p className="text-xl font-black text-slate-100 mt-1">
                      {CASHIERS_LIST.length} Operator
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Sistem POS Multi-Kasir</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4.5 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-slate-100 text-sm">Riwayat Transaksi & Laporan Omzet</h4>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ekspor CSV</span>
                      <span className="sm:hidden">Ekspor CSV</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase">
                        <tr>
                          <th className="p-3.5">ID Order</th>
                          <th className="p-3.5">Meja / Tamu</th>
                          <th className="p-3.5">Metode Bayar</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {liveOrders.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/50">
                            <td className="p-3.5 font-bold text-slate-100">{item.order_code}</td>
                            <td className="p-3.5 font-semibold text-slate-200">{item.table_no} &bull; {item.customer_name}</td>
                            <td className="p-3.5">
                              <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                                {item.payment_method}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                                  item.status === 'Selesai'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-black text-amber-400">{formatRupiah(item.grand_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MOBILE FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 px-4 z-40 shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <button onClick={() => setIsMobileCartOpen(true)} className="flex items-center gap-3 text-left">
              <div className="relative w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-black">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-slate-900 text-amber-400 border border-slate-800 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedTable} ({totalCartCount} item)
                </p>
                <p className="text-sm font-black text-amber-400">{formatRupiah(grandTotal)}</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (currentRole === 'staff') {
                  setIsPaymentModalOpen(true);
                } else {
                  setIsMobileCartOpen(true);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <span>{currentRole === 'staff' ? 'Bayar Kasir' : 'Lihat Keranjang'}</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CART SHEET MODAL */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <div className="bg-slate-950 border border-slate-800 w-full max-h-[85vh] rounded-t-3xl p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Rincian Keranjang Pesanan</h3>
                <p className="text-xs text-slate-400">{selectedTable} &bull; {totalCartCount} Item</p>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentRole === 'customer' && (
              <div className="pt-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Pemesan / Tamu:</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div className="overflow-y-auto py-3 space-y-2.5 flex-1">
              {cart.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">{item.name}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(item.price)}</p>
                    </div>
                    <span className="text-xs font-black text-amber-400">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={item.note || ''}
                      onChange={(e) => handleUpdateCartNote(item.id, e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 w-1/2 text-slate-300 outline-none"
                    />
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <button onClick={() => handleUpdateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-amber-400">{item.quantity}</span>
                      <button onClick={() => handleUpdateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-amber-400">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-200">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Pajak (PB1 10%) & Layanan:</span>
                <span className="font-semibold text-slate-200">{formatRupiah(taxAmount + serviceFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-100">
                <span>Total:</span>
                <span className="text-amber-400 font-black">{formatRupiah(grandTotal)}</span>
              </div>

              {currentRole === 'staff' ? (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => { setIsMobileCartOpen(false); setIsSplitBillModalOpen(true); }}
                    className="col-span-1 border border-slate-800 py-3 rounded-xl font-bold text-xs text-slate-300 bg-slate-900"
                  >
                    Split
                  </button>
                  <button
                    onClick={() => { setIsMobileCartOpen(false); setIsPaymentModalOpen(true); }}
                    className="col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-md"
                  >
                    Proses Bayar
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setPaymentType('pay_at_cashier');
                      handleCheckoutSuccess(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span>Pesan Sekarang (Bayar di Kasir)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileCartOpen(false);
                      setPaymentType('qris');
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full bg-amber-500 text-slate-950 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Bayar via QRIS Digital</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-KASIR PIN LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Otorisasi Staff POS</h3>
              </div>
              <button
                onClick={() => { setIsLoginModalOpen(false); setPinError(''); setPinInput(''); }}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStrictLogin} className="my-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pilih Nama Operator Kasir:</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {CASHIERS_LIST.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCashierLogin(c);
                        setPinInput(''); 
                        setPinError('');
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        selectedCashierLogin.id === c.id
                          ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">
                  Masukkan PIN ({selectedCashierLogin.name.split(' ')[0]})
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] text-2xl font-black bg-slate-900 border border-slate-800 rounded-2xl py-2.5 text-slate-100 outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((keyVal) => (
                  <button
                    key={keyVal}
                    type="button"
                    onClick={() => {
                      if (keyVal === 'C') {
                        setPinInput('');
                        setPinError('');
                      } else if (keyVal === 'OK') {
                        handleStrictLogin();
                      } else if (pinInput.length < 4) {
                        setPinInput((p) => p + keyVal.toString());
                      }
                    }}
                    className={`py-2 rounded-xl font-black text-xs transition active:scale-95 ${
                      keyVal === 'OK' 
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30' 
                        : keyVal === 'C'
                        ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30'
                        : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    {keyVal}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md mt-2 transition"
              >
                Otorisasi & Masuk POS
              </button>
            </form>
          </div>
        </div>
      )}  

      {/* MODAL PENGATURAN SHIFT */}
      {isEditShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Pengaturan Shift & Target Kas</h3>
              <button onClick={() => setIsEditShiftModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftConfig} className="my-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Pilih Shift Restoran</label>
                <select
                  value={tempShiftForm.shiftName}
                  onChange={(e) => {
                    const val = e.target.value;
                    let start = '08:00 WIB';
                    let end = '15:00 WIB';
                    if (val.includes('Shift 2')) {
                      start = '15:00 WIB';
                      end = '23:00 WIB';
                    }
                    setTempShiftForm({ ...tempShiftForm, shiftName: val, startTime: start, endTime: end });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none font-bold"
                >
                  <option value="Shift 1 (Jam 08:00 Pagi)">Shift 1 (Mulai Jam 08:00 Pagi)</option>
                  <option value="Shift 2 (Jam 15:00 / 3 Sore)">Shift 2 (Mulai Jam 15:00 / 3 Sore)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    value={tempShiftForm.startTime}
                    onChange={(e) => setTempShiftForm({ ...tempShiftForm, startTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    value={tempShiftForm.endTime}
                    onChange={(e) => setTempShiftForm({ ...tempShiftForm, endTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Modal Awal Kas (Initial Float)</label>
                <input
                  type="number"
                  value={tempShiftForm.initialFloat}
                  onChange={(e) => setTempShiftForm({ ...tempShiftForm, initialFloat: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">
                  Target Ekspektasi Kas di Laci (Expected Cash)
                </label>
                <input
                  type="number"
                  value={tempShiftForm.expectedCash}
                  onChange={(e) => setTempShiftForm({ ...tempShiftForm, expectedCash: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditShiftModalOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-900 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md transition"
                >
                  Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE TABLE MODAL */}
      {isMergeTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">Gabung Meja (Merge Table)</h3>
              <button onClick={() => setIsMergeTableModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="my-4 space-y-3 text-xs">
              <p className="text-slate-400">Pilih meja yang akan digabungkan ke <strong className="text-amber-400">{selectedTable}</strong>:</p>
              <div className="grid grid-cols-2 gap-2">
                {tableList.filter((t) => t !== selectedTable).map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => {
                      setSelectedTable(`${selectedTable} + ${tbl}`);
                      setIsMergeTableModalOpen(false);
                      alert(`Berhasil menggabungkan tagihan ${tbl} ke ${selectedTable}!`);
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl font-semibold text-slate-200 text-left transition"
                  >
                    + {tbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">Pembayaran Tagihan</h3>
                <p className="text-xs text-slate-400">
                  Meja: {selectedTable} &bull; Total: <strong className="text-amber-400">{formatRupiah(grandTotal)}</strong>
                </p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`grid gap-2 my-4 ${currentRole === 'staff' ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <button
                onClick={() => setPaymentType('qris')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold gap-1.5 transition ${
                  paymentType === 'qris'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                QRIS
              </button>

              {currentRole === 'staff' && (
                <button
                  onClick={() => setPaymentType('cash')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition ${
                    paymentType === 'cash'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  Tunai
                </button>
              )}

              <button
                onClick={() => setPaymentType('ewallet')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold gap-1.5 transition ${
                  paymentType === 'ewallet'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-400" />
                E-Wallet
              </button>
              <button
                onClick={() => setPaymentType('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold gap-1.5 transition ${
                  paymentType === 'card'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-400" />
                EDC Card
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 min-h-[200px] flex flex-col justify-center">
              {paymentType === 'qris' && (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-950 shadow-inner">
                    <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <path fill="#020617" d="M10,10 h25 v25 h-25 z M15,15 v15 h15 v-15 z M19,19 h7 v7 h-7 z" />
                      <path fill="#020617" d="M65,10 h25 v25 h-25 z M70,15 v15 h15 v-15 z M74,19 h7 v7 h-7 z" />
                      <path fill="#020617" d="M10,65 h25 v25 h-25 z M15,70 v15 h15 v-15 z M19,74 h7 v7 h-7 z" />
                      <rect x="42" y="15" width="16" height="6" fill="#020617" />
                      <rect x="42" y="28" width="8" height="12" fill="#020617" />
                      <rect x="55" y="32" width="15" height="6" fill="#020617" />
                      <rect x="38" y="50" width="24" height="6" fill="#020617" />
                      <rect x="45" y="65" width="10" height="20" fill="#020617" />
                      <rect x="65" y="60" width="22" height="6" fill="#020617" />
                      <rect x="75" y="75" width="15" height="15" fill="#020617" />
                    </svg>
                  </div>
                  <div>
                    <span className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold px-3 py-1 rounded-full">
                      Batas Waktu: {Math.floor(qrisTimer / 60)}:{(qrisTimer % 60).toString().padStart(2, '0')}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Scan via BCA, GoPay, OVO, ShopeePay, DANA, atau Livin</p>
                  </div>
                </div>
              )}

              {currentRole === 'staff' && paymentType === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Uang Tunai Diterima (Rp):
                    </label>
                    <input
                      type="number"
                      placeholder={grandTotal.toString()}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full text-lg font-black bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[grandTotal, 50000, 100000, 150000, 200000].map((nominal) => (
                      <button
                        key={nominal}
                        onClick={() => setCashTendered(nominal.toString())}
                        className="text-xs bg-slate-950 hover:bg-emerald-500/10 hover:text-emerald-300 border border-slate-800 px-2.5 py-1.5 rounded-lg font-semibold text-slate-300 transition"
                      >
                        {nominal === grandTotal ? 'Uang Pas' : formatRupiah(nominal)}
                      </button>
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Kembalian:</span>
                    <span className="text-base font-black text-emerald-300">{formatRupiah(cashChange)}</span>
                  </div>
                </div>
              )}

              {paymentType === 'ewallet' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400">Pilih Dompet Digital:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['GoPay', 'OVO', 'ShopeePay', 'DANA'].map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setEWalletBrand(brand)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          eWalletBrand === brand
                            ? 'border-blue-500 bg-blue-500/10 text-blue-300 shadow-sm'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <span>{brand}</span>
                        {eWalletBrand === brand && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentType === 'card' && (
                <div className="text-center py-4 space-y-2">
                  <CreditCard className="w-10 h-10 text-purple-400 mx-auto" />
                  <h4 className="font-bold text-xs text-slate-200">Gesek / Tap pada Mesin EDC</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Mendukung seluruh kartu debit dan kredit berlogo Visa, Mastercard, dan GPN.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-3 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400"
              >
                Batal
              </button>
              <button
                onClick={() => handleCheckoutSuccess(currentRole === 'customer')}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesaikan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT BILL MODAL */}
      {isSplitBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Pemisahan Tagihan (Split Bill)</h3>
              <button onClick={() => setIsSplitBillModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSplitMethod('equal')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    splitMethod === 'equal' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Bagi Rata (Equal)
                </button>
                <button
                  onClick={() => setSplitMethod('item')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    splitMethod === 'item' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Per Item Pesanan
                </button>
              </div>

              {splitMethod === 'equal' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Jumlah Tamu Pembayar:</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSplitPersons(Math.max(2, splitPersons - 1))}
                        className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-200"
                      >
                        -
                      </button>
                      <span className="font-black text-lg text-slate-100">{splitPersons} Orang</span>
                      <button
                        onClick={() => setSplitPersons(splitPersons + 1)}
                        className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                    <p className="text-xs text-amber-400 font-semibold">Nominal per Orang:</p>
                    <p className="text-xl font-black text-amber-300 mt-1">
                      {formatRupiah(Math.ceil(grandTotal / splitPersons))}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Total asli: {formatRupiah(grandTotal)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                      <span>{item.name} ({item.quantity}x)</span>
                      <span className="font-bold text-slate-200">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsSplitBillModalOpen(false);
                setIsPaymentModalOpen(true);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition shadow-md"
            >
              Lanjutkan Pembayaran
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {isReceiptModalOpen && lastProcessedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Transaksi Berhasil & Lunas</span>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 bg-slate-900 p-4 rounded-2xl border border-dashed border-slate-700 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-center border-b border-dashed border-slate-700 pb-2">
                <h4 className="font-black text-sm tracking-wider text-slate-100">RESTO MENUKU NUSANTARA</h4>
                <p className="text-[10px] text-slate-400">Executive Dining & POS System</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{lastProcessedOrder.orderId}</span>
                <span>{lastProcessedOrder.date} {lastProcessedOrder.time}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Meja: {lastProcessedOrder.table}</span>
                <span>Kasir: <strong className="text-slate-200">{lastProcessedOrder.cashier}</strong></span>
              </div>

              <div className="border-t border-dashed border-slate-700 pt-2 space-y-1">
                {lastProcessedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-200">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} x {formatRupiah(item.price)}
                        {item.note ? ` (${item.note})` : ''}
                      </p>
                    </div>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-700 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(lastProcessedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak (PB1 10%):</span>
                  <span>{formatRupiah(lastProcessedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layanan:</span>
                  <span>{formatRupiah(lastProcessedOrder.serviceFee)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-700 text-amber-400">
                  <span>GRAND TOTAL:</span>
                  <span>{formatRupiah(lastProcessedOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Metode:</span>
                  <span>{lastProcessedOrder.paymentMethod}</span>
                </div>
                {lastProcessedOrder.cashGiven && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Tunai:</span>
                      <span>{formatRupiah(lastProcessedOrder.cashGiven)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(lastProcessedOrder.cashChange)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Cetak Struk</span>
              </button>

              <button
                onClick={() => {
                  alert(`Tiket Pesanan Dapur untuk ${lastProcessedOrder.table} berhasil dikirim!`);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kirim Dapur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CONFIRMATION MODAL */}
      {isCustomerOrderDoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Pesanan Berhasil Dikirim</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pesanan untuk meja <strong className="text-amber-400">{selectedTable}</strong> telah masuk ke sistem antrean dapur.
              </p>
            </div>
            <button
              onClick={() => setIsCustomerOrderDoneModalOpen(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      )}

      {/* MENU FORM MODAL (CRUD SUPABASE) */}
      {isMenuFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingProduct ? 'Ubah Detail Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsMenuFormModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="my-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Nama Hidangan / Minuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Wagyu Beef Steak"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Kategori</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none font-semibold"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Stok Porsi</label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="45000"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">URL Gambar / Foto</label>
                <input
                  type="url"
                  value={productFormData.image}
                  onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuFormModalOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-900 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md transition"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
