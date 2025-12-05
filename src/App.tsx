import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import PlayerLayout from './components/player/PlayerLayout';
import AchievementsList from './components/admin/AchievementsList';
import AchievementForm from './components/admin/AchievementForm';
import ManagementTabs from './components/admin/ManagementTabs';
import TransactionLogs from './components/admin/TransactionLogs';
import AchievementsLobby from './components/player/AchievementsLobby';
import AchievementDetail from './components/player/AchievementDetail';
import PlayerWallet from './components/player/PlayerWallet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/player" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="achievements" replace />} />
          <Route path="achievements" element={<AchievementsList />} />
          <Route path="achievements/new" element={<AchievementForm />} />
          <Route path="achievements/edit/:id" element={<AchievementForm />} />
          <Route path="management" element={<ManagementTabs />} />
          <Route path="logs" element={<TransactionLogs />} />
        </Route>
        <Route path="/player" element={<PlayerLayout />}>
          <Route index element={<AchievementsLobby />} />
          <Route path="achievement/:id" element={<AchievementDetail />} />
          <Route path="wallet" element={<PlayerWallet />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

