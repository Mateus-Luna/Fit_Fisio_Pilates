import { api } from './api';

export interface BackupResponse {
  success: boolean;
  message: string;
  counts?: {
    students: number;
    modalities: number;
    classes: number;
    enrollments: number;
    payments: number;
    families: number;
  };
}

export const backupService = {
  async exportBackup(): Promise<void> {
    const response = await api.get('/backup/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `backup-fitfisio-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async restoreBackup(backupData: any): Promise<BackupResponse> {
    const response = await api.post<BackupResponse>('/backup/restore', backupData);
    return response.data;
  },
};
