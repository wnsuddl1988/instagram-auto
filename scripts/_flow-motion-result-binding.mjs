export const FLOW_MOTION_RESULT_BINDING_VERSION = "money_shorts_flow_motion_result_binding_v1";

export async function collectPromptBoundFlowResultCandidates(page, expectedPrompt, approvalCardToken = null) {
  const prompt = String(expectedPrompt ?? "").replace(/\s+/g, " ").trim();
  return page.locator('a[href*="/edit/"]').evaluateAll((elements, args) => {
    const normalizedText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const hasExactPromptNode = (root) => {
      const nodes = [root, ...root.querySelectorAll("*")];
      return nodes.some((node) => {
        if (normalizedText(node.textContent) !== args.exactPrompt) return false;
        return ![...node.children].some((child) => normalizedText(child.textContent) === args.exactPrompt);
      });
    };
    return elements.map((anchor) => {
      const attemptScope = args.approvalCardToken
        ? anchor.closest(`[data-flow-motion-approval-card="${args.approvalCardToken}"]`)
        : null;
      let current = anchor;
      let scope = null;
      for (let depth = 0; current && depth < 14; depth += 1, current = current.parentElement) {
        const links = [...new Set([...current.querySelectorAll('a[href*="/edit/"]')]
          .map((element) => element.href)
          .filter(Boolean))];
        if (links.length === 1 && hasExactPromptNode(current) && current.querySelectorAll("video").length > 0) {
          scope = current;
          break;
        }
      }
      return {
        href: anchor.href,
        exactPromptMatches: scope !== null,
        attemptCardMatches: attemptScope !== null,
        scopeLinkCount: attemptScope
          ? new Set([...attemptScope.querySelectorAll('a[href*="/edit/"]')].map((element) => element.href)).size
          : scope ? new Set([...scope.querySelectorAll('a[href*="/edit/"]')].map((element) => element.href)).size : 0,
        videoCount: attemptScope?.querySelectorAll("video").length ?? scope?.querySelectorAll("video").length ?? 0,
        observedBy: "exact_prompt_card_new_link",
      };
    });
  }, { exactPrompt: prompt, approvalCardToken });
}

export function parseExactFlowResultUrl(value, projectUrl) {
  let candidate;
  let project;
  try {
    candidate = new URL(String(value ?? ""));
    project = new URL(String(projectUrl ?? ""));
  } catch {
    return null;
  }
  const projectPath = project.pathname.replace(/\/+$/, "");
  const resultPrefix = `${projectPath}/edit/`;
  if (candidate.origin !== project.origin || candidate.search || candidate.hash ||
      !candidate.pathname.startsWith(resultPrefix)) return null;
  const resultPath = candidate.pathname.slice(resultPrefix.length).replace(/\/+$/, "");
  if (resultPath.includes("/")) return null;
  const providerResultId = resultPath;
  if (!/^[a-zA-Z0-9-]{8,}$/.test(providerResultId)) return null;
  candidate.pathname = `${resultPrefix}${providerResultId}`;
  candidate.search = "";
  candidate.hash = "";
  return {
    schemaVersion: FLOW_MOTION_RESULT_BINDING_VERSION,
    editUrl: candidate.href.replace(/\/$/, ""),
    providerResultId,
  };
}

