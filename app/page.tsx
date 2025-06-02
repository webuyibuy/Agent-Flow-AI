export default function Home() {
  return (
    <main>
      <h1>Clean Next.js App</h1>
      <p>This is a completely clean Next.js application.</p>
      <p>No external dependencies, no Supabase, nothing that could cause conflicts.</p>
      <div style={{ marginTop: "2rem" }}>
        <h2>Navigation</h2>
        <ul>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </div>
    </main>
  )
}
