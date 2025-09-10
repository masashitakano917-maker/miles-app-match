import React, { useState, useEffect } from 'react';
import { User, Professional, Order, Service, Label } from '../types';
import { Users, Calendar, Settings, LogOut, Plus, Edit, Trash2, Eye, X, ChevronDown, CheckCircle } from 'lucide-react';
import { BusinessDayService } from '../services/BusinessDayService';
import { NotificationService } from '../services/NotificationService';
import { DataService } from '../services/DataService';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('professionals');
  const [showAddProfessionalModal, setShowAddProfessionalModal] = useState(false);
  const [showEditProfessionalModal, setShowEditProfessionalModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancellationInfo, setCancellationInfo] = useState<{
    fee: number;
    feePercentage: number;
    businessHours: number;
    reason: string;
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  
  const [newProfessional, setNewProfessional] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    postalCode: '',
    prefecture: '',
    city: '',
    detail: '',
    selectedLabels: [] as string[]
  });
  
  const [newLabel, setNewLabel] = useState({
    name: '',
    category: '写真撮影'
  });

  // Mock data
  const [mockProfessionals, setMockProfessionals] = useState<Professional[]>(
    DataService.loadProfessionals()
  );

  const [mockOrders, setMockOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = () => {
      const loadedOrders = DataService.loadOrders();
      console.log('📊 Admin: 注文データを読み込み:', loadedOrders.length, '件');
      setMockOrders(loadedOrders);
    };

    // 初回読み込み
    loadOrders();

    // カスタマーからの注文更新を監視
    const handleOrdersUpdate = (event: CustomEvent) => {
      console.log('📊 Admin: 注文データ更新を検知');
      loadOrders();
    };

    window.addEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate as EventListener);
    };
  }, []);

  const [mockLabels, setMockLabels] = useState<Label[]>([
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

  const handleAddProfessional = () => {
    if (!newProfessional.name || !newProfessional.email || !newProfessional.password) {
      alert('名前、メール、パスワードは必須項目です。');
      return;
    }

    const selectedLabelObjects = mockLabels.filter(label => 
      newProfessional.selectedLabels.includes(label.id)
    );

    const professional: Professional = {
      id: `pro-${Date.now()}`,
      name: newProfessional.name,
      email: newProfessional.email,
      role: 'professional',
      phone: newProfessional.phone,
      address: {
        postalCode: newProfessional.postalCode,
        prefecture: newProfessional.prefecture,
        city: newProfessional.city,
        detail: newProfessional.detail
      },
      labels: selectedLabelObjects,
      isActive: true,
      completedJobs: 0,
      rating: 5.0
    };

    setMockProfessionals([...mockProfessionals, professional]);
    
    // データを永続化
    DataService.saveProfessionals([...mockProfessionals, professional]);
    resetNewProfessionalForm();
    setShowAddProfessionalModal(false);
  };

  const resetNewProfessionalForm = () => {
    setNewProfessional({ 
      name: '', 
      email: '', 
      phone: '', 
      password: '',
      postalCode: '',
      prefecture: '',
      city: '',
      detail: '',
      selectedLabels: [] 
    });
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setNewProfessional({
      name: professional.name,
      email: professional.email,
      phone: professional.phone || '',
      password: '',
      postalCode: professional.address?.postalCode || '',
      prefecture: professional.address?.prefecture || '',
      city: professional.address?.city || '',
      detail: professional.address?.detail || '',
      selectedLabels: professional.labels.map(l => l.id)
    });
    setShowEditProfessionalModal(true);
  };

  const handleUpdateProfessional = () => {
    if (!editingProfessional) return;

    const selectedLabelObjects = mockLabels.filter(label => 
      newProfessional.selectedLabels.includes(label.id)
    );

    const updatedProfessional: Professional = {
      ...editingProfessional,
      name: newProfessional.name,
      email: newProfessional.email,
      phone: newProfessional.phone,
      address: {
        postalCode: newProfessional.postalCode,
        prefecture: newProfessional.prefecture,
        city: newProfessional.city,
        detail: newProfessional.detail
      },
      labels: selectedLabelObjects
    };

    setMockProfessionals(mockProfessionals.map(p => 
      p.id === editingProfessional.id ? updatedProfessional : p
    ));
    
    // データを永続化
    DataService.saveProfessionals(mockProfessionals.map(p => 
      p.id === editingProfessional.id ? updatedProfessional : p
    ));
    
    resetNewProfessionalForm();
    setEditingProfessional(null);
    setShowEditProfessionalModal(false);
  };

  const handleShowDetail = (professional: Professional) => {
    setSelectedProfessional(professional);
    setShowDetailModal(true);
  };

  const handleShowOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  const handleShowCancelOrder = (order: Order) => {
    setSelectedOrderForCancel(order);
    
    // キャンセル料金を計算
    const scheduledDate = order.scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const planPrice = getPlanPrice(order.planId);
    const cancellationInfo = BusinessDayService.calculateCancellationFee(
      new Date(),
      scheduledDate,
      planPrice
    );
    
    setCancellationInfo(cancellationInfo);
    setShowCancelOrderModal(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel || !cancellationInfo) return;

    try {
      // キャンセル通知を送信
      await NotificationService.sendCancellationNotification(
        selectedOrderForCancel,
        cancellationInfo.fee,
        cancellationInfo.reason,
        'admin'
      );

      alert(`注文をキャンセルしました。${cancellationInfo.fee > 0 ? `キャンセル料金: ¥${cancellationInfo.fee.toLocaleString()}` : 'キャンセル料金は発生しません。'}`);
      
      setShowCancelOrderModal(false);
      setSelectedOrderForCancel(null);
      setCancellationInfo(null);
    } catch (error) {
      console.error('キャンセル処理エラー:', error);
      alert('キャンセル処理中にエラーが発生しました。');
    }
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('このプロフェッショナルを削除しますか？')) {
      setMockProfessionals(mockProfessionals.filter(p => p.id !== id));
      
      // データを永続化
      DataService.saveProfessionals(mockProfessionals.filter(p => p.id !== id));
    }
  };

  const handleAddLabel = () => {
    const label: Label = {
      id: `l-${Date.now()}`,
      name: newLabel.name,
      category: newLabel.category
    };

    setMockLabels([...mockLabels, label]);
    setNewLabel({ name: '', category: '写真撮影' });
    setShowAddLabelModal(false);
  };

  const handleDeleteLabel = (id: string) => {
    if (confirm('このラベルを削除しますか？')) {
      setMockLabels(mockLabels.filter(l => l.id !== id));
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const newProfessionals: Professional[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < headers.length) continue;
        
        const labelNames = values[8]?.split(';') || [];
        const professionalLabels = mockLabels.filter(label => 
          labelNames.includes(label.name)
        );
        
        const professional: Professional = {
          id: `pro-csv-${Date.now()}-${i}`,
          name: values[0],
          email: values[1],
          role: 'professional',
          phone: values[2],
          address: {
            postalCode: values[4],
            prefecture: values[5],
            city: values[6],
            detail: values[7]
          },
          labels: professionalLabels,
          isActive: true,
          completedJobs: 0,
          rating: 5.0
        };
        
        newProfessionals.push(professional);
      }
      
      setMockProfessionals([...mockProfessionals, ...newProfessionals]);
      setShowCsvUploadModal(false);
      alert(`${newProfessionals.length}件のプロフェッショナルを登録しました。`);
    };
    
    reader.readAsText(file);
  };

  const showStatusEdit = (order: Order) => {
    setSelectedOrderForStatusEdit(order);
    setShowStatusEditModal(true);
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
              { id: 'orders', label: '依頼管理', icon: ClipboardList },
              { id: 'labels', label: 'ラベル管理', icon: Tags },
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

        {/* Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">プロフェッショナル一覧</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCsvUploadModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  CSV一括登録
                </button>
                <button 
                  onClick={() => {
                    resetNewProfessionalForm();
                    setShowAddProfessionalModal(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新規登録
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        プロフェッショナル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        スキル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        完了案件
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
                    {mockProfessionals.map((professional) => (
                      <tr key={professional.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{professional.name}</div>
                            <div className="text-sm text-gray-400">{professional.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {professional.labels.map((label) => (
                              <span
                                key={label.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {professional.completedJobs}件
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ⭐ {professional.rating}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                              onClick={() => handleShowDetail(professional)}
                              className="text-blue-400 hover:text-blue-300"
                              title="詳細表示"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProfessional(professional)}
                              className="text-orange-400 hover:text-orange-300"
                              title="編集"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProfessional(professional.id)}
                              className="text-red-400 hover:text-red-300"
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
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">依頼管理</h2>
            
            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        依頼ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        サービス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        顧客情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        住所
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        作成日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {mockOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {getServiceName(order.serviceId, order.planId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{order.customerName}</div>
                            <div className="text-sm text-gray-400">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            〒{order.address.postalCode}
                          </div>
                          <div className="text-sm text-gray-400">
                            {order.address.prefecture} {order.address.city} {order.address.detail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {order.createdAt.toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleShowOrderDetail(order)}
                              className="text-blue-400 hover:text-blue-300"
                              title="詳細表示"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(order.status === 'pending' || order.status === 'matched') && (
                              <button 
                                onClick={() => handleShowCancelOrder(order)}
                                className="text-red-400 hover:text-red-300"
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
            </div>
          </div>
        )}

        {/* Labels Tab */}
        {activeTab === 'labels' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">ラベル管理</h2>
              <button 
                onClick={() => setShowAddLabelModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新規ラベル追加
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['写真撮影', 'お掃除', 'スタッフ派遣'].map((category) => (
                <div key={category} className="bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-white mb-4">{category}</h3>
                  <div className="space-y-2">
                    {mockLabels
                      .filter((label) => label.category === category)
                      .map((label) => (
                        <div
                          key={label.id}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                          <span className="text-sm text-gray-300">{label.name}</span>
                          <div className="flex items-center gap-1">
                            <button className="text-orange-400 hover:text-orange-300">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteLabel(label.id)}
                              className="text-red-400 hover:text-red-300"
                            >
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
        )}
      </div>

      {/* Add Professional Modal */}
      {showAddProfessionalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新規プロフェッショナル登録</h3>
              <button
                onClick={() => setShowAddProfessionalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  value={newProfessional.name}
                  onChange={(e) => setNewProfessional({...newProfessional, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メール</label>
                <input
                  type="email"
                  value={newProfessional.email}
                  onChange={(e) => setNewProfessional({...newProfessional, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input
                  type="tel"
                  value={newProfessional.phone}
                  onChange={(e) => setNewProfessional({...newProfessional, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input
                  type="password"
                  value={newProfessional.password}
                  onChange={(e) => setNewProfessional({...newProfessional, password: e.target.value})}
                  placeholder="パスワードを入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                <input
                  type="text"
                  placeholder="000-0000"
                  value={newProfessional.postalCode}
                  onChange={(e) => setNewProfessional({...newProfessional, postalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
                <input
                  type="text"
                  value={newProfessional.prefecture}
                  onChange={(e) => setNewProfessional({...newProfessional, prefecture: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
                <input
                  type="text"
                  value={newProfessional.city}
                  onChange={(e) => setNewProfessional({...newProfessional, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">それ以降の住所</label>
                <input
                  type="text"
                  value={newProfessional.detail}
                  onChange={(e) => setNewProfessional({...newProfessional, detail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">スキル</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockLabels.map((label) => (
                  <label key={label.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProfessional.selectedLabels.includes(label.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProfessional({
                            ...newProfessional,
                            selectedLabels: [...newProfessional.selectedLabels, label.id]
                          });
                        } else {
                          setNewProfessional({
                            ...newProfessional,
                            selectedLabels: newProfessional.selectedLabels.filter(id => id !== label.id)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{label.name} ({label.category})</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddProfessionalModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddProfessional}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Professional Modal */}
      {showEditProfessionalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">プロフェッショナル編集</h3>
              <button
                onClick={() => setShowEditProfessionalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  value={newProfessional.name}
                  onChange={(e) => setNewProfessional({...newProfessional, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メール</label>
                <input
                  type="email"
                  value={newProfessional.email}
                  onChange={(e) => setNewProfessional({...newProfessional, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input
                  type="tel"
                  value={newProfessional.phone}
                  onChange={(e) => setNewProfessional({...newProfessional, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（変更する場合）</label>
                <input
                  type="password"
                  value={newProfessional.password}
                  onChange={(e) => setNewProfessional({...newProfessional, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                <input
                  type="text"
                  placeholder="000-0000"
                  value={newProfessional.postalCode}
                  onChange={(e) => setNewProfessional({...newProfessional, postalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
                <input
                  type="text"
                  value={newProfessional.prefecture}
                  onChange={(e) => setNewProfessional({...newProfessional, prefecture: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
                <input
                  type="text"
                  value={newProfessional.city}
                  onChange={(e) => setNewProfessional({...newProfessional, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">それ以降の住所</label>
                <input
                  type="text"
                  value={newProfessional.detail}
                  onChange={(e) => setNewProfessional({...newProfessional, detail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">スキル</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockLabels.map((label) => (
                  <label key={label.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProfessional.selectedLabels.includes(label.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProfessional({
                            ...newProfessional,
                            selectedLabels: [...newProfessional.selectedLabels, label.id]
                          });
                        } else {
                          setNewProfessional({
                            ...newProfessional,
                            selectedLabels: newProfessional.selectedLabels.filter(id => id !== label.id)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{label.name} ({label.category})</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditProfessionalModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateProfessional}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">プロフェッショナル詳細</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">基本情報</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">名前:</span> {selectedProfessional.name}</p>
                  <p><span className="font-medium">メール:</span> {selectedProfessional.email}</p>
                  <p><span className="font-medium">電話:</span> {selectedProfessional.phone}</p>
                  <p><span className="font-medium">パスワード:</span> ••••••••</p>
                  <p><span className="font-medium">完了案件:</span> {selectedProfessional.completedJobs}件</p>
                  <p><span className="font-medium">評価:</span> ⭐ {selectedProfessional.rating}</p>
                  <p><span className="font-medium">ステータス:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedProfessional.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProfessional.isActive ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">住所</h4>
                <div className="space-y-2 text-sm">
                  {selectedProfessional.address ? (
                    <>
                      <p>〒{selectedProfessional.address.postalCode}</p>
                      <p>{selectedProfessional.address.prefecture} {selectedProfessional.address.city}</p>
                      <p>{selectedProfessional.address.detail}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">住所が登録されていません</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">スキル・資格</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProfessional.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                  >
                    {label.name} ({label.category})
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">CSV一括登録</h3>
              <button
                onClick={() => setShowCsvUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                CSVファイルをアップロードしてプロフェッショナルを一括登録できます。
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <p className="font-medium mb-1">CSV形式:</p>
                <p>name,email,phone,password,postalCode,prefecture,city,detail,labels</p>
                <p className="mt-1 text-gray-500">※labelsは「;」区切りで複数指定可能</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSVファイル選択
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCsvUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Label Modal */}
      {showAddLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新規ラベル追加</h3>
              <button
                onClick={() => setShowAddLabelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ラベル名</label>
                <input
                  type="text"
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({...newLabel, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={newLabel.category}
                  onChange={(e) => setNewLabel({...newLabel, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="写真撮影">写真撮影</option>
                  <option value="お掃除">お掃除</option>
                  <option value="スタッフ派遣">スタッフ派遣</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddLabelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddLabel}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">依頼詳細</h3>
              <button
                onClick={() => setShowOrderDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">依頼情報</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">依頼ID:</span> {selectedOrder.id}</p>
                  <p><span className="font-medium">サービス:</span> {getServiceName(selectedOrder.serviceId, selectedOrder.planId)}</p>
                  <p><span className="font-medium">ステータス:</span> 
                    <span className="ml-2">
                      {getStatusBadge(selectedOrder.status)}
                    </span>
                  </p>
                  <p><span className="font-medium">作成日:</span> {selectedOrder.createdAt.toLocaleDateString('ja-JP')}</p>
                  <p><span className="font-medium">更新日:</span> {selectedOrder.updatedAt.toLocaleDateString('ja-JP')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">顧客情報</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">お名前:</span> {selectedOrder.customerName}</p>
                  <p><span className="font-medium">電話番号:</span> {selectedOrder.customerPhone}</p>
                  <p><span className="font-medium">メール:</span> {selectedOrder.customerEmail}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">作業場所</h4>
              <div className="space-y-2 text-sm">
                <p>〒{selectedOrder.address.postalCode}</p>
                <p>{selectedOrder.address.prefecture} {selectedOrder.address.city}</p>
                <p>{selectedOrder.address.detail}</p>
                {selectedOrder.meetingPlace && (
                  <p><span className="font-medium">集合場所:</span> {selectedOrder.meetingPlace}</p>
                )}
              </div>
            </div>

            {selectedOrder.specialNotes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">特記事項</h4>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedOrder.specialNotes}</p>
              </div>
            )}

            {selectedOrder.assignedProfessionalId && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">担当プロフェッショナル</h4>
                <p className="text-sm">ID: {selectedOrder.assignedProfessionalId}</p>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowOrderDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelOrderModal && selectedOrderForCancel && cancellationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">注文キャンセル確認</h3>
              <button
                onClick={() => setShowCancelOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                以下の注文をキャンセルしますか？
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-medium">{getServiceName(selectedOrderForCancel.serviceId, selectedOrderForCancel.planId)}</p>
                <p className="text-sm text-gray-600">注文ID: {selectedOrderForCancel.id}</p>
                <p className="text-sm text-gray-600">顧客: {selectedOrderForCancel.customerName}</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="text-yellow-800 font-medium mb-2">キャンセル料金</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-yellow-700">
                    <span className="font-medium">料金:</span> ¥{cancellationInfo.fee.toLocaleString()} 
                    ({cancellationInfo.feePercentage}%)
                  </p>
                  <p className="text-yellow-700">
                    <span className="font-medium">営業時間:</span> {cancellationInfo.businessHours.toFixed(1)}時間
                  </p>
                  <p className="text-yellow-700">
                    <span className="font-medium">理由:</span> {cancellationInfo.reason}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelOrderModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                戻る
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                キャンセルする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;