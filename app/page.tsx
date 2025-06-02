export default function HomePage() {
  return (
    <div>
      <h1>Welcome to AgentFlow Platform</h1>
      <p>AI Agent Management Made Simple</p>
      <div style={{ marginTop: "2rem" }}>
        <a
          href="/dashboard"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
