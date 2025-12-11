import Link from 'next/link';
import type { Metadata } from 'next';
import { Zap, Shield, BookOpen, LayoutGrid, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corporate Partnerships | Elevated Movements',
  description:
    'Strengths-centered leadership development, workshops, and cohorts for mission-driven organizations and teams.',
};

const whyBlocks = [
  {
    title: 'Strengths-Centered Leadership',
    text: 'We help teams identify and operate from their strengths—improving communication, collaboration, and decision-making.',
    icon: Zap,
  },
  {
    title: 'Equity-Informed Facilitation',
    text: 'Our sessions are culturally responsive, uplifting underrepresented voices while strengthening collaboration for everyone.',
    icon: Shield,
  },
  {
    title: 'High-Impact Learning Tools',
    text: 'Participants leave with practical frameworks and tools they can use immediately—not just theory.',
    icon: BookOpen,
  },
  {
    title: 'Tailored Organizational Solutions',
    text: 'We design workshops, cohorts, and retreats that align with your goals, culture, and context.',
    icon: LayoutGrid,
  },
];

const offerings = [
  {
    title: 'Leadership Workshops',
    desc: 'Interactive sessions focused on communication, culture, and strengths-centered leadership.',
  },
  {
    title: 'Cohort-Based Programs',
    desc: 'Multi-week leadership cohorts that blend reflection, peer accountability, and real-world application.',
  },
  {
    title: 'Organizational Retreats',
    desc: 'Reset, reconnect, and realign your team around purpose, values, and strengths.',
  },
  {
    title: 'Executive & Emerging Leader Coaching',
    desc: '1:1 strengths-centered coaching for executives, managers, and emerging leaders.',
  },
];

const processSteps = [
  {
    title: 'Discovery Conversation',
    desc: 'We listen deeply to understand your goals, challenges, and context.',
  },
  {
    title: 'Custom Design',
    desc: 'We tailor sessions, cohorts, or retreats to your culture and priorities.',
  },
  {
    title: 'Strengths-Centered Facilitation',
    desc: 'We deliver immersive, interactive experiences—not passive trainings.',
  },
  {
    title: 'Integration & Follow-Up',
    desc: 'We help you translate insights into sustainable habits and practices.',
  },
];

const outcomes = [
  'Improved communication',
  'Higher retention',
  'Increased psychological safety',
  'Leadership clarity',
  'Strengths-centered culture alignment',
  'DEI-aligned growth pathways',
];

export default function CorporatePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Corporate Partnerships</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Leadership That Elevates Teams and Transforms Culture.
          </h1>
          <p className="text-lg text-white/80">
            Strengths-centered leadership development, workshops, and cohorts for mission-driven organizations.
          </p>
          <div className="flex justify-center">
            <Link
              href="/book-a-call?context=corporate"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 transition"
            >
              Request a Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Logo bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-8 space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Trusted by organizations such as</p>
          <p className="text-slate-700">SEIU, Boys &amp; Girls Club, and community-based agencies.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
            {['SEIU', 'Boys & Girls Club', 'Community-Based Agencies', 'Nonprofits'].map((name) => (
              <span key={name} className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Why Partner With EM</p>
            <h2 className="text-3xl font-semibold text-slate-900">Built for mission-driven teams</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {whyBlocks.map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Corporate Offerings</p>
            <h2 className="text-3xl font-semibold text-slate-900">Options tailored to your organization</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {offerings.map(({ title, desc }, idx) => {
              const borderClass = idx % 2 === 0 ? 'border-amber-500' : 'border-slate-900';
              return (
                <div key={title} className={`rounded-2xl border-l-4 ${borderClass} bg-white p-6 shadow-sm`}>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-3 text-slate-700">{desc}</p>
                  <Link href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                    Learn More →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Process</p>
            <h2 className="text-3xl font-semibold text-slate-900">How we partner with your team</h2>
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-4">
            {processSteps.map(({ title, desc }, idx) => (
              <div key={title} className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="text-slate-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-6">
          <h2 className="text-3xl font-semibold">Our Work Strengthens Your Organization Through:</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((col) => (
              <ul key={col} className="space-y-2 text-white/90">
                {outcomes.slice(col * 2, col * 2 + 2).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-semibold text-slate-900">Let’s Build Your Next Level of Leadership.</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book-a-call?context=corporate"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 transition"
            >
              Book a Corporate Consultation
            </Link>
            <Link
              href="/downloads/corporate-overview.pdf"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              Download Our Corporate Overview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
