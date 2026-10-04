import React, { useEffect } from 'react';
import { RouteId } from '../types/common';

interface SEOProps {
  activeRoute: RouteId;
}

interface PageMeta {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogType: string;
  heading: string;
}

const BASE_URL = 'https://mech.livesimulators.com';

const META_CONFIG: Record<RouteId, PageMeta> = {
  home: {
    title: 'Mechanical Engineering Digital Twins | LiveSimulators',
    description: 'Physics-verified mechanical engineering simulators conforming to API, ASME, AGMA, and ISO standards. Centrifugal pumps, compressors, turbines, gearboxes, bearings, and rotor dynamics.',
    keywords: 'livesimulators, mechanical simulators, digital twins, turbomachinery, pump cavitation API 610, compressor surge API 617, recip compressor API 618, gearbox AGMA 2001, steam turbine API 612, bearing life ISO 281, journal bearing API 684, rotor balancing ISO 1940, pipe stress ASME B31.3, seal flush API 682, shaft alignment API 686',
    canonicalUrl: `${BASE_URL}/`,
    ogType: 'website',
    heading: 'Mechanical & Thermal Dynamics Engineering Simulators & Digital Twins',
  },
  workbench: {
    title: 'Mission Control Simulator Workbench | LiveSimulators',
    description: 'High-density Mission Control workbench with real-time Runge-Kutta numerical solvers, interactive telemetry, and turbomachinery digital twins.',
    keywords: 'mission control, simulator workbench, digital twins, turbomachinery telemetry, float64 solver',
    canonicalUrl: `${BASE_URL}/workbench`,
    ogType: 'website',
    heading: 'Mission Control Simulator Workbench',
  },
  portal: {
    title: 'Mechanical Engineering Simulators Hub | LiveSimulators',
    description: 'Welcome to LiveSimulators Mechanical Division. Interactive multi-physics digital twin simulators for centrifugal pumps, compressors, steam turbines, gearboxes, bearings, rotor dynamics, piping, and shaft alignment.',
    keywords: 'live simulators, mechanical engineering simulators, rotating equipment digital twin, API standards simulator, turbomachinery physics',
    canonicalUrl: `${BASE_URL}/portal`,
    ogType: 'website',
    heading: 'LiveSimulators — Mechanical Engineering Digital Twins',
  },
  pump: {
    title: 'Centrifugal Pump Cavitation & NPSH Simulator | API 610 & HI 9.6.1 | LiveSimulators',
    description: 'Calculate NPSHa, compare against vendor NPSHr (NPSH3) curves, evaluate suction specific speed (Nss), and determine cavitation margin per API 610 and HI 9.6.1.',
    keywords: 'centrifugal pump cavitation simulator, NPSH calculator, NPSHa calculation, NPSHr 3 percent, API 610 pump, suction specific speed Nss, Hydraulic Institute 9.6.1',
    canonicalUrl: `${BASE_URL}/pump`,
    ogType: 'article',
    heading: 'Centrifugal Pump Cavitation & NPSH Simulator',
  },
  compressor: {
    title: 'Centrifugal Compressor Surge & Polytropic Performance Simulator | API 617 & ASME PTC 10 | LiveSimulators',
    description: 'Simulate aerodynamic surge limit lines (SLL), anti-surge control margins (SCL), ASV recycle valve modulation, and transient axial thrust load reversals per API 617 and ASME PTC 10.',
    keywords: 'centrifugal compressor surge simulator, anti surge control, SLL SCL margin, API 617 compressor, ASME PTC 10, ASV recycle valve, thrust bearing surge load',
    canonicalUrl: `${BASE_URL}/compressor`,
    ogType: 'article',
    heading: 'Centrifugal Compressor Surge & Anti-Surge Control Simulator',
  },
  recip: {
    title: 'Reciprocating Compressor Cylinder PV & Pulsation Simulator | API 618 & ISO 13631 | LiveSimulators',
    description: 'Model cylinder PV indicator cards, crosshead pin rod load reversal criteria, valve leak degradation, and acoustic pulsation surge bottles per API 618 and ISO 13631.',
    keywords: 'reciprocating compressor simulator, PV indicator card, API 618 rod load reversal, acoustic pulsation, surge damper bottle, valve leak, compressor volumetric efficiency',
    canonicalUrl: `${BASE_URL}/recip`,
    ogType: 'article',
    heading: 'Reciprocating Compressor PV Indicator Card & Acoustic Pulsation Simulator',
  },
  gearbox: {
    title: 'Industrial Gearbox Mesh & Safety Factor Simulator | AGMA 2001 & ISO 6336 | LiveSimulators',
    description: 'Evaluate gear mesh frequencies (GMF), hunting tooth dynamics, AGMA 2001 bending and contact pitting safety factors, Dowson-Higginson EHL film thickness, and ISO 10816-3 vibration severity.',
    keywords: 'gearbox simulator, gear mesh frequency GMF, hunting tooth frequency, AGMA 2001 bending stress, contact Hertzian stress, EHL oil film thickness lambda, tooth pitting, broken tooth, ISO 10816 vibration',
    canonicalUrl: `${BASE_URL}/gearbox`,
    ogType: 'article',
    heading: 'Industrial Gearbox & Gear Mesh Diagnostics Simulator',
  },
  turbine: {
    title: 'Industrial Steam Turbine Thermodynamics Simulator | API 612 & ASME PTC 6 | LiveSimulators',
    description: 'Simulate thermodynamic steam expansion, Mollier diagram, Willans steam consumption, Wilson line moisture condensation, last-stage blade droplet impingement erosion, and Campbell blade resonance.',
    keywords: 'steam turbine simulator, API 612, API 611, Mollier diagram, Willans line steam rate, Wilson line wetness, droplet erosion, Campbell diagram, blade resonance',
    canonicalUrl: `${BASE_URL}/turbine`,
    ogType: 'article',
    heading: 'Industrial Steam Turbine Simulator',
  },
  bearing: {
    title: 'Rolling Element Bearing Fault Simulator | ISO 281 & ISO 10816 | LiveSimulators',
    description: 'Diagnose ball pass frequencies (BPFO, BPFI, BSF, FTF), 4-stage degradation models, demodulated high-frequency envelope energy, and ISO 281 L10h rating life.',
    keywords: 'bearing fault simulator, BPFO BPFI BSF FTF frequencies, ISO 281 bearing life, ISO 15243 failure modes, high frequency envelope gE, crest factor kurtosis',
    canonicalUrl: `${BASE_URL}/bearing`,
    ogType: 'article',
    heading: 'Rolling Element Bearing Fault Simulator',
  },
  journal: {
    title: 'Hydrodynamic Journal Bearing & Oil Whirl Simulator | API 684 & DIN 31652 | LiveSimulators',
    description: 'Model Sommerfeld lubrication number, fluid film wedge pressure profile, dynamic stiffness/damping cross-coupling, and subsynchronous oil whirl/whip instability per API 684.',
    keywords: 'hydrodynamic journal bearing simulator, oil whirl, oil whip, API 684 rotordynamics, API 670 shaft vibration, Sommerfeld number, tilt pad bearing, cross coupled stiffness',
    canonicalUrl: `${BASE_URL}/journal`,
    ogType: 'article',
    heading: 'Hydrodynamic Journal Bearing & Oil Whirl/Whip Simulator',
  },
  rotor: {
    title: 'Rotor Dynamics & Resonant Balancing Simulator | ISO 1940 & API 684 | LiveSimulators',
    description: 'Calculate ISO 1940 permissible unbalance, 1X dynamic centrifugal force, ISO 10816-3 vibration severity, and ISO 281 modified bearing rating life (L10mh).',
    keywords: 'rotor unbalance simulator, ISO 1940 balance quality grade, 1X unbalance force, ISO 281 bearing life, L10mh modified rating life, ISO 10816 vibration severity',
    canonicalUrl: `${BASE_URL}/rotor`,
    ogType: 'article',
    heading: 'Rotor Unbalance and Bearing Life Simulator',
  },
  pipe: {
    title: 'Process Piping Thermal Flexibility & Stress Visualizer | ASME B31.3 | LiveSimulators',
    description: 'Evaluate thermal elongation ΔL, Kellogg guided cantilever flexibility, ASME B31.3 allowable displacement stress range SA, and fixed anchor thrust reactions.',
    keywords: 'pipe thermal expansion visualizer, pipe stress simulator, ASME B31.3 displacement stress range, expansion loop calculation, anchor reaction force',
    canonicalUrl: `${BASE_URL}/pipe`,
    ogType: 'article',
    heading: 'Pipe Thermal Expansion and Stress Visualizer',
  },
  seal: {
    title: 'API Mechanical Seal Flush Plan Simulator | API 682 4th Ed | LiveSimulators',
    description: 'Simulate API 682 single and dual seal flush piping plans (11 to 62). Calculate seal face frictional heat, restriction orifice sizing, and vapor suppression margin.',
    keywords: 'API 682 seal flush plans simulator, mechanical seal flush plan, Plan 11 orifice calculation, Plan 53A barrier fluid, seal face heat generation, vapor margin',
    canonicalUrl: `${BASE_URL}/seal`,
    ogType: 'article',
    heading: 'API Mechanical Seal Flush Plan Simulator',
  },
  alignment: {
    title: 'Shaft Alignment & Thermal Growth Simulator | API 686 & ANSI S2.75 | LiveSimulators',
    description: 'Simulate hot-running alignment, cold thermal growth offsets, soft foot checking, shim pack corrections, and ISO 20816-3 2X misalignment vibration.',
    keywords: 'shaft alignment simulator, API 686 alignment tolerance, thermal growth calculation, cold target offset, soft foot, shim calculation, 2X vibration harmonic',
    canonicalUrl: `${BASE_URL}/alignment`,
    ogType: 'article',
    heading: 'Shaft Alignment & Thermal Growth Simulator',
  },
  methodology: {
    title: 'Calculation Methodology & Physics Solvers | LiveSimulators',
    description: 'Detailed engineering documentation of mathematical models, numerical solvers, physical assumptions, and validation benchmarks governing our mechanical simulators.',
    keywords: 'engineering simulation methodology, pump hydraulic equations, ISO 281 formulas, ASME B31.3 stress formulas, API 682 thermal formulas',
    canonicalUrl: `${BASE_URL}/methodology`,
    ogType: 'article',
    heading: 'Calculation Methodology & Physics Solvers',
  },
  standards: {
    title: 'Governing Engineering Standards Reference | API, ISO, ASME, HI | LiveSimulators',
    description: 'Authoritative guide to API 610, API 617, API 618, API 612, API 682, ISO 1940-1, ISO 281, ISO 10816-3, ASME B31.3, and ANSI/HI 9.6.1 standards.',
    keywords: 'engineering standards reference, API 610 12th edition, API 682 4th edition, ISO 1940 balance grade, ISO 281 bearing life standard, ASME B31.3 piping code',
    canonicalUrl: `${BASE_URL}/standards`,
    ogType: 'article',
    heading: 'Governing Industry Standards & Codes',
  },
  faq: {
    title: 'Engineering FAQ & Technical Knowledge Base | LiveSimulators',
    description: 'Answers to common mechanical engineering questions regarding pump cavitation, compressor surge, rotor unbalance, piping thermal expansion, and API 682 seal plans.',
    keywords: 'mechanical engineering FAQ, pump cavitation causes, NPSH margin calculation, rotor unbalance causes, pipe expansion loops, API seal flush plans',
    canonicalUrl: `${BASE_URL}/faq`,
    ogType: 'article',
    heading: 'Frequently Asked Engineering Questions',
  },
  about: {
    title: 'About LiveSimulators Mechanical Laboratory | LiveSimulators',
    description: 'Overview of LiveSimulators Mechanical Engineering Lab, authored by Anil Sharma. Client-side Float64 numerical physics engine adhering to industrial engineering codes.',
    keywords: 'about livesimulators, mechanical reliability tools, engineering software, client side physics engine, Anil Sharma',
    canonicalUrl: `${BASE_URL}/about`,
    ogType: 'article',
    heading: 'About LiveSimulators Mechanical Engineering Lab',
  },
  disclaimer: {
    title: 'Engineering Disclaimer & Safety Terms | LiveSimulators',
    description: 'Engineering safety notices, scope of intended use, calculation tolerances, and verification requirements for professional engineers.',
    keywords: 'engineering disclaimer, simulation safety terms, plant engineering calculation limits, professional engineer review',
    canonicalUrl: `${BASE_URL}/disclaimer`,
    ogType: 'article',
    heading: 'Engineering Safety Notice & Terms of Use',
  },
};

