export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    email: string;
  };
}

export type TaskStatus = 'in_progress' | 'completed';

export interface TaskStats {
  total: number;
  in_progress: number;
  completed: number;
}

export interface Comment {
  id: number;
  content: string;
  task_id: number;
  user_id: number;
  created_at: string;
  user?: {
    id: number;
    email: string;
  };
}

export interface WebSocketMessage {
  type: 'new_comment' | 'user_joined' | 'user_typing' | 'error';
  comment?: Comment;
  user_id?: number;
  user_email?: string;
  is_typing?: boolean;
  message?: string;
}