import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { Attendance } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Clock, Users, Plus, Edit, Trash2, Calendar } from 'lucide-react';

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    locationName: '',
    latitude: 0,
    longitude: 0,
    radius: 200,
    penaltyPoints: 5,
  });

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAll();
      setAttendances(response.data);
    } catch (error) {
      console.error('获取点名列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await attendanceAPI.update(editingId, formData);
        alert('点名任务更新成功');
      } else {
        await attendanceAPI.create(formData);
        alert('点名任务创建成功');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchAttendances();
    } catch (error) {
      console.error('保存点名任务失败:', error);
      alert('操作失败');
    }
  };

  const handleEdit = (attendance: Attendance) => {
    setFormData({
      name: attendance.name,
      description: attendance.description || '',
      startTime: attendance.startTime,
      endTime: attendance.endTime,
      locationName: attendance.locationName,
      latitude: attendance.latitude,
      longitude: attendance.longitude,
      radius: attendance.radius,
      penaltyPoints: attendance.penaltyPoints,
    });
    setEditingId(attendance.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个点名任务吗？')) return;
    
    try {
      await attendanceAPI.delete(id);
      alert('删除成功');
      fetchAttendances();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      locationName: '',
      latitude: 0,
      longitude: 0,
      radius: 200,
      penaltyPoints: 5,
    });
  };

  const getStatusBadge = (attendance: Attendance) => {
    const now = new Date();
    const start = new Date(attendance.startTime);
    const end = new Date(attendance.endTime);

    if (attendance.completed) {
      return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">已完成</span>;
    } else if (now < start) {
      return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">未开始</span>;
    } else if (now >= start && now <= end) {
      return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">进行中</span>;
    } else {
      return <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">待处理</span>;
    }
  };

  if (!user?.isAdmin) {
    return <div className="text-center py-12 text-red-500">您没有权限访问此页面</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">点名管理</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          创建点名任务
        </button>
      </div>

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? '编辑点名任务' : '创建点名任务'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  点名主题 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地点名称 *
                </label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：实验室A座301"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    纬度 *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    经度 *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    签到半径 (米) *
                  </label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    缺席扣分 *
                  </label>
                  <input
                    type="number"
                    value={formData.penaltyPoints}
                    onChange={(e) => setFormData({ ...formData, penaltyPoints: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? '保存修改' : '创建任务'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 点名列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attendances.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无点名任务，点击"创建点名任务"开始
          </div>
        ) : (
          attendances.map((attendance) => (
            <div
              key={attendance.id}
              className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-800">{attendance.name}</h3>
                {getStatusBadge(attendance)}
              </div>

              {attendance.description && (
                <p className="text-sm text-gray-600 mb-3">{attendance.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  开始：{new Date(attendance.startTime).toLocaleString('zh-CN')}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  截止：{new Date(attendance.endTime).toLocaleString('zh-CN')}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  {attendance.locationName} ({attendance.radius}米)
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-600" />
                  已签到：{attendance.signedCount || 0} 人
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  扣分：{attendance.penaltyPoints} 分
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(attendance)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="编辑"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(attendance.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;

