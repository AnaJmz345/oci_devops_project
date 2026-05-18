import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EditTaskModal from './EditTaskModal'

describe('EditTaskModal basic test', () => {

  it('should NOT render when open is false', () => {
    render(
      <EditTaskModal
        open={false}
        task={{ taskName: 'Test task' }}
      />
    )

    // Como no renderiza nada, no debe existir el texto
    expect(screen.queryByText('Test task')).toBeNull()
  })

})