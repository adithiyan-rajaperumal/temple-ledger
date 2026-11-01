import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flag,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  UserPlus,
  Edit2,
  X,
  Check
} from 'lucide-react';
import {
  getPublicDrives,
  createAdminDrive,
  initializeDriveAllocations,
  updateDriveAllocation,
  getDriveFamilyProgress,
  getAdminFamilies,
  createAdminFamily
} from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function DriveConfiguration() {
  const { t } = useTranslation();

  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Create Drive Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [newDriveCode, setNewDriveCode] = useState('');
  const [newDriveName, setNewDriveName] = useState('');
  const [newDriveNameTa, setNewDriveNameTa] = useState('');
  const [newDriveTarget, setNewDriveTarget] = useState('10000');
  const [newDriveStartDate, setNewDriveStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newDriveDescription, setNewDriveDescription] = useState('');

  // Add Family Modal
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [newFamilyCode, setNewFamilyCode] = useState('');
  const [newFamilyHeadName, setNewFamilyHeadName] = useState('');
  const [newFamilyHeadNameTa, setNewFamilyHeadNameTa] = useState('');
  const [newFamilyDoorNo, setNewFamilyDoorNo] = useState('');
  const [newFamilyStreet, setNewFamilyStreet] = useState('');
  const [newFamilyVillage, setNewFamilyVillage] = useState('Main Village');
  const [newFamilyPhone, setNewFamilyPhone] = useState('');

  // Edit Allocation Modal / State
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editStatus, setEditStatus] = useState('PARTICIPATING');
  const [editNotes, setEditNotes] = useState('');

  // Load drives
  const loadDrives = async () => {
    try {
      const data = await getPublicDrives();
      if (Array.isArray(data)) {
        setDrives(data);
        if (data.length > 0 && !selectedDriveId) {
          setSelectedDriveId(data[0].id || data[0].driveId);
        }
      }
    } catch (err) {
      console.error('Failed to load drives', err);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  // Load allocations for selected drive
  const loadAllocations = async (driveId) => {
    if (!driveId) return;
    setLoading(true);
    try {
      const progress = await getDriveFamilyProgress(driveId);
      if (progress && progress.families) {
        setAllocations(progress.families);
      } else {
        setAllocations([]);
      }
    } catch (err) {
      console.error('Failed to load drive allocations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriveId) {
      loadAllocations(selectedDriveId);
    }
  }, [selectedDriveId]);

  // Handle Create Drive
  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      await createAdminDrive({
        code: newDriveCode.trim().toUpperCase(),
        name: newDriveName.trim(),
        nameTa: newDriveNameTa.trim() || undefined,
        defaultTargetPerFamily: parseFloat(newDriveTarget),
        startDate: newDriveStartDate,
        description: newDriveDescription.trim() || undefined,
      });

      setSuccessMessage('New Drive created successfully!');
      setShowDriveModal(false);
      setNewDriveCode('');
      setNewDriveName('');
      setNewDriveNameTa('');
      await loadDrives();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create drive');
    }
  };

  // Handle Initialize Allocations
  const handleInitializeAllocations = async () => {
    if (!selectedDriveId) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await initializeDriveAllocations(selectedDriveId);
      setSuccessMessage('Allocations successfully populated from Master Family Directory!');
      await loadAllocations(selectedDriveId);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize drive allocations');
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Family
  const handleAddFamily = async (e) => {
    e.preventDefault();
    try {
      await createAdminFamily({
        familyCode: newFamilyCode.trim().toUpperCase(),
        headName: newFamilyHeadName.trim(),
        headNameTa: newFamilyHeadNameTa.trim() || undefined,
        doorNo: newFamilyDoorNo.trim() || undefined,
        street: newFamilyStreet.trim() || undefined,
        village: newFamilyVillage.trim() || 'Main Village',
        phone: newFamilyPhone.trim() || undefined,
        isActive: true,
      });

      setSuccessMessage('New family added to Master Directory!');
      setShowFamilyModal(false);
      setNewFamilyCode('');
      setNewFamilyHeadName('');
      setNewFamilyHeadNameTa('');
      // Refresh current drive allocations if needed
      if (selectedDriveId) await loadAllocations(selectedDriveId);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add family');
    }
  };

  // Open Edit Allocation modal
  const openEditAlloc = (alloc) => {
    setEditingAlloc(alloc);
    setEditTargetAmount(alloc.targetAmount || 0);
    setEditStatus(alloc.status || 'PARTICIPATING');
    setEditNotes(alloc.notes || '');
  };

  // Save Allocation update
  const handleSaveAlloc = async (e) => {
    e.preventDefault();
    if (!editingAlloc) return;

    try {
      const familyId = editingAlloc.familyId || editingAlloc.id;
      await updateDriveAllocation(selectedDriveId, familyId, {
        targetAmount: parseFloat(editTargetAmount),
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });

      setSuccessMessage(`Allocation updated for ${editingAlloc.headName}!`);
      setEditingAlloc(null);
      await loadAllocations(selectedDriveId);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update allocation');
    }
  };

  const filteredAllocations = allocations.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.familyCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.headName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.headNameTa && item.headNameTa.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedDrive = drives.find(
    (d) => (d.id || d.driveId) === selectedDriveId
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flag className="w-6 h-6 text-amber-600" />
            <span>{t('admin.driveConfigTitle', 'Drive Configuration & Family Allocations')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              'admin.driveConfigSubtitle',
              'Create drives, initialize allocations from directory, manage exemptions and custom target overrides.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDriveModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{t('drive.createNewDrive', 'Create Drive')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFamilyModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>{t('drive.addFamily', 'Add Family')}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs font-bold text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-900 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-bold text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Drive Selector & Initialization Bar */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {t('drive.activeDrive', 'Select Drive')}:
          </label>
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
          >
            {drives.map((d) => (
              <option key={d.id || d.driveId} value={d.id || d.driveId}>
                {d.code} - {d.name} {d.nameTa ? `(${d.nameTa})` : ''} [Default: ₹
                {Number(d.defaultTargetPerFamily || d.targetAmount || 0).toLocaleString('en-IN')}]
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleInitializeAllocations}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('drive.initializeAllocations', 'Populate from Master Family List')}</span>
        </button>
      </div>

      {/* Allocation Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={t('drive.searchFamily', 'Search family code or name...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="ALL">All Commitments</option>
            <option value="PARTICIPATING">PARTICIPATING</option>
            <option value="OPTED_OUT">OPTED OUT</option>
            <option value="EXEMPTED">EXEMPTED</option>
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Family Code</th>
              <th className="px-4 py-3">Head Name</th>
              <th className="px-4 py-3">Village / Street</th>
              <th className="px-4 py-3 text-right">Target Amount</th>
              <th className="px-4 py-3 text-right">Paid to Date</th>
              <th className="px-4 py-3 text-right">Pending Balance</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAllocations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {loading
                    ? 'Loading allocations...'
                    : 'No family allocations recorded yet. Click "Populate from Master Family List" above.'}
                </td>
              </tr>
            ) : (
              filteredAllocations.map((alloc) => {
                const target = Number(alloc.targetAmount || 0);
                const paid = Number(alloc.paidAmount || 0);
                const due = Math.max(0, target - paid);

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Participating
                  </span>
                );
                if (alloc.status === 'OPTED_OUT') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      Opted Out
                    </span>
                  );
                } else if (alloc.status === 'EXEMPTED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                      Exempted
                    </span>
                  );
                }

                return (
                  <tr key={alloc.familyId || alloc.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {alloc.familyCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{alloc.headName}</div>
                      {alloc.headNameTa && (
                        <div className="text-[11px] text-slate-500 font-tamil">
                          {alloc.headNameTa}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {alloc.street ? `${alloc.street}, ` : ''}
                      {alloc.village || 'Main Village'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(target)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatCurrency(paid)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700">
                      {formatCurrency(due)}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openEditAlloc(alloc)}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Allocation Modal */}
      {editingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update Allocation: {editingAlloc.headName} ({editingAlloc.familyCode})
              </h3>
              <button
                type="button"
                onClick={() => setEditingAlloc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlloc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commitment Status:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => {
                    setEditStatus(e.target.value);
                    if (e.target.value === 'OPTED_OUT' || e.target.value === 'EXEMPTED') {
                      setEditTargetAmount('0');
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value="PARTICIPATING">PARTICIPATING (பங்கேற்கிறார்)</option>
                  <option value="OPTED_OUT">OPTED_OUT (விலகியுள்ளார் - ₹0)</option>
                  <option value="EXEMPTED">EXEMPTED (விலக்கு அளிக்கப்பட்டது - ₹0)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Amount Override (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Reason / Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Voluntarily increased target to ₹15,000"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAlloc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Drive Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Create New Community Drive
              </h3>
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Drive Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DRIVE-2"
                    value={newDriveCode}
                    onChange={(e) => setNewDriveCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Target / Family (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="20000"
                    value={newDriveTarget}
                    onChange={(e) => setNewDriveTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drive Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Second Stage Sanctum Renovation"
                  value={newDriveName}
                  onChange={(e) => setNewDriveName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  பெயர் (தமிழ்)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா. இரண்டாம் கட்ட திருப்பணி நிதி"
                  value={newDriveNameTa}
                  onChange={(e) => setNewDriveNameTa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-tamil"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDriveStartDate}
                    onChange={(e) => setNewDriveStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks..."
                    value={newDriveDescription}
                    onChange={(e) => setNewDriveDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                >
                  Create Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Family to Directory Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Family to Master Directory
              </h3>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFamily} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Family Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAM-061"
                    value={newFamilyCode}
                    onChange={(e) => setNewFamilyCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newFamilyPhone}
                    onChange={(e) => setNewFamilyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Sundaram"
                  value={newFamilyHeadName}
                  onChange={(e) => setNewFamilyHeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  குடும்பத் தலைவர் பெயர் (தமிழ்)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா. கு. சுந்தரம்"
                  value={newFamilyHeadNameTa}
                  onChange={(e) => setNewFamilyHeadNameTa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-tamil"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Door No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12/4"
                    value={newFamilyDoorNo}
                    onChange={(e) => setNewFamilyDoorNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    placeholder="West Street"
                    value={newFamilyStreet}
                    onChange={(e) => setNewFamilyStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Village
                  </label>
                  <input
                    type="text"
                    placeholder="Main Village"
                    value={newFamilyVillage}
                    onChange={(e) => setNewFamilyVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                >
                  Add Family
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
