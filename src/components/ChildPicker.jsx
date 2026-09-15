import { useState } from 'react'
import { childrenOfParent, getParentRecord } from '../data/db'
import { SegmentedControl } from './ui'

// Parents can have more than one child enrolled, so every parent screen
// runs through this picker. With a single child it renders nothing.
export function useSelectedChild(userId) {
  const parent = getParentRecord(userId)
  const children = parent ? childrenOfParent(parent.id) : []
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? null)
  const child = children.find((c) => c.id === selectedId) ?? children[0] ?? null
  return { children, child, selectedId: child?.id ?? null, setSelectedId }
}

export default function ChildPicker({ children, selectedId, onSelect }) {
  if (children.length <= 1) return null
  return (
    <div className="mb-4">
      <SegmentedControl
        value={selectedId}
        onChange={onSelect}
        options={children.map((c) => ({ value: c.id, label: c.name.split(' ')[0] }))}
      />
    </div>
  )
}
