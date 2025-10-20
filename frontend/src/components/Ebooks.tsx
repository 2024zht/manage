import React, { useState, useEffect } from 'react';
import { ebookAPI } from '../services/api';
import { Ebook } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Book, Download, Upload, HardDrive } from 'lucide-react';

const Ebooks: React.FC = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    try {
      const { data } = await ebookAPI.getAll();
      setEbooks(data);
    } catch (error) {
      console.error('获取电子书列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 取消文件大小限制

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await ebookAPI.upload(formData);
      alert('上传成功！正在同步到云存储...');
      fetchEbooks();
      // 清空input
      e.target.value = '';
    } catch (error: any) {
      alert(error.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };


  const handleDownload = async (ebook: Ebook) => {
    try {
      const { data } = await ebookAPI.getDownloadUrl(ebook.filename);
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      alert('获取下载链接失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Book className="h-6 w-6 mr-2 text-blue-600" />
          电子书库
        </h2>
        
        {user?.isAdmin && (
          <div>
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.epub,.mobi,.azw3,.txt,.doc,.docx"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="fileInput"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-5 w-5 mr-2" />
              {uploading ? '上传中...' : '上传电子书'}
            </label>
          </div>
        )}
      </div>

      {user?.isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>管理员提示：</strong>
            上传文件后将自动同步到 Backblaze B2 云存储。
            支持的格式：PDF, EPUB, MOBI, AZW3, TXT, DOC, DOCX。
            最大文件大小：100MB。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ebooks.length > 0 ? (
          ebooks.map((ebook) => (
            <div
              key={ebook.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <Book className="h-8 w-8 text-blue-500 flex-shrink-0" />
                {ebook.b2Synced && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    已同步
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2" title={ebook.originalName}>
                {ebook.originalName}
              </h3>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-1" />
                  {formatFileSize(ebook.fileSize)}
                </p>
                {ebook.uploadedByUsername && <p>上传者: {ebook.uploadedByUsername}</p>}
                <p className="text-xs text-gray-500">
                  {new Date(ebook.uploadedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(ebook)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无电子书
            {user?.isAdmin && '，点击上方"上传电子书"按钮添加资源'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ebooks;

