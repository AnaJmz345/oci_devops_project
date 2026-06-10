import React, { useEffect, useState } from 'react';
import { getMemberColorByIndex } from '../utils/memberColors';

function formatChartValue(value, unit) {
  const rounded = Math.round((value || 0) * 10) / 10;
  return `${rounded}${unit}`;
}

function GroupedBarChart({ groups = [], series = [], unit = '', yAxisLabel = '' }) {
  const [animated, setAnimated] = useState(false);
  const max = Math.max(
    1,
    ...groups.flatMap((group) => group.values.map((item) => item.value || 0))
  );
  const minWidth = Math.max(640, groups.length * Math.max(136, series.length * 38 + 34));

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [groups, series]);

  if (groups.length === 0 || series.length === 0) {
    return <div className="AN-empty">No data yet.</div>;
  }

  return (
    <div className="AN-grouped-chart-wrap">
      <div className="AN-grouped-legend">
        {series.map((item, index) => (
          <span className="AN-grouped-legend-item" key={item.id}>
            <span
              className="AN-grouped-legend-swatch"
              style={{ background: item.color || getMemberColorByIndex(index) }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className="AN-grouped-chart-scroll">
        <div className="AN-grouped-chart" style={{ minWidth }}>
          {yAxisLabel && <div className="AN-grouped-axis-label">{yAxisLabel}</div>}
          <div className="AN-grouped-plot">
            {[25, 50, 75].map((pct) => (
              <div
                className="AN-grouped-grid-line"
                key={pct}
                style={{ bottom: `${pct}%` }}
              />
            ))}
            <div className="AN-grouped-groups">
              {groups.map((group) => (
                <div className="AN-grouped-group" key={group.id}>
                  <div className="AN-grouped-bars">
                    {series.map((item, index) => {
                      const value = group.values.find((entry) => entry.seriesId === item.id)?.value || 0;
                      const color = item.color || getMemberColorByIndex(index);
                      const heightPct = animated ? Math.max((value / max) * 100, value > 0 ? 5 : 0) : 0;

                      return (
                        <div className="AN-grouped-bar-slot" key={item.id}>
                          <span
                            className="AN-grouped-value"
                            style={{ color, opacity: animated && value > 0 ? 1 : 0 }}
                          >
                            {formatChartValue(value, unit)}
                          </span>
                          <div
                            className="AN-grouped-bar"
                            style={{
                              background: color,
                              height: `${heightPct}%`,
                              boxShadow: value > 0 ? `0 4px 12px ${color}33` : 'none',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="AN-grouped-x-label">{group.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupedBarChart;