export async function inspectExactAttemptMarkerResultCandidates(
  page,
  expectedProviderPrompt,
  baselineHrefs,
  projectUrl,
  options = {},
) {
  const exactPrompt = String(expectedProviderPrompt ?? "").replace(/\s+/g, " ").trim();
  const maxNewCandidates = Number(options.maxNewCandidates ?? 4);
  const probeTimeoutMs = Number(options.probeTimeoutMs ?? 12_000);
  if (!exactPrompt || !Number.isInteger(maxNewCandidates) || maxNewCandidates < 1 || maxNewCandidates > 4) {
    throw new Error("flow_result_marker_probe_contract_invalid");
  }
  const baseline = new Set((baselineHrefs ?? [])
    .map((href) => parseExactFlowResultUrl(href, projectUrl)?.editUrl)
    .filter(Boolean));
  const currentHrefs = await page.locator('a[href*="/edit/"]').evaluateAll((elements) => [...new Set(elements
    .map((element) => element.href)
    .filter(Boolean))]);
  const newBindings = new Map();
  for (const href of currentHrefs) {
    const binding = parseExactFlowResultUrl(href, projectUrl);
    if (binding && !baseline.has(binding.editUrl)) newBindings.set(binding.editUrl, binding);
  }
  if (newBindings.size > maxNewCandidates) {
    throw new Error(`flow_result_marker_probe_candidate_limit:${newBindings.size}`);
  }

  const candidates = [];
  for (const binding of newBindings.values()) {
    const probePage = await page.context().newPage();
    try {
      await probePage.goto(binding.editUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const deadline = Date.now() + probeTimeoutMs;
      let exactPromptMatches = false;
      let videoCount = 0;
      while (Date.now() < deadline) {
        const direct = parseExactFlowResultUrl(probePage.url(), projectUrl);
        if (!direct || direct.providerResultId !== binding.providerResultId) break;
        exactPromptMatches = await probePage.locator("body").evaluate((root, expectedPrompt) => {
          const normalizedText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
          const nodes = [root, ...root.querySelectorAll("*")];
          return nodes.some((node) => {
            if (normalizedText(node.textContent) !== expectedPrompt) return false;
            return ![...node.children].some((child) => normalizedText(child.textContent) === expectedPrompt);
          });
        }, exactPrompt).catch(() => false);
        videoCount = await probePage.locator("video").count().catch(() => 0);
        if (exactPromptMatches && videoCount === 1) break;
        await probePage.waitForTimeout(500);
      }
      candidates.push({
        href: binding.editUrl,
        exactPromptMatches,
        attemptCardMatches: false,
        scopeLinkCount: 1,
        videoCount,
        observedBy: "exact_attempt_edit_page_probe",
      });
    } finally {
      await probePage.close().catch(() => {});
    }
  }
  return candidates;
}

export function selectExactNewFlowResult(candidates, baselineHrefs, projectUrl) {
  const baseline = new Set((baselineHrefs ?? [])
    .map((href) => parseExactFlowResultUrl(href, projectUrl)?.editUrl)
    .filter(Boolean));
  const eligible = (candidates ?? []).filter((candidate) =>
    candidate?.scopeLinkCount === 1 && candidate?.videoCount >= 1 &&
    (candidate?.attemptCardMatches === true || candidate?.exactPromptMatches === true));
  const attemptBound = eligible.filter((candidate) => candidate.attemptCardMatches === true);
  const pool = attemptBound.length > 0 ? attemptBound : eligible.filter((candidate) => candidate.exactPromptMatches === true);
  const unique = new Map();
  for (const candidate of pool) {
    const parsed = parseExactFlowResultUrl(candidate.href, projectUrl);
    if (!parsed || baseline.has(parsed.editUrl)) continue;
    unique.set(parsed.editUrl, {
      ...parsed,
      observedBy: candidate.observedBy === "same_page_navigation"
        ? "same_page_navigation"
        : candidate.observedBy === "exact_attempt_edit_page_probe"
          ? "exact_attempt_edit_page_probe"
        : candidate.attemptCardMatches === true
          ? "exact_approval_card_new_link"
          : "exact_prompt_card_new_link",
    });
  }
  const bindings = [...unique.values()];
  if (bindings.length === 0) return { state: "waiting", binding: null };
  if (bindings.length > 1) {
    return {
      state: "ambiguous",
      binding: null,
      candidateResultIds: bindings.map((binding) => binding.providerResultId),
    };
  }
  return { state: "ready", binding: bindings[0] };
}
