import React, { useState } from 'react';
import { User, Professional, Order, Service, Label } from '../types';
import { Users, ClipboardList, Tags, Settings, LogOut, Plus, Edit, Trash2, X, Eye } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('professionals');
  const [showAddProfessionalModal, setShowAddProfessionalModal] = useState(false);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [newProfessional, setNewProfessional] = useState({
    name: '',
    email: '',
    phone: '',
    selectedLabels: [] as string[]
  });
  const [newLabel, setNewLabel] = useState({
    name: '',
    category: '写真撮影'
  });

  // Mock data
  const [mockProfessionals, setMockProfessionals] = useState<Professional[]>([
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
      labels: [{ id: 'l4', name: '1LDK', category: 'お掃除' }],
      isActive: true,
      completedJobs: 23,
      rating: 4.9
    }
  ]);

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
    const selectedLabelObjects = mockLabels.filter(label => 
      newProfessional.selectedLabels.includes(label.id)
    );

    const professional: Professional = {
      id: `pro-${Date.now()}`,
      name: newProfessional.name,
      email: newProfessional.email,
      role: 'professional',
      phone: newProfessional.phone,
      labels: selectedLabelObjects,
      isActive: true,
      completedJobs: 0,
      rating: 5.0
    };

    setMockProfessionals([...mockProfessionals, professional]);
    setNewProfessional({ name: '', email: '', phone: '', selectedLabels: [] });
    setShowAddProfessionalModal(false);
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('このプロフェッショナルを削除しますか？')) {
      setMockProfessionals(mockProfessionals.filter(p => p.id !== id));
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
              <button 
                onClick={() => setShowAddProfessionalModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新規登録
              </button>
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
                            <button className="text-orange-400 hover:text-orange-300">
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
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {mockOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {order.id}
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新規プロフェッショナル登録</h3>
              <button
                onClick={() => setShowAddProfessionalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
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
    </div>
  );
};

export default AdminDashboard;