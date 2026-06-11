const routes = new Map([...document.querySelectorAll(".screen")].map((screen) => [screen.id, screen]));
const resumeForm = document.querySelector("#resumeForm");
const historyList = document.querySelector("#historyList");
const historyTemplate = document.querySelector("#historyTemplate");
const photoInput = document.querySelector("#photoInput");
const photoPreview = document.querySelector("#photoPreview");
const photoUpload = document.querySelector(".photo-upload");
const uploadedFile = document.querySelector("#uploadedFile");
const resumeUpload = document.querySelector("#resumeUpload");
const templateGrid = document.querySelector("#templateGrid");
const printButton = document.querySelector("#printCv");

let photoDataUrl = "";
let latestResumeData = null;
let selectedTemplate = "modern";

const templates = [
  {
    id: "modern",
    name: "Modern Sidebar",
    description: "Strong profile column with clean career detail.",
  },
  {
    id: "classic",
    name: "Classic Formal",
    description: "Traditional structure for academic and official CVs.",
  },
  {
    id: "creative",
    name: "Creative Edge",
    description: "Warm accent header for portfolio-driven resumes.",
  },
  {
    id: "executive",
    name: "Executive Focus",
    description: "Balanced leadership layout with crisp sections.",
  },
];

function showRoute(routeName) {
  const nextRoute = routes.has(routeName) ? routeName : "home";

  routes.forEach((screen, id) => {
    screen.classList.toggle("active", id === nextRoute);
  });

  window.location.hash = nextRoute;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getField(formData, key) {
  return formData.get(key)?.toString().trim() || "";
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "C") + (parts[1]?.[0] || "M");
}

function addHistoryItem(values = {}) {
  const node = historyTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector("strong").textContent = values.title ? "History Item" : `History Item ${historyList.children.length + 1}`;

  Object.entries({
    historyTitle: values.title || "",
    historyCompany: values.company || "",
    historyDuration: values.duration || "",
    historyLocation: values.location || "",
    historyDescription: values.description || "",
  }).forEach(([name, value]) => {
    const input = node.querySelector(`[name="${name}"]`);
    input.value = value;
  });

  node.querySelector(".remove-history").addEventListener("click", () => {
    if (historyList.children.length > 1) {
      node.remove();
    } else {
      node.querySelectorAll("input, textarea").forEach((input) => {
        input.value = "";
      });
    }
  });

  historyList.appendChild(node);
}

function collectResumeData() {
  const formData = new FormData(resumeForm);
  const education = [
    ["SSC", "sscInstitution", "sscYear", "sscResult"],
    ["HSC", "hscInstitution", "hscYear", "hscResult"],
    ["Bachelor", "bachelorInstitution", "bachelorYear", "bachelorResult"],
    ["Masters", "mastersInstitution", "mastersYear", "mastersResult"],
  ]
    .map(([level, institution, year, result]) => ({
      level,
      institution: getField(formData, institution),
      year: getField(formData, year),
      result: getField(formData, result),
    }))
    .filter((item) => item.institution || item.year || item.result);

  const history = [...historyList.querySelectorAll(".history-item")]
    .map((item) => ({
      title: item.querySelector('[name="historyTitle"]').value.trim(),
      company: item.querySelector('[name="historyCompany"]').value.trim(),
      duration: item.querySelector('[name="historyDuration"]').value.trim(),
      location: item.querySelector('[name="historyLocation"]').value.trim(),
      description: item.querySelector('[name="historyDescription"]').value.trim(),
    }))
    .filter((item) => item.title || item.company || item.duration || item.location || item.description);

  return {
    fullName: getField(formData, "fullName") || "Your Name",
    birthYear: getField(formData, "birthYear"),
    email: getField(formData, "email"),
    phone: getField(formData, "phone"),
    location: getField(formData, "location"),
    portfolio: getField(formData, "portfolio"),
    summary:
      getField(formData, "summary") ||
      "Motivated professional with a strong learning mindset, practical problem-solving ability, and a commitment to delivering polished work.",
    education,
    history,
    skills: splitList(getField(formData, "skills")),
    languages: splitList(getField(formData, "languages")),
    hobbies: splitList(getField(formData, "hobbies")),
    certifications: splitList(getField(formData, "certifications")),
    referenceName: getField(formData, "referenceName"),
    referenceContact: getField(formData, "referenceContact"),
    photo: photoDataUrl,
  };
}

