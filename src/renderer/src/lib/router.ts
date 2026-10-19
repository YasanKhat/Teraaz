import { useEffect, useState } from 'react'

export interface Route {
  page: string
  id?: string
  raw: string
  query: URLSearchParams
}

function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path, search = ''] = raw.split('?')
  const [page = '', id] = path.split('/')
  return { page: page || 'home', id, raw, query: new URLSearchParams(search) }
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : `#/${to.replace(/^\//, '')}`
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = target
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [route.page, route.id])
  return route
}
