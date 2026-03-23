export interface PublicService {
  name: string;
  description: string;
  url: string;
  linkLabel?: string;
}

export const publicServices: PublicService[] = [
  {
    name: "VaultWarden",
    description: "Self-hosted Bitwarden server",
    url: "https://pass.p0ntus.com",
    linkLabel: "Visit",
  },
  {
    name: "Forgejo",
    description: "Self-hosted Git server, similar to GitHub",
    url: "https://git.p0ntus.com",
    linkLabel: "Visit",
  },
  {
    name: "MineCurry",
    description: "A Minecraft server for Curry College",
    url: "https://minecurry.org",
    linkLabel: "Visit",
  },
];
