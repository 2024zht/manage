import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { Attendance } from '../types';
import { MapPin, Clock, CheckCircle, XCircle, Calendar, AlertCircle, Navigation } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

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

  const handleSign = async (attendanceId: number) => {
    setSigning(true);
    setLocationError('');

    try {
      // 获取用户位置
      if (!navigator.geolocation) {
        setLocationError('您的浏览器不支持地理定位');
        setSigning(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await attendanceAPI.sign(attendanceId, latitude, longitude);
            alert('签到成功！');
            fetchAttendances();
          } catch (error: any) {
            if (error.response?.data?.error) {
              setLocationError(error.response.data.error);
              if (error.response.data.distance) {
                setLocationError(
                  `${error.response.data.error}\n当前距离：${error.response.data.distance}米，要求：${error.response.data.required}米内`
                );
              }
            } else {
              setLocationError('签到失败，请稍后重试');
            }
          } finally {
            setSigning(false);
          }
        },
        (error) => {
          setSigning(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('您拒绝了位置权限请求，无法签到');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('无法获取您的位置信息');
              break;
            case error.TIMEOUT:
              setLocationError('获取位置信息超时');
              break;
            default:
              setLocationError('获取位置时发生未知错误');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      setSigning(false);
      setLocationError('签到失败');
    }
  };

  const getStatusBadge = (attendance: Attendance) => {
    const now = new Date();
    const start = new Date(attendance.startTime);
    const end = new Date(attendance.endTime);

    if (attendance.hasSigned) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
          <CheckCircle className="h-3 w-3 mr-1" />
          已签到
        </span>
      );
    } else if (attendance.completed) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
          <XCircle className="h-3 w-3 mr-1" />
          已结束
        </span>
      );
    } else if (now < start) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">未开始</span>;
    } else if (now >= start && now <= end) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">
          <Clock className="h-3 w-3 mr-1" />
          签到中
        </span>
      );
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">待处理</span>;
    }
  };

  const canSign = (attendance: Attendance) => {
    const now = new Date();
    const start = new Date(attendance.startTime);
    const end = new Date(attendance.endTime);
    return !attendance.hasSigned && !attendance.completed && now >= start && now <= end;
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
      <h2 className="text-2xl font-bold text-gray-800">点名签到</h2>

      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">签到失败</h3>
            <p className="text-sm text-red-700 whitespace-pre-line mt-1">{locationError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attendances.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无点名任务
          </div>
        ) : (
          attendances.map((attendance) => (
            <div
              key={attendance.id}
              className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition ${
                attendance.hasSigned ? 'border-2 border-green-200' : ''
              }`}
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
                  开始：{new Date(attendance.startTime).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  截止：{new Date(attendance.endTime).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  {attendance.locationName}
                </div>
                <div className="text-xs text-gray-500">
                  要求：距离指定地点 {attendance.radius} 米内
                </div>
              </div>

              {attendance.hasSigned && attendance.signedAt && (
                <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
                  签到时间：{new Date(attendance.signedAt).toLocaleString('zh-CN')}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                {canSign(attendance) ? (
                  <button
                    onClick={() => handleSign(attendance.id)}
                    disabled={signing}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {signing ? '定位中...' : '立即签到'}
                  </button>
                ) : attendance.hasSigned ? (
                  <div className="text-center text-sm text-green-600 font-medium">
                    ✓ 您已完成签到
                  </div>
                ) : attendance.completed ? (
                  <div className="text-center text-sm text-gray-500">
                    点名已结束
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    签到尚未开始
                  </div>
                )}
              </div>

              {!attendance.hasSigned && !attendance.completed && (
                <div className="mt-2 text-xs text-orange-600 text-center">
                  未签到将扣除 {attendance.penaltyPoints} 分
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

