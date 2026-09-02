import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Olá, {user?.name}! 👋</h1>

          <p>
            Aqui está um resumo do seu FitFisio.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span>👥</span>

          <div>
            <p>Alunos</p>
            <strong>0</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <span>💰</span>

          <div>
            <p>Recebido este mês</p>
            <strong>R$ 0,00</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <span>⚠️</span>

          <div>
            <p>Inadimplentes</p>
            <strong>0</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <span>📅</span>

          <div>
            <p>Turmas hoje</p>
            <strong>0</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Notificações</h2>

        <div className="empty-state">
          <span>🔔</span>

          <p>
            Nenhuma notificação no momento.
          </p>
        </div>
      </div>
    </div>
  );
}