import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onShowSignUp: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowSignUp }) => {
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
      // Admin固定ログイン
      if (email === 'of@thisismerci.com' && password === 'comocomo917') {
        onLogin({
          id: 'admin-1',
          name: '管理者',
          email: 'of@thisismerci.com',
          role: 'admin'
        });
        return;
      }

      // Professional用のデモログイン（実際はAPIで認証）
      if (email === 'pro@example.com' && password === 'password') {
        onLogin({
          id: 'pro-1',
          name: '佐藤花子',
          email: 'pro@example.com',
          role: 'professional'
        });
        return;
      }

      // Customer用のデモログイン（実際はAPIで認証）
      if (email === 'customer@example.com' && password === 'password') {
        onLogin({
          id: 'customer-1',
          name: '田中太郎',
          email: 'customer@example.com',
          role: 'customer'
        });
        return;
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">テスト用アカウント:</p>
              <p>管理者: of@thisismerci.com / comocomo917</p>
              <p>カスタマー: customer@example.com / password</p>
              <p>プロフェッショナル: pro@example.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;