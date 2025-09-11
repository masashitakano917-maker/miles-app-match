import React, { useState, useEffect } from 'react';
import type { User, Order, Professional } from '../types';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  LogOut, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Save,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { NotificationService } from '../services/NotificationService';
import { AnalyticsService } from '../services/AnalyticsService';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProfessionalForm, setShowProfessionalForm] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  
  // Customer management state
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Label management state
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<any[]>([]);
  
  // Analytics state
  const [viewMode, setViewMode] = useState<'current' | 'comparison'>('current');
  const [dateRange, setDateRange] = useState(AnalyticsService.getDateRangePresets().thisMonth);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Service and day options for filters
  const serviceOptions = [
    { value: '', label: '全サービス' },
    { value: 'photo-service', label: '写真撮影' },
    { value: 'cleaning-service', label: 'お掃除' },
    { value: 'staff-service', label: 'スタッフ派遣' }
  ];

  const dayOptions = [
    { value: 0, label: '日曜日' },
    { value: 1, label: '月曜日' },
    { value: 2, label: '火曜日' },
    { value: 3, label: '水曜日' },
    { value: 4, label: '木曜日' },
    { value: 5, label: '金曜日' },
    { value: 6, label: '土曜日' }
  ];

  // Professional form state
  const [professionalForm, setProfessionalForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    equipment: '',
    experience: '',
    labels: [] as any[],
    address: {
      postalCode: '',
      prefecture: '',
      city: '',
      detail: ''
    }
  });

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Listen for order updates
    const handleOrdersUpdate = (event: CustomEvent) => {
      setOrders(event.detail);
    };
    
    window.addEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
    };
  }, []);

  const loadData = () => {
    const loadedOrders = DataService.loadOrders();
    const loadedProfessionals = DataService.loadProfessionals();
    const loadedCustomers = DataService.loadCustomers();
    const loadedLabels = DataService.loadLabels();
    
    setOrders(loadedOrders);
    setProfessionals(loadedProfessionals);
    setCustomers(loadedCustomers);
    setAvailableLabels(loadedLabels);
  };

  // Calculate analytics
  const currentAnalytics = AnalyticsService.getAnalytics(orders, {
    dateRange,
    serviceId: selectedService || undefined,
    dayOfWeek: selectedDays.length > 0 ? selectedDays : undefined
  });

  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date() }
        : order
    );
    
    setOrders(updatedOrders);
    DataService.saveOrders(updatedOrders);
    
    console.log(`✅ 注文 ${orderId} のステータスを ${newStatus} に更新しました`);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('この注文を削除しますか？')) {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      DataService.saveOrders(updatedOrders);
      console.log(`✅ 注文 ${orderId} を削除しました`);
    }
  };

  const handleAddProfessional = () => {
    setEditingProfessional(null);
    setProfessionalForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      bio: '',
      equipment: '',
      experience: '',
      labels: [],
      address: {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });
    setShowProfessionalForm(true);
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setProfessionalForm({
      name: professional.name,
      email: professional.email,
      phone: professional.phone || '',
      password: professional.password || '',
      bio: professional.bio || '',
      equipment: professional.equipment || '',
      experience: professional.experience || '',
      labels: [],
      address: professional.address || {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });
    setShowProfessionalForm(true);
    setSelectedLabels(professional.labels || []);
  };

  const handleSaveProfessional = async () => {
    const isNew = !editingProfessional;
    
    const professionalData: Professional = {
      id: editingProfessional?.id || `professional-${Date.now()}`,
      name: professionalForm.name,
      email: professionalForm.email,
      phone: professionalForm.phone,
      role: 'professional',
      labels: selectedLabels,
      isActive: editingProfessional?.isActive ?? true,
      completedJobs: editingProfessional?.completedJobs ?? 0,
      rating: editingProfessional?.rating ?? 5.0,
      bio: professionalForm.bio,
      equipment: professionalForm.equipment,
      experience: professionalForm.experience,
      password: professionalForm.password,
      address: professionalForm.address
    };

    let updatedProfessionals;
    if (isNew) {
      updatedProfessionals = [...professionals, professionalData];
    } else {
      updatedProfessionals = professionals.map(p => 
        p.id === editingProfessional!.id ? professionalData : p
      );
    }

    setProfessionals(updatedProfessionals);
    DataService.saveProfessionals(updatedProfessionals);

    // Send notification
    await NotificationService.sendProfessionalRegistrationNotification(professionalData, isNew);

    setShowProfessionalForm(false);
    console.log(`✅ プロフェッショナルを${isNew ? '追加' : '更新'}しました`);
  };

  const handleDeleteProfessional = (professionalId: string) => {
    if (confirm('このプロフェッショナルを削除しますか？')) {
      const updatedProfessionals = professionals.filter(p => p.id !== professionalId);
      setProfessionals(updatedProfessionals);
      DataService.saveProfessionals(updatedProfessionals);
      console.log(`✅ プロフェッショナル ${professionalId} を削除しました`);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('このカスタマーを削除しますか？')) {
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      setCustomers(updatedCustomers);
      DataService.saveCustomers(updatedCustomers);
      console.log(`✅ カスタマー ${customerId} を削除しました`);
    }
  };

  const handleAddLabel = (label: any) => {
    if (!selectedLabels.find(l => l.id === label.id)) {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const handleRemoveLabel = (labelId: string) => {
    setSelectedLabels(selectedLabels.filter(l => l.id !== labelId));
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'matched':
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    const statusLabels = {
      pending: '受付中',
      matched: 'マッチ済',
      in_progress: '作業中',
      completed: '完了',
      cancelled: 'キャンセル'
    };
    return statusLabels[status];
  };

  const getServiceName = (serviceId: string, planId: string) => {
    const serviceNames: { [key: string]: { [key: string]: string } } = {
      'photo-service': {
        'real-estate': '不動産撮影',
        'portrait': 'ポートレート撮影',
        'food': 'フード撮影'
      },
      'cleaning-service': {
        '1ldk': '1LDK清掃',
        '2ldk': '2LDK清掃',
        '3ldk': '3LDK清掃'
      },
      'staff-service': {
        'translation': '翻訳',
        'interpretation': '通訳',
        'companion': 'イベントコンパニオン'
      }
    };
    return serviceNames[serviceId]?.[planId] || 'サービス';
  };

  const getPlanPrice = (planId: string) => {
    const prices: { [key: string]: number } = {
      'real-estate': 15000,
      'portrait': 12000,
      'food': 18000,
      '1ldk': 8000,
      '2ldk': 12000,
      '3ldk': 16000,
      'translation': 5000,
      'interpretation': 8000,
      'companion': 15000
    };
    return prices[planId] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">管理者ダッシュボード</h1>
              <p className="text-gray-300">こんにちは、{user.name}さん</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">総注文数</p>
                <p className="text-2xl font-bold text-white">{currentAnalytics.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">総売上</p>
                <p className="text-2xl font-bold text-white">¥{currentAnalytics.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">完了案件</p>
                <p className="text-2xl font-bold text-white">{currentAnalytics.completedOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">プロフェッショナル</p>
                <p className="text-2xl font-bold text-white">{professionals.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '概要', icon: TrendingUp },
              { id: 'orders', label: '注文管理', icon: ShoppingCart },
              { id: 'professionals', label: 'プロフェッショナル管理', icon: Users },
              { id: 'analytics', label: '分析', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              カスタマー管理
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">システム概要</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">最近の注文</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{getServiceName(order.serviceId, order.planId)}</p>
                        <p className="text-sm text-gray-400">{order.customerName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm text-gray-300">{getStatusLabel(order.status)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">アクティブプロフェッショナル</h3>
                <div className="space-y-3">
                  {professionals.filter(p => p.isActive).slice(0, 5).map((professional) => (
                    <div key={professional.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{professional.name}</p>
                        <p className="text-sm text-gray-400">{professional.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-orange-400">⭐ {professional.rating}</p>
                        <p className="text-xs text-gray-400">{professional.completedJobs}件完了</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">注文管理</h2>
            
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        注文ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        顧客
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        サービス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        注文日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{order.customerName}</div>
                            <div className="text-sm text-gray-400">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {getServiceName(order.serviceId, order.planId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className="text-sm text-gray-300">{getStatusLabel(order.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.createdAt.toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewOrderDetail(order)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-400 hover:text-red-300"
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

        {/* Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">プロフェッショナル管理</h2>
              <button
                onClick={handleAddProfessional}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新規追加
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        メール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        スキル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        評価
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {professionals.map((professional) => (
                      <tr key={professional.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{professional.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {professional.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {professional.labels?.map(l => l.name).join(', ') || '未設定'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-400">
                          ⭐ {professional.rating}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            professional.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {professional.isActive ? 'アクティブ' : '非アクティブ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProfessional(professional)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfessional(professional.id)}
                              className="text-red-400 hover:text-red-300"
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

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">カスタマー管理</h2>
            
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        名前
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        メール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        電話番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        住所
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        登録日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {customer.phone || '未設定'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {customer.address ? 
                            `${customer.address.prefecture} ${customer.address.city}` : 
                            '未設定'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-400 hover:text-red-300"
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
              
              {customers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">カスタマーが登録されていません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">分析データ</h2>
            
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">フィルター</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">サービス</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {serviceOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">曜日</label>
                  <select
                    multiple
                    value={selectedDays.map(String)}
                    onChange={(e) => setSelectedDays(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    {dayOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">総注文数</h4>
                <p className="text-2xl font-bold text-white">{currentAnalytics.totalOrders}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">総売上</h4>
                <p className="text-2xl font-bold text-white">¥{currentAnalytics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">完了率</h4>
                <p className="text-2xl font-bold text-white">
                  {currentAnalytics.totalOrders > 0 
                    ? Math.round((currentAnalytics.completedOrders / currentAnalytics.totalOrders) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">平均注文額</h4>
                <p className="text-2xl font-bold text-white">¥{Math.round(currentAnalytics.averageOrderValue).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">注文詳細</h3>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">基本情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">注文ID:</span>
                    <span className="text-white ml-2">{selectedOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">サービス:</span>
                    <span className="text-white ml-2">{getServiceName(selectedOrder.serviceId, selectedOrder.planId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">料金:</span>
                    <span className="text-white ml-2">¥{getPlanPrice(selectedOrder.planId).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ステータス:</span>
                    <span className="text-white ml-2">{getStatusLabel(selectedOrder.status)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">顧客情報</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">名前:</span>
                    <span className="text-white ml-2">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">電話:</span>
                    <span className="text-white ml-2">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">メール:</span>
                    <span className="text-white ml-2">{selectedOrder.customerEmail}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">作業場所</h4>
                <p className="text-white text-sm">
                  〒{selectedOrder.address.postalCode}<br />
                  {selectedOrder.address.prefecture} {selectedOrder.address.city}<br />
                  {selectedOrder.address.detail}
                </p>
              </div>

              {selectedOrder.specialNotes && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">特記事項</h4>
                  <p className="text-white text-sm bg-gray-700 p-3 rounded">{selectedOrder.specialNotes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowOrderDetail(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Form Modal */}
      {showProfessionalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingProfessional ? 'プロフェッショナル編集' : 'プロフェッショナル追加'}
              </h3>
              <button
                onClick={() => setShowProfessionalForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">名前</label>
                  <input
                    type="text"
                    value={professionalForm.name}
                    onChange={(e) => setProfessionalForm({...professionalForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">メール</label>
                  <input
                    type="email"
                    value={professionalForm.email}
                    onChange={(e) => setProfessionalForm({...professionalForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">電話</label>
                  <input
                    type="tel"
                    value={professionalForm.phone}
                    onChange={(e) => setProfessionalForm({...professionalForm, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
                  <input
                    type="password"
                    value={professionalForm.password}
                    onChange={(e) => setProfessionalForm({...professionalForm, password: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">自己紹介</label>
                <textarea
                  rows={3}
                  value={professionalForm.bio}
                  onChange={(e) => setProfessionalForm({...professionalForm, bio: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">郵便番号</label>
                  <input
                    type="text"
                    value={professionalForm.address.postalCode}
                    onChange={(e) => setProfessionalForm({
                      ...professionalForm, 
                      address: {...professionalForm.address, postalCode: e.target.value}
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">都道府県</label>
                  <input
                    type="text"
                    value={professionalForm.address.prefecture}
                    onChange={(e) => setProfessionalForm({
                      ...professionalForm, 
                      address: {...professionalForm.address, prefecture: e.target.value}
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">市区町村</label>
                  <input
                    type="text"
                    value={professionalForm.address.city}
                    onChange={(e) => setProfessionalForm({
                      ...professionalForm, 
                      address: {...professionalForm.address, city: e.target.value}
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">それ以降の住所</label>
                  <input
                    type="text"
                    value={professionalForm.address.detail}
                    onChange={(e) => setProfessionalForm({
                      ...professionalForm, 
                      address: {...professionalForm.address, detail: e.target.value}
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">スキル・ラベル</label>
                <div className="space-y-4">
                  {/* Selected Labels */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">選択済みラベル:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLabels.map((label) => (
                        <div key={label.id} className="flex items-center gap-2 bg-orange-900 bg-opacity-30 border border-orange-700 px-3 py-1 rounded-lg">
                          <span className="text-orange-300 text-sm">{label.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(label.id)}
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {selectedLabels.length === 0 && (
                        <p className="text-gray-500 text-sm">ラベルが選択されていません</p>
                      )}
                    </div>
                  </div>

                  {/* Available Labels */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">利用可能なラベル:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableLabels
                        .filter(label => !selectedLabels.find(sl => sl.id === label.id))
                        .map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => handleAddLabel(label)}
                            className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 hover:border-orange-500 transition-colors"
                          >
                            <div className="text-white text-sm font-medium">{label.name}</div>
                            <div className="text-gray-400 text-xs">{label.category}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowProfessionalForm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveProfessional}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;