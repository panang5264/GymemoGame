'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
    const router = useRouter()
    const { login } = useAuth()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [acceptedPDPA, setAcceptedPDPA] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน')
            return
        }

        try {
            setLoading(true)
            const res = await registerUser(formData.name, formData.phone, formData.password)
            if (res.success) {
                // Log the user in with the token
                await login(res.data.token, res.data)
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg-warm)] flex items-center justify-center p-4 md:p-6 selection:bg-orange-100 selection:text-orange-900 overflow-hidden font-['Supermarket']">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-rose-100/50 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-xl relative z-10 transition-all duration-700">
                <div className="friendly-card animate-in fade-in zoom-in duration-500 p-8 md:p-12">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-white border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 overflow-hidden">
                            <img src="/assets_employer/logo.png" className="w-full h-full object-cover scale-[1.25]" alt="Gymemo Game Logo" />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight uppercase">สมัครสมาชิก</h1>
                    </div>

                    <div className="mb-8 bg-indigo-50/40 border-2 border-indigo-100/60 rounded-[2.5rem] p-8 text-base font-bold text-slate-700 space-y-4">
                        <p className="text-indigo-600 uppercase tracking-[0.3em] text-sm mb-2">แนวทางการเป็นนักสำรวจ 📋</p>
                        <ul className="list-disc pl-6 space-y-3 leading-relaxed">
                            <li>กรอกชื่อเล่นหรือชื่อจริง (ใช้แสดงในอันดับ)</li>
                            <li>ใช้เบอร์โทรศัพท์จริงเพื่อใช้เข้าสู่ระบบ (เบอร์ใช้ได้เลย)</li>
                            <li>ตั้งรหัสผ่านที่จำได้ง่ายแต่ปลอดภัย</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-2xl text-sm font-bold text-center mb-4">
                                {error}
                            </div>
                        )}
                        <div className="relative group">
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">👤</div>
                            <input
                                type="text"
                                name="name"
                                placeholder="ชื่อผู้เล่น (ใช้แสดงในอันดับ)"
                                className="pill-input pill-input-icon w-full py-4 text-lg"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">📞</div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="เบอร์โทรศัพท์ (0xxxxxxxxx)"
                                className="pill-input pill-input-icon w-full py-4 text-lg"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                            <input
                                type="password"
                                name="password"
                                placeholder="รหัสผ่าน"
                                className="pill-input pill-input-icon w-full py-4 text-lg"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="ยืนยันรหัสผ่าน"
                                className="pill-input pill-input-icon w-full py-4 text-lg"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* PDPA Section */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100/50 flex items-start gap-3 mt-4 group cursor-pointer" onClick={() => setAcceptedPDPA(!acceptedPDPA)}>
                            <div className={`mt-1 min-w-[20px] h-5 rounded-md border-2 border-indigo-400 flex items-center justify-center transition-all ${acceptedPDPA ? 'bg-indigo-500 border-indigo-500' : 'bg-white'}`}>
                                {acceptedPDPA && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <p className="text-sm font-bold text-slate-500 leading-tight">
                                ฉันยอมรับนโยบายความเป็นส่วนตัวและการจัดเก็บข้อมูลตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย เพื่อใช้ในการประมวลผลสถิติและลำดับคะแนน
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !acceptedPDPA}
                            className="pill-button w-full py-5 text-2xl mt-6 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_6px_0_#000] active:shadow-none active:translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก!'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t-2 border-[#1a1a1a]/10 text-center text-sm font-bold text-[#717171]">
                        มีบัญชีอยู่แล้ว? <Link href="/" className="text-blue-600 underline hover:text-blue-800 ml-1">เข้าสู่ระบบ</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
