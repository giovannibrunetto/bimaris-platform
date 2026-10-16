type ChartItem = { label: string; value: number };

export default function AdminBarChart({ title, items, valueLabel = "" }: { title: string; items: ChartItem[]; valueLabel?: string }) {
  const max = Math.max(1, ...items.map(item => item.value));
  return (
    <div className="detail-panel" style={{ padding: 22 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {items.length > 0 ? (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map(item => (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "minmax(100px, 170px) 1fr 56px", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, overflowWrap: "anywhere" }}>{item.label}</span>
              <div style={{ height: 12, borderRadius: 99, background: "#e6e8e7", overflow: "hidden" }}>
                <div style={{ width: `${item.value === 0 ? 0 : Math.max(3, (item.value / max) * 100)}%`, height: "100%", borderRadius: 99, background: "#caa86a" }} />
              </div>
              <strong style={{ fontSize: 13, textAlign: "right" }}>{item.value}{valueLabel}</strong>
            </div>
          ))}
        </div>
      ) : <p className="muted">Nessun dato disponibile.</p>}
    </div>
  );
}
