import React from 'react';

export default function NewTask({ onCreate }) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [storyPoints, setStoryPoints] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onCreate({
        title: trimmed,
        description: description.trim(),
        storyPoints: storyPoints === '' ? null : Number(storyPoints),
      });
      setTitle('');
      setDescription('');
      setStoryPoints('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="v-card">
      <div className="v-card__title">Create</div>
      <form className="v-form" onSubmit={submit}>
        <div className="v-form__row">
          <div className="v-field">
            <label>Task</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Presentation Module 9 OCI/DevOps"
              autoComplete="off"
            />
          </div>
          <div className="v-field">
            <label>Hours</label>
            <input
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              type="number"
              min="0"
              placeholder="3"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="v-field">
          <label>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            autoComplete="off"
          />
        </div>

        <div className="v-form__actions">
          <button className="v-btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
