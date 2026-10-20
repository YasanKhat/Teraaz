/**
 * تصویر چهره‌ها
 * هر چهره یک تابلوی تصویری دارد (نقاشی مینیاتور/تذهیب) که در کارت گالری و
 * پروندهٔ چهره نمایش داده می‌شود. تصویرها محلی‌اند تا برنامه کاملاً آفلاین بماند.
 */
import abubakr from '../assets/figures/abubakr.jpg'
import abumoslem from '../assets/figures/abumoslem.jpg'
import ali from '../assets/figures/imam-ali.jpg'
import hasan from '../assets/figures/imam-hasan.jpg'
import hossein from '../assets/figures/imam-hossein.jpg'
import mokhtar from '../assets/figures/mokhtar.jpg'
import moaviye from '../assets/figures/moaviye.jpg'
import omar from '../assets/figures/omar.jpg'
import osman from '../assets/figures/osman.jpg'
import payambar from '../assets/figures/payambar.jpg'

export const figuresArt: Record<string, string> = {
  payambar,
  'imam-ali': ali,
  'imam-hasan': hasan,
  'imam-hossein': hossein,
  abubakr,
  omar,
  osman,
  moaviye,
  mokhtar,
  abumoslem
}

/** شمار چهره‌هایی که تصویر دارند — برای نمایش پوشش در سرصفحهٔ گالری */
export const figuresWithArt = Object.keys(figuresArt).length
