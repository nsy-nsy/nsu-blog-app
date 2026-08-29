import { PostCard } from "../components/PostCard";
import type { HomeSettings, Page, Post } from "../types";

export function HomePage({ homeSettings, onNavigate, onOpenPost, posts }: { homeSettings: HomeSettings; onNavigate: (page: Page) => void; onOpenPost: (id: string) => void; posts: Post[] }) {
  const latestPosts = posts.slice(0, homeSettings.latestCount);
  const sections = {
    hero: (
      <section key="hero" className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-5 py-12 md:px-8 md:py-20">
        <div className="col-span-12 flex flex-col justify-center md:col-span-5">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{homeSettings.eyebrow}</p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">{homeSettings.title}</h1>
          <p className="mt-6 max-w-xl text-[15px] leading-8 text-zinc-700 dark:text-zinc-300">{homeSettings.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-zinc-950" type="button" onClick={() => onNavigate("posts")}>
              {homeSettings.primaryButtonLabel}
            </button>
            <button className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => onNavigate("write")}>
              {homeSettings.secondaryButtonLabel}
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <img className="h-full min-h-72 w-full rounded-xl object-cover shadow-2xl shadow-zinc-200 dark:shadow-black/50" src={homeSettings.heroImage} alt={homeSettings.heroImageAlt} />
        </div>
      </section>
    ),
    features: (
      <section className="border-y border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-8 text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:px-8">
          {homeSettings.features
            .filter((feature) => feature.visible)
            .map((feature) => (
              <div key={feature.id} className="col-span-12 md:col-span-4">
                <p className="font-black text-zinc-950 dark:text-white">{feature.title}</p>
                <p className="mt-2">{feature.body}</p>
              </div>
            ))}
        </div>
      </section>
    ),
    latest: (
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-5 px-5 py-14 md:px-8">
        <div className="col-span-12 mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{homeSettings.latestEyebrow}</p>
          <h2 className="mt-3 text-2xl font-black md:text-[28px]">{homeSettings.latestTitle}</h2>
        </div>
        {latestPosts.map((post) => (
          <PostCard key={post.id} className="col-span-12 md:col-span-6 xl:col-span-4" post={post} onOpenPost={onOpenPost} />
        ))}
      </section>
    ),
  };

  return <>{homeSettings.sectionOrder.map((sectionId) => sections[sectionId])}</>;
}
