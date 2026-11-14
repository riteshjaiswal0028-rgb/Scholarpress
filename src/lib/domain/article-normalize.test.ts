import { describe, expect, it } from "vitest";
import { normalizeArticleHtml, splitBlocks, boldHeading } from "./article-normalize";

describe("normalizeArticleHtml (universal article format)", () => {
  it("turns bold-only lines and numbered lines into one contiguous heading scale, in title case", () => {
    const html = normalizeArticleHtml(
      "<p><strong>Introduction</strong></p><p>Body text that is long enough to be a paragraph and not a heading at all.</p>" +
      "<p><strong>1.1 Background</strong></p><p>More body text here that is long enough to count as ordinary prose.</p>" +
      "<h6>RESULTS AND DISCUSSION</h6>",
    );
    expect(html).toContain("<h3>Introduction</h3>");
    expect(html).toContain("<h4>1.1 Background</h4>");
    expect(html).toContain("<h5>Results and Discussion</h5>");
    expect(html).not.toContain("<strong>Introduction");
  });

  it("does not turn a bold sentence or a caption into a heading", () => {
    expect(boldHeading("<strong>This is a long bold sentence that ends with a full stop and keeps going on.</strong>")).toBeNull();
    expect(boldHeading("<strong>Table 1. Results</strong>")).toBeNull();
    expect(boldHeading("plain text")).toBeNull();
  });

  it("joins captions to tables (above) and figures (below), and frames uncaptioned images", () => {
    const html = normalizeArticleHtml(
      '<p>Table 1. Baseline data</p><div class="ft-table"><table><tbody><tr><td>Group</td><td>Mean</td></tr><tr><td>A</td><td>12.5</td></tr><tr><td>B</td><td>9.1</td></tr></tbody></table></div>' +
      '<p><img src="data:image/png;base64,AAAA" alt=""></p><p>Fig. 2: The apparatus.</p>' +
      '<p><img src="data:image/png;base64,BBBB" alt=""></p>',
    );
    expect(html).toMatch(/<figure class="ft-fig ft-fig-table"><figcaption><span class="ft-cap-label">Table&nbsp;1<\/span> Baseline data<\/figcaption><div class="ft-table">/);
    expect(html).toMatch(/<figure class="ft-fig ft-fig-image"><img src="data:image\/png;base64,AAAA" alt=""><figcaption><span class="ft-cap-label">Figure&nbsp;2<\/span> The apparatus\.<\/figcaption><\/figure>/);
    expect(html).toMatch(/<figure class="ft-fig ft-fig-image"><img src="data:image\/png;base64,BBBB" alt=""><\/figure>/);
  });

  it("finds a table header row and right-aligns numbers", () => {
    const html = normalizeArticleHtml('<div class="ft-table"><table><tbody><tr><td>Group</td><td>Mean</td></tr><tr><td>A</td><td>12.5</td></tr><tr><td>B</td><td>9.1 (0.4)</td></tr></tbody></table></div>');
    expect(html).toContain('<th scope="col">Group</th>');
    expect(html).toContain('<td class="num">12.5</td>');
    expect(html).toContain('<td class="num">9.1 (0.4)</td>');
  });

  it("styles references and structured-abstract lead-ins, and sets typography", () => {
    const html = normalizeArticleHtml(
      "<p>Methods: We enrolled forty adults and followed them for twelve weeks with weekly visits.</p>" +
      "<h3>References</h3><p>Smith J. A paper. Journal. 2020.</p><ol><li>Jones K. Another. 2019.</li></ol>" +
      "<p>He said &quot;it&apos;s fine&quot; -- really... see Figure 3.</p>".replace("&apos;", "'"),
    );
    expect(html).toContain('<strong class="ft-lead">Methods:</strong>');
    expect(html).toContain('<p class="ft-ref">Smith J.');
    expect(html).toContain('<ol class="ft-reflist">');
    expect(html).toContain("“it’s fine”");
    expect(html).toContain("— really…");
    expect(html).toContain("Figure&nbsp;3");
  });

  it("is idempotent and drops empty paragraphs and author centring on long text", () => {
    const src = '<p>   </p><p class="ft-center">' + "word ".repeat(40) + "</p><p><strong>Abstract</strong></p><p>Background: " + "text ".repeat(20) + "</p>";
    const once = normalizeArticleHtml(src);
    expect(once).not.toContain("ft-center");
    expect(normalizeArticleHtml(once)).toBe(once);
  });

  it("splits top-level blocks without breaking lists and tables", () => {
    expect(splitBlocks("<p>a</p><ul><li>x<ol><li>y</li></ol></li></ul><div><table><tr><td>z</td></tr></table></div>")).toHaveLength(3);
  });
});
