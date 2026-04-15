import React from 'react';

export default function OverviewPage() {
  return (
    <div className="v-stack">
      <h1 className="v-h1">Sprint overview</h1>

      <div className="v-grid v-grid--4">
        <div className="v-card">
          <div className="v-card__kpi">12</div>
          <div className="v-card__label">Days left</div>
        </div>
        <div className="v-card">
          <div className="v-card__kpi">20</div>
          <div className="v-card__label">Tasks done</div>
        </div>
        <div className="v-card">
          <div className="v-card__kpi">30</div>
          <div className="v-card__label">In progress</div>
        </div>
        <div className="v-card">
          <div className="v-card__kpi">40</div>
          <div className="v-card__label">To do</div>
        </div>
      </div>

      <div className="v-grid v-grid--2">
        <div className="v-card">
          <div className="v-card__title">Hours per member</div>
          <div className="v-placeholder">Chart placeholder</div>
        </div>
        <div className="v-card">
          <div className="v-card__title">Tasks per member</div>
          <div className="v-placeholder">Chart placeholder</div>
        </div>
      </div>

      <div className="v-card">
        <div className="v-card__title">Reports</div>
        <div className="v-grid v-grid--4">
          <div className="v-report">BURNDUP REPORT</div>
          <div className="v-report">BURNDOWN REPORT</div>
          <div className="v-report">VELOCITY REPORT</div>
          <div className="v-report">CYCLE TIME REPORT</div>
        </div>
      </div>
    </div>
  );
}
