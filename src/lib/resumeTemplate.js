// Builds a standalone, ATS-friendly resume HTML document from the profile.
// Every user value is escaped, so profile text can never inject markup.

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const TEMPLATES = {
  classic: { label: 'Classic', accent: '#111827', font: "Georgia, 'Times New Roman', serif" },
  modern: { label: 'Modern', accent: '#4f46e5', font: "'Inter', Arial, sans-serif" },
  minimal: { label: 'Minimal', accent: '#0f766e', font: "'Helvetica Neue', Arial, sans-serif" },
};

export function buildResumeHtml(profile, templateId = 'modern') {
  const t = TEMPLATES[templateId] || TEMPLATES.modern;
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ');
  const section = (title, body) => (body ? `<section><h2>${title}</h2>${body}</section>` : '');

  const experience = (profile.experience || [])
    .filter((e) => e.role || e.company)
    .map(
      (e) => `<div class="item"><div class="row"><strong>${esc(e.role)}</strong><span>${esc(e.period)}</span></div>
      <div class="sub">${esc(e.company)}</div>
      ${e.description ? `<ul>${e.description.split(/(?<=\.)\s+|\n+/).filter((l) => l.trim()).map((l) => `<li>${esc(l.trim())}</li>`).join('')}</ul>` : ''}</div>`,
    )
    .join('');

  const education = (profile.education || [])
    .filter((e) => e.degree || e.school)
    .map((e) => `<div class="item"><div class="row"><strong>${esc(e.degree)}</strong><span>${esc(e.year)}</span></div><div class="sub">${esc(e.school)}</div></div>`)
    .join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(profile.name || 'Resume')} - Resume</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${t.font}; color: #1f2937; font-size: 10.5pt; line-height: 1.45; background: #fff; }
  .page { max-width: 8.5in; margin: 0 auto; padding: 0.55in 0.6in; }
  @media print { .page { padding: 0; max-width: none; } }
  header { ${templateId === 'classic' ? 'text-align:center;' : ''} border-bottom: 2px solid ${t.accent}; padding-bottom: 10px; margin-bottom: 14px; }
  h1 { margin: 0; font-size: 22pt; color: ${t.accent}; letter-spacing: -0.01em; }
  .title { font-size: 12pt; font-weight: 600; margin-top: 2px; }
  .contact { font-size: 9.5pt; color: #4b5563; margin-top: 6px; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: ${t.accent}; margin: 16px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  .item { margin-bottom: 10px; break-inside: avoid; }
  .row { display: flex; justify-content: space-between; gap: 12px; }
  .row span { color: #6b7280; white-space: nowrap; font-size: 9.5pt; }
  .sub { color: #4b5563; font-style: ${templateId === 'classic' ? 'italic' : 'normal'}; }
  ul { margin: 4px 0 0; padding-left: 18px; } li { margin-bottom: 2px; }
  .skills { display: flex; flex-wrap: wrap; gap: 4px 6px; }
  .skills span { ${templateId === 'modern' ? `background:#eef2ff;color:${t.accent};padding:1px 8px;border-radius:4px;` : ''} }
  .skills span:not(:last-child)::after { ${templateId === 'modern' ? '' : "content:' ·';"} }
  p { margin: 0; }
</style></head><body><div class="page">
<header><h1>${esc(profile.name)}</h1>${profile.title ? `<div class="title">${esc(profile.title)}</div>` : ''}${contact ? `<div class="contact">${contact}</div>` : ''}</header>
${section('Summary', profile.summary ? `<p>${esc(profile.summary)}</p>` : '')}
${section('Skills', (profile.skills || []).length ? `<div class="skills">${profile.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '')}
${section('Experience', experience)}
${section('Education', education)}
</div></body></html>`;
}
