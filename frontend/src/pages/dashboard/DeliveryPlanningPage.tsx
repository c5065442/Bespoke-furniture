import { useEffect, useState } from "react";
import {
  type DeliveryRun,
  type RegionSuggestion,
  downloadRunExport,
  getDeliveryRun,
  getDeliveryRunSuggestions,
  listDeliveryRuns,
  lockDeliveryRun,
  planDeliveryRuns,
  reorderStops,
} from "../../api/delivery";
import { getManufacturingListForRun, type ManufacturingList } from "../../api/manufacturing";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DeliveryPlanningPage() {
  const [runDate, setRunDate] = useState(todayIso());
  const [runs, setRuns] = useState<DeliveryRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<DeliveryRun | null>(null);
  const [manufacturingList, setManufacturingList] = useState<ManufacturingList | null>(null);
  const [suggestions, setSuggestions] = useState<RegionSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);

  function reloadRuns() {
    listDeliveryRuns({ run_date: runDate })
      .then(setRuns)
      .catch(() => setError("Could not load delivery runs."));
  }

  useEffect(reloadRuns, [runDate]);

  useEffect(() => {
    getDeliveryRunSuggestions().then(setSuggestions).catch(() => undefined);
  }, []);

  async function handlePlan() {
    setPlanning(true);
    setError(null);
    try {
      const created = await planDeliveryRuns(runDate);
      if (created.length === 0) {
        setError("No van-ready orders were available to plan for this date.");
      }
      reloadRuns();
    } catch {
      setError("Could not plan delivery runs. Check that vans and van-ready orders exist.");
    } finally {
      setPlanning(false);
    }
  }

  async function openRun(id: number) {
    const run = await getDeliveryRun(id);
    setSelectedRun(run);
    setManufacturingList(run.status === "LOCKED" ? await getManufacturingListForRun(id) : null);
  }

  async function moveStop(stopId: number, direction: -1 | 1) {
    if (!selectedRun) return;
    const stops = [...selectedRun.stops].sort((a, b) => a.sequence - b.sequence);
    const index = stops.findIndex((s) => s.id === stopId);
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;
    [stops[index], stops[target]] = [stops[target], stops[index]];
    const payload = stops.map((s, i) => ({ stop_id: s.id, sequence: i + 1 }));
    const updated = await reorderStops(selectedRun.id, payload);
    setSelectedRun(updated);
    reloadRuns();
  }

  async function handleLock() {
    if (!selectedRun) return;
    try {
      const updated = await lockDeliveryRun(selectedRun.id);
      setSelectedRun(updated);
      setManufacturingList(await getManufacturingListForRun(updated.id));
      reloadRuns();
    } catch {
      setError("Could not lock this run.");
    }
  }

  async function handleExport(format: "csv" | "pdf") {
    if (!selectedRun) return;
    try {
      await downloadRunExport(selectedRun.id, format);
    } catch {
      setError(`Could not download the ${format.toUpperCase()} export.`);
    }
  }

  return (
    <div className="delivery-planning">
      <h2>Delivery Planning</h2>
      <div className="planning-controls">
        <label>
          Run date
          <input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
        </label>
        <button onClick={handlePlan} disabled={planning}>
          {planning ? "Planning…" : "Plan runs for this date"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {suggestions.length > 0 && (
        <div className="suggestions-widget">
          <h3>Suggested runs</h3>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Pending orders</th>
                <th>Oldest (days)</th>
                <th>Suggestion</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.region} className={s.suggested_action === "SCHEDULE_NOW" ? "suggestion-urgent" : undefined}>
                  <td>{s.region}</td>
                  <td>{s.pending_order_count}</td>
                  <td>{s.oldest_pending_order_days}</td>
                  <td>{s.suggested_action === "SCHEDULE_NOW" ? "Schedule now" : `Wait${s.suggested_date ? ` (~${s.suggested_date})` : ""}`}</td>
                  <td className="hint">{s.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="planning-layout">
        <div className="run-list">
          <h3>Runs</h3>
          {runs.length === 0 && <p className="hint">No runs for this date yet.</p>}
          <ul>
            {runs.map((run) => (
              <li key={run.id}>
                <button className="link-button" onClick={() => openRun(run.id)}>
                  {run.van_name} — {run.status} ({run.stops.length} stops)
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedRun && (
          <div className="run-detail">
            <h3>
              {selectedRun.van_name} — {selectedRun.status}
            </h3>
            <p className="hint">
              Est. duration: {selectedRun.total_duration_min?.toFixed(0) ?? "—"} min. Sequence = delivery order;
              load position = loading order (reverse of delivery, so the last stop is loaded first).
            </p>
            <table>
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Load pos</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  {selectedRun.status === "DRAFT" && <th>Reorder</th>}
                </tr>
              </thead>
              <tbody>
                {[...selectedRun.stops]
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((stop) => (
                    <tr key={stop.id}>
                      <td>{stop.sequence}</td>
                      <td>{stop.load_position}</td>
                      <td>{stop.order_detail.order_number}</td>
                      <td>{stop.order_detail.customer_name}</td>
                      <td>{stop.status}</td>
                      {selectedRun.status === "DRAFT" && (
                        <td>
                          <button onClick={() => moveStop(stop.id, -1)}>↑</button>
                          <button onClick={() => moveStop(stop.id, 1)}>↓</button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>

            {(selectedRun.status === "DRAFT" || selectedRun.status === "PLANNED") && (
              <button onClick={handleLock}>Lock run &amp; generate manufacturing list</button>
            )}

            {selectedRun.status === "LOCKED" && (
              <div className="locked-run-actions">
                <button onClick={() => handleExport("csv")}>Download CSV</button>
                <button onClick={() => handleExport("pdf")}>Download PDF</button>

                {manufacturingList && (
                  <>
                    <h4>Manufacturing list</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Dimensions (mm)</th>
                          <th>Finish</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manufacturingList.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_label}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {item.width_mm}×{item.height_mm}×{item.depth_mm}
                            </td>
                            <td>{item.finish_name || item.colour || "—"}</td>
                            <td>{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
