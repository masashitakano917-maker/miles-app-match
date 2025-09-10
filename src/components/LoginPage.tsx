import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { DataService } from '../services/DataService';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onShowSignUp: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowSignUp }) => {
  const [accountType, setAccountType] = useState<'admin' | 'customer' | 'professional'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Admin認証
      if (accountType === 'admin') {
        if (email === 'of@thisismerci.com' && password === 'comocomo917') {
          onLogin({
            id: 'admin-1',
            name: '管理者',
            email: 'of@thisismerci.com',
            role: 'admin'
          });
          return;
        }
      }

      // Professional認証
      if (accountType === 'professional') {
        const professionals = DataService.loadProfessionals();
        const professional = professionals.find(p => p.email === email && p.password === password);
        if (professional) {
          onLogin({
            id: professional.id,
            name: professional.name,
            email: professional.email,
            role: 'professional',
            phone: professional.phone,
            address: professional.address
          });
          return;
        }
      }

      // Customer認証
      if (accountType === 'customer') {
        const customers = DataService.loadCustomers();
        const customer = customers.find(c => c.email === email && c.password === password);
        if (customer) {
          onLogin({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            role: 'customer',
            phone: customer.phone,
            address: customer.address
          });
          return;
        }
      }

      setError('メールアドレスまたはパスワードが正しくありません');
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            マッチングプラットフォーム
          </h1>
          <p className="text-orange-100">ログインしてください</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アカウントタイプ
              </label>
              <div className="relative">
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'admin' | 'customer' | 'professional')}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="customer">カスタマー</option>
                  <option value="professional">プロフェッショナル</option>
                  <option value="admin">管理者</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-4">
              アカウントをお持ちでない方は
            </p>
            <button
              onClick={onShowSignUp}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm hover:underline"
            >
              新規登録はこちら
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;