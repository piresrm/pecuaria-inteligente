import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MercadoClient } from './query/client';
import { QueryCoordinator } from './query/coordinator';
import { VerificationScheduler } from './query/scheduler';
import { BrowserPersistence } from './storage/persistence';
import './styles.css';
const client = new MercadoClient();
const persistence = new BrowserPersistence((aviso) => coordinator.avisarArmazenamento(aviso));
const coordinator = new QueryCoordinator(client, undefined, persistence);
const root = document.getElementById('root');
if (!root) throw new Error('Raiz da aplicação ausente');
const cycle = new VerificationScheduler({
  verify: async () => {
    await coordinator.verificar();
    return Object.keys(coordinator.state.erros).length === 0 && !coordinator.state.pendente;
  },
  lastVerification: () => coordinator.state.ultimaVerificacao,
  visible: () => document.visibilityState === 'visible',
  online: () => navigator.onLine,
  onAge: (stale) => coordinator.setStale(stale),
});
createRoot(root).render(<App coordinator={coordinator} verificar={() => cycle.trigger()} />);
void coordinator.iniciar().then(() => cycle.start());
const visibility = () => {
  void cycle.visibilityChanged();
};
const connection = () => {
  void cycle.connectionChanged();
};
document.addEventListener('visibilitychange', visibility);
window.addEventListener('online', connection);
window.addEventListener('offline', connection);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    cycle.dispose();
    coordinator.dispose();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('online', connection);
    window.removeEventListener('offline', connection);
  });
