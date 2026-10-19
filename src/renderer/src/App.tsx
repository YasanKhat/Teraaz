import { AnimatePresence, motion } from 'framer-motion'
import { useRoute } from './lib/router'
import { useProgress } from './store/useProgress'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { Lessons } from './pages/Lessons'
import { LessonPage } from './pages/LessonPage'
import { Timeline } from './pages/Timeline'
import { MapPage } from './pages/MapPage'
import { Figures } from './pages/Figures'
import { Quiz } from './pages/Quiz'
import { Cards } from './pages/Cards'
import { Game } from './pages/Game'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'

export default function App() {
  const route = useRoute()
  const motionOn = useProgress((s) => s.settings.motion)

  const view = (() => {
    switch (route.page) {
      case 'lessons':
        return <Lessons chapterId={route.id} />
      case 'lesson':
        return <LessonPage id={route.id} />
      case 'timeline':
        return <Timeline />
      case 'map':
        return <MapPage />
      case 'figures':
        return <Figures id={route.id} />
      case 'quiz':
      case 'exam':
        return <Quiz examId={route.id} />
      case 'cards':
        return <Cards />
      case 'game':
        return <Game />
      case 'progress':
        return <Progress />
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
