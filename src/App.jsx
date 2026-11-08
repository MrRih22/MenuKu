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
  Download,
  Truck
} from 'lucide-react';

const CASHIERS_LIST = [
  { id: 'c-1', name: 'Archibald Ciba Arrasyid', role: 'Staff' },
  { id: 'c-2', name: 'Shabha Khalisha Angky', role: 'Staff' },
  { id: 'c-3', name: 'Chiko Agansyah', role: 'Staff' },
  { id: 'c-4', name: 'Rasyid Ihtizzamul Hidayat', role: 'Staff' },
  { id: 'c-5', name: 'Afshika Hunain Arbinta', role: 'Staff' },
];

/* ------------------------------------------------------------------ */
/*  DESIGN SYSTEM                                                      */
/*  Tema: slate netral + satu aksen amber. Semua komponen memakai    */
/*  token kelas di bawah agar konsisten.                               */
/* ------------------------------------------------------------------ */
const ui = {
  card: 'bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm',
  input:
    'w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10',
  label: 'block text-xs font-semibold text-zinc-400 mb-1.5',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl shadow-sm shadow-amber-500/20 transition duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800/60 text-zinc-300 font-semibold rounded-xl border border-zinc-800 transition duration-150 active:scale-[0.97]',
  btnDark:
    'inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-900 text-zinc-900 font-semibold rounded-xl transition duration-150 active:scale-[0.97]',
  iconBtn:
    'inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition duration-150 active:scale-90',
  overlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto mk-fade',
  modal:
    'bg-zinc-900 w-full rounded-3xl shadow-2xl shadow-zinc-900/20 border border-zinc-800 my-auto mk-pop',
  modalHead: 'flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-800/70',
  th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400',
};

const orderTone = (status) => {
  switch (status) {
    case 'Selesai':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25',
        card: 'border-zinc-800 opacity-70',
        bar: 'bg-emerald-500',
      };
    case 'Siap Diantar':
      return {
        badge: 'bg-teal-500/10 text-teal-400 ring-teal-500/25',
        card: 'border-teal-500/30',
        bar: 'bg-teal-500',
      };
    case 'Sedang Disiapkan':
      return {
        badge: 'bg-sky-500/10 text-sky-400 ring-sky-500/25',
        card: 'border-sky-500/30',
        bar: 'bg-sky-500',
      };
    default:
      return {
        badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
        card: 'border-amber-500/30',
        bar: 'bg-amber-500',
      };
  }
};

