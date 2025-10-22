import React, { useState, useEffect } from 'react';
import { User, Rule, PointRequest } from '../types';
import { userAPI, ruleAPI } from '../services/api';
import { Settings, Users, BookOpen, Edit2, Trash2, Plus, Save, X, Upload, Download, MessageSquare, Check, XCircle, MapPin } from 'lucide-react';
import AttendanceManagementPanel from './AttendanceManagementPanel';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'import' | 'requests' | 'attendance'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 编辑规则状态
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [newRule, setNewRule] = useState({ name: '', points: 0, description: '' });
  const [showAddRule, setShowAddRule] = useState(false);

  // 批量导入状态
  const [importData, setImportData] = useState('');
  const [importReason, setImportReason] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rulesRes, requestsRes] = await Promise.all([
        userAPI.getAll(),
        ruleAPI.getAll(),
        userAPI.getAllRequests()
      ]);
      setUsers(usersRes.data);
      setRules(rulesRes.data);
      setRequests(requestsRes.data);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setImportData(text);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleBatchImport = async () => {
    if (!importData || !importReason) {
      alert('请填写导入数据和原因');
      return;
    }

    try {
      // 解析CSV数据
      const lines = importData.trim().split('\n');
      const records = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('学号')) continue; // 跳过空行和表头

        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          records.push({
            studentId: parts[0],
            points: parseInt(parts[1])
          });
        }
      }

      if (records.length === 0) {
        alert('没有有效的导入数据');
        return;
      }

      // 调用API
      const response = await fetch('/api/users/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ records, reason: importReason })
      });

      const result = await response.json();
      setImportResult(result);
      
      if (result.success > 0) {
        // 显示成功提示
        setShowSuccessModal(true);
        
        // 清空输入
        setImportData('');
        setImportReason('');
        setSelectedFile(null);
        
        // 清空文件输入
        const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // 刷新数据
        fetchData();
        
        // 3秒后自动关闭成功提示
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        // 如果全部失败，不清空数据，方便用户修改重试
        alert('导入失败，请检查数据格式');
      }
    } catch (error) {
      alert('导入失败');
      console.error(error);
    }
  };

  const downloadTemplate = () => {
    const template = `学号,积分,备注
2021001,10,完成实验报告
2021002,15,参加组会并发言
2021003,-5,迟到`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '批量导入模板.csv';
    link.click();
  };

  const handleApproveRequest = async (requestId: number, adminComment?: string) => {
    try {
      await userAPI.handleRequest(requestId, 'approved', adminComment);
      alert('已批准该异议');
      fetchData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleRejectRequest = async (requestId: number, adminComment?: string) => {
    try {
      await userAPI.handleRequest(requestId, 'rejected', adminComment);
      alert('已拒绝该异议');
      fetchData();
    } catch (error) {
      alert('操作失败');
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
            <button
              onClick={() => setActiveTab('import')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="inline-block h-5 w-5 mr-2" />
              批量导入
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base relative ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="inline-block h-5 w-5 mr-2" />
              异议管理
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base ${
                activeTab === 'attendance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="inline-block h-5 w-5 mr-2" />
              点名管理
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

        {/* 批量导入 */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📋 导入说明</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 支持CSV格式：学号,积分,备注</li>
                <li>• 积分可以是正数（加分）或负数（扣分）</li>
                <li>• 学号必须在系统中已存在</li>
                <li>• 每行一条记录，逗号分隔</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                下载模板文件
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传CSV文件或手动输入
              </label>
              
              {/* 文件上传 */}
              <div className="mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    id="csvFileInput"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="csvFileInput"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择CSV文件
                  </label>
                  {selectedFile && (
                    <span className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">📄 {selectedFile.name}</span>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setImportData('');
                          const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {/* 文本输入 */}
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                rows={10}
                placeholder={`学号,积分,备注
2021001,10,完成实验报告
2021002,15,参加组会并发言
2021003,-5,迟到`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                导入原因（必填）
              </label>
              <input
                type="text"
                value={importReason}
                onChange={(e) => setImportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="例如：第一次作业成绩"
              />
            </div>

            <button
              onClick={handleBatchImport}
              disabled={!importData || !importReason}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center"
            >
              <Upload className="h-5 w-5 mr-2" />
              开始导入
            </button>

            {importResult && (
              <div className={`p-4 rounded-lg ${
                importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h4 className="font-semibold mb-2">
                  {importResult.failed === 0 ? '✅ 导入成功' : '⚠️ 导入完成（部分失败）'}
                </h4>
                <div className="text-sm space-y-1">
                  <p className="text-green-700">成功: {importResult.success} 条</p>
                  {importResult.failed > 0 && (
                    <p className="text-red-700">失败: {importResult.failed} 条</p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-red-800 mb-1">错误详情:</p>
                      <ul className="text-red-700 space-y-1">
                        {importResult.errors.map((err: string, idx: number) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">💡 使用提示</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>1. 点击"下载模板文件"获取CSV模板</li>
                <li>2. 使用Excel或记事本编辑模板，填入数据</li>
                <li>3. 复制数据粘贴到上方文本框</li>
                <li>4. 填写导入原因（如"第一次作业"）</li>
                <li>5. 点击"开始导入"执行批量操作</li>
              </ul>
            </div>
          </div>
        )}

        {/* 点名管理 */}
        {activeTab === 'attendance' && (
          <AttendanceManagementPanel />
        )}

        {/* 异议管理 */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                用户异议列表
                <span className="ml-2 text-sm text-gray-500">
                  (待处理: {requests.filter(r => r.status === 'pending').length})
                </span>
              </h3>
            </div>

            {/* 待处理异议 */}
            <div className="mb-6">
              <h4 className="font-medium text-orange-700 mb-3">⏳ 待处理异议</h4>
              {requests.filter(r => r.status === 'pending').length > 0 ? (
                <div className="space-y-3">
                  {requests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {request.name} ({request.studentId})
                            </span>
                            <span className="text-sm text-gray-600">- {request.className}</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              request.points > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              申请 {request.points > 0 ? '+' : ''}{request.points} 分
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">
                            <strong>理由:</strong> {request.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(request.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              const comment = prompt('批准理由（可选）:');
                              if (comment !== null) {
                                handleApproveRequest(request.id, comment || undefined);
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            批准
                          </button>
                          <button
                            onClick={() => {
                              const comment = prompt('拒绝理由（必填）:');
                              if (comment) {
                                handleRejectRequest(request.id, comment);
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  暂无待处理异议
                </div>
              )}
            </div>

            {/* 已处理异议 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">📋 已处理异议</h4>
              {requests.filter(r => r.status !== 'pending').length > 0 ? (
                <div className="space-y-3">
                  {requests.filter(r => r.status !== 'pending').map((request) => (
                    <div 
                      key={request.id} 
                      className={`p-4 border rounded-lg ${
                        request.status === 'approved' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {request.name} ({request.studentId})
                            </span>
                            <span className="text-sm text-gray-600">- {request.className}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              request.status === 'approved'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {request.status === 'approved' ? '✓ 已批准' : '✗ 已拒绝'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              request.points > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.points > 0 ? '+' : ''}{request.points} 分
                            </span>
                          </div>
                          <p className="text-gray-700 mb-1">
                            <strong>用户理由:</strong> {request.reason}
                          </p>
                          {request.adminComment && (
                            <p className="text-gray-700 mb-1">
                              <strong>管理员备注:</strong> {request.adminComment}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span>📅 提交时间: {new Date(request.createdAt).toLocaleString('zh-CN')}</span>
                            {request.respondedAt && (
                              <>
                                <span>✓ 处理时间: {new Date(request.respondedAt).toLocaleString('zh-CN')}</span>
                                {request.respondedByUsername && (
                                  <span>👤 处理人: {request.respondedByUsername}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  暂无历史记录
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 成功提示悬浮窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-fade-in">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">导入成功！</h3>
            {importResult && (
              <div className="text-gray-600 space-y-1">
                <p className="text-lg">成功导入 <span className="text-green-600 font-bold">{importResult.success}</span> 条记录</p>
                {importResult.failed > 0 && (
                  <p className="text-sm text-red-600">失败 {importResult.failed} 条</p>
                )}
              </div>
            )}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

