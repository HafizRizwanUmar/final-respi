import { useEffect, useState } from 'react'
import { ref, push, onValue } from 'firebase/database'
import { db } from '../firebase'
import { Ban, CheckCircle, Clock } from 'lucide-react'

export default function BlockControl() {
  const [domain, setDomain] = useState('')
  const [pending, setPending] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const bro = ref(db, 'requests/block')
    const uro = ref(db, 'requests/unblock')
    return [
      onValue(bro, snap => {
        const v = snap.val() || {}
        const arr = Object.entries(v)
          .map(([id, x]) => ({ id, path: 'requests/block', ...x }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setPending(arr.filter(x => x.status === 'pending'))
        setHistory(arr.filter(x => x.status !== 'pending'))
      }),
      onValue(uro, snap => {
        const v = snap.val() || {}
        const arr = Object.entries(v)
          .map(([id, x]) => ({ id, path: 'requests/unblock', ...x }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setHistory(h => h.concat(arr).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
      })
    ][0]
  }, [])

  const addReq = (path) => {
    if (!domain) return
    const reqRef = ref(db, path)
    push(reqRef, {
      domain,
      status: 'pending',
      createdAt: Date.now()
    })
    setDomain('')
  }

  const statusBadge = (status) => {
    if (status === 'pending') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
          <Clock size={14}/> Pending
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
        <CheckCircle size={14}/> Done
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6">
      
      {/* Input Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Block / Unblock Domains</h2>
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e)=>setDomain(e.target.value)}
            placeholder="e.g. ads.example.com"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-500"
          />
          <button
            className="btn flex items-center gap-1 bg-red-600 hover:bg-red-700"
            onClick={()=>addReq('requests/block')}
          >
            <Ban size={16}/> Block
          </button>
          <button
            className="btn flex items-center gap-1 bg-green-600 hover:bg-green-700"
            onClick={()=>addReq('requests/unblock')}
          >
            <CheckCircle size={16}/> Unblock
          </button>
        </div>
        <p className="text-sm text-white/60 mt-2">
          Requests will be executed automatically by your Pi-hole agent.
        </p>
      </div>

      {/* Pending Requests */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold mb-3 text-lg">Pending Requests</h3>
        {pending.length === 0 ? (
          <div className="text-white/60">No pending requests</div>
        ) : (
          <div className="overflow-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Domain</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pending.map(x => (
                  <tr key={x.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-2 font-mono">{x.domain}</td>
                    <td className="px-4 py-2">{statusBadge(x.status)}</td>
                    <td className="px-4 py-2 font-mono">{new Date(x.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold mb-3 text-lg">History</h3>
        {history.length === 0 ? (
          <div className="text-white/60">No history yet</div>
        ) : (
          <div className="overflow-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Domain</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {history.map(x => (
                  <tr key={x.id + x.path} className="hover:bg-gray-800/40">
                    <td className="px-4 py-2 font-mono">{x.domain}</td>
                    <td className="px-4 py-2 font-mono">{x.path.includes('unblock') ? 'Unblock' : 'Block'}</td>
                    <td className="px-4 py-2">{statusBadge(x.status)}</td>
                    <td className="px-4 py-2 font-mono">
                      {x.createdAt ? new Date(x.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
