import React, { useState } from 'react';
import { User, Order, Professional } from '../types';
import { Bell, CheckCircle, Clock, MapPin, LogOut, Phone, Mail } from 'lucide-react';

interface ProfessionalDashboardProps {
  user: User;
  onLogout: () => void;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requests');

  // Mock data for professional
  const professionalData: Professional = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'professional',
    phone: '090-1234-5678',
    labels: [
      { id: 'l1', name: '不動産撮影', category: '写真撮影' },
      { id: 'l4', name: '1LDK', category: 'お掃除' }
    ],
    isActive: true,
    completedJobs: 15,
    rating: 4.8
  };

  // Mock pending requests
  const mockRequests: Order[] = [
    {
      id: 'order-1',
      customerId: 'customer-1',
      serviceId: 'photo-service',
      planId: 'real-estate',
      status: 'pending',
      customerName: '山田太郎',
      customerPhone: '090-1111-2222',
      customerEmail: 'yamada@example.com',
      address: {
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        detail: '丸の内1-1-1 マンション202号室'
      },
      meetingPlace: 'エントランス',
      specialNotes: 'エレベーターなし、階段利用',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'order-2',
      customerId: 'customer-2',
      serviceId: 'cleaning-service',
      planId: '1ldk',
      status: 'pending',
      customerName: '佐藤花子',
      customerPhone: '090-3333-4444',
      customerEmail: 'sato@example.com',
      address: {
        postalCode: '150-0001',
        prefecture: '東京都',
        city: '渋谷区',
        detail: '神宮前1-1-1'
      },
      specialNotes: 'ペットがいます',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000)
    }
  ];

  // Mock active jobs
  const mockActiveJobs: Order[] = [
    {
      id: 'order-3',
      customerId: 'customer-3',
      serviceId: 'photo-service',
      planId: 'real-estate',
      status: 'in_progress',
      customerName: '田中次郎',
      customerPhone: '090-5555-6666',
      customerEmail: 'tanaka@example.com',
      address: {
        postalCode: '104-0061',
        prefecture: '東京都',
        city: '中央区',
        detail: '銀座1-1-1'
      },
      assignedProfessionalId: user.id,
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(Date.now() - 86400000)
    }
  ];

  const handleAcceptJob = (orderId: string) => {
    alert(`案件 ${orderId} を受注しました。お客様とAdminに通知メールを送信いたします。`);
  };

  const handleCompleteJob = (orderId: string) => {
    alert(`案件 ${orderId} を完了しました。お客様とAdminに完了通知メールを送信いたします。`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">プロフェッショナルダッシュボード</h1>
              <p className="text-gray-600">こんにちは、{user.name}さん</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了案件</p>
                <p className="text-2xl font-bold text-gray-900">{professionalData.completedJobs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">評価</p>
                <p className="text-2xl font-bold text-gray-900">⭐ {professionalData.rating}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">★</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">新規依頼</p>
                <p className="text-2xl font-bold text-gray-900">{mockRequests.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">進行中</p>
                <p className="text-2xl font-bold text-gray-900">{mockActiveJobs.length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'requests', label: '新規依頼', icon: Bell },
              { id: 'active', label: '進行中の案件', icon: Clock },
              { id: 'profile', label: 'プロフィール', icon: CheckCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* New Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">新規依頼</h2>
            
            <div className="space-y-6">
              {mockRequests.map((request) => (
                <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getServiceName(request.serviceId, request.planId)}
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          新規
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">お客様情報</p>
                          <p className="text-gray-900">{request.customerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {request.customerPhone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {request.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">作業場所</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-900">〒{request.address.postalCode}</p>
                              <p className="text-gray-600">
                                {request.address.prefecture} {request.address.city}
                              </p>
                              <p className="text-gray-600">{request.address.detail}</p>
                            </div>
                          </div>
                          {request.meetingPlace && (
                            <p className="text-sm text-gray-600 mt-2">
                              集合場所: {request.meetingPlace}
                            </p>
                          )}
                        </div>
                      </div>

                      {request.specialNotes && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">特記事項</p>
                          <p className="text-sm text-gray-600">{request.specialNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ¥{getPlanPrice(request.planId).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            依頼日: {request.createdAt.toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcceptJob(request.id)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          受注する
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {mockRequests.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">現在、新規依頼はありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Jobs Tab */}
        {activeTab === 'active' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">進行中の案件</h2>
            
            <div className="space-y-6">
              {mockActiveJobs.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getServiceName(job.serviceId, job.planId)}
                        </h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          進行中
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">お客様情報</p>
                          <p className="text-gray-900">{job.customerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {job.customerPhone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {job.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">作業場所</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-900">〒{job.address.postalCode}</p>
                              <p className="text-gray-600">
                                {job.address.prefecture} {job.address.city}
                              </p>
                              <p className="text-gray-600">{job.address.detail}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ¥{getPlanPrice(job.planId).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            受注日: {job.updatedAt.toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          完了報告
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {mockActiveJobs.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">現在、進行中の案件はありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">プロフィール</h2>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">お名前</label>
                      <p className="mt-1 text-gray-900">{professionalData.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
                      <p className="mt-1 text-gray-900">{professionalData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">電話番号</label>
                      <p className="mt-1 text-gray-900">{professionalData.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">スキル・資格</h3>
                  <div className="space-y-2">
                    {professionalData.labels.map((label) => (
                      <div key={label.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">{label.name}</span>
                        <span className="text-sm text-blue-600">{label.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">実績</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{professionalData.completedJobs}</div>
                    <p className="text-sm text-gray-600">完了案件数</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">⭐ {professionalData.rating}</div>
                    <p className="text-sm text-gray-600">平均評価</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${professionalData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {professionalData.isActive ? 'ON' : 'OFF'}
                    </div>
                    <p className="text-sm text-gray-600">稼働状況</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;