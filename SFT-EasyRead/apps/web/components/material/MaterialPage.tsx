"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { demoParagraphs, findMaterial, readingHistory } from "@/lib/mock"
import { ActivityPicker } from "./ActivityPicker"
import { MaterialHeader } from "./MaterialHeader"
import { MaterialNotFound } from "./MaterialNotFound"

export default function MaterialDetail() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === "string" ? params.id : ""
  const known = readingHistory.find((item) => item.id === id)
  const [material, setMaterial] = useState(known)

  useEffect(() => {
    setMaterial(findMaterial(id) ?? known)
  }, [id, known])

  if (!material) return <MaterialNotFound />

  return (
    <div className="space-y-8 animate-[fade-in_300ms_ease-out_both]">
      <MaterialHeader title={material.title} paragraphs={demoParagraphs} />
      <ActivityPicker />
    </div>
  )
}
