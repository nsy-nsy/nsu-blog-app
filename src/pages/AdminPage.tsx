import { type ChangeEvent, type ReactNode, useRef } from "react";
import { ArrowDown, ArrowUp, ImageIcon, RotateCcw, Save, Settings, Upload } from "lucide-react";
import type { HomeFeature, HomeSectionId, HomeSettings } from "../types";

type AdminPageProps = {
  homeSettings: HomeSettings;
  message: string;
  onHomeSettingsChange: (settings: HomeSettings) => void;
  onResetHomeSettings: () => void;
  onSaveHomeSettings: () => void;
};

const sectionLabels: Record<HomeSectionId, string> = {
  hero: "상단 메인 영역",
  features: "소개 문구 3칸",
  latest: "최신글",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

export function AdminPage({ homeSettings, message, onHomeSettingsChange, onResetHomeSettings, onSaveHomeSettings }: AdminPageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof HomeSettings>(key: K, value: HomeSettings[K]) {
    onHomeSettingsChange({ ...homeSettings, [key]: value });
  }

  function updateFeature(id: string, value: Partial<HomeFeature>) {
    update(
      "features",
      homeSettings.features.map((feature) => (feature.id === id ? { ...feature, ...value } : feature)),
    );
  }

  function moveSection(sectionId: HomeSectionId, direction: -1 | 1) {
    const currentIndex = homeSettings.sectionOrder.indexOf(sectionId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= homeSettings.sectionOrder.length) return;

    const nextOrder = [...homeSettings.sectionOrder];
    const [item] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(nextIndex, 0, item);
    update("sectionOrder", nextOrder);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const src = await fileToDataUrl(file);
    onHomeSettingsChange({
      ...homeSettings,
      heroImage: src,
      heroImageAlt: file.name.replace(/\.[^.]+$/, "") || homeSettings.heroImageAlt,
    });
  }

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12 md:col-span-4">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
          <Settings size={15} />
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">메인페이지 관리</h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          로그인한 관리자만 메인 문구, 이미지, 소개 섹션, 최신글 노출 개수와 배치를 수정할 수 있습니다.
        </p>
      </div>

      <div className="col-span-12 grid gap-5 md:col-span-8">
        <Panel title="상단 메인 영역">
          <Field label="작은 제목">
            <input className="admin-input" value={homeSettings.eyebrow} maxLength={80} onChange={(event) => update("eyebrow", event.target.value)} />
          </Field>
          <Field label="큰 제목">
            <input className="admin-input" value={homeSettings.title} maxLength={80} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="소개 문구">
            <textarea className="admin-input min-h-28 resize-y leading-7" value={homeSettings.description} maxLength={280} onChange={(event) => update("description", event.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="첫 번째 버튼">
              <input className="admin-input" value={homeSettings.primaryButtonLabel} maxLength={24} onChange={(event) => update("primaryButtonLabel", event.target.value)} />
            </Field>
            <Field label="두 번째 버튼">
              <input className="admin-input" value={homeSettings.secondaryButtonLabel} maxLength={24} onChange={(event) => update("secondaryButtonLabel", event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3">
            <span className="text-sm font-black">메인 이미지</span>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <img className="aspect-[16/9] w-full rounded-md object-cover" src={homeSettings.heroImage} alt={homeSettings.heroImageAlt} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-black dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => imageInputRef.current?.click()}>
                <Upload size={16} />
                이미지 업로드
              </button>
              <input ref={imageInputRef} className="hidden" type="file" accept="image/*" onChange={handleImageChange} />
              <Field label="이미지 설명">
                <input className="admin-input" value={homeSettings.heroImageAlt} maxLength={80} onChange={(event) => update("heroImageAlt", event.target.value)} />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="소개 문구">
          <div className="grid gap-3">
            {homeSettings.features.map((feature) => (
              <div key={feature.id} className="grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <label className="inline-flex items-center gap-2 text-sm font-black">
                  <input className="size-4 accent-emerald-600" type="checkbox" checked={feature.visible} onChange={(event) => updateFeature(feature.id, { visible: event.target.checked })} />
                  화면에 표시
                </label>
                <Field label="제목">
                  <input className="admin-input" value={feature.title} maxLength={40} onChange={(event) => updateFeature(feature.id, { title: event.target.value })} />
                </Field>
                <Field label="본문">
                  <textarea className="admin-input min-h-20 resize-y leading-7" value={feature.body} maxLength={160} onChange={(event) => updateFeature(feature.id, { body: event.target.value })} />
                </Field>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="최신글">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="작은 제목">
              <input className="admin-input" value={homeSettings.latestEyebrow} maxLength={40} onChange={(event) => update("latestEyebrow", event.target.value)} />
            </Field>
            <Field label="큰 제목">
              <input className="admin-input" value={homeSettings.latestTitle} maxLength={40} onChange={(event) => update("latestTitle", event.target.value)} />
            </Field>
          </div>
          <Field label="보여줄 글 개수">
            <input className="admin-input" type="number" min={1} max={12} value={homeSettings.latestCount} onChange={(event) => update("latestCount", Math.min(12, Math.max(1, Number(event.target.value) || 1)))} />
          </Field>
        </Panel>

        <Panel title="배치 순서">
          <div className="grid gap-2">
            {homeSettings.sectionOrder.map((sectionId, index) => (
              <div key={sectionId} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="font-black">{sectionLabels[sectionId]}</span>
                <span className="flex gap-1">
                  <button className="admin-icon-button" type="button" onClick={() => moveSection(sectionId, -1)} disabled={index === 0} aria-label={`${sectionLabels[sectionId]} 위로 이동`}>
                    <ArrowUp size={16} />
                  </button>
                  <button className="admin-icon-button" type="button" onClick={() => moveSection(sectionId, 1)} disabled={index === homeSettings.sectionOrder.length - 1} aria-label={`${sectionLabels[sectionId]} 아래로 이동`}>
                    <ArrowDown size={16} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-xl shadow-zinc-200/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/40">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">{message || "변경 후 저장하면 메인페이지에 바로 반영됩니다."}</p>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-black dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={onResetHomeSettings}>
              <RotateCcw size={16} />
              기본값
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-zinc-950" type="button" onClick={onSaveHomeSettings}>
              <Save size={16} />
              저장
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      {children}
    </label>
  );
}
