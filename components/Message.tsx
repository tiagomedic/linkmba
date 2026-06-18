export default function Message({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-link-blue text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg-link-yellow rounded-full flex-shrink-0 mt-1" />
      <div className="bg-gray-900 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%]">
        {content || <span className="opacity-0">_</span>}
      </div>
    </div>
  )
}
