import { useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { planPhases, totalPlanMinutes } from '@/lib/focus';
import { play } from '@/lib/sound';
import { formatMinutes } from '@/lib/time';
import { LIMITS } from '@/lib/validation';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { FieldErrors, Priority, Task } from '@/types';
import { PhaseStrip } from '../focus/PhaseStrip';

const PRESETS = [25, 50, 75, 100, 120];
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Med' },
  { value: 'high', label: 'High' },
];

interface TaskFormDialogProps {
  listId: string;
  /** Present when editing. */
  task?: Task;
  onClose: () => void;
}

export function TaskFormDialog({ listId, task, onClose }: TaskFormDialogProps) {
  const addTask = useSheriffStore((s) => s.addTask);
  const updateTask = useSheriffStore((s) => s.updateTask);
  const toast = useUIStore((s) => s.toast);

  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'med');
  const [duration, setDuration] = useState(String(task?.durationMinutes ?? 50));
  const [errors, setErrors] = useState<FieldErrors>({});

  const minutes = Number(duration);
  const remaining = Math.max(0, minutes - (task?.focusedMinutes ?? 0));
  const phases = Number.isFinite(minutes) ? planPhases(remaining) : [];
  const focusRounds = phases.filter((p) => p.kind === 'focus').length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { title, notes, priority, durationMinutes: minutes };
    const result = task ? updateTask(task.id, input) : addTask(listId, input);
    if (!result.ok) {
      setErrors(result.errors);
      play('error');
      return;
    }
    play('confirm');
    toast('ok', task ? 'TASK UPDATED' : `TASK FILED // ${result.value.title}`);
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={task ? '> EDIT TASK' : '> NEW TASK'}
      description="duration is split into 25 min focus rounds with 5 min breaks"
      size="lg"
    >
      <form className="form" onSubmit={submit} noValidate data-testid="task-form">
        <Field label="Task" error={errors.title}>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="// what needs doing"
            maxLength={LIMITS.taskTitle}
            autoFocus
            name="title"
          />
        </Field>
        <Field label="Notes" hint="optional" error={errors.notes}>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={LIMITS.notes}
            name="notes"
          />
        </Field>

        <fieldset className="field">
          <legend className="field__label">Priority</legend>
          <div className="radio-group">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="radio">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                />
                <span className="radio__box" aria-hidden="true" />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Duration (minutes)"
          error={errors.durationMinutes}
          hint={
            task?.focusedMinutes
              ? `${formatMinutes(task.focusedMinutes)} already served`
              : `${LIMITS.minDuration}–${LIMITS.maxDuration} minutes`
          }
        >
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={LIMITS.minDuration}
            max={LIMITS.maxDuration}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            name="durationMinutes"
          />
        </Field>
        <div className="chips" role="group" aria-label="Duration presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip${minutes === p ? ' is-active' : ''}`}
              aria-pressed={minutes === p}
              onClick={() => setDuration(String(p))}
            >
              {formatMinutes(p)}
            </button>
          ))}
        </div>

        <div className="plan" aria-live="polite">
          <p className="field__label">Focus plan</p>
          {phases.length > 0 ? (
            <>
              <PhaseStrip phases={phases} />
              <p className="hint" data-testid="plan-summary">
                {`// ${focusRounds} focus round${focusRounds === 1 ? '' : 's'} · ${formatMinutes(
                  totalPlanMinutes(phases),
                )} on the clock incl. breaks`}
              </p>
            </>
          ) : (
            <p className="hint">// set a duration to see the plan</p>
          )}
        </div>

        {errors.form && (
          <p className="field__error" role="alert">
            [ERR] {errors.form}
          </p>
        )}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--solid">
            {task ? 'Save task' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
