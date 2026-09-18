export type ScreenId =
  | "home"
  | "material"
  | "reading"
  | "simplify"
  | "comprehension"
  | "syllable"
  | "assessment"
  | "tracking"
  | "progress"
  | "settings"

export const screenTitles: Record<ScreenId, string> = {
  home: "Materi Baru",
  material: "Detail Materi",
  reading: "Baca Teks",
  simplify: "Simplify",
  tracking: "Multisensory Tracking",
  syllable: "Syllable Breaker",
  comprehension: "Reading Comprehension",
  assessment: "Reading Assessment",
  progress: "Progress & Achievement",
  settings: "Pengaturan",
}

export const screenHrefs: Record<ScreenId, string> = {
  home: "/",
  material: "/material",
  reading: "/baca",
  simplify: "/simplify",
  tracking: "/tracking",
  syllable: "/latihan-kata",
  comprehension: "/comprehension",
  assessment: "/penilaian",
  progress: "/progress",
  settings: "/pengaturan",
}

export function hrefFor(id: ScreenId, materialId?: string) {
  if (id === "material") {
    return materialId ? `/material/${materialId}` : "/material"
  }

  const href = screenHrefs[id]
  if (
    materialId &&
    (id === "simplify" ||
      id === "tracking" ||
      id === "syllable" ||
      id === "assessment" ||
      id === "comprehension" ||
      id === "reading")
  ) {
    return `${href}?id=${encodeURIComponent(materialId)}`
  }

  return href
}

export function screenFromPath(pathname: string): ScreenId {
  if (pathname === "/" || pathname === "") return "home"
  if (pathname.startsWith("/material")) return "material"

  const match = (Object.entries(screenHrefs) as [ScreenId, string][]).find(
    ([id, href]) => id !== "home" && id !== "material" && pathname === href,
  )

  return match?.[0] ?? "home"
}

const MATERIAL_CHILD: ScreenId[] = [
  "reading",
  "simplify",
  "tracking",
  "syllable",
  "assessment",
  "comprehension",
]

/** Halaman sebelumnya yang masuk akal — tidak mengandalkan history browser. */
export function parentHref(pathname: string, materialId?: string | null): string {
  const screen = screenFromPath(pathname)
  if (MATERIAL_CHILD.includes(screen) && materialId) {
    return hrefFor("material", materialId)
  }
  return hrefFor("home")
}