export const SEO: React.FC<SEOProps> = ({ activeRoute }) => {
  const meta = META_CONFIG[activeRoute] || META_CONFIG.home;

  useEffect(() => {
    // 1. Update Document Title
    document.title = meta.title;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', meta.description);
    setMetaTag('name', 'keywords', meta.keywords);
    setMetaTag('name', 'theme-color', '#050B14');
    setMetaTag('name', 'author', 'Anil Sharma • LiveSimulators');
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph Tags
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:type', meta.ogType);
    setMetaTag('property', 'og:url', meta.canonicalUrl);
    setMetaTag('property', 'og:site_name', 'LiveSimulators Mechanical');
    setMetaTag('property', 'og:image', 'https://livesimulators.com/og-mechanical.png');

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:image', 'https://livesimulators.com/og-mechanical.png');

    // Canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', meta.canonicalUrl);

    // 3. Track Page View via Google Tag G-M3EVRMMS7V
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: meta.title,
        page_location: meta.canonicalUrl,
        page_path: window.location.pathname + window.location.hash,
        send_to: 'G-M3EVRMMS7V',
      });
    }

    // 4. JSON-LD Structured Data
    const jsonLdData: any[] = [
      // Organization schema on all pages
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'LiveSimulators',
        'url': 'https://livesimulators.com',
        'sameAs': [
          'https://mech.livesimulators.com',
          'https://designcalculators.co.in',
        ],
      },
    ];

    // WebSite schema on homepage
    if (activeRoute === 'home') {
      jsonLdData.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'LiveSimulators Mechanical',
        'url': 'https://mech.livesimulators.com',
      });
    }

    jsonLdData.push(
      {
        '@context': 'https://schema.org',
        '@type': ['SoftwareApplication', 'LearningResource'],
        '@id': `${meta.canonicalUrl}#app`,
        'name': meta.title,
        'alternateName': 'LiveSimulators Mechanical Engineering Lab',
        'applicationCategory': 'EducationalApplication',
        'operatingSystem': 'Any web browser',
        'browserRequirements': 'Requires JavaScript. Requires HTML5 Canvas.',
        'educationalLevel': 'Higher Education',
        'learningResourceType': 'Simulation',
        'audience': {
          '@type': 'EducationalAudience',
          'educationalRole': 'student',
          'audienceType': 'Undergraduate Engineers, EPC Machinery Consultants, Reliability Engineers',
        },
        'url': meta.canonicalUrl,
        'description': meta.description,
        'author': {
          '@type': 'Person',
          'name': 'Anil Sharma',
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
        },
        'teaches': [
          'Euler Turbomachinery Equation',
          'Net Positive Suction Head Available (NPSHa)',
          'Net Positive Suction Head Required (NPSHr)',
          'Rayleigh-Plesset Bubble Dynamics',
          'Cavitation Damage & Impeller Pitting',
          'Suction Specific Speed (Nss)',
          'API 610 12th Edition Centrifugal Pumps',
          'API 617 Centrifugal Compressor Surge Line & Polytropic Head',
          'API 618 Reciprocating Compressor Cylinder PV & Rod Load Dynamics',
          'API 612 Multi-Stage Steam Turbine Isentropic Expansion & Willans Line',
          'AGMA 2001 / ISO 6336 Industrial Gearbox Mesh & Safety Factors',
          'ISO 281 / ISO 10816 Rolling Element Bearing Fault Kinematics',
          'API 684 Hydrodynamic Journal Bearing 2D Reynolds PDE & Oil Whirl',
          'ISO 1940-1 Grade G2.5 Rotor Unbalance & Resonant Balancing',
          'ASME B31.3 Process Piping Thermal Flexibility & Stress Range',
          'API 682 4th Ed Mechanical Seal Flush Plan Thermodynamics',
          'API 686 Reverse Dial & Laser Shaft Alignment Calculations',
          'Hydraulic Institute HI 9.6.1 Margin Standards',
          'Affinity Laws for Turbomachinery Speed Scaling',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'LiveSimulators Home',
            'item': 'https://livesimulators.com/',
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Mechanical Department',
            'item': `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': meta.heading,
            'item': meta.canonicalUrl,
          },
        ],
      }
    );

    let scriptTag = document.getElementById('jsonld-seo') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'jsonld-seo';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLdData);
  }, [meta, activeRoute]);

  return null;
};
