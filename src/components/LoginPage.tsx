import React, { useState } from 'react';
import { User } from '../types';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer' | 'professional'>('customer');

  // Demo users for testing
  const demoUsers = {
    admin: {
      id: 'admin-1',
      name: '管理者',
      email: 'admin@example.com',
      role: 'admin' as const
    },
    customer: {
      id: 'customer-1',
      name: '田中太郎',
      email: 'customer@example.com',
      role: 'customer' as const
    },
    professional: {
      id: 'pro-1',
      name: '佐藤花子',
      email: 'pro@example.com',
      role: 'professional' as const
    }
  };

  const handleLogin = () => {
    onLogin(demoUsers[selectedRole]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            マッチングプラットフォーム
          </h1>
          <p className="text-gray-600">ログインしてください</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザータイプ
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">カスタマー</option>
              <option value="professional">プロフェッショナル</option>
              <option value="admin">管理者</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ログイン
          </button>

          <div className="text-xs text-gray-500 text-center">
            <p>デモ用ログイン</p>
            <p>カスタマー: customer@example.com</p>
            <p>プロフェッショナル: pro@example.com</p>
            <p>管理者: admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;