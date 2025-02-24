import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Mahesh's blog",
  DESCRIPTION:
    "A blog about coding, building projects, and figuring things out",
  EMAIL: "maheshodedara13@yahoo.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION:
    "A personal blog about coding, building projects, and figuring things out",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION:
    "A collection of articles on programming, projects and other stuff",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "X (formerly Twitter)",
    HREF: "https://twitter.com/mozartingx",
  },
  {
    NAME: "GitHub",
    HREF: "https://github.com/heshify",
  },
  {
    NAME: "Website",
    HREF: "https://heshify.github.io",
  },
];
