import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../../services/notifications.service';
import { notificationsService } from '../../services/notifications.service';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from '../../components/common/Icons';

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR');
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    loadNotifications();
  }, [user]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError('');
      // If user exists, pass user.id, else backend returns all notifications if no userId
      const data = await notificationsService.findAll(user?.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const updated = await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        Array.isArray(prev)
          ? prev.map((n) => (n.id === id ? { ...n, readAt: updated.readAt || new Date().toISOString() } : n))
          : [],
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  }

  async function handleMarkAllAsRead() {
    if (!user?.id) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })) : [],
      );
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  }

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.readAt).length;

  const filteredNotifications = safeNotifications.filter((n) => {
    if (filter === 'UNREAD') return !n.readAt;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Bell className="w-7 h-7 mr-2 text-teal-600" />
            Notificações do Sistema
            {unreadCount > 0 && (
              <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {unreadCount} não lida(s)
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Avisos de vencimento de mensalidades, inadimplência e alertas operacionais.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-teal-600" />
              <span>Marcar todas como lidas</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Atualizar lista de notificações"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({safeNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'UNREAD'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Não lidas ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
            <p className="text-xs font-medium">Carregando notificações...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-800">Tudo em dia!</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Nenhuma notificação {filter === 'UNREAD' ? 'não lida' : 'registrada'} no sistema.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.readAt;
            const isOverdue = notif.type === 'PAYMENT_OVERDUE';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  isUnread
                    ? isOverdue
                      ? 'border-rose-300 bg-rose-50/40 shadow-xs ring-1 ring-rose-200'
                      : 'border-teal-200 bg-teal-50/30 shadow-xs'
                    : 'border-slate-200 bg-white opacity-85'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <span
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-teal-600" />
                    )}
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>

                    <div className="flex items-center space-x-3 pt-1">
                      {isOverdue && (
                        <Link
                          to="/finance?status=OVERDUE"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline"
                        >
                          <span>Ver no Financeiro</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}

                      {notif.studentId && (
                        <Link
                          to={`/students`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          <span>Ver Aluno</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="shrink-0 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
