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
        <div className="flex-1 min-h-[calc(100vh-80px)] bg-[var(--bg-warm)] flex flex-col items-center p-1.5 md:p-4 selection:bg-orange-100 selection:text-orange-900 font-['Supermarket']">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-rose-100/50 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-xl relative z-10 transition-all duration-700 h-full flex flex-col items-center justify-start pt-2 min-[400px]:pt-[5vh] lg:justify-center">
                <div className="friendly-card animate-in fade-in zoom-in duration-500 p-3 min-[400px]:p-5 md:p-8 flex flex-col w-full">
                    <div className="flex flex-col items-center mb-2 md:mb-4 shrink-0">
                        <div className="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 md:w-20 md:h-20 bg-white border-2 min-[400px]:border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-1 md:mb-4 overflow-hidden">
                            <img src="/assets_employer/logo.png" className="w-full h-full object-cover scale-[1.25]" alt="Gymemo Game Logo" />
                        </div>
                        <h1 className="text-lg min-[400px]:text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase leading-none">สมัครสมาชิก</h1>
                    </div>

                    <div className="mb-2 md:mb-4 bg-indigo-50/40 border-2 border-indigo-100/60 rounded-[1rem] min-[400px]:rounded-[1.5rem] md:rounded-[2.5rem] p-2 min-[400px]:p-3 md:p-6 text-[10px] md:text-sm font-bold text-slate-700 space-y-0.5 md:space-y-1.5 shrink-0">
                        <p className="text-indigo-600 uppercase tracking-[0.2em] text-[9px] min-[400px]:text-[10px] md:text-xs mb-0.5 md:mb-1">แนวทางการเป็นนักสำรวจ 📋</p>
                        <ul className="list-disc pl-4 md:pl-5 space-y-0.5 md:space-y-1 leading-snug">
                            <li>กรอกชื่อเล่นหรือชื่อจริง (ใช้แสดงในอันดับ)</li>
                            <li>ใช้เบอร์โทรศัพท์จริงเพื่อใช้เข้าสู่ระบบ</li>
                            <li>ตั้งรหัสผ่านที่จำได้ง่ายแต่ปลอดภัย</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-1.5 md:space-y-3 shrink-0">
                        {error && (
                            <div className="bg-red-100 text-red-600 p-2.5 rounded-xl text-xs font-bold text-center mb-3">
                                {error}
                            </div>
                        )}
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm md:text-lg opacity-60 group-focus-within:opacity-100 transition-opacity z-10">👤</div>
                            <input
                                type="text"
                                name="name"
                                placeholder="ชื่อผู้เล่น (ใช้แสดงในอันดับ)"
                                className="pill-input pill-input-icon w-full py-2.5 md:py-3 text-sm md:text-base"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm md:text-lg opacity-60 group-focus-within:opacity-100 transition-opacity z-10">📞</div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="เบอร์โทรศัพท์ (0xxxxxxxxx)"
                                className="pill-input pill-input-icon w-full py-2.5 md:py-3 text-sm md:text-base"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm md:text-lg opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                            <input
                                type="password"
                                name="password"
                                placeholder="รหัสผ่าน"
                                className="pill-input pill-input-icon w-full py-2.5 md:py-3 text-sm md:text-base"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm md:text-lg opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="ยืนยันรหัสผ่าน"
                                className="pill-input pill-input-icon w-full py-2.5 md:py-3 text-sm md:text-base"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* PDPA Section */}
                        <div className="bg-indigo-50/50 p-2 md:p-4 rounded-xl border border-indigo-100/50 flex items-start gap-2 mt-1 md:mt-2 group cursor-pointer" onClick={() => setAcceptedPDPA(!acceptedPDPA)}>
                            <div className={`mt-0.5 min-w-[14px] h-3.5 md:min-w-[16px] md:h-4 rounded-[4px] border border-indigo-400 flex items-center justify-center transition-all ${acceptedPDPA ? 'bg-indigo-500 border-indigo-500' : 'bg-white'}`}>
                                {acceptedPDPA && <span className="text-white text-[8px]">✓</span>}
                            </div>
                            <p className="text-[9px] min-[400px]:text-[10px] md:text-xs font-bold text-slate-500 leading-tight">
                                ฉันยอมรับนโยบายความเป็นส่วนตัวและการจัดเก็บข้อมูล (PDPA) เพื่อใช้ประมวลผลสถิติและลำดับคะแนน
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !acceptedPDPA}
                            className="pill-button w-full py-3 md:py-4 text-base md:text-xl mt-2 md:mt-4 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_3px_0_#000] md:shadow-[0_4px_0_#000] active:shadow-none active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก!'}
                        </button>
                    </form>

                    <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t-2 border-[#1a1a1a]/5 text-center text-xs min-[400px]:text-sm font-bold text-[#717171] shrink-0">
                        มีบัญชีอยู่แล้ว? <Link href="/" className="text-blue-600 underline hover:text-blue-800 ml-1">เข้าสู่ระบบ</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
