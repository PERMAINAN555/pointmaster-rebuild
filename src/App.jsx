import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Turnamen from './pages/Turnamen.jsx'
import TurnamenDetail from './pages/TurnamenDetail.jsx'
import WizardBR from './pages/WizardBR.jsx'
import Planner from './pages/Planner.jsx'
import GeneratorPot from './pages/GeneratorPot.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Bagan from './pages/Bagan.jsx'
import Overlay from './pages/Overlay.jsx'
import Portal from './pages/Portal.jsx'
import Login from './pages/Login.jsx'
import Panduan from './pages/Panduan.jsx'
import SuperAdmin from './pages/SuperAdmin.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/turnamen" element={<Turnamen />} />
        <Route path="/tournament/:id" element={<TurnamenDetail />} />
        <Route path="/wizard/:id" element={<WizardBR />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/generator-pot" element={<GeneratorPot />} />
        <Route path="/leaderboard/:id" element={<Leaderboard />} />
        <Route path="/bagan/:id" element={<Bagan />} />
        <Route path="/overlay/:id" element={<Overlay />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panduan" element={<Panduan />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<div className="p-8">404 — route gak ketemu</div>} />
      </Route>
    </Routes>
  )
}
