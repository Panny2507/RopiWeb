'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { 
  Training, 
  ContactMessage, 
  User, 
  AuditLog, 
  TrainingType, 
  UserRole 
} from '@/types';
import { api } from '@/lib/api';
import { 
  ShieldCheck, 
  Calendar, 
  PlusCircle, 
  Mail, 
  Users, 
  History, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Check, 
  X, 
  Clock, 
  Loader2,
  FileText
} from 'lucide-react';

type AdminTab = 'trainings' | 'messages' | 'users' | 'audit';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('trainings');

  // Data states
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Training Form
  const [trainingTitle, setTrainingTitle] = useState('');
  const [trainingLocation, setTrainingLocation] = useState('BME Sportközpont - BME Terem');
  const [trainingDate, setTrainingDate] = useState('');
  const [trainingType, setTrainingType] = useState<TrainingType>('Gyakorlás');
  const [trainingMax, setTrainingMax] = useState<number>(14);
  const [trainingDesc, setTrainingDesc] = useState('');
  const [submittingTraining, setSubmittingTraining] = useState(false);

  // Editing Training state
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);

  // Message preview modal state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [tList, mList, uList, aList] = await Promise.all([
        api.trainings.getAll(),
        api.contact.getMessages(),
        api.users.getAll(),
        api.auditLogs.getAll(),
      ]);
      setTrainings(tList);
      setMessages(mList);
      setUsers(uList);
      setAuditLogs(aList);
    } catch (err: any) {
      setErrorMsg('Hiba történt az admin adatok betöltésekor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // --- TRAININGS HANDLERS ---
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingTitle.trim() || !trainingDate || !trainingMax) {
      notifyError('Minden kötelező mezőt tölts ki!');
      return;
    }

    // Specification EF-3: Validation for past dates
    const selectedDateTime = new Date(trainingDate).getTime();
    if (selectedDateTime < Date.now() - 3600000) {
      notifyError('Hiba: Nem hozható létre edzés múltbeli időponttal!');
      return;
    }

    setSubmittingTraining(true);
    try {
      if (editingTrainingId) {
        await api.trainings.update(editingTrainingId, {
          title: trainingTitle.trim(),
          location: trainingLocation,
          date: trainingDate,
          type: trainingType,
          maxParticipants: Number(trainingMax),
          description: trainingDesc.trim(),
        });
        api.auditLogs.addLog(
          'Edzés módosítása',
          user?.name || 'Admin',
          `Frissítve: ${trainingTitle}`
        );
        notifySuccess('Edzés sikeresen frissítve!');
        setEditingTrainingId(null);
      } else {
        await api.trainings.create({
          title: trainingTitle.trim(),
          location: trainingLocation,
          date: trainingDate,
          type: trainingType,
          maxParticipants: Number(trainingMax),
          description: trainingDesc.trim(),
        });
        api.auditLogs.addLog(
          'Edzés kiírása',
          user?.name || 'Admin',
          `Létrehozva: ${trainingTitle} (${trainingMax} fő)`
        );
        notifySuccess('Új edzés sikeresen meghirdetve!');
      }

      // Reset form
      setTrainingTitle('');
      setTrainingDate('');
      setTrainingDesc('');
      setTrainingMax(14);
      setTrainingType('Gyakorlás');

      const updated = await api.trainings.getAll();
      setTrainings(updated);
      const updatedLogs = await api.auditLogs.getAll();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      notifyError(err.message || 'Hiba történt az edzés mentése során.');
    } finally {
      setSubmittingTraining(false);
    }
  };

  const handleEditClick = (t: Training) => {
    setEditingTrainingId(t.id);
    setTrainingTitle(t.title);
    setTrainingLocation(t.location);
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const dt = new Date(t.date);
    const formatted = dt.toISOString().slice(0, 16);
    setTrainingDate(formatted);
    setTrainingType(t.type);
    setTrainingMax(t.maxParticipants);
    setTrainingDesc(t.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTrainingId(null);
    setTrainingTitle('');
    setTrainingDate('');
    setTrainingDesc('');
    setTrainingMax(14);
    setTrainingType('Gyakorlás');
  };

  const handleDeleteTraining = async (id: string, title: string) => {
    if (!confirm(`Biztosan törlöd a(z) "${title}" edzést?`)) return;

    try {
      await api.trainings.delete(id);
      api.auditLogs.addLog('Edzés törlése', user?.name || 'Admin', `Törölve: ${title}`);
      notifySuccess('Edzés sikeresen törölve.');
      const updated = await api.trainings.getAll();
      setTrainings(updated);
      const updatedLogs = await api.auditLogs.getAll();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      notifyError(err.message || 'Hiba történt az edzés törlésekor.');
    }
  };

  // --- MESSAGES HANDLERS ---
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.contact.markAsRead(id);
      const updated = await api.contact.getMessages();
      setMessages(updated);
      notifySuccess('Üzenet olvasottnak jelölve.');
    } catch {
      notifyError('Hiba az üzenet állapotának frissítésekor.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt az üzenetet?')) return;
    try {
      await api.contact.deleteMessage(id);
      const updated = await api.contact.getMessages();
      setMessages(updated);
      if (selectedMessage?.id === id) setSelectedMessage(null);
      notifySuccess('Üzenet törölve.');
    } catch {
      notifyError('Hiba az üzenet törlésekor.');
    }
  };

  // --- USERS HANDLERS ---
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.users.updateUser(userId, { role: newRole });
      api.auditLogs.addLog(
        'Szerepkör módosítás',
        user?.name || 'Admin',
        `User ID ${userId} új szerepköre: ${newRole}`
      );
      const updated = await api.users.getAll();
      setUsers(updated);
      notifySuccess('Felhasználó jogosultsága sikeresen frissítve.');
      const updatedLogs = await api.auditLogs.getAll();
      setAuditLogs(updatedLogs);
    } catch {
      notifyError('Hiba a jogosultság módosításakor.');
    }
  };

  const handleActiveToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await api.users.updateUser(userId, { isActiveMember: !currentStatus });
      api.auditLogs.addLog(
        'Tagsági státusz módosítás',
        user?.name || 'Admin',
        `User ID ${userId} aktív státusz: ${!currentStatus}`
      );
      const updated = await api.users.getAll();
      setUsers(updated);
      notifySuccess('Aktív tagsági státusz módosítva.');
      const updatedLogs = await api.auditLogs.getAll();
      setAuditLogs(updatedLogs);
    } catch {
      notifyError('Hiba a tagsági státusz módosításakor.');
    }
  };

  const handlePositionChange = async (userId: string, newPosition: string) => {
    try {
      await api.users.updateUser(userId, { position: newPosition });
      const updated = await api.users.getAll();
      setUsers(updated);
      notifySuccess('Pozíció sikeresen elmentve.');
    } catch {
      notifyError('Hiba a pozíció mentésekor.');
    }
  };

  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="py-10 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-5 h-5 text-vik-gold-500" />
                <span>Körvezetői Irányítópult</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Adminisztrációs Felület
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Kezeld az edzéseket, a beérkezett kapcsolatfelvételeket, a tagsági jogosultságokat és az audit naplót.
              </p>
            </div>
          </div>

          {/* Alert messages */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3 text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 flex items-center gap-3 text-sm shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('trainings')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'trainings'
                  ? 'bg-vik-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Edzések kezelése</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 ml-1">
                {trainings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
                activeTab === 'messages'
                  ? 'bg-vik-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Üzenetek</span>
              {unreadMessagesCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold ml-1">
                  {unreadMessagesCount} új
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'users'
                  ? 'bg-vik-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Felhasználók</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 ml-1">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'audit'
                  ? 'bg-vik-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log (Napló)</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Loader2 className="w-10 h-10 animate-spin text-vik-blue-700 mb-3" />
              <p className="font-medium text-sm">Adatok betöltése...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: EDZÉSEK KEZELÉSE */}
              {activeTab === 'trainings' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Create / Edit Form */}
                  <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {editingTrainingId ? (
                          <>
                            <Edit3 className="w-5 h-5 text-vik-gold-500" />
                            <span>Edzés szerkesztése</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-5 h-5 text-vik-blue-700" />
                            <span>Új edzés kiírása</span>
                          </>
                        )}
                      </h2>
                      {editingTrainingId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Mégse
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveTraining} className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Edzés megnevezése <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="pl. Pénteki Meccsezés"
                          value={trainingTitle}
                          onChange={(e) => setTrainingTitle(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Helyszín <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={trainingLocation}
                          onChange={(e) => setTrainingLocation(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white"
                        >
                          <option value="BME Sportközpont - BME Terem">BME Sportközpont - BME Terem</option>
                          <option value="Bercsényi tornaterem">Bercsényi tornaterem</option>
                          <option value="Kármán tornaterem">Kármán tornaterem</option>
                          <option value="Óbudai Egyetem Sportcsarnok">Óbudai Egyetem Sportcsarnok</option>
                          <option value="BME Strandröplabda pálya (Központi Kampusz)">BME Strandröplabda pálya</option>
                        </select>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Időpont (Kezdés) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={trainingDate}
                          onChange={(e) => setTrainingDate(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Type */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Típus <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={trainingType}
                            onChange={(e) => setTrainingType(e.target.value as TrainingType)}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm bg-white"
                          >
                            <option value="Gyakorlás">Gyakorlás</option>
                            <option value="Meccs">Meccs</option>
                            <option value="Szabad edzés">Szabad edzés</option>
                          </select>
                        </div>

                        {/* Max Participants */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Max létszám <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min={2}
                            max={40}
                            value={trainingMax}
                            onChange={(e) => setTrainingMax(parseInt(e.target.value) || 12)}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Leírás, instrukciók
                        </label>
                        <textarea
                          rows={3}
                          placeholder="pl. Kérjük hozz fekete és fehér pólót is!"
                          value={trainingDesc}
                          onChange={(e) => setTrainingDesc(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTraining}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-vik-blue-700 hover:bg-vik-blue-800 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {submittingTraining ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingTrainingId ? (
                          <>
                            <Edit3 className="w-4 h-4" />
                            <span>Módosítások mentése</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4" />
                            <span>Edzés meghirdetése</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Existing Trainings List */}
                  <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Meghirdetett edzések</span>
                      <span className="text-xs font-semibold text-slate-500">
                        Összesen: {trainings.length}
                      </span>
                    </h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {trainings.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {t.type}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              {t.location} • {new Date(t.date).toLocaleString('hu-HU')}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              Létszám: {t.participants.length} / {t.maxParticipants} fő
                              {t.waitlist.length > 0 && ` (+${t.waitlist.length} várólistán)`}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                              title="Szerkesztés"
                            >
                              <Edit3 className="w-4 h-4 text-vik-blue-700" />
                            </button>
                            <button
                              onClick={() => handleDeleteTraining(t.id, t.title)}
                              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-red-600 transition-colors"
                              title="Törlés"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ÜZENETEK */}
              {activeTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Beérkezett üzenetek ({messages.length})</span>
                      {unreadMessagesCount > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                          {unreadMessagesCount} olvasatlan
                        </span>
                      )}
                    </h2>

                    {messages.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-8 text-center">
                        Nincs beérkezett üzenet.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              selectedMessage?.id === m.id
                                ? 'border-vik-blue-500 bg-blue-50/50'
                                : m.isRead
                                ? 'border-slate-200 bg-slate-50/70'
                                : 'border-amber-300 bg-amber-50/40 shadow-sm'
                            }`}
                            onClick={() => setSelectedMessage(m)}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-sm text-slate-900">{m.name}</span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(m.createdAt).toLocaleDateString('hu-HU')}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-vik-blue-900 mb-1">
                              {m.subject}
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {m.message}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                              <span className="text-slate-400">{m.email}</span>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {!m.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(m.id)}
                                    className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium text-[11px]"
                                  >
                                    Olvasottnak jelölés
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(m.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Törlés"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Message Preview */}
                  <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg mb-4 pb-2 border-b border-slate-100">
                      Üzenet részletei
                    </h3>

                    {selectedMessage ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                          <div>
                            <span className="text-slate-500">Feladó:</span>{' '}
                            <strong className="text-slate-900">{selectedMessage.name}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">E-mail:</span>{' '}
                            <a
                              href={`mailto:${selectedMessage.email}`}
                              className="text-vik-blue-700 underline font-medium"
                            >
                              {selectedMessage.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-slate-500">Küldve:</span>{' '}
                            <span className="text-slate-700">
                              {new Date(selectedMessage.createdAt).toLocaleString('hu-HU')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Állapot:</span>{' '}
                            <span
                              className={`font-semibold ${
                                selectedMessage.isRead ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {selectedMessage.isRead ? 'Olvasott' : 'Olvasatlan'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Tárgy
                          </div>
                          <div className="text-base font-bold text-slate-900">
                            {selectedMessage.subject}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Üzenet
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {selectedMessage.message}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <a
                            href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                              selectedMessage.subject
                            )}`}
                            className="flex-1 py-2 px-4 rounded-lg bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-semibold text-xs text-center transition-colors"
                          >
                            Válasz írása e-mailben
                          </a>

                          {!selectedMessage.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(selectedMessage.id)}
                              className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                            >
                              Olvasottnak jelölés
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-slate-400">
                        <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Válassz ki egy üzenetet a megtekintéshez!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FELHASZNÁLÓK */}
              {activeTab === 'users' && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Felhasználók & Körtagok kezelése
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Állíts be szerepköröket (Admin, Körtag, Felhasználó), pozíciót, valamint PEK aktív körtagságot.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                          <th className="py-3 px-4">Név & E-mail</th>
                          <th className="py-3 px-4">Neptun</th>
                          <th className="py-3 px-4">Szerepkör</th>
                          <th className="py-3 px-4">Pozíció a körben</th>
                          <th className="py-3 px-4">PEK Aktív Tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                              {u.neptun || '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : u.role === 'MEMBER'
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="MEMBER">MEMBER (Körtag)</option>
                                <option value="USER">USER (Vendég)</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <input
                                type="text"
                                defaultValue={u.position || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== u.position) {
                                    handlePositionChange(u.id, e.target.value);
                                  }
                                }}
                                placeholder="Pozíció (pl. Elnök)"
                                className="px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-vik-blue-600 w-36"
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => handleActiveToggle(u.id, u.isActiveMember)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  u.isActiveMember
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                                }`}
                              >
                                {u.isActiveMember ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Aktív Körtag</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Inaktív</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT LOG */}
              {activeTab === 'audit' && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-vik-blue-700" />
                        <span>Rendszer Audit Napló</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        A rendszerben végzett kulcsfontosságú események és biztonsági ellenőrzések naplózása.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                          <th className="py-3 px-4">Időpont</th>
                          <th className="py-3 px-4">Művelet</th>
                          <th className="py-3 px-4">Végrehajtó</th>
                          <th className="py-3 px-4">Részletek</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                              {log.timestamp}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {log.action}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {log.performedBy}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {log.details || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
