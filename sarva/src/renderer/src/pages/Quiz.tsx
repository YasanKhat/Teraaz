import QuizBankLoader from '@/components/UI/QuizBankLoader'

/** آزمونِ عروض سماعی — بانک از `/api/v1/quiz/bank` می‌آید، که حالا همان
 *  ۱۱۳۹ پرسشِ واقعی را از روی دستگاه می‌خواند. */
export default function Quiz() {
  return <QuizBankLoader />
}
