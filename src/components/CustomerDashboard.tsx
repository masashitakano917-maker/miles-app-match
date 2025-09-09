import React, { useState } from 'react';
import { User, Service, Plan, Order } from '../types';
import { ShoppingCart, Clock, CheckCircle, XCircle, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';

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
  const [orderData, setOrderData] = useState({
    customerName: '',
    phone: '',
    email: '',
    postalCode: '',
    prefecture: '',
    city: '',
    detail: '',
    meetingPlace: '',
    specialNotes: ''
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
    {
      id: 'order-1',
      customerId: user.id,
      serviceId: 'photo-service',
      planId: 'real-estate',
      status: 'pending',
      customerName: '田中太郎',
      customerPhone: '090-1234-5678',
      customerEmail: 'customer@example.com',
      address: {
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        detail: '丸の内1-1-1'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMockOrders([...mockOrders, newOrder]);

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
      specialNotes: ''
    });
    setActiveTab('orders');
  };

  const handleEditOrder = () => {
    setShowConfirmation(false);
    setShowOrderForm(true);
  };

  const handleCancelOrder = () => {
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
      specialNotes: ''
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

              {orderData.specialNotes && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">特記事項</h4>
                  <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{orderData.specialNotes}</p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCancelOrder}
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
                          依頼ID: {order.id}
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
                      <p className="text-gray-400 mb-1">
                        {order.address.prefecture} {order.address.city} {order.address.detail}
                      </p>
                      <p className="text-sm text-gray-500">
                        注文日: {order.createdAt.toLocaleDateString('ja-JP')}
                      </p>
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
    </div>
  );
};

export default CustomerDashboard;