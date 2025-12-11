import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Users, Compass, Sun, Heart, Calendar, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Programs & Services | Elevated Movements',
  description: 'Strengths-centered programs and services for individual leaders, teams, and mission-driven organizations.',
};

const overviewCards = [
  {
    title: 'Leadership Workshops',
    desc: 'Experiential, strengths-centered sessions tailored to your group’s needs.',
    href: '#leadership-workshops',
  },
  {
    title: 'Cohort-Based Leadership Programs',
    desc: 'Peer-powered growth series that blend reflection, accountability, and real-world application.',
    href: '#cohort-programs',
  },
  {
    title: 'Strengths-Centered Coaching',
    desc: '1:1 and group coaching to deepen clarity, confidence, and values-aligned action.',
    href: '#strengths-coaching',
  },
  {
    title: 'Organizational Retreats',
    desc: 'Transformational spaces for teams to reset, reconnect, and realign around purpose and strengths.',
    href: '#organizational-retreats',
  },
  {
    title: 'Community Programs for Women of Color',
    desc: 'Sisterhood circles, workshops, and gatherings centering women of color.',
    href: '#community-programs',
  },
  {
    title: 'Digital Tools & Resources',
    desc: 'Downloadable guides, intentionality frameworks, and reflection tools to support ongoing growth.',
    href: '#digital-tools',
  },
];

type ProgramBlock = {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
  icon: React.ElementType;
  dark?: boolean;
};

const programBlocks: ProgramBlock[] = [
  {
    id: 'leadership-workshops',
    title: 'Leadership Workshops',
    desc: 'Our workshops are experiential, interactive, and tailored to your group.',
    bullets: ['Strengths-centered leadership', 'Actionable tools and practices', 'Customizable for team needs'],
    icon: Users,
  },
  {
    id: 'cohort-programs',
    title: 'Cohort-Based Leadership Programs',
    desc: 'Peer-powered growth experiences for emerging leaders, staff teams, and youth leaders.',
    bullets: ['Peer-powered accountability', 'Reflective leadership practices', 'Sustainable habit building'],
    icon: Calendar,
  },
  {
    id: 'strengths-coaching',
    title: 'Strengths-Centered Coaching',
    desc: 'Coaching spaces designed to support clarity, confidence, and aligned decision-making.',
    bullets: ['1:1 coaching for leaders and managers', 'Emerging leader support', 'Clarity + confidence + values alignment'],
    icon: Compass,
  },
  {
    id: 'organizational-retreats',
    title: 'Organizational Retreats',
    desc: 'Transformational experiences to help teams pause, recalibrate, and move forward together.',
    bullets: ['Reconnect teams', 'Strengthen communication', 'Align on purpose and values'],
    icon: Sun,
  },
  {
    id: 'community-programs',
    title: 'Community Programs for Women of Color',
    desc: 'Sisterhood circles, workshops, and gatherings created to support reflection, clarity, healing, purpose, and leadership.',
    bullets: ['Sisterhood circles', 'Purpose + clarity workshops', 'Reflection and growth gatherings'],
    icon: Heart,
    dark: true,
  },
  {
    id: 'digital-tools',
    title: 'Digital Tools & Resources',
    desc: 'Self-paced support to keep growth going between sessions.',
    bullets: ['Downloadable guides', 'Intentionality frameworks', 'Strengths-centered reflection tools'],
    icon: Download,
  },
];

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center space-y-6">
          <h1 className="text-4xl font-semibold leading-tight">
            Programs and Services Centered on <span className="text-amber-500">Strengths, Purpose, and Community.</span>
          </h1>
          <p className="text-lg text-white/85">
            Choose the pathway that aligns with your leadership, team, or organizational goals.
          </p>
          <div className="flex justify-center">
            <Link
              href="/book-a-call"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 transition"
            >
              Book a Discovery Call
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Programs &amp; Services</p>
            <h2 className="text-3xl font-semibold text-slate-900">Find the right fit for your growth</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {overviewCards.map(({ title, desc, href }) => (
              <div
                key={title}
                className="relative rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-amber-500" />
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-slate-700">{desc}</p>
                <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed program blocks */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
          {programBlocks.map(({ id, title, desc, bullets, icon: Icon, dark }) => (
            <div
              key={id}
              id={id}
              className={`rounded-2xl border-l-4 p-6 shadow-sm ${
                dark
                  ? 'border-amber-400 bg-slate-900 text-white'
                  : 'border-amber-500 bg-stone-50 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    dark ? 'bg-amber-200/20 text-amber-200' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
              </div>
              <p className={`mt-3 ${dark ? 'text-white/85' : 'text-slate-700'}`}>{desc}</p>
              <ul className="mt-4 space-y-2">
                {bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${dark ? 'bg-amber-300' : 'bg-amber-500'}`}
                    />
                    <span className={dark ? 'text-white/90' : 'text-slate-800'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-semibold text-slate-900">Your Growth Starts Here.</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book-a-call"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 transition"
            >
              Book a Discovery Call
            </Link>
            <Link
              href="/newsletter"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
            >
              Join Our Email List
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
