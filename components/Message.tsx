import { motion } from 'framer-motion'

export default function Message({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="bg-link-blue text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed shadow-md">
          {content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-link-yellow flex-shrink-0 mt-1 shadow-[0_0_12px_rgba(245,196,0,0.3)]" />

      <div className="bg-gray-900 border border-gray-800 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] shadow-md">
        {content || <span className="opacity-0 select-none">_</span>}
      </div>
    </motion.div>
  )
}
