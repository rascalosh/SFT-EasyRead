import { createClient } from "@repo/db/server"
import { redirect } from "next/navigation"



export default async function Read() { 
    const response = await fetch("/api/documents")
    const documents = await response.json()

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