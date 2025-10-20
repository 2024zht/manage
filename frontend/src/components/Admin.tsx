import React, { useState, useEffect } from 'react';
import { User, Rule } from '../types';
import { userAPI, ruleAPI } from '../services/api';
import { Settings, Users, BookOpen, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'rules'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 编辑规则状态
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [newRule, setNewRule] = useState({ name: '', points: 0, description: '' });
  const [showAddRule, setShowAddRule] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rulesRes] = await Promise.all([
        userAPI.getAll(),
        ruleAPI.getAll()
      ]);
      setUsers(usersRes.data);
      setRules(rulesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('确定要删除此用户吗？')) return;
    try {
      await userAPI.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      alert('用户已删除');
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleUpdatePoints = async (id: number) => {
    const pointsStr = prompt('输入积分变化（正数加分，负数扣分）：');
    if (!pointsStr) return;
    const points = parseInt(pointsStr);
    if (isNaN(points)) {
      alert('请输入有效数字');
      return;
    }
    const reason = prompt('请输入原因：') || '管理员调整';
    
    try {
      await userAPI.updatePoints(id, points, reason);
      fetchData();
      alert('积分已更新');
    } catch (error) {
      alert('更新失败');
    }
  };

  const handleToggleAdmin = async (user: User) => {
    if (!window.confirm(`确定要${user.isAdmin ? '取消' : '设置'}此用户的管理员权限吗？`)) return;
    try {
      await userAPI.setAdmin(user.id, !user.isAdmin);
      fetchData();
      alert('权限已更新');
    } catch (error) {
      alert('更新失败');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('确定要删除此规则吗？')) return;
    try {
      await ruleAPI.delete(id);
      setRules(rules.filter(r => r.id !== id));
      alert('规则已删除');
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleAddRule = async () => {
    if (!newRule.name || newRule.points === 0) {
      alert('请填写规则名称和积分');
      return;
    }
    try {
      await ruleAPI.create(newRule.name, newRule.points, newRule.description);
      setNewRule({ name: '', points: 0, description: '' });
      setShowAddRule(false);
      fetchData();
      alert('规则已添加');
    } catch (error) {
      alert('添加失败');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await ruleAPI.update(editingRule.id, editingRule.name, editingRule.points, editingRule.description);
      setEditingRule(null);
      fetchData();
      alert('规则已更新');
    } catch (error) {
      alert('更新失败');
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
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">管理员面板</h2>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block h-5 w-5 mr-2" />
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base ${
                activeTab === 'rules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="inline-block h-5 w-5 mr-2" />
              规则管理
            </button>
          </nav>
        </div>

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.points}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      {user.isAdmin ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          管理员
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          成员
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleUpdatePoints(user.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="修改积分"
                      >
                        <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title={user.isAdmin ? '取消管理员' : '设为管理员'}
                      >
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="删除用户"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 规则管理 */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>添加规则</span>
            </button>

            {showAddRule && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">新增规则</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="规则名称"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                  <input
                    type="number"
                    placeholder="积分（正数加分，负数扣分）"
                    value={newRule.points || ''}
                    onChange={(e) => setNewRule({ ...newRule, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                  <textarea
                    placeholder="规则描述"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddRule}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAddRule(false);
                        setNewRule({ name: '', points: 0, description: '' });
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2 text-sm sm:text-base"
                    >
                      <X className="h-4 w-4" />
                      <span>取消</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-gray-50 p-4 rounded-lg">
                  {editingRule?.id === rule.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      />
                      <input
                        type="number"
                        value={editingRule.points}
                        onChange={(e) => setEditingRule({ ...editingRule, points: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      />
                      <textarea
                        value={editingRule.description}
                        onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateRule}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1 text-sm"
                        >
                          <Save className="h-4 w-4" />
                          <span>保存</span>
                        </button>
                        <button
                          onClick={() => setEditingRule(null)}
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-1 text-sm"
                        >
                          <X className="h-4 w-4" />
                          <span>取消</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-sm sm:text-base">{rule.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            rule.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.points > 0 ? '+' : ''}{rule.points}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="text-primary-600 hover:text-primary-900"
                          title="编辑"
                        >
                          <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

