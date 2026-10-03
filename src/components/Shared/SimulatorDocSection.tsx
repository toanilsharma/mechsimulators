import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SimulatorId } from '../../types/common';
import {
  BookOpen,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Layers,
  FileCheck2,
  ListChecks,
  HelpCircle,
} from 'lucide-react';

export interface DocEquation {
  title: string;
  formula: string;
  variables: string;
  standardRef: string;
}

export interface DocParam {
  name: string;
  symbol: string;
  unit: string;
  description: string;
}

export interface DocOutput {
  name: string;
  symbol: string;
  unit: string;
  threshold: string;
  description: string;
}

export interface DocStandard {
  code: string;
  title: string;
  relevantSection: string;
}

export interface DocExample {
  title: string;
  scenario: string;
  given: { label: string; value: string }[];
  steps: { step: string; formula: string; substitution: string; result: string }[];
  conclusion: string;
}

export interface DocFaq {
  question: string;
  answer: string;
}

export interface DocRelatedTool {
  id: SimulatorId;
  title: string;
  description: string;
  standard: string;
}

export interface SimulatorDocSectionProps {
  simulatorId: SimulatorId;
  h1Title: string;
  summary: string;
  howItWorks: string[];
  inputs: DocParam[];
  outputs: DocOutput[];
  equations: DocEquation[];
  standards: DocStandard[];
  limitations: string[];
  exampleCalculation: DocExample;
  faqs: DocFaq[];
  relatedTools: DocRelatedTool[];
}

