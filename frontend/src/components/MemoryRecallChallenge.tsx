'use client'

import { useState, useEffect } from 'react'

const MEMORY_WORDS = [
    'แตงโม', 'ร่ม', 'นาฬิกา', 'เก้าอี้', 'ดินสอ',
    'แมว', 'ส้ม', 'แว่นตา', 'รองเท้า', 'โทรศัพท์',
    'กระเป๋า', 'กุญแจ', 'แก้วน้ำ', 'สมุด', 'เครื่องบิน',
    'รถยนต์', 'หมวก', 'พระจันทร์', 'ปลา', 'กรรไกร'
];

interface MemoryRecallChallengeProps {
    onComplete: (isCorrect: boolean) => void;
    phase: 'memorize' | 'recall';
    selectedWords?: string[];
    onWordsGenerated?: (words: string[]) => void;
    showFeedback?: boolean;
    onEvaluation?: (tries: number, success: boolean) => void;
}

export default function MemoryRecallChallenge({
    onComplete,
    phase,
    selectedWords: externalSelectedWords,
    onWordsGenerated,
    showFeedback = true,
    onEvaluation
}: MemoryRecallChallengeProps) {
    const [selectedWords, setSelectedWords] = useState<string[]>(externalSelectedWords || []);
    const [options, setOptions] = useState<string[]>([]);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [tries, setTries] = useState(0);

    useEffect(() => {
        // Pick 3 random words once when the component mounts or when words are empty
        if (selectedWords.length === 0) {
            const shuffled = [...MEMORY_WORDS].sort(() => 0.5 - Math.random());
            const picked = shuffled.slice(0, 3);
            setSelectedWords(picked);
            if (onWordsGenerated) onWordsGenerated(picked);

            // For recall phase, give 6-9 options
            const otherWords = MEMORY_WORDS.filter(w => !picked.includes(w));
            const shuffledOthers = otherWords.sort(() => 0.5 - Math.random());
            const recallOptions = [...picked, ...shuffledOthers.slice(0, 6)].sort(() => 0.5 - Math.random());
            setOptions(recallOptions);
        }
    }, [selectedWords, onWordsGenerated]);

    const toggleAnswer = (word: string) => {
        if (userAnswers.includes(word)) {
            setUserAnswers(userAnswers.filter(w => w !== word));
        } else if (userAnswers.length < 3) {
            setUserAnswers([...userAnswers, word]);
        }
    };

    const handleCheckRecall = () => {
        if (userAnswers.length < 3) return;

        setTries(t => t + 1);
        const isCorrect = selectedWords.every(w => userAnswers.includes(w));

        if (isCorrect) {
            if (onEvaluation) onEvaluation(tries + 1, true);
            if (showFeedback) {
                setFeedback('ถูกต้องยอดเยี่ยม! ความทรงจำของคุณดีมาก');
                setTimeout(() => onComplete(true), 1500);
            } else {
                onComplete(true);
            }
        } else {
            if (tries >= 2) { // Max 3 tries
                if (onEvaluation) onEvaluation(tries + 1, false);
                if (showFeedback) {
                    setFeedback('ไม่เป็นไรนะ เดี๋ยวเรามาลองพยายามใหม่คราวหน้ากัน!');
                    setTimeout(() => onComplete(false), 2000);
                } else {
                    onComplete(false);
                }
            } else {
                setFeedback('ยังไม่ถูกนะ ลองนึกใหม่อีกทีซิ...');
                setUserAnswers([]);
            }
        }
    };

    if (phase === 'memorize') {
        return (
            <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-8 border-4 border-black shadow-[15px_15px_0_#000] text-center">
                    <div className="w-40 h-40 mx-auto mb-6 bg-amber-50 rounded-full border-4 border-black overflow-hidden flex items-end justify-center">
                        <img src="/assets_employer/characters/grandpa_front.png" alt="Grandpa" className="w-full h-full object-contain scale-125 translate-y-2" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">ตาอยากให้หลานจำไว้</h2>
                    <p className="text-slate-500 font-bold mb-8 text-sm">จำคำ 3 คำนี้ให้ดีนะ แล้วตาจะมาถามอีกที!</p>

                    <div className="grid grid-cols-1 gap-4 mb-10">
                        {selectedWords.map((word, idx) => (
                            <div key={idx} className="bg-indigo-50 border-3 border-indigo-200 py-4 rounded-2xl text-3xl font-black text-indigo-700 animate-in zoom-in duration-500" style={{ animationDelay: `${idx * 200}ms` }}>
                                {word}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onComplete(true)}
                        className="w-full py-4 bg-black text-white rounded-2xl font-black text-xl shadow-[0_5px_0_#4f46e5] active:translate-y-1 active:shadow-none transition-all"
                    >
                        จำได้แม่นแล้ว! 🗝️
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-8 border-4 border-black shadow-[15px_15px_0_#000] text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-amber-50 rounded-full border-4 border-black overflow-hidden flex items-end justify-center">
                    <img src="/assets_employer/characters/grandpa_front.png" alt="Grandpa" className="w-full h-full object-contain scale-125 translate-y-2" />
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-2">จำที่ตาบอกได้ไหม?</h2>
                <p className="text-slate-500 font-bold mb-6 text-sm">ก่อนหน้านี้ ตาให้หลานจำคำว่าอะไรบ้าง (เลือก 3 คำ)</p>

                {feedback && showFeedback && (
                    <div className={`mb-4 py-2 px-4 rounded-full font-black text-sm border-2 ${feedback.includes('ถูกต้อง') ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200 animate-shake'}`}>
                        {feedback}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-8">
                    {options.map((word, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleAnswer(word)}
                            className={`py-3 px-2 rounded-xl font-black text-sm transition-all border-3 ${userAnswers.includes(word)
                                ? 'bg-indigo-600 text-white border-indigo-800 scale-105 shadow-md'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            {word}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleCheckRecall}
                    disabled={userAnswers.length < 3}
                    className={`w-full py-4 rounded-2xl font-black text-xl transition-all shadow-xl ${userAnswers.length === 3
                        ? 'bg-green-600 text-white shadow-green-800 active:translate-y-1 active:shadow-none'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    ส่งคำตอบ 🏹
                </button>
            </div>
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}
