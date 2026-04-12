export interface PublicService {
  name: string;
  description: string;
  url: string;
  linkLabel?: string;
}

export const publicServices: PublicService[] = [
  {
    name: "MineCurry",
    description: "A Minecraft server for Curry College",
    url: "https://minecurry.org",
    linkLabel: "Visit",
  },
];
