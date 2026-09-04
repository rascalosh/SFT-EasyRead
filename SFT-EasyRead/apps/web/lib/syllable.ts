const VOWELS = new Set(["a", "i", "u", "e", "o"])
const DIGRAPHS = ["ng", "ny", "kh", "sy"]

const OVERRIDES: Record<string, string[]> = {
  perjuangan: ["per", "ju", "ang", "an"],
  bangsa: ["bang", "sa"],
  indonesia: ["in", "do", "ne", "sia"],
  kemerdekaan: ["ke", "mer", "de", "ka", "an"],
  merdeka: ["mer", "de", "ka"],
  pahlawan: ["pah", "la", "wan"],
  rintangan: ["rin", "tang", "an"],
  generasi: ["ge", "ne", "ra", "si"],
}

function isVowel(ch: string) {
  return VOWELS.has(ch.toLowerCase())
}

type Unit = { text: string; type: "V" | "C" }

function toUnits(word: string): Unit[] {
  const lower = word.toLowerCase()
  const units: Unit[] = []
  let i = 0
  while (i < lower.length) {
    const pair = lower.slice(i, i + 2)
    if (pair.length === 2 && DIGRAPHS.includes(pair)) {
      units.push({ text: word.slice(i, i + 2), type: "C" })
      i += 2
    } else {
      const ch = lower.charAt(i)
      units.push({ text: word.slice(i, i + 1), type: isVowel(ch) ? "V" : "C" })
      i += 1
    }
  }
  return units
}

export function syllabify(word: string): string[] {
  if (!/[a-zA-Z]/.test(word)) return [word]

  const key = word.toLowerCase()
  const override = OVERRIDES[key]
  if (override) return override

  const units = toUnits(word)
  const vowelIdx: number[] = []
  units.forEach((u, i) => {
    if (u.type === "V") vowelIdx.push(i)
  })
  if (vowelIdx.length <= 1) return [word]

  const cuts = new Set<number>()
  for (let v = 0; v < vowelIdx.length - 1; v++) {
    const a = vowelIdx[v] ?? 0
    const b = vowelIdx[v + 1] ?? 0
    const between = b - a - 1
    if (between === 0) cuts.add(b)
    else if (between === 1) cuts.add(a + 1)
    else cuts.add(a + 2)
  }

  const syllables: string[] = []
  let cur = ""
  for (let i = 0; i < units.length; i++) {
    if (cuts.has(i) && cur) {
      syllables.push(cur)
      cur = ""
    }
    cur += units[i]?.text ?? ""
  }
  if (cur) syllables.push(cur)
  return syllables
}