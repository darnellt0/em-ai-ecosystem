import fs from 'fs';
import path from 'path';
import { ToolHandler } from './tool.types';

interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  dueDate?: string;
  notes?: string;
  priority?: string;
  createdAt: string;
}

const tasksDir = path.resolve(__dirname, '../../.data/tasks');
const tasksFile = path.join(tasksDir, 'tasks.json');

function ensureTasksDir() {
  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }
}

function readTasks(): TaskRecord[] {
  ensureTasksDir();
  if (!fs.existsSync(tasksFile)) return [];
  try {
    const raw = fs.readFileSync(tasksFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TaskRecord[]) : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: TaskRecord[]) {
  ensureTasksDir();
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

export const createTaskHandler: ToolHandler = async (req) => {
  const title = req.input?.title;
  const userId = req.input?.userId;
  if (!title || !userId) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'title and userId are required' } };
  }

  const task: TaskRecord = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title,
    dueDate: req.input?.dueDate,
    notes: req.input?.notes,
    priority: req.input?.priority,
    createdAt: new Date().toISOString(),
  };

  const tasks = readTasks();
  tasks.unshift(task);
  writeTasks(tasks);

  return { ok: true, output: { taskId: task.id, task, sink: 'file' } };
};
