export interface PaperMeta {
  id: string
  num: number
  term: string
  title: string
  minutes: number
  count: number
}

export const papersMeta: PaperMeta[] = [
  { id: 'p1', num: 1, term: 'نوبت اول', title: 'نمونه امتحان نوبت اول — شماره 1', minutes: 90, count: 47 },
  { id: 'p2', num: 2, term: 'نوبت اول', title: 'نمونه امتحان نوبت اول — شماره 2', minutes: 90, count: 48 },
  { id: 'p3', num: 3, term: 'نوبت دوم', title: 'نمونه امتحان نوبت دوم — شماره 3', minutes: 90, count: 50 },
  { id: 'p4', num: 4, term: 'نوبت دوم', title: 'نمونه امتحان نوبت دوم — شماره 4', minutes: 90, count: 51 },
  { id: 'p5', num: 5, term: 'نوبت دوم', title: 'نمونه امتحان نوبت دوم — شماره 5', minutes: 90, count: 49 },
  { id: 'p6', num: 6, term: 'نیم\u200cسال دوم', title: 'نمونه امتحان نیم\u200cسال دوم — شماره 6', minutes: 90, count: 51 }
]
