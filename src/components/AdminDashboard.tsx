import React, { useState, useEffect } from 'react';
import type { User, Order, Professional, Label } from '../types';
import {
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  DollarSign,
  Star,
  UserPlus
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { NotificationService } from '../services/NotificationService';
import { LocationService } from '../services/LocationService';
import { BusinessDayService } from '../services/BusinessDayService';
import { EmailService } from '../services/EmailService';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'professional' | 'label' | 'order' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Data states
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  // Form states
  const [professionalForm, setProfessionalForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    equipment: '',
    experience: '',
    isActive: true,
    labels: [] as Label[],
    address: {
      postalCode: '',
      prefecture: '',
      city: '',
      detail: ''
    }
  });

  const [labelForm, setLabelForm] = useState({
    name: '',
    category: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Listen for order updates
    const handleOrdersUpdated = (event: CustomEvent) => {
      setOrders(event.detail);
    };
    
    window.addEventListener('ordersUpdated', handleOrdersUpdated as EventListener);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdated as EventListener);
    };
  }, []);

  const loadData = () => {
    setProfessionals(DataService.loadProfessionals());
    setOrders(DataService.loadOrders());
    setLabels(DataService.loadLabels());
  };

  // Professional management
  const handleAddProfessional = () => {
    setModalType('professional');
    setSelectedItem(null);
    setProfessionalForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      bio: '',
      equipment: '',
      experience: '',
      isActive: true,
      labels: [],
      address: {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });
    setShowModal(true);
  };

  const handleEditProfessional = (professional: Professional) => {
    setModalType('professional');
    setSelectedItem(professional);
    setProfessionalForm({
      name: professional.name,
      email: professional.email,
      phone: professional.phone || '',
      password: professional.password || '',
      bio: professional.bio || '',
      equipment: professional.equipment || '',
      experience: professional.experience || '',
      isActive: professional.isActive,
      labels: professional.labels || [],
      address: professional.address || {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });
    setShowModal(true);
  };

  const handleSaveProfessional = async () => {
    const newProfessional: Professional = {
      id: selectedItem?.id || `prof-${Date.now()}`,
      name: professionalForm.name,
      email: professionalForm.email,
      role: 'professional',
      phone: professionalForm.phone,
      password: professionalForm.password,
      bio: professionalForm.bio,
      equipment: professionalForm.equipment,
      experience: professionalForm.experience,
      isActive: professionalForm.isActive,
      labels: professionalForm.labels,
      completedJobs: selectedItem?.completedJobs || 0,
      rating: selectedItem?.rating || 5.0,
      address: professionalForm.address
    };

    const updatedProfessionals = selectedItem
      ? professionals.map(p => p.id === selectedItem.id ? newProfessional : p)
      : [...professionals, newProfessional];

    setProfessionals(updatedProfessionals);
    DataService.saveProfessionals(updatedProfessionals);

    // Send notification
    await NotificationService.sendProfessionalRegistrationNotification(newProfessional, !selectedItem);

    setShowModal(false);
    alert(`プロフェッショナルを${selectedItem ? '更新' : '追加'}しました`);
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('このプロフェッショナルを削除しますか？')) {
      const updatedProfessionals = professionals.filter(p => p.id !== id);
      setProfessionals(updatedProfessionals);
      DataService.saveProfessionals(updatedProfessionals);
      alert('プロフェッショナルを削除しました');
    }
  };

  // Label management
  const handleAddLabel = () => {
    setModalType('label');
    setSelectedItem(null);
    setLabelForm({ name: '', category: '' });
    setShowModal(true);
  };

  const handleEditLabel = (label: Label) => {
    setModalType('label');
    setSelectedItem(label);
    setLabelForm({ name: label.name, category: label.category });
    setShowModal(true);
  };

  const handleSaveLabel = () => {
    const newLabel: Label = {
      id: selectedItem?.id || `label-${Date.now()}`,
      name: labelForm.name,
      category: labelForm.category
    };

    const updatedLabels = selectedItem
      ? labels.map(l => l.id === selectedItem.id ? newLabel : l)
      : [...labels, newLabel];

    setLabels(updatedLabels);
    DataService.saveLabels(updatedLabels);
    setShowModal(false);
    alert(`ラベルを${selectedItem ? '更新' : '追加'}しました`);
  };

  const handleDeleteLabel = (id: string) => {
    if (confirm('このラベルを削除しますか？')) {
      const updatedLabels = labels.filter(l => l.id !== id);
      setLabels(updatedLabels);
      DataService.saveLabels(updatedLabels);
      alert('ラベルを削除しました');
    }
  };

  // Order management
  const handleAssignProfessional = async (orderId: string, professionalId: string) => {
    const order = orders.find(o => o.id === orderId);
    const professional = professionals.find(p => p.id === professionalId);
    
    if (!order || !professional) return;

    const updatedOrder = {
      ...order,
      status: 'matched' as const,
      assignedProfessionalId: professionalId,
      updatedAt: new Date()
    };

    const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    setOrders(updatedOrders);
    DataService.saveOrders(updatedOrders);

    // Send notifications
    await NotificationService.sendMatchNotification(updatedOrder, professional);

    alert('プロフェッショナルをアサインしました');
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Calculate cancellation fee
    const scheduledDate = order.scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const planPrice = getPlanPrice(order.planId);
    const cancellationInfo = BusinessDayService.calculateCancellationFee(
      new Date(),
      scheduledDate,
      planPrice
    );

    const updatedOrder = {
      ...order,
      status: 'cancelled' as const,
      cancellationFee: cancellationInfo.fee,
      cancellationReason: reason,
      updatedAt: new Date()
    };

    const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    setOrders(updatedOrders);
    DataService.saveOrders(updatedOrders);

    // Send notifications
    await NotificationService.sendCancellationNotification(
      updatedOrder,
      cancellationInfo.fee,
      reason,
      'admin'
    );

    console.log(`✅ 注文をキャンセルしました。キャンセル料金: ¥${cancellationInfo.fee.toLocaleString()}`);
  };

  // Utility functions
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
        return null;
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

  // Filter functions
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredProfessionals = professionals.filter(prof => 
    prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + getPlanPrice(o.planId), 0),
    activeProfessionals: professionals.filter(p => p.isActive).length,
    totalProfessionals: professionals.length
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
        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '概要', icon: BarChart3 },
              { id: 'orders', label: '注文管理', icon: ShoppingCart },
              { id: 'professionals', label: 'プロフェッショナル', icon: Users },
              { id: 'labels', label: 'ラベル管理', icon: Settings }
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
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">システム概要</h2>
            
            {/* Email Configuration Status */}
            <div className="mb-8">
              <EmailConfigStatus />
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">総注文数</p>
                    <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">受付中</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">完了済み</p>
                    <p className="text-2xl font-bold text-white">{stats.completedOrders}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">総売上</p>
                    <p className="text-2xl font-bold text-white">¥{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">アクティブプロ</p>
                    <p className="text-2xl font-bold text-white">{stats.activeProfessionals}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">総プロ数</p>
                    <p className="text-2xl font-bold text-white">{stats.totalProfessionals}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">ラベル数</p>
                    <p className="text-2xl font-bold text-white">{labels.length}</p>
                  </div>
                  <Settings className="w-8 h-8 text-gray-500" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">成長率</p>
                    <p className="text-2xl font-bold text-white">+12%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">最近の注文</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-400">{getServiceName(order.serviceId, order.planId)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">¥{getPlanPrice(order.planId).toLocaleString()}</p>
                      <p className="text-sm text-gray-400">{order.createdAt.toLocaleDateString('ja-JP')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">注文管理</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">すべて</option>
                  <option value="pending">受付中</option>
                  <option value="matched">マッチ済</option>
                  <option value="in_progress">作業中</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-white">
                          {getServiceName(order.serviceId, order.planId)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'matched' || order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">お客様情報</p>
                          <p className="text-white">{order.customerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-4 h-4" />
                            {order.customerPhone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-4 h-4" />
                            {order.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">作業場所</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-white">〒{order.address.postalCode}</p>
                              <p className="text-gray-400">
                                {order.address.prefecture} {order.address.city}
                              </p>
                              <p className="text-gray-400">{order.address.detail}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">注文詳細</p>
                          <p className="text-2xl font-bold text-orange-400">
                            ¥{getPlanPrice(order.planId).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {order.createdAt.toLocaleDateString('ja-JP')}
                          </div>
                          <p className="text-sm text-gray-500">ID: {order.id}</p>
                        </div>
                      </div>

                      {order.specialNotes && (
                        <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700">
                          <p className="text-sm font-medium text-yellow-300 mb-1">特記事項</p>
                          <p className="text-sm text-yellow-200">{order.specialNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignProfessional(order.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            >
                              <option value="">プロを選択</option>
                              {professionals
                                .filter(p => p.isActive)
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                              onClick={() => {
                                const reason = prompt('キャンセル理由を入力してください:');
                                if (reason) {
                                  handleCancelOrder(order.id, reason);
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              キャンセル
                            </button>
                          </div>
                        )}
                        
                        {order.assignedProfessionalId && (
                          <div className="text-sm text-gray-400">
                            担当: {professionals.find(p => p.id === order.assignedProfessionalId)?.name || 'Unknown'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">注文が見つかりません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">プロフェッショナル管理</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  onClick={handleAddProfessional}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新規追加
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map((professional) => (
                <div key={professional.id} className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{professional.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          professional.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {professional.isActive ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {professional.email}
                        </div>
                        {professional.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {professional.phone}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-400 mb-2">スキル</p>
                        <div className="flex flex-wrap gap-1">
                          {professional.labels && professional.labels.length > 0 ? (
                            professional.labels.map((label) => (
                              <span key={label.id} className="px-2 py-1 bg-orange-900 bg-opacity-30 text-orange-300 rounded text-xs">
                                {label.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">スキル未設定</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-400">完了: </span>
                          <span className="text-white font-medium">{professional.completedJobs}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">評価: </span>
                          <span className="text-yellow-400 font-medium">⭐ {professional.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditProfessional(professional)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfessional(professional.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProfessionals.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">プロフェッショナルが見つかりません</p>
              </div>
            )}
          </div>
        )}

        {/* Labels Tab */}
        {activeTab === 'labels' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">ラベル管理</h2>
              <button
                onClick={handleAddLabel}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                新規追加
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labels.map((label) => (
                <div key={label.id} className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{label.name}</h3>
                      <p className="text-sm text-gray-400">{label.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLabel(label)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLabel(label.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {labels.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">ラベルがありません</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {modalType === 'professional' ? 
                  (selectedItem ? 'プロフェッショナル編集' : 'プロフェッショナル追加') :
                  (selectedItem ? 'ラベル編集' : 'ラベル追加')
                }
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalType === 'professional' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">お名前</label>
                    <input
                      type="text"
                      value={professionalForm.name}
                      onChange={(e) => setProfessionalForm({...professionalForm, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
                    <input
                      type="email"
                      value={professionalForm.email}
                      onChange={(e) => setProfessionalForm({...professionalForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">電話番号</label>
                    <input
                      type="tel"
                      value={professionalForm.phone}
                      onChange={(e) => setProfessionalForm({...professionalForm, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
                    <input
                      type="password"
                      value={professionalForm.password}
                      onChange={(e) => setProfessionalForm({...professionalForm, password: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">自己紹介</label>
                  <textarea
                    rows={3}
                    value={professionalForm.bio}
                    onChange={(e) => setProfessionalForm({...professionalForm, bio: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">郵便番号</label>
                    <input
                      type="text"
                      value={professionalForm.address.postalCode}
                      onChange={(e) => setProfessionalForm({
                        ...professionalForm,
                        address: {...professionalForm.address, postalCode: e.target.value}
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">スキル・ラベル</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {labels.map((label) => (
                      <label key={label.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={professionalForm.labels.some(l => l.id === label.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfessionalForm({
                                ...professionalForm,
                                labels: [...professionalForm.labels, label]
                              });
                            } else {
                              setProfessionalForm({
                                ...professionalForm,
                                labels: professionalForm.labels.filter(l => l.id !== label.id)
                              });
                            }
                          }}
                          className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-gray-300">{label.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={professionalForm.isActive}
                    onChange={(e) => setProfessionalForm({...professionalForm, isActive: e.target.checked})}
                    className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">アクティブ</label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveProfessional}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            )}

            {modalType === 'label' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ラベル名</label>
                  <input
                    type="text"
                    value={labelForm.name}
                    onChange={(e) => setLabelForm({...labelForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">カテゴリ</label>
                  <input
                    type="text"
                    value={labelForm.category}
                    onChange={(e) => setLabelForm({...labelForm, category: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveLabel}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Email Configuration Status Component
const EmailConfigStatus: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<{
    isConfigured: boolean;
    missingVars: string[];
    config: Record<string, string>;
  } | null>(null);
  const [isTestingSendGrid, setIsTestingSendGrid] = useState(false);

  useEffect(() => {
    setConfigStatus(EmailService.checkConfiguration());
  }, []);

  const handleTestSendGrid = async () => {
    setIsTestingSendGrid(true);
    try {
      const success = await EmailService.sendTestEmail();
      console.log('📧 テストメール送信結果:', success ? '成功' : '失敗');
      console.log('📧 詳細はコンソールログをご確認ください');
    } catch (error) {
      console.error('テストメール送信エラー:', error);
    } finally {
      setIsTestingSendGrid(false);
    }
  };

  if (!configStatus) return null;

  return (
    <div className={`p-6 rounded-xl border ${
      configStatus.isConfigured 
        ? 'bg-green-900 bg-opacity-30 border-green-700' 
        : 'bg-yellow-900 bg-opacity-30 border-yellow-700'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">メール設定状況</h3>
        {configStatus.isConfigured && (
          <button
            onClick={handleTestSendGrid}
            disabled={isTestingSendGrid}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isTestingSendGrid ? 'テスト中...' : 'テスト送信'}
          </button>
        )}
      </div>
      
      {configStatus.isConfigured ? (
        <div>
          <p className="text-green-300 mb-3">✅ SendGrid設定完了 - 本番メール送信が有効です</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(configStatus.config).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-green-400">{key.replace('VITE_', '')}:</span>
                <span className="text-green-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-yellow-300 mb-3">⚠️ SendGrid未設定 - シミュレーションモードで動作中</p>
          <p className="text-yellow-200 text-sm mb-3">以下の環境変数を設定してください:</p>
          <ul className="text-yellow-200 text-sm space-y-1">
            {configStatus.missingVars.map(varName => (
              <li key={varName} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                {varName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;