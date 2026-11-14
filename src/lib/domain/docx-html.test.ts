import { describe, expect, it } from "vitest";
import { docxToHtml } from "./docx-html";

function zip(files: Record<string, string | Uint8Array>): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = []; const central: Uint8Array[] = []; let off = 0;
  for (const [name, data] of Object.entries(files)) {
    const nb = enc.encode(name); const d = typeof data === "string" ? enc.encode(data) : data;
    const lh = new Uint8Array(30 + nb.length); const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint32(18, d.length, true); lv.setUint32(22, d.length, true); lv.setUint16(26, nb.length, true); lh.set(nb, 30);
    const ch = new Uint8Array(46 + nb.length); const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint32(20, d.length, true); cv.setUint32(24, d.length, true); cv.setUint16(28, nb.length, true); cv.setUint32(42, off, true); ch.set(nb, 46);
    parts.push(lh, d); central.push(ch); off += lh.length + d.length;
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(10, central.length, true); ev.setUint32(12, cdSize, true); ev.setUint32(16, off, true);
  const all = [...parts, ...central, end]; const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}
const W = 'xmlns:w="w" xmlns:r="r" xmlns:a="a" xmlns:wp="wp"';
const doc = (body: string) => `<?xml version="1.0"?><w:document ${W}><w:body>${body}</w:body></w:document>`;

