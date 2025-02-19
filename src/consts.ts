import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Mahesh Odedara",
  DESCRIPTION: "Software Developer for fun",
  EMAIL: "maheshodedara13@yahoo.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Mahesh Odedara home page",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
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
