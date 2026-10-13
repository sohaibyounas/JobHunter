// Resume → structured profile extraction. Runs fully in the browser; files are never uploaded.

export const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── PDF & DOCX File → Text Extraction ──────────────────────────────────────────
export async function extractFileText(file) {
  if (file.size > MAX_CV_BYTES) {
    throw new Error("This file is larger than 10 MB. Please upload a smaller resume.");
  }
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages = [];

    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        if (!content.items || content.items.length === 0) continue;

        // Group and sort PDF items vertically (top-to-bottom) and horizontally (left-to-right)
        // to preserve authentic lines and paragraph structure
        const sorted = [...content.items].sort((a, b) => {
          const yA = a.transform ? a.transform[5] : 0;
          const yB = b.transform ? b.transform[5] : 0;
          const xA = a.transform ? a.transform[4] : 0;
          const xB = b.transform ? b.transform[4] : 0;

          // In PDF coordinates, larger Y is higher up
          if (Math.abs(yA - yB) > 3) {
            return yB - yA;
          }
          return xA - xB;
        });

        let pageLines = [];
        let currentLine = "";
        let lastY = null;

        for (const it of sorted) {
          const str = it.str || "";
          if (!str && !it.hasEOL) continue;

          const curY = it.transform ? it.transform[5] : 0;

          if (lastY !== null && (Math.abs(curY - lastY) > 3 || it.hasEOL)) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = str;
          } else {
            if (currentLine.length > 0 && !currentLine.endsWith(" ") && !str.startsWith(" ")) {
              currentLine += " ";
            }
            currentLine += str;
          }
          lastY = curY;
        }

        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }

        pages.push(pageLines.join("\n"));
      }
    } finally {
      pdf.destroy();
    }

    return pages.join("\n\n");
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const res = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return res.value || "";
  }

  if (lower.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files are not supported. Please save your file as .docx or .pdf.",
    );
  }

  // .txt and any plain text format
  return await file.text();
}

