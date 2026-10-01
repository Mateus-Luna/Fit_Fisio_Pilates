import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { notificationsService } from '../../services/notifications.service';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    async function checkUnread() {
      try {
        const notifs = await notificationsService.findAll(user?.id);
        const count = Array.isArray(notifs) ? notifs.filter((n) => !n.readAt).length : 0;
        setUnreadCount(count);
      } catch {
        // silent
      }
    }

    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const linkClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <aside className="navbar">
      <div className="navbar-logo">
        <div className="logo-icon">
          F
        </div>

        <div>
          <strong>FITFISIO</strong>
          <span>Gestão</span>
        </div>
      </div>

      <nav className="navbar-content">

        <div className="nav-section">
          <span className="nav-section-title">
            PRINCIPAL
          </span>

          <NavLink
            to="/"
            className={linkClass}
          >
            <span>🏠</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/students"
            className={linkClass}
          >
            <span>👥</span>
            Alunos
          </NavLink>

          <NavLink
            to="/enrollments"
            className={linkClass}
          >
            <span>📋</span>
            Matrículas
          </NavLink>

          <NavLink
            to="/families"
            className={linkClass}
          >
            <span>👨‍👩‍👧</span>
            Famílias
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">
            MODALIDADES
          </span>

          <NavLink
            to="/modalities"
            className={linkClass}
          >
            <span>⚙️</span>
            Gerenciar modalidades
          </NavLink>

          <div className="nav-submenu">
            <NavLink
              to="/modalities/academia"
              className={linkClass}
            >
              <span>🏋️</span>
              Academia
            </NavLink>

            <NavLink
              to="/modalities/hidroginastica"
              className={linkClass}
            >
              <span>🏊</span>
              Hidroginástica
            </NavLink>

            <NavLink
              to="/modalities/hidroterapia"
              className={linkClass}
            >
              <span>💧</span>
              Hidroterapia
            </NavLink>

            <NavLink
              to="/modalities/natacao-adulto"
              className={linkClass}
            >
              <span>🏊</span>
              Natação Adulto
            </NavLink>

            <NavLink
              to="/modalities/natacao-crianca"
              className={linkClass}
            >
              <span>🧒</span>
              Natação Criança
            </NavLink>

            <NavLink
              to="/modalities/pilates"
              className={linkClass}
            >
              <span>🧘</span>
              Pilates
            </NavLink>

            <NavLink
              to="/modalities/fisioterapia"
              className={linkClass}
            >
              <span>🩺</span>
              Fisioterapia
            </NavLink>
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">
            ORGANIZAÇÃO
          </span>

          <NavLink
            to="/classes"
            className={linkClass}
          >
            <span>📅</span>
            Turmas e horários
          </NavLink>

          <NavLink
            to="/attendance"
            className={linkClass}
          >
            <span>✓</span>
            Frequência
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">
            FINANCEIRO
          </span>

          <NavLink
            to="/finance"
            className={linkClass}
          >
            <span>💰</span>
            Financeiro
          </NavLink>

          <NavLink
            to="/payments"
            className={linkClass}
          >
            <span>💳</span>
            Pagamentos
          </NavLink>

          <NavLink
            to="/overdue"
            className={linkClass}
          >
            <span>⚠️</span>
            Inadimplentes
          </NavLink>

          <NavLink
            to="/receipts"
            className={linkClass}
          >
            <span>🧾</span>
            Recibos
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">
            DOCUMENTOS
          </span>

          <NavLink
            to="/documents"
            className={linkClass}
          >
            <span>📄</span>
            Documentos
          </NavLink>

          <NavLink
            to="/certificates"
            className={linkClass}
          >
            <span>📝</span>
            Atestados
          </NavLink>
        </div>

        <div className="nav-section">
          <NavLink
            to="/notifications"
            className={linkClass}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span>
              <span>Notificações</span>
            </div>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '9999px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/settings"
            className={linkClass}
          >
            <span>⚙️</span>
            Configurações
          </NavLink>
        </div>
      </nav>

      <div className="navbar-footer">
        <button
          className="logout-button"
          onClick={logout}
        >
          <span>↪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}