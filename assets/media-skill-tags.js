(() => {
  "use strict";

  const pageProfiles = {
    kktv: ["Creative Direction", "Integrated Brand Systems", "Campaign Development"],
    kkfarm: ["Creative Direction", "Art & Visual Direction", "Campaign Development"],
    "kkbox-group": ["Creative Direction", "Corporate Storytelling", "Campaign Development"],
    kkcompany: ["Creative Direction", "Brand Strategy", "Corporate Storytelling", "Integrated Brand Systems"],
    kkculture: ["Creative Direction", "Art & Visual Direction", "Integrated Brand Systems"],
    "nvidia-sccd": ["Creative Direction", "Generative AI Creative Workflows", "Motion & Video Direction"],
    ace: ["Creative Direction", "Generative AI Creative Workflows", "Internal Training & Mentoring"],
    "3d": ["Creative Direction", "Art & Visual Direction", "3D Creative Art Direction"]
  };

  const contextualRules = [
    { pattern: /website|landing|homepage|interface|\bui\b|ui\/ux|mobile|tablet|app |app$|screen|web design/i, skills: ["UI/UX & Web Direction"] },
    { pattern: /video|motion|animation|showreel|trailer|tvc|film|episode|music video|\bmv\b|lyric/i, skills: ["Motion & Video Direction"] },
    { pattern: /campaign|launch|promotion|advertising|social|recruitment|recruiting/i, skills: ["Campaign Development"] },
    { pattern: /corporate|career|worldview|shareholder|company narrative|employer/i, skills: ["Corporate Storytelling"] },
    { pattern: /identity|brand book|brand system|guideline|logo|logotype|visual system/i, skills: ["Integrated Brand Systems", "Brand Strategy"] },
    { pattern: /event|concert|live design|office|retail|prepaid|merch|business card|exhibition|press conference/i, skills: ["Event & Retail Design"] },
    { pattern: /photography book|campaign photography|portrait photography/i, skills: ["Photography Direction"] },
    { pattern: /3d|probe|turbo snail|game|environment|character/i, skills: ["3D Creative Art Direction"] },
    { pattern: /generative ai|gen-ai|project nv|street signs|runway|ai music/i, skills: ["Generative AI Creative Workflows"] },
    { pattern: /uwc|isak|japan|international|apac/i, skills: ["APAC & International Collaboration", "Global-to-Local Adaptation"] },
    { pattern: /training|workshop|course|education|teacher|student|leadership/i, skills: ["Internal Training & Mentoring"] }
  ];

  const pageKey = document.querySelector(".content-panel")?.dataset.panel
    || (location.pathname.split("/").pop() || "").replace(/\.html$/i, "")
    || "index";

  const uniqueSkills = (skills) => [...new Set(skills)].slice(0, 6);

  function buildGroup(skills) {
    const group = document.createElement("div");
    group.className = "media-skill-keywords";
    group.setAttribute("role", "list");
    group.setAttribute("aria-label", "Professional skills used in this work");

    uniqueSkills(skills).forEach((skill) => {
      const chip = document.createElement("span");
      chip.className = "media-skill-keyword";
      chip.setAttribute("role", "listitem");
      chip.textContent = skill;
      group.append(chip);
    });
    return group;
  }

  function skillsFor(element, media) {
    const section = element.closest("section");
    const context = [
      element.dataset?.title,
      element.dataset?.id,
      element.getAttribute("aria-label"),
      element.querySelector("h3, figcaption")?.textContent,
      section?.querySelector("h2")?.textContent
    ].filter(Boolean).join(" ");

    const skills = [...(pageProfiles[pageKey] || ["Creative Direction", "Art & Visual Direction"])]
    if (media?.matches("video, iframe")) skills.push("Motion & Video Direction");
    if (media?.matches("img")) skills.push("Art & Visual Direction");
    contextualRules.forEach((rule) => {
      if (rule.pattern.test(context)) skills.push(...rule.skills);
    });
    return uniqueSkills(skills);
  }

  function ensureVisibleCaption({ card, media, body: existingBody, captionIsVisible }) {
    let body = existingBody;
    if (!body) {
      body = document.createElement("div");
      body.className = "card-body";
      card.append(body);
    }

    let caption = body.querySelector("h3, figcaption, p");
    if (!caption) {
      caption = document.createElement("h3");
      caption.className = "generated-media-caption";
      caption.textContent = card.dataset.title
        || media.getAttribute("alt")
        || media.getAttribute("title")
        || (media.matches("video, iframe") ? "Project Video" : "Project Image");
      body.prepend(caption);
    }

    if (!captionIsVisible) {
      body.classList.add("has-generated-media-caption");
      caption.classList.add("generated-media-caption");
    }
    body.classList.add("has-visible-media-caption");
    return body;
  }

  function groupedCaptionFor(gallery, items) {
    const sectionTitle = gallery.closest("section")?.querySelector(":scope > h2")?.textContent?.trim();
    return sectionTitle
      || items[0]?.card.dataset.title
      || items[0]?.media.getAttribute("alt")
      || "Selected Work";
  }

  const refreshGridLayoutClasses = () => {
    document.querySelectorAll(".grid").forEach((grid) => {
      grid.classList.toggle("is-layout-grid", getComputedStyle(grid).display === "grid");
    });
  };
  refreshGridLayoutClasses();
  addEventListener("resize", refreshGridLayoutClasses, { passive: true });

  const cardInfo = [...document.querySelectorAll(".card")].map((card) => {
    const media = card.querySelector(".media-frame video, .media-frame img, .media-frame iframe");
    const body = card.querySelector(":scope > .card-body");
    const caption = body?.querySelector("h3, figcaption, p");
    const captionIsVisible = Boolean(
      body
      && caption
      && getComputedStyle(body).display !== "none"
      && getComputedStyle(body).visibility !== "hidden"
      && getComputedStyle(caption).display !== "none"
      && getComputedStyle(caption).visibility !== "hidden"
    );
    return {
      card,
      media,
      body,
      captionIsVisible,
      gallery: card.closest(".grid")
    };
  }).filter(({ media }) => media);

  const galleryCards = new Map();
  cardInfo.forEach((info) => {
    if (!info.gallery) return;
    const items = galleryCards.get(info.gallery) || [];
    items.push(info);
    galleryCards.set(info.gallery, items);
  });

  const groupedRuns = [];
  const groupedCards = new WeakMap();
  galleryCards.forEach((items, gallery) => {
    let run = [];
    const finishRun = () => {
      if (run.length > 1) {
        const groupData = { gallery, items: run, skills: [] };
        groupedRuns.push(groupData);
        run.forEach(({ card }) => groupedCards.set(card, groupData));
      }
      run = [];
    };

    items.forEach((info) => {
      if (info.captionIsVisible) {
        finishRun();
      } else {
        run.push(info);
      }
    });
    finishRun();
  });

  cardInfo.forEach((info) => {
    const { card, media } = info;
    const groupedRun = groupedCards.get(card);
    if (groupedRun) {
      groupedRun.skills.push(...skillsFor(card, media));
      return;
    }
    const body = ensureVisibleCaption(info);
    if (card.querySelector(":scope > .card-body .media-skill-keywords")) return;
    body.classList.add("has-media-skill-keywords");
    body.append(buildGroup(skillsFor(card, media)));
    card.classList.add("has-individual-media-footer");
  });

  groupedRuns.forEach(({ gallery, items, skills }) => {
    const footer = document.createElement("div");
    footer.className = "grouped-media-footer";

    const captionBody = document.createElement("div");
    captionBody.className = "card-body grouped-media-caption has-visible-media-caption";
    const caption = document.createElement("h3");
    caption.textContent = groupedCaptionFor(gallery, items);
    captionBody.append(caption);
    footer.append(captionBody);

    const group = buildGroup(skills);
    group.classList.add("media-skill-keywords--gallery");
    footer.append(group);

    let placement = items.at(-1).card;
    while (placement.parentElement && placement.parentElement !== gallery) {
      placement = placement.parentElement;
    }
    if (placement.nextElementSibling?.classList.contains("grouped-media-footer")) return;
    placement.insertAdjacentElement("afterend", footer);
  });

})();
