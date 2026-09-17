import type { StatusFilterValue } from './types.ts'

const FILTER_OPTIONS: readonly { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
]

type StatusFilterProps = {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <fieldset className="status-filter">
      <legend>Filter by status</legend>
      {FILTER_OPTIONS.map((option) => (
        <label className="status-filter__option" key={option.value}>
          <input
            type="radio"
            name="session-status-filter"
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              onChange(option.value)
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
