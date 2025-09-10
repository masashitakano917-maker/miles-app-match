import React, { useState, useEffect } from 'react';
import { User, Order, Professional, Label } from '../types';
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
  Upload,
  ClipboardList,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { NotificationService } from '../services/NotificationService';
import { BusinessDayService } from '../services/BusinessDayService';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancellationInfo, setCancellationInfo] = useState<{
    fee: number;
    feePercentage: number;
    businessHours: number;
    reason: string;
  } | null>(null);
  const [selectedOrderForStatusEdit, setSelectedOrderForStatusEdit] = useState<Order | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [showStatusEditModal, setShowStatusEditModal] = useState(false);

  const [newProfessional, setNewProfessional] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    labels: [] as Label[],
    address: {
      postalCode: '',
      prefecture: '',
      city: '',
      detail: ''
    }
  });

  const [availableLabels] = useState<Label[]>([
    { id: 'l1', name: '不動産撮影', category: '写真撮影' },
    { id: 'l2', name: 'ポートレート撮影', category: '写真撮影' },
    { id: 'l3', name: 'フード撮影', category: '写真撮影' },
    { id: 'l4', name: '1LDK', category: 'お掃除' },
    { id: 'l5', name: '2LDK', category: 'お掃除' },
    { id: 'l6', name: '3LDK', category: 'お掃除' },
    { id: 'l7', name: '翻訳', category: 'スタッフ派遣' },
    { id: 'l8', name: '通訳', category: 'スタッフ派遣' },
    { id: 'l9', name: 'イベントコンパニオン', category: 'スタッフ派遣' }
  ]);

  useEffect(() => {
    loadData();
    
    // データ更新イベントリスナー
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
    
    setOrders(loadedOrders);
    setProfessionals(loadedProfessionals);
  };

  const handleShowOrderDetail = (order: Order) => {
    setSelectedOrderForDetail(order);
    setShowOrderDetail(true);
  };

  const handleShowCancelConfirmation = (order: Order) => {
    setSelectedOrderForCancel(order);
    
    const scheduledDate = order.scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const planPrice = getPlanPrice(order.planId);
    const cancellationInfo = BusinessDayService.calculateCancellationFee(
      new Date(),
      scheduledDate,
      planPrice
    );
    
    setCancellationInfo(cancellationInfo);
    setShowCancelConfirmation(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel || !cancellationInfo) return;

    try {
      const updatedOrders = orders.map(order => 
        order.id === selectedOrderForCancel.id 
          ? { 
              ...order, 
              status: 'cancelled' as const,
              cancellationFee: cancellationInfo.fee,
              cancellationReason: cancellationInfo.reason,
              updatedAt: new Date()
            }
          : order
      );
      setOrders(updatedOrders);
      DataService.saveOrders(updatedOrders);

      await NotificationService.sendCancellationNotification(
        selectedOrderForCancel,
        cancellationInfo.fee,
        cancellationInfo.reason,
        'admin'
      );

      alert(`注文をキャンセルしました。${cancellationInfo.fee > 0 ? `キャンセル料金: ¥${cancellationInfo.fee.toLocaleString()}` : 'キャンセル料金は発生しません。'}`);
      
      setShowCancelConfirmation(false);
      setSelectedOrderForCancel(null);
      setCancellationInfo(null);
    } catch (error) {
      console.error('キャンセル処理エラー:', error);
      alert('キャンセル処理中にエラーが発生しました。');
    }
  };

  const handleShowStatusEditModal = (order: Order) => {
    setSelectedOrderForStatusEdit(order);
    setShowStatusEditModal(true);
  };

  const handleStatusChange = (newStatus: Order['status']) => {
    if (!selectedOrderForStatusEdit) return;

    const updatedOrders = orders.map(order => 
      order.id === selectedOrderForStatusEdit.id 
        ? { 
            ...order, 
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === 'completed' ? { completedDate: new Date() } : {})
          }
        : order
    );
    
    setOrders(updatedOrders);
    DataService.saveOrders(updatedOrders);
    setShowStatusEditModal(false);
    setSelectedOrderForStatusEdit(null);
  };

  const handleAddProfessional = async () => {
    if (!newProfessional.name || !newProfessional.email) {
      alert('名前とメールアドレスは必須です');
      return;
    }

    const professional: Professional = {
      id: `pro-${Date.now()}`,
      name: newProfessional.name,
      email: newProfessional.email,
      phone: newProfessional.phone,
      password: newProfessional.password || 'defaultpass123',
      role: 'professional',
      labels: newProfessional.labels,
      isActive: true,
      completedJobs: 0,
      rating: 5.0,
      address: newProfessional.address
    };

    const updatedProfessionals = [...professionals, professional];
    setProfessionals(updatedProfessionals);
    DataService.saveProfessionals(updatedProfessionals);

    await NotificationService.sendProfessionalRegistrationNotification(professional, true);

    setNewProfessional({
      name: '',
      email: '',
      phone: '',
      password: '',
      labels: [],
      address: {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });

    alert('プロフェッショナルを追加しました');
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setNewProfessional({
      name: professional.name,
      email: professional.email,
      phone: professional.phone || '',
      password: '',
      labels: professional.labels,
      address: professional.address || {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });
  };

  const handleUpdateProfessional = async () => {
    if (!editingProfessional) return;

    const updatedProfessional: Professional = {
      ...editingProfessional,
      name: newProfessional.name,
      email: newProfessional.email,
      phone: newProfessional.phone,
      labels: newProfessional.labels,
      address: newProfessional.address
    };

    const updatedProfessionals = professionals.map(p => 
      p.id === editingProfessional.id ? updatedProfessional : p
    );
    
    setProfessionals(updatedProfessionals);
    DataService.saveProfessionals(updatedProfessionals);

    await NotificationService.sendProfessionalRegistrationNotification(updatedProfessional, false);

    setEditingProfessional(null);
    setNewProfessional({
      name: '',
      email: '',
      phone: '',
      password: '',
      labels: [],
      address: {
        postalCode: '',
        prefecture: '',
        city: '',
        detail: ''
      }
    });

    alert('プロフェッショナル情報を更新しました');
  };

  const handleDeleteProfessional = (professionalId: string) => {
    if (confirm('このプロフェッショナルを削除しますか？')) {
      const updatedProfessionals = professionals.filter(p => p.id !== professionalId);
      setProfessionals(updatedProfessionals);
      DataService.saveProfessionals(updatedProfessionals);
      alert('プロフェッショナルを削除しました');
    }
  };

  const handleToggleProfessionalStatus = (professionalId: string) => {
    const updatedProfessionals = professionals.map(p => 
      p.id === professionalId ? { ...p, isActive: !p.isActive } : p
    );
    setProfessionals(updatedProfessionals);
    DataService.saveProfessionals(updatedProfessionals);
  };

  const handleLabelToggle = (label: Label) => {
    const isSelected = newProfessional.labels.some(l => l.id === label.id);
    if (isSelected) {
      setNewProfessional({
        ...newProfessional,
        labels: newProfessional.labels.filter(l => l.id !== label.id)
      });
    } else {
      setNewProfessional({
        ...newProfessional,
        labels: [...newProfessional.labels, label]
      });
    }
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

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '受付中' },
      matched: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'マッチ済' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: '進行中' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '完了' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'キャンセル' }
    };
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
              { id: 'professionals', label: 'プロフェッショナル管理', icon: Users },
              { id: 'orders', label: '依頼管理', icon: ShoppingCart },
              { id: 'labels', label: 'ラベル管理', icon: ClipboardList },
              { id: 'settings', label: '設定', icon: Settings }
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">依頼管理</h2>
            
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">依頼ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">サービス</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">顧客名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">住所</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">作成日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">予定日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">完了日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {getServiceName(order.serviceId, order.planId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.address.prefecture} {order.address.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            <button
                              onClick={() => handleShowStatusEditModal(order)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600"
                              title="ステータス編集"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.createdAt.toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.scheduledDate ? order.scheduledDate.toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.completedDate ? order.completedDate.toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleShowOrderDetail(order)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600"
                              title="詳細表示"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(order.status === 'pending' || order.status === 'matched') && (
                              <button
                                onClick={() => handleShowCancelConfirmation(order)}
                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600"
                                title="キャンセル"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">依頼がありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">プロフェッショナル管理</h2>
            </div>

            {/* Add/Edit Professional Form */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingProfessional ? 'プロフェッショナル編集' : 'プロフェッショナル追加'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    お名前 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProfessional.name}
                    onChange={(e) => setNewProfessional({ ...newProfessional, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    メールアドレス <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={newProfessional.email}
                    onChange={(e) => setNewProfessional({ ...newProfessional, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">電話番号</label>
                  <input
                    type="tel"
                    value={newProfessional.phone}
                    onChange={(e) => setNewProfessional({ ...newProfessional, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
                  <input
                    type="password"
                    value={newProfessional.password}
                    onChange={(e) => setNewProfessional({ ...newProfessional, password: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">スキル・ラベル</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleLabelToggle(label)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        newProfessional.labels.some(l => l.id === label.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">郵便番号</label>
                  <input
                    type="text"
                    value={newProfessional.address.postalCode}
                    onChange={(e) => setNewProfessional({
                      ...newProfessional,
                      address: { ...newProfessional.address, postalCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">都道府県</label>
                  <input
                    type="text"
                    value={newProfessional.address.prefecture}
                    onChange={(e) => setNewProfessional({
                      ...newProfessional,
                      address: { ...newProfessional.address, prefecture: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">市区町村</label>
                  <input
                    type="text"
                    value={newProfessional.address.city}
                    onChange={(e) => setNewProfessional({
                      ...newProfessional,
                      address: { ...newProfessional.address, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">それ以降の住所</label>
                  <input
                    type="text"
                    value={newProfessional.address.detail}
                    onChange={(e) => setNewProfessional({
                      ...newProfessional,
                      address: { ...newProfessional.address, detail: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                {editingProfessional && (
                  <button
                    onClick={() => {
                      setEditingProfessional(null);
                      setNewProfessional({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        labels: [],
                        address: { postalCode: '', prefecture: '', city: '', detail: '' }
                      });
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
                <button
                  onClick={editingProfessional ? handleUpdateProfessional : handleAddProfessional}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingProfessional ? '更新' : '追加'}
                </button>
              </div>
            </div>

            {/* Professionals List */}
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">名前</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">メール</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">電話</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">スキル</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">評価</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {professionals.map((professional) => (
                      <tr key={professional.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{professional.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{professional.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{professional.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-wrap gap-1">
                            {professional.labels.map((label) => (
                              <span key={label.id} className="px-2 py-1 bg-orange-900 bg-opacity-30 text-orange-300 rounded text-xs">
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleProfessionalStatus(professional.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              professional.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {professional.isActive ? 'アクティブ' : '非アクティブ'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ⭐ {professional.rating} ({professional.completedJobs}件)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProfessional(professional)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600"
                              title="編集"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfessional(professional.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600"
                              title="削除"
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

              {professionals.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">プロフェッショナルが登録されていません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Labels Tab */}
        {activeTab === 'labels' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">ラベル管理</h2>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['写真撮影', 'お掃除', 'スタッフ派遣'].map((category) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-white mb-4">{category}</h3>
                    <div className="space-y-2">
                      {availableLabels
                        .filter(label => label.category === category)
                        .map((label) => (
                          <div key={label.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <span className="text-gray-300">{label.name}</span>
                            <div className="flex items-center gap-2">
                              <button className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">設定</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">データ管理</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (confirm('すべてのデータをクリアしますか？この操作は取り消せません。')) {
                        DataService.clearAllData();
                        setOrders([]);
                        setProfessionals([]);
                        alert('データをクリアしました');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    全データクリア
                  </button>
                  <button
                    onClick={loadData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    データ再読み込み
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">営業日設定</h3>
                <p className="text-gray-400 mb-4">営業日とキャンセル料金の設定を管理します。</p>
                <div className="grid grid-cols-7 gap-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                    <button
                      key={day}
                      className={`p-2 rounded text-sm font-medium ${
                        BusinessDayService.getBusinessDays().includes(index)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrderForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">依頼詳細</h3>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">依頼情報</h4>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium text-gray-400">依頼ID:</span> {selectedOrderForDetail.id}</p>
                  <p><span className="font-medium text-gray-400">サービス:</span> {getServiceName(selectedOrderForDetail.serviceId, selectedOrderForDetail.planId)}</p>
                  <p><span className="font-medium text-gray-400">料金:</span> ¥{getPlanPrice(selectedOrderForDetail.planId).toLocaleString()}</p>
                  <p><span className="font-medium text-gray-400">ステータス:</span> 
                    <span className="ml-2">
                      {getStatusBadge(selectedOrderForDetail.status)}
                    </span>
                  </p>
                  <p><span className="font-medium text-gray-400">注文日:</span> {selectedOrderForDetail.createdAt.toLocaleDateString('ja-JP')}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">顧客情報</h4>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium text-gray-400">お名前:</span> {selectedOrderForDetail.customerName}</p>
                  <p><span className="font-medium text-gray-400">電話番号:</span> {selectedOrderForDetail.customerPhone}</p>
                  <p><span className="font-medium text-gray-400">メール:</span> {selectedOrderForDetail.customerEmail}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">作業場所</h4>
              <div className="space-y-2 text-gray-300">
                <p>〒{selectedOrderForDetail.address.postalCode}</p>
                <p>{selectedOrderForDetail.address.prefecture} {selectedOrderForDetail.address.city}</p>
                <p>{selectedOrderForDetail.address.detail}</p>
                {selectedOrderForDetail.meetingPlace && (
                  <p><span className="font-medium text-gray-400">集合場所:</span> {selectedOrderForDetail.meetingPlace}</p>
                )}
              </div>
            </div>

            {selectedOrderForDetail.preferredDates && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">ご希望日時</h4>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium text-gray-400">第一希望:</span> {selectedOrderForDetail.preferredDates.first.toLocaleDateString('ja-JP')} {selectedOrderForDetail.preferredDates.first.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  {selectedOrderForDetail.preferredDates.second && (
                    <p><span className="font-medium text-gray-400">第二希望:</span> {selectedOrderForDetail.preferredDates.second.toLocaleDateString('ja-JP')} {selectedOrderForDetail.preferredDates.second.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  {selectedOrderForDetail.preferredDates.third && (
                    <p><span className="font-medium text-gray-400">第三希望:</span> {selectedOrderForDetail.preferredDates.third.toLocaleDateString('ja-JP')} {selectedOrderForDetail.preferredDates.third.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>
            )}

            {selectedOrderForDetail.specialNotes && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">特記事項</h4>
                <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{selectedOrderForDetail.specialNotes}</p>
              </div>
            )}

            {selectedOrderForDetail.assignedProfessionalId && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">担当プロフェッショナル</h4>
                <p className="text-gray-300">ID: {selectedOrderForDetail.assignedProfessionalId}</p>
              </div>
            )}

            {selectedOrderForDetail.cancellationFee && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">キャンセル情報</h4>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium text-gray-400">キャンセル料金:</span> ¥{selectedOrderForDetail.cancellationFee.toLocaleString()}</p>
                  <p><span className="font-medium text-gray-400">理由:</span> {selectedOrderForDetail.cancellationReason}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setShowOrderDetail(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && selectedOrderForCancel && cancellationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">キャンセル確認</h3>
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                以下の依頼をキャンセルしますか？
              </p>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-white font-medium">{getServiceName(selectedOrderForCancel.serviceId, selectedOrderForCancel.planId)}</p>
                <p className="text-gray-400 text-sm">依頼ID: {selectedOrderForCancel.id}</p>
              </div>
              
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 p-4 rounded-lg">
                <h4 className="text-yellow-300 font-medium mb-2">キャンセル料金</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-yellow-200">
                    <span className="font-medium">料金:</span> ¥{cancellationInfo.fee.toLocaleString()} 
                    ({cancellationInfo.feePercentage}%)
                  </p>
                  <p className="text-yellow-200">
                    <span className="font-medium">営業時間:</span> {cancellationInfo.businessHours.toFixed(1)}時間
                  </p>
                  <p className="text-yellow-200">
                    <span className="font-medium">理由:</span> {cancellationInfo.reason}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                キャンセルする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Edit Modal */}
      {showStatusEditModal && selectedOrderForStatusEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">ステータス変更</h3>
              <button
                onClick={() => setShowStatusEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                依頼ID: {selectedOrderForStatusEdit.id}
              </p>
              <p className="text-gray-300 mb-4">
                現在のステータス: {getStatusBadge(selectedOrderForStatusEdit.status)}
              </p>
              
              <div className="space-y-2">
                {[
                  { value: 'pending', label: '受付中' },
                  { value: 'matched', label: 'マッチ済' },
                  { value: 'in_progress', label: '進行中' },
                  { value: 'completed', label: '完了' },
                  { value: 'cancelled', label: 'キャンセル' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value as Order['status'])}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedOrderForStatusEdit.status === value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowStatusEditModal(false)}
                className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;