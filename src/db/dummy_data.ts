import type { EventNode } from '#/types/nodes'

export const DUMMY_GRAPH: EventNode[] = [
  {
    id: 'a',
    label: 'A decade of cheap debt fuels reckless expansion',
    description:
      'For years, the company aggressively borrowed money during a low-interest-rate environment to fund rapid expansion, acquisitions, and operational growth without building sustainable cash flow.',
    sources: [
      {
        title: 'McKinsey — The New Economics of Debt',
        url: 'https://www.mckinsey.com',
      },
      {
        title: 'Harvard Business Review — The Hidden Risks of Cheap Capital',
        url: 'https://hbr.org',
      },
    ],
    children: [
      {
        id: 'aa',
        label: 'Integration teams are underfunded',
        description:
          'Post-acquisition integration teams lacked budget and staffing, causing operational fragmentation and duplicated systems across departments.',
        sources: [
          {
            title: 'Deloitte — M&A Integration Failures',
            url: 'https://www2.deloitte.com',
          },
        ],
      },
      {
        id: 'ab',
        label: 'Legacy systems remain operational too long',
        description:
          'Old infrastructure and acquired platforms were never fully retired, increasing maintenance costs and operational complexity.',
        sources: [
          {
            title: 'Gartner — Technical Debt and Legacy Modernization',
            url: 'https://www.gartner.com',
          },
        ],
      },
      {
        id: 'ac',
        label: 'Operational overlap creates internal confusion',
        description:
          'Multiple business units performed overlapping responsibilities after acquisitions, leading to inefficiency and political conflict.',
        sources: [
          {
            title: 'PwC — Post-Merger Operational Risk',
            url: 'https://www.pwc.com',
          },
        ],
      },
    ],
  },

  {
    id: 'b',
    label: 'Board approves 3 overlapping acquisitions',
    description:
      'Leadership approved multiple acquisitions simultaneously without sufficient integration planning or risk modeling.',
    sources: [
      {
        title: 'KPMG — Why Acquisitions Fail',
        url: 'https://kpmg.com',
      },
    ],
  },

  {
    id: 'c',
    label: 'Integration teams are underfunded',
    description:
      'Budget constraints limited the company’s ability to unify systems, cultures, and workflows after expansion.',
    sources: [
      {
        title: 'BCG — Post-Merger Integration Challenges',
        url: 'https://www.bcg.com',
      },
    ],
  },

  {
    id: 'd',
    label: 'Old systems are kept alive too long',
    description:
      'Critical legacy systems remained in production due to migration delays and fear of operational downtime.',
    sources: [
      {
        title: 'IBM — The Cost of Legacy Infrastructure',
        url: 'https://www.ibm.com',
      },
    ],
  },

  {
    id: 'e',
    label: 'Leverage ratio quietly triples',
    description:
      'Debt obligations increased far faster than revenue growth, significantly weakening the company’s financial resilience.',
    sources: [
      {
        title: 'Investopedia — Understanding Leverage Ratios',
        url: 'https://www.investopedia.com',
      },
    ],
  },

  {
    id: 'f',
    label: 'CFO flags the risk internally',
    description:
      'Finance leadership raised concerns about mounting debt exposure and refinancing risks in internal meetings.',
    sources: [
      {
        title: 'Harvard Law — Corporate Governance Failures',
        url: 'https://corpgov.law.harvard.edu',
      },
    ],
  },

  {
    id: 'g',
    label: 'Board waives covenant guardrails',
    description:
      'Risk controls and debt covenant protections were relaxed to maintain expansion momentum despite worsening balance sheet conditions.',
    sources: [
      {
        title: 'Moody’s — Corporate Credit Deterioration Signals',
        url: 'https://www.moodys.com',
      },
    ],
  },

  {
    id: 'h',
    label: 'Interest rates rise sharply',
    description:
      'Macroeconomic tightening and central bank rate hikes dramatically increased borrowing costs across the market.',
    sources: [
      {
        title: 'Federal Reserve — Monetary Policy Reports',
        url: 'https://www.federalreserve.gov',
      },
      {
        title: 'IMF — Global Financial Stability Report',
        url: 'https://www.imf.org',
      },
    ],
  },

  {
    id: 'i',
    label: 'Debt refinancing becomes impossible',
    description:
      'The company could no longer refinance existing debt under acceptable terms, creating severe liquidity pressure.',
    sources: [
      {
        title: 'Bloomberg — Corporate Debt Stress Analysis',
        url: 'https://www.bloomberg.com',
      },
    ],
  },
]
