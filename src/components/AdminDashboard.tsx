import React, { useState } from 'react';
import { User, Professional, Order, Service, Label } from '../types';
import { Users, ClipboardList, Tags, Settings, LogOut, Plus, Edit, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('professionals');

  // Mock data
  const mockProfessionals: Professional[] = [
    {
      id: 'pro-1',
      name: '佐藤花子',
      email: 'sato@example.com',
      role: 'professional',
      phone: '090-1234-5678',
      labels: [{ id: 'l1', name: '不動産撮影', category: '写真撮影' }],
      isActive: true,
      completedJobs: 15,
      rating: 4.8
    },
    {
      id: 'pro-2',
      name: '田中一郎',
      email: 'tanaka@example.com',
      role: 'professional',
      phone: '090-9876-5432',
      labels: [{ id: 'l2', name: '1LDK', category: 'お掃除' }],
      isActive: true,
      completedJobs: 23,
      rating: 4.9
    }
  ];

  const mockOrders: Order[] = [
    {
      id: 'order-1',
      customerId: 'customer-1',
      serviceId: 'service-1',
      planId: 'plan-1',
      status: 'pending',
      customerName: '山田太郎',
      customerPhone: '090-1111-2222',
      customerEmail: 'yamada@example.com',
      address: {
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        detail: '丸の内1-1-1'
      },
      specialNotes: 'エレベーターなし',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockLabels: Label[] = [
    { id: 'l1', name: '不動産撮影', category: '写真撮影' },
    { id: 'l2', name: 'ポートレート撮影', category: '写真撮影' },
    { id: 'l3', name: 'フード撮影', category: '写真撮影' },
    { id: 'l4', name: '1LDK', category: 'お掃除' },
    { id: 'l5', name: '2LDK', category: 'お掃除' },
    { id: 'l6', name: '3LDK', category: 'お掃除' },
    { id: 'l7', name: '翻訳', category: 'スタッフ派遣' },
    { id: 'l8', name: '通訳', category: 'スタッフ派遣' },
    { id: 'l9', name: 'イベントコンパニオン', category: 'スタッフ派遣' }
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
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
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
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

        {/* Content */}
        {activeTab === 'professionals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">プロフェッショナル一覧</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新規登録
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        プロフェッショナル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        スキル
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        完了案件
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        評価
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockProfessionals.map((professional) => (
                      <tr key={professional.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{professional.name}</div>
                            <div className="text-sm text-gray-500">{professional.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {professional.labels.map((label) => (
                              <span
                                key={label.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {professional.completedJobs}件
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
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

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">依頼管理</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        依頼ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        顧客情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        住所
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作成日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            〒{order.address.postalCode}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.address.prefecture} {order.address.city} {order.address.detail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt.toLocaleDateString('ja-JP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labels' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">ラベル管理</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新規ラベル追加
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['写真撮影', 'お掃除', 'スタッフ派遣'].map((category) => (
                <div key={category} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                  <div className="space-y-2">
                    {mockLabels
                      .filter((label) => label.category === category)
                      .map((label) => (
                        <div
                          key={label.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-900">{label.name}</span>
                          <div className="flex items-center gap-1">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
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
    </div>
  );
};

export default AdminDashboard;