// ─── Phone Normalization & Extraction ──────────────────────────────────────────
function formatPhone(raw) {
  const trimmed = (raw || "").trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) return null;

  if (hasPlus) {
    if (digits.startsWith("92") && digits.length >= 12) {
      return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    if (digits.startsWith("1") && digits.length === 11) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return `+${digits}`;
  }

  if (digits.startsWith("03") && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return trimmed;
}

function extractPhone(text, lines) {
  // 1) Explicit label match
  for (const line of lines) {
    if (/\b(phone|tel|mobile|cell|contact|whatsapp)\b/i.test(line)) {
      const m = line.match(/(?:\+?\d[\d\s\-().]{6,}\d)/);
      if (m) {
        const formatted = formatPhone(m[0]);
        if (formatted) return formatted;
      }
    }
  }

  // 2) General phone pattern match across document
  const candidates = text.match(/(?:\+?\d{1,4}[\s\-\.]?)?(?:\(?\d{2,4}\)?[\s\-\.]?)?\d{3,4}[\s\-\.]?\d{3,5}/g) || [];
  for (const c of candidates) {
    // Avoid matching isolated years like 2020-2024 or zip codes
    if (/^(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}$/.test(c.trim())) continue;
    const formatted = formatPhone(c);
    if (formatted) return formatted;
  }
  return null;
}

// ─── Comprehensive CV Parser ──────────────────────────────────────────────────
export function parseCVText(text) {
  if (!text || typeof text !== "string") return {};

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result = {};

  // 1. Email Extraction
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i,
  );
  if (emailMatch) {
    result.email = emailMatch[0].trim();
  }

  // 2. Phone Extraction
  const phone = extractPhone(text, lines);
  if (phone) {
    result.phone = phone;
  }

  const roleKeywords =
    /\b(developer|engineer|designer|manager|architect|analyst|consultant|lead|director|specialist|coordinator|officer|administrator|scientist|recruiter|programmer|full\s*stack|frontend|backend|devops|ui\/ux|mobile|software|qa|data)\b/i;

  const headerNoise =
    /^(curriculum vitae|resume|cv|portfolio|profile|contact information|personal info|page \d|about me|summary)\b/i;

  // 3. Name Extraction
  const explicitName = text.match(
    /\b(?:name|full name)\b\s*[:\-]\s*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i,
  );
  if (explicitName && explicitName[1]) {
    result.name = explicitName[1].trim();
  } else {
    for (const line of lines.slice(0, 10)) {
      if (
        headerNoise.test(line) ||
        line.includes("@") ||
        /\b(http|www|\.com|\.net|\.io)\b/i.test(line) ||
        /\d{4}/.test(line)
      ) {
        continue;
      }

      // Check if line looks like a person's name (1-4 words, letters/periods)
      const isNamePattern =
        /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s\.\-]+[A-Za-zÀ-ÖØ-öø-ÿ]+){1,3}$/.test(line);

      if (isNamePattern && line.length >= 3 && line.length <= 40 && !roleKeywords.test(line)) {
        result.name = line.trim();
        break;
      }
    }
  }

  // 4. Job Title Extraction
  for (const line of lines.slice(0, 15)) {
    if (
      roleKeywords.test(line) &&
      line.length >= 4 &&
      line.length <= 60 &&
      !line.includes("@") &&
      !/^\d/.test(line) &&
      line !== result.name
    ) {
      result.title = line.replace(/^[|\-–—:\s]+|[|\-–—:\s]+$/g, "").trim();
      break;
    }
  }

  // 5. Location Extraction
  const locLabelMatch = text.match(
    /(?:location|address|city|residence|based in)\s*[:\-]\s*([^\n,]+(?:,\s*[^\n]+)?)/i,
  );
  if (locLabelMatch && locLabelMatch[1]) {
    const loc = locLabelMatch[1].replace(/\s+/g, " ").trim();
    if (loc.length > 2 && loc.length < 60) {
      result.location = loc;
    }
  }

  if (!result.location) {
    const locPatterns = [
      /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s*[A-Z]{2}(?:\s[A-Z][a-zA-Z]+)*)/,
      /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s*(?:Pakistan|USA|United States|UK|United Kingdom|Canada|Australia|Germany|UAE|Dubai|India|France))/i,
    ];
    for (const pat of locPatterns) {
      const m = text.match(pat);
      if (m) {
        result.location = m[1].trim();
        break;
      }
    }
  }

  // 6. Summary / Objective Extraction
  const summaryHeaders =
    /^(summary|profile|about me|about|professional summary|executive summary|career objective|objective|personal statement|bio)\b/i;
  const summaryIdx = lines.findIndex((l) => summaryHeaders.test(l));

  if (summaryIdx !== -1) {
    const summaryLines = [];
    const sectionStop =
      /^(experience|work experience|employment|education|skills|technical skills|projects|certifications|awards|languages|tools)\b/i;

    for (let i = summaryIdx + 1; i < Math.min(summaryIdx + 8, lines.length); i++) {
      if (sectionStop.test(lines[i])) break;
      summaryLines.push(lines[i]);
    }
    if (summaryLines.length) {
      result.summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();
    }
  }

  // 7. Skills Extraction
  const skillsHeaders =
    /^(skills?|technical skills?|core competencies|competencies|technologies|tech stack|tools?|expertise|key skills|skills & tools|languages & frameworks|programming languages)\b/i;
  const skillsIdx = lines.findIndex((l) => skillsHeaders.test(l));

  if (skillsIdx !== -1) {
    const skillsLines = [];
    const sectionStop =
      /^(experience|work experience|employment|education|projects|certifications|references|summary|languages|interests|awards)\b/i;

    for (let i = skillsIdx + 1; i < Math.min(skillsIdx + 16, lines.length); i++) {
      if (sectionStop.test(lines[i])) break;
      skillsLines.push(lines[i]);
    }

    const raw = skillsLines.join(", ");
    const cleaned = raw
      .replace(/\b(?:frontend|backend|database|frameworks|languages|tools|libraries|devops)\s*[:\-]/gi, "")
      .split(/[,|•·;·\-\/\n\t]+/)
      .map((s) => s.trim().replace(/^[-•*·\s]+|[-•*·\s]+$/g, ""))
      .filter(
        (s) =>
          s.length >= 2 &&
          s.length <= 35 &&
          !/^\d+$/.test(s) &&
          !/^(and|etc|with|using|in|for|of|all|the)$/i.test(s),
      );

    if (cleaned.length) {
      result.skills = Array.from(new Set(cleaned));
    }
  }

  // 8. Experience Extraction
  const expHeaders =
    /^(experience|work experience|employment|professional experience|work history|career history|employment history)\b/i;
  const expIdx = lines.findIndex((l) => expHeaders.test(l));

  if (expIdx !== -1) {
    const experience = [];
    let current = null;
    const sectionStop =
      /^(education|skills|technical skills|certifications|projects|references|languages|volunteer|interests|awards|summary)\b/i;

    const datePattern =
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*(?:[-–—to]+)\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19|20)\d{2}|present|current|now)/i;

    for (let i = expIdx + 1; i < Math.min(expIdx + 45, lines.length); i++) {
      const line = lines[i];
      if (sectionStop.test(line)) break;

      const dateMatch = line.match(datePattern);

      if (dateMatch) {
        if (current && (current.role || current.company)) {
          experience.push(current);
        }

        const dateStr = dateMatch[0].trim();
        const beforeDate = line.slice(0, dateMatch.index).replace(/[|\-–—:\s]+$/, "").trim();
        const afterDate = line.slice(dateMatch.index + dateStr.length).replace(/^[|\-–—:\s]+/, "").trim();

        let role = "";
        let company = "";

        if (beforeDate && beforeDate.length < 70) {
          const parts = beforeDate.split(/[-–—|•·,]+/).map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            role = roleKeywords.test(parts[0]) ? parts[0] : parts[1];
            company = role === parts[0] ? parts[1] : parts[0];
          } else {
            role = parts[0] || "";
            company = afterDate || (lines[i - 1] && !datePattern.test(lines[i - 1]) && lines[i - 1] !== role ? lines[i - 1] : "");
          }
        } else {
          const prev1 = lines[i - 1] || "";
          const prev2 = lines[i - 2] || "";
          const isPrev1Header = expHeaders.test(prev1) || sectionStop.test(prev1);
          const isPrev2Header = expHeaders.test(prev2) || sectionStop.test(prev2);

          if (!isPrev1Header && !isPrev2Header && prev2.length < 60 && prev1.length < 60) {
            if (roleKeywords.test(prev2)) {
              role = prev2;
              company = prev1;
            } else if (roleKeywords.test(prev1)) {
              role = prev1;
              company = prev2;
            } else {
              role = prev2;
              company = prev1;
            }
          } else if (!isPrev1Header && prev1.length < 60) {
            role = prev1;
            company = afterDate || "";
          }
        }

        current = {
          id: Date.now() + i,
          role: role || "Software Engineer",
          company: company || "Organization",
          period: dateStr,
          description: "",
        };
      } else if (current) {
        const t = line.trim();
        if (expHeaders.test(t) || sectionStop.test(t)) {
          break;
        }
        if (
          !current.company &&
          t.length < 50 &&
          !/^[-•*·]/.test(t) &&
          !t.endsWith(":") &&
          !roleKeywords.test(t)
        ) {
          current.company = t;
        } else if (t.length > 5 && !datePattern.test(t)) {
          const cleanBullet = t.replace(/^[-•*·\s]+/, "");
          current.description = current.description
            ? `${current.description} ${cleanBullet}`
            : cleanBullet;
        }
      }
    }

    if (current && (current.role || current.company)) {
      experience.push(current);
    }

    if (experience.length) {
      result.experience = experience.slice(0, 6);
    }
  }

  // 9. Education Extraction
  const eduHeaders =
    /^(education|academic background|qualifications|academic history|academics|educational background)\b/i;
  const eduIdx = lines.findIndex((l) => eduHeaders.test(l));

  if (eduIdx !== -1) {
    const education = [];
    const sectionStop =
      /^(experience|skills|technical skills|certifications|projects|references|languages|awards)\b/i;

    const degreePattern =
      /\b(b\.?s\.?c?|b\.?a|m\.?s\.?c?|m\.?a|mba|ph\.?d|bachelor(?:'s)?|master(?:'s)?|associate(?:'s)?|diploma|b\.?tech|b\.?e\.?|intermediate|fsc|matric|high school|bba|bs(?:cs|se|it|ee)?)\b/i;

    for (let i = eduIdx + 1; i < Math.min(eduIdx + 20, lines.length); i++) {
      const line = lines[i];
      if (sectionStop.test(line)) break;

      if (degreePattern.test(line)) {
        const yearMatches = lines.slice(i, i + 4).join(" ").match(/\b(19|20)\d{2}\b/g);
        const gradYear = yearMatches ? yearMatches[yearMatches.length - 1] : "";
        const schoolLine = lines[i + 1] && !degreePattern.test(lines[i + 1]) && !/\b(19|20)\d{2}\b/.test(lines[i + 1])
          ? lines[i + 1]
          : lines[i - 1] && !degreePattern.test(lines[i - 1]) && !eduHeaders.test(lines[i - 1])
            ? lines[i - 1]
            : "University / Institution";

        education.push({
          id: Date.now() + i,
          degree: line.replace(/[|\-–—:]+$/, "").trim(),
          school: schoolLine.replace(/[|\-–—:]+$/, "").trim(),
          year: gradYear,
        });
      }
    }

    if (education.length) {
      result.education = education.slice(0, 4);
    }
  }

  return result;
}
