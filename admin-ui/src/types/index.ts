export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  cacheTTL: number;
  selectors: {
    items: string;
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
  };
  feed: {
    title: string;
    description: string;
    link: string;
  };
}

export interface SelectorTestRequest {
  url: string;
  selectors: {
    items: string;
    title: string;
    link: string;
    description?: string;
    pubDate?: string;
    author?: string;
  };
}

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
}

export interface SelectorTestResult {
  success: boolean;
  items: RSSItem[];
  error?: string;
}

export interface Site {
  id: string;
  name: string;
  feedUrl: string;
}

export interface SitesListResponse {
  sites: Site[];
  count: number;
}
