import { useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];
const CATEGORIES = ["personal", "work", "study", "shopping", "health", "other"];

/** Add-task form + search + filters. */
export default function TaskToolbar({
  filters,
  onFilterChange,
  onAdd,
  onClearCompleted,
  completedCount,
  busy,
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [dueDate, setDueDate] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");

  async function submit(event) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean || busy) return;
    await onAdd({
      title: clean,
      notes: notes.trim(),
      priority,
      category,
      dueDate: dueDate || null,
    });
    setTitle("");
    setNotes("");
    setDueDate("");
    setPriority("medium");
    setCategory("personal");
  }

  function submitSearch(event) {
    event.preventDefault();
    onFilterChange({ search });
  }

  return (
    <>
      <form className="add-form" onSubmit={submit}>
        <div className="add-row">
          <input
            aria-label="New task"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to get done?"
            maxLength={200}
          />
          <button className="solid-button" type="submit" disabled={!title.trim() || busy}>
            <Plus size={17} /> {busy ? "Adding…" : "Add task"}
          </button>
        </div>

        <button
          className="details-toggle"
          type="button"
          onClick={() => setShowDetails((open) => !open)}
        >
          <Sparkles size={13} /> {showDetails ? "Hide details" : "Add details (priority, due date, notes)"}
        </button>

        {showDetails && (
          <div className="details-grid">
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label className="wide">
              Notes
              <textarea
                rows={2}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember"
              />
            </label>
          </div>
        )}
      </form>

      <div className="toolbar-row">
        <div className="filters" role="group" aria-label="Filter tasks">
          {["all", "active", "completed"].map((name) => (
            <button
              key={name}
              className={`filter-button ${filters.filter === name ? "selected" : ""}`}
              onClick={() => onFilterChange({ filter: name })}
              type="button"
            >
              {name === "all" ? "All" : name === "active" ? "To do" : "Completed"}
            </button>
          ))}
        </div>

        <form className="search-form" onSubmit={submitSearch}>
          <Search size={15} />
          <input
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFilterChange({ search: e.target.value });
            }}
          />
        </form>

        <select
          className="sort-select"
          aria-label="Sort tasks"
          value={filters.sort}
          onChange={(e) => onFilterChange({ sort: e.target.value })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="dueDate">By due date</option>
          <option value="priority">By priority</option>
        </select>

        <select
          className="sort-select"
          aria-label="Filter by priority"
          value={filters.priority || ""}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {completedCount > 0 && (
          <button className="ghost-button danger-text" type="button" onClick={onClearCompleted}>
            Clear completed ({completedCount})
          </button>
        )}
      </div>
    </>
  );
}
