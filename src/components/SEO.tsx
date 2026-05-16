import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, key: 'name' | 'property', value: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export default function SEO({ title, description, canonical = 'https://liftrz.com/', jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical;

    const previous = document.getElementById('route-json-ld');
    previous?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'route-json-ld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, jsonLd]);

  return null;
}
