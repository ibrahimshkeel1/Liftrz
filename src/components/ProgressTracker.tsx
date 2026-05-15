import { useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, TrendingDown, TrendingUp, X, Scale, Calendar } from 'lucide-react';
import { useToast } from './ToastProvider';

interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  notes: string;
  photoUrl?: string;
}

interface ProgressTrackerProps {
  entries: ProgressEntry[];
  onAddEntry: (entry: Omit<ProgressEntry, 'id'>) => void;
  readOnly?: boolean;
}

export default function ProgressTracker({ entries, onAddEntry, readOnly = false }: ProgressTrackerProps) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight: '', notes: '', date: new Date().toISOString().split('T')[0] });

  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const first = sorted[sorted.length - 1];
  const diff = latest && first ? latest.weight - first.weight : 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const weight = Number(form.weight);
    if (!weight || weight < 20 || weight > 300) {
      toast.addToast('Please enter a valid weight between 20-300 kg', 'error');
      return;
    }
    onAddEntry({ date: form.date, weight, notes: form.notes });
    setForm({ weight: '', notes: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
    toast.addToast('Progress entry added', 'success');
  };

  return (
    <div className="space-y-6">
      {latest && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700/50 bg-surface p-4">
            <p className="text-xs text-slate-500">Current Weight</p>
            <p className="mt-1 text-2xl font-bold text-white">{latest.weight} kg</p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-surface p-4">
            <p className="text-xs text-slate-500">Total Change</p>
            <div className={`mt-1 flex items-center gap-1 text-2xl font-bold ${diff < 0 ? 'text-success' : diff > 0 ? 'text-red-400' : 'text-white'}`}>
              {diff < 0 ? <TrendingDown className="h-5 w-5" /> : diff > 0 ? <TrendingUp className="h-5 w-5" /> : null}
              {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-surface p-4">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="mt-1 text-2xl font-bold text-white">{entries.length}</p>
          </div>
        </div>
      )}

      {!readOnly && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Scale className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add weight entry'}
        </button>
      )}

      {showForm && !readOnly && (
        <form onSubmit={submit} className="rounded-xl border border-slate-700/50 bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-500">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-500">Weight (kg)</span>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="75.5"
                className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </label>
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-xs font-medium text-slate-500">Notes (optional)</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Feeling stronger this week..."
              className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </label>
          <button type="submit" className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark">
            Save Entry
          </button>
        </form>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">History</h4>
          {sorted.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-surface-high/50 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-white">{entry.weight} kg</p>
                  <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
              {entry.notes && <p className="max-w-xs text-xs text-slate-400">{entry.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
