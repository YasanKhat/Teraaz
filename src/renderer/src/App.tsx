import { AnimatePresence, motion } from 'framer-motion'
import { useRoute } from './lib/router'
import { useProgress } from './store/useProgress'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { Chapters } from './pages/Chapters'
import { Chapter } from './pages/Chapter'
import { LessonExperience } from './pages/LessonExperience'
import { Recap } from './pages/Recap'
import { Bank } from './pages/Bank'
import { Archive } from './pages/Archive'
import { Quiz } from './pages/Quiz'
import { PaperPage } from './pages/Paper'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

export default function App() {
  const route = useRoute()
  const motionOn = useProgress((s) => s.settings.motion)

  const view = (() => {
    switch (route.page) {
      case 'lessons':
        return <Chapters />
      case 'chapters':
        return <Chapters />
      case 'chapter':
        return <Chapter id={route.id} />
      case 'lesson':
        return <LessonExperience id={route.id} openRead={route.query.get('read') === '1'} initialQuery={route.query.get('q') ?? ''} />
      case 'film':
        return <LessonExperience id={route.id} autoFilm />
      case 'recap':
        return <Recap id={route.id} />
      case 'bank':
        return <Bank id={route.id} initialQuery={route.query.get('q') ?? ''} />
      case 'archive':
        return <Archive tab={route.id} />
      case 'timeline':
      case 'map':
      case 'figures':
        return <Archive tab={route.page} />
      case 'quiz':
      case 'exam':
      case 'exams':
        return <Quiz examId={route.id} />
      case 'progress':
      case 'me':
        return <Progress />
      case 'paper':
        return <PaperPage id={route.id} />
      case 'settings':
        return <Settings />
      default:
        return <Home />
    }
  })()

  return (
    <Shell current={route.page}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[99] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-bg"
      >
        رفتن به محتوای اصلی
      </a>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={route.raw || 'home'}
          initial={motionOn ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={motionOn ? { opacity: 0, y: -6 } : undefined}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {view}
        </motion.div>
      </AnimatePresence>
    </Shell>
  )
}
