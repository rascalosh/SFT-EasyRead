import { getDocuments } from "@repo/web/services/document.service"
import { getCurrentUser } from "@repo/web/proxy"

export default async function Read() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <main>
                <h1>Read Page</h1>
                <p>Please sign in to view documents.</p>
            </main>
        )
    }

    const { data } = await getDocuments(user.id)
    const documents = data ?? []

    return (
        <main>
            <h1>Read Page</h1>

            {documents.length === 0 ? (
                <p>No documents found.</p>
            ) : (
                documents.map((document) => (
                    <article key={document.id}>
                        <h2>{document.title}</h2>
                        <p>{document.original_text}</p>
                    </article>
                ))
            )}
        </main>
    )
}