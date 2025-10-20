import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { userAPI } from '../services/api';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">积分排行榜</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  邮箱
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  积分
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  角色
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className={index < 3 ? 'bg-primary-50' : ''}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 sm:w-10">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-base">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${
                      user.points > 0 ? 'bg-green-100 text-green-800' : 
                      user.points < 0 ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.points}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    {user.isAdmin && (
                      <span className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        管理员
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            暂无用户数据
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-md p-4 sm:p-6 text-white">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">系统统计</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold">{users.length}</div>
            <div className="text-xs sm:text-sm opacity-90">总成员数</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold">
              {users.reduce((sum, user) => sum + user.points, 0)}
            </div>
            <div className="text-xs sm:text-sm opacity-90">总积分</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold">
              {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.points, 0) / users.length) : 0}
            </div>
            <div className="text-xs sm:text-sm opacity-90">平均积分</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