describe("docxToHtml", () => {
  it("renders headings, formatting, escaping, lists, tables, links and images; drops deleted text", async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    const body = [
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Introduction</w:t></w:r></w:p>`,
      `<w:p><w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>a &lt;script&gt;x&lt;/script&gt; &amp; b</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r><w:del><w:r><w:t>GONE</w:t></w:r></w:del></w:p>`,
      `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>one</w:t></w:r></w:p>`,
      `<w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>nested</w:t></w:r></w:p>`,
      `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>two</w:t></w:r></w:p>`,
      `<w:p><w:hyperlink r:id="rId1"><w:r><w:t>site</w:t></w:r></w:hyperlink><w:hyperlink r:id="rId2"><w:r><w:t>bad</w:t></w:r></w:hyperlink></w:p>`,
      `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>c1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>c2</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`,
      `<w:p><w:r><w:drawing><wp:docPr descr="fig &quot;1&quot;"/><a:blip r:embed="rId3"/></w:drawing></w:r></w:p>`,
    ].join("");
    const bytes = zip({
      "word/document.xml": doc(body),
      "word/_rels/document.xml.rels": `<Relationships><Relationship Id="rId1" Target="https://example.org/a?b=1&amp;c=2" TargetMode="External"/><Relationship Id="rId2" Target="javascript:alert(1)" TargetMode="External"/><Relationship Id="rId3" Target="media/image1.png"/></Relationships>`,
      "word/numbering.xml": `<w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
      "word/media/image1.png": png,
    });
    const { html, truncated } = await docxToHtml(bytes);
    expect(truncated).toBe(false);
    expect(html).toContain("<h3>Introduction</h3>");
    expect(html).toContain("<em><strong>a &lt;script&gt;x&lt;/script&gt; &amp; b</strong></em>");
    expect(html).toContain("<sup>2</sup>");
    expect(html).not.toContain("GONE");
    expect(html).toContain("<ul><li>one<ol><li>nested</li></ol></li><li>two</li></ul>");
    expect(html).toContain('<a href="https://example.org/a?b=1&amp;c=2"');
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<td><p>c1</p></td><td><p>c2</p></td>");
    expect(html).toMatch(/<img src="data:image\/png;base64,iVBORw==" alt="fig &quot;1&quot;"/);
    expect(html).not.toContain("<script");
  });

  it("promotes bold lines and custom heading styles, merges cells vertically, and turns charts, diagrams and text boxes into readable blocks", async () => {
    const body = [
      `<w:p><w:pPr><w:pStyle w:val="MyHead"/></w:pPr><w:r><w:t>Custom Heading</w:t></w:r></w:p>`,
      `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. Methods</w:t></w:r></w:p>`,
      `<w:p><w:r><w:t>Table 1. Counts</w:t></w:r></w:p>`,
      `<w:tbl><w:tblPr><w:tblLook w:firstRow="1"/></w:tblPr><w:tr><w:tc><w:p><w:r><w:t>Group</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>N</w:t></w:r></w:p></w:tc></w:tr>` +
        `<w:tr><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>5</w:t></w:r></w:p></w:tc></w:tr>` +
        `<w:tr><w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p/></w:tc><w:tc><w:p><w:r><w:t>7</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`,
      `<w:p><w:r><w:drawing><c:chart r:id="rId9"/></w:drawing></w:r></w:p>`,
      `<w:p><w:r><w:t>Figure 1. Growth over time</w:t></w:r></w:p>`,
      `<w:p><w:r><w:drawing><dgm:relIds r:dm="rId8"/></w:drawing></w:r></w:p>`,
      `<w:p><w:r><w:drawing><wps:txbx><w:txbxContent><w:p><w:r><w:t>Key point</w:t></w:r></w:p></w:txbxContent></wps:txbx></w:drawing></w:r></w:p>`,
    ].join("");
    const bytes = zip({
      "word/document.xml": `<?xml version="1.0"?><w:document ${W} xmlns:c="c" xmlns:dgm="dgm" xmlns:wps="wps"><w:body>${body}</w:body></w:document>`,
      "word/styles.xml": `<w:styles ${W}><w:style w:type="paragraph" w:styleId="MyHead"><w:name w:val="heading 2"/></w:style></w:styles>`,
      "word/_rels/document.xml.rels": `<Relationships><Relationship Id="rId9" Target="charts/chart1.xml"/><Relationship Id="rId8" Target="diagrams/data1.xml"/></Relationships>`,
      "word/charts/chart1.xml": `<c:chartSpace xmlns:c="c" xmlns:a="a"><c:chart><c:title><c:tx><c:rich><a:p><a:r><a:t>Growth</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:barChart><c:ser><c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Height</c:v></c:pt></c:strCache></c:strRef></c:tx><c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Jan</c:v></c:pt><c:pt idx="1"><c:v>Feb</c:v></c:pt></c:strCache></c:strRef></c:cat><c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>3.5</c:v></c:pt><c:pt idx="1"><c:v>4.25</c:v></c:pt></c:numCache></c:numRef></c:val></c:ser></c:barChart></c:plotArea></c:chart></c:chartSpace>`,
      "word/diagrams/data1.xml": `<dgm:dataModel xmlns:dgm="dgm" xmlns:a="a"><dgm:ptLst><dgm:pt type="doc"><dgm:t><a:p><a:r><a:t>ROOT</a:t></a:r></a:p></dgm:t></dgm:pt><dgm:pt><dgm:t><a:p><a:r><a:t>Plan</a:t></a:r></a:p></dgm:t></dgm:pt><dgm:pt><dgm:t><a:p><a:r><a:t>Build</a:t></a:r></a:p></dgm:t></dgm:pt></dgm:ptLst></dgm:dataModel>`,
    });
    const { html, blocks } = await docxToHtml(bytes);
    expect(html).toContain("<h3>Custom Heading</h3>");
    expect(html).toContain("<h3>2. Methods</h3>".replace("h3", "h3"));
    expect(html).toMatch(/ft-fig-table"><figcaption><span class="ft-cap-label">Table&nbsp;1<\/span> Counts/);
    expect(html).toContain("<th><p>Group</p></th>");
    expect(html).toContain('rowspan="2"');
    expect(html).toContain("<caption>Growth</caption>");
    expect(html).toContain('<td class="num">4.25</td>');
    expect(html).toMatch(/ft-fig-chart"><div class="ft-table ft-chart">.*<figcaption><span class="ft-cap-label">Figure&nbsp;1<\/span> Growth over time/);
    expect(html).toContain("<li>Plan</li><li>Build</li>");
    expect(html).not.toContain("ROOT");
    expect(html).toContain("Key point");
    expect(blocks.some((b) => b.text.includes("Jan  |  3.5"))).toBe(true);
  });
});
