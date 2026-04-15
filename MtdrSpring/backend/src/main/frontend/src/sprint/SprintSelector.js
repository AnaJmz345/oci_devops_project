import React from 'react';

export default function SprintSelector() {
  const [value, setValue] = React.useState('SPRINT 2');

  return (
    <label className="v-sprint" aria-label="Sprint selector">
      <select value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="SPRINT 0">SPRINT 0 (completed)</option>
        <option value="SPRINT 1">SPRINT 1 (completed)</option>
        <option value="SPRINT 2">SPRINT 2 (active)</option>
        <option value="ALL">ALL SPRINTS</option>
      </select>
    </label>
  );
}