function contactLine(data) {
  return [data.email, data.phone, data.location, data.portfolio].filter(Boolean).map(escapeHtml).join(" • ");
}

function photoMarkup(data) {
  if (data.photo) {
    return `<img class="cv-photo" src="${data.photo}" alt="${escapeHtml(data.fullName)}" />`;
  }

  return `<div class="cv-photo initials" aria-label="${escapeHtml(data.fullName)}">${escapeHtml(initials(data.fullName))}</div>`;
}

function listMarkup(items) {
  if (!items.length) return `<p class="cv-muted">Add details in the builder.</p>`;
  return `<div class="chip-list">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function educationMarkup(data) {
  if (!data.education.length) return `<p class="cv-muted">Education details will appear here.</p>`;

  return data.education
    .map(
      (item) => `
        <div class="cv-entry">
          <strong>${escapeHtml(item.level)}${item.institution ? ` - ${escapeHtml(item.institution)}` : ""}</strong>
          <p class="cv-muted">${[item.year, item.result].filter(Boolean).map(escapeHtml).join(" • ")}</p>
        </div>
      `
    )
    .join("");
}

function historyMarkup(data) {
  if (!data.history.length) return `<p class="cv-muted">Add projects, jobs, internships, or freelance work.</p>`;

  return data.history
    .map(
      (item) => `
        <div class="cv-entry">
          <strong>${escapeHtml(item.title || "Project / Role")}</strong>
          <p class="cv-muted">${[item.company, item.duration, item.location].filter(Boolean).map(escapeHtml).join(" • ")}</p>
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        </div>
      `
    )
    .join("");
}

function referenceMarkup(data) {
  if (!data.referenceName && !data.referenceContact) return "";

  return `
    <p>${escapeHtml(data.referenceName || "Available on request")}</p>
    ${data.referenceContact ? `<p class="cv-muted">${escapeHtml(data.referenceContact)}</p>` : ""}
  `;
}

function section(title, content) {
  if (!content) return "";
  return `<div><p class="cv-section-title">${title}</p>${content}</div>`;
}

function buildModern(data) {
  return `
    <article class="cv cv-modern">
      <aside class="cv-side">
        ${photoMarkup(data)}
        <p class="cv-section-title">Contact</p>
        <p>${contactLine(data) || "Add contact details"}</p>
        ${data.birthYear ? section("Birth Year", `<p>${escapeHtml(data.birthYear)}</p>`) : ""}
        ${section("Skills", listMarkup(data.skills))}
        ${section("Languages", listMarkup(data.languages))}
        ${section("Hobbies", listMarkup(data.hobbies))}
      </aside>
      <div class="cv-main">
        <p class="cv-name">${escapeHtml(data.fullName)}</p>
        <p>${escapeHtml(data.summary)}</p>
        ${section("Project / Job History", historyMarkup(data))}
        ${section("Education", educationMarkup(data))}
        ${section("Certifications", listMarkup(data.certifications))}
        ${section("Reference", referenceMarkup(data))}
      </div>
    </article>
  `;
}

function buildClassic(data) {
  return `
    <article class="cv cv-classic">
      <div class="cv-head">
        <h4>${escapeHtml(data.fullName)}</h4>
        <p class="cv-contact">${contactLine(data)}</p>
        ${data.birthYear ? `<p class="cv-small">Birth Year: ${escapeHtml(data.birthYear)}</p>` : ""}
      </div>
      ${section("Career Objective", `<p>${escapeHtml(data.summary)}</p>`)}
      ${section("Education", educationMarkup(data))}
      ${section("Project or Job History", historyMarkup(data))}
      ${section("Skills", listMarkup(data.skills))}
      ${section("Languages", listMarkup(data.languages))}
      ${section("Hobbies", listMarkup(data.hobbies))}
      ${section("Certifications", listMarkup(data.certifications))}
      ${section("Reference", referenceMarkup(data))}
    </article>
  `;
}

function buildCreative(data) {
  return `
    <article class="cv cv-creative">
      <div class="cv-head">
        <div>
          <p class="cv-name">${escapeHtml(data.fullName)}</p>
          <p>${contactLine(data) || "Contact details"}</p>
        </div>
        ${photoMarkup(data)}
      </div>
      ${section("Profile", `<p>${escapeHtml(data.summary)}</p>`)}
      ${section("Signature Work", historyMarkup(data))}
      ${section("Education", educationMarkup(data))}
      ${section("Skills", listMarkup(data.skills))}
      ${section("Languages", listMarkup(data.languages))}
      ${section("Hobbies", listMarkup(data.hobbies))}
      ${section("Certifications", listMarkup(data.certifications))}
      ${section("Reference", referenceMarkup(data))}
    </article>
  `;
}

function buildExecutive(data) {
  return `
    <article class="cv cv-executive">
      <div class="cv-head">
        <p class="cv-name">${escapeHtml(data.fullName)}</p>
        <p>${escapeHtml(data.summary)}</p>
        <p class="cv-contact">${contactLine(data)}</p>
      </div>
      <div class="cv-body">
        <div>
          ${section("Experience & Projects", historyMarkup(data))}
          ${section("Education", educationMarkup(data))}
        </div>
        <aside>
          ${photoMarkup(data)}
          ${data.birthYear ? section("Birth Year", `<p>${escapeHtml(data.birthYear)}</p>`) : ""}
          ${section("Core Skills", listMarkup(data.skills))}
          ${section("Languages", listMarkup(data.languages))}
          ${section("Hobbies", listMarkup(data.hobbies))}
          ${section("Certifications", listMarkup(data.certifications))}
          ${section("Reference", referenceMarkup(data))}
        </aside>
      </div>
    </article>
  `;
}

function buildCv(data, templateId) {
  const builders = {
    modern: buildModern,
    classic: buildClassic,
    creative: buildCreative,
    executive: buildExecutive,
  };

  return builders[templateId](data);
}

function renderTemplates(data) {
  templateGrid.innerHTML = templates
    .map(
      (template) => `
        <article class="template-card ${template.id === selectedTemplate ? "selected-template" : ""}" data-template="${template.id}">
          <header>
            <div>
              <h3>${template.name}</h3>
              <p class="cv-muted">${template.description}</p>
            </div>
            <button class="primary-button" type="button" data-download="${template.id}">Download</button>
          </header>
          <div class="cv-preview">${buildCv(data, template.id)}</div>
        </article>
      `
    )
    .join("");

  templateGrid.querySelectorAll(".template-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedTemplate = card.dataset.template;
      templateGrid.querySelectorAll(".template-card").forEach((item) => {
        item.classList.toggle("selected-template", item === card);
      });
    });
  });

  templateGrid.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedTemplate = button.dataset.download;
      downloadCv(selectedTemplate);
    });
  });
}

function downloadCv(templateId) {
  if (!latestResumeData) return;

  const cvMarkup = buildCv(latestResumeData, templateId);
  const fileName = `${latestResumeData.fullName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "CvMafia-CV"}-${templateId}.html`;
  const documentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(latestResumeData.fullName)} CV</title>
  <link rel="stylesheet" href="styles.css" />
  <style>
    body { background: #ffffff; margin: 0; padding: 24px; }
    .cv { width: min(794px, 100%); min-height: 1123px; margin: 0 auto; border: 1px solid #d9e0e4; }
    .initials { display: grid; place-items: center; background: #eef3f1; color: #157a76; font-weight: 900; }
    @media print { body { padding: 0; } .cv { width: 100%; min-height: auto; border: 0; } }
  </style>
</head>
<body>
  ${cvMarkup}
</body>
</html>`;

  const blob = new Blob([documentHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    showRoute(routeButton.dataset.route);
  }
});

document.querySelector("#addHistory").addEventListener("click", () => addHistoryItem());

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    photoDataUrl = reader.result;
    photoPreview.src = photoDataUrl;
    photoUpload.classList.add("has-image");
  });
  reader.readAsDataURL(file);
});

resumeUpload.addEventListener("change", () => {
  const file = resumeUpload.files?.[0];
  uploadedFile.textContent = file ? `${file.name} selected.` : "No file selected yet.";
});

resumeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!resumeForm.reportValidity()) return;

  latestResumeData = collectResumeData();
  selectedTemplate = "modern";
  renderTemplates(latestResumeData);
  showRoute("templates");
});

printButton.addEventListener("click", () => {
  if (!latestResumeData) return;

  document.body.classList.add("printing");
  window.print();
  setTimeout(() => document.body.classList.remove("printing"), 500);
});

window.addEventListener("hashchange", () => {
  showRoute(window.location.hash.replace("#", "") || "home");
});

addHistoryItem();
showRoute(window.location.hash.replace("#", "") || "home");
