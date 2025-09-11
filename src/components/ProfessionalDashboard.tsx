import React, { useState, useEffect } from 'react';
import type { User, Order, Professional } from '../types';
import { Bell, CheckCircle, Clock, MapPin, LogOut, Phone, Mail, Eye, X, Edit, Save, EyeOff } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import { DataService } from '../services/DataService';
import { MatchingService } from '../services/MatchingService';

interface ProfessionalDashboardProps {
  user: User;
  onLogout: () => void;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Professional data from DataService
  const [professionalData, setProfessionalData] = useState<Professional | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    equipment: '',
    experience: '',
    address: {
      postalCode: '',
      prefecture: '',
      city: '',
      detail: ''
    }
  });

  // Load professional data on mount
  useEffect(() => {
    const professionals = DataService.loadProfessionals();
    const currentProfessional = professionals.find(p => p.id === user.id);
    
    if (currentProfessional) {
      setProfessionalData(currentProfessional);
      setEditFormData({
        name: currentProfessional.name,
        email: currentProfessional.email,
        phone: currentProfessional.phone || '',
        password: currentProfessional.password || '',
        bio: currentProfessional.bio || '',
        equipment: currentProfessional.equipment || '',
        experience: currentProfessional.experience || '',
        address: currentProfessional.address || {
          postalCode: '',
          prefecture: '',
          city: '',
          detail: ''
        }
      });
    }
  }, [user.id]);

  // Load pending requests from MatchingService
  const [mockRequests, setMockRequests] = useState<Order[]>([]);
  
  // Load professional's orders on mount and set up refresh
  useEffect(() => {
    const loadProfessionalOrders = () => {
      const orders = MatchingService.getProfessionalOrders(user.id);
      setMockRequests(orders);
    };
    
    loadProfessionalOrders();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadProfessionalOrders, 30000);
    
    return () => clearInterval(interval);
  }, [user.id]);

  // Mock active jobs (empty by default)
  const [mockActiveJobs, setMockActiveJobs] = useState<Order[]>([]);

  const handleAcceptJob = async (orderId: string) => {
    const order = mockRequests.find(r => r.id === orderId);
    if (!order || !professionalData) return;

    // Move from requests to active jobs
    const updatedOrder = { ...order, status: 'in_progress' as const, assignedProfessionalId: user.id };
    setMockRequests(mockRequests.filter(r => r.id !== orderId));
    setMockActiveJobs([...mockActiveJobs, updatedOrder]);
    
    // Remove from professional's order list
    MatchingService.removeOrderFromProfessional(user.id, orderId);

    // Send notifications
    await NotificationService.sendMatchNotification(updatedOrder, professionalData);

    alert(`案件 ${orderId} を受注しました。お客様とAdminに通知メールを送信いたします。`);
  };

  const handleCompleteJob = async (orderId: string) => {
    const order = mockActiveJobs.find(j => j.id === orderId);
    if (!order || !professionalData) return;

    // Update job status
    const updatedOrder = { ...order, status: 'completed' as const };
    setMockActiveJobs(mockActiveJobs.filter(j => j.id !== orderId));

    // Send notifications
    await NotificationService.sendCompletionNotification(updatedOrder, professionalData);

    alert(`案件 ${orderId} を完了しました。お客様とAdminに完了通知メールを送信いたします。`);
  };

  const handleSaveProfile = async () => {
    if (!professionalData) return;

    const updatedProfessional: Professional = {
      ...professionalData,
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      password: editFormData.password,
      bio: editFormData.bio,
      equipment: editFormData.equipment,
      experience: editFormData.experience,
      address: editFormData.address
    };

    // Update in DataService
    const professionals = DataService.loadProfessionals();
    const updatedProfessionals = professionals.map(p => 
      p.id === professionalData.id ? updatedProfessional : p
    );
    DataService.saveProfessionals(updatedProfessionals);

    // Send notification
    await NotificationService.sendProfessionalRegistrationNotification(updatedProfessional, false);

    setProfessionalData(updatedProfessional);
    setIsEditingProfile(false);
    console.log('✅ プロフィールを更新しました');
  };

  const handleCancelEdit = () => {
    if (professionalData) {
      setEditFormData({
        name: professionalData.name,
        email: professionalData.email,
        phone: professionalData.phone || '',
        password: professionalData.password || '',
        bio: professionalData.bio || '',
        equipment: professionalData.equipment || '',
        experience: professionalData.experience || '',
        address: professionalData.address || {
          postalCode: '',
          prefecture: '',
          city: '',
          detail: ''
        }
      });
    }
    setIsEditingProfile(false);
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

  if (!professionalData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">プロフェッショナルデータを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">プロフェッショナルダッシュボード</h1>
              <p className="text-gray-300">こんにちは、{professionalData.name}さん</p>
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
                <p className="text-sm font-medium text-gray-400">完了案件</p>
                <p className="text-2xl font-bold text-white">{professionalData.completedJobs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">評価</p>
                <p className="text-2xl font-bold text-white">⭐ {professionalData.rating}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">★</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">新規依頼</p>
                <p className="text-2xl font-bold text-white">{mockRequests.length}</p>
              </div>
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">進行中</p>
                <p className="text-2xl font-bold text-white">{mockActiveJobs.length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
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

        {/* New Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">新規依頼</h2>
            
            <div className="space-y-6">
              {mockRequests.map((request) => (
                <div key={request.id} className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {getServiceName(request.serviceId, request.planId)}
                        </h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          新規
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">お客様情報</p>
                          <p className="text-white">{request.customerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-4 h-4" />
                            {request.customerPhone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-4 h-4" />
                            {request.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">作業場所</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-white">〒{request.address.postalCode}</p>
                              <p className="text-gray-400">
                                {request.address.prefecture} {request.address.city}
                              </p>
                              <p className="text-gray-400">{request.address.detail}</p>
                            </div>
                          </div>
                          {request.meetingPlace && (
                            <p className="text-sm text-gray-400 mt-2">
                              集合場所: {request.meetingPlace}
                            </p>
                          )}
                        </div>
                      </div>

                      {request.specialNotes && (
                        <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700">
                          <p className="text-sm font-medium text-yellow-300 mb-1">特記事項</p>
                          <p className="text-sm text-yellow-200">{request.specialNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-orange-400">
                            ¥{getPlanPrice(request.planId).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            依頼日: {request.createdAt.toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcceptJob(request.id)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
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
                  <p className="text-gray-400">現在、新規依頼はありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Jobs Tab */}
        {activeTab === 'active' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">進行中の案件</h2>
            
            <div className="space-y-6">
              {mockActiveJobs.map((job) => (
                <div key={job.id} className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {getServiceName(job.serviceId, job.planId)}
                        </h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          進行中
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">お客様情報</p>
                          <p className="text-white">{job.customerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-4 h-4" />
                            {job.customerPhone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-4 h-4" />
                            {job.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">作業場所</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-white">〒{job.address.postalCode}</p>
                              <p className="text-gray-400">
                                {job.address.prefecture} {job.address.city}
                              </p>
                              <p className="text-gray-400">{job.address.detail}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-orange-400">
                            ¥{getPlanPrice(job.planId).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            受注日: {job.updatedAt.toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium"
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
                  <p className="text-gray-400">現在、進行中の案件はありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">プロフィール</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  編集
                </button>
              )}
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-700">
              {isEditingProfile ? (
                // Edit Form
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">お名前</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">メールアドレス</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">電話番号</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">自己紹介</label>
                    <textarea
                      rows={4}
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      placeholder="自己紹介を入力してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">プロ機材</label>
                    <textarea
                      rows={3}
                      value={editFormData.equipment}
                      onChange={(e) => setEditFormData({ ...editFormData, equipment: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      placeholder="使用している機材を入力してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">経歴</label>
                    <textarea
                      rows={4}
                      value={editFormData.experience}
                      onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      placeholder="経歴を入力してください"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">郵便番号</label>
                      <input
                        type="text"
                        value={editFormData.address.postalCode}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, postalCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">都道府県</label>
                      <input
                        type="text"
                        value={editFormData.address.prefecture}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, prefecture: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">市区町村</label>
                      <input
                        type="text"
                        value={editFormData.address.city}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, city: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">それ以降の住所</label>
                      <input
                        type="text"
                        value={editFormData.address.detail}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: { ...editFormData.address, detail: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">基本情報</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400">お名前</label>
                          <p className="mt-1 text-white">{professionalData.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400">メールアドレス</label>
                          <p className="mt-1 text-white">{professionalData.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400">電話番号</label>
                          <p className="mt-1 text-white">{professionalData.phone || '未設定'}</p>
                        </div>
                        {professionalData.address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-400">住所</label>
                            <p className="mt-1 text-white">
                              〒{professionalData.address.postalCode}<br />
                              {professionalData.address.prefecture} {professionalData.address.city}<br />
                              {professionalData.address.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">スキル・資格</h3>
                      <div className="space-y-2">
                        {professionalData.labels && professionalData.labels.length > 0 ? (
                          professionalData.labels.map((label) => (
                            <div key={label.id} className="flex items-center justify-between p-3 bg-orange-900 bg-opacity-30 rounded-lg border border-orange-700">
                              <span className="font-medium text-orange-300">{label.name}</span>
                              <span className="text-sm text-orange-400">{label.category}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400">スキル・資格が設定されていません</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {professionalData.bio && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">自己紹介</h3>
                      <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{professionalData.bio}</p>
                    </div>
                  )}

                  {professionalData.equipment && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">プロ機材</h3>
                      <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{professionalData.equipment}</p>
                    </div>
                  )}

                  {professionalData.experience && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">経歴</h3>
                      <p className="text-gray-300 bg-gray-700 p-4 rounded-lg">{professionalData.experience}</p>
                    </div>
                  )}

                  <div className="mt-8 pt-8 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">実績</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-400">{professionalData.completedJobs}</div>
                        <p className="text-sm text-gray-400">完了案件数</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400">⭐ {professionalData.rating}</div>
                        <p className="text-sm text-gray-400">平均評価</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${professionalData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {professionalData.isActive ? 'ON' : 'OFF'}
                        </div>
                        <p className="text-sm text-gray-400">稼働状況</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;