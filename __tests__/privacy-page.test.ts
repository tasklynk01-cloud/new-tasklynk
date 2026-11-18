import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/components/site/content-page-shell", () => ({
  ContentPageShell: ({ children }: { children: React.ReactNode }) =>
    React.createElement("main", null, children),
  generateContentMetadata: (title: string, description: string, path: string) => ({
    title,
    description,
    alternates: { canonical: `https://www.tasklynk.co.ke${path}` },
  }),
}));

import PrivacyPage, { metadata } from "@/app/privacy/page";

describe("Privacy page", () => {
  const html = renderToStaticMarkup(React.createElement(PrivacyPage));

  it("renders the revision date and all seventeen numbered policy sections", () => {
    expect(html).toContain('dateTime="2026-10-29"');
    expect(html).toContain("October 29, 2026");
    expect(html.match(/<h2 id=/g)).toHaveLength(17);
    expect(html).toContain("17. Contact and Useful Privacy Resources");
  });

  it("gives every contents link a unique matching section and heading", () => {
    const targets = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
    expect(targets).toHaveLength(17);
    expect(new Set(targets).size).toBe(17);
    for (const target of targets) {
      expect(html).toContain(`id="${target}"`);
      expect(html).toContain(`aria-labelledby="${target}-heading"`);
      expect(html).toContain(`id="${target}-heading"`);
    }
  });

  it("discloses advertising and provides privacy request and choice links", () => {
    expect(html).toContain("Google AdSense");
    expect(html).toContain("local storage");
    expect(html).toContain('href="https://myadcenter.google.com/"');
    expect(html).toContain('href="https://www.odpc.go.ke/file-a-complaint/"');
    expect(html).toContain('href="mailto:tasklynk01@gmail.com?subject=Privacy%20request"');
    expect(html).not.toContain("Zero tracking");
    expect(html).not.toContain("GDPR Aligned");
    expect(html).not.toContain("14 working days");
  });

  it("preserves canonical metadata without unsupported compliance claims", () => {
    expect(metadata.alternates?.canonical).toBe("https://www.tasklynk.co.ke/privacy");
    expect(metadata.description).toContain("cookies and advertising");
    expect(metadata.description).not.toContain("GDPR-compliant");
  });
});