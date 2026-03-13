import React, { useState } from "react";
import Button from '@mui/material/Button';

function NewItem(props) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [storyPoints, setStoryPoints] = useState('');

  function handleSubmit(e) {
    if (!taskName.trim()) return;
    props.addItem(taskName, description, storyPoints ? parseInt(storyPoints) : null);
    setTaskName('');
    setDescription('');
    setStoryPoints('');
    e.preventDefault();
  }

  return (
    <div id="newinputform">
      <form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <input
            id="newiteminput"
            placeholder="Task name *"
            type="text"
            autoComplete="off"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') handleSubmit(event); }}
          />
          <input
            id="descriptioninput"
            placeholder="Description"
            type="text"
            autoComplete="off"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') handleSubmit(event); }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="storypointsinput"
              placeholder="Hours (story points)"
              type="number"
              min="0"
              autoComplete="off"
              value={storyPoints}
              onChange={e => setStoryPoints(e.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') handleSubmit(event); }}
              style={{ width: '12rem' }}
            />
            <span>&nbsp;&nbsp;</span>
            <Button
              className="AddButton"
              variant="contained"
              disabled={props.isInserting}
              onClick={!props.isInserting ? handleSubmit : null}
              size="small"
            >
              {props.isInserting ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewItem;