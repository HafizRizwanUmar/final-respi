import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')   // 👈 redirect to dashboard after successful login
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 card">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-400">{error}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
      <p className="text-sm mt-3 text-white/60">
        Use the admin credentials configured in Firebase Auth.
      </p>
    </div>
  )
}
