import { useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { addDays, todayISO } from '@/lib/date';
import { play } from '@/lib/sound';
import { LIMITS } from '@/lib/validation';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { FieldErrors, TaskList } from '@/types';

interface ListFormDialogProps {
  /** Present when editing. */
  list?: TaskList;
  onClose: () => void;
}

export function ListFormDialog({ list, onClose }: ListFormDialogProps) {
  const createList = useSheriffStore((s) => s.createList);
  const updateList = useSheriffStore((s) => s.updateList);
  const { toast, openList } = useUIStore.getState();

  const today = todayISO();
  const [name, setName] = useState(list?.name ?? '');
  const [description, setDescription] = useState(list?.description ?? '');
  const [startDate, setStartDate] = useState(list?.startDate ?? today);
  const [endDate, setEndDate] = useState(list?.endDate ?? addDays(today, 7));
  const [taskLimit, setTaskLimit] = useState(String(list?.taskLimit ?? 10));
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { name, description, startDate, endDate, taskLimit: Number(taskLimit) };
    const result = list ? updateList(list.id, input) : createList(input);
    if (!result.ok) {
      setErrors(result.errors);
      play('error');
      return;
    }
    play('confirm');
    toast(
      'ok',
      list ? `LIST UPDATED // ${result.value.name}` : `LIST DEPUTISED // ${result.value.name}`,
    );
    onClose();
    if (!list) openList(result.value.id);
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={list ? '> EDIT LIST' : '> NEW LIST'}
      description={
        list ? 'amend the orders for this list' : 'set the terms; the sheriff enforces them'
      }
    >
      <form className="form" onSubmit={submit} noValidate data-testid="list-form">
        <Field label="List name" error={errors.name}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="// e.g. Sprint 14 bounty"
            maxLength={LIMITS.listName}
            autoFocus
            name="name"
          />
        </Field>
        <Field label="Brief" hint="optional" error={errors.description}>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="// what this list is for"
            maxLength={LIMITS.description}
            name="description"
          />
        </Field>
        <div className="form__row">
          <Field label="Start date" error={errors.startDate}>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              name="startDate"
            />
          </Field>
          <Field label="End date" error={errors.endDate}>
            <input
              className="input"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              name="endDate"
            />
          </Field>
        </div>
        <Field
          label="Task limit"
          hint={`max tasks allowed in this list (${LIMITS.minTaskLimit}–${LIMITS.maxTaskLimit})`}
          error={errors.taskLimit}
        >
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={Math.max(LIMITS.minTaskLimit, list?.taskIds.length ?? 0)}
            max={LIMITS.maxTaskLimit}
            value={taskLimit}
            onChange={(e) => setTaskLimit(e.target.value)}
            name="taskLimit"
          />
        </Field>
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
            {list ? 'Save list' : 'Create list'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
