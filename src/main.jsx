import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './styles.css';
import './styles/sheets.css';
import './styles/credit.css';
import './design-system/tokens.css';
import './design-system/components.css';
import './styles/sidebar-collapse.css'
import './styles/fuel-card.css'
import './styles/auth-responsive.css';

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
