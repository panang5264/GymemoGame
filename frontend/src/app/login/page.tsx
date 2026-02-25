'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()

    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            setLoading(true)
            const res = await loginUser(formData.phone, formData.password)
            if (res.success) {
                // Log the user in with the token
                login(res.data.token, res.data)
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#fff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>เข้าสู่ระบบ</h2>

            {error && <div style={{ backgroundColor: 'rgba(254, 226, 226, 0.9)', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#eee', fontWeight: '500' }}>เบอร์โทรศัพท์</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.3)', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000', fontSize: '1rem' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#eee', fontWeight: '500' }}>รหัสผ่าน</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.3)', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000', fontSize: '1rem' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="start-button"
                    style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '1.1rem' }}
                >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#ddd' }}>
                ยังไม่มีบัญชี? <Link href="/register" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 'bold', marginLeft: '0.5rem' }}>สมัครสมาชิก</Link>
            </div>
        </div>
    )
}
