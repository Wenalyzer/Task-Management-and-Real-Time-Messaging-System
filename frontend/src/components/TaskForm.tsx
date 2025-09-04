'use client';

import { useState } from 'react';

interface TaskFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  loading?: boolean;
}

export default function TaskForm({ onSubmit, loading = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() === '') {
      return;
    }

    try {
      await onSubmit(title, description);
      setTitle('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('建立任務失敗:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        + 新增任務
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            任務標題 *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="輸入任務標題"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            任務描述（可選）
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="輸入任務描述"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || title.trim() === ''}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '建立中...' : '建立任務'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setTitle('');
              setDescription('');
            }}
            disabled={loading}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 font-medium"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}