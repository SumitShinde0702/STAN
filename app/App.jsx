import { useEffect, useState } from "react";

const FLOW_STAGES = [
  "Discussing",
  "Commitment Created",
  "Proof Submitted",
  "Nexus Verified",
  "Settlement Released",
];

const LANDING_FLOW_STEPS = [
  {
    name: "Register",
    what: "Seller agent publishes a capability root hash to Nexus. This is a cryptographic fingerprint of what it can do.",
    why: "Buyers discover capabilities without exposing private strategy internals.",
  },
  {
    name: "Encrypt",
    what: "Buyer sends an encrypted task request plus input commitment. Only the intended seller can read the full payload.",
    why: "Prevents scraping, front-running, and leakage of high-value intent.",
  },
  {
    name: "Prove",
    what: "Seller executes off-chain logic and produces a proof artifact tied to the input/output commitments.",
    why: "Execution can remain private while still generating verifiable evidence.",
  },
  {
    name: "Verify",
    what: "Nexus checks proof validity on Starknet and records a verified status on-chain.",
    why: "Shifts trust from claims and reputation to deterministic cryptographic verification.",
  },
  {
    name: "Settle",
    what: "Settlement logic checks verification status and unlocks escrow only if proof is valid.",
    why: "Value transfer is policy-enforced by math: no proof, no payout.",
  },
];

const AGENTIC_ECONOMY_SIGNALS = [
  {
    label: "Macro impact",
    value: "+7% global GDP",
    detail: "Potential uplift over 10 years from generative AI (about $7T).",
    source: "Goldman Sachs Research, 2023",
  },
  {
    label: "Enterprise adoption",
    value: "42% deployed AI",
    detail: "Plus 40% currently exploring/experimenting with AI in large organizations.",
    source: "IBM Global AI Adoption Index, 2024",
  },
  {
    label: "Agent market growth",
    value: "$50.31B by 2030",
    detail: "Global AI agents market projection, with 45.8% CAGR from 2025-2030.",
    source: "Grand View Research, 2025",
  },
];

