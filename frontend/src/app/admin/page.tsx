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
  UserRole,
  CupScheduleInfo
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
  FileSpreadsheet,
  UploadCloud,
  Download
} from 'lucide-react';

type AdminTab = 'trainings' | 'messages' | 'users' | 'audit' | 'cup';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('trainings');

  // Data states
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [scheduleInfo, setScheduleInfo] = useState<CupScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Training Form - default 20 places as requested
  const [trainingTitle, setTrainingTitle] = useState('');
  const [trainingLocation, setTrainingLocation] = useState('BME Sportközpont');
  const [trainingDate, setTrainingDate] = useState('');
  const [trainingType, setTrainingType] = useState<TrainingType>('Gyakorlás');
  const [trainingMax, setTrainingMax] = useState<number>(20);
  const [trainingDesc, setTrainingDesc] = useState('');
  const [submittingTraining, setSubmittingTraining] = useState(false);

  // Editing Training state
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);

  // Message preview modal state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Drag and drop state for tournament schedule
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingSchedule, setUploadingSchedule] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [tList, mList, uList, aList, sched] = await Promise.all([
        api.trainings.getAll(),
        api.contact.getMessages(),
        api.users.getAll(),
        api.auditLogs.getAll(),
        api.cup.getSchedule(),
      ]);
      setTrainings(tList);
      setMessages(mList);
      setUsers(uList);
      setAuditLogs(aList);
      setScheduleInfo(sched);
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

      // Reset form to default 20
      setTrainingTitle('');
      setTrainingDate('');
      setTrainingDesc('');
      setTrainingMax(20);
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
    setTrainingMax(20);
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

  // --- SCHEDULE FILE DRAG & DROP HANDLERS ---
  const handleFileUpload = async (file: File) => {
    if (!/\.xlsx$/i.test(file.name)) {
      notifyError('A lebonyolítási fájl formátuma csak .xlsx lehet.');
      return;
    }

    setUploadingSchedule(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          // Extract base64 part
          const base64Data = result.split(',')[1] || result;
          const updated = await api.cup.uploadSchedule({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type || 'application/octet-stream',
          });
          setScheduleInfo(updated);
          api.auditLogs.addLog(
            'Kupa lebonyolítás táblázat feltöltve',
            user?.name || 'Admin',
            `Fájl: ${file.name}`
          );
          notifySuccess(`A(z) "${file.name}" táblázat sikeresen behúzva és feltöltve!`);
        } catch (err: any) {
          notifyError(err.message || 'Hiba történt a táblázat feltöltésekor.');
        } finally {
          setUploadingSchedule(false);
        }
      };
      reader.onerror = () => {
        notifyError('Hiba történt a fájl olvasásakor.');
        setUploadingSchedule(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      notifyError(err.message || 'Hiba a fájlfeltöltés előkészítésekor.');
      setUploadingSchedule(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!confirm('Biztosan törölni szeretnéd a kupa lebonyolítási táblázatot? Ekkor a látogatóknak az "Jelenleg nem elérhető a kupa lebonyolítása" felirat fog megjelenni.')) return;
    try {
      await api.cup.deleteSchedule();
      setScheduleInfo({ hasSchedule: false, fileName: null, updatedAt: null });
      api.auditLogs.addLog(
        'Kupa lebonyolítás táblázat törölve',
        user?.name || 'Admin',
        'Táblázat eltávolítva'
      );
      notifySuccess('A kupa lebonyolítási táblázat sikeresen törölve.');
    } catch {
      notifyError('Hiba a táblázat törlésekor.');
    }
  };

  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="py-10 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Vezetőségi Irányítópult as requested */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-700 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-5 h-5 text-vik-gold-500" />
                <span>Vezetőségi Irányítópult</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Adminisztrációs Felület
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Kezeld az edzéseket, a kupa lebonyolítási táblázatot, a beérkezett kapcsolatfelvételeket, a tagsági jogosultságokat és az audit naplót.
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
              onClick={() => setActiveTab('cup')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'cup'
                  ? 'bg-vik-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Kupa lebonyolítás táblázat</span>
              {scheduleInfo?.hasSchedule && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
                  Aktív
                </span>
              )}
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
                          placeholder="pl. BME Sportközpont Edzés"
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
                          <option value="BME Sportközpont">BME Sportközpont</option>
                          <option value="Óbudai Egyetem - Doberdó úti Kollégium tornaterem">Óbudai Egyetem - Doberdó úti Kollégium tornaterem</option>
                          <option value="Bercsényi Kollégium tornaterem">Bercsényi Kollégium tornaterem</option>
                          <option value="Kármán Tódor Kollégium tornaterem">Kármán Tódor Kollégium tornaterem</option>
                          <option value="BME Sporttelep - Strandröplabda pálya">BME Sporttelep - Strandröplabda pálya</option>
                        </select>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Dátum és Időpont <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={trainingDate}
                          onChange={(e) => setTrainingDate(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                      </div>

                      {/* Capacity - Default 20 as requested */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Maximális Létszám (fő) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          value={trainingMax}
                          onChange={(e) => setTrainingMax(parseInt(e.target.value, 10) || 20)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Alapértelmezett: 20 hely</span>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Leírás (opcionális)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="pl. Technikai gyakorlatok, játék..."
                          value={trainingDesc}
                          onChange={(e) => setTrainingDesc(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-vik-blue-600 text-sm"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={submittingTraining}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-vik-blue-700 hover:bg-vik-blue-800 disabled:opacity-50 shadow transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          {submittingTraining ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Mentés folyamatban...</span>
                            </>
                          ) : (
                            <span>{editingTrainingId ? 'Edzés frissítése' : 'Edzés meghirdetése'}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Trainings List */}
                  <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <h2 className="text-lg font-bold text-slate-900">
                        Meghirdetett edzések ({trainings.length})
                      </h2>
                    </div>

                    {trainings.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-8 text-center">
                        Még nincsenek meghirdetett edzések a rendszerben.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {trainings.map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {t.title}
                              </h3>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                                <span>{t.location}</span>
                                <span>•</span>
                                <span>{new Date(t.date).toLocaleDateString('hu-HU')}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">
                                  {t.participants.length}/{t.maxParticipants} fő
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="p-2 text-slate-600 hover:text-vik-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Szerkesztés"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTraining(t.id, t.title)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Törlés"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: KUPA LEBONYOLÍTÁS TÁBLÁZAT KEZELÉSE */}
              {activeTab === 'cup' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-6 h-6 text-vik-blue-700" />
                          <span>Kupa lebonyolítás táblázat feltöltése és kezelése</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Húzz be egy .xlsx formátumú lebonyolítási fájlt, amelyet a látogatók a Röpikupa oldalon közvetlenül letölthetnek és megtekinthetnek.
                        </p>
                      </div>
                    </div>

                    {/* Current Schedule Status */}
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Jelenlegi státusz a Röpikupa oldalon
                      </h3>

                      {scheduleInfo?.hasSchedule ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                <span>{scheduleInfo.fileName}</span>
                                <span className="text-[10px] uppercase font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                                  Aktív
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                A Röpikupa oldalon megjelenik a "Lebonyolítás táblázat ITT" gomb.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => api.cup.downloadSchedule()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span>Teszt letöltés</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteSchedule}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Táblázat törlése</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-sm">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold">Nincs behúzva táblázat fájl.</span>
                            <span className="block text-xs text-amber-800 mt-0.5">
                              A Röpikupa oldalon a "Jelenleg nem elérhető a kupa lebonyolítása" felirat látható a látogatóknak.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Drag and Drop Zone */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Új táblázat behúzása / feltöltése
                      </h3>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                          isDragging
                            ? 'border-vik-blue-600 bg-blue-50/70 scale-[1.01]'
                            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-vik-blue-400'
                        }`}
                      >
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-100 text-vik-blue-700 flex items-center justify-center">
                          {uploadingSchedule ? (
                            <Loader2 className="w-7 h-7 animate-spin" />
                          ) : (
                            <UploadCloud className="w-7 h-7" />
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-base mb-1">
                          Húzd ide a lebonyolítási táblázatot (.xlsx)
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-md mx-auto">
                          Behúzás után azonnal mentésre kerül és elérhetővé válik a nevezők számára.
                        </p>

                        <div>
                          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vik-blue-700 hover:bg-vik-blue-800 text-white font-bold text-sm cursor-pointer shadow-md transition-all">
                            <span>Fájl kiválasztása a gépről</span>
                            <input
                              type="file"
                              accept=".xlsx"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleFileUpload(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ÜZENETEK */}
              {activeTab === 'messages' && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                      Beérkezett megkeresések ({messages.length})
                    </h2>
                  </div>

                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-8 text-center">
                      Még nem érkezett kapcsolatfelvételi üzenet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`py-4 px-3 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            m.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                              <span className="text-xs text-slate-400">({m.email})</span>
                              {!m.isRead && (
                                <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                  Új
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm mt-0.5">{m.subject}</h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{m.message}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!m.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(m.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                Olvasottnak jelöl
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMessage(m)}
                              className="p-2 text-slate-600 hover:text-vik-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Megtekintés"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Törlés"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FELHASZNÁLÓK */}
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

              {/* TAB 5: AUDIT LOG */}
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

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Üzenet részletei</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Feladó:</span>
                <p className="font-semibold text-slate-900">{selectedMessage.name} ({selectedMessage.email})</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Tárgy:</span>
                <p className="font-semibold text-slate-900">{selectedMessage.subject}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Üzenet:</span>
                <p className="text-slate-700 whitespace-pre-wrap mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-vik-blue-700 text-white text-xs font-bold rounded-lg hover:bg-vik-blue-800 transition-colors"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
