import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock } from 'lucide-react';

interface Attendance {
  id: number;
  name: string;
  description?: string;
  dateStart: string;
  dateEnd: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radius: number;
  penaltyPoints: number;
  createdBy: number;
  createdByUsername?: string;
  createdAt: string;
  completed: boolean;
  triggers?: any[];
  totalTriggers?: number;
}

const AttendanceManagementPanel: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dateStart: '',
    dateEnd: '',
    locationName: '',
    latitude: 36.546431870593665,  // 默认纬度
    longitude: 116.83040694925626,  // 默认经度
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
    } catch (error: any) {
      console.error('保存点名任务失败:', error);
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (attendance: Attendance) => {
    setFormData({
      name: attendance.name,
      description: attendance.description || '',
      dateStart: attendance.dateStart,
      dateEnd: attendance.dateEnd,
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
    if (!window.confirm('确定要删除这个点名任务吗？这将删除所有相关的签到记录。')) return;
    
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
      dateStart: '',
      dateEnd: '',
      locationName: '',
      latitude: 36.546431870593665,
      longitude: 116.83040694925626,
      radius: 200,
      penaltyPoints: 5,
    });
  };

  const getStatusText = (attendance: Attendance) => {
    const today = new Date().toISOString().split('T')[0];
    const start = attendance.dateStart;
    const end = attendance.dateEnd;

    if (attendance.completed) {
      return { text: '已完成', color: 'bg-gray-500' };
    } else if (today < start) {
      return { text: '未开始', color: 'bg-blue-500' };
    } else if (today >= start && today <= end) {
      return { text: '进行中', color: 'bg-green-500' };
    } else {
      return { text: '已结束', color: 'bg-orange-500' };
    }
  };

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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">点名任务管理</h3>
          <p className="text-sm text-gray-600 mt-1">
            设置日期范围，系统将在每天晚上9:15-9:25随机时间发送点名通知
          </p>
        </div>
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
                    开始日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.dateStart}
                    onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">点名开始日期</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.dateEnd}
                    onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">点名结束日期</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>触发时间说明：</strong>系统将在日期范围内的每天晚上9:15-9:25之间随机选择一个时间发送点名通知，签到时限为1分钟。
                </p>
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
      <div className="space-y-4">
        {attendances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            暂无点名任务，点击"创建点名任务"开始
          </div>
        ) : (
          attendances.map((attendance) => {
            const status = getStatusText(attendance);
            return (
              <div
                key={attendance.id}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-800">{attendance.name}</h3>
                      <span className={`px-2 py-1 ${status.color} text-white text-xs rounded`}>
                        {status.text}
                      </span>
                    </div>
                    {attendance.description && (
                      <p className="text-sm text-gray-600 mt-1">{attendance.description}</p>
                    )}
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

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    日期范围：{attendance.dateStart} 至 {attendance.dateEnd}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                    触发时间：每天晚上9:15-9:25随机
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    {attendance.locationName} ({attendance.radius}米)
                  </div>
                  <div className="text-sm text-gray-600">
                    扣分：{attendance.penaltyPoints} 分
                  </div>
                </div>

                {attendance.triggers && attendance.triggers.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      已触发 {attendance.totalTriggers} 次
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {attendance.triggers.slice(0, 3).map((trigger: any) => (
                        <div key={trigger.id} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium">{trigger.triggerDate}</div>
                          <div className="text-gray-600">
                            触发时间：{trigger.triggerTime}
                          </div>
                          <div className="text-gray-600">
                            签到人数：{trigger.signedCount || 0}
                          </div>
                          <div className={`${trigger.completed ? 'text-gray-500' : 'text-green-600'}`}>
                            {trigger.completed ? '已完成' : '进行中'}
                          </div>
                        </div>
                      ))}
                    </div>
                    {attendance.triggers.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        还有 {attendance.triggers.length - 3} 条记录...
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AttendanceManagementPanel;

