import { describe, expect, it } from "vitest";
import { structurePdf, type PdfPageText, type PdfTextItem } from "./pdf-structure";

/** One line of text as a single positioned item. */
const line = (str: string, y: number, size = 11, x = 50): PdfTextItem => ({ str, x, y, w: str.length * size * 0.45, size });
const page = (items: PdfTextItem[]): PdfPageText => ({ width: 595, height: 842, items });

describe("structurePdf", () => {
  it("builds headings, paragraphs, a keyword line and a list from positioned lines", () => {
    const p = page([
      line("Effects of Exercise", 780, 20),
      line("Abstract", 740, 14),
      line("Exercise lowers blood pres-", 715), line("sure in adults. This study", 701), line("followed them for twelve weeks.", 687),
      line("Keywords: exercise, blood pressure", 660),
      line("1. Introduction", 620, 14),
      line("Hypertension is common.", 595),
      line("• First point", 560), line("• Second point", 546),
    ]);
    const r = structurePdf([p], { title: "Effects of Exercise" });
    expect(r.html).not.toContain("Effects of Exercise");
    expect(r.html).toContain("<h3>Abstract</h3>");
    expect(r.html).toContain("lowers blood pressure in adults. This study followed them for twelve weeks.");
    expect(r.html).toContain('<p class="ft-kw"><strong>Keywords:</strong> exercise, blood pressure</p>');
    expect(r.html).toContain("1. Introduction</h");
    expect(r.html).toContain("<ul><li>First point</li><li>Second point</li></ul>");
  });

  it("drops repeating running heads and page numbers", () => {
    const mk = (n: number) => page([line("Journal Name", 820, 8), line(`Body text of page ${n} goes here.`, 600), line(String(n), 20, 8)]);
    const r = structurePdf([mk(1), mk(2), mk(3)]);
    expect(r.html).not.toContain("Journal Name");
    expect(r.html).toContain("Body text of page 2");
    expect(r.html).not.toMatch(/<p>\d<\/p>/);
  });

  it("escapes markup in extracted text and returns nothing for a page with no text", () => {
    expect(structurePdf([page([line("a <script>alert(1)</script> b", 600)])]).html).not.toContain("<script>");
    expect(structurePdf([page([])]).html).toBe("");
  });

  it("rebuilds a table from aligned cells and a figure caption into a reference to the original page", () => {
    const cell = (str: string, x: number, y: number): PdfTextItem => ({ str, x, y, w: str.length * 5, size: 10 });
    const p = page([
      line("Results were as follows in the cohort.", 700, 10),
      line("Table 1. Baseline characteristics", 670, 10),
      cell("Group", 50, 650), cell("Mean", 250, 650), cell("SD", 400, 650),
      cell("Control", 50, 636), cell("12.5", 250, 636), cell("1.1", 400, 636),
      cell("Treated", 50, 622), cell("9.1", 250, 622), cell("0.8", 400, 622),
      line("Fig. 2. Study flow", 560, 10),
    ]);
    const r = structurePdf([p]);
    expect(r.html).toContain('<th scope="col">Group</th>');
    expect(r.html).toContain('<td class="num">12.5</td>');
    expect(r.html).toContain('<span class="ft-cap-label">Table&nbsp;1</span> Baseline characteristics');
    expect(r.html).toContain('data-goto-pdf="1"');
    expect(r.html).toContain('<span class="ft-cap-label">Figure&nbsp;2</span> Study flow');
  });
});
