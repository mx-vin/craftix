import TopNav from "../../ui/TopNav";

export default function MarketplacePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#8a7866", color: "#544137" }}>
      <TopNav />
      <div style={{ padding: "24px" }}>
        <div
          style={{
            background: "#fceedb",
            borderRadius: "24px",
            padding: "24px",
          }}
        >
          <h1>Marketplace</h1>
          <p>Marketplace page placeholder.</p>
        </div>
      </div>
    </main>
  );
}