export default function App() {
  const [currentRole, setCurrentRole] = useState('customer');
  const [staffTab, setStaffTab] = useState('incoming');

  const [selectedCashierLogin, setSelectedCashierLogin] = useState(CASHIERS_LIST[0]);
  const [activeCashier, setActiveCashier] = useState(CASHIERS_LIST[0]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [customerName, setCustomerName] = useState('');
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

  const [paymentType, setPaymentType] = useState('qris');
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
  const serviceFee = useMemo(() => (subtotal > 0 ? 1000 : 0), [subtotal]);
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

    // Validasi khusus kasir: jika pembayaran tunai, pastikan uang yang dibayar tidak kurang dari grandTotal
    if (!isCustomerOrder && paymentType === 'cash') {
      const given = Number(cashTendered) || 0;
      if (given < grandTotal) {
        alert(`Uang tunai kurang! Tagihan sebesar ${formatRupiah(grandTotal)}, tetapi uang yang dimasukkan baru ${formatRupiah(given)}.`);
        return;
      }
    }

    for (const cartItem of cart) {
      const { data: latestMenu, error: fetchError } = await supabase
        .from('menus')
        .select('stock, name, is_available')
        .eq('id', cartItem.id)
        .single();

      if (fetchError || !latestMenu) {
        alert(`Gagal memeriksa ketersediaan menu ${cartItem.name}. Silakan coba lagi.`);
        return;
      }

      if (!latestMenu.is_available || latestMenu.stock < cartItem.quantity) {
        alert("Mohon Maaf Stok Habis, Silahkan Refresh Kembali Halaman :)");
        const { data: refreshedMenus } = await supabase.from('menus').select('*').order('name');
        if (refreshedMenus) setMenuItems(refreshedMenus);
        return;
      }
    }

    const generatedOrderId = `MK-${Math.floor(10000 + Math.random() * 90000)}`;
    const isTakeAway = selectedTable.toLowerCase().includes('take away') || selectedTable.toLowerCase().includes('bawa');

    let finalPaymentLabel = 'Tunai';
    if (isCustomerOrder) {
      if (paymentType === 'qris') finalPaymentLabel = 'QRIS Digital [Self-Order]';
      else if (paymentType === 'ewallet') finalPaymentLabel = `E-Wallet (${eWalletBrand}) [Self-Order]`;
      else finalPaymentLabel = 'Digital Payment [Self-Order]';
    } else {
      if (paymentType === 'cash') finalPaymentLabel = 'Tunai (Kasir)';
      else if (paymentType === 'qris') finalPaymentLabel = 'QRIS (Kasir)';
      else if (paymentType === 'card') finalPaymentLabel = 'Kartu Debit/Kredit (EDC)';
      else if (paymentType === 'ewallet') finalPaymentLabel = `E-Wallet (${eWalletBrand}) [Kasir]`;
    }

    const orderModeLabel = isCustomerOrder
      ? (isTakeAway ? 'Self-Order (Take Away)' : 'Self-Order (Dine-In)')
      : activeCashier.name;

    const orderPayload = {
      order_code: generatedOrderId,
      table_no: selectedTable,
      customer_name: customerName || 'Pelanggan',
      cashier_name: orderModeLabel,
      items: cart,
      subtotal,
      tax: taxAmount,
      service_fee: 1000,
      grand_total: grandTotal,
      payment_method: finalPaymentLabel,
      status: isCustomerOrder ? 'Menunggu Konfirmasi' : 'Selesai'
    };

    const { error } = await supabase.from('orders').insert([orderPayload]);

    if (error) {
      alert('Gagal memproses pesanan ke Supabase: ' + error.message);
      return;
    }

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

    if (!isCustomerOrder) {
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
        customerName: customerName || 'Pelanggan',
        cashier: orderModeLabel,
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
  };

  const handlePrintOrderReceipt = (order) => {
    const receiptData = {
      orderId: order.order_code,
      time: order.created_at ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Baru saja',
      date: order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      table: order.table_no,
      customerName: order.customer_name || 'Pelanggan',
      cashier: order.cashier_name,
      items: order.items,
      subtotal: order.subtotal || 0,
      taxAmount: order.tax || 0,
      serviceFee: order.service_fee || 0,
      grandTotal: order.grand_total || 0,
      paymentMethod: order.payment_method,
      cashGiven: null,
      cashChange: 0
    };
    setLastProcessedOrder(receiptData);
    setIsReceiptModalOpen(true);
  };

  const handleStrictLogin = async (e) => {
    if (e) e.preventDefault();

    if (!pinInput.trim()) {
      setPinError('PIN tidak boleh kosong!');
      return;
    }

    const { data, error } = await supabase
      .from('cashiers')
      .select('id, name, role')
      .eq('id', selectedCashierLogin.id)
      .eq('pin', pinInput.trim())
      .single();

    if (data && !error) {
      setActiveCashier(data);
      setCurrentRole('staff');
      setIsLoginModalOpen(false);
      setPinInput('');
      setPinError('');

      localStorage.setItem('menuku_staff_session', JSON.stringify({
        cashier: data,
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
      'Nama Customer',
      'Nama Kasir / Petugas',
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
        order.customer_name || 'Pelanggan',
        order.cashier_name,
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

  /* ---------------------------------------------------------------- */
  /*  UI HELPERS (fungsi render, bukan komponen → input tidak remount) */
  /* ---------------------------------------------------------------- */
  const pendingCount = liveOrders.filter((o) => o.status !== 'Selesai').length;

  const staffTabs = [
    { key: 'incoming', label: 'Pesanan Masuk', icon: Bell, badge: pendingCount },
    { key: 'pos', label: 'Kasir POS', icon: UtensilsCrossed },
    { key: 'inventory', label: 'Menu & Stok', icon: Package },
    { key: 'shift', label: 'Shift Kasir', icon: Clock },
    { key: 'reports', label: 'Laporan Omzet', icon: TrendingUp },
  ];

  const renderCartLines = () => (
    <>
      {cart.map((item) => (
        <div
          key={item.id}
          className="p-3 rounded-2xl border border-zinc-800 bg-zinc-800/30 space-y-2.5 mk-rise"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h5 className="text-sm font-semibold text-zinc-100 leading-snug">{item.name}</h5>
              <p className="text-xs text-zinc-400 mt-0.5">
                {formatRupiah(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-bold text-zinc-50 tabular-nums shrink-0">
              {formatRupiah(item.price * item.quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Catatan (cth: tidak pedas)"
              value={item.note || ''}
              onChange={(e) => handleUpdateCartNote(item.id, e.target.value)}
              className="flex-1 min-w-0 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-300 placeholder-zinc-500 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            />
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => handleUpdateCartQty(item.id, -1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-sm font-bold text-zinc-50 tabular-nums">{item.quantity}</span>
              <button
                onClick={() => handleUpdateCartQty(item.id, 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-400 hover:bg-amber-500/10 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const renderCartTotals = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-zinc-400">
        <span>Subtotal</span>
        <span className="font-medium text-zinc-100 tabular-nums">{formatRupiah(subtotal)}</span>
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>Pajak (PB1 10%)</span>
        <span className="font-medium text-zinc-100 tabular-nums">{formatRupiah(taxAmount)}</span>
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>Biaya Layanan</span>
        <span className="font-medium text-zinc-100 tabular-nums">{formatRupiah(serviceFee)}</span>
      </div>
      <div className="pt-3 mt-1 border-t border-dashed border-zinc-800 flex justify-between items-baseline">
        <span className="text-sm font-semibold text-zinc-50">Total Tagihan</span>
        <span className="text-xl font-extrabold text-amber-400 tabular-nums tracking-tight">{formatRupiah(grandTotal)}</span>
      </div>
    </div>
  );

  const renderCartActions = (closeMobile = false) =>
    currentRole === 'staff' ? (
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            if (closeMobile) setIsMobileCartOpen(false);
            setIsSplitBillModalOpen(true);
          }}
          className={`${ui.btnSecondary} col-span-1 py-3.5 text-sm`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          Split
        </button>
        <button
          onClick={() => {
            if (closeMobile) setIsMobileCartOpen(false);
            setIsPaymentModalOpen(true);
          }}
          className={`${ui.btnPrimary} col-span-2 py-3.5 text-sm`}
        >
          <span>{closeMobile ? 'Proses Bayar' : 'Bayar Kasir'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <button
        onClick={() => {
          if (closeMobile) setIsMobileCartOpen(false);
          setPaymentType('qris');
          setIsPaymentModalOpen(true);
        }}
        className={`${ui.btnPrimary} w-full py-3.5 text-sm`}
      >
        <QrCode className="w-4 h-4" />
        <span>Bayar via Pembayaran Digital</span>
      </button>
    );

  return (
    <div className="mk-root min-h-screen bg-zinc-950 text-zinc-300 flex flex-col selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      {/* Font + animasi + print CSS. Boleh dipindah ke index.css */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .mk-root { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; color-scheme: dark; background-image: radial-gradient(60rem 28rem at 85% -8%, rgba(245,158,11,.07), transparent 70%), radial-gradient(40rem 24rem at 0% 100%, rgba(245,158,11,.04), transparent 70%); background-attachment: fixed; }
        .mk-root select option { background: #18181b; color: #e4e4e7; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes mk-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mk-pop { from { opacity: 0; transform: translateY(12px) scale(.97) } to { opacity: 1; transform: none } }
        @keyframes mk-sheet { from { transform: translateY(100%) } to { transform: none } }
        @keyframes mk-rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .mk-fade { animation: mk-fade .18s ease-out both }
        .mk-pop { animation: mk-pop .22s cubic-bezier(.16,1,.3,1) both }
        .mk-sheet { animation: mk-sheet .28s cubic-bezier(.16,1,.3,1) both }
        .mk-rise { animation: mk-rise .2s ease-out both }
        @media (prefers-reduced-motion: reduce) {
          .mk-fade, .mk-pop, .mk-sheet, .mk-rise { animation: none }
        }
        @media print {
          body * { visibility: hidden !important; }
          .receipt-area, .receipt-area * { visibility: visible !important; }
          .receipt-area { position: absolute; left: 0; top: 0; width: 100%; overflow: visible !important; max-height: none !important; background: #fff !important; padding: 0 !important; }
          .receipt-paper { box-shadow: none !important; border: none !important; margin: 0 auto !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ============================ HEADER ============================ */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-zinc-50 whitespace-nowrap">
                    Menu<span className="text-amber-400">Ku</span>
                  </span>
                  <span
                    className={`hidden sm:inline-flex whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ring-1 ring-inset ${
                      currentRole === 'staff'
                        ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                        : 'bg-amber-500/10 text-amber-400 ring-amber-500/25'
                    }`}
                  >
                    {currentRole === 'staff' ? `POS • ${activeCashier.name.split(' ')[0]}` : 'Self-Order'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
                  {currentRole === 'staff'
                    ? 'Point of Sales Management System'
                    : 'Pesan langsung dari meja Anda'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="flex items-center bg-zinc-800 hover:bg-zinc-700/70 transition rounded-xl pl-2.5 pr-1.5 sm:pl-3 sm:pr-2 py-2 min-w-0 max-w-[118px] sm:max-w-none">
                <Users className="w-4 h-4 text-amber-400 mr-1.5 sm:mr-2 shrink-0" />
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-300 outline-none cursor-pointer truncate min-w-0 w-full"
                >
                  {tableList.map((tbl) => (
                    <option key={tbl} value={tbl}>{tbl}</option>
                  ))}
                </select>
              </div>

              {currentRole === 'staff' && staffTab === 'pos' && (
                <button
                  onClick={() => setIsMergeTableModalOpen(true)}
                  className={`${ui.btnSecondary} hidden md:inline-flex text-xs px-3 py-2`}
                  title="Gabung Meja"
                >
                  <Layers3 className="w-4 h-4 text-amber-400" />
                  <span>Gabung</span>
                </button>
              )}

              {currentRole === 'customer' ? (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`${ui.btnDark} text-xs px-3 sm:px-3.5 py-2.5 whitespace-nowrap shrink-0`}
                  title="Staff Login"
                  aria-label="Staff Login"
                >
                  <Lock className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Staff Login</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className={`${ui.btnSecondary} text-xs px-3 py-2`}
                    title="Ganti Kasir"
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span className="hidden md:inline">Ganti Kasir</span>
                  </button>
                  <button
                    onClick={handleLogoutToCustomer}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 ring-1 ring-inset ring-rose-500/25 active:scale-[0.97] transition"
                    title="Keluar ke Mode Pelanggan"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {currentRole === 'staff' && (
          <div className="border-t border-zinc-800/70 px-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-2 gap-2">
              <nav className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl shrink-0">
                {staffTabs.map((t) => {
                  const Icon = t.icon;
                  const active = staffTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setStaffTab(t.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition duration-150 whitespace-nowrap active:scale-95 ${
                        active
                          ? 'bg-zinc-900 text-amber-400 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                      {t.badge > 0 && (
                        <span className="ml-0.5 bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-bold flex items-center justify-center">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="hidden lg:flex items-center text-xs text-zinc-400 gap-2 shrink-0">
                <span>Operator: <strong className="text-zinc-100 font-semibold">{activeCashier.name}</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <strong className="text-emerald-400 font-semibold">Online</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================== MAIN ============================= */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-zinc-400">
            <div className="w-10 h-10 border-[3px] border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Memuat sistem MenuKu…</p>
          </div>
        ) : (
          <>
            {/* ----------------------- KATALOG + KERANJANG ----------------------- */}
            {(currentRole === 'customer' || (currentRole === 'staff' && staffTab === 'pos')) && (
              <div className="flex-1 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col min-w-0">
                  {currentRole === 'customer' && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/60 border border-amber-500/20 p-5 sm:p-7 text-white shadow-xl shadow-black/30 mb-5 flex items-center justify-between">
                      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-amber-500/10 blur-sm" />
                      <div className="absolute right-16 -bottom-14 w-36 h-36 rounded-full bg-amber-500/5" />
                      <div className="relative">
                        <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">Selamat datang di MenuKu</h2>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                          Pesanan untuk <strong className="font-bold text-amber-300">{selectedTable}</strong>. Pembayaran khusus digital.
                        </p>
                      </div>
                      <div className="relative hidden sm:block text-right">
                        <span className="inline-block text-[10px] uppercase font-bold tracking-widest bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25 px-3 py-1 rounded-full">
                          Digital Self Order
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Filter bar */}
                  <div className={`${ui.card} p-3 sm:p-4 mb-5`}>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                        {['All', 'Makanan', 'Minuman'].map((cat) => {
                          const active = selectedCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition duration-150 whitespace-nowrap active:scale-95 ${
                                active
                                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/70'
                              }`}
                            >
                              {cat === 'All' && <Layers className="w-4 h-4" />}
                              {cat === 'Makanan' && <UtensilsCrossed className="w-4 h-4" />}
                              {cat === 'Minuman' && <Coffee className="w-4 h-4" />}
                              <span>{cat === 'All' ? 'Semua' : cat}</span>
                              <span
                                className={`ml-0.5 text-[10px] min-w-[20px] px-1.5 py-0.5 rounded-full font-bold text-center ${
                                  active ? 'bg-black/15 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {cat === 'All'
                                  ? menuItems.length
                                  : menuItems.filter((i) => i.category === cat).length}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari menu…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`${ui.input} pl-10 pr-9 bg-zinc-800/40`}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-100 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className={`${ui.card} p-14 text-center flex flex-col items-center justify-center flex-1`}>
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-100">Menu tidak ditemukan</h3>
                      <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                        Tidak ada hidangan yang cocok dengan kata kunci "{searchQuery}".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 pb-28 lg:pb-0">
                      {filteredProducts.map((item) => {
                        const cartItem = cart.find((c) => c.id === item.id);
                        const isSoldOut = !item.is_available || item.stock <= 0;

                        return (
                          <div
                            key={item.id}
                            className={`group ${ui.card} overflow-hidden flex flex-col transition duration-200 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5 hover:border-zinc-700 ${
                              cartItem ? 'ring-2 ring-amber-500/60 border-amber-500/40' : ''
                            } ${isSoldOut ? 'opacity-60' : ''}`}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800">
                              <img
                                src={item.image}
                                alt={item.name}
                                className={`w-full h-full object-cover transition duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale' : ''}`}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent pointer-events-none" />
                              <span className="absolute top-2.5 left-2.5 bg-zinc-950/70 backdrop-blur text-zinc-300 text-[10px] font-semibold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                                {item.category === 'Makanan'
                                  ? <UtensilsCrossed className="w-3 h-3 text-amber-400" />
                                  : <Coffee className="w-3 h-3 text-amber-400" />}
                                <span className="hidden sm:inline">{item.category}</span>
                              </span>
                              <span
                                className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm ${
                                  isSoldOut
                                    ? 'bg-rose-500 text-white'
                                    : item.stock <= 5
                                    ? 'bg-amber-400 text-amber-950'
                                    : 'bg-zinc-950/70 backdrop-blur text-zinc-300'
                                }`}
                              >
                                {isSoldOut ? 'Habis' : `Stok ${item.stock}`}
                              </span>
                            </div>

                            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-zinc-50 text-sm leading-snug line-clamp-2">
                                    {item.name}
                                  </h4>
                                  {currentRole === 'staff' && (
                                    <button
                                      onClick={() => handleOpenEditMenuModal(item)}
                                      className={`${ui.iconBtn} p-1.5 shrink-0`}
                                      title="Edit Menu"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mt-1 hidden sm:block">
                                  {item.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm sm:text-base font-extrabold text-amber-300 tabular-nums tracking-tight">
                                  {formatRupiah(item.price)}
                                </p>

                                {cartItem ? (
                                  <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded-xl p-0.5 shrink-0">
                                    <button
                                      onClick={() => handleUpdateCartQty(item.id, -1)}
                                      className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-300 flex items-center justify-center shadow-sm hover:bg-zinc-800/60 active:scale-90 transition"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-7 text-center font-bold text-sm text-amber-400 tabular-nums">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      disabled={cartItem.quantity >= item.stock}
                                      onClick={() => handleUpdateCartQty(item.id, 1)}
                                      className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shadow-sm hover:bg-amber-400 active:scale-90 disabled:opacity-40 transition"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    disabled={isSoldOut}
                                    onClick={() => handleAddToCart(item)}
                                    className={`${ui.btnPrimary} px-3.5 py-2 text-xs shrink-0`}
                                  >
                                    <Plus className="w-4 h-4" />
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

                {/* Panel keranjang desktop */}
                <aside className="hidden lg:flex flex-col w-[380px] shrink-0">
                  <div className={`${ui.card} sticky top-36 flex flex-col h-[calc(100vh-10rem)] shadow-lg shadow-zinc-900/5`}>
                    <div className="px-5 py-4 border-b border-zinc-800/70 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-50 text-base">
                            {currentRole === 'staff' ? 'POS Workstation' : 'Keranjang Pesanan'}
                          </h3>
                          <span className="bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {totalCartCount} item
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {selectedTable} • {currentRole === 'staff' ? activeCashier.name.split(' ')[0] : 'Self-Order Tamu'}
                        </p>
                      </div>

                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 active:scale-90 transition"
                          title="Hapus Semua"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="px-5 pt-4 pb-3">
                      <label className={ui.label}>Nama pemesan</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama customer…"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={ui.input}
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2.5">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
                            <ShoppingBag className="w-7 h-7" />
                          </div>
                          <p className="font-semibold text-zinc-300 text-sm">Belum ada pesanan</p>
                          <p className="text-xs text-zinc-400 mt-1 max-w-[220px] leading-relaxed">
                            Pilih menu dari katalog untuk memulai transaksi.
                          </p>
                        </div>
                      ) : (
                        renderCartLines()
                      )}
                    </div>

                    {cart.length > 0 && (
                      <div className="p-5 border-t border-zinc-800/70 bg-zinc-800/30 rounded-b-2xl space-y-4">
                        {renderCartTotals()}
                        {renderCartActions(false)}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}

            {/* --------------------------- PESANAN MASUK --------------------------- */}
            {currentRole === 'staff' && staffTab === 'incoming' && (
              <div className="space-y-5">
                <div className={`${ui.card} p-4 sm:p-5 flex justify-between items-center`}>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-50">Antrean Pesanan Masuk</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      Kasir aktif: <strong className="text-zinc-100">{activeCashier.name}</strong>
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </div>

                {liveOrders.length === 0 ? (
                  <div className={`${ui.card} p-16 text-center`}>
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-zinc-100">Belum ada pesanan masuk</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Pesanan dari pelanggan akan muncul otomatis di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {liveOrders.map((ord) => {
                      const tone = orderTone(ord.status);
                      return (
                        <div
                          key={ord.id}
                          className={`relative overflow-hidden bg-zinc-900 rounded-2xl border shadow-sm flex flex-col justify-between transition duration-200 hover:shadow-md mk-rise ${tone.card}`}
                        >
                          <span className={`absolute left-0 top-0 bottom-0 w-1 ${tone.bar}`} />
                          <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                            <div className="flex justify-between items-start pb-3 border-b border-dashed border-zinc-800">
                              <div className="min-w-0">
                                <span className="font-extrabold text-zinc-50 text-base tracking-tight">{ord.order_code}</span>
                                <span className="block text-xs font-medium text-zinc-400 mt-0.5">
                                  {ord.table_no} • {ord.customer_name || 'Pelanggan'}
                                </span>
                                {ord.cashier_name && ord.cashier_name.includes('Self-Order') && (
                                  <span className="inline-block mt-1.5 bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                    {ord.cashier_name.includes('Take Away') ? 'Mode Tamu • Take Away' : 'Mode Tamu • Dine-In'}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset shrink-0 ${tone.badge}`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="py-3 space-y-2 text-sm text-zinc-300">
                              {ord.items.map((i, idx) => (
                                <div key={idx} className="flex justify-between gap-3">
                                  <span className="min-w-0">
                                    <strong className="text-amber-400 font-bold">{i.quantity}×</strong> {i.name}
                                    {i.note ? <span className="block text-xs text-zinc-500 italic">Catatan: {i.note}</span> : ''}
                                  </span>
                                  <span className="text-zinc-400 tabular-nums shrink-0">{formatRupiah(i.price * i.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="px-4 sm:px-5 pl-5 sm:pl-6 pb-4 sm:pb-5 pt-3 border-t border-zinc-800/70 bg-zinc-800/30 space-y-3">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-medium text-zinc-400">Total transaksi</span>
                              <span className="text-lg font-extrabold text-zinc-50 tabular-nums">{formatRupiah(ord.grand_total)}</span>
                            </div>

                            <button
                              onClick={() => handlePrintOrderReceipt(ord)}
                              className={`${ui.btnSecondary} w-full py-2.5 text-xs`}
                              title="Cetak Stiker/Struk Pesanan untuk Meja"
                            >
                              <Printer className="w-4 h-4 text-amber-400" />
                              <span>Cetak Stiker / Struk</span>
                            </button>

                            {ord.status === 'Menunggu Konfirmasi' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord, 'Sedang Disiapkan')}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-sky-600/25 transition active:scale-[0.97]"
                              >
                                Terima & Masak di Dapur
                              </button>
                            )}

                            {ord.status === 'Sedang Disiapkan' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord, 'Siap Diantar')}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-teal-600/25 transition active:scale-[0.97] flex items-center justify-center gap-2"
                              >
                                <Truck className="w-4 h-4" />
                                <span>Tandai Siap Diantar / Disajikan</span>
                              </button>
                            )}

                            {ord.status === 'Siap Diantar' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord, 'Selesai')}
                                className={`${ui.btnPrimary} w-full py-3 text-xs`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Selesaikan Pesanan & Lunas</span>
                              </button>
                            )}

                            {ord.status === 'Selesai' && (
                              <div className="text-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-2.5 rounded-xl ring-1 ring-inset ring-emerald-500/25 flex items-center justify-center gap-1.5">
                                <Check className="w-4 h-4" />
                                Transaksi selesai & lunas
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------- MENU & STOK ---------------------------- */}
            {currentRole === 'staff' && staffTab === 'inventory' && (
              <div className="space-y-5">
                <div className={`${ui.card} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-50">Manajemen Katalog & Stok Menu</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      Kelola daftar menu, ketersediaan porsi, dan harga secara real-time.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewMenuModal}
                    className={`${ui.btnPrimary} px-4 py-2.5 text-sm self-start sm:self-auto`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Menu Baru</span>
                  </button>
                </div>

                <div className={`${ui.card} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                      <thead className="bg-zinc-800/40 border-b border-zinc-800">
                        <tr>
                          <th className={ui.th}>Menu</th>
                          <th className={ui.th}>Kategori</th>
                          <th className={ui.th}>Harga</th>
                          <th className={ui.th}>Stok Porsi</th>
                          <th className={ui.th}>Status</th>
                          <th className={`${ui.th} text-right`}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {menuItems.map((prod) => (
                          <tr key={prod.id} className="hover:bg-zinc-50/80 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-zinc-50">{prod.name}</p>
                                  <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs">{prod.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] ring-1 ring-inset ${
                                  prod.category === 'Makanan'
                                    ? 'bg-amber-500/10 text-amber-400 ring-amber-500/25'
                                    : 'bg-sky-500/10 text-sky-400 ring-sky-500/25'
                                }`}
                              >
                                {prod.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-50 tabular-nums">{formatRupiah(prod.price)}</td>
                            <td className="px-4 py-3">
                              <span className={`font-bold tabular-nums ${prod.stock <= 5 ? 'text-rose-400' : 'text-zinc-100'}`}>
                                {prod.stock} porsi
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleProductAvailability(prod)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset transition active:scale-95 ${
                                  prod.is_available && prod.stock > 0
                                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 ring-rose-500/25 hover:bg-rose-500/20'
                                }`}
                              >
                                {prod.is_available && prod.stock > 0 ? 'Tersedia' : 'Habis'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditMenuModal(prod)}
                                  className={`${ui.iconBtn} p-2`}
                                  title="Edit Menu"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="inline-flex items-center justify-center p-2 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90"
                                  title="Hapus Menu"
                                >
                                  <Trash2 className="w-4 h-4" />
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

            {/* ----------------------------- SHIFT KASIR ----------------------------- */}
            {currentRole === 'staff' && staffTab === 'shift' && (
              <div className="max-w-2xl mx-auto w-full">
                <div className={`${ui.card} p-5 sm:p-7 space-y-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800/70 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-50">Shift & Rekonsiliasi Kasir</h3>
                        <p className="text-xs text-zinc-400">Kelola shift kerja dan audit kas fisik laci.</p>
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
                      className={`${ui.btnSecondary} px-3.5 py-2.5 text-xs`}
                    >
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span>Atur Shift & Kas</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800/70">
                    <div>
                      <span className="text-zinc-400 block text-[11px] uppercase font-semibold tracking-wider">Kasir bertugas</span>
                      <span className="font-bold text-zinc-50 text-sm mt-1 block">{activeCashier.name}</span>
                      <span className="text-xs text-amber-400 font-semibold">{activeCashier.role} POS</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[11px] uppercase font-semibold tracking-wider">Jadwal shift</span>
                      <span className="font-bold text-zinc-50 text-sm mt-1 block">{shiftData.shiftName}</span>
                      <span className="text-xs text-zinc-400">
                        {shiftData.startTime} s.d. {shiftData.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-300">
                    <div className="flex justify-between py-3 border-b border-zinc-800/70">
                      <span className="text-zinc-400">Modal kas awal laci (float)</span>
                      <span className="font-semibold text-zinc-50 tabular-nums">{formatRupiah(shiftData.initialFloat)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-zinc-800/70">
                      <span className="text-zinc-400">Penerimaan kas tunai</span>
                      <span className="font-semibold text-emerald-400 tabular-nums">+{formatRupiah(shiftData.cashSales)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-zinc-800/70">
                      <span className="text-zinc-400">Total transaksi non-tunai</span>
                      <span className="font-semibold text-sky-400 tabular-nums">{formatRupiah(shiftData.nonCashSales)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 py-4 px-4 rounded-2xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/25">
                      <span className="font-semibold text-amber-300">Target ekspektasi uang di laci</span>
                      <span className="text-lg font-extrabold text-amber-400 tabular-nums">{formatRupiah(shiftData.expectedCash)}</span>
                    </div>
                  </div>

                  <div>
                    <label className={ui.label}>
                      Hitung fisik uang di laci kasir ({activeCashier.name.split(' ')[0]})
                    </label>
                    <input
                      type="number"
                      placeholder="Masukkan total uang fisik di laci…"
                      value={shiftData.countedCash}
                      onChange={(e) => {
                        const val = e.target.value;
                        const diff = val ? Number(val) - shiftData.expectedCash : null;
                        setShiftData({ ...shiftData, countedCash: val, shiftDiscrepancy: diff });
                      }}
                      className={`${ui.input} text-base font-bold py-3`}
                    />
                  </div>

                  {shiftData.countedCash && (
                    <div
                      className={`p-4 rounded-2xl text-sm flex items-center justify-between ring-1 ring-inset mk-rise ${
                        shiftData.shiftDiscrepancy === 0
                          ? 'bg-emerald-500/10 ring-emerald-500/25 text-emerald-400'
                          : 'bg-rose-500/10 ring-rose-500/25 text-rose-400'
                      }`}
                    >
                      <span className="font-semibold">Selisih laci kas</span>
                      <span className="font-extrabold tabular-nums">
                        {formatRupiah(shiftData.shiftDiscrepancy)}
                        {shiftData.shiftDiscrepancy === 0 ? ' (Pas)' : ' (Ada selisih)'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      alert(`Shift untuk ${activeCashier.name} berhasil ditutup & diarsipkan!`);
                      setShiftData((s) => ({ ...s, countedCash: '', shiftDiscrepancy: null }));
                    }}
                    className={`${ui.btnDark} w-full py-3.5 text-sm`}
                  >
                    Tutup Shift & Arsipkan Laporan Kasir
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------- LAPORAN OMZET ---------------------------- */}
            {currentRole === 'staff' && staffTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`${ui.card} p-5`}>
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Total omzet lunas</span>
                    <p className="text-2xl font-extrabold text-zinc-50 mt-2 tabular-nums tracking-tight">
                      {formatRupiah(
                        liveOrders
                          .filter((o) => o.status === 'Selesai')
                          .reduce((s, o) => s + Number(o.grand_total), 0)
                      )}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold mt-2 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      <span>Real-time</span>
                    </div>
                  </div>

                  <div className={`${ui.card} p-5`}>
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Transaksi selesai</span>
                    <p className="text-2xl font-extrabold text-zinc-50 mt-2 tabular-nums">
                      {liveOrders.filter((o) => o.status === 'Selesai').length} <span className="text-sm font-semibold text-zinc-500">nota</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">Pembayaran terverifikasi</p>
                  </div>

                  <div className={`${ui.card} p-5`}>
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Pesanan dalam proses</span>
                    <p className="text-2xl font-extrabold text-amber-400 mt-2 tabular-nums">
                      {pendingCount} <span className="text-sm font-semibold text-zinc-500">pesanan</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">Dapur / menunggu konfirmasi</p>
                  </div>

                  <div className={`${ui.card} p-5`}>
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">Tim kasir terdaftar</span>
                    <p className="text-2xl font-extrabold text-zinc-50 mt-2 tabular-nums">
                      {CASHIERS_LIST.length} <span className="text-sm font-semibold text-zinc-500">operator</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">Sistem POS multi-kasir</p>
                  </div>
                </div>

                <div className={`${ui.card} overflow-hidden`}>
                  <div className="p-4 sm:p-5 border-b border-zinc-800/70 flex items-center justify-between gap-3">
                    <h4 className="font-bold text-zinc-50">Riwayat Transaksi & Laporan Omzet</h4>
                    <button
                      onClick={handleExportCSV}
                      className={`${ui.btnPrimary} px-3.5 py-2.5 text-xs shrink-0`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Ekspor CSV</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                      <thead className="bg-zinc-800/40 border-b border-zinc-800">
                        <tr>
                          <th className={ui.th}>ID Order</th>
                          <th className={ui.th}>Meja / Customer</th>
                          <th className={ui.th}>Metode Bayar</th>
                          <th className={ui.th}>Status</th>
                          <th className={`${ui.th} text-right`}>Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {liveOrders.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                            <td className="px-4 py-3 font-bold text-zinc-50">{item.order_code}</td>
                            <td className="px-4 py-3 text-zinc-300">{item.table_no} • {item.customer_name || 'Pelanggan'}</td>
                            <td className="px-4 py-3">
                              <span className="bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md text-xs font-medium">
                                {item.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                                  item.status === 'Selesai'
                                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25'
                                    : 'bg-amber-500/10 text-amber-400 ring-amber-500/25'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-50 tabular-nums">{formatRupiah(item.grand_total)}</td>
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

      {/* ===================== BAR KERANJANG MOBILE ===================== */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-zinc-950/70 backdrop-blur-xl border-t border-zinc-800 p-3 px-4 z-40 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))] mk-rise">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <button onClick={() => setIsMobileCartOpen(true)} className="flex items-center gap-3 text-left min-w-0 flex-1 active:scale-[0.98] transition">
              <div className="relative w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-zinc-100 text-zinc-900 text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-zinc-900">
                  {totalCartCount}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-400 font-medium truncate">
                  {selectedTable} • {totalCartCount} item
                </p>
                <p className="text-base font-extrabold text-zinc-50 tabular-nums">{formatRupiah(grandTotal)}</p>
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
              className={`${ui.btnPrimary} px-4 py-3 text-xs shrink-0`}
            >
              <span>{currentRole === 'staff' ? 'Bayar Kasir' : 'Lihat Keranjang'}</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================== BOTTOM SHEET KERANJANG ====================== */}
      {isMobileCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm lg:hidden mk-fade"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMobileCartOpen(false); }}
        >
          <div className="bg-zinc-900 w-full max-h-[88vh] rounded-t-3xl flex flex-col shadow-2xl mk-sheet">
            <div className="pt-3 flex justify-center">
              <span className="w-10 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-zinc-800/70">
              <div>
                <h3 className="font-bold text-zinc-50">Rincian Keranjang</h3>
                <p className="text-xs text-zinc-400">{selectedTable} • {totalCartCount} item</p>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 active:scale-90 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-1">
              <label className={ui.label}>Nama pemesan</label>
              <input
                type="text"
                placeholder="Masukkan nama customer…"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={ui.input}
              />
            </div>

            <div className="overflow-y-auto px-5 py-3 space-y-2.5 flex-1">
              {renderCartLines()}
            </div>

            <div className="p-5 border-t border-zinc-800/70 bg-zinc-800/30 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {renderCartTotals()}
              {renderCartActions(true)}
            </div>
          </div>
        </div>
      )}

      {/* ============================ MODAL LOGIN ============================ */}
      {isLoginModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-sm`}>
            <div className={ui.modalHead}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-50">Otorisasi Staff POS</h3>
              </div>
              <button
                onClick={() => { setIsLoginModalOpen(false); setPinError(''); setPinInput(''); }}
                className={`${ui.iconBtn} p-2`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStrictLogin} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className={ui.label}>Pilih nama operator kasir</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {CASHIERS_LIST.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCashierLogin(c);
                        setPinInput('');
                        setPinError('');
                      }}
                      className={`px-3.5 py-2.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition duration-150 active:scale-[0.98] ${
                        selectedCashierLogin.id === c.id
                          ? 'border-amber-500 bg-amber-500/10 font-semibold text-amber-300 ring-4 ring-amber-500/10'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <span>{c.name}</span>
                      {selectedCashierLogin.id === c.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-2 text-center uppercase tracking-wider">
                  PIN {selectedCashierLogin.name.split(' ')[0]}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.9em] text-2xl font-extrabold bg-zinc-800/40 border border-zinc-800 rounded-2xl py-3 text-zinc-50 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/10 ring-1 ring-inset ring-rose-500/25 text-rose-400 text-xs font-semibold flex items-center gap-2 mk-rise">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
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
                    className={`py-3 rounded-xl font-bold text-sm transition duration-100 active:scale-90 ${
                      keyVal === 'OK'
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ring-1 ring-inset ring-amber-500/25'
                        : keyVal === 'C'
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 ring-1 ring-inset ring-rose-500/25'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                    }`}
                  >
                    {keyVal}
                  </button>
                ))}
              </div>

              <button type="submit" className={`${ui.btnPrimary} w-full py-3.5 text-sm`}>
                Otorisasi & Masuk POS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================ MODAL SHIFT ============================ */}
      {isEditShiftModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-md`}>
            <div className={ui.modalHead}>
              <h3 className="text-base font-bold text-zinc-50">Pengaturan Shift & Target Kas</h3>
              <button onClick={() => setIsEditShiftModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftConfig} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className={ui.label}>Pilih shift restoran</label>
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
                  className={`${ui.input} font-semibold`}
                >
                  <option value="Shift 1 (Jam 08:00 Pagi)">Shift 1 (Mulai Jam 08:00 Pagi)</option>
                  <option value="Shift 2 (Jam 15:00 / 3 Sore)">Shift 2 (Mulai Jam 15:00 / 3 Sore)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={ui.label}>Jam mulai</label>
                  <input
                    type="text"
                    value={tempShiftForm.startTime}
                    onChange={(e) => setTempShiftForm({ ...tempShiftForm, startTime: e.target.value })}
                    className={ui.input}
                  />
                </div>
                <div>
                  <label className={ui.label}>Jam selesai</label>
                  <input
                    type="text"
                    value={tempShiftForm.endTime}
                    onChange={(e) => setTempShiftForm({ ...tempShiftForm, endTime: e.target.value })}
                    className={ui.input}
                  />
                </div>
              </div>

              <div>
                <label className={ui.label}>Modal awal kas (initial float)</label>
                <input
                  type="number"
                  value={tempShiftForm.initialFloat}
                  onChange={(e) => setTempShiftForm({ ...tempShiftForm, initialFloat: e.target.value })}
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Target ekspektasi kas di laci (expected cash)</label>
                <input
                  type="number"
                  value={tempShiftForm.expectedCash}
                  onChange={(e) => setTempShiftForm({ ...tempShiftForm, expectedCash: e.target.value })}
                  className={`${ui.input} font-bold text-amber-400`}
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditShiftModalOpen(false)}
                  className={`${ui.btnSecondary} w-1/3 py-3 text-sm`}
                >
                  Batal
                </button>
                <button type="submit" className={`${ui.btnPrimary} w-2/3 py-3 text-sm`}>
                  Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================= MODAL GABUNG MEJA ========================= */}
      {isMergeTableModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-sm`}>
            <div className={ui.modalHead}>
              <h3 className="font-bold text-zinc-50">Gabung Meja</h3>
              <button onClick={() => setIsMergeTableModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-zinc-400">
                Pilih meja yang akan digabungkan ke <strong className="text-amber-400">{selectedTable}</strong>:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {tableList.filter((t) => t !== selectedTable).map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => {
                      setSelectedTable(`${selectedTable} + ${tbl}`);
                      setIsMergeTableModalOpen(false);
                      alert(`Berhasil menggabungkan tagihan ${tbl} ke ${selectedTable}!`);
                    }}
                    className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/10 rounded-xl text-sm font-semibold text-zinc-300 hover:text-amber-300 text-left transition active:scale-[0.97]"
                  >
                    + {tbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================ MODAL PEMBAYARAN ============================ */}
      {isPaymentModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-lg max-h-[92vh] flex flex-col`}>
            <div className={`${ui.modalHead} shrink-0`}>
              <div>
                <h3 className="text-base font-bold text-zinc-50">Pembayaran Tagihan</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{selectedTable}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 sm:px-6 pt-5 shrink-0">
              <div className="rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-zinc-950 px-5 py-4 flex items-center justify-between shadow-lg shadow-amber-500/20">
                <span className="text-xs font-semibold text-amber-950/70">Total yang harus dibayar</span>
                <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatRupiah(grandTotal)}</span>
              </div>

              <div className={`grid gap-2 mt-4 ${currentRole === 'staff' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {[
                  { key: 'qris', label: 'QRIS', icon: QrCode, show: true },
                  { key: 'cash', label: 'Tunai', icon: Banknote, show: currentRole === 'staff' },
                  { key: 'ewallet', label: 'E-Wallet', icon: Smartphone, show: true },
                  { key: 'card', label: 'EDC Card', icon: CreditCard, show: currentRole === 'staff' },
                ]
                  .filter((m) => m.show)
                  .map((m) => {
                    const Icon = m.icon;
                    const active = paymentType === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setPaymentType(m.key)}
                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition duration-150 active:scale-95 ${
                          active
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-4 ring-amber-500/10'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800/60'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-zinc-500'}`} />
                        {m.label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="mx-5 sm:mx-6 my-4 bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/70 min-h-[190px] flex flex-col justify-center overflow-y-auto flex-1">
              {paymentType === 'qris' && (
                <div className="flex flex-col items-center text-center space-y-3 mk-rise">
                  <div className="bg-white p-3 rounded-2xl ring-4 ring-amber-500/20 shadow-lg shadow-black/40">
                    <svg className="w-28 h-28 sm:w-32 sm:h-32" viewBox="0 0 100 100" fill="none">
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
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25 text-xs font-bold px-3 py-1 rounded-full tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(qrisTimer / 60)}:{(qrisTimer % 60).toString().padStart(2, '0')}
                    </span>
                    <p className="text-xs text-zinc-400 mt-2">Scan via BCA, GoPay, OVO, ShopeePay, DANA, atau Livin</p>
                  </div>
                </div>
              )}

              {currentRole === 'staff' && paymentType === 'cash' && (
                <div className="space-y-3 mk-rise">
                  <div>
                    <label className={ui.label}>Uang tunai diterima (Rp)</label>
                    <input
                      type="number"
                      placeholder={grandTotal.toString()}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className={`${ui.input} text-xl font-extrabold py-3 tabular-nums`}
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[grandTotal, 50000, 100000, 150000, 200000].map((nominal) => (
                      <button
                        key={nominal}
                        onClick={() => setCashTendered(nominal.toString())}
                        className="text-xs bg-zinc-900 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/40 border border-zinc-800 px-3 py-2 rounded-lg font-semibold text-zinc-400 transition active:scale-95"
                      >
                        {nominal === grandTotal ? 'Uang Pas' : formatRupiah(nominal)}
                      </button>
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-300">Kembalian</span>
                    <span className="text-xl font-extrabold text-emerald-400 tabular-nums">{formatRupiah(cashChange)}</span>
                  </div>
                </div>
              )}

              {paymentType === 'ewallet' && (
                <div className="space-y-3 mk-rise">
                  <p className="text-xs font-semibold text-zinc-400">Pilih dompet digital</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['GoPay', 'OVO', 'ShopeePay', 'DANA'].map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setEWalletBrand(brand)}
                        className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between transition active:scale-[0.97] ${
                          eWalletBrand === brand
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-4 ring-amber-500/10'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800/60'
                        }`}
                      >
                        <span>{brand}</span>
                        {eWalletBrand === brand && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentType === 'card' && (
                <div className="text-center py-4 space-y-2 mk-rise">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-sm">
                    <CreditCard className="w-7 h-7 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">Gesek / tap pada mesin EDC</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Mendukung seluruh kartu debit dan kredit berlogo Visa, Mastercard, dan GPN.
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-2 shrink-0">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className={`${ui.btnSecondary} w-1/3 py-3.5 text-sm`}
              >
                Batal
              </button>
              <button
                onClick={() => handleCheckoutSuccess(currentRole === 'customer')}
                className={`${ui.btnPrimary} w-2/3 py-3.5 text-sm`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan Pembayaran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================ MODAL SPLIT BILL ============================ */}
      {isSplitBillModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-md`}>
            <div className={ui.modalHead}>
              <h3 className="font-bold text-zinc-50">Pemisahan Tagihan (Split Bill)</h3>
              <button onClick={() => setIsSplitBillModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => setSplitMethod('equal')}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition duration-150 ${
                    splitMethod === 'equal' ? 'bg-zinc-900 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Bagi Rata
                </button>
                <button
                  onClick={() => setSplitMethod('item')}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition duration-150 ${
                    splitMethod === 'item' ? 'bg-zinc-900 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Per Item Pesanan
                </button>
              </div>

              {splitMethod === 'equal' ? (
                <div className="space-y-4 mk-rise">
                  <div>
                    <label className={ui.label}>Jumlah tamu pembayar</label>
                    <div className="flex items-center justify-between bg-zinc-800/40 border border-zinc-800 rounded-2xl p-2">
                      <button
                        onClick={() => setSplitPersons(Math.max(2, splitPersons - 1))}
                        className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 active:scale-90 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-extrabold text-xl text-zinc-50 tabular-nums">{splitPersons} orang</span>
                      <button
                        onClick={() => setSplitPersons(splitPersons + 1)}
                        className="w-11 h-11 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center hover:bg-amber-400 active:scale-90 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 ring-1 ring-inset ring-amber-500/25 p-5 rounded-2xl text-center">
                    <p className="text-xs text-amber-300 font-semibold">Nominal per orang</p>
                    <p className="text-3xl font-extrabold text-amber-400 mt-1 tabular-nums tracking-tight">
                      {formatRupiah(Math.ceil(grandTotal / splitPersons))}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">Total asli: {formatRupiah(grandTotal)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto mk-rise">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-zinc-800/40 border border-zinc-800/70 rounded-xl text-zinc-300">
                      <span>{item.name} <span className="text-zinc-500">({item.quantity}×)</span></span>
                      <span className="font-bold text-zinc-50 tabular-nums">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setIsSplitBillModalOpen(false);
                  setIsPaymentModalOpen(true);
                }}
                className={`${ui.btnPrimary} w-full py-3.5 text-sm`}
              >
                Lanjutkan Pembayaran
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================== MODAL STRUK ============================== */}
      {isReceiptModalOpen && lastProcessedOrder && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-md max-h-[92vh] flex flex-col`}>
            <div className={`${ui.modalHead} shrink-0 no-print`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-50">Cetak Stiker / Struk Meja</h3>
                  <p className="text-xs text-zinc-400">Pratinjau 3 lembar siap cetak</p>
                </div>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="receipt-area flex-1 overflow-y-auto bg-zinc-950 px-4 py-5 space-y-4">
              {[1, 2, 3].map((copyNum) => (
                <div
                  key={copyNum}
                  id={copyNum === 1 ? 'printable-receipt' : `printable-receipt-copy-${copyNum}`}
                  className={`receipt-paper bg-white text-slate-900 mx-auto w-full max-w-[340px] px-5 py-6 rounded-lg shadow-md shadow-slate-900/10 border border-slate-200/70 font-mono text-xs ${
                    copyNum > 1 ? 'hidden print:block' : 'block'
                  }`}
                  style={{
                    pageBreakAfter: copyNum < 3 ? 'always' : 'auto',
                    breakAfter: copyNum < 3 ? 'page' : 'auto'
                  }}
                >
                  <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
                    <h4 className="font-extrabold text-sm tracking-[0.18em] text-slate-900 leading-snug">
                      RESTORAN NUSANTARA
                      <br />
                      KELOMPOK C
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">Executive Dining Experience</p>
                    <p className="text-[10px] text-slate-500">Kawasan Industri Cikarang, Bekasi</p>
                  </div>

                  <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>No. Pesanan</span>
                      <strong className="text-slate-900">{lastProcessedOrder.orderId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu</span>
                      <span className="text-slate-900">{lastProcessedOrder.date} {lastProcessedOrder.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meja</span>
                      <strong className="text-slate-900">{lastProcessedOrder.table}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer</span>
                      <strong className="text-slate-900">{lastProcessedOrder.customerName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir/Petugas</span>
                      <strong className="text-slate-900 text-right">{lastProcessedOrder.cashier}</strong>
                    </div>
                  </div>

                  <div className="py-3 space-y-2.5 border-b border-dashed border-slate-300">
                    {lastProcessedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-3 text-[11px]">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-snug">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.quantity} × {formatRupiah(item.price)}
                          </p>
                          {item.note && <p className="text-[10px] text-slate-500 italic">* {item.note}</p>}
                        </div>
                        <span className="font-semibold text-slate-900 shrink-0">{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="py-3 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatRupiah(lastProcessedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak (PB1 10%)</span>
                      <span>{formatRupiah(lastProcessedOrder.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Layanan</span>
                      <span>{formatRupiah(lastProcessedOrder.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm pt-2 mt-2 border-t-2 border-slate-900 text-slate-900">
                      <span>GRAND TOTAL</span>
                      <span>{formatRupiah(lastProcessedOrder.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1.5">
                      <span>Metode bayar</span>
                      <span className="text-right">{lastProcessedOrder.paymentMethod}</span>
                    </div>
                  </div>

                  {lastProcessedOrder.paymentMethod.includes('Tunai') && (
                    <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Tunai diterima</span>
                        <span>{formatRupiah(lastProcessedOrder.cashGiven)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold">
                        <span>Kembalian</span>
                        <span>{formatRupiah(lastProcessedOrder.cashChange)}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4 mt-3 border-t-2 border-dashed border-slate-300 text-[10px] text-slate-500 leading-relaxed">
                    <p className="font-bold text-slate-700">Terima kasih atas kunjungan Anda!</p>
                    <p>Harap bawa stiker ini bersama pesanan ke {lastProcessedOrder.table}.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 sm:p-5 shrink-0 border-t border-zinc-800/70 no-print">
              <button
                onClick={() => window.print()}
                className={`${ui.btnPrimary} py-3 text-sm`}
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sekarang</span>
              </button>

              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                }}
                className={`${ui.btnSecondary} py-3 text-sm`}
              >
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== MODAL PESANAN BERHASIL ====================== */}
      {isCustomerOrderDoneModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-sm p-7 text-center space-y-5`}>
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 ring-8 ring-amber-500/5 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-50 text-lg">Pesanan berhasil dikirim!</h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Silakan selesaikan pembayaran digital Anda. Staf kasir akan memverifikasi dan segera menyiapkan pesanan ke meja Anda.
              </p>
            </div>
            <button
              onClick={() => setIsCustomerOrderDoneModalOpen(false)}
              className={`${ui.btnPrimary} w-full py-3.5 text-sm`}
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================== MODAL FORM MENU ========================== */}
      {isMenuFormModalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-md`}>
            <div className={ui.modalHead}>
              <h3 className="font-bold text-zinc-50">
                {editingProduct ? 'Ubah Detail Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsMenuFormModalOpen(false)} className={`${ui.iconBtn} p-2`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4">
              {productFormData.image && (
                <div className="h-32 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-800">
                  <img src={productFormData.image} alt="Pratinjau" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className={ui.label}>Nama hidangan / minuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Wagyu Beef Steak"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className={ui.input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={ui.label}>Kategori</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className={`${ui.input} font-semibold`}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
                <div>
                  <label className={ui.label}>Stok porsi</label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                    className={ui.input}
                  />
                </div>
              </div>

              <div>
                <label className={ui.label}>Harga jual (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="45000"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label}>Deskripsi singkat</label>
                <textarea
                  rows={2}
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className={`${ui.input} resize-none`}
                />
              </div>

              <div>
                <label className={ui.label}>URL gambar / foto</label>
                <input
                  type="url"
                  value={productFormData.image}
                  onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                  className={ui.input}
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuFormModalOpen(false)}
                  className={`${ui.btnSecondary} w-1/3 py-3 text-sm`}
                >
                  Batal
                </button>
                <button type="submit" className={`${ui.btnPrimary} w-2/3 py-3 text-sm`}>
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
