import Link from 'next/link';
import type { Metadata } from 'next';
import { Heart, Leaf, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About • Elevated Movements',
  description:
    'Rooted in purpose, strengths-centered, and community-built. Learn about Elevated Movements and our commitment to leadership growth grounded in rest and I.N.T.E.N.T.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Elevated Movements</p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900">
              Rooted in Purpose. Centered on Strengths. Built for Community.
            </h1>
            <p className="text-lg text-slate-700">
              Elevated Movements creates strengths-centered spaces where women of color—and all leaders—grow
              authentically and sustainably.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500 transition"
              >
                Learn More About Our Work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/book-a-call"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
              >
                Book a Discovery Call
              </Link>
            </div>
          </div>
          <div className="mt-10 lg:mt-0 lg:justify-self-end">
            <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-white to-amber-50 shadow-2xl lg:h-80">
              <div className="absolute inset-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-100 shadow-inner" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-amber-200/80 blur-3xl" />
                <div className="absolute h-44 w-44 rounded-full border border-amber-300/70 bg-white/70 shadow-lg" />
                <span className="absolute text-amber-700 font-semibold">EM Brand</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Our Story</p>
            <h2 className="text-3xl font-semibold text-slate-900">Grounded, culturally responsive development</h2>
            <p className="text-slate-700">
              Elevated Movements began as a small circle of women seeking clarity and connection. Today, we deliver
              leadership development, coaching, and team experiences rooted in authenticity, reflection, and
              strengths-centered growth.
            </p>
            <p className="text-slate-700">
              We’ve partnered with SEIU, Boys &amp; Girls Club, and community organizations to build diverse rooms where
              every voice matters and growth is sustainable.
            </p>
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="relative h-72 w-full rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-2xl overflow-hidden">
              <div className="absolute inset-6 rounded-2xl border border-amber-200/30 bg-white/5 backdrop-blur" />
              <div className="absolute top-8 left-8 h-24 w-24 rounded-full bg-amber-500/20 blur-3xl" />
              <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute inset-0 flex items-center justify-center text-white/80 font-semibold">
                EM Collage / Pattern
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Our Philosophy</p>
            <h2 className="text-3xl font-semibold text-slate-900">How we hold leadership and rest</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">We Center Women of Color. We Welcome All.</h3>
              <p className="mt-3 text-slate-700">
                An equity lens that uplifts underrepresented leaders while strengthening collective growth.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Strengths-Centered Leadership</h3>
              <p className="mt-3 text-slate-700">
                We activate what’s already strong, not what needs to be “fixed,” to build confidence and momentum.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Reflection + Action</h3>
              <p className="mt-3 text-slate-700">
                Transformation = clarity + movement. Our frameworks blend both so leaders move with intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
          <div className="relative mb-8 h-72 w-full rounded-3xl bg-gradient-to-br from-amber-200 via-white to-amber-50 shadow-xl lg:mb-0">
            <div className="absolute inset-6 rounded-2xl border border-amber-300/60 bg-white/70" />
            <div className="absolute inset-0 flex items-center justify-center text-amber-700 font-semibold">
              Shria Portrait
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">About the Founder</p>
            <h2 className="text-3xl font-semibold text-slate-900">Meet Shria Tomlinson</h2>
            <p className="text-slate-700">
              Shria is a strengths-centered leadership coach and facilitator with 20+ years of experience helping
              individuals and organizations build capacity, strengthen culture, and lead with purpose.
            </p>
            <Link href="/community#meet-shria" className="inline-flex items-center gap-2 text-amber-700 font-semibold">
              Learn More About Shria
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Our Commitment</p>
          <h2 className="text-3xl font-semibold text-slate-900">What we promise to every leader we serve</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              'Leadership rooted in authenticity',
              'Culturally grounded spaces',
              'Sustainable personal and organizational growth',
              'Tools that create real transformation',
            ].map((pill) => (
              <div
                key={pill}
                className="flex items-center gap-3 rounded-full bg-stone-100 px-4 py-3 text-left text-slate-800"
              >
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
                <span>{pill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center text-white space-y-6">
          <h2 className="text-3xl font-semibold">Ready to Grow With Us?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book-a-call"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 transition"
            >
              Book a Discovery Call
            </Link>
            <Link
              href="/newsletter"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Join Our Email List
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
