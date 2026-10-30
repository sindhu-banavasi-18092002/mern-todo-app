import { useEffect, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];
const CATEGORIES = ["personal", "work", "study", "shopping", "health", "other"];

export default function TaskRow({ task, onToggle, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(task), [task]);

  const overdue =
    !task.completed && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());

  async function save(event) {
    event.preventDefault();
    if (!draft.title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(task._id, {
        title: draft.title.trim(),
        notes: draft.notes || "",
        priority: draft.priority,
        category: draft.category,
        dueDate: draft.dueDate ? draft.dueDate.slice(0, 10) : null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form className="task-row editing" onSubmit={save}>
        <div className="edit-grid">
          <input
            aria-label="Task title"
            value={draft.title}
            maxLength={200}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            aria-label="Notes"
            rows={2}
            maxLength={1000}
            placeholder="Notes (optional)"
            value={draft.notes || ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
          <div className="edit-inline">
            <select
              aria-label="Priority"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
            <select
              aria-label="Category"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              aria-label="Due date"
              type="date"
              value={draft.dueDate ? draft.dueDate.slice(0, 10) : ""}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </div>
          <div className="edit-inline">
            <button className="solid-button small" type="submit" disabled={saving || !draft.title.trim()}>
              <Save size={15} /> {saving ? "Saving…" : "Save"}
            </button>
            <button className="ghost-button" type="button" onClick={() => { setEditing(false); setDraft(task); }}>
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <article className={`task-row ${task.completed ? "is-complete" : ""}`}>
      <button
        className="check-button"
        onClick={() => onToggle(task)}
        aria-label={task.completed ? `Mark ${task.title} as not completed` : `Complete ${task.title}`}
        type="button"
      >
        {task.completed && <span className="check-mark">✓</span>}
      </button>

      <div className="task-copy">
        <span className="task-title">{task.title}</span>
        {task.notes && <span className="task-notes">{task.notes}</span>}
        <div className="task-meta">
          <span className={`pill priority-${task.priority}`}>{task.priority}</span>
          <span className="pill category">{task.category}</span>
          {task.dueDate && (
            <span className={`pill due ${overdue ? "overdue" : ""}`}>
              {overdue ? "Overdue · " : "Due "}
              {new Date(task.dueDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          <span className="task-date">
            {task.completed ? "Completed" : "On your list"} ·{" "}
            {new Date(task.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      <div className="row-actions">
        <button className="icon-button" onClick={() => setEditing(true)} aria-label={`Edit ${task.title}`} type="button">
          <Pencil size={16} />
        </button>
        <button
          className="icon-button danger"
          onClick={() => onDelete(task._id)}
          aria-label={`Delete ${task.title}`}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
