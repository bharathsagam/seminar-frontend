import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import VerifyCertificate from './pages/VerifyCertificate';
import SeminarList from './pages/seminars/SeminarList';
import SeminarDetails from './pages/seminars/SeminarDetails';
import SeminarForm from './pages/seminars/SeminarForm';
import MyRegistrations from './pages/student/MyRegistrations';
import MyCertificates from './pages/student/MyCertificates';
import CertificateView from './pages/student/CertificateView';
import MySeminars from './pages/organizer/MySeminars';
import Participants from './pages/organizer/Participants';
import Reports from './pages/organizer/Reports';
import MySessions from './pages/speaker/MySessions';
import Users from './pages/admin/Users';
import AllRegistrations from './pages/admin/AllRegistrations';

const MANAGERS = ['organizer', 'admin'];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/verify" element={<VerifyCertificate />} />
      <Route path="/verify/:number" element={<VerifyCertificate />} />
      <Route path="/certificates/:id/print" element={<ProtectedRoute><CertificateView standalone /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/seminars" element={<SeminarList />} />
        <Route path="/seminars/new" element={<ProtectedRoute roles={MANAGERS}><SeminarForm /></ProtectedRoute>} />
        <Route path="/seminars/:id" element={<SeminarDetails />} />
        <Route path="/seminars/:id/edit" element={<ProtectedRoute roles={MANAGERS}><SeminarForm /></ProtectedRoute>} />
        <Route path="/seminars/:id/participants" element={<ProtectedRoute roles={MANAGERS}><Participants /></ProtectedRoute>} />

        <Route path="/my-registrations" element={<ProtectedRoute roles={['student']}><MyRegistrations /></ProtectedRoute>} />
        <Route path="/my-certificates" element={<ProtectedRoute roles={['student']}><MyCertificates /></ProtectedRoute>} />
        <Route path="/certificates/:id" element={<CertificateView />} />

        <Route path="/organizer/seminars" element={<ProtectedRoute roles={['organizer']}><MySeminars /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={MANAGERS}><Reports /></ProtectedRoute>} />
        <Route path="/speaker/sessions" element={<ProtectedRoute roles={['speaker']}><MySessions /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="/admin/registrations" element={<ProtectedRoute roles={['admin']}><AllRegistrations /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
