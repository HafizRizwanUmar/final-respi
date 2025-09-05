import { useEffect, useMemo, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'

export default function Logs() {
  const [data, setData] = useState([])

  useEffect(() => {
    const qRef = ref(db, 'pihole_logs/queries/queries')
    return onValue(qRef, (snap) => {
      const val = snap.val() || []
      setData(Array.isArray(val) ? val : [])
    })
  }, [])

  const fmtTime = (t) => {
    if (!t) return '—'
    try {
      return new Date(t * 1000).toLocaleString()
    } catch { return String(t) }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">DNS Queries</h2>
        <div className="text-sm text-white/60">Showing {data.length} items</div>
      </div>
      <div className="overflow-auto">
        <table>
          <thead>
            <tr>
              <th className="w-[28%]">Domain</th>
              <th>Status</th>
              <th>Type</th>
              <th>Reply</th>
              <th>Client</th>
              <th className="w-[18%]">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((q, idx) => (
              <tr key={q.id ?? idx}>
                <td className="mono">{q.domain}</td>
                <td>{q.status ?? '—'}</td>
                <td>{q.type ?? '—'}</td>
                <td>{q.reply?.type ?? '—'}</td>
                <td className="mono">{q.client?.ip ?? '—'}</td>
                <td className="mono">{fmtTime(q.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
