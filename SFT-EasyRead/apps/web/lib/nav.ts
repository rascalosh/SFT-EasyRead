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
  simplify: "Simplify & Ringkasan",
  tracking: "Multisensory Tracking",
  syllable: "Latihan Kata",
  comprehension: "Reading Comprehension",
  assessment: "Penilaian Membaca",
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
