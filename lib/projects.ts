export interface Project {
  name: string;
  description: string;
  url: string;
  linkLabel?: string;
}

export const projects: Project[] = [
  {
    name: "librecloud-web",
    description: "My self-hosted, public cloud services platform",
    url: "https://github.com/ihatenodejs/librecloud-web",
  },
  {
    name: "agent-exporter",
    description: "Export usage statistics from various agents",
    url: "https://github.com/ihatenodejs/agent-exporter",
  },
  {
    name: "modules",
    description: "A web-based repository of Magisk/KernelSU modules",
    url: "https://github.com/abocn/modules",
  },
];