export const SimulatorDocSection: React.FC<SimulatorDocSectionProps> = ({
  simulatorId,
  h1Title,
  summary,
  howItWorks,
  inputs,
  outputs,
  equations,
  standards,
  limitations,
  exampleCalculation,
  faqs,
  relatedTools,
}) => {
  const { navigateToSimulator } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'equations' | 'example' | 'faq'>('overview');

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <article
      id={`engineering-docs-${simulatorId}`}
      className="mt-8 rounded-sm bg-[#161b22] border border-[#30363d] p-5 sm:p-8 flex flex-col gap-8 shadow-sm"
      aria-label={`Engineering documentation for ${h1Title}`}
    >
      {/* 1. Header & Summary */}
      <header className="border-b border-[#30363d] pb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#f27d26]">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Technical Engineering Documentation & Standard Reference
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-mono uppercase tracking-tight">
          {h1Title}
        </h1>
        <p className="text-xs sm:text-sm text-[#d1d5db] font-sans leading-relaxed max-w-4xl">
          {summary}
        </p>

        {/* Tab Navigation for Documentation */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'overview'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            How It Works & Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('equations')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'equations'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            Governing Equations ({equations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('example')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'example'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            Worked Example Problem
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'faq'
                ? 'bg-[#f27d26] text-black font-bold'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            Module FAQ ({faqs.length})
          </button>
        </div>
      </header>

      {/* 2. TAB: Overview (How it works, Inputs, Outputs, Standards, Limitations) */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* How It Works Section */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#f27d26]" />
              How It Works & Physical Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {howItWorks.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-sm bg-[#0d1117] border border-[#30363d] flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-sm bg-[#161b22] border border-[#30363d] text-[#f27d26] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-[#8b949e] font-sans leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Inputs & Outputs Data Dictionary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs Table */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#f27d26]" />
                Primary Engineering Inputs
              </h2>
              <div className="overflow-x-auto rounded-sm border border-[#30363d] bg-[#0d1117]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161b22] text-[#8b949e] font-mono uppercase text-[10px] border-b border-[#30363d]">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Symbol / Unit</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]/50 font-sans text-[#d1d5db]">
                    {inputs.map((inp, i) => (
                      <tr key={i} className="hover:bg-[#161b22]/50">
                        <td className="p-2.5 font-medium text-white">{inp.name}</td>
                        <td className="p-2.5 font-mono text-[#f27d26] whitespace-nowrap">
                          {inp.symbol} <span className="text-[#8b949e]">({inp.unit})</span>
                        </td>
                        <td className="p-2.5 text-[#8b949e] text-[11px] leading-relaxed">{inp.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Outputs Table */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#38bdf8]" />
                Calculated Engineering Outputs
              </h2>
              <div className="overflow-x-auto rounded-sm border border-[#30363d] bg-[#0d1117]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161b22] text-[#8b949e] font-mono uppercase text-[10px] border-b border-[#30363d]">
                    <tr>
                      <th className="p-2.5">Output</th>
                      <th className="p-2.5">Symbol / Unit</th>
                      <th className="p-2.5">Threshold / Criterion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]/50 font-sans text-[#d1d5db]">
                    {outputs.map((out, i) => (
                      <tr key={i} className="hover:bg-[#161b22]/50">
                        <td className="p-2.5 font-medium text-white">{out.name}</td>
                        <td className="p-2.5 font-mono text-[#38bdf8] whitespace-nowrap">
                          {out.symbol} <span className="text-[#8b949e]">({out.unit})</span>
                        </td>
                        <td className="p-2.5 text-[11px] leading-relaxed">
                          <span className="font-mono text-[#f27d26] block font-semibold">{out.threshold}</span>
                          <span className="text-[#8b949e]">{out.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Standards & Limitations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standards Referenced */}
            <section className="p-5 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs sm:text-sm uppercase">
                <ShieldCheck className="w-4 h-4 text-[#3fb950]" />
                Governing Industry Standards
              </div>
              <ul className="space-y-3 font-sans text-xs">
                {standards.map((std, i) => (
                  <li key={i} className="flex flex-col gap-0.5 border-b border-[#30363d]/40 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#38bdf8]">{std.code}</span>
                      <span className="font-mono text-[10px] text-[#8b949e]">{std.relevantSection}</span>
                    </div>
                    <span className="text-[#d1d5db]">{std.title}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Assumptions and Limitations */}
            <section className="p-5 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs sm:text-sm uppercase">
                <AlertTriangle className="w-4 h-4 text-[#d29922]" />
                Engineering Scope & Limitations
              </div>
              <ul className="space-y-2 font-sans text-xs text-[#8b949e]">
                {limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#f27d26] font-mono mt-0.5">•</span>
                    <span className="leading-relaxed">{lim}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* 3. TAB: Governing Equations */}
      {activeTab === 'equations' && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#f27d26]" />
              Mathematical Derivations & Code Formulations
            </h2>
            <span className="text-xs font-mono text-[#8b949e]">
              Standardized Physics Solvers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equations.map((eq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-white text-xs sm:text-sm uppercase">
                    {eq.title}
                  </h3>
                  <span className="font-mono text-[10px] text-[#f27d26] bg-[#161b22] px-2 py-0.5 rounded-sm border border-[#30363d]">
                    {eq.standardRef}
                  </span>
                </div>

                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-sm font-mono text-xs sm:text-sm text-[#f27d26] font-bold break-all">
                  {eq.formula}
                </div>

                <div className="text-[11px] font-sans text-[#8b949e] leading-relaxed">
                  <span className="font-mono font-semibold text-[#d1d5db] block mb-1">Where:</span>
                  {eq.variables}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. TAB: Worked Example Calculation */}
      {activeTab === 'example' && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#f27d26]" />
              {exampleCalculation.title}
            </h2>
            <span className="text-xs font-mono text-[#3fb950] bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded-sm">
              Verified Benchmark
            </span>
          </div>

          <div className="p-4 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-3">
            <p className="text-xs sm:text-sm text-[#d1d5db] font-sans leading-relaxed">
              <span className="font-mono font-bold text-white uppercase block mb-1">Problem Scenario:</span>
              {exampleCalculation.scenario}
            </p>

            {/* Given Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 border-t border-[#30363d]/60">
              {exampleCalculation.given.map((g, i) => (
                <div key={i} className="p-2 bg-[#161b22] rounded-sm border border-[#30363d]">
                  <span className="text-[10px] font-mono text-[#8b949e] block">{g.label}</span>
                  <span className="text-xs font-mono text-[#f27d26] font-bold">{g.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step by Step Solution */}
          <div className="space-y-3">
            {exampleCalculation.steps.map((st, i) => (
              <div
                key={i}
                className="p-4 rounded-sm bg-[#0d1117] border border-[#30363d] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white uppercase">
                    Step {i + 1}: {st.step}
                  </span>
                  <span className="text-xs font-mono text-[#38bdf8] font-bold">
                    Result = {st.result}
                  </span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-sm border border-[#30363d] font-mono text-xs text-[#8b949e]">
                  Formula: <span className="text-[#f27d26] font-semibold">{st.formula}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-sm border border-[#30363d] font-mono text-xs text-[#d1d5db]">
                  Substitution: <span className="text-[#3fb950] font-semibold">{st.substitution}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Conclusion */}
          <div className="p-4 rounded-sm bg-[#0d1117] border border-[#3fb950]/50 text-xs sm:text-sm font-sans text-[#d1d5db]">
            <span className="font-mono font-bold text-[#3fb950] uppercase block mb-1">Engineering Assessment Outcome:</span>
            {exampleCalculation.conclusion}
          </div>
        </section>
      )}

      {/* 5. TAB: Module FAQs */}
      {activeTab === 'faq' && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#f27d26]" />
              Engineering Frequently Asked Questions
            </h2>
            <span className="text-xs font-mono text-[#8b949e]">
              Field Principles & Code Clarifications
            </span>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-sm bg-[#0d1117] border border-[#30363d] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white font-mono uppercase hover:text-[#f27d26] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#f27d26] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8b949e] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-[#8b949e] font-sans leading-relaxed border-t border-[#30363d]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Related Engineering Simulators */}
      <footer className="pt-6 border-t border-[#30363d] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#f27d26]" />
            Related Plant Reliability Simulators
          </h2>
          <span className="text-[11px] font-mono text-[#8b949e]">Cross-System Diagnostics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {relatedTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => navigateToSimulator(tool.id)}
              className="p-3.5 rounded-sm bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] hover:border-[#f27d26] flex flex-col items-start text-left gap-1.5 transition-all group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-bold text-white group-hover:text-[#f27d26] transition-colors">
                  {tool.title}
                </span>
                <span className="text-[9px] font-mono text-[#8b949e] border border-[#30363d] px-1.5 py-0.5 rounded-sm">
                  {tool.standard}
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-sans line-clamp-2">
                {tool.description}
              </p>
              <span className="text-[10px] font-mono text-[#f27d26] flex items-center gap-1 mt-1">
                Launch Simulator <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          ))}
        </div>
      </footer>
    </article>
  );
};
