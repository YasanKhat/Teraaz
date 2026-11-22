export type Family = { id: string; concept: string; lines: string[]; quotes?: { text: string; source?: string | null }[]; avoid?: string[]; sense?: string }
export type Kind = 'match' | 'concept' | 'odd' | 'pairs' | 'meaning'
export type Card = { id: string; family: string; text: string; form: 'beyt'|'concept'|'quote'; idea: string; source?: string | null }
export type Question = { kind: Kind; prompt: Card | null; options: Card[] }
export const KINDS: Kind[] = ['match','concept','odd','pairs','meaning']
export const KIND_NAMES: Record<Kind,string> = { match:'هم‌مفهوم', concept:'مفهوم به بیت', odd:'بیت ناهم‌خوان', pairs:'جفت‌ها', meaning:'بیت به مفهوم' }
export const KIND_HINTS: Record<Kind,string> = { match:'بیتِ هم‌مفهوم با صورت سؤال', concept:'همهٔ بیت‌های یک مفهوم', odd:'بیتی که با بقیه هم‌مفهوم نیست', pairs:'دو بیتِ هم‌مفهوم از میان چهار بیت', meaning:'مفهومِ درستِ یک بیت' }
export function shuffle<T>(values: readonly T[], random = Math.random): T[] { const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a }
const line=(f:Family,i:number):Card=>({id:`${f.id}:${i}`,family:f.id,text:f.lines[i],form:'beyt',idea:f.concept})
const concept=(f:Family):Card=>({id:`${f.id}:c`,family:f.id,text:f.concept,form:'concept',idea:f.concept})
const excluded=(a:Family,b:Family)=>a.id===b.id || !!a.avoid?.includes(b.id) || !!b.avoid?.includes(a.id)
const lines=(f:Family,n:number,r:()=>number,except=-1)=>shuffle(f.lines.map((_,i)=>i).filter(i=>i!==except),r).slice(0,n).map(i=>line(f,i))
const others=(f:Family,n:number,bank:Family[],r:()=>number)=>shuffle(bank.filter(x=>!excluded(f,x)),r).slice(0,n)
export function makeQuestion(kind:Kind, family:Family, bank:Family[], random=Math.random):Question {
  const f=family, r=random
  if(kind==='match') {
    const quote=f.quotes?.length && (f.lines.length<2 || r()<.3)?f.quotes[Math.floor(r()*f.quotes.length)]:null
    const index=Math.floor(r()*f.lines.length)
    const prompt:Card=quote?{id:`${f.id}:q`,family:f.id,text:quote.text,form:'quote',idea:f.concept,source:quote.source}:line(f,index)
    return {kind,prompt,options:shuffle([...lines(f,1,r,quote?-1:index),...others(f,3,bank,r).map(x=>lines(x,1,r)[0])],r)}
  }
  if(kind==='concept') {const count=Math.min([1,2,2,3][Math.floor(r()*4)],f.lines.length);return {kind,prompt:concept(f),options:shuffle([...lines(f,count,r),...others(f,4-count,bank,r).map(x=>lines(x,1,r)[0])],r)}}
  if(kind==='odd') {const hasFour=f.lines.length>=4,index=Math.floor(r()*f.lines.length);return {kind,prompt:hasFour?line(f,index):concept(f),options:shuffle([...lines(f,3,r,hasFour?index:-1),lines(others(f,1,bank,r)[0],1,r)[0]],r)}}
  if(kind==='pairs') {const families=[f];for(const candidate of shuffle(bank,r)){if(families.length===3)break;if(families.every(x=>!excluded(x,candidate)))families.push(candidate)}return {kind,prompt:null,options:shuffle([...lines(f,2,r),...families.slice(1).map(x=>lines(x,1,r)[0])],r)}}
  const quote=f.quotes?.find(q=>!q.source) ?? (f.lines.length?null:f.quotes?.[0]);const prompt:Card=quote?{id:`${f.id}:q`,family:f.id,text:quote.text,form:'quote',idea:f.concept,source:quote.source}:lines(f,1,r)[0]
  return {kind,prompt,options:shuffle([concept(f),...others(f,3,bank,r).map(concept)],r)}
}
export function targetFamily(q:Question):string|undefined { return q.prompt?.family ?? q.options.find((v,i)=>q.options.findIndex(x=>x.family===v.family)!==i)?.family }
export function answerOf(q:Question):string[] {const family=targetFamily(q);return q.options.filter(o=>o.family===family).map(o=>o.id)}
export function isWrongMove(q:Question,id:string):boolean {const o=q.options.find(x=>x.id===id);return q.kind==='odd'?o?.family===targetFamily(q):o?.family!==targetFamily(q)}
export function buildRound(kinds:Kind[],count:number,bank:Family[],random=Math.random):Question[] {if(!kinds.length||!bank.length)return [];const sequence=shuffle(kinds,random);let pile:Family[]=[];return Array.from({length:count},(_,i)=>{if(!pile.length)pile=shuffle(bank,random);return makeQuestion(sequence[i%sequence.length],pile.pop()!,bank,random)})}
