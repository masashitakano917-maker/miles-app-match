import React, { useState } from 'react';
import type { User, Service, Plan, Order } from '../types';
import { ShoppingCart, Clock, CheckCircle, XCircle, LogOut, ChevronRight, ArrowLeft, Eye, X } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import { BusinessDayService } from '../services/BusinessDayService';
import { DataService } from '../services/DataService';

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
  const [orderData, setOrderData] = useState({
    customerName: '',
    phone: '',
    email: '',
    postalCode: '',
    prefecture: '',
    city: '',
    detail: '',
    meetingPlace: '',
    specialNotes: '',
    firstPreferredDate: '',
    firstPreferredTime: '',
    secondPreferredDate: '',
    secondPreferredTime: '',
    thirdPreferredDate: '',
    thirdPreferredTime: ''
  });

  // Mock services data
  const mockServices: Service[] = [
    {
      id: 'photo-service',
      name: '写真撮影',
      category: '撮影',
      labels: [],
      plans: [
        { id: 'real-estate', name: '不動産撮影', price: 15000, description: 'プロによる不動産撮影サービス', serviceId: 'photo-service' },
        { id: 'portrait', name: 'ポートレート撮影', price: 12000, description: 'プロフィール写真撮影', serviceId: 'photo-service' },
        { id: 'food', name: 'フード撮影', price: 18000, description: '料理・商品撮影サービス', serviceId: 'photo-service' }
      ]
    },
    {
      id: 'cleaning-service',
      name: 'お掃除',
      category: 'ハウスキーピング',
      labels: [],
      plans: [
        { id: '1ldk', name: '1LDK', price: 8000, description: '1LDKのお部屋清掃', serviceId: 'cleaning-service' },
        { id: '2ldk', name: '2LDK', price: 12000, description: '2LDKのお部屋清掃', serviceId: 'cleaning-service' },
        { id: '3ldk', name: '3LDK', price: 16000, description: '3LDKのお部屋清掃', serviceId: 'cleaning-service' }
      ]
    },
    {
      id: 'staff-service',
      name: 'スタッフ派遣',
      category: '人材派遣',
      labels: [],
      plans: [
        { id: 'translation', name: '翻訳', price: 5000, description: '文書翻訳サービス', serviceId: 'staff-service' },
        { id: 'interpretation', name: '通訳', price: 8000, description: '通訳サービス（1時間）', serviceId: 'staff-service' },
        { id: 'companion', name: 'イベントコンパニオン', price: 15000, description: 'イベント司会・案内', serviceId: 'staff-service' }
      ]
    }
  ];

  const [mockOrders, setMockOrders] = useState<Order[]>([
    ...DataService.loadOrders().filter(order => order.customerId === user.id)
  ]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedPlan(null);
    setShowOrderForm(false);
    setShowConfirmation(false);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowOrderForm(true);
    setShowConfirmation(false);
  };

  const handleOrderFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOrderForm(false);
    setShowConfirmation(true);
  };

  const handleFinalOrder = async () => {
    if (!selectedPlan) return;

    // 希望日時の処理
    const preferredDates: any = {};
    if (orderData.firstPreferredDate && orderData.firstPreferredTime) {
      preferredDates.first = new Date(`${orderData.firstPreferredDate}T${orderData.firstPreferredTime}`);
    }
    if (orderData.secondPreferredDate && orderData.secondPreferredTime) {
      preferredDates.second = new Date(`${orderData.secondPreferredDate}T${orderData.secondPreferredTime}`);
    }
    if (orderData.thirdPreferredDate && orderData.thirdPreferredTime) {
      preferredDates.third = new Date(`${orderData.thirdPreferredDate}T${orderData.thirdPreferredTime}`);
    }

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      customerId: user.id,
      serviceId: selectedPlan.serviceId,
      planId: selectedPlan.id,
      status: 'pending',
      customerName: orderData.customerName,
      customerPhone: orderData.phone,
      customerEmail: orderData.email,
      address: {
        postalCode: orderData.postalCode,
        prefecture: orderData.prefecture,
        city: orderData.city,
        detail: orderData.detail
      },
      meetingPlace: orderData.meetingPlace,
      specialNotes: orderData.specialNotes,
      preferredDates: Object.keys(preferredDates).length > 0 ? preferredDates : undefined,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後をデフォルト
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedOrders = [...mockOrders, newOrder];
    setMockOrders(updatedOrders);
    
    // データを永続化
    DataService.saveOrders(updatedOrders);

    // Send notifications
    await NotificationService.sendOrderNotification(newOrder, selectedPlan);

    alert('ご注文を受け付けました。確認メールを送信いたします。');
    setShowConfirmation(false);
    setSelectedService(null);
    setSelectedPlan(null);
    setOrderData({
      customerName: '',
      phone: '',
      email: '',
      postalCode: '',
      prefecture: '',
      city: '',
      detail: '',
      meetingPlace: '',
      specialNotes: '',
      firstPreferredDate: '',
      firstPreferredTime: '',
      secondPreferredDate: '',
      secondPreferredTime: '',
      thirdPreferredDate: '',
      thirdPreferredTime: ''
    });
    setActiveTab('orders');
  };

  const handleShowOrderDetail = (order: Order) => {
    setSelectedOrderForDetail(order);
    setShowOrderDetail(true);
  };

  const handleShowCancelConfirmation = (order: Order) => {
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
    setShowCancelConfirmation(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel || !cancellationInfo) return;

    try {
      // 注文をキャンセル状態に更新
      const updatedOrders = mockOrders.map(order => 
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
      setMockOrders(updatedOrders);

      // キャンセル通知を送信
      await NotificationService.sendCancellationNotification(
        selectedOrderForCancel,
        cancellationInfo.fee,
        cancellationInfo.reason,
        'customer'
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

  const handleEditOrder = () => {
    setShowConfirmation(false);
    setShowOrderForm(true);
  };

  const handleCancelOrderForm = () => {
    setShowConfirmation(false);
    setSelectedService(null);
    setSelectedPlan(null);
    setOrderData({
      customerName: '',
      phone: '',
      email: '',
      postalCode: '',
      prefecture: '',
      city: '',
      detail: '',
      meetingPlace: '',
      specialNotes: '',
      firstPreferredDate: '',
      firstPreferredTime: '',
      secondPreferredDate: '',
      secondPreferredTime: '',
      thirdPreferredDate: '',
      thirdPreferredTime: ''
    });
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'matched':
      case 'in_progress':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
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
              <h1 className="text-2xl font-bold text-white">マッチングプラットフォーム</h1>
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
              { id: 'services', label: 'サービス一覧', icon: ShoppingCart },
              { id: 'orders', label: '依頼履歴', icon: Clock }
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

        {/* Services Tab */}
        {activeTab === 'services' && !showOrderForm && !showConfirmation && (
          <div>
            {!selectedService ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-8">サービスを選択してください</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-700 hover:border-orange-500 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">{service.name}</h3>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                      </div>
                      <p className="text-gray-400 mb-4">{service.category}</p>
                      <div className="text-sm text-orange-400 font-medium">
                        {service.plans.length}つのプランをご用意
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    戻る
                  </button>
                  <h2 className="text-2xl font-bold text-white">{selectedService.name} - プラン選択</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedService.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 hover:border-orange-500 transition-all"
                    >
                      <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 mb-4">{plan.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-400">
                          ¥{plan.price.toLocaleString()}
                        </div>
                        <button
                          onClick={() => handlePlanSelect(plan)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                          選択する
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Form */}
        {showOrderForm && selectedPlan && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </button>
              <h2 className="text-2xl font-bold text-white">ご注文内容入力</h2>
            </div>

            {/* Selected Plan Summary */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl mb-8">
              <h3 className="font-semibold text-white mb-2">選択プラン</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-white">{selectedPlan.name}</p>
                  <p className="text-orange-100">{selectedPlan.description}</p>
                </div>
                <div className="text-2xl font-bold text-white">
                  ¥{selectedPlan.price.toLocaleString()}
                </div>
              </div>
            </div>

            <form onSubmit={handleOrderFormSubmit} className="bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    お名前 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderData.customerName}
                    onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    電話番号 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={orderData.phone}
                    onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    メールアドレス <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={orderData.email}
                    onChange={(e) => setOrderData({ ...orderData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    郵便番号 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000-0000"
                    value={orderData.postalCode}
                    onChange={(e) => setOrderData({ ...orderData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    都道府県 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderData.prefecture}
                    onChange={(e) => setOrderData({ ...orderData, prefecture: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    市区町村 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderData.city}
                    onChange={(e) => setOrderData({ ...orderData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  それ以降の住所 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderData.detail}
                  onChange={(e) => setOrderData({ ...orderData, detail: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  集合場所（案件住所と異なる場合）
                </label>
                <input
                  type="text"
                  value={orderData.meetingPlace}
                  onChange={(e) => setOrderData({ ...orderData, meetingPlace: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                />
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-300 mb-4">ご希望日時</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第一希望日 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={orderData.firstPreferredDate}
                        onChange={(e) => setOrderData({ ...orderData, firstPreferredDate: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第一希望時刻 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={orderData.firstPreferredTime}
                        onChange={(e) => setOrderData({ ...orderData, firstPreferredTime: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第二希望日
                      </label>
                      <input
                        type="date"
                        value={orderData.secondPreferredDate}
                        onChange={(e) => setOrderData({ ...orderData, secondPreferredDate: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第二希望時刻
                      </label>
                      <input
                        type="time"
                        value={orderData.secondPreferredTime}
                        onChange={(e) => setOrderData({ ...orderData, secondPreferredTime: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第三希望日
                      </label>
                      <input
                        type="date"
                        value={orderData.thirdPreferredDate}
                        onChange={(e) => setOrderData({ ...orderData, thirdPreferredDate: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        第三希望時刻
                      </label>
                      <input
                        type="time"
                        value={orderData.thirdPreferredTime}
                        onChange={(e) => setOrderData({ ...orderData, thirdPreferredTime: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  特記事項
                </label>
                <textarea
                  rows={4}
                  value={orderData.specialNotes}
                  onChange={(e) => setOrderData({ ...orderData, specialNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                />
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  確認画面へ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Order Confirmation */}
        {showConfirmation && selectedPlan && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleEditOrder}
                className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </button>
              <h2 className="text-2xl font-bold text-white">ご注文内容確認</h2>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-sm">
              {/* Plan Details */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl mb-8">
                <h3 className="font-semibold text-white mb-2">選択プラン</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-white">{selectedPlan.name}</p>
                    <p className="text-orange-100">{selectedPlan.description}</p>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ¥{selectedPlan.price.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">お客様情報</h4>
                  <div className="space-y-2 text-gray-300">
                    <p><span className="font-medium">お名前:</span> {orderData.customerName}</p>
                    <p><span className="font-medium">電話番号:</span> {orderData.phone}</p>
                    <p><span className="font-medium">メール:</span> {orderData.email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">作業場所</h4>
                  <div className="space-y-2 text-gray-300">
                    <p>〒{orderData.postalCode}</p>
                    <p>{orderData.prefecture} {orderData.city}</p>
                    <p>{orderData.detail}</p>
                    {orderData.meetingPlace && (
                      <p><span className="font-medium">集合場所:</span> {orderData.meetingPlace}</p>
                    )}
                  </div>
                </div>
              </div>

              {(orderData.firstPreferredDate && orderData.firstPreferredTime) && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">ご希望日時</h4>
                  <div className="space-y-2 text-gray-300 bg-gray-700 p-4 rounded-lg">
                    <p><span className="font-medium">第一希望:</span> {new Date(`${orderData.firstPreferredDate}T${orderData.firstPreferredTime}`).toLocaleDateString('ja-JP')} {new Date(`${orderData.firstPreferredDate}T${orderData.firstPreferredTime}`).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                    {(orderData.secondPreferredDate && orderData.secondPreferredTime) && (
                      <p><span className="font-medium">第二希望:</span> {new Date(`${orderData.secondPreferredDate}T${orderData.secondPreferredTime}`).toLocaleDateString('ja-JP')} {new Date(`${orderData.secondPreferredDate}T${orderData.secondPreferredTime}`).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                    )}
                    {(orderData.thirdPreferredDate && orderData.thirdPreferredTime) && (
                      <p><span className="font-medium">第三希望:</span> {new Date(`${orderData.thirdPreferredDate}T${orderData.thirdPreferredTime}`).toLocaleDateString('ja-JP')} {new Date(`${orderData.thirdPreferredDate}T${orderData.thirdPreferredTime}`).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                    )}
                  </div>
                </div>
              )}

              {orderData.specialNotes && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">特記事項</h4>
                  <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{orderData.specialNotes}</p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCancelOrderForm}
                  className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditOrder}
                  className="px-6 py-2 border border-orange-500 rounded-lg text-orange-400 hover:bg-orange-500 hover:text-white transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleFinalOrder}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  注文する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">依頼履歴</h2>
            
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-white">
                          {getServiceName(order.serviceId, order.planId)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'matched' || order.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">依頼ID: {order.id}</p>
                      <p className="text-gray-400 mb-1">
                        {order.address.prefecture} {order.address.city} {order.address.detail}
                      </p>
                      <p className="text-sm text-gray-500">
                        注文日: {order.createdAt.toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShowOrderDetail(order)}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        title="詳細表示"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {(order.status === 'pending' || order.status === 'matched') && (
                        <button
                          onClick={() => handleShowCancelConfirmation(order)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          title="キャンセル"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {order.specialNotes && (
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">特記事項:</span> {order.specialNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {mockOrders.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">まだ依頼がありません</p>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    サービスを見る
                  </button>
                </div>
              )}
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
    </div>
  );
};

export default CustomerDashboard;