import { notFound } from "next/navigation";

import { isEditorialV2Enabled } from "../../lib/editorial-v2/feature-flag";

export default function EditorialV2Page() {
  if (!isEditorialV2Enabled()) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Slice 1 contract shell
        </p>
        <h1 className="mt-3 text-3xl font-bold">Shorts Editorial OS V2</h1>
        <p className="mt-4 leading-7 text-slate-300">
          This inert shell confirms the isolated V2 contract boundary. Actual production capabilities are
          not connected yet.
        </p>
      </section>
    </main>
  );
}
