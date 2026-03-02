import { useEffect, useState } from "react";

const FLOW_STAGES = [
  "Discussing",
  "Commitment Created",
  "Proof Submitted",
  "Nexus Verified",
  "Settlement Released",
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

export default function App() {
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);
  const [task, setTask] = useState("private-ml-inference for BTC settlement guard");
  const [discussion, setDiscussion] = useState([]);
  const [discussionCommitment, setDiscussionCommitment] = useState("");
  const [discussionSource, setDiscussionSource] = useState("fallback");
  const [autoRunAfterDiscussion, setAutoRunAfterDiscussion] = useState(true);
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
  const settlementReleased = ["RELEASED", "SIGNED_TX_READY", "READY_TO_RELEASE"].includes(
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
