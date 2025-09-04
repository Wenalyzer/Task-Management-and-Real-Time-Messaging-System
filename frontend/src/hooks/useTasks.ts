'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskStats } from '@/types';
import { tasksAPI } from '@/lib/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (status?: TaskStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tasksAPI.getTasks(status);
      setTasks(response.data);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : '取得任務失敗';
      setError(errorMessage || '取得任務失敗');
      console.error('取得任務時發生錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await tasksAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('取得統計資訊時發生錯誤:', err);
    }
  }, []);

  const createTask = useCallback(async (title: string, description: string) => {
    try {
      const response = await tasksAPI.createTask(title, description);
      await fetchTasks();
      await fetchStats();
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : '建立任務失敗';
      setError(errorMessage || '建立任務失敗');
      throw err;
    }
  }, [fetchTasks, fetchStats]);

  const updateTask = useCallback(async (id: number, data: { title?: string; description?: string; status?: TaskStatus }) => {
    try {
      const response = await tasksAPI.updateTask(id, data);
      await fetchTasks();
      await fetchStats();
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : '更新任務失敗';
      setError(errorMessage || '更新任務失敗');
      throw err;
    }
  }, [fetchTasks, fetchStats]);

  const deleteTask = useCallback(async (id: number) => {
    try {
      await tasksAPI.deleteTask(id);
      await fetchTasks();
      await fetchStats();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : '刪除任務失敗';
      setError(errorMessage || '刪除任務失敗');
      throw err;
    }
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  return {
    tasks,
    stats,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setError
  };
};