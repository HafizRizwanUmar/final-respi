import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'

// Icons
import { Shield, Users, Globe, Activity } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"

// ✅ Simple Tailwind Card wrappers
function Card({ children, className }) {
  return (
    <div className={`rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition ${className || ""}`}>
      {children}
    </div>
  )
}

function CardContent({ children, className }) {
  return (
    <div className={`p-5 ${className || ""}`}>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState(null)

  useEffect(() => {
    const sumRef = ref(db, 'pihole_logs/summary')
    const recentRef = ref(db, 'pihole_logs/recent_blocked')

    const off1 = onValue(sumRef, snap => setSummary(snap.val() || null))
    const off2 = onValue(recentRef, snap => setRecent(snap.val() || null))

    return () => { off1(); off2(); }
  }, [])

  // Chart data
  const chartData = summary ? [
    { name: "Blocked", value: summary.queries?.blocked ?? 0 },
    { name: "Forwarded", value: summary.queries?.forwarded ?? 0 },
    { name: "Cached", value: summary.queries?.cached ?? 0 },
  ] : []

  const COLORS = ["#ef4444", "#3b82f6", "#22c55e"]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-col items-start text-white">
            <Shield className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-sm text-gray-400">Blocked Today</p>
            <p className="text-2xl font-bold">{summary?.queries?.blocked ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start text-white">
            <Globe className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-sm text-gray-400">Total Queries</p>
            <p className="text-2xl font-bold">{summary?.queries?.total ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start text-white">
            <Users className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">Active Clients</p>
            <p className="text-2xl font-bold">{summary?.clients?.active ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start text-white">
            <Activity className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-sm text-gray-400">Gravity Domains</p>
            <p className="text-2xl font-bold">{summary?.gravity?.domains_being_blocked ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="text-white">
            <h2 className="text-lg font-semibold mb-4">Query Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-white">
            <h2 className="text-lg font-semibold mb-4">Replies Breakdown</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(summary?.queries?.replies || {}).map(([k, v]) => ({ name: k, value: v }))}>
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Blocked */}
      <Card>
        <CardContent className="text-white">
          <h2 className="text-lg font-semibold mb-4">Most Recent Blocked</h2>
          {recent?.blocked?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recent.blocked.map((domain, i) => (
                <span key={i} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                  {domain}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No blocked domains yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
