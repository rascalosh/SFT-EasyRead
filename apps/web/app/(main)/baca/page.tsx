import BacaPage from "@/components/baca/BacaPage"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return <BacaPage documentId={id ?? null} />
}