function Section({ title, children }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function TxLink({ label, hash, url }) {
  if (!hash) return null;
  return (
    <div className="kv">
      <span>{label}</span>
      <a href={url} target="_blank" rel="noreferrer">
        {hash.slice(0, 12)}...{hash.slice(-8)}
      </a>
    </div>
  );
}

function StepRow({ step, idx }) {
  return (
    <div className="step-row">
      <div>
        <strong>
          {idx + 1}. {step.name}
        </strong>
        {step.description ? <p>{step.description}</p> : null}
      </div>
      <code>{step.durationMs} ms</code>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="diagram-wrap">
      <svg viewBox="0 0 980 260" className="diagram" role="img" aria-label="STAN architecture">
        <rect x="20" y="45" width="220" height="160" rx="16" className="node node-bitcoin" />
        <text x="130" y="98" textAnchor="middle" className="node-title">
          Bitcoin L1
        </text>
        <text x="130" y="124" textAnchor="middle" className="node-subtitle">
          Settlement Layer
        </text>

        <rect x="380" y="25" width="220" height="200" rx="16" className="node node-nexus" />
        <text x="490" y="78" textAnchor="middle" className="node-title">
          STAN Nexus
        </text>
        <text x="490" y="104" textAnchor="middle" className="node-subtitle">
          Proof Verification
        </text>
        <text x="490" y="130" textAnchor="middle" className="node-subtitle">
          Capability Registry
        </text>

        <rect x="740" y="45" width="220" height="160" rx="16" className="node node-starknet" />
        <text x="850" y="98" textAnchor="middle" className="node-title">
          Starknet L2
        </text>
        <text x="850" y="124" textAnchor="middle" className="node-subtitle">
          Intelligence Layer
        </text>

        <path d="M240 125 L380 125" className="arrow-line" />
        <polygon points="370,117 380,125 370,133" className="arrow-head" />
        <text x="310" y="109" textAnchor="middle" className="arrow-label">
          release only if verified
        </text>

        <path d="M600 125 L740 125" className="arrow-line" />
        <polygon points="730,117 740,125 730,133" className="arrow-head" />
        <text x="670" y="109" textAnchor="middle" className="arrow-label">
          on-chain verification
        </text>
      </svg>
    </div>
  );
}

function FlowDiagram() {
  const steps = ["Register", "Encrypt", "Prove", "Verify", "Settle"];
  return (
    <div className="flow-diagram">
      {steps.map((step, idx) => (
        <div key={step} className="flow-node">
          <span>{idx + 1}</span>
          <strong>{step}</strong>
        </div>
      ))}
    </div>
  );
}

function ConversationDiagram() {
  return (
    <div className="diagram-wrap">
      <svg viewBox="0 0 980 300" className="diagram" role="img" aria-label="Agent conversation and trust gap">
        <rect x="40" y="56" width="220" height="190" rx="16" className="node node-buyer" />
        <text x="150" y="102" textAnchor="middle" className="node-title">
          Buyer Agent
        </text>
        <text x="150" y="130" textAnchor="middle" className="node-subtitle">
          Sends encrypted request
        </text>

        <rect x="720" y="56" width="220" height="190" rx="16" className="node node-seller" />
        <text x="830" y="102" textAnchor="middle" className="node-title">
          Seller Agent
        </text>
        <text x="830" y="130" textAnchor="middle" className="node-subtitle">
          Runs private strategy
        </text>

        <rect x="380" y="36" width="220" height="228" rx="16" className="node node-nexus" />
        <text x="490" y="88" textAnchor="middle" className="node-title">
          STAN Nexus
        </text>
        <text x="490" y="114" textAnchor="middle" className="node-subtitle">
          Capability root registry
        </text>
        <text x="490" y="138" textAnchor="middle" className="node-subtitle">
          Proof verification
        </text>
        <text x="490" y="162" textAnchor="middle" className="node-subtitle">
          Settlement gate
        </text>

        <path d="M260 110 L380 110" className="arrow-line" />
        <polygon points="370,102 380,110 370,118" className="arrow-head" />
        <text x="320" y="94" textAnchor="middle" className="arrow-label">
          request + commitment
        </text>

        <path d="M600 140 L720 140" className="arrow-line" />
        <polygon points="710,132 720,140 710,148" className="arrow-head" />
        <text x="660" y="124" textAnchor="middle" className="arrow-label">
          challenge to prove
        </text>

        <path d="M720 170 L600 170" className="arrow-line" />
        <polygon points="610,162 600,170 610,178" className="arrow-head" />
        <text x="660" y="196" textAnchor="middle" className="arrow-label">
          proof artifact
        </text>

        <rect x="390" y="218" width="200" height="36" rx="8" className="verdict" />
        <text x="490" y="241" textAnchor="middle" className="verdict-text">
          no proof {"=>"} no payout
        </text>
      </svg>
    </div>
  );
}

function AdoptionBar() {
  const segments = [
    { label: "Deployed", value: 42, className: "seg-deployed" },
    { label: "Exploring", value: 40, className: "seg-exploring" },
    { label: "Not yet", value: 18, className: "seg-notyet" },
  ];
  return (
    <div className="metric-card">
      <h3>Enterprise AI adoption snapshot</h3>
      <p>Large organizations (1000+ employees)</p>
      <div className="stacked-bar" aria-label="Enterprise AI adoption stacked bar">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`stacked-seg ${seg.className}`}
            style={{ width: `${seg.value}%` }}
            title={`${seg.label}: ${seg.value}%`}
          />
        ))}
      </div>
      <div className="metric-legend">
        {segments.map((seg) => (
          <div key={seg.label}>
            <span className={`legend-dot ${seg.className}`} />
            <strong>{seg.value}%</strong> {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentMarketBars() {
  const cagr = 1.458;
  const market2030 = 50.31;
  const market2025 = market2030 / cagr ** 5;
  const points = [2025, 2026, 2027, 2028, 2029, 2030].map((year, idx) => ({
    year,
    value: market2025 * cagr ** idx,
  }));
  const max = points[points.length - 1].value;

  return (
    <div className="metric-card">
      <h3>AI agents market trajectory (illustrative)</h3>
      <p>Using reported CAGR 45.8% to 2030 endpoint ($50.31B)</p>
      <div className="year-bars" aria-label="AI agents market growth bars">
        {points.map((point) => (
          <div className="year-col" key={point.year}>
            <div className="year-value">${point.value.toFixed(1)}B</div>
            <div className="year-bar-track">
              <div className="year-bar-fill" style={{ height: `${(point.value / max) * 100}%` }} />
            </div>
            <div className="year-label">{point.year}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandPage() {
  return (
    <main className="land">
      <section className="land-hero">
        <p className="eyebrow">STARKNET AGENT NEXUS</p>
        <h1>STAN - Proof Before Payment</h1>
        <p className="land-subtitle">
          3-minute presenter page for the Silicon Handshake demo. Scroll section by section while speaking.
        </p>
        <a href="/" className="switch-link">
          Open Live Console
        </a>
      </section>

      <section className="land-card">
        <h2>AI Agentic Economy Is Accelerating</h2>
        <p>
          The next economic layer is software agents transacting with other software agents. The market signal is clear:
          deployment is already mainstreaming, capital is flowing into agent systems, and macro research expects
          productivity-scale upside.
        </p>
        <div className="signal-grid">
          {AGENTIC_ECONOMY_SIGNALS.map((signal) => (
            <article key={signal.label} className="signal-card">
              <p className="signal-label">{signal.label}</p>
              <h3>{signal.value}</h3>
              <p>{signal.detail}</p>
              <p className="source-note">Source: {signal.source}</p>
            </article>
          ))}
        </div>
        <div className="metric-grid">
          <AdoptionBar />
          <AgentMarketBars />
        </div>
      </section>

      <section className="land-card">
        <h2>Core Problem</h2>
        <p>
          In the agent economy, the biggest problem is trust. Agents can claim they ran private strategies, but
          buyers cannot verify execution without exposing proprietary code.
        </p>
        <p>Today, high-value payments still depend on reputation or centralized escrow. That is the trust gap.</p>
      </section>

      <section className="land-card">
        <h2>Why Agent-to-Agent Needs STAN</h2>
        <ConversationDiagram />
        <p>
          STAN inserts a cryptographic referee between buyer and seller agents. Seller logic stays private, but proof
          is public and verifiable.
        </p>
      </section>

      <section className="land-card">
        <h2>System Architecture</h2>
        <p>Bitcoin handles settlement, Starknet handles verification logic, and STAN enforces proof-gated release.</p>
        <ArchitectureDiagram />
      </section>

      <section className="land-card">
        <h2>Silicon Handshake Flow</h2>
        <FlowDiagram />
        <div className="flow-explainer-grid">
          {LANDING_FLOW_STEPS.map((step, idx) => (
            <article key={step.name} className="flow-explainer-card">
              <h3>
                {idx + 1}. {step.name}
              </h3>
              <p>
                <strong>What happens:</strong> {step.what}
              </p>
              <p>
                <strong>Why it matters:</strong> {step.why}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="land-card">
        <h2>Why STAN</h2>
        <div className="pill-row">
          <span>Computational Integrity</span>
          <span>Private Intent Exchange</span>
          <span>Trust-Minimized Settlement</span>
          <span>Bitcoin L1 + Starknet L2</span>
        </div>
      </section>

      <section className="land-card">
        <h2>Logic In One Line</h2>
        <p>
          STAN replaces claim-based trust with proof-based settlement: if execution proof verifies, payout unlocks; if
          proof fails, funds stay locked.
        </p>
      </section>
    </main>
  );
}

function LiveConsole() {
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);
  const [task, setTask] = useState("private-ml-inference for BTC settlement guard");
  const [discussion, setDiscussion] = useState([]);
  const [discussionCommitment, setDiscussionCommitment] = useState("");
  const [discussionSource, setDiscussionSource] = useState("fallback");
  const [autoRunAfterDiscussion, setAutoRunAfterDiscussion] = useState(true);
  const [autoBroadcastBtc, setAutoBroadcastBtc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  async function runLive(payload = {}) {
    const liveTask = payload.task ?? task;
    const liveDiscussion = payload.discussion ?? discussion;
    const liveCommitment = payload.discussionCommitment ?? discussionCommitment;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/live/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: liveTask,
          discussion: liveDiscussion,
          discussionCommitment: liveCommitment,
          autoBroadcastBtc,
        }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "Live run failed");
      setResult(data.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function discussTask() {
    setDiscussionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agents/discuss", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "Discussion failed");
      const nextDiscussion = data.discussion || [];
      const nextCommitment = data.commitment || "";
      setDiscussion(nextDiscussion);
      setDiscussionCommitment(nextCommitment);
      setDiscussionSource(data.source || "fallback");
      if (autoRunAfterDiscussion) {
        await runLive({
          task,
          discussion: nextDiscussion,
          discussionCommitment: nextCommitment,
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDiscussionLoading(false);
    }
  }

  const timeline = result?.timeline ?? { totalDurationMs: 0, steps: [] };
  const hasCommitment = discussionCommitment.length > 0;
  const hasProofSubmission = Boolean(result?.verification?.txHash || result?.proofStatus);
  const nexusVerified = result?.proofStatus === "VERIFIED";
  const settlementReleased = ["RELEASED", "SIGNED_TX_READY", "READY_TO_RELEASE", "BROADCASTED"].includes(
    result?.settlement?.state || "",
  );
  const stageStatus = FLOW_STAGES.map((name, idx) => {
    let status = "pending";
    if (name === "Discussing" && discussionLoading) status = "active";
    if (name === "Discussing" && (hasCommitment || loading || result)) status = "done";
    if (name === "Commitment Created" && hasCommitment) status = "done";
    if (name === "Proof Submitted" && loading) status = "active";
    if (name === "Proof Submitted" && hasProofSubmission) status = "done";
    if (name === "Nexus Verified" && nexusVerified) status = "done";
    if (name === "Settlement Released" && settlementReleased) status = "done";
    return { idx, name, status };
  });

  return (
    <main className="container">
      <header>
        <h1>STAN Live Demo Console</h1>
        <p>Central Nervous System of the Agentic Internet</p>
        <a href="/land" className="switch-link">
          Open Landing Page
        </a>
      </header>

      <Section title="Environment">
        {health ? (
          <>
            <div className="kv">
              <span>Nexus mode</span>
              <code>{health.modes.nexus}</code>
            </div>
            <div className="kv">
              <span>Bitcoin mode</span>
              <code>{health.modes.btc}</code>
            </div>
            <div className="kv">
              <span>Contract</span>
              <code>{health.contractAddress || "not set"}</code>
            </div>
            <div className="kv">
              <span>Account</span>
              <code>{health.accountAddress || "not set"}</code>
            </div>
          </>
        ) : (
          <p>Loading environment...</p>
        )}
      </Section>

      <Section title="Live On-Chain Run">
        <div className="field">
          <label htmlFor="task">Task Prompt</label>
          <input
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe buyer request..."
          />
        </div>
        <div className="button-row">
          <button onClick={discussTask} disabled={discussionLoading || loading}>
            {discussionLoading ? "Discussing..." : "Agent Discussion"}
          </button>
          <button onClick={() => runLive()} disabled={loading || discussionLoading}>
            {loading ? "Running..." : "Run Silicon Handshake"}
          </button>
        </div>
        <label className="toggle-row" htmlFor="auto-run">
          <input
            id="auto-run"
            type="checkbox"
            checked={autoRunAfterDiscussion}
            onChange={(e) => setAutoRunAfterDiscussion(e.target.checked)}
          />
          <span>Auto-run handshake after discussion</span>
        </label>
        <label className="toggle-row" htmlFor="auto-broadcast">
          <input
            id="auto-broadcast"
            type="checkbox"
            checked={autoBroadcastBtc}
            onChange={(e) => setAutoBroadcastBtc(e.target.checked)}
          />
          <span>Auto-broadcast BTC tx after verification (requires BTC mode and UTXO data)</span>
        </label>
        <div className="status-flow">
          {stageStatus.map((stage) => (
            <div key={stage.name} className={`status-pill status-${stage.status}`}>
              {stage.idx + 1}. {stage.name}
            </div>
          ))}
        </div>
        {discussion.length > 0 ? (
          <div className="discussion">
            <div className="kv">
              <span>Discussion source</span>
              <code>{discussionSource}</code>
            </div>
            {discussion.map((msg, idx) => (
              <div key={`${msg.speaker}-${idx}`} className="kv">
                <span>{msg.speaker}</span>
                <code>{msg.message}</code>
              </div>
            ))}
            <div className="kv">
              <span>Discussion commitment</span>
              <code>{discussionCommitment}</code>
            </div>
            <p>Commitment = SHA-256 hash of the full discussion transcript.</p>
          </div>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </Section>

      {result ? (
        <>
          <Section title="Who Verified This?">
            <div className="kv">
              <span>Verifier contract (Nexus)</span>
              <code>{result.runtime.nexusContractAddress || "mock/off-chain"}</code>
            </div>
            <TxLink
              label="Capability Register TX"
              hash={result.registerResult.txHash}
              url={result.registerResult.txUrl}
            />
            <TxLink label="Proof Verify TX" hash={result.verification.txHash} url={result.verification.txUrl} />
            <div className="kv">
              <span>Contract state</span>
              <strong>{result.proofStatus}</strong>
            </div>
          </Section>

          <Section title="Verification Layer">
            <div className="kv">
              <span>Capability root</span>
              <code>{result.registerResult.capabilityRoot}</code>
            </div>
            <div className="kv">
              <span>Proof status</span>
              <strong>{result.proofStatus}</strong>
            </div>
            <TxLink
              label="Register TX"
              hash={result.registerResult.txHash}
              url={result.registerResult.txUrl}
            />
            <TxLink
              label="Proof TX"
              hash={result.verification.txHash}
              url={result.verification.txUrl}
            />
            <p>
              <strong>Register TX</strong> stores your seller capability root on Starknet.{" "}
              <strong>Proof TX</strong> submits the execution proof and marks it verified.
            </p>
            <div className="kv">
              <span>Task used for proof</span>
              <code>{result.taskContext?.task || "n/a"}</code>
            </div>
            <div className="kv">
              <span>Input commitment</span>
              <code>{result.taskContext?.discussionCommitment || "n/a"}</code>
            </div>
            <div className="kv">
              <span>Output commitment</span>
              <code>{result.taskContext?.outputCommitment || "n/a"}</code>
            </div>
          </Section>

          <Section title="Settlement Layer">
            <div className="kv">
              <span>Escrow state</span>
              <strong>{result.settlement.state}</strong>
            </div>
            {result.settlement.p2wshAddress ? (
              <div className="kv">
                <span>BTC escrow address</span>
                <code>{result.settlement.p2wshAddress}</code>
              </div>
            ) : null}
            {result.settlement.releaseTxId ? (
              <div className="kv">
                <span>BTC TxID</span>
                {result.settlement.releaseTxUrl ? (
                  <a href={result.settlement.releaseTxUrl} target="_blank" rel="noreferrer">
                    {result.settlement.releaseTxId.slice(0, 12)}...{result.settlement.releaseTxId.slice(-8)}
                  </a>
                ) : (
                  <code>{result.settlement.releaseTxId}</code>
                )}
              </div>
            ) : null}
            {result.settlement.releaseHint ? <p>{result.settlement.releaseHint}</p> : null}
            {result.settlement.broadcastError ? <p className="error">{result.settlement.broadcastError}</p> : null}
          </Section>

          <Section title="Task Output Artifact">
            <div className="kv">
              <span>Output kind</span>
              <strong>{result.taskOutput?.kind || "n/a"}</strong>
            </div>
            <pre className="json-block">{JSON.stringify(result.taskOutput, null, 2)}</pre>
          </Section>

          <Section title="Step-by-Step Timeline">
            <div className="kv">
              <span>Total flow time</span>
              <code>{timeline.totalDurationMs} ms</code>
            </div>
            {timeline.steps.length === 0 ? <p>Timeline not available in this run.</p> : null}
            {timeline.steps.map((step, idx) => (
              <StepRow key={`${step.name}-${idx}`} step={step} idx={idx} />
            ))}
          </Section>
        </>
      ) : null}
    </main>
  );
}

export default function App() {
  if (window.location.pathname === "/land") {
    return <LandPage />;
  }
  return <LiveConsole />;
}
