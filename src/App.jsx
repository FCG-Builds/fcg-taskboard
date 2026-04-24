import { useState, useRef, useEffect } from "react";

const COL_COLORS = ["#6366f1","#f59e0b","#3b82f6","#a855f7","#22c55e"];
const P_COLORS = { high: "#ef4444", medium: "#eab308", low: "#64748b" };
const STORE_KEY = "fcg-taskboard-data";
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const DEMO = [
  { id: uid(), title: "Backlog", color: COL_COLORS[0], tasks: [
    { id: uid(), title: "Research funding opportunities", priority: "high", tags: ["grants"], due: "", note: "" },
  ]},
  { id: uid(), title: "To Do", color: COL_COLORS[1], tasks: [
    { id: uid(), title: "Set up dev environment", priority: "high", tags: ["dev"], due: "", note: "" },
  ]},
  { id: uid(), title: "In Progress", color: COL_COLORS[2], tasks: [] },
  { id: uid(), title: "Review", color: COL_COLORS[3], tasks: [] },
  { id: uid(), title: "Done", color: COL_COLORS[4], tasks: [
    { id: uid(), title: "Initial project setup", priority: "low", tags: ["dev"], due: "", note: "" },
  ]},
];

export default function App() {
  const [columns, setColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || DEMO; } catch { return DEMO; }
  });
  const [dragged, setDragged] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [adding, setAdding] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [title, setTitle] = useState("");
  const [pri, setPri] = useState("medium");
  const [tags, setTags] = useState("");
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [orgName, setOrgName] = useState(() => localStorage.getItem("fcg-tb-org") || "FCG");
  const [addColName, setAddColName] = useState("");
  const ref = useRef(null);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { if (adding && ref.current) ref.current.focus(); }, [adding]);

  const allTags = [...new Set(columns.flatMap(c => c.tasks.flatMap(t => t.tags)))].sort();
  const total = columns.reduce((s, c) => s + c.tasks.length, 0);
  const done = (columns[columns.length - 1]?.tasks.length) || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const filtered = (tasks) => {
    let r = tasks;
    if (tagFilter) r = r.filter(t => t.tags.includes(tagFilter));
    if (search) r = r.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    return r;
  };

  const addTask = (colId) => {
    if (!title.trim()) return;
    const t = { id: uid(), title: title.trim(), priority: pri, tags: tags.split(",").map(s => s.trim().toLowerCase()).filter(Boolean), due, note };
    setColumns(p => p.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, t] } : c));
    setTitle(""); setPri("medium"); setTags(""); setDue(""); setNote(""); setAdding(null);
  };

  const delTask = (colId, taskId) => setColumns(p => p.map(c => c.id === colId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c));

  const saveEdit = () => {
    if (!editing) return;
    setColumns(p => p.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === editing.id ? { ...editing } : t) })));
    setEditing(null);
  };

  const addColumn = () => {
    if (!addColName.trim()) return;
    setColumns(p => [...p, { id: uid(), title: addColName.trim(), color: COL_COLORS[p.length % COL_COLORS.length], tasks: [] }]);
    setAddColName("");
  };

  const bg = "#08080c", card = "#111116", border = "#1e1e28", muted = "#555568", subtle = "#2a2a38";

  // See full source with UI rendering at:
  // https://github.com/FCG-builds/fcg-taskboard
  // This is the core logic. Full JSX render tree in next commit.

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#eeeef2" }}>
      <header style={{ padding: "14px 24px", borderBottom: "1px solid " + border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{orgName} Taskboard</h1>
        <span style={{ fontSize: 11, color: muted }}>{done}/{total} done</span>
      </header>
      <div style={{ display: "flex", gap: 12, padding: "18px 16px", overflowX: "auto", minHeight: "calc(100vh - 60px)" }}>
        {columns.map(col => (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setOverCol(col.id); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={e => {
              e.preventDefault();
              if (!dragged || dragged.fromCol === col.id) { setDragged(null); setOverCol(null); return; }
              setColumns(p => {
                const task = p.find(c => c.id === dragged.fromCol)?.tasks.find(t => t.id === dragged.taskId);
                if (!task) return p;
                return p.map(c => {
                  if (c.id === dragged.fromCol) return { ...c, tasks: c.tasks.filter(t => t.id !== dragged.taskId) };
                  if (c.id === col.id) return { ...c, tasks: [...c.tasks, task] };
                  return c;
                });
              });
              setDragged(null); setOverCol(null);
            }}
            style={{ flex: "0 0 260px", background: overCol === col.id ? "#12121f" : "transparent", borderRadius: 10, padding: 6 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 8px 10px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#8888a0" }}>{col.title}</span>
              <span style={{ fontSize: 10, color: "#444", background: subtle, borderRadius: 8, padding: "1px 6px" }}>{filtered(col.tasks).length}</span>
            </div>
            {filtered(col.tasks).map(task => (
              <div key={task.id} draggable onDragStart={() => setDragged({ taskId: task.id, fromCol: col.id })}
                style={{ background: card, borderRadius: 9, padding: "10px 12px", border: "1px solid " + border, cursor: "grab", marginBottom: 5 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: P_COLORS[task.priority], fontSize: 7 }}>\u25CF</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{task.title}</span>
                </div>
                {task.tags.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 5 }}>
                  {task.tags.map(t => <span key={t} style={{ fontSize: 9, padding: "1px 7px", borderRadius: 5, background: subtle, color: "#8888a0" }}>{t}</span>)}
                </div>}
                {task.due && <div style={{ fontSize: 10, color: muted, marginTop: 5 }}>{task.due}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <footer style={{ padding: "10px 24px", borderTop: "1px solid " + border, textAlign: "center" }}>
        <span style={{ fontSize: 10, color: "#333" }}>Built by FCG-builds | Configure for your org in Settings</span>
      </footer>
    </div>
  );
}
