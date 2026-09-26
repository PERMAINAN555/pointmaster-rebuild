export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((s, i) => {
        const active = i === current
        const done = i < current
        return (
          <div key={i} className="flex items-center gap-1 whitespace-nowrap">
            <div className={`px-3 py-1.5 rounded text-xs font-medium ${
              active ? 'bg-brand text-white' :
              done ? 'bg-brand/10 text-brand' :
              'bg-gray-100 text-gray-500'
            }`}>
              {i + 1}. {s}
            </div>
            {i < steps.length - 1 && <div className="w-3 h-px bg-gray-300" />}
          </div>
        )
      })}
    </div>
  )